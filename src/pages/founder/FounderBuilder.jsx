import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { isOwnerEmail } from '@/lib/ownerConfig';
import {
  RefreshCw, ExternalLink, Terminal, CheckCircle, XCircle, AlertTriangle,
  Activity, Zap, Wrench, Play, Globe, Database, Clock, ChevronRight,
  Send, Code2, Loader2, ShieldCheck, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const FOUNDER_EMAILS = ['millzterrell210@icloud.com', 'millsterrell5@gmail.com'];
const LIVE_APP_URL = 'https://app.tm-dezigns.org';
const BACKEND_URL = 'https://terrellos-backend.onrender.com';

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const map = {
    pass: 'bg-emerald-400', ok: 'bg-emerald-400', connected: 'bg-emerald-400',
    warn: 'bg-yellow-400', degraded: 'bg-yellow-400',
    fail: 'bg-destructive', error: 'bg-destructive', disconnected: 'bg-destructive',
    loading: 'bg-muted-foreground animate-pulse',
  };
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${map[status] || 'bg-muted-foreground'}`} />;
}

function Badge({ label, value, status, icon: Icon }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/40 border border-border text-xs font-mono">
      {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
      <StatusDot status={status} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground font-semibold">{value}</span>
    </div>
  );
}

// ── Chat Bubble ───────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 border border-border text-foreground'}`}>
        {isUser ? (
          <p className="leading-relaxed">{msg.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

// ── Log Row ───────────────────────────────────────────────────────────────────
function LogRow({ log }) {
  const Icon = log.status === 'success' ? CheckCircle : log.status === 'failed' ? XCircle : Activity;
  const color = log.status === 'success' ? 'text-emerald-400' : log.status === 'failed' ? 'text-destructive' : 'text-yellow-400';
  return (
    <div className="flex items-start gap-2 px-3 py-2 border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-foreground truncate">{(log.command_type || '').replace(/_/g, ' ')}</div>
        {log.project_name && <div className="text-[10px] font-mono text-muted-foreground">{log.project_name}</div>}
        {log.error_message && <div className="text-[10px] text-destructive truncate">{log.error_message}</div>}
      </div>
      <div className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
        {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : ''}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FounderBuilder() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewRoute, setPreviewRoute] = useState('/');

  // Status state
  const [backendStatus, setBackendStatus] = useState('loading');
  const [dbStatus, setDbStatus] = useState('loading');
  const [lastDeployment, setLastDeployment] = useState(null);
  const [buildLogs, setBuildLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'TerrellOS AI ready. Ask me to build, fix, or explain anything.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Build command state
  const [buildCmd, setBuildCmd] = useState('');
  const [buildOutput, setBuildOutput] = useState('');
  const [buildRunning, setBuildRunning] = useState(false);

  // Diag state
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagSummary, setDiagSummary] = useState(null);
  const [repairRunning, setRepairRunning] = useState(false);

  useEffect(() => { init(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function init() {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    if (u && isOwnerEmail(u.email)) {
      await Promise.all([checkBackend(), loadLogs()]);
    }
    setLoading(false);
  }

  async function checkBackend() {
    try {
      const res = await safeInvoke('dbHealth', {});
      const data = res?.data;
      setBackendStatus(data?.summary?.startsWith('PASS') ? 'pass' : 'warn');
      const tablesFail = data?.tables ? Object.values(data.tables).some(t => t.status === 'FAIL') : false;
      setDbStatus(tablesFail ? 'fail' : 'pass');
      setLastDeployment(data?.timestamp || null);
    } catch {
      setBackendStatus('fail');
      setDbStatus('fail');
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    const rows = await base44.entities.BuildLog.list('-created_date', 25).catch(() => []);
    setBuildLogs(rows);
    setLogsLoading(false);
  }

  async function sendChat() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    const userMsg = { role: 'user', content: msg };
    const history = messages.filter(m => m.role !== 'system');
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await safeInvoke('chat', { message: msg, history });
      const reply = res?.data?.reply || res?.data?.message || '(no response)';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
    setChatLoading(false);
  }

  async function runBuildCmd() {
    const cmd = buildCmd.trim();
    if (!cmd || buildRunning) return;
    setBuildRunning(true);
    setBuildOutput('');
    try {
      await base44.entities.BuildLog.create({
        command_type: 'custom', status: 'running',
        prompt: cmd, project_name: 'TerrellOS',
      });
      const res = await safeInvoke('chat', {
        message: `You are a code generator. Output only code or structured instructions. Request: ${cmd}`,
        history: [],
      });
      const output = res?.data?.reply || '(no output)';
      setBuildOutput(output);
      await base44.entities.BuildLog.create({
        command_type: 'generate_ui', status: 'success',
        prompt: cmd, project_name: 'TerrellOS',
        backend_response: output.slice(0, 500),
      });
      await loadLogs();
    } catch (err) {
      setBuildOutput(`Error: ${err.message}`);
    }
    setBuildRunning(false);
  }

  async function runDiagnostics() {
    setDiagRunning(true);
    setDiagSummary(null);
    try {
      const res = await safeInvoke('dbHealth', {});
      const data = res?.data;
      const pass = data?.summary?.startsWith('PASS');
      const fail = data?.summary?.startsWith('CRITICAL');
      setDiagSummary({
        status: fail ? 'FAIL' : pass ? 'PASS' : 'WARN',
        summary: data?.summary || 'Unknown',
        latency: data?.latency,
        tables: data?.tables,
        env: data?.environment,
      });
    } catch (err) {
      setDiagSummary({ status: 'FAIL', summary: err.message });
    }
    setDiagRunning(false);
  }

  async function autoRepair() {
    setRepairRunning(true);
    try {
      const existing = await base44.entities.AIModelSetting.list().catch(() => []);
      const TOOLS = ['ai_builder','error_debugger','code_generator','supabase_architect','vercel_fixer','voice_assistant','app_builder','document_writer'];
      for (const key of TOOLS) {
        if (!existing.find(e => e.tool_key === key)) {
          await base44.entities.AIModelSetting.create({
            tool_key: key, tool_name: key.replace(/_/g, ' '),
            model: 'gpt-4.1', provider: 'openai', is_active: true,
          });
        }
      }
      await base44.entities.BuildLog.create({
        command_type: 'custom', status: 'success',
        prompt: `Auto-repair triggered by ${user?.email}`, project_name: 'TerrellOS',
      });
      await loadLogs();
    } catch {}
    setRepairRunning(false);
  }

  const ROUTES = ['/', '/dashboard', '/projects', '/ai-builder', '/tools', '/settings', '/founder'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-xs font-mono text-muted-foreground tracking-widest animate-pulse">LOADING…</p>
        </div>
      </div>
    );
  }

  if (!user || !isOwnerEmail(user.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center border border-destructive/30">
          <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Founder access only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/80 backdrop-blur flex-wrap flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg gradient-purple-blue flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold gradient-text">Founder Builder</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-2">
          <Badge label="Backend" value={backendStatus === 'pass' ? 'Online' : backendStatus === 'loading' ? '…' : 'Degraded'} status={backendStatus} icon={Server} />
          <Badge label="DB" value={dbStatus === 'pass' ? 'Connected' : dbStatus === 'loading' ? '…' : 'Error'} status={dbStatus} icon={Database} />
          <Badge label="Env" value="Production" status="pass" icon={Globe} />
          {lastDeployment && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <Clock className="w-3 h-3" />
              Last check: {formatDistanceToNow(new Date(lastDeployment), { addSuffix: true })}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={checkBackend} className="h-7 text-xs gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh Status
          </Button>
          <a href={LIVE_APP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="h-7 text-xs gap-1">
              <ExternalLink className="w-3 h-3" /> Open Live App
            </Button>
          </a>
        </div>
      </div>

      {/* ── Split Pane ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ════════════════════ LEFT: LIVE PREVIEW ════════════════════ */}
        <div className="flex flex-col w-1/2 border-r border-border overflow-hidden">
          {/* Preview toolbar */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card/60 flex-shrink-0">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={previewRoute}
              onChange={e => setPreviewRoute(e.target.value)}
              className="flex-1 bg-transparent text-xs font-mono text-foreground border-0 outline-none cursor-pointer"
            >
              {ROUTES.map(r => (
                <option key={r} value={r} className="bg-card text-foreground">{LIVE_APP_URL}{r}</option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={() => setPreviewKey(k => k + 1)} className="h-6 w-6 p-0">
              <RefreshCw className="w-3 h-3" />
            </Button>
            <a href={`${LIVE_APP_URL}${previewRoute}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </div>

          {/* iframe */}
          <div className="flex-1 relative">
            <iframe
              key={previewKey}
              src={`${LIVE_APP_URL}${previewRoute}`}
              className="w-full h-full border-0"
              title="Live App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>

        {/* ════════════════════ RIGHT: BUILDER ════════════════════ */}
        <div className="flex flex-col w-1/2 overflow-hidden">

          {/* Right tabs */}
          <RightPanel
            messages={messages} chatInput={chatInput} setChatInput={setChatInput}
            sendChat={sendChat} chatLoading={chatLoading} chatEndRef={chatEndRef}
            buildCmd={buildCmd} setBuildCmd={setBuildCmd}
            buildOutput={buildOutput} buildRunning={buildRunning} runBuildCmd={runBuildCmd}
            buildLogs={buildLogs} logsLoading={logsLoading} loadLogs={loadLogs}
            diagRunning={diagRunning} diagSummary={diagSummary} runDiagnostics={runDiagnostics}
            repairRunning={repairRunning} autoRepair={autoRepair}
            backendUrl={BACKEND_URL}
          />
        </div>

      </div>
    </div>
  );
}

// ── Right Panel Tabs ──────────────────────────────────────────────────────────
function RightPanel({
  messages, chatInput, setChatInput, sendChat, chatLoading, chatEndRef,
  buildCmd, setBuildCmd, buildOutput, buildRunning, runBuildCmd,
  buildLogs, logsLoading, loadLogs,
  diagRunning, diagSummary, runDiagnostics,
  repairRunning, autoRepair,
  backendUrl,
}) {
  const [tab, setTab] = useState('chat');
  const TABS = [
    { id: 'chat',  label: 'Chat AI' },
    { id: 'build', label: 'Build' },
    { id: 'logs',  label: 'Logs' },
    { id: 'diag',  label: 'Diagnostics' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-card/60 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-mono font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
        {/* Backend URL */}
        <div className="ml-auto flex items-center gap-1 px-3 text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
          <Server className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{backendUrl}</span>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">

        {/* ── CHAT TAB ── */}
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-dark">
              {messages.map((m, i) => <Bubble key={i} msg={m} />)}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-border p-2 flex gap-2 flex-shrink-0">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="Ask TerrellOS AI anything…"
                className="flex-1 bg-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-primary transition-colors"
              />
              <Button size="sm" onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="h-9 px-3">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── BUILD TAB ── */}
        {tab === 'build' && (
          <div className="flex flex-col h-full p-3 gap-3 overflow-y-auto scrollbar-dark">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1 block">AI Build Command</label>
              <textarea
                value={buildCmd}
                onChange={e => setBuildCmd(e.target.value)}
                placeholder="Describe what to build or generate…"
                rows={3}
                className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground border border-border outline-none focus:border-primary transition-colors resize-none font-mono"
              />
              <Button onClick={runBuildCmd} disabled={buildRunning || !buildCmd.trim()} className="mt-2 gap-2 w-full">
                {buildRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {buildRunning ? 'Generating…' : 'Run AI Build'}
              </Button>
            </div>
            {buildOutput && (
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1 block">Output</label>
                <div className="bg-secondary/30 rounded-xl p-3 border border-border max-h-80 overflow-y-auto scrollbar-dark">
                  <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-foreground [&>pre]:bg-secondary/60 [&>pre]:rounded-lg [&>pre]:p-3">
                    {buildOutput}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LOGS TAB ── */}
        {tab === 'logs' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                <Terminal className="w-3 h-3" /> Build Logs
              </span>
              <Button size="sm" variant="ghost" onClick={loadLogs} disabled={logsLoading} className="h-6 text-xs gap-1">
                <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-dark">
              {logsLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">Loading…</div>
              ) : buildLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No logs yet.</div>
              ) : (
                buildLogs.map(log => <LogRow key={log.id} log={log} />)
              )}
            </div>
          </div>
        )}

        {/* ── DIAGNOSTICS TAB ── */}
        {tab === 'diag' && (
          <div className="p-3 space-y-3 overflow-y-auto h-full scrollbar-dark">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={runDiagnostics} disabled={diagRunning} className="gap-2 flex-1">
                {diagRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {diagRunning ? 'Running…' : 'Run Diagnostics'}
              </Button>
              <Button onClick={autoRepair} disabled={repairRunning} variant="outline" className="gap-2 flex-1 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10">
                {repairRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                {repairRunning ? 'Repairing…' : 'Auto-Repair'}
              </Button>
            </div>

            {diagSummary && (
              <div className={`rounded-xl p-4 border ${
                diagSummary.status === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/30' :
                diagSummary.status === 'FAIL' ? 'bg-destructive/10 border-destructive/30' :
                'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {diagSummary.status === 'PASS' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                   diagSummary.status === 'FAIL' ? <XCircle className="w-4 h-4 text-destructive" /> :
                   <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                  <span className={`text-sm font-bold ${diagSummary.status === 'PASS' ? 'text-emerald-400' : diagSummary.status === 'FAIL' ? 'text-destructive' : 'text-yellow-400'}`}>
                    {diagSummary.status}
                  </span>
                  {diagSummary.latency && (
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">{diagSummary.latency}ms</span>
                  )}
                </div>
                <p className="text-xs font-mono text-foreground">{diagSummary.summary}</p>

                {diagSummary.tables && (
                  <div className="mt-3 space-y-1">
                    {Object.entries(diagSummary.tables).map(([name, t]) => (
                      <div key={name} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-muted-foreground">{name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t.latency}ms</span>
                          <span className={t.status === 'PASS' ? 'text-emerald-400' : t.status === 'WARN' ? 'text-yellow-400' : 'text-destructive'}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {diagSummary.env && (
                  <div className="mt-3 space-y-1 border-t border-border/40 pt-2">
                    {Object.entries(diagSummary.env).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-muted-foreground">{k}</span>
                        <span className={v ? 'text-emerald-400' : 'text-destructive'}>{v ? '✓' : '✗'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!diagSummary && !diagRunning && (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Press "Run Diagnostics" to check all systems.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}