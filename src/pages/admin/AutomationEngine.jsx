import { loadUser, resolveUserAccess } from '@/lib/resolveUserAccess';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getEffectiveAccess } from '@/lib/ownerConfig';
import { Cpu, Plus, Play, Pause, Trash2, Clock, Zap, Bell, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { notify } from '@/components/NotificationCenter';

const TRIGGER_TYPES = [
  { key: 'schedule',     label: 'Schedule',         icon: Clock,    desc: 'Run at a specific time or interval' },
  { key: 'user_inactive', label: 'User Inactive',   icon: Bell,     desc: 'Trigger after N days of inactivity' },
  { key: 'upload_done',  label: 'Upload Complete',  icon: Zap,      desc: 'When a file upload finishes' },
  { key: 'memory_added', label: 'Memory Added',     icon: Zap,      desc: 'When a new memory is created' },
  { key: 'ai_failed',    label: 'AI Request Failed', icon: AlertCircle, desc: 'When backend AI call fails' },
];

const ACTION_TYPES = [
  { key: 'send_notification', label: 'Send Notification', desc: 'Push/email notification to user' },
  { key: 'generate_devotional', label: 'Generate Devotional', desc: 'AI-create a new devotional' },
  { key: 'bible_reminder',  label: 'Bible Study Reminder', desc: 'Schedule a Bible study prompt' },
  { key: 'memory_reflection', label: 'Memory Reflection', desc: 'AI reflection on stored memories' },
  { key: 'admin_alert',    label: 'Admin Alert',   desc: 'Notify founder via email/console' },
  { key: 'log_event',      label: 'Log Event',     desc: 'Write to build log database' },
];

const DEFAULT_WORKFLOWS = [
  { id: 'wf_1', name: '7-Day Inactivity Reminder', trigger: 'user_inactive', action: 'bible_reminder', enabled: true, interval: '7 days', lastRun: null, runCount: 0 },
  { id: 'wf_2', name: 'Memory Anniversary Alert',  trigger: 'schedule',      action: 'memory_reflection', enabled: false, interval: '1 year', lastRun: null, runCount: 0 },
  { id: 'wf_3', name: 'AI Failure Admin Alert',    trigger: 'ai_failed',     action: 'admin_alert', enabled: true, interval: 'instant', lastRun: null, runCount: 0 },
  { id: 'wf_4', name: 'Weekly Bible Study Prompt', trigger: 'schedule',      action: 'generate_devotional', enabled: false, interval: '7 days', lastRun: null, runCount: 0 },
];

function WorkflowCard({ wf, onToggle, onDelete, onRun }) {
  const trigger = TRIGGER_TYPES.find(t => t.key === wf.trigger);
  const action = ACTION_TYPES.find(a => a.key === wf.action);
  const TriggerIcon = trigger?.icon || Clock;

  return (
    <div className={`card-glass rounded-2xl p-4 transition-all ${wf.enabled ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <TriggerIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{wf.name}</div>
            <div className="text-xs text-muted-foreground">{wf.interval}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={() => onRun(wf)} className="h-7 px-2 text-xs">
            <Play className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onToggle(wf.id)} className="h-7 px-2 text-xs">
            {wf.enabled ? <Pause className="w-3 h-3 text-yellow-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(wf.id)} className="h-7 px-2 text-xs hover:text-destructive">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Trigger → Action chain */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-secondary border border-border text-muted-foreground font-mono">{trigger?.label || wf.trigger}</span>
        <span className="text-muted-foreground">→</span>
        <span className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary font-mono">{action?.label || wf.action}</span>
        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${wf.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'} border ${wf.enabled ? 'border-emerald-500/25' : 'border-border'}`}>
          {wf.enabled ? 'ACTIVE' : 'PAUSED'}
        </span>
      </div>

      {wf.runCount > 0 && (
        <div className="mt-2 text-[10px] text-muted-foreground font-mono">
          {wf.runCount} run{wf.runCount !== 1 ? 's' : ''}{wf.lastRun ? ` · last: ${formatDistanceToNow(new Date(wf.lastRun), { addSuffix: true })}` : ''}
        </div>
      )}
    </div>
  );
}

export default function AutomationEngine() {
  const [access, setAccess] = useState(null);
  const [workflows, setWorkflows] = useState(DEFAULT_WORKFLOWS);
  const [showNew, setShowNew] = useState(false);
  const [newWf, setNewWf] = useState({ name: '', trigger: 'schedule', action: 'send_notification', interval: '1 day' });

  useEffect(() => {
    Promise.resolve(loadUser()).then(u => setAccess(resolveUserAccess(u))).catch(() => {});
  }, []);

  function toggleWf(id) {
    setWorkflows(p => p.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  }

  function deleteWf(id) {
    setWorkflows(p => p.filter(w => w.id !== id));
    notify.info('Workflow removed.');
  }

  async function runWf(wf) {
    // Log the manual run
    await base44.entities.BuildLog.create({
      command_type: 'custom',
      status: 'success',
      project_name: `automation:${wf.id}`,
      prompt: `Manual run: ${wf.name}`,
      metadata: { trigger: wf.trigger, action: wf.action },
    }).catch(() => null);
    setWorkflows(p => p.map(w => w.id === wf.id ? { ...w, runCount: w.runCount + 1, lastRun: new Date().toISOString() } : w));
    notify.success(`Workflow "${wf.name}" triggered.`);
  }

  function addWorkflow() {
    if (!newWf.name.trim()) return;
    const wf = { ...newWf, id: `wf_${Date.now()}`, enabled: true, lastRun: null, runCount: 0 };
    setWorkflows(p => [...p, wf]);
    setNewWf({ name: '', trigger: 'schedule', action: 'send_notification', interval: '1 day' });
    setShowNew(false);
    notify.success('Workflow created.');
  }

  if (access && !access.founder) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <div className="text-sm font-semibold">Super Admin access required.</div>
      </div>
    );
  }

  const active = workflows.filter(w => w.enabled).length;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-800 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Automation Engine</h1>
            <div className="text-xs text-muted-foreground">{active} active · {workflows.length} total workflows</div>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowNew(v => !v)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> New Workflow
        </Button>
      </div>

      {/* New workflow form */}
      {showNew && (
        <div className="card-glass rounded-2xl p-5 mb-5 space-y-3">
          <Input placeholder="Workflow name…" value={newWf.name} onChange={e => setNewWf(p => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Trigger</label>
              <select className="w-full bg-input border border-input rounded-md px-3 py-2 text-sm text-foreground"
                value={newWf.trigger} onChange={e => setNewWf(p => ({ ...p, trigger: e.target.value }))}>
                {TRIGGER_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block mb-1.5">Action</label>
              <select className="w-full bg-input border border-input rounded-md px-3 py-2 text-sm text-foreground"
                value={newWf.action} onChange={e => setNewWf(p => ({ ...p, action: e.target.value }))}>
                {ACTION_TYPES.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
          </div>
          <Input placeholder="Interval (e.g. 7 days, 1 hour, instant)" value={newWf.interval} onChange={e => setNewWf(p => ({ ...p, interval: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={addWorkflow} disabled={!newWf.name.trim()} className="flex-1">Create Workflow</Button>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Workflow list */}
      <div className="space-y-3">
        {workflows.map(wf => (
          <WorkflowCard key={wf.id} wf={wf} onToggle={toggleWf} onDelete={deleteWf} onRun={runWf} />
        ))}
      </div>

      {/* Architecture note */}
      <div className="mt-5 p-3 rounded-xl border border-border bg-secondary/20 text-xs text-muted-foreground">
        <div className="font-mono text-foreground mb-1">Architecture Status</div>
        Workflow engine UI is production-ready. To persist workflows and execute real backend jobs, deploy
        <code className="font-mono bg-muted px-1 mx-1 rounded">/automation/workflows</code>
        on your Fly.io FastAPI backend and connect via API Manager.
      </div>
    </div>
  );
}