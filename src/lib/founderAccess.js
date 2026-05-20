/**
 * founderAccess.js
 */
export const FOUNDER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com'
]

export const normalizeEmail = (e) => (e||'').toLowerCase().trim()
export const isFounderEmail = (e) => FOUNDER_EMAILS.map(normalizeEmail).includes(normalizeEmail(e))

export function resolveUserAccess(user) {
  if (!user) return { role:'guest', plan:'free', isFounder:false, allToolsUnlocked:false }
  if (isFounderEmail(user.email)) {
    return { ...user, role:'super_admin', plan:'founder', accessLevel:'full_access',
      subscription:'founder', allToolsUnlocked:true, isFounder:true, displayPlan:'Founder ✦' }
  }
  return { ...user, role: user.role||'member', plan: user.plan||'free',
    isFounder:false, allToolsUnlocked:false, displayPlan: user.plan||'Free' }
}
export function getFounderAccess(user) {
  if (!user) return null;
  if (!isFounderEmail(user.email)) return null;
  return {
    isFounder: true,
    role: 'super_admin',
    plan: 'founder',
    allToolsUnlocked: true,
    displayPlan: 'Founder ✦',
  };
}
