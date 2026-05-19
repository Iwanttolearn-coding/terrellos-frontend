import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { API_BASE_URL, APP_VERSION, ENVIRONMENT } from '@/lib/env';
import { getEffectiveAccess } from '@/lib/ownerConfig';
import { pingBackend } from '@/lib/backendApi';
import { getRealAnalytics } from '@/lib/persistence';
import { notify } from '@/components/NotificationCenter';
import {
  ShieldCheck, CheckCircle, XCircle, Loader2, Zap, ToggleLeft, ToggleRight,
  Cpu, BarChart2, Settings, AlertTriangle, RefreshCw
} from 'lucide-react';
import PublishChecklist from '@/components/admin/PublishChecklist';
import BackendStatusCard from '@/components/BackendStatusCard';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const ALL_TOOLS = [
  'ai_tools','uploads','admin','analytics','backend_controls','billing_bypass',
  'avatar_lab','voice_lab','experimental','developer_tools','projects','templates',
  'settings','diagnostics','logs','system_status','memory_vault','chat_engine',
  'database','api_manager','bible_engine','workflow_editor',
];

const TABS = [
  { key: 'identity',    label: 'Identity',        icon: ShieldCheck },
  { key: 'backend',     label: 'Backend',          icon: Cpu },
  { key: 'tools',       label: 'Tool Matrix',      icon: Settings },
  { key: 'analytics',   label: 'Analytics',        icon: BarChart2 },
  { key: 'overrides',   label: 'Overrides',        icon: Zap },
  { key: 'checklist',   label: 'Publish Check',    icon: AlertTriangle },
];

const Section = ({ title, children }) => (
  <div className="card-glass rounded-2xl p-5 mb-4">
    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4 border-b border-border pb-2">{title}</div>
    {children}
  </div>
);

const Row = ({ label, value, accent, mono }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0 gap-4">
    <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
    <span className={`text-sm font-medium text-right break-all ${mono ? 'font-mono text-xs' : ''} ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</span>
  </div>
);

export default function Admin() {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [ping, setPing] = useState(null);
  const [pinging, setPinging] = useState(false);
  const [lastPing, setLastPing] = useState(null);
  const [tab, setTab] = useState('identity');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({
    maintenance_mode: false,
    ai_provider: 'openai',
    new_users_allowed: true,
    voice_lab_enabled: true,
    bible_engine_enabled: true,
  });

  async function runPing() {
    setPinging(true);
    const r = await pingBackend();
    setPing(r);
    setLastPing(new Date());
    setPinging(false);
    notify[r.ok ? 'success' : 'error'](r.ok ? `Backend live — ${r.latency_ms}ms` : 'Backend unreachable');
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    const data = await getRealAnalytics();
    setAnalytics(data);
    setAnalyticsLoading(false);
  }

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAccess(getEffectiveAccess(u)); }).catch(() => {});
    runPing();
  }, []);

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics();
  }, [tab]);

  if (access && !access.isSuperAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <div className="text-sm font-semibold">Super Admin access required.</div>
        <div className="text-xs mt-1">Restricted to the founder account.</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold gradient-text">Admin Command Center</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">SUPER ADMIN</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">ELITE</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/25">ALL ENABLED</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">LIVE</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 scrollbar-dark">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${tab === t.key ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-border'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Identity */}
      {tab === 'identity' && (
        <Section title="Identity & Access">
          <Row label="Email"          value={user?.email || '—'} mono />
          <Row label="Name"           value={user?.full_name || '—'} />
          <Row label="Effective Role" value={(access?.effectiveRole || 'super_admin').toUpperCase()} accent />
          <Row label="Effective Plan" value={(access?.effectivePlan || 'elite').toUpperCase()} accent />
          <Row label="App Version"    value={APP_VERSION} mono />
          <Row label="Environment"    value={ENVIRONMENT.toUpperCase()} accent />
          <Row label="Backend URL"    value={API_BASE_URL} mono />
          <Row label="Billing Gate"   value="PERMANENTLY BYPASSED" accent />
          <Row label="Upgrade Modal"  value="DISABLED" accent />
          <Row label="Trial Exp."     value="N/A — OWNER ACCOUNT" accent />
          <Row label="AI Quota"       value="UNLIMITED" accent />
          <Row label="Upload Quota"   value="UNLIMITED" accent />
          {access?.isSuperAdmin && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
              ✓ Founder account verified · SUPER ADMIN · ELITE · ALL ACCESS · PRODUCTION
            </div>
          )}
        </Section>
      )}

      {/* Backend */}
      {tab === 'backend' && (
        <>
          <Section title="Backend Connection">
            <BackendStatusCard />
          </Section>

          <Section title="Backend Health (Legacy Ping)">
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${pinging ? 'bg-muted/20' : ping?.ok ? 'bg-emerald-500/8' : 'bg-destructive/8'} border ${ping?.ok ? 'border-emerald-500/20' : 'border-destructive/20'}`}>
              {pinging ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> :
               ping?.ok ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
               <XCircle className="w-4 h-4 text-destructive" />}
              <span className="text-sm font-semibold">
                {pinging ? 'Pinging…' : ping?.ok ? `Backend Live — ${ping.latency_ms}ms` : 'Backend Unreachable'}
              </span>
              {lastPing && <span className="ml-auto text-xs text-muted-foreground">{formatDistanceToNow(lastPing, { addSuffix: true })}</span>}
            </div>
            <Row label="Production URL" value={API_BASE_URL} mono />
            <Row label="Environment"    value={ENVIRONMENT.toUpperCase()} accent />
            <Row label="App Version"    value={APP_VERSION} mono />
            <Button size="sm" variant="outline" onClick={runPing} disabled={pinging} className="mt-3 w-full">
              <RefreshCw className={`w-3 h-3 mr-1 ${pinging ? 'animate-spin' : ''}`} /> Re-Ping Backend
            </Button>
          </Section>

          <Section title="Feature Flags">
            {Object.entries(featureFlags).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <span className="text-sm text-muted-foreground font-mono">{key.replace(/_/g, ' ')}</span>
                <button onClick={() => setFeatureFlags(p => ({ ...p, [key]: typeof val === 'boolean' ? !val : val }))}
                  className="flex items-center gap-1.5 text-xs">
                  {typeof val === 'boolean' ? (
                    val ? <><ToggleRight className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400">ON</span></>
                        : <><ToggleLeft className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">OFF</span></>
                  ) : <span className="font-mono text-primary px-2 py-0.5 bg-primary/10 rounded">{val}</span>}
                </button>
              </div>
            ))}
            <div className="mt-3 text-xs text-muted-foreground p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              Feature flags are local session state. Connect to backend /admin/flags to persist.
            </div>
          </Section>
        </>
      )}

      {/* Tool Matrix */}
      {tab === 'tools' && (
        <Section title="Tool Access Matrix">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {ALL_TOOLS.map(t => {
              const enabled = access?.permissions?.[t] !== false;
              return (
                <div key={t} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0">
                  {enabled
                    ? <ToggleRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    : <ToggleLeft className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <span className={`text-xs font-mono ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t.replace(/_/g, ' ')}
                  </span>
                  {enabled && <span className="ml-auto text-[9px] text-emerald-400 font-mono">ENABLED</span>}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Analytics */}
      {tab === 'analytics' && (
        <Section title="Live System Metrics">
          {analyticsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : analytics ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Projects', analytics.projects],
                ['Uploads', analytics.uploads],
                ['Build Logs', analytics.logs],
                ['Conversations', analytics.conversations],
                ['AI Calls', analytics.ai_calls],
                ['Success Rate', `${analytics.success_rate}%`],
                ['Storage', `${analytics.storage_mb} MB`],
                ['This Month', analytics.active_this_month],
              ].map(([label, val]) => (
                <div key={label} className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="text-lg font-bold font-mono text-foreground">{val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          ) : null}
          <Button size="sm" variant="outline" onClick={loadAnalytics} disabled={analyticsLoading} className="mt-4 w-full">
            <RefreshCw className={`w-3 h-3 mr-1 ${analyticsLoading ? 'animate-spin' : ''}`} /> Refresh Metrics
          </Button>
        </Section>
      )}

      {/* Publish Checklist */}
      {tab === 'checklist' && (
        <PublishChecklist user={user} ping={ping} pinging={pinging} onPing={runPing} access={access} />
      )}

      {/* Overrides */}
      {tab === 'overrides' && (
        <Section title="Subscription & Permission Override">
          <Row label="Gate Status"      value="PERMANENTLY BYPASSED" accent />
          <Row label="Plan Override"    value="ELITE" accent />
          <Row label="Feature Flags"    value="ALL ENABLED" accent />
          <Row label="Maintenance Mode" value="OFF" />
          <Row label="AI Provider"      value="AUTO (w/ FALLBACK)" accent />
          <Row label="Upload Quota"     value="UNLIMITED" accent />
          <Row label="Voice Quota"      value="UNLIMITED" accent />
          <Row label="Memory Quota"     value="UNLIMITED" accent />
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            Founder override is enforced at the app level via ownerConfig. No backend change can revoke this access.
          </div>
        </Section>
      )}
    </div>
  );
}