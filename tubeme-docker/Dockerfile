# ==========================================
# Stage 1: Build React Frontend
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build ASP.NET Core Backend
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-builder
WORKDIR /app/backend

COPY backend/*.csproj ./
RUN dotnet restore

COPY backend/ ./
COPY --from=frontend-builder /app/backend/wwwroot ./wwwroot

RUN dotnet publish -c Release -o /app/publish /p:AllowMissingPrunePackageData=true

# ==========================================
# Stage 3: Final Runtime Image with yt-dlp & ffmpeg
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install system dependencies: python3, ffmpeg, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Copy published application
COPY --from=backend-builder /app/publish .

# Environment variables & directory setup
ENV DATA_DIR=/app/data
ENV OUTPUT_DIR=/downloads
ENV ASPNETCORE_URLS=http://+:5000

RUN mkdir -p /app/data /downloads

EXPOSE 5000

ENTRYPOINT ["dotnet", "YoutubeDownloader.dll"]
