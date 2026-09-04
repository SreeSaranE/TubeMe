import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { MediaVideoItem } from '@/types';
import { api } from '@/services/api';

export interface PlayerContextType {
  currentVideo: MediaVideoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isAudioOnly: boolean;
  isPiP: boolean;
  isCompleted: boolean;
  queue: MediaVideoItem[];
  videoRef: React.RefObject<HTMLVideoElement | null>;

  // Actions
  playVideo: (video: MediaVideoItem, newQueue?: MediaVideoItem[]) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleAudioOnly: () => void;
  togglePiP: () => Promise<void>;
  playNext: () => void;
  playPrev: () => void;
  closePlayer: () => void;
  setQueue: React.Dispatch<React.SetStateAction<MediaVideoItem[]>>;
  mountVideoElement: (container: HTMLElement | null) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<MediaVideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1);
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);
  const [isPiP, setIsPiP] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [queue, setQueue] = useState<MediaVideoItem[]>([]);

  // Persistent native HTML5 Video element
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackHostRef = useRef<HTMLDivElement | null>(null);
  const activeContainerRef = useRef<HTMLElement | null>(null);

  // References for event handlers to avoid stale closures
  const currentVideoRef = useRef<MediaVideoItem | null>(null);
  currentVideoRef.current = currentVideo;

  const isCompletedRef = useRef<boolean>(false);
  isCompletedRef.current = isCompleted;

  const queueRef = useRef<MediaVideoItem[]>([]);
  queueRef.current = queue;

  // Initialize the persistent video element on mount
  useEffect(() => {
    const video = document.createElement('video');
    video.className = 'w-full h-full object-contain';
    video.playsInline = true;
    video.autoplay = true;
    videoRef.current = video;

    // Attach to fallback off-screen host initially
    if (fallbackHostRef.current) {
      fallbackHostRef.current.appendChild(video);
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onVolumeChange = () => {
      setVolumeState(video.volume);
      setIsMuted(video.muted);
    };

    const onLoadedMetadata = () => {
      const dur = video.duration || 0;
      setDuration(dur);
      // Resume watch progress if available
      const vid = currentVideoRef.current;
      if (vid && vid.watchProgressSeconds && vid.watchProgressSeconds > 3 && !vid.isCompleted) {
        if (dur > 0 && vid.watchProgressSeconds < dur - 5) {
          video.currentTime = vid.watchProgressSeconds;
        }
      }
    };

    const onTimeUpdate = () => {
      const cur = video.currentTime || 0;
      const dur = video.duration || 0;
      setCurrentTime(cur);

      // Strict 95% watch completion check
      if (dur > 0) {
        const ratio = cur / dur;
        if (ratio >= 0.95 && !isCompletedRef.current && currentVideoRef.current) {
          isCompletedRef.current = true;
          setIsCompleted(true);
          api
            .updateWatchProgress({
              relativePath: currentVideoRef.current.relativePath,
              title: currentVideoRef.current.title,
              channelName: currentVideoRef.current.channelName,
              currentTime: cur,
              duration: dur,
            })
            .catch((err) => console.error('Failed to update watch progress:', err));
        }
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      const cur = video.currentTime || 0;
      const dur = video.duration || 0;

      if (!isCompletedRef.current && currentVideoRef.current) {
        isCompletedRef.current = true;
        setIsCompleted(true);
        const effectiveDur = dur > 0 ? dur : (cur > 0 ? cur : 600);
        api
          .updateWatchProgress({
            relativePath: currentVideoRef.current.relativePath,
            title: currentVideoRef.current.title,
            channelName: currentVideoRef.current.channelName,
            currentTime: cur > 0 ? cur : effectiveDur,
            duration: effectiveDur,
          })
          .catch((err) => console.error('Failed to update watch progress:', err));
      }

      // Auto-play next item in queue if available
      if (queueRef.current.length > 0) {
        const nextVideo = queueRef.current[0];
        setQueue((prev) => prev.slice(1));
        playVideoInternal(nextVideo);
      }
    };

    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
      video.pause();
      video.src = '';
      if (video.parentElement) {
        video.parentElement.removeChild(video);
      }
      videoRef.current = null;
    };
  }, []);

  // Internal helper to start playing a video
  const playVideoInternal = (videoItem: MediaVideoItem) => {
    setCurrentVideo(videoItem);
    setIsCompleted(!!videoItem.isCompleted);
    isCompletedRef.current = !!videoItem.isCompleted;

    const video = videoRef.current;
    if (!video) return;

    // Set stream source
    video.src = videoItem.streamUrl;
    video.poster = videoItem.thumbnailUrl || '';

    // Clear old subtitle tracks
    while (video.firstChild) {
      video.removeChild(video.firstChild);
    }

    // Attach subtitle track if available
    if (videoItem.hasSubtitles && videoItem.subtitleUrl) {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src = videoItem.subtitleUrl;
      track.srclang = 'en';
      track.label = 'English';
      track.default = true;
      video.appendChild(track);
    }

    video.load();
    video.play().catch((err) => {
      console.warn('Auto-play blocked or waiting for user interaction:', err);
    });
  };

  // Public method to play a video and optionally set queue
  const playVideo = useCallback((videoItem: MediaVideoItem, newQueue?: MediaVideoItem[]) => {
    playVideoInternal(videoItem);
    if (newQueue) {
      setQueue(newQueue.filter((v) => v.relativePath !== videoItem.relativePath));
    }
  }, []);

  // Mount the persistent video element into a designated container
  const mountVideoElement = useCallback((container: HTMLElement | null) => {
    const video = videoRef.current;
    if (!video) return;

    if (container) {
      if (video.parentElement !== container) {
        activeContainerRef.current = container;
        const wasPlaying = !video.paused;
        container.appendChild(video);
        if (wasPlaying && video.paused) {
          video.play().catch(() => {});
        }
      }
    } else {
      // Revert back to fallback host if active container is unmounted
      if (fallbackHostRef.current && video.parentElement !== fallbackHostRef.current) {
        const wasPlaying = !video.paused;
        fallbackHostRef.current.appendChild(video);
        if (wasPlaying && video.paused) {
          video.play().catch(() => {});
        }
      }
      activeContainerRef.current = null;
    }
  }, []);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  // Seek to specific second
  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || isNaN(seconds)) return;
    const clamped = Math.max(0, Math.min(seconds, video.duration || seconds));
    video.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  // Relative seek (e.g. +10s or -10s)
  const seekBy = useCallback((deltaSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = (video.currentTime || 0) + deltaSeconds;
    const clamped = Math.max(0, Math.min(target, video.duration || target));
    video.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  // Volume control
  const setVolume = useCallback((val: number) => {
    const video = videoRef.current;
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (video) {
      video.volume = clamped;
      if (clamped > 0 && video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
    }
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Playback speed
  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    setPlaybackRateState(rate);
    if (video) {
      video.playbackRate = rate;
    }
  }, []);

  // Audio-Only Mode toggle
  const toggleAudioOnly = useCallback(() => {
    setIsAudioOnly((prev) => {
      const next = !prev;
      const video = videoRef.current;
      if (video) {
        if (next) {
          video.style.visibility = 'hidden';
        } else {
          video.style.visibility = 'visible';
        }
      }
      return next;
    });
  }, []);

  // Picture-in-Picture toggle
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  }, []);

  // Play next video in queue
  const playNext = useCallback(() => {
    if (queueRef.current.length > 0) {
      const nextVideo = queueRef.current[0];
      setQueue((prev) => prev.slice(1));
      playVideoInternal(nextVideo);
    }
  }, []);

  // Play previous video (or restart current if > 4 seconds)
  const playPrev = useCallback(() => {
    const video = videoRef.current;
    if (video && video.currentTime > 4) {
      video.currentTime = 0;
      setCurrentTime(0);
    } else {
      // Seek to 0
      if (video) {
        video.currentTime = 0;
        setCurrentTime(0);
      }
    }
  }, []);

  // Close player
  const closePlayer = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.src = '';
    }
    setCurrentVideo(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Media Session API Integration
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentVideo) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentVideo.title,
        artist: currentVideo.channelName || 'TubeMe',
        album: 'TubeMe Offline Library',
        artwork: currentVideo.thumbnailUrl
          ? [
              { src: currentVideo.thumbnailUrl, sizes: '320x180', type: 'image/jpeg' },
              { src: currentVideo.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        videoRef.current?.play().catch(console.error);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        videoRef.current?.pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        seekBy(-(details.seekOffset || 10));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        seekBy(details.seekOffset || 10);
      });
      try {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (typeof details.seekTime === 'number') {
            seekTo(details.seekTime);
          }
        });
      } catch (e) {}
    } catch (err) {
      console.warn('Error configuring Media Session API:', err);
    }
  }, [currentVideo, playNext, playPrev, seekBy, seekTo]);

  // Sync Media Session playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Sync Media Session position state
  useEffect(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      if (duration > 0 && !isNaN(duration) && !isNaN(currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(duration, 0.1),
            playbackRate: playbackRate,
            position: Math.min(Math.max(currentTime, 0), duration),
          });
        } catch (e) {}
      }
    }
  }, [currentTime, duration, playbackRate]);

  return (
    <PlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        isAudioOnly,
        isPiP,
        isCompleted,
        queue,
        videoRef,
        playVideo,
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
        setQueue,
        mountVideoElement,
      }}
    >
      {children}
      {/* Hidden container maintaining the persistent video element when not attached to a visible container */}
      <div ref={fallbackHostRef} style={{ display: 'none' }} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
