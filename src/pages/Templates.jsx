import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { LayoutTemplate, Plus, Loader2, Check, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

const BUILT_IN = [
  { name: 'Eternal Echo', slug: 'eternal-echo', description: 'AI-powered memory and reflection app', category: 'ai_app', icon_emoji: '🔮', color_accent: '#a855f7', status: 'available', features: ['AI memory', 'Voice notes', 'Timeline view'] },
  { name: 'PastorAI', slug: 'pastorai', description: 'AI assistant for spiritual leadership and sermons', category: 'spiritual', icon_emoji: '✝️', color_accent: '#6366f1', status: 'available', features: ['Sermon builder', 'Scripture search', 'Ministry tools'] },
  { name: 'Kindred Love Birds', slug: 'kindred-love-birds', description: 'Couples relationship app with AI coaching', category: 'ai_app', icon_emoji: '💞', color_accent: '#ec4899', status: 'available', features: ['Relationship tracker', 'AI coach', 'Date planner'] },
  { name: 'ResidentSync', slug: 'residentsync', description: 'Property management and resident portal', category: 'crm', icon_emoji: '🏠', color_accent: '#14b8a6', status: 'available', features: ['Tenant portal', 'Maintenance requests', 'Payments'] },
  { name: 'DTF Store', slug: 'dtf-store', description: 'Direct-to-film print shop ecommerce platform', category: 'ecommerce', icon_emoji: '🖨️', color_accent: '#f59e0b', status: 'available', features: ['Product catalog', 'Order flow', 'File uploads'] },
  { name: 'Mechanic AI', slug: 'mechanic-ai', description: 'AI-powered automotive shop management', category: 'ai_app', icon_emoji: '🔧', color_accent: '#f97316', status: 'available', features: ['Repair orders', 'AI diagnostics', 'Customer portal'] },
  { name: 'Builder AI', slug: 'builder-ai', description: 'Private AI-powered app builder like TerrellOS', category: 'builder', icon_emoji: '⚡', color_accent: '#8b5cf6', status: 'available', features: ['Project manager', 'AI commands', 'Build logs'] },
];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await base44.entities.Template.list();
    setTemplates(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const seedTemplates = async () => {
    setSeeding(true);
    for (const t of BUILT_IN) {
      const exists = templates.find(x => x.slug === t.slug);
      if (!exists) await base44.entities.Template.create(t);
    }
    setSeeding(false);
    load();
  };

  const handleSave = async (form) => {
    setSaving(true);
    await base44.entities.Template.update(form.id, form);
    setSaving(false);
    setEditing(null);
    load();
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-up">
      <PageHeader
        title="Templates"
        subtitle="Your personal app template library"
        action={templates.length === 0 && !loading ? (
          <Button onClick={seedTemplates} disabled={seeding}
            className="gradient-purple-blue text-white font-semibold rounded-xl px-5">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Load Templates
          </Button>
        ) : null}
      />

      {editing && (
        <div className="card-glass rounded-2xl p-6 mb-6 animate-fade-up">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Edit Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input value={editing.name} onChange={e => setEditing(f => ({ ...f, name: e.target.value }))}
              placeholder="Name" className="bg-secondary/50 border-border text-foreground" />
            <Input value={editing.icon_emoji || ''} onChange={e => setEditing(f => ({ ...f, icon_emoji: e.target.value }))}
              placeholder="Emoji icon" className="bg-secondary/50 border-border text-foreground" />
            <div className="sm:col-span-2">
              <Textarea value={editing.description || ''} onChange={e => setEditing(f => ({ ...f, description: e.target.value }))}
                placeholder="Description" rows={2} className="bg-secondary/50 border-border text-foreground resize-none" />
            </div>
            <Select value={editing.status} onValueChange={v => setEditing(f => ({ ...f, status: v }))}>
              <SelectTrigger className="bg-secondary/50 border-border text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['available','in_progress','coming_soon'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="sm:col-span-2">
              <Textarea value={editing.notes || ''} onChange={e => setEditing(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes" rows={2} className="bg-secondary/50 border-border text-foreground resize-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => handleSave(editing)} disabled={saving}
              className="gradient-purple-blue text-white font-semibold rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)} className="text-muted-foreground"><X className="w-4 h-4 mr-2" />Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card-glass rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates loaded."
          description="Load your 7 personal app templates to get started."
          action={<Button onClick={seedTemplates} disabled={seeding} className="gradient-purple-blue text-white font-semibold rounded-xl px-6">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Load Templates
          </Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id}
              className="card-glass rounded-2xl p-5 hover:border-primary/30 transition-colors duration-150 group relative"
              style={{ borderColor: t.status === 'available' ? `${t.color_accent}30` : undefined }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{t.icon_emoji || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{t.name}</div>
                  <StatusBadge status={t.status} className="mt-1" />
                </div>
                <button onClick={() => setEditing({ ...t })}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all duration-150 cursor-pointer">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
              {t.features && t.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.features.map((f, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground">{f}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}