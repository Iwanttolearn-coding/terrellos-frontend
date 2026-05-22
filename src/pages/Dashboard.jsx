/**
 * Dashboard.jsx — TerrellOS
 * Real command center. Live backend health. TerrellOS branding.
 * No fake data. No TM Dezigns AI Designer label.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import {
  Crown, Activity, RefreshCw, ChevronRight, Server,
  Brain, Mic, Zap, Shield, Terminal, Rocket, BarChart2,
  Wrench, Users, Code, Database, AlertCircle, CheckCircle
} from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

const TOOLS = [
  { label:'AI Chat',        to:'/tools/chat-engine',      emoji:'💬', desc:'GPT-4o powered assistant'           },
  { label:'Voice Lab',      to:'/tools/voice-lab',        emoji:'🎤', desc:'ElevenLabs TTS & voice tools'       },
  { label:'AI Builder',     to:'/ai-builder',             emoji:'🤖', desc:'Build and deploy AI apps'           },
  { label:'AI Studio',      to:'/tools/ai-tools-studio',  emoji:'🎨', desc:'Image generation & design AI'       },
  { label:'Tattoo Studio',  to:'/tools/tattoo-studio',    emoji:'✏️', desc:'Custom tattoo art & stencils'       },
  { label:'Creator Vault',  to:'/tools/creator-vault',    emoji:'🗄️', desc:'Manage your uploaded assets'        },
  { label:'Workflow',       to:'/tools/workflow',         emoji:'⚡', desc:'Automate multi-step processes'      },
  { label:'API Manager',    to:'/tools/api-manager',      emoji:'🔌', desc:'Connect and manage external APIs'   },
];

const FOUNDER_TOOLS = [
  { label:'Founder Center',   to:'/founder',             emoji:'👑' },
  { label:'Admin Panel',      to:'/admin',               emoji:'🛡️' },
  { label:'Backend Status',   to:'/backend-status',      emoji:'⚡' },
  { label:'System Logs',      to:'/system-logs',         emoji:'📋' },
  { label:'Live Console',     to:'/admin/live-console',  emoji:'🖥️' },
  { label:'Deployments',      to:'/deployment-dashboard',emoji:'🚀' },
];

function HealthDot({ ok }) {
  if (ok === null) return <div style={{ width:8, height:8, borderRadius:'50%', background:'#374151' }} />;
  return <div style={{ width:8, height:8, borderRadius:'50%', background: ok ? '#4ade80' : '#f87171', boxShadow: ok ? '0 0 6px #4ade80' : '0 0 6px #f87171' }} />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const access = resolveUserAccess(user);
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(true);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const r = await fetch(`${BACKEND}/health`, {
        headers: { 'X-App-ID':'terrellos' },
        signal: AbortSignal.timeout(8000),
      });
      const d = await r.json().catch(() => ({}));
      setHealth({ ok: r.ok, status: d?.status || (r.ok ? 'Online' : 'Error'), uptime: d?.uptime });
    } catch {
      setHealth({ ok: false, status: 'Offline' });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ minHeight:'100vh', background:'#030007', padding:'20px 16px 60px', position:'relative' }}>
      {/* Ambient */}
      <div style={{ position:'fixed', top:'10%', left:'50%', transform:'translateX(-50%)', width:500, height:200, background:'radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ maxWidth:1100, margin:'0 auto', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚡</div>
              <p style={{ fontSize:10, color:'#4b5563', margin:0, fontWeight:700, letterSpacing:3, textTransform:'uppercase' }}>TerrellOS Dashboard</p>
            </div>
            <h1 style={{ fontSize:22, fontWeight:900, color:'white', margin:0 }}>
              {greeting}{user ? `, ${access.displayName}` : ''}
            </h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Backend health pill */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:20 }}>
              <HealthDot ok={health?.ok ?? null} />
              <span style={{ fontSize:11, color: health?.ok ? '#4ade80' : health === null ? '#6b7280' : '#f87171', fontWeight:600 }}>
                {checking ? 'Checking…' : health?.status || 'Unknown'}
              </span>
              <button onClick={checkHealth} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                <RefreshCw size={11} color="#374151" style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
            {access.isFounder && (
              <div style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:20 }}>
                <Crown size={11} color="#f59e0b" />
                <span style={{ fontSize:10, color:'#f59e0b', fontWeight:700 }}>FOUNDER</span>
              </div>
            )}
          </div>
        </div>

        {/* Tool Grid */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:10, color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:3, marginBottom:12 }}>Tool Library</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8 }}>
            {TOOLS.map(tool => (
              <button key={tool.to} onClick={() => navigate(tool.to)}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(124,58,237,0.4)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#1a1a1a'; e.currentTarget.style.transform='none'; }}
                style={{ textAlign:'left', background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', transition:'all 0.15s' }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{tool.emoji}</span>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontWeight:700, color:'white', fontSize:13, margin:0 }}>{tool.label}</p>
                  <p style={{ fontSize:10, color:'#374151', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Founder tools */}
        {access.isFounder && (
          <div style={{ background:'rgba(124,58,237,0.05)', border:'1px solid rgba(124,58,237,0.12)', borderRadius:14, padding:14 }}>
            <p style={{ fontSize:10, color:'#4b5563', fontWeight:700, textTransform:'uppercase', letterSpacing:3, marginBottom:12 }}>Founder Admin</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:6 }}>
              {FOUNDER_TOOLS.map(t => (
                <button key={t.to} onClick={() => navigate(t.to)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.15)', borderRadius:9, cursor:'pointer' }}>
                  <span style={{ fontSize:14 }}>{t.emoji}</span>
                  <span style={{ fontSize:11, color:'#a78bfa', fontWeight:600 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:11, color:'#111', marginTop:28 }}>
          TerrellOS v2.0 · terrellos-backend.fly.dev · app.tm-dezigns.com
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
