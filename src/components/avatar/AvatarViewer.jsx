/**
 * AvatarViewer.jsx — TerrellOS / Heavenly Eternal Echo
 * ─────────────────────────────────────────────────────────────────
 * Compact embeddable cinematic avatar widget.
 * Use this in profile cards, dashboards, memorial pages.
 *
 * Props: same as AvatarScene — all optional with defaults.
 * ─────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import AvatarScene from '@/components/avatar/AvatarScene';
import { Maximize2, X } from 'lucide-react';

export default function AvatarViewer({
  name       = 'Heavenly Soul',
  subtitle   = '',
  glbUrl     = null,
  haloColor  = '#ffd700',
  wingStyle  = 'Ethereal Feather',
  wingColor  = '#a855f7',
  glowColor  = '#7c3aed',
  compact    = false,  // true = small card, false = full panel
  className  = '',
}) {
  const [expanded, setExpanded] = useState(false);

  const height = compact ? 240 : 380;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`relative rounded-2xl overflow-hidden bg-black border border-white/10 group ${className}`}
      >
        <AvatarScene
          glbUrl={glbUrl}
          haloColor={haloColor}
          wingStyle={wingStyle}
          wingColor={wingColor}
          glowColor={glowColor}
          height={height}
        />

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-sm font-bold text-white">{name}</p>
          {subtitle && <p className="text-[10px] text-white/50 font-mono">{subtitle}</p>}
        </div>

        {/* Expand button */}
        {!compact && (
          <button
            onClick={() => setExpanded(true)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 border border-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          >
            <Maximize2 className="w-3 h-3 text-white/70" />
          </button>
        )}
      </motion.div>

      {/* Fullscreen modal */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-2xl">
            <AvatarScene
              glbUrl={glbUrl}
              haloColor={haloColor}
              wingStyle={wingStyle}
              wingColor={wingColor}
              glowColor={glowColor}
              height={600}
            />
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
