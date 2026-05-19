import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/env';
import { Activity, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { APP_VERSION, ENVIRONMENT } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

// All checks use direct fetch — no Base44 SDK in any check
const SERVICES = [
  {
    key: 'render_backend',
    label: 'Render Backend',
    check: async () => {
      const r = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json().catch(() => ({}));
      return { ok: true, msg: d?.status || 'Healthy' };
    },
  },
  {
    key: 'chat_endpoint',
    label: 'Chat API (/chat)',
    check: async () => {
      const r = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'ping', history: [] }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.status === 404) return { ok: false, msg: 'Route not found (404)' };
      if (!r.ok) return { ok: false, msg: `HTTP ${r.status}` };
      const d = await r.json().catch(() => ({}));
      return { ok: true, msg: d?.reply ? 'Responding' : 'Connected' };
    },
  },
  {
    key: 'github',
    label: 'GitHub',
    check: async () => {
      const r = await fetch('https://www.githubstatus.com/api/v2/status.json', { signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      const ok = d?.status?.indicator === 'none';
      return { ok, msg: d?.status?.description || 'Unknown' };
    },
  },
  {
    key: 'vercel_frontend',
    label: 'Vercel Frontend',
    check: async () => {
      const r = await fetch('https://terrellos-pvc8.vercel.app', { signal: AbortSignal.timeout(6000), mode: 'no-cors' });
      return { ok: true, msg: 'Reachable' };
    },
  },
  {
    key: 'elevenlabs',
    label: 'ElevenLabs TTS',
    check: async () => {
      const r = await fetch('https://api.elevenlabs.io/v1/voices', { signal: AbortSignal.timeout(5000) });
      return { ok: r.status !== 0, msg: r.ok ? 'Reachable' : `HTTP ${r.status} (API key needed)` };
    },
  },
  {
    key: 'voice_stt',
    label: 'Voice STT (/voice/stt)',
    check: async () => {
      // Only check if route exists — don't crash if it doesn't
      const r = await fetch(`${API_BASE_URL}/voice/stt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(5000),
      });
      if (r.status === 404 || r.status === 405) return { ok: false, msg: 'Route pending — add to FastAPI' };
      return { ok: r.ok, msg: r.ok ? 'Connected' : `HTTP ${r.status}` };
    },
  },
];

const STATUS_MAP = {
  pass: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/20', label: 'PASS' },
  warn: { icon: AlertCircle, color: 'text-yellow-400',  bg: 'bg-yellow-500/8 border-yellow-500/20',   label: 'WARN' },
  fail: { icon: XCircle,     color: 'text-destructive', bg: 'bg-destructive/8 border-destructive/20',  label: 'FAIL' },
  pend: { icon: Clock,       color: 'text-muted-foreground', bg: 'bg-muted/20 border-border',          label: '—' },
};

export default function SystemStatus() {
  const [statuses, setStatuses] = useState({});
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function runAllChecks() {
    if (!mountedRef.current) return;
    setRunning(true);
    setStatuses({});
    await Promise.all(SERVICES.map(async svc => {
      try {
        const result = await svc.check();
        if (mountedRef.current) {
          setStatuses(prev => ({ ...prev, [svc.key]: { status: result.ok ? 'pass' : 'fail', msg: result.msg } }));
        }
      } catch (err) {
        if (mountedRef.current) {
          const msg = err.name === 'AbortError' ? 'Timed out' : (err.message?.slice(0, 60) || 'Error');
          setStatuses(prev => ({ ...prev, [svc.key]: { status: 'fail', msg } }));
        }
      }
    }));
    if (mountedRef.current) {
      setLastRun(new Date());
      setRunning(false);
    }
  }

  useEffect(() => { runAllChecks(); }, []);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (autoRefresh) intervalRef.current = setInterval(runAllChecks, 30000);
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  const passCount = Object.values(statuses).filter(s => s.status === 'pass').length;
  const failCount = Object.values(statuses).filter(s => s.status === 'fail').length;
  const overall = failCount > 0 ? (failCount >= 3 ? 'critical' : 'degraded') : passCount === SERVICES.length ? 'healthy' : 'checking';

  const OVERALL_STYLE = {
    healthy:  'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    degraded: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    critical: 'bg-destructive/10 border-destructive/30 text-destructive',
    checking: 'bg-muted/20 border-border text-muted-foreground',
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">System Status</h1>
            <div className="text-xs text-muted-foreground">
              {lastRun ? `Last checked ${formatDistanceToNow(lastRun, { addSuffix: true })}` : 'Checking…'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${autoRefresh ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
          >
            {autoRefresh ? '● AUTO' : '○ AUTO'}
          </button>
          <Button size="sm" variant="outline" onClick={runAllChecks} disabled={running}>
            <RefreshCw className={`w-3 h-3 mr-1 ${running ? 'animate-spin' : ''}`} /> Run Checks
          </Button>
        </div>
      </div>

      <div className={`rounded-xl border px-4 py-3 mb-5 flex items-center gap-3 ${OVERALL_STYLE[overall]}`}>
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${overall === 'healthy' ? 'bg-emerald-400' : overall === 'degraded' ? 'bg-yellow-400' : overall === 'critical' ? 'bg-destructive' : 'bg-muted-foreground'} animate-pulse`} />
        <span className="text-sm font-bold uppercase tracking-wide">{overall}</span>
        <span className="text-xs opacity-70 ml-auto">{passCount}/{SERVICES.length} services passing</span>
      </div>

      {/* Render cold-start notice */}
      {statuses['render_backend']?.status === 'fail' && (
        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/8 px-4 py-3 text-xs text-yellow-300 font-mono">
          ⚡ Render backend may be cold-starting. Try again in 30–60 seconds.
        </div>
      )}

      <div className="space-y-2">
        {SERVICES.map(svc => {
          const s = statuses[svc.key];
          const state = s ? STATUS_MAP[s.status] || STATUS_MAP.pend : STATUS_MAP.pend;
          const Icon = state.icon;
          return (
            <div key={svc.key} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${state.bg} transition-all`}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${state.color} ${running && !s ? 'animate-pulse' : ''}`} />
              <span className="text-sm text-foreground flex-1">{svc.label}</span>
              <span className={`text-xs font-mono ${state.color}`}>{state.label}</span>
              {s?.msg && <span className="text-xs text-muted-foreground font-mono">{s.msg}</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-1 text-xs text-muted-foreground font-mono text-center">
        <div>ENVIRONMENT: {ENVIRONMENT?.toUpperCase() ?? 'PRODUCTION'} · v{APP_VERSION ?? '—'}</div>
        <div className="opacity-60">{API_BASE_URL}</div>
      </div>
    </div>
  );
}
