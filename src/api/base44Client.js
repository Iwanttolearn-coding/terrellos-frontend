/**
 * base44Client.js — TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * Stub client that replaces @base44/sdk dependency.
 * All real API calls go through src/lib/terrellOS.js → Fly.io backend.
 *
 * Provides auth helpers (me, logout, redirectToLogin) that other
 * components depend on, without pulling in the Base44 SDK package.
 * ─────────────────────────────────────────────────────────────────
 */
import { appParams } from '@/lib/app-params';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

// ── Auth helpers ──────────────────────────────────────────────────
const auth = {
  async me() {
    const token = appParams.token;
    if (!token) throw Object.assign(new Error('No token'), { status: 401 });

    const res = await fetch(`${BACKEND_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw Object.assign(new Error('Auth failed'), { status: res.status });
    }
    return res.json();
  },

  logout(redirectUrl) {
    // Clear any stored tokens
    try {
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('token');
    } catch (_) {}
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  redirectToLogin(returnUrl) {
    const base = import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://app.base44.com';
    const appId = import.meta.env.VITE_BASE44_APP_ID || appParams.appId || '';
    const url = `${base}/apps/${appId}?from_url=${encodeURIComponent(returnUrl || window.location.href)}`;
    window.location.href = url;
  },
};

// ── Exported client ───────────────────────────────────────────────
export const base44 = {
  auth,
};
