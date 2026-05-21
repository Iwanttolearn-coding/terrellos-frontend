/**
 * TerrellOS Publish Checklist
 * Runs live production-readiness checks and displays pass/fail for each item.
 */

import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { pingBackend } from '@/lib/backendApi';
import { API_BASE_URL, APP_VERSION, ENVIRONMENT } from '@/lib/env';
import { isOwnerEmail } from '@/lib/ownerConfig';
import { CheckCircle, XCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHECKS = [
  {
    id: 'login',
    label: 'Login resolves authenticated user',
    run: async ({ user }) => {
      if (!user?.email) return { pass: false, note: 'No user loaded — auth may be pending.' };
      return { pass: true, note: user.email };
    },
  },
  {
    id: 'founder_role',
    label: 'Founder resolves as SUPER ADMIN',
    run: async ({ user, access }) => {
      if (!user) return { pass: false, note: 'User not loaded.' };
      const is = isOwnerEmail(user.email) && access?.founder;
      return { pass: is, note: is ? 'super_admin confirmed' : `Role: ${access?.effectiveRole || 'unknown'}` };
    },
  },
  {
    id: 'founder_plan',
    label: 'Founder plan resolves as ELITE',
    run: async ({ access }) => {
      const is = access?.effectivePlan === 'elite';
      return { pass: is, note: access?.effectivePlan || 'not set' };
    },
  },
  {
    id: 'no_upgrade_prompt',
    label: 'No upgrade prompt shown to founder',
    run: async ({ user }) => {
      const { shouldShowUpgradePrompt } = await import('@/lib/ownerConfig');
      const shows = shouldShowUpgradePrompt(user);
      return { pass: !shows, note: shows ? 'UPGRADE PROMPT WOULD SHOW — fix ownerConfig' : 'Upgrade prompt suppressed' };
    },
  },
  {
    id: 'no_localhost',
    label: 'No localhost in backend URL',
    run: async () => {
      const hasLocal = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
      return { pass: !hasLocal, note: API_BASE_URL };
    },
  },
  {
    id: 'production_url',
    label: 'Backend URL is production (onrender.com)',
    run: async () => {
      const isProd = API_BASE_URL.includes('onrender.com');
      return { pass: isProd, note: API_BASE_URL };
    },
  },
  {
    id: 'health_ping',
    label: '/health ping succeeds',
    run: async () => {
      const r = await pingBackend();
      return { pass: r.ok, note: r.ok ? `${r.latency_ms}ms` : (r.error || `HTTP ${r.status}`) };
    },
  },
  {
    id: 'database',
    label: 'Database reads work',
    run: async () => {
      await base44.entities.Project.list('-created_date', 1);
      return { pass: true, note: 'Base44 DB connected' };
    },
  },
  {
    id: 'admin_access',
    label: 'Admin route accessible to founder',
    run: async ({ access }) => {
      const ok = access?.permissions?.admin === true;
      return { pass: ok, note: ok ? 'admin permission granted' : 'admin permission MISSING' };
    },
  },
  {
    id: 'all_tools',
    label: 'All tools enabled for founder',
    run: async ({ access }) => {
      const perms = access?.permissions || {};
      const missing = ['ai_tools','uploads','bible_engine','memory_vault','voice_lab','chat_engine','analytics','live_console','cost_manager','automation_engine'].filter(k => !perms[k]);
      return { pass: missing.length === 0, note: missing.length === 0 ? 'All tools enabled' : `Missing: ${missing.join(', ')}` };
    },
  },
  {
    id: 'version',
    label: 'Build version present in system',
    run: async () => {
      const ok = APP_VERSION && APP_VERSION !== 'unknown';
      return { pass: ok, note: ok ? `v${APP_VERSION}` : 'APP_VERSION not set in env.js' };
    },
  },
  {
    id: 'environment',
    label: 'Environment set to production',
    run: async () => {
      const ok = ENVIRONMENT === 'production';
      return { pass: ok, note: ENVIRONMENT };
    },
  },
];

export default function PublishChecklist({ user, ping, pinging, onPing, access }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  async function runAll() {
    setRunning(true);
    setResults({});
    for (const check of CHECKS) {
      try {
        const r = await check.run({ user, ping, access });
        setResults(prev => ({ ...prev, [check.id]: { ...r } }));
      } catch (err) {
        setResults(prev => ({ ...prev, [check.id]: { pass: false, note: err.message?.slice(0, 80) || 'Error' } }));
      }
    }
    setRunning(false);
    setRan(true);
  }

  const passCount = Object.values(results).filter(r => r.pass).length;
  const failCount = Object.values(results).filter(r => r.pass === false).length;
  const allPass = ran && failCount === 0 && passCount === CHECKS.length;

  return (
    <div className="space-y-4">
      {/* Run button */}
      <div className={`rounded-2xl border p-4 flex items-center gap-3 ${allPass ? 'border-emerald-500/30 bg-emerald-500/5' : ran ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border bg-secondary/20'}`}>
        {allPass
          ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          : ran
            ? <XCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            : <ShieldCheck className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">
            {allPass ? 'All checks passed — ready to publish' : ran ? `${failCount} check${failCount !== 1 ? 's' : ''} failed` : 'Production readiness check'}
          </div>
          {ran && <div className="text-xs text-muted-foreground">{passCount}/{CHECKS.length} passing</div>}
        </div>
        <Button size="sm" variant="outline" onClick={runAll} disabled={running}>
          <RefreshCw className={`w-3 h-3 mr-1 ${running ? 'animate-spin' : ''}`} />
          {ran ? 'Re-run' : 'Run Checks'}
        </Button>
      </div>

      {/* Checklist rows */}
      <div className="card-glass rounded-2xl overflow-hidden">
        {CHECKS.map((check, i) => {
          const r = results[check.id];
          const isRunning = running && !r;
          return (
            <div key={check.id} className={`flex items-center gap-3 px-4 py-3 ${i < CHECKS.length - 1 ? 'border-b border-border/40' : ''}`}>
              <div className="flex-shrink-0 w-4 h-4">
                {isRunning
                  ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  : r?.pass === true
                    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                    : r?.pass === false
                      ? <XCircle className="w-4 h-4 text-destructive" />
                      : <div className="w-4 h-4 rounded-full border border-border" />}
              </div>
              <span className="text-sm text-foreground flex-1">{check.label}</span>
              {r?.note && (
                <span className={`text-xs font-mono flex-shrink-0 text-right max-w-[180px] truncate ${r.pass ? 'text-muted-foreground' : 'text-destructive'}`}>
                  {r.note}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-xs text-muted-foreground font-mono text-center">
        Backend: {API_BASE_URL} · v{APP_VERSION} · {ENVIRONMENT.toUpperCase()}
      </div>
    </div>
  );
}