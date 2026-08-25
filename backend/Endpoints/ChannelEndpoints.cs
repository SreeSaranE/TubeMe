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

            group.MapPost("/", async (AddChannelRequest request, IChannelService channelService) =>
            {
                if (string.IsNullOrWhiteSpace(request.Url))
                {
                    return Results.BadRequest("URL cannot be empty.");
                }
                var channel = await channelService.AddChannelAsync(request.Url);
                return Results.Ok(channel);
            });

            group.MapDelete("/{id}", (string id, IChannelService channelService) =>
            {
                bool removed = channelService.RemoveChannel(id);
                return removed ? Results.Ok() : Results.NotFound();
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

            group.MapGet("/avatar/{filename}", (string filename, ISettingsService settingsService) =>
            {
                var settings = settingsService.GetSettings();
                string avatarPath = Path.Combine(settings.DataDir, "ChannelPhotos", filename);
                if (!File.Exists(avatarPath))
                {
                    return Results.NotFound();
                }
                return Results.File(avatarPath, "image/jpeg");
            });

            return group;
        }
    }
}
