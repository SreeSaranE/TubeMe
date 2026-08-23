using System;
using System.IO;
using System.Text.Json;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Services
{
    public class SettingsService
    {
        private readonly string _settingsFilePath;
        private AppSettingsModel _settings;
        private readonly object _lock = new();

        public SettingsService()
        {
            // Determine default directory paths based on environment
            string dataDir = Environment.GetEnvironmentVariable("DATA_DIR") 
                ?? Path.Combine(Directory.GetCurrentDirectory(), "data");
            string outputDir = Environment.GetEnvironmentVariable("OUTPUT_DIR") 
                ?? Path.Combine(Directory.GetCurrentDirectory(), "downloads");

            Directory.CreateDirectory(dataDir);
            Directory.CreateDirectory(outputDir);

            _settingsFilePath = Path.Combine(dataDir, "settings.json");

            if (File.Exists(_settingsFilePath))
            {
                try
                {
                    string json = File.ReadAllText(_settingsFilePath);
                    _settings = JsonSerializer.Deserialize<AppSettingsModel>(json) ?? new AppSettingsModel();
                }
                catch
                {
                    _settings = new AppSettingsModel();
                }
            }
            else
            {
                _settings = new AppSettingsModel
                {
                    DataDir = dataDir,
                    OutputDir = outputDir,
                    ArchiveFile = Path.Combine(dataDir, "archives.txt"),
                    ChannelsFile = Path.Combine(dataDir, "channels.txt")
                };
                SaveSettings(_settings);
            }

            // Ensure archive file exists
            if (!File.Exists(_settings.ArchiveFile))
            {
                string? dir = Path.GetDirectoryName(_settings.ArchiveFile);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                File.WriteAllText(_settings.ArchiveFile, "");
            }
        }

        public AppSettingsModel GetSettings()
        {
            lock (_lock)
            {
                return _settings;
            }
        }

        public void SaveSettings(AppSettingsModel newSettings)
        {
            lock (_lock)
            {
                _settings = newSettings;
                Directory.CreateDirectory(Path.GetDirectoryName(_settingsFilePath)!);
                Directory.CreateDirectory(_settings.OutputDir);
                Directory.CreateDirectory(_settings.DataDir);

                string json = JsonSerializer.Serialize(_settings, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_settingsFilePath, json);
            }
        }
    }
}
