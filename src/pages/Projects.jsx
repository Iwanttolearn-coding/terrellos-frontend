import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, FolderKanban, Archive, Pencil, X, Check, Loader2, Globe, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

const BLANK = { name: '', description: '', status: 'active', tech_stack: '', notes: '' };

function ProjectForm({ initial = BLANK, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="card-glass rounded-2xl p-6 mb-6 animate-fade-up">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        {initial.id ? 'Edit Project' : 'New Project'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input placeholder="Project name *" value={form.name} onChange={e => set('name', e.target.value)}
            className="bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground" />
        </div>
        <div className="sm:col-span-2">
          <Textarea placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            className="bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground resize-none" />
        </div>
        <Input placeholder="Tech stack (e.g. React, FastAPI)" value={form.tech_stack} onChange={e => set('tech_stack', e.target.value)}
          className="bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground" />
        <Select value={form.status} onValueChange={v => set('status', v)}>
          <SelectTrigger className="bg-secondary/50 border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['active','building','paused','archived','error'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="sm:col-span-2">
          <Textarea placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            className="bg-secondary/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground resize-none" />
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <Button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
          className="gradient-purple-blue text-white font-semibold px-6">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {initial.id ? 'Save Changes' : 'Create Project'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(null);
  const [liveProjects, setLiveProjects] = useState({});

  const load = async () => {
    const data = await base44.entities.Project.list('-created_date');
    setProjects(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    if (form.id) {
      await base44.entities.Project.update(form.id, form);
    } else {
      await base44.entities.Project.create(form);
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleArchive = async (id) => {
    await base44.entities.Project.update(id, { status: 'archived' });
    load();
  };

  const handlePublish = async (id) => {
    setPublishing(id);
    try {
      await base44.entities.Project.update(id, { status: 'active' });
      setLiveProjects(p => ({ ...p, [id]: true }));
      load();
    } catch (err) {
      console.error('Publish error:', err);
    }
    setPublishing(null);
  };

  const getPublicUrl = (id) => {
    return `${window.location.origin}/project/${id}`;
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-up">
      <PageHeader
        title="Projects"
        subtitle="Manage your personal app projects"
        action={
          <Button onClick={() => { setShowForm(true); setEditing(null); }}
            className="gradient-purple-blue text-white font-semibold rounded-xl px-5">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        }
      />

      {showForm && !editing && (
        <ProjectForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
      )}
      {editing && (
        <ProjectForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card-glass rounded-2xl h-24 animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet."
          description="Create your first project to start building with TerrellOS AI."
          action={<Button onClick={() => setShowForm(true)} className="gradient-purple-blue text-white font-semibold rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Create First Project
          </Button>}
        />
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="card-glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 transition-colors duration-150">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-foreground truncate">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && <p className="text-sm text-muted-foreground truncate">{p.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {p.tech_stack && <span>{p.tech_stack}</span>}
                  <span>{formatDistanceToNow(new Date(p.created_date), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {liveProjects[p.id] && (
                  <a href={getPublicUrl(p.id)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="text-primary hover:border-primary/50 gap-1 text-xs">
                      <Globe className="w-3 h-3" />
                      Live
                    </Button>
                  </a>
                )}
                {!liveProjects[p.id] && p.status === 'active' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePublish(p.id)}
                    disabled={publishing === p.id}
                    className="gap-1 text-xs text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50"
                  >
                    {publishing === p.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Link2 className="w-3 h-3" />
                    )}
                    Publish
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setShowForm(false); }}
                  className="text-muted-foreground hover:text-foreground">
                  <Pencil className="w-4 h-4" />
                </Button>
                {p.status !== 'archived' && (
                  <Button variant="ghost" size="sm" onClick={() => handleArchive(p.id)}
                    className="text-muted-foreground hover:text-yellow-400">
                    <Archive className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}