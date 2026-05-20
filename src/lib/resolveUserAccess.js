/**
 * resolveUserAccess.js — TM Dezigns AI Designer / TerrellOS
 * ═══════════════════════════════════════════════════════════
 * SINGLE GLOBAL AUTHORITY RESOLVER. Use this everywhere.
 * Import resolveUserAccess(user) in every page, route guard,
 * tool, dashboard card, admin panel, and payment gate.
 *
 * Rules:
 *   1. Founder emails ALWAYS resolve to super_admin / elite.
 *   2. No raw DB value (guest/free/member) can override founder.
 *   3. Re-applied on every localStorage load to prevent stale cache.
 *   4. All gates must call resolveUserAccess — no scattered role checks.
 */

export const FOUNDER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com',
];

const STORAGE_KEY = 'terrellos_user';

/** True if this email belongs to the founder */
export function isFounder(email) {
  return FOUNDER_EMAILS.includes((email || '').toLowerCase().trim());
}

/**
 * resolveUserAccess(user) → access object
 *
 * Returns:
 *   role              — 'super_admin' | 'admin' | 'member' | 'guest'
 *   plan              — 'founder' | 'elite' | 'pro' | 'basic' | 'free'
 *   founder           — boolean
 *   allAccess         — boolean (unrestricted tools/pages)
 *   toolsEnabled      — boolean
 *   subscriptionStatus — 'active' | 'inactive'
 *   canUseAI          — boolean
 *   canUpload         — boolean
 *   canViewAdmin      — boolean
 *   displayName       — string
 */
export function resolveUserAccess(user) {
  // No user at all — guest
  if (!user || !user.email) {
    return {
      role: 'guest',
      plan: 'free',
      founder: false,
      allAccess: false,
      toolsEnabled: false,
      subscriptionStatus: 'inactive',
      canUseAI: false,
      canUpload: false,
      canViewAdmin: false,
      displayName: 'Guest',
    };
  }

  // ── FOUNDER ALWAYS WINS — no DB value can downgrade this ──────────────────
  if (isFounder(user.email)) {
    return {
      role: 'super_admin',
      plan: 'founder',
      founder: true,
      allAccess: true,
      toolsEnabled: true,
      subscriptionStatus: 'active',
      canUseAI: true,
      canUpload: true,
      canViewAdmin: true,
      displayName: user.display_name || user.full_name || 'Terrell Millz',
    };
  }

  // ── Normal user — respect DB values with safe fallbacks ───────────────────
  const role = user.role || 'member';
  const plan = user.plan || 'free';
  const isAdmin   = role === 'admin' || role === 'super_admin';
  const isPaid    = ['pro', 'elite', 'basic', 'founder'].includes(plan);
  const isActive  = user.subscription_status === 'active' || user.subscriptionStatus === 'active' || isPaid;

  return {
    role,
    plan,
    founder: false,
    allAccess: isAdmin,
    toolsEnabled: isAdmin || isPaid,
    subscriptionStatus: isActive ? 'active' : 'inactive',
    canUseAI: isAdmin || isPaid,
    canUpload: isAdmin || isPaid,
    canViewAdmin: isAdmin,
    displayName: user.display_name || user.full_name || user.email.split('@')[0],
  };
}

// ── localStorage helpers ───────────────────────────────────────────────────

export function saveUser(user) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
}

export function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Re-apply founder override on every load — prevents stale role cache
    if (isFounder(user?.email)) {
      return {
        ...user,
        role: 'super_admin',
        plan: 'founder',
        all_tools_access: true,
      };
    }
    return user;
  } catch { return null; }
}

export function clearUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('terrellos_token');
  } catch {}
}
