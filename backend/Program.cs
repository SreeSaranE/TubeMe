using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using YoutubeDownloader.Data;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Data.Repositories;
using YoutubeDownloader.Endpoints;
using YoutubeDownloader.Hubs;
using YoutubeDownloader.Services;
using YoutubeDownloader.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add SignalR
builder.Services.AddSignalR();

// ==========================================
// 1. DATA / REPOSITORY LAYER
// ==========================================
builder.Services.AddSingleton<IDbConnectionFactory, SqliteDbConnectionFactory>();
builder.Services.AddSingleton<IDatabaseInitializer, DatabaseInitializer>();
builder.Services.AddSingleton<IChannelRepository, ChannelRepository>();
builder.Services.AddSingleton<ICategoryRepository, CategoryRepository>();
builder.Services.AddSingleton<ISettingsRepository, SettingsRepository>();
builder.Services.AddSingleton<IDownloadRepository, DownloadRepository>();
builder.Services.AddSingleton<IWatchHistoryRepository, WatchHistoryRepository>();
builder.Services.AddSingleton<IPlaylistRepository, PlaylistRepository>();

// ==========================================
// 2. SERVICE LAYER
// ==========================================
builder.Services.AddSingleton<ISettingsService, SettingsService>();
builder.Services.AddSingleton<IYtDlpService, YtDlpService>();
builder.Services.AddSingleton<IChannelService, ChannelService>();
builder.Services.AddSingleton<ICategoryService, CategoryService>();
builder.Services.AddSingleton<IMediaFileService, MediaFileService>();
builder.Services.AddSingleton<IMediaService, MediaService>();
builder.Services.AddSingleton<IPlaylistService, PlaylistService>();

// Register DownloadQueueService as Singleton, Interface implementation, and Background HostedService
builder.Services.AddSingleton<DownloadQueueService>();
builder.Services.AddSingleton<IDownloadQueueService>(sp => sp.GetRequiredService<DownloadQueueService>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<DownloadQueueService>());

// ==========================================
// CORS Configuration for Development
// ==========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Initialize SQLite Schema & Default Configuration
var dbInitializer = app.Services.GetRequiredService<IDatabaseInitializer>();
dbInitializer.Initialize();

app.UseCors("CorsPolicy");

// Enable Static Files (React frontend served from wwwroot in production)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

// ==========================================
// 3. MINIMAL API ENDPOINTS & HUBS
// ==========================================
var apiGroup = app.MapGroup("/api");
apiGroup.MapGroup("/channels").MapChannelEndpoints();
apiGroup.MapGroup("/categories").MapCategoryEndpoints();
apiGroup.MapGroup("/playlists").MapPlaylistEndpoints();
apiGroup.MapGroup("/downloads").MapDownloadEndpoints();
apiGroup.MapGroup("/files").MapFileEndpoints();
apiGroup.MapGroup("/media").MapMediaEndpoints();
apiGroup.MapGroup("/history").MapHistoryEndpoints();
apiGroup.MapGroup("/search").MapSearchEndpoints();
apiGroup.MapGroup("/settings").MapSettingsEndpoints();

app.MapHub<DownloadHub>("/hubs/downloadHub");

// Single Page Application Fallback for React Router
app.MapFallbackToFile("index.html");

app.Run();
