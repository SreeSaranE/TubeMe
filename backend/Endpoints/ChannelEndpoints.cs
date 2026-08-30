using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class ChannelEndpoints
    {
        public static RouteGroupBuilder MapChannelEndpoints(this RouteGroupBuilder group)
        {
            group.MapGet("/", (IChannelService channelService) =>
            {
                return Results.Ok(channelService.GetChannels());
            });

            group.MapGet("/categories", (IChannelService channelService) =>
            {
                return Results.Ok(channelService.GetCategories());
            });

            group.MapPost("/", async (AddChannelRequest request, IChannelService channelService) =>
            {
                if (string.IsNullOrWhiteSpace(request.Url))
                {
                    return Results.BadRequest("URL cannot be empty.");
                }
                var channel = await channelService.AddChannelAsync(request.Url, request.Category ?? "General");
                return Results.Ok(channel);
            });

            group.MapDelete("/{id}", (string id, IChannelService channelService) =>
            {
                bool removed = channelService.RemoveChannel(id);
                return removed ? Results.Ok() : Results.NotFound();
            });

            group.MapPatch("/{id}/category", (string id, UpdateChannelCategoryRequest request, IChannelService channelService) =>
            {
                channelService.UpdateCategory(id, request.Category);
                return Results.Ok();
            });

            group.MapPost("/sync", (ChannelSyncRequest request, IDownloadQueueService queueService) =>
            {
                var queued = queueService.EnqueueChannelSync(request);
                return Results.Ok(queued);
            });

            group.MapPost("/refresh-metadata", async (IChannelService channelService) =>
            {
                await channelService.RefreshAllMetadataAsync();
                return Results.Ok(channelService.GetChannels());
            });

            group.MapGet("/avatar/{*filename}", (string filename, HttpContext httpContext, ISettingsService settingsService) =>
            {
                var settings = settingsService.GetSettings();
                string decoded = Uri.UnescapeDataString(filename);
                string avatarPath = Path.Combine(settings.DataDir, "ChannelPhotos", decoded);
                if (!File.Exists(avatarPath))
                {
                    string localPath = Path.Combine(Directory.GetCurrentDirectory(), "database", "ChannelPhotos", decoded);
                    if (File.Exists(localPath))
                    {
                        avatarPath = localPath;
                    }
                    else
                    {
                        return Results.NotFound();
                    }
                }

                httpContext.Response.GetTypedHeaders().CacheControl = new Microsoft.Net.Http.Headers.CacheControlHeaderValue
                {
                    Public = true,
                    MaxAge = TimeSpan.FromDays(7)
                };

                return Results.File(avatarPath, "image/jpeg");
            });

            return group;
        }
    }
}
