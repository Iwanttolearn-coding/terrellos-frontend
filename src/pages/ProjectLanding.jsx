import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Globe, Database, Wifi, WifiOff,
  ExternalLink, RefreshCw, AlertCircle, Edit2, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify } from '@/components/NotificationCenter';
import LivePreviewPanel from '@/components/project/LivePreviewPanel';

const STATUS_COLORS = {
  active:      'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  building:    'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  planned:     'text-slate-400 border-slate-400/30 bg-slate-400/10',
  error:       'text-red-400 border-red-400/30 bg-red-400/10',
  connected:   'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  disconnected:'text-red-400 border-red-400/30 bg-red-400/10',
  pending:     'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  unknown:     'text-slate-400 border-slate-400/30 bg-slate-400/10',
};

function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  return <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${cls} uppercase`}>{status}</span>;
}

function ConnectPrompt({ label }) {
  return (
    <span className="text-xs text-yellow-400 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> {label}
    </span>
  );
}

export default function ProjectLanding() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tools, setTools] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tools');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { loadAll(); }, [projectId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [p, t, i] = await Promise.all([
        base44.entities.Project.filter({ id: projectId }),
        base44.entities.ProjectTool.filter({ project_id: projectId }),
        base44.entities.ProjectIntegration.filter({ project_id: projectId }),
      ]);
      setProject(p[0] || null);
      setTools(t.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setIntegrations(i);
    } catch {
      notify.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  async function saveField(field) {
    try {
      await base44.entities.Project.update(projectId, { [field]: editValue });
      setProject(p => ({ ...p, [field]: editValue }));
      setEditingField(null);
      notify.success('Saved');
    } catch {
      notify.error('Save failed');
    }
  }

  async function testBackend() {
    if (!project?.backend_url) return notify.warn('No backend URL set');
    try {
      const res = await fetch(project.backend_url + '/health');
      const status = res.ok ? 'connected' : 'disconnected';
      await base44.entities.Project.update(projectId, { backend_status: status });
      setProject(p => ({ ...p, backend_status: status }));
      notify.success(`Backend: ${status}`);
    } catch {
      await base44.entities.Project.update(projectId, { backend_status: 'disconnected' });
      setProject(p => ({ ...p, backend_status: 'disconnected' }));
      notify.error('Backend unreachable');
    }
  }

  async function toggleTool(tool) {
    await base44.entities.ProjectTool.update(tool.id, { enabled: !tool.enabled });
    setTools(ts => ts.map(t => t.id === tool.id ? { ...t, enabled: !t.enabled } : t));
  }

  function EditableField({ field, label, value, placeholder }) {
    const isEditing = editingField === field;
    return (
      <div className="flex items-center gap-2 py-2 border-b border-border/40 last:border-0">
        <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input value={editValue} onChange={e => setEditValue(e.target.value)}
              className="h-7 text-xs" autoFocus
              onKeyDown={e => e.key === 'Enter' && saveField(field)} />
            <Button size="icon" className="h-6 w-6" onClick={() => saveField(field)}><Save className="w-3 h-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingField(null)}><X className="w-3 h-3" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value
              ? <span className="text-xs font-mono text-foreground truncate flex-1">{value}</span>
              : <ConnectPrompt label={placeholder} />
            }
            <button onClick={() => { setEditingField(field); setEditValue(value || ''); }}
              className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Project not found.</p>
        <Button onClick={() => navigate('/ecosystem')}>Back to Ecosystem</Button>
      </div>
    );
  }

  const TABS = [
    { key: 'tools', label: `Tools (${tools.length})` },
    { key: 'settings', label: 'Settings' },
    { key: 'integrations', label: `Integrations (${integrations.length})` },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top header bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 backdrop-blur-sm flex-wrap">
        <button onClick={() => navigate('/ecosystem')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground flex-shrink-0">
          <ArrowLeft className="w-3 h-3" />
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">{project.emoji || '📦'}</span>
          <span className="font-bold text-foreground text-sm">{project.name}</span>
          <StatusBadge status={project.status} />
          <StatusBadge status={project.build_status || 'pending'} />
        </div>

        <div className="flex items-center gap-3 text-xs ml-2 flex-wrap">
          {project.domain
            ? <span className="flex items-center gap-1 text-muted-foreground font-mono"><Globe className="w-3 h-3" />{project.domain}</span>
            : <ConnectPrompt label="Connect domain" />
          }
          <div className="flex items-center gap-1">
            {project.backend_status === 'connected'
              ? <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Backend</span></>
              : <><WifiOff className="w-3 h-3 text-yellow-400" /><span className="text-yellow-400">Backend</span></>
            }
            <button onClick={testBackend} className="ml-0.5 text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span className={project.db_status === 'connected' ? 'text-emerald-400' : 'text-yellow-400'}>
              DB: {project.db_status || 'unknown'}
            </span>
          </div>
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="w-3 h-3" /> Live
            </a>
          )}
        </div>
      </div>

      {/* Split pane body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: tools/settings */}
        <div className="w-full lg:w-[420px] flex flex-col border-r border-border flex-shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-1 p-2 border-b border-border bg-card/30 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent hover:border-border'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-dark">

            {/* Tools */}
            {tab === 'tools' && (
              <div className="space-y-2">
                {tools.map(tool => (
                  <div key={tool.id} className={`card-glass rounded-xl p-3 border transition-all ${tool.enabled ? 'border-border hover:border-primary/30' : 'border-border/30 opacity-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg flex-shrink-0">{tool.icon_emoji || '🔧'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-xs">{tool.name}</span>
                          <StatusBadge status={tool.status} />
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {tool.route && tool.status !== 'planned' ? (
                          <Link to={tool.route}>
                            <button className="px-2 py-1 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/25 transition-colors">
                              Open
                            </button>
                          </Link>
                        ) : (
                          <button disabled className="px-2 py-1 rounded-lg bg-secondary border border-border text-muted-foreground text-xs cursor-not-allowed">
                            Planned
                          </button>
                        )}
                        <button onClick={() => toggleTool(tool)}
                          className="px-1.5 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
                          title={tool.enabled ? 'Disable' : 'Enable'}>
                          {tool.enabled ? '●' : '○'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Settings */}
            {tab === 'settings' && (
              <div className="card-glass rounded-2xl p-4 border border-border">
                <h2 className="font-semibold text-foreground text-sm mb-3">Project Configuration</h2>
                <EditableField field="name" label="Name" value={project.name} placeholder="Set project name" />
                <EditableField field="domain" label="Domain" value={project.domain} placeholder="Connect domain" />
                <EditableField field="live_url" label="Live URL" value={project.live_url} placeholder="Connect live URL" />
                <EditableField field="preview_url" label="Preview URL" value={project.preview_url} placeholder="Connect preview URL" />
                <EditableField field="backend_url" label="Backend URL" value={project.backend_url} placeholder="Connect backend URL" />
                <EditableField field="repo_url" label="Repo URL" value={project.repo_url} placeholder="Connect repository" />
                <EditableField field="tech_stack" label="Tech Stack" value={project.tech_stack} placeholder="Set tech stack" />
                <EditableField field="framework" label="Framework" value={project.framework} placeholder="Set framework" />
              </div>
            )}

            {/* Integrations */}
            {tab === 'integrations' && (
              <div className="space-y-2">
                {integrations.length === 0
                  ? <p className="text-xs text-muted-foreground text-center py-8">No integrations configured.</p>
                  : integrations.map(int => (
                    <div key={int.id} className="card-glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                        {int.provider?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-xs">{int.name}</div>
                        {int.env_key_name && <div className="text-[10px] font-mono text-muted-foreground">{int.env_key_name}</div>}
                      </div>
                      <StatusBadge status={int.status} />
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div className="hidden lg:flex flex-1 overflow-hidden p-3">
          <LivePreviewPanel project={project} />
        </div>
      </div>
    </div>
  );
}