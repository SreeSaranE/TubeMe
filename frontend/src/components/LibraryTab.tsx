import React, { useState, useEffect } from 'react';
import { Folder, FileVideo, HardDrive, ArrowLeft, RefreshCw, Film } from 'lucide-react';
import { FileInfoItem } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

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
    <div className="space-y-10">
      {/* Editorial Library Header Card */}
      <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-8 sm:p-10 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground bg-secondary/80 px-3 py-1 rounded-full border border-border/60">
              Storage & Offline Archive
            </span>
            <span className="text-[11px] font-mono text-muted-foreground/80">
              {files.filter((f) => !f.isDirectory).length} Files Available
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.15]">
            Media Library
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed">
            Browse and inspect downloaded video & audio streams stored in your local storage directory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentPath && (
            <Button variant="outline" size="default" onClick={navigateUp} className="h-11 px-5 text-sm rounded-2xl bg-secondary/50 hover:bg-secondary border-border/80">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          <Button variant="outline" size="default" onClick={() => loadFiles(currentPath)} className="h-11 px-5 text-sm rounded-2xl bg-secondary/50 hover:bg-secondary border-border/80">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Path Breadcrumb (Frosted Layer) */}
      <div className="px-5 py-3.5 bg-secondary/60 backdrop-blur-md rounded-2xl border border-border/80 text-xs sm:text-sm text-muted-foreground flex items-center gap-3 font-mono shadow-xs">
        <Folder className="h-4 w-4 text-foreground shrink-0" />
        <span>/downloads</span>
        {currentPath && <span className="text-foreground font-semibold">/ {currentPath}</span>}
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="text-center py-32">
          <div className="inline-block h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-32 rounded-3xl border border-dashed border-border/80 bg-card/40 backdrop-blur-sm">
          <div className="h-16 w-16 rounded-2xl bg-secondary/80 text-foreground flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Film className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">No media files found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
            Downloaded video and audio media files will automatically be indexed and browsable here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border/60">
            {files.map((item, i) => (
              <div
                key={i}
                onClick={() => item.isDirectory && loadFiles(item.path)}
                className={`p-5 sm:p-6 flex items-center justify-between transition-all duration-200 select-none ${
                  item.isDirectory ? 'cursor-pointer hover:bg-secondary/70' : 'hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
                  {item.isDirectory ? (
                    <div className="p-3 rounded-2xl bg-secondary text-foreground shrink-0 shadow-xs">
                      <Folder className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-secondary/80 text-muted-foreground shrink-0 shadow-xs">
                      <FileVideo className="h-5 w-5" />
                    </div>
                  )}
                  <span className={`text-sm sm:text-base truncate ${item.isDirectory ? 'font-semibold text-foreground' : 'text-foreground font-mono'}`}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-xs sm:text-sm text-muted-foreground shrink-0 font-mono">
                  {!item.isDirectory && <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full bg-secondary/80">{formatBytes(item.size)}</Badge>}
                  <span className="hidden sm:inline opacity-80">{formatDate(item.lastModified)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
