using System.Collections.Generic;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class SearchEndpoints
    {
        public static RouteGroupBuilder MapSearchEndpoints(this RouteGroupBuilder group)
        {
            group.MapGet("/", async (string? q, int limit = 12, IYtDlpService ytDlpService = null!) =>
            {
                if (string.IsNullOrWhiteSpace(q))
                {
                    return Results.Ok(new List<SearchResultItem>());
                }

                var results = await ytDlpService.SearchAsync(q, limit);
                return Results.Ok(results);
            });

            return group;
        }
    }
}
