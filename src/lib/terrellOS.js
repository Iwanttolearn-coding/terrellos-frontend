/**
 * terrellOS.js — TerrellOS Unified API Layer
 * Backend: Fly.io
 */

export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://terrellos-backend.fly.dev'

const BASE_URL = BACKEND_BASE_URL
const TIMEOUT = 30000

async function apiFetch(path, options = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      'X-App-ID': import.meta.env.VITE_APP_ID || 'terrellos',
        ...(options.headers || {})
      },
      signal: ctrl.signal,
      ...options
    })

    clearTimeout(t)

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.detail || data.error || `HTTP ${res.status}`)
    }

    return data
  } catch (e) {
    clearTimeout(t)

    if (e.name === 'AbortError') {
      throw new Error('Backend waking up — please retry in a moment')
    }

    throw e
  }
}

export const healthCheck = () =>
  apiFetch('/health').catch(() => ({
    success: false,
    status: 'offline',
    error: true
  }))

export const sendChat = (message, opts = {}) =>
  apiFetch('/v1/core/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      max_tokens:    opts.max_tokens    || 1500,
      language:      opts.language      || 'en',
      output_language: opts.outputLanguage || opts.language || 'en',
      app_id:        'terrellos',
      ...opts,
    })
  })

export const speakText = (payload) =>
  apiFetch('/v1/voice/speak', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

export const companionRespond = (message) =>
  apiFetch('/v1/companion/respond', {
    method: 'POST',
    body: JSON.stringify({ message })
  })

export const companionVoice = (message) =>
  apiFetch('/v1/companion/voice', {
    method: 'POST',
    body: JSON.stringify({ message })
  })

export const companionVoiceAuto = (message) =>
  apiFetch('/v1/companion/voice/auto', {
    method: 'POST',
    body: JSON.stringify({ message })
  })

export const startMemorySession = (payload) =>
  apiFetch('/v1/memory/session/start', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}/v1/upload`, {
    method: 'POST',
    body: formData
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Upload failed')
  }

  return data
}

export const generateSermon = (p) =>
  apiFetch('/v1/pastor/sermon', { method: 'POST', body: JSON.stringify(p) })

export const generateBibleStudy = (p) =>
  apiFetch('/v1/pastor/bible-study', { method: 'POST', body: JSON.stringify(p) })

export const generateDiscipleshipLesson = (p) =>
  apiFetch('/v1/pastor/discipleship', { method: 'POST', body: JSON.stringify(p) })

export const generateDenominationStudy = (p) =>
  apiFetch('/v1/pastor/denomination', { method: 'POST', body: JSON.stringify(p) })

export const generateChurchHistoryStudy = (p) =>
  apiFetch('/v1/pastor/church-history', { method: 'POST', body: JSON.stringify(p) })

export const generateMartyrProfile = (p) =>
  apiFetch('/v1/pastor/martyr', { method: 'POST', body: JSON.stringify(p) })

export const generateChristianHeroProfile = (p) =>
  apiFetch('/v1/pastor/christian-hero', { method: 'POST', body: JSON.stringify(p) })

export const generateApologeticsAnswer = (p) =>
  apiFetch('/v1/pastor/apologetics', { method: 'POST', body: JSON.stringify(p) })

export const generatePrayer = (p) =>
  apiFetch('/v1/pastor/prayer', { method: 'POST', body: JSON.stringify(p) })

export const generateLessonPlan = (p) =>
  apiFetch('/v1/pastor/lesson-plan', { method: 'POST', body: JSON.stringify(p) })
export const getSystemLogs = async () => {
  try {
    const health = await healthCheck()

    return {
      success: true,
      logs: [
        {
          id: 'backend-health',
          level: health?.status === 'healthy' ? 'success' : 'warning',
          service: 'TerrellOS Backend',
          message: `Backend status: ${health?.status || 'unknown'}`,
          timestamp: new Date().toISOString()
        },
        {
          id: 'backend-url',
          level: 'info',
          service: 'API Layer',
          message: `Connected backend: ${BACKEND_BASE_URL}`,
          timestamp: new Date().toISOString()
        }
      ]
    }
  } catch (error) {
    return {
      success: false,
      logs: [
        {
          id: 'backend-error',
          level: 'error',
          service: 'TerrellOS Backend',
          message: error?.message || 'Failed to load system logs',
          timestamp: new Date().toISOString()
        }
      ]
    }
  }
}
