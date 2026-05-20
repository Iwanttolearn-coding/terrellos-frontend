/**
 * TattooStudio.jsx — TerrellOS AI Tattoo Studio
 * Wired to /v1/tattoo/generate on the live backend.
 */
import { useState } from 'react';
import { Loader2, Download, RefreshCw, Wand2, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';

const STYLES = [
  { id: 'blackwork',   label: 'Blackwork',      emoji: '⬛' },
  { id: 'japanese',    label: 'Japanese',        emoji: '🌸' },
  { id: 'geometric',   label: 'Geometric',       emoji: '🔷' },
  { id: 'fineline',    label: 'Fine Line',       emoji: '✒️' },
  { id: 'traditional', label: 'Traditional',     emoji: '⚓' },
  { id: 'watercolor',  label: 'Watercolor',      emoji: '🎨' },
  { id: 'tribal',      label: 'Tribal',          emoji: '🗿' },
  { id: 'realism',     label: 'Realism',         emoji: '📷' },
  { id: 'stencil',     label: 'Stencil/Outline', emoji: '📋' },
];

const PLACEMENTS = ['Forearm','Upper Arm','Back','Chest','Calf','Thigh','Shoulder','Neck','Wrist','Ribcage'];

export default function TattooStudio() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('blackwork');
  const [placement, setPlacement] = useState('Forearm');
  const [size, setSize] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      // Try /v1/tattoo/generate first, fall back to /v1/images/generate
      let res = null;
      try {
        const r = await fetch(`${BACKEND_BASE_URL}/v1/tattoo/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-App-ID': 'terrellos' },
          body: JSON.stringify({ prompt, style, placement, size }),
          signal: AbortSignal.timeout(60000),
        });
        if (r.ok) res = await r.json();
      } catch {}

      if (!res) {
        const r2 = await fetch(`${BACKEND_BASE_URL}/v1/images/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-App-ID': 'terrellos' },
          body: JSON.stringify({
            prompt: `Tattoo design: ${prompt}. Style: ${style}. Clean tattoo artwork, high contrast, suitable for skin. Black and white outline, professional tattoo quality.`,
            quality: 'hd',
          }),
          signal: AbortSignal.timeout(60000),
        });
        if (!r2.ok) throw new Error(`Generation failed: HTTP ${r2.status}`);
        res = await r2.json();
      }

      const imgUrl = res?.image_url || res?.url || res?.data?.[0]?.url;
      if (!imgUrl) throw new Error('No image URL returned from backend');

      const entry = { url: imgUrl, prompt, style, placement, ts: Date.now() };
      setResult(entry);
      setHistory(prev => [entry, ...prev].slice(0, 8));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const download = (url, name) => {
    const a = document.createElement('a'); a.href = url;
    a.download = name || `terrellos-tattoo-${Date.now()}.png`; a.click();
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Tattoo Studio</h1>
          <p className="text-xs text-muted-foreground">DALL-E 3 · terrellos-backend.fly.dev</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          {/* Prompt */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Describe Your Tattoo</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              rows={4} placeholder="e.g. a fierce dragon wrapping around a lotus flower, with smoke and flames…"
              className="w-full bg-card border border-border focus:border-orange-500/50 text-foreground text-sm rounded-xl px-4 py-3 focus:outline-none resize-none transition-colors" />
          </div>

          {/* Style */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={cn('text-xs px-2 py-2 rounded-xl border transition-all text-left',
                    style === s.id
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                      : 'bg-card border-border text-muted-foreground hover:border-orange-500/30')}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Placement + Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Placement</label>
              <select value={placement} onChange={e => setPlacement(e.target.value)}
                className="w-full bg-card border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors">
                {PLACEMENTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Size</label>
              <select value={size} onChange={e => setSize(e.target.value)}
                className="w-full bg-card border border-border text-foreground rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50 transition-colors">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large / Sleeve</option>
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">{error}</p>}

          <button onClick={generate} disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-rose-700 hover:from-orange-500 hover:to-rose-600 disabled:opacity-40 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating… (~30s)</> : <><Wand2 className="w-4 h-4" /> Generate Tattoo</>}
          </button>
        </div>

        {/* Result */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Creating your tattoo design…</p>
                <p className="text-xs text-muted-foreground opacity-60">DALL-E 3 · up to 30 seconds</p>
              </div>
            ) : result ? (
              <img src={result.url} alt={result.prompt}
                className="w-full h-full object-contain rounded-2xl" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <Image className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Your tattoo will appear here</p>
              </div>
            )}
          </div>

          {result && (
            <div className="flex gap-2">
              <button onClick={() => download(result.url)}
                className="flex-1 flex items-center justify-center gap-2 bg-card border border-border hover:border-orange-500/40 text-muted-foreground hover:text-foreground py-2.5 rounded-xl text-sm transition-all">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={generate}
                className="flex items-center gap-2 bg-card border border-border hover:border-orange-500/40 text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl text-sm transition-all">
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Recent generations</p>
              <div className="grid grid-cols-4 gap-2">
                {history.slice(1).map((h, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:border-orange-500/40 transition-colors"
                    onClick={() => setResult(h)}>
                    <img src={h.url} alt={h.prompt} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
