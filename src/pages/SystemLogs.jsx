import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import { getSystemLogs } from '@/lib/terrellOS';
import { ScrollText, RefreshCw, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

function statusIcon(status) {
  if (status === 'success') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === 'error' || status === 'failed') return <XCircle className="w-3.5 h-3.5 text-destructive" />;
  return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
}

export default function SystemLogs() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [backendLogs, setBackendLogs] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      loadLogs();
    }).catch(() => setLoading(false));
  }, []);

  const access = resolveUserAccess(user);

  if (user !== null && !access.canViewLogs) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center border border-destructive/30">
          <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">System Logs are available to founders and admins only.</p>
        </div>
      </div>
    );
  }

  async function loadLogs() {
    setRefreshing(true);
    try {
      // Try to load from Base44 BuildLog entity
      const entityLogs = await base44.entities.BuildLog.list('-created_date', 50).catch(() => []);
      setLogs(entityLogs);

      // Also try backend logs
      const backendResult = await getSystemLogs();
      if (backendResult.ok) setBackendLogs(backendResult.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
            <ScrollText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">System Logs</h1>
            <p className="text-xs text-muted-foreground font-mono">Real-time operational log feed</p>
          </div>
        </div>
        <Button onClick={loadLogs} disabled={refreshing} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="card-glass rounded-2xl border border-border p-12 text-center">
          <ScrollText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-base font-bold text-foreground mb-2">No logs yet</h3>
          <p className="text-xs text-muted-foreground">
            Run diagnostics to create your first production log.
          </p>
        </div>
      ) : (
        <div className="card-glass rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto scrollbar-dark">
            {logs.map((log, i) => (
              <div key={log.id || i} className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors">
                <div className="flex-shrink-0 mt-0.5">{statusIcon(log.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">
                      {(log.command_type || 'event').replace(/_/g, ' ')}
                    </span>
                    {log.project_name && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                        {log.project_name}
                      </span>
                    )}
                  </div>
                  {log.prompt && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{log.prompt}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {log.created_date
                    ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true })
                    : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-[10px] text-muted-foreground font-mono">
        Powered by TM Designz™
      </div>
    </div>
  );
}