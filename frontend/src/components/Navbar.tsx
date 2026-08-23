import React from 'react';
import { Tv, Search, Download, Folder, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeDownloadsCount: number;
  isConnected: boolean;
}

export function Navbar({ activeTab, setActiveTab, activeDownloadsCount }: NavbarProps) {
  const tabs = [
    { id: 'channels', label: 'Channels', icon: Tv },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'downloads', label: 'Queue', icon: Download, badge: activeDownloadsCount },
    { id: 'library', label: 'Library', icon: Folder },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-5 z-50 w-full flex justify-center px-4 pointer-events-none mb-8 sm:mb-10">
      {/* Floating Island / Pill Navbar */}
      <nav className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 p-2 rounded-full border border-border bg-card/90 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-black/40 transition-all duration-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none ${
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
            </button>
          );
        })}
      </nav>
    </header>
  );
}
