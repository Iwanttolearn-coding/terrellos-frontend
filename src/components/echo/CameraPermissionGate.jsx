/**
 * CameraPermissionGate.jsx
 * Handles all camera/mic permission states gracefully.
 * Wraps content that requires camera — shows contextual fallback per state.
 * Used as a wrapper inside MirrorRecorder and MemoryCaptureSession.
 */
import { useState, useEffect } from 'react';
import { Camera, CameraOff, Mic, MicOff, Shield, RefreshCw, ExternalLink } from 'lucide-react';

const PERM_STATE = {
  CHECKING:  'checking',
  GRANTED:   'granted',
  DENIED:    'denied',
  PROMPT:    'prompt',       // hasn't asked yet
  PARTIAL:   'partial',      // cam ok but mic denied or vice versa
};

function getBrowserGuide() {
  const ua = navigator.userAgent;
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    return { name: 'Safari', path: 'Settings → Safari → Camera & Microphone → Allow' };
  }
  if (/firefox/i.test(ua)) {
    return { name: 'Firefox', path: 'Click the camera icon in the address bar → Allow' };
  }
  return { name: 'Chrome / Edge', path: 'Click the camera icon in the address bar → Always allow' };
}

export default function CameraPermissionGate({ children, onGranted, onDenied }) {
  const [state, setState] = useState(PERM_STATE.CHECKING);
  const [camOk, setCamOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => { checkPermissions(); }, []);

  async function checkPermissions() {
    if (!navigator.permissions) {
      // Permissions API not available — go straight to prompt
      setState(PERM_STATE.PROMPT);
      return;
    }
    try {
      const [camPerm, micPerm] = await Promise.all([
        navigator.permissions.query({ name: 'camera' }).catch(() => ({ state: 'prompt' })),
        navigator.permissions.query({ name: 'microphone' }).catch(() => ({ state: 'prompt' })),
      ]);
      const cam = camPerm.state === 'granted';
      const mic = micPerm.state === 'granted';
      setCamOk(cam); setMicOk(mic);
      if (cam && mic)                          { setState(PERM_STATE.GRANTED); onGranted?.(); }
      else if (camPerm.state === 'denied' || micPerm.state === 'denied') setState(PERM_STATE.DENIED);
      else                                     setState(PERM_STATE.PROMPT);
    } catch {
      setState(PERM_STATE.PROMPT);
    }
  }

  async function requestPermissions() {
    setChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setCamOk(true); setMicOk(true);
      setState(PERM_STATE.GRANTED);
      onGranted?.();
    } catch (err) {
      if (err.name === 'NotAllowedError') setState(PERM_STATE.DENIED);
      else setState(PERM_STATE.DENIED);
      onDenied?.();
    } finally {
      setChecking(false);
    }
  }

  // Pass through if granted
  if (state === PERM_STATE.GRANTED) return children;

  const guide = getBrowserGuide();

  // ── Checking ───────────────────────────────────────────────────────────────
  if (state === PERM_STATE.CHECKING) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
        <p className="text-sm text-white/30">Checking permissions…</p>
      </div>
    );
  }

  // ── Needs prompt ───────────────────────────────────────────────────────────
  if (state === PERM_STATE.PROMPT) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 space-y-7 max-w-sm mx-auto text-center">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/25 flex items-center justify-center">
            <Camera className="w-5 h-5 text-purple-300" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
            <Mic className="w-5 h-5 text-blue-300" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Camera & microphone needed</h3>
          <p className="text-sm text-white/45 leading-relaxed">
            Your Eternal Echo session requires camera and microphone access. Your browser will ask for permission.
          </p>
        </div>
        <button
          onClick={requestPermissions}
          disabled={checking}
          className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 active:scale-98"
        >
          {checking ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Requesting…</>
          ) : (
            <><Shield className="w-4 h-4" /> Allow Camera & Microphone</>
          )}
        </button>
        <p className="text-xs text-white/20">
          Your browser will show a permission prompt. Allow both to continue.
        </p>
      </div>
    );
  }

  // ── Denied ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 space-y-7 max-w-sm mx-auto text-center">
      <div className="flex gap-3">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
          camOk ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-red-500/10 border-red-500/25'
        }`}>
          {camOk
            ? <Camera className="w-5 h-5 text-emerald-400" />
            : <CameraOff className="w-5 h-5 text-red-400" />
          }
        </div>
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
          micOk ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-red-500/10 border-red-500/25'
        }`}>
          {micOk
            ? <Mic className="w-5 h-5 text-emerald-400" />
            : <MicOff className="w-5 h-5 text-red-400" />
          }
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Access blocked</h3>
        <p className="text-sm text-white/45 leading-relaxed">
          {!camOk && !micOk
            ? 'Camera and microphone access was denied.'
            : !camOk ? 'Camera access was denied.'
            : 'Microphone access was denied.'}
          {' '}You'll need to update your browser settings to continue.
        </p>
      </div>

      {/* Browser-specific guide */}
      <div className="w-full bg-white/3 border border-white/8 rounded-xl p-4 text-left space-y-2">
        <p className="text-xs text-white/50 font-semibold uppercase tracking-wide">{guide.name}</p>
        <p className="text-xs text-white/40 leading-relaxed">{guide.path}</p>
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={checkPermissions}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 text-sm text-white/50 hover:border-white/30 hover:text-white/70 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600/15 border border-purple-500/25 text-sm text-purple-300 hover:bg-purple-600/25 transition-all"
        >
          <ExternalLink className="w-4 h-4" /> Reload page
        </button>
      </div>
    </div>
  );
}
