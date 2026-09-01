using System;
using System.Collections.Generic;
using Microsoft.Data.Sqlite;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Repositories
{
    public class PlaylistRepository : IPlaylistRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly object _lock = new();

        public PlaylistRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public List<PlaylistModel> GetAllPlaylists()
        {
            lock (_lock)
            {
                var list = new List<PlaylistModel>();
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    SELECT 
                        p.id,
                        p.name,
                        p.description,
                        COUNT(pv.id) AS video_count,
                        (
                            SELECT pv2.thumbnail_url 
                            FROM playlist_videos pv2 
                            WHERE pv2.playlist_id = p.id AND pv2.thumbnail_url IS NOT NULL AND pv2.thumbnail_url != ''
                            ORDER BY pv2.position ASC, pv2.added_at DESC 
                            LIMIT 1
                        ) AS cover_thumbnail,
                        p.created_at,
                        p.updated_at
                    FROM playlists p
                    LEFT JOIN playlist_videos pv ON pv.playlist_id = p.id
                    GROUP BY p.id
                    ORDER BY 
                        CASE WHEN LOWER(p.name) = 'favorites' THEN 0 
                             WHEN LOWER(p.name) = 'watch later' THEN 1 
                             ELSE 2 END,
                        p.name ASC;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new PlaylistModel
                    {
                        Id = reader.GetString(0),
                        Name = reader.GetString(1),
                        Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                        VideoCount = reader.GetInt32(3),
                        CoverThumbnailUrl = reader.IsDBNull(4) ? null : reader.GetString(4),
                        CreatedAt = DateTime.TryParse(reader.GetString(5), out var cat) ? cat : DateTime.UtcNow,
                        UpdatedAt = DateTime.TryParse(reader.GetString(6), out var uat) ? uat : DateTime.UtcNow,
                    });
                }

                return list;
            }
        }

        public PlaylistDetailModel? GetPlaylistById(string id)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                
                PlaylistDetailModel? detail = null;
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = @"
                        SELECT id, name, description, created_at, updated_at
                        FROM playlists
                        WHERE id = @id OR LOWER(name) = LOWER(@id);";
                    cmd.Parameters.AddWithValue("@id", id);

                    using var reader = cmd.ExecuteReader();
                    if (reader.Read())
                    {
                        detail = new PlaylistDetailModel
                        {
                            Id = reader.GetString(0),
                            Name = reader.GetString(1),
                            Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                            CreatedAt = DateTime.TryParse(reader.GetString(3), out var cat) ? cat : DateTime.UtcNow,
                            UpdatedAt = DateTime.TryParse(reader.GetString(4), out var uat) ? uat : DateTime.UtcNow,
                        };
                    }
                }

                if (detail == null) return null;

                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = @"
                        SELECT 
                            pv.id, 
                            pv.playlist_id, 
                            pv.relative_path, 
                            pv.video_title, 
                            pv.channel_name, 
                            pv.duration, 
                            pv.thumbnail_url, 
                            pv.position, 
                            pv.added_at,
                            COALESCE(wh.is_completed, 0) AS is_completed,
                            wh.current_time,
                            wh.duration AS wh_duration
                        FROM playlist_videos pv
                        LEFT JOIN watch_history wh ON (
                            wh.relative_path = pv.relative_path 
                            OR LOWER(wh.relative_path) = LOWER(pv.relative_path)
                            OR wh.relative_path = replace(pv.relative_path, '\', '/')
                            OR wh.relative_path = replace(pv.relative_path, '/', '\')
                        )
                        WHERE pv.playlist_id = @pid
                        ORDER BY pv.position ASC, pv.added_at DESC;";
                    cmd.Parameters.AddWithValue("@pid", detail.Id);

                    using var reader = cmd.ExecuteReader();
                    while (reader.Read())
                    {
                        bool isCompleted = reader.GetInt32(9) == 1;
                        double? progressPct = null;
                        if (!reader.IsDBNull(10) && !reader.IsDBNull(11))
                        {
                            double curTime = reader.GetDouble(10);
                            double dur = reader.GetDouble(11);
                            if (dur > 0)
                            {
                                progressPct = Math.Min(100.0, (curTime / dur) * 100.0);
                                if (curTime / dur >= 0.95)
                                {
                                    isCompleted = true;
                                }
                            }
                        }
                        if (isCompleted && (progressPct == null || progressPct < 100.0))
                        {
                            progressPct = 100.0;
                        }

                        detail.Videos.Add(new PlaylistVideoItem
                        {
                            Id = reader.GetString(0),
                            PlaylistId = reader.GetString(1),
                            RelativePath = reader.GetString(2),
                            VideoTitle = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                            ChannelName = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                            Duration = reader.IsDBNull(5) ? null : reader.GetString(5),
                            ThumbnailUrl = reader.IsDBNull(6) ? null : reader.GetString(6),
                            Position = reader.GetInt32(7),
                            AddedAt = DateTime.TryParse(reader.GetString(8), out var aat) ? aat : DateTime.UtcNow,
                            IsCompleted = isCompleted,
                            WatchProgressPercentage = progressPct
                        });
                    }
                }

                detail.VideoCount = detail.Videos.Count;
                if (detail.Videos.Count > 0)
                {
                    detail.CoverThumbnailUrl = detail.Videos[0].ThumbnailUrl;
                }

                return detail;
            }
        }

        public PlaylistModel? CreatePlaylist(string name, string? description)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                string id = Guid.NewGuid().ToString("N");
                string now = DateTime.UtcNow.ToString("o");

                cmd.CommandText = @"
                    INSERT INTO playlists (id, name, description, created_at, updated_at)
                    VALUES (@id, @name, @desc, @now, @now);";
                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@name", name.Trim());
                cmd.Parameters.AddWithValue("@desc", (object?)description?.Trim() ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@now", now);

                try
                {
                    cmd.ExecuteNonQuery();
                    return new PlaylistModel
                    {
                        Id = id,
                        Name = name.Trim(),
                        Description = description?.Trim(),
                        VideoCount = 0,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    };
                }
                catch (SqliteException)
                {
                    return null;
                }
            }
        }

        public bool UpdatePlaylist(string id, string? name, string? description)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                var setClauses = new List<string> { "updated_at = @now" };
                cmd.Parameters.AddWithValue("@now", DateTime.UtcNow.ToString("o"));
                cmd.Parameters.AddWithValue("@id", id);

                if (!string.IsNullOrWhiteSpace(name))
                {
                    setClauses.Add("name = @name");
                    cmd.Parameters.AddWithValue("@name", name.Trim());
                }

                if (description != null)
                {
                    setClauses.Add("description = @desc");
                    cmd.Parameters.AddWithValue("@desc", string.IsNullOrWhiteSpace(description) ? DBNull.Value : description.Trim());
                }

                cmd.CommandText = $"UPDATE playlists SET {string.Join(", ", setClauses)} WHERE id = @id;";
                try
                {
                    return cmd.ExecuteNonQuery() > 0;
                }
                catch (SqliteException)
                {
                    return false;
                }
            }
        }

        public bool DeletePlaylist(string id)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    DELETE FROM playlist_videos WHERE playlist_id = @id;
                    DELETE FROM playlists WHERE id = @id;";
                cmd.Parameters.AddWithValue("@id", id);

                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool AddVideoToPlaylist(string playlistId, AddVideoToPlaylistRequest video)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                string id = Guid.NewGuid().ToString("N");
                string now = DateTime.UtcNow.ToString("o");

                cmd.CommandText = @"
                    INSERT INTO playlist_videos (id, playlist_id, relative_path, video_title, channel_name, duration, thumbnail_url, position, added_at)
                    VALUES (@id, @pid, @path, @title, @channel, @duration, @thumb, (SELECT COALESCE(MAX(position), 0) + 1 FROM playlist_videos WHERE playlist_id = @pid), @now)
                    ON CONFLICT(playlist_id, relative_path) DO UPDATE SET
                        video_title = coalesce(excluded.video_title, playlist_videos.video_title),
                        channel_name = coalesce(excluded.channel_name, playlist_videos.channel_name),
                        duration = coalesce(excluded.duration, playlist_videos.duration),
                        thumbnail_url = coalesce(excluded.thumbnail_url, playlist_videos.thumbnail_url);
                    
                    UPDATE playlists SET updated_at = @now WHERE id = @pid;";

                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@pid", playlistId);
                cmd.Parameters.AddWithValue("@path", video.RelativePath.Trim());
                cmd.Parameters.AddWithValue("@title", (object?)video.VideoTitle ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@channel", (object?)video.ChannelName ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@duration", (object?)video.Duration ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@thumb", (object?)video.ThumbnailUrl ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@now", now);

                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool RemoveVideoFromPlaylist(string playlistId, string relativePath)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    DELETE FROM playlist_videos 
                    WHERE playlist_id = @pid AND relative_path = @path;
                    UPDATE playlists SET updated_at = datetime('now') WHERE id = @pid;";
                cmd.Parameters.AddWithValue("@pid", playlistId);
                cmd.Parameters.AddWithValue("@path", relativePath.Trim());

                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public List<string> GetPlaylistIdsForVideo(string relativePath)
        {
            lock (_lock)
            {
                var list = new List<string>();
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = "SELECT playlist_id FROM playlist_videos WHERE relative_path = @path;";
                cmd.Parameters.AddWithValue("@path", relativePath.Trim());

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(reader.GetString(0));
                }

                return list;
            }
        }
    }
}
