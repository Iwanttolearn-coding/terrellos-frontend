/**
 * DeploymentManager.jsx — TerrellOS
 * Route: /tools/deploy
 * Real deployment status for TerrellOS infrastructure.
 * No Vercel. No Railway. Fly.io + Cloudflare only.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink, Activity } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

const DEPLOYMENTS = [
  {
    id: 'fly_backend',
    label: 'TerrellOS Backend',
    platform: 'Fly.io',
    url: 'https://terrellos-backend.fly.dev',
    healthEndpoint: '/health',
    emoji: '⚡',
    color: '#8b5cf6',
  },
  {
    id: 'cf_frontend',
    label: 'TerrellOS Frontend',
    platform: 'Cloudflare Pages',
    url: 'https://app.tm-dezigns.com',
    healthEndpoint: null,
    emoji: '🌐',
    color: '#f97316',
  },
  {
    id: 'fly_backend_health',
    label: 'AI Engine (gpt-4o)',
    platform: 'OpenAI via Fly.io',
    url: `${BACKEND}/v1/core/chat`,
    healthEndpoint: null,
    emoji: '🤖',
    color: '#10b981',
  },
];

function DeployCard({ dep, status, onCheck }) {
  const s = status || { state: 'idle' };
  const stateColor = { idle:'#4b5563', checking:'#7c3aed', online:'#4ade80', offline:'#f87171', degraded:'#fbbf24' }[s.state] || '#4b5563';

  return (
    <div style={{ background:'#0a0a0a', border:`1px solid ${s.state === 'online' ? 'rgba(74,222,128,0.2)' : s.state === 'offline' ? 'rgba(248,113,113,0.2)' : '#1a1a1a'}`, borderRadius:14, padding:16, transition:'border-color 0.3s' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>{dep.emoji}</span>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'white', margin:0 }}>{dep.label}</p>
            <p style={{ fontSize:11, color:'#4b5563', margin:0 }}>{dep.platform}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:stateColor, display:'inline-block', boxShadow: s.state === 'online' ? `0 0 8px ${stateColor}` : 'none' }} />
          <span style={{ fontSize:11, color:stateColor, fontWeight:700, textTransform:'uppercase' }}>{s.state === 'idle' ? 'Not checked' : s.state}</span>
        </div>
      </div>

      <p style={{ fontSize:11, color:'#374151', margin:'0 0 10px', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {dep.url}
      </p>

      {s.detail && (
        <p style={{ fontSize:11, color: s.state === 'offline' ? '#f87171' : '#6b7280', margin:'0 0 10px' }}>{s.detail}</p>
      )}

      <div style={{ display:'flex', gap:6 }}>
        <button onClick={() => onCheck(dep)}
          style={{ flex:1, padding:'7px', borderRadius:8, fontSize:11, fontWeight:700, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.25)', color:'#a78bfa', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
          {s.state === 'checking' ? <><div style={{ width:12, height:12, border:'2px solid rgba(167,139,250,0.3)', borderTop:'2px solid #a78bfa', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Checking…</> : <><Activity size={12}/> Check Status</>}
        </button>
        <a href={dep.url} target="_blank" rel="noopener noreferrer"
          style={{ padding:'7px 10px', borderRadius:8, fontSize:11, fontWeight:700, background:'#111', border:'1px solid #1f1f1f', color:'#4b5563', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          <ExternalLink size={11}/> Open
        </a>
      </div>
    </div>
  );
}

export default function DeploymentManager() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState({});
  const [checkingAll, setCheckingAll] = useState(false);

  const checkDep = useCallback(async (dep) => {
    setStatuses(s => ({ ...s, [dep.id]: { state: 'checking' } }));
    try {
      let url = dep.url;
      let method = 'GET';
      let body = undefined;
      if (dep.id === 'fly_backend_health') {
        url = `${BACKEND}/v1/core/chat`;
        method = 'POST';
        body = JSON.stringify({ message: 'ping', max_tokens: 3 });
      }
      const start = Date.now();
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type':'application/json', 'X-App-ID':'terrellos' },
        body,
        signal: AbortSignal.timeout(10000),
        mode: dep.id === 'cf_frontend' ? 'no-cors' : 'cors',
      });
      const ms = Date.now() - start;
      const state = dep.id === 'cf_frontend' ? 'online' : (r.ok ? (ms > 5000 ? 'degraded' : 'online') : 'offline');
      setStatuses(s => ({ ...s, [dep.id]: { state, detail: `${ms}ms response`, ms } }));
    } catch (e) {
      setStatuses(s => ({ ...s, [dep.id]: { state: 'offline', detail: e.message?.slice(0,60) || 'Unreachable' } }));
    }
  }, []);

  const checkAll = useCallback(async () => {
    setCheckingAll(true);
    await Promise.all(DEPLOYMENTS.map(dep => checkDep(dep)));
    setCheckingAll(false);
  }, [checkDep]);

  useEffect(() => { checkAll(); }, [checkAll]);

  const onlineCount = Object.values(statuses).filter(s => s.state === 'online').length;

  return (
    <div style={{ minHeight:'100vh', background:'#030007', padding:'20px 16px 60px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize:12, color:'#4b5563', background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>← Back</button>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:10 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:900, color:'white', margin:0 }}>Deployment Health</h1>
            <p style={{ fontSize:12, color:'#4b5563', margin:'2px 0 0' }}>TerrellOS · Fly.io + Cloudflare Pages</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ padding:'4px 14px', borderRadius:20, background: onlineCount === DEPLOYMENTS.length ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border:`1px solid ${onlineCount === DEPLOYMENTS.length ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
              <span style={{ fontSize:11, color: onlineCount === DEPLOYMENTS.length ? '#4ade80' : '#f87171', fontWeight:700 }}>
                {onlineCount}/{DEPLOYMENTS.length} Online
              </span>
            </div>
            <button onClick={checkAll} disabled={checkingAll}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:9, background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.25)', color:'#a78bfa', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <RefreshCw size={12} style={{ animation: checkingAll ? 'spin 1s linear infinite' : 'none' }} />
              Refresh All
            </button>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {DEPLOYMENTS.map(dep => (
            <DeployCard key={dep.id} dep={dep} status={statuses[dep.id]} onCheck={checkDep} />
          ))}
        </div>

        {/* Infrastructure reference */}
        <div style={{ marginTop:20, background:'rgba(124,58,237,0.05)', border:'1px solid rgba(124,58,237,0.12)', borderRadius:14, padding:14 }}>
          <p style={{ fontSize:10, color:'#4b5563', fontWeight:700, textTransform:'uppercase', letterSpacing:2, margin:'0 0 10px' }}>Infrastructure Reference</p>
          {[
            ['Backend App',   'terrellos-backend', 'Fly.io'],
            ['Deploy cmd',    'flyctl deploy -a terrellos-backend', 'CLI'],
            ['Frontend',      'terrellos-frontend', 'Cloudflare Pages'],
            ['Build cmd',     'npm run build', 'Vite'],
            ['Output dir',    'dist', 'Cloudflare'],
            ['DNS',           'lars.ns.cloudflare.com', 'Cloudflare'],
          ].map(([label, value, note]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(124,58,237,0.06)' }}>
              <span style={{ fontSize:11, color:'#4b5563' }}>{label}</span>
              <div style={{ textAlign:'right' }}>
                <span style={{ fontSize:11, color:'#6b7280', fontFamily:'monospace' }}>{value}</span>
                <span style={{ fontSize:10, color:'#374151', marginLeft:8 }}>{note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
