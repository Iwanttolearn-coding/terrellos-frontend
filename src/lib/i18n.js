import en from '@/lib/locales/en.json';
import es from '@/lib/locales/es.json';

const locales = { en, es };

let currentLang = localStorage.getItem('terrellos_lang') || 'en';

export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('terrellos_lang', lang);
}

export function getLanguage() {
  return currentLang;
}

/**
 * t('nav.dashboard') → "Command Center"
 * t('common.save')   → "Save"
 * Falls back to key if not found.
 */
export function t(key) {
  const parts = key.split('.');
  let val = locales[currentLang];
  for (const part of parts) {
    val = val?.[part];
    if (val === undefined) break;
  }
  if (val !== undefined) return val;

  // Fallback to English
  let fallback = locales['en'];
  for (const part of parts) {
    fallback = fallback?.[part];
    if (fallback === undefined) break;
  }
  return fallback ?? key;
}

/**
 * Legacy flat-key support (e.g. t('dashboard') → 'Command Center')
 * Searches all namespaces for a matching key.
 */
export function tLegacy(key) {
  const locale = locales[currentLang] || locales['en'];
  for (const ns of Object.values(locale)) {
    if (typeof ns === 'object' && ns[key] !== undefined) return ns[key];
  }
  return locales['en']?.[key] ?? key;
}