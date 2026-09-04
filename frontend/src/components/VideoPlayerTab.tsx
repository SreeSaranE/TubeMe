import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Clock,
  Check,
  Headphones,
  PictureInPicture2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  ListVideo,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MediaVideoItem, PlaylistDetailModel } from '@/types';
import { api } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
import { usePlayer } from '@/context/PlayerContext';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayerTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cinemaContainerRef = useRef<HTMLDivElement>(null);

  const {
    currentVideo: playerVideo,
    playVideo,
    mountVideoElement,
    videoRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isAudioOnly,
    isPiP,
    togglePlay,
    seekTo,
    seekBy,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleAudioOnly,
    togglePiP,
    playNext,
    playPrev,
    closePlayer,
    isCompleted: globalCompleted,
  } = usePlayer();

  const [videos, setVideos] = useState<MediaVideoItem[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistDetailModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPodcastScrubbing, setIsPodcastScrubbing] = useState(false);
  const [podcastScrubValue, setPodcastScrubValue] = useState(0);

  const currentPath = searchParams.get('path') || '';
  const playlistId = searchParams.get('playlistId') || '';

  // Load videos and optional playlist details
  useEffect(() => {
    const fetchVideosAndPlaylist = async () => {
      setIsLoading(true);
      try {
        const [list, playlistData] = await Promise.all([
          api.getVideos(),
          playlistId ? api.getPlaylist(playlistId).catch(() => null) : Promise.resolve(null),
        ]);
        setVideos(list || []);
        setPlaylist(playlistData);

        if (!currentPath && list && list.length > 0) {
          const firstPath = playlistData && playlistData.videos.length > 0
            ? playlistData.videos[0].relativePath
            : list[0].relativePath;
          const nextParams: { path: string; playlistId?: string } = { path: firstPath };
          if (playlistId) nextParams.playlistId = playlistId;
          setSearchParams(nextParams);
        }
      } catch (err) {
        console.error('Failed to load videos or playlist:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideosAndPlaylist();
  }, [playlistId]);

  const currentVideo = useMemo(() => {
    return videos.find((v) => v.relativePath === currentPath) || null;
  }, [videos, currentPath]);

  // Compute upNextVideos: if in a playlist, use only the playlist's videos in sequential order after current video
  const upNextVideos = useMemo(() => {
    if (playlist && playlist.videos.length > 0) {
      const videoMap = new Map(videos.map((v) => [v.relativePath.toLowerCase(), v]));
      const currentIndex = playlist.videos.findIndex(
        (pv) => pv.relativePath.toLowerCase() === currentPath.toLowerCase()
      );

      // Remaining videos after the current video in the playlist
      const subsequentVideos = currentIndex >= 0
        ? playlist.videos.slice(currentIndex + 1)
        : playlist.videos.filter((pv) => pv.relativePath.toLowerCase() !== currentPath.toLowerCase());

      return subsequentVideos
        .map((pv) => {
          const matched = videoMap.get(pv.relativePath.toLowerCase());
          if (matched) return matched;
          return {
            id: pv.id,
            title: pv.videoTitle,
            fileName: pv.videoTitle,
            relativePath: pv.relativePath,
            channelName: pv.channelName,
            channelAvatarUrl: null,
            size: 0,
            lastModified: pv.addedAt,
            thumbnailUrl: pv.thumbnailUrl || `/api/media/thumbnail?path=${encodeURIComponent(pv.relativePath)}`,
            streamUrl: `/api/media/stream?path=${encodeURIComponent(pv.relativePath)}`,
            hasSubtitles: false,
            subtitleUrl: null,
            format: 'MP4',
            duration: pv.duration || null,
            isCompleted: pv.isCompleted,
          } as MediaVideoItem;
        })
        .filter(Boolean);
    }

    // Default: General downloads excluding current video and watched videos
    return videos.filter(
      (v) => v.relativePath !== currentPath && !v.isCompleted
    );
  }, [playlist, videos, currentPath]);

  // Current track index if inside a playlist
  const playlistIndex = useMemo(() => {
    if (!playlist || !playlist.videos) return -1;
    return playlist.videos.findIndex(
      (pv) => pv.relativePath.toLowerCase() === currentPath.toLowerCase()
    );
  }, [playlist, currentPath]);

  // Sync playback when currentVideo is selected or changed
  useEffect(() => {
    if (currentVideo) {
      if (!playerVideo || playerVideo.relativePath !== currentVideo.relativePath) {
        playVideo(currentVideo, upNextVideos, playlistId || null);
      }
    }
  }, [currentVideo?.relativePath, upNextVideos, playlistId]);

  // Synchronize URL search params when global player auto-advances (e.g. video ended or next clicked)
  useEffect(() => {
    if (playerVideo && playerVideo.relativePath && playerVideo.relativePath !== currentPath) {
      const nextParams: { path: string; playlistId?: string } = { path: playerVideo.relativePath };
      if (playlistId) {
        nextParams.playlistId = playlistId;
      }
      setSearchParams(nextParams);
    }
  }, [playerVideo?.relativePath]);

  // Mount persistent video into cinema container when active and not in audio-only mode
  useEffect(() => {
    const container = cinemaContainerRef.current;
    if (container && !isAudioOnly) {
      if (videoRef.current) {
        videoRef.current.controls = true;
      }
      mountVideoElement(container);
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.controls = false;
      }
      mountVideoElement(null);
    };
  }, [cinemaContainerRef.current, isAudioOnly, currentVideo?.relativePath, mountVideoElement]);

  // Keyboard shortcuts when on watch page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        seekBy(-10);
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        seekBy(10);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekBy, toggleMute]);

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

      // Stop global player if deleting the active video
      if (playerVideo?.relativePath === currentVideo.relativePath) {
        closePlayer();
      }

      const updated = videos.filter((v) => v.relativePath !== currentVideo.relativePath);
      setVideos(updated);
      setShowDeleteConfirm(false);
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
      <div className="flex items-center justify-center min-h-[60vh] py-24 w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
          <span className="text-sm font-medium text-[var(--text-muted)]">Loading Video Player...</span>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="placeholder-view min-h-[60vh] flex items-center justify-center py-12 w-full px-4">
        <div className="placeholder-box">
          <div className="placeholder-icon">
            <Film className="h-8 w-8" />
          </div>
          <h2>Video Not Found</h2>
          <p>The requested video file could not be located or may have been moved.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-primary h-10 px-5 text-sm font-medium mt-4 cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = currentVideo.isCompleted || globalCompleted;

  return (
    <div className="w-full flex flex-col min-h-0">
      {/* 1. Top Navigation Bar: Sticky across all viewports with smooth blur backdrop */}
      <header className="sticky top-0 z-40 bg-[var(--bg-app)]/95 backdrop-blur-md border-b border-[var(--border)] px-3 sm:px-4 lg:px-6 py-2 shrink-0">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3">
          {/* Left: Mobile Sidebar Trigger + Back Button */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="md:hidden shrink-0">
              <SidebarTrigger className="h-8 w-8" />
            </div>

            <button
              type="button"
              onClick={() => {
                if (playlistId) {
                  navigate(`/playlists?id=${encodeURIComponent(playlistId)}`);
                } else {
                  navigate('/');
                }
              }}
              className="btn btn-secondary text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3.5 font-medium flex items-center gap-1.5 cursor-pointer shadow-xs truncate"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">{playlist ? `Back to ${playlist.name}` : 'Back to Home'}</span>
            </button>

            {/* Playlist Track Indicator Chip */}
            {playlist && playlistIndex >= 0 && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text-secondary)] shrink-0">
                <ListVideo className="h-3.5 w-3.5 text-[var(--primary)]" />
                <span>Track {playlistIndex + 1} of {playlist.videos.length}</span>
              </div>
            )}
          </div>

          {/* Right: Watched status pill & Quick Action */}
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                <Check className="h-3 w-3" />
                <span>Watched</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Responsive Content Container */}
      <main className="w-full max-w-[1800px] mx-auto flex-1 min-h-0 pt-0 sm:pt-3 lg:pt-5 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 lg:items-start">
          
          {/* ========================================== */}
          {/* LEFT COLUMN: Fixed/Sticky Player + Details */}
          {/* ========================================== */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 flex flex-col min-h-0 space-y-3 w-full">
            
            {/* Sticky Player Frame: Pinned at top below navigation on < lg screens */}
            <div className="max-lg:sticky max-lg:top-[49px] sm:max-lg:top-[57px] max-lg:z-30 max-lg:bg-[var(--bg-app)] max-lg:pb-2.5 max-lg:pt-0">
              <div className="relative aspect-video w-full max-h-[46vh] sm:max-h-[52vh] lg:max-h-[calc(100vh-14rem)] xl:max-h-[calc(100vh-13rem)] rounded-none sm:rounded-xl overflow-hidden bg-black shadow-xl border-y sm:border border-[var(--border)] shrink-0 flex items-center justify-center">
                {isAudioOnly ? (
                  <div className="relative w-full h-full bg-[var(--bg-surface)] text-[var(--text-primary)] p-4 sm:p-5 select-none flex flex-col justify-between border border-[var(--border)] overflow-hidden">
                    {/* Blurred Video Backdrop */}
                    {currentVideo.thumbnailUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl pointer-events-none"
                        style={{ backgroundImage: `url(${currentVideo.thumbnailUrl})` }}
                      />
                    )}

                    {/* Top Header Row inside Podcast Frame */}
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                          Podcast Mode • Audio Only
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={toggleAudioOnly}
                        className="btn btn-secondary text-xs h-8 px-3 font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Switch back to Video Mode"
                      >
                        <Film className="h-3.5 w-3.5" />
                        <span>Video Mode</span>
                      </button>
                    </div>

                    {/* Center Artwork & Media Info */}
                    <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1 space-y-2 text-center">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-md)] overflow-hidden bg-black shadow-lg border border-[var(--border)] shrink-0 flex items-center justify-center group">
                        {currentVideo.thumbnailUrl ? (
                          <img
                            src={currentVideo.thumbnailUrl}
                            alt={currentVideo.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Headphones className="h-8 w-8 text-[var(--text-muted)]" />
                        )}
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <Headphones className="h-7 w-7 text-white drop-shadow-sm" />
                        </div>
                      </div>

                      <div className="space-y-0.5 max-w-lg px-4">
                        <h3
                          className="font-bold text-sm sm:text-base text-[var(--text-primary)] line-clamp-1 leading-snug"
                          title={currentVideo.title}
                        >
                          {currentVideo.title}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
                          {currentVideo.channelName}
                        </p>
                      </div>

                      {/* Equalizer Bars matching theme primary */}
                      <div className="flex items-end gap-1 h-4 pt-0.5">
                        {[40, 75, 95, 60, 100, 80, 45, 85, 65, 95, 50, 90].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full ${
                              isPlaying
                                ? 'bg-[var(--primary)] animate-bounce'
                                : 'bg-[var(--text-muted)] opacity-40'
                            }`}
                            style={{
                              height: isPlaying ? `${h}%` : '20%',
                              animationDelay: `${(i * 0.12) - 1.4}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bottom Full Controls Console */}
                    <div className="relative z-10 w-full max-w-xl mx-auto space-y-1.5 pt-2 border-t border-[var(--border)]">
                      {/* Timeline Scrubber */}
                      <div className="w-full flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[var(--text-muted)] w-10 text-right shrink-0 select-none">
                          {formatTime(isPodcastScrubbing ? podcastScrubValue : currentTime)}
                        </span>

                        <div className="relative flex-1 flex items-center h-4 group/slider">
                          <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            step={0.5}
                            value={isPodcastScrubbing ? podcastScrubValue : currentTime}
                            onChange={(e) => {
                              setPodcastScrubValue(parseFloat(e.target.value));
                              setIsPodcastScrubbing(true);
                            }}
                            onMouseUp={() => {
                              seekTo(podcastScrubValue);
                              setIsPodcastScrubbing(false);
                            }}
                            onTouchEnd={() => {
                              seekTo(podcastScrubValue);
                              setIsPodcastScrubbing(false);
                            }}
                            className="w-full h-1.5 rounded-full appearance-none bg-[var(--bg-subtle)] border border-[var(--border)] accent-[var(--primary)] cursor-pointer hover:h-2 transition-all"
                          />
                        </div>

                        <span className="text-[11px] font-mono text-[var(--text-muted)] w-10 text-left shrink-0 select-none">
                          {formatTime(duration)}
                        </span>
                      </div>

                      {/* Buttons Row */}
                      <div className="flex items-center justify-between gap-2 px-1">
                        {/* Left: Speed Button */}
                        <div className="flex items-center gap-2 w-20 sm:w-24">
                          <button
                            type="button"
                            onClick={() => {
                              const rates = [1, 1.25, 1.5, 2, 0.75];
                              const idx = rates.indexOf(playbackRate);
                              setPlaybackRate(rates[(idx + 1) % rates.length]);
                            }}
                            className="text-xs font-mono font-bold px-2 py-1 rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                            title="Playback speed"
                          >
                            {playbackRate}x
                          </button>
                        </div>

                        {/* Center: Prev, -10s, Play/Pause, +10s, Next */}
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={playPrev}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                            title="Previous / Restart"
                          >
                            <SkipBack className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => seekBy(-10)}
                            className="h-8 px-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono font-medium"
                            title="Rewind 10 seconds (J / Left)"
                          >
                            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                            <span>10s</span>
                          </button>

                          <button
                            type="button"
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer mx-1 shrink-0"
                            title={isPlaying ? 'Pause (Space / K)' : 'Play (Space / K)'}
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5 fill-current" />
                            ) : (
                              <Play className="h-5 w-5 fill-current ml-0.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => seekBy(10)}
                            className="h-8 px-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono font-medium"
                            title="Forward 10 seconds (L / Right)"
                          >
                            <span>10s</span>
                            <RotateCw className="h-3.5 w-3.5 shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={playNext}
                            disabled={upNextVideos.length === 0}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              upNextVideos.length > 0
                                ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer'
                                : 'text-[var(--text-muted)] opacity-30 cursor-not-allowed'
                            }`}
                            title={upNextVideos.length > 0 ? `Next: ${upNextVideos[0].title}` : 'No more videos'}
                          >
                            <SkipForward className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Right: Volume / Mute */}
                        <div className="flex items-center justify-end gap-1.5 w-20 sm:w-24">
                          <button
                            type="button"
                            onClick={toggleMute}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX className="h-4 w-4 text-rose-500" />
                            ) : volume < 0.5 ? (
                              <Volume1 className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-14 h-1 rounded-full appearance-none bg-[var(--bg-subtle)] accent-[var(--primary)] cursor-pointer border border-[var(--border)] hidden sm:block"
                            title={`Volume: ${Math.round(volume * 100)}%`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div ref={cinemaContainerRef} className="w-full h-full flex items-center justify-center bg-black" />
                )}
              </div>
            </div>

            {/* Video Details & Channel Info Section */}
            <div className="px-3 sm:px-4 lg:px-0 space-y-3">
              {/* Title */}
              <h1
                className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[var(--text-primary)] leading-snug break-words"
                title={currentVideo.title}
              >
                {currentVideo.title}
              </h1>

              {/* Channel Row & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                {/* Channel Avatar & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0 flex items-center justify-center shadow-xs">
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

                  <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] truncate">
                      {currentVideo.channelName}
                    </h3>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                        <Check className="h-3 w-3" />
                        <span>Watched</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
                  {/* Podcast / Audio-Only Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleAudioOnly}
                    className={`btn text-xs h-8 px-3.5 font-medium rounded-full flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${
                      isAudioOnly
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'btn-secondary text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={isAudioOnly ? 'Switch to Video Mode' : 'Podcast Mode: Listen in Audio-Only (Saves GPU & Battery)'}
                  >
                    <Headphones className="h-3.5 w-3.5" />
                    <span>{isAudioOnly ? 'Audio On' : 'Podcast Mode'}</span>
                  </button>

                  {/* PiP Button */}
                  {!isAudioOnly && (
                    <button
                      type="button"
                      onClick={togglePiP}
                      className={`btn btn-secondary text-xs h-8 px-3 font-medium rounded-full flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                        isPiP ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : ''
                      }`}
                      title="Picture-in-Picture"
                    >
                      <PictureInPicture2 className="h-3.5 w-3.5" />
                      <span>PiP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Metadata Summary Box (YouTube-style description box) */}
              <div className="rounded-xl p-3 sm:p-3.5 bg-[var(--bg-subtle)] border border-[var(--border)] space-y-2.5">
                {/* Summary Header Row */}
                <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)] font-medium">
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentVideo.duration && (
                      <span className="font-mono text-[var(--text-primary)] font-semibold">
                        {currentVideo.duration}
                      </span>
                    )}
                    <span>•</span>
                    <span>{formatBytes(currentVideo.size)}</span>
                    <span>•</span>
                    <span>{formatDate(currentVideo.lastModified)}</span>
                    <span>•</span>
                    <span className="type-pill font-mono text-[10px] py-0 px-2">{currentVideo.format}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="flex items-center gap-1 text-[var(--primary)] hover:underline cursor-pointer font-semibold shrink-0 ml-auto"
                  >
                    <span>{isDetailsExpanded ? 'Show less' : 'More info'}</span>
                    {isDetailsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Expanded Full Specifications */}
                {isDetailsExpanded && (
                  <div className="pt-2.5 border-t border-[var(--border)] space-y-3 animate-in fade-in duration-150 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Space / Size */}
                      <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <HardDrive className="h-4 w-4 text-[var(--text-primary)]" />
                          <span className="font-medium">File Size</span>
                        </div>
                        <span className="font-mono font-medium text-[var(--text-primary)]">
                          {formatBytes(currentVideo.size)}
                        </span>
                      </div>

                      {/* Download Date */}
                      <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <Calendar className="h-4 w-4 text-[var(--text-primary)]" />
                          <span className="font-medium">Downloaded Date</span>
                        </div>
                        <span className="font-mono font-medium text-[var(--text-primary)]">
                          {formatDate(currentVideo.lastModified)}
                        </span>
                      </div>

                      {/* Format */}
                      <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)]">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <FileCode className="h-4 w-4 text-[var(--text-primary)]" />
                          <span className="font-medium">Format</span>
                        </div>
                        <span className="type-pill font-mono font-medium text-[11px] py-0.5 px-2">
                          {currentVideo.format}
                        </span>
                      </div>

                      {/* Duration */}
                      {currentVideo.duration && (
                        <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)]">
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <Clock className="h-4 w-4 text-[var(--text-primary)]" />
                            <span className="font-medium">Duration</span>
                          </div>
                          <span className="font-mono font-medium text-[var(--text-primary)]">
                            {currentVideo.duration}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata details */}
                    <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border)] space-y-1.5 text-[var(--text-secondary)]">
                      <p className="break-all">
                        <strong className="text-[var(--text-primary)]">File Path:</strong>{' '}
                        <span className="font-mono text-[11px] select-all">{currentVideo.relativePath}</span>
                      </p>
                      <p>
                        <strong className="text-[var(--text-primary)]">Subtitles:</strong>{' '}
                        {currentVideo.hasSubtitles ? 'Embedded / Available' : 'None'}
                      </p>
                      <p>
                        <strong className="text-[var(--text-primary)]">Watch Status:</strong>{' '}
                        {isCompleted ? 'Completed (Watched)' : 'Unwatched / In Progress'}
                      </p>
                    </div>

                    {/* Delete Action Button */}
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="btn text-xs h-8 px-3.5 font-medium bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1.5 rounded-lg shadow-xs cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Video File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* RIGHT COLUMN: Up Next / Suggested Videos   */}
          {/* ========================================== */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 flex flex-col min-h-0 lg:sticky lg:top-16 lg:max-h-[calc(100vh-6rem)] w-full px-3 sm:px-4 lg:px-0 mt-3 lg:mt-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--border)] shrink-0">
              <h3 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] truncate">
                {playlist ? `Up Next • ${playlist.name} (${upNextVideos.length})` : `Up Next (${upNextVideos.length})`}
              </h3>
            </div>

            {/* List */}
            {upNextVideos.length === 0 ? (
              <div className="card p-6 text-center text-xs text-[var(--text-muted)]">
                {playlist ? 'No more videos in this playlist.' : 'No other downloaded videos available.'}
              </div>
            ) : (
              <div className="flex-1 lg:overflow-y-auto space-y-2.5 pr-0 lg:pr-1.5 scrollbar-thin">
                {upNextVideos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      const nextParams: { path: string; playlistId?: string } = { path: item.relativePath };
                      if (playlistId) nextParams.playlistId = playlistId;
                      setSearchParams(nextParams);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group flex gap-3 p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] active:bg-[var(--bg-subtle)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
                  >
                    {/* 16:9 Thumbnail */}
                    <div className="relative w-32 sm:w-36 aspect-video rounded-[var(--radius-sm)] overflow-hidden bg-black shrink-0 border border-[var(--border)]">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="%23111"><rect width="320" height="180" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="14" font-weight="bold">Media Video</text></svg>';
                        }}
                      />
                      {item.duration && (
                        <div className="absolute bottom-1.5 right-1.5 bg-black/85 backdrop-blur-xs text-white text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[3px] pointer-events-none">
                          {item.duration}
                        </div>
                      )}
                    </div>

                    {/* Title and Channel Info */}
                    <div className="min-w-0 flex-1 flex flex-col justify-start py-0.5">
                      <h4
                        className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-snug"
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-1 truncate">
                        {item.channelName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Delete Video from Device?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{currentVideo.title}"</strong>? This will permanently remove the media file from your storage disk.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteVideo();
              }}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700 font-medium cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
