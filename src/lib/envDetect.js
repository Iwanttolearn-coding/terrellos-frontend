/**
 * envDetect.js — TerrellOS environment detection
 * STACK: Frontend → Netlify (terrellos-frontend-tm.netlify.app / app.tm-dezigns.com)
 *        Backend  → Fly.io  (terrellos-backend.fly.dev)
 *        DNS      → Cloudflare (lars + wally nameservers)
 */

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

// All canonical production hostnames
const PRODUCTION_HOSTNAMES = new Set([
  'app.tm-dezigns.com',                        // custom domain (Cloudflare → Netlify)
  'terrellos-frontend-tm.netlify.app',         // Netlify deploy URL
  'terrellos-frontend.onrender.com',           // Render fallback
]);

// Any *.netlify.app or *.onrender.com subdomain = production
const isNetlifyDeploy = hostname.endsWith('.netlify.app');
const isRenderDeploy  = hostname.endsWith('.onrender.com');

export const ENV = (() => {
  if (PRODUCTION_HOSTNAMES.has(hostname) || isNetlifyDeploy || isRenderDeploy) return 'production';
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168')) return 'development';
  return 'staging';
})();

export const IS_PRODUCTION  = ENV === 'production';
export const IS_STAGING     = ENV === 'staging';
export const IS_DEVELOPMENT = ENV === 'development';

/** Runtime platform label — shows in UI diagnostics */
export const PLATFORM_LABEL = (() => {
  if (hostname === 'app.tm-dezigns.com')              return 'TerrellOS · Cloudflare + Netlify';
  if (hostname.endsWith('.netlify.app'))               return 'TerrellOS · Netlify';
  if (hostname.endsWith('.onrender.com'))              return 'TerrellOS · Render';
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'TerrellOS · Local Dev';
  return 'TerrellOS';
})();

export const BACKEND_LABEL = 'Fly.io · terrellos-backend';

/** Config gated by environment */
export const ENV_CONFIG = {
  production: {
    label: 'PRODUCTION',
    platform: PLATFORM_LABEL,
    backend: BACKEND_LABEL,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    supabaseEnabled: true,
    openaiEnabled: true,
    subscriptionsEnabled: true,
    founderRoutingEnabled: true,
    writeProtected: false,
  },
  staging: {
    label: 'PREVIEW',
    platform: PLATFORM_LABEL,
    backend: BACKEND_LABEL,
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    dotClass: 'bg-yellow-400',
    supabaseEnabled: true,
    openaiEnabled: true,
    subscriptionsEnabled: false,
    founderRoutingEnabled: false,
    writeProtected: false,
  },
  development: {
    label: 'LOCAL DEV',
    platform: 'localhost',
    backend: BACKEND_LABEL,
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-400',
    supabaseEnabled: true,
    openaiEnabled: true,
    subscriptionsEnabled: false,
    founderRoutingEnabled: false,
    writeProtected: false,
  },
};

export const CURRENT_ENV_CONFIG = ENV_CONFIG[ENV];

// Backward-compat alias
export const currentEnvConfig = CURRENT_ENV_CONFIG;
