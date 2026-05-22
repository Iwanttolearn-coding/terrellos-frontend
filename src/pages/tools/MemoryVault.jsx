/**
 * MemoryVault.jsx — TerrellOS
 * Route: /tools/memory-vault
 * AI memory sessions via /v1/memory/* backend routes.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Brain, Plus, ArrowLeft, RefreshCw, Clock, Trash2 } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = 'terrellos';

async function apiFetch(path, opts = {}) {
  const r = await fetch(`${BACKEND}${path}`, {
    ...opts,
    headers: { 'Content-Type':'application/json', 'X-App-ID':APP_ID, ...(opts.headers||{}) },
    signal: opts.signal || AbortSignal.timeout(15000),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`${r.status}: ${t.slice(0,80)}`); }
  return r.json();
}

export default function MemoryVault() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [newNote,  setNewNote]  = useState('');
  const [saving,   setSaving]   = useState(false);

  const userId = user?.email || user?.id || 'terrellos_user';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await apiFetch(`/v1/memory/profile/${encodeURIComponent(userId)}`);
        setProfile(p.profile || p);
      } catch { setProfile(null); }
      setLoading(false);
    };
    load();
  }, [userId]);

  const saveNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/v1/memory/session/transcript', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, content: newNote, source: 'manual_note', app_id: APP_ID }),
      });
      setNewNote('');
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#030007', padding:'20px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize:12, color:'#4b5563', background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>
          <ArrowLeft size={13} style={{ verticalAlign:'middle', marginRight:4 }} />Back
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🧠</div>
          <div>
            <h1 style={{ fontSize:18, fontWeight:900, color:'white', margin:0 }}>Memory Vault</h1>
            <p style={{ fontSize:11, color:'#4b5563', margin:0 }}>AI session memory and personal notes</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color:'#374151', fontSize:13, textAlign:'center', padding:'32px 0' }}>Loading memory profile…</p>
        ) : (
          <>
            {/* Profile card */}
            <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:14, padding:14, marginBottom:16 }}>
              <p style={{ fontSize:11, color:'#4b5563', fontWeight:700, textTransform:'uppercase', letterSpacing:2, margin:'0 0 8px' }}>Memory Profile</p>
              {profile ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    ['User', userId],
                    ['Sessions', profile.session_count || 0],
                    ['Completion', `${profile.completion_pct || 0}%`],
                    ['Status', profile.status || 'active'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background:'#111', borderRadius:8, padding:'8px 10px' }}>
                      <p style={{ fontSize:10, color:'#374151', margin:0, textTransform:'uppercase', letterSpacing:1 }}>{label}</p>
                      <p style={{ fontSize:13, fontWeight:700, color:'#9ca3af', margin:'2px 0 0' }}>{String(val)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize:12, color:'#374151', margin:0 }}>No memory profile yet. Add a note below to create one.</p>
              )}
            </div>

            {/* Add note */}
            <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:14, padding:14, marginBottom:16 }}>
              <p style={{ fontSize:11, color:'#4b5563', fontWeight:700, textTransform:'uppercase', letterSpacing:2, margin:'0 0 10px' }}>Add Memory Note</p>
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Record a thought, context, or memory…" rows={3}
                style={{ width:'100%', background:'#111', border:'1px solid #1f2937', borderRadius:8, padding:'10px 12px', fontSize:13, color:'white', resize:'none', outline:'none', lineHeight:1.6, boxSizing:'border-box' }} />
              {error && <p style={{ fontSize:11, color:'#f87171', margin:'6px 0 0' }}>{error}</p>}
              <button onClick={saveNote} disabled={saving || !newNote.trim()}
                style={{ marginTop:8, padding:'8px 18px', borderRadius:8, fontSize:12, fontWeight:700, border:'none', background: saving || !newNote.trim() ? '#111' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: saving || !newNote.trim() ? '#374151' : 'white', cursor: saving || !newNote.trim() ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
