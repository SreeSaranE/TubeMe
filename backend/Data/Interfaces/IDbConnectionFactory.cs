using System.Data.Common;
using Microsoft.Data.Sqlite;

namespace YoutubeDownloader.Data.Interfaces
{
    public interface IDbConnectionFactory
    {
        string DbPath { get; }
        SqliteConnection CreateConnection();
    }
}
