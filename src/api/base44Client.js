/**
 * base44Client.js — TerrellOS
 * No external SDK. Pure fetch-based auth stub.
 * All real API calls go through src/lib/terrellOS.js
 */

import { appParams } from '@/lib/app-params';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

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
    try {
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('token');
    } catch (_) {}
    if (redirectUrl) window.location.href = redirectUrl;
  },

  redirectToLogin(returnUrl) {
    const base = import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://app.base44.com';
    const appId = import.meta.env.VITE_BASE44_APP_ID || appParams.appId || '';
    window.location.href = `${base}/apps/${appId}?from_url=${encodeURIComponent(returnUrl || window.location.href)}`;
  },
};

export const base44 = { auth };
