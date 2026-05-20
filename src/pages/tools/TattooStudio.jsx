/**
 * TattooStudio.jsx — TM Dezigns AI Designer
 * Real DALL-E 3 tattoo generation. Auto-saves to Creator Vault.
 * No fake data. Real loading/error/retry states.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import { Loader2, Download, RefreshCw, Scissors, Image, Lock, Zap, Star, LayoutGrid } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = import.meta.env.VITE_APP_ID || 'terrellos';

const STYLES = [
  { id: 'blackwork',   label: 'Blackwork',      emoji: '⬛', hint: 'Bold solid black, high contrast' },
  { id: 'fineline',    label: 'Fine Line',      emoji: '✒️', hint: 'Delicate thin lines, minimalist' },
  { id: 'japanese',    label: 'Japanese',        emoji: '🌸', hint: 'Traditional irezumi, bold colors' },
  { id: 'geometric',   label: 'Geometric',       emoji: '🔷', hint: 'Sacred geometry, symmetrical' },
  { id: 'traditional', label: 'Traditional',     emoji: '⚓', hint: 'Old school bold outlines' },
  { id: 'watercolor',  label: 'Watercolor',      emoji: '🎨', hint: 'Soft color splashes, painterly' },
  { id: 'tribal',      label: 'Tribal',          emoji: '🗿', hint: 'Cultural patterns, thick lines' },
  { id: 'realism',     label: 'Realism',         emoji: '📷', hint: 'Photorealistic shading' },
  { id: 'stencil',     label: 'Stencil/Outline', emoji: '📋', hint: 'Clean outline only, print-ready' },
  { id: 'neo_trad',    label: 'Neo-Traditional', emoji: '🦁', hint: 'Bold lines, modern colors' },
];

const PLACEMENTS = ['Forearm','Upper Arm','Full Sleeve','Back','Chest','Calf','Thigh','Shoulder','Neck','Wrist','Ribcage','Hand'];
const SIZES = [
  { val: 'small',  label: 'Small', hint: '2–4 inch' },
  { val: 'medium', label: 'Medium', hint: '4–8 inch' },
  { val: 'large',  label: 'Large', hint: '8–16 inch / sleeve' },
];

export default function TattooStudio() {
  const { user } = useAuth();
  const access = resolveUserAccess(user);
  const userId = user?.email || user?.id || 'guest';

  const [prompt,    setPrompt]    = useState('');
  const [style,     setStyle]     = useState('blackwork');
  const [placement, setPlacement] = useState('Forearm');
  const [size,      setSize]      = useState('medium');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [saved,     setSaved]     = useState(false);
  const [history,   setHistory]   = useState([]);

  if (!access.toolsEnabled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-orange-400" />
          </div>
          <h2 className="text-2xl font-black text-white">Tattoo Studio</h2>
          <p className="text-gray-400 text-sm">Upgrade to unlock AI tattoo generation with custom styles, placements, and sizes.</p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-rose-700 text-white font-bold hover:opacity-90 transition-opacity">
            <Zap className="w-4 h-4" /> Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setResult(null); setSaved(false);
    try {
      const res = await fetch(`${BACKEND}/v1/tattoo/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-ID': APP_ID },
        body: JSON.stringify({ prompt: prompt.trim(), style, placement, size, app_id: APP_ID }),
        signal: AbortSignal.timeout(90000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
      const url = data.image_url || data.url || data.images?.[0]?.url;
      if (!url) throw new Error('No image returned');
      const entry = { url, prompt: prompt.trim(), style, placement, size, ts: Date.now() };
      setResult(entry);
      setHistory(prev => [entry, ...prev].slice(0, 12));
      // Auto-save to vault
      autoSaveToVault(url, prompt.trim(), style);
    } catch (e) {
      setError(e.name === 'AbortError' ? 'Generation timed out — try again' : e.message);
    }
    setLoading(false);
  };

  const autoSaveToVault = async (imageUrl, promptText, styleId) => {
    try {
      await fetch(`${BACKEND}/v1/gallery/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-ID': APP_ID },
        body: JSON.stringify({
          user_id: userId, app_id: APP_ID,
          image_url: imageUrl,
          title: promptText.slice(0, 50),
          type: 'tattoo_concept',
          metadata: { style: styleId, placement, size, source: 'tattoo_studio' },
        }),
      });
      setSaved(true);
    } catch {}
  };

  const download = (url) => {
    const a = document.createElement('a');
    a.href = url; a.download = `tm-dezigns-tattoo-${style}-${Date.now()}.png`; a.target = '_blank'; a.click();
  };

  const styleObj = STYLES.find(s => s.id === style) || STYLES[0];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-600 to-rose-800 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">AI Tattoo Studio</h1>
            <p className="text-xs text-gray-500">TM Dezigns · DALL-E 3 · Auto-saves to Creator Vault</p>
          </div>
        </div>
        <Link to="/tools/creator-vault"
          className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-xl transition-all">
          <LayoutGrid className="w-3.5 h-3.5" /> My Vault
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">

            {/* Prompt */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Describe Your Tattoo</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                rows={3} disabled={loading}
                placeholder="e.g. A fierce wolf howling at the moon, surrounded by pine trees and geometric patterns…"
                className="w-full bg-gray-800 border border-gray-700 focus:border-orange-500/50 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors resize-none disabled:opacity-50" />
            </div>

            {/* Style grid */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Style · <span className="text-orange-400">{styleObj.emoji} {styleObj.label}</span></label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)} disabled={loading}
                    title={s.hint}
                    className={`text-xs px-2 py-2.5 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                      style === s.id
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500/30'
                    }`}>
                    <span className="text-base">{s.emoji}</span>
                    <span className="leading-tight text-center">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Placement + Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Placement</label>
                <select value={placement} onChange={e => setPlacement(e.target.value)} disabled={loading}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-50">
                  {PLACEMENTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Size</label>
                <div className="space-y-1">
                  {SIZES.map(s => (
                    <button key={s.val} onClick={() => setSize(s.val)} disabled={loading}
                      className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        size === s.val
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-200'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500/30'
                      }`}>
                      <span className="font-medium">{s.label}</span>
                      <span className="text-gray-600 ml-1">· {s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-red-400">{error}</p>
                <button onClick={generate} className="flex items-center gap-1 text-xs text-red-300 hover:text-white">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            <button onClick={generate} disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-rose-700 hover:from-orange-500 hover:to-rose-600 disabled:opacity-40 text-white py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-orange-500/20">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating… (up to 45s)</>
                : <><Scissors className="w-4 h-4" /> Generate Tattoo</>}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Scissors className="w-7 h-7 text-orange-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Creating your design…</p>
                  <p className="text-xs text-gray-600 mt-1">{styleObj.label} · {placement} · {size}</p>
                </div>
                <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-600 to-rose-600 rounded-full animate-pulse" style={{width:'70%'}} />
                </div>
                <p className="text-xs text-gray-700">DALL-E 3 · ~30–45 seconds</p>
              </div>
            ) : result ? (
              <img src={result.url} alt={result.prompt} className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <Scissors className="w-12 h-12 text-gray-800" />
                <p className="text-sm text-gray-600">Your tattoo design will appear here</p>
                <p className="text-xs text-gray-700">Pick a style, describe your concept, and generate</p>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => download(result.url)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button onClick={generate}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 text-orange-300 py-2.5 rounded-xl text-sm font-medium transition-all">
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </button>
              </div>
              {saved && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 text-xs text-green-400">
                  <Star className="w-3 h-3" /> Auto-saved to your Creator Vault
                </div>
              )}
            </div>
          )}

          {/* Session history */}
          {history.length > 1 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">This session ({history.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {history.slice(1, 9).map((h, i) => (
                  <button key={i} onClick={() => { setResult(h); setSaved(false); }}
                    className="aspect-square rounded-xl overflow-hidden border border-gray-800 hover:border-orange-500/40 transition-all">
                    <img src={h.url} alt={h.prompt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
