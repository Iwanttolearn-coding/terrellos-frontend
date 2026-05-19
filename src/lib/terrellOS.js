/**
 * terrellOS.js — TerrellOS Unified API Layer
 * Backend: https://terrellos-backend.fly.dev
 */
const BASE_URL = (typeof import !== 'undefined' && import.meta?.env?.VITE_BACKEND_URL)
  || 'https://terrellos-backend.fly.dev'
const TIMEOUT = 30000

async function apiFetch(path, options = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
      signal: ctrl.signal,
      ...options
    })
    clearTimeout(t)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch(e) {
    clearTimeout(t)
    if (e.name === 'AbortError') throw new Error('Backend waking up — please retry in a moment')
    throw e
  }
}

export const healthCheck = () =>
  apiFetch('/health').catch(() => ({ status: 'offline', error: true }))

export const generateSermon = (p) =>
  apiFetch('/v1/pastor/sermon', { method:'POST', body: JSON.stringify(p) })

export const generateBibleStudy = (p) =>
  apiFetch('/v1/pastor/bible-study', { method:'POST', body: JSON.stringify(p) })

export const generateDiscipleshipLesson = (p) =>
  apiFetch('/v1/pastor/discipleship', { method:'POST', body: JSON.stringify(p) })

export const generateDenominationStudy = (p) =>
  apiFetch('/v1/pastor/denomination', { method:'POST', body: JSON.stringify(p) })

export const generateChurchHistoryStudy = (p) =>
  apiFetch('/v1/pastor/church-history', { method:'POST', body: JSON.stringify(p) })

export const generateMartyrProfile = (p) =>
  apiFetch('/v1/pastor/martyr', { method:'POST', body: JSON.stringify(p) })

export const generateChristianHeroProfile = (p) =>
  apiFetch('/v1/pastor/christian-hero', { method:'POST', body: JSON.stringify(p) })

export const generateApologeticsAnswer = (p) =>
  apiFetch('/v1/pastor/apologetics', { method:'POST', body: JSON.stringify(p) })

export const generatePrayer = (p) =>
  apiFetch('/v1/pastor/prayer', { method:'POST', body: JSON.stringify(p) })

export const generateLessonPlan = (p) =>
  apiFetch('/v1/pastor/lesson-plan', { method:'POST', body: JSON.stringify(p) })

export const speakText = (p) =>
  apiFetch('/v1/voice/speak', { method:'POST', body: JSON.stringify(p) })
