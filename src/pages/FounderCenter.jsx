/**
 * FounderCenter.jsx — TerrellOS Founder Command Center
 * Full system visibility: health, modules, ecosystem, CORS.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { healthCheck } from '@/lib/terrellOS';
import {
  Crown, RefreshCw, CheckCircle, XCircle, Globe, Terminal,
  Shield, Cpu, Zap, Settings, Activity, BarChart3,
  Wrench, BookOpen, Layers, DollarSign, GitBranch, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BACKEND = 'https://terrellos-backend.fly.dev';

const FOUNDER_TOOLS = [
  { label: 'System Diagnostics',   to: '/system-status',              icon: Activity },
  { label: 'Super Admin',           to: '/super-admin',                icon: Shield },
  { label: 'Live Console',          to: '/admin/live-console',         icon: Terminal },
  { label: 'Manage AI Tools',       to: '/tools/manage-ai-tools',      icon: Wrench },
  { label: 'Cost Manager',          to: '/admin/cost-manager',         icon: DollarSign },
  { label: 'Deployment Center',     to: '/founder/deployment-center',  icon: Rocket },
  { label: 'Workflow Builder',      to: '/workflow-builder',           icon: GitBranch },
  { label: 'Analytics',             to: '/analytics',                  icon: BarChart3 },
  { label: 'Bible Engine',          to: '/bible',                      icon: BookOpen },
  { label: 'App Ecosystem',         to: '/ecosystem',                  icon: Layers },
  { label: 'Backend Manifest',      to: '/backend-manifest',           icon: Cpu },
  { label: 'Settings',              to: '/settings',                   icon: Settings },
];

const ECOSYSTEM_APPS = [
  { id: 'terrellos',             name: 'TerrellOS',               domain: 'app.tm-dezigns.com',        color: 'from-violet-600 to-purple-800' },
  { id: 'pastor-ai-connect',     name: 'Pastor AI Connect',       domain: 'pastoraiconnect.com',        color: 'from-amber-600 to-orange-800' },
  { id: 'heavenly-eternal-echo', name: 'Heavenly Eternal Echoes', domain: 'heavenlyeternalechoes.com',  color: 'from-blue-600 to-cyan-800' },
  { id: 'all-around-customs',    name: 'All Around Customs',      domain: 'allaroundcustoms.com',       color: 'from-orange-600 to-red-800' },
  { id: 'kindred-love-birds',    name: 'Kindred Love Birds',      domain: 'kindredlovebirds.com',       color: 'from-rose-600 to-pink-800' },
  { id: 'residentsync-ai',       name: 'ResidentSync AI',         domain: 'residentsyncai.com',         color: 'from-green-600 to-emerald-800' },
];

export default function FounderCenter() {
  const { user, access } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const h = await healthCheck();
      setHealth(h);
    } catch {
      setHealth({ status: 'offline', success: false });
    }
    setLastChecked(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => { fetchHealth(); }, []);

  const online = health?.success || health?.status === 'healthy';

  if (!access?.founder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <Shield className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-bold text-foreground">Founder Access Required</p>
        <p className="text-sm text-muted-foreground text-center">This area is restricted to <strong>millzterrell5@gmail.com</strong> and <strong>millzterrell210@icloud.com</strong></p>
        <Link to="/login" className="text-sm text-primary underline">Sign in as Founder →</Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Founder Command Center</h1>
            <p className="text-xs text-amber-400/70 mt-0.5">TerrellOS v9 · TM Dezigns Ecosystem</p>
          </div>
        </div>
        <button onClick={fetchHealth} disabled={loading}
          className="flex items-center gap-2 bg-card border border-border hover:border-primary/40 rounded-xl px-4 py-2.5 text-sm transition-all">
          <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
          {loading ? 'Checking…' : `Last: ${lastChecked || '—'}`}
        </button>
      </div>

      {/* Backend status card */}
      <div className={cn(
        'rounded-2xl border p-5',
        online ? 'bg-green-950/20 border-green-500/20' : 'bg-red-950/20 border-red-500/20'
      )}>
        <div className="flex items-center gap-3 mb-4">
          {online
            ? <CheckCircle className="w-5 h-5 text-green-400" />
            : <XCircle className="w-5 h-5 text-red-400" />}
          <div>
            <p className={cn('font-bold text-sm', online ? 'text-green-300' : 'text-red-300')}>
              {online ? '🟢 Backend Online' : '🔴 Backend Offline'}
            </p>
            <p className="text-xs text-muted-foreground">{BACKEND}</p>
          </div>
          {health?.version && (
            <span className="ml-auto text-xs bg-card border border-border px-2 py-1 rounded-lg text-muted-foreground">
              v{health.version}
            </span>
          )}
        </div>
        {online && health && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'OpenAI',      ok: health.openai_configured,     val: health.openai_configured    ? 'Configured' : 'Missing key' },
              { label: 'ElevenLabs', ok: health.elevenlabs_configured, val: health.elevenlabs_configured ? 'Configured' : 'Missing key' },
              { label: 'Image Gen',  ok: health.image_generation === 'ready', val: health.image_generation || '—' },
              { label: 'Voice',      ok: health.voice_synthesis === 'ready',  val: health.voice_synthesis  || '—' },
            ].map(({ label, ok, val }) => (
              <div key={label} className="bg-black/20 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={cn('text-sm font-semibold mt-1', ok ? 'text-green-400' : 'text-red-400')}>{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick tool grid */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Founder Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FOUNDER_TOOLS.map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to}
              className="group card-glass rounded-xl p-4 flex items-center gap-3 hover:border-amber-500/30 transition-all">
              <Icon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-xs font-medium text-foreground group-hover:text-amber-300 transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Ecosystem apps */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ecosystem — 1 Backend · 6 Apps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ECOSYSTEM_APPS.map(app => (
            <div key={app.id} className="card-glass rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center flex-shrink-0`}>
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{app.name}</p>
                <a href={`https://${app.domain}`} target="_blank" rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block">
                  {app.domain}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick API links */}
      <div className="card-glass rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Backend Direct Links</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Health',  href: `${BACKEND}/health` },
            { label: 'Docs',    href: `${BACKEND}/docs` },
            { label: 'Status',  href: `${BACKEND}/status` },
            { label: 'Ecosystem', href: `${BACKEND}/v1/ecosystem` },
          ].map(({ label, href }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer"
              className="text-xs bg-card border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg transition-all">
              {label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
