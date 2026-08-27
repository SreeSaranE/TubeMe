import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { MediaVideoItem } from '@/types';

interface HomeFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'newest' | 'oldest' | 'size' | 'title';
  onSortChange: (sort: 'newest' | 'oldest' | 'size' | 'title') => void;
  channelList: string[];
  selectedChannel: string;
  onChannelSelect: (ch: string) => void;
  videos: MediaVideoItem[];
}

export function HomeFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  channelList,
  selectedChannel,
  onChannelSelect,
  videos,
}: HomeFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="h-4.5 w-4.5 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search downloaded videos or channels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 h-11 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="h-4 w-4 text-[var(--text-muted)] hidden sm:inline" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="h-11 px-3 text-xs sm:text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium focus:outline-none"
          >
            <option value="newest">Latest Downloaded</option>
            <option value="oldest">Oldest First</option>
            <option value="size">Largest Size</option>
            <option value="title">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Channel Filter Pills */}
      {channelList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none min-w-0 max-w-full">
          <button
            type="button"
            onClick={() => onChannelSelect('All')}
            className={`px-3.5 py-1.5 rounded-[var(--radius-full)] text-xs font-medium border transition-all cursor-pointer select-none shrink-0 ${
              selectedChannel === 'All'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
            }`}
          >
            All
          </button>

          {channelList.map((channel) => {
            const isSelected = selectedChannel.toLowerCase() === channel.toLowerCase();
            const count = videos.filter(
              (v) => v.channelName.toLowerCase() === channel.toLowerCase()
            ).length;

            return (
              <button
                key={channel}
                type="button"
                onClick={() => onChannelSelect(channel)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-full)] text-xs font-medium border transition-all cursor-pointer select-none shrink-0 ${
                  isSelected
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
                }`}
              >
                <span>{channel}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-medium ${
                    isSelected
                      ? 'bg-[var(--primary-foreground)]/15 text-[var(--primary-foreground)]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
