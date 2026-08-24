import React, { useState } from 'react';
import { Search, Download, Music, Film, Clock, User, SlidersHorizontal, PlayCircle, X, Sparkles } from 'lucide-react';
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
    <div className="space-y-10">
      {/* Editorial Search Header Card */}
      <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-8 sm:p-10 shadow-sm transition-all">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground bg-secondary/80 px-3 py-1 rounded-full border border-border/60">
              Direct Archiving & Retrieval
            </span>
            <span className="text-[11px] font-mono text-muted-foreground/80">
              Instant Parser
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.15]">
            Search & Download
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed">
            Search keywords across YouTube or paste any direct Video, Short, or Playlist URL for instant high-speed retrieval.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-4 top-4" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search keywords or paste YouTube link (https://www.youtube.com/watch?v=...)"
                className="pl-11 pr-10 h-12 text-sm sm:text-base rounded-2xl bg-secondary/60 border-border/80 focus:ring-1.5 focus:ring-ring"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-md hover:bg-secondary/80"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              size="lg"
              className="shrink-0 h-12 px-8 text-sm sm:text-base font-semibold rounded-2xl gap-2 bg-foreground text-background hover:opacity-90 shadow-md shadow-black/10 transition-transform active:scale-[0.98]"
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

      {/* Results Header & Grid (Max 4 cards per row) */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest font-mono">
              Results Found ({results.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((item, idx) => (
              <div
                key={item.id || idx}
                className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden flex flex-col justify-between group hover:-translate-y-1 hover:border-foreground/40 hover:shadow-xl transition-all duration-300 ease-out shadow-sm"
              >
                {/* Full-Color Thumbnail Showcase */}
                <div className="relative aspect-video bg-secondary/70 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-104 transition duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/320x180?text=No+Thumbnail';
                    }}
                  />
                  {item.duration && (
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-xs text-white text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm">
                      <Clock className="h-3.5 w-3.5" /> {item.duration}
                    </span>
                  )}
                  {item.isPlaylist && (
                    <Badge variant="default" className="absolute top-3 left-3 text-[10px] font-mono font-bold px-2.5 py-0.5">
                      PLAYLIST
                    </Badge>
                  )}
                </div>

                {/* Info & Action Buttons */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg text-foreground line-clamp-2 leading-snug tracking-tight" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm font-mono text-muted-foreground flex items-center gap-2 mt-2">
                      <User className="h-4 w-4 opacity-60 shrink-0" />
                      <span className="truncate">{item.channelName || 'Unknown Channel'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-4 border-t border-border/70">
                    <Button
                      size="default"
                      onClick={() => handleQuickDownload(item)}
                      className="flex-1 h-11 text-xs sm:text-sm gap-2 rounded-2xl bg-foreground text-background hover:opacity-90"
                    >
                      <Download className="h-4 w-4" /> Quick Download
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-2xl bg-secondary/50 hover:bg-secondary border-border/80"
                      onClick={() => setSelectedItem(item)}
                      title="Custom download options"
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
        <div className="text-center py-32 rounded-3xl border border-dashed border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="h-16 w-16 rounded-2xl bg-secondary/80 text-foreground flex items-center justify-center mx-auto mb-4 shadow-sm">
            <PlayCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Search videos, shorts or playlists</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
            Type keywords or paste direct YouTube links above to start archiving high-resolution streams.
          </p>
        </div>
      )}

      {/* Download Options Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl p-8 space-y-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground">Download Config</span>
              <h3 className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
                <Download className="h-5 w-5 text-foreground" /> Custom Options
              </h3>
            </div>

            <div className="p-4 bg-secondary/60 rounded-2xl border border-border/80 flex items-center gap-3.5">
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
                    className="h-11 text-sm gap-2 rounded-2xl"
                  >
                    <Film className="h-4 w-4" /> Video (MP4)
                  </Button>
                  <Button
                    type="button"
                    variant={audioOnly ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setAudioOnly(true)}
                    className="h-11 text-sm gap-2 rounded-2xl"
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
                    className="w-full bg-secondary/70 border border-border/80 rounded-xl px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-ring"
                  >
                    <option value="1080">1080p (Full HD)</option>
                    <option value="720">720p (HD)</option>
                    <option value="4k">4K (2160p)</option>
                    <option value="best">Best Available</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between py-3.5 border-t border-b border-border/80">
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
              <Button type="button" variant="outline" size="default" onClick={() => setSelectedItem(null)} className="h-11 px-5 rounded-2xl">
                Cancel
              </Button>
              <Button type="button" size="default" onClick={handleCustomDownloadSubmit} className="h-11 px-6 rounded-2xl">
                <Download className="h-4 w-4 mr-2" /> Start Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
