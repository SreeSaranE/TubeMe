using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services.Interfaces
{
    public interface IYtDlpService
    {
        Task<List<SearchResultItem>> SearchAsync(string query, int maxResults = 12);
        Task<YtDlpChannelMetadata?> GetChannelMetadataAsync(string channelUrl, string avatarsDir);
        Task ExecuteDownloadAsync(
            DownloadItem item,
            AppSettingsModel settings,
            Action<DownloadItem> onProgress,
            Action<string> onLog,
            CancellationToken cancellationToken);
    }
}
