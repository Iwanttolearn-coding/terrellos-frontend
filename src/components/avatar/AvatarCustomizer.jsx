/**
 * AvatarCustomizer.jsx — TerrellOS / TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * Xbox-style floating sidebar for real-time avatar customization.
 * Connected live to AvatarScene — every change updates the 3D scene instantly.
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Sun, Wind, Palette, Upload, Loader2, ChevronRight, X } from 'lucide-react';
import { generateMemorialImage } from '@/lib/api';
import { notify } from '@/components/NotificationCenter';

// ── Config definitions ─────────────────────────────────────────────
export const HALO_OPTIONS = [
  { id: 'Golden Crown',   color: '#ffd700', emoji: '👑' },
  { id: 'Neon Ring',      color: '#00ffff', emoji: '💠' },
  { id: 'Cosmic Arc',     color: '#ff6ec7', emoji: '🌀' },
  { id: 'Platinum Halo',  color: '#e8e8e8', emoji: '🪬' },
];

export const WING_OPTIONS = [
  { id: 'Ethereal Feather', color: '#a855f7', emoji: '🪶' },
  { id: 'Neon Blade',       color: '#06b6d4', emoji: '⚡' },
  { id: 'Crystal Drift',    color: '#67e8f9', emoji: '💎' },
  { id: 'Obsidian Flow',    color: '#6b21a8', emoji: '🖤' },
];

export const GLOW_OPTIONS = [
  { id: 'Purple Aura',   color: '#7c3aed', emoji: '🔮' },
  { id: 'Blue Plasma',   color: '#2563eb', emoji: '🌊' },
  { id: 'White Holy',    color: '#f0f9ff', emoji: '✨' },
  { id: 'Rose Gold',     color: '#f43f5e', emoji: '🌹' },
  { id: 'Emerald Echo',  color: '#10b981', emoji: '🌿' },
  { id: 'Gold Divine',   color: '#f59e0b', emoji: '☀️' },
];

export const DEFAULT_CONFIG = {
  halo:    HALO_OPTIONS[0],
  wings:   WING_OPTIONS[0],
  glow:    GLOW_OPTIONS[0],
  glbUrl:  null,
  aiScene: null, // AI-generated background URL
};

// ── Option Chip ────────────────────────────────────────────────────
function Chip({ item, selected, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
        selected
          ? 'bg-primary/25 border-primary text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
      }`}
    >
      <span>{item.emoji}</span>
      <span>{item.id}</span>
      {selected && (
        <motion.div
          layoutId="chip-indicator"
          className="w-1.5 h-1.5 rounded-full bg-primary ml-auto"
        />
      )}
    </motion.button>
  );
}

// ── Section ────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {children}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function AvatarCustomizer({ config, onChange, className = '' }) {
  const [generatingScene, setGeneratingScene] = useState(false);
  const [uploadingGlb,    setUploadingGlb]    = useState(false);

  const set = useCallback((key, value) => {
    onChange?.({ ...config, [key]: value });
  }, [config, onChange]);

  async function generateAIScene() {
    setGeneratingScene(true);
    const prompt = `Cinematic spiritual heavenly environment: ${config.glow.id} atmosphere, angelic light shafts, ${config.halo.id} motifs, volumetric clouds, sacred geometry, ultra-detailed, cinematic, 4K`;
    try {
      const res = await generateMemorialImage(prompt, { quality: 'hd', size: '1792x1024' });
      if (res?.images?.[0]?.url) {
        set('aiScene', res.images[0].url);
        notify.success('AI scene generated ✓');
      } else {
        notify.warn('AI scene generation unavailable — check OPENAI_API_KEY is set on the backend.');
      }
    } catch (err) {
      notify.error('Scene generation failed: ' + err.message);
    } finally {
      setGeneratingScene(false);
    }
  }

  function handleGlbUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      notify.error('Only .glb or .gltf files are supported');
      return;
    }
    const url = URL.createObjectURL(file);
    set('glbUrl', url);
    notify.success(`Model loaded: ${file.name}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white">Avatar Config</h3>
          <p className="text-[10px] text-white/30 font-mono mt-0.5">Real-time 3D</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
      </div>

      <Section icon={Sun} title="Halo">
        {HALO_OPTIONS.map(h => (
          <Chip key={h.id} item={h} selected={config.halo.id === h.id}
            onClick={() => set('halo', h)} />
        ))}
      </Section>

      <Section icon={Wind} title="Wings">
        {WING_OPTIONS.map(w => (
          <Chip key={w.id} item={w} selected={config.wings.id === w.id}
            onClick={() => set('wings', w)} />
        ))}
      </Section>

      <Section icon={Sparkles} title="Aura / Glow">
        {GLOW_OPTIONS.map(g => (
          <Chip key={g.id} item={g} selected={config.glow.id === g.id}
            onClick={() => set('glow', g)} />
        ))}
      </Section>

      {/* GLB Upload */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">3D Model (GLB)</span>
        </div>
        <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed text-xs cursor-pointer transition-all ${
          config.glbUrl ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' : 'border-white/15 text-white/40 hover:border-white/30 hover:text-white/60'
        }`}>
          {uploadingGlb
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</>
            : config.glbUrl
            ? <><span>✓</span><span>Custom Model Loaded</span></>
            : <><Upload className="w-3.5 h-3.5" />Upload .glb / .gltf</>
          }
          <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleGlbUpload} />
        </label>
        {config.glbUrl && (
          <button
            onClick={() => set('glbUrl', null)}
            className="mt-1.5 w-full text-[10px] text-white/30 hover:text-red-300 font-mono transition-colors"
          >
            × Remove model (use procedural)
          </button>
        )}
      </div>

      {/* AI Scene Generator */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">AI Background Scene</span>
        </div>
        {config.aiScene && (
          <div className="relative mb-2 rounded-xl overflow-hidden border border-white/10">
            <img src={config.aiScene} alt="AI Scene" className="w-full h-24 object-cover opacity-80" />
            <button
              onClick={() => set('aiScene', null)}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white/60 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateAIScene}
          disabled={generatingScene}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/60 to-blue-600/60 border border-purple-500/30 text-xs font-bold text-white hover:from-purple-600/80 hover:to-blue-600/80 disabled:opacity-50 transition-all"
        >
          {generatingScene
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating Scene…</>
            : <><Sparkles className="w-3.5 h-3.5" />Generate AI Scene</>}
        </motion.button>
      </div>
    </motion.div>
  );
}
