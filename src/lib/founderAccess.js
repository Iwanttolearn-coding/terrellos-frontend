/**
 * founderAccess.js — TM Dezigns AI Designer
 * COMPATIBILITY SHIM — re-exports from resolveUserAccess.js
 * Do not add new logic here. This exists only for legacy import compatibility.
 */
export {
  resolveUserAccess,
  isFounder,
  isFounder as isFounderEmail,
  isFounder as isOwnerEmail,
  FOUNDER_EMAILS,
  saveUser,
  loadUser,
  clearUser,
} from '@/lib/resolveUserAccess';

// Legacy alias
export { isFounder as normalizeEmail } from '@/lib/resolveUserAccess';

// getFounderAccess — legacy usage in some pages
import { resolveUserAccess } from '@/lib/resolveUserAccess';
export function getFounderAccess(user) {
  return resolveUserAccess(user);
}
