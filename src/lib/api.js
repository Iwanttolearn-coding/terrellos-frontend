/**
 * api.js — TerrellOS / TerrellOS
 * ═══════════════════════════════════════════════════════════════
 * SINGLE CENTRAL API LAYER. Import from here everywhere.
 * All calls go to VITE_BACKEND_URL → terrellos-backend.fly.dev
 * No scattered hardcoded URLs. No demo mode. Real data only.
 */
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = import.meta.env.VITE_APP_ID || 'terrellos';
const TIMEOUT = 30000;

export { BACKEND as BACKEND_URL };

async function apiFetch(path, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      ...options,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': APP_ID,
        ...(options.headers || {}),
      },
    });
    clearTimeout(t);
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error(data?.detail || data?.message || data?.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    clearTimeout(t);
    if (err.name === 'AbortError') throw new Error('Request timed out — backend may be waking up, retry in a moment');
    throw err;
  }
}

// ── Health ─────────────────────────────────────────────────────────────────
export const checkBackendHealth = () =>
  apiFetch('/health').catch(() => ({ status: 'offline', success: false }));

// ── Chat ───────────────────────────────────────────────────────────────────
export const sendChat = (message, context = []) =>
  apiFetch('/v1/core/chat', { method: 'POST', body: JSON.stringify({ message, context, app_id: APP_ID }) });

// ── Image Generation ───────────────────────────────────────────────────────
export const generateImage = (prompt, opts = {}) =>
  apiFetch('/v1/design/generate-image', { method: 'POST', body: JSON.stringify({ prompt, ...opts, app_id: APP_ID }) });

export const generateMemorialImage = (prompt, opts = {}) =>
  apiFetch('/v1/design/memorial-image', { method: 'POST', body: JSON.stringify({ prompt, ...opts, app_id: APP_ID }) });

// ── Tattoo ─────────────────────────────────────────────────────────────────
export const generateTattoo = (prompt, style, opts = {}) =>
  apiFetch('/v1/tattoo/generate', { method: 'POST', body: JSON.stringify({ prompt, style, ...opts, app_id: APP_ID }) });

export const getTattooStyles = () =>
  apiFetch('/v1/tattoo/styles');

// ── Voice ──────────────────────────────────────────────────────────────────
export const speakText = (text, voice_id = null) =>
  apiFetch('/v1/voice/speak', { method: 'POST', body: JSON.stringify({ text, voice_id, app_id: APP_ID }) });

export const transcribeAudio = (formData) =>
  fetch(`${BACKEND}/v1/voice/transcribe`, {
    method: 'POST',
    headers: { 'X-App-ID': APP_ID },
    body: formData,
    signal: AbortSignal.timeout(30000),
  }).then(r => r.json());

// ── Memory ─────────────────────────────────────────────────────────────────
export const getMemoryProfile = (profileId) =>
  apiFetch(`/v1/memory/profile/${profileId}`);

export const startMemorySession = (payload) =>
  apiFetch('/v1/memory/session/start', { method: 'POST', body: JSON.stringify({ ...payload, app_id: APP_ID }) });

// ── Pastor (proxied through shared backend) ────────────────────────────────
export const generateSermon  = (p) => apiFetch('/v1/pastor/sermon',      { method: 'POST', body: JSON.stringify({ ...p, app_id: APP_ID }) });
export const bibleStudy      = (p) => apiFetch('/v1/pastor/bible-study', { method: 'POST', body: JSON.stringify({ ...p, app_id: APP_ID }) });
export const generateDevotional = (p) => apiFetch('/v1/pastor/devotional', { method: 'POST', body: JSON.stringify({ ...p, app_id: APP_ID }) });
