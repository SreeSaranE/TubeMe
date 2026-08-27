using System;
using System.Collections.Generic;

namespace YoutubeDownloader.Models
{
    public class ChannelModel
    {
        public string Id { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        public DateTime? LastSyncedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsSyncing { get; set; }
    }

    public class DownloadItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Url { get; set; } = string.Empty;
        public string Title { get; set; } = "Initializing...";
        public string Uploader { get; set; } = string.Empty;
        public string Thumbnail { get; set; } = string.Empty;
        public string Format { get; set; } = "bv*[height<=1080]+ba/b";
        public string Resolution { get; set; } = "1080";
        public string Type { get; set; } = "Video"; // "Video", "Playlist", "ChannelSync"
        public string Status { get; set; } = "Queued"; // "Queued", "Downloading", "Completed", "Failed", "Cancelled"
        public double ProgressPercentage { get; set; } = 0;
        public string DownloadSpeed { get; set; } = string.Empty;
        public string Eta { get; set; } = string.Empty;
        public string Error { get; set; } = string.Empty;
        public List<string> Logs { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        
        // Settings overrides for this download task
        public bool IncludeSubtitles { get; set; } = true;
        public string SubtitleLangs { get; set; } = "en.*,ta.*";
        public int? DaysLimit { get; set; }
        public string OutputDir { get; set; } = string.Empty;
    }

    public class AppSettingsModel
    {
        public string OutputDir { get; set; } = "/downloads";
        public string DataDir { get; set; } = "/app/data";
        public string ArchiveFile { get; set; } = "/app/data/archives.txt";
        public string ChannelsFile { get; set; } = "/app/data/channels.txt";
        public string DefaultResolution { get; set; } = "1080"; // "1080", "720", "4k", "best"
        public bool IncludeSubtitles { get; set; } = true;
        public string SubtitleLangs { get; set; } = "en.*,ta.*";
        public int DaysLimit { get; set; } = 4;
        public int MaxConcurrentJobs { get; set; } = 5;
        public int ConcurrentFragments { get; set; } = 4;
    }

    public class SearchResultItem
    {
        public string Id { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ChannelName { get; set; } = string.Empty;
        public string ChannelUrl { get; set; } = string.Empty;
        public string Thumbnail { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public long? ViewCount { get; set; }
        public string UploadDate { get; set; } = string.Empty;
        public bool IsPlaylist { get; set; }
    }

    public class StartDownloadRequest
    {
        public string Url { get; set; } = string.Empty;
        public string? Resolution { get; set; }
        public bool? Subtitles { get; set; }
        public string? SubtitleLangs { get; set; }
        public bool AudioOnly { get; set; }
        public string? CustomOutputDir { get; set; }
        public int? DaysLimit { get; set; }
    }

    public class ChannelSyncRequest
    {
        public List<string>? ChannelIds { get; set; }
        public string? Category { get; set; }
        public string? Resolution { get; set; }
        public int? DaysLimit { get; set; }
        public bool? Subtitles { get; set; }
    }

    public class AddChannelRequest
    {
        public string Url { get; set; } = string.Empty;
        public string? Category { get; set; } = "General";
    }

    public class UpdateChannelCategoryRequest
    {
        public string Category { get; set; } = "General";
    }

    public class FileInfoItem
    {
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public bool IsDirectory { get; set; }
        public long Size { get; set; }
        public DateTime LastModified { get; set; }
    }

    public class YtDlpChannelMetadata
    {
        public string Name { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }

    public class CategoryDetailModel
    {
        public string Name { get; set; } = string.Empty;
        public int ChannelCount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateCategoryRequest
    {
        public string NewName { get; set; } = string.Empty;
    }
}
