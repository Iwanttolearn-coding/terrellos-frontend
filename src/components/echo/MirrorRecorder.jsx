/**
 * MirrorRecorder.jsx
 * Immersive, cinematic camera mirror experience.
 * Full-screen, portrait-first, sacred aesthetic.
 * Graceful fallback if camera denied.
 */
import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Circle, Pause, StopCircle } from 'lucide-react';
import EmotionWaveform from '@/components/echo/EmotionWaveform';

const PERMISSION_STATE = {
  UNKNOWN:  'unknown',
  GRANTED:  'granted',
  DENIED:   'denied',
  LOADING:  'loading',
};

export default function MirrorRecorder({
  isRecording = false,
  onToggleRecord,
  onStop,
  currentPrompt = '',
  transcriptLine = '',
  sessionDuration = 0,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);

  const [camState, setCamState] = useState(PERMISSION_STATE.UNKNOWN);
  const [micState, setMicState] = useState(PERMISSION_STATE.UNKNOWN);
  const [micMuted, setMicMuted] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0); // 0-1 for breathing animation

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopStream();
    };
  }, []);

  // Breathing animation
  useEffect(() => {
    let frame;
    let start;
    function animate(ts) {
      if (!start) start = ts;
      const elapsed = (ts - start) / 4000; // 4s breath cycle
      if (mountedRef.current) {
        setBreathPhase(Math.sin(elapsed * Math.PI * 2) * 0.5 + 0.5);
        frame = requestAnimationFrame(animate);
      }
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  async function startCamera() {
    if (!mountedRef.current) return;
    setCamState(PERMISSION_STATE.LOADING);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamState(PERMISSION_STATE.GRANTED);
      setMicState(PERMISSION_STATE.GRANTED);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err.name === 'NotAllowedError') {
        setCamState(PERMISSION_STATE.DENIED);
      } else {
        setCamState(PERMISSION_STATE.DENIED);
        console.warn('Camera error:', err.message);
      }
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function toggleMic() {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach(t => {
      t.enabled = micMuted;
    });
    setMicMuted(v => !v);
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ── Camera denied ──────────────────────────────────────────────────────────
  if (camState === PERMISSION_STATE.DENIED) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-8">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <CameraOff className="w-9 h-9 text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white">Camera access needed</h3>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed">
            To begin your Eternal Echo session, please allow camera and microphone access in your browser settings, then try again.
          </p>
        </div>
        <button
          onClick={startCamera}
          className="px-6 py-3 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-sm font-medium hover:bg-purple-600/30 transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Pre-start state ────────────────────────────────────────────────────────
  if (camState === PERMISSION_STATE.UNKNOWN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 p-8 relative">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl transition-all duration-1000"
            style={{ transform: `translate(-50%, -50%) scale(${0.8 + breathPhase * 0.3})`, opacity: 0.3 + breathPhase * 0.4 }}
          />
        </div>

        <div className="relative z-10 text-center space-y-6">
          <div
            className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/20 transition-all duration-1000"
            style={{ boxShadow: `0 0 ${40 + breathPhase * 30}px ${breathPhase * 20}px rgba(147, 51, 234, ${0.1 + breathPhase * 0.15})` }}
          >
            <Camera className="w-12 h-12 text-purple-300" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">Open your mirror</h2>
            <p className="text-sm text-white/50 max-w-xs mx-auto leading-relaxed">
              Your camera will activate. You'll see yourself — this is your space to be fully present.
            </p>
          </div>

          <button
            onClick={startCamera}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-base flex items-center gap-2 mx-auto shadow-2xl shadow-purple-500/20 hover:opacity-90 transition-all active:scale-98"
          >
            <Camera className="w-5 h-5" />
            Activate Mirror
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (camState === PERMISSION_STATE.LOADING) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        <p className="text-sm text-white/40">Opening your mirror…</p>
      </div>
    );
  }

  // ── LIVE MIRROR ────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full flex flex-col items-center">

      {/* Camera viewport */}
      <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: '9/16', maxHeight: '75vh' }}>

        {/* Glowing border */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none z-10 transition-all duration-1000"
          style={{
            boxShadow: isRecording
              ? `0 0 ${40 + breathPhase * 20}px rgba(239, 68, 68, ${0.2 + breathPhase * 0.15}), inset 0 0 60px rgba(0,0,0,0.4)`
              : `0 0 ${30 + breathPhase * 20}px rgba(147, 51, 234, ${0.15 + breathPhase * 0.15}), inset 0 0 60px rgba(0,0,0,0.4)`,
            border: isRecording ? '1.5px solid rgba(239,68,68,0.4)' : '1.5px solid rgba(147,51,234,0.4)',
          }}
        />

        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover rounded-3xl"
          style={{ transform: 'scaleX(-1)' }} // mirror
        />

        {/* Soft vignette overlay */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none z-5"
          style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(8,8,18,0.6) 100%)' }} />

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Circle className="w-2.5 h-2.5 text-red-400 fill-red-400 animate-pulse" />
            <span className="text-xs text-white font-mono">{formatDuration(sessionDuration)}</span>
          </div>
        )}

        {/* Top-right mic toggle */}
        <button
          onClick={toggleMic}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/60 transition-all"
        >
          {micMuted
            ? <MicOff className="w-4 h-4 text-red-400" />
            : <Mic className="w-4 h-4 text-white/70" />
          }
        </button>

        {/* Transcript line overlay */}
        {transcriptLine && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10">
              <p className="text-sm text-white/90 text-center leading-relaxed">{transcriptLine}</p>
            </div>
          </div>
        )}
      </div>

      {/* Waveform */}
      <div className="w-full max-w-2xl mx-auto mt-4">
        <EmotionWaveform isActive={isRecording && !micMuted} />
      </div>

      {/* Current prompt */}
      {currentPrompt && (
        <div className="w-full max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-white/4 border border-white/10 rounded-2xl px-5 py-4 text-center">
            <p className="text-sm text-white/70 italic leading-relaxed">"{currentPrompt}"</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onToggleRecord}
          className={`flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-2xl active:scale-97 ${
            isRecording
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-500/25 hover:opacity-90'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/25 hover:opacity-90'
          }`}
        >
          {isRecording ? (
            <><Pause className="w-4 h-4" /> Pause</>
          ) : (
            <><Circle className="w-4 h-4 fill-white" /> Begin Recording</>
          )}
        </button>

        {isRecording && (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/15 text-white/60 text-sm font-medium hover:border-white/30 hover:text-white/80 transition-all"
          >
            <StopCircle className="w-4 h-4" />
            End Session
          </button>
        )}
      </div>
    </div>
  );
}
