import React, { useState } from 'react';
import {
  Search,
  Download,
  Film,
  Music,
  Clock,
  ExternalLink,
  SlidersHorizontal,
  X,
  Play,
  FileVideo,
} from 'lucide-react';
import { SearchResultItem, StartDownloadRequest, AppSettingsModel } from '@/types';

interface SearchTabProps {
  onStartDownload: (req: StartDownloadRequest) => Promise<void>;
  settings: AppSettingsModel | null;
}

export function SearchTab({ onStartDownload, settings }: SearchTabProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected item for custom download modal
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  const [res, setRes] = useState(settings?.defaultResolution || '1080');
  const [subtitles, setSubtitles] = useState(settings?.includeSubtitles ?? true);
  const [audioOnly, setAudioOnly] = useState(false);

  const isDirectUrl =
    query.trim().startsWith('http://') ||
    query.trim().startsWith('https://') ||
    query.trim().includes('youtube.com') ||
    query.trim().includes('youtu.be');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    // If it's a direct URL, prompt instant download
    if (isDirectUrl) {
      handleDirectUrlDownload();
      return;
    }

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

  const handleDirectUrlDownload = () => {
    if (!query.trim()) return;
    onStartDownload({
      url: query.trim(),
      resolution: audioOnly ? 'audio' : res,
      subtitles: subtitles,
      audioOnly: audioOnly,
    });
    setQuery('');
  };

  const handleQuickDownload = (item: SearchResultItem) => {
    onStartDownload({
      url: item.url,
      resolution: res,
      subtitles: subtitles,
      audioOnly: false,
    });
  };

  const handleCustomDownloadSubmit = () => {
    if (!selectedItem) return;
    onStartDownload({
      url: selectedItem.url,
      resolution: audioOnly ? 'audio' : res,
      subtitles: subtitles,
      audioOnly: audioOnly,
    });
    setSelectedItem(null);
  };

  return (
    <div className="space-y-8">
      {/* 1. Clean Title */}
      <div className="border-b border-[var(--border)] pb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          Search
        </h1>
      </div>

      {/* 2. Spacious Search & Download Card */}
      <div className="card p-6 sm:p-8 space-y-6">
        {/* Large Input & Action Button */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3.5">
          <div className="relative flex-1">
            <Search className="h-5 w-5 text-[var(--text-muted)] absolute left-5 top-4 sm:top-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste YouTube link or enter search keywords..."
              className="w-full pl-14 pr-12 h-14 sm:h-16 text-base sm:text-lg bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 top-4 sm:top-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="btn btn-primary h-14 sm:h-16 px-8 text-base font-medium shrink-0 shadow-sm"
          >
            {isSearching ? (
              <span>Searching...</span>
            ) : isDirectUrl ? (
              <>
                <Download className="h-5 w-5 mr-2" />
                <span>Download URL</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Options Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border)] text-sm text-[var(--text-secondary)]">
          <div className="flex flex-wrap items-center gap-5">
            {/* Resolution Selector */}
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-[var(--text-primary)]">Quality:</span>
              <div className="flex rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border)]">
                {['1080', '720', '4k', 'audio'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      if (q === 'audio') {
                        setAudioOnly(true);
                      } else {
                        setAudioOnly(false);
                        setRes(q);
                      }
                    }}
                    className={`px-3.5 py-1.5 text-xs font-mono font-bold transition-colors ${
                      (q === 'audio' && audioOnly) || (!audioOnly && res === q)
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    {q === 'audio' ? 'MP3' : `${q}p`}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtitles Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={subtitles}
                onChange={(e) => setSubtitles(e.target.checked)}
                className="h-4.5 w-4.5 accent-[var(--primary)] rounded cursor-pointer"
              />
              <span>Embed Subtitles</span>
            </label>
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
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--text-muted)] px-1">
            <span>RESULTS ({results.length})</span>
            <span>1-CLICK DOWNLOAD READY</span>
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
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-xs font-bold px-2 py-0.5 rounded">
                        {item.duration}
                      </span>
                    )}
                  </div>

                  {/* Title & Channel */}
                  <div className="space-y-1">
                    <h3
                      className="font-bold text-base text-[var(--text-primary)] line-clamp-2 leading-snug"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-0.5">
                      <span className="font-medium truncate">{item.channelName}</span>
                      {item.uploadDate && <span className="font-mono">{item.uploadDate}</span>}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="border-t border-[var(--border)] pt-3.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                    }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 font-mono font-semibold"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Options</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDownload(item)}
                    className="btn btn-primary h-9 px-4 text-xs font-bold rounded-[var(--radius-sm)]"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
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
              Paste any YouTube link above for instant retrieval, or enter keywords to browse search results.
            </p>
          </div>
        </div>
      )}

      {/* 4. Custom Download Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-7 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Download Options
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn-icon"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <p className="font-semibold text-[var(--text-primary)] line-clamp-2">
                {selectedItem.title}
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--text-primary)]">Format & Quality</label>
                <select
                  value={audioOnly ? 'audio' : res}
                  onChange={(e) => {
                    if (e.target.value === 'audio') {
                      setAudioOnly(true);
                    } else {
                      setAudioOnly(false);
                      setRes(e.target.value);
                    }
                  }}
                  className="w-full h-10 px-3 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)]"
                >
                  <option value="1080">1080p Full HD (MP4)</option>
                  <option value="720">720p HD (MP4)</option>
                  <option value="4k">4K Ultra HD (MP4)</option>
                  <option value="best">Best Available Video</option>
                  <option value="audio">Audio Only (MP3)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border)]">
                <span className="font-medium text-[var(--text-primary)]">Include Subtitles</span>
                <input
                  type="checkbox"
                  checked={subtitles}
                  onChange={(e) => setSubtitles(e.target.checked)}
                  className="h-4.5 w-4.5 accent-[var(--primary)] cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="btn btn-secondary text-sm h-10 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomDownloadSubmit}
                  className="btn btn-primary text-sm h-10 px-5 font-bold"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Start Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
