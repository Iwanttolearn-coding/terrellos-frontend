import { useState, useEffect } from 'react';
import { getRealAnalytics } from '@/lib/persistence';
import { pingBackend } from '@/lib/backendApi';
import { API_BASE_URL } from '@/lib/env';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart2, RefreshCw, Database, HardDrive, Cpu, MessageSquare, FolderKanban, TrendingUp, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card-glass rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent || 'bg-primary/15'}`}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold font-mono text-foreground leading-tight">{value}</div>
        <div className="text-xs font-semibold text-foreground mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const CHART_COLOR = 'hsl(265 80% 60%)';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [ping, setPing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  async function load() {
    setLoading(true);
    const [analytics, pingResult] = await Promise.all([
      getRealAnalytics(),
      pingBackend(),
    ]);
    setData(analytics);
    setPing(pingResult);
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            REAL METRICS ONLY — {lastRefresh ? lastRefresh.toLocaleTimeString() : '—'}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Backend status */}
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 mb-6 ${ping?.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
        <Activity className={`w-4 h-4 ${ping?.ok ? 'text-emerald-400' : 'text-destructive'}`} />
        <span className="text-sm font-medium text-foreground">
          {ping?.ok ? `Backend Live — ${ping.latency_ms}ms` : 'Backend Unreachable'}
        </span>
        <span className="ml-auto text-xs font-mono text-muted-foreground truncate">{API_BASE_URL}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-glass rounded-2xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <StatCard icon={FolderKanban} label="Projects"        value={data.projects}         sub="All time" />
            <StatCard icon={HardDrive}    label="Uploads"          value={data.uploads}           sub={`${data.storage_mb} MB`} />
            <StatCard icon={Database}     label="Build Logs"       value={data.logs}             sub="All commands" />
            <StatCard icon={MessageSquare} label="Conversations"   value={data.conversations}    sub="AI sessions" />
            <StatCard icon={Cpu}          label="AI Calls"         value={data.ai_calls}         sub="Backend requests" />
            <StatCard icon={TrendingUp}   label="Success Rate"     value={data.success_rate !== null ? `${data.success_rate}%` : 'N/A'} sub="All operations" />
          </div>

          {/* Daily activity chart */}
          <div className="card-glass rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Activity — Last 7 Days</span>
              <span className="ml-auto text-xs font-mono text-muted-foreground">{data.recent_activity} events</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.daily_activity} barSize={24}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(220 12% 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(220 12% 55%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(230 22% 8%)', border: '1px solid hsl(230 18% 15%)', borderRadius: 8, fontSize: 11 }}
                  cursor={{ fill: 'hsl(265 80% 60% / 0.08)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.daily_activity.map((_, i) => <Cell key={i} fill={CHART_COLOR} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-glass rounded-2xl p-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Storage</div>
              <div className="text-xl font-bold font-mono text-foreground">{data.storage_mb} MB</div>
              <div className="text-xs text-muted-foreground mt-0.5">Across {data.uploads} files</div>
            </div>
            <div className="card-glass rounded-2xl p-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">This Month</div>
              <div className="text-xl font-bold font-mono text-foreground">{data.active_this_month}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total actions logged</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}