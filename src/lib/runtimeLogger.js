/**
 * TerrellOS Runtime Logger
 * Centralized frontend event log — API failures, render crashes,
 * hydration errors, route errors, retries.
 * Feeds: FounderDashboard, Diagnostics, ProductionHealthMonitor.
 */

const MAX_ENTRIES = 200;

export const LOG_LEVEL = {
  INFO:  'info',
  WARN:  'warn',
  ERROR: 'error',
  DEBUG: 'debug',
};

export const LOG_CATEGORY = {
  API:       'api',
  AUTH:      'auth',
  RENDER:    'render',
  ROUTE:     'route',
  HYDRATION: 'hydration',
  SYSTEM:    'system',
  RETRY:     'retry',
  PERF:      'perf',
};

let _entries = [];
let _listeners = new Set();

function emit(entry) {
  _entries.unshift(entry);
  if (_entries.length > MAX_ENTRIES) _entries.length = MAX_ENTRIES;
  _listeners.forEach(fn => { try { fn(entry, [..._entries]); } catch {} });

  // Mirror to browser console with appropriate level
  const meta = `[TerrellOS:${entry.category}]`;
  if (entry.level === LOG_LEVEL.ERROR) console.error(meta, entry.message, entry.data || '');
  else if (entry.level === LOG_LEVEL.WARN) console.warn(meta, entry.message, entry.data || '');
  else if (entry.level === LOG_LEVEL.DEBUG) console.debug(meta, entry.message, entry.data || '');
  else console.info(meta, entry.message, entry.data || '');
}

export function log(level, category, message, data = null) {
  emit({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  });
}

// ── Convenience helpers ───────────────────────────────────────────────────────
export const logger = {
  info:  (cat, msg, data) => log(LOG_LEVEL.INFO,  cat, msg, data),
  warn:  (cat, msg, data) => log(LOG_LEVEL.WARN,  cat, msg, data),
  error: (cat, msg, data) => log(LOG_LEVEL.ERROR, cat, msg, data),
  debug: (cat, msg, data) => log(LOG_LEVEL.DEBUG, cat, msg, data),

  // Typed helpers
  apiSuccess: (endpoint, latency)       => log(LOG_LEVEL.INFO,  LOG_CATEGORY.API,  `${endpoint} → 200 (${latency}ms)`),
  apiFailure: (endpoint, status, msg)   => log(LOG_LEVEL.ERROR, LOG_CATEGORY.API,  `${endpoint} → ${status}: ${msg}`),
  apiRetry:   (endpoint, attempt)       => log(LOG_LEVEL.WARN,  LOG_CATEGORY.RETRY,`${endpoint} retry #${attempt}`),
  apiTimeout: (endpoint)                => log(LOG_LEVEL.WARN,  LOG_CATEGORY.API,  `${endpoint} timed out`),

  authEvent: (msg, data)                => log(LOG_LEVEL.INFO,  LOG_CATEGORY.AUTH, msg, data),
  renderCrash: (component, err)         => log(LOG_LEVEL.ERROR, LOG_CATEGORY.RENDER, `${component}: ${err?.message || err}`),
  routeError: (path, msg)               => log(LOG_LEVEL.ERROR, LOG_CATEGORY.ROUTE, `${path}: ${msg}`),
  hydrationFail: (msg)                  => log(LOG_LEVEL.WARN,  LOG_CATEGORY.HYDRATION, msg),
  systemEvent: (msg, data)              => log(LOG_LEVEL.INFO,  LOG_CATEGORY.SYSTEM, msg, data),
};

// ── Subscribe to new log entries ─────────────────────────────────────────────
export function onLog(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── Read log ──────────────────────────────────────────────────────────────────
export function getLogs(filter = {}) {
  let entries = [..._entries];
  if (filter.level)    entries = entries.filter(e => e.level === filter.level);
  if (filter.category) entries = entries.filter(e => e.category === filter.category);
  if (filter.limit)    entries = entries.slice(0, filter.limit);
  return entries;
}

export function clearLogs() {
  _entries = [];
  _listeners.forEach(fn => { try { fn(null, []); } catch {} });
}

export function getLogSummary() {
  const errors  = _entries.filter(e => e.level === LOG_LEVEL.ERROR).length;
  const warns   = _entries.filter(e => e.level === LOG_LEVEL.WARN).length;
  const retries = _entries.filter(e => e.category === LOG_CATEGORY.RETRY).length;
  const apiErrors = _entries.filter(e => e.category === LOG_CATEGORY.API && e.level === LOG_LEVEL.ERROR).length;
  return { total: _entries.length, errors, warns, retries, apiErrors };
}

// ── Global uncaught error capture ─────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    logger.error(LOG_CATEGORY.SYSTEM, `Unhandled promise rejection: ${e.reason?.message || e.reason}`, { reason: String(e.reason) });
  });
  window.addEventListener('error', (e) => {
    logger.error(LOG_CATEGORY.RENDER, `Uncaught error: ${e.message}`, { filename: e.filename, line: e.lineno });
  });
}
