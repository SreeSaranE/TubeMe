import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Trash2,
  Search,
  Check,
  Play,
  Tv,
  Film,
  ArrowUpDown,
  X,
  AlertTriangle,
} from 'lucide-react';
import { MediaVideoItem, WatchHistoryItem } from '@/types';
import { api } from '@/services/api';
import { formatDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface WatchedVideoItem extends MediaVideoItem {
  lastWatchedAt?: string;
}

export function HistoryTab() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [watchedVideos, setWatchedVideos] = useState<WatchedVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'size' | 'title'>('recent');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const [videosList, historyList] = await Promise.all([
        api.getVideos().catch(() => [] as MediaVideoItem[]),
        api.getWatchHistory().catch(() => [] as WatchHistoryItem[]),
      ]);

      const historyMap = new Map<string, WatchHistoryItem>();
      historyList.forEach((h) => {
        historyMap.set(h.relativePath.toLowerCase(), h);
      });

      // Filter all completely watched videos
      const completed: WatchedVideoItem[] = videosList
        .filter((v) => {
          if (v.isCompleted) return true;
          const h = historyMap.get(v.relativePath.toLowerCase());
          return h ? h.isCompleted : false;
        })
        .map((v) => {
          const h = historyMap.get(v.relativePath.toLowerCase());
          return {
            ...v,
            isCompleted: true,
            watchProgressPercentage: 100,
            lastWatchedAt: h?.lastWatchedAt,
          };
        });

      setWatchedVideos(completed);
    } catch (err) {
      console.error('Failed to load watch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleRemoveItem = async (e: React.MouseEvent, item: WatchedVideoItem) => {
    e.stopPropagation();
    try {
      await api.deleteWatchHistory(item.relativePath);
      setWatchedVideos((prev) => prev.filter((v) => v.relativePath !== item.relativePath));
      toast({
        variant: 'success',
        title: 'Removed from history',
        description: `"${item.title}" was removed from your watch history.`,
      });
    } catch (err) {
      console.error('Failed to remove history item:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove video from watch history.',
      });
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await api.clearWatchHistory();
      setWatchedVideos([]);
      setShowClearConfirm(false);
      toast({
        variant: 'success',
        title: 'History cleared',
        description: 'Your watch history has been cleared.',
      });
    } catch (err) {
      console.error('Failed to clear watch history:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear watch history.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Filter and sort watched videos
  const filteredAndSortedVideos = useMemo(() => {
    let list = watchedVideos.filter((v) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.channelName.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'recent': {
          const timeA = a.lastWatchedAt ? new Date(a.lastWatchedAt).getTime() : new Date(a.lastModified).getTime();
          const timeB = b.lastWatchedAt ? new Date(b.lastWatchedAt).getTime() : new Date(b.lastModified).getTime();
          return timeB - timeA;
        }
        case 'oldest': {
          const timeA = a.lastWatchedAt ? new Date(a.lastWatchedAt).getTime() : new Date(a.lastModified).getTime();
          const timeB = b.lastWatchedAt ? new Date(b.lastWatchedAt).getTime() : new Date(b.lastModified).getTime();
          return timeA - timeB;
        }
        case 'size':
          return b.size - a.size;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return list;
  }, [watchedVideos, searchQuery, sortBy]);

  return (
    <div className="space-y-7">
      {/* 1. Header Section (Aligned with Home and Search) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-3.5">
          <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-[var(--text-primary)]">
            Watch History
          </h1>
          <span className="counter-badge text-xs px-2.5 py-0.5 font-medium">
            {watchedVideos.length} {watchedVideos.length === 1 ? 'video' : 'videos'}
          </span>
        </div>

        {/* Clear History Button */}
        {watchedVideos.length > 0 && (
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-secondary h-9 px-3.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
              title="Clear all watch history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Controls Row: Search & Sort */}
      {watchedVideos.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-4.5 w-4.5 text-[var(--text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search watched videos or channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Sort Selector (shadcn Select) */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="h-4 w-4 text-[var(--text-muted)] hidden sm:inline" />
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
              <SelectTrigger className="w-[175px] sm:w-[190px] h-11 text-xs sm:text-sm font-medium bg-[var(--bg-subtle)] border-[var(--border)] rounded-[var(--radius-md)]">
                <SelectValue placeholder="Sort history" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="recent">Recently Watched</SelectItem>
                <SelectItem value="oldest">Oldest Watched</SelectItem>
                <SelectItem value="size">Largest Size</SelectItem>
                <SelectItem value="title">Alphabetical (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* 3. Main Content: Loading, Empty State or Video Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Loading Watch History...
            </span>
          </div>
        </div>
      ) : watchedVideos.length === 0 ? (
        /* Empty State */
        <div className="card p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
            <History className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-[var(--text-primary)]">
              No Watched Videos Yet
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Videos that you watch 95% or more will automatically appear in this watch history list.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary h-9 px-4 text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer mt-2"
          >
            <Film className="h-4 w-4" />
            <span>Browse Videos</span>
          </button>
        </div>
      ) : filteredAndSortedVideos.length === 0 ? (
        <div className="card p-8 text-center text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto my-8">
          No watched videos matched your search query "{searchQuery}".
        </div>
      ) : (
        /* Video Grid (Matching Homepage 3-column layout) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => navigate(`/watch?path=${encodeURIComponent(video.relativePath)}`)}
              className="group cursor-pointer flex flex-col space-y-3 select-none relative"
            >
              {/* Thumbnail Container (16:9 Cinema Aspect Ratio) */}
              <div className="relative aspect-video w-full rounded-[var(--radius-md)] overflow-hidden bg-black border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-all">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="%23111"><rect width="320" height="180" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="14" font-weight="bold">Watched Video</text></svg>';
                  }}
                />

                {/* Overlay Play Icon on Hover */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Watched Badge (Top-Left) */}
                <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-xs text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-[4px] border border-white/10 shadow-sm flex items-center gap-1 pointer-events-none">
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>Watched</span>
                </div>

                {/* Quick Remove from History Button (Top-Right on Hover) */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveItem(e, video)}
                  title="Remove from watch history"
                  className="absolute top-2 right-2 p-1.5 rounded-[var(--radius-sm)] bg-black/75 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Format & Duration Badges (Bottom-Right) */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 pointer-events-none">
                  <span className="bg-black/85 backdrop-blur-xs text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px]">
                    {video.format}
                  </span>
                  {video.duration && (
                    <span className="bg-black/90 backdrop-blur-xs text-white text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[4px]">
                      {video.duration}
                    </span>
                  )}
                </div>

                {/* Full Red Progress Bar (YouTube Style) */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 overflow-hidden pointer-events-none">
                  <div className="h-full bg-red-600 w-full" />
                </div>
              </div>

              {/* Video Info Block */}
              <div className="flex items-start gap-3.5">
                {/* Channel Avatar */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0 flex items-center justify-center mt-0.5 shadow-xs">
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
                    className="font-semibold text-sm sm:text-base leading-snug text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--text-primary)] transition-colors"
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
                        <span className="text-[var(--text-secondary)] font-medium">
                          {video.duration}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formatBytes(video.size)}</span>
                    {video.lastWatchedAt && (
                      <>
                        <span>•</span>
                        <span>{formatDate(video.lastWatchedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear History Confirmation Alert Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Clear Watch History?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear your watch history? This will remove all completed video watch records across your library.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleClearAll();
              }}
              disabled={isClearing}
              className="bg-rose-600 text-white hover:bg-rose-700 font-medium"
            >
              {isClearing ? 'Clearing...' : 'Clear All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
