using System.Collections.Generic;
using System.Threading.Tasks;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services.Interfaces
{
    public interface IChannelService
    {
        List<ChannelModel> GetChannels();
        Task<ChannelModel> AddChannelAsync(string url, string category = "General");
        bool RemoveChannel(string id);
        Task RefreshAllMetadataAsync();
        Task FetchChannelMetadataAsync(ChannelModel channel);
        void UpdateLastSynced(string channelId);
        void SetIsSyncing(string channelId, bool isSyncing);
        void UpdateCategory(string channelId, string category);
        List<string> GetCategories();
    }
}
