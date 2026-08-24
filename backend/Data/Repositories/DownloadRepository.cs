using System;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Repositories
{
    public class DownloadRepository : IDownloadRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly object _lock = new();

        public DownloadRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public List<DownloadItem> GetAll()
        {
            lock (_lock)
            {
                var list = new List<DownloadItem>();
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT id, url, title, uploader, thumbnail, format, resolution, type, status, progress_percentage, download_speed, eta, error, logs, created_at, completed_at FROM downloads ORDER BY created_at DESC;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    var item = new DownloadItem
                    {
                        Id = reader.GetString(0),
                        Url = reader.GetString(1),
                        Title = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                        Uploader = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                        Thumbnail = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                        Format = reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                        Resolution = reader.IsDBNull(6) ? string.Empty : reader.GetString(6),
                        Type = reader.IsDBNull(7) ? "Video" : reader.GetString(7),
                        Status = reader.IsDBNull(8) ? "Queued" : reader.GetString(8),
                        ProgressPercentage = reader.IsDBNull(9) ? 0 : reader.GetDouble(9),
                        DownloadSpeed = reader.IsDBNull(10) ? string.Empty : reader.GetString(10),
                        Eta = reader.IsDBNull(11) ? string.Empty : reader.GetString(11),
                        Error = reader.IsDBNull(12) ? string.Empty : reader.GetString(12),
                        CreatedAt = DateTime.Parse(reader.GetString(14)),
                        CompletedAt = reader.IsDBNull(15) ? null : DateTime.Parse(reader.GetString(15))
                    };

                    if (!reader.IsDBNull(13))
                    {
                        try
                        {
                            item.Logs = JsonSerializer.Deserialize<List<string>>(reader.GetString(13)) ?? new List<string>();
                        }
                        catch { }
                    }

                    list.Add(item);
                }

                return list;
            }
        }

        public DownloadItem? GetById(string id)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT id, url, title, uploader, thumbnail, format, resolution, type, status, progress_percentage, download_speed, eta, error, logs, created_at, completed_at FROM downloads WHERE id = @id LIMIT 1;";
                cmd.Parameters.AddWithValue("@id", id);

                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    var item = new DownloadItem
                    {
                        Id = reader.GetString(0),
                        Url = reader.GetString(1),
                        Title = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                        Uploader = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                        Thumbnail = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                        Format = reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                        Resolution = reader.IsDBNull(6) ? string.Empty : reader.GetString(6),
                        Type = reader.IsDBNull(7) ? "Video" : reader.GetString(7),
                        Status = reader.IsDBNull(8) ? "Queued" : reader.GetString(8),
                        ProgressPercentage = reader.IsDBNull(9) ? 0 : reader.GetDouble(9),
                        DownloadSpeed = reader.IsDBNull(10) ? string.Empty : reader.GetString(10),
                        Eta = reader.IsDBNull(11) ? string.Empty : reader.GetString(11),
                        Error = reader.IsDBNull(12) ? string.Empty : reader.GetString(12),
                        CreatedAt = DateTime.Parse(reader.GetString(14)),
                        CompletedAt = reader.IsDBNull(15) ? null : DateTime.Parse(reader.GetString(15))
                    };

                    if (!reader.IsDBNull(13))
                    {
                        try
                        {
                            item.Logs = JsonSerializer.Deserialize<List<string>>(reader.GetString(13)) ?? new List<string>();
                        }
                        catch { }
                    }

                    return item;
                }

                return null;
            }
        }

        public void Save(DownloadItem item)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO downloads (id, url, title, uploader, thumbnail, format, resolution, type, status, progress_percentage, download_speed, eta, error, logs, created_at, completed_at)
                    VALUES (@id, @url, @title, @uploader, @thumbnail, @format, @resolution, @type, @status, @progress, @speed, @eta, @error, @logs, @createdAt, @completedAt)
                    ON CONFLICT(id) DO UPDATE SET
                        title = excluded.title,
                        uploader = excluded.uploader,
                        thumbnail = excluded.thumbnail,
                        format = excluded.format,
                        resolution = excluded.resolution,
                        status = excluded.status,
                        progress_percentage = excluded.progress_percentage,
                        download_speed = excluded.download_speed,
                        eta = excluded.eta,
                        error = excluded.error,
                        logs = excluded.logs,
                        completed_at = excluded.completed_at;";

                cmd.Parameters.AddWithValue("@id", item.Id);
                cmd.Parameters.AddWithValue("@url", item.Url);
                cmd.Parameters.AddWithValue("@title", (object?)item.Title ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@uploader", (object?)item.Uploader ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@thumbnail", (object?)item.Thumbnail ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@format", (object?)item.Format ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@resolution", (object?)item.Resolution ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@type", (object?)item.Type ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@status", (object?)item.Status ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@progress", item.ProgressPercentage);
                cmd.Parameters.AddWithValue("@speed", (object?)item.DownloadSpeed ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@eta", (object?)item.Eta ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@error", (object?)item.Error ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@logs", JsonSerializer.Serialize(item.Logs));
                cmd.Parameters.AddWithValue("@createdAt", item.CreatedAt.ToString("o"));
                cmd.Parameters.AddWithValue("@completedAt", item.CompletedAt.HasValue ? (object)item.CompletedAt.Value.ToString("o") : DBNull.Value);

                cmd.ExecuteNonQuery();
            }
        }

        public void ClearFinished()
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "DELETE FROM downloads WHERE status IN ('Completed', 'Failed', 'Cancelled');";
                cmd.ExecuteNonQuery();
            }
        }
    }
}
