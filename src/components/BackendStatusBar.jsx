/**
 * BackendStatusBar — persistent, non-intrusive status indicator.
 * Shows backend health, latency, and cold-start warnings.
 * Mounts in Layout.jsx — visible on every page.
 * Auto-hides when backend is healthy + no issues for 5s.
 */
import { useEffect, useState } from 'react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Wifi, WifiOff, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function BackendStatusBar() {
  const {
    backendHealthy,
    backendLatency,
    backendColdStarting,
    apiFailureCount,
    initialized,
    lastError,
  } = useSystemHealth();

  const [visible, setVisible] = useState(false);
  const [dismissTimer, setDismissTimer] = useState(null);

  useEffect(() => {
    if (!initialized) return;

    // Show bar on: cold-start, failure, or first-time healthy confirmation
    if (backendColdStarting || backendHealthy === false) {
      setVisible(true);
      clearTimeout(dismissTimer);
      return;
    }

    if (backendHealthy === true) {
      setVisible(true);
      // Auto-hide after 4s once confirmed healthy
      const t = setTimeout(() => setVisible(false), 4000);
      setDismissTimer(t);
    }

    return () => clearTimeout(dismissTimer);
  }, [backendHealthy, backendColdStarting, initialized]);

  if (!visible || !initialized) return null;

  // Cold-starting state
  if (backendColdStarting) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 text-xs font-mono shadow-lg backdrop-blur-sm">
        <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        Backend is waking up on Render… (~30s)
        <button onClick={() => setVisible(false)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      </div>
    );
  }

  // Backend offline / failed
  if (backendHealthy === false) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-destructive/15 border border-destructive/40 text-red-300 text-xs font-mono shadow-lg backdrop-blur-sm max-w-sm">
        <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">Backend offline — {lastError || 'check Render'}</span>
        <button onClick={() => setVisible(false)} className="ml-2 opacity-60 hover:opacity-100 flex-shrink-0">✕</button>
      </div>
    );
  }

  // Backend healthy confirmation
  if (backendHealthy === true) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono shadow-lg backdrop-blur-sm">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        Backend online {backendLatency != null ? `· ${backendLatency}ms` : ''}
        <button onClick={() => setVisible(false)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      </div>
    );
  }

  return null;
}
