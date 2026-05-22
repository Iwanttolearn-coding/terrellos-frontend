/**
 * TerrellOSWelcome.jsx
 * Route: /terrellos/welcome
 *
 * Post-login landing for TerrellOS.
 * Boot guard: loading → user check → access → render.
 * Founder always passes. Non-paying → /pricing.
 * No loops. No white screens.
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import {
  Crown, Zap, Activity, Server, Users, CreditCard,
  Wrench, Rocket, BarChart2, ArrowRight, RefreshCw
} from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

// ── Action cards ──────────────────────────────────────────────────────────────
const ACTIONS = [
  {
    id: 'founder',
    emoji: '👑',
    label: 'Open Founder Command Center',
    desc: 'Full system access, diagnostics, and admin controls',
    route: '/terrellos/founder',
    founderOnly: true,
    color: '#f59e0b',
    gradient: 'from-amber-600 to-orange-700',
  },
  {
    id: 'ai-builder',
    emoji: '🤖',
    label: 'Build an AI App',
    desc: 'Create, configure, and deploy AI-powered applications',
    route: '/ai-builder',
    color: '#8b5cf6',
    gradient: 'from-violet-600 to-purple-700',
  },
  {
    id: 'backend',
    emoji: '⚡',
    label: 'Connect Backend',
    desc: 'Manage backend routes, secrets, and service health',
    route: '/backend-status',
    color: '#3b82f6',
    gradient: 'from-blue-600 to-cyan-700',
  },
  {
    id: 'system',
    emoji: '🖥️',
    label: 'Check System Status',
    desc: 'Live health check for all TerrellOS services',
    route: '/terrellos/system-status',
    color: '#10b981',
    gradient: 'from-emerald-600 to-green-700',
  },
  {
    id: 'users',
    emoji: '👥',
    label: 'Manage Users',
    desc: 'View, edit, and manage all registered users',
    route: '/terrellos/users',
    founderOnly: true,
    color: '#6366f1',
    gradient: 'from-indigo-600 to-violet-700',
  },
  {
    id: 'subscriptions',
    emoji: '💳',
    label: 'Manage Subscriptions',
    desc: 'View plans, billing, and subscription status',
    route: '/terrellos/subscriptions',
    founderOnly: true,
    color: '#ec4899',
    gradient: 'from-pink-600 to-rose-700',
  },
  {
    id: 'tools',
    emoji: '🛠️',
    label: 'Open Tool Library',
    desc: 'Access all AI tools: chat, voice, builder, vault, and more',
    route: '/terrellos/tools',
    color: '#f97316',
    gradient: 'from-orange-600 to-amber-700',
  },
  {
    id: 'deployments',
    emoji: '🚀',
    label: 'View Deployment Health',
    desc: 'Monitor Fly.io, Cloudflare Pages, and build status',
    route: '/terrellos/deployments',
    founderOnly: true,
    color: '#14b8a6',
    gradient: 'from-teal-600 to-cyan-700',
  },
];

// ── Backend status indicator ──────────────────────────────────────────────────
function BackendPill() {
  const [status, setStatus] = React.useState('checking');
  React.useEffect(() => {
    fetch(BACKEND + '/health', { signal: AbortSignal.timeout(6000) })
      .then(r => setStatus(r.ok ? 'online' : 'degraded'))
      .catch(() => setStatus('offline'));
  }, []);
  const MAP = {
    checking: { dot:'#6b7280', label:'Checking…' },
    online:   { dot:'#4ade80', label:'Backend Online' },
    degraded: { dot:'#f59e0b', label:'Degraded' },
    offline:  { dot:'#f87171', label:'Backend Offline' },
  };
  const s = MAP[status] || MAP.checking;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, display:'inline-block', boxShadow:'0 0 6px ' + s.dot }} />
      <span style={{ fontSize:11, color:s.dot, fontWeight:600 }}>{s.label}</span>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────
function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-xs text-gray-500 font-mono tracking-widest animate-pulse">TERRELLOS · LOADING</p>
      </div>
    </div>
  );
}

export default function TerrellOSWelcome() {
  const navigate = useNavigate();
  const { user, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // 1. Still loading
  if (isLoadingAuth || isLoadingPublicSettings) return <Loading />;

  // 2. No user — go to login (no loop — FounderLogin is at /login)
  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950 p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-purple-500/20">⚡</div>
          <h2 className="text-xl font-black text-white">TerrellOS</h2>
          <p className="text-sm text-gray-500">Sign in to access your platform.</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // 3. Resolve access — ONE call, used everywhere on this page
  const access = resolveUserAccess(user);

  // 4. Non-paying, non-founder → pricing
  if (!access.hasAccess && !access.isFounder) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950 p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center mx-auto text-2xl">🔒</div>
          <h2 className="text-xl font-black text-white">Access Required</h2>
          <p className="text-sm text-gray-500">Upgrade your plan to access TerrellOS.</p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/pricing')} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-sm hover:opacity-90 transition-opacity">
              View Plans
            </button>
            <button onClick={() => navigate('/')} className="flex-1 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-gray-750 transition-colors">
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Render welcome
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const visibleActions = ACTIONS.filter(a => !a.founderOnly || access.isFounder);

  return (
    <div className="min-h-screen bg-gray-950 p-4 lg:p-8 pb-24">
      <div className="max-w-4xl mx-auto">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center mx-auto mb-5 text-3xl shadow-lg shadow-purple-500/25">⚡</div>
          <h1 className="text-3xl font-black text-white mb-2">
            {greeting}, {access.displayName}
          </h1>
          <p className="text-gray-500 text-sm mb-4">Welcome to TerrellOS · app.tm-dezigns.com</p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {access.isFounder && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">FOUNDER · ALL ACCESS</span>
              </div>
            )}
            <BackendPill />
          </div>
        </div>

        {/* Choose action */}
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest text-center mb-6">
          What do you want to build today?
        </p>

        {/* Action grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {visibleActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.route)}
              className="text-left bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              style={{ '--hover-border': action.color }}
              onMouseEnter={e => e.currentTarget.style.borderColor = action.color + '60'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}
            >
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-xl shadow-lg`}>
                  {action.emoji}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{action.label}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick links for founder */}
        {access.isFounder && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Quick Admin</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Live Console',    to: '/admin/live-console',   icon: '🖥️' },
                { label: 'Backend Status',  to: '/backend-status',       icon: '⚡' },
                { label: 'System Logs',     to: '/system-logs',          icon: '📋' },
                { label: 'AI Builder',      to: '/ai-builder',           icon: '🤖' },
              ].map(l => (
                <button key={l.to} onClick={() => navigate(l.to)} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 transition-colors cursor-pointer text-left">
                  <span className="text-base">{l.icon}</span>
                  <span className="text-xs font-medium text-gray-300">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-800 mt-8">TerrellOS · Powered by TM Designs</p>
      </div>
    </div>
  );
}
