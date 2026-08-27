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
  Folder,
} from 'lucide-react';
import { MediaVideoItem } from '@/types';
import { api } from '@/services/api';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export function VideoPlayerTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videos, setVideos] = useState<MediaVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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
    setIsDeleting(true);
    try {
      await api.deleteMediaVideo(currentVideo.relativePath);
      const updated = videos.filter((v) => v.relativePath !== currentVideo.relativePath);
      setVideos(updated);
      setShowDeleteConfirm(false);
      setShowDetailsDialog(false);
      if (updated.length > 0) {
        setSearchParams({ path: updated[0].relativePath });
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !currentVideo) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <span className="text-sm font-semibold text-[var(--text-muted)]">Loading Video Player...</span>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="placeholder-view py-20">
        <div className="placeholder-box">
          <div className="placeholder-icon">
            <Film className="h-8 w-8" />
          </div>
          <h2>Video Not Found</h2>
          <p>The requested video file could not be located or may have been moved.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary h-10 px-5 text-sm font-bold mt-4"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Simple Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn btn-secondary text-xs sm:text-sm h-9 px-3.5 font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Main Layout: Left Main Video Column + Fixed/Sticky Right Suggested Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Main Video Player, Title, and Channel Row */}
        <div className="lg:col-span-8 space-y-4">
          {/* Video Container (16:9 Cinema Aspect Ratio) */}
          <div className="relative aspect-video w-full rounded-[var(--radius-md)] overflow-hidden bg-black shadow-lg border border-[var(--border)]">
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
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
            {currentVideo.title}
          </h1>

          {/* Channel Row: Logo, Name & "Details" button */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
            {/* Channel Info (Only Logo + Name) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                {currentVideo.channelAvatarUrl ? (
                  <img
                    src={currentVideo.channelAvatarUrl}
                    alt={currentVideo.channelName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Tv className="h-5 w-5 text-[var(--text-muted)]" />
                )}
              </div>

              <h3 className="font-semibold text-base text-[var(--text-primary)]">
                {currentVideo.channelName}
              </h3>
            </div>

            {/* Details Button -> Opens Shadcn Dialog */}
            <button
              type="button"
              onClick={() => setShowDetailsDialog(true)}
              className="btn btn-secondary text-xs sm:text-sm h-9 px-4 font-medium flex items-center gap-1.5 transition-colors"
              title="View video details"
            >
              <Info className="h-4 w-4" />
              <span>Details</span>
            </button>
          </div>
        </div>

        {/* Right Column: Fixed/Sticky Suggested Videos Sidebar */}
        <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-18 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1 scrollbar-thin">
          <div className="pb-1 border-b border-[var(--border)]">
            <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
              Up Next ({upNextVideos.length})
            </h3>
          </div>

          {upNextVideos.length === 0 ? (
            <div className="card p-6 text-center text-xs text-[var(--text-muted)]">
              No other downloaded videos available.
            </div>
          ) : (
            <div className="space-y-3">
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

      {/* Details Dialog (Using Shadcn Dialog: Space, Downloaded Date, Format, Storage Path, Delete) */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-[var(--text-primary)]" />
              Video Details
            </DialogTitle>
            <DialogDescription>
              Technical file specifications and storage details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs sm:text-sm">
            {/* Space / File Size */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border)]">
              <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                <HardDrive className="h-4.5 w-4.5 text-[var(--text-primary)]" />
                <span className="font-medium">Space</span>
              </div>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {formatBytes(currentVideo.size)}
              </span>
            </div>

            {/* Downloaded Date */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border)]">
              <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                <Calendar className="h-4.5 w-4.5 text-[var(--text-primary)]" />
                <span className="font-medium">Downloaded Date</span>
              </div>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {formatDate(currentVideo.lastModified)}
              </span>
            </div>

            {/* Format */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border)]">
              <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                <FileCode className="h-4.5 w-4.5 text-[var(--text-primary)]" />
                <span className="font-medium">Format</span>
              </div>
              <span className="type-pill font-mono font-medium text-xs">
                {currentVideo.format}
              </span>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            <button
              type="button"
              onClick={() => {
                setShowDetailsDialog(false);
                setShowDeleteConfirm(true);
              }}
              className="btn text-xs h-9 px-3.5 font-medium bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Video</span>
            </button>

            <DialogClose asChild>
              <button
                type="button"
                className="btn btn-secondary text-xs h-9 px-4 font-medium"
              >
                Close
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Shadcn Dialog) */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Delete Video File?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{currentVideo.title}"</strong>? This will permanently remove the media file from your storage disk.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="btn btn-secondary text-xs h-9 px-4 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteVideo}
              disabled={isDeleting}
              className="btn text-xs h-9 px-4 font-bold bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
