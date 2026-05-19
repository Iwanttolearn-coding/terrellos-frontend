/**
 * TerrellOS Owner Config & Permission Engine
 * Founder emails ALWAYS resolve to super_admin + elite + all permissions.
 * This runs client-side and CANNOT be revoked by any backend state change.
 */
// Founder emails — single source of truth
const _FOUNDER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com',
];
function _isFounderEmail(email) {
  if (!email) return false;
  return _FOUNDER_EMAILS.includes(email.toLowerCase().trim());
}
function _resolveUserAccess(user) {
  if (!user) return { isFounder: false, role: 'guest', plan: 'free', isSuperAdmin: false, allToolsUnlocked: false };
  const isFounder = _isFounderEmail(user.email);
  if (isFounder) return { isFounder: true, role: 'super_admin', plan: 'founder', isSuperAdmin: true, allToolsUnlocked: true };
  return { isFounder: false, role: user.role || 'user', plan: user.plan || 'free', isSuperAdmin: false, allToolsUnlocked: false };
}
// Re-export for external use
export { _isFounderEmail as isFounderEmail };

export const OWNER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com',
];

// Ordered role hierarchy (higher index = more access)
export const ROLE_HIERARCHY = ['guest', 'member', 'premium', 'family', 'heritage', 'moderator', 'admin', 'super_admin'];

export function isOwnerEmail(email) {
  return _isFounderEmail(email);
}

export function getEffectiveRole(user) {
  if (!user) return 'guest';
  if (isOwnerEmail(user.email)) return 'super_admin';
  return user.role || 'member';
}

export function getEffectivePlan(user) {
  if (!user) return 'free';
  if (isOwnerEmail(user.email)) return 'elite';
  return user.plan || 'free';
}

export function hasRoleAtLeast(user, requiredRole) {
  const effective = getEffectiveRole(user);
  return ROLE_HIERARCHY.indexOf(effective) >= ROLE_HIERARCHY.indexOf(requiredRole);
}

// All possible permission keys
const ALL_PERMISSIONS = {
  ai_tools: true, uploads: true, admin: true, analytics: true,
  backend_controls: true, billing_bypass: true, avatar_lab: true,
  voice_lab: true, experimental: true, developer_tools: true,
  projects: true, templates: true, settings: true, diagnostics: true,
  logs: true, system_status: true, memory_vault: true, chat_engine: true,
  database: true, api_manager: true, bible_engine: true, workflow_editor: true,
  live_console: true, app_registry: true, automation_engine: true,
  push_notifications: true, export_system: true, cost_manager: true,
};

const PLAN_PERMISSIONS = {
  free: {
    ai_tools: true, uploads: true, memory_vault: true, chat_engine: true,
    avatar_lab: true, voice_lab: true, projects: true, bible_engine: true,
    system_status: true, logs: true,
    admin: false, analytics: false, backend_controls: false, billing_bypass: false,
    experimental: false, developer_tools: false, settings: false, diagnostics: false,
    database: false, api_manager: false, workflow_editor: false, live_console: false,
    app_registry: false, automation_engine: false, push_notifications: false,
    export_system: false, cost_manager: false, templates: true,
  },
  family: {
    ai_tools: true, uploads: true, memory_vault: true, chat_engine: true,
    avatar_lab: true, voice_lab: true, projects: true, bible_engine: true,
    system_status: true, logs: true, templates: true, settings: true, analytics: true,
    export_system: true, push_notifications: true,
    admin: false, analytics: true, backend_controls: false, billing_bypass: false,
    experimental: false, developer_tools: false, diagnostics: false,
    database: false, api_manager: false, workflow_editor: false, live_console: false,
    app_registry: false, automation_engine: false, cost_manager: false,
  },
  heritage: {
    ai_tools: true, uploads: true, memory_vault: true, chat_engine: true,
    avatar_lab: true, voice_lab: true, projects: true, bible_engine: true,
    system_status: true, logs: true, templates: true, settings: true, analytics: true,
    export_system: true, push_notifications: true, automation_engine: true,
    workflow_editor: true, diagnostics: true,
    admin: false, backend_controls: false, billing_bypass: false,
    experimental: false, developer_tools: false, database: false,
    api_manager: false, live_console: false, app_registry: false, cost_manager: false,
  },
  elite: { ...ALL_PERMISSIONS, admin: false, billing_bypass: false, live_console: false, app_registry: false, cost_manager: false },
};

export function getEffectivePermissions(user) {
  if (!user) return PLAN_PERMISSIONS.free;
  if (isOwnerEmail(user.email)) return ALL_PERMISSIONS;
  const plan = user.plan || 'free';
  return PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.free;
}

export function getEffectiveAccess(user) {
  const access = _resolveUserAccess(user);
  return {
    ...access,
    effectiveRole: access.role,
    effectivePlan: access.plan,
    permissions: getEffectivePermissions(user),
    isSuperAdmin: access.isSuperAdmin,
    hasRoleAtLeast: (role) => hasRoleAtLeast(user, role),
  };
}

// Never show upgrade UI to owner
export function shouldShowUpgradePrompt(user) {
  if (!user) return true;
  if (isOwnerEmail(user.email)) return false;
  return (user.plan || 'free') === 'free';
}