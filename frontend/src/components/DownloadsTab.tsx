import React, { useState } from 'react';
import {
  Download,
  Check,
  AlertCircle,
  X,
  Clock,
  Terminal,
  Trash2,
  StopCircle,
  Layers,
} from 'lucide-react';
import { DownloadItem } from '@/types';
import { Link } from 'react-router-dom';

interface DownloadsTabProps {
  downloads: DownloadItem[];
  onCancelDownload: (id: string) => Promise<void>;
  onClearHistory: () => Promise<void>;
}

export function DownloadsTab({ downloads, onCancelDownload, onClearHistory }: DownloadsTabProps) {
  const [activeLogItem, setActiveLogItem] = useState<DownloadItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  const filteredDownloads = downloads.filter((d) => {
    if (filter === 'active') return d.status === 'Downloading' || d.status === 'Queued';
    if (filter === 'completed') return d.status === 'Completed';
    if (filter === 'failed') return d.status === 'Failed' || d.status === 'Cancelled';
    return true;
  });

  const activeCount = downloads.filter((d) => d.status === 'Downloading' || d.status === 'Queued').length;
  const completedCount = downloads.filter((d) => d.status === 'Completed').length;
  const failedCount = downloads.filter((d) => d.status === 'Failed' || d.status === 'Cancelled').length;

  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'Downloading':
        return (
          <div className="status-chip connecting">
            <span className="status-dot"></span>
            <span className="font-semibold">Downloading</span>
          </div>
        );
      case 'Queued':
        return (
          <div className="status-chip">
            <span className="status-dot"></span>
            <span>Queued</span>
          </div>
        );
      case 'Completed':
        return (
          <div className="status-chip connected">
            <span className="status-dot"></span>
            <span className="font-semibold">Completed</span>
          </div>
        );
      case 'Failed':
        return (
          <div className="status-chip disconnected">
            <span className="status-dot"></span>
            <span className="font-semibold">Failed</span>
          </div>
        );
      case 'Cancelled':
        return (
          <div className="status-chip">
            <span className="status-dot"></span>
            <span>Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Clean, Spacious Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-3.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Queue
          </h1>
          {activeCount > 0 && (
            <span className="counter-badge text-xs px-2.5 py-0.5 animate-pulse">
              {activeCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {downloads.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="btn btn-secondary text-sm h-11 px-4 font-semibold"
              title="Clear completed and failed tasks"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear History</span>
            </button>
          )}

          <Link to="/search" className="btn btn-primary text-sm h-11 px-5 font-bold shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            <span>New Download</span>
          </Link>
        </div>
      </div>

      {/* 2. Stats & Filter Bar */}
      {downloads.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-sm font-mono text-[var(--text-secondary)]">
            <span>
              <strong className="text-[var(--text-primary)]">{downloads.length}</strong> total
            </span>
            <span>
              <strong className="text-[var(--text-primary)]">{activeCount}</strong> active
            </span>
            <span>
              <strong className="text-[var(--text-primary)]">{completedCount}</strong> finished
            </span>
            {failedCount > 0 && (
              <span className="text-[var(--danger)] font-bold">
                {failedCount} failed
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-[var(--bg-subtle)] p-1 rounded-[var(--radius-full)] border border-[var(--border)] text-sm">
            {(['all', 'active', 'completed', 'failed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-[var(--radius-full)] text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Downloads Task Cards List */}
      {downloads.length === 0 ? (
        <div className="placeholder-view">
          <div className="placeholder-box">
            <div className="placeholder-icon">
              <Download className="h-8 w-8" />
            </div>
            <h2>Queue is Empty</h2>
            <p>
              No active or past downloads in this session. Start a download from the Search tab or sync your channels.
            </p>
            <div className="mt-6 flex justify-center">
              <Link to="/search" className="btn btn-primary h-11 px-6 text-sm font-bold">
                <Download className="h-4 w-4 mr-2" />
                Go to Downloader
              </Link>
            </div>
          </div>
        </div>
      ) : filteredDownloads.length === 0 ? (
        <div className="placeholder-view">
          <div className="placeholder-box">
            <div className="placeholder-icon">
              <Layers className="h-8 w-8" />
            </div>
            <h2>No {filter} items</h2>
            <p>No download tasks currently match the "{filter}" filter.</p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="btn btn-secondary text-sm"
              >
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDownloads.map((item) => {
            const isRunning = item.status === 'Downloading';
            const isQueued = item.status === 'Queued';

            return (
              <div
                key={item.id}
                className="card p-6 space-y-4 hover:border-[var(--border-strong)] transition-colors"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="type-pill text-xs font-mono font-bold shrink-0">
                      {item.resolution === 'audio' ? 'AUDIO MP3' : `${item.resolution}p`}
                    </span>
                    <h3
                      className="font-bold text-base sm:text-lg text-[var(--text-primary)] truncate"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                    {renderStatusChip(item.status)}

                    {isRunning && (
                      <button
                        type="button"
                        onClick={() => onCancelDownload(item.id)}
                        className="btn btn-secondary text-xs h-8 px-3 font-semibold hover:text-[var(--danger)]"
                        title="Cancel download"
                      >
                        <StopCircle className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveLogItem(item)}
                      className="btn-icon h-8 w-8 flex items-center justify-center"
                      title="View execution logs"
                    >
                      <Terminal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Target URL */}
                <div className="text-xs font-mono text-[var(--text-muted)] truncate flex items-center gap-2">
                  <span className="font-semibold">Target:</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text-primary)] hover:underline truncate"
                  >
                    {item.url}
                  </a>
                </div>

                {/* Progress Bar (if Downloading or Queued or Completed) */}
                {(isRunning || isQueued || item.status === 'Completed') && (
                  <div className="space-y-2">
                    <div className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] h-2.5 rounded-[var(--radius-full)] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${
                          item.status === 'Completed'
                            ? 'bg-[var(--success)]'
                            : 'bg-[var(--primary)]'
                        }`}
                        style={{
                          width: `${item.status === 'Completed' ? 100 : item.progressPercentage || 0}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                      <span className="font-bold text-[var(--text-primary)]">
                        {item.status === 'Completed'
                          ? '100%'
                          : `${(item.progressPercentage || 0).toFixed(1)}%`}
                      </span>

                      {isRunning && (
                        <div className="flex items-center gap-4">
                          {item.downloadSpeed && (
                            <span className="text-[var(--text-primary)] font-bold">
                              {item.downloadSpeed}
                            </span>
                          )}
                          {item.eta && <span>ETA: {item.eta}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Box if Failed */}
                {item.status === 'Failed' && item.error && (
                  <div className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--danger-subtle)] border border-red-200 text-xs text-[var(--danger)] font-mono">
                    <span className="font-bold">Error:</span> {item.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Terminal Logs Modal */}
      {activeLogItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-3xl w-full p-7 space-y-5 shadow-2xl bg-[#0a0a0a] text-[#f4f4f5] border-[#27272a]">
            <div className="flex items-start justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-5 w-5 text-white" />
                <h3 className="font-mono text-sm font-bold truncate max-w-lg text-white">
                  Process Log: {activeLogItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLogItem(null)}
                className="p-1.5 rounded text-[#a1a1aa] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-80 overflow-y-auto bg-[#000000] border border-[#27272a] rounded-[var(--radius-md)] p-4 font-mono text-xs leading-relaxed text-[#d4d4d8] space-y-1.5 scrollbar-thin">
              {activeLogItem.logs && activeLogItem.logs.length > 0 ? (
                activeLogItem.logs.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap font-mono">
                    {line}
                  </div>
                ))
              ) : (
                <div className="text-[#71717a] italic">No console logs captured for this task.</div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setActiveLogItem(null)}
                className="btn text-sm h-9 px-5 bg-[#27272a] text-white hover:bg-[#3f3f46]"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
