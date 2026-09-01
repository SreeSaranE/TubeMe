using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class PlaylistEndpoints
    {
        public static RouteGroupBuilder MapPlaylistEndpoints(this RouteGroupBuilder group)
        {
            // GET /api/playlists
            group.MapGet("/", (IPlaylistService playlistService) =>
            {
                return Results.Ok(playlistService.GetAllPlaylists());
            });

            // GET /api/playlists/video-memberships?path=...
            group.MapGet("/video-memberships", (string path, IPlaylistService playlistService) =>
            {
                if (string.IsNullOrWhiteSpace(path))
                {
                    return Results.Ok(Array.Empty<string>());
                }

                var playlistIds = playlistService.GetPlaylistIdsForVideo(Uri.UnescapeDataString(path));
                return Results.Ok(playlistIds);
            });

            // GET /api/playlists/{id}
            group.MapGet("/{id}", (string id, IPlaylistService playlistService) =>
            {
                var playlist = playlistService.GetPlaylist(Uri.UnescapeDataString(id));
                if (playlist == null)
                {
                    return Results.NotFound(new { message = "Playlist not found." });
                }
                return Results.Ok(playlist);
            });

            // POST /api/playlists
            group.MapPost("/", (CreatePlaylistRequest request, IPlaylistService playlistService) =>
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return Results.BadRequest(new { message = "Playlist name cannot be empty." });
                }

                var created = playlistService.CreatePlaylist(request.Name.Trim(), request.Description);
                if (created == null)
                {
                    return Results.Conflict(new { message = "A playlist with this name already exists." });
                }

                return Results.Ok(created);
            });

            // PUT /api/playlists/{id}
            group.MapPut("/{id}", (string id, UpdatePlaylistRequest request, IPlaylistService playlistService) =>
            {
                bool updated = playlistService.UpdatePlaylist(Uri.UnescapeDataString(id), request.Name, request.Description);
                if (!updated)
                {
                    return Results.BadRequest(new { message = "Failed to update playlist. Playlist may not exist or name already in use." });
                }

                var playlist = playlistService.GetPlaylist(Uri.UnescapeDataString(id));
                return Results.Ok(playlist);
            });

            // DELETE /api/playlists/{id}
            group.MapDelete("/{id}", (string id, IPlaylistService playlistService) =>
            {
                bool deleted = playlistService.DeletePlaylist(Uri.UnescapeDataString(id));
                if (!deleted)
                {
                    return Results.NotFound(new { message = "Playlist not found." });
                }
                return Results.Ok(new { message = "Playlist deleted successfully." });
            });

            // POST /api/playlists/{id}/videos
            group.MapPost("/{id}/videos", (string id, AddVideoToPlaylistRequest request, IPlaylistService playlistService) =>
            {
                if (string.IsNullOrWhiteSpace(request.RelativePath))
                {
                    return Results.BadRequest(new { message = "Video relativePath cannot be empty." });
                }

                bool added = playlistService.AddVideoToPlaylist(Uri.UnescapeDataString(id), request);
                if (!added)
                {
                    return Results.BadRequest(new { message = "Failed to add video to playlist." });
                }

                var playlist = playlistService.GetPlaylist(Uri.UnescapeDataString(id));
                return Results.Ok(playlist);
            });

            // DELETE /api/playlists/{id}/videos
            group.MapDelete("/{id}/videos", (string id, string path, IPlaylistService playlistService) =>
            {
                if (string.IsNullOrWhiteSpace(path))
                {
                    return Results.BadRequest(new { message = "Path query parameter is required." });
                }

                bool removed = playlistService.RemoveVideoFromPlaylist(Uri.UnescapeDataString(id), Uri.UnescapeDataString(path));
                if (!removed)
                {
                    return Results.NotFound(new { message = "Video not found in playlist." });
                }

                var playlist = playlistService.GetPlaylist(Uri.UnescapeDataString(id));
                return Results.Ok(playlist);
            });

            return group;
        }
    }
}
