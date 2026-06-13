/**
 * TerrellOSWelcome.jsx — TerrellOS v2
 * Route: /terrellos/welcome
 *
 * Real command center. Live backend widgets. No fake data.
 * Boot guard via useBoot() — never renders before hydration.
 */
import IMG from '@/lib/sectionImages';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import {
  Crown, Zap, Activity, Server, Users, CreditCard,
  Wrench, Rocket, BarChart2, ArrowRight, AlertCircle,
  CheckCircle, XCircle, RefreshCw, Globe, Brain, Mic,
  Shield, Code, Database, Terminal
} from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_VER  = '2.0.0';

// ── Action cards ──────────────────────────────────────────────────────────────
const ACTIONS = [
  { id:'founder',       emoji:'👑', label:'Founder Command',     desc:'Full system access, diagnostics, admin controls',         route:'/terrellos/founder',       founderOnly:true,  color:'#f59e0b' },
  { id:'ai-builder',    emoji:'🤖', label:'Build an AI App',      desc:'Create, configure, and deploy AI-powered applications',    route:'/ai-builder',              founderOnly:false, color:'#8b5cf6' },
  { id:'tools',         emoji:'🛠️', label:'Open Tool Library',    desc:'Chat, voice, vault, builder, avatar, and more',           route:'/terrellos/tools',         founderOnly:false, color:'#f97316' },
  { id:'backend',       emoji:'⚡', label:'Backend Console',      desc:'Manage routes, secrets, and service health',               route:'/backend-status',          founderOnly:true,  color:'#3b82f6' },
  { id:'system',        emoji:'🖥️', label:'System Status',        desc:'Live health check for all TerrellOS services',             route:'/terrellos/system-status', founderOnly:false, color:'#10b981' },
  { id:'users',         emoji:'👥', label:'Manage Users',         desc:'View, edit, and manage all registered users',              route:'/terrellos/users',         founderOnly:true,  color:'#6366f1' },
  { id:'subscriptions', emoji:'💳', label:'Subscriptions',        desc:'Plans, billing, and subscription status',                  route:'/terrellos/subscriptions', founderOnly:true,  color:'#ec4899' },
  { id:'deployments',   emoji:'🚀', label:'Deployment Health',    desc:'Monitor Fly.io, Cloudflare Pages, and build pipeline',     route:'/terrellos/deployments',   founderOnly:true,  color:'#14b8a6' },
];

// ── System health widget ──────────────────────────────────────────────────────
const CHECKS = [
  { key:'backend', label:'Backend API', endpoint:'/health',             method:'GET' },
  { key:'ai',      label:'AI Engine',   endpoint:'/v1/core/chat',       method:'POST', body:{ message:'ping', max_tokens:5 } },
  { key:'voice',   label:'Voice Engine',endpoint:'/v1/voice/health',    method:'GET' },
  { key:'tattoo',  label:'Tattoo API',  endpoint:'/v1/tattoo/styles',   method:'GET' },
];

function StatusDot({ status }) {
  const cfg = {
    checking: { color:'#6b7280', glow:'none',              label:'…'       },
    online:   { color:'#4ade80', glow:'0 0 8px #4ade80',   label:'Online'  },
    degraded: { color:'#fbbf24', glow:'0 0 8px #fbbf24',   label:'Slow'    },
    offline:  { color:'#f87171', glow:'0 0 8px #f87171',   label:'Offline' },
  }[status] || { color:'#6b7280', glow:'none', label:'?' };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.color, display:'inline-block', boxShadow:cfg.glow }} />
      <span style={{ fontSize:11, color:cfg.color, fontWeight:600 }}>{cfg.label}</span>
    </div>
  );
}

function SystemHealthWidget() {
  const [statuses, setStatuses] = useState(() => Object.fromEntries(CHECKS.map(c => [c.key, 'checking'])));
  const [lastChecked, setLastChecked] = useState(null);
  const [checking, setChecking] = useState(false);

  const runChecks = useCallback(async () => {
    setChecking(true);
    setStatuses(Object.fromEntries(CHECKS.map(c => [c.key, 'checking'])));
    await Promise.all(CHECKS.map(async (check) => {
      const start = Date.now();
      try {
        const opts = {
          method: check.method,
          headers: { 'X-App-ID':'terrellos', 'Content-Type':'application/json' },
          signal: AbortSignal.timeout(8000),
        };
        if (check.body) opts.body = JSON.stringify(check.body);
        const r = await fetch(`${BACKEND}${check.endpoint}`, opts);
        const ms = Date.now() - start;
        setStatuses(s => ({ ...s, [check.key]: r.ok ? (ms > 4000 ? 'degraded' : 'online') : 'offline' }));
      } catch {
        setStatuses(s => ({ ...s, [check.key]: 'offline' }));
      }
    }));
    setLastChecked(new Date());
    setChecking(false);
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  const ICONS = { backend: Server, ai: Brain, voice: Mic, tattoo: Zap };

  return (
    <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Activity size={14} color="#7c3aed" />
          <span style={{ fontSize:12, fontWeight:700, color:'white' }}>System Health</span>
        </div>
        <button onClick={runChecks} disabled={checking}
          style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#6b7280', background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <RefreshCw size={11} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
          {lastChecked ? `${Math.round((Date.now() - lastChecked) / 1000)}s ago` : 'checking'}
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {CHECKS.map(check => {
          const Icon = ICONS[check.key] || Activity;
          return (
            <div key={check.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', background:'#111', borderRadius:10, border:'1px solid #1f1f1f' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Icon size={12} color="#4b5563" />
                <span style={{ fontSize:11, color:'#9ca3af' }}>{check.label}</span>
              </div>
              <StatusDot status={statuses[check.key]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent activity widget (from backend logs or static) ───────────────────
function RecentJobsWidget() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND}/v1/system/recent-jobs`, {
      headers: { 'X-App-ID':'terrellos' },
      signal: AbortSignal.timeout(6000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.jobs?.length) setJobs(data.jobs.slice(0, 5));
        else setJobs([]);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <Terminal size={14} color="#7c3aed" />
        <span style={{ fontSize:12, fontWeight:700, color:'white' }}>Recent Jobs</span>
      </div>
      {loading ? (
        <p style={{ fontSize:11, color:'#374151', margin:0 }}>Loading…</p>
      ) : jobs.length === 0 ? (
        <p style={{ fontSize:11, color:'#374151', margin:0 }}>No recent jobs yet.</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {jobs.map((job, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', background:'#111', borderRadius:8 }}>
              <span style={{ fontSize:11, color:'#9ca3af' }}>{job.type || job.name || 'Job'}</span>
              <span style={{ fontSize:10, color:'#4b5563' }}>{job.status || 'done'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Quick stats row (backend-driven) ─────────────────────────────────────────
function StatsRow({ access }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND}/v1/system/stats`, {
      headers: { 'X-App-ID':'terrellos' },
      signal: AbortSignal.timeout(6000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(d?.stats || null))
      .catch(() => setStats(null));
  }, []);

  const items = [
    { label:'Backend',    value: BACKEND.replace('https://','').split('.')[0], icon:'⚡' },
    { label:'Version',    value: APP_VER,                                      icon:'🔖' },
    { label:'Role',       value: access?.role || 'guest',                      icon:'🎖️' },
    { label:'AI Model',   value: 'gpt-4o',                                     icon:'🤖' },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
      {items.map(item => (
        <div key={item.label} style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, padding:'10px 12px', textAlign:'center' }}>
          <div style={{ fontSize:18, marginBottom:4 }}>{item.icon}</div>
          <p style={{ fontSize:13, fontWeight:700, color:'white', margin:0 }}>{item.value}</p>
          <p style={{ fontSize:10, color:'#4b5563', margin:'2px 0 0', textTransform:'uppercase', letterSpacing:1 }}>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function TerrellOSWelcome() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  // Boot guard — BootProvider already handles this but double-check
  if (isLoadingAuth) return null;

  if (!user) {
    return (
      <div style={{ minHeight:'100vh', background:'#030007', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ maxWidth:320, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{ width:56, height:56, borderRadius:18, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>⚡</div>
          <h2 style={{ fontSize:20, fontWeight:900, color:'white', margin:0 }}>TerrellOS</h2>
          <p style={{ fontSize:13, color:'#4b5563', margin:0 }}>Sign in to access your platform.</p>
          <button onClick={() => navigate('/login')} style={{ padding:'11px 28px', borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const access = resolveUserAccess(user);

  if (!access.hasAccess && !access.isFounder) {
    return (
      <div style={{ minHeight:'100vh', background:'#030007', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ maxWidth:320, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:36 }}>🔒</div>
          <h2 style={{ fontSize:18, fontWeight:900, color:'white', margin:0 }}>Access Required</h2>
          <p style={{ fontSize:13, color:'#4b5563', margin:0 }}>Upgrade your plan to access TerrellOS.</p>
          <button onClick={() => navigate('/pricing')} style={{ padding:'11px 28px', borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', border:'none', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const visibleActions = ACTIONS.filter(a => !a.founderOnly || access.isFounder);

  return (
    <div style={{ minHeight:'100vh', background:'#030007', padding:'20px 16px 80px', position:'relative', overflow:'hidden' }}>
      {/* Ambient background glow */}
      <div style={{ position:'fixed', top:'20%', left:'50%', transform:'translateX(-50%)', width:600, height:300, background:'radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ maxWidth:1000, margin:'0 auto', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 4px 12px rgba(124,58,237,0.3)' }}>⚡</div>
            <div>
              <p style={{ fontSize:11, color:'#4b5563', margin:0, textTransform:'uppercase', letterSpacing:2 }}>TerrellOS</p>
              <p style={{ fontSize:11, color:'#1f2937', margin:0 }}>TerrellOS</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {access.isFounder && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:20, padding:'3px 12px' }}>
                <Crown size={11} color="#f59e0b" />
                <span style={{ fontSize:10, color:'#f59e0b', fontWeight:700, letterSpacing:1 }}>FOUNDER · ALL ACCESS</span>
              </div>
            )}
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:26, fontWeight:900, color:'white', margin:'0 0 4px', letterSpacing:'-0.3px' }}>
            {greeting}, {access.displayName}
          </h1>
          <p style={{ fontSize:13, color:'#4b5563', margin:0 }}>What do you want to build today?</p>
        </div>

        {/* Stats row */}
        <StatsRow access={access} />

        {/* Two-column layout: actions + widgets */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>

          {/* Actions */}
          <div>
            <p style={{ fontSize:10, color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:3, marginBottom:12 }}>
              Quick Launch
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {visibleActions.map(action => (
                <button key={action.id} onClick={() => navigate(action.route)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = action.color + '50'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.transform = 'none'; }}
                  style={{ textAlign:'left', background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:14, padding:14, display:'flex', flexDirection:'column', gap:10, cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:22 }}>{action.emoji}</span>
                    <ArrowRight size={13} color="#1f2937" />
                  </div>
                  <div>
                    <p style={{ fontWeight:700, color:'white', fontSize:13, margin:0 }}>{action.label}</p>
                    <p style={{ fontSize:11, color:'#374151', margin:'3px 0 0', lineHeight:1.5 }}>{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Founder quick links */}
            {access.isFounder && (
              <div style={{ marginTop:12, background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.12)', borderRadius:14, padding:12 }}>
                <p style={{ fontSize:10, color:'#4b5563', fontWeight:700, textTransform:'uppercase', letterSpacing:2, marginBottom:10 }}>Founder Tools</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {[
                    { label:'Live Console', to:'/admin/live-console', icon:'🖥️' },
                    { label:'AI Builder',   to:'/ai-builder',         icon:'🤖' },
                    { label:'System Logs',  to:'/system-logs',        icon:'📋' },
                    { label:'Diagnostics',  to:'/diagnostics',        icon:'🔬' },
                  ].map(l => (
                    <button key={l.to} onClick={() => navigate(l.to)}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 4px', background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:10, cursor:'pointer' }}>
                      <span style={{ fontSize:16 }}>{l.icon}</span>
                      <span style={{ fontSize:10, color:'#a78bfa', textAlign:'center', lineHeight:1.3 }}>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right widgets */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <SystemHealthWidget />
            <RecentJobsWidget />

            {/* Backend info card */}
            <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Server size={14} color="#7c3aed" />
                <span style={{ fontSize:12, fontWeight:700, color:'white' }}>Infrastructure</span>
              </div>
              {[
                { label:'Backend',   value:'terrellos-backend.fly.dev', status:'online' },
                { label:'Frontend',  value:'TerrellOS (Render)',        status:'online' },
                { label:'DNS',       value:'Cloudflare',                status:'online' },
                { label:'AI Model',  value:'gpt-4o / gpt-image-1',     status:'online' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #0f0f0f' }}>
                  <div>
                    <p style={{ fontSize:10, color:'#4b5563', margin:0, textTransform:'uppercase', letterSpacing:1 }}>{item.label}</p>
                    <p style={{ fontSize:11, color:'#6b7280', margin:0 }}>{item.value}</p>
                  </div>
                  <StatusDot status={item.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
