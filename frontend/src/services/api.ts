import * as signalR from '@microsoft/signalr';
import {
  ChannelModel,
  DownloadItem,
  AppSettingsModel,
  SearchResultItem,
  StartDownloadRequest,
  ChannelSyncRequest,
  FileInfoItem,
  MediaVideoItem,
} from '@/types';

const API_BASE = '/api';

export const api = {
  // Channels
  getChannels: (): Promise<ChannelModel[]> =>
    fetch(`${API_BASE}/channels`).then((res) => res.json()),

  // Categories Management
  getCategoriesDetails: (): Promise<import('@/types').CategoryDetailModel[]> =>
    fetch(`${API_BASE}/categories`).then((res) => res.json()),

  addCategory: (name: string): Promise<Response> =>
    fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  renameCategory: (oldName: string, newName: string): Promise<Response> =>
    fetch(`${API_BASE}/categories/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName }),
    }),

  deleteCategory: (name: string): Promise<Response> =>
    fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  addChannel: (url: string, category: string = 'General'): Promise<ChannelModel> =>
    fetch(`${API_BASE}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, category }),
    }).then((res) => res.json()),

  updateChannelCategory: (id: string, category: string): Promise<Response> =>
    fetch(`${API_BASE}/channels/${id}/category`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    }),

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
    fetch(`${API_BASE}/downloads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).then((res) => res.json()),

  cancelDownload: (id: string): Promise<Response> =>
    fetch(`${API_BASE}/downloads/${id}/cancel`, { method: 'POST' }),

  clearHistory: (): Promise<Response> =>
    fetch(`${API_BASE}/downloads/clear-history`, { method: 'POST' }),

  // Settings
  getSettings: (): Promise<AppSettingsModel> =>
    fetch(`${API_BASE}/settings`).then((res) => res.json()),

  saveSettings: (settings: AppSettingsModel): Promise<AppSettingsModel> =>
    fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).then((res) => res.json()),

  // Files & Media
  getFiles: (subDir = ''): Promise<FileInfoItem[]> =>
    fetch(`${API_BASE}/files?subDir=${encodeURIComponent(subDir)}`).then((res) =>
      res.json()
    ),

  getVideos: (): Promise<MediaVideoItem[]> =>
    fetch(`${API_BASE}/media/videos`).then((res) => res.json()),

  deleteMediaVideo: (relativePath: string): Promise<Response> =>
    fetch(`${API_BASE}/media/file?path=${encodeURIComponent(relativePath)}`, {
      method: 'DELETE',
    }),
};

export const createSignalRConnection = (): signalR.HubConnection => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/downloadHub')
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
};
