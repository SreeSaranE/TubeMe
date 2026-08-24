using System;
using Microsoft.Data.Sqlite;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Repositories
{
    public class SettingsRepository : ISettingsRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly object _lock = new();

        public SettingsRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public AppSettingsModel Get()
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT output_dir, data_dir, archive_file, channels_file, default_resolution, include_subtitles, subtitle_langs, days_limit, max_concurrent_jobs, concurrent_fragments FROM settings WHERE id = 1 LIMIT 1;";

                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new AppSettingsModel
                    {
                        OutputDir = reader.GetString(0),
                        DataDir = reader.GetString(1),
                        ArchiveFile = reader.GetString(2),
                        ChannelsFile = reader.GetString(3),
                        DefaultResolution = reader.GetString(4),
                        IncludeSubtitles = reader.GetInt32(5) == 1,
                        SubtitleLangs = reader.GetString(6),
                        DaysLimit = reader.GetInt32(7),
                        MaxConcurrentJobs = reader.GetInt32(8),
                        ConcurrentFragments = reader.GetInt32(9),
                    };
                }

                return new AppSettingsModel();
            }
        }

        public void Save(AppSettingsModel settings)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO settings (id, output_dir, data_dir, archive_file, channels_file, default_resolution, include_subtitles, subtitle_langs, days_limit, max_concurrent_jobs, concurrent_fragments)
                    VALUES (1, @outputDir, @dataDir, @archiveFile, @channelsFile, @defaultResolution, @includeSubtitles, @subtitleLangs, @daysLimit, @maxConcurrentJobs, @concurrentFragments)
                    ON CONFLICT(id) DO UPDATE SET
                        output_dir = excluded.output_dir,
                        data_dir = excluded.data_dir,
                        archive_file = excluded.archive_file,
                        channels_file = excluded.channels_file,
                        default_resolution = excluded.default_resolution,
                        include_subtitles = excluded.include_subtitles,
                        subtitle_langs = excluded.subtitle_langs,
                        days_limit = excluded.days_limit,
                        max_concurrent_jobs = excluded.max_concurrent_jobs,
                        concurrent_fragments = excluded.concurrent_fragments;";

                cmd.Parameters.AddWithValue("@outputDir", settings.OutputDir);
                cmd.Parameters.AddWithValue("@dataDir", settings.DataDir);
                cmd.Parameters.AddWithValue("@archiveFile", settings.ArchiveFile);
                cmd.Parameters.AddWithValue("@channelsFile", settings.ChannelsFile);
                cmd.Parameters.AddWithValue("@defaultResolution", settings.DefaultResolution);
                cmd.Parameters.AddWithValue("@includeSubtitles", settings.IncludeSubtitles ? 1 : 0);
                cmd.Parameters.AddWithValue("@subtitleLangs", settings.SubtitleLangs);
                cmd.Parameters.AddWithValue("@daysLimit", settings.DaysLimit);
                cmd.Parameters.AddWithValue("@maxConcurrentJobs", settings.MaxConcurrentJobs);
                cmd.Parameters.AddWithValue("@concurrentFragments", settings.ConcurrentFragments);

                cmd.ExecuteNonQuery();
            }
        }
    }
}
