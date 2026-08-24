# 🎬 TubeMe

A clean, modern, self-hosted YouTube archiving & downloading web application built with **ASP.NET Core Web API**, **React (Vite + Tailwind CSS)**, and **yt-dlp**.

---

## 🌟 Key Features

1. **Dockerized & Spin-Up/Spin-Down Setup**:
   - Containerized application combining ASP.NET Core backend + built React frontend + `yt-dlp` + `ffmpeg`.
   - Single command to start (`docker compose up -d`) and stop (`docker compose down`).

2. **Subscribed Channels Batch Sync**:
   - Manage list of YouTube channels with profile avatars and last sync dates.
   - Batch download latest channel videos with customizable date limits (e.g., last 4 days), resolution caps (1080p, 720p, 4K, Best), and subtitle embedding (`en.*, ta.*`).

3. **YouTube Search & Direct Video/Playlist Downloader**:
   - Search YouTube videos & playlists directly from the browser UI or paste any YouTube URL.
   - Video card previews with instant download or custom resolution/audio-only options.

4. **Live Downloads Queue & SignalR Real-Time Progress**:
   - Real-time progress percentage, download speeds (MB/s), ETA, and status indicators.
   - Live terminal execution logs for each download job.
   - Support for parallel download jobs with concurrency limits.

5. **Media Library Browser**:
   - Built-in file browser to view downloaded media output files grouped by channel directory.

---

## 🚀 How to Run

### Option 1: Docker (Recommended)

To spin up the containerized application:

```bash
docker compose up -d
```

To stop the application:

```bash
docker compose down
```

Access in your browser:
👉 **`http://localhost:5000`**

---

### Option 2: Local Development (Native)

#### Build & Run Backend:
```bash
cd backend
dotnet run
```
Access in your browser:
👉 **`http://localhost:5000`**

#### Frontend Development Mode (Hot Reloading):
```bash
cd frontend
npm run dev
```
Dev server available at: `http://localhost:3000` (automatically proxies API requests to `http://localhost:5000`).

---

## 📁 Project Structure

```
.
├── backend/                  # ASP.NET Core Web API & SignalR backend
│   ├── Controllers/          # REST Endpoints (Channels, Search, Downloads, Settings, Files)
│   ├── Hubs/                 # SignalR DownloadHub for real-time progress
│   ├── Models/               # Data structures
│   ├── Services/             # YtDlpService, ChannelService, DownloadQueueManager, SettingsService
│   └── wwwroot/              # Built React static production assets
├── frontend/                 # React frontend application (Vite + Tailwind CSS + Lucide Icons)
│   ├── src/
│   │   ├── components/       # ChannelsTab, SearchTab, DownloadsTab, LibraryTab, SettingsTab, Navbar
│   │   ├── services/         # API & SignalR WebSocket client
│   │   ├── App.jsx
│   │   └── main.jsx
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Docker Compose configuration
└── README.md
```

---

## ⚙️ Configuration & Data Persistence

Mounted volumes in `docker-compose.yml`:
- `./downloads:/downloads` - Destination folder for downloaded video & audio files.
- `./data:/app/data` - Data folder storing channel list, avatars, settings, and download archive (`archives.txt`).
