using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.Sqlite;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Repositories
{
    public class WatchHistoryRepository : IWatchHistoryRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly object _lock = new();

        public WatchHistoryRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public void Upsert(string relativePath, string? title, string? channelName, double currentTime, double duration)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return;

            string normalizedRelPath = relativePath.Trim().Replace('\\', '/');
            string id = GetMd5Hash(normalizedRelPath);
            bool isCompleted = (duration > 0 && (currentTime / duration) >= 0.95) || currentTime >= 99999;

            // Strictly only store in watch history if video is completed (>= 95%) or explicitly marked watched
            if (!isCompleted)
            {
                return;
            }

            double effectiveDuration = 600;
            if (duration > 0 && duration < 999990)
            {
                effectiveDuration = duration;
            }
            else if (currentTime > 0 && currentTime < 999990)
            {
                effectiveDuration = currentTime;
            }

            string effectiveChannel = !string.IsNullOrWhiteSpace(channelName) ? channelName.Trim() : "Local Media";

            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    INSERT INTO watch_history (id, relative_path, title, channel_name, current_time, duration, is_completed, last_watched_at)
                    VALUES (@id, @relativePath, @title, @channelName, @currentTime, @duration, 1, datetime('now'))
                    ON CONFLICT(relative_path) DO UPDATE SET
                        id = @id,
                        current_time = @currentTime,
                        duration = CASE WHEN @duration > 0 THEN @duration ELSE duration END,
                        title = COALESCE(NULLIF(@title, ''), title),
                        channel_name = COALESCE(NULLIF(@channelName, ''), channel_name),
                        is_completed = 1,
                        last_watched_at = datetime('now');

                    INSERT INTO watch_time_ledger (id, video_identifier, title, channel_name, duration_seconds, logged_at)
                    VALUES (@id, @relativePath, @title, @channelName, @effectiveDuration, datetime('now'))
                    ON CONFLICT(video_identifier) DO UPDATE SET
                        duration_seconds = CASE WHEN @effectiveDuration > 0 THEN @effectiveDuration ELSE watch_time_ledger.duration_seconds END,
                        title = COALESCE(NULLIF(@title, ''), watch_time_ledger.title),
                        channel_name = COALESCE(NULLIF(@channelName, ''), watch_time_ledger.channel_name),
                        logged_at = datetime('now');";

                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@relativePath", normalizedRelPath);
                cmd.Parameters.AddWithValue("@title", (object?)title ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@channelName", (object?)effectiveChannel ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@currentTime", currentTime);
                cmd.Parameters.AddWithValue("@duration", duration);
                cmd.Parameters.AddWithValue("@effectiveDuration", effectiveDuration);

                cmd.ExecuteNonQuery();
            }
        }

        public WatchHistoryItem? GetByRelativePath(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return null;
            string normalizedRelPath = relativePath.Trim().Replace('\\', '/');
            string id = GetMd5Hash(normalizedRelPath);

            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    SELECT id, relative_path, title, channel_name, current_time, duration, is_completed, last_watched_at 
                    FROM watch_history 
                    WHERE id = @id 
                       OR LOWER(relative_path) = LOWER(@normalizedRelPath) 
                       OR relative_path = @normalizedRelPath
                    LIMIT 1;";
                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@normalizedRelPath", normalizedRelPath);

                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return MapFromReader(reader);
                }
                return null;
            }
        }

        public List<WatchHistoryItem> GetAll()
        {
            lock (_lock)
            {
                var list = new List<WatchHistoryItem>();
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = "SELECT id, relative_path, title, channel_name, current_time, duration, is_completed, last_watched_at FROM watch_history ORDER BY last_watched_at DESC;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(MapFromReader(reader));
                }

                return list;
            }
        }

        public Dictionary<string, WatchHistoryItem> GetAllMap()
        {
            lock (_lock)
            {
                var map = new Dictionary<string, WatchHistoryItem>(StringComparer.OrdinalIgnoreCase);
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = "SELECT id, relative_path, title, channel_name, current_time, duration, is_completed, last_watched_at FROM watch_history;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    var item = MapFromReader(reader);
                    map[item.RelativePath.Replace('\\', '/')] = item;
                }

                return map;
            }
        }

        public bool Delete(string idOrPath)
        {
            if (string.IsNullOrWhiteSpace(idOrPath)) return false;
            string normalizedRelPath = idOrPath.Trim().Replace('\\', '/');
            string hash1 = GetMd5Hash(normalizedRelPath);
            string hash2 = GetMd5Hash(idOrPath.Trim());

            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    DELETE FROM watch_history 
                    WHERE id = @idOrPath 
                       OR id = @hash1 
                       OR id = @hash2 
                       OR LOWER(relative_path) = LOWER(@normalizedRelPath) 
                       OR relative_path = @idOrPath 
                       OR relative_path = @normalizedRelPath;";
                cmd.Parameters.AddWithValue("@idOrPath", idOrPath.Trim());
                cmd.Parameters.AddWithValue("@hash1", hash1);
                cmd.Parameters.AddWithValue("@hash2", hash2);
                cmd.Parameters.AddWithValue("@normalizedRelPath", normalizedRelPath);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public void ClearAll()
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = "DELETE FROM watch_history;";
                cmd.ExecuteNonQuery();
            }
        }

        public double GetTotalLifetimeWatchTimeSeconds()
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = "SELECT COALESCE(SUM(duration_seconds), 0) FROM watch_time_ledger;";
                var result = cmd.ExecuteScalar();
                if (result != null && double.TryParse(result.ToString(), out var seconds))
                {
                    return seconds;
                }
                return 0;
            }
        }

        public Dictionary<string, double> GetChannelWatchTimeMap()
        {
            lock (_lock)
            {
                var map = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    SELECT COALESCE(NULLIF(channel_name, ''), 'Local Media') AS channel, 
                           SUM(duration_seconds) AS total_seconds 
                    FROM watch_time_ledger 
                    GROUP BY channel;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    string channel = reader.GetString(0).Trim();
                    double seconds = reader.IsDBNull(1) ? 0 : Convert.ToDouble(reader.GetValue(1));
                    map[channel] = seconds;
                }

                return map;
            }
        }

        public Dictionary<string, int> GetChannelWatchedCountMap()
        {
            lock (_lock)
            {
                var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    SELECT COALESCE(NULLIF(channel_name, ''), 'Local Media') AS channel, 
                           COUNT(*) AS watched_count 
                    FROM watch_time_ledger 
                    GROUP BY channel;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    string channel = reader.GetString(0).Trim();
                    int count = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1));
                    map[channel] = count;
                }

                return map;
            }
        }

        public List<WatchTimeLedgerItem> GetAllLedgerItems()
        {
            lock (_lock)
            {
                var list = new List<WatchTimeLedgerItem>();
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = "SELECT id, video_identifier, title, channel_name, duration_seconds, logged_at FROM watch_time_ledger ORDER BY logged_at DESC;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new WatchTimeLedgerItem
                    {
                        Id = reader.GetString(0),
                        VideoIdentifier = reader.GetString(1),
                        Title = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                        ChannelName = reader.IsDBNull(3) ? "Local Media" : reader.GetString(3),
                        DurationSeconds = reader.IsDBNull(4) ? 0 : Convert.ToDouble(reader.GetValue(4)),
                        LoggedAt = DateTime.TryParse(reader.GetString(5), out var dt) ? dt : DateTime.UtcNow
                    });
                }

                return list;
            }
        }

        private static WatchHistoryItem MapFromReader(SqliteDataReader reader)
        {
            double currentTime = 0;
            try
            {
                if (!reader.IsDBNull(4))
                {
                    var val = reader.GetValue(4);
                    if (val is double d) currentTime = d;
                    else if (val is long l) currentTime = l;
                    else if (double.TryParse(val.ToString(), out var parsed)) currentTime = parsed;
                    else if (val is string s && s.Contains(':')) currentTime = ParseDurationStringToSeconds(s);
                }
            }
            catch { }

            double duration = 0;
            try
            {
                if (!reader.IsDBNull(5))
                {
                    var val = reader.GetValue(5);
                    if (val is double d) duration = d;
                    else if (val is long l) duration = l;
                    else if (double.TryParse(val.ToString(), out var parsed)) duration = parsed;
                    else if (val is string s && s.Contains(':')) duration = ParseDurationStringToSeconds(s);
                }
            }
            catch { }

            return new WatchHistoryItem
            {
                Id = reader.GetString(0),
                RelativePath = reader.GetString(1),
                Title = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                ChannelName = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                CurrentTime = currentTime,
                Duration = duration,
                IsCompleted = true,
                LastWatchedAt = DateTime.TryParse(reader.GetString(7), out var dt) ? dt : DateTime.UtcNow
            };
        }

        private static double ParseDurationStringToSeconds(string durationStr)
        {
            if (string.IsNullOrWhiteSpace(durationStr)) return 0;
            var parts = durationStr.Split(':');
            if (parts.Length == 2 && double.TryParse(parts[0], out var m) && double.TryParse(parts[1], out var s))
            {
                return (m * 60) + s;
            }
            if (parts.Length == 3 && double.TryParse(parts[0], out var h) && double.TryParse(parts[1], out var min) && double.TryParse(parts[2], out var sec))
            {
                return (h * 3600) + (min * 60) + sec;
            }
            return 0;
        }

        private static string GetMd5Hash(string input)
        {
            using var md5 = MD5.Create();
            byte[] bytes = md5.ComputeHash(Encoding.UTF8.GetBytes(input.ToLowerInvariant()));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
