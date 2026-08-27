using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Net.Http.Headers;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class MediaEndpoints
    {
        public static RouteGroupBuilder MapMediaEndpoints(this RouteGroupBuilder group)
        {
            // 1. Get All Downloaded Videos List
            group.MapGet("/videos", async (IMediaService mediaService) =>
            {
                var videos = await mediaService.GetAllVideosAsync();
                return Results.Ok(videos);
            });

            // 2. Stream / Download Thumbnail Image (Cached on disk and with HTTP Cache headers)
            group.MapGet("/thumbnail", async (string path, IMediaService mediaService, HttpContext context) =>
            {
                if (string.IsNullOrWhiteSpace(path)) return Results.BadRequest("Path required");

                string? thumbPath = await mediaService.GetThumbnailPathAsync(path);
                if (thumbPath == null || !File.Exists(thumbPath))
                {
                    return Results.NotFound();
                }

                // Cache for 7 days in client browser
                context.Response.GetTypedHeaders().CacheControl = new CacheControlHeaderValue
                {
                    Public = true,
                    MaxAge = TimeSpan.FromDays(7)
                };

                return Results.File(thumbPath, "image/jpeg");
            });

            // 3. HTTP Range Stream Video (Enables fast scrubbing / seeking in HTML5 Video Player)
            group.MapGet("/stream", (string path, IMediaService mediaService) =>
            {
                if (string.IsNullOrWhiteSpace(path)) return Results.BadRequest("Path required");

                string? fullPath = mediaService.GetFullFilePath(path);
                if (fullPath == null || !File.Exists(fullPath))
                {
                    return Results.NotFound("Video file not found");
                }

                string ext = Path.GetExtension(fullPath).ToLowerInvariant();
                string contentType = ext switch
                {
                    ".mp4" => "video/mp4",
                    ".mkv" => "video/x-matroska",
                    ".webm" => "video/webm",
                    ".mov" => "video/quicktime",
                    ".avi" => "video/x-msvideo",
                    ".mp3" => "audio/mpeg",
                    ".m4a" => "audio/mp4",
                    _ => "application/octet-stream"
                };

                return Results.File(fullPath, contentType, enableRangeProcessing: true);
            });

            // 4. Subtitles in WebVTT format
            group.MapGet("/subtitles", (string path, IMediaService mediaService) =>
            {
                if (string.IsNullOrWhiteSpace(path)) return Results.BadRequest("Path required");

                string? vtt = mediaService.GetSubtitleVttContent(path);
                if (vtt == null) return Results.NotFound("Subtitles not found");

                return Results.Text(vtt, "text/vtt; charset=utf-8");
            });

            // 5. Delete Downloaded Video
            group.MapDelete("/file", (string path, IMediaService mediaService) =>
            {
                if (string.IsNullOrWhiteSpace(path)) return Results.BadRequest("Path required");

                bool success = mediaService.DeleteMediaFile(path);
                return success ? Results.Ok(new { success = true }) : Results.NotFound("File not found or could not be deleted");
            });

            return group;
        }
    }
}
