/**
 * api.js — TerrellOS / TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * Global API config. ALL backend calls go through here.
 * Backend: https://terrellos-backend.fly.dev
 * ─────────────────────────────────────────────────────────────────
 */

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://terrellos-backend.fly.dev';

const TIMEOUT_MS = 30_000;

// ── Core fetch ────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timer);

    let data = null;
    try { data = await res.json(); } catch { data = null; }

    if (!res.ok) {
      throw new Error(
        data?.detail || data?.message || `API error ${res.status}`
      );
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — backend may be waking up on Render (~30s cold start)');
    }
    throw err;
  }
}

// ── Named route helpers ───────────────────────────────────────────

/** GET /health — returns backend status, version, configured services */
export async function checkBackendHealth() {
  const start = Date.now();
  const data = await apiFetch('/health');
  return { ...data, latency_ms: Date.now() - start };
}

/** GET /status — lightweight capability overview */
export async function checkBackendStatus() {
  return apiFetch('/status');
}

/** POST /chat — general TerrellOS chat */
export async function sendChatMessage(message, context = {}) {
  return apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });
}

/** POST /v1/companion/respond — Eternal Echo companion AI */
export async function companionRespond(message, profileId = 'default', userId = null) {
  return apiFetch('/v1/companion/respond', {
    method: 'POST',
    body: JSON.stringify({ message, profile_id: profileId, user_id: userId }),
  });
}

/** POST /v1/voice/speak — ElevenLabs TTS, returns audio_base64 */
export async function speakText(text, voiceId = null) {
  return apiFetch('/v1/voice/speak', {
    method: 'POST',
    body: JSON.stringify({ text, voice_id: voiceId }),
  });
}

/** POST /v1/companion/voice/auto — AI reply + voice in one call */
export async function companionVoiceAuto(message, voiceId = null, userId = null) {
  return apiFetch('/v1/companion/voice/auto', {
    method: 'POST',
    body: JSON.stringify({ message, voice_id: voiceId, user_id: userId }),
  });
}

/** POST /v1/images/generate — DALL-E 3 image generation */
export async function generateImage(prompt, options = {}) {
  return apiFetch('/v1/images/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt, ...options }),
  });
}

/** POST /v1/images/memorial — spiritual/memorial scene generator */
export async function generateMemorialImage(prompt, options = {}) {
  return apiFetch('/v1/images/memorial', {
    method: 'POST',
    body: JSON.stringify({ prompt, ...options }),
  });
}

/** POST /v1/memory/session/start */
export async function startMemorySession(userId, opts = {}) {
  return apiFetch('/v1/memory/session/start', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      consent_confirmed: opts.consentConfirmed ?? true,
      voice_active: opts.voiceActive ?? false,
      camera_active: opts.cameraActive ?? false,
    }),
  });
}

/** POST /v1/memory/session/transcript */
export async function saveMemoryTranscript(sessionId, transcript) {
  return apiFetch('/v1/memory/session/transcript', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, transcript }),
  });
}

/** POST /v1/memory/session/end */
export async function endMemorySession(sessionId) {
  return apiFetch('/v1/memory/session/end', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

/** GET /v1/memory/profile/:id */
export async function getMemoryProfile(profileId) {
  return apiFetch(`/v1/memory/profile/${profileId}`);
}

/** POST /v1/memory/consent */
export async function saveMemoryConsent(userId, consentData = {}) {
  return apiFetch('/v1/memory/consent', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, consent_confirmed: true, ...consentData }),
  });
}

/** POST /v1/memory/export */
export async function exportMemory(userId) {
  return apiFetch('/v1/memory/export', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

/** DELETE /v1/memory/delete */
export async function deleteMemory(userId) {
  return apiFetch('/v1/memory/delete', {
    method: 'DELETE',
    body: JSON.stringify({ user_id: userId }),
  });
}

/** Legacy-compat aliases (used in older components) */
export async function saveMemory(memory) {
  return apiFetch('/v1/memory/session/transcript', {
    method: 'POST',
    body: JSON.stringify(memory),
  });
}

export async function searchMemory(query) {
  return apiFetch('/v1/memory/export', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

/** POST /v1/admin/check-grant */
export async function checkAdminGrant(email) {
  return apiFetch('/v1/admin/check-grant', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** GET /v1/admin/stats */
export async function getAdminStats() {
  return apiFetch('/v1/admin/stats');
}

/** Multipart upload — POST /v1/upload */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch(`${API_BASE_URL}/v1/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** Transcribe audio — POST /v1/memory/transcribe */
export async function transcribeAudio(audioFile) {
  const formData = new FormData();
  formData.append('file', audioFile);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${API_BASE_URL}/v1/memory/transcribe`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Transcribe failed: HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}
