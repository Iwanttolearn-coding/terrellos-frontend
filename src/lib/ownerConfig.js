/**
 * ownerConfig.js — DEPRECATED SHIM
 * All exports forward to resolveUserAccess.js.
 * getEffectiveAccess = resolveUserAccess. isSuperAdmin = access.founder.
 */
export {
  resolveUserAccess,
  resolveUserAccess as getEffectiveAccess,
  resolveUserAccess as getFounderAccess,
  isFounder,
  isFounder as isOwnerEmail,
  isFounder as isFounderEmail,
  loadUser,
  FOUNDER_EMAILS,
} from '@/lib/resolveUserAccess';

export const ROLE_HIERARCHY = ['guest','member','premium','admin','super_admin','founder'];

import { resolveUserAccess as _r, isFounder as _if } from '@/lib/resolveUserAccess';
export function hasMinRole(user, minRole) {
  const a = _r(user);
  if (a.founder) return true;
  const idx = ROLE_HIERARCHY.indexOf(a.role);
  return idx >= ROLE_HIERARCHY.indexOf(minRole);
}
