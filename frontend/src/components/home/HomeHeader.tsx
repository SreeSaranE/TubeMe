import React from 'react';
import { RefreshCw } from 'lucide-react';

interface HomeHeaderProps {
  videoCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export function HomeHeader({ videoCount, isLoading, onRefresh }: HomeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
      <div className="flex items-center gap-3.5">
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-[var(--text-primary)]">
          Home
        </h1>
        <span className="counter-badge text-xs px-2.5 py-0.5 font-medium">
          {videoCount} {videoCount === 1 ? 'video' : 'videos'}
        </span>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="btn btn-secondary h-9 px-3.5 text-xs sm:text-sm font-medium"
          title="Refresh library"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
