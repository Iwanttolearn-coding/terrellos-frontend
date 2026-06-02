import { loadUser, resolveUserAccess } from '@/lib/resolveUserAccess';
import { useState, useEffect } from 'react';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';
import { getEffectiveAccess } from '@/lib/ownerConfig';
import { DollarSign, Cpu, RefreshCw, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Estimated cost per 1K tokens
const AI_COSTS = {
  openai_gpt4o:     { input: 0.0025, output: 0.01,   label: 'GPT-4o' },
  openai_mini:      { input: 0.00015, output: 0.0006, label: 'GPT-4o Mini' },
  gemini_flash:     { input: 0.000075, output: 0.0003, label: 'Gemini Flash' },
  claude_sonnet:    { input: 0.003, output: 0.015,    label: 'Claude Sonnet' },
  elevenlabs_tts:   { per_char: 0.00003,              label: 'ElevenLabs TTS' },
};

const DAILY_LIMIT_USD = 5.00;
const MONTHLY_LIMIT_USD = 50.00;

function CostBar({ label, used, limit, color }) {
  const pct = Math.min(100, (used / limit) * 100);
  const warn = pct > 70;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={warn ? 'text-yellow-400' : 'text-foreground'}>${used.toFixed(3)} / ${limit.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct > 85 ? 'bg-destructive' : pct > 70 ? 'bg-yellow-400' : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CostManager() {
  const [access, setAccess] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState(null);

  useEffect(() => {
    Promise.resolve(loadUser()).then(u => setAccess(resolveUserAccess(u))).catch(() => {});
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    let logs = [];
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/v1/admin/usage-logs`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        logs = data.logs || data.results || [];
      }
    } catch (err) {
      console.error('CostManager fetch failed:', err.message);
    }
    setLogs(logs);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const aiLogs = logs.filter(l => ['custom', 'create_app', 'fix_app', 'generate_ui', 'debug_error'].includes(l.command_type));
    const todayLogs = aiLogs.filter(l => new Date(l.created_date) >= today);
    const monthLogs = aiLogs.filter(l => new Date(l.created_date) >= monthStart);

    // Estimate costs based on request count (avg 500 tokens/req at GPT-4o mini rates)
    const estimateReqCost = (count) => count * 0.5 * (AI_COSTS.openai_mini.input + AI_COSTS.openai_mini.output);
    const todayCost = estimateReqCost(todayLogs.length);
    const monthCost = estimateReqCost(monthLogs.length);
    const totalCost = estimateReqCost(aiLogs.length);

    // Build 7-day chart
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const count = aiLogs.filter(l => new Date(l.created_date).toDateString() === d.toDateString()).length;
      daily.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), cost: parseFloat(estimateReqCost(count).toFixed(4)), requests: count });
    }

    // Provider breakdown (estimated from log type distribution)
    const byProvider = Object.entries(AI_COSTS).map(([key, v]) => {
      // Use actual log model field if available, else estimate distribution
      const matched = aiLogs.filter(l => (l.model || '').toLowerCase().includes(key.replace('openai_','').replace('_','-')) || (l.provider || '').toLowerCase().includes(key)).length;
      const count = matched || Math.max(0, Math.floor(aiLogs.length * (key === 'openai_mini' ? 0.6 : key === 'openai_gpt4o' ? 0.2 : 0.05)));
      return { provider: v.label, requests: count, est_cost: parseFloat((count * estimateReqCost(1)).toFixed(4)) };
    });

    setCosts({ todayCost, monthCost, totalCost, daily, byProvider, todayReqs: todayLogs.length, monthReqs: monthLogs.length, totalReqs: aiLogs.length });
    setLoading(false);
  }

  if (access && !access.founder) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <div className="text-sm font-semibold">Super Admin access required.</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">AI Cost Manager</h1>
            <div className="text-xs text-muted-foreground">Real usage estimates from build logs</div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card-glass rounded-2xl h-20 animate-pulse" />)}</div>
      ) : costs ? (
        <>
          {/* Usage bars */}
          <div className="card-glass rounded-2xl p-5 mb-4 space-y-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Budget Utilization</div>
            <CostBar label="Today" used={costs.todayCost} limit={DAILY_LIMIT_USD} color="bg-primary" />
            <CostBar label="This Month" used={costs.monthCost} limit={MONTHLY_LIMIT_USD} color="bg-accent" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Today Requests', value: costs.todayReqs, sub: `~$${costs.todayCost.toFixed(4)}` },
              { label: 'Month Requests', value: costs.monthReqs, sub: `~$${costs.monthCost.toFixed(3)}` },
              { label: 'Total Requests', value: costs.totalReqs, sub: `~$${costs.totalCost.toFixed(2)}` },
              { label: 'Daily Limit', value: `$${DAILY_LIMIT_USD}`, sub: 'configurable' },
            ].map(s => (
              <div key={s.label} className="card-glass rounded-xl p-3">
                <div className="text-lg font-bold font-mono text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-[10px] text-primary font-mono">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* 7-day chart */}
          <div className="card-glass rounded-2xl p-5 mb-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">7-Day AI Cost Trend (Estimated USD)</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={costs.daily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 18% 15%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(220 12% 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(220 12% 55%)' }} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(230 22% 8%)', border: '1px solid hsl(230 18% 15%)', borderRadius: 8 }}
                  labelStyle={{ color: 'hsl(220 20% 95%)' }}
                  formatter={(v) => [`$${v}`, 'Est. Cost']}
                />
                <Bar dataKey="cost" fill="hsl(265 80% 60%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Provider breakdown */}
          <div className="card-glass rounded-2xl p-5">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Provider Breakdown (Estimated)</div>
            <div className="space-y-2">
              {costs.byProvider.map(p => (
                <div key={p.provider} className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground flex-1">{p.provider}</span>
                  <span className="text-xs text-muted-foreground font-mono">{p.requests} reqs</span>
                  <span className="text-xs text-primary font-mono">~${p.est_cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-3 py-2 flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground">Costs are estimated from request counts using average token rates. Connect backend cost tracking for exact figures.</span>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}