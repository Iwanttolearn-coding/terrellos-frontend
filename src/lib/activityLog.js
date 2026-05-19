/**
 * Activity logging — fires and forgets to Supabase system_events.
 * Safe to call anywhere; never throws.
 */
import { sbData } from '@/lib/supabaseData';
import { supabaseSession } from '@/lib/supabaseSession';

export async function logActivity(event_type, description, metadata = null) {
  if (!supabaseSession.getToken()) return; // not logged in, skip silently
  try {
    await sbData.logEvent(event_type, description, metadata);
  } catch {
    // fire-and-forget — never block the UI
  }
}