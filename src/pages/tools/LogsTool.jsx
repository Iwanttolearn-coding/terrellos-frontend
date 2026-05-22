/**
 * LogsTool.jsx — TerrellOS
 * Route: /tools/logs
 * Real-time log viewer. Fetches from /v1/system/recent-jobs + in-browser log.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollText, RefreshCw, ArrowLeft, Activity, AlertCircle } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

const DOT = { done:'#4ade80', error:'#f87171', info:'#60a5fa', warn:'#fbbf24', checking:'#6b7280' };

export default function LogsTool() {
  const navigate = useNavigate();
  const [serverJobs, setServerJobs] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [lastFetch,  setLastFetch]  = useState(null);
  const [backendOk,  setBackendOk]  = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Try /v1/system/recent-jobs (available after next flyctl deploy)
      const r = await fetch(`${BACKEND}/v1/system/recent-jobs`, {
        headers: { 'X-App-ID':'terrellos' },
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        setServerJobs(d.jobs || []);
        setBackendOk(true);
      } else {
        setBackendOk(false);
        setServerJobs([]);
      }
    } catch {
      setBackendOk(false);
      setServerJobs([]);
    }
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const allLogs = [
    ...serverJobs.map(j => ({
      id:   j.ts || Math.random(),
      type: j.status || 'info',
      msg:  `[${j.type || 'system'}] ${j.detail || j.status || ''}`,
      time: j.ts ? new Date(j.ts) : new Date(),
      src:  'server',
    })),
  ].sort((a, b) => b.time - a.time);

  return (
    <div style={{ minHeight:'100vh', background:'#030007', padding:'20px 16px 60px' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize:12, color:'#4b5563', background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>
          <ArrowLeft size={13} style={{ verticalAlign:'middle', marginRight:4 }} />Back
        </button>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#374151,#1f2937)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📋</div>
            <div>
              <h1 style={{ fontSize:18, fontWeight:900, color:'white', margin:0 }}>System Logs</h1>
              <p style={{ fontSize:11, color:'#4b5563', margin:0 }}>TerrellOS runtime activity</p>
            </div>
          </div>
          <button onClick={fetchLogs} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', color:'#a78bfa', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Refresh
          </button>
        </div>

        {backendOk === false && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, marginBottom:14 }}>
            <AlertCircle size={13} color="#fbbf24"/>
            <p style={{ fontSize:12, color:'#fbbf24', margin:0 }}>
              Server logs unavailable — run <code style={{ background:'#111', padding:'1px 5px', borderRadius:4 }}>flyctl deploy -a terrellos-backend</code> to activate /v1/system/recent-jobs
            </p>
          </div>
        )}

        <div style={{ background:'#050505', border:'1px solid #111', borderRadius:14, padding:4, fontFamily:'monospace', maxHeight:500, overflowY:'auto' }}>
          {loading ? (
            <p style={{ color:'#374151', fontSize:12, textAlign:'center', padding:'24px 0' }}>Fetching logs…</p>
          ) : allLogs.length === 0 ? (
            <p style={{ color:'#1f2937', fontSize:12, textAlign:'center', padding:'24px 0' }}>
              {backendOk ? 'No activity logged yet.' : 'Deploy backend to see live server logs here.'}
            </p>
          ) : (
            allLogs.map(log => (
              <div key={log.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'7px 12px', borderBottom:'1px solid #0a0a0a' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:DOT[log.type]||DOT.info, flexShrink:0, marginTop:4 }} />
                <span style={{ fontSize:11, color:'#4b5563', flexShrink:0, minWidth:60 }}>
                  {log.time?.toLocaleTimeString?.() || ''}
                </span>
                <span style={{ fontSize:12, color: log.type==='error'?'#f87171':log.type==='warn'?'#fbbf24':'#6b7280', flex:1, lineHeight:1.5 }}>
                  {log.msg}
                </span>
                {log.src === 'server' && (
                  <span style={{ fontSize:9, color:'#1f2937', flexShrink:0, marginTop:2 }}>SRV</span>
                )}
              </div>
            ))
          )}
        </div>

        {lastFetch && (
          <p style={{ fontSize:10, color:'#1f2937', textAlign:'center', marginTop:10 }}>
            Last fetched: {lastFetch.toLocaleTimeString()}
          </p>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
