import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Tv,
  Search,
  Download,
  Folder,
  Settings,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
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
  const { open, isMobile, setOpenMobile } = useSidebar();
  const isCompact = !open && !isMobile;

  const isLinkActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
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
      label: 'Channels',
      icon: Tv,
      badge: channelsCount > 0 ? channelsCount : undefined,
    },
    {
      path: '/search',
      label: 'Search & Download',
      icon: Search,
    },
    {
      path: '/downloads',
      label: 'Queue',
      icon: Download,
      badge: activeDownloadsCount > 0 ? activeDownloadsCount : undefined,
    },
    {
      path: '/library',
      label: 'Library',
      icon: Folder,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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

      <SidebarFooter>
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--success)] shrink-0" />
          {!isCompact && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                Engine v2.4
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                Port 5000 • Online
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
