/**
 * resolveUserAccess.js — TM Dezigns / TerrellOS
 * ════════════════════════════════════════════════════════════
 * THE ONLY SOURCE OF TRUTH FOR ACCESS CONTROL.
 *
 * Rules (immutable):
 *   1. Founder emails ALWAYS resolve hasAccess:true, role:"founder".
 *   2. No DB value, cached role, or plan string can downgrade founder.
 *   3. Every page/guard/tool calls resolveUserAccess(user) — nothing else.
 *   4. Shape is stable: { hasAccess, role, plan, founder, allAccess,
 *      toolsEnabled, canViewAdmin, canUseAI, canUpload,
 *      subscriptionStatus, displayName }
 *
 * Banned patterns (never use these again):
 *   Remove: base44.auth, getEffectiveAccess, isSuperAdmin, allToolsUnlocked, founderAccess, ownerConfig
 */

export const FOUNDER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com',
];

const STORAGE_KEY = 'terrellos_user';

// ── Helpers ──────────────────────────────────────────────────────────────────
export function isFounder(email) {
  return FOUNDER_EMAILS.includes((email || '').toLowerCase().trim());
}

// localStorage helpers
export function saveUser(user) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
}
export function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    // Re-apply founder override on every load — never trust stale role in cache
    if (isFounder(u?.email)) {
      return { ...u, role: 'founder', plan: 'founder', founder: true, all_tools_access: true };
    }
    return u;
  } catch { return null; }
}
export function clearUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('terrellos_token');
  } catch {}
}

// ── Main resolver ─────────────────────────────────────────────────────────────
/**
 * resolveUserAccess(user) → access object
 *
 * Call this in EVERY page, guard, tool, billing gate, admin check.
 * Never read user.role or user.plan directly — always go through this.
 */
export function resolveUserAccess(user) {
  // ── No user — guest ────────────────────────────────────────────────────────
  if (!user || !user.email) {
    return {
      hasAccess:          false,
      role:               'guest',
      plan:               'free',
      founder:            false,
      allAccess:          false,
      toolsEnabled:       false,
      canViewAdmin:       false,
      canUseAI:           false,
      canUpload:          false,
      subscriptionStatus: 'inactive',
      displayName:        'Guest',
      // legacy aliases
      isSuperAdmin:       false,
      allToolsUnlocked:   false,
      isFounder:          false,
    };
  }

  // ── FOUNDER — always wins, no exceptions ───────────────────────────────────
  if (isFounder(user.email)) {
    const name = user.display_name || user.full_name || 'Terrell Millz';
    return {
      hasAccess:          true,
      role:               'founder',
      plan:               'founder',
      founder:            true,
      allAccess:          true,
      toolsEnabled:       true,
      canViewAdmin:       true,
      canUseAI:           true,
      canUpload:          true,
      subscriptionStatus: 'active',
      displayName:        name,
      // legacy aliases — so any old isSuperAdmin check still passes
      isSuperAdmin:       true,
      allToolsUnlocked:   true,
      isFounder:          true,
    };
  }

  // ── Normal user ────────────────────────────────────────────────────────────
  const role   = user.role  || 'member';
  const plan   = user.plan  || 'free';
  const isAdmin  = role === 'admin' || role === 'super_admin';
  const isPaid   = ['pro','elite','basic','founder','premium'].includes(plan);
  const isActive = user.subscription_status === 'active' || user.subscriptionStatus === 'active' || isPaid;

  return {
    hasAccess:          !!user,
    role,
    plan,
    founder:            false,
    allAccess:          isAdmin,
    toolsEnabled:       isAdmin || isPaid,
    canViewAdmin:       isAdmin,
    canUseAI:           isAdmin || isPaid,
    canUpload:          isAdmin || isPaid,
    subscriptionStatus: isActive ? 'active' : 'inactive',
    displayName:        user.display_name || user.full_name || user.email.split('@')[0],
    // legacy aliases
    isSuperAdmin:       isAdmin,
    allToolsUnlocked:   isAdmin || isPaid,
    isFounder:          false,
  };
}

export default resolveUserAccess;
