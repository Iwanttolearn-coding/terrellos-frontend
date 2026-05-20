/**
 * founderIdentity.js — Server-side founder resolution
 * Calls backend to resolve founder status — never relies on frontend state alone.
 */
import { BACKEND_BASE_URL } from '@/lib/terrellOS';

export const FOUNDER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com',
];

export function isFounderEmail(email) {
  if (!email) return false;
  return FOUNDER_EMAILS.includes(email.toLowerCase().trim());
}

export function getFounderPermissions() {
  return {
    role: 'super_admin',
    plan: 'founder',
    access_level: 'founder_override',
    unlimited_access: true,
    all_modules: true,
    billing_bypass: true,
    audit_access: true,
  };
}

export async function resolveFounderServer(email) {
  if (!email) return { is_founder: false, override: null };
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/v1/founder/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ID) || 'terrellos',
      },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return { is_founder: false, override: null };
    return await res.json();
  } catch {
    return { is_founder: false, override: null };
  }
}
