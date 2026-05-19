/**
 * VoiceActivityIndicator.jsx
 * Real-time voice activity detection display.
 * Shows speaking/silent/paused states with smooth animated feedback.
 * Used alongside MirrorRecorder to give users confidence they're being heard.
 */
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

const VAD_STATE = {
  IDLE:     'idle',
  SILENT:   'silent',
  SPEAKING: 'speaking',
  PAUSED:   'paused',
};

const SILENCE_THRESHOLD = 12;   // RMS below this = silent
const PAUSE_DELAY_MS    = 1800; // silence this long = natural pause

export default function VoiceActivityIndicator({
  isActive = false,
  onSpeakingChange,   // (isSpeaking: bool) => void
  onPause,            // () => void  — fires on natural pause detection
  compact = false,    // smaller inline version
}) {
  const [vadState, setVadState] = useState(VAD_STATE.IDLE);
  const [volume, setVolume]     = useState(0);      // 0–100
  const [pauseCount, setPauseCount] = useState(0);

  const analyserRef   = useRef(null);
  const streamRef     = useRef(null);
  const frameRef      = useRef(null);
  const pauseTimerRef = useRef(null);
  const mountedRef    = useRef(true);
  const wasSpeaking   = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; cleanup(); };
  }, []);

  useEffect(() => {
    if (isActive) startVAD(); else cleanup();
  }, [isActive]);

  async function startVAD() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.fftSize);

      function tick() {
        if (!mountedRef.current) return;
        analyser.getByteTimeDomainData(data);

        // RMS volume calculation
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length) * 100;
        const vol = Math.round(Math.min(100, rms * 8));

        setVolume(vol);

        const isSpeaking = rms > SILENCE_THRESHOLD / 100;

        if (isSpeaking) {
          clearTimeout(pauseTimerRef.current);
          if (!wasSpeaking.current) {
            wasSpeaking.current = true;
            setVadState(VAD_STATE.SPEAKING);
            onSpeakingChange?.(true);
          }
        } else {
          if (wasSpeaking.current) {
            wasSpeaking.current = false;
            setVadState(VAD_STATE.SILENT);
            onSpeakingChange?.(false);
            pauseTimerRef.current = setTimeout(() => {
              if (!mountedRef.current) return;
              setVadState(VAD_STATE.PAUSED);
              setPauseCount(c => c + 1);
              onPause?.();
            }, PAUSE_DELAY_MS);
          }
        }

        frameRef.current = requestAnimationFrame(tick);
      }
      tick();
      setVadState(VAD_STATE.SILENT);
    } catch {
      // Mic not available — degrade gracefully
      setVadState(VAD_STATE.IDLE);
    }
  }

  function cleanup() {
    cancelAnimationFrame(frameRef.current);
    clearTimeout(pauseTimerRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (mountedRef.current) { setVadState(VAD_STATE.IDLE); setVolume(0); }
  }

  const STATE_CONFIG = {
    [VAD_STATE.IDLE]:     { color: 'text-white/20',    bg: 'bg-white/5',       label: 'Microphone inactive',  icon: MicOff },
    [VAD_STATE.SILENT]:   { color: 'text-white/40',    bg: 'bg-white/8',       label: 'Listening…',           icon: Mic },
    [VAD_STATE.SPEAKING]: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Speaking',             icon: Volume2 },
    [VAD_STATE.PAUSED]:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',  label: 'Natural pause',        icon: Mic },
  };

  const cfg = STATE_CONFIG[vadState];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/8 ${cfg.bg} transition-all`}>
        <Icon className={`w-3 h-3 ${cfg.color}`} />
        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        {vadState === VAD_STATE.SPEAKING && (
          <div className="flex items-center gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full bg-emerald-400 transition-all duration-75"
                style={{ height: `${4 + Math.min(12, (volume / 100) * 16 * (i === 1 || i === 2 ? 1.5 : 1))}px` }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/8 p-4 transition-all ${cfg.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            vadState === VAD_STATE.SPEAKING ? 'bg-emerald-500/20' : 'bg-white/5'
          }`}>
            <Icon className={`w-4.5 h-4.5 ${cfg.color} transition-colors`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${cfg.color} transition-colors`}>{cfg.label}</p>
            <p className="text-xs text-white/25 mt-0.5">
              {pauseCount > 0 ? `${pauseCount} natural pause${pauseCount > 1 ? 's' : ''} detected` : 'Voice activity detection active'}
            </p>
          </div>
        </div>

        {/* Volume meter */}
        <div className="flex items-end gap-0.5 h-6">
          {[...Array(8)].map((_, i) => {
            const threshold = (i / 8) * 100;
            const active = volume > threshold;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  active
                    ? i < 5 ? 'bg-emerald-400' : i < 7 ? 'bg-amber-400' : 'bg-red-400'
                    : 'bg-white/10'
                }`}
                style={{ height: `${25 + i * 9}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
