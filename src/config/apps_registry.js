/**
 * TerrellOS Global App Registry
 * Defines all apps in the ecosystem.
 * Super admin can toggle enabled/maintenance/hidden per-app.
 */

export const ECOSYSTEM_APPS = [
  {
    id: 'eternalecho',
    name: 'TerrellOS',
    tagline: 'AI memorial & memory preservation platform',
    emoji: '🕊️',
    color: 'from-amber-500 to-orange-700',
    accentColor: '#f59e0b',
    route: '/apps/eternalecho',
    externalUrl: null,
    features: ['memory_vault', 'voice_lab', 'bible_engine', 'ai_chat', 'uploads', 'reminders'],
    subscription_tiers: ['free', 'family', 'heritage', 'elite'],
    enabled: true,
    maintenance: false,
    hidden: false,
    status: 'live',
  },
  {
    id: 'pastorai',
    name: 'TerrellOS',
    tagline: 'AI-powered pastoral ministry & sermon tools',
    emoji: '⛪',
    color: 'from-violet-600 to-purple-800',
    accentColor: '#7c3aed',
    route: '/apps/pastorai',
    externalUrl: null,
    features: ['bible_engine', 'ai_chat', 'sermon_builder', 'congregation_ai', 'devotionals'],
    subscription_tiers: ['free', 'family', 'heritage', 'elite'],
    enabled: true,
    maintenance: false,
    hidden: false,
    status: 'active',
  },
  {
    id: 'kindred',
    name: 'Kindred Love Birds',
    tagline: 'Relationship & couples AI companion',
    emoji: '💞',
    color: 'from-pink-500 to-rose-700',
    accentColor: '#ec4899',
    route: '/apps/kindred',
    externalUrl: null,
    features: ['ai_chat', 'relationship_memory', 'date_planner', 'love_language_ai'],
    subscription_tiers: ['free', 'family', 'elite'],
    enabled: true,
    maintenance: false,
    hidden: false,
    status: 'active',
  },
  {
    id: 'residentsync',
    name: 'ResidentSync AI',
    tagline: 'Property management & tenant AI platform',
    emoji: '🏘️',
    color: 'from-sky-500 to-blue-700',
    accentColor: '#0ea5e9',
    route: '/apps/residentsync',
    externalUrl: null,
    features: ['tenant_ai', 'maintenance_tracker', 'payment_reminders', 'document_ai'],
    subscription_tiers: ['free', 'heritage', 'elite'],
    enabled: true,
    maintenance: false,
    hidden: false,
    status: 'active',
  },
  {
    id: 'torque',
    name: 'Torque Master Garage',
    tagline: 'AI mechanic shop management system',
    emoji: '🔧',
    color: 'from-slate-500 to-slate-800',
    accentColor: '#64748b',
    route: '/apps/torque',
    externalUrl: null,
    features: ['repair_ai', 'customer_management', 'invoice_ai', 'parts_tracker'],
    subscription_tiers: ['free', 'heritage', 'elite'],
    enabled: true,
    maintenance: false,
    hidden: false,
    status: 'active',
  },
  {
    id: 'customs',
    name: 'All Around Customs',
    tagline: 'Custom design & order management AI',
    emoji: '🎨',
    color: 'from-fuchsia-500 to-purple-700',
    accentColor: '#d946ef',
    route: '/apps/customs',
    externalUrl: null,
    features: ['design_ai', 'order_management', 'client_portal', 'invoice_ai'],
    subscription_tiers: ['free', 'heritage', 'elite'],
    enabled: true,
    maintenance: false,
    hidden: false,
    status: 'active',
  },
];

export const APP_STATUS_LABELS = {
  live:     { label: 'LIVE',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  building: { label: 'BUILDING', color: 'bg-primary/15 text-primary border-primary/25' },
  planned:  { label: 'PLANNED',  color: 'bg-secondary text-muted-foreground border-border' },
  archived: { label: 'ARCHIVED', color: 'bg-muted text-muted-foreground border-border' },
};

export const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: ['3 memories/month', 'Basic AI chat', '50MB uploads', '1 app access'],
    highlight: false,
  },
  {
    id: 'family',
    name: 'Family',
    price: 9.99,
    interval: 'month',
    features: ['Unlimited memories', 'Full AI chat', '2GB uploads', 'All family apps', 'Voice transcription'],
    highlight: false,
  },
  {
    id: 'heritage',
    name: 'Heritage',
    price: 24.99,
    interval: 'month',
    features: ['Everything in Family', 'Advanced AI models', '20GB uploads', 'Priority support', 'Bible study engine', 'Memory AI reflection'],
    highlight: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99.99,
    interval: 'month',
    features: ['All Heritage features', 'Unlimited AI', 'All apps access', 'Voice synthesis', 'Custom branding', 'API access', 'Automation engine'],
    highlight: false,
  },
];

export function getAppById(id) {
  return ECOSYSTEM_APPS.find(a => a.id === id) || null;
}

export function getVisibleApps(isSuperAdmin = false) {
  return ECOSYSTEM_APPS.filter(app => isSuperAdmin || (!app.hidden && app.enabled));
}