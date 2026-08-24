using System;
using System.IO;
using Microsoft.Data.Sqlite;
using YoutubeDownloader.Data.Interfaces;

namespace YoutubeDownloader.Data
{
    public class SqliteDbConnectionFactory : IDbConnectionFactory
    {
        private readonly string _connectionString;
        private readonly string _dbPath;

        public string DbPath => _dbPath;

        public SqliteDbConnectionFactory()
        {
            string dataDir = Environment.GetEnvironmentVariable("DATA_DIR") 
                ?? Path.Combine(Directory.GetCurrentDirectory(), "data");

            Directory.CreateDirectory(dataDir);
            _dbPath = Path.Combine(dataDir, "tubeme.db");
            _connectionString = $"Data Source={_dbPath}";
        }

        public SqliteConnection CreateConnection()
        {
            var connection = new SqliteConnection(_connectionString);
            connection.Open();
            return connection;
        }
    }
}
