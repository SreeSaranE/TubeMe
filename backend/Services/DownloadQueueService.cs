using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Hubs;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class DownloadQueueService : BackgroundService, IDownloadQueueService
    {
        private readonly ConcurrentQueue<DownloadItem> _pendingQueue = new();
        private readonly ConcurrentDictionary<string, DownloadItem> _allDownloads = new();
        private readonly ConcurrentDictionary<string, CancellationTokenSource> _ctsMap = new();

        private readonly IDownloadRepository _downloadRepository;
        private readonly ISettingsService _settingsService;
        private readonly IChannelService _channelService;
        private readonly IYtDlpService _ytDlpService;
        private readonly IMediaService _mediaService;
        private readonly IHubContext<DownloadHub> _hubContext;

        public DownloadQueueService(
            IDownloadRepository downloadRepository,
            ISettingsService settingsService,
            IChannelService channelService,
            IYtDlpService ytDlpService,
            IMediaService mediaService,
            IHubContext<DownloadHub> hubContext)
        {
            _downloadRepository = downloadRepository;
            _settingsService = settingsService;
            _channelService = channelService;
            _ytDlpService = ytDlpService;
            _mediaService = mediaService;
            _hubContext = hubContext;

            // Load existing downloads from repository
            try
            {
                var existing = _downloadRepository.GetAll();
                foreach (var item in existing)
                {
                    if (item.Status == "Downloading" || item.Status == "Queued")
                    {
                        item.Status = "Cancelled";
                        item.Error = "Interrupted by server restart";
                        _downloadRepository.Save(item);
                    }
                    _allDownloads[item.Id] = item;
                }
            }
            catch { }
        }

        public DownloadItem EnqueueDownload(StartDownloadRequest req)
        {
            var settings = _settingsService.GetSettings();
            var item = new DownloadItem
            {
                Url = req.Url.Trim(),
                Resolution = req.Resolution ?? settings.DefaultResolution,
                IncludeSubtitles = req.Subtitles ?? settings.IncludeSubtitles,
                SubtitleLangs = req.SubtitleLangs ?? settings.SubtitleLangs,
                DaysLimit = req.DaysLimit,
                OutputDir = req.CustomOutputDir ?? settings.OutputDir,
                Type = req.Url.Contains("/@") || req.Url.Contains("/channel/") || req.Url.Contains("/c/") ? "ChannelSync" : "Video",
                Status = "Queued"
            };

            if (req.AudioOnly)
            {
                item.Resolution = "audio";
            }

            _allDownloads[item.Id] = item;
            _pendingQueue.Enqueue(item);
            _downloadRepository.Save(item);

            _ = BroadcastUpdateAsync(item);
            return item;
        }

        public List<DownloadItem> EnqueueChannelSync(ChannelSyncRequest req)
        {
            var channels = _channelService.GetChannels();
            var targetChannels = (req.ChannelIds != null && req.ChannelIds.Count > 0)
                ? channels.Where(c => req.ChannelIds.Contains(c.Id)).ToList()
                : (!string.IsNullOrWhiteSpace(req.Category) && !req.Category.Equals("All", StringComparison.OrdinalIgnoreCase)
                    ? channels.Where(c => c.Category.Equals(req.Category, StringComparison.OrdinalIgnoreCase)).ToList()
                    : channels);

            var queuedItems = new List<DownloadItem>();
            var settings = _settingsService.GetSettings();

            foreach (var ch in targetChannels)
            {
                _channelService.SetIsSyncing(ch.Id, true);

                var item = new DownloadItem
                {
                    Url = ch.Url,
                    Title = ch.Name,
                    Uploader = ch.Name,
                    Resolution = req.Resolution ?? settings.DefaultResolution,
                    IncludeSubtitles = req.Subtitles ?? settings.IncludeSubtitles,
                    DaysLimit = req.DaysLimit ?? settings.DaysLimit,
                    Type = "ChannelSync",
                    Status = "Queued"
                };

                _allDownloads[item.Id] = item;
                _pendingQueue.Enqueue(item);
                _downloadRepository.Save(item);
                queuedItems.Add(item);

                _ = BroadcastUpdateAsync(item);
            }

            return queuedItems;
        }

        public List<DownloadItem> GetAllDownloads()
        {
            return _allDownloads.Values.OrderByDescending(d => d.CreatedAt).ToList();
        }

        public DownloadItem? GetDownload(string id)
        {
            _allDownloads.TryGetValue(id, out var item);
            return item;
        }

        public bool CancelDownload(string id)
        {
            if (_allDownloads.TryGetValue(id, out var item))
            {
                if (item.Status == "Queued")
                {
                    item.Status = "Cancelled";
                    _downloadRepository.Save(item);
                    _ = BroadcastUpdateAsync(item);
                    return true;
                }
                else if (item.Status == "Downloading" && _ctsMap.TryGetValue(id, out var cts))
                {
                    cts.Cancel();
                    item.Status = "Cancelled";
                    _downloadRepository.Save(item);
                    _ = BroadcastUpdateAsync(item);
                    return true;
                }
            }
            return false;
        }

        public bool ClearHistory()
        {
            var finishedKeys = _allDownloads
                .Where(kv => kv.Value.Status == "Completed" || kv.Value.Status == "Failed" || kv.Value.Status == "Cancelled")
                .Select(kv => kv.Key)
                .ToList();

            foreach (var key in finishedKeys)
            {
                _allDownloads.TryRemove(key, out _);
            }

            _downloadRepository.ClearFinished();
            return true;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var settings = _settingsService.GetSettings();
                int maxConcurrency = settings.MaxConcurrentJobs > 0 ? settings.MaxConcurrentJobs : 5;

                int runningCount = _allDownloads.Values.Count(d => d.Status == "Downloading");

                if (runningCount < maxConcurrency && _pendingQueue.TryDequeue(out var item))
                {
                    if (item.Status == "Cancelled") continue;

                    var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                    _ctsMap[item.Id] = cts;

                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            item.Status = "Downloading";
                            _downloadRepository.Save(item);
                            await BroadcastUpdateAsync(item);

                            await _ytDlpService.ExecuteDownloadAsync(
                                item,
                                settings,
                                onProgress: async updatedItem =>
                                {
                                    await BroadcastUpdateAsync(updatedItem);
                                },
                                onLog: async logLine =>
                                {
                                    item.Logs.Add(logLine);
                                    if (item.Logs.Count > 200) item.Logs.RemoveAt(0);
                                    await BroadcastLogAsync(item.Id, logLine);
                                },
                                cts.Token
                            );
                        }
                        catch (OperationCanceledException)
                        {
                            item.Status = "Cancelled";
                        }
                        catch (Exception ex)
                        {
                            item.Status = "Failed";
                            item.Error = ex.Message;
                        }
                        finally
                        {
                            item.CompletedAt = DateTime.UtcNow;
                            _ctsMap.TryRemove(item.Id, out _);

                            if (item.Type == "ChannelSync")
                            {
                                var channels = _channelService.GetChannels();
                                var ch = channels.FirstOrDefault(c => c.Url.TrimEnd('/') == item.Url.TrimEnd('/') || c.Name == item.Title);
                                if (ch != null)
                                {
                                    _channelService.UpdateLastSynced(ch.Id);
                                }
                            }

                            if (item.Status == "Completed")
                            {
                                try
                                {
                                    _mediaService.InvalidateCache();
                                }
                                catch { }
                            }

                            _downloadRepository.Save(item);
                            await BroadcastUpdateAsync(item);
                        }
                    }, cts.Token);
                }

                await Task.Delay(500, stoppingToken);
            }
        }

        private async Task BroadcastUpdateAsync(DownloadItem item)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveDownloadProgress", item);
            }
            catch { }
        }

        private async Task BroadcastLogAsync(string downloadId, string logLine)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveDownloadLog", downloadId, logLine);
            }
            catch { }
        }
    }
}
