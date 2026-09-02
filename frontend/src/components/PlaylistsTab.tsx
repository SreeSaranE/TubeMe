import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ListVideo,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Play,
  ArrowLeft,
  Film,
  FolderPlus,
  MoreVertical,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { PlaylistModel, PlaylistDetailModel, PlaylistVideoItem, WatchHistoryItem } from '@/types';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function PlaylistsTab() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [playlists, setPlaylists] = useState<PlaylistModel[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<PlaylistDetailModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [playlistToEdit, setPlaylistToEdit] = useState<PlaylistModel | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [playlistToDelete, setPlaylistToDelete] = useState<PlaylistModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [videoToRemove, setVideoToRemove] = useState<PlaylistVideoItem | null>(null);
  const [isRemovingVideo, setIsRemovingVideo] = useState(false);

  const selectedPlaylistId = searchParams.get('id');

  const enrichPlaylistVideos = (detail: PlaylistDetailModel, historyItems: WatchHistoryItem[]): PlaylistDetailModel => {
    const histMap = new Map(
      historyItems.map((h) => [h.relativePath.replace(/\\/g, '/').toLowerCase(), h])
    );
    const enrichedVideos = detail.videos.map((v) => {
      const normPath = (v.relativePath || '').replace(/\\/g, '/').toLowerCase();
      const hist = histMap.get(normPath);
      const isCompleted = v.isCompleted || !!hist?.isCompleted || (!!hist && hist.duration > 0 && hist.currentTime / hist.duration >= 0.95);
      const pct = isCompleted
        ? 100
        : hist && hist.duration > 0
        ? Math.min(100, (hist.currentTime / hist.duration) * 100)
        : v.watchProgressPercentage ?? (isCompleted ? 100 : null);
      return {
        ...v,
        isCompleted,
        watchProgressPercentage: pct,
      };
    });
    return {
      ...detail,
      videos: enrichedVideos,
    };
  };

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const [data, historyItems] = await Promise.all([
        api.getPlaylists(),
        api.getWatchHistory().catch(() => []),
      ]);
      setPlaylists(data || []);

      if (selectedPlaylistId) {
        const detail = await api.getPlaylist(selectedPlaylistId);
        if (detail) {
          setActivePlaylist(enrichPlaylistVideos(detail, historyItems || []));
        } else {
          setActivePlaylist(null);
        }
      } else {
        setActivePlaylist(null);
      }
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, [selectedPlaylistId]);

  // Handle open playlist detail
  const handleOpenPlaylist = async (playlist: PlaylistModel) => {
    setSearchParams({ id: playlist.id });
    try {
      const [detail, historyItems] = await Promise.all([
        api.getPlaylist(playlist.id),
        api.getWatchHistory().catch(() => []),
      ]);
      if (detail) {
        setActivePlaylist(enrichPlaylistVideos(detail, historyItems || []));
      }
    } catch (err) {
      console.error('Failed to open playlist:', err);
    }
  };

  // Handle back to all playlists
  const handleBackToPlaylists = () => {
    setSearchParams({});
    setActivePlaylist(null);
  };

  // Create Playlist
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createPlaylist({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
      });

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Playlist created',
          description: `Playlist "${createName.trim()}" created successfully.`,
        });
        setCreateName('');
        setCreateDescription('');
        setShowCreateModal(false);
        await loadPlaylists();
      } else {
        const data = await res.json();
        toast({
          variant: 'destructive',
          title: 'Failed to create playlist',
          description: data.message || 'Playlist already exists or name is invalid.',
        });
      }
    } catch (err) {
      console.error('Failed to create playlist:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create playlist.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rename / Update Playlist
  const handleUpdatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistToEdit || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.updatePlaylist(playlistToEdit.id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });

      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Playlist updated',
          description: `Playlist updated to "${editName.trim()}".`,
        });
        setPlaylistToEdit(null);
        await loadPlaylists();
      } else {
        const data = await res.json();
        toast({
          variant: 'destructive',
          title: 'Update failed',
          description: data.message || 'Failed to update playlist.',
        });
      }
    } catch (err) {
      console.error('Failed to update playlist:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update playlist.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Playlist
  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    const target = playlistToDelete;
    setIsDeleting(true);

    try {
      const res = await api.deletePlaylist(target.id);
      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Playlist deleted',
          description: `Playlist "${target.name}" has been deleted.`,
        });
        setPlaylistToDelete(null);
        if (activePlaylist?.id === target.id) {
          handleBackToPlaylists();
        }
        await loadPlaylists();
      } else {
        const data = await res.json();
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: data.message || 'Cannot delete playlist.',
        });
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete playlist.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Remove Video from Playlist
  const confirmRemoveVideoFromPlaylist = async () => {
    if (!activePlaylist || !videoToRemove) return;
    const target = videoToRemove;
    setIsRemovingVideo(true);

    try {
      const res = await api.removeVideoFromPlaylist(activePlaylist.id, target.relativePath);
      if (res.ok) {
        setActivePlaylist((prev) =>
          prev
            ? {
                ...prev,
                videoCount: Math.max(0, prev.videoCount - 1),
                videos: prev.videos.filter((v) => v.relativePath !== target.relativePath),
              }
            : null
        );
        toast({
          variant: 'success',
          title: 'Video removed',
          description: `Removed "${target.videoTitle}" from playlist.`,
        });
        setVideoToRemove(null);
        // Also update the background list count
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === activePlaylist.id
              ? { ...p, videoCount: Math.max(0, p.videoCount - 1) }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to remove video from playlist:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove video from playlist.',
      });
    } finally {
      setIsRemovingVideo(false);
    }
  };

  // Filtered playlists
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const q = searchQuery.toLowerCase();
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [playlists, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Top Functions Bar: Playlists (Count) + Search Input + Refresh + Create Playlist */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: Playlists Title + Counter or Back Navigation */}
        <div className="flex items-center gap-3 shrink-0">
          {activePlaylist ? (
            <button
              type="button"
              onClick={handleBackToPlaylists}
              className="btn btn-secondary h-11 px-3.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Playlists</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 shrink-0">
              <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
                Playlists
              </h1>
              <span className="counter-badge text-xs px-2.5 py-0.5 font-medium">
                {playlists.length}
              </span>
            </div>
          )}
        </div>

        {/* Middle: Search Input Box (flex-1 expands across remaining space) */}
        {!activePlaylist && (
          <div className="relative flex-1 min-w-0">
            <Search className="h-4.5 w-4.5 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search playlists..."
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
        )}

        {/* Right: Actions: Refresh + Create Playlist */}
        <div className="flex items-center gap-2.5 shrink-0 justify-end flex-wrap sm:flex-nowrap ml-auto">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadPlaylists}
            disabled={isLoading}
            className="btn btn-secondary h-11 px-3.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Refresh playlists"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Create Playlist Button */}
          <button
            type="button"
            onClick={() => {
              setCreateName('');
              setCreateDescription('');
              setShowCreateModal(true);
            }}
            className="btn btn-primary h-11 px-4 text-xs sm:text-sm font-medium shadow-sm whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5 shrink-0" />
            <span>Create Playlist</span>
          </button>
        </div>
      </div>

      {/* 2. Main Content: Single Playlist View OR All Playlists Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Loading Playlists...
            </span>
          </div>
        </div>
      ) : activePlaylist ? (
        /* Single Playlist Detail View */
        <div className="space-y-6">
          {/* Playlist Banner / Header */}
          <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-[var(--bg-surface)] border border-[var(--border)]">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                <ListVideo className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                    {activePlaylist.name}
                  </h2>
                  <span className="counter-badge text-xs px-2.5 py-0.5 font-medium">
                    {activePlaylist.videos.length} {activePlaylist.videos.length === 1 ? 'video' : 'videos'}
                  </span>
                </div>
                {activePlaylist.description && (
                  <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
                    {activePlaylist.description}
                  </p>
                )}
              </div>
            </div>

            {/* Playlist Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              {activePlaylist.videos.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/watch?path=${encodeURIComponent(activePlaylist.videos[0].relativePath)}`)
                  }
                  className="btn btn-primary h-10 px-4 text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Play All</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setPlaylistToEdit(activePlaylist);
                  setEditName(activePlaylist.name);
                  setEditDescription(activePlaylist.description || '');
                }}
                className="btn btn-secondary h-10 px-3.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                title="Edit playlist details"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setPlaylistToDelete(activePlaylist)}
                className="btn btn-secondary h-10 px-3.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                title="Delete playlist"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Playlist Videos Grid */}
          {activePlaylist.videos.length === 0 ? (
            <div className="card p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-8">
              <div className="w-14 h-14 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                <Film className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-[var(--text-primary)]">
                  No Videos in This Playlist
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Browse your downloaded videos on the Home page and use the 3-dots menu to add videos here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn btn-primary h-9 px-4 text-xs font-medium cursor-pointer"
              >
                Browse Home Videos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePlaylist.videos.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/watch?path=${encodeURIComponent(item.relativePath)}`)}
                  className="group cursor-pointer flex flex-col space-y-3 select-none relative"
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video w-full rounded-[var(--radius-md)] overflow-hidden bg-black border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-all">
                    <img
                      src={item.thumbnailUrl || ''}
                      alt={item.videoTitle}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180" fill="%23111"><rect width="320" height="180" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="14" font-weight="bold">Media Video</text></svg>';
                      }}
                    />

                    {/* Watched Badge (Top-Left) */}
                    {item.isCompleted && (
                      <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-xs text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-[4px] border border-white/10 shadow-sm flex items-center gap-1 pointer-events-none">
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Watched</span>
                      </div>
                    )}

                    {/* Overlay Play Icon */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {item.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/90 backdrop-blur-xs text-white text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[4px] pointer-events-none">
                        {item.duration}
                      </div>
                    )}

                    {/* Watch Progress Bar (Bottom edge) */}
                    {(item.isCompleted || (typeof item.watchProgressPercentage === 'number' && item.watchProgressPercentage > 0)) && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 overflow-hidden pointer-events-none">
                        <div
                          className="h-full bg-red-600 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, item.isCompleted ? 100 : (item.watchProgressPercentage ?? 100))}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Video Info Block */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4
                        className="font-semibold text-sm sm:text-base leading-snug text-[var(--text-primary)] line-clamp-2"
                        title={item.videoTitle}
                      >
                        {item.videoTitle}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
                        {item.channelName}
                      </p>
                    </div>

                    {/* Remove Video from Playlist button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoToRemove(item);
                      }}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 mt-0.5"
                      title="Remove from this playlist"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : playlists.length === 0 ? (
        /* Empty State */
        <div className="card p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
            <ListVideo className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-[var(--text-primary)]">
              No Playlists Yet
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Create playlists to organize your favorite downloaded videos into custom watch queues.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary h-9 px-4 text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer mt-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Your First Playlist</span>
          </button>
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <div className="card p-8 text-center text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto my-8">
          No playlists matched your search query "{searchQuery}".
        </div>
      ) : (
        /* Playlists Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => handleOpenPlaylist(playlist)}
              className="card overflow-hidden flex flex-col justify-between border border-[var(--border)] hover:border-[var(--border-strong)] transition-all cursor-pointer group shadow-xs"
            >
              {/* Thumbnail / Cover Collage */}
              <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                {playlist.coverThumbnailUrl ? (
                  <img
                    src={playlist.coverThumbnailUrl}
                    alt={playlist.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                    <ListVideo className="h-10 w-10 opacity-60" />
                    <span className="text-[11px] font-medium tracking-wide uppercase">Empty Playlist</span>
                  </div>
                )}

                {/* Video Count Overlay (Bottom-Right) */}
                <div className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-xs text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px] flex items-center gap-1.5 shadow-sm">
                  <ListVideo className="h-3.5 w-3.5 text-red-500" />
                  <span>{playlist.videoCount} {playlist.videoCount === 1 ? 'video' : 'videos'}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className="font-semibold text-base text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate"
                      title={playlist.name}
                    >
                      {playlist.name}
                    </h3>

                    {/* Popover Actions for Playlist */}
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                            title="Playlist options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-40 p-1 bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl rounded-[var(--radius-md)] text-xs space-y-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setPlaylistToEdit(playlist);
                              setEditName(playlist.name);
                              setEditDescription(playlist.description || '');
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] rounded-[var(--radius-sm)] cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlaylistToDelete(playlist)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-[var(--radius-sm)] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete playlist</span>
                          </button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {playlist.description && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {playlist.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>View & Play videos</span>
                  <Play className="h-3 w-3 fill-current opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderPlus className="h-5 w-5 text-[var(--primary)]" />
                <h3 className="font-semibold text-lg text-[var(--text-primary)]">Create New Playlist</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Playlist Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Favorites, Coding Tutorials, Chill Beats..."
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Description (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add an optional description for this video playlist..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="btn btn-secondary h-9 px-4 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createName.trim()}
                  className="btn btn-primary h-9 px-4 text-xs font-medium cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Creating...' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Playlist Modal */}
      {playlistToEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="h-5 w-5 text-[var(--primary)]" />
                <h3 className="font-semibold text-lg text-[var(--text-primary)]">Edit Playlist</h3>
              </div>
              <button
                type="button"
                onClick={() => setPlaylistToEdit(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlaylist} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Playlist Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPlaylistToEdit(null)}
                  disabled={isSubmitting}
                  className="btn btn-secondary h-9 px-4 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editName.trim()}
                  className="btn btn-primary h-9 px-4 text-xs font-medium cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Playlist Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(playlistToDelete)} onOpenChange={(open) => !open && setPlaylistToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Delete Playlist?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete playlist <strong>"{playlistToDelete?.name}"</strong>? Your downloaded video files will NOT be deleted from disk.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeletePlaylist();
              }}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700 font-medium cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Playlist'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Video from Playlist Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(videoToRemove)} onOpenChange={(open) => !open && setVideoToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Remove Video from Playlist?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>"{videoToRemove?.videoTitle}"</strong> from playlist <strong>"{activePlaylist?.name}"</strong>? The video file will remain stored on your device.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingVideo}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmRemoveVideoFromPlaylist();
              }}
              disabled={isRemovingVideo}
              className="bg-amber-600 text-white hover:bg-amber-700 font-medium cursor-pointer"
            >
              {isRemovingVideo ? 'Removing...' : 'Remove from Playlist'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
