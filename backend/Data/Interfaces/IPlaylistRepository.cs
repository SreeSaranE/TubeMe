using System.Collections.Generic;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Interfaces
{
    public interface IPlaylistRepository
    {
        List<PlaylistModel> GetAllPlaylists();
        PlaylistDetailModel? GetPlaylistById(string id);
        PlaylistModel? CreatePlaylist(string name, string? description);
        bool UpdatePlaylist(string id, string? name, string? description);
        bool DeletePlaylist(string id);
        bool AddVideoToPlaylist(string playlistId, AddVideoToPlaylistRequest video);
        bool RemoveVideoFromPlaylist(string playlistId, string relativePath);
        List<string> GetPlaylistIdsForVideo(string relativePath);
    }
}
