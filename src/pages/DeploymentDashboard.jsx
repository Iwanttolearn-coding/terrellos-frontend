import { useState, useEffect, useRef } from 'react';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';
import { pingBackend } from '@/lib/backendApi';
import { Rocket, RefreshCw, AlertTriangle, CheckCircle, Clock, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/components/NotificationCenter';
import { formatDistanceToNow } from 'date-fns';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const SERVICES = [
  { key: 'backend', label: 'Backend API' },
  { key: 'database', label: 'Database' },
  { key: 'uploads', label: 'File Storage' },
  { key: 'ai_core', label: 'AI Engine' },
];

export default function DeploymentDashboard() {
  const [deployments, setDeployments] = useState([]);
  const [currentDeployment, setCurrentDeployment] = useState(null);
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadDeployments();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadDeployments, 30000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  async function loadDeployments() {
    setLoading(true);
    try {
      const [deploys, backend] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/v1/system/stats`, { signal: AbortSignal.timeout(8000) }).then(r=>r.json()).catch(()=>({})).then(()=>[]),
        pingBackend(),
      ]);

      setDeployments(deploys);
      const active = deploys.find(d => d.status === 'active');
      setCurrentDeployment(active);

      // Real service health from backend ping
      const healthStatus = {};
      const svcChecks = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/health`, {signal: AbortSignal.timeout(5000)}).then(r=>({ok:r.ok,latency:0})).catch(()=>({ok:false,latency:0})),
        fetch(`${BACKEND_BASE_URL}/v1/uploads/health`, {signal: AbortSignal.timeout(5000)}).then(r=>({ok:r.ok,latency:0})).catch(()=>({ok:false,latency:0})),
        fetch(`${BACKEND_BASE_URL}/v1/voice/health`, {signal: AbortSignal.timeout(5000)}).then(r=>({ok:r.ok,latency:0})).catch(()=>({ok:false,latency:0})),
        fetch(`${BACKEND_BASE_URL}/v1/admin/usage-logs?limit=1`, {signal: AbortSignal.timeout(5000)}).then(r=>({ok:r.ok,latency:0})).catch(()=>({ok:false,latency:0})),
      ]);
      SERVICES.forEach((svc, i) => { healthStatus[svc.key] = svcChecks[i] || { ok: false, latency: 0 }; });
      setServices(healthStatus);
    } catch (err) {
      notify.error('Failed to load deployments');
    } finally {
      setLoading(false);
    }
  }

  async function rollbackDeployment() {
    if (!currentDeployment?.id) return;
    if (!window.confirm('Rollback to previous stable version?')) return;

    try {
      const result = await safeInvoke('deploymentRollback', {
        deployment_id: currentDeployment.id,
      });

      notify.success(result.data.message);
      await loadDeployments();
    } catch (err) {
      notify.error(err.message);
    }
  }

  const healthScore = currentDeployment?.health_score || 85;
  const isHealthy = healthScore >= 80;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Deployment Dashboard</h1>
            <div className="text-xs text-muted-foreground font-mono">Real-time Environment Health</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${
              autoRefresh ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            {autoRefresh ? '● LIVE' : '○ LIVE'}
          </button>
          <Button size="sm" variant="outline" onClick={loadDeployments} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Current Deployment Status */}
      {currentDeployment && (
        <div className="card-glass rounded-2xl p-6 mb-6 border border-border">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Active Deployment</h2>
              <p className="text-xs text-muted-foreground">v{currentDeployment.version}</p>
            </div>
            <div className="flex items-center gap-2">
              {isHealthy ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
              <span className={`text-sm font-bold ${isHealthy ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {healthScore}% Healthy
              </span>
            </div>
          </div>

          <div className="w-full bg-secondary/30 rounded-full h-2 mb-4">
            <div
              className={`h-full rounded-full transition-all ${isHealthy ? 'bg-emerald-500' : 'bg-yellow-500'}`}
              style={{ width: `${healthScore}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Deployed</p>
              <p className="font-mono text-foreground">
                {currentDeployment.deployed_at ? formatDistanceToNow(new Date(currentDeployment.deployed_at), { addSuffix: true }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Environment</p>
              <p className="font-mono text-foreground uppercase">{currentDeployment.environment}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Status</p>
              <p className="font-mono text-emerald-400 uppercase">{currentDeployment.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Deployed By</p>
              <p className="font-mono text-sm text-foreground truncate">{currentDeployment.deployed_by || '—'}</p>
            </div>
          </div>

          {currentDeployment.rollback_available && (
            <Button onClick={rollbackDeployment} variant="outline" className="w-full gap-2">
              <RotateCcw className="w-4 h-4" /> Rollback to Previous Version
            </Button>
          )}
        </div>
      )}

      {/* Service Health */}
      <div className="card-glass rounded-2xl p-6 mb-6 border border-border">
        <h3 className="text-sm font-bold text-foreground uppercase mb-4">Service Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVICES.map(svc => {
            const status = services[svc.key];
            const ok = status?.ok;
            return (
              <div key={svc.key} className={`p-4 rounded-xl border ${ok ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{svc.label}</span>
                  {ok ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                {status?.latency && (
                  <p className="text-xs text-muted-foreground mt-1">{status.latency}ms</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deployment History */}
      <div className="card-glass rounded-2xl p-6 border border-border">
        <h3 className="text-sm font-bold text-foreground uppercase mb-4">Deployment History</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {deployments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No deployments yet</p>
          ) : (
            deployments.map(d => (
              <div key={d.id} className="p-3 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-foreground">v{d.version}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.deployed_at ? formatDistanceToNow(new Date(d.deployed_at), { addSuffix: true }) : '—'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  d.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                  d.status === 'rolled_back' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {d.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}