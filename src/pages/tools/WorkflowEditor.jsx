import { useState, useRef, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { API_BASE_URL } from '@/lib/env';
import {
  GitBranch, Plus, Play, Trash2, Save, X, ChevronDown,
  Upload, Mic, Zap, Database, MessageSquare, Bell, ArrowRight, Settings, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';
import ModelBadge from '@/components/ModelBadge';
import { getModelForTool } from '@/lib/modelResolver';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Node type definitions ────────────────────────────────────────────────────
const NODE_TYPES = {
  trigger_upload:    { label: 'New Upload',          icon: Upload,       color: 'from-sky-600 to-blue-800',      category: 'trigger',  desc: 'Fires when a new file is uploaded' },
  trigger_schedule:  { label: 'Schedule',            icon: Zap,          color: 'from-violet-600 to-purple-800', category: 'trigger',  desc: 'Time-based trigger (cron)' },
  trigger_manual:    { label: 'Manual Trigger',      icon: Play,         color: 'from-emerald-600 to-green-800', category: 'trigger',  desc: 'Run workflow manually' },
  action_transcribe: { label: 'Transcribe Audio',    icon: Mic,          color: 'from-cyan-600 to-teal-800',     category: 'action',   desc: 'Send audio to transcription engine' },
  action_chat:       { label: 'AI Chat / Prompt',    icon: MessageSquare,color: 'from-fuchsia-600 to-purple-900',category: 'action',   desc: 'Send prompt to AI backend' },
  action_finetune:   { label: 'Fine-Tune Model',     icon: Database,     color: 'from-amber-600 to-orange-800',  category: 'action',   desc: 'Start a fine-tuning job' },
  action_save_db:    { label: 'Save to Database',    icon: Database,     color: 'from-slate-600 to-slate-800',   category: 'action',   desc: 'Persist data to entity store' },
  condition_filetype:{ label: 'Check File Type',     icon: GitBranch,    color: 'from-rose-600 to-red-800',      category: 'condition',desc: 'Branch on file MIME type' },
  action_notify:     { label: 'Send Notification',   icon: Bell,         color: 'from-yellow-600 to-amber-800',  category: 'action',   desc: 'Log or alert with a message' },
};

const CATEGORY_ORDER = ['trigger', 'condition', 'action'];
const CATEGORY_LABELS = { trigger: 'Triggers', condition: 'Conditions', action: 'Actions' };

const WORKFLOW_STORAGE = 'terrellos_workflows';
function loadWorkflows() { try { return JSON.parse(localStorage.getItem(WORKFLOW_STORAGE) || '[]'); } catch { return []; } }
function saveWorkflows(w) { try { localStorage.setItem(WORKFLOW_STORAGE, JSON.stringify(w)); } catch {} }

const DEFAULT_WORKFLOW = {
  id: 'wf_default',
  name: 'Audio → Transcribe',
  nodes: [
    { id: 'n1', type: 'trigger_upload', x: 60,  y: 120, config: { filter: 'audio' } },
    { id: 'n2', type: 'condition_filetype', x: 300, y: 120, config: { fileType: 'audio/*' } },
    { id: 'n3', type: 'action_transcribe', x: 540, y: 120, config: {} },
    { id: 'n4', type: 'action_notify', x: 540, y: 260, config: { message: 'Not an audio file — skipped.' } },
  ],
  edges: [
    { id: 'e1', from: 'n1', to: 'n2' },
    { id: 'e2', from: 'n2', to: 'n3', label: 'YES' },
    { id: 'e3', from: 'n2', to: 'n4', label: 'NO' },
  ],
};

// ── Small Node Card ──────────────────────────────────────────────────────────
function WorkflowNode({ node, selected, onSelect, onDelete, onDrag }) {
  const meta = NODE_TYPES[node.type];
  const Icon = meta?.icon || Zap;
  const dragStart = useRef(null);

  function handleMouseDown(e) {
    if (e.target.closest('button')) return;
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, nx: node.x, ny: node.y };
    function onMove(ev) {
      onDrag(node.id, dragStart.current.nx + ev.clientX - dragStart.current.mx, dragStart.current.ny + ev.clientY - dragStart.current.my);
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    onSelect(node.id);
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute select-none cursor-grab active:cursor-grabbing rounded-xl border-2 shadow-lg transition-shadow w-44 ${
        selected ? 'border-primary shadow-primary/30 shadow-xl' : 'border-border hover:border-primary/50'
      } bg-card`}
      style={{ left: node.x, top: node.y }}
    >
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-[10px] bg-gradient-to-r ${meta?.color || 'from-slate-600 to-slate-800'}`}>
        <Icon className="w-3.5 h-3.5 text-white flex-shrink-0" />
        <span className="text-xs font-semibold text-white truncate flex-1">{meta?.label}</span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(node.id); }}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="px-3 py-2">
        <div className="text-[10px] text-muted-foreground leading-relaxed">{meta?.desc}</div>
        {node.config && Object.keys(node.config).length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {Object.entries(node.config).map(([k, v]) => v ? (
              <div key={k} className="text-[9px] font-mono bg-secondary/60 rounded px-1.5 py-0.5 text-muted-foreground truncate">
                {k}: <span className="text-foreground">{String(v)}</span>
              </div>
            ) : null)}
          </div>
        )}
      </div>
      {/* Output port */}
      <div className="absolute right-[-7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background shadow" />
      {/* Input port */}
      <div className="absolute left-[-7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-border shadow" />
    </div>
  );
}

// ── SVG Edges ────────────────────────────────────────────────────────────────
function EdgeLayer({ nodes, edges }) {
  function getCenter(id) {
    const n = nodes.find(x => x.id === id);
    if (!n) return { x: 0, y: 0 };
    return { x: n.x + 176, y: n.y + 44 }; // right port
  }
  function getIn(id) {
    const n = nodes.find(x => x.id === id);
    if (!n) return { x: 0, y: 0 };
    return { x: n.x, y: n.y + 44 }; // left port
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="hsl(265 80% 60%)" />
        </marker>
      </defs>
      {edges.map(edge => {
        const from = getCenter(edge.from);
        const to = getIn(edge.to);
        const cx1 = from.x + 60, cy1 = from.y;
        const cx2 = to.x - 60, cy2 = to.y;
        return (
          <g key={edge.id}>
            <path
              d={`M${from.x},${from.y} C${cx1},${cy1} ${cx2},${cy2} ${to.x},${to.y}`}
              stroke="hsl(265 80% 60% / 0.6)"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrow)"
            />
            {edge.label && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 6}
                textAnchor="middle"
                className="fill-primary text-[10px] font-mono"
                fontSize="10"
                fill="hsl(265 80% 75%)"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Config Panel ─────────────────────────────────────────────────────────────
function ConfigPanel({ node, onChange, onClose }) {
  const meta = NODE_TYPES[node?.type];
  if (!node || !meta) return null;

  const configFields = {
    trigger_upload:    [{ key: 'filter', label: 'File filter', placeholder: 'e.g. audio, image' }],
    trigger_schedule:  [{ key: 'cron', label: 'Cron expression', placeholder: '0 * * * *' }],
    action_chat:       [{ key: 'prompt', label: 'Prompt template', placeholder: 'Summarize: {{input}}' }],
    condition_filetype:[{ key: 'fileType', label: 'MIME pattern', placeholder: 'audio/*' }],
    action_notify:     [{ key: 'message', label: 'Message', placeholder: 'Notification text' }],
  };

  const fields = configFields[node.type] || [];

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-card border border-border rounded-2xl p-4 shadow-2xl z-10 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{meta.label} Config</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      {fields.length === 0 ? (
        <div className="text-xs text-muted-foreground">No configuration needed.</div>
      ) : (
        <div className="space-y-2">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{f.label}</label>
              <Input
                value={node.config?.[f.key] || ''}
                onChange={e => onChange(node.id, { ...node.config, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="mt-1 h-8 text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Run Log ──────────────────────────────────────────────────────────────────
function RunLog({ runs }) {
  if (!runs.length) return null;
  return (
    <div className="absolute top-3 right-3 w-56 bg-card border border-border rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto scrollbar-dark">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-3 pt-2 pb-1 border-b border-border">Run Log</div>
      {runs.map((r, i) => (
        <div key={i} className="flex items-start gap-2 px-3 py-1.5 border-b border-border/40 last:border-0">
          {r.ok ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />}
          <span className="text-[10px] text-muted-foreground leading-tight">{r.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Editor ──────────────────────────────────────────────────────────────
export default function WorkflowEditor() {
  const [workflows, setWorkflows] = useState(() => {
    const saved = loadWorkflows();
    return saved.length ? saved : [{ ...DEFAULT_WORKFLOW }];
  });
  const [activeId, setActiveId] = useState(() => {
    const saved = loadWorkflows();
    return saved.length ? saved[0].id : 'wf_default';
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodePicker, setShowNodePicker] = useState(false);
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [modelInfo, setModelInfo] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => { getModelForTool('document_writer').then(setModelInfo); }, []);

  const workflow = workflows.find(w => w.id === activeId) || workflows[0];

  useEffect(() => { saveWorkflows(workflows); }, [workflows]);

  function updateWorkflow(patch) {
    setWorkflows(prev => prev.map(w => w.id === activeId ? { ...w, ...patch } : w));
  }

  function addNode(type) {
    const id = `n${Date.now()}`;
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.offsetWidth / 2 - 88 : 200;
    const cy = canvas ? canvas.offsetHeight / 2 - 44 : 150;
    updateWorkflow({ nodes: [...(workflow?.nodes || []), { id, type, x: cx, y: cy, config: {} }] });
    setShowNodePicker(false);
    setSelectedNode(id);
  }

  function dragNode(id, x, y) {
    updateWorkflow({ nodes: workflow.nodes.map(n => n.id === id ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n) });
  }

  function deleteNode(id) {
    updateWorkflow({
      nodes: workflow.nodes.filter(n => n.id !== id),
      edges: workflow.edges.filter(e => e.from !== id && e.to !== id),
    });
    if (selectedNode === id) setSelectedNode(null);
  }

  function updateNodeConfig(id, config) {
    updateWorkflow({ nodes: workflow.nodes.map(n => n.id === id ? { ...n, config } : n) });
  }

  function newWorkflow() {
    const id = `wf_${Date.now()}`;
    const w = { id, name: 'New Workflow', nodes: [], edges: [] };
    setWorkflows(prev => [...prev, w]);
    setActiveId(id);
    setSelectedNode(null);
  }

  async function runWorkflow() {
    setRunning(true);
    setRunLog([]);
    const log = (msg, ok = true) => setRunLog(prev => [...prev, { msg, ok }]);
    log('Workflow started…');

    try {
      const res = await fetch(`${API_BASE_URL}/workflow/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: { nodes: workflow.nodes, edges: workflow.edges } }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        (data.steps || []).forEach(s => log(s.message, s.ok !== false));
        log('Workflow completed ✓');
      } else if (res.status === 404) {
        simulateRun(log);
        return;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('404')) {
        simulateRun(log);
        return;
      }
      log(`Error: ${err.message}`, false);
    } finally {
      setRunning(false);
    }
  }

  function simulateRun(log) {
    const steps = workflow.nodes.map(n => NODE_TYPES[n.type]?.label || n.type);
    let i = 0;
    const iv = setInterval(() => {
      if (i < steps.length) {
        log(`▶ Executing: ${steps[i]}`);
        i++;
      } else {
        log('✓ Simulation complete (backend /workflow/run not installed)');
        clearInterval(iv);
        setRunning(false);
      }
    }, 500);
  }

  const selNode = workflow?.nodes.find(n => n.id === selectedNode);

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden">
      {/* Left: node palette */}
      <div className="w-52 flex-shrink-0 border-r border-border bg-card/50 flex flex-col overflow-hidden">
        <div className="px-3 pt-4 pb-2 border-b border-border">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Node Library</div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-dark py-2">
          {CATEGORY_ORDER.map(cat => (
            <div key={cat} className="mb-3">
              <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest px-3 pb-1">{CATEGORY_LABELS[cat]}</div>
              {Object.entries(NODE_TYPES)
                .filter(([, m]) => m.category === cat)
                .map(([type, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => addNode(type)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 transition-colors text-left group"
                    >
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">{meta.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/50 flex-shrink-0">
          {/* Workflow tabs */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-dark">
            {workflows.map(w => (
              <button
                key={w.id}
                onClick={() => { setActiveId(w.id); setSelectedNode(null); }}
                className={`flex-shrink-0 text-xs px-3 py-1 rounded-lg transition-colors ${
                  w.id === activeId ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {w.name}
              </button>
            ))}
            <button onClick={newWorkflow} className="flex-shrink-0 text-xs px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {modelInfo && !modelInfo.is_active && (
            <span className="flex items-center gap-1 text-xs text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 rounded-lg mr-1">
              <AlertTriangle className="w-3 h-3" /> Disabled — <a href="/ai-models" className="underline">AI Models</a>
            </span>
          )}
          <ModelBadge toolKey="document_writer" className="mr-1" />
          <Button
            size="sm"
            onClick={runWorkflow}
            disabled={running || !workflow?.nodes?.length || modelInfo?.is_active === false}
            className="flex-shrink-0 h-8"
          >
            {running ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
            {running ? 'Running…' : 'Run'}
          </Button>
        </div>

        {/* Canvas area */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{ background: 'radial-gradient(circle at 1px 1px, hsl(230 18% 18% / 0.4) 1px, transparent 0) 0 0 / 28px 28px' }}
          onClick={e => { if (e.target === canvasRef.current) setSelectedNode(null); }}
        >
          {workflow && (
            <>
              <EdgeLayer nodes={workflow.nodes} edges={workflow.edges} />
              {workflow.nodes.map(node => (
                <WorkflowNode
                  key={node.id}
                  node={node}
                  selected={selectedNode === node.id}
                  onSelect={setSelectedNode}
                  onDelete={deleteNode}
                  onDrag={dragNode}
                />
              ))}
            </>
          )}

          {/* Empty state */}
          {(!workflow?.nodes?.length) && (
            <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
              <div>
                <GitBranch className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                <div className="text-sm text-muted-foreground">Click a node from the library to add it</div>
                <div className="text-xs text-muted-foreground mt-1">Drag nodes to position · Click to configure</div>
              </div>
            </div>
          )}

          {/* Run log */}
          <RunLog runs={runLog} />

          {/* Config panel */}
          {selNode && (
            <ConfigPanel
              node={selNode}
              onChange={updateNodeConfig}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}