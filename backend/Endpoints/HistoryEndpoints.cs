using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Endpoints
{
    public static class HistoryEndpoints
    {
        public static RouteGroupBuilder MapHistoryEndpoints(this RouteGroupBuilder group)
        {
            // 1. Get All Watch History
            group.MapGet("/", (IWatchHistoryRepository historyRepo) =>
            {
                return Results.Ok(historyRepo.GetAll());
            });

            // 2. Upsert Watch History Progress
            group.MapPost("/", (UpdateWatchHistoryRequest request, IWatchHistoryRepository historyRepo) =>
            {
                if (string.IsNullOrWhiteSpace(request.RelativePath))
                {
                    return Results.BadRequest(new { message = "RelativePath cannot be empty." });
                }

                historyRepo.Upsert(
                    request.RelativePath,
                    request.Title,
                    request.ChannelName,
                    request.CurrentTime,
                    request.Duration
                );

                var item = historyRepo.GetByRelativePath(request.RelativePath);
                return Results.Ok(item);
            });

            // 3. Delete single history entry by query parameter path or id
            group.MapDelete("/item", ([FromQuery] string? path, [FromQuery] string? id, IWatchHistoryRepository historyRepo) =>
            {
                string? target = !string.IsNullOrWhiteSpace(path) ? path : id;
                if (string.IsNullOrWhiteSpace(target))
                {
                    return Results.BadRequest(new { message = "path or id parameter is required." });
                }

                string cleanTarget = Uri.UnescapeDataString(target);
                bool deleted = historyRepo.Delete(cleanTarget);
                return deleted ? Results.Ok(new { success = true }) : Results.NotFound();
            });

            // 4. Delete single history entry by file path query parameter
            group.MapDelete("/file", ([FromQuery] string path, IWatchHistoryRepository historyRepo) =>
            {
                if (string.IsNullOrWhiteSpace(path))
                {
                    return Results.BadRequest(new { message = "path parameter is required." });
                }

                string cleanPath = Uri.UnescapeDataString(path);
                bool deleted = historyRepo.Delete(cleanPath);
                return deleted ? Results.Ok(new { success = true }) : Results.NotFound();
            });

            // 5. Clear all history
            group.MapDelete("/clear", (IWatchHistoryRepository historyRepo) =>
            {
                historyRepo.ClearAll();
                return Results.Ok(new { success = true, message = "History cleared." });
            });

            group.MapDelete("/", (IWatchHistoryRepository historyRepo) =>
            {
                historyRepo.ClearAll();
                return Results.Ok(new { success = true, message = "History cleared." });
            });

            return group;
        }
    }
}
