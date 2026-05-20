/**
 * resolveUserAccess.js — TerrellOS
 * Isolated auth layer. Uses terrellos_user localStorage key.
 * Founder emails ALWAYS resolve to super_admin. No downgrade ever.
 */
const FOUNDER_EMAILS = ['millzterrell210@icloud.com', 'millzterrell5@gmail.com'];
const STORAGE_KEY = 'terrellos_user';

export function isFounder(email) {
  return FOUNDER_EMAILS.includes((email || '').toLowerCase().trim());
}

export function resolveUserAccess(user) {
  if (!user?.email) return { role: 'guest', founder: false, allAccess: false, plan: 'free' };

  // Founder ALWAYS wins — no route can downgrade this
  if (isFounder(user.email)) {
    return { role: 'super_admin', founder: true, allAccess: true, plan: 'founder' };
  }

  return {
    role: user.role || 'member',
    founder: false,
    allAccess: false,
    plan: user.plan || 'free',
  };
}

export function saveUser(user) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch {}
}

export function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    // Re-apply founder override on every load — prevents stale role cache
    if (isFounder(user?.email)) {
      return { ...user, role: 'super_admin', plan: 'founder', is_founder: true };
    }
    return user;
  } catch { return null; }
}

export function clearUser() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export { FOUNDER_EMAILS };
