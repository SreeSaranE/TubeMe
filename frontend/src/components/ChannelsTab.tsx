import React, { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  Play,
  Trash2,
  Tv,
  ExternalLink,
  CheckSquare,
  Square,
  Search,
  Tag,
  Layers,
  FolderKanban,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { ChannelModel, ChannelSyncRequest, AppSettingsModel, CategoryDetailModel } from '@/types';
import { formatDate } from '@/lib/utils';
import { api } from '@/services/api';
import { ManageCategoriesModal } from '@/components/ManageCategoriesModal';

interface ChannelsTabProps {
  channels: ChannelModel[];
  onAddChannel: (url: string, category?: string) => Promise<void>;
  onUpdateCategory: (id: string, category: string) => Promise<void>;
  onRemoveChannel: (id: string) => Promise<void>;
  onSyncChannels: (req: ChannelSyncRequest) => Promise<void>;
  onRefreshMetadata: () => Promise<void>;
  onReloadChannels?: () => Promise<void>;
  settings: AppSettingsModel | null;
}

export function ChannelsTab({
  channels,
  onAddChannel,
  onUpdateCategory,
  onRemoveChannel,
  onSyncChannels,
  onRefreshMetadata,
  onReloadChannels,
  settings,
}: ChannelsTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [categoriesList, setCategoriesList] = useState<CategoryDetailModel[]>([]);
  const [editingCategoryChannel, setEditingCategoryChannel] = useState<ChannelModel | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addChannelCategory, setAddChannelCategory] = useState('Tech');
  const [customAddCategory, setCustomAddCategory] = useState('');
  const [newChannelInput, setNewChannelInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');

  // Sync options state
  const [syncRes, setSyncRes] = useState(settings?.defaultResolution || '1080');
  const [syncDays, setSyncDays] = useState(settings?.daysLimit || 4);
  const [syncSubs, setSyncSubs] = useState(settings?.includeSubtitles ?? true);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategoriesDetails();
      if (data) setCategoriesList(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCategoriesChanged = async () => {
    await loadCategories();
    if (onReloadChannels) {
      await onReloadChannels();
    }
  };

  // Collect all unique categories
  const allCategories = Array.from(
    new Set([
      'General',
      'Tech',
      'Entertainment',
      'Finance',
      'Education',
      ...categoriesList.map((c) => c.name),
      ...channels.map((c) => (c.category || 'General').trim()),
    ])
  ).filter(Boolean).sort();

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelInput.trim()) return;

    setIsAdding(true);
    const categoryToUse =
      addChannelCategory === '__custom__'
        ? customAddCategory.trim() || 'General'
        : addChannelCategory || 'General';

    const urls = newChannelInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const url of urls) {
      await onAddChannel(url, categoryToUse);
    }

    setNewChannelInput('');
    setCustomAddCategory('');
    setIsAdding(false);
    setShowAddModal(false);
    await handleCategoriesChanged();
  };

  const handleUpdateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryChannel || !newCategoryName.trim()) return;

    await onUpdateCategory(editingCategoryChannel.id, newCategoryName.trim());
    setEditingCategoryChannel(null);
    setNewCategoryName('');
    await handleCategoriesChanged();
  };

  const handleTriggerSync = (channelIds: string[] | null = null, category: string | null = null) => {
    onSyncChannels({
      channelIds: channelIds || (selectedChannels.length > 0 ? selectedChannels : null),
      category: category || (selectedCategoryTab !== 'All' ? selectedCategoryTab : undefined),
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshMetadata();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter channels based on search and selected category
  const filteredChannels = channels.filter((ch) => {
    const matchesSearch =
      ch.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ch.url.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (ch.category || '').toLowerCase().includes(searchFilter.toLowerCase());

    const matchesCategory =
      selectedCategoryTab === 'All' ||
      (ch.category || 'General').toLowerCase() === selectedCategoryTab.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* 1. Clean, Spacious Action Header (Unwanted clutter removed) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-3.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Channels
          </h1>
          <span className="counter-badge text-xs px-2.5 py-0.5">
            {channels.length}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary h-11 px-4 text-sm font-semibold"
            title="Refresh channel metadata"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-secondary h-11 px-4 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Add Channel</span>
          </button>

          {channels.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (selectedChannels.length > 0) {
                  setShowSyncModal(true);
                } else {
                  handleTriggerSync(null, selectedCategoryTab !== 'All' ? selectedCategoryTab : null);
                }
              }}
              className="btn btn-primary h-11 px-6 text-sm font-bold shadow-sm"
            >
              <Play className="h-4 w-4 fill-current mr-2" />
              <span>
                {selectedChannels.length > 0
                  ? `Sync Selected (${selectedChannels.length})`
                  : selectedCategoryTab !== 'All'
                  ? `Sync ${selectedCategoryTab}`
                  : 'Sync All'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Category Filter Pills & Category Management Bar */}
      {channels.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none flex-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryTab('All')}
                className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] text-sm font-semibold border transition-all cursor-pointer select-none shrink-0 ${
                  selectedCategoryTab === 'All'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>All</span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-[var(--radius-full)] font-bold ${
                    selectedCategoryTab === 'All'
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  {channels.length}
                </span>
              </button>

              {allCategories.map((cat) => {
                const count = channels.filter(
                  (c) => (c.category || 'General').toLowerCase() === cat.toLowerCase()
                ).length;
                if (count === 0 && selectedCategoryTab !== cat) return null;

                const isActive = selectedCategoryTab.toLowerCase() === cat.toLowerCase();

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] text-sm font-semibold border transition-all cursor-pointer select-none shrink-0 ${
                      isActive
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    <span>{cat}</span>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-[var(--radius-full)] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dedicated Manage Categories Trigger */}
            <button
              type="button"
              onClick={() => setShowManageCategoriesModal(true)}
              className="btn btn-secondary text-sm h-10 px-4 rounded-[var(--radius-full)] shrink-0 self-start sm:self-auto font-semibold"
            >
              <FolderKanban className="h-4 w-4 text-[var(--text-primary)]" />
              <span>Manage Categories</span>
            </button>
          </div>

          {/* Search & Bulk Select Bar */}
          <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="h-4.5 w-4.5 text-[var(--text-muted)] absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search channels by name or category..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-sm text-[var(--text-secondary)]">
              {selectedChannels.length > 0 && (
                <span className="font-mono text-xs text-[var(--text-primary)] font-bold bg-[var(--bg-subtle)] px-3 py-1 rounded-[var(--radius-full)] border border-[var(--border)]">
                  {selectedChannels.length} selected
                </span>
              )}
              <button
                type="button"
                onClick={toggleSelectAll}
                className="btn btn-secondary h-10 px-4 text-sm font-semibold"
              >
                {selectedChannels.length === channels.length ? (
                  <CheckSquare className="h-4 w-4 text-[var(--text-primary)] mr-1.5" />
                ) : (
                  <Square className="h-4 w-4 mr-1.5" />
                )}
                <span>{selectedChannels.length === channels.length ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Channels Grid with Large Avatar & Top-Right Selection Box */}
      {channels.length === 0 ? (
        <div className="placeholder-view">
          <div className="placeholder-box">
            <div className="placeholder-icon">
              <Tv className="h-8 w-8" />
            </div>
            <h2>No Channels Subscribed</h2>
            <p>
              Add your favorite YouTube channels to monitor their uploads and download new videos on schedule.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary h-11 px-6 text-sm font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Channel
              </button>
            </div>
          </div>
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="placeholder-view">
          <div className="placeholder-box">
            <div className="placeholder-icon">
              <Search className="h-8 w-8" />
            </div>
            <h2>No Matching Channels</h2>
            <p>No channels match the filter "{searchFilter}".</p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setSearchFilter('');
                  setSelectedCategoryTab('All');
                }}
                className="btn btn-secondary text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChannels.map((ch) => {
            const isSelected = selectedChannels.includes(ch.id);

            return (
              <div
                key={ch.id}
                onClick={() => toggleSelectChannel(ch.id)}
                className={`task-card relative flex flex-col justify-between gap-5 cursor-pointer transition-all p-6 ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--bg-subtle)] shadow-[var(--shadow-md)]'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                }`}
              >
                {/* Top Row: Big Logo (64px) + Large Channel Name + Top-Right Selection Box */}
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar & Channel Details */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Large Prominent Logo (64px) */}
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-subtle)] border-2 border-[var(--border)] shrink-0 flex items-center justify-center shadow-xs">
                      {ch.avatarUrl ? (
                        <img
                          src={ch.avatarUrl}
                          alt={ch.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Tv className="h-7 w-7 text-[var(--text-muted)]" />
                      )}
                    </div>

                    {/* Prominent Channel Name & Category */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <h3
                          className="font-extrabold text-lg sm:text-xl text-[var(--text-primary)] truncate leading-snug tracking-tight"
                          title={ch.name}
                        >
                          {ch.name}
                        </h3>
                        <a
                          href={ch.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 p-0.5 transition-colors"
                          title="Open channel on YouTube"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="type-pill text-xs font-semibold px-2.5 py-0.5">
                          {ch.category || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Selection Box (Prominent & Clear) */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectChannel(ch.id);
                    }}
                    className={`w-6 h-6 rounded-[var(--radius-sm)] border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                        : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--text-primary)]'
                    }`}
                    title={isSelected ? 'Deselect channel' : 'Select channel'}
                  >
                    {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                  </div>
                </div>

                {/* Footer: Last Synced + Action Buttons */}
                <div className="border-t border-[var(--border)] pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
                    <span className="font-semibold">Synced:</span>
                    <span className="text-[var(--text-secondary)] font-medium">
                      {formatDate(ch.lastSyncedAt || ch.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleTriggerSync([ch.id])}
                      className="btn-icon h-9 w-9 flex items-center justify-center"
                      title="Sync this channel now"
                    >
                      <Play className="h-4 w-4 text-[var(--text-primary)] fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryChannel(ch);
                        setNewCategoryName(ch.category || 'General');
                      }}
                      className="btn-icon h-9 w-9 flex items-center justify-center"
                      title="Change category"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveChannel(ch.id)}
                      className="btn-icon h-9 w-9 flex items-center justify-center hover:text-[var(--danger)]"
                      title="Remove channel"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-7 space-y-6 shadow-xl animate-in fade-in duration-150">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Add YouTube Channel(s)
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Paste channel URLs to subscribe and monitor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-icon"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-5 text-sm">
              <div className="space-y-2">
                <label className="font-semibold text-[var(--text-primary)]">
                  Channel URLs (one per line)
                </label>
                <textarea
                  value={newChannelInput}
                  onChange={(e) => setNewChannelInput(e.target.value)}
                  placeholder="https://www.youtube.com/@mkbhd&#10;https://www.youtube.com/@Fireship"
                  rows={4}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-md)] p-3 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-[var(--text-primary)]">Assign Category</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setAddChannelCategory(cat);
                        setCustomAddCategory('');
                      }}
                      className={`px-3.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold border cursor-pointer ${
                        addChannelCategory === cat && !customAddCategory
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddChannelCategory('__custom__')}
                    className={`px-3.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold border cursor-pointer ${
                      addChannelCategory === '__custom__'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)]'
                    }`}
                  >
                    + Custom
                  </button>
                </div>

                {addChannelCategory === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Enter custom category name..."
                    value={customAddCategory}
                    onChange={(e) => setCustomAddCategory(e.target.value)}
                    className="w-full mt-2 h-10 px-3 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)]"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary text-sm h-10 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !newChannelInput.trim()}
                  className="btn btn-primary text-sm h-10 px-5 font-bold"
                >
                  {isAdding ? 'Adding Channels...' : 'Add Channels'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Change Category Modal */}
      {editingCategoryChannel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-7 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Change Category
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Channel: <strong>{editingCategoryChannel.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategoryChannel(null)}
                className="btn-icon"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategorySubmit} className="space-y-4 text-sm">
              <div className="space-y-2">
                <label className="font-semibold text-[var(--text-primary)]">Select Category</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategoryName(cat)}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold border cursor-pointer ${
                        newCategoryName === cat
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="font-medium text-xs text-[var(--text-muted)]">Or Type Name:</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full mt-1.5 h-10 px-3 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingCategoryChannel(null)}
                  className="btn btn-secondary text-sm h-10 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="btn btn-primary text-sm h-10 px-5 font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Sync Options Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-7 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Sync Channels
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {selectedChannels.length} channel(s) selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="btn-icon"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--text-primary)]">Download Resolution</label>
                <select
                  value={syncRes}
                  onChange={(e) => setSyncRes(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)]"
                >
                  <option value="1080">1080p Full HD</option>
                  <option value="720">720p HD</option>
                  <option value="4k">4K Ultra HD</option>
                  <option value="best">Best Available</option>
                  <option value="audio">Audio Only (MP3)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--text-primary)]">Date Range (Days Limit)</label>
                <input
                  type="number"
                  value={syncDays}
                  onChange={(e) => setSyncDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  className="w-full h-10 px-3 text-sm bg-[var(--bg-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)]">
                  Channels will be skipped as soon as the latest upload exceeds {syncDays} days.
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border)]">
                <span className="font-medium text-[var(--text-primary)]">Include Subtitles</span>
                <input
                  type="checkbox"
                  checked={syncSubs}
                  onChange={(e) => setSyncSubs(e.target.checked)}
                  className="h-4.5 w-4.5 accent-[var(--primary)] cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="btn btn-secondary text-sm h-10 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerSync()}
                  className="btn btn-primary text-sm h-10 px-5 font-bold"
                >
                  <Play className="h-4 w-4 mr-1.5 fill-current" />
                  Start Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Dedicated Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={showManageCategoriesModal}
        onClose={() => setShowManageCategoriesModal(false)}
        onCategoriesChanged={handleCategoriesChanged}
      />
    </div>
  );
}
