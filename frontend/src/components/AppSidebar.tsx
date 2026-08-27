import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Tv,
  Search,
  Download,
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
    if (path === '/') return location.pathname === '/' || location.pathname === '/watch';
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
      path: '/channels',
      label: 'Channels',
      icon: Tv,
      badge: channelsCount > 0 ? channelsCount : undefined,
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
        <div className="status-chip connected text-xs px-2.5 py-1 w-fit">
          <span className="status-dot"></span>
          {!isCompact ? <span>Engine Ready</span> : null}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
