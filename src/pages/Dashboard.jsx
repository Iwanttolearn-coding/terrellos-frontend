/**
 * Dashboard.jsx — TM Dezigns AI Designer
 * Command center. Real backend health. Founder-aware. No fake data.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import {
  Image, Scissors, Upload, Printer, Palette, LayoutGrid,
  Crown, Activity, RefreshCw, ChevronRight, Zap, Mic,
  MessageSquare, Brain, Settings, Shield
} from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

// Primary tool grid — TM Designs AI Designer focused
const TOOLS = [
  { label: 'Generate Image',    to: '/tools/ai-tools-studio', icon: Image,     color: 'from-violet-600 to-purple-800',   desc: 'AI image & tattoo generation', emoji: '🎨' },
  { label: 'Tattoo Studio',     to: '/tools/tattoo-studio',   icon: Scissors,  color: 'from-orange-600 to-amber-800',    desc: 'Custom tattoo patterns & styles', emoji: '💉' },
  { label: 'Upload Design',     to: '/tools/creator-vault',   icon: Upload,    color: 'from-emerald-600 to-green-800',   desc: 'Upload & manage your artwork', emoji: '📁' },
  { label: 'Print Readiness',   to: '/tools/print-readiness', icon: Printer,   color: 'from-cyan-600 to-blue-800',       desc: 'Check print quality & specs', emoji: '🖨️' },
  { label: 'Style Advisor',     to: '/tools/style-advisor',   icon: Palette,   color: 'from-pink-600 to-rose-800',       desc: 'AI-powered design recommendations', emoji: '✨' },
  { label: 'My Gallery',        to: '/tools/creator-vault',   icon: LayoutGrid,color: 'from-fuchsia-600 to-violet-800',  desc: 'Your saved designs & projects', emoji: '🖼️' },
  { label: 'AI Chat',           to: '/tools/chat-engine',     icon: MessageSquare, color: 'from-sky-600 to-blue-800',    desc: 'GPT-4o design assistant', emoji: '💬' },
  { label: 'Voice Lab',         to: '/tools/voice-lab',       icon: Mic,       color: 'from-indigo-600 to-violet-800',   desc: 'ElevenLabs TTS & voice tools', emoji: '🎤' },
];

const FOUNDER_TOOLS = [
  { label: 'Founder Center',    to: '/founder',               icon: Crown,     color: 'from-amber-500 to-orange-700',    desc: 'System control & full audit' },
  { label: 'Admin Panel',       to: '/admin',                 icon: Shield,    color: 'from-red-600 to-rose-800',         desc: 'User management & system ops' },
  { label: 'Backend Status',    to: '/backend-status',        icon: Activity,  color: 'from-slate-600 to-gray-800',       desc: 'Live connectivity monitor' },
  { label: 'System Settings',   to: '/settings',              icon: Settings,  color: 'from-zinc-600 to-gray-800',        desc: 'Environment & config' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const access = resolveUserAccess(user);
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(true);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: 'offline', success: false });
    }
    setChecking(false);
  };

  useEffect(() => { checkHealth(); }, []);

  const online = health?.status === 'healthy' || health?.success;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = access.displayName || 'Designer';

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 pb-24">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {access.founder && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <Crown className="w-3 h-3" /> Founder · Super Admin · Unlimited Access
              </span>
            </div>
          )}
          <h1 className="text-3xl font-black text-white">{greeting}, {name} 👋</h1>
          <p className="text-gray-400 text-sm mt-1">TM Dezigns AI Designer · {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
        </div>

        {/* Backend health pill */}
        <button onClick={checkHealth} disabled={checking}
          className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-2.5 transition-all">
          <span className={`w-2 h-2 rounded-full ${checking ? 'bg-yellow-400 animate-pulse' : online ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs font-medium text-white">
            {checking ? 'Checking…' : online ? 'AI Engine Online' : 'AI Engine Offline'}
          </span>
          <RefreshCw className={`w-3 h-3 text-gray-500 ${checking ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Health strip (when online) ──────────────────────────────────────── */}
      {health && !checking && online && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'GPT-4o',      val: health.openai_configured,      icon: '🧠' },
            { label: 'Voice',       val: health.elevenlabs_configured,   icon: '🎤' },
            { label: 'Image Gen',   val: health.image_generation === 'ready', icon: '🎨' },
            { label: 'Transcribe',  val: health.whisper_transcription === 'ready', icon: '📝' },
          ].map(({ label, val, icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-xs font-bold ${val ? 'text-green-400' : 'text-red-400'}`}>
                  {val ? 'Ready' : 'Not configured'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Primary tool grid ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">Creative Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {TOOLS.map(({ label, to, icon: Icon, color, desc, emoji }) => (
            <Link key={to + label} to={to}
              className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 active:scale-95">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm group-hover:text-violet-300 transition-colors leading-tight">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed hidden sm:block">{desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors self-end" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Founder tools (founder only) ─────────────────────────────────────── */}
      {access.founder && (
        <div>
          <h2 className="text-xs text-amber-500/70 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-3.5 h-3.5" /> Founder Command Center
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FOUNDER_TOOLS.map(({ label, to, icon: Icon, color, desc }) => (
              <Link key={to} to={to}
                className="group bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 active:scale-95">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-200 text-sm leading-tight">{label}</p>
                  <p className="text-xs text-amber-400/50 mt-0.5 leading-relaxed hidden sm:block">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Access status (non-founder) ──────────────────────────────────────── */}
      {!access.founder && !access.allAccess && (
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white text-sm">Unlock all AI tools</p>
            <p className="text-xs text-gray-400 mt-1">Upgrade to access tattoo generation, portrait AI, print readiness, and more.</p>
          </div>
          <Link to="/pricing"
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold hover:opacity-90 transition-opacity">
            Upgrade
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-gray-700">TM Dezigns AI Designer · Powered by TerrellOS AI Engine</p>
    </div>
  );
}
