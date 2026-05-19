/**
 * TerrellOS System Health Service
 * Centralized runtime health monitoring — tracks backend state,
 * latency, cold-starts, failure counts, and hydration status.
 * Import anywhere. React hook: useSystemHealth()
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://terrellos-backend.onrender.com';

// ── Internal state (module-level singleton) ───────────────────────────────────
let _state = {
  backendHealthy: null,       // null = unknown, true/false
  backendLatency: null,       // ms
  lastSuccessfulRequest: null,// Date
  backendColdStarting: false,
  apiFailureCount: 0,
  apiSuccessCount: 0,
  retryCount: 0,
  frontendRuntimeHealthy: true,
  lastError: null,
  initialized: false,
};

const _listeners = new Set();

function notify() {
  _listeners.forEach(fn => {
    try { fn({ ..._state }); } catch {}
  });
}

export function subscribe(fn) {
  _listeners.add(fn);
  fn({ ..._state }); // immediate snapshot
  return () => _listeners.delete(fn);
}

export function getHealth() {
  return { ..._state };
}

// ── Core ping ─────────────────────────────────────────────────────────────────
export async function pingHealth() {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    // If it's slow, show cold-start message after 4s
    const coldTimer = setTimeout(() => {
      _state.backendColdStarting = true;
      notify();
    }, 4000);

    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timer);
    clearTimeout(coldTimer);

    const latency = Date.now() - start;
    const ok = res.ok;

    _state.backendHealthy = ok;
    _state.backendLatency = latency;
    _state.backendColdStarting = false;
    _state.initialized = true;

    if (ok) {
      _state.lastSuccessfulRequest = new Date();
      _state.apiSuccessCount++;
      _state.lastError = null;
    } else {
      _state.apiFailureCount++;
      _state.lastError = `Health check returned HTTP ${res.status}`;
    }

    notify();
    return { ok, latency };
  } catch (err) {
    const latency = Date.now() - start;
    const isTimeout = err.name === 'AbortError';

    _state.backendHealthy = false;
    _state.backendLatency = latency;
    _state.backendColdStarting = isTimeout;
    _state.apiFailureCount++;
    _state.lastError = isTimeout
      ? 'Backend is waking up on Render…'
      : err.message;
    _state.initialized = true;

    notify();
    return { ok: false, latency, error: _state.lastError };
  }
}

// ── Called by apiClient on every request outcome ──────────────────────────────
export function recordSuccess(latency) {
  _state.backendHealthy = true;
  _state.backendLatency = latency;
  _state.lastSuccessfulRequest = new Date();
  _state.backendColdStarting = false;
  _state.apiSuccessCount++;
  _state.lastError = null;
  notify();
}

export function recordFailure(error, isRetry = false) {
  _state.backendHealthy = false;
  _state.apiFailureCount++;
  _state.lastError = error?.message || String(error);
  if (isRetry) _state.retryCount++;
  notify();
}

export function recordRuntimeError(error) {
  _state.frontendRuntimeHealthy = false;
  _state.lastError = error?.message || String(error);
  notify();
}

export function resetHealth() {
  _state = {
    backendHealthy: null,
    backendLatency: null,
    lastSuccessfulRequest: null,
    backendColdStarting: false,
    apiFailureCount: 0,
    apiSuccessCount: 0,
    retryCount: 0,
    frontendRuntimeHealthy: true,
    lastError: null,
    initialized: false,
  };
  notify();
}

// ── Auto-ping on load + every 60s ─────────────────────────────────────────────
let _pingInterval = null;

export function startHealthMonitor(intervalMs = 60000) {
  pingHealth(); // immediate
  if (_pingInterval) clearInterval(_pingInterval);
  _pingInterval = setInterval(pingHealth, intervalMs);
  return () => {
    clearInterval(_pingInterval);
    _pingInterval = null;
  };
}

export function stopHealthMonitor() {
  clearInterval(_pingInterval);
  _pingInterval = null;
}
