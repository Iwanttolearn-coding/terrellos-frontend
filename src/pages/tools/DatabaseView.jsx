import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/env';
import { Database, Loader2, RefreshCw, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export default function DatabaseView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(null);

  async function fetchRecords() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/projects`);
      const data = await res.json();
      setRecords(data.projects || []);
      setCount(data.count || 0);
    } catch {
      setError('Cannot reach backend database.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRecords(); }, []);

  const FIELDS = ['id', 'project_name', 'prompt', 'tool_type', 'status', 'created_at', 'html', 'css', 'js'];

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-purple-blue flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Database View</h1>
            <div className="text-[10px] font-mono text-muted-foreground">{API_BASE_URL}/projects · {count} records</div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={fetchRecords} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="text-center py-16 text-destructive text-sm">{error}</div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <div className="text-base font-medium mb-1">Database is empty</div>
          <div className="text-xs">No records saved yet. Generate something in the AI Builder.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {[...records].reverse().map((r, i) => (
            <div key={r.id} className="card-glass rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{records.length - i}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{r.project_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.prompt}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">{r.tool_type}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : ''}
                  </span>
                </div>
              </button>

              {expanded === r.id && (
                <div className="border-t border-border bg-secondary/20 px-4 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FIELDS.map(f => (
                      r[f] ? (
                        <div key={f} className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{f}</span>
                          <span className="text-xs text-foreground font-mono bg-secondary/60 rounded px-2 py-1 truncate">
                            {String(r[f]).length > 100 ? String(r[f]).slice(0, 100) + '…' : String(r[f])}
                          </span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}