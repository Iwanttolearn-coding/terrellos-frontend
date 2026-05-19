import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { pingBackend } from '@/lib/backendApi';
import { ENV, currentEnvConfig, IS_PRODUCTION } from '@/lib/envDetect';
import { APP_VERSION } from '@/lib/env';
import EnvBadge from '@/components/EnvBadge';
import {
  Rocket, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock,
  GitBranch, Globe, Zap, RotateCcw, ExternalLink, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/components/NotificationCenter';
import { formatDistanceToNow } from 'date-fns';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const ENVIRONMENTS = [
  {
    env: 'production',
    label: 'Production',
    url: 'https://terrellos.vercel.app',
    branch: 'main',
    isPrimary: true,
  },
  {
    env: 'staging',
    label: 'Staging / Preview',
    url: 'https://terrellosbuild.base44.app',
    branch: 'preview',
    isPrimary: false,
  },
];

function EnvCard({ envDef, backendOk, backendLatency }) {
  const isProd = envDef.env === 'production';
  return (
    <div className={`card-glass rounded-2xl p-5 border ${isProd ? 'border-emerald-500/25' : 'border-yellow-500/20'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className={`w-4 h-4 ${isProd ? 'text-emerald-400' : 'text-yellow-400'}`} />
          <span className="text-sm font-bold text-foreground">{envDef.label}</span>
          {envDef.isPrimary && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">PRIMARY</span>
          )}
        </div>
        <a href={envDef.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <div className="space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">URL</span>
          <span className="text-foreground truncate max-w-48">{envDef.url}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Branch</span>
          <span className="flex items-center gap-1 text-foreground"><GitBranch className="w-3 h-3" />{envDef.branch}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Backend</span>
          <span className={backendOk ? 'text-emerald-400' : 'text-destructive'}>
            {backendOk === null ? '…' : backendOk ? `✓ ${backendLatency}ms` : '✗ unreachable'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Live keys</span>
          <span className={isProd ? 'text-emerald-400' : 'text-yellow-400'}>{isProd ? 'ENABLED' : 'DISABLED'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Write guard</span>
          <span className={isProd ? 'text-emerald-400' : 'text-orange-400'}>{isProd ? 'OFF' : 'ACTIVE'}</span>
        </div>
      </div>
    </div>
  );
}

export default function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [backendOk, setBackendOk] = useState(null);
  const [backendLatency, setBackendLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (autoRefresh) intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  async function load() {
    setLoading(true);
    const [deploys, backend] = await Promise.allSettled([
      base44.entities.Deployment.list('-created_date', 20),
      pingBackend(),
    ]);
    if (deploys.status === 'fulfilled') setDeployments(deploys.value);
    if (backend.status === 'fulfilled') {
      setBackendOk(backend.value.ok);
      setBackendLatency(backend.value.latency_ms);
    } else {
      setBackendOk(false);
    }
    setLoading(false);
  }

  async function rollback(deployment) {
    if (!window.confirm('Rollback to this version?')) return;
    try {
      const result = await safeInvoke('deploymentRollback', { deployment_id: deployment.id });
      notify.success(result.data.message);
      load();
    } catch (err) {
      notify.error(err.message);
    }
  }

  const activeDeployment = deployments.find(d => d.status === 'active');

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple flex-shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
              Deployment Center
              <EnvBadge />
            </h1>
            <div className="text-xs text-muted-foreground font-mono">
              Primary → terrellos.vercel.app · v{APP_VERSION}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${autoRefresh ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
          >
            {autoRefresh ? '● LIVE' : '○ LIVE'}
          </button>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Current env notice */}
      {!IS_PRODUCTION && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
          <Shield className="w-4 h-4 flex-shrink-0" />
          You are viewing from <span className="font-mono font-bold mx-1">{ENV.toUpperCase()}</span> — live keys and writes are disabled. Deploy to <span className="font-mono mx-1">terrellos.vercel.app</span> for production access.
        </div>
      )}

      {/* Environment cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {ENVIRONMENTS.map(e => (
          <EnvCard key={e.env} envDef={e} backendOk={backendOk} backendLatency={backendLatency} />
        ))}
      </div>

      {/* Active deployment */}
      {activeDeployment && (
        <div className="card-glass rounded-2xl p-5 mb-5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Active Deployment</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">LIVE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-3">
            <div><p className="text-muted-foreground mb-0.5">Version</p><p className="text-foreground">v{activeDeployment.version}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Environment</p><p className="text-foreground uppercase">{activeDeployment.environment}</p></div>
            <div><p className="text-muted-foreground mb-0.5">Health</p><p className="text-emerald-400">{activeDeployment.health_score || 100}%</p></div>
            <div>
              <p className="text-muted-foreground mb-0.5">Deployed</p>
              <p className="text-foreground">
                {activeDeployment.deployed_at
                  ? formatDistanceToNow(new Date(activeDeployment.deployed_at), { addSuffix: true })
                  : '—'}
              </p>
            </div>
          </div>
          {activeDeployment.notes && (
            <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2 mb-3">{activeDeployment.notes}</p>
          )}
          {activeDeployment.rollback_available && (
            <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={() => rollback(activeDeployment)}>
              <RotateCcw className="w-3.5 h-3.5" /> Rollback to Previous Version
            </Button>
          )}
        </div>
      )}

      {/* Deployment history */}
      <div className="card-glass rounded-2xl p-5 border border-border">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">Deployment History</h3>
        {deployments.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No deployments logged yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-dark">
            {deployments.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {d.status === 'active' ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> :
                   d.status === 'failed' ? <XCircle className="w-4 h-4 text-destructive flex-shrink-0" /> :
                   <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-foreground">v{d.version}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.deployed_by || 'system'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground font-mono hidden sm:block">
                    {d.deployed_at ? formatDistanceToNow(new Date(d.deployed_at), { addSuffix: true }) : '—'}
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                    d.status === 'active'      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                    d.status === 'failed'      ? 'bg-destructive/15 text-destructive border-destructive/25' :
                    d.status === 'rolled_back' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' :
                    'bg-secondary text-muted-foreground border-border'
                  }`}>{d.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}