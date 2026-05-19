import { useState, useEffect } from 'react';
import { healthCheck, BACKEND_BASE_URL } from '@/lib/terrellOS';
import { resolveUserAccess } from '@/lib/founderAccess';
import { base44 } from '@/api/base44Client';
import { Server, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BackendStatus() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    checkHealth();
  }, []);

  async function checkHealth() {
    setChecking(true);
    const result = await healthCheck();
    setStatus(result);
    setLastChecked(new Date());
    setChecking(false);
  }

  const access = resolveUserAccess(user);
  const isOnline = status?.ok && status?.online;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
          <Server className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Backend Status</h1>
          <p className="text-xs text-muted-foreground font-mono">TerrellOS live backend health</p>
        </div>
      </div>

      {/* Main status card */}
      <div className={`rounded-2xl p-6 border mb-6 ${
        checking ? 'bg-primary/5 border-primary/25' :
        isOnline ? 'bg-emerald-500/10 border-emerald-500/30' :
        status?.coldStart ? 'bg-yellow-500/10 border-yellow-500/30' :
        'bg-destructive/10 border-destructive/30'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {checking ? (
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            ) : isOnline ? (
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            ) : status?.coldStart ? (
              <Server className="w-8 h-8 text-yellow-400 animate-pulse" />
            ) : (
              <XCircle className="w-8 h-8 text-destructive" />
            )}
            <div>
              <div className={`text-lg font-bold ${
                checking ? 'text-primary' :
                isOnline ? 'text-emerald-400' :
                status?.coldStart ? 'text-yellow-400' : 'text-destructive'
              }`}>
                {checking ? 'Checking…' :
                 isOnline ? 'Backend Online' :
                 status?.coldStart ? 'Backend Waking Up…' : 'Backend Offline'}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">{BACKEND_BASE_URL}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={checkHealth} disabled={checking} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              Retry
            </Button>
            <a href={BACKEND_BASE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </Button>
            </a>
          </div>
        </div>

        {status?.coldStart && (
          <p className="text-xs text-yellow-300 mt-3">
            The TerrellOS backend on Render is spinning up. This takes a few seconds on first request. Please retry.
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-glass rounded-xl p-4 border border-border">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">RESPONSE TIME</div>
          <div className="text-lg font-bold text-foreground font-mono">
            {status?.latency ? `${status.latency}ms` : '—'}
          </div>
        </div>
        <div className="card-glass rounded-xl p-4 border border-border">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">LAST CHECKED</div>
          <div className="text-sm font-mono text-foreground">
            {lastChecked ? lastChecked.toLocaleTimeString() : '—'}
          </div>
        </div>
        <div className="card-glass rounded-xl p-4 border border-border">
          <div className="text-[10px] font-mono text-muted-foreground mb-1">ENVIRONMENT</div>
          <div className="text-sm font-mono text-emerald-400 font-bold">PRODUCTION</div>
        </div>
      </div>

      {/* Founder-only details */}
      {access.isFounder && (
        <div className="card-glass rounded-2xl p-5 border border-border">
          <h3 className="text-sm font-bold text-foreground mb-3">Backend Details (Founder View)</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backend URL</span>
              <span className="text-foreground">{BACKEND_BASE_URL}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VITE_BACKEND_URL set</span>
              <span className={import.meta.env?.VITE_BACKEND_URL ? 'text-emerald-400' : 'text-yellow-400'}>
                {import.meta.env?.VITE_BACKEND_URL ? 'YES' : 'FALLBACK (hardcoded)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={isOnline ? 'text-emerald-400' : 'text-destructive'}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-[10px] text-muted-foreground font-mono">
        Powered by TM Designz™
      </div>
    </div>
  );
}