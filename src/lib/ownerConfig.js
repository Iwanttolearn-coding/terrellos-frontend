/**
 * ownerConfig.js — TM Dezigns AI Designer
 * COMPATIBILITY SHIM — re-exports from resolveUserAccess.js
 *
 * All legacy imports of getEffectiveAccess / isSuperAdmin / isOwnerEmail
 * now resolve correctly through the single canonical resolver.
 * Do not add new logic here. Import from resolveUserAccess.js instead.
 */
import { resolveUserAccess, isFounder, FOUNDER_EMAILS } from '@/lib/resolveUserAccess';

export { FOUNDER_EMAILS, isFounder };
export { isFounder as isOwnerEmail };
export { isFounder as isFounderEmail };

/**
 * getEffectiveAccess(user) — legacy alias for resolveUserAccess(user)
 * Returns the same object PLUS legacy property aliases so old imports don't break.
 */
export function getEffectiveAccess(user) {
  const access = resolveUserAccess(user);
  return {
    ...access,
    // Legacy aliases used by old pages — map to correct values
    isSuperAdmin:      access.founder || access.role === 'super_admin',
    allToolsUnlocked:  access.allAccess,
    isFounder:         access.founder,
    effectiveRole:     access.role,
    accessLevel:       access.founder ? 'full_access' : access.role,
    billing_bypass:    access.founder,
    unlimited_access:  access.allAccess,
  };
}

export function getFounderAccess(user) {
  return getEffectiveAccess(user);
}

// Role hierarchy check — used by some admin pages
export const ROLE_HIERARCHY = ['guest','member','premium','admin','super_admin'];

export function isOwnerEmail(email) { return isFounder(email); }
export function hasMinRole(user, minRole) {
  const access = resolveUserAccess(user);
  if (access.founder) return true;
  const userIdx = ROLE_HIERARCHY.indexOf(access.role);
  const minIdx  = ROLE_HIERARCHY.indexOf(minRole);
  return userIdx >= minIdx;
}
