import { loadUser, resolveUserAccess } from '@/lib/resolveUserAccess';
import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { pingBackend } from '@/lib/backendApi';
import { getEffectiveAccess } from '@/lib/ownerConfig';
import { Terminal, RefreshCw, Trash2, Download, Circle, Pause, Play, Filter, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const EVENT_COLORS = {
  info:    'text-sky-400',
  success: 'text-emerald-400',
  warn:    'text-yellow-400',
  error:   'text-destructive',
  ai:      'text-primary',
  upload:  'text-cyan-400',
  auth:    'text-purple-400',
  system:  'text-muted-foreground',
  ping:    'text-teal-400',
};

const EVENT_PREFIXES = {
  info:    '[ INFO ]',
  success: '[  OK  ]',
  warn:    '[ WARN ]',
  error:   '[ ERR  ]',
  ai:      '[  AI  ]',
  upload:  '[  UP  ]',
  auth:    '[ AUTH ]',
  system:  '[ SYS  ]',
  ping:    '[ PING ]',
};

let _globalConsoleLog = null;
export function consoleLog(type, msg, meta = {}) {
  _globalConsoleLog?.({ type, msg, meta, ts: new Date() });
}

function buildEventsFromLogs(logs) {
  return logs.map(l => ({
    id: l.id,
    type: l.status === 'failed' ? 'error' : l.command_type === 'custom' ? 'ai' : 'system',
    msg: l.prompt || l.project_name || l.command_type || '—',
    meta: { status: l.status, project: l.project_name, duration: l.duration_ms },
    ts: new Date(l.created_date),
  }));
}

export default function LiveConsole() {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [events, setEvents] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);
  const pausedRef = useRef(false);

  pausedRef.current = paused;

  const addEvent = useCallback((evt) => {
    if (pausedRef.current) return;
    setEvents(prev => [...prev.slice(-199), { ...evt, id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    _globalConsoleLog = addEvent;
    return () => { _globalConsoleLog = null; };
  }, [addEvent]);

  useEffect(() => {
    Promise.resolve(loadUser())
      .then(u => { setUser(u); setAccess(resolveUserAccess(u)); })
      .catch(() => {});

    async function loadInitial() {
      const logs = await base44.entities.BuildLog.list('-created_date', 50);
      const initial = buildEventsFromLogs(logs);
      setEvents(initial.reverse());
      setLoading(false);
    }
    loadInitial();

    // Poll for new logs every 10s
    const interval = setInterval(async () => {
      if (pausedRef.current) return;
      const ping = await pingBackend();
      addEvent({ type: 'ping', msg: ping.ok ? `Backend live — ${ping.latency_ms}ms` : 'Backend unreachable', ts: new Date() });
    }, 10000);

    return () => clearInterval(interval);
  }, [addEvent]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events, autoScroll]);

  function clearConsole() { setEvents([]); }

  function exportLogs() {
    const lines = events.map(e => `${format(e.ts, 'HH:mm:ss.SSS')} ${EVENT_PREFIXES[e.type] || '[-----]'} ${e.msg}`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `terrellos-console-${Date.now()}.log`; a.click();
    URL.revokeObjectURL(url);
  }

  if (access && !access.founder) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <div className="text-sm font-semibold">Super Admin access required.</div>
      </div>
    );
  }

  const FILTER_TYPES = ['all', 'error', 'warn', 'ai', 'upload', 'ping', 'system'];
  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  return (
    <div className="flex flex-col h-full p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-border flex items-center justify-center flex-shrink-0">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono">Live Console</h1>
            <div className="flex items-center gap-2">
              <Circle className={`w-2 h-2 ${paused ? 'fill-yellow-400 text-yellow-400' : 'fill-emerald-400 text-emerald-400'}`} />
              <span className="text-[10px] font-mono text-muted-foreground">{paused ? 'PAUSED' : 'LIVE'} · {filtered.length} EVENTS</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setPaused(v => !v)} className="font-mono text-xs">
            {paused ? <><Play className="w-3 h-3 mr-1" />Resume</> : <><Pause className="w-3 h-3 mr-1" />Pause</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={clearConsole} className="font-mono text-xs">
            <Trash2 className="w-3 h-3 mr-1" />Clear
          </Button>
          <Button size="sm" variant="ghost" onClick={exportLogs} className="font-mono text-xs">
            <Download className="w-3 h-3 mr-1" />Export
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {FILTER_TYPES.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase whitespace-nowrap transition-colors flex-shrink-0 ${filter === f ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground border border-border hover:border-border/60'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Terminal */}
      <div className="flex-1 rounded-xl bg-black/60 border border-border overflow-y-auto min-h-0 p-4 font-mono text-xs scrollbar-dark"
        style={{ minHeight: '400px', maxHeight: '70vh' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          setAutoScroll(el.scrollHeight - el.scrollTop <= el.clientHeight + 40);
        }}>
        {/* Boot header */}
        <div className="text-emerald-400 mb-3 leading-relaxed">
          <div>╔══════════════════════════════════════════════════════╗</div>
          <div>║  TERRELLOS v3.0.0 — LIVE CONSOLE — SUPER ADMIN       ║</div>
          <div>║  {format(new Date(), 'yyyy-MM-dd HH:mm:ss')} — PRODUCTION ENVIRONMENT     ║</div>
          <div>╚══════════════════════════════════════════════════════╝</div>
        </div>

        {loading && <div className="text-muted-foreground animate-pulse">Loading event history…</div>}

        {filtered.map((evt, i) => (
          <div key={evt.id || i} className="flex gap-3 py-0.5 hover:bg-white/3 rounded px-1 group">
            <span className="text-muted-foreground flex-shrink-0 select-none">{format(evt.ts, 'HH:mm:ss.SSS')}</span>
            <span className={`flex-shrink-0 ${EVENT_COLORS[evt.type] || 'text-muted-foreground'}`}>
              {EVENT_PREFIXES[evt.type] || '[-----]'}
            </span>
            <span className={`flex-1 break-all ${EVENT_COLORS[evt.type] || 'text-muted-foreground'}`}>{evt.msg}</span>
            {evt.meta?.duration && <span className="text-muted-foreground flex-shrink-0">{evt.meta.duration}ms</span>}
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-muted-foreground">No events{filter !== 'all' ? ` for filter: ${filter}` : ''}. System standing by…</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          className="mt-2 self-center text-xs text-primary font-mono hover:underline"
        >
          ↓ Scroll to latest
        </button>
      )}
    </div>
  );
}