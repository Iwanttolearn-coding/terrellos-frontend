/**
 * Supabase session helpers — thin wrapper around localStorage.
 * Single source of truth for the Supabase access token.
 */

const KEY = 'sb_access_token';

export const supabaseSession = {
  getToken: () => localStorage.getItem(KEY) || null,
  setToken: (t) => localStorage.setItem(KEY, t),
  clearToken: () => localStorage.removeItem(KEY),
  isLoggedIn: () => !!localStorage.getItem(KEY),
};