using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class DownloadEndpoints
    {
        public static RouteGroupBuilder MapDownloadEndpoints(this RouteGroupBuilder group)
        {
            group.MapGet("/", (IDownloadQueueService queueService) =>
            {
                return Results.Ok(queueService.GetAllDownloads());
            });

            group.MapPost("/", (StartDownloadRequest request, IDownloadQueueService queueService) =>
            {
                if (string.IsNullOrWhiteSpace(request.Url))
                {
                    return Results.BadRequest("URL cannot be empty.");
                }
                var item = queueService.EnqueueDownload(request);
                return Results.Ok(item);
            });

            group.MapPost("/{id}/cancel", (string id, IDownloadQueueService queueService) =>
            {
                bool cancelled = queueService.CancelDownload(id);
                return cancelled ? Results.Ok() : Results.NotFound();
            });

            group.MapPost("/clear-history", (IDownloadQueueService queueService) =>
            {
                queueService.ClearHistory();
                return Results.Ok();
            });

            return group;
        }
    }
}
