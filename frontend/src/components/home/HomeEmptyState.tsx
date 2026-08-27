import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';

interface HomeEmptyStateProps {
  searchQuery: string;
  selectedChannel: string;
}

export function HomeEmptyState({ searchQuery, selectedChannel }: HomeEmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="placeholder-view py-16">
      <div className="placeholder-box max-w-md">
        <div className="placeholder-icon">
          <Film className="h-8 w-8 text-[var(--text-muted)]" />
        </div>
        <h2>No Videos Found</h2>
        <p>
          {searchQuery || selectedChannel !== 'All'
            ? 'No downloaded videos match your current search or channel filter.'
            : 'Downloaded videos will automatically appear here with high-resolution thumbnails and offline playback.'}
        </p>
        {!searchQuery && selectedChannel === 'All' && (
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="btn btn-primary h-10 px-5 text-sm font-medium mt-4"
          >
            Search Videos
          </button>
        )}
      </div>
    </div>
  );
}
