using System;
using System.Collections.Generic;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Interfaces
{
    public interface IChannelRepository
    {
        List<ChannelModel> GetAll();
        ChannelModel? GetById(string id);
        void Upsert(ChannelModel channel);
        bool Delete(string id);
        void UpdateSyncState(string channelId, bool isSyncing, DateTime? lastSyncedAt = null);
        void UpdateCategory(string channelId, string category);
        List<string> GetCategories();
    }
}
