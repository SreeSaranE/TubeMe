using System;
using System.IO;
using Microsoft.Data.Sqlite;
using YoutubeDownloader.Data.Interfaces;

namespace YoutubeDownloader.Data
{
    public class DatabaseInitializer : IDatabaseInitializer
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly object _lock = new();

        public DatabaseInitializer(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public void Initialize()
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                // Enable WAL mode for high concurrency
                cmd.CommandText = "PRAGMA journal_mode = WAL;";
                cmd.ExecuteNonQuery();

                // 1. Channels Table
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS channels (
                        id TEXT PRIMARY KEY,
                        url TEXT NOT NULL,
                        name TEXT NOT NULL,
                        avatar_url TEXT,
                        category TEXT NOT NULL DEFAULT 'General',
                        last_synced_at TEXT,
                        created_at TEXT NOT NULL,
                        is_syncing INTEGER NOT NULL DEFAULT 0
                    );";
                cmd.ExecuteNonQuery();

                // Ensure category column exists if upgrading existing DB
                try
                {
                    cmd.CommandText = "ALTER TABLE channels ADD COLUMN category TEXT NOT NULL DEFAULT 'General';";
                    cmd.ExecuteNonQuery();
                }
                catch { }

                // 1b. Categories Table
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS categories (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
                        created_at TEXT NOT NULL
                    );";
                cmd.ExecuteNonQuery();

                // Seed default categories
                cmd.CommandText = @"
                    INSERT OR IGNORE INTO categories (id, name, created_at) VALUES 
                    (lower(hex(randomblob(16))), 'General', datetime('now')),
                    (lower(hex(randomblob(16))), 'Tech', datetime('now')),
                    (lower(hex(randomblob(16))), 'Entertainment', datetime('now')),
                    (lower(hex(randomblob(16))), 'Finance', datetime('now')),
                    (lower(hex(randomblob(16))), 'Education', datetime('now'));";
                cmd.ExecuteNonQuery();

                // Also import any distinct categories already present in channels
                cmd.CommandText = @"
                    INSERT OR IGNORE INTO categories (id, name, created_at)
                    SELECT lower(hex(randomblob(16))), category, datetime('now')
                    FROM channels
                    WHERE category IS NOT NULL AND category != '';";
                cmd.ExecuteNonQuery();

                // 2. Settings Table
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS settings (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        output_dir TEXT NOT NULL,
                        data_dir TEXT NOT NULL,
                        archive_file TEXT NOT NULL,
                        channels_file TEXT NOT NULL,
                        cookies_file TEXT NOT NULL DEFAULT '/app/data/cookies.txt',
                        default_resolution TEXT NOT NULL,
                        include_subtitles INTEGER NOT NULL DEFAULT 1,
                        subtitle_langs TEXT NOT NULL,
                        days_limit INTEGER NOT NULL DEFAULT 4,
                        max_concurrent_jobs INTEGER NOT NULL DEFAULT 5,
                        concurrent_fragments INTEGER NOT NULL DEFAULT 4
                    );";
                cmd.ExecuteNonQuery();

                try
                {
                    cmd.CommandText = "ALTER TABLE settings ADD COLUMN cookies_file TEXT NOT NULL DEFAULT '/app/data/cookies.txt';";
                    cmd.ExecuteNonQuery();
                }
                catch { }

                // 3. Downloads Table
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS downloads (
                        id TEXT PRIMARY KEY,
                        url TEXT NOT NULL,
                        title TEXT,
                        uploader TEXT,
                        thumbnail TEXT,
                        format TEXT,
                        resolution TEXT,
                        type TEXT,
                        status TEXT,
                        progress_percentage REAL DEFAULT 0,
                        download_speed TEXT,
                        eta TEXT,
                        error TEXT,
                        logs TEXT,
                        created_at TEXT NOT NULL,
                        completed_at TEXT
                    );";
                cmd.ExecuteNonQuery();

                // 4. Watch History Table
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS watch_history (
                        id TEXT PRIMARY KEY,
                        relative_path TEXT NOT NULL UNIQUE,
                        title TEXT,
                        channel_name TEXT,
                        current_time REAL NOT NULL DEFAULT 0,
                        duration REAL NOT NULL DEFAULT 0,
                        is_completed INTEGER NOT NULL DEFAULT 1,
                        last_watched_at TEXT NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS idx_watch_history_last_watched ON watch_history(last_watched_at DESC);";
                cmd.ExecuteNonQuery();

                // Ensure all records in watch_history table have is_completed = 1
                cmd.CommandText = "UPDATE watch_history SET is_completed = 1 WHERE is_completed = 0;";
                cmd.ExecuteNonQuery();

                // 4b. Watch Time Ledger Table (Permanent cumulative historical watch log)
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS watch_time_ledger (
                        id TEXT PRIMARY KEY,
                        video_identifier TEXT NOT NULL UNIQUE,
                        title TEXT,
                        channel_name TEXT,
                        duration_seconds REAL NOT NULL DEFAULT 0,
                        logged_at TEXT NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS idx_watch_time_ledger_channel ON watch_time_ledger(channel_name);
                    CREATE INDEX IF NOT EXISTS idx_watch_time_ledger_logged ON watch_time_ledger(logged_at DESC);";
                cmd.ExecuteNonQuery();

                // Sanitize any sentinel duration values (e.g. 999999) in existing watch_time_ledger
                cmd.CommandText = "UPDATE watch_time_ledger SET duration_seconds = 600 WHERE duration_seconds >= 999990 OR duration_seconds <= 0;";
                cmd.ExecuteNonQuery();

                // Backfill existing watch_history records into watch_time_ledger if not already logged
                cmd.CommandText = @"
                    INSERT INTO watch_time_ledger (id, video_identifier, title, channel_name, duration_seconds, logged_at)
                    SELECT 
                        id, 
                        relative_path, 
                        title, 
                        COALESCE(NULLIF(channel_name, ''), 'Local Media'), 
                        CASE 
                            WHEN duration > 0 AND duration < 999990 THEN duration 
                            WHEN current_time > 0 AND current_time < 999990 THEN current_time 
                            ELSE 600 
                        END, 
                        last_watched_at
                    FROM watch_history
                    WHERE (duration > 0 OR current_time > 0)
                    ON CONFLICT(video_identifier) DO UPDATE SET
                        duration_seconds = CASE 
                            WHEN excluded.duration_seconds > 0 AND excluded.duration_seconds < 999990 THEN excluded.duration_seconds 
                            WHEN watch_time_ledger.duration_seconds >= 999990 THEN 600
                            ELSE watch_time_ledger.duration_seconds 
                        END,
                        title = COALESCE(NULLIF(excluded.title, ''), watch_time_ledger.title),
                        channel_name = COALESCE(NULLIF(excluded.channel_name, ''), watch_time_ledger.channel_name);";
                cmd.ExecuteNonQuery();

                // 5. Playlists Table
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS playlists (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
                        description TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );";
                cmd.ExecuteNonQuery();

                // 6. Playlist Videos Table (Mapping table for videos in playlists)
                cmd.CommandText = @"
                    CREATE TABLE IF NOT EXISTS playlist_videos (
                        id TEXT PRIMARY KEY,
                        playlist_id TEXT NOT NULL,
                        relative_path TEXT NOT NULL,
                        video_title TEXT,
                        channel_name TEXT,
                        duration TEXT,
                        thumbnail_url TEXT,
                        position INTEGER NOT NULL DEFAULT 0,
                        added_at TEXT NOT NULL,
                        UNIQUE(playlist_id, relative_path),
                        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS idx_playlist_videos_pid ON playlist_videos(playlist_id);
                    CREATE INDEX IF NOT EXISTS idx_playlist_videos_path ON playlist_videos(relative_path);";
                cmd.ExecuteNonQuery();

                // Seed default "Favorites" and "Watch Later" playlists if empty
                cmd.CommandText = "SELECT COUNT(*) FROM playlists;";
                long playlistCount = (long)(cmd.ExecuteScalar() ?? 0);
                if (playlistCount == 0)
                {
                    cmd.CommandText = @"
                        INSERT OR IGNORE INTO playlists (id, name, description, created_at, updated_at) VALUES
                        (lower(hex(randomblob(16))), 'Favorites', 'Favorite downloaded videos', datetime('now'), datetime('now')),
                        (lower(hex(randomblob(16))), 'Watch Later', 'Saved videos to watch later', datetime('now'), datetime('now'));";
                    cmd.ExecuteNonQuery();
                }

                // Seed default settings row if empty
                cmd.CommandText = "SELECT COUNT(*) FROM settings;";
                long count = (long)(cmd.ExecuteScalar() ?? 0);
                if (count == 0)
                {
                    string dataDir = Path.GetDirectoryName(_connectionFactory.DbPath) 
                        ?? Path.Combine(Directory.GetCurrentDirectory(), "database");
                    string outputDir = Environment.GetEnvironmentVariable("OUTPUT_DIR") 
                        ?? Path.Combine(Directory.GetCurrentDirectory(), "downloads");

                    cmd.CommandText = @"
                        INSERT INTO settings (id, output_dir, data_dir, archive_file, channels_file, default_resolution, include_subtitles, subtitle_langs, days_limit, max_concurrent_jobs, concurrent_fragments)
                        VALUES (1, @outputDir, @dataDir, @archiveFile, @channelsFile, '1080', 1, 'en.*,ta.*', 4, 5, 4);";

                    cmd.Parameters.Clear();
                    cmd.Parameters.AddWithValue("@outputDir", outputDir);
                    cmd.Parameters.AddWithValue("@dataDir", dataDir);
                    cmd.Parameters.AddWithValue("@archiveFile", Path.Combine(dataDir, "archives.txt"));
                    cmd.Parameters.AddWithValue("@channelsFile", Path.Combine(dataDir, "channels.txt"));
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }
}
