/**
 * base44Client.js — TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * Minimal stub. No external SDK. No Base44 platform calls.
 * All real auth lives in AuthContext.jsx + resolveUserAccess.js
 */
import { appParams } from '@/lib/app-params';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

const auth = {
  async me() {
    const token = appParams.token || localStorage.getItem('terrellos_token');
    if (!token) throw Object.assign(new Error('No token'), { status: 401 });
    const res = await fetch(`${BACKEND_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, 'X-App-ID': 'terrellos' },
    });
    if (!res.ok) throw Object.assign(new Error('Auth failed'), { status: res.status });
    return res.json();
  },
  logout(redirectUrl) {
    localStorage.removeItem('terrellos_user');
    localStorage.removeItem('terrellos_token');
    // Redirect within the app, never to Base44 platform
    window.location.href = redirectUrl || '/';
  },
  redirectToLogin(returnUrl) {
    // Stay in-app — no external redirect
    window.location.href = '/';
  },
};

export const base44 = { auth };
