import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { API_BASE_URL } from '@/lib/env';
import { formatDistanceToNow } from 'date-fns';

function detectEnv(url) {
  if (!url) return 'UNKNOWN';
  if (url.includes('onrender.com')) return 'PRODUCTION';
  if (url.includes('localhost') || url.includes('127.0.0.1')) return 'LOCAL';
  return 'PREVIEW';
}

function getLabel(url) {
  const env = detectEnv(url);
  if (env === 'PRODUCTION') return 'TerrelleOS Production Backend';
  if (env === 'LOCAL') return 'Local Development Backend';
  return 'Preview Backend';
}

export default function BackendStatusBanner() {
  const [status, setStatus] = useState('checking'); // checking | connected | disconnected
  const [lastPing, setLastPing] = useState(null);
  const [pingMs, setPingMs] = useState(null);

  const env = detectEnv(API_BASE_URL);
  const label = getLabel(API_BASE_URL);

  async function ping() {
    setStatus('checking');
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        setPingMs(Date.now() - start);
        setLastPing(new Date());
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    } catch {
      setStatus('disconnected');
    }
  }

  useEffect(() => {
    ping();
    const interval = setInterval(ping, 60000); // re-ping every 60s
    return () => clearInterval(interval);
  }, []);

  const isConnected = status === 'connected';
  const isChecking = status === 'checking';

  return (
    <div className={`rounded-2xl border p-4 mb-6 ${isConnected ? 'bg-emerald-500/5 border-emerald-500/20' : isChecking ? 'bg-muted/30 border-border' : 'bg-red-500/5 border-red-500/20'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isChecking ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : isConnected ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isConnected ? 'text-emerald-400' : isChecking ? 'text-muted-foreground' : 'text-red-400'}`}>
              {isChecking ? 'Checking backend…' : isConnected ? 'Backend connected' : 'Backend disconnected'}
            </span>

            {isConnected && (
              <>
                <span className="text-muted-foreground text-sm">—</span>
                <span className="text-sm text-foreground">{label}</span>
                {env === 'PRODUCTION' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    <Wifi className="w-3 h-3" /> LIVE
                  </span>
                )}
                {env === 'LOCAL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider">
                    LOCAL
                  </span>
                )}
              </>
            )}

            {!isConnected && !isChecking && (
              <Link to="/settings" className="text-xs text-red-300 underline">Configure in Settings</Link>
            )}
          </div>

          {/* Detail row */}
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
            <span>{API_BASE_URL}</span>
            {pingMs !== null && isConnected && <span>{pingMs}ms</span>}
            {lastPing && isConnected && (
              <span>Last ping: {formatDistanceToNow(lastPing, { addSuffix: true })}</span>
            )}
            <span className={`font-semibold uppercase tracking-wider ${env === 'PRODUCTION' ? 'text-emerald-500' : env === 'LOCAL' ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {env}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}