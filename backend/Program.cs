using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using YoutubeDownloader.Hubs;
using YoutubeDownloader.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddSignalR();

// Register Singleton services
builder.Services.AddSingleton<SettingsService>();
builder.Services.AddSingleton<YtDlpService>();
builder.Services.AddSingleton<ChannelService>();

// Register DownloadQueueManager as both HostedService and Singleton
builder.Services.AddSingleton<DownloadQueueManager>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<DownloadQueueManager>());

// Configure CORS for development (React dev server on localhost:3000)
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

app.UseCors("CorsPolicy");

// Enable static files (React frontend served from wwwroot in production/container)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.MapControllers();
app.MapHub<DownloadHub>("/hubs/downloadHub");

// Fallback to index.html for Single Page Application (React) client-side routing
app.MapFallbackToFile("index.html");

app.Run();
