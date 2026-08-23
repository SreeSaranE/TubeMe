import React, { useState, useEffect } from 'react';
import { Folder, FileVideo, HardDrive, ArrowLeft, RefreshCw, Film } from 'lucide-react';
import { FileInfoItem } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function LibraryTab() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileInfoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFiles = async (path = '') => {
    setIsLoading(true);
    try {
      const data = await api.getFiles(path);
      setFiles(data || []);
      setCurrentPath(path);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles('');
  }, []);

  const navigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    loadFiles(parts.join('/'));
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Media File Library
            </h2>
            <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
              {files.filter((f) => !f.isDirectory).length} videos
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse downloaded media files in storage (subtitles and raw metadata excluded).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentPath && (
            <Button variant="outline" size="default" onClick={navigateUp} className="h-11 px-5 text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          <Button variant="outline" size="default" onClick={() => loadFiles(currentPath)} className="h-11 px-5 text-sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Path Breadcrumb (Gray Container Layer) */}
      <div className="px-5 py-3.5 bg-secondary/60 rounded-2xl border border-border text-xs sm:text-sm text-muted-foreground flex items-center gap-3 font-mono">
        <Folder className="h-4 w-4 text-foreground shrink-0" />
        <span>/downloads</span>
        {currentPath && <span className="text-foreground font-semibold">/ {currentPath}</span>}
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="text-center py-28">
          <div className="inline-block h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-28 rounded-3xl border border-dashed border-border bg-card/40">
          <div className="h-16 w-16 rounded-2xl bg-secondary text-foreground flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Film className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">No media files found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1.5">
            Downloaded video and audio files will be organized and browsable here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="divide-y divide-border/70">
            {files.map((item, i) => (
              <div
                key={i}
                onClick={() => item.isDirectory && loadFiles(item.path)}
                className={`p-5 sm:p-6 flex items-center justify-between transition-colors select-none ${
                  item.isDirectory ? 'cursor-pointer hover:bg-secondary/60' : 'hover:bg-secondary/30'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                  {item.isDirectory ? (
                    <div className="p-3 rounded-2xl bg-secondary text-foreground shrink-0">
                      <Folder className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-secondary text-muted-foreground shrink-0">
                      <FileVideo className="h-5 w-5" />
                    </div>
                  )}
                  <span className={`text-sm sm:text-base truncate ${item.isDirectory ? 'font-semibold text-foreground' : 'text-foreground font-mono'}`}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-xs sm:text-sm text-muted-foreground shrink-0 font-mono">
                  {!item.isDirectory && <Badge variant="secondary" className="text-xs px-3 py-1">{formatBytes(item.size)}</Badge>}
                  <span className="hidden sm:inline">{new Date(item.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
