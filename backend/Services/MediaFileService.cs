using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class MediaFileService : IMediaFileService
    {
        private readonly ISettingsService _settingsService;

        private static readonly HashSet<string> AllowedMediaExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv", ".wmv", ".m4v", ".ts", ".3gp",
            ".mp3", ".m4a", ".aac", ".flac", ".opus", ".wav", ".ogg"
        };

        public MediaFileService(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        public List<FileInfoItem> GetMediaFiles(string? subDir)
        {
            var settings = _settingsService.GetSettings();
            string rootDir = settings.OutputDir;

            if (!Directory.Exists(rootDir))
            {
                return new List<FileInfoItem>();
            }

            string targetDir = rootDir;
            if (!string.IsNullOrEmpty(subDir))
            {
                // Prevent path traversal
                string combined = Path.GetFullPath(Path.Combine(rootDir, subDir));
                if (combined.StartsWith(Path.GetFullPath(rootDir)))
                {
                    targetDir = combined;
                }
            }

            if (!Directory.Exists(targetDir)) return new List<FileInfoItem>();

            var items = new List<FileInfoItem>();
            var dirInfo = new DirectoryInfo(targetDir);

            foreach (var dir in dirInfo.GetDirectories())
            {
                items.Add(new FileInfoItem
                {
                    Name = dir.Name,
                    Path = Path.GetRelativePath(rootDir, dir.FullName),
                    IsDirectory = true,
                    Size = 0,
                    LastModified = dir.LastWriteTimeUtc
                });
            }

            foreach (var file in dirInfo.GetFiles())
            {
                string ext = file.Extension;
                if (AllowedMediaExtensions.Contains(ext))
                {
                    items.Add(new FileInfoItem
                    {
                        Name = file.Name,
                        Path = Path.GetRelativePath(rootDir, file.FullName),
                        IsDirectory = false,
                        Size = file.Length,
                        LastModified = file.LastWriteTimeUtc
                    });
                }
            }

            return items.OrderByDescending(i => i.IsDirectory).ThenBy(i => i.Name).ToList();
        }
    }
}
