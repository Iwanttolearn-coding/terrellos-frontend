/**
 * UploadsTool.jsx — TerrellOS
 * Route: /tools/uploads
 * Real upload manager. Drag/drop → /v1/uploads/file.
 * List view → /v1/uploads/list/{user_id}
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Upload, Trash2, Download, Image, FileText, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = 'terrellos';

const ACCEPT = '.png,.jpg,.jpeg,.webp,.svg,.pdf,.gif';

async function uploadFile(file, userId) {
  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('app_id', APP_ID);
  fd.append('user_id', userId || 'terrellos_user');
  const r = await fetch(`${BACKEND}/v1/uploads/file`, {
    method: 'POST',
    headers: { 'X-App-ID': APP_ID },
    body: fd,
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`Upload failed: ${t.slice(0,80)}`); }
  return r.json();
}

async function listUploads(userId) {
  const r = await fetch(`${BACKEND}/v1/uploads/list/${encodeURIComponent(userId || 'terrellos_user')}`, {
    headers: { 'X-App-ID': APP_ID },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return [];
  const d = await r.json();
  return d.files || d.uploads || d.items || [];
}

function FileIcon({ mime }) {
  if (!mime) return <FileText size={20} color="#4b5563" />;
  if (mime.startsWith('image/')) return <Image size={20} color="#a78bfa" />;
  return <FileText size={20} color="#4b5563" />;
}

export default function UploadsTool() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files,    setFiles]    = useState([]);
  const [uploading,setUploading]= useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const userId = user?.email || user?.id || 'terrellos_user';

  const loadFiles = async () => {
    setLoading(true);
    try {
      const items = await listUploads(userId);
      setFiles(items);
    } catch { setFiles([]); }
    setLoading(false);
  };

  useEffect(() => { loadFiles(); }, [userId]);

  const handleUpload = async (fileList) => {
    setError(''); setUploading(true);
    const results = [];
    for (const file of Array.from(fileList)) {
      try {
        const result = await uploadFile(file, userId);
        results.push(result);
      } catch (e) {
        setError(e.message);
      }
    }
    if (results.length) await loadFiles();
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#030007', padding:'20px 16px 60px' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize:12, color:'#4b5563', background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>
          <ArrowLeft size={13} style={{ verticalAlign:'middle', marginRight:4 }} />Back
        </button>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📁</div>
            <div>
              <h1 style={{ fontSize:18, fontWeight:900, color:'white', margin:0 }}>Upload Manager</h1>
              <p style={{ fontSize:11, color:'#4b5563', margin:0 }}>PNG · JPG · WEBP · SVG · PDF · GIF</p>
            </div>
          </div>
          <button onClick={loadFiles} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:8, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', color:'#a78bfa', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            <RefreshCw size={11}/> Refresh
          </button>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{ border:`2px dashed ${dragOver ? '#7c3aed' : '#1f2937'}`, borderRadius:14, padding:'28px 20px', textAlign:'center', cursor:'pointer', background: dragOver ? 'rgba(124,58,237,0.06)' : '#0a0a0a', marginBottom:16, transition:'all 0.2s' }}>
          <input ref={inputRef} type="file" hidden multiple accept={ACCEPT} onChange={e => e.target.files?.length && handleUpload(e.target.files)} />
          {uploading
            ? <><div style={{ width:20, height:20, border:'2px solid rgba(167,139,250,0.3)', borderTop:'2px solid #a78bfa', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 8px' }} /><p style={{ color:'#6b7280', fontSize:13, margin:0 }}>Uploading…</p></>
            : <><div style={{ fontSize:28, marginBottom:8, opacity:0.4 }}>☁️</div><p style={{ color:'#4b5563', fontSize:13, margin:0, fontWeight:600 }}>Drop files here or click to upload</p><p style={{ color:'#1f2937', fontSize:11, margin:'4px 0 0' }}>Multiple files supported</p></>
          }
        </div>

        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, marginBottom:12 }}>
            <AlertCircle size={13} color="#f87171" />
            <p style={{ fontSize:12, color:'#f87171', margin:0 }}>{error}</p>
          </div>
        )}

        {/* File list */}
        {loading ? (
          <p style={{ color:'#374151', fontSize:13, textAlign:'center', padding:'24px 0' }}>Loading your files…</p>
        ) : files.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 20px', background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:14 }}>
            <p style={{ color:'#1f2937', fontSize:13, margin:0 }}>No files yet. Upload something above.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:8 }}>
            {files.map((f, i) => (
              <div key={f.id || i} style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, overflow:'hidden' }}>
                <div style={{ height:100, background:'#080808', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {f.url && f.mime_type?.startsWith('image/')
                    ? <img src={f.url} alt={f.filename} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <FileIcon mime={f.mime_type} />
                  }
                </div>
                <div style={{ padding:'8px 10px' }}>
                  <p style={{ fontSize:11, fontWeight:600, color:'#9ca3af', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.filename || f.name || 'File'}</p>
                  <p style={{ fontSize:10, color:'#374151', margin:'2px 0 0' }}>{f.size_kb ? `${f.size_kb}KB` : ''} {f.mime_type?.split('/')[1] || ''}</p>
                  <div style={{ display:'flex', gap:4, marginTop:6 }}>
                    {f.url && (
                      <a href={f.url} download target="_blank" rel="noopener noreferrer"
                        style={{ flex:1, padding:'4px', borderRadius:6, fontSize:10, background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', color:'#a78bfa', textAlign:'center', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
                        <Download size={10}/> Save
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
