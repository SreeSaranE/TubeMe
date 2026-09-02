using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class StatisticsEndpoints
    {
        public static RouteGroupBuilder MapStatisticsEndpoints(this RouteGroupBuilder group)
        {
            // GET /api/statistics
            group.MapGet("/", async (IStatisticsService statisticsService) =>
            {
                var stats = await statisticsService.GetStatisticsAsync();
                return Results.Ok(stats);
            });

            return group;
        }
    }
}
