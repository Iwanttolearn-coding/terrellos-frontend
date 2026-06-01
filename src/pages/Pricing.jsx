/**
 * Pricing.jsx — TerrellOS
 * AI-credits builder pricing. Backend-connected checkout.
 * Founder override via resolveUserAccess().
 * Route: /pricing
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import { healthCheck, BACKEND_BASE_URL } from '@/lib/terrellOS';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Check, Zap, Crown, Code, Cpu, Infinity,
  ArrowRight, Star, Shield, RefreshCw, ExternalLink, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    credits: 1000,
    description: 'Experiment and explore the platform.',
    icon: Code,
    color: 'border-border',
    badgeColor: 'bg-muted text-muted-foreground',
    features: [
      '1,000 AI credits / month',
      'Text & code generation',
      'AI Builder access',
      'Project workspace (3)',
      'Community support',
      'Backend API access',
      '7-day credit rollover',
    ],
    limits: ['No team access', 'No priority processing'],
    cta: 'Get Started',
    ctaClass: 'border border-border hover:border-primary/50 text-foreground',
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    period: 'month',
    credits: 5000,
    description: 'For serious builders shipping real products.',
    icon: Cpu,
    color: 'border-primary/60 ring-2 ring-primary/20',
    badgeColor: 'bg-primary/10 text-primary',
    popular: true,
    features: [
      '5,000 AI credits / month',
      'All Starter features',
      'Priority AI processing',
      'Advanced AI models (GPT-4o)',
      'Unlimited projects',
      'API access + webhooks',
      'Deployment tools',
      'Live sandbox access',
      '30-day credit rollover',
      'Priority support',
    ],
    cta: 'Go Pro',
    ctaClass: 'gradient-purple-blue text-white shadow-lg shadow-primary/30',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249,
    period: 'month',
    credits: 20000,
    description: 'For production teams and scaling apps.',
    icon: Crown,
    color: 'border-amber-500/50',
    badgeColor: 'bg-amber-100 text-amber-800',
    features: [
      '20,000 AI credits / month',
      'All Pro features',
      'Dedicated model access',
      'Team accounts (unlimited)',
      'Custom AI model config',
      'SLA guarantee (99.9% uptime)',
      'White-label options',
      'Dedicated support',
      '90-day credit rollover',
      'Volume discount eligible',
    ],
    cta: 'Contact Sales',
    ctaClass: 'border border-amber-500/50 text-amber-400 hover:bg-amber-500/10',
  },
];

const COMPARE_ROWS = [
  { feature: 'AI credits / month',      starter: '1,000',    pro: '5,000',      enterprise: '20,000' },
  { feature: 'AI models',               starter: 'Standard', pro: 'GPT-4o',     enterprise: 'Custom' },
  { feature: 'Projects',                starter: '3',        pro: 'Unlimited',  enterprise: 'Unlimited' },
  { feature: 'API access',              starter: false,      pro: true,         enterprise: true },
  { feature: 'Priority processing',     starter: false,      pro: true,         enterprise: true },
  { feature: 'Team accounts',           starter: false,      pro: false,        enterprise: true },
  { feature: 'Live sandbox',            starter: false,      pro: true,         enterprise: true },
  { feature: 'Deployment tools',        starter: false,      pro: true,         enterprise: true },
  { feature: 'SLA',                     starter: false,      pro: false,        enterprise: true },
  { feature: 'Credit rollover',         starter: '7-day',    pro: '30-day',     enterprise: '90-day' },
  { feature: 'Support',                 starter: 'Community',pro: 'Priority',   enterprise: 'Dedicated' },
];

// ── Checkout via Fly.io backend ─────────────────────────────────────────────
async function createCheckoutSession(planId, email) {
  const origin = window.location.origin;
  const res = await fetch(`${BACKEND_BASE_URL}/v1/checkout/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: planId,
      email,
      success_url: `${origin}/thank-you`,
      cancel_url: `${origin}/pricing`,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || `Checkout error ${res.status}`);
  }
  return res.json();
}

function CellVal({ v }) {
  if (v === true)  return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (v === false) return <span className="text-muted-foreground text-xs block text-center">—</span>;
  return <span className="text-xs font-medium block text-center">{v}</span>;
}

export default function Pricing() {
  const [user, setUser]         = useState(null);
  const [access, setAccess]     = useState(null);
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(null);
  const [error, setError]       = useState(null);
  const [backendUp, setBackendUp] = useState(null);

  useEffect(() => {
    (async () => { const u = loadUser(); setUser(u); setAccess(resolveUserAccess(u)); setEmail(u?.email || ''); })()
      .catch(() => setAccess(resolveUserAccess(null)));
    healthCheck().then(r => setBackendUp(r?.online ?? false));
  }, []);

  async function handleCheckout(planId) {
    if (access?.isFounder) return; // founders don't pay
    if (!email.trim()) { setError('Please enter your email'); return; }
    setLoading(planId); setError(null);
    try {
      const data = await createCheckoutSession(planId, email.trim());
      if (data?.checkoutUrl || data?.url) {
        window.location.href = data.checkoutUrl || data.url;
      } else {
        setError('Checkout session failed — backend may be waking up. Try again in 30 seconds.');
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">

      {/* Backend status pill */}
      <div className="flex justify-end px-6 pt-4">
        {backendUp === null ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />Checking backend…
          </span>
        ) : backendUp ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Backend Online
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400" />Backend Offline
          </span>
        )}
      </div>

      {/* Header */}
      <div className="text-center pt-12 pb-10 px-4">
        <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-3">
          Build Without Limits
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          AI credits power every build. Pay once, use them across every tool in TerrellOS.
        </p>
      </div>

      {/* Founder override banner */}
      {access?.isFounder && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-8 px-4">
          <div className="flex items-center gap-3 bg-amber-950/30 border border-amber-500/40 rounded-xl px-5 py-4">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300 text-sm">Founder Override — No Billing Required</p>
              <p className="text-amber-400/80 text-xs mt-0.5">
                {access.email} · All plans unlocked · Unlimited AI credits · Super Admin
              </p>
            </div>
            <Link to="/founder-center"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-500/30">
              Founder Center <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Email field */}
      {!user && (
        <div className="flex justify-center mb-10 px-4">
          <div className="w-full max-w-sm">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email to get started…"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-2xl mx-auto mb-6 px-4">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid sm:grid-cols-3 gap-5 max-w-5xl mx-auto px-4 mb-12">
        {PLANS.map((plan, idx) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={cn(
                'relative rounded-2xl border p-6 flex flex-col bg-card/60 backdrop-blur-sm',
                plan.color
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    <Star className="w-3 h-3" />Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', plan.badgeColor)}>
                  {plan.name}
                </span>
              </div>

              <div className="mb-1">
                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground text-sm">/{plan.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

              {/* Credits highlight */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 mb-5">
                <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">
                  {plan.credits.toLocaleString()} credits/mo
                </span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {plan.limits?.map((l, i) => (
                  <li key={`l${i}`} className="flex items-start gap-2 text-xs text-muted-foreground/50">
                    <span className="w-3.5 shrink-0 text-center">·</span>{l}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null || access?.isFounder}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50',
                  plan.ctaClass
                )}
              >
                {loading === plan.id
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                  : access?.isFounder
                    ? <><Crown className="w-3.5 h-3.5" />Founder Access</>
                    : <>{plan.cta}<ArrowRight className="w-3.5 h-3.5" /></>
                }
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Credit rollover note */}
      <p className="text-center text-xs text-muted-foreground -mt-4 mb-12 px-4">
        * Unused credits roll over per plan (7–90 days). All plans include a 7-day money-back guarantee.
      </p>

      {/* Comparison Table */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold text-sm text-foreground">Plan Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">Feature</th>
                  {['Starter', 'Pro', 'Enterprise'].map(h => (
                    <th key={h} className="text-center px-3 py-3 font-medium text-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-muted/10' : ''}>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.feature}</td>
                    <td className="px-3 py-2.5"><CellVal v={row.starter} /></td>
                    <td className="px-3 py-2.5"><CellVal v={row.pro} /></td>
                    <td className="px-3 py-2.5"><CellVal v={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-4 py-10 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">FAQ</h2>
        <div className="space-y-6">
          {[
            ['What are AI credits?', 'Credits power every AI operation — code generation, debugging, UI design, deployment. Each action costs a set number of credits. You can track usage in real-time from your dashboard.'],
            ['Do unused credits roll over?', 'Yes — Starter rolls over 7 days, Pro 30 days, Enterprise 90 days. Credits beyond the rollover window expire.'],
            ['Can I upgrade anytime?', 'Yes. Upgrade at any time — unused credits are prorated and carried forward.'],
            ['Is there a money-back guarantee?', 'All plans include a 7-day money-back guarantee. No questions asked.'],
            ['What payment methods do you accept?', 'All major credit/debit cards via Stripe. Invoicing available for Enterprise.'],
          ].map(([q, a]) => (
            <div key={q}>
              <h3 className="font-semibold text-foreground text-sm mb-1.5">{q}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-primary/5 border-t border-primary/20 py-10 mt-4 text-center px-4">
        <h2 className="text-2xl font-bold text-foreground mb-3">Ready to build?</h2>
        <p className="text-muted-foreground text-sm mb-2">
          Choose a plan above and start creating with AI immediately.
        </p>
        <p className="text-xs text-muted-foreground">
          7-day money-back guarantee · No contracts · Cancel anytime
        </p>
      </div>
    </div>
  );
}
