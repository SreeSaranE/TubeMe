import React, { useState } from 'react';
import { Plus, RefreshCw, Play, Trash2, Check, Tv, ExternalLink, SlidersHorizontal, CheckSquare, Square, Search, Sparkles } from 'lucide-react';
import { ChannelModel, ChannelSyncRequest, AppSettingsModel } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ChannelsTabProps {
  channels: ChannelModel[];
  onAddChannel: (url: string) => Promise<void>;
  onRemoveChannel: (id: string) => Promise<void>;
  onSyncChannels: (req: ChannelSyncRequest) => Promise<void>;
  onRefreshMetadata: () => Promise<void>;
  settings: AppSettingsModel | null;
}

export function ChannelsTab({
  channels,
  onAddChannel,
  onRemoveChannel,
  onSyncChannels,
  onRefreshMetadata,
  settings,
}: ChannelsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [newChannelInput, setNewChannelInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Sync options state
  const [syncRes, setSyncRes] = useState(settings?.defaultResolution || '1080');
  const [syncDays, setSyncDays] = useState(settings?.daysLimit || 4);
  const [syncSubs, setSyncSubs] = useState(settings?.includeSubtitles ?? true);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelInput.trim()) return;

    setIsAdding(true);
    const urls = newChannelInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const url of urls) {
      await onAddChannel(url);
    }

    setNewChannelInput('');
    setIsAdding(false);
    setShowAddModal(false);
  };

  const handleTriggerSync = (channelIds: string[] | null = null) => {
    onSyncChannels({
      channelIds: channelIds || (selectedChannels.length > 0 ? selectedChannels : null),
      resolution: syncRes,
      daysLimit: Number(syncDays),
      subtitles: syncSubs,
    });
    setShowSyncModal(false);
  };

  const toggleSelectChannel = (id: string) => {
    if (selectedChannels.includes(id)) {
      setSelectedChannels(selectedChannels.filter((cId) => cId !== id));
    } else {
      setSelectedChannels([...selectedChannels, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedChannels.length === channels.length) {
      setSelectedChannels([]);
    } else {
      setSelectedChannels(channels.map((c) => c.id));
    }
  };

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.url.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Editorial Designer Hero Header */}
      <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-8 sm:p-10 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground bg-secondary/80 px-3 py-1 rounded-full border border-border/60">
                Channel Curation & Archive
              </span>
              <span className="text-[11px] font-mono text-muted-foreground/80">
                {channels.length} {channels.length === 1 ? 'Source' : 'Sources'} Active
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.15]">
              Subscribed Channels
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed">
              Automated multi-channel video sync, resolution rules, subtitle archiving, and date filters.
            </p>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              size="default"
              onClick={() => onRefreshMetadata()}
              className="h-11 px-5 text-sm flex-1 sm:flex-initial rounded-2xl bg-secondary/50 hover:bg-secondary border-border/80"
              title="Refresh channel avatars and metadata"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span>Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={() => setShowAddModal(true)}
              className="h-11 px-5 text-sm flex-1 sm:flex-initial rounded-2xl bg-secondary/50 hover:bg-secondary border-border/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Channel</span>
            </Button>

            <Button
              size="default"
              onClick={() => setShowSyncModal(true)}
              className="h-11 px-6 text-sm flex-1 sm:flex-initial rounded-2xl bg-foreground text-background hover:opacity-90 shadow-md shadow-black/10 transition-transform active:scale-[0.98]"
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              <span>
                {selectedChannels.length > 0 ? `Sync (${selectedChannels.length})` : 'Sync All'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Reactive Filter & Selection Bar */}
      {channels.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-secondary/40 backdrop-blur-md p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-3.5" />
            <Input
              type="text"
              placeholder="Search or filter channels..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 h-11 text-sm bg-card/80 border-border/80 rounded-xl focus:ring-1.5 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-sm text-muted-foreground">
            {selectedChannels.length > 0 && (
              <span className="font-mono text-xs bg-card text-foreground px-3.5 py-1.5 rounded-full border border-border/80 font-medium animate-in fade-in duration-200 shadow-xs">
                {selectedChannels.length} selected
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="h-10 px-3.5 text-sm text-muted-foreground hover:text-foreground shrink-0 rounded-xl"
            >
              {selectedChannels.length === channels.length ? (
                <CheckSquare className="h-4 w-4 mr-2 text-foreground" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              <span>{selectedChannels.length === channels.length ? 'Deselect All' : 'Select All'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Channels Grid (Max 4 Cards per Row) */}
      {channels.length === 0 ? (
        <div className="text-center py-32 rounded-3xl border border-dashed border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="h-16 w-16 rounded-2xl bg-secondary/80 text-foreground flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Tv className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No channels added yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
            Add YouTube channel URLs (e.g. https://www.youtube.com/@mkbhd) to start building your offline collection.
          </p>
          <Button onClick={() => setShowAddModal(true)} size="lg" className="h-11 px-7 rounded-2xl">
            <Plus className="h-4 w-4 mr-2" /> Add First Channel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredChannels.map((ch) => {
            const isSelected = selectedChannels.includes(ch.id);
            return (
              <div
                key={ch.id}
                className={`relative group rounded-3xl border bg-card/80 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ease-out select-none shadow-sm hover:-translate-y-1 hover:shadow-xl hover:border-foreground/40 ${
                  isSelected
                    ? 'border-foreground ring-2 ring-foreground/20 bg-secondary/40'
                    : 'border-border/80'
                }`}
              >
                {/* Select Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleSelectChannel(ch.id)}
                  className="absolute top-5 right-5 text-muted-foreground hover:text-foreground z-10 transition-colors cursor-pointer p-1 rounded-lg hover:bg-secondary/60"
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-foreground" />
                  ) : (
                    <Square className="h-5 w-5 opacity-40 group-hover:opacity-100" />
                  )}
                </button>

                {/* Channel Profile with Vivid Colored Avatar */}
                <div className="flex items-start gap-4 mb-6 pr-6">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-secondary border border-border/80 shrink-0 flex items-center justify-center ring-2 ring-border/70 group-hover:ring-foreground/30 transition-all shadow-xs">
                    {ch.avatarUrl ? (
                      <img
                        src={ch.avatarUrl}
                        alt={ch.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Tv className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground truncate leading-snug tracking-tight" title={ch.name}>
                      {ch.name || 'Loading...'}
                    </h3>
                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs sm:text-sm font-mono text-muted-foreground hover:text-foreground truncate flex items-center gap-1.5 mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="truncate">{ch.url.replace('https://www.youtube.com/', '')}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </a>
                  </div>
                </div>

                {/* Footer Sync Status & Quick Actions */}
                <div className="pt-4 border-t border-border/70 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                  <span className="font-mono truncate">
                    {ch.lastSyncedAt ? (
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        {new Date(ch.lastSyncedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="opacity-50">Never synced</span>
                    )}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary"
                      onClick={() => handleTriggerSync([ch.id])}
                      title="Sync this channel now"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 rounded-xl hover:bg-secondary"
                      onClick={() => onRemoveChannel(ch.id)}
                      title="Remove channel"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl p-8 space-y-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground">New Subscription</span>
              <h3 className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
                <Plus className="h-5 w-5 text-foreground" /> Add YouTube Channel(s)
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Paste single or multiple channel URLs (one per line).
              </p>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-5">
              <textarea
                value={newChannelInput}
                onChange={(e) => setNewChannelInput(e.target.value)}
                placeholder="https://www.youtube.com/@channel&#10;https://www.youtube.com/@channel2"
                rows={4}
                className="w-full bg-secondary/60 border border-border/80 rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="default" onClick={() => setShowAddModal(false)} className="h-11 px-5 rounded-2xl">
                  Cancel
                </Button>
                <Button type="submit" size="default" disabled={isAdding} className="h-11 px-6 rounded-2xl">
                  {isAdding ? 'Adding...' : 'Add Channels'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync Configuration Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl p-8 space-y-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground">Execution Parameters</span>
              <h3 className="text-2xl font-bold flex items-center gap-2.5 text-foreground">
                <SlidersHorizontal className="h-5 w-5 text-foreground" /> Sync Configuration
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Configure download parameters for this run.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="block font-medium text-foreground text-xs uppercase tracking-wider font-mono">Max Resolution</label>
                <select
                  value={syncRes}
                  onChange={(e) => setSyncRes(e.target.value)}
                  className="w-full bg-secondary/70 border border-border/80 rounded-xl px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-ring"
                >
                  <option value="1080">1080p (Full HD)</option>
                  <option value="720">720p (HD)</option>
                  <option value="4k">4K (2160p)</option>
                  <option value="best">Best Available</option>
                  <option value="audio">Audio Only (MP3)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-foreground text-xs uppercase tracking-wider font-mono">Date Range (Days Ago)</label>
                <Input
                  type="number"
                  value={syncDays}
                  onChange={(e) => setSyncDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  className="h-11 text-sm bg-secondary/70 border-border/80"
                />
                <span className="text-xs text-muted-foreground block">
                  Only uploads published in the last {syncDays} days will be synced.
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-b border-border/80">
                <div>
                  <span className="font-medium text-foreground block">Embed Subtitles</span>
                  <span className="text-xs text-muted-foreground">English & Tamil SRT subtitles</span>
                </div>
                <input
                  type="checkbox"
                  checked={syncSubs}
                  onChange={(e) => setSyncSubs(e.target.checked)}
                  className="h-4 w-4 accent-foreground rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="default" onClick={() => setShowSyncModal(false)} className="h-11 px-5 rounded-2xl">
                Cancel
              </Button>
              <Button type="button" size="default" onClick={() => handleTriggerSync()} className="h-11 px-6 rounded-2xl">
                <Play className="h-4 w-4 mr-2 fill-current" /> Start Sync
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
