/**
 * AppConfig.js — TerrellOS app identity layer
 * Each frontend only needs to define its VITE_APP_ID.
 * The backend dynamically loads behavior per app.
 */

export const APP_ID = import.meta.env.VITE_APP_ID || 'terrellos';
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

export const APP_CONFIGS = {
  'terrellos': {
    name: 'TerrellOS',
    tagline: 'Powered by TerrellOS',
    domain: 'app.tm-dezigns.com',
    theme: 'purple',
    primaryColor: '#7c3aed',
  },
  'pastor-ai-connect': {
    name: 'Pastor AI Connect',
    tagline: 'AI-Powered Ministry Platform',
    domain: 'pastoraiconnect.com',
    theme: 'gold',
    primaryColor: '#d97706',
  },
  'heavenly-eternal-echo': {
    name: 'Heavenly Eternal Echoes',
    tagline: 'Preserve. Remember. Live On.',
    domain: 'heavenlyeternalechoes.com',
    theme: 'blue',
    primaryColor: '#2563eb',
  },
  'all-around-customs': {
    name: 'All Around Customs',
    tagline: 'AI DTF Print Platform',
    domain: 'allaroundcustoms.com',
    theme: 'orange',
    primaryColor: '#ea580c',
  },
};

export function getAppConfig(appId = APP_ID) {
  return APP_CONFIGS[appId] || APP_CONFIGS['terrellos'];
}

export function getCurrentApp() {
  return getAppConfig(APP_ID);
}
