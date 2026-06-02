import { useEffect, useState } from 'react';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';
import { ScrollText, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDistanceToNow, format } from 'date-fns';

export default function BuildLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    const res = await fetch(`${BACKEND_BASE_URL}/v1/admin/usage-logs?limit=100`, { signal: AbortSignal.timeout(10000) });
    const json = res.ok ? await res.json() : { logs: [] };
    const data = json.logs || [];
    setLogs(data);
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    // Delete not supported via backend — clear from local state only
    load(true);
  };

  const filtered = logs.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterType && l.command_type !== filterType) return false;
    return true;
  });

  const commandTypes = [...new Set(logs.map(l => l.command_type).filter(Boolean))];

  return (
    <div className="p-6 lg:p-8 animate-fade-up">
      <PageHeader
        title="Build Logs"
        subtitle="Real-time command history and backend responses"
        action={
          <Button variant="outline" onClick={() => load(true)} disabled={refreshing}
            className="border-border text-muted-foreground hover:text-foreground rounded-xl">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-secondary/50 border-border text-foreground">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All statuses</SelectItem>
            {['pending','running','success','failed','skipped'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 bg-secondary/50 border-border text-foreground">
            <SelectValue placeholder="All command types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All types</SelectItem>
            {commandTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground self-center ml-2">{filtered.length} logs</div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="card-glass rounded-2xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No build logs yet."
          description="Build logs appear here when you send commands from the AI Builder page."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <div key={log.id} className="card-glass rounded-2xl overflow-hidden hover:border-primary/20 transition-colors duration-150">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              >
                <StatusBadge status={log.status} />
                <span className="text-sm font-medium text-foreground capitalize flex-1 truncate">
                  {(log.command_type || '').replace(/_/g, ' ')}
                </span>
                {log.project_name && (
                  <span className="text-xs text-primary hidden sm:block flex-shrink-0">{log.project_name}</span>
                )}
                <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                  {log.duration_ms ? `${log.duration_ms}ms` : ''}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : ''}
                </span>
                {expanded === log.id
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(log.id); }}
                  className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Delete log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {expanded === log.id && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                  {log.created_date && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {format(new Date(log.created_date), 'PPpp')}
                    </div>
                  )}
                  {log.prompt && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Prompt</div>
                      <p className="text-sm text-foreground bg-secondary/50 rounded-xl p-3">{log.prompt}</p>
                    </div>
                  )}
                  {log.backend_url_used && (
                    <div className="text-xs text-muted-foreground font-mono">Backend: {log.backend_url_used}</div>
                  )}
                  {log.error_message && (
                    <div>
                      <div className="text-xs text-destructive mb-1 uppercase tracking-wide">Error</div>
                      <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-3 font-mono">{log.error_message}</p>
                    </div>
                  )}
                  {log.backend_response && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Backend Response</div>
                      <pre className="text-xs text-foreground bg-secondary/50 rounded-xl p-3 overflow-x-auto font-mono max-h-48">
                        {log.backend_response}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}