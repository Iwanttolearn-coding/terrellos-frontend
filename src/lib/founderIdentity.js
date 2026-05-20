/**
 * founderIdentity.js — Server-side founder resolution
 * Calls the backend to resolve founder status.
 * Never relies on frontend state alone.
 */
import { BACKEND_BASE_URL } from '@/lib/terrellOS';

export async function resolveFounderServer(email) {
  if (!email) return { is_founder: false, override: null };
  try {
    const res = await fetch(/v1/founder/verify