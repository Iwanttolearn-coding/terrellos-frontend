import { useEffect, useState } from 'react';
import { sendBuildCommand } from '@/lib/backendApi';
import ReactMarkdown from 'react-markdown';
import {
  Plus, Wrench, Palette, Bug, FileCode2, Rocket, ScanSearch,
  Loader2, X, Check, AlertTriangle, Mic, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import ModelBadge from '@/components/ModelBadge';
import { getModelForTool } from '@/lib/modelResolver';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const ACTIONS = [
  { key: 'create_app', label: 'Create New App', icon: Plus, color: 'from-violet-600 to-purple-600', desc: 'Describe a new app to build from scratch' },
  { key: 'fix_app', label: 'Fix Existing App', icon: Wrench, color: 'from-blue-600 to-cyan-600', desc: 'Describe the issue to fix in your project' },
  { key: 'generate_ui', label: 'Generate UI', icon: Palette, color: 'from-pink-600 to-rose-600', desc: 'Describe a screen or component to generate' },
  { key: 'debug_error', label: 'Debug Error', icon: Bug, color: 'from-red-600 to-orange-600', desc: 'Paste an error or describe the bug' },
  { key: 'build_template', label: 'Build Template', icon: FileCode2, color: 'from-amber-600 to-yellow-600', desc: 'Select a template to scaffold' },
  { key: 'prepare_deployment', label: 'Prepare Deployment', icon: Rocket, color: 'from-emerald-600 to-teal-600', desc: 'Package and prepare your app for deployment' },
  { key: 'analyze_screenshot', label: 'Analyze Screenshot', icon: ScanSearch, color: 'from-indigo-600 to-violet-600', desc: 'Upload and analyze a UI screenshot' },
];

const DEBUG_SYSTEM_PROMPT = `You are TerrellOS AI Debug Engine. When given error logs, source code, or deployment problems, you MUST respond in this exact structure:

## Root Cause
[Precise explanation of what is broken and why]

## File to Change
\`\`\`
[exact file path]
\`\`\`

## Replacement Code
\`\`\`[language]
[exact code replacement — complete, not partial]
\`\`\`

## Test Steps
1. [step]
2. [step]
3. [step]

## Redeploy Checklist
- [ ] [item]
- [ ] [item]

Be direct, technical, and precise. No filler. No disclaimers.`;

export default function AIBuilder() {
  const [projects, setProjects] = useState([]);
  const [activeAction, setActiveAction] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(null);
  const [debugInput, setDebugInput] = useState('');
  const [debugResult, setDebugResult] = useState('');
  const [debugging, setDebugging] = useState(false);
  const [builderModel, setBuilderModel] = useState(null);
  const [debugModel, setDebugModel] = useState(null);
  const [toolBlocked, setToolBlocked] = useState({ ai_builder: false, error_debugger: false });

  useEffect(() => {
    async function load() {
      const [ps, conns, bm, dm] = await Promise.all([
        Promise.resolve([]),
        Promise.resolve([]),
        getModelForTool('ai_builder'),
        getModelForTool('error_debugger'),
      ]);
      setProjects(ps);
      setBackendAvailable(conns && conns.length > 0);
      setBuilderModel(bm);
      setDebugModel(dm);
      setToolBlocked({ ai_builder: !bm.is_active, error_debugger: !dm.is_active });
    }
    load();
  }, []);

  const handleDebug = async () => {
    if (!debugInput.trim() || toolBlocked.error_debugger) return;
    setDebugging(true);
    setDebugResult('');
    try {
      const res = await safeInvoke('chat', {
        message: debugInput.trim(),
        history: [{ role: 'system', content: DEBUG_SYSTEM_PROMPT }],
      });
      setDebugResult(res?.data?.reply || 'No response from AI.');
    } catch (err) {
      setDebugResult(`Error: ${err.message}`);
    }
    setDebugging(false);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || !activeAction) return;
    if (toolBlocked.ai_builder) return;
    setSubmitting(true);
    setLastResult(null);
    const proj = projects.find(p => p.id === selectedProject);
    const result = await sendBuildCommand(
      selectedProject || '',
      proj?.name || '',
      activeAction.key,
      prompt.trim()
    );
    setLastResult(result);

    // Auto-log a FileVersion changelog entry when AI Builder runs a command
    if (selectedProject && proj) {
      try {
        const prevVersions = await Promise.resolve([]);
        const nextVersion = (prevVersions.length > 0 ? Math.max(...prevVersions.map(v => v.version_number || 0)) : 0) + 1;
        // FileVersion changelog — entity removed, skipping
        void { changed_by: 'ai_builder', source: 'ai_builder', is_current: true };
      } catch (_) { /* non-critical */ }
    }

    setSubmitting(false);
    setPrompt('');
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-up">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-6">
        <PageHeader
          title="AI Builder"
          subtitle="Send build commands to your Python AI backend"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-mono">BUILDER MODEL</span>
          <ModelBadge toolKey="ai_builder" />
        </div>
      </div>

      {backendAvailable === false && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-yellow-300">Python backend connection required. <a href="/settings" className="underline">Configure in Settings →</a></span>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          const active = activeAction?.key === action.key;
          return (
            <button
              key={action.key}
              onClick={() => setActiveAction(active ? null : action)}
              className={`relative flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group
                ${active
                  ? 'border-primary/60 bg-primary/10 glow-purple'
                  : 'border-border bg-card hover:border-primary/30 hover:bg-secondary/50'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground leading-tight">{action.label}</div>
                <div className="text-xs text-muted-foreground mt-1 hidden sm:block">{action.desc}</div>
              </div>
              {active && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {/* Command form */}
      {activeAction && (
        <div className="card-glass rounded-2xl p-6 mb-6 animate-fade-up">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeAction.color} flex items-center justify-center`}>
              <activeAction.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{activeAction.label}</div>
              <div className="text-xs text-muted-foreground">{activeAction.desc}</div>
            </div>
            <button onClick={() => setActiveAction(null)} className="ml-auto text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-1">
              <label className="text-xs text-muted-foreground mb-1.5 block">Project (optional)</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="bg-secondary/50 border-border text-foreground">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>— No project —</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">Prompt / Instructions *</label>
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={`Describe what you want to ${activeAction.label.toLowerCase()}…`}
                  rows={4}
                  className="bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground resize-none pr-12"
                />
                <button className="absolute bottom-3 right-3 text-muted-foreground hover:text-primary transition-colors" title="Voice input (coming soon)" aria-label="Voice input placeholder">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {toolBlocked.ai_builder ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              AI Builder is disabled. Enable it in <a href="/ai-models" className="underline ml-1">AI Models →</a>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !prompt.trim()}
                className="gradient-purple-blue text-white font-semibold rounded-xl px-8 py-3 text-base"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                {submitting ? 'Sending to AI…' : 'Send Command'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Debug Engine */}
      <div className="card-glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground flex items-center gap-2">
              AI Debug Engine
              <ModelBadge toolKey="error_debugger" />
            </div>
            <div className="text-xs text-muted-foreground">Paste error logs, source code, or deployment problems — get root cause + fix</div>
          </div>
        </div>
        <Textarea
          value={debugInput}
          onChange={e => setDebugInput(e.target.value)}
          placeholder="Paste error logs, stack traces, source code, or describe the problem…"
          rows={6}
          className="bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground resize-none font-mono text-xs mb-3"
        />
        {toolBlocked.error_debugger ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Error Debugger is disabled. Enable it in <a href="/ai-models" className="underline ml-1">AI Models →</a>
          </div>
        ) : (
          <Button
            onClick={handleDebug}
            disabled={debugging || !debugInput.trim()}
            className="gradient-purple-blue text-white font-semibold rounded-xl px-6"
          >
            {debugging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bug className="w-4 h-4 mr-2" />}
            {debugging ? 'Analyzing…' : 'Analyze & Fix'}
          </Button>
        )}
        {debugResult && (
          <div className="mt-4 bg-secondary/40 rounded-xl p-4 border border-border prose prose-sm prose-invert max-w-none text-xs">
            <ReactMarkdown>{debugResult}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Result */}
      {lastResult && (
        <div className={`rounded-2xl border p-5 animate-fade-up ${lastResult.success ? 'border-emerald-500/30 bg-emerald-500/5' : lastResult.skipped ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            {lastResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
            <span className="text-sm font-semibold text-foreground">
              {lastResult.success ? 'Command sent successfully' : lastResult.skipped ? 'Logged — backend not connected' : 'Command failed'}
            </span>
            {lastResult.log && <StatusBadge status={lastResult.log.status} className="ml-auto" />}
          </div>
          {lastResult.message && <p className="text-sm text-muted-foreground">{lastResult.message}</p>}
          {lastResult.response && (
            <pre className="mt-3 text-xs bg-secondary/50 rounded-xl p-4 overflow-x-auto font-mono text-foreground">
              {JSON.stringify(lastResult.response, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}