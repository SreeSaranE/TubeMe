import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Film,
  Tv,
  HardDrive,
  Clock,
  RefreshCw,
  TrendingUp,
  Tag,
  ListVideo,
  ExternalLink,
  Flame,
  Award,
} from 'lucide-react';
import { AppStatisticsModel } from '@/types';
import { api } from '@/services/api';

export function StatisticsTab() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AppStatisticsModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSeconds = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds <= 0) return '0m';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const watchedPercentage = useMemo(() => {
    if (!stats || stats.totalVideos === 0) return 0;
    return Math.round((stats.watchedVideosCount / stats.totalVideos) * 100);
  }, [stats]);

  const avgVideoSize = useMemo(() => {
    if (!stats || stats.totalVideos === 0) return 0;
    return stats.totalDiskSizeBytes / stats.totalVideos;
  }, [stats]);

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
              Statistics
            </h1>
            <span className="counter-badge text-xs px-2.5 py-0.5 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Insights</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Overview of your media library, device storage usage, and viewing activity.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={loadStatistics}
          disabled={isLoading}
          className="btn btn-secondary h-11 px-4 text-xs sm:text-sm font-medium flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
          title="Refresh statistics"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading && !stats ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Calculating Library Statistics...
            </span>
          </div>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* 2. Key Metrics Cards (4 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Total Videos */}
            <div className="card p-5 space-y-3 border border-[var(--border)] relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Total Videos
                </span>
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <Film className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {stats.totalVideos.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="text-emerald-500 font-medium">
                    {stats.watchedVideosCount} watched
                  </span>
                  <span>•</span>
                  <span>{stats.unwatchedVideosCount} unwatched</span>
                </div>
              </div>

              {/* Progress bar ratio */}
              <div className="h-1.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${watchedPercentage}%` }}
                />
                <div
                  className="h-full bg-[var(--primary)]/40 transition-all duration-500"
                  style={{ width: `${100 - watchedPercentage}%` }}
                />
              </div>
            </div>

            {/* Card 2: Channels Present */}
            <div className="card p-5 space-y-3 border border-[var(--border)] relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Channels
                </span>
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Tv className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {stats.totalChannels.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Organized in {stats.categoryDistribution.length} categories
                </div>
              </div>

              <div className="pt-2 text-xs text-[var(--primary)] hover:underline cursor-pointer flex items-center gap-1 font-medium" onClick={() => navigate('/channels')}>
                <span>Manage channels</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>

            {/* Card 3: Storage on Disk */}
            <div className="card p-5 space-y-3 border border-[var(--border)] relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Disk Usage
                </span>
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <HardDrive className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {formatBytes(stats.totalDiskSizeBytes)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Avg ~{formatBytes(avgVideoSize)} per video
                </div>
              </div>

              <div className="pt-2 text-xs text-[var(--text-muted)]">
                Local offline media files
              </div>
            </div>

            {/* Card 4: Total Watch Time */}
            <div className="card p-5 space-y-3 border border-[var(--border)] relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Time Watched
                </span>
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {formatSeconds(stats.totalWatchTimeSeconds)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {watchedPercentage}% library watched
                </div>
              </div>

              <div className="pt-2 text-xs text-[var(--primary)] hover:underline cursor-pointer flex items-center gap-1 font-medium" onClick={() => navigate('/history')}>
                <span>View watch history</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* 3. Detailed Sections: Top Channels & Library Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Most Watched Channels (Takes 2 Cols on Large Screens) */}
            <div className="lg:col-span-2 card p-6 space-y-5 border border-[var(--border)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <Flame className="h-5 w-5 text-amber-500" />
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                      Most Watched Channels
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Channels you interact with and finish the most
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/channels')}
                  className="text-xs text-[var(--primary)] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>All Channels</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              {stats.topWatchedChannels.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-[var(--text-muted)]">
                  <Tv className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-xs">No watched channels data available yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topWatchedChannels.map((channel, index) => {
                    const completionRate =
                      channel.totalVideosCount > 0
                        ? Math.round((channel.watchedCount / channel.totalVideosCount) * 100)
                        : 0;

                    return (
                      <div
                        key={channel.channelName}
                        onClick={() => navigate(`/?channel=${encodeURIComponent(channel.channelName)}`)}
                        className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all cursor-pointer flex items-center justify-between gap-4 group"
                      >
                        {/* Rank & Channel Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank Badge */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              index === 0
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                                : index === 1
                                ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/40'
                                : index === 2
                                ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                            }`}
                          >
                            {index === 0 ? <Award className="h-3.5 w-3.5" /> : `#${index + 1}`}
                          </div>

                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-black/20 border border-[var(--border)] shrink-0 flex items-center justify-center">
                            {channel.avatarUrl ? (
                              <img
                                src={channel.avatarUrl}
                                alt={channel.channelName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Tv className="h-4 w-4 text-[var(--text-muted)]" />
                            )}
                          </div>

                          {/* Channel Title & Sub-metrics */}
                          <div className="min-w-0">
                            <h4
                              className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate"
                              title={channel.channelName}
                            >
                              {channel.channelName}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span>{channel.watchedCount} watched</span>
                              <span>•</span>
                              <span>{channel.totalVideosCount} total</span>
                              {channel.totalSizeBytes > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{formatBytes(channel.totalSizeBytes)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Watch Metrics / Progress */}
                        <div className="text-right shrink-0 space-y-1">
                          {channel.totalWatchTimeSeconds > 0 && (
                            <div className="text-xs font-semibold text-[var(--text-primary)]">
                              {formatSeconds(channel.totalWatchTimeSeconds)}
                            </div>
                          )}
                          <div className="text-[11px] font-mono text-emerald-500 font-medium">
                            {completionRate}% completed
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Watch Status & Category Breakdown */}
            <div className="space-y-6">
              {/* Watch Status Card */}
              <div className="card p-5 space-y-4 border border-[var(--border)]">
                <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Film className="h-4 w-4 text-[var(--primary)]" />
                  <span>Viewing Status</span>
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Completed Videos</span>
                    <span className="font-semibold text-emerald-500">
                      {stats.watchedVideosCount} ({watchedPercentage}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Unwatched Queue</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {stats.unwatchedVideosCount} ({100 - watchedPercentage}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Custom Playlists</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {stats.totalPlaylistsCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => navigate('/playlists')}
                    className="text-[var(--primary)] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ListVideo className="h-3.5 w-3.5" />
                    <span>Manage playlists ({stats.totalPlaylistsCount})</span>
                  </button>
                </div>
              </div>

              {/* Categories Distribution Card */}
              <div className="card p-5 space-y-4 border border-[var(--border)]">
                <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-500" />
                  <span>Category Distribution</span>
                </h3>

                {stats.categoryDistribution.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No categories defined.</p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.categoryDistribution.map((cat) => {
                      const percentage =
                        stats.totalChannels > 0
                          ? Math.round((cat.channelCount / stats.totalChannels) * 100)
                          : 0;

                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[var(--text-primary)]">
                              {cat.name}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              {cat.channelCount} {cat.channelCount === 1 ? 'channel' : 'channels'} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
