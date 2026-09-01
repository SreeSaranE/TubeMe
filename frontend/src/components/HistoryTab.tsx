import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Trash2,
  Search,
  Film,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';
import { MediaVideoItem } from '@/types';
import { api } from '@/services/api';
import { VideoCard } from './home/VideoCard';
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
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'size' | 'title'>('recent');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Deletion modal state
  const [videoToDelete, setVideoToDelete] = useState<WatchedVideoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const items = await api.getWatchHistory();
      const allVideos = await api.getVideos();

      // Filter videos that are completed
      const historyMap = new Map(
        items.map((i) => [i.relativePath.replace(/\\/g, '/').toLowerCase(), i.lastWatchedAt])
      );
      const completedVideos: WatchedVideoItem[] = allVideos
        .filter((v) => {
          const normKey = (v.relativePath || '').replace(/\\/g, '/').toLowerCase();
          return v.isCompleted || historyMap.has(normKey);
        })
        .map((v) => {
          const normKey = (v.relativePath || '').replace(/\\/g, '/').toLowerCase();
          return {
            ...v,
            isCompleted: true,
            lastWatchedAt: historyMap.get(normKey) || v.lastModified,
          };
        });

      setWatchedVideos(completedVideos);
    } catch (err) {
      console.error('Failed to load watch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const res = await api.clearWatchHistory();
      if (!res.ok) {
        throw new Error('Failed to clear watch history');
      }
      setWatchedVideos([]);
      setShowClearConfirm(false);
      setSelectedChannel('All');
      toast({
        variant: 'success',
        title: 'History cleared',
        description: 'All watch history records have been cleared.',
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

  const handleRemoveHistory = async (video: WatchedVideoItem) => {
    try {
      const target = video.relativePath || video.id;
      if (target) {
        const res = await api.deleteWatchHistory(target);
        if (!res.ok) {
          throw new Error('Failed to remove from watch history');
        }
      }
      setWatchedVideos((prev) => prev.filter((v) => v.relativePath !== video.relativePath));
      toast({
        variant: 'success',
        title: 'Removed from history',
        description: `"${video.title}" removed from watch history.`,
      });
    } catch (err) {
      console.error('Failed to remove history item:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove from watch history.',
      });
    }
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    const target = videoToDelete;
    setIsDeleting(true);
    try {
      const res = await api.deleteMediaVideo(target.relativePath);
      if (!res.ok) {
        throw new Error('Server returned ' + res.status);
      }

      setWatchedVideos((prev) => prev.filter((v) => v.relativePath !== target.relativePath));
      setVideoToDelete(null);

      toast({
        variant: 'success',
        title: 'Video deleted',
        description: `"${target.title}" has been deleted from storage.`,
      });
    } catch (err) {
      console.error('Failed to delete video:', err);
      toast({
        variant: 'destructive',
        title: 'Deletion failed',
        description: 'Failed to delete video file from device storage.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Unique list of channels from watched videos
  const channelList = useMemo(() => {
    const set = new Set<string>();
    watchedVideos.forEach((v) => {
      if (v.channelName) set.add(v.channelName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [watchedVideos]);

  // Filter and sort watched videos
  const filteredAndSortedVideos = useMemo(() => {
    let list = watchedVideos.filter((v) => {
      const matchesChannel =
        selectedChannel === 'All' ||
        v.channelName.toLowerCase() === selectedChannel.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.channelName.toLowerCase().includes(q);

      return matchesChannel && matchesQuery;
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
  }, [watchedVideos, searchQuery, sortBy, selectedChannel]);

  return (
    <div className="space-y-6">
      {/* 1. Top Functions Bar: History (Count) + Search Input + Refresh + Clear + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: History Title + Counter */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
            History
          </h1>
          <span className="counter-badge text-xs px-2.5 py-0.5 font-medium">
            {watchedVideos.length}
          </span>
        </div>

        {/* Middle: Search Input (flex-1 expands across remaining space) */}
        <div className="relative flex-1 min-w-0">
          <Search className="h-4.5 w-4.5 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search watched videos or channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 h-11 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right: Actions: Refresh, Clear History, and Sort */}
        <div className="flex items-center gap-2.5 shrink-0 justify-end flex-wrap sm:flex-nowrap">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadHistory}
            disabled={isLoading}
            className="btn btn-secondary h-11 px-3.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Refresh watch history"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Clear History Button */}
          {watchedVideos.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-secondary h-11 px-3.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 shrink-0 cursor-pointer"
              title="Clear all watch history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}

          {/* Sort Selector (shadcn Select) */}
          <div className="w-full sm:w-auto">
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 text-xs sm:text-sm font-medium bg-[var(--bg-subtle)] border-[var(--border)] rounded-[var(--radius-md)]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="size">Largest Size</SelectItem>
                <SelectItem value="title">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Channel Filter Pills Row */}
      {channelList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none min-w-0 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedChannel('All')}
            className={`px-3.5 py-1.5 rounded-[var(--radius-full)] text-xs font-medium border transition-all cursor-pointer select-none shrink-0 ${
              selectedChannel === 'All'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
            }`}
          >
            All
          </button>

          {channelList.map((channel) => {
            const isSelected = selectedChannel.toLowerCase() === channel.toLowerCase();
            const count = watchedVideos.filter(
              (v) => v.channelName.toLowerCase() === channel.toLowerCase()
            ).length;

            return (
              <button
                key={channel}
                type="button"
                onClick={() => setSelectedChannel(channel)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-full)] text-xs font-medium border transition-all cursor-pointer select-none shrink-0 ${
                  isSelected
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
                }`}
              >
                <span>{channel}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                    isSelected
                      ? 'bg-[var(--primary-foreground)]/15 text-[var(--primary-foreground)]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
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
        /* Video Grid (Matching Homepage 3-column layout & popover menu) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => navigate(`/watch?path=${encodeURIComponent(video.relativePath)}`)}
              onRemoveFromHistory={handleRemoveHistory}
              onDeleteFromDevice={(v) => setVideoToDelete(v)}
            />
          ))}
        </div>
      )}

      {/* Delete Video Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(videoToDelete)} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Delete Video from Device?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{videoToDelete?.title}"</strong>? This will permanently remove the media file from your storage disk.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteVideo();
              }}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700 font-medium"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
