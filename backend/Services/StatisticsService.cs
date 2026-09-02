using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class StatisticsService : IStatisticsService
    {
        private readonly IMediaService _mediaService;
        private readonly IChannelRepository _channelRepository;
        private readonly IWatchHistoryRepository _watchHistoryRepository;
        private readonly IPlaylistRepository _playlistRepository;
        private readonly ICategoryRepository _categoryRepository;

        public StatisticsService(
            IMediaService mediaService,
            IChannelRepository channelRepository,
            IWatchHistoryRepository watchHistoryRepository,
            IPlaylistRepository playlistRepository,
            ICategoryRepository categoryRepository)
        {
            _mediaService = mediaService;
            _channelRepository = channelRepository;
            _watchHistoryRepository = watchHistoryRepository;
            _playlistRepository = playlistRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<AppStatisticsModel> GetStatisticsAsync()
        {
            var videos = await _mediaService.GetAllVideosAsync();
            var channels = _channelRepository.GetAll();
            var historyList = _watchHistoryRepository.GetAll();
            var playlists = _playlistRepository.GetAllPlaylists();
            var categories = _categoryRepository.GetAllWithCount();

            int totalVideos = videos.Count;
            int totalChannels = channels.Count;
            int watchedVideosCount = videos.Count(v => v.IsCompleted);
            int unwatchedVideosCount = Math.Max(0, totalVideos - watchedVideosCount);
            long totalDiskSizeBytes = videos.Sum(v => v.Size);
            int totalPlaylistsCount = playlists.Count;

            // Channel lookup map (by lowercase name)
            var channelMap = channels
                .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                .GroupBy(c => c.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            // Channel watch times dictionary
            var channelWatchTimes = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
            double totalWatchTimeSeconds = 0;

            // Compute watch time from all media videos
            foreach (var video in videos)
            {
                double videoDurationSeconds = ParseDurationStringToSeconds(video.Duration);
                double watchSeconds = 0;

                if (video.IsCompleted)
                {
                    // Completed video contributes its full duration
                    watchSeconds = videoDurationSeconds > 0 ? videoDurationSeconds : (video.WatchProgressSeconds ?? 0);
                }
                else if (video.WatchProgressSeconds.HasValue && video.WatchProgressSeconds.Value > 0)
                {
                    // Partially watched video contributes its actual progress seconds
                    watchSeconds = video.WatchProgressSeconds.Value;
                    if (videoDurationSeconds > 0 && watchSeconds > videoDurationSeconds)
                    {
                        watchSeconds = videoDurationSeconds;
                    }
                }

                if (watchSeconds > 0)
                {
                    totalWatchTimeSeconds += watchSeconds;
                    string chName = (video.ChannelName ?? "Local Media").Trim();
                    if (!channelWatchTimes.ContainsKey(chName))
                    {
                        channelWatchTimes[chName] = 0;
                    }
                    channelWatchTimes[chName] += watchSeconds;
                }
            }

            // Group videos by channel
            var channelVideoGroups = videos
                .Where(v => !string.IsNullOrWhiteSpace(v.ChannelName))
                .GroupBy(v => v.ChannelName.Trim(), StringComparer.OrdinalIgnoreCase);

            var channelStatsList = new List<ChannelWatchStatModel>();

            foreach (var group in channelVideoGroups)
            {
                string channelName = group.Key;
                int channelWatchedCount = group.Count(v => v.IsCompleted);
                int channelTotalVideos = group.Count();
                long channelTotalSize = group.Sum(v => v.Size);

                double watchTime = channelWatchTimes.TryGetValue(channelName, out var wt) ? wt : 0;
                string? avatarUrl = channelMap.TryGetValue(channelName, out var ch) ? ch.AvatarUrl : group.FirstOrDefault()?.ChannelAvatarUrl;

                channelStatsList.Add(new ChannelWatchStatModel
                {
                    ChannelName = channelName,
                    AvatarUrl = avatarUrl,
                    WatchedCount = channelWatchedCount,
                    TotalVideosCount = channelTotalVideos,
                    TotalWatchTimeSeconds = watchTime,
                    TotalSizeBytes = channelTotalSize,
                });
            }

            // Also check any channel that had watch history
            foreach (var kvp in channelWatchTimes)
            {
                if (!channelStatsList.Any(cs => cs.ChannelName.Equals(kvp.Key, StringComparison.OrdinalIgnoreCase)))
                {
                    string? avatarUrl = channelMap.TryGetValue(kvp.Key, out var ch) ? ch.AvatarUrl : null;
                    channelStatsList.Add(new ChannelWatchStatModel
                    {
                        ChannelName = kvp.Key,
                        AvatarUrl = avatarUrl,
                        WatchedCount = historyList.Count(h => h.ChannelName.Equals(kvp.Key, StringComparison.OrdinalIgnoreCase) && h.IsCompleted),
                        TotalVideosCount = 0,
                        TotalWatchTimeSeconds = kvp.Value,
                        TotalSizeBytes = 0,
                    });
                }
            }

            // Order by most watched: WatchedCount DESC, then WatchTime DESC, then TotalVideos DESC
            var topWatchedChannels = channelStatsList
                .OrderByDescending(cs => cs.WatchedCount)
                .ThenByDescending(cs => cs.TotalWatchTimeSeconds)
                .ThenByDescending(cs => cs.TotalVideosCount)
                .Take(12)
                .ToList();

            return new AppStatisticsModel
            {
                TotalVideos = totalVideos,
                TotalChannels = totalChannels,
                WatchedVideosCount = watchedVideosCount,
                UnwatchedVideosCount = unwatchedVideosCount,
                TotalDiskSizeBytes = totalDiskSizeBytes,
                TotalWatchTimeSeconds = totalWatchTimeSeconds,
                TotalPlaylistsCount = totalPlaylistsCount,
                TopWatchedChannels = topWatchedChannels,
                CategoryDistribution = categories,
            };
        }

        private static double ParseDurationStringToSeconds(string? durationStr)
        {
            if (string.IsNullOrWhiteSpace(durationStr)) return 0;
            var parts = durationStr.Split(':');
            if (parts.Length == 2 && double.TryParse(parts[0], out var m) && double.TryParse(parts[1], out var s))
            {
                return (m * 60) + s;
            }
            if (parts.Length == 3 && double.TryParse(parts[0], out var h) && double.TryParse(parts[1], out var min) && double.TryParse(parts[2], out var sec))
            {
                return (h * 3600) + (min * 60) + sec;
            }
            return 0;
        }
    }
}
