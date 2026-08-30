using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
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

            // 3. Delete single history entry by id or relative path
            group.MapDelete("/{id}", (string id, IWatchHistoryRepository historyRepo) =>
            {
                string cleanId = Uri.UnescapeDataString(id);
                bool deleted = historyRepo.Delete(cleanId);
                return deleted ? Results.Ok(new { success = true }) : Results.NotFound();
            });

            // 4. Clear all history
            group.MapDelete("/", (IWatchHistoryRepository historyRepo) =>
            {
                historyRepo.ClearAll();
                return Results.Ok(new { success = true, message = "History cleared." });
            });

            return group;
        }
    }
}
