using System.IO;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class SettingsService : ISettingsService
    {
        private readonly ISettingsRepository _settingsRepository;

        public SettingsService(ISettingsRepository settingsRepository)
        {
            _settingsRepository = settingsRepository;
            var settings = _settingsRepository.Get();

            // Ensure media directory and archive tracking file exist
            Directory.CreateDirectory(settings.DataDir);
            Directory.CreateDirectory(settings.OutputDir);

            if (!File.Exists(settings.ArchiveFile))
            {
                string? dir = Path.GetDirectoryName(settings.ArchiveFile);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                File.WriteAllText(settings.ArchiveFile, "");
            }
        }

        public AppSettingsModel GetSettings()
        {
            return _settingsRepository.Get();
        }

        public void SaveSettings(AppSettingsModel newSettings)
        {
            Directory.CreateDirectory(newSettings.OutputDir);
            Directory.CreateDirectory(newSettings.DataDir);

            _settingsRepository.Save(newSettings);
        }
    }
}
