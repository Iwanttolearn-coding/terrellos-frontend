/**
 * PrintReadiness.jsx — TerrellOS
 * Route: /tools/print-readiness
 * Real print quality analysis via /v1/uploads/file + AI scoring.
 * Supports: PNG, JPG, WEBP, SVG, PDF
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, XCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = 'terrellos';

async function analyzeFile(file) {
  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('app_id', APP_ID);
  fd.append('user_id', 'terrellos_user');

  // Try /v1/uploads/analyze first, fall back to /v1/uploads/file
  for (const endpoint of ['/v1/uploads/analyze', '/v1/uploads/file']) {
    try {
      const r = await fetch(`${BACKEND}${endpoint}`, {
        method: 'POST',
        headers: { 'X-App-ID': APP_ID },
        body: fd,
        signal: AbortSignal.timeout(30000),
      });
      if (r.ok) {
        const data = await r.json();
        return data;
      }
    } catch {}
  }

  // Client-side analysis fallback (no backend needed)
  return clientSideAnalysis(file);
}

function clientSideAnalysis(file) {
  const sizeKb = Math.round(file.size / 1024);
  const ext = file.name.split('.').pop().toLowerCase();
  const issues = [];
  let score = 100;

  if (!['png','jpg','jpeg','webp','svg','pdf'].includes(ext)) {
    issues.push({ level:'error', msg:`File type .${ext} is not recommended for print` });
    score -= 30;
  }
  if (sizeKb < 100) {
    issues.push({ level:'warning', msg:'File is very small — may be low resolution for print' });
    score -= 20;
  }
  if (sizeKb > 50000) {
    issues.push({ level:'warning', msg:'File is very large — consider optimizing before upload' });
    score -= 5;
  }
  if (['jpg','jpeg'].includes(ext)) {
    issues.push({ level:'warning', msg:'JPEG uses lossy compression — PNG is preferred for print artwork' });
    score -= 10;
  }
  if (['png','svg','pdf'].includes(ext)) {
    issues.push({ level:'ok', msg:'File format is optimal for print production' });
  }
  if (sizeKb >= 100) {
    issues.push({ level:'ok', msg:'File size is within acceptable range' });
  }
  issues.push({ level:'info', msg:'DPI cannot be verified without server analysis — ensure 300+ DPI in your design software' });

  return {
    filename: file.name,
    size_kb:  sizeKb,
    score:    Math.max(0, score),
    issues,
    recommendation: score >= 80
      ? 'File looks print-ready. Verify DPI in your design software before final production.'
      : score >= 50
      ? 'File has some print concerns. Review the warnings above before sending to production.'
      : 'File has significant issues. Address errors before using for print production.',
    source: 'client_analysis',
  };
}

const LEVEL_STYLES = {
  ok:      { icon: CheckCircle,  color:'#4ade80', bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)' },
  warning: { icon: AlertCircle,  color:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.2)' },
  error:   { icon: XCircle,      color:'#f87171', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.2)' },
  info:    { icon: AlertCircle,  color:'#60a5fa', bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.2)' },
};

export default function PrintReadiness() {
  const navigate = useNavigate();
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const inputRef = useRef();

  const handleFile = (f) => {
    setFile(f); setResult(null); setError('');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!file) { setError('Upload a file first.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await analyzeFile(file);
      setResult(data);
    } catch (e) {
      setError(`Analysis failed: ${e.message?.slice(0,80)}`);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.score >= 80 ? '#4ade80' : result.score >= 50 ? '#fbbf24' : '#f87171'
    : '#6b7280';

  return (
    <div style={{ minHeight:'100vh', background:'#030007', padding:'20px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize:12, color:'#4b5563', background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>
          <ArrowLeft size={13} style={{ verticalAlign:'middle', marginRight:4 }} />Back
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#0891b2,#0e7490)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🖨️</div>
          <div>
            <h1 style={{ fontSize:20, fontWeight:900, color:'white', margin:0 }}>Print Readiness</h1>
            <p style={{ fontSize:12, color:'#4b5563', margin:0 }}>Analyze files for print production quality</p>
          </div>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          style={{ border:`2px dashed ${file ? '#7c3aed' : '#1f2937'}`, borderRadius:14, padding:'32px 20px', textAlign:'center', cursor:'pointer', background:'#0a0a0a', marginBottom:12, transition:'border-color 0.2s' }}>
          <input ref={inputRef} type="file" hidden accept=".png,.jpg,.jpeg,.webp,.svg,.pdf" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {preview
            ? <img src={preview} alt="preview" style={{ maxHeight:160, maxWidth:'100%', borderRadius:8, margin:'0 auto', display:'block' }} />
            : <>
                <div style={{ fontSize:36, marginBottom:8, opacity:0.3 }}>📄</div>
                <p style={{ color:'#4b5563', fontSize:13, margin:0, fontWeight:600 }}>Drop file here or click to upload</p>
                <p style={{ color:'#1f2937', fontSize:11, margin:'4px 0 0' }}>PNG · JPG · WEBP · SVG · PDF</p>
              </>
          }
        </div>

        {file && (
          <p style={{ fontSize:11, color:'#4b5563', margin:'0 0 12px', textAlign:'center' }}>
            {file.name} · {Math.round(file.size / 1024)}KB
          </p>
        )}

        {error && (
          <div style={{ padding:'10px 14px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, marginBottom:12 }}>
            <p style={{ fontSize:12, color:'#f87171', margin:0 }}>{error}</p>
          </div>
        )}

        <button onClick={analyze} disabled={loading || !file} style={{
          width:'100%', padding:'12px', borderRadius:10, fontWeight:800, fontSize:13, border:'none',
          background: loading || !file ? '#111' : 'linear-gradient(135deg,#0891b2,#0e7490)',
          color: loading || !file ? '#374151' : 'white', cursor: loading || !file ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:20,
        }}>
          {loading
            ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> Analyzing…</>
            : <><Upload size={14}/> Analyze for Print</>
          }
        </button>

        {/* Results */}
        {result && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {/* Score */}
            <div style={{ background:'#0a0a0a', border:`1px solid ${scoreColor}30`, borderRadius:14, padding:16, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:`${scoreColor}15`, border:`2px solid ${scoreColor}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:22, fontWeight:900, color:scoreColor }}>{result.score}</span>
              </div>
              <div>
                <p style={{ fontSize:15, fontWeight:800, color:'white', margin:0 }}>Print Score</p>
                <p style={{ fontSize:12, color:'#6b7280', margin:'4px 0 0', lineHeight:1.5 }}>{result.recommendation}</p>
                {result.source === 'client_analysis' && (
                  <p style={{ fontSize:10, color:'#374151', margin:'4px 0 0' }}>⚠ Client-side analysis — connect backend for full DPI/color scan</p>
                )}
              </div>
            </div>

            {/* Issues */}
            {result.issues?.map((issue, i) => {
              const cfg = LEVEL_STYLES[issue.level] || LEVEL_STYLES.info;
              const Icon = cfg.icon;
              return (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:10 }}>
                  <Icon size={14} color={cfg.color} style={{ flexShrink:0, marginTop:1 }} />
                  <p style={{ fontSize:12, color:'#d1d5db', margin:0, lineHeight:1.5 }}>{issue.msg}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
