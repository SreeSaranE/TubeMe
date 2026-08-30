import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, History } from 'lucide-react';

interface HomeEmptyStateProps {
  searchQuery: string;
  selectedChannel: string;
  hasWatchedVideos?: boolean;
}

export function HomeEmptyState({ searchQuery, selectedChannel, hasWatchedVideos }: HomeEmptyStateProps) {
  const navigate = useNavigate();

  const isAllWatched = hasWatchedVideos && !searchQuery && selectedChannel === 'All';

  return (
    <div className="placeholder-view py-16">
      <div className="placeholder-box max-w-md">
        <div className="placeholder-icon">
          {isAllWatched ? (
            <History className="h-8 w-8 text-[var(--text-muted)]" />
          ) : (
            <Film className="h-8 w-8 text-[var(--text-muted)]" />
          )}
        </div>
        <h2>{isAllWatched ? 'All Caught Up!' : 'No Videos Found'}</h2>
        <p>
          {searchQuery || selectedChannel !== 'All'
            ? 'No unwatched videos match your current search or channel filter.'
            : isAllWatched
            ? 'You have completely watched all your downloaded videos. You can view them in Watch History or search for new videos.'
            : 'Downloaded videos will automatically appear here with high-resolution thumbnails and offline playback.'}
        </p>
        {!searchQuery && selectedChannel === 'All' && (
          <div className="flex items-center gap-3 mt-4">
            {isAllWatched && (
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="btn btn-secondary h-10 px-4 text-sm font-medium flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                <span>View History</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="btn btn-primary h-10 px-5 text-sm font-medium"
            >
              Search Videos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
