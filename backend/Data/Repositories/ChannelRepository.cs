using System;
using System.Collections.Generic;
using Microsoft.Data.Sqlite;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Repositories
{
    public class ChannelRepository : IChannelRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly object _lock = new();

        public ChannelRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public List<ChannelModel> GetAll()
        {
            lock (_lock)
            {
                var list = new List<ChannelModel>();
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT id, url, name, avatar_url, last_synced_at, created_at, is_syncing FROM channels ORDER BY created_at DESC;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new ChannelModel
                    {
                        Id = reader.GetString(0),
                        Url = reader.GetString(1),
                        Name = reader.GetString(2),
                        AvatarUrl = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                        LastSyncedAt = reader.IsDBNull(4) ? null : DateTime.Parse(reader.GetString(4)),
                        CreatedAt = DateTime.Parse(reader.GetString(5)),
                        IsSyncing = reader.GetInt32(6) == 1
                    });
                }

                return list;
            }
        }

        public ChannelModel? GetById(string id)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT id, url, name, avatar_url, last_synced_at, created_at, is_syncing FROM channels WHERE id = @id LIMIT 1;";
                cmd.Parameters.AddWithValue("@id", id);

                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new ChannelModel
                    {
                        Id = reader.GetString(0),
                        Url = reader.GetString(1),
                        Name = reader.GetString(2),
                        AvatarUrl = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                        LastSyncedAt = reader.IsDBNull(4) ? null : DateTime.Parse(reader.GetString(4)),
                        CreatedAt = DateTime.Parse(reader.GetString(5)),
                        IsSyncing = reader.GetInt32(6) == 1
                    };
                }

                return null;
            }
        }

        public void Upsert(ChannelModel channel)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO channels (id, url, name, avatar_url, last_synced_at, created_at, is_syncing)
                    VALUES (@id, @url, @name, @avatarUrl, @lastSyncedAt, @createdAt, @isSyncing)
                    ON CONFLICT(id) DO UPDATE SET
                        url = excluded.url,
                        name = excluded.name,
                        avatar_url = excluded.avatar_url,
                        last_synced_at = excluded.last_synced_at,
                        is_syncing = excluded.is_syncing;";

                cmd.Parameters.AddWithValue("@id", channel.Id);
                cmd.Parameters.AddWithValue("@url", channel.Url);
                cmd.Parameters.AddWithValue("@name", channel.Name);
                cmd.Parameters.AddWithValue("@avatarUrl", (object?)channel.AvatarUrl ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@lastSyncedAt", channel.LastSyncedAt.HasValue ? (object)channel.LastSyncedAt.Value.ToString("o") : DBNull.Value);
                cmd.Parameters.AddWithValue("@createdAt", channel.CreatedAt.ToString("o"));
                cmd.Parameters.AddWithValue("@isSyncing", channel.IsSyncing ? 1 : 0);

                cmd.ExecuteNonQuery();
            }
        }

        public bool Delete(string id)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "DELETE FROM channels WHERE id = @id;";
                cmd.Parameters.AddWithValue("@id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public void UpdateSyncState(string channelId, bool isSyncing, DateTime? lastSyncedAt = null)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                if (lastSyncedAt.HasValue)
                {
                    cmd.CommandText = "UPDATE channels SET is_syncing = @isSyncing, last_synced_at = @lastSyncedAt WHERE id = @id;";
                    cmd.Parameters.AddWithValue("@lastSyncedAt", lastSyncedAt.Value.ToString("o"));
                }
                else
                {
                    cmd.CommandText = "UPDATE channels SET is_syncing = @isSyncing WHERE id = @id;";
                }

                cmd.Parameters.AddWithValue("@isSyncing", isSyncing ? 1 : 0);
                cmd.Parameters.AddWithValue("@id", channelId);
                cmd.ExecuteNonQuery();
            }
        }
    }
}
