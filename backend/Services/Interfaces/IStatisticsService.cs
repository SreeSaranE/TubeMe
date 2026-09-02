using System.Threading.Tasks;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services.Interfaces
{
    public interface IStatisticsService
    {
        Task<AppStatisticsModel> GetStatisticsAsync();
    }
}
