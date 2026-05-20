import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Cpu,
  HardDrive, ScrollText, Settings, ShieldCheck, Activity,
  Menu, X, Zap, ChevronRight, Wrench, Search, BookOpen, Layers, Terminal, DollarSign, User, Database, GitBranch, Rocket, Plug, Brain, Heart
} from 'lucide-react';
import MobileInstallBanner from '@/components/MobileInstallBanner';
import { cn } from '@/lib/utils';
import CommandBar from '@/components/CommandBar';
import NotificationCenter from '@/components/NotificationCenter';
import { APP_VERSION } from '@/lib/env';
import { useAuth } from '@/lib/AuthContext';
import TopBarIdentity from '@/components/TopBarIdentity';
import EnvBadge from '@/components/EnvBadge';
import BackendStatusBar from '@/components/BackendStatusBar';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tools', label: 'Tools', icon: Wrench },
  { path: '/analytics', label: 'Analytics', icon: Activity },
  { path: '/live-logs', label: 'Live Logs', icon: ScrollText },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/upload-vault', label: 'Uploads', icon: HardDrive },
  { path: '/backend-manifest', label: 'Backend', icon: Cpu },

  { path: '/account', label: 'Account', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/bible',             label: 'Bible Engine',   icon: BookOpen },
  { path: '/ecosystem',         label: 'App Ecosystem',  icon: Layers },
  { path: '/admin/live-console',label: 'Live Console',   icon: Terminal },
  { path: '/admin/cost-manager',label: 'Cost Manager',   icon: DollarSign },
  { path: '/admin/engine',      label: 'Engine Status',  icon: Cpu },
  { path: '/workflow-builder',  label: 'Workflow Builder', icon: GitBranch },
  { path: '/deployments',          label: 'Deploy Center', icon: Rocket },
  { path: '/system-status',        label: 'System Status', icon: Activity },
  { path: '/integrations',      label: 'Integrations',   icon: Plug },
  { path: '/ai-models',         label: 'AI Models',      icon: Brain },
  { path: '/founder',           label: 'Founder Center', icon: ShieldCheck },
  { path: '/backend-status',    label: 'Backend Status', icon: Activity },
  { path: '/system-logs',       label: 'System Logs',    icon: ScrollText },
  { path: '/help',              label: 'Help',           icon: BookOpen },
  { path: '/eternal-echo',       label: 'Eternal Echo',   icon: Heart },
  { path: '/admin',             label: 'Admin',          icon: ShieldCheck },
];

export default function Layout() {
  const { access } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <NotificationCenter />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300",
        "bg-sidebar border-r border-sidebar-border",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg gradient-purple-blue flex items-center justify-center glow-purple">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground tracking-tight">TerrellOS</div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">AI Builder</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-dark">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-primary/15 text-primary glow-purple"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 text-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border space-y-0.5">
          <div className="text-[10px] text-muted-foreground font-mono">Powered by TM Designz™</div>
          <div className="text-[10px] text-muted-foreground font-mono">TERRELL MILLS · FOUNDER</div>
          <div className="text-[10px] text-muted-foreground/50 font-mono">vv9 · PRODUCTION</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 lg:px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Cmd+K trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/40 hover:bg-secondary/80 transition-colors text-sm text-muted-foreground group"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Search…</span>
            <kbd className="hidden sm:inline text-[10px] font-mono bg-background/60 px-1 py-0.5 rounded border border-border">⌘K</kbd>
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <EnvBadge className="hidden sm:inline-flex" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-xs text-muted-foreground font-mono">LIVE</span>
              <span className="text-[10px] font-mono text-muted-foreground/50">vv9</span>
            </div>
            <TopBarIdentity />
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto scrollbar-dark">
          <Outlet />
        </main>
      </div>
      <MobileInstallBanner />
      <BackendStatusBar />
    </div>
  );
}