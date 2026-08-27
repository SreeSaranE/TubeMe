import React from 'react';
import { Play, Tv } from 'lucide-react';
import { MediaVideoItem } from '@/types';
import { formatDate } from '@/lib/utils';

interface VideoCardProps {
  video: MediaVideoItem;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col space-y-3 select-none"
    >
      {/* Thumbnail Container (16:9 aspect ratio) */}
      <div className="relative aspect-video w-full rounded-[var(--radius-md)] overflow-hidden bg-black border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-all">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="%23111"><rect width="320" height="180" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="14" font-weight="bold">Media Video</text></svg>';
          }}
        />

        {/* Overlay Play Icon on Hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Format / Resolution Badge (Bottom-Right) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {video.hasSubtitles && (
            <span className="bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[4px]">
              CC
            </span>
          )}
          <span className="bg-black/85 backdrop-blur-xs text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px]">
            {video.format}
          </span>
        </div>
      </div>

      {/* Video Info: Avatar & Title Block */}
      <div className="flex items-start gap-3">
        {/* Channel Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0 flex items-center justify-center mt-0.5">
          {video.channelAvatarUrl ? (
            <img
              src={video.channelAvatarUrl}
              alt={video.channelName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Tv className="h-4 w-4 text-[var(--text-muted)]" />
          )}
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <h3
            className="font-medium text-sm sm:text-[15px] leading-snug text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--text-primary)]"
            title={video.title}
          >
            {video.title}
          </h3>

          <div className="text-xs text-[var(--text-secondary)] font-medium truncate">
            {video.channelName}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <span>{formatBytes(video.size)}</span>
            <span>•</span>
            <span>{formatDate(video.lastModified)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
