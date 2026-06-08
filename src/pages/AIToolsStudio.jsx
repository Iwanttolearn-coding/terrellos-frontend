/**
 * AIToolsStudio.jsx — TerrellOS
 * Real AI image generation via terrellos-backend.fly.dev
 * No fake results. No demo mode. Loading/error/retry states.
 */
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import { Image, Loader2, Download, RefreshCw, Lock, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = import.meta.env.VITE_APP_ID || 'terrellos';

const STYLE_PRESETS = [
  { label: 'Realistic',    val: 'photorealistic, ultra-detailed, professional photography' },
  { label: 'Tattoo Art',   val: 'black and grey tattoo art, fine line, professional tattoo design' },
  { label: 'Watercolor',   val: 'watercolor illustration, soft edges, artistic, painterly' },
  { label: 'Minimalist',   val: 'minimalist, clean lines, simple, modern design' },
  { label: 'Vintage',      val: 'vintage retro style, aged, classic Americana, old school' },
  { label: 'Digital Art',  val: 'digital concept art, vibrant, detailed, trending on artstation' },
  { label: 'DTF Print',    val: 'DTF print-ready design, vector style, 8 colors max, transparent background' },
  { label: 'Custom',       val: '' },
];

const SIZE_OPTIONS = [
  { label: 'Square 1:1',      val: '1024x1024' },
  { label: 'Portrait 2:3',    val: '1024x1536' },
  { label: 'Landscape 3:2',   val: '1536x1024' },
];

export default function AIToolsStudio() {
  const { user } = useAuth();
  const access = resolveUserAccess(user);

  const [prompt, setPrompt]     = useState('');
  const [style, setStyle]       = useState(STYLE_PRESETS[0]);
  const [size, setSize]         = useState(SIZE_OPTIONS[0].val);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [history, setHistory]   = useState([]);

  // Gate for non-subscribers
  if (!access.toolsEnabled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-violet-400" />
          </div>
          <h2 className="text-2xl font-black text-white">AI Studio Access Required</h2>
          <p className="text-gray-400 text-sm">Upgrade to unlock AI image generation, tattoo patterns, and all creative tools.</p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold hover:opacity-90 transition-opacity">
            <Zap className="w-4 h-4" /> Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  const generate = async () => {
    const fullPrompt = style.val
      ? `${prompt.trim()}, ${style.val}`
      : prompt.trim();
    if (!fullPrompt) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${BACKEND}/v1/design/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-ID': APP_ID },
        body: JSON.stringify({ prompt: fullPrompt, size, quality: 'standard', app_id: APP_ID }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || `Error ${res.status}`);
      const url = data.image_url || data.images?.[0]?.url;
      if (!url) throw new Error("No image returned from API");
      if (!url) throw new Error('No image returned from API');
      const entry = { url, prompt: fullPrompt, style: style.label, timestamp: new Date().toLocaleTimeString() };
      setResult(entry);
      setHistory(prev => [entry, ...prev].slice(0, 20));
    } catch (e) {
      setError(e.name === 'AbortError' ? 'Generation timed out — try again' : e.message);
    }
    setLoading(false);
  };

  const download = (url, filename = 'tm-dezigns-ai') => {
    const a = document.createElement('a');
    if (url.startsWith('data:image')) {
      a.href = url; a.download = `${filename}-${Date.now()}.jpg`; a.click();
    } else {
      a.href = url; a.download = `${filename}-${Date.now()}.png`;
      a.target = '_blank'; a.click();
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">AI Image Studio</h1>
          <p className="text-xs text-gray-500">TerrellOS · Powered by DALL-E 3</p>
        </div>
        {access.founder && (
          <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">👑 Founder</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            {/* Prompt */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Describe your design</label>
              <textarea
                value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. A fierce lion with crown, smoke effect, dark background…"
                rows={4} disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500/50 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Style presets */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLE_PRESETS.map(s => (
                  <button key={s.label} onClick={() => setStyle(s)} disabled={loading}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${style.label === s.label ? 'bg-violet-600/30 border-violet-500/50 text-violet-200' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              {style.label === 'Custom' && (
                <input value={style.val} onChange={e => setStyle({ label: 'Custom', val: e.target.value })}
                  placeholder="Describe custom style…" disabled={loading}
                  className="mt-2 w-full bg-gray-800 border border-gray-700 focus:border-violet-500/50 text-white placeholder-gray-600 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors" />
              )}
            </div>

            {/* Size */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Size</label>
              <div className="flex gap-2">
                {SIZE_OPTIONS.map(s => (
                  <button key={s.val} onClick={() => setSize(s.val)} disabled={loading}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${size === s.val ? 'bg-violet-600/30 border-violet-500/50 text-violet-200' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-red-400">{error}</p>
                <button onClick={generate} className="text-xs text-red-300 hover:text-white transition-colors flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            <button onClick={generate} disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white py-3.5 rounded-xl font-bold transition-all active:scale-95">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Image</>}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Generating your design…</p>
                <p className="text-xs text-gray-500 mt-1">DALL-E 3 · ~20 seconds</p>
              </div>
              <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          ) : result ? (
            <div>
              <img src={result.url} alt={result.prompt} className="w-full object-cover" />
                {data?.provider && <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white uppercase tracking-wide">{result.provider || "ai"}</span>}
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-400 line-clamp-2">{result.prompt}</p>
                <div className="flex gap-2">
                  <button onClick={() => download(result.url, 'tm-dezigns')}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white py-2 rounded-xl text-xs font-medium transition-all">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button onClick={generate}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 py-2 rounded-xl text-xs font-medium transition-all">
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center gap-3 text-center px-6">
              <Image className="w-12 h-12 text-gray-700" />
              <p className="text-sm text-gray-500">Your generated image will appear here</p>
              <p className="text-xs text-gray-700">Describe your design above and hit Generate</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">This Session ({history.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {history.map((item, i) => (
              <div key={i} className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all">
                <img src={item.url} alt={item.prompt} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-gray-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-xs text-white text-center line-clamp-2">{item.prompt.slice(0,60)}</p>
                  <button onClick={() => download(item.url, `tm-dezigns-${i}`)}
                    className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-lg transition-all">
                    <Download className="w-3 h-3" /> Save
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600">{item.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}