using System;
using System.Collections.Generic;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class PlaylistService : IPlaylistService
    {
        private readonly IPlaylistRepository _playlistRepository;

        public PlaylistService(IPlaylistRepository playlistRepository)
        {
            _playlistRepository = playlistRepository;
        }

        public List<PlaylistModel> GetAllPlaylists()
        {
            return _playlistRepository.GetAllPlaylists();
        }

        public PlaylistDetailModel? GetPlaylist(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            return _playlistRepository.GetPlaylistById(id);
        }

        public PlaylistModel? CreatePlaylist(string name, string? description)
        {
            if (string.IsNullOrWhiteSpace(name)) return null;
            return _playlistRepository.CreatePlaylist(name, description);
        }

        public bool UpdatePlaylist(string id, string? name, string? description)
        {
            if (string.IsNullOrWhiteSpace(id)) return false;
            return _playlistRepository.UpdatePlaylist(id, name, description);
        }

        public bool DeletePlaylist(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return false;
            return _playlistRepository.DeletePlaylist(id);
        }

        public bool AddVideoToPlaylist(string playlistId, AddVideoToPlaylistRequest video)
        {
            if (string.IsNullOrWhiteSpace(playlistId) || string.IsNullOrWhiteSpace(video.RelativePath)) return false;
            return _playlistRepository.AddVideoToPlaylist(playlistId, video);
        }

        public bool RemoveVideoFromPlaylist(string playlistId, string relativePath)
        {
            if (string.IsNullOrWhiteSpace(playlistId) || string.IsNullOrWhiteSpace(relativePath)) return false;
            return _playlistRepository.RemoveVideoFromPlaylist(playlistId, relativePath);
        }

        public List<string> GetPlaylistIdsForVideo(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return new List<string>();
            return _playlistRepository.GetPlaylistIdsForVideo(relativePath);
        }
    }
}
