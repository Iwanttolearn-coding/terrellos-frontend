import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, Activity, Menu, X, Zap,
  Crown, Shield, Terminal, User, HelpCircle, CreditCard,
  Wrench, Server, Code, Database, Rocket, BarChart2,
  Users, Package, ChevronRight
} from 'lucide-react';
import MobileInstallBanner from '@/components/MobileInstallBanner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import BackendStatusBar from '@/components/BackendStatusBar';

// ── Navigation — TerrellOS ONLY. No AAC, Pastor AI, or Eternal Echo links. ──
const MAIN_NAV = [
  { path: '/terrellos/welcome',      label: 'Home',              icon: LayoutDashboard },
  { path: '/terrellos/tools',        label: 'Tool Library',      icon: Wrench },
  { path: '/terrellos/dashboard',    label: 'Dashboard',         icon: BarChart2 },
  { path: '/projects',              label: 'Projects',          icon: Package },
  { path: '/tools/ai-tools-studio', label: 'AI Studio',         icon: Zap },
  { path: '/tools/chat-engine',     label: 'AI Chat',           icon: Zap },
  { path: '/tools/voice-lab',       label: 'Voice Lab',         icon: Activity },
  { path: '/upload-vault',          label: 'Upload Vault',      icon: Database },
  { path: '/account',              label: 'Account',           icon: User },
  { path: '/billing',              label: 'Billing',           icon: CreditCard },
  { path: '/settings',             label: 'Settings',          icon: Settings },
  { path: '/help',                 label: 'Help',              icon: HelpCircle },
];

const ADMIN_NAV = [
  { path: '/terrellos/founder',       label: 'Founder Command',   icon: Crown },
  { path: '/terrellos/users',         label: 'Manage Users',      icon: Users },
  { path: '/terrellos/subscriptions', label: 'Subscriptions',     icon: CreditCard },
  { path: '/terrellos/deployments',   label: 'Deployments',       icon: Rocket },
  { path: '/terrellos/system-status', label: 'System Status',     icon: Activity },
  { path: '/terrellos/settings',      label: 'TerrellOS Settings', icon: Settings },
  { path: '/admin',                   label: 'Admin Panel',        icon: Shield },
  { path: '/admin/live-console',      label: 'Live Console',       icon: Terminal },
  { path: '/backend-status',          label: 'Backend Status',     icon: Server },
  { path: '/system-logs',             label: 'System Logs',        icon: Terminal },
];

export default function Layout() {
  const { user } = useAuth();
  const access = resolveUserAccess(user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
        isActive(item.path)
          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      )}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative z-30 h-full flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-200",
        sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"
      )}>
        {/* Brand header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center text-sm shadow-lg shadow-purple-500/30">
            ⚡
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white">TerrellOS</p>
            <p className="text-xs text-gray-500 truncate">app.tm-dezigns.com</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Founder badge */}
        {access.isFounder && (
          <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
            <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-300 truncate">FOUNDER</span>
          </div>
        )}

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {MAIN_NAV.map(item => <NavLink key={item.path + item.label} item={item} />)}

          {/* Admin section */}
          {access.canViewAdmin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Admin</p>
              </div>
              {ADMIN_NAV.map(item => <NavLink key={item.path + item.label} item={item} />)}
            </>
          )}
        </nav>

        {/* Bottom: backend status + user */}
        <div className="p-3 border-t border-gray-800 space-y-2">
          <BackendStatusBar compact />
          {user && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0">
                {(user.email || 'U')[0].toUpperCase()}
              </div>
              <p className="text-xs text-gray-400 truncate flex-1">{user.email}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — mobile only */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-black text-white">TerrellOS</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <MobileInstallBanner />
    </div>
  );
}
