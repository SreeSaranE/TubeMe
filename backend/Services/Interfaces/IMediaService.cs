using System.Collections.Generic;
using System.Threading.Tasks;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services.Interfaces
{
    public interface IMediaService
    {
        Task<List<MediaVideoItem>> GetAllVideosAsync();
        Task<string?> GetThumbnailPathAsync(string relativePath);
        string? GetFullFilePath(string relativePath);
        string? GetSubtitleVttContent(string relativePath);
        bool DeleteMediaFile(string relativePath);
        void InvalidateCache();
    }
}
