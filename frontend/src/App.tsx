import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AppSidebar } from '@/components/AppSidebar';
import { ChannelsTab } from '@/components/ChannelsTab';
import { SearchTab } from '@/components/SearchTab';
import { DownloadsTab } from '@/components/DownloadsTab';
import { HomeTab } from '@/components/HomeTab';
import { VideoPlayerTab } from '@/components/VideoPlayerTab';
import { HistoryTab } from '@/components/HistoryTab';
import { PlaylistsTab } from '@/components/PlaylistsTab';
import { StatisticsTab } from '@/components/StatisticsTab';
import { SettingsTab } from '@/components/SettingsTab';
import { GlobalBottomPlayer } from '@/components/GlobalBottomPlayer';
import { api, createSignalRConnection } from '@/services/api';
import {
  ChannelModel,
  DownloadItem,
  AppSettingsModel,
  StartDownloadRequest,
  ChannelSyncRequest,
} from '@/types';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentVideo } = usePlayer();
  const isWatchPage = location.pathname === '/watch';
  const [channels, setChannels] = useState<ChannelModel[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [settings, setSettings] = useState<AppSettingsModel | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      const [chData, dlData, settsData] = await Promise.all([
        api.getChannels(),
        api.getDownloads(),
        api.getSettings(),
      ]);
      setChannels(chData || []);
      setDownloads(dlData || []);
      setSettings(settsData || null);
    } catch (err) {
      console.error('Error loading initial app data:', err);
    }
  };

  useEffect(() => {
    loadData();

    // SignalR Connection
    const connection = createSignalRConnection();

    connection.on('ReceiveDownloadProgress', (item: DownloadItem) => {
      setDownloads((prev) => {
        const index = prev.findIndex((d) => d.id === item.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...item };
          return updated;
        } else {
          return [item, ...prev];
        }
      });
    });

    connection.on('ReceiveDownloadLog', (downloadId: string, logLine: string) => {
      setDownloads((prev) => {
        return prev.map((d) => {
          if (d.id === downloadId) {
            const logs = d.logs ? [...d.logs, logLine] : [logLine];
            if (logs.length > 200) logs.shift();
            return { ...d, logs };
          }
          return d;
        });
      });
    });

    connection
      .start()
      .catch((err) => console.error('SignalR Connection Error:', err));

    return () => {
      connection.stop();
    };
  }, []);

  // Handlers
  const handleAddChannel = async (url: string, category: string = 'General') => {
    const newCh = await api.addChannel(url, category);
    if (newCh) {
      setChannels((prev) => [...prev.filter((c) => c.id !== newCh.id), newCh]);
    }
  };

  const handleUpdateCategory = async (id: string, category: string) => {
    await api.updateChannelCategory(id, category);
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, category } : c))
    );
  };

  const handleRemoveChannel = async (id: string) => {
    await api.removeChannel(id);
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSyncChannels = async (req: ChannelSyncRequest) => {
    const queued = await api.syncChannels(req);
    if (queued && queued.length > 0) {
      navigate('/downloads');
    }
  };

  const handleRefreshMetadata = async () => {
    const updated = await api.refreshMetadata();
    if (updated) setChannels(updated);
  };

  const handleStartDownload = async (req: StartDownloadRequest) => {
    const item = await api.startDownload(req);
    if (item) {
      navigate('/downloads');
    }
  };

  const handleCancelDownload = async (id: string) => {
    await api.cancelDownload(id);
  };

  const handleClearHistory = async () => {
    await api.clearHistory();
    setDownloads((prev) => prev.filter((d) => d.status === 'Downloading' || d.status === 'Queued'));
  };

  const activeDownloadsCount = downloads.filter(
    (d) => d.status === 'Downloading' || d.status === 'Queued'
  ).length;

  return (
    <div className="h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex w-full font-sans antialiased overflow-hidden flex-col">
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <AppSidebar
          channelsCount={channels.length}
          activeDownloadsCount={activeDownloadsCount}
        />

        <main
          className={`flex-1 min-w-0 w-full px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-8 ${
            isWatchPage
              ? 'h-full overflow-y-auto lg:overflow-hidden flex flex-col pb-6 sm:pb-8 lg:pb-8'
              : currentVideo
              ? 'h-full overflow-y-auto pb-28 sm:pb-28'
              : 'h-full overflow-y-auto pb-6 sm:pb-8 lg:pb-8'
          }`}
        >
          <div className="md:hidden mb-3 shrink-0">
            <SidebarTrigger />
          </div>
          <Routes>
            {/* 1. Home Feed (YouTube-style video library grid) */}
            <Route path="/" element={<HomeTab />} />

            {/* 2. YouTube-style Video Player Page */}
            <Route path="/watch" element={<VideoPlayerTab />} />

            {/* 2b. Watch History Page */}
            <Route path="/history" element={<HistoryTab />} />

            {/* 3. Channels Management */}
            <Route
              path="/channels"
              element={
                <ChannelsTab
                  channels={channels}
                  onAddChannel={handleAddChannel}
                  onUpdateCategory={handleUpdateCategory}
                  onRemoveChannel={handleRemoveChannel}
                  onSyncChannels={handleSyncChannels}
                  onRefreshMetadata={handleRefreshMetadata}
                  onReloadChannels={loadData}
                  settings={settings}
                />
              }
            />

            {/* Playlists & Categories Page */}
            <Route path="/playlists" element={<PlaylistsTab />} />
            <Route path="/playlist" element={<Navigate to="/playlists" replace />} />

            {/* 4. Search & Direct Downloader */}
            <Route
              path="/search"
              element={
                <SearchTab onStartDownload={handleStartDownload} settings={settings} />
              }
            />

            {/* 5. Downloads Queue */}
            <Route
              path="/downloads"
              element={
                <DownloadsTab
                  downloads={downloads}
                  onCancelDownload={handleCancelDownload}
                  onClearHistory={handleClearHistory}
                />
              }
            />
            <Route path="/queue" element={<Navigate to="/downloads" replace />} />
            <Route path="/library" element={<Navigate to="/" replace />} />

            {/* 6. Statistics */}
            <Route path="/stats" element={<StatisticsTab />} />
            <Route path="/statistics" element={<Navigate to="/stats" replace />} />

            {/* 7. Settings */}
            <Route
              path="/settings"
              element={
                <SettingsTab settings={settings} onSettingsSaved={(s) => setSettings(s)} />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Persistent Bottom Mini-Player Bar */}
      <GlobalBottomPlayer />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SidebarProvider defaultOpen={true}>
          <PlayerProvider>
            <AppContent />
            <Toaster />
          </PlayerProvider>
        </SidebarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
