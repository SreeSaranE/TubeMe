import React from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface NavbarProps {
  activeDownloadsCount: number;
}

export function Navbar({ activeDownloadsCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 h-14 bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 flex items-center justify-between">
      {/* 1. Left: Sidebar Trigger & Clean Brand */}
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        <Link to="/" className="flex items-center gap-2.5 select-none hover:opacity-90 transition-opacity">
          <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-xs shadow-xs">
            TM
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              TubeMe
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-mono hidden sm:inline">
              Downloader
            </span>
          </div>
        </Link>
      </div>

      {/* 2. Right: Active Tasks Pill & Engine Ready */}
      <div className="flex items-center gap-2.5">
        {activeDownloadsCount > 0 && (
          <Link
            to="/downloads"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-full)] bg-[var(--primary-subtle)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-semibold"
            title="View active downloads"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-ping" />
            <Download className="h-3 w-3" />
            <span>{activeDownloadsCount}</span>
          </Link>
        )}

        <div className="status-chip connected text-xs px-2.5 py-1">
          <span className="status-dot"></span>
          <span className="hidden sm:inline">Engine Ready</span>
          <span className="sm:hidden">Ready</span>
        </div>
      </div>
    </header>
  );
}
