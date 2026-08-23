import React, { useState } from 'react';
import { Search, Download, Music, Film, Clock, User, SlidersHorizontal, PlayCircle, X } from 'lucide-react';
import { SearchResultItem, StartDownloadRequest, AppSettingsModel } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const data = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then((res) => res.json());
      setResults(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
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
      {/* Search Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Search & Direct Download
            </h2>
            <Badge variant="secondary" className="text-xs px-3 py-1 font-mono">
              Instant
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Search YouTube videos or paste any Video, Short, or Playlist URL directly.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-5">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-4 top-4" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search keywords or paste YouTube URL (https://www.youtube.com/watch?v=...)"
                className="pl-11 pr-10 h-12 text-sm sm:text-base rounded-2xl bg-secondary/60 border-border"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              size="lg"
              className="shrink-0 h-12 px-7 text-sm sm:text-base font-semibold rounded-2xl gap-2"
            >
              {isSearching ? (
                <span className="inline-block h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Search</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Results Header & Grid */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Search Results
            </span>
            <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
              {results.length} items
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {results.map((item, idx) => (
              <div
                key={item.id || idx}
                className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col justify-between group hover:border-foreground/40 transition-all duration-150 shadow-xs"
              >
                {/* Full-Color Thumbnail */}
                <div className="relative aspect-video bg-secondary/70 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/320x180?text=No+Thumbnail';
                    }}
                  />
                  {item.duration && (
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-white text-[11px] font-mono font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.duration}
                    </span>
                  )}
                  {item.isPlaylist && (
                    <Badge variant="default" className="absolute top-2.5 left-2.5 text-[10px] font-mono font-bold">
                      PLAYLIST
                    </Badge>
                  )}
                </div>

                {/* Info & Action Buttons */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 mt-2">
                      <User className="h-3.5 w-3.5 opacity-60 shrink-0" />
                      <span className="truncate">{item.channelName || 'Unknown Channel'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-3.5 border-t border-border/70">
                    <Button
                      size="sm"
                      onClick={() => handleQuickDownload(item)}
                      className="flex-1 h-10 text-xs sm:text-sm gap-1.5"
                    >
                      <Download className="h-4 w-4" /> Quick Download
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => setSelectedItem(item)}
                      title="Custom options"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && (
        <div className="text-center py-28 rounded-3xl border border-dashed border-border bg-card/40">
          <div className="h-16 w-16 rounded-2xl bg-secondary text-foreground flex items-center justify-center mx-auto mb-4 shadow-xs">
            <PlayCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">Search videos, shorts or playlists</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1.5">
            Type keywords or paste direct YouTube links above to start downloading.
          </p>
        </div>
      )}

      {/* Download Options Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-border bg-card p-7 sm:p-8 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Download className="h-5 w-5 text-foreground" /> Custom Download Options
              </h3>
            </div>

            <div className="p-4 bg-secondary/60 rounded-2xl border border-border flex items-center gap-3.5">
              <img src={selectedItem.thumbnail} alt="" className="h-12 w-20 object-cover rounded-xl shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold truncate text-foreground">{selectedItem.title}</h4>
                <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">{selectedItem.channelName}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="block font-medium text-foreground text-xs uppercase tracking-wider font-mono">Format Selection</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={!audioOnly ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setAudioOnly(false)}
                    className="h-11 text-sm gap-2"
                  >
                    <Film className="h-4 w-4" /> Video (MP4)
                  </Button>
                  <Button
                    type="button"
                    variant={audioOnly ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setAudioOnly(true)}
                    className="h-11 text-sm gap-2"
                  >
                    <Music className="h-4 w-4" /> Audio (MP3)
                  </Button>
                </div>
              </div>

              {!audioOnly && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-foreground text-xs uppercase tracking-wider font-mono">Max Resolution</label>
                  <select
                    value={res}
                    onChange={(e) => setRes(e.target.value)}
                    className="w-full bg-secondary/70 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:ring-1 focus:ring-ring"
                  >
                    <option value="1080">1080p (Full HD)</option>
                    <option value="720">720p (HD)</option>
                    <option value="4k">4K (2160p)</option>
                    <option value="best">Best Available</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between py-3.5 border-t border-b border-border">
                <div>
                  <span className="font-medium text-foreground block">Embed Subtitles</span>
                  <span className="text-xs text-muted-foreground">Auto-embed subtitles</span>
                </div>
                <input
                  type="checkbox"
                  checked={subtitles}
                  onChange={(e) => setSubtitles(e.target.checked)}
                  className="h-4 w-4 accent-foreground rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="default" onClick={() => setSelectedItem(null)} className="h-11 px-5">
                Cancel
              </Button>
              <Button type="button" size="default" onClick={handleCustomDownloadSubmit} className="h-11 px-6">
                <Download className="h-4 w-4 mr-2" /> Start Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
