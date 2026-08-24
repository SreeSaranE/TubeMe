using System.Collections.Generic;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services.Interfaces
{
    public interface IMediaFileService
    {
        List<FileInfoItem> GetMediaFiles(string? subDir);
    }
}
