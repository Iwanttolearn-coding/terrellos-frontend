/**
 * AvatarLab.jsx — TerrellOS / Heavenly Eternal Echo
 * ─────────────────────────────────────────────────────────────────
 * Next-gen cinematic avatar page.
 * Xbox-style layout: 3D scene left, live config panel right.
 * Full GPU-accelerated rendering via React Three Fiber.
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Download, Share2, RotateCcw, Maximize2, ChevronRight, Zap
} from 'lucide-react';
import AvatarScene from '@/components/avatar/AvatarScene';
import AvatarCustomizer, { DEFAULT_CONFIG } from '@/components/avatar/AvatarCustomizer';
import { notify } from '@/components/NotificationCenter';

// ── Preset Loadout Chips ───────────────────────────────────────────
const PRESETS = [
  {
    id: 'archangel',
    label: 'Archangel',
    emoji: '⚔️',
    config: {
      halo:  { id: 'Platinum Halo',  color: '#e8e8e8', emoji: '🪬' },
      wings: { id: 'Ethereal Feather',color: '#a855f7', emoji: '🪶' },
      glow:  { id: 'White Holy',     color: '#f0f9ff', emoji: '✨' },
    },
  },
  {
    id: 'neon_prophet',
    label: 'Neon Prophet',
    emoji: '🔮',
    config: {
      halo:  { id: 'Neon Ring',      color: '#00ffff', emoji: '💠' },
      wings: { id: 'Neon Blade',     color: '#06b6d4', emoji: '⚡' },
      glow:  { id: 'Blue Plasma',    color: '#2563eb', emoji: '🌊' },
    },
  },
  {
    id: 'divine_rose',
    label: 'Divine Rose',
    emoji: '🌹',
    config: {
      halo:  { id: 'Golden Crown',   color: '#ffd700', emoji: '👑' },
      wings: { id: 'Crystal Drift',  color: '#67e8f9', emoji: '💎' },
      glow:  { id: 'Rose Gold',      color: '#f43f5e', emoji: '🌹' },
    },
  },
  {
    id: 'eternal_echo',
    label: 'Eternal Echo',
    emoji: '✝️',
    config: {
      halo:  { id: 'Cosmic Arc',     color: '#ff6ec7', emoji: '🌀' },
      wings: { id: 'Obsidian Flow',  color: '#6b21a8', emoji: '🖤' },
      glow:  { id: 'Purple Aura',    color: '#7c3aed', emoji: '🔮' },
    },
  },
];

function PresetChip({ preset, active, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
        active
          ? 'bg-primary/20 border-primary text-white shadow-[0_0_16px_rgba(139,92,246,0.35)]'
          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/80'
      }`}
    >
      <span className="text-xl">{preset.emoji}</span>
      <span className="text-[10px] font-mono">{preset.label}</span>
    </motion.button>
  );
}

export default function AvatarLab() {
  const [config,      setConfig]      = useState(DEFAULT_CONFIG);
  const [activePreset,setActivePreset]= useState(null);
  const [fullscreen,  setFullscreen]  = useState(false);

  const applyPreset = useCallback((preset) => {
    setConfig(c => ({ ...c, ...preset.config, glbUrl: c.glbUrl, aiScene: c.aiScene }));
    setActivePreset(preset.id);
  }, []);

  const handleConfigChange = useCallback((newConfig) => {
    setConfig(newConfig);
    setActivePreset(null); // clear preset if user manually edits
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setActivePreset(null);
    notify.info('Avatar reset to defaults');
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="px-4 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.9)] animate-pulse" />
              <span className="text-[10px] font-mono text-purple-400/70 uppercase tracking-widest">3D Avatar Engine</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
              Avatar Lab
            </h1>
            <p className="text-xs text-white/30 mt-0.5">Cinematic · Next-Gen · GPU Accelerated</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/25 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { notify.success('Avatar config saved!'); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 border border-purple-500/40 text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" /> Save Avatar
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Preset Row ───────────────────────────────────────────── */}
      <div className="px-4 lg:px-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-[9px] font-mono font-bold text-white/25 uppercase tracking-widest">Presets</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESETS.map(p => (
            <PresetChip key={p.id} preset={p}
              active={activePreset === p.id}
              onClick={() => applyPreset(p)} />
          ))}
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <div className="px-4 lg:px-8 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">

        {/* 3D Canvas */}
        <div className="relative">
          <AvatarScene
            glbUrl={config.glbUrl}
            haloColor={config.halo.color}
            wingStyle={config.wings.id}
            wingColor={config.wings.color}
            glowColor={config.glow.color}
            height={520}
            className="w-full"
          />

          {/* AI Scene overlay */}
          <AnimatePresence>
            {config.aiScene && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{ mixBlendMode: 'screen', opacity: 0.18 }}
              >
                <img src={config.aiScene} alt="" className="w-full h-full object-cover" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-[9px] font-mono text-white/50">LIVE 3D · GPU</span>
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm text-[9px] font-mono text-white/30">
            Drag to rotate · Scroll to zoom
          </div>
        </div>

        {/* Customizer Panel */}
        <AvatarCustomizer
          config={config}
          onChange={handleConfigChange}
          className="lg:sticky lg:top-4"
        />
      </div>

      {/* ── Powered By Footer ────────────────────────────────────── */}
      <div className="px-4 lg:px-8 pb-6 text-center">
        <p className="text-[10px] font-mono text-white/15">
          Powered by React Three Fiber · Drei · Framer Motion · DALL-E 3 · Heavenly Eternal Echo
        </p>
      </div>
    </div>
  );
}
