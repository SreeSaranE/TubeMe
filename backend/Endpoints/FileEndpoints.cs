using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class FileEndpoints
    {
        public static RouteGroupBuilder MapFileEndpoints(this RouteGroupBuilder group)
        {
            group.MapGet("/", (string? subDir, IMediaFileService mediaFileService) =>
            {
                return Results.Ok(mediaFileService.GetMediaFiles(subDir));
            });

            return group;
        }
    }
}
