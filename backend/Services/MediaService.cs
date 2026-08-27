using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class MediaService : IMediaService
    {
        private readonly ISettingsService _settingsService;
        private readonly IChannelRepository _channelRepository;

        private static readonly HashSet<string> VideoExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".mp4", ".mkv", ".webm", ".mov", ".avi", ".m4v", ".ts", ".3gp"
        };

        public MediaService(ISettingsService settingsService, IChannelRepository channelRepository)
        {
            _settingsService = settingsService;
            _channelRepository = channelRepository;
        }

        public async Task<List<MediaVideoItem>> GetAllVideosAsync()
        {
            var settings = _settingsService.GetSettings();
            string rootDir = settings.OutputDir;

            if (!Directory.Exists(rootDir))
            {
                return new List<MediaVideoItem>();
            }

            var channels = _channelRepository.GetAll();
            var channelMap = channels.ToDictionary(c => c.Name.Trim().ToLowerInvariant(), c => c);

            var items = new List<MediaVideoItem>();

            var allFiles = Directory.EnumerateFiles(rootDir, "*.*", SearchOption.AllDirectories)
                .Where(f => VideoExtensions.Contains(Path.GetExtension(f)));

            foreach (var filePath in allFiles)
            {
                try
                {
                    var fileInfo = new FileInfo(filePath);
                    string relPath = Path.GetRelativePath(rootDir, filePath);
                    
                    // Determine channel name from folder hierarchy or metadata
                    string channelName = "Local Media";
                    string? dirName = Path.GetDirectoryName(relPath);
                    if (!string.IsNullOrEmpty(dirName))
                    {
                        var parts = dirName.Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                        if (parts.Length > 0 && !string.IsNullOrWhiteSpace(parts[0]))
                        {
                            channelName = parts[0];
                        }
                    }

                    string cleanTitle = Path.GetFileNameWithoutExtension(filePath);
                    string ext = Path.GetExtension(filePath).TrimStart('.').ToUpperInvariant();

                    string? avatarUrl = null;
                    if (channelMap.TryGetValue(channelName.ToLowerInvariant(), out var matchedChannel))
                    {
                        avatarUrl = matchedChannel.AvatarUrl;
                    }

                    // Check for subtitles
                    string dir = Path.GetDirectoryName(filePath) ?? "";
                    string baseNameWithoutExt = Path.GetFileNameWithoutExtension(filePath);
                    bool hasSubs = false;
                    string? subRelPath = null;

                    if (Directory.Exists(dir))
                    {
                        var srtFiles = Directory.GetFiles(dir, $"{baseNameWithoutExt}*.srt");
                        if (srtFiles.Length > 0)
                        {
                            hasSubs = true;
                            subRelPath = Path.GetRelativePath(rootDir, srtFiles[0]);
                        }
                    }

                    string encodedRelPath = Uri.EscapeDataString(relPath.Replace('\\', '/'));
                    string encodedSubPath = subRelPath != null ? Uri.EscapeDataString(subRelPath.Replace('\\', '/')) : "";

                    items.Add(new MediaVideoItem
                    {
                        Id = GetMd5Hash(relPath),
                        Title = cleanTitle,
                        FileName = Path.GetFileName(filePath),
                        RelativePath = relPath.Replace('\\', '/'),
                        ChannelName = channelName,
                        ChannelAvatarUrl = avatarUrl,
                        Size = fileInfo.Length,
                        LastModified = fileInfo.LastWriteTimeUtc,
                        Format = ext,
                        ThumbnailUrl = $"/api/media/thumbnail?path={encodedRelPath}",
                        StreamUrl = $"/api/media/stream?path={encodedRelPath}",
                        HasSubtitles = hasSubs,
                        SubtitleUrl = hasSubs ? $"/api/media/subtitles?path={encodedSubPath}" : null
                    });
                }
                catch
                {
                    // Skip files that cannot be read
                }
            }

            return items.OrderByDescending(v => v.LastModified).ToList();
        }

        public async Task<string?> GetThumbnailPathAsync(string relativePath)
        {
            string? fullVideoPath = GetFullFilePath(relativePath);
            if (fullVideoPath == null || !File.Exists(fullVideoPath)) return null;

            var settings = _settingsService.GetSettings();
            string thumbDir = Path.Combine(settings.DataDir, "thumbnails");
            Directory.CreateDirectory(thumbDir);

            string hash = GetMd5Hash(relativePath);
            string cachePath = Path.Combine(thumbDir, $"{hash}.jpg");

            if (File.Exists(cachePath) && new FileInfo(cachePath).Length > 0)
            {
                return cachePath;
            }

            // Extract thumbnail via ffmpeg:
            // First attempt: frame at 00:00:05
            bool extracted = await RunFfmpegAsync($"-ss 00:00:05 -i \"{fullVideoPath}\" -vframes 1 -q:v 2 \"{cachePath}\" -y");
            
            if (!extracted || !File.Exists(cachePath) || new FileInfo(cachePath).Length == 0)
            {
                // Fallback: frame at 00:00:01
                await RunFfmpegAsync($"-ss 00:00:01 -i \"{fullVideoPath}\" -vframes 1 -q:v 2 \"{cachePath}\" -y");
            }

            return File.Exists(cachePath) && new FileInfo(cachePath).Length > 0 ? cachePath : null;
        }

        public string? GetFullFilePath(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return null;

            var settings = _settingsService.GetSettings();
            string rootDir = Path.GetFullPath(settings.OutputDir);

            string combined = Path.GetFullPath(Path.Combine(rootDir, relativePath.TrimStart('/', '\\')));

            if (!combined.StartsWith(rootDir, StringComparison.OrdinalIgnoreCase))
            {
                return null; // Prevent path traversal attacks
            }

            return File.Exists(combined) ? combined : null;
        }

        public string? GetSubtitleVttContent(string relativePath)
        {
            string? fullSrtPath = GetFullFilePath(relativePath);
            if (fullSrtPath == null || !File.Exists(fullSrtPath)) return null;

            try
            {
                string srt = File.ReadAllText(fullSrtPath);
                return ConvertSrtToVtt(srt);
            }
            catch
            {
                return null;
            }
        }

        public bool DeleteMediaFile(string relativePath)
        {
            string? fullVideoPath = GetFullFilePath(relativePath);
            if (fullVideoPath == null || !File.Exists(fullVideoPath)) return false;

            try
            {
                File.Delete(fullVideoPath);

                // Remove associated thumbnail
                var settings = _settingsService.GetSettings();
                string thumbPath = Path.Combine(settings.DataDir, "thumbnails", $"{GetMd5Hash(relativePath)}.jpg");
                if (File.Exists(thumbPath))
                {
                    File.Delete(thumbPath);
                }

                // Remove subtitles with matching base name
                string dir = Path.GetDirectoryName(fullVideoPath) ?? "";
                string baseName = Path.GetFileNameWithoutExtension(fullVideoPath);
                if (Directory.Exists(dir))
                {
                    foreach (var srt in Directory.GetFiles(dir, $"{baseName}*.srt"))
                    {
                        try { File.Delete(srt); } catch { }
                    }
                }

                return true;
            }
            catch
            {
                return false;
            }
        }

        private static async Task<bool> RunFfmpegAsync(string arguments)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "ffmpeg",
                    Arguments = $"-loglevel error -threads 2 {arguments}",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(psi);
                if (process == null) return false;

                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(8));
                await process.WaitForExitAsync(cts.Token);
                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        private static string ConvertSrtToVtt(string srt)
        {
            var sb = new StringBuilder();
            sb.AppendLine("WEBVTT");
            sb.AppendLine();

            // Convert timestamps 00:00:00,000 to 00:00:00.000
            string converted = Regex.Replace(srt, @"(\d{2}:\d{2}:\d{2}),(\d{3})", "$1.$2");
            sb.Append(converted);

            return sb.ToString();
        }

        private static string GetMd5Hash(string input)
        {
            using var md5 = MD5.Create();
            byte[] bytes = md5.ComputeHash(Encoding.UTF8.GetBytes(input.ToLowerInvariant()));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
