import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ToolCard } from '@/api/entities';

const CATEGORIES = ['Print', 'Tattoo', 'Vector', 'Design', 'AI', 'Upload', 'Gallery', 'Other'];
const GRADIENTS = [
  { label: 'Purple',  value: 'from-violet-600 to-purple-800' },
  { label: 'Pink',    value: 'from-pink-600 to-rose-800' },
  { label: 'Blue',    value: 'from-blue-600 to-cyan-700' },
  { label: 'Green',   value: 'from-emerald-600 to-green-800' },
  { label: 'Orange',  value: 'from-orange-600 to-amber-800' },
  { label: 'Red',     value: 'from-red-600 to-rose-800' },
  { label: 'Teal',    value: 'from-teal-600 to-cyan-800' },
  { label: 'Indigo',  value: 'from-indigo-600 to-blue-800' },
  { label: 'Fuchsia', value: 'from-fuchsia-600 to-purple-800' },
  { label: 'Slate',   value: 'from-slate-600 to-gray-800' },
];

const BLANK = {
  title: '', description: '', icon_emoji: '🛠️', icon_url: '',
  category: 'AI', button_label: 'Open Tool', route: '',
  enabled: true, featured: false, sort_order: 99,
  bg_color: 'from-violet-600 to-purple-800', glow_color: 'rgba(167,139,250,0.35)',
};

export default function ManageAITools() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);     // null = list, 'new' or id = form
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [saved, setSaved] = useState(false);
  const { access } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!access?.founder) { navigate('/'); return; }
    loadTools();
  }, [access]);

  const loadTools = async () => {
    setLoading(true);
    const data = await ToolCard.list();
    setTools([...data].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99)));
    setLoading(false);
  };

  const openNew = () => { setForm({ ...BLANK, sort_order: tools.length + 1 }); setEditing('new'); };
  const openEdit = (t) => { setForm({ ...t }); setEditing(t.id); };
  const cancelEdit = () => { setEditing(null); setForm(BLANK); };

  const saveForm = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editing === 'new') {
        await ToolCard.create(form);
      } else {
        await ToolCard.update(editing, form);
      }
      await loadTools();
      setEditing(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const deleteCard = async (id) => {
    if (!confirm('Delete this tool card?')) return;
    await ToolCard.delete(id);
    setTools(prev => prev.filter(t => t.id !== id));
  };

  const toggleField = async (id, field, val) => {
    await ToolCard.update(id, { [field]: val });
    setTools(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  // Drag to reorder
  const dragOver = (e, targetId) => {
    e.preventDefault();
    if (dragId === targetId) return;
    const dragged = tools.find(t => t.id === dragId);
    const target = tools.find(t => t.id === targetId);
    if (!dragged || !target) return;
    const reordered = tools.filter(t => t.id !== dragId);
    const idx = reordered.findIndex(t => t.id === targetId);
    reordered.splice(idx, 0, dragged);
    const updated = reordered.map((t, i) => ({ ...t, sort_order: i + 1 }));
    setTools(updated);
  };
  const dragEnd = async () => {
    setDragId(null);
    // Persist new order
    await Promise.all(tools.map((t, i) => ToolCard.update(t.id, { sort_order: i + 1 })));
  };

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tools/ai-tools-studio')}
              className="text-gray-500 hover:text-white transition-colors text-sm">← Back</button>
            <div>
              <h1 className="text-2xl font-bold text-white">⚙️ Manage AI Tools</h1>
              <p className="text-gray-500 text-xs">Add, edit, reorder, and toggle tool cards</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-green-400 text-sm">✅ Saved!</span>}
            <button onClick={openNew}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20">
              + Add Tool Card
            </button>
          </div>
        </div>

        {/* ── Edit / New Form ── */}
        {editing && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-6 text-white">
              {editing === 'new' ? '✨ New Tool Card' : '✏️ Edit Tool Card'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title *</label>
                <input value={form.title} onChange={e => f('title', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Button Label</label>
                <input value={form.button_label} onChange={e => f('button_label', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)}
                  rows={3} className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Route / Link</label>
                <input value={form.route} onChange={e => f('route', e.target.value)}
                  placeholder="/tools/tattoo-studio"
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select value={form.category} onChange={e => f('category', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Emoji Icon</label>
                <input value={form.icon_emoji} onChange={e => f('icon_emoji', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Custom Icon URL (overrides emoji)</label>
                <input value={form.icon_url} onChange={e => f('icon_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Card Gradient</label>
                <select value={form.bg_color} onChange={e => f('bg_color', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                  {GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Glow Color (CSS rgba)</label>
                <input value={form.glow_color} onChange={e => f('glow_color', e.target.value)}
                  placeholder="rgba(167,139,250,0.35)"
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={e => f('sort_order', parseInt(e.target.value) || 99)}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${form.enabled ? 'bg-green-500' : 'bg-gray-700'}`}
                    onClick={() => f('enabled', !form.enabled)}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-300">Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${form.featured ? 'bg-purple-500' : 'bg-gray-700'}`}
                    onClick={() => f('featured', !form.featured)}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-300">Featured</span>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 mb-3">Preview:</p>
              <div className="w-64 bg-gray-900/80 border border-white/10 rounded-2xl p-4">
                <div className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center mb-3 bg-gradient-to-br ${form.bg_color}`}>
                  {form.icon_emoji || '🛠️'}
                </div>
                <p className="text-white font-bold text-sm">{form.title || 'Tool Title'}</p>
                <p className="text-gray-400 text-xs mt-1 mb-3 line-clamp-2">{form.description || 'Description here...'}</p>
                <div className={`w-full py-1.5 rounded-xl text-xs text-center font-semibold bg-gradient-to-r ${form.bg_color} text-white`}>
                  {form.button_label || 'Open Tool'} →
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={saveForm} disabled={saving || !form.title.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all">
                {saving ? 'Saving...' : editing === 'new' ? 'Create Card' : 'Save Changes'}
              </button>
              <button onClick={cancelEdit}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Tool list with drag reorder ── */}
        <div className="space-y-2">
          <p className="text-xs text-gray-600 mb-3">Drag to reorder · {tools.length} tools total</p>
          {tools.map(t => (
            <div key={t.id}
              draggable
              onDragStart={() => setDragId(t.id)}
              onDragOver={e => dragOver(e, t.id)}
              onDragEnd={dragEnd}
              className={`bg-gray-900 border rounded-xl p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all ${
                dragId === t.id ? 'border-purple-500/50 opacity-60' : 'border-gray-800 hover:border-gray-700'
              }`}>
              {/* Drag handle */}
              <div className="text-gray-600 hover:text-gray-400 transition-colors select-none">⠿</div>
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${t.bg_color || 'from-purple-600 to-violet-800'}`}>
                {t.icon_url ? <img src={t.icon_url} className="w-full h-full object-cover rounded-xl" alt="" /> : (t.icon_emoji || '🛠️')}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">{t.title}</p>
                  {t.featured && <span className="text-xs text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">⭐ Featured</span>}
                </div>
                <p className="text-gray-500 text-xs truncate">{t.category} · {t.route}</p>
              </div>
              {/* Toggles */}
              <div className="flex items-center gap-3">
                <button onClick={() => toggleField(t.id, 'enabled', !t.enabled)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all ${t.enabled ? 'bg-green-700/60 text-green-300' : 'bg-gray-700 text-gray-500'}`}>
                  {t.enabled ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => toggleField(t.id, 'featured', !t.featured)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all ${t.featured ? 'bg-purple-700/60 text-purple-300' : 'bg-gray-700 text-gray-500'}`}>
                  {t.featured ? '⭐' : '☆'}
                </button>
                <button onClick={() => openEdit(t)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-all">
                  Edit
                </button>
                <button onClick={() => deleteCard(t.id)}
                  className="text-xs bg-red-900/50 hover:bg-red-800/70 text-red-400 px-2 py-1 rounded-lg transition-all">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/tools/ai-tools-studio')}
            className="text-sm text-gray-500 hover:text-white transition-colors">
            ← Back to AI Tools Studio
          </button>
        </div>
      </div>
    </div>
  );
}
