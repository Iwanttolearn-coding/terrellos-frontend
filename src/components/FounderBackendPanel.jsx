/**
 * FounderBackendPanel.jsx — TerrellOS / TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * Full backend capability panel for the /founder page.
 * Shows: online/offline, image AI, Whisper, ElevenLabs, last-checked,
 * docs button, test-image button, test-transcribe button.
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { generateImage, transcribeAudio, API_BASE_URL } from '@/lib/api';
import {
  Wifi, WifiOff, Loader2, RefreshCw, ExternalLink,
  Image, Mic, Volume2, CheckCircle, XCircle, AlertTriangle, Activity,
} from 'lucide-react';

const BACKEND_URL = 'https://terrellos-backend.fly.dev';

function CapabilityRow({ icon: Icon, label, ready, readyLabel, missingLabel, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
        <Loader2 className="w-4 h-4 text-white/30 animate-spin flex-shrink-0" />
        <span className="text-xs text-white/40 font-mono flex-1">{label}</span>
        <span className="text-xs text-white/20">checking…</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <Icon className={`w-4 h-4 flex-shrink-0 ${ready ? 'text-emerald-400' : 'text-red-400/70'}`} />
      <span className="text-xs text-white/70 font-mono flex-1">{label}</span>
      <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full border ${
        ready
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
          : 'bg-red-500/15 text-red-300 border-red-500/25'
      }`}>
        {ready
          ? <><CheckCircle className="w-2.5 h-2.5" />{readyLabel || 'Ready'}</>
          : <><AlertTriangle className="w-2.5 h-2.5" />{missingLabel || 'Missing API Key'}</>
        }
      </span>
    </div>
  );
}

export default function FounderBackendPanel() {
  const {
    capabilities, loading, error, recheck, lastChecked, latencyMs, online,
  } = useBackendStatus();

  const [testingImage,      setTestingImage]      = useState(false);
  const [testImageResult,   setTestImageResult]   = useState(null);
  const [testingTranscribe, setTestingTranscribe] = useState(false);
  const [testTranscribeResult, setTestTranscribeResult] = useState(null);

  const testImage = useCallback(async () => {
    setTestingImage(true);
    setTestImageResult(null);
    try {
      const res = await generateImage('A single glowing star over a peaceful heavenly landscape', {
        quality: 'standard', size: '1024x1024', style: 'vivid',
      });
      if (res?.length) {
        setTestImageResult({ ok: true, url: res[0].url, msg: 'Image generated ✓' });
      } else {
        setTestImageResult({ ok: false, msg: 'No image returned' });
      }
    } catch (e) {
      setTestImageResult({ ok: false, msg: e.message });
    } finally {
      setTestingImage(false);
    }
  }, []);

  const testTranscribe = useCallback(async () => {
    setTestingTranscribe(true);
    setTestTranscribeResult(null);
    try {
      // Send a tiny 1-second silent WAV to test the route is reachable
      const silentWav = new Uint8Array([
        82,73,70,70,36,0,0,0,87,65,86,69,102,109,116,32,16,0,0,0,1,0,1,0,
        68,172,0,0,136,88,1,0,2,0,16,0,100,97,116,97,0,0,0,0
      ]);
      const file = new File([silentWav], 'test.wav', { type: 'audio/wav' });
      const res = await transcribeAudio(file);
      // A blank/silent file may return empty transcript — that's still a live route
      if (res?.success !== false) {
        setTestTranscribeResult({ ok: true, msg: `Whisper route live ✓ (transcript: "${res?.transcript || '[silent]'}")` });
      } else {
        setTestTranscribeResult({ ok: false, msg: res?.note || 'Transcribe route returned failure' });
      }
    } catch (e) {
      setTestTranscribeResult({ ok: false, msg: e.message });
    } finally {
      setTestingTranscribe(false);
    }
  }, []);

  const onlineStatus = loading ? 'checking' : online ? 'online' : 'offline';

  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            onlineStatus === 'online'   ? 'bg-emerald-500/20 border border-emerald-500/30' :
            onlineStatus === 'offline'  ? 'bg-red-500/20 border border-red-500/30' :
                                          'bg-yellow-500/20 border border-yellow-500/30'
          }`}>
            {onlineStatus === 'checking'
              ? <Loader2 className="w-4 h-4 text-yellow-300 animate-spin" />
              : onlineStatus === 'online'
              ? <Wifi className="w-4 h-4 text-emerald-300" />
              : <WifiOff className="w-4 h-4 text-red-300" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Fly.io Backend</h3>
            <p className="text-[10px] text-white/40 font-mono">{BACKEND_URL}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latencyMs != null && onlineStatus === 'online' && (
            <span className="text-[10px] font-mono text-emerald-300/70">{latencyMs}ms</span>
          )}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            onlineStatus === 'online'  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' :
            onlineStatus === 'offline' ? 'bg-red-500/15 text-red-300 border-red-500/25' :
                                         'bg-yellow-500/15 text-yellow-300 border-yellow-500/25'
          }`}>
            {onlineStatus === 'online' ? '● Online' : onlineStatus === 'offline' ? '○ Offline' : '◌ Checking'}
          </span>
        </div>
      </div>

      {/* Capability rows */}
      <div className="px-5 py-3">
        <p className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-2">AI Capabilities</p>
        <CapabilityRow icon={Image}   label="Image Generation (DALL-E 3)"  ready={capabilities?.images}     missingLabel="Set OPENAI_API_KEY"     loading={loading} />
        <CapabilityRow icon={Mic}     label="Whisper Transcription"         ready={capabilities?.transcribe} missingLabel="Set OPENAI_API_KEY"     loading={loading} />
        <CapabilityRow icon={Volume2} label="ElevenLabs Voice Synthesis"    ready={capabilities?.voice}      missingLabel="Set ELEVENLABS_API_KEY" loading={loading} />
        <CapabilityRow icon={Activity}label="Chat / AI Companion"           ready={capabilities?.chat}       missingLabel="Set OPENAI_API_KEY"     loading={loading} />
      </div>

      {/* Version + last checked */}
      {(capabilities?.version || lastChecked) && (
        <div className="px-5 pb-3 flex items-center justify-between text-[10px] font-mono text-white/25">
          {capabilities?.version && <span>v{capabilities.version}</span>}
          {lastChecked && (
            <span className="flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" />
              {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-[11px] text-red-200 font-mono">
          {error}
        </div>
      )}

      {/* Test results */}
      {testImageResult && (
        <div className={`mx-5 mb-2 rounded-xl px-3 py-2 text-[11px] font-mono border ${
          testImageResult.ok
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
            : 'bg-red-500/10 border-red-500/20 text-red-200'
        }`}>
          <span className="font-bold">Image test: </span>{testImageResult.msg}
          {testImageResult.url && (
            <a href={testImageResult.url} target="_blank" rel="noreferrer"
              className="ml-2 underline text-emerald-300">View →</a>
          )}
        </div>
      )}
      {testTranscribeResult && (
        <div className={`mx-5 mb-2 rounded-xl px-3 py-2 text-[11px] font-mono border ${
          testTranscribeResult.ok
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
            : 'bg-red-500/10 border-red-500/20 text-red-200'
        }`}>
          <span className="font-bold">Transcribe test: </span>{testTranscribeResult.msg}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 pb-5 pt-2 flex flex-wrap gap-2">
        <button
          onClick={recheck}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-black hover:bg-white disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Recheck
        </button>
        <button
          onClick={testImage}
          disabled={testingImage || !capabilities?.images}
          className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40 transition-all"
        >
          {testingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
          Test Image Route
        </button>
        <button
          onClick={testTranscribe}
          disabled={testingTranscribe || !capabilities?.transcribe}
          className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40 transition-all"
        >
          {testingTranscribe ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
          Test Transcribe Route
        </button>
        <a
          href={`${BACKEND_URL}/docs`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition-all"
        >
          <ExternalLink className="w-3 h-3" /> Open Backend Docs
        </a>
      </div>
    </div>
  );
}
