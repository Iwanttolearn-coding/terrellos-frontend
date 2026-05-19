import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Plus, Loader2, Heart, Sparkles, Clock, Tag, Trash2, CalendarDays } from 'lucide-react';
import { companionRespond, startMemorySession, saveMemoryTranscript, endMemorySession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { notify } from '@/components/NotificationCenter';

const EMOTION_COLORS = {
  joy:     'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  love:    'bg-pink-500/15 text-pink-300 border-pink-500/30',
  grief:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
  peace:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  faith:   'bg-primary/15 text-primary border-primary/30',
  gratitude:'bg-amber-500/15 text-amber-300 border-amber-500/30',
  pain:    'bg-destructive/15 text-destructive border-destructive/30',
};

function emotionStyle(e) {
  return EMOTION_COLORS[e?.toLowerCase()] || 'bg-secondary text-muted-foreground border-border';
}

function groupByDate(memories) {
  const groups = {};
  memories.forEach(m => {
    const d = new Date(m.created_date);
    let label = format(d, 'MMMM d, yyyy');
    if (isToday(d)) label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';
    if (!groups[label]) groups[label] = [];
    groups[label].push(m);
  });
  return groups;
}

function parseMeta(desc) {
  try { return JSON.parse(desc || '{}'); } catch { return {}; }
}

export default function MemoryVault() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reflection, setReflection] = useState('');
  const [form, setForm] = useState({ title: '', story: '', emotion: '', tags: '' });

  useEffect(() => {
    base44.entities.Upload.filter({ file_type: 'other' }, '-created_date', 50)
      .then(data => {
        setMemories(data.filter(r => { const m = parseMeta(r.description); return m.type === 'memory' || m.story || !m.type; }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const record = await base44.entities.Upload.create({
        file_name: form.title,
        file_url: '',
        file_type: 'other',
        description: JSON.stringify({ type: 'memory', story: form.story, emotion: form.emotion, tags: form.tags }),
      });
      setMemories(prev => [record, ...prev]);
      setForm({ title: '', story: '', emotion: '', tags: '' });
      setShowForm(false);
      notify.success('Memory preserved!');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await base44.entities.Upload.delete(id);
    setMemories(prev => prev.filter(m => m.id !== id));
    notify.info('Memory removed.');
  }

  async function generateReflection() {
    if (memories.length === 0) return;
    setReflecting(true);
    const recent = memories.slice(0, 5).map(m => {
      const meta = parseMeta(m.description);
      return `"${m.file_name}": ${meta.story || ''}`;
    }).join('\n');
    try {
      const res = await companionRespond(
        `Based on these personal memories, write a short, warm, spiritually encouraging reflection (3-4 sentences):\n${recent}`
      );
      setReflection(res?.reply || res?.message || 'Reflection unavailable — check backend connection.');
      notify.success('AI reflection generated via Eternal Echo ✓');
    } catch (err) {
      notify.error('Reflection failed: ' + err.message);
    } finally {
      setReflecting(false);
    }
  }

  const groups = groupByDate(memories);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Memory Vault</h1>
            <div className="text-xs text-muted-foreground">{memories.length} memories · Eternal Echo</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={generateReflection} disabled={reflecting || memories.length === 0}>
            {reflecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            Reflect
          </Button>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* AI Reflection card */}
      {reflection && (
        <div className="card-glass rounded-2xl p-4 mb-5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">AI Reflection</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed italic">{reflection}</p>
        </div>
      )}

      {/* Add memory form */}
      {showForm && (
        <form onSubmit={handleSave} className="card-glass rounded-2xl p-5 mb-5 space-y-3">
          <Input placeholder="Memory title…" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
          <Textarea placeholder="Tell the story…" value={form.story} onChange={e => setForm(p => ({...p, story: e.target.value}))} rows={4} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Emotion (joy, grief, love…)" value={form.emotion} onChange={e => setForm(p => ({...p, emotion: e.target.value}))} />
            <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} />
          </div>
          {/* Emotion quick-select */}
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(EMOTION_COLORS).map(em => (
              <button key={em} type="button" onClick={() => setForm(p => ({...p, emotion: em}))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.emotion === em ? emotionStyle(em) : 'border-border text-muted-foreground hover:border-border/60'}`}>
                {em}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || !form.title.trim()} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {saving ? 'Saving…' : 'Save Memory'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : memories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-sm">No memories preserved yet.</div>
          <Button className="mt-4" size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Add First Memory</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([dateLabel, group]) => (
            <div key={dateLabel}>
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-3">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{dateLabel}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-3">
                {group.map(m => {
                  const meta = parseMeta(m.description);
                  const tags = meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
                  return (
                    <div key={m.id} className="card-glass rounded-2xl p-4 group">
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <span className="font-semibold text-foreground leading-tight">{m.file_name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {meta.emotion && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${emotionStyle(meta.emotion)}`}>
                              {meta.emotion}
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {meta.story && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{meta.story}</p>}

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              <Tag className="w-2.5 h-2.5" />{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {m.created_date ? formatDistanceToNow(new Date(m.created_date), { addSuffix: true }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}