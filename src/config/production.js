/**
 * TerrellOS Production Mode Enforcement
 * LIVE_PRODUCTION_MODE = true means all data must come from real DB/API sources.
 * Any attempt to use demo/mock data should log a warning and return empty real state.
 */

export const LIVE_PRODUCTION_MODE = true;
export const DEMO_MODE = false;

export const FOUNDER_EMAILS = [
  'millzterrell210@icloud.com',
  'millzterrell5@gmail.com',
  'millsterrell5@gmail.com',
];

/**
 * Guard: call this before returning any fallback/demo data.
 * If LIVE_PRODUCTION_MODE is true, warns and returns empty instead of fake data.
 */
export function guardDemoData(label, fallback = null) {
  if (LIVE_PRODUCTION_MODE) {
    console.warn(`[PRODUCTION] Demo data blocked: "${label}". Returning empty state.`);
    return fallback;
  }
  return undefined; // caller should use their demo value
}