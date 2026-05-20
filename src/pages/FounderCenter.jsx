/**
 * FounderCenter.jsx — TM Dezigns AI Designer
 * Founder Command Center. Real system status. No fake data.
 * Only accessible to: millzterrell210@icloud.com, millzterrell5@gmail.com
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import {
  Crown, Activity, Shield, Terminal, GitBranch, Zap,
  RefreshCw, ExternalLink, Lock, CheckCircle, XCircle,
  AlertCircle, Server, Database, Mic, Image, Brain,
  Code, Package, Rocket
} from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

const STATUS_LINKS = [
  { label: 'Live Console',      to: '/admin/live-console',      icon: Terminal },
  { label: 'Founder Builder',   to: '/founder/builder',         icon: Code },
  { label: 'Code Diagnostics',  to: '/founder/code-diagnostics',icon: GitBranch },
  { label: 'Patch Center',      to: '/founder/patch-center',    icon: Package },
  { label: 'Deployment',        to: '/founder/deployment',      icon: Rocket },
  { label: 'Stabilization',     to: '/founder/stabilization',   icon: Shield },
  { label: 'Test Runner',       to: '/founder/test-runner',     icon: Zap },
  { label: 'Release Gate',      to: '/founder/release-gate',    icon: CheckCircle },
  { label: 'Admin Panel',       to: '/admin',                   icon: Shield },
  { label: 'Backend Manifest',  to: '/backend-manifest',        icon: Server },
  { label: 'System Diagnostics',to: '/system-diagnostics',      icon: Activity },
  { label: 'System Logs',       to: '/system-logs',             icon: Terminal },
];

const ServiceRow = ({ label, icon: Icon, ok, detail }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
      <Icon className={`w-4 h-4 ${ok ? 'text-green-400' : 'text-red-400'}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white">{label}</p>
      {detail && <p className="text-xs text-gray-500 truncate">{detail}</p>}
    </div>
    {ok
      ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
    }
  </div>
);

export default function FounderCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const access = resolveUserAccess(user);

  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  // Access gate — founder only, no loop
  useEffect(() => {
    if (!access.founder) {
      navigate('/', { replace: true });
    }
  }, [access.founder, navigate]);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: 'offline', success: false });
    }
    setLastChecked(new Date().toLocaleTimeString());
    setChecking(false);
  };

  useEffect(() => { checkHealth(); }, []);

  if (!access.founder) return null;

  const online = health?.status === 'healthy' || health?.success;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8 pb-24">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold">
              Founder · Super Admin · Unlimited Access
            </span>
          </div>
          <h1 className="text-3xl font-black text-white">Founder Command Center</h1>
          <p className="text-gray-400 text-sm mt-1">TM Dezigns AI Designer · {access.displayName}</p>
        </div>
        <button onClick={checkHealth} disabled={checking}
          className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-2.5 transition-all">
          <RefreshCw className={`w-4 h-4 text-gray-400 ${checking ? 'animate-spin' : ''}`} />
          <span className="text-xs text-gray-300">{checking ? 'Checking…' : `Last: ${lastChecked || 'Never'}`}</span>
        </button>
      </div>

      {/* ── System status ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Backend health card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-violet-400" /> Backend Status
            </h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              checking ? 'bg-yellow-500/20 text-yellow-300' :
              online ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {checking ? 'Checking' : online ? '● Online' : '● Offline'}
            </span>
          </div>

          {health && !checking ? (
            <>
              <ServiceRow label="GPT-4o (OpenAI)"     icon={Brain}    ok={health.openai_configured}              detail="Chat, image gen, analysis" />
              <ServiceRow label="ElevenLabs Voice"    icon={Mic}      ok={health.elevenlabs_configured}          detail="TTS & voice synthesis" />
              <ServiceRow label="DALL-E Image Gen"    icon={Image}    ok={health.image_generation === 'ready'}   detail="/v1/design/generate-image" />
              <ServiceRow label="Whisper Transcribe"  icon={Activity} ok={health.whisper_transcription === 'ready'} detail="Audio → text" />
              <ServiceRow label="Fly.io Runtime"      icon={Server}   ok={online}                                detail={`v${health.version || '?'} · ${health.time?.split('T')[0] || ''}`} />
            </>
          ) : (
            <div className="space-y-2 py-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />)}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-600 font-mono">{BACKEND}</p>
          </div>
        </div>

        {/* Founder identity card */}
        <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-amber-300 mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4" /> Founder Identity
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Email',     val: user?.email },
              { label: 'Role',      val: access.role },
              { label: 'Plan',      val: access.plan },
              { label: 'Access',    val: 'Unlimited' },
              { label: 'Tools',     val: 'All enabled' },
              { label: 'Auth',      val: 'Local · No expiry' },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs font-mono text-amber-300">{val || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick navigation ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">System Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {STATUS_LINKS.map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to}
              className="group bg-gray-900 border border-gray-800 hover:border-violet-500/40 rounded-xl p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5 active:scale-95">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Environment info ─────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-400" /> Environment
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Backend URL',    val: BACKEND },
            { label: 'App ID',         val: import.meta.env.VITE_APP_ID || 'terrellos' },
            { label: 'App Name',       val: import.meta.env.VITE_APP_NAME || 'TerrellOS' },
            { label: 'Environment',    val: import.meta.env.VITE_ENVIRONMENT || 'production' },
            { label: 'Domain',         val: import.meta.env.VITE_APP_DOMAIN || 'app.tm-dezigns.com' },
            { label: 'Build Mode',     val: import.meta.env.MODE || 'production' },
          ].map(({ label, val }) => (
            <div key={label} className="bg-gray-800/50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-xs font-mono text-green-400 truncate">{val}</p>
            </div>
          ))}
        </div>
        <a href={`${BACKEND}/docs`} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors">
          View API Docs <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
