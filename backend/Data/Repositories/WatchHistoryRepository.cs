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
            bool isCompleted = (duration > 0 && (currentTime / duration) >= 0.95);

            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    INSERT INTO watch_history (id, relative_path, title, channel_name, current_time, duration, is_completed, last_watched_at)
                    VALUES (@id, @relativePath, @title, @channelName, @currentTime, @duration, @isCompleted, datetime('now'))
                    ON CONFLICT(relative_path) DO UPDATE SET
                        id = @id,
                        current_time = @currentTime,
                        duration = CASE WHEN @duration > 0 THEN @duration ELSE duration END,
                        title = COALESCE(NULLIF(@title, ''), title),
                        channel_name = COALESCE(NULLIF(@channelName, ''), channel_name),
                        is_completed = CASE WHEN is_completed = 1 OR @isCompleted = 1 THEN 1 ELSE 0 END,
                        last_watched_at = datetime('now');";

                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@relativePath", normalizedRelPath);
                cmd.Parameters.AddWithValue("@title", (object?)title ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@channelName", (object?)channelName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@currentTime", currentTime);
                cmd.Parameters.AddWithValue("@duration", duration);
                cmd.Parameters.AddWithValue("@isCompleted", isCompleted ? 1 : 0);

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

        private static WatchHistoryItem MapFromReader(SqliteDataReader reader)
        {
            return new WatchHistoryItem
            {
                Id = reader.GetString(0),
                RelativePath = reader.GetString(1),
                Title = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                ChannelName = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                CurrentTime = reader.GetDouble(4),
                Duration = reader.GetDouble(5),
                IsCompleted = reader.GetInt32(6) == 1,
                LastWatchedAt = DateTime.TryParse(reader.GetString(7), out var dt) ? dt : DateTime.UtcNow
            };
        }

        private static string GetMd5Hash(string input)
        {
            using var md5 = MD5.Create();
            byte[] bytes = md5.ComputeHash(Encoding.UTF8.GetBytes(input.ToLowerInvariant()));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
