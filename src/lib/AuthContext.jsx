/**
 * AuthContext.jsx — TerrellOS Standalone Auth
 * ─────────────────────────────────────────────────────────────────
 * NO Base44 platform dependency. NO /api/apps/public calls.
 * Auth is local-first: checks localStorage for saved email/session,
 * then validates against the TerrellOS backend if a token exists.
 * Founders bypass all checks — full access always.
 */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { resolveUserAccess, isFounder, FOUNDER_EMAILS } from '@/lib/resolveUserAccess';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID = import.meta.env.VITE_APP_ID || 'terrellos';
const STORAGE_KEY = 'terrellos_user';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Computed from user — never read raw values elsewhere
  const access = resolveUserAccess(user);

  const isAuthenticated = user !== null && user !== undefined && !access.loading;

  const initAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      // 1. Check localStorage for persisted session
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.email) {
            // Apply founder override immediately — no async needed
            const resolved = isFounder(parsed.email)
              ? { ...parsed, role: 'super_admin', plan: 'founder', all_tools_access: true, founder: true }
              : parsed;
            setUser(resolved);
            setIsLoadingAuth(false);
            setAuthChecked(true);
            return;
          }
        } catch {}
      }

      // 2. No saved session — check if this is an embedded/tokenized context
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('access_token') || urlParams.get('token');
      const storedToken = localStorage.getItem('terrellos_token');
      const token = urlToken || storedToken;

      if (token) {
        if (urlToken) {
          localStorage.setItem('terrellos_token', urlToken);
          // Clean token from URL
          urlParams.delete('access_token');
          urlParams.delete('token');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
        }
        // Try to validate token with backend
        try {
          const res = await fetch(`${BACKEND_URL}/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}`, 'X-App-ID': APP_ID },
            signal: AbortSignal.timeout(8000),
          });
          if (res.ok) {
            const data = await res.json();
            const resolved = isFounder(data.email)
              ? { ...data, role: 'super_admin', plan: 'founder', all_tools_access: true, founder: true }
              : data;
            setUser(resolved);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
            setIsLoadingAuth(false);
            setAuthChecked(true);
            return;
          }
        } catch (e) {
          console.warn('[Auth] Token validation failed, clearing token');
          localStorage.removeItem('terrellos_token');
        }
      }

      // 3. No session, no token — set user to null (guest) and continue
      setUser(null);
    } catch (e) {
      console.error('[Auth] Init error:', e);
      setUser(null); // fail open — don't block the app
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // ── Founder shortcut login ─────────────────────────────────────────────────
  const loginAsFounder = useCallback((email) => {
    if (!isFounder(email)) return false;
    const founderUser = {
      email,
      role: 'super_admin',
      plan: 'elite',
      all_tools_access: true,
      display_name: 'Terrell Millz',
    };
    setUser(founderUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(founderUser));
    return true;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback((shouldRedirect = false) => {
    setUser(null);
    setAuthChecked(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('terrellos_token');
    if (shouldRedirect) window.location.href = '/';
  }, []);

  // ── Legacy compat — navigateToLogin just goes to / ─────────────────────────
  const navigateToLogin = useCallback(() => {
    // Don't redirect to Base44. Just clear state and let the app handle it.
    logout(false);
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      user,
      access,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      loginAsFounder,
      checkUserAuth: initAuth,
      checkAppState: initAuth,
      founderAccess: access.founder ? access : null,
      appPublicSettings: { app_name: 'TerrellOS' },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
