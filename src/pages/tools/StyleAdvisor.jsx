/**
 * StyleAdvisor.jsx — TerrellOS
 * Route: /tools/style-advisor
 * AI-powered design style recommendations via GPT-4o.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Send, RefreshCw } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = 'terrellos';

const STYLE_CATEGORIES = [
  '🎨 Tattoo Design', '👕 DTF / Screen Print', '🖼️ Digital Art', '📱 UI / App Design',
  '📦 Product Packaging', '🏷️ Logo / Brand', '🖨️ Print Production', '✏️ Illustration',
];

const QUICK_PROMPTS = [
  'What tattoo style suits a wolf + geometric design?',
  'Best color palette for a dark streetwear brand?',
  'How do I make my DTF designs more vibrant?',
  'Recommend fonts for a luxury tattoo studio brand',
  'What's trending in blackwork tattoo design?',
];

export default function StyleAdvisor() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [prompt,   setPrompt]   = useState('');
  const [advice,   setAdvice]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const getAdvice = async (questionOverride) => {
    const question = questionOverride || prompt.trim();
    if (!question) { setError('Describe what you need advice on.'); return; }
    setError(''); setAdvice(''); setLoading(true);

    try {
      const systemPrompt = `You are an expert creative director specializing in tattoo art, DTF printing, streetwear design, and visual branding. You give concise, actionable style advice.${category ? ` The user is working on: ${category}.` : ''} Use markdown-style formatting with bold labels and bullet points. Keep responses focused and practical — 150-250 words max.`;

      const r = await fetch(`${BACKEND}/v1/core/chat`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'X-App-ID':APP_ID },
        body: JSON.stringify({
          message: question,
          system_prompt: systemPrompt,
          max_tokens: 400,
          app_id: APP_ID,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) { const t = await r.text(); throw new Error(`HTTP ${r.status}: ${t.slice(0,80)}`); }
      const data = await r.json();
      setAdvice(data.reply || data.response || data.message || '');
    } catch (e) {
      setError(`Could not get advice: ${e.message?.slice(0,80)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#030007', padding:'20px 16px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ fontSize:12, color:'#4b5563', background:'none', border:'none', cursor:'pointer', marginBottom:20, padding:0 }}>
          <ArrowLeft size={13} style={{ verticalAlign:'middle', marginRight:4 }} />Back
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#db2777,#9d174d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✨</div>
          <div>
            <h1 style={{ fontSize:20, fontWeight:900, color:'white', margin:0 }}>Style Advisor</h1>
            <p style={{ fontSize:12, color:'#4b5563', margin:0 }}>AI-powered creative direction · GPT-4o</p>
          </div>
        </div>

        {/* Category chips */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {STYLE_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(category === cat ? '' : cat)}
              style={{ padding:'5px 10px', borderRadius:20, fontSize:11, fontWeight:600, cursor:'pointer', border:`1px solid ${category === cat ? 'rgba(219,39,119,0.5)' : '#1f2937'}`, background: category === cat ? 'rgba(219,39,119,0.12)' : '#0a0a0a', color: category === cat ? '#f472b6' : '#4b5563', transition:'all 0.15s' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); getAdvice(); } }}
            placeholder="Ask for style advice, color palette recommendations, design direction…"
            rows={3}
            style={{ flex:1, background:'#0a0a0a', border:'1px solid #1f2937', borderRadius:10, padding:'10px 12px', fontSize:13, color:'white', resize:'none', outline:'none', lineHeight:1.6 }}
          />
          <button onClick={() => getAdvice()} disabled={loading || !prompt.trim()}
            style={{ width:44, borderRadius:10, border:'none', background: loading || !prompt.trim() ? '#111' : 'linear-gradient(135deg,#db2777,#9d174d)', color:'white', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {loading ? <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> : <Send size={14}/>}
          </button>
        </div>

        {/* Quick prompts */}
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:10, color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:2, marginBottom:8 }}>Quick questions</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {QUICK_PROMPTS.map(q => (
              <button key={q} onClick={() => { setPrompt(q); getAdvice(q); }}
                style={{ padding:'5px 10px', borderRadius:20, fontSize:11, background:'#0a0a0a', border:'1px solid #1a1a1a', color:'#6b7280', cursor:'pointer', hover:'color:white' }}>
                {q.slice(0,40)}…
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding:'10px 14px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:10, marginBottom:12 }}>
            <p style={{ fontSize:12, color:'#f87171', margin:0 }}>{error}</p>
          </div>
        )}

        {/* Advice output */}
        {advice && (
          <div style={{ background:'#0a0a0a', border:'1px solid rgba(219,39,119,0.2)', borderRadius:14, padding:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <Sparkles size={13} color="#f472b6" />
              <span style={{ fontSize:11, color:'#f472b6', fontWeight:700 }}>STYLE ADVICE</span>
              <button onClick={() => { setAdvice(''); setPrompt(''); setCategory(''); }}
                style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#374151', display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                <RefreshCw size={11}/> New
              </button>
            </div>
            <div style={{ fontSize:13, color:'#d1d5db', lineHeight:1.8, whiteSpace:'pre-wrap' }}>
              {advice}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
