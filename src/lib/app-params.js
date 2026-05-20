/**
 * app-params.js — TerrellOS
 * Reads optional token from URL query string for embedded/shared contexts.
 * Safe fallback to empty values — app never blocks on missing params.
 */
function getParam(name) {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

const token = getParam('access_token') || getParam('token') || localStorage.getItem('terrellos_token') || null;

export const appParams = {
  appId: import.meta.env.VITE_APP_ID || 'terrellos',
  token,
  functionsVersion: 'v3',
  appBaseUrl: import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev',
};
