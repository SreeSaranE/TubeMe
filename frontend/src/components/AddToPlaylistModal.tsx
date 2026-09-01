import React, { useState, useEffect } from 'react';
import {
  X,
  ListVideo,
  Plus,
  CheckSquare,
  Square,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import { MediaVideoItem, PlaylistModel } from '@/types';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AddToPlaylistModalProps {
  video: MediaVideoItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToPlaylistModal({
  video,
  isOpen,
  onClose,
}: AddToPlaylistModalProps) {
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<PlaylistModel[]>([]);
  const [memberPlaylistIds, setMemberPlaylistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlaylistId, setProcessingPlaylistId] = useState<string | null>(null);

  // Quick Create Playlist Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && video) {
      loadData();
      setShowCreateForm(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    }
  }, [isOpen, video?.relativePath]);

  const loadData = async () => {
    if (!video) return;
    setIsLoading(true);
    try {
      const [allPlaylists, memberIds] = await Promise.all([
        api.getPlaylists(),
        api.getVideoPlaylistMemberships(video.relativePath),
      ]);
      setPlaylists(allPlaylists || []);
      setMemberPlaylistIds(new Set(memberIds || []));
    } catch (err) {
      console.error('Failed to load playlist memberships:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlaylist = async (playlist: PlaylistModel) => {
    if (!video || processingPlaylistId) return;

    const isMember = memberPlaylistIds.has(playlist.id);
    setProcessingPlaylistId(playlist.id);

    // Optimistic UI update
    setMemberPlaylistIds((prev) => {
      const updated = new Set(prev);
      if (isMember) {
        updated.delete(playlist.id);
      } else {
        updated.add(playlist.id);
      }
      return updated;
    });

    try {
      if (isMember) {
        // Remove from playlist
        const res = await api.removeVideoFromPlaylist(playlist.id, video.relativePath);
        if (res.ok) {
          toast({
            variant: 'success',
            title: 'Removed from playlist',
            description: `Removed from "${playlist.name}".`,
          });
        } else {
          throw new Error('Failed to remove');
        }
      } else {
        // Add to playlist
        const res = await api.addVideoToPlaylist(playlist.id, {
          relativePath: video.relativePath,
          videoTitle: video.title,
          channelName: video.channelName,
          duration: video.duration || undefined,
          thumbnailUrl: video.thumbnailUrl || undefined,
        });
        if (res.ok) {
          toast({
            variant: 'success',
            title: 'Saved to playlist',
            description: `Added to "${playlist.name}".`,
          });
        } else {
          throw new Error('Failed to add');
        }
      }
    } catch (err) {
      console.error('Failed to toggle playlist membership:', err);
      // Revert optimistic update
      setMemberPlaylistIds((prev) => {
        const reverted = new Set(prev);
        if (isMember) {
          reverted.add(playlist.id);
        } else {
          reverted.delete(playlist.id);
        }
        return reverted;
      });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update playlist.',
      });
    } finally {
      setProcessingPlaylistId(null);
    }
  };

  const handleQuickCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || !newPlaylistName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await api.createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || undefined,
      });

      if (res.ok) {
        const createdPlaylist = await res.json();

        // Immediately add this video to the new playlist
        await api.addVideoToPlaylist(createdPlaylist.id, {
          relativePath: video.relativePath,
          videoTitle: video.title,
          channelName: video.channelName,
          duration: video.duration || undefined,
          thumbnailUrl: video.thumbnailUrl || undefined,
        });

        setMemberPlaylistIds((prev) => new Set([...prev, createdPlaylist.id]));
        setPlaylists((prev) => [...prev, createdPlaylist]);
        setShowCreateForm(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');

        toast({
          variant: 'success',
          title: 'Playlist created',
          description: `Created "${createdPlaylist.name}" and added video.`,
        });
      } else {
        const errData = await res.json();
        toast({
          variant: 'destructive',
          title: 'Failed to create playlist',
          description: errData.message || 'Playlist already exists.',
        });
      }
    } catch (err) {
      console.error('Failed to create quick playlist:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create playlist.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen || !video) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in-0 zoom-in-95 bg-[var(--bg-surface)] border border-[var(--border)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-[var(--primary)]" />
            <h3 className="font-semibold text-base text-[var(--text-primary)]">
              Save video to...
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video Preview Chip */}
        <div className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border)]">
          <div className="relative w-16 aspect-video rounded-[var(--radius-sm)] overflow-hidden bg-black shrink-0">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
              {video.title}
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">
              {video.channelName}
            </p>
          </div>
        </div>

        {/* Playlists List with Multi-Select Checkboxes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {playlists.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">
                No playlists available. Create one below!
              </p>
            ) : (
              playlists.map((playlist) => {
                const isSelected = memberPlaylistIds.has(playlist.id);
                const isProcessing = processingPlaylistId === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleTogglePlaylist(playlist)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-[var(--primary)] shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                      )}
                      <span className="truncate">{playlist.name}</span>
                    </div>

                    <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 ml-2">
                      {playlist.videoCount} {playlist.videoCount === 1 ? 'video' : 'videos'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Quick Create Playlist Section */}
        <div className="pt-2 border-t border-[var(--border)]">
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-[var(--radius-md)] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create new playlist</span>
            </button>
          ) : (
            <form onSubmit={handleQuickCreatePlaylist} className="space-y-3 pt-1">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Enter playlist title..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-1.5 text-xs bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                  className="btn btn-secondary h-8 px-3 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPlaylistName.trim()}
                  className="btn btn-primary h-8 px-3 text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />}
                  <span>Create</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
