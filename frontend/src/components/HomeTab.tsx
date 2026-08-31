import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { MediaVideoItem } from '@/types';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { HomeFilters } from './home/HomeFilters';
import { VideoCard } from './home/VideoCard';
import { HomeEmptyState } from './home/HomeEmptyState';
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

export function HomeTab() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videos, setVideos] = useState<MediaVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size' | 'title'>('newest');

  // Deletion modal state
  const [videoToDelete, setVideoToDelete] = useState<MediaVideoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const data = await api.getVideos();
      setVideos(data || []);
    } catch (err) {
      console.error('Failed to load downloaded videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Mark video as watched (completion >= 95%)
  const handleMarkAsWatched = async (video: MediaVideoItem) => {
    try {
      await api.updateWatchProgress({
        relativePath: video.relativePath,
        title: video.title,
        channelName: video.channelName,
        currentTime: 100,
        duration: 100,
      });

      setVideos((prev) =>
        prev.map((v) =>
          v.relativePath === video.relativePath
            ? { ...v, isCompleted: true, watchProgressPercentage: 100 }
            : v
        )
      );

      toast({
        variant: 'success',
        title: 'Marked as watched',
        description: `"${video.title}" moved to Watch History.`,
      });
    } catch (err) {
      console.error('Failed to mark as watched:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update watch status.',
      });
    }
  };

  // Delete video file from device storage
  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    const target = videoToDelete;
    setIsDeleting(true);
    try {
      const res = await api.deleteMediaVideo(target.relativePath);
      if (!res.ok) {
        throw new Error('Server returned ' + res.status);
      }

      setVideos((prev) => prev.filter((v) => v.relativePath !== target.relativePath));
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
        description: 'Failed to delete video file from device.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Exclude completely watched videos from Homepage
  const unwatchedVideos = useMemo(() => {
    return videos.filter((v) => !v.isCompleted);
  }, [videos]);

  const hasWatchedVideos = useMemo(() => {
    return videos.some((v) => v.isCompleted);
  }, [videos]);

  // Unique list of channels from unwatched videos
  const channelList = useMemo(() => {
    const set = new Set<string>();
    unwatchedVideos.forEach((v) => {
      if (v.channelName) set.add(v.channelName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [unwatchedVideos]);

  // Filter & Sort
  const filteredVideos = useMemo(() => {
    return unwatchedVideos
      .filter((video) => {
        const matchesChannel =
          selectedChannel === 'All' ||
          video.channelName.toLowerCase() === selectedChannel.toLowerCase();

        const query = searchQuery.trim().toLowerCase();
        const matchesQuery =
          !query ||
          video.title.toLowerCase().includes(query) ||
          video.channelName.toLowerCase().includes(query);

        return matchesChannel && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        }
        if (sortBy === 'size') {
          return b.size - a.size;
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [unwatchedVideos, selectedChannel, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* 1. Unified Top Functions Bar & Channel Filters */}
      <HomeFilters
        videoCount={unwatchedVideos.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
        onRefresh={loadVideos}
        sortBy={sortBy}
        onSortChange={setSortBy}
        channelList={channelList}
        selectedChannel={selectedChannel}
        onChannelSelect={setSelectedChannel}
        videos={unwatchedVideos}
      />

      {/* 2. YouTube-Style Video Grid (3 videos per row) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-video w-full rounded-[var(--radius-md)] bg-[var(--bg-subtle)]" />
              <div className="flex gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[var(--bg-subtle)] shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4.5 bg-[var(--bg-subtle)] rounded w-5/6" />
                  <div className="h-3.5 bg-[var(--bg-subtle)] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <HomeEmptyState
          searchQuery={searchQuery}
          selectedChannel={selectedChannel}
          hasWatchedVideos={hasWatchedVideos}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => navigate(`/watch?path=${encodeURIComponent(video.relativePath)}`)}
              onMarkAsWatched={handleMarkAsWatched}
              onDeleteFromDevice={(v) => setVideoToDelete(v)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
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
    </div>
  );
}
