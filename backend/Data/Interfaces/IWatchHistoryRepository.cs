using System.Collections.Generic;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Interfaces
{
    public interface IWatchHistoryRepository
    {
        void Upsert(string relativePath, string? title, string? channelName, double currentTime, double duration);
        WatchHistoryItem? GetByRelativePath(string relativePath);
        List<WatchHistoryItem> GetAll();
        Dictionary<string, WatchHistoryItem> GetAllMap();
        bool Delete(string id);
        void ClearAll();

        // Persistent Watch Time Ledger
        double GetTotalLifetimeWatchTimeSeconds();
        Dictionary<string, double> GetChannelWatchTimeMap();
        Dictionary<string, int> GetChannelWatchedCountMap();
        List<WatchTimeLedgerItem> GetAllLedgerItems();
    }
}
