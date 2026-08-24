using System.Collections.Generic;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Interfaces
{
    public interface IDownloadRepository
    {
        List<DownloadItem> GetAll();
        DownloadItem? GetById(string id);
        void Save(DownloadItem item);
        void ClearFinished();
    }
}
