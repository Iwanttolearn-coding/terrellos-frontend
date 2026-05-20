import { useState, useCallback } from 'react';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';

const STYLES = [
  { id: 'concept',        label: 'Concept Art',      emoji: '🎨', desc: 'Full rendered tattoo art' },
  { id: 'stencil',        label: 'Stencil / Outline', emoji: '📋', desc: 'Transfer-ready black outlines' },
  { id: 'blackwork',      label: 'Blackwork',         emoji: '⚫', desc: 'Bold solid black fills' },
  { id: 'realism',        label: 'Black & Grey',      emoji: '🩶', desc: 'Photorealistic shading' },
  { id: 'fineline',       label: 'Fine Line',         emoji: '✏️', desc: 'Delicate thin lines' },
  { id: 'neotraditional', label: 'Neo Traditional',   emoji: '🌹', desc: 'Bold outlines + rich color' },
  { id: 'japanese',       label: 'Japanese / Irezumi',emoji: '🐉', desc: 'Traditional Irezumi style' },
  { id: 'geometric',      label: 'Geometric',         emoji: '🔷', desc: 'Sacred geometry + dotwork' },
];

const PLACEMENTS = [
  { id: 'sleeve', label: 'Full Sleeve' }, { id: 'forearm', label: 'Forearm' },
  { id: 'chest', label: 'Chest Piece' }, { id: 'back', label: 'Full Back' },
  { id: 'leg', label: 'Leg / Thigh' }, { id: 'neck', label: 'Neck' },
  { id: 'hand', label: 'Hand' }, { id: 'ribcage', label: 'Ribcage' },
];

const QUICK_PROMPTS = [
  'Japanese dragon sleeve with cherry blossoms',
  'Christian lion with crown of thorns and cross',
  'Black and grey realism wolf howling at moon',
  'Tribal geometric forearm band',
  'Cyberpunk skull with circuit board details',
  'Angel warrior with sword and wings',
  'Koi fish in waves Japanese style',
  'Sacred heart with roses and daggers',
  'Phoenix rising from flames',
  'Mandala with geometric patterns',
];

export default function TattooStudio() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('concept');
  const [placement, setPlacement] = useState('');
  const [colorMode, setColorMode] = useState('color');
  const [mode, setMode] = useState('generate'); // generate | outline | variations | vectorize
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedToVault, setSavedToVault] = useState(false);

  const API = BACKEND_BASE_URL;
  const APP_ID = import.meta.env.VITE_APP_ID || 'terrellos';
  const headers = { 'Content-Type': 'application/json', 'X-App-ID': APP_ID };

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(null); setResult(null); setSavedToVault(false);
    try {
      let endpoint = '/v1/tattoo/generate';
      let body = { prompt, style, placement: placement || undefined, color_mode: colorMode, quality: 'hd' };
      if (mode === 'outline') { endpoint = '/v1/tattoo/outline'; body = { prompt, placement: placement || undefined }; }
      if (mode === 'variations') { endpoint = '/v1/tattoo/variations'; body = { prompt, count: 3 }; }
      if (mode === 'vectorize') { endpoint = '/v1/tattoo/vectorize'; body = { description: prompt, output_format: 'svg' }; }

      const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || 'Generation failed');
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [prompt, style, placement, colorMode, mode, API]);

  const saveToVault = useCallback(async () => {
    if (!result?.image_url) return;
    try {
      await fetch(`${API}/v1/gallery/save`, {
        method: 'POST', headers,
        body: JSON.stringify({
          user_id: 'founder', app_id: APP_ID,
          title: prompt.slice(0, 60),
          prompt, image_url: result.image_url,
          type: mode === 'outline' ? 'tattoo_stencil' : 'tattoo_concept',
          style, tags: [style, colorMode, placement].filter(Boolean),
        }),
      });
      setSavedToVault(true);
    } catch (e) { console.error('Vault save failed', e); }
  }, [result, prompt, style, colorMode, mode, placement, API]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🎯</span>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                AI Tattoo Studio
              </h1>
              <p className="text-gray-400 text-sm">Concept art · Stencils · Vectors · Variations · Powered by TerrellOS</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT — Controls */}
          <div className="space-y-6">
            {/* Mode Tabs */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Generation Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'generate',  label: '🎨 Concept Art' },
                  { id: 'outline',   label: '📋 Stencil' },
                  { id: 'variations',label: '🔄 Variations' },
                  { id: 'vectorize', label: '📐 Vectorize' },
                ].map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      mode === m.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Your Tattoo Idea</p>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your tattoo... (e.g. Japanese dragon sleeve with cherry blossoms)"
                className="w-full bg-gray-800 rounded-xl p-3 text-white text-sm resize-none border border-gray-700 focus:border-purple-500 focus:outline-none"
                rows={3}
              />
              {/* Quick prompts */}
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Quick ideas:</p>
                <div className="flex flex-wrap gap-1">
                  {QUICK_PROMPTS.slice(0, 5).map(p => (
                    <button key={p} onClick={() => setPrompt(p)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-1 rounded-lg transition-all">
                      {p.slice(0, 30)}…
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Style Selector */}
            {mode === 'generate' && (
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Style</p>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        style === s.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}>
                      <div className="flex items-center gap-2">
                        <span>{s.emoji}</span>
                        <div>
                          <p className="text-xs font-medium text-white">{s.label}</p>
                          <p className="text-xs text-gray-500">{s.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Placement + Color Mode */}
            {mode !== 'vectorize' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Placement</p>
                  <select value={placement} onChange={e => setPlacement(e.target.value)}
                    className="w-full bg-gray-800 text-white text-sm rounded-xl p-2 border border-gray-700 focus:outline-none focus:border-purple-500">
                    <option value="">Any placement</option>
                    {PLACEMENTS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Color Mode</p>
                  <select value={colorMode} onChange={e => setColorMode(e.target.value)}
                    className="w-full bg-gray-800 text-white text-sm rounded-xl p-2 border border-gray-700 focus:outline-none focus:border-purple-500">
                    <option value="color">Full Color</option>
                    <option value="blackgrey">Black & Grey</option>
                    <option value="blackwork">Blackwork Only</option>
                  </select>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button onClick={generate} disabled={loading || !prompt.trim()}
              className="w-full py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:via-pink-500 hover:to-orange-400
                shadow-lg shadow-purple-500/20">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                <span>✨ Generate {mode === 'outline' ? 'Stencil' : mode === 'variations' ? 'Variations' : mode === 'vectorize' ? 'Vector Guide' : 'Tattoo'}</span>
              )}
            </button>
          </div>

          {/* RIGHT — Results */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4">
                <p className="text-red-400 text-sm">❌ {error}</p>
              </div>
            )}

            {result && (
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                {/* Single image result */}
                {result.image_url && (
                  <div>
                    <img src={result.image_url} alt={prompt}
                      className="w-full aspect-square object-cover" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{prompt.slice(0, 60)}{prompt.length > 60 ? '...' : ''}</p>
                          <p className="text-gray-500 text-xs mt-1">{result.style} · {result.type}</p>
                        </div>
                        <div className="flex gap-2">
                          <a href={result.image_url} download target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-all">
                            ⬇️ Save
                          </a>
                          <button onClick={saveToVault} disabled={savedToVault}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                              savedToVault ? 'bg-green-700 text-green-200' : 'bg-purple-700 hover:bg-purple-600 text-white'
                            }`}>
                            {savedToVault ? '✅ Saved' : '🗄️ Vault'}
                          </button>
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => { setMode('outline'); generate(); }}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-2 rounded-lg transition-all">
                          📋 Make Stencil
                        </button>
                        <button onClick={() => { setMode('vectorize'); generate(); }}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-2 rounded-lg transition-all">
                          📐 Vectorize
                        </button>
                        <button onClick={generate}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-2 rounded-lg transition-all">
                          🔄 Regenerate
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Variations result */}
                {result.variations && (
                  <div className="p-4">
                    <p className="text-white font-medium mb-3">3 Style Variations</p>
                    <div className="grid grid-cols-1 gap-4">
                      {result.variations.map((v, i) => (
                        <div key={i} className="bg-gray-800 rounded-xl overflow-hidden">
                          {v.image_url ? (
                            <>
                              <img src={v.image_url} alt={v.style} className="w-full aspect-square object-cover" />
                              <div className="p-3 flex items-center justify-between">
                                <span className="text-white text-sm font-medium capitalize">{v.style}</span>
                                <a href={v.image_url} download target="_blank" rel="noopener noreferrer"
                                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-lg">⬇️</a>
                              </div>
                            </>
                          ) : (
                            <p className="p-3 text-red-400 text-xs">{v.style}: {v.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vector guide result */}
                {result.vector_guide && (
                  <div className="p-4">
                    <p className="text-white font-medium mb-3">📐 Vector Production Guide</p>
                    <div className="bg-gray-800 rounded-xl p-4">
                      <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">{result.vector_guide}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!result && !loading && !error && (
              <div className="bg-gray-900 rounded-2xl border border-dashed border-gray-700 p-12 flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-4">🎯</span>
                <p className="text-gray-400 font-medium">Your tattoo design will appear here</p>
                <p className="text-gray-600 text-sm mt-2">Describe it above and hit Generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
