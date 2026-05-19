import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import {
  RefreshCw, Maximize2, Minimize2, ExternalLink, Cpu, CheckCircle2,
  XCircle, Loader2, ChevronRight, Code2, Globe, Zap, Activity,
  Play, Square, RotateCcw, Terminal, FileCode, Eye, EyeOff, Beaker
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

// ── Simulated log entries that scroll in ──────────────────────────────────────
const BOOT_SEQUENCE = [
  { ms: 0,    type: 'info',    msg: 'Initializing TerrellOS sandbox runtime…' },
  { ms: 300,  type: 'info',    msg: 'Loading environment variables' },
  { ms: 600,  type: 'success', msg: '✓ SUPABASE_URL resolved' },
  { ms: 900,  type: 'success', msg: '✓ OPENAI_API_KEY resolved' },
  { ms: 1200, type: 'info',    msg: 'Mounting React application…' },
  { ms: 1600, type: 'info',    msg: 'Compiling entry point: main.jsx' },
  { ms: 2000, type: 'success', msg: '✓ Vite HMR connected' },
  { ms: 2400, type: 'info',    msg: 'Running Tailwind JIT scan…' },
  { ms: 2800, type: 'success', msg: '✓ 1,847 utility classes compiled' },
  { ms: 3200, type: 'info',    msg: 'Hydrating route tree…' },
  { ms: 3600, type: 'success', msg: '✓ 42 routes registered' },
  { ms: 4000, type: 'success', msg: '✓ AuthProvider mounted' },
  { ms: 4400, type: 'success', msg: '✓ SupabaseContext initialized' },
  { ms: 4800, type: 'info',    msg: 'Checking backend connectivity…' },
  { ms: 5300, type: 'success', msg: '✓ Supabase ping: 28ms' },
  { ms: 5800, type: 'ready',   msg: '🚀 Sandbox ready — live preview active' },
];

// ── File change ticker ────────────────────────────────────────────────────────
const MOCK_FILE_CHANGES = [
  'pages/Dashboard.jsx',
  'components/Layout.jsx',
  'pages/tools/AIBuilderTool.jsx',
  'lib/supabaseData.js',
  'functions/supabaseProfile',
  'pages/LiveSandbox.jsx',
  'components/TopBarIdentity.jsx',
];

function LogLine({ entry }) {
  const colors = {
    info:    'text-muted-foreground',
    success: 'text-emerald-400',
    error:   'text-destructive',
    ready:   'text-primary font-semibold',
    hmr:     'text-cyan-400',
    change:  'text-yellow-400',
  };
  const prefixes = {
    info:    '›',
    success: '✓',
    error:   '✗',
    ready:   '◈',
    hmr:     '⚡',
    change:  '~',
  };
  return (
    <div className={cn('flex gap-2 text-[11px] font-mono leading-5', colors[entry.type] || 'text-muted-foreground')}>
      <span className="w-4 text-right flex-shrink-0 opacity-60">{prefixes[entry.type] || '›'}</span>
      <span className="flex-1">{entry.msg}</span>
      {entry.time && <span className="text-muted-foreground/40 flex-shrink-0">{entry.time}</span>}
    </div>
  );
}

function StatusDot({ status }) {
  return (
    <span className={cn(
      'w-2 h-2 rounded-full flex-shrink-0',
      status === 'ready'   && 'bg-emerald-400 animate-pulse',
      status === 'building'&& 'bg-yellow-400 animate-pulse',
      status === 'error'   && 'bg-destructive',
      status === 'idle'    && 'bg-muted-foreground',
    )} />
  );
}

export default function LiveSandbox() {
  const [logs, setLogs] = useState([]);
  const [sandboxStatus, setSandboxStatus] = useState('building'); // building | ready | error | idle
  const [showLogs, setShowLogs] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [recentBuilds, setRecentBuilds] = useState([]);
  const [fileChanges, setFileChanges] = useState([]);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testFilter, setTestFilter] = useState('all'); // all | passed | failed
  const logsEndRef = useRef(null);
  const fileTickerRef = useRef(null);
  const changeIndexRef = useRef(0);

  // ── Boot sequence ────────────────────────────────────────────────────────────
  useEffect(() => {
    const timers = BOOT_SEQUENCE.map(({ ms, type, msg }) =>
      setTimeout(() => {
        setLogs(prev => [...prev, { id: Date.now() + ms, type, msg, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);
        if (type === 'ready') setSandboxStatus('ready');
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Simulated HMR file-change ticks ─────────────────────────────────────────
  useEffect(() => {
    fileTickerRef.current = setInterval(() => {
      const file = MOCK_FILE_CHANGES[changeIndexRef.current % MOCK_FILE_CHANGES.length];
      changeIndexRef.current++;
      const entry = { id: Date.now(), type: 'hmr', msg: `HMR update: ${file}`, time: new Date().toLocaleTimeString('en-US', { hour12: false }) };
      setLogs(prev => [...prev.slice(-80), entry]); // keep last 80 lines
      setFileChanges(prev => [{ file, at: new Date() }, ...prev.slice(0, 4)]);
    }, 8000);
    return () => clearInterval(fileTickerRef.current);
  }, []);

  // ── Load recent build logs ───────────────────────────────────────────────────
  useEffect(() => {
    base44.entities.BuildLog.list('-created_date', 6)
      .then(setRecentBuilds)
      .catch(() => {});
  }, []);

  // ── Auto-scroll logs ─────────────────────────────────────────────────────────
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function reload() {
    setSandboxStatus('building');
    setIframeLoaded(false);
    setLogs([]);
    setIframeKey(k => k + 1);
    // replay boot
    BOOT_SEQUENCE.forEach(({ ms, type, msg }) =>
      setTimeout(() => {
        setLogs(prev => [...prev, { id: Date.now() + ms, type, msg, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }]);
        if (type === 'ready') setSandboxStatus('ready');
      }, ms)
    );
  }

  async function runTests() {
    setTestLoading(true);
    try {
      const res = await safeInvoke('runTests', { testType: 'unit' });
      setTestResults(res.data);
      const entry = { id: Date.now(), type: 'success', msg: `✓ ${res.data.passed} passed, ${res.data.failed} failed (${res.data.duration}ms)`, time: new Date().toLocaleTimeString('en-US', { hour12: false }) };
      setLogs(prev => [...prev, entry]);
    } catch (err) {
      const entry = { id: Date.now(), type: 'error', msg: `✗ Test run failed: ${err.message}`, time: new Date().toLocaleTimeString('en-US', { hour12: false }) };
      setLogs(prev => [...prev, entry]);
    }
    setTestLoading(false);
  }

  const displayedTests = testResults ? testResults.results.flatMap(suite =>
    suite.tests
      .filter(t => testFilter === 'all' || (testFilter === 'passed' ? t.passed : !t.passed))
      .map(t => ({ ...t, suite: suite.name }))
  ) : [];

  const statusLabel = {
    building: 'Building…',
    ready:    'Live',
    error:    'Error',
    idle:     'Idle',
  }[sandboxStatus];

  return (
    <div className={cn('flex flex-col bg-background', fullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-65px)]')}>

      {/* ── Top bar ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/60 backdrop-blur-sm flex-shrink-0">
        {/* Status */}
        <div className="flex items-center gap-2">
          <StatusDot status={sandboxStatus} />
          <span className={cn(
            'text-xs font-mono font-semibold',
            sandboxStatus === 'ready' && 'text-emerald-400',
            sandboxStatus === 'building' && 'text-yellow-400',
            sandboxStatus === 'error' && 'text-destructive',
          )}>{statusLabel}</span>
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 max-w-lg">
          <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground font-mono truncate">sandbox://terrellos.app/live-preview</span>
          {sandboxStatus === 'ready' && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />}
          {sandboxStatus === 'building' && <Loader2 className="w-3 h-3 text-yellow-400 ml-auto animate-spin flex-shrink-0" />}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button size="sm" variant={testResults ? 'outline' : 'secondary'} className="h-7 gap-1.5 text-xs px-2" onClick={runTests} disabled={testLoading}>
            {testLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Beaker className="w-3 h-3" />}
            Tests
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={reload} title="Reload sandbox">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowLogs(v => !v)} title="Toggle console">
            <Terminal className={cn('w-3.5 h-3.5', showLogs && 'text-primary')} />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setFullscreen(v => !v)} title="Fullscreen">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Preview iframe */}
        <div className="flex-1 relative min-w-0 bg-[#0d0d14]">
          {/* Building overlay */}
          {sandboxStatus === 'building' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-2xl gradient-purple-blue flex items-center justify-center glow-purple">
                <Cpu className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div className="text-sm font-semibold text-foreground">Compiling sandbox…</div>
              <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full gradient-purple-blue rounded-full animate-[progress_5s_ease-in-out_forwards]" style={{ width: '100%', animationFillMode: 'forwards' }} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">{logs[logs.length - 1]?.msg || 'Starting…'}</p>
            </div>
          )}

          {/* Iframe loading shimmer */}
          {sandboxStatus === 'ready' && !iframeLoaded && (
            <div className="absolute inset-0 z-10 bg-background animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}

          <iframe
            key={iframeKey}
            src="/"
            className="w-full h-full border-0"
            title="Live Sandbox Preview"
            onLoad={() => setIframeLoaded(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />

          {/* Live badge */}
          {sandboxStatus === 'ready' && iframeLoaded && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </div>
          )}
        </div>

        {/* ── Right panel: console + file changes ─────────────────────────────── */}
        {showLogs && (
          <div className="w-80 flex-shrink-0 flex flex-col border-l border-border bg-[#080b12] overflow-hidden">

            {/* Console header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/30">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Build Console</span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">{logs.length} lines</span>
            </div>

            {/* Log stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-dark min-h-0">
              {logs.map(entry => <LogLine key={entry.id} entry={entry} />)}
              <div ref={logsEndRef} />
            </div>

            {/* File changes */}
            {fileChanges.length > 0 && (
              <div className="border-t border-border px-3 py-2 space-y-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileCode className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">HMR Updates</span>
                </div>
                {fileChanges.map((fc, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                    <span className="text-yellow-300/80 truncate flex-1">{fc.file}</span>
                    <span className="text-muted-foreground/50 flex-shrink-0">{formatDistanceToNow(fc.at, { addSuffix: false })}s ago</span>
                  </div>
                ))}
              </div>
            )}

            {/* Test Results */}
            {testResults && (
              <div className="border-t border-border px-3 py-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 mb-1.5 justify-between">
                  <div className="flex items-center gap-1.5">
                    <Beaker className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Test Results</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono">
                    <button onClick={() => setTestFilter('all')} className={cn('px-1.5 py-0.5 rounded', testFilter === 'all' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}>All</button>
                    <button onClick={() => setTestFilter('passed')} className={cn('px-1.5 py-0.5 rounded', testFilter === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-muted-foreground hover:text-foreground')}>✓</button>
                    <button onClick={() => setTestFilter('failed')} className={cn('px-1.5 py-0.5 rounded', testFilter === 'failed' ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground hover:text-foreground')}>✗</button>
                  </div>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {displayedTests.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] font-mono leading-4">
                      <span className={cn('w-3 h-3 rounded flex-shrink-0 mt-0.5', t.passed ? 'bg-emerald-400' : 'bg-destructive')} />
                      <span className={cn('flex-1 truncate', t.passed ? 'text-muted-foreground' : 'text-destructive')}>
                        {t.name}
                        {t.error && <span className="text-destructive/70 block text-[9px]">→ {t.error}</span>}
                      </span>
                      <span className="text-muted-foreground/40 flex-shrink-0">{t.duration}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent builds */}
            {recentBuilds.length > 0 && (
              <div className="border-t border-border px-3 py-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Activity className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Recent Builds</span>
                </div>
                <div className="space-y-1">
                  {recentBuilds.slice(0, 4).map(log => (
                    <div key={log.id} className="flex items-center gap-2 text-[10px] font-mono">
                      {log.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        : log.status === 'failed' ? <XCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                        : <Loader2 className="w-3 h-3 text-yellow-400 animate-spin flex-shrink-0" />}
                      <span className="text-muted-foreground truncate flex-1">{(log.command_type || '').replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground/40 flex-shrink-0">
                        {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: false }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom status bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-t border-border bg-card/40 text-[10px] font-mono text-muted-foreground flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-primary" /> TerrellOS Sandbox
        </span>
        <span className="flex items-center gap-1.5">
          <Code2 className="w-3 h-3" /> Vite 5 · React 18 · HMR
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> {logs.length} events
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <StatusDot status={sandboxStatus} />
          {statusLabel}
        </span>
      </div>
    </div>
  );
}