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
        public string CookiesFile { get; set; } = "/app/data/cookies.txt";
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

    public class MediaVideoItem
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string RelativePath { get; set; } = string.Empty;
        public string ChannelName { get; set; } = string.Empty;
        public string? ChannelAvatarUrl { get; set; }
        public long Size { get; set; }
        public DateTime LastModified { get; set; }
        public string ThumbnailUrl { get; set; } = string.Empty;
        public string StreamUrl { get; set; } = string.Empty;
        public bool HasSubtitles { get; set; }
        public string? SubtitleUrl { get; set; }
        public string Format { get; set; } = string.Empty;
        public string? Duration { get; set; }
        public double? WatchProgressSeconds { get; set; }
        public double? WatchProgressPercentage { get; set; }
        public bool IsCompleted { get; set; }
    }

    public class WatchHistoryItem
    {
        public string Id { get; set; } = string.Empty;
        public string RelativePath { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ChannelName { get; set; } = string.Empty;
        public double CurrentTime { get; set; }
        public double Duration { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime LastWatchedAt { get; set; }
    }

    public class UpdateWatchHistoryRequest
    {
        public string RelativePath { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? ChannelName { get; set; }
        public double CurrentTime { get; set; }
        public double Duration { get; set; }
    }

    public class PlaylistModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int VideoCount { get; set; }
        public string? CoverThumbnailUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PlaylistVideoItem
    {
        public string Id { get; set; } = string.Empty;
        public string PlaylistId { get; set; } = string.Empty;
        public string RelativePath { get; set; } = string.Empty;
        public string VideoTitle { get; set; } = string.Empty;
        public string ChannelName { get; set; } = string.Empty;
        public string? Duration { get; set; }
        public string? ThumbnailUrl { get; set; }
        public int Position { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        public bool IsCompleted { get; set; }
        public double? WatchProgressPercentage { get; set; }
    }

    public class PlaylistDetailModel : PlaylistModel
    {
        public List<PlaylistVideoItem> Videos { get; set; } = new();
    }

    public class CreatePlaylistRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdatePlaylistRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }

    public class AddVideoToPlaylistRequest
    {
        public string RelativePath { get; set; } = string.Empty;
        public string? VideoTitle { get; set; }
        public string? ChannelName { get; set; }
        public string? Duration { get; set; }
        public string? ThumbnailUrl { get; set; }
    }

    public class ChannelWatchStatModel
    {
        public string ChannelName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int WatchedCount { get; set; }
        public int TotalVideosCount { get; set; }
        public double TotalWatchTimeSeconds { get; set; }
        public long TotalSizeBytes { get; set; }
    }

    public class AppStatisticsModel
    {
        public int TotalVideos { get; set; }
        public int TotalChannels { get; set; }
        public int WatchedVideosCount { get; set; }
        public int UnwatchedVideosCount { get; set; }
        public long TotalDiskSizeBytes { get; set; }
        public double TotalWatchTimeSeconds { get; set; }
        public int TotalPlaylistsCount { get; set; }
        public List<ChannelWatchStatModel> TopWatchedChannels { get; set; } = new();
        public List<CategoryDetailModel> CategoryDistribution { get; set; } = new();
    }
}
