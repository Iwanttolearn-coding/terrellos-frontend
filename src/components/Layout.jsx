import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Activity, Menu, X, Zap,
  ChevronRight, Wrench, Image, Scissors, Upload, Printer,
  Palette, LayoutGrid, Crown, Shield, Terminal, User,
  HelpCircle, CreditCard, Heart
} from 'lucide-react';
import MobileInstallBanner from '@/components/MobileInstallBanner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import BackendStatusBar from '@/components/BackendStatusBar';

// ── Navigation — TM Dezigns AI Designer ONLY. No cross-brand links. ────────
const MAIN_NAV = [
  { path: '/',                       label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/tools/ai-tools-studio',  label: 'Generate Image',  icon: Image },
  { path: '/tools/tattoo-studio',    label: 'Tattoo Studio',   icon: Scissors },
  { path: '/tools/creator-vault',    label: 'My Gallery',      icon: LayoutGrid },
  { path: '/tools/creator-vault',    label: 'Upload Design',   icon: Upload },
  { path: '/tools/print-readiness',  label: 'Print Readiness', icon: Printer },
  { path: '/tools/style-advisor',    label: 'Style Advisor',   icon: Palette },
  { path: '/tools/chat-engine',      label: 'AI Assistant',    icon: Zap },
  { path: '/tools/voice-lab',        label: 'Voice Lab',       icon: Activity },
  { path: '/projects',               label: 'Projects',        icon: LayoutGrid },
  { path: '/account',                label: 'Account',         icon: User },
  { path: '/billing',                label: 'Billing',         icon: CreditCard },
  { path: '/settings',               label: 'Settings',        icon: Settings },
  { path: '/help',                   label: 'Help',            icon: HelpCircle },
];

const ADMIN_NAV = [
  { path: '/founder',               label: 'Founder Center',  icon: Crown },
  { path: '/admin',                 label: 'Admin Panel',     icon: Shield },
  { path: '/admin/live-console',    label: 'Live Console',    icon: Terminal },
  { path: '/backend-status',        label: 'Backend Status',  icon: Activity },
  { path: '/system-logs',           label: 'System Logs',     icon: Terminal },
];

export default function Layout() {
  const { user } = useAuth();
  const access = resolveUserAccess(user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 z-30 w-60 flex flex-col transition-transform duration-300",
        "bg-gray-900 border-r border-gray-800",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-white truncate">TM Dezigns</div>
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">AI Designer</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-3 space-y-0.5">
            {MAIN_NAV.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link key={path + label} to={path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  )}>
                  <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-violet-400" : "text-gray-500")} />
                  <span className="flex-1 truncate">{label}</span>
                  {active && <ChevronRight className="w-3 h-3 text-violet-400" />}
                </Link>
              );
            })}
          </div>

          {/* Founder/Admin nav — only shown to founders/admins */}
          {access.canViewAdmin && (
            <div className="mt-4 pt-3 border-t border-gray-800 px-3 space-y-0.5">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider px-3 pb-1">
                {access.founder ? '👑 Founder' : 'Admin'}
              </p>
              {ADMIN_NAV.map(({ path, label, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <Link key={path} to={path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    )}>
                    <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-amber-400" : "text-gray-600")} />
                    <span className="flex-1 truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800">
          {access.founder ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Crown className="w-3 h-3 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-300 truncate">{access.displayName}</p>
                <p className="text-[10px] text-amber-500/60">Founder · Super Admin</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] text-gray-600 font-mono">TM Dezigns AI Designer</p>
              <p className="text-[10px] text-gray-700 font-mono">Powered by TerrellOS AI</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <BackendStatusBar />
          <div className="ml-auto flex items-center gap-2">
            {access.founder && (
              <Link to="/founder"
                className="hidden sm:flex items-center gap-1.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-all">
                <Crown className="w-3 h-3" /> Founder
              </Link>
            )}
            <Link to="/account"
              className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 hover:border-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <User className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <MobileInstallBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
