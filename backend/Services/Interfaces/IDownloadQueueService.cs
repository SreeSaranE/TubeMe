using System.Collections.Generic;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services.Interfaces
{
    public interface IDownloadQueueService
    {
        DownloadItem EnqueueDownload(StartDownloadRequest req);
        List<DownloadItem> EnqueueChannelSync(ChannelSyncRequest req);
        List<DownloadItem> GetAllDownloads();
        DownloadItem? GetDownload(string id);
        bool CancelDownload(string id);
        bool ClearHistory();
    }
}
