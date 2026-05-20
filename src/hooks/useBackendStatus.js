/**
 * useBackendStatus.js — TerrellOS / TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * Hook for polling /status from the Render backend.
 * Returns capability flags: chat, voice, images, transcribe, memory.
 *
 * Usage:
 *   const { status, capabilities, loading, error, recheck, lastChecked } = useBackendStatus();
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { checkBackendHealth, checkBackendStatus, API_BASE_URL } from '@/lib/api';

export function useBackendStatus(autoRefreshMs = 0) {
  const [status,       setStatus]       = useState(null);   // raw /status response
  const [health,       setHealth]       = useState(null);   // raw /health response
  const [capabilities, setCapabilities] = useState(null);   // capabilities object
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [lastChecked,  setLastChecked]  = useState(null);
  const [latencyMs,    setLatencyMs]    = useState(null);
  const intervalRef = useRef(null);

  const recheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    const t0 = Date.now();
    try {
      const [statusRes, healthRes] = await Promise.allSettled([
        checkBackendStatus(),
        checkBackendHealth(),
      ]);

      const s = statusRes.status === 'fulfilled' ? statusRes.value : null;
      const h = healthRes.status  === 'fulfilled' ? healthRes.value  : null;

      setStatus(s);
      setHealth(h);
      setLatencyMs(Date.now() - t0);
      setLastChecked(new Date());

      // Merge capabilities from both endpoints
      setCapabilities({
        chat:        s?.capabilities?.chat       ?? h?.openai_configured     ?? false,
        voice:       s?.capabilities?.voice      ?? h?.elevenlabs_configured  ?? false,
        images:      s?.capabilities?.images     ?? h?.openai_configured      ?? false,
        transcribe:  s?.capabilities?.transcribe ?? h?.openai_configured      ?? false,
        memory:      s?.capabilities?.memory     ?? true,
        uploads:     s?.capabilities?.uploads    ?? true,
        online:      !!(s || h),
        version:     s?.version ?? h?.version ?? '—',
        openai:      h?.openai_configured  ?? false,
        elevenlabs:  h?.elevenlabs_configured ?? false,
      });
    } catch (err) {
      setError(err.message);
      setCapabilities({ online: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recheck();
    if (autoRefreshMs > 0) {
      intervalRef.current = setInterval(recheck, autoRefreshMs);
    }
    return () => clearInterval(intervalRef.current);
  }, [recheck, autoRefreshMs]);

  return {
    status,
    health,
    capabilities,
    loading,
    error,
    recheck,
    lastChecked,
    latencyMs,
    backendUrl: API_BASE_URL,
    online: capabilities?.online ?? false,
  };
}

export default useBackendStatus;
