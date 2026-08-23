import * as signalR from '@microsoft/signalr';
import {
  ChannelModel,
  DownloadItem,
  AppSettingsModel,
  SearchResultItem,
  StartDownloadRequest,
  ChannelSyncRequest,
  FileInfoItem,
} from '@/types';

const API_BASE = '/api';

export const api = {
  // Channels
  getChannels: (): Promise<ChannelModel[]> =>
    fetch(`${API_BASE}/channels`).then((res) => res.json()),

  addChannel: (url: string): Promise<ChannelModel> =>
    fetch(`${API_BASE}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }).then((res) => res.json()),

  removeChannel: (id: string): Promise<Response> =>
    fetch(`${API_BASE}/channels/${id}`, { method: 'DELETE' }),

  syncChannels: (data?: ChannelSyncRequest): Promise<DownloadItem[]> =>
    fetch(`${API_BASE}/channels/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    }).then((res) => res.json()),

  refreshMetadata: (): Promise<ChannelModel[]> =>
    fetch(`${API_BASE}/channels/refresh-metadata`, { method: 'POST' }).then(
      (res) => res.json()
    ),

  // Search
  search: (query: string): Promise<SearchResultItem[]> =>
    fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`).then((res) =>
      res.json()
    ),

  // Downloads
  getDownloads: (): Promise<DownloadItem[]> =>
    fetch(`${API_BASE}/downloads`).then((res) => res.json()),

  startDownload: (req: StartDownloadRequest): Promise<DownloadItem> =>
    fetch(`${API_BASE}/downloads/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).then((res) => res.json()),

  cancelDownload: (id: string): Promise<Response> =>
    fetch(`${API_BASE}/downloads/${id}/cancel`, { method: 'POST' }),

  clearHistory: (): Promise<Response> =>
    fetch(`${API_BASE}/downloads/clear`, { method: 'DELETE' }),

  // Settings
  getSettings: (): Promise<AppSettingsModel> =>
    fetch(`${API_BASE}/settings`).then((res) => res.json()),

  saveSettings: (settings: AppSettingsModel): Promise<AppSettingsModel> =>
    fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).then((res) => res.json()),

  // Files (only media files or directories)
  getFiles: (subDir = ''): Promise<FileInfoItem[]> =>
    fetch(`${API_BASE}/files?subDir=${encodeURIComponent(subDir)}`).then((res) =>
      res.json()
    ),
};

export const createSignalRConnection = (): signalR.HubConnection => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/downloadHub')
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
};
