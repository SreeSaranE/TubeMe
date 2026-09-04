import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Headphones,
  PictureInPicture2,
  Maximize2,
  X,
} from 'lucide-react';
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

export function GlobalBottomPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const miniContainerRef = useRef<HTMLDivElement>(null);

  const {
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isAudioOnly,
    isPiP,
    queue,
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
    mountVideoElement,
  } = usePlayer();

  const isWatchPage = location.pathname === '/watch';
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  // Mount persistent video element into the mini-preview box when not on watch page and not in audio-only mode
  useEffect(() => {
    if (!isWatchPage && currentVideo && !isAudioOnly && miniContainerRef.current) {
      mountVideoElement(miniContainerRef.current);
    }
    return () => {
      if (!isWatchPage) {
        mountVideoElement(null);
      }
    };
  }, [isWatchPage, currentVideo, isAudioOnly, mountVideoElement]);

  // Don't render on the watch page (it has the full cinema player) or when no video is loaded
  if (isWatchPage || !currentVideo) {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayCurrentTime = isScrubbing ? scrubValue : currentTime;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
    setIsScrubbing(true);
  };

  const handleSeekCommit = () => {
    seekTo(scrubValue);
    setIsScrubbing(false);
  };

  const handleExpandToWatch = () => {
    if (currentVideo) {
      navigate(`/watch?path=${encodeURIComponent(currentVideo.relativePath)}`);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border)] shadow-2xl transition-all select-none">
      {/* Top Edge Progress Bar */}
      <div className="absolute -top-[2px] left-0 right-0 h-[2px] bg-transparent">
        <div
          className="h-full bg-red-600 transition-all duration-150"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="h-20 w-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* 1. Left Section: Media Info & Preview Slot (Constrained width, shrink-0) */}
        <div className="flex items-center gap-3 w-56 sm:w-72 shrink-0 min-w-0">
          {/* Mini Preview Box */}
          <div
            onClick={handleExpandToWatch}
            className="relative w-16 sm:w-20 aspect-video rounded-[var(--radius-sm)] overflow-hidden bg-black border border-[var(--border)] shrink-0 cursor-pointer group shadow-xs flex items-center justify-center"
            title="Click to expand to full player"
          >
            {isAudioOnly ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                <Headphones className="h-4 w-4 animate-pulse text-[var(--text-primary)]" />
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">
                  Audio
                </span>
              </div>
            ) : (
              <>
                <div ref={miniContainerRef} className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Maximize2 className="h-3.5 w-3.5" />
                </div>
              </>
            )}
          </div>

          {/* Title & Channel */}
          <div className="min-w-0 flex-1">
            <h4
              onClick={handleExpandToWatch}
              className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:underline truncate cursor-pointer leading-tight"
              title={currentVideo.title}
            >
              {currentVideo.title}
            </h4>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-[var(--text-secondary)] truncate">
                {currentVideo.channelName}
              </span>
              {isAudioOnly && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text-secondary)] shrink-0">
                  Podcast
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Center Section: Playback Controls & Timeline Slider (flex-1 with min-w-0) */}
        <div className="flex-1 min-w-0 max-w-2xl px-2 sm:px-6 flex flex-col items-center justify-center gap-1">
          {/* Controls Button Row */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Previous Video / Restart */}
            <button
              type="button"
              onClick={playPrev}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              title="Previous / Restart"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Rewind 10s: Clean side-by-side layout, zero overlapping */}
            <button
              type="button"
              onClick={() => seekBy(-10)}
              className="h-8 px-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono font-medium"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>10s</span>
            </button>

            {/* Play / Pause Circular Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer mx-1.5 shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
              ) : (
                <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Forward 10s: Clean side-by-side layout, zero overlapping */}
            <button
              type="button"
              onClick={() => seekBy(10)}
              className="h-8 px-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono font-medium"
              title="Fast forward 10 seconds"
            >
              <span>10s</span>
              <RotateCw className="h-3.5 w-3.5 shrink-0" />
            </button>

            {/* Next Video */}
            <button
              type="button"
              onClick={playNext}
              disabled={queue.length === 0}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                queue.length > 0
                  ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer'
                  : 'text-[var(--text-muted)] opacity-30 cursor-not-allowed'
              }`}
              title={queue.length > 0 ? `Next: ${queue[0].title}` : 'No more videos in queue'}
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Timeline Slider */}
          <div className="w-full flex items-center gap-2.5">
            <span className="text-[11px] font-mono text-[var(--text-muted)] w-10 text-right shrink-0 select-none">
              {formatTime(displayCurrentTime)}
            </span>

            <div className="relative flex-1 flex items-center h-4 group/slider">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={isScrubbing ? scrubValue : currentTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="w-full h-1.5 rounded-full appearance-none bg-[var(--bg-subtle)] border border-[var(--border)] accent-[var(--primary)] cursor-pointer hover:h-2 transition-all"
              />
            </div>

            <span className="text-[11px] font-mono text-[var(--text-muted)] w-10 text-left shrink-0 select-none">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* 3. Right Section: Utility Toggles & Actions (Strict shrink-0, zero overlap) */}
        <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
          {/* Audio-Only / Podcast Mode Toggle */}
          <button
            type="button"
            onClick={toggleAudioOnly}
            className={`h-8 px-2.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium border ${
              isAudioOnly
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border-transparent'
            }`}
            title={
              isAudioOnly
                ? 'Podcast / Audio Mode active. Click to switch to video.'
                : 'Switch to Podcast / Audio Mode (Saves GPU & Battery)'
            }
          >
            <Headphones className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline text-[11px]">
              {isAudioOnly ? 'Audio' : 'Podcast'}
            </span>
          </button>

          {/* Picture-in-Picture Toggle (Only in video mode) */}
          {!isAudioOnly && (
            <button
              type="button"
              onClick={togglePiP}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isPiP
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
              title="Picture-in-Picture"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
          )}

          {/* Speed Selector */}
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="h-8 px-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer text-xs font-mono font-bold flex items-center justify-center"
            title={`Playback speed: ${playbackRate}x (Click to cycle)`}
          >
            {playbackRate}x
          </button>

          {/* Volume / Mute Control */}
          <div className="hidden md:flex items-center gap-1 group/vol pl-1">
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
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
              className="w-14 lg:w-18 h-1 rounded-full appearance-none bg-[var(--bg-subtle)] accent-[var(--primary)] cursor-pointer border border-[var(--border)]"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>

          {/* Expand to Full Cinema Page */}
          <button
            type="button"
            onClick={handleExpandToWatch}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title="Expand to Full Player"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Close Player */}
          <button
            type="button"
            onClick={closePlayer}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
