/**
 * envDetect.js — Single source of truth for environment detection.
 * PRODUCTION  → terrellos.vercel.app
 * STAGING     → any other .vercel.app or preview URLs
 * DEVELOPMENT → localhost / 127.0.0.1
 */

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const ENV = (() => {
  if (hostname === 'terrellos.vercel.app') return 'production';
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168')) return 'development';
  return 'staging'; // preview URLs, other vercel deployments, base44 preview
})();

export const IS_PRODUCTION  = ENV === 'production';
export const IS_STAGING     = ENV === 'staging';
export const IS_DEVELOPMENT = ENV === 'development';

/** Config gated by environment */
export const ENV_CONFIG = {
  production: {
    label: 'PRODUCTION',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    supabaseEnabled: true,
    openaiEnabled: true,
    subscriptionsEnabled: true,
    founderRoutingEnabled: true,
    writeProtected: false,
  },
  staging: {
    label: 'STAGING',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    dotClass: 'bg-yellow-400',
    supabaseEnabled: false,
    openaiEnabled: false,
    subscriptionsEnabled: false,
    founderRoutingEnabled: false,
    writeProtected: true,
  },
  development: {
    label: 'DEV',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-400',
    supabaseEnabled: false,
    openaiEnabled: false,
    subscriptionsEnabled: false,
    founderRoutingEnabled: false,
    writeProtected: true,
  },
};

export const currentEnvConfig = ENV_CONFIG[ENV];

/**
 * Production write guard — throws if a write is attempted outside production.
 * Use this before any live data mutations in critical settings paths.
 */
export function assertProductionWrite(label = 'This action') {
  if (!IS_PRODUCTION) {
    throw new Error(`${label} is locked — only allowed in PRODUCTION environment. Current: ${ENV.toUpperCase()}`);
  }
}