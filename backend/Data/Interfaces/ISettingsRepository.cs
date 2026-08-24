using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Interfaces
{
    public interface ISettingsRepository
    {
        AppSettingsModel Get();
        void Save(AppSettingsModel settings);
    }
}
