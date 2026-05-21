/**
 * resolveUserAccess.js — TerrellOS
 * THE ONLY SOURCE OF TRUTH FOR ACCESS CONTROL.
 * Rules (immutable):
 *   1. Founder emails ALWAYS resolve hasAccess:true, role:"founder".
 *   2. No DB value, cached role, or plan string can downgrade founder.
 *   3. Every page/guard/tool calls resolveUserAccess(user) — nothing else.
 */

export const FOUNDER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com',
];

const STORAGE_KEY = 'terrellos_user';

export function isFounder(email) {
  return FOUNDER_EMAILS.includes((email || '').toLowerCase().trim());
}

export function saveUser(user) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
}
export function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
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

// Full permissions map — every tool key resolves to true/false
function buildPermissions(allAccess, isPaid) {
  const base = {
    ai_tools: true,
    chat_engine: true,
    voice_lab: isPaid || allAccess,
    avatar_lab: isPaid || allAccess,
    memory_vault: isPaid || allAccess,
    creator_vault: isPaid || allAccess,
    tattoo_studio: isPaid || allAccess,
    projects: true,
    uploads: true,
    logs: allAccess,
    system_status: allAccess,
    database: allAccess,
    api_manager: allAccess,
    analytics: allAccess,
    admin: allAccess,
    developer_tools: allAccess,
    live_console: allAccess,
    cost_manager: allAccess,
    automation_engine: allAccess,
    app_registry: allAccess,
    print_readiness: isPaid || allAccess,
    style_advisor: isPaid || allAccess,
    background_selector: isPaid || allAccess,
    workflow_editor: allAccess,
  };
  // Founder: everything true
  if (allAccess) {
    return Object.fromEntries(Object.keys(base).map(k => [k, true]));
  }
  return base;
}

export function resolveUserAccess(user) {
  if (!user || !user.email) {
    const perms = buildPermissions(false, false);
    return {
      hasAccess: false, role: 'guest', plan: 'free',
      founder: false, allAccess: false,
      toolsEnabled: false, canUseTools: false,
      canViewAdmin: false, canUseAI: false, canUpload: false,
      subscriptionStatus: 'inactive', displayName: 'Guest',
      isSuperAdmin: false, allToolsUnlocked: false, isFounder: false,
      permissions: perms,
    };
  }

  // FOUNDER — always wins
  if (isFounder(user.email)) {
    const name = user.display_name || user.full_name || 'Terrell Millz';
    const perms = buildPermissions(true, true);
    return {
      hasAccess: true, role: 'founder', plan: 'founder',
      founder: true, allAccess: true,
      toolsEnabled: true, canUseTools: true,
      canViewAdmin: true, canUseAI: true, canUpload: true,
      subscriptionStatus: 'active', displayName: name,
      isSuperAdmin: true, allToolsUnlocked: true, isFounder: true,
      permissions: perms,
    };
  }

  // Normal user
  const role     = user.role  || 'member';
  const plan     = user.plan  || 'free';
  const isAdmin  = role === 'admin' || role === 'super_admin';
  const isPaid   = ['pro','elite','basic','founder','premium'].includes(plan);
  const isActive = user.subscription_status === 'active' || user.subscriptionStatus === 'active' || isPaid;
  const allAccess = isAdmin;
  const perms    = buildPermissions(allAccess, isPaid);

  return {
    hasAccess: true, role, plan,
    founder: false, allAccess,
    toolsEnabled: isActive || isAdmin,
    canUseTools: isActive || isAdmin,
    canViewAdmin: isAdmin,
    canUseAI: isActive || isAdmin,
    canUpload: isActive || isAdmin,
    subscriptionStatus: isActive ? 'active' : 'inactive',
    displayName: user.display_name || user.full_name || user.email?.split('@')[0] || 'User',
    isSuperAdmin: isAdmin,
    allToolsUnlocked: isAdmin,
    isFounder: false,
    permissions: perms,
  };
}
