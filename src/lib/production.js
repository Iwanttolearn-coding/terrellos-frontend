/**
 * TerrellOS Production Mode Config
 * All user reads use optional chaining — safe during auth hydration.
 */

export const LIVE_PRODUCTION_MODE = true;

// Re-export from canonical source — founderAccess.js is the single source of truth
export { FOUNDER_EMAILS, isFounderEmail } from '@/lib/founderAccess';
import { isFounderEmail as _isFounderEmail } from '@/lib/founderAccess';

/**
 * Inject immutable founder privileges onto a user object.
 * Safe to call with null/undefined user.
 */
export function applyFounderOverride(user) {
  if (!user || !_isFounderEmail(user?.email)) return user;
  return {
    ...user,
    role: 'super_admin',
    plan: 'elite',
    subscription_status: 'active',
    subscription_active: true,
    all_tools_access: true,
    plan_expires: null,
  };
}

export function getLanguageInstruction(language = 'en') {
  if (language === 'es') return 'Respond entirely in Spanish.';
  return 'Respond entirely in English.';
}

/**
 * Guard: should this user see upgrade/paywall prompts?
 * Safe with null user — returns false (don't show upgrade to loading state).
 */
export function shouldShowUpgrade(user) {
  if (!user) return false;
  if (_isFounderEmail(user?.email)) return false;
  if (user?.subscription_active || user?.subscription_status === 'active') return false;
  return true;
}