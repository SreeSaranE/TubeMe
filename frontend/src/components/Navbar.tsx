import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tv, Search, Download, Folder, Settings } from 'lucide-react';

interface NavbarProps {
  activeDownloadsCount: number;
}

export function Navbar({ activeDownloadsCount }: NavbarProps) {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Channels', icon: Tv },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/downloads', label: 'Queue', icon: Download, badge: activeDownloadsCount },
    { path: '/library', label: 'Library', icon: Folder },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-5 z-50 w-full flex justify-center px-4 pointer-events-none mb-8 sm:mb-10">
      {/* Floating Island / Pill Navbar */}
      <nav className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 p-2 rounded-full border border-border bg-card/90 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-black/40 transition-all duration-200">
        {/* TubeMe Brand Logo & Name */}
        <Link
          to="/"
          className="flex items-center gap-2.5 pl-3 pr-2.5 py-1 cursor-pointer select-none group"
          title="TubeMe Homepage"
        >
          <div className="h-7 w-7 rounded-xl bg-foreground text-background flex items-center justify-center p-1.5 shadow-xs transition-transform duration-200 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m14.823 11.708a.325.325 0 0 1 .169.292.314.314 0 0 1 -.12.266l-5.372 2.688a.337.337 0 0 1 -.5-.293v-5.322a.327.327 0 0 1 .168-.292.314.314 0 0 1 .157-.042.462.462 0 0 1 .228.068zm9.177-6.708v14a5.006 5.006 0 0 1 -5 5h-14a5.006 5.006 0 0 1 -5-5v-14a5.006 5.006 0 0 1 5-5h14a5.006 5.006 0 0 1 5 5zm-7.008 7a2.332 2.332 0 0 0 -1.226-2.055l-5.278-2.635a2.337 2.337 0 0 0 -3.5 2.029v5.322a2.313 2.313 0 0 0 1.164 2.021 2.368 2.368 0 0 0 1.186.323 2.2 2.2 0 0 0 1.1-.289l5.376-2.687a2.313 2.313 0 0 0 1.178-2.029z" />
            </svg>
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-foreground">
            TubeMe
          </span>
        </Link>

        {/* Hairline Divider */}
        <div className="h-5 w-[1px] bg-border mx-0.5" />

        {/* Tab Links */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path) || (tab.path === '/downloads' && location.pathname.startsWith('/queue'));

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? 'bg-foreground text-background font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`inline-flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-background text-foreground' : 'bg-foreground text-background'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
