import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getEffectiveAccess } from '@/lib/ownerConfig';
import { FolderKanban, HardDrive, ScrollText, ArrowRight, Layers, BookOpen, Brain, Mic, Terminal, DollarSign, Zap, ShieldCheck, Globe, X } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import BackendStatusBanner from '@/components/BackendStatusBanner';
import BackendStatusCard from '@/components/BackendStatusCard';
import { checkBackendHealth } from '@/lib/api';

function StatCard({ label, value, icon: Icon, color, to }) {
  return (
    <Link to={to} className="card-glass rounded-2xl p-5 flex items-center gap-4 hover:border-primary/40 transition-colors duration-200 cursor-pointer group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors duration-150" />
    </Link>
  );
}

const QUICK_ACTIONS = [
  { label: 'Projects',      to: '/projects',            icon: FolderKanban },
  { label: 'Bible Engine',  to: '/bible',               icon: BookOpen },
  { label: 'Memory Vault',  to: '/tools/memory-vault',  icon: Brain },
  { label: 'Voice Lab',     to: '/tools/voice-lab',     icon: Mic },
  { label: 'App Ecosystem', to: '/ecosystem',           icon: Layers },
  { label: 'Live Console',  to: '/admin/live-console',  icon: Terminal },
  { label: 'Cost Manager',  to: '/admin/cost-manager',  icon: DollarSign },
  { label: 'Admin',         to: '/admin',               icon: ShieldCheck },
  { label: 'Live Sandbox',  to: '/sandbox',             icon: Zap },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, uploads: 0, logs: 0, apps: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [ecosystemProjects, setEcosystemProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [showLiveBanner, setShowLiveBanner] = useState(() => !sessionStorage.getItem('live_banner_dismissed'));
  const [backendHealth, setBackendHealth] = useState(null);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me().catch(() => null);
      setUser(u);
      const acc = getEffectiveAccess(u);
      setAccess(acc);

      const [projects, uploads, logs, allProjects] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Upload.list(),
        base44.entities.BuildLog.list('-created_date', 5),
        base44.entities.Project.filter({ slug: { $exists: true } }, '-created_date', 6),
      ]);
      const appProjects = allProjects.filter(p => p.slug);
      setStats({ projects: projects.length, uploads: uploads.length, logs: logs.length, apps: appProjects.length });
      setEcosystemProjects(appProjects.slice(0, 3));
      setRecentLogs(logs);
      setLoading(false);
    }
    load();
    // Health check on dashboard load
    checkBackendHealth().then(setBackendHealth).catch(() => setBackendHealth({ status: 'offline' }));
  }, []);

  return (
    <div className="p-4 lg:p-8 animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text tracking-tight">Command Center</h1>
        <p className="text-muted-foreground mt-1 text-sm">TerrellOS v4.0 — <span className="text-emerald-400 font-mono text-xs">● LIVE</span> · app.tm-dezigns.org</p>
        {access?.isSuperAdmin && (
          <div className="flex flex-wrap gap-2 mt-3">
            {['SUPER ADMIN', 'ELITE', 'ALL ENABLED', 'LIVE'].map((b, i) => (
              <span key={b} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                i === 0 ? 'bg-primary/15 text-primary border-primary/25' :
                i === 1 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                i === 2 ? 'bg-accent/15 text-accent border-accent/25' :
                'bg-secondary text-muted-foreground border-border'
              }`}>{b}</span>
            ))}
          </div>
        )}
      </div>

      {/* 🎉 Production Live Banner */}
      {showLiveBanner && (
        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-300">🚀 You're LIVE in Production!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              <a href="https://app.tm-dezigns.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300">app.tm-dezigns.org</a>
              {' '}· SSL ✅ · DNS ✅ · GitHub → Vercel ✅
            </p>
          </div>
          <button
            onClick={() => { setShowLiveBanner(false); sessionStorage.setItem('live_banner_dismissed', '1'); }}
            className="text-emerald-400/50 hover:text-emerald-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <BackendStatusBanner />

      {/* Backend Connection Card — live status */}
      <div className="mb-5">
        <BackendStatusCard />
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="card-glass rounded-2xl p-5 h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Projects"   value={stats.projects} icon={FolderKanban} color="bg-primary/80"     to="/projects" />
          <StatCard label="Uploads"    value={stats.uploads}  icon={HardDrive}    color="bg-accent/80"      to="/upload-vault" />
          <StatCard label="Build Logs" value={stats.logs}     icon={ScrollText}   color="bg-purple-500/80"  to="/live-logs" />
          <StatCard label="Apps"       value={stats.apps}     icon={Layers}       color="bg-emerald-600/80" to="/ecosystem" />
        </div>
      )}

      {/* Quick actions */}
      <div className="card-glass rounded-2xl p-5 mb-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to}
              className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-secondary/40 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all duration-150 cursor-pointer">
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* App Ecosystem Preview — real DB records */}
      <div className="card-glass rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">App Ecosystem</h2>
          <Link to="/ecosystem" className="text-xs text-primary hover:underline flex items-center gap-1">
            <Zap className="w-3 h-3" /> Manage
          </Link>
        </div>
        {ecosystemProjects.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No apps seeded yet — <Link to="/ecosystem" className="text-primary hover:underline">Import Real Apps</Link> in the Ecosystem.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ecosystemProjects.map(app => (
              <Link key={app.id} to={`/project/${app.id}`} className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-colors">
                <span className="text-xl">{app.emoji || '📦'}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{app.name}</div>
                  <div className={`text-[9px] font-mono ${app.status === 'active' ? 'text-emerald-400' : 'text-yellow-400'}`}>{(app.status || 'building').toUpperCase()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent build logs */}
      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Recent Build Activity</h2>
          <Link to="/live-logs" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No build activity yet. Use the AI Builder to create your first build.</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors duration-150">
                <StatusBadge status={log.status} />
                <span className="text-sm font-medium text-foreground flex-1 truncate">{(log.command_type || '').replace(/_/g, ' ')}</span>
                {log.project_name && <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[120px]">{log.project_name}</span>}
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}