/**
 * Dashboard.jsx — TerrellOS v9
 * Main landing page. Live backend health. Founder-aware.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { checkBackendHealth } from '@/lib/api';
import {
  Wrench, Brain, Mic, BookOpen, Layers, Terminal,
  ShieldCheck, Zap, Activity, ArrowRight, Globe,
  Cpu, MessageSquare, Image, Crown, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOLS = [
  { label: 'AI Chat',        to: '/tools/chat-engine',    icon: MessageSquare, color: 'from-violet-600 to-purple-800',  desc: 'GPT-4o powered chat' },
  { label: 'Voice Lab',      to: '/tools/voice-lab',      icon: Mic,           color: 'from-pink-600 to-rose-800',     desc: 'ElevenLabs TTS & Whisper' },
  { label: 'Tattoo Studio',  to: '/tools/tattoo-studio',  icon: Image,         color: 'from-orange-600 to-amber-800',  desc: 'AI tattoo generation' },
  { label: 'Memory Vault',   to: '/tools/memory-vault',   icon: Brain,         color: 'from-cyan-600 to-blue-800',     desc: 'Persistent AI memory' },
  { label: 'Bible Engine',   to: '/bible',                icon: BookOpen,      color: 'from-emerald-600 to-green-800', desc: 'Sermons, study, theology' },
  { label: 'AI Tools Studio',to: '/tools/ai-tools-studio',icon: Zap,           color: 'from-fuchsia-600 to-violet-800',desc: 'All Around Customs' },
  { label: 'App Ecosystem',  to: '/ecosystem',            icon: Layers,        color: 'from-sky-600 to-blue-800',      desc: '6 live apps, 1 backend' },
  { label: 'Founder Center', to: '/founder',              icon: Crown,         color: 'from-amber-500 to-orange-700',  desc: 'System control & audit' },
  { label: 'Live Console',   to: '/admin/live-console',   icon: Terminal,      color: 'from-slate-600 to-gray-800',    desc: 'Real-time logs & exec' },
  { label: 'All Tools',      to: '/tools',                icon: Wrench,        color: 'from-indigo-600 to-blue-900',   desc: 'Full tool launcher' },
];

const STAT_COLORS = {
  online:  'text-green-400',
  healthy: 'text-green-400',
  offline: 'text-red-400',
  unknown: 'text-yellow-400',
};

export default function Dashboard() {
  const { user, access, isLoadingAuth } = useAuth();
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const h = await checkBackendHealth();
      setHealth(h);
    } catch {
      setHealth({ status: 'offline', success: false });
    }
    setLastCheck(new Date().toLocaleTimeString());
    setHealthLoading(false);
  };

  useEffect(() => { fetchHealth(); }, []);

  const isOnline  = health?.status === 'healthy' || health?.success;
  const greeting  = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Terrell';

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {access?.founder && (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                👑 Founder
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-foreground">
            {greeting}, {displayName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">TerrellOS v9 · TM Dezigns AI Ecosystem</p>
        </div>

        {/* Backend health pill */}
        <button onClick={fetchHealth} disabled={healthLoading}
          className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 hover:border-primary/40 transition-all">
          <span className={cn('w-2 h-2 rounded-full',
            healthLoading ? 'bg-yellow-400 animate-pulse' :
            isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
          <span className="text-xs font-medium text-foreground">
            {healthLoading ? 'Checking…' : isOnline ? 'Backend Online' : 'Backend Offline'}
          </span>
          <RefreshCw className={cn('w-3 h-3 text-muted-foreground', healthLoading && 'animate-spin')} />
        </button>
      </div>

      {/* ── Health details (when online) ── */}
      {health && !healthLoading && (
        <div className={cn(
          'rounded-2xl border p-4',
          isOnline ? 'bg-green-950/20 border-green-500/20' : 'bg-red-950/20 border-red-500/20'
        )}>
          {isOnline ? (
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-green-400 font-semibold text-sm">🟢 terrellos-backend.fly.dev</span>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className={health.openai_configured    ? 'text-green-400' : 'text-red-400'}>
                  {health.openai_configured    ? '✓' : '✗'} OpenAI
                </span>
                <span className={health.elevenlabs_configured ? 'text-green-400' : 'text-red-400'}>
                  {health.elevenlabs_configured ? '✓' : '✗'} ElevenLabs
                </span>
                <span className="text-green-400">✓ {health.registered_apps || 6} Apps</span>
                <span className="text-muted-foreground">v{health.version}</span>
                {lastCheck && <span>Checked {lastCheck}</span>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-red-400 text-sm font-semibold">🔴 Backend offline — check Fly.io dashboard</span>
              <Link to="/backend-status" className="text-xs text-red-300 underline">View Status</Link>
            </div>
          )}
        </div>
      )}

      {/* ── Tools grid ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Launch</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TOOLS.map(({ label, to, icon: Icon, color, desc }) => (
            <Link key={to} to={to}
              className="group card-glass rounded-2xl p-4 flex flex-col gap-3 hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── System stats row ── */}
      {health && isOnline && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'AI Chat',    value: health.openai_configured    ? 'Ready' : 'No Key', ok: health.openai_configured },
            { label: 'Voice TTS',  value: health.elevenlabs_configured ? 'Ready' : 'No Key', ok: health.elevenlabs_configured },
            { label: 'Image Gen',  value: health.image_generation     || '—', ok: health.image_generation === 'ready' },
            { label: 'Transcribe', value: health.whisper_transcription || '—', ok: health.whisper_transcription === 'ready' },
          ].map(({ label, value, ok }) => (
            <div key={label} className="card-glass rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-sm font-bold mt-1', ok ? 'text-green-400' : 'text-red-400')}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Founder quick links ── */}
      {access?.founder && (
        <div className="card-glass rounded-2xl p-5 border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-300">Founder Controls</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Founder Center',    to: '/founder' },
              { label: 'Super Admin',       to: '/super-admin' },
              { label: 'Live Console',      to: '/admin/live-console' },
              { label: 'Manage AI Tools',   to: '/tools/manage-ai-tools' },
              { label: 'Deployment Center', to: '/founder/deployment-center' },
              { label: 'System Diagnostics',to: '/system-status' },
              { label: 'Cost Manager',      to: '/admin/cost-manager' },
              { label: 'Backend Manifest',  to: '/backend-manifest' },
            ].map(({ label, to }) => (
              <Link key={to} to={to}
                className="text-xs bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/20 hover:border-amber-500/40 text-amber-300 rounded-lg px-3 py-2 transition-all text-center">
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
