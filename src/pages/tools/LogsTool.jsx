import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/env';
import { pingBackend } from '@/lib/backendApi';
import { ScrollText, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const DOT = { success: 'bg-emerald-400', error: 'bg-destructive', info: 'bg-blue-400', warn: 'bg-yellow-400' };
const TEXT = { success: 'text-emerald-400', error: 'text-destructive', info: 'text-blue-400', warn: 'text-yellow-400' };

let _globalLogs = [];
let _listeners = [];
function addLog(type, msg) {
  const entry = { id: Date.now() + Math.random(), type, msg, time: new Date() };
  _globalLogs = [entry, ..._globalLogs].slice(0, 200);
  _listeners.forEach(fn => fn([..._globalLogs]));
}
function useGlobalLogs() {
  const [logs, setLogs] = useState([..._globalLogs]);
  useEffect(() => {
    _listeners.push(setLogs);
    return () => { _listeners = _listeners.filter(fn => fn !== setLogs); };
  }, []);
  return logs;
}

export { addLog };

export default function LogsTool() {
  const logs = useGlobalLogs();
  const [pinging, setPinging] = useState(false);

  async function runPing() {
    setPinging(true);
    addLog('info', `Pinging ${API_BASE_URL}/health…`);
    const r = await pingBackend();
    if (r.ok) addLog('success', `Backend responded in ${r.latency_ms}ms — HTTP ${r.status}`);
    else addLog('error', `Ping failed: ${r.error || `HTTP ${r.status}`}`);
    setPinging(false);
  }

  useEffect(() => {
    if (logs.length === 0) { addLog('info', 'Logs tool initialized'); runPing(); }
  }, []);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-600 to-amber-800 flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold gradient-text">Activity Logs</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={runPing} disabled={pinging}>
            <RefreshCw className={`w-3 h-3 mr-1 ${pinging ? 'animate-spin' : ''}`} /> Ping
          </Button>
          <Button size="sm" variant="outline" onClick={() => { _globalLogs = []; _listeners.forEach(fn => fn([])); }}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No logs yet.</div>
        ) : (
          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto scrollbar-dark">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${DOT[log.type] || 'bg-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-mono ${TEXT[log.type] || 'text-foreground'}`}>{log.msg}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(log.time, { addSuffix: true })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
