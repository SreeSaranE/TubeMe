import React from 'react';
import { Search, RefreshCw, X } from 'lucide-react';
import { MediaVideoItem } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HomeFiltersProps {
  videoCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  sortBy: 'newest' | 'oldest' | 'size' | 'title';
  onSortChange: (sort: 'newest' | 'oldest' | 'size' | 'title') => void;
  channelList: string[];
  selectedChannel: string;
  onChannelSelect: (ch: string) => void;
  videos: MediaVideoItem[];
}

export function HomeFilters({
  videoCount,
  searchQuery,
  onSearchChange,
  isLoading,
  onRefresh,
  sortBy,
  onSortChange,
  channelList,
  selectedChannel,
  onChannelSelect,
  videos,
}: HomeFiltersProps) {
  return (
    <div className="space-y-4">
      {/* 1. Top Functions Bar: Home (Count) + Search Input + Refresh + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: Home Title + Counter */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
            Home
          </h1>
          <span className="counter-badge text-xs px-2.5 py-0.5 font-medium">
            {videoCount}
          </span>
        </div>

        {/* Middle: Search Videos Input Box (flex-1 expands across remaining space) */}
        <div className="relative flex-1 min-w-0">
          <Search className="h-4.5 w-4.5 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search videos or channels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 h-11 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right: Single Refresh Button + Sort Selector */}
        <div className="flex items-center gap-2.5 shrink-0 justify-end">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-secondary h-11 px-3.5 text-xs sm:text-sm font-medium flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Refresh library"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Sort Selector (shadcn Select) */}
          <div className="w-full sm:w-auto">
            <Select value={sortBy} onValueChange={(val) => onSortChange(val as any)}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 text-xs sm:text-sm font-medium bg-[var(--bg-subtle)] border-[var(--border)] rounded-[var(--radius-md)]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="newest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="size">Largest Size</SelectItem>
                <SelectItem value="title">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Channel Filter Pills Row */}
      {channelList.length > 0 && (
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
