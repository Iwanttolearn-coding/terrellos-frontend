import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { sendBuildCommand } from '@/lib/backendApi';
import {
  Plus, Wrench, Palette, Bug, FileCode2, Rocket, ScanSearch,
  Loader2, X, Check, AlertTriangle, Mic, ChevronDown, Eye, Copy, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const ACTIONS = [
  { key: 'create_app', label: 'Create New App', icon: Plus, color: 'from-violet-600 to-purple-600', desc: 'Describe a new app to build from scratch' },
  { key: 'fix_app', label: 'Fix Existing App', icon: Wrench, color: 'from-blue-600 to-cyan-600', desc: 'Describe the issue to fix in your project' },
  { key: 'generate_ui', label: 'Generate UI', icon: Palette, color: 'from-pink-600 to-rose-600', desc: 'Describe a screen or component to generate' },
  { key: 'debug_error', label: 'Debug Error', icon: Bug, color: 'from-red-600 to-orange-600', desc: 'Paste an error or describe the bug' },
];

function CodePreview({ code, language = 'jsx' }) {
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Code viewer */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between bg-secondary/50 border border-border rounded-t-lg px-3 py-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{language}</span>
          <button
            onClick={copyCode}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {copied ? '✓ Copied' : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
        <pre className="flex-1 overflow-auto bg-secondary/40 border border-t-0 border-border rounded-b-lg px-4 py-3 text-xs font-mono text-foreground leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>

      {/* Live component preview */}
      <div className="flex flex-col border border-border rounded-xl bg-background/50">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
          <Eye className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Live Preview</span>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center">
          <div
            ref={previewRef}
            className="w-full h-full"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `
                <div id="preview-root"></div>
                <script type="module">
                  try {
                    const code = ${JSON.stringify(code)};
                    const ReactElement = eval(\`(async () => {\`;
                    // Safely eval the component code
                    eval(code);
                  } catch (e) {
                    console.error('Preview error:', e);
                  }
                </script>
              `
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AIBuilderSplit() {
  const [projects, setProjects] = useState([]);
  const [activeAction, setActiveAction] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(null);

  useEffect(() => {
    async function load() {
      const [ps, conns] = await Promise.all([
        base44.entities.Project.filter({ status: 'active' }),
        base44.entities.BackendConnection.filter({ is_active: true }),
      ]);
      setProjects(ps);
      setBackendAvailable(conns && conns.length > 0);
    }
    load();
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || !activeAction) return;
    setSubmitting(true);
    setGeneratedCode('');
    setLastResult(null);
    setStreaming(true);

    const proj = projects.find(p => p.id === selectedProject);

    // Real backend call — no demo simulation
    const result = await sendBuildCommand(
      selectedProject || '',
      proj?.name || '',
      activeAction.key,
      prompt.trim()
    );

    setLastResult(result);
    setSubmitting(false);
    setStreaming(false);
    setPrompt('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <PageHeader
          title="AI Builder — Split View"
          subtitle="Generate code and see live preview side-by-side"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 gap-4 p-4">

        {/* ── Left: Builder & Chat ─────────────────────────────────────────────── */}
        <div className={cn('flex flex-col gap-4', generatedCode ? 'w-1/2' : 'w-full')}>

          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ACTIONS.map(action => {
              const Icon = action.icon;
              const active = activeAction?.key === action.key;
              return (
                <button
                  key={action.key}
                  onClick={() => setActiveAction(active ? null : action)}
                  className={`flex flex-col items-start gap-2 p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer text-sm
                    ${active
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-secondary/50'}`}
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="font-semibold text-foreground text-xs leading-tight">{action.label}</div>
                </button>
              );
            })}
          </div>

          {/* Command form */}
          {activeAction && (
            <div className="card-glass rounded-xl p-4 animate-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${activeAction.color} flex items-center justify-center`}>
                  <activeAction.icon className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{activeAction.label}</div>
                  <div className="text-xs text-muted-foreground">{activeAction.desc}</div>
                </div>
                <button onClick={() => setActiveAction(null)} className="ml-auto text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Project (optional)</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="bg-secondary/50 border-border text-foreground text-xs h-8">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>— No project —</SelectItem>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Describe what to build *</label>
                  <Textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={`Describe what you want to ${activeAction.label.toLowerCase()}…`}
                    rows={3}
                    className="bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground resize-none text-xs"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !prompt.trim() || streaming}
                className="w-full gap-2 text-xs h-8"
              >
                {streaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                {streaming ? 'Generating…' : 'Generate Code'}
              </Button>
            </div>
          )}

          {/* Result */}
          {lastResult && (
            <div className={`rounded-lg border p-3 text-xs animate-fade-up ${lastResult.success ? 'border-emerald-500/30 bg-emerald-500/5' : lastResult.skipped ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <div className="flex items-center gap-2 mb-1">
                {lastResult.success ? <Check className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-yellow-400" />}
                <span className="font-semibold text-foreground">
                  {lastResult.success ? 'Success' : lastResult.skipped ? 'Logged' : 'Failed'}
                </span>
              </div>
              {lastResult.message && <p className="text-muted-foreground">{lastResult.message}</p>}
            </div>
          )}
        </div>

        {/* ── Right: Code Preview ────────────────────────────────────────────────── */}
        {generatedCode && (
          <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
            <div className="flex-1 flex flex-col card-glass rounded-xl overflow-hidden">
              <CodePreview code={generatedCode} language="jsx" />
            </div>
            <Button
              onClick={() => setGeneratedCode('')}
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs h-8"
            >
              <X className="w-3 h-3" /> Close Preview
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}