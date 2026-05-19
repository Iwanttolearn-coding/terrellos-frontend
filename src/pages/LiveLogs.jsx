import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { pingBackend } from '@/lib/backendApi';
import { API_BASE_URL } from '@/lib/env';
import { ScrollText, RefreshCw, Trash2, Activity, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import StatusBadge from '@/components/ui/StatusBadge';

const TYPE_COLORS = {
  create_app:     'text-emerald-400',
  fix_app:        'text-blue-400',
  generate_ui:    'text-violet-400',
  debug_error:    'text-destructive',
  build_template: 'text-cyan-400',
  prepare_deployment: 'text-yellow-400',
  analyze_screenshot: 'text-pink-400',
  custom:         'text-muted-foreground',
};

export default function LiveLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ping, setPing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  async function load() {
    setLoading(true);
    const [data, pingResult] = await Promise.all([
      base44.entities.BuildLog.list('-created_date', 100),
      pingBackend(),
    ]);
    setLogs(data);
    setPing(pingResult);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 5000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.BuildLog.subscribe(event => {
      if (event.type === 'create') setLogs(prev => [event.data, ...prev]);
      else if (event.type === 'update') setLogs(prev => prev.map(l => l.id === event.id ? event.data : l));
      else if (event.type === 'delete') setLogs(prev => prev.filter(l => l.id !== event.id));
    });
    return unsub;
  }, []);

  const FILTERS = ['all', 'success', 'failed', 'running', 'pending'];
  const filtered = filter === 'all' ? logs : logs.filter(l => l.status === filter);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Live Logs</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${ping?.ok ? 'bg-emerald-400 animate-pulse' : 'bg-destructive'}`} />
            <span className="text-xs font-mono text-muted-foreground">
              {ping?.ok ? `Backend ${ping.latency_ms}ms` : 'Backend offline'} · {filtered.length} entries
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-mono ${autoRefresh ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
          >
            {autoRefresh ? '◉ LIVE' : '○ LIVE'}
          </button>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 text-xs px-3 py-1 rounded-lg transition-colors ${filter === f ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-5 w-16 bg-secondary/50 rounded animate-pulse" />
                <div className="h-4 flex-1 bg-secondary/30 rounded animate-pulse" />
                <div className="h-4 w-24 bg-secondary/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <div className="text-sm">No logs matching filter.</div>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[65vh] overflow-y-auto scrollbar-dark">
            {filtered.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                <StatusBadge status={log.status} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-mono font-semibold ${TYPE_COLORS[log.command_type] || 'text-muted-foreground'}`}>
                    {(log.command_type || 'custom').replace(/_/g, ' ').toUpperCase()}
                  </div>
                  {log.project_name && !log.project_name.startsWith('activity:') && !log.project_name.startsWith('chat:') && (
                    <div className="text-sm text-foreground truncate mt-0.5">{log.project_name}</div>
                  )}
                  {log.prompt && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{log.prompt.slice(0, 120)}</div>
                  )}
                  {log.error_message && (
                    <div className="text-xs text-destructive mt-0.5 truncate">{log.error_message}</div>
                  )}
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  {log.duration_ms && <div className="text-xs font-mono text-muted-foreground">{log.duration_ms}ms</div>}
                  <div className="text-xs text-muted-foreground">
                    {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}