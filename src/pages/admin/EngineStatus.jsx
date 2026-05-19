import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/env';
import { Cpu, Loader2, RefreshCw, CheckCircle, XCircle, Database, Zap, Globe, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

function StatusRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono font-medium text-foreground">{value}</span>
        {ok === true && <CheckCircle className="w-4 h-4 text-emerald-400" />}
        {ok === false && <XCircle className="w-4 h-4 text-destructive" />}
      </div>
    </div>
  );
}

export default function EngineStatus() {
  const [health, setHealth] = useState(null);
  const [engine, setEngine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState(null);

  async function fetchStatus() {
    setLoading(true);
    setError('');
    try {
      const [hRes, eRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health`),
        fetch(`${API_BASE_URL}/admin/engine`),
      ]);
      const [hData, eData] = await Promise.all([hRes.json(), eRes.json()]);
      setHealth(hData);
      setEngine(eData);
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setError('Cannot reach backend. Service may be offline or cold-starting.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Admin Engine</h1>
            <div className="text-[10px] font-mono text-muted-foreground">{API_BASE_URL}/admin/engine</div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={fetchStatus} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="card-glass rounded-2xl p-6 text-center">
          <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <div className="text-sm text-destructive font-medium">{error}</div>
          <div className="text-xs text-muted-foreground mt-2">Backend: {API_BASE_URL}</div>
          <Button className="mt-4" size="sm" onClick={fetchStatus}>Retry</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overall status */}
          <div className={`rounded-2xl p-5 border flex items-center gap-4 ${health?.status === 'healthy' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
            {health?.status === 'healthy'
              ? <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              : <XCircle className="w-8 h-8 text-destructive flex-shrink-0" />}
            <div>
              <div className="font-bold text-foreground text-base">
                {health?.status === 'healthy' ? 'All Systems Operational' : 'Degraded'}
              </div>
              <div className="text-xs text-muted-foreground">Last checked: {lastChecked}</div>
            </div>
          </div>

          {/* Health block */}
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Backend Health</span>
            </div>
            <StatusRow label="Status" value={health?.status} ok={health?.status === 'healthy'} />
            <StatusRow label="Backend" value={health?.backend} ok={health?.backend === 'online'} />
            <StatusRow label="Environment" value={health?.environment} />
            <StatusRow label="OpenAI" value={health?.openai_configured ? 'Configured' : 'Missing'} ok={health?.openai_configured} />
          </div>

          {/* Engine block */}
          <div className="card-glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">Engine Info</span>
            </div>
            <StatusRow label="Engine" value={engine?.engine} />
            <StatusRow label="Version" value={engine?.version} />
            <StatusRow label="OpenAI" value={engine?.openai} ok={engine?.openai === 'configured'} />
            <StatusRow label="Projects Saved" value={String(health?.projects_saved ?? 0)} />
          </div>

          {/* Routes */}
          {engine?.routes && (
            <div className="card-glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Available Routes</span>
              </div>
              <div className="space-y-1">
                {engine.routes.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground">{API_BASE_URL}{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}