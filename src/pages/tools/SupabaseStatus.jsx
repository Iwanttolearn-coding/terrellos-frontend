import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

import { CheckCircle2, AlertCircle, XCircle, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const STATUS_ICONS = {
  PASS: { icon: CheckCircle2, color: 'text-emerald-500' },
  WARN: { icon: AlertCircle, color: 'text-amber-500' },
  FAIL: { icon: XCircle, color: 'text-destructive' },
  CRITICAL: { icon: XCircle, color: 'text-destructive' },
};

export default function SupabaseStatus() {
  const { user, isLoadingAuth } = useAuth();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await safeInvoke('dbHealth', {});
      setHealth(response.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Health check error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth) {
      fetchHealth();
    }
  }, [isLoadingAuth]);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Initializing auth...</p>
        </div>
      </div>
    );
  }

  const statusConfig = health && STATUS_ICONS[health.summary.split(' ')[0]];
  const Icon = statusConfig?.icon;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">DB Status</h1>
            <p className="text-xs text-muted-foreground font-mono">TerrellOS · TM Designs · Terrell Mills</p>
          </div>
        </div>
        <Button
          onClick={fetchHealth}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          {loading ? 'Checking...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-6 border border-destructive/40 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {health && (
        <>
          {/* Overall Status */}
          <Card className="p-6 mb-6 border border-border bg-card/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {Icon && <Icon className={cn('w-6 h-6', statusConfig.color)} />}
                <div>
                  <h2 className="text-lg font-semibold text-foreground">System Health</h2>
                  <p className="text-sm text-muted-foreground">{health.summary}</p>
                </div>
              </div>
              <Badge variant={
                health.summary.startsWith('PASS') ? 'default' :
                health.summary.startsWith('WARN') ? 'outline' :
                'destructive'
              }>
                {health.latency}ms
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Authentication</p>
                <p className="font-mono text-foreground">
                  {health.auth.authenticated ? '✓ Signed in' : '✗ Not signed in'}
                </p>
                {health.auth.email && (
                  <p className="text-xs text-muted-foreground mt-1">{health.auth.email}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Role</p>
                <p className="font-mono text-foreground">{health.auth.role || 'none'}</p>
                {health.auth.isFounder && (
                  <p className="text-xs text-primary mt-1">👑 Founder Access</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Environment</p>
                <p className="font-mono text-foreground">
                  {health.environment.allRequired ? '✓ Valid' : '✗ Incomplete'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Last Check</p>
                <p className="font-mono text-foreground text-xs">
                  {lastUpdate?.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Environment Variables */}
          <Card className="p-6 mb-6 border border-border bg-card/50">
            <h3 className="font-semibold text-foreground mb-4">Environment Configuration</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'SUPABASE_URL', key: 'supabaseUrl' },
                { label: 'SUPABASE_ANON_KEY', key: 'supabaseAnonKey' },
                { label: 'OPENAI_API_KEY', key: 'openaiKey' },
                { label: 'WIX_PAYMENTS (Site + API Key)', key: 'wixPayments' },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-muted-foreground font-mono text-xs">{label}</span>
                  <Badge variant={health.environment[key] ? 'default' : 'destructive'}>
                    {health.environment[key] ? '✓ Set' : '✗ Missing'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Table Health */}
          <Card className="p-6 border border-border bg-card/50">
            <h3 className="font-semibold text-foreground mb-4">Entity Health</h3>
            <div className="space-y-3">
              {Object.entries(health.tables).map(([table, status]) => {
                const tableIcon = STATUS_ICONS[status.status];
                const TableIcon = tableIcon?.icon;
                return (
                  <div key={table} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      {TableIcon && <TableIcon className={cn('w-4 h-4', tableIcon.color)} />}
                      <span className="font-mono text-foreground">{table}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {status.rowCount !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {status.rowCount} rows
                        </span>
                      )}
                      <Badge variant={
                        status.status === 'PASS' ? 'default' :
                        status.status === 'WARN' ? 'outline' :
                        'destructive'
                      }>
                        {status.latency}ms
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {loading && !health && (
        <Card className="p-12 text-center border border-border bg-card/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Running health checks...</p>
          </div>
        </Card>
      )}
    </div>
  );
}