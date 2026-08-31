import React, { useState } from 'react';
import { Play, Tv, Check, MoreVertical, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';
import { MediaVideoItem } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface VideoCardProps {
  video: MediaVideoItem;
  onClick: () => void;
  onMarkAsWatched?: (video: MediaVideoItem) => void;
  onDeleteFromDevice?: (video: MediaVideoItem) => void;
  onRemoveFromHistory?: (video: MediaVideoItem) => void;
}

export function VideoCard({
  video,
  onClick,
  onMarkAsWatched,
  onDeleteFromDevice,
  onRemoveFromHistory,
}: VideoCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const hasMenuActions = Boolean(onMarkAsWatched || onDeleteFromDevice || onRemoveFromHistory);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col space-y-3 select-none relative"
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

        {/* Watched Badge (Top-Left) */}
        {video.isCompleted && (
          <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-xs text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-[4px] border border-white/10 shadow-sm flex items-center gap-1 pointer-events-none">
            <Check className="h-3 w-3 text-emerald-400" />
            <span>Watched</span>
          </div>
        )}

        {/* Format / Duration / Resolution Badge (Bottom-Right) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 pointer-events-none">
          {video.hasSubtitles && (
            <span className="bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[4px]">
              CC
            </span>
          )}
          <span className="bg-black/85 backdrop-blur-xs text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px]">
            {video.format}
          </span>
          {video.duration && (
            <span className="bg-black/90 backdrop-blur-xs text-white text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[4px]">
              {video.duration}
            </span>
          )}
        </div>

        {/* Watch Progress Bar (Bottom Edge, YouTube Style) */}
        {typeof video.watchProgressPercentage === 'number' && video.watchProgressPercentage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${Math.min(100, video.isCompleted ? 100 : video.watchProgressPercentage)}%` }}
            />
          </div>
        )}
      </div>

      {/* Video Info: Avatar, Title Block & 3-Dots Menu */}
      <div className="flex items-start gap-3.5">
        {/* Channel Avatar Logo */}
        <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0 flex items-center justify-center mt-0.5 shadow-xs">
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
            <Tv className="h-5 w-5 text-[var(--text-muted)]" />
          )}
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <h3
            className="font-semibold text-[15px] sm:text-base leading-snug text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--text-primary)] transition-colors pr-1"
            title={video.title}
          >
            {video.title}
          </h3>

          <div className="text-[13px] text-[var(--text-secondary)] font-medium truncate">
            {video.channelName}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            {video.duration && (
              <>
                <span className="text-[var(--text-secondary)] font-medium">{video.duration}</span>
                <span>•</span>
              </>
            )}
            <span>{formatBytes(video.size)}</span>
            <span>•</span>
            <span>{formatDate(video.lastModified)}</span>
          </div>
        </div>

        {/* 3-Dots Popup Menu */}
        {hasMenuActions && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0 mt-0.5">
            <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                  title="More options"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                className="w-48 p-1.5 bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl rounded-[var(--radius-md)] text-xs space-y-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {onMarkAsWatched && !video.isCompleted && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onMarkAsWatched(video);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] transition-colors text-left cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Mark as watched</span>
                  </button>
                )}

                {onRemoveFromHistory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onRemoveFromHistory(video);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] transition-colors text-left cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                    <span>Remove from history</span>
                  </button>
                )}

                {onDeleteFromDevice && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onDeleteFromDevice(video);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-[var(--radius-sm)] transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>Delete from device</span>
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
