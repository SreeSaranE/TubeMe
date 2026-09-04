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
            var playlists = _playlistRepository.GetAllPlaylists();
            var categories = _categoryRepository.GetAllWithCount();

            int totalVideos = videos.Count;
            int totalChannels = channels.Count;
            int watchedVideosCount = videos.Count(v => v.IsCompleted);
            int unwatchedVideosCount = Math.Max(0, totalVideos - watchedVideosCount);
            long totalDiskSizeBytes = videos.Sum(v => v.Size);
            int totalPlaylistsCount = playlists.Count;

            // Channel lookup map (by trimmed name)
            var channelMap = channels
                .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                .GroupBy(c => c.Name.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            // Fetch lifetime metrics from persistent watch_time_ledger
            double totalWatchTimeSeconds = _watchHistoryRepository.GetTotalLifetimeWatchTimeSeconds();
            var channelWatchTimes = _watchHistoryRepository.GetChannelWatchTimeMap();
            var channelWatchedCounts = _watchHistoryRepository.GetChannelWatchedCountMap();

            // If ledger is empty (e.g. initial setup fallback), compute from current completed media
            if (totalWatchTimeSeconds <= 0 && watchedVideosCount > 0)
            {
                foreach (var video in videos.Where(v => v.IsCompleted))
                {
                    double durSec = ParseDurationStringToSeconds(video.Duration);
                    if (durSec <= 0) durSec = 600;
                    totalWatchTimeSeconds += durSec;

                    string chName = (video.ChannelName ?? "Local Media").Trim();
                    channelWatchTimes[chName] = (channelWatchTimes.TryGetValue(chName, out var existingWt) ? existingWt : 0) + durSec;
                    channelWatchedCounts[chName] = (channelWatchedCounts.TryGetValue(chName, out var existingCount) ? existingCount : 0) + 1;
                }
            }

            // Group active videos by channel
            var channelVideoGroups = videos
                .Where(v => !string.IsNullOrWhiteSpace(v.ChannelName))
                .GroupBy(v => v.ChannelName.Trim(), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

            // Collect all unique channel names across subscriptions, active videos, and historical ledger
            var allChannelNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var ch in channels) if (!string.IsNullOrWhiteSpace(ch.Name)) allChannelNames.Add(ch.Name.Trim());
            foreach (var groupKey in channelVideoGroups.Keys) allChannelNames.Add(groupKey);
            foreach (var ledgerChannel in channelWatchTimes.Keys) allChannelNames.Add(ledgerChannel);
            foreach (var ledgerChannel in channelWatchedCounts.Keys) allChannelNames.Add(ledgerChannel);

            var channelStatsList = new List<ChannelWatchStatModel>();

            foreach (var channelName in allChannelNames)
            {
                channelVideoGroups.TryGetValue(channelName, out var groupVideos);
                int channelTotalVideos = groupVideos?.Count ?? 0;
                long channelTotalSize = groupVideos?.Sum(v => v.Size) ?? 0;

                int activeWatched = groupVideos?.Count(v => v.IsCompleted) ?? 0;
                int channelWatchedCount = channelWatchedCounts.TryGetValue(channelName, out var lCount) ? Math.Max(lCount, activeWatched) : activeWatched;
                double watchTime = channelWatchTimes.TryGetValue(channelName, out var wt) ? wt : 0;

                string? avatarUrl = channelMap.TryGetValue(channelName, out var ch) ? ch.AvatarUrl : groupVideos?.FirstOrDefault()?.ChannelAvatarUrl;

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
