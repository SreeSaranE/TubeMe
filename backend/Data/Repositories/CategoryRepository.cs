using System;
using System.Collections.Generic;
using Microsoft.Data.Sqlite;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly object _lock = new();

        public CategoryRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public List<CategoryDetailModel> GetAllWithCount()
        {
            lock (_lock)
            {
                var list = new List<CategoryDetailModel>();
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    SELECT 
                        c.name,
                        COUNT(ch.id) AS channel_count,
                        c.created_at
                    FROM categories c
                    LEFT JOIN channels ch ON LOWER(ch.category) = LOWER(c.name)
                    GROUP BY c.name
                    ORDER BY 
                        CASE WHEN LOWER(c.name) = 'general' THEN 0 ELSE 1 END,
                        c.name ASC;";

                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    list.Add(new CategoryDetailModel
                    {
                        Name = reader.GetString(0),
                        ChannelCount = reader.GetInt32(1),
                        CreatedAt = DateTime.TryParse(reader.GetString(2), out var dt) ? dt : DateTime.UtcNow
                    });
                }

                return list;
            }
        }

        public bool Exists(string name)
        {
            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT COUNT(*) FROM categories WHERE LOWER(name) = LOWER(@name);";
                cmd.Parameters.AddWithValue("@name", name.Trim());
                long count = (long)(cmd.ExecuteScalar() ?? 0);
                return count > 0;
            }
        }

        public bool Add(string name)
        {
            string cleanName = name.Trim();
            if (string.IsNullOrWhiteSpace(cleanName)) return false;

            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var cmd = conn.CreateCommand();

                cmd.CommandText = @"
                    INSERT OR IGNORE INTO categories (id, name, created_at)
                    VALUES (@id, @name, datetime('now'));";
                cmd.Parameters.AddWithValue("@id", Guid.NewGuid().ToString("N"));
                cmd.Parameters.AddWithValue("@name", cleanName);

                int affected = cmd.ExecuteNonQuery();
                return affected > 0;
            }
        }

        public bool Rename(string oldName, string newName)
        {
            string cleanOld = oldName.Trim();
            string cleanNew = newName.Trim();

            if (string.IsNullOrWhiteSpace(cleanOld) || string.IsNullOrWhiteSpace(cleanNew))
                return false;

            if (cleanOld.Equals(cleanNew, StringComparison.OrdinalIgnoreCase))
                return true;

            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var tx = conn.BeginTransaction();
                try
                {
                    // Check if new name already exists
                    using (var checkCmd = conn.CreateCommand())
                    {
                        checkCmd.Transaction = tx;
                        checkCmd.CommandText = "SELECT COUNT(*) FROM categories WHERE LOWER(name) = LOWER(@newName);";
                        checkCmd.Parameters.AddWithValue("@newName", cleanNew);
                        long count = (long)(checkCmd.ExecuteScalar() ?? 0);
                        if (count > 0) return false;
                    }

                    // Update categories table
                    using (var updateCatCmd = conn.CreateCommand())
                    {
                        updateCatCmd.Transaction = tx;
                        updateCatCmd.CommandText = "UPDATE categories SET name = @newName WHERE LOWER(name) = LOWER(@oldName);";
                        updateCatCmd.Parameters.AddWithValue("@newName", cleanNew);
                        updateCatCmd.Parameters.AddWithValue("@oldName", cleanOld);
                        int affected = updateCatCmd.ExecuteNonQuery();
                        if (affected == 0) return false;
                    }

                    // Update channels table
                    using (var updateChannelsCmd = conn.CreateCommand())
                    {
                        updateChannelsCmd.Transaction = tx;
                        updateChannelsCmd.CommandText = "UPDATE channels SET category = @newName WHERE LOWER(category) = LOWER(@oldName);";
                        updateChannelsCmd.Parameters.AddWithValue("@newName", cleanNew);
                        updateChannelsCmd.Parameters.AddWithValue("@oldName", cleanOld);
                        updateChannelsCmd.ExecuteNonQuery();
                    }

                    tx.Commit();
                    return true;
                }
                catch
                {
                    tx.Rollback();
                    return false;
                }
            }
        }

        public bool Delete(string name)
        {
            string cleanName = name.Trim();
            if (string.IsNullOrWhiteSpace(cleanName)) return false;

            // Never delete 'General'
            if (cleanName.Equals("General", StringComparison.OrdinalIgnoreCase))
                return false;

            lock (_lock)
            {
                using var conn = _connectionFactory.CreateConnection();
                using var tx = conn.BeginTransaction();
                try
                {
                    // Delete from categories table
                    using (var delCatCmd = conn.CreateCommand())
                    {
                        delCatCmd.Transaction = tx;
                        delCatCmd.CommandText = "DELETE FROM categories WHERE LOWER(name) = LOWER(@name);";
                        delCatCmd.Parameters.AddWithValue("@name", cleanName);
                        int affected = delCatCmd.ExecuteNonQuery();
                        if (affected == 0) return false;
                    }

                    // Reassign channels belonging to this category to 'General'
                    using (var updateChannelsCmd = conn.CreateCommand())
                    {
                        updateChannelsCmd.Transaction = tx;
                        updateChannelsCmd.CommandText = "UPDATE channels SET category = 'General' WHERE LOWER(category) = LOWER(@name);";
                        updateChannelsCmd.Parameters.AddWithValue("@name", cleanName);
                        updateChannelsCmd.ExecuteNonQuery();
                    }

                    tx.Commit();
                    return true;
                }
                catch
                {
                    tx.Rollback();
                    return false;
                }
            }
        }
    }
}
