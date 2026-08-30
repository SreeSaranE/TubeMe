import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Tv,
  Search,
  Download,
  Settings,
  Video,
  History,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  channelsCount: number;
  activeDownloadsCount: number;
}

export function AppSidebar({ channelsCount, activeDownloadsCount }: AppSidebarProps) {
  const location = useLocation();
  const { open, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const isCompact = !open && !isMobile;

  const isLinkActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/watch';
    if (path === '/history') return location.pathname === '/history';
    if (path === '/downloads') {
      return location.pathname === '/downloads' || location.pathname === '/queue';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: Home,
    },
    {
      path: '/history',
      label: 'History',
      icon: History,
    },
    {
      path: '/channels',
      label: 'Channels',
      icon: Tv,
    },
    {
      path: '/search',
      label: 'Search',
      icon: Search,
    },
    {
      path: '/downloads',
      label: 'Queue',
      icon: Download,
      badge: activeDownloadsCount > 0 ? activeDownloadsCount : undefined,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      {/* 1. Header: Fixed height & clicking logo/title toggles the sidebar */}
      <SidebarHeader className={`h-16 flex items-center shrink-0 ${isCompact ? 'justify-center px-0' : 'px-4'}`}>
        <button
          type="button"
          onClick={toggleSidebar}
          className={`flex items-center gap-3 select-none hover:opacity-85 transition-opacity cursor-pointer border-none bg-transparent p-0 ${
            isCompact ? 'justify-center w-full' : 'w-full'
          }`}
          title={open ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
        >
          <div className="h-9 w-9 rounded-[var(--radius-sm)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-medium text-xs shrink-0 shadow-xs">
            <Video className="h-5 w-5 fill-current" />
          </div>
          {!isCompact && (
            <span className="font-semibold text-base tracking-tight text-[var(--text-primary)] truncate">
              TubeMe
            </span>
          )}
        </button>
      </SidebarHeader>

      {/* 2. Navigation Items */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.path);

              return (
                <SidebarMenuItem key={item.path}>
                  <Link to={item.path} onClick={handleNavClick} className="block w-full">
                    <SidebarMenuButton isActive={active}>
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCompact && <span className="truncate">{item.label}</span>}
                      {item.badge !== undefined && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Footer: Centered in minimized mode, aligned left when expanded */}
      <SidebarFooter className={`shrink-0 h-14 flex items-center ${isCompact ? 'justify-center px-0' : 'px-4'}`}>
        {isCompact ? (
          <div className="status-chip connected compact" title="Engine Ready">
            <span className="status-dot"></span>
          </div>
        ) : (
          <div className="status-chip connected text-xs px-2.5 py-1 w-fit">
            <span className="status-dot"></span>
            <span>Engine Ready</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
