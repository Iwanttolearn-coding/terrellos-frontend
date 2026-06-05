/**
 * Billing.jsx — TerrellOS
 * AI credit usage, plan status, purchase history.
 * Founder override via resolveUserAccess(). No safeInvoke.
 * Route: /billing
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import { healthCheck, BACKEND_BASE_URL } from '@/lib/terrellOS';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard, Zap, Crown, TrendingUp, Calendar, Check,
  Loader2, ArrowRight, RefreshCw, Shield, Code, Cpu, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLAN_META = {
  free:       { label: 'Free',         credits: 0,     color: 'text-muted-foreground', bg: 'bg-muted/30',          icon: Code },
  starter:    { label: 'Starter',      credits: 1000,  color: 'text-blue-400',         bg: 'bg-blue-500/10',       icon: Code },
  pro:        { label: 'Professional', credits: 5000,  color: 'text-primary',          bg: 'bg-primary/10',        icon: Cpu },
  elite:      { label: 'Professional', credits: 5000,  color: 'text-primary',          bg: 'bg-primary/10',        icon: Cpu },
  enterprise: { label: 'Enterprise',   credits: 20000, color: 'text-amber-400',        bg: 'bg-amber-500/10',      icon: Crown },
  founder:    { label: 'Founder',      credits: null,  color: 'text-amber-400',        bg: 'bg-amber-500/10',      icon: Crown },
};

async function fetchUsageFromBackend(email) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/v1/billing/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default function Billing() {
  const [user, setUser]         = useState(null);
  const [access, setAccess]     = useState(null);
  const [usage, setUsage]       = useState(null);
  const [backendUp, setBackendUp] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (u) => {
    if (u?.email) {
      const [h, usg] = await Promise.all([
        healthCheck(),
        fetchUsageFromBackend(u.email),
      ]);
      setBackendUp(h?.online ?? false);
      setUsage(usg);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => { const u = loadUser(); setUser(u); setAccess(resolveUserAccess(u)); load(u); })()
      .catch(() => { setAccess(resolveUserAccess(null)); setLoading(false); });
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load(user);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const planKey = access?.plan || 'free';
  const meta    = PLAN_META[planKey] || PLAN_META.free;
  const PlanIcon = meta.icon;

  // Determine credit display
  const creditsTotal    = meta.credits;
  const creditsUsed     = usage?.credits_used ?? null;
  const creditsRemaining = usage?.credits_remaining ?? null;
  const usagePct        = creditsTotal && creditsUsed != null
    ? Math.min(100, Math.round((creditsUsed / creditsTotal) * 100))
    : null;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Credits</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your AI credits and subscription.</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Backend status */}
      <div className="flex items-center gap-2 text-xs">
        <span className={cn('w-2 h-2 rounded-full', backendUp ? 'bg-emerald-400 animate-pulse' : backendUp === false ? 'bg-red-400' : 'bg-yellow-400')} />
        <span className="text-muted-foreground">
          Backend: {backendUp === null ? 'Checking…' : backendUp ? 'Online' : 'Offline — credit data may be unavailable'}
        </span>
        <a href={`${BACKEND_BASE_URL}/health`} target="_blank" rel="noreferrer"
          className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ExternalLink className="w-3 h-3" />Status
        </a>
      </div>

      {/* Founder override */}
      {access?.isFounder && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-amber-950/30 border border-amber-500/40 rounded-xl px-5 py-4">
          <Crown className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300 text-sm">Founder Override Active</p>
            <p className="text-amber-400/80 text-xs mt-0.5">
              Unlimited AI credits · All tools unlocked · No billing required · Super Admin
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold">FOUNDER</span>
        </motion.div>
      )}

      {/* Current plan */}
      <div className={cn('rounded-xl border p-5 space-y-4', meta.bg, 'border-border')}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PlanIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">{meta.label} Plan</p>
              <p className={cn('text-xs font-medium', meta.color)}>
                {access?.isFounder ? 'Founder — All Access' : `${access?.accessLevel || 'standard'} access`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-foreground text-lg">
              {access?.isFounder ? '∞' : creditsTotal?.toLocaleString() ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {access?.isFounder ? 'Unlimited credits' : 'credits / month'}
            </p>
          </div>
        </div>

        {/* Account detail rows */}
        <div className="grid sm:grid-cols-2 gap-2 border-t border-border/50 pt-4">
          {[
            ['Email',        user?.email || '—'],
            ['Role',         access?.role || 'user'],
            ['Access Level', access?.accessLevel || 'standard'],
            ['All Tools',    access?.allAccess ? 'Unlocked ✅' : 'Plan-gated'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <span className="w-28 shrink-0 text-muted-foreground">{k}</span>
              <span className="font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Credit usage bar — only for non-founders with live data */}
      {!access?.isFounder && creditsTotal && (
        <div className="rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <p className="font-semibold text-sm text-foreground">Credit Usage</p>
            </div>
            {usagePct !== null && (
              <span className={cn('text-xs font-medium', usagePct > 85 ? 'text-red-400' : 'text-muted-foreground')}>
                {usagePct}% used
              </span>
            )}
          </div>

          {usage ? (
            <>
              <div className="w-full bg-muted/30 rounded-full h-2.5 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', usagePct > 85 ? 'bg-red-500' : 'bg-primary')}
                  style={{ width: `${usagePct ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{creditsUsed?.toLocaleString() ?? '—'} used</span>
                <span>{creditsRemaining?.toLocaleString() ?? '—'} remaining</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {backendUp ? 'Usage data unavailable — no billing endpoint yet.' : 'Backend offline — connect to view usage.'}
            </p>
          )}
        </div>
      )}

      {/* Per-plan feature summary */}
      <div className="rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <p className="font-semibold text-sm text-foreground">Your Plan Includes</p>
        </div>
        {(() => {
          const features = access?.isFounder ? [
            'Unlimited AI credits',
            'All AI models (GPT-4o, custom)',
            'All tools unlocked',
            'Unlimited projects',
            'Full admin & founder access',
            'Priority processing',
            'System diagnostics',
            'Billing override',
          ] : planKey === 'starter' ? [
            '1,000 AI credits / month',
            'Text & code generation',
            'AI Builder access',
            'Up to 3 projects',
            '7-day credit rollover',
            'Community support',
          ] : planKey === 'enterprise' ? [
            '20,000 AI credits / month',
            'All AI models',
            'Unlimited projects',
            'Team accounts',
            'SLA (99.9% uptime)',
            '90-day credit rollover',
            'Dedicated support',
          ] : [
            '5,000 AI credits / month',
            'GPT-4o + advanced models',
            'Unlimited projects',
            'API access + webhooks',
            'Deployment tools',
            'Live sandbox',
            '30-day credit rollover',
            'Priority support',
          ];
          return (
            <ul className="space-y-1.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          );
        })()}
      </div>

      {/* Upgrade CTA — not shown for founders or enterprise */}
      {!access?.isFounder && planKey !== 'enterprise' && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm text-foreground">Need more credits?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upgrade to Pro (5K credits) or Enterprise (20K credits).
            </p>
          </div>
          <Link to="/pricing"
            className="flex items-center gap-1.5 px-4 py-2 gradient-purple-blue text-white rounded-xl text-sm font-semibold shrink-0 hover:opacity-90">
            Upgrade <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Billing rules */}
      <div className="rounded-xl border border-border p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <p className="font-semibold text-sm text-foreground">Billing Notes</p>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>• Monthly plans cancel anytime — no lock-in</li>
          <li>• Credits roll over per plan (Starter 7d, Pro 30d, Enterprise 90d)</li>
          <li>• 7-day money-back guarantee on all plans</li>
          <li>• Enterprise invoicing available — contact support</li>
          <li>• Volume discounts available for 10+ seat teams</li>
        </ul>
      </div>
    </div>
  );
}