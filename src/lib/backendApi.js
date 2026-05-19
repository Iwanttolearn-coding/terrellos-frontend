/**
 * TerrellOS Production API Layer
 * All requests go through this module — never call fetch() directly in pages.
 * Handles: auth headers, retries, timeouts, graceful error UI, upload support.
 */

import { API_BASE_URL } from '@/lib/env';
import { base44 } from '@/api/base44Client';

const TIMEOUT_MS = 20000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1200;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

// ── Header builder ──────────────────────────────────────────────────────────
async function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  try {
    const settings = await base44.entities.SystemSettings.filter({ key: 'PYTHON_BACKEND_API_KEY' });
    const apiKey = settings?.[0]?.value;
    if (apiKey) headers['X-API-Key'] = apiKey;
  } catch {}
  return headers;
}

// ── Core fetch with retry + timeout ────────────────────────────────────────
async function apiFetch(endpoint, options = {}, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);

    if (res.status === 404) {
      const err = new Error(`NOT_FOUND: ${endpoint}`);
      err.status = 404;
      throw err;
    }
    if (res.status === 429) {
      const err = new Error('RATE_LIMITED: Too many requests');
      err.status = 429;
      throw err;
    }
    if (res.status === 401 || res.status === 403) {
      const err = new Error('UNAUTHORIZED');
      err.status = res.status;
      throw err;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`HTTP_${res.status}: ${text.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res;
  } catch (err) {
    clearTimeout(timer);

    const retryable = err.name === 'AbortError' || RETRYABLE_STATUSES.has(err.status);
    if (retryable && attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      return apiFetch(endpoint, options, attempt + 1);
    }

    if (err.name === 'AbortError') throw new Error('TIMEOUT: Request timed out. Backend may be cold-starting on Render.');
    throw err;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────
export async function getHealth() {
  const start = Date.now();
  const data = await apiFetch('/health', { method: 'GET' });
  return { ...data, latency_ms: Date.now() - start };
}

export async function pingBackend() {
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, latency_ms: Date.now() - start, status: res.status };
  } catch (err) {
    return { ok: false, latency_ms: Date.now() - start, error: err.message };
  }
}

export async function postJSON(endpoint, body = {}) {
  const headers = await buildHeaders();
  return apiFetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
}

export async function getJSON(endpoint) {
  const headers = await buildHeaders();
  return apiFetch(endpoint, { method: 'GET', headers });
}

export async function streamChat(endpoint, body, onChunk, signal) {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 404) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
    throw new Error(`HTTP_${res.status}: ${text.slice(0, 200)}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/event-stream') || ct.includes('text/plain')) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        let token = '';
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try { token = JSON.parse(data)?.choices?.[0]?.delta?.content || ''; } catch { token = data; }
        } else {
          token = line;
        }
        if (token) onChunk(token);
      }
    }
    if (buffer.trim()) onChunk(buffer);
  } else {
    const data = await res.json();
    const text = data?.reply || data?.response || data?.message || data?.content ||
      (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    onChunk(text);
  }
}

export async function uploadFileToBackend(file) {
  const headers = await buildHeaders({ 'Content-Type': undefined });
  delete headers['Content-Type'];
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    headers,
    body: form,
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  return res.json();
}

// ── Legacy compat exports (existing pages use these names) ─────────────────
export { postJSON as postData, getJSON as getData, postJSON as callBackend };
export { postJSON as sendBuildCommand };

export async function testBackendConnection(connection) {
  const url = connection?.base_url || API_BASE_URL;
  const start = Date.now();
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(8000) });
    const duration = Date.now() - start;
    if (!res.ok) return { success: false, message: `HTTP ${res.status}`, duration_ms: duration };
    let data = {};
    try { data = await res.json(); } catch {}
    return { success: true, message: 'Backend connected ✓', duration_ms: duration, data };
  } catch (err) {
    return { success: false, message: err.name === 'AbortError' ? 'Timed out (8s)' : err.message, duration_ms: Date.now() - start };
  }
}

export function isOwner(user) {
  const OWNER_EMAILS = ['millzterrell210@icloud.com', 'millzterrell5@gmail.com'];
  if (!user) return false;
  return OWNER_EMAILS.map(e => e.toLowerCase()).includes(user.email?.toLowerCase()) || user.role === 'admin';
}