import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, Loader2, Table, AlertTriangle } from 'lucide-react';
import ModelBadge from '@/components/ModelBadge';
import { getModelForTool } from '@/lib/modelResolver';

const TABLES = [
  { name: 'Project', label: 'Projects', entity: 'Project' },
  { name: 'Upload', label: 'Uploads', entity: 'Upload' },
  { name: 'BuildLog', label: 'Build Logs', entity: 'BuildLog' },
  { name: 'BackendConnection', label: 'Backend Connections', entity: 'BackendConnection' },
  { name: 'SystemSettings', label: 'System Settings', entity: 'SystemSettings' },
  { name: 'DiagnosticsReport', label: 'Diagnostics Reports', entity: 'DiagnosticsReport' },
];

export default function DatabaseTool() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    async function load() {
      const [results, mi] = await Promise.all([
        Promise.allSettled(TABLES.map(t => base44.entities[t.entity].list().then(r => ({ name: t.name, count: r.length })))),
        getModelForTool('supabase_architect'),
      ]);
      const map = {};
      results.forEach(r => { if (r.status === 'fulfilled') map[r.value.name] = r.value.count; });
      setCounts(map);
      setModelInfo(mi);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
            Database Explorer
            <ModelBadge toolKey="supabase_architect" />
          </h1>
          <div className="text-xs text-muted-foreground">Live entity table counts — Base44 database</div>
        </div>
      </div>
      {modelInfo && !modelInfo.is_active && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Supabase Architect is disabled. Enable it in <a href="/ai-models" className="underline ml-1">AI Models →</a>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          TABLES.map((t, i) => (
            <div key={t.name} className={`flex items-center gap-4 px-5 py-4 ${i < TABLES.length - 1 ? 'border-b border-border' : ''}`}>
              <Table className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{t.label}</div>
                <div className="text-xs font-mono text-muted-foreground">{t.entity}</div>
              </div>
              <div className="text-lg font-bold text-primary font-mono">
                {counts[t.name] ?? '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}