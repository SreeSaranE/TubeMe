using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class YtDlpService : IYtDlpService
    {
        private static readonly Regex ProgressRegex = new(
            @"\[download\]\s+(?<percent>[\d\.]+)%\s+of\s+~?(?<size>[\w\.\s]+)\s+at\s+(?<speed>[\w\.\/]+)\s+ETA\s+(?<eta>[\d:]+)",
            RegexOptions.Compiled);

        private static readonly Regex SimpleProgressRegex = new(
            @"\[download\]\s+(?<percent>[\d\.]+)%",
            RegexOptions.Compiled);

        private readonly HttpClient _httpClient;

        public YtDlpService()
        {
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        }

        private static string GetCookiesFilePath(string? configuredPath = null, string? dataDir = null)
        {
            string path = string.Empty;

            if (!string.IsNullOrEmpty(configuredPath) && File.Exists(configuredPath))
            {
                path = configuredPath;
            }
            else if (!string.IsNullOrEmpty(dataDir) && File.Exists(Path.Combine(dataDir, "cookies.txt")))
            {
                path = Path.Combine(dataDir, "cookies.txt");
            }
            else
            {
                string envDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? "/app/data";
                string envPath = Path.Combine(envDir, "cookies.txt");
                if (File.Exists(envPath)) path = envPath;
                else
                {
                    string localDbPath = Path.Combine(Directory.GetCurrentDirectory(), "database", "cookies.txt");
                    if (File.Exists(localDbPath)) path = localDbPath;
                    else
                    {
                        string localPath = Path.Combine(Directory.GetCurrentDirectory(), "data", "cookies.txt");
                        if (File.Exists(localPath)) path = localPath;
                    }
                }
            }

            if (!string.IsNullOrEmpty(path))
            {
                EnsureValidNetscapeCookies(path);
            }

            return path;
        }

        private static void EnsureValidNetscapeCookies(string filePath)
        {
            try
            {
                if (!File.Exists(filePath)) return;

                var lines = File.ReadAllLines(filePath);
                if (lines.Length == 0) return;

                bool needsFix = false;
                if (!lines[0].StartsWith("# Netscape HTTP Cookie File") && !lines[0].StartsWith("# HTTP Cookie File"))
                {
                    needsFix = true;
                }

                // Check if timestamps are 17-digit Chromium timestamps or if format needs cleaning
                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;
                    var parts = line.Split('\t');
                    if (parts.Length >= 5 && long.TryParse(parts[4], out long exp) && exp > 1000000000000L)
                    {
                        needsFix = true;
                        break;
                    }
                }

                if (!needsFix) return;

                var cleanLines = new List<string> { "# Netscape HTTP Cookie File" };
                foreach (var line in lines)
                {
                    string trimmed = line.Trim();
                    if (string.IsNullOrEmpty(trimmed)) continue;
                    if (trimmed.StartsWith("#"))
                    {
                        if (!trimmed.StartsWith("# Netscape HTTP Cookie File") && !trimmed.StartsWith("# HTTP Cookie File"))
                        {
                            cleanLines.Add(trimmed);
                        }
                        continue;
                    }

                    var parts = line.Split('\t');
                    if (parts.Length >= 7)
                    {
                        if (long.TryParse(parts[4], out long exp))
                        {
                            if (exp > 1000000000000L)
                            {
                                // Chromium microseconds to Unix epoch seconds
                                exp = (long)((exp / 1000000.0) - 11644473600L);
                            }
                            else if (exp > 253402300799L)
                            {
                                exp = 2147483647L;
                            }
                            parts[4] = exp.ToString();
                        }
                        cleanLines.Add(string.Join("\t", parts));
                    }
                }

                File.WriteAllLines(filePath, cleanLines);
            }
            catch { }
        }

        public async Task<List<SearchResultItem>> SearchAsync(string query, int maxResults = 12)
        {
            var results = new List<SearchResultItem>();
            string searchUrl = query.StartsWith("http://") || query.StartsWith("https://") 
                ? query 
                : $"ytsearch{maxResults}:{query}";

            string cookies = GetCookiesFilePath();
            string cookiesArg = !string.IsNullOrEmpty(cookies) ? $"--cookies \"{cookies}\" " : "";

            var psi = new ProcessStartInfo
            {
                FileName = "yt-dlp",
                Arguments = $"{cookiesArg}--quiet --no-warnings --dump-single-json --flat-playlist --extractor-args \"youtubetab:approximate_date\" \"{searchUrl}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null) return results;

            string jsonStr = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (string.IsNullOrWhiteSpace(jsonStr)) return results;

            try
            {
                using var doc = JsonDocument.Parse(jsonStr);
                var root = doc.RootElement;

                if (root.TryGetProperty("entries", out var entries) && entries.ValueKind == JsonValueKind.Array)
                {
                    foreach (var entry in entries.EnumerateArray())
                    {
                        var item = ParseJsonEntry(entry);
                        if (item != null) results.Add(item);
                    }
                }
                else
                {
                    var item = ParseJsonEntry(root);
                    if (item != null) results.Add(item);
                }
            }
            catch { }

            return results;
        }

        private static SearchResultItem? ParseJsonEntry(JsonElement entry)
        {
            try
            {
                string id = entry.TryGetProperty("id", out var pId) ? pId.GetString() ?? "" : "";
                string title = entry.TryGetProperty("title", out var pTitle) ? pTitle.GetString() ?? "" : "";
                string uploader = entry.TryGetProperty("uploader", out var pUp) ? pUp.GetString() ?? "" :
                                 (entry.TryGetProperty("channel", out var pCh) ? pCh.GetString() ?? "" : "");
                
                string url = entry.TryGetProperty("url", out var pUrl) ? pUrl.GetString() ?? "" :
                            (!string.IsNullOrEmpty(id) ? $"https://www.youtube.com/watch?v={id}" : "");

                if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(url)) return null;

                string thumbnail = "";
                if (entry.TryGetProperty("thumbnails", out var thumbs) && thumbs.ValueKind == JsonValueKind.Array)
                {
                    foreach (var thumb in thumbs.EnumerateArray())
                    {
                        if (thumb.TryGetProperty("url", out var tUrl))
                        {
                            thumbnail = tUrl.GetString() ?? "";
                        }
                    }
                }
                if (string.IsNullOrEmpty(thumbnail) && !string.IsNullOrEmpty(id))
                {
                    thumbnail = $"https://i.ytimg.com/vi/{id}/hqdefault.jpg";
                }

                double durationSec = entry.TryGetProperty("duration", out var pDur) && pDur.ValueKind == JsonValueKind.Number 
                    ? pDur.GetDouble() 
                    : 0;

                TimeSpan ts = TimeSpan.FromSeconds(durationSec);
                string durationStr = ts.Hours > 0 
                    ? ts.ToString(@"h\:mm\:ss") 
                    : ts.ToString(@"m\:ss");

                bool isPlaylist = entry.TryGetProperty("_type", out var pType) && pType.GetString() == "playlist";
                bool isChannel = url.Contains("/channel/") || url.Contains("/@") || url.Contains("/c/") || url.Contains("/user/") ||
                                 (entry.TryGetProperty("_type", out var pTypeCheck) && pTypeCheck.GetString() == "channel") ||
                                 (entry.TryGetProperty("ie_key", out var pIe) && pIe.GetString()?.ToLowerInvariant().Contains("channel") == true);

                string uploadDate = "";
                // Requirement: if it is a channel, do not add date
                if (!isChannel && !isPlaylist)
                {
                    if (entry.TryGetProperty("upload_date", out var pDate) && pDate.ValueKind == JsonValueKind.String)
                    {
                        string rawDate = pDate.GetString() ?? "";
                        if (rawDate.Length == 8 && DateTime.TryParseExact(rawDate, "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var dt))
                        {
                            uploadDate = dt.ToString("yyyy-MM-dd");
                        }
                        else if (!string.IsNullOrWhiteSpace(rawDate))
                        {
                            uploadDate = rawDate;
                        }
                    }

                    if (string.IsNullOrEmpty(uploadDate))
                    {
                        if (entry.TryGetProperty("timestamp", out var pTs) && pTs.ValueKind == JsonValueKind.Number && pTs.GetInt64() > 0)
                        {
                            uploadDate = DateTimeOffset.FromUnixTimeSeconds(pTs.GetInt64()).DateTime.ToString("yyyy-MM-dd");
                        }
                        else if (entry.TryGetProperty("release_timestamp", out var pRts) && pRts.ValueKind == JsonValueKind.Number && pRts.GetInt64() > 0)
                        {
                            uploadDate = DateTimeOffset.FromUnixTimeSeconds(pRts.GetInt64()).DateTime.ToString("yyyy-MM-dd");
                        }
                    }
                }

                return new SearchResultItem
                {
                    Id = id,
                    Url = url,
                    Title = title,
                    ChannelName = uploader,
                    Thumbnail = thumbnail,
                    Duration = durationStr,
                    UploadDate = uploadDate,
                    IsPlaylist = isPlaylist
                };
            }
            catch
            {
                return null;
            }
        }

        public async Task<YtDlpChannelMetadata?> GetChannelMetadataAsync(string channelUrl, string avatarsDir)
        {
            string cleanUrl = channelUrl.TrimEnd('/');
            string cookies = GetCookiesFilePath();
            string cookiesArg = !string.IsNullOrEmpty(cookies) ? $"--cookies \"{cookies}\" " : "";

            var psi = new ProcessStartInfo
            {
                FileName = "yt-dlp",
                Arguments = $"{cookiesArg}--quiet --no-warnings --skip-download --flat-playlist --playlist-items 0 --socket-timeout 15 --dump-single-json \"{cleanUrl}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null) return null;

            string jsonStr = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (string.IsNullOrWhiteSpace(jsonStr)) return null;

            try
            {
                using var doc = JsonDocument.Parse(jsonStr);
                var root = doc.RootElement;

                string name = root.TryGetProperty("channel", out var pCh) ? pCh.GetString() ?? "" :
                             (root.TryGetProperty("uploader", out var pUp) ? pUp.GetString() ?? "" :
                             (root.TryGetProperty("title", out var pTitle) ? pTitle.GetString() ?? "" : ""));

                string avatarUrl = "";
                if (root.TryGetProperty("thumbnails", out var thumbs) && thumbs.ValueKind == JsonValueKind.Array)
                {
                    string bestUrl = "";
                    int maxW = 0;
                    foreach (var thumb in thumbs.EnumerateArray())
                    {
                        string id = thumb.TryGetProperty("id", out var pId) ? pId.GetString() ?? "" : "";
                        if (id.ToLowerInvariant().Contains("avatar"))
                        {
                            int w = thumb.TryGetProperty("width", out var pW) ? pW.GetInt32() : 0;
                            string u = thumb.TryGetProperty("url", out var pU) ? pU.GetString() ?? "" : "";
                            if (w >= maxW && !string.IsNullOrEmpty(u))
                            {
                                maxW = w;
                                bestUrl = u;
                            }
                        }
                    }
                    avatarUrl = bestUrl;
                }

                string localAvatarPath = "";
                if (!string.IsNullOrEmpty(avatarUrl) && !string.IsNullOrEmpty(name))
                {
                    string safeName = Regex.Replace(name, @"[^\w\s\-]", "").Trim();
                    if (string.IsNullOrEmpty(safeName)) safeName = "Channel_" + Guid.NewGuid().ToString("N").Substring(0, 8);
                    
                    string fileName = $"{safeName}.jpg";
                    string filePath = Path.Combine(avatarsDir, fileName);

                    if (!File.Exists(filePath))
                    {
                        try
                        {
                            // Request lightweight 176px thumbnail from Google CDN directly if possible
                            string downloadUrl = avatarUrl;
                            if (downloadUrl.Contains("googleusercontent.com") && Regex.IsMatch(downloadUrl, @"=s\d+"))
                            {
                                downloadUrl = Regex.Replace(downloadUrl, @"=s\d+.*", "=s176-c");
                            }

                            byte[] data = await _httpClient.GetByteArrayAsync(downloadUrl);
                            await File.WriteAllBytesAsync(filePath, data);

                            // Ensure file size is compact (<40KB) by resizing with ffmpeg if needed
                            OptimizeAvatarImage(filePath);
                        }
                        catch { }
                    }

                    localAvatarPath = $"/api/channels/avatar/{Uri.EscapeDataString(fileName)}";
                }

                return new YtDlpChannelMetadata
                {
                    Name = name,
                    AvatarUrl = localAvatarPath
                };
            }
            catch
            {
                return null;
            }
        }

        public static void OptimizeAvatarImage(string filePath)
        {
            try
            {
                if (!File.Exists(filePath)) return;
                var fi = new FileInfo(filePath);
                if (fi.Length <= 40 * 1024) return;

                string tmpPath = filePath + ".tmp.jpg";
                var psi = new ProcessStartInfo
                {
                    FileName = "ffmpeg",
                    Arguments = $"-y -i \"{filePath}\" -vf \"scale=176:176:force_original_aspect_ratio=increase,crop=176:176\" -q:v 3 \"{tmpPath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var p = Process.Start(psi);
                if (p != null)
                {
                    p.WaitForExit(4000);
                    if (File.Exists(tmpPath) && new FileInfo(tmpPath).Length > 0)
                    {
                        File.Move(tmpPath, filePath, true);
                    }
                }
            }
            catch { }
        }

        public async Task ExecuteDownloadAsync(
            DownloadItem item, 
            AppSettingsModel settings, 
            Action<DownloadItem> onProgress, 
            Action<string> onLog, 
            CancellationToken cancellationToken)
        {
            string outputDir = !string.IsNullOrEmpty(item.OutputDir) ? item.OutputDir : settings.OutputDir;
            Directory.CreateDirectory(outputDir);

            List<string> args = new()
            {
                "--newline",
                "--no-warnings",
                "--no-overwrites",
                "--continue",
                "--concurrent-fragments", settings.ConcurrentFragments.ToString(),
                "--sleep-requests", "2",
                "--retries", "5",
                "--fragment-retries", "5"
            };

            // Format / Resolution logic
            if (item.Resolution == "audio")
            {
                args.Add("-f");
                args.Add("bestaudio/b");
                args.Add("-x");
                args.Add("--audio-format");
                args.Add("mp3");
            }
            else if (item.Resolution == "best")
            {
                args.Add("-f");
                args.Add("bv*+ba/b");
            }
            else
            {
                string res = !string.IsNullOrEmpty(item.Resolution) ? item.Resolution : settings.DefaultResolution;
                args.Add("-f");
                args.Add($"bv*[height<={res}]+ba/b");
            }

            // Metadata & Thumbnail embedding
            args.Add("--embed-metadata");
            args.Add("--embed-thumbnail");
            args.Add("--convert-thumbnails");
            args.Add("jpg");

            // Subtitle settings
            if (item.IncludeSubtitles)
            {
                args.Add("--write-subs");
                args.Add("--write-auto-subs");
                args.Add("--sub-langs");
                args.Add(!string.IsNullOrEmpty(item.SubtitleLangs) ? item.SubtitleLangs : settings.SubtitleLangs);
                args.Add("--convert-subs");
                args.Add("srt");
                args.Add("--embed-subs");
            }

            // Output template and Metadata cleaning (exact logic from yt.sh)
            args.Add("--output");
            args.Add(Path.Combine(outputDir, "%(uploader,channel)s/%(title)s.%(ext)s"));

            args.Add("--replace-in-metadata"); args.Add("title"); args.Add("#[A-Za-z0-9_]+"); args.Add("");
            args.Add("--replace-in-metadata"); args.Add("title"); args.Add(@"[^\w\s\-\?\[\]\(\)&]"); args.Add("");
            args.Add("--replace-in-metadata"); args.Add("title"); args.Add("_"); args.Add(" ");
            args.Add("--replace-in-metadata"); args.Add("title"); args.Add(@"\s+"); args.Add(" ");
            args.Add("--replace-in-metadata"); args.Add("title"); args.Add(@"^\s+|\s+$"); args.Add("");

            args.Add("--replace-in-metadata"); args.Add("uploader"); args.Add(@"[^\w\s\-]"); args.Add("");
            args.Add("--replace-in-metadata"); args.Add("uploader"); args.Add(@"\s+"); args.Add(" ");
            args.Add("--replace-in-metadata"); args.Add("uploader"); args.Add(@"^\s+|\s+$"); args.Add("");

            args.Add("--trim-filenames"); args.Add("200");

            // Archive tracking
            if (File.Exists(settings.ArchiveFile))
            {
                args.Add("--download-archive");
                args.Add(settings.ArchiveFile);
            }

            // Cookies support (essential for Docker & YouTube anti-bot bypass)
            string cookiesPath = GetCookiesFilePath(settings.CookiesFile, settings.DataDir);
            if (!string.IsNullOrEmpty(cookiesPath) && File.Exists(cookiesPath))
            {
                args.Add("--cookies");
                args.Add(cookiesPath);
            }

            // Channel specific filters & Fast Date Range Breaking
            if (item.Type == "ChannelSync")
            {
                int days = item.DaysLimit ?? settings.DaysLimit;
                string dateAfter = DateTime.UtcNow.AddDays(-days).ToString("yyyyMMdd");
                int playlistLimit = Math.Max(20, days * 3);

                args.Add("--lazy-playlist");
                args.Add("--break-on-reject");
                args.Add("--playlist-end"); args.Add(playlistLimit.ToString());
                args.Add("--dateafter"); args.Add(dateAfter);
                args.Add("--match-filter"); args.Add("!is_live & !was_live & duration > 60");
                args.Add("--ignore-errors");
            }

            string targetUrl = item.Url;
            if (item.Type == "ChannelSync" && !targetUrl.EndsWith("/videos"))
            {
                targetUrl = targetUrl.TrimEnd('/') + "/videos";
            }

            args.Add(targetUrl);

            var psi = new ProcessStartInfo
            {
                FileName = "yt-dlp",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            foreach (var arg in args)
            {
                psi.ArgumentList.Add(arg);
            }

            onLog($"[INFO] Starting yt-dlp: {psi.FileName} {string.Join(" ", psi.ArgumentList)}");

            using var process = new Process { StartInfo = psi };
            process.Start();

            var stdoutTask = ReadStreamLinesAsync(process.StandardOutput, line =>
            {
                onLog(line);
                ParseProgressLine(line, item);
                onProgress(item);
            }, cancellationToken);

            var stderrTask = ReadStreamLinesAsync(process.StandardError, line =>
            {
                onLog($"[STDERR] {line}");
            }, cancellationToken);

            try
            {
                await Task.WhenAll(process.WaitForExitAsync(cancellationToken), stdoutTask, stderrTask);
            }
            catch (OperationCanceledException)
            {
                try
                {
                    if (!process.HasExited) process.Kill(true);
                }
                catch { }
                item.Status = "Cancelled";
                throw;
            }

            // Exit code 101 indicates break-on-reject or break-on-existing successfully terminated scanning
            if (process.ExitCode != 0 && process.ExitCode != 101 && item.Status != "Cancelled")
            {
                item.Status = "Failed";
                item.Error = $"yt-dlp exited with code {process.ExitCode}";
            }
            else if (item.Status != "Cancelled")
            {
                item.Status = "Completed";
                item.ProgressPercentage = 100;
            }
        }

        private static async Task ReadStreamLinesAsync(StreamReader reader, Action<string> onLine, CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                string? line = await reader.ReadLineAsync(ct);
                if (line == null) break;
                onLine(line);
            }
        }

        private static void ParseProgressLine(string line, DownloadItem item)
        {
            if (line.StartsWith("[download] Destination:"))
            {
                string dest = line.Substring("[download] Destination:".Length).Trim();
                item.Title = Path.GetFileNameWithoutExtension(dest);
            }

            var match = ProgressRegex.Match(line);
            if (match.Success)
            {
                if (double.TryParse(match.Groups["percent"].Value, out double p))
                {
                    item.ProgressPercentage = Math.Min(100.0, Math.Max(0.0, p));
                }
                item.DownloadSpeed = match.Groups["speed"].Value;
                item.Eta = match.Groups["eta"].Value;
                item.Status = "Downloading";
            }
            else
            {
                var simpleMatch = SimpleProgressRegex.Match(line);
                if (simpleMatch.Success)
                {
                    if (double.TryParse(simpleMatch.Groups["percent"].Value, out double p))
                    {
                        item.ProgressPercentage = Math.Min(100.0, Math.Max(0.0, p));
                    }
                    item.Status = "Downloading";
                }
            }
        }
    }
}
