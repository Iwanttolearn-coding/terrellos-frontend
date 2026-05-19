/**
 * apiClient.js — TerrellOS / Heavenly Eternal Echo
 * ─────────────────────────────────────────────────────────────────
 * Centralized HTTP transport layer.
 * ALL backend calls go here. No Base44 SDK. No inline fetch().
 *
 * Backend: https://terrellos-backend.onrender.com (Render / FastAPI v7)
 * Docs:    https://terrellos-backend.onrender.com/docs
 *
 * Usage:
 *   import { api } from '@/lib/apiClient';
 *   const res = await api.post('/v1/memory/session/start', { user_id, consent_confirmed: true });
 *   const res = await api.post('/chat', { message: 'Hello' });
 *   const res = await api.upload(file);  // multipart
 * ─────────────────────────────────────────────────────────────────
 */

// ── Config ────────────────────────────────────────────────────────
const API_BASE =
  typeof import.meta !== 'undefined'
    ? (import.meta.env?.VITE_BACKEND_URL || import.meta.env?.VITE_API_URL || 'https://terrellos-backend.onrender.com')
    : 'https://terrellos-backend.onrender.com';

const DEFAULT_TIMEOUT_MS = 30_000;   // 30s normal requests
const UPLOAD_TIMEOUT_MS  = 90_000;   // 90s for file uploads
const COLD_START_WARN_MS = 6_000;    // Show "waking up" hint after 6s

// ── Internal helpers ──────────────────────────────────────────────
function buildUrl(path) {
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
}

function withTimeout(promise, ms, label = '') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Request timed out${label ? ` [${label}]` : ''} — backend may be waking up on Render`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function coldStartWatcher(ms = COLD_START_WARN_MS) {
  const id = setTimeout(() => {
    console.info('[apiClient] Backend is taking longer than usual — Render cold start likely');
  }, ms);
  return () => clearTimeout(id);
}

// ── Core JSON request ─────────────────────────────────────────────
async function request(method, path, body = null, options = {}) {
  const url      = buildUrl(path);
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const headers  = { 'Content-Type': 'application/json', ...options.headers };

  const config = {
    method: method.toUpperCase(),
    headers,
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  };

  const cancelColdStart = coldStartWatcher();

  try {
    const res = await withTimeout(fetch(url, config), timeoutMs, `${method} ${path}`);
    cancelColdStart();

    if (!res.ok) {
      let errBody = '';
      try { errBody = await res.text(); } catch {}
      const err = new Error(`HTTP ${res.status} on ${method} ${path}: ${errBody.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();

  } catch (err) {
    cancelColdStart();
    console.error(`[apiClient] ${method} ${path} failed:`, err.message);
    throw err;
  }
}

// ── Multipart file upload ─────────────────────────────────────────
async function upload(file, path = '/v1/upload', options = {}) {
  const url = buildUrl(path);
  const formData = new FormData();
  formData.append('file', file);

  const cancelColdStart = coldStartWatcher();

  try {
    const res = await withTimeout(
      fetch(url, { method: 'POST', body: formData, ...options.fetchOptions }),
      options.timeout ?? UPLOAD_TIMEOUT_MS,
      'upload'
    );
    cancelColdStart();

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      const err = new Error(`Upload failed HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } catch (err) {
    cancelColdStart();
    console.error('[apiClient] upload failed:', err.message);
    throw err;
  }
}

// ── Health check util ─────────────────────────────────────────────
async function healthCheck() {
  try {
    const data = await request('GET', '/health', null, { timeout: 10_000 });
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

// ── Public API ────────────────────────────────────────────────────
export const api = {
  get:         (path, opts)       => request('GET',    path, null, opts),
  post:        (path, body, opts) => request('POST',   path, body, opts),
  put:         (path, body, opts) => request('PUT',    path, body, opts),
  patch:       (path, body, opts) => request('PATCH',  path, body, opts),
  delete:      (path, body, opts) => request('DELETE', path, body, opts),
  upload,
  healthCheck,
  baseUrl: API_BASE,
};

// ── Base44 backend function invoker ──────────────────────────────
export async function safeInvoke(functionName, payload = {}) {
  try {
    const { base44 } = await import('@/api/base44Client');
    const res = await base44.functions.invoke(functionName, payload);
    return res;
  } catch (err) {
    console.error(`[safeInvoke] ${functionName} failed:`, err.message);
    return { data: null, error: err.message };
  }
}

export async function sendChat(message, history = []) {
  return request('POST', '/chat', { message, history });
}

export default api;