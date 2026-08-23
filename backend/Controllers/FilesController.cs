using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using YoutubeDownloader.Services;

namespace YoutubeDownloader.Controllers
{
    public class FileInfoItem
    {
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public bool IsDirectory { get; set; }
        public long Size { get; set; }
        public DateTime LastModified { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly SettingsService _settingsService;

        private static readonly HashSet<string> AllowedMediaExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv", ".wmv", ".m4v", ".ts", ".3gp",
            ".mp3", ".m4a", ".aac", ".flac", ".opus", ".wav", ".ogg"
        };

        public FilesController(SettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        public ActionResult<List<FileInfoItem>> GetFiles([FromQuery] string? subDir)
        {
            var settings = _settingsService.GetSettings();
            string rootDir = settings.OutputDir;

            if (!Directory.Exists(rootDir))
            {
                return Ok(new List<FileInfoItem>());
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

            if (!Directory.Exists(targetDir)) return Ok(new List<FileInfoItem>());

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
                // Filter out subtitles (.srt, .vtt), image thumbnails (.jpg), logs, and partial downloads
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

            return Ok(items.OrderByDescending(i => i.IsDirectory).ThenBy(i => i.Name).ToList());
        }
    }
}
