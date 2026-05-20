/**
 * resolveUserAccess.js — TerrellOS Universal Permission Resolver
 * ─────────────────────────────────────────────────────────────────
 * ONE function. Used everywhere. Never read raw user.plan or user.role directly.
 * Founder emails always resolve to full access — cannot be overridden by DB state.
 */

const FOUNDER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com',
];

export function resolveUserAccess(user) {
  // Not loaded yet — return safe loading state (not guest, not founder)
  if (user === undefined) {
    return {
      loading: true,
      role: 'loading',
      plan: 'loading',
      founder: false,
      toolsAccess: false,
      adminAccess: false,
      unrestricted: false,
    };
  }
  // No user — guest
  if (!user) {
    return {
      loading: false,
      role: 'guest',
      plan: 'free',
      founder: false,
      toolsAccess: false,
      adminAccess: false,
      unrestricted: false,
    };
  }
  const email = (user.email || '').toLowerCase().trim();
  // Founder override — always full access
  if (FOUNDER_EMAILS.includes(email)) {
    return {
      loading: false,
      role: 'super_admin',
      plan: 'elite',
      founder: true,
      toolsAccess: true,
      adminAccess: true,
      unrestricted: true,
      isSuperAdmin: true,
      allToolsUnlocked: true,
      billingBypass: true,
      displayPlan: 'Founder ✦',
    };
  }
  // Regular user — read from DB but never null-crash
  const role = user.role || 'member';
  const plan = user.plan || 'free';
  const isPro = ['pro', 'premium', 'elite', 'heritage', 'family'].includes(plan);
  const isAdmin = ['admin', 'super_admin', 'moderator'].includes(role);
  return {
    loading: false,
    role,
    plan,
    founder: false,
    toolsAccess: isPro || isAdmin || user.all_tools_access === true,
    adminAccess: isAdmin,
    unrestricted: false,
    isSuperAdmin: role === 'super_admin',
    allToolsUnlocked: user.all_tools_access === true,
    billingBypass: false,
    displayPlan: plan.charAt(0).toUpperCase() + plan.slice(1),
  };
}

export function isFounder(email) {
  if (!email) return false;
  return FOUNDER_EMAILS.includes(email.toLowerCase().trim());
}

export { FOUNDER_EMAILS };
