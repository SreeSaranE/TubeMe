import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Download } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTheme } from '@/context/ThemeContext';

interface NavbarProps {
  activeDownloadsCount: number;
}

export function Navbar({ activeDownloadsCount }: NavbarProps) {
  const { isDark, toggleTheme } = useTheme();

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

      {/* 2. Right: Active Tasks Pill, Status & Theme Toggle */}
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

        <div className="status-chip connected hidden sm:inline-flex">
          <span className="status-dot"></span>
          <span>Engine Ready</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="btn-icon h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-[var(--text-secondary)]" />
          )}
        </button>
      </div>
    </header>
  );
}
