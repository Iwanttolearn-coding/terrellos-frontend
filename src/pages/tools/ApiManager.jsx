import { useState, useEffect } from 'react';
import { pingBackend } from '@/lib/backendApi';
import { API_BASE_URL } from '@/lib/env';
import { Settings2, Zap, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import ModelBadge from '@/components/ModelBadge';
import { getModelForTool } from '@/lib/modelResolver';
import { Button } from '@/components/ui/button';

const ENDPOINTS = [
  { path: '/health', method: 'GET', desc: 'Backend health check' },
  { path: '/chat', method: 'POST', desc: 'AI chat endpoint' },
  { path: '/build', method: 'POST', desc: 'Build command runner' },
  { path: '/status', method: 'POST', desc: 'Build status check' },
  { path: '/upload', method: 'POST', desc: 'File upload handler' },
];

export default function ApiManager() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState({});
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => { getModelForTool('vercel_fixer').then(setModelInfo); }, []);

  async function testEndpoint(endpoint) {
    setTesting(p => ({ ...p, [endpoint.path]: true }));
    const start = Date.now();
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        signal: AbortSignal.timeout(8000),
        headers: { 'Content-Type': 'application/json' },
        ...(endpoint.method === 'POST' ? { body: JSON.stringify({}) } : {}),
      });
      setResults(p => ({ ...p, [endpoint.path]: { ok: res.ok || res.status !== 0, status: res.status, ms: Date.now() - start } }));
    } catch (err) {
      setResults(p => ({ ...p, [endpoint.path]: { ok: false, status: 0, ms: Date.now() - start, error: err.message } }));
    } finally {
      setTesting(p => ({ ...p, [endpoint.path]: false }));
    }
  }

  async function testAll() {
    for (const ep of ENDPOINTS) await testEndpoint(ep);
  }

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-900 flex items-center justify-center flex-shrink-0">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
              API Manager
              <ModelBadge toolKey="vercel_fixer" />
            </h1>
            <div className="text-xs font-mono text-muted-foreground truncate max-w-48">{API_BASE_URL}</div>
          </div>
        </div>
        <Button size="sm" onClick={testAll} disabled={modelInfo?.is_active === false}><Zap className="w-3 h-3 mr-1" />Test All</Button>
      </div>

      {modelInfo && !modelInfo.is_active && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Render/Fly Deployment Fixer is disabled. Enable it in <a href="/ai-models" className="underline ml-1">AI Models →</a>
        </div>
      )}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {ENDPOINTS.map((ep, i) => {
          const r = results[ep.path];
          const isTesting = testing[ep.path];
          return (
            <div key={ep.path} className={`flex items-center gap-3 px-4 py-4 ${i < ENDPOINTS.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>{ep.method}</span>
                  <span className="text-sm font-mono text-foreground">{ep.path}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{ep.desc}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r && !isTesting && (
                  <span className="text-xs font-mono text-muted-foreground">{r.ms}ms</span>
                )}
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : r ? (
                  r.status === 404 ? <span className="text-xs text-yellow-400 font-mono">404</span> :
                  r.ok ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                  <XCircle className="w-4 h-4 text-destructive" />
                ) : null}
                <Button size="sm" variant="outline" onClick={() => testEndpoint(ep)} disabled={isTesting}>Test</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
