import React, { createContext, useContext, useState, useEffect } from 'react';
import { PanelLeft, X } from 'lucide-react';

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [openMobile, setOpenMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (isMobile) {
          setOpenMobile((prev) => !prev);
        } else {
          setOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        toggleSidebar,
        isMobile,
        openMobile,
        setOpenMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarTrigger({ className = '' }: { className?: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={`btn-icon h-10 w-10 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] ${className}`}
      title="Toggle Sidebar (Ctrl+B)"
    >
      <PanelLeft className="h-4.5 w-4.5 text-[var(--text-secondary)]" />
    </button>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { open, isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    if (!openMobile) return null;
    return (
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setOpenMobile(false)}
        />
        <aside className="relative z-50 w-72 max-w-xs bg-[var(--bg-surface)] border-r border-[var(--border)] h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <span className="font-bold text-base text-[var(--text-primary)]">Navigation</span>
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              className="btn-icon"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </aside>
      </div>
    );
  }

  return (
    <aside
      className={`sticky top-[56px] h-[calc(100vh-56px)] bg-[var(--bg-surface)] border-r border-[var(--border)] transition-all duration-200 flex flex-col shrink-0 z-30 ${
        open ? 'w-64' : 'w-20'
      }`}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-b border-[var(--border)]">{children}</div>;
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">{children}</div>;
}

export function SidebarGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

export function SidebarGroupLabel({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  if (!open && !isMobile) return null;
  return (
    <div className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
      {children}
    </div>
  );
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2 list-none p-0 m-0">{children}</ul>;
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <li className="list-none p-0 m-0">{children}</li>;
}

export function SidebarMenuButton({
  children,
  isActive = false,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const { open, isMobile } = useSidebar();
  const isCompact = !open && !isMobile;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-[var(--radius-md)] text-sm font-bold transition-all duration-150 cursor-pointer ${
        isCompact ? 'justify-center px-0 py-3.5' : ''
      } ${
        isActive
          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-sm)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function SidebarMenuBadge({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  if (!open && !isMobile) return null;
  return (
    <span className="ml-auto font-mono text-xs font-bold px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border)]">
      {children}
    </span>
  );
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="p-4 border-t border-[var(--border)] mt-auto">{children}</div>;
}
