/**
 * founderAccess.js — DEPRECATED SHIM
 * All exports forward to resolveUserAccess.js.
 * Do not add logic here. Import from resolveUserAccess.js directly.
 */
export {
  resolveUserAccess,
  resolveUserAccess as getEffectiveAccess,
  resolveUserAccess as getFounderAccess,
  isFounder,
  isFounder as isFounderEmail,
  isFounder as isOwnerEmail,
  isFounder as normalizeEmail,
  loadUser,
  saveUser,
  clearUser,
  FOUNDER_EMAILS,
} from '@/lib/resolveUserAccess';
