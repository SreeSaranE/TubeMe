import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Tv,
  Film,
  Info,
  AlertTriangle,
  HardDrive,
  Calendar,
  FileCode,
} from 'lucide-react';
import { MediaVideoItem } from '@/types';
import { api } from '@/services/api';
import { formatDate } from '@/lib/utils';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
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

export function VideoPlayerTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videos, setVideos] = useState<MediaVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsPopover, setShowDetailsPopover] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPath = searchParams.get('path') || '';

  // Load all videos for playlist / recommendations sidebar
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const list = await api.getVideos();
        setVideos(list || []);
        if (!currentPath && list.length > 0) {
          setSearchParams({ path: list[0].relativePath });
        }
      } catch (err) {
        console.error('Failed to load videos:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const currentVideo = videos.find((v) => v.relativePath === currentPath) || null;

  // Up next videos (excluding current)
  const upNextVideos = videos.filter((v) => v.relativePath !== currentPath);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDeleteVideo = async () => {
    if (!currentVideo) return;
    const deletedTitle = currentVideo.title;
    setIsDeleting(true);
    try {
      const res = await api.deleteMediaVideo(currentVideo.relativePath);
      if (!res.ok) {
        throw new Error('Server returned ' + res.status);
      }
      const updated = videos.filter((v) => v.relativePath !== currentVideo.relativePath);
      setVideos(updated);
      setShowDeleteConfirm(false);
      setShowDetailsPopover(false);
      toast({
        variant: 'success',
        title: 'Video deleted',
        description: `"${deletedTitle}" has been deleted successfully.`,
      });
      if (updated.length > 0) {
        setSearchParams({ path: updated[0].relativePath });
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
      toast({
        variant: 'destructive',
        title: 'Deletion failed',
        description: 'Failed to delete the video file from storage.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !currentVideo) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <span className="text-sm font-medium text-[var(--text-muted)]">Loading Video Player...</span>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="placeholder-view h-full flex items-center justify-center py-12">
        <div className="placeholder-box">
          <div className="placeholder-icon">
            <Film className="h-8 w-8" />
          </div>
          <h2>Video Not Found</h2>
          <p>The requested video file could not be located or may have been moved.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary h-10 px-5 text-sm font-medium mt-4"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
      {/* 1. Header Row: Left "Back to Home" & Right "Up Next", perfectly aligned in the same row with top padding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shrink-0 pt-3 pb-3">
        {/* Left Header: Back to Home Button */}
        <div className="lg:col-span-8 flex items-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary text-xs sm:text-sm h-9 px-3.5 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Right Header: Up Next Title (aligned in the same horizontal row) */}
        <div className="lg:col-span-4 flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
          <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
            Up Next ({upNextVideos.length})
          </h3>
        </div>
      </div>

      {/* 2. Main Content Grid: Cinema Left Column (Fixed in View) + Right Column (Independently Scrollable) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 items-start overflow-hidden">
        {/* Left Column: Main Video Player, Title, and Channel Row */}
        <div className="lg:col-span-8 flex flex-col min-h-0 space-y-3">
          {/* Video Container (16:9 Cinema Aspect Ratio constrained to viewport) */}
          <div className="relative aspect-video max-h-[calc(100vh-18rem)] w-full rounded-[var(--radius-md)] overflow-hidden bg-black shadow-lg border border-[var(--border)] shrink-0 flex items-center justify-center">
            <video
              key={currentVideo.streamUrl}
              ref={videoRef}
              src={currentVideo.streamUrl}
              poster={currentVideo.thumbnailUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            >
              {currentVideo.hasSubtitles && currentVideo.subtitleUrl && (
                <track
                  kind="subtitles"
                  src={currentVideo.subtitleUrl}
                  srcLang="en"
                  label="English"
                  default
                />
              )}
              Your browser does not support HTML5 video playback.
            </video>
          </div>

          {/* Video Title */}
          <h1
            className="text-base sm:text-xl font-semibold tracking-tight text-[var(--text-primary)] leading-snug line-clamp-2 shrink-0"
            title={currentVideo.title}
          >
            {currentVideo.title}
          </h1>

          {/* Channel Row: Logo, Name & "Details" Popover */}
          <div className="flex items-center justify-between gap-4 pb-2.5 border-b border-[var(--border)] shrink-0">
            {/* Channel Info with enlarged logo */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0 flex items-center justify-center shadow-xs">
                {currentVideo.channelAvatarUrl ? (
                  <img
                    src={currentVideo.channelAvatarUrl}
                    alt={currentVideo.channelName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Tv className="h-6 w-6 text-[var(--text-muted)]" />
                )}
              </div>

              <h3 className="font-semibold text-base text-[var(--text-primary)] truncate">
                {currentVideo.channelName}
              </h3>
            </div>

            {/* Details Popover -> Anchored right to Details button */}
            <Popover open={showDetailsPopover} onOpenChange={setShowDetailsPopover}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn btn-secondary text-xs sm:text-sm h-9 px-4 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="View video details"
                >
                  <Info className="h-4 w-4" />
                  <span>Details</span>
                </button>
              </PopoverTrigger>

              <PopoverContent align="end" sideOffset={8} className="w-80 p-4 space-y-3 shadow-xl border border-[var(--border)] bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
                  <Info className="h-4 w-4 text-[var(--text-primary)]" />
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">Video Details</h4>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Space / File Size */}
                  <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <HardDrive className="h-4 w-4 text-[var(--text-primary)]" />
                      <span className="font-medium">Space</span>
                    </div>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {formatBytes(currentVideo.size)}
                    </span>
                  </div>

                  {/* Downloaded Date */}
                  <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Calendar className="h-4 w-4 text-[var(--text-primary)]" />
                      <span className="font-medium">Downloaded Date</span>
                    </div>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {formatDate(currentVideo.lastModified)}
                    </span>
                  </div>

                  {/* Format */}
                  <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <FileCode className="h-4 w-4 text-[var(--text-primary)]" />
                      <span className="font-medium">Format</span>
                    </div>
                    <span className="type-pill font-mono font-medium text-[11px] py-0.5 px-2">
                      {currentVideo.format}
                    </span>
                  </div>
                </div>

                {/* Delete Action Button inside Popover */}
                <div className="pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsPopover(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full btn text-xs h-9 px-3 font-medium bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Video</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Right Column: Suggested Videos Sidebar with its own dedicated scroll */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0 overflow-hidden">

          {upNextVideos.length === 0 ? (
            <div className="card p-6 text-center text-xs text-[var(--text-muted)]">
              No other downloaded videos available.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-2.5 scrollbar-thin">
              {upNextVideos.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSearchParams({ path: item.relativePath })}
                  className="group flex gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                >
                  {/* Small 16:9 Thumbnail */}
                  <div className="relative w-36 aspect-video rounded-[var(--radius-sm)] overflow-hidden bg-black shrink-0 border border-[var(--border)]">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90" fill="%2318181b"><rect width="160" height="90" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="10 font-weight="bold">Video</text></svg>';
                      }}
                    />
                    <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] font-mono font-medium px-1 rounded">
                      {item.format}
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4
                      className="font-medium text-xs text-[var(--text-primary)] line-clamp-2 leading-snug group-hover:text-[var(--text-primary)]"
                      title={item.title}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
                      {item.channelName}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--text-muted)]">
                      {formatBytes(item.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog (Shadcn Alert Dialog) */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Delete Video File?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{currentVideo.title}"</strong>? This will permanently remove the media file from your storage disk.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteVideo();
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
