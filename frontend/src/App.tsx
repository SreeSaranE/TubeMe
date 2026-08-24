import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { Navbar } from '@/components/Navbar';
import { ChannelsTab } from '@/components/ChannelsTab';
import { SearchTab } from '@/components/SearchTab';
import { DownloadsTab } from '@/components/DownloadsTab';
import { LibraryTab } from '@/components/LibraryTab';
import { SettingsTab } from '@/components/SettingsTab';
import { api, createSignalRConnection } from '@/services/api';
import { ChannelModel, DownloadItem, AppSettingsModel, StartDownloadRequest, ChannelSyncRequest } from '@/types';

function AppContent() {
  const navigate = useNavigate();
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
  const handleAddChannel = async (url: string) => {
    const newCh = await api.addChannel(url);
    if (newCh) {
      setChannels((prev) => [...prev.filter((c) => c.id !== newCh.id), newCh]);
    }
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased bg-ambient-glow selection:bg-foreground selection:text-background">
      {/* Floating Island Navbar */}
      <Navbar activeDownloadsCount={activeDownloadsCount} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
        <Routes>
          <Route
            path="/"
            element={
              <ChannelsTab
                channels={channels}
                onAddChannel={handleAddChannel}
                onRemoveChannel={handleRemoveChannel}
                onSyncChannels={handleSyncChannels}
                onRefreshMetadata={handleRefreshMetadata}
                settings={settings}
              />
            }
          />
          <Route
            path="/search"
            element={
              <SearchTab onStartDownload={handleStartDownload} settings={settings} />
            }
          />
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
          <Route path="/library" element={<LibraryTab />} />
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
  );
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
