import React, { useState } from 'react';
import { Plus, RefreshCw, Play, Trash2, Check, Tv, ExternalLink, SlidersHorizontal, CheckSquare, Square, Search } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Top Banner / Actions Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Subscribed Channels
              </h2>
              <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
                {channels.length} {channels.length === 1 ? 'channel' : 'channels'}
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground font-normal">
              Automated multi-channel video sync, custom date filters, resolution rules, and subtitles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              size="default"
              onClick={() => onRefreshMetadata()}
              className="h-11 px-4 sm:px-5 text-sm flex-1 sm:flex-initial"
              title="Refresh avatars and metadata"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span>Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={() => setShowAddModal(true)}
              className="h-11 px-4 sm:px-5 text-sm flex-1 sm:flex-initial"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Channel</span>
            </Button>

            <Button
              size="default"
              onClick={() => setShowSyncModal(true)}
              className="h-11 px-5 sm:px-6 text-sm flex-1 sm:flex-initial"
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              <span>
                {selectedChannels.length > 0 ? `Sync (${selectedChannels.length})` : 'Sync All'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Bulk Select Bar (Gray Container Layer) */}
      {channels.length > 0 && (
        <div className="rounded-2xl border border-border bg-secondary/50 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-3.5" />
            <Input
              type="text"
              placeholder="Search channels by name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 h-11 text-sm bg-card border-border"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="h-10 px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              {selectedChannels.length === channels.length ? (
                <CheckSquare className="h-4 w-4 mr-2 text-foreground" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              <span>{selectedChannels.length === channels.length ? 'Deselect All' : 'Select All'}</span>
            </Button>
            {selectedChannels.length > 0 && (
              <span className="font-mono text-xs bg-card text-foreground px-3 py-1.5 rounded-full border border-border font-medium">
                {selectedChannels.length} selected
              </span>
            )}
          </div>
        </div>
      )}

      {/* Channels Responsive Grid (Max 4 cards per row) */}
      {channels.length === 0 ? (
        <div className="text-center py-28 rounded-3xl border border-dashed border-border bg-card/50">
          <div className="h-16 w-16 rounded-2xl bg-secondary text-foreground flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Tv className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">No channels added yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1.5 mb-6">
            Add YouTube channel URLs (e.g. https://www.youtube.com/@mkbhd) to start archiving.
          </p>
          <Button onClick={() => setShowAddModal(true)} size="lg" className="h-11 px-6">
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
                className={`relative group rounded-3xl border bg-card p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 select-none shadow-xs ${
                  isSelected
                    ? 'border-foreground ring-2 ring-foreground/20 bg-secondary/40'
                    : 'border-border hover:border-foreground/40 hover:shadow-md'
                }`}
              >
                {/* Select Toggle */}
                <button
                  type="button"
                  onClick={() => toggleSelectChannel(ch.id)}
                  className="absolute top-5 right-5 text-muted-foreground hover:text-foreground z-10 transition-colors cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-foreground" />
                  ) : (
                    <Square className="h-5 w-5 opacity-40 group-hover:opacity-100" />
                  )}
                </button>

                {/* Channel Info with Bigger Colored Profile Avatar */}
                <div className="flex items-start gap-4 mb-6 pr-6">
                  <div className="h-15 w-15 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center ring-2 ring-border/70 group-hover:ring-foreground/40 transition-all">
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
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground truncate leading-snug" title={ch.name}>
                      {ch.name || 'Loading...'}
                    </h3>
                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs sm:text-sm font-mono text-muted-foreground hover:text-foreground truncate flex items-center gap-1.5 mt-1.5"
                    >
                      <span className="truncate">{ch.url.replace('https://www.youtube.com/', '')}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </a>
                  </div>
                </div>

                {/* Footer status & Actions */}
                <div className="pt-4 border-t border-border/70 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                  <span className="font-mono truncate">
                    {ch.lastSyncedAt ? (
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
                        <Check className="h-4 w-4" />
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
                      className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
                      onClick={() => handleTriggerSync([ch.id])}
                      title="Sync this channel"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-3xl border border-border bg-card p-7 sm:p-8 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Plus className="h-5 w-5 text-foreground" /> Add YouTube Channel(s)
              </h3>
              <p className="text-sm text-muted-foreground">
                Paste single or multiple channel URLs (one per line).
              </p>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-5">
              <textarea
                value={newChannelInput}
                onChange={(e) => setNewChannelInput(e.target.value)}
                placeholder="https://www.youtube.com/@channel&#10;https://www.youtube.com/@channel2"
                rows={4}
                className="w-full bg-secondary/60 border border-border rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1.5 focus:ring-ring"
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" size="default" onClick={() => setShowAddModal(false)} className="h-11 px-5">
                  Cancel
                </Button>
                <Button type="submit" size="default" disabled={isAdding} className="h-11 px-6">
                  {isAdding ? 'Adding...' : 'Add Channels'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sync Configuration Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl border border-border bg-card p-7 sm:p-8 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <SlidersHorizontal className="h-5 w-5 text-foreground" /> Sync Configuration
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure download parameters for this run.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="block font-medium text-foreground text-xs uppercase tracking-wider font-mono">Max Resolution</label>
                <select
                  value={syncRes}
                  onChange={(e) => setSyncRes(e.target.value)}
                  className="w-full bg-secondary/70 border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:ring-1 focus:ring-ring"
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
                  className="h-11 text-sm bg-secondary/70 border-border"
                />
                <span className="text-xs text-muted-foreground block">
                  Only uploads published in the last {syncDays} days will be synced.
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-b border-border">
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
              <Button type="button" variant="outline" size="default" onClick={() => setShowSyncModal(false)} className="h-11 px-5">
                Cancel
              </Button>
              <Button type="button" size="default" onClick={() => handleTriggerSync()} className="h-11 px-6">
                <Play className="h-4 w-4 mr-2 fill-current" /> Start Sync
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
