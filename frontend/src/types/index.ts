export interface ChannelModel {
  id: string;
  url: string;
  name: string;
  avatarUrl: string;
  category?: string;
  lastSyncedAt?: string | null;
  createdAt: string;
  isSyncing: boolean;
}

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  uploader: string;
  thumbnail: string;
  format: string;
  resolution: string;
  type: string; // 'Video' | 'Playlist' | 'ChannelSync'
  status: string; // 'Queued' | 'Downloading' | 'Completed' | 'Failed' | 'Cancelled'
  progressPercentage: number;
  downloadSpeed: string;
  eta: string;
  error: string;
  logs: string[];
  createdAt: string;
  completedAt?: string | null;
  includeSubtitles: boolean;
  subtitleLangs: string;
  daysLimit?: number;
  outputDir: string;
}

export interface AppSettingsModel {
  outputDir: string;
  dataDir: string;
  archiveFile: string;
  channelsFile: string;
  defaultResolution: string;
  includeSubtitles: boolean;
  subtitleLangs: string;
  daysLimit: number;
  maxConcurrentJobs: number;
  concurrentFragments: number;
}

export interface SearchResultItem {
  id: string;
  url: string;
  title: string;
  channelName: string;
  channelUrl: string;
  thumbnail: string;
  duration: string;
  viewCount?: number;
  uploadDate: string;
  isPlaylist: boolean;
}

export interface StartDownloadRequest {
  url: string;
  resolution?: string;
  subtitles?: boolean;
  subtitleLangs?: string;
  audioOnly: boolean;
  customOutputDir?: string;
  daysLimit?: number;
}

export interface ChannelSyncRequest {
  channelIds?: string[] | null;
  category?: string;
  resolution?: string;
  daysLimit?: number;
  subtitles?: boolean;
}

export interface AddChannelRequest {
  url: string;
  category?: string;
}

export interface FileInfoItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
}

export type Theme = 'dark' | 'light' | 'system';
