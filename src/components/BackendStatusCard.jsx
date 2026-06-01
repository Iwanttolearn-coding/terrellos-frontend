/**
 * BackendStatusCard.jsx — TerrellOS / TerrellOS
 * Full backend connection card for Founder / Admin / Dashboard pages.
 * Shows: URL, status badge, version, latency, docs/health links, recheck.
 */
import { useEffect, useState, useCallback } from 'react';
import { checkBackendHealth } from '@/lib/api';
import { Wifi, WifiOff, Loader2, RefreshCw, ExternalLink, Activity } from 'lucide-react';

const BACKEND_URL = 'https://terrellos-backend.fly.dev';

export default function BackendStatusCard() {
  const [status,      setStatus]    = useState('checking'); // 'checking' | 'online' | 'offline'
  const [data,        setData]      = useState(null);
  const [error,       setError]     = useState('');
  const [lastChecked, setLastChecked] = useState(null);

  const runCheck = useCallback(async () => {
    setStatus('checking');
    setError('');
    try {
      const result = await checkBackendHealth();
      setData(result);
      setStatus('online');
    } catch (err) {
      setError(err.message || 'Backend unavailable');
      setStatus('offline');
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => { runCheck(); }, [runCheck]);

  const badgeClasses =
    status === 'online'   ? 'bg-green-500/20 text-green-300 border-green-500/30' :
    status === 'offline'  ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';

  const badgeLabel =
    status === 'online'  ? '● Backend Online' :
    status === 'offline' ? '○ Backend Offline' :
                           '◌ Checking…';

  return (
    <div className="rounded-2xl border border-white/10 bg-black/70 p-5 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            {status === 'checking'
              ? <Loader2 className="w-4 h-4 text-yellow-300 animate-spin" />
              : status === 'online'
              ? <Wifi className="w-4 h-4 text-emerald-300" />
              : <WifiOff className="w-4 h-4 text-red-300" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">TerrellOS Backend</h2>
            <p className="text-xs text-white/50 font-mono mt-0.5 truncate max-w-[220px]">{BACKEND_URL}</p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap flex-shrink-0 ${badgeClasses}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Data rows */}
      {data && (
        <div className="mt-4 grid gap-1.5 text-xs text-white/70 font-mono border-t border-white/10 pt-4">
          <div className="flex justify-between">
            <span className="text-white/40">Service</span>
            <span className="text-white/90">{data.service || 'TerrellOS Backend'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Version</span>
            <span className="text-white/90">{data.version || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Latency</span>
            <span className={data.latency_ms < 1000 ? 'text-emerald-300' : 'text-yellow-300'}>
              {data.latency_ms != null ? `${data.latency_ms}ms` : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">OpenAI</span>
            <span className={data.openai_configured ? 'text-emerald-300' : 'text-red-300'}>
              {data.openai_configured ? '✓ configured' : '✗ missing key'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">ElevenLabs</span>
            <span className={data.elevenlabs_configured ? 'text-emerald-300' : 'text-yellow-300'}>
              {data.elevenlabs_configured ? '✓ configured' : '○ not set'}
            </span>
          </div>
          {data.voice_provider && (
            <div className="flex justify-between">
              <span className="text-white/40">Voice</span>
              <span className="text-white/90">{data.voice_provider}</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-200 font-mono">
          {error}
          {error.includes('cold start') || error.includes('timed out') ? (
            <div className="mt-1 text-red-300/60">Backend may take a few seconds to respond. Try rechecking shortly.</div>
          ) : null}
        </div>
      )}

      {/* Last checked */}
      {lastChecked && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/30 font-mono">
          <Activity className="w-2.5 h-2.5" />
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={runCheck}
          disabled={status === 'checking'}
          className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/80 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
          Recheck
        </button>
        <a
          href={`${BACKEND_URL}/docs`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all"
        >
          <ExternalLink className="w-3 h-3" /> Swagger Docs
        </a>
        <a
          href={`${BACKEND_URL}/health`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-all"
        >
          <ExternalLink className="w-3 h-3" /> Health Check
        </a>
      </div>
    </div>
  );
}
