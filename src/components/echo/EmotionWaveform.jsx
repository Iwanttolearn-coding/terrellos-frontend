/**
 * EmotionWaveform.jsx
 * Animated audio waveform — elegant, cinematic, non-technical.
 * Uses Web Audio API when active, otherwise shows gentle idle animation.
 */
import { useEffect, useRef, useState } from 'react';

const BAR_COUNT = 32;

export default function EmotionWaveform({ isActive = false, color = 'purple' }) {
  const [bars, setBars] = useState(Array(BAR_COUNT).fill(0.05));
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const mountedRef = useRef(true);

  const COLOR_MAP = {
    purple: { from: '#a855f7', to: '#6366f1', mid: '#818cf8' },
    blue:   { from: '#3b82f6', to: '#06b6d4', mid: '#60a5fa' },
    rose:   { from: '#f43f5e', to: '#ec4899', mid: '#fb7185' },
  };
  const c = COLOR_MAP[color] || COLOR_MAP.purple;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      startAudio();
    } else {
      cleanup();
      animateIdle();
    }
  }, [isActive]);

  function cleanup() {
    cancelAnimationFrame(frameRef.current);
    if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch {} }
    if (analyserRef.current) { try { analyserRef.current.disconnect(); } catch {} }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  async function startAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      analyserRef.current = analyser;
      sourceRef.current = src;
      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        if (!mountedRef.current) return;
        analyser.getByteFrequencyData(data);
        const vals = Array.from(data).map(v => Math.max(0.05, v / 255));
        setBars(vals.slice(0, BAR_COUNT));
        frameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      animateIdle();
    }
  }

  function animateIdle() {
    let t = 0;
    function tick() {
      if (!mountedRef.current) return;
      t += 0.04;
      const vals = Array.from({ length: BAR_COUNT }, (_, i) =>
        0.04 + Math.sin(t + i * 0.4) * 0.04 + Math.sin(t * 1.3 + i * 0.7) * 0.02
      );
      setBars(vals);
      frameRef.current = requestAnimationFrame(tick);
    }
    tick();
  }

  return (
    <div className="w-full flex items-center justify-center gap-[2px] h-12 px-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all duration-75"
          style={{
            height: `${Math.max(4, h * 100)}%`,
            background: `linear-gradient(to top, ${c.from}, ${c.to})`,
            opacity: isActive ? (0.5 + h * 0.7) : 0.2,
            transform: `scaleY(${isActive ? 1 : 0.6})`,
          }}
        />
      ))}
    </div>
  );
}
