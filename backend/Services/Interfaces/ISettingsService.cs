using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services.Interfaces
{
    public interface ISettingsService
    {
        AppSettingsModel GetSettings();
        void SaveSettings(AppSettingsModel newSettings);
    }
}
