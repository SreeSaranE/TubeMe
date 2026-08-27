import React, { useState, useEffect } from 'react';
import { Folder, FileVideo, HardDrive, ArrowLeft, RefreshCw, Film, Music, File } from 'lucide-react';
import { FileInfoItem } from '@/types';
import { api } from '@/services/api';
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
      console.error('Failed to load files:', err);
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

  const totalMediaFiles = files.filter((f) => !f.isDirectory).length;

  return (
    <div className="space-y-8">
      {/* 1. Clean, Spacious Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-3.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Media Library
          </h1>
          <span className="counter-badge text-xs px-2.5 py-0.5">
            {totalMediaFiles}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {currentPath && (
            <button
              type="button"
              onClick={navigateUp}
              className="btn btn-secondary text-sm h-11 px-4 font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </button>
          )}
          <button
            type="button"
            onClick={() => loadFiles(currentPath)}
            disabled={isLoading}
            className="btn btn-secondary text-sm h-11 px-4 font-semibold"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Path Breadcrumb */}
      <div className="px-5 py-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border)] text-sm font-mono text-[var(--text-secondary)] flex items-center gap-3">
        <Folder className="h-4.5 w-4.5 text-[var(--text-primary)] shrink-0" />
        <span>/downloads</span>
        {currentPath && <span className="text-[var(--text-primary)] font-bold">/ {currentPath}</span>}
      </div>

      {/* 3. Files List */}
      {isLoading ? (
        <div className="placeholder-view">
          <div className="placeholder-box">
            <div className="placeholder-icon animate-pulse">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
            <h2>Scanning Storage Directory...</h2>
            <p>Indexing files on the local filesystem.</p>
          </div>
        </div>
      ) : files.length === 0 ? (
        <div className="placeholder-view">
          <div className="placeholder-box">
            <div className="placeholder-icon">
              <Film className="h-8 w-8" />
            </div>
            <h2>No Media Files Found</h2>
            <p>Downloaded video and audio media files will automatically appear here once finished.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => {
            const isDir = file.isDirectory;
            const isAudio = /\.(mp3|m4a|aac|flac|wav)$/i.test(file.name);
            const isVideo = /\.(mp4|mkv|webm|mov|avi)$/i.test(file.name);

            return (
              <div
                key={file.path}
                onClick={() => {
                  if (isDir) {
                    loadFiles(currentPath ? `${currentPath}/${file.name}` : file.name);
                  }
                }}
                className={`task-card flex items-center justify-between gap-4 p-5 ${
                  isDir ? 'cursor-pointer hover:border-[var(--border-strong)]' : ''
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
                    {isDir ? (
                      <Folder className="h-5 w-5 text-[var(--text-primary)]" />
                    ) : isAudio ? (
                      <Music className="h-5 w-5 text-emerald-600" />
                    ) : isVideo ? (
                      <FileVideo className="h-5 w-5 text-[var(--text-primary)]" />
                    ) : (
                      <File className="h-5 w-5 text-[var(--text-muted)]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-[var(--text-primary)] truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] mt-1">
                      <span className="font-semibold">{isDir ? 'Folder' : formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>{formatDate(file.lastModified)}</span>
                    </div>
                  </div>
                </div>

                <span className="type-pill text-xs font-mono font-bold shrink-0">
                  {isDir ? 'DIR' : isAudio ? 'AUDIO' : isVideo ? 'VIDEO' : 'FILE'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
