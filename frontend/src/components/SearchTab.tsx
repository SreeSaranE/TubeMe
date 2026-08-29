import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Film,
  X,
  FileVideo,
  Captions,
  Calendar,
} from 'lucide-react';
import { SearchResultItem, StartDownloadRequest, AppSettingsModel } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';

interface SearchTabProps {
  onStartDownload: (req: StartDownloadRequest) => Promise<void>;
  settings: AppSettingsModel | null;
}

export function SearchTab({ onStartDownload, settings }: SearchTabProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Quality preset and subtitle states under the search input
  const [quality, setQuality] = useState<string>(settings?.defaultResolution || '1080');
  const [subtitles, setSubtitles] = useState<boolean>(settings?.includeSubtitles ?? true);

  useEffect(() => {
    if (settings?.defaultResolution) {
      setQuality(settings.defaultResolution);
    }
    if (settings?.includeSubtitles !== undefined) {
      setSubtitles(settings.includeSubtitles);
    }
  }, [settings]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsSearching(true);
    try {
      const data = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`).then((res) =>
        res.json()
      );
      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = (item: SearchResultItem) => {
    const isAudio = quality === 'audio';
    onStartDownload({
      url: item.url,
      resolution: isAudio ? 'audio' : quality,
      subtitles: isAudio ? false : subtitles,
      audioOnly: isAudio,
    });
  };

  return (
    <div className="space-y-7">
      {/* 1. Clean Title */}
      <div className="border-b border-[var(--border)] pb-5">
        <h1 className="text-2xl sm:text-[32px] font-semibold tracking-tight text-[var(--text-primary)]">
          Search
        </h1>
      </div>

      {/* 2. Compact Search Card */}
      <div className="card p-4 sm:p-5 space-y-3.5">
        {/* Search Input Bar & Button */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-4.5 w-4.5 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste YouTube link or enter search keywords..."
              className="w-full pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="h-11 sm:h-12 px-6 py-0 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] border border-transparent rounded-[var(--radius-md)] shrink-0 shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <span>Searching...</span>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Options Under the Search Input Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[var(--border)]">
          {/* Quality Preset (shadcn Select) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-secondary)] select-none">
              Quality:
            </span>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="w-[145px] h-8 text-xs font-medium bg-[var(--bg-subtle)]">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2160">4K (2160p)</SelectItem>
                <SelectItem value="1440">2K (1440p)</SelectItem>
                <SelectItem value="1080">1080p (Full HD)</SelectItem>
                <SelectItem value="720">720p (HD)</SelectItem>
                <SelectItem value="480">480p</SelectItem>
                <SelectItem value="360">360p</SelectItem>
                <SelectItem value="audio">Audio Only (MP3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subtitle Option (shadcn Toggle) */}
          <div className="flex items-center gap-2">
            <Toggle
              pressed={subtitles}
              onPressedChange={setSubtitles}
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium gap-1.5"
              aria-label="Toggle subtitles"
            >
              <Captions className="h-3.5 w-3.5" />
              <span>Subtitles</span>
            </Toggle>
          </div>
        </div>
      </div>

      {/* 3. Results List or Minimal Placeholder */}
      {isSearching ? (
        <div className="placeholder-view">
          <div className="placeholder-box">
            <div className="placeholder-icon animate-pulse">
              <Search className="h-8 w-8" />
            </div>
            <h2>Searching YouTube...</h2>
            <p>Querying YouTube video catalogue for "{query}".</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono font-medium text-[var(--text-muted)] px-1">
            <span>RESULTS ({results.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item) => (
              <div key={item.id} className="task-card flex flex-col justify-between group p-5 gap-4">
                <div className="space-y-3">
                  {/* Video Thumbnail with duration overlay */}
                  <div className="relative aspect-video rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border)]">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileVideo className="h-10 w-10 text-[var(--text-muted)]" />
                      </div>
                    )}
                    {item.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-xs font-medium px-2 py-0.5 rounded">
                        {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Title & Channel */}
                  <div className="space-y-1">
                    <h3
                      className="font-semibold text-[15px] sm:text-base text-[var(--text-primary)] line-clamp-2 leading-snug"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                    <div className="text-xs text-[var(--text-muted)] pt-0.5 truncate font-medium">
                      {item.channelName}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer: Upload Date on Left, Download Button on Right */}
                <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {item.uploadDate && !item.isPlaylist && (
                      <span className="text-xs font-mono text-[var(--text-muted)] font-medium flex items-center gap-1.5 truncate">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                        <span>{item.uploadDate}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="btn btn-primary h-9 px-4 text-xs font-medium rounded-[var(--radius-sm)] flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="placeholder-view">
          <div className="placeholder-box">
            <div className="placeholder-icon">
              <Film className="h-8 w-8" />
            </div>
            <h2>Ready to Download</h2>
            <p>
              Paste any YouTube link above or enter keywords to browse search results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
