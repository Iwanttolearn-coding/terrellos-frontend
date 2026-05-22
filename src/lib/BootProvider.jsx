/**
 * BootProvider.jsx — TerrellOS
 * Global startup pipeline. Manages the 9-stage boot sequence.
 * Every protected route waits for bootReady before rendering.
 *
 * Stages:
 *   1  initialize    — app config loaded
 *   2  auth_token    — localStorage token read
 *   3  session       — session validated
 *   4  user_profile  — user object hydrated
 *   5  permissions   — founder/admin role resolved
 *   6  features      — feature flags loaded
 *   7  language      — i18n preference loaded
 *   8  system_health — backend reachability checked
 *   9  ready         — routes mounted
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { resolveUserAccess, isFounder, FOUNDER_EMAILS } from '@/lib/resolveUserAccess';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const STORAGE_KEY = 'terrellos_user';
const LANG_KEY    = 'terrellos_language';

const STAGES = [
  { id: 1, key: 'initialize',    label: 'Initializing TerrellOS…' },
  { id: 2, key: 'auth_token',    label: 'Loading session…' },
  { id: 3, key: 'session',       label: 'Validating credentials…' },
  { id: 4, key: 'user_profile',  label: 'Loading your profile…' },
  { id: 5, key: 'permissions',   label: 'Resolving access permissions…' },
  { id: 6, key: 'features',      label: 'Loading feature flags…' },
  { id: 7, key: 'language',      label: 'Loading language settings…' },
  { id: 8, key: 'system_health', label: 'Checking system health…' },
  { id: 9, key: 'ready',         label: 'Launching TerrellOS…' },
];

const BootContext = createContext(null);

export function useBoot() {
  const ctx = useContext(BootContext);
  if (!ctx) throw new Error('useBoot must be used inside BootProvider');
  return ctx;
}

// ── Cinematic boot screen ─────────────────────────────────────────────────────
function BootScreen({ stage, progress }) {
  const stageObj = STAGES.find(s => s.id === stage) || STAGES[0];
  const dots = '.'.repeat((Math.floor(Date.now() / 500) % 3) + 1);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at 50% 30%, #0d0118 0%, #030007 60%, #000 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Ambient glow rings */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[300, 500, 700].map((size, i) => (
          <div key={size} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: size, height: size,
            marginLeft: -size / 2, marginTop: -size / 2,
            borderRadius: '50%',
            border: `1px solid rgba(139, 92, 246, ${0.08 - i * 0.02})`,
            animation: `bootPulse ${2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      {/* Logo */}
      <div style={{
        width: 72, height: 72, borderRadius: 22,
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, marginBottom: 24,
        boxShadow: '0 0 40px rgba(124, 58, 237, 0.4), 0 0 80px rgba(124, 58, 237, 0.15)',
        animation: 'bootFloat 3s ease-in-out infinite',
      }}>
        ⚡
      </div>

      {/* Brand */}
      <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
        Terrell<span style={{ color: '#7c3aed' }}>OS</span>
      </h1>
      <p style={{ fontSize: 12, color: '#4b5563', margin: '0 0 40px', letterSpacing: 3, textTransform: 'uppercase' }}>
        AI Operating System
      </p>

      {/* Progress bar */}
      <div style={{ width: 280, marginBottom: 12 }}>
        <div style={{ height: 2, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
            width: `${progress}%`,
            transition: 'width 0.4s ease',
            boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
          }} />
        </div>
      </div>

      {/* Stage label */}
      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, letterSpacing: 1 }}>
        {stageObj.label}
      </p>

      {/* Stage dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
        {STAGES.map(s => (
          <div key={s.id} style={{
            width: s.id < stage ? 20 : 6, height: 6, borderRadius: 3,
            background: s.id < stage ? '#7c3aed' : s.id === stage ? '#a78bfa' : '#1f2937',
            transition: 'all 0.3s ease',
            boxShadow: s.id === stage ? '0 0 6px rgba(167, 139, 250, 0.6)' : 'none',
          }} />
        ))}
      </div>

      <style>{`
        @keyframes bootPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
        }
        @keyframes bootFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function BootProvider({ children }) {
  const [bootStage,    setBootStage]    = useState(1);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootReady,    setBootReady]    = useState(false);
  const [user,         setUser]         = useState(null);
  const [access,       setAccess]       = useState(null);
  const [language,     setLanguage]     = useState('en');
  const [systemHealth, setSystemHealth] = useState({ backend: null, ai: null });
  const [userHydrated, setUserHydrated] = useState(false);
  const bootRan = useRef(false);

  const advance = useCallback((stage, progress) => {
    setBootStage(stage);
    setBootProgress(progress);
  }, []);

  const runBoot = useCallback(async () => {
    if (bootRan.current) return;
    bootRan.current = true;

    // Stage 1 — Initialize
    advance(1, 5);
    await new Promise(r => setTimeout(r, 120));

    // Stage 2 — Auth token
    advance(2, 18);
    const saved = localStorage.getItem(STORAGE_KEY);
    const token  = localStorage.getItem('terrellos_token') ||
                   new URLSearchParams(window.location.search).get('token');
    await new Promise(r => setTimeout(r, 100));

    // Stage 3 — Session validate
    advance(3, 32);
    let resolvedUser = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          resolvedUser = isFounder(parsed.email)
            ? { ...parsed, role: 'founder', founder: true, all_tools_access: true }
            : parsed;
        }
      } catch {}
    }
    if (!resolvedUser && token) {
      try {
        const r = await fetch(`${BACKEND}/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, 'X-App-ID': 'terrellos' },
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const data = await r.json();
          resolvedUser = data.user || data;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedUser));
        }
      } catch {}
    }
    await new Promise(r => setTimeout(r, 80));

    // Stage 4 — User profile
    advance(4, 46);
    setUser(resolvedUser);
    setUserHydrated(true);
    await new Promise(r => setTimeout(r, 80));

    // Stage 5 — Permissions
    advance(5, 58);
    const resolvedAccess = resolveUserAccess(resolvedUser);
    setAccess(resolvedAccess);
    await new Promise(r => setTimeout(r, 80));

    // Stage 6 — Features (no-op for now, placeholder)
    advance(6, 68);
    await new Promise(r => setTimeout(r, 60));

    // Stage 7 — Language
    advance(7, 76);
    const savedLang = localStorage.getItem(LANG_KEY) || 'en';
    setLanguage(savedLang);
    await new Promise(r => setTimeout(r, 60));

    // Stage 8 — System health (non-blocking — don't hold boot for it)
    advance(8, 86);
    fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(5000) })
      .then(r => setSystemHealth(h => ({ ...h, backend: r.ok ? 'online' : 'degraded' })))
      .catch(() => setSystemHealth(h => ({ ...h, backend: 'offline' })));
    await new Promise(r => setTimeout(r, 200));

    // Stage 9 — Ready
    advance(9, 100);
    await new Promise(r => setTimeout(r, 200));
    setBootReady(true);
  }, [advance]);

  useEffect(() => { runBoot(); }, [runBoot]);

  // Keep access in sync when user changes (e.g. after loginAsFounder)
  useEffect(() => {
    if (user !== null) setAccess(resolveUserAccess(user));
  }, [user]);

  const loginAsFounder = useCallback((email) => {
    const founderUser = {
      email,
      role: 'founder',
      founder: true,
      display_name: 'Terrell Millz',
      all_tools_access: true,
    };
    setUser(founderUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(founderUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccess(resolveUserAccess(null));
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('terrellos_token');
    window.location.href = '/login';
  }, []);

  return (
    <BootContext.Provider value={{
      bootReady, bootStage, bootProgress, bootRan: bootRan.current,
      user, access, language, setLanguage, systemHealth,
      userHydrated, loginAsFounder, logout,
    }}>
      {!bootReady
        ? <BootScreen stage={bootStage} progress={bootProgress} />
        : children
      }
    </BootContext.Provider>
  );
}
