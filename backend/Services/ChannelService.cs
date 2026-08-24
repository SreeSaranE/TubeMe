using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class ChannelService : IChannelService
    {
        private readonly IChannelRepository _channelRepository;
        private readonly ISettingsService _settingsService;
        private readonly IYtDlpService _ytDlpService;
        private readonly string _avatarsDir;

        public ChannelService(
            IChannelRepository channelRepository,
            ISettingsService settingsService,
            IYtDlpService ytDlpService)
        {
            _channelRepository = channelRepository;
            _settingsService = settingsService;
            _ytDlpService = ytDlpService;

            var settings = _settingsService.GetSettings();
            _avatarsDir = Path.Combine(settings.DataDir, "ChannelPhotos");
            Directory.CreateDirectory(_avatarsDir);
        }

        public List<ChannelModel> GetChannels()
        {
            return _channelRepository.GetAll();
        }

        public async Task<ChannelModel> AddChannelAsync(string url)
        {
            string cleanUrl = url.Trim();
            if (cleanUrl.EndsWith("/videos")) cleanUrl = cleanUrl.Substring(0, cleanUrl.Length - 7);
            if (cleanUrl.EndsWith("/")) cleanUrl = cleanUrl.TrimEnd('/');

            string id = GetChannelIdFromUrl(cleanUrl);

            var existing = _channelRepository.GetById(id);
            if (existing != null) return existing;

            var channel = new ChannelModel
            {
                Id = id,
                Url = cleanUrl,
                Name = ExtractHandleFromUrl(cleanUrl),
                CreatedAt = DateTime.UtcNow
            };

            _channelRepository.Upsert(channel);

            // Fetch channel metadata and avatar asynchronously in background
            _ = Task.Run(async () =>
            {
                await FetchChannelMetadataAsync(channel);
            });

            return channel;
        }

        public bool RemoveChannel(string id)
        {
            return _channelRepository.Delete(id);
        }

        public async Task RefreshAllMetadataAsync()
        {
            var channels = _channelRepository.GetAll();
            foreach (var channel in channels)
            {
                await FetchChannelMetadataAsync(channel);
            }
        }

        public async Task FetchChannelMetadataAsync(ChannelModel channel)
        {
            try
            {
                var info = await _ytDlpService.GetChannelMetadataAsync(channel.Url, _avatarsDir);
                if (info != null)
                {
                    if (!string.IsNullOrEmpty(info.Name)) channel.Name = info.Name;
                    if (!string.IsNullOrEmpty(info.AvatarUrl)) channel.AvatarUrl = info.AvatarUrl;
                    _channelRepository.Upsert(channel);
                }
            }
            catch { }
        }

        public void UpdateLastSynced(string channelId)
        {
            _channelRepository.UpdateSyncState(channelId, false, DateTime.UtcNow);
        }

        public void SetIsSyncing(string channelId, bool isSyncing)
        {
            _channelRepository.UpdateSyncState(channelId, isSyncing);
        }

        private static string GetChannelIdFromUrl(string url)
        {
            using var md5 = MD5.Create();
            byte[] inputBytes = Encoding.UTF8.GetBytes(url.ToLowerInvariant());
            byte[] hashBytes = md5.ComputeHash(inputBytes);
            return Convert.ToHexString(hashBytes).Substring(0, 12).ToLowerInvariant();
        }

        private static string ExtractHandleFromUrl(string url)
        {
            Uri uri;
            if (Uri.TryCreate(url, UriKind.Absolute, out uri!))
            {
                var path = uri.AbsolutePath.Trim('/');
                if (path.StartsWith("@")) return path;
                var parts = path.Split('/');
                if (parts.Length > 0 && !string.IsNullOrWhiteSpace(parts[0])) return parts[0];
            }
            return url;
        }
    }
}
