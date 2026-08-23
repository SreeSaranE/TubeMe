using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services
{
    public class ChannelService
    {
        private readonly SettingsService _settingsService;
        private readonly YtDlpService _ytDlpService;
        private readonly string _channelsJsonPath;
        private readonly string _avatarsDir;
        private readonly object _lock = new();
        private List<ChannelModel> _channels = new();

        public ChannelService(SettingsService settingsService, YtDlpService ytDlpService)
        {
            _settingsService = settingsService;
            _ytDlpService = ytDlpService;
            var settings = _settingsService.GetSettings();

            _channelsJsonPath = Path.Combine(settings.DataDir, "channels.json");
            _avatarsDir = Path.Combine(settings.DataDir, "ChannelPhotos");
            Directory.CreateDirectory(_avatarsDir);

            LoadChannels();
        }

        private void LoadChannels()
        {
            lock (_lock)
            {
                if (File.Exists(_channelsJsonPath))
                {
                    try
                    {
                        string json = File.ReadAllText(_channelsJsonPath);
                        _channels = JsonSerializer.Deserialize<List<ChannelModel>>(json) ?? new List<ChannelModel>();
                        return;
                    }
                    catch { }
                }

                // Fallback to channels.txt if channels.json does not exist
                var settings = _settingsService.GetSettings();
                if (File.Exists(settings.ChannelsFile))
                {
                    var lines = File.ReadAllLines(settings.ChannelsFile);
                    foreach (var line in lines)
                    {
                        var trimmed = line.Trim();
                        if (!string.IsNullOrWhiteSpace(trimmed) && !trimmed.StartsWith("#"))
                        {
                            var id = GetChannelIdFromUrl(trimmed);
                            _channels.Add(new ChannelModel
                            {
                                Id = id,
                                Url = trimmed,
                                Name = ExtractHandleFromUrl(trimmed),
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                    SaveChannelsInternal();
                }
            }
        }

        public List<ChannelModel> GetChannels()
        {
            lock (_lock)
            {
                return _channels.ToList();
            }
        }

        public async Task<ChannelModel> AddChannelAsync(string url)
        {
            string cleanUrl = url.Trim();
            if (cleanUrl.EndsWith("/videos")) cleanUrl = cleanUrl.Substring(0, cleanUrl.Length - 7);
            if (cleanUrl.EndsWith("/")) cleanUrl = cleanUrl.TrimEnd('/');

            string id = GetChannelIdFromUrl(cleanUrl);

            lock (_lock)
            {
                var existing = _channels.FirstOrDefault(c => c.Id == id || c.Url.Equals(cleanUrl, StringComparison.OrdinalIgnoreCase));
                if (existing != null) return existing;
            }

            var channel = new ChannelModel
            {
                Id = id,
                Url = cleanUrl,
                Name = ExtractHandleFromUrl(cleanUrl),
                CreatedAt = DateTime.UtcNow
            };

            lock (_lock)
            {
                _channels.Add(channel);
                SaveChannelsInternal();
            }

            // Fetch channel metadata and avatar asynchronously in background
            _ = Task.Run(async () =>
            {
                await FetchChannelMetadataAsync(channel);
            });

            return channel;
        }

        public bool RemoveChannel(string id)
        {
            lock (_lock)
            {
                var channel = _channels.FirstOrDefault(c => c.Id == id);
                if (channel != null)
                {
                    _channels.Remove(channel);
                    SaveChannelsInternal();
                    return true;
                }
                return false;
            }
        }

        public async Task RefreshAllMetadataAsync()
        {
            List<ChannelModel> channelsCopy;
            lock (_lock)
            {
                channelsCopy = _channels.ToList();
            }

            foreach (var channel in channelsCopy)
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
                    lock (_lock)
                    {
                        if (!string.IsNullOrEmpty(info.Name)) channel.Name = info.Name;
                        if (!string.IsNullOrEmpty(info.AvatarUrl)) channel.AvatarUrl = info.AvatarUrl;
                        SaveChannelsInternal();
                    }
                }
            }
            catch { }
        }

        public void UpdateLastSynced(string channelId)
        {
            lock (_lock)
            {
                var ch = _channels.FirstOrDefault(c => c.Id == channelId);
                if (ch != null)
                {
                    ch.LastSyncedAt = DateTime.UtcNow;
                    ch.IsSyncing = false;
                    SaveChannelsInternal();
                }
            }
        }

        public void SetIsSyncing(string channelId, bool isSyncing)
        {
            lock (_lock)
            {
                var ch = _channels.FirstOrDefault(c => c.Id == channelId);
                if (ch != null)
                {
                    ch.IsSyncing = isSyncing;
                    SaveChannelsInternal();
                }
            }
        }

        private void SaveChannelsInternal()
        {
            try
            {
                string json = JsonSerializer.Serialize(_channels, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_channelsJsonPath, json);

                // Also update channels.txt for compatibility
                var settings = _settingsService.GetSettings();
                var lines = _channels.Select(c => c.Url).ToList();
                File.WriteAllLines(settings.ChannelsFile, lines);
            }
            catch { }
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
