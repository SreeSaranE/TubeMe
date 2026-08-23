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

namespace YoutubeDownloader.Services
{
    public class YtDlpChannelMetadata
    {
        public string Name { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }

    public class YtDlpService
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

        public async Task<List<SearchResultItem>> SearchAsync(string query, int maxResults = 12)
        {
            var results = new List<SearchResultItem>();
            string searchUrl = query.StartsWith("http://") || query.StartsWith("https://") 
                ? query 
                : $"ytsearch{maxResults}:{query}";

            var psi = new ProcessStartInfo
            {
                FileName = "yt-dlp",
                Arguments = $"--quiet --no-warnings --dump-single-json --flat-playlist \"{searchUrl}\"",
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

                return new SearchResultItem
                {
                    Id = id,
                    Url = url,
                    Title = title,
                    ChannelName = uploader,
                    Thumbnail = thumbnail,
                    Duration = durationStr,
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
            var psi = new ProcessStartInfo
            {
                FileName = "yt-dlp",
                Arguments = $"--quiet --no-warnings --skip-download --flat-playlist --playlist-items 0 --socket-timeout 15 --dump-single-json \"{cleanUrl}\"",
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
                            byte[] data = await _httpClient.GetByteArrayAsync(avatarUrl);
                            await File.WriteAllBytesAsync(filePath, data);
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

            // Channel specific filters
            if (item.Type == "ChannelSync")
            {
                int days = item.DaysLimit ?? settings.DaysLimit;
                string dateAfter = DateTime.UtcNow.AddDays(-days).ToString("yyyyMMdd");
                int playlistLimit = days * 2;

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

            if (process.ExitCode != 0 && item.Status != "Cancelled")
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
