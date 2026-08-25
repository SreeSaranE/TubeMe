using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Endpoints
{
    public static class SettingsEndpoints
    {
        public static RouteGroupBuilder MapSettingsEndpoints(this RouteGroupBuilder group)
        {
            group.MapGet("/", (ISettingsService settingsService) =>
            {
                return Results.Ok(settingsService.GetSettings());
            });

            group.MapPost("/", (AppSettingsModel newSettings, ISettingsService settingsService) =>
            {
                settingsService.SaveSettings(newSettings);
                return Results.Ok(settingsService.GetSettings());
            });

            return group;
        }
    }
}
