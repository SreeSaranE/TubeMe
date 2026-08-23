import React, { useState } from 'react';
import { Download, Check, AlertCircle, X, Clock, Terminal, Trash2, StopCircle } from 'lucide-react';
import { DownloadItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Downloading':
        return (
          <Badge variant="default" className="gap-1.5 font-mono text-xs uppercase animate-pulse px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-background animate-ping" /> Downloading
          </Badge>
        );
      case 'Queued':
        return (
          <Badge variant="secondary" className="gap-1.5 font-mono text-xs uppercase px-3 py-1">
            <Clock className="h-3.5 w-3.5" /> Queued
          </Badge>
        );
      case 'Completed':
        return (
          <Badge variant="outline" className="gap-1.5 font-mono text-xs uppercase border-foreground/40 px-3 py-1">
            <Check className="h-3.5 w-3.5" /> Completed
          </Badge>
        );
      case 'Failed':
        return (
          <Badge variant="secondary" className="gap-1.5 font-mono text-xs uppercase bg-foreground/15 text-foreground px-3 py-1">
            <AlertCircle className="h-3.5 w-3.5" /> Failed
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge variant="outline" className="gap-1.5 font-mono text-xs uppercase opacity-60 px-3 py-1">
            <X className="h-3.5 w-3.5" /> Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Downloads Queue
            </h2>
            <Badge variant="secondary" className="text-xs font-mono px-3 py-1">
              {downloads.filter((d) => d.status === 'Downloading' || d.status === 'Queued').length} active
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Real-time download progress, fragment streams, speed metrics, and process execution logs.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Filter Pills */}
          <div className="flex items-center bg-secondary/70 p-1.5 rounded-2xl border border-border text-xs font-medium">
            {(['all', 'active', 'completed', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm capitalize transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-foreground text-background shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="default"
            onClick={() => onClearHistory()}
            className="h-11 px-4 text-xs sm:text-sm shrink-0"
            title="Clear completed tasks"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Downloads List */}
      {filteredDownloads.length === 0 ? (
        <div className="text-center py-28 rounded-3xl border border-dashed border-border bg-card/40">
          <div className="h-16 w-16 rounded-2xl bg-secondary text-foreground flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Download className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">No active download tasks</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1.5">
            Tasks launched from channel syncs or direct search will show progress in real-time here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDownloads.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs hover:border-foreground/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="outline" className="font-mono text-[10px] py-0 px-2 uppercase">
                      {item.type}
                    </Badge>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground truncate" title={item.title}>
                      {item.title || item.url}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground truncate">{item.url}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(item.status)}

                  {(item.status === 'Downloading' || item.status === 'Queued') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelDownload(item.id)}
                      className="h-9 px-3.5 text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <StopCircle className="h-3.5 w-3.5" />
                      <span>Cancel</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveLogItem(item)}
                    className="h-9 px-3.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Logs</span>
                  </Button>
                </div>
              </div>

              {/* Progress bar and details container */}
              {item.status === 'Downloading' && (
                <div className="space-y-2 p-3.5 rounded-xl bg-secondary/50 border border-border/80">
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span className="text-foreground font-semibold">{item.progressPercentage ? `${item.progressPercentage.toFixed(1)}%` : '0%'}</span>
                    <div className="flex gap-4">
                      {item.downloadSpeed && <span>Speed: {item.downloadSpeed}</span>}
                      {item.eta && <span>ETA: {item.eta}</span>}
                    </div>
                  </div>
                  <Progress value={item.progressPercentage || 0} />
                </div>
              )}

              {/* Error message */}
              {item.error && (
                <div className="p-3.5 rounded-xl bg-secondary border border-border text-xs font-mono text-foreground">
                  <strong>Error:</strong> {item.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Terminal Log Modal */}
      {activeLogItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-3xl border border-border bg-card p-6 sm:p-7 space-y-4 flex flex-col max-h-[85vh] shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="min-w-0 flex-1 pr-3">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground truncate">
                  <Terminal className="h-4 w-4 shrink-0" />
                  <span className="truncate">{activeLogItem.title}</span>
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveLogItem(null)} className="h-9 px-4">
                Close
              </Button>
            </div>

            <div className="flex-1 bg-secondary/80 rounded-2xl p-4 sm:p-5 font-mono text-xs text-foreground overflow-y-auto space-y-1.5 border border-border select-text">
              {activeLogItem.logs && activeLogItem.logs.length > 0 ? (
                activeLogItem.logs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed opacity-90">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground italic">No process logs captured yet...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
