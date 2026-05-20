import { useState, useEffect, useCallback } from 'react';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';

const CATEGORIES = [
  { id: 'all',            label: 'All Assets',       emoji: '🗄️' },
  { id: 'tattoo_concept', label: 'Tattoo Concepts',  emoji: '🎯' },
  { id: 'tattoo_stencil', label: 'Tattoo Outlines',  emoji: '📋' },
  { id: 'vector_files',   label: 'Vector Files',     emoji: '📐' },
  { id: 'dtf_designs',    label: 'DTF Designs',      emoji: '🖨️' },
  { id: 'ai_generation',  label: 'AI Generations',   emoji: '✨' },
  { id: 'transparent_pngs',label: 'Transparent PNGs',emoji: '🔲' },
  { id: 'mockups',        label: 'Mockups',           emoji: '👕' },
  { id: 'upload_history', label: 'Uploads',           emoji: '📁' },
];

export default function CreatorVault() {
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeTab, setActiveTab] = useState('gallery'); // gallery | folders | prompts
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [selected, setSelected] = useState(null);

  const API = BACKEND_BASE_URL;
  const USER_ID = 'founder';
  const APP_ID = import.meta.env.VITE_APP_ID || 'terrellos';
  const headers = { 'Content-Type': 'application/json', 'X-App-ID': APP_ID };

  const loadGallery = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (activeCategory !== 'all') params.set('type', activeCategory);
      if (activeFolder) params.set('folder_id', activeFolder);
      const res = await fetch(`${API}/v1/gallery/load/${USER_ID}?${params}`, { headers });
      const data = await res.json();
      if (data.success) setItems(data.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeCategory, activeFolder, API]);

  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/v1/gallery/folders/${USER_ID}`, { headers });
      const data = await res.json();
      if (data.success) setFolders(data.folders || []);
    } catch (e) {}
  }, [API]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/v1/gallery/stats/${USER_ID}`, { headers });
      const data = await res.json();
      if (data.success) setStats(data);
    } catch (e) {}
  }, [API]);

  const loadPrompts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/v1/gallery/prompts/${USER_ID}`, { headers });
      const data = await res.json();
      if (data.success) setPrompts(data.prompts || []);
    } catch (e) {}
  }, [API]);

  useEffect(() => {
    loadGallery(); loadFolders(); loadStats(); loadPrompts();
  }, [loadGallery, loadFolders, loadStats, loadPrompts]);

  const deleteItem = async (id) => {
    await fetch(`${API}/v1/gallery/item/${id}`, { method: 'DELETE', headers });
    setItems(prev => prev.filter(i => i.id !== id));
    if (selected?.id === id) setSelected(null);
    loadStats();
  };

  const toggleFavorite = async (item) => {
    await fetch(`${API}/v1/gallery/item/${item.id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ is_favorite: !item.is_favorite }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_favorite: !i.is_favorite } : i));
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const res = await fetch(`${API}/v1/gallery/folders`, {
      method: 'POST', headers,
      body: JSON.stringify({ user_id: USER_ID, name: newFolderName, app_id: APP_ID }),
    });
    const data = await res.json();
    if (data.success) { setFolders(prev => [...prev, data.folder]); setNewFolderName(''); setShowNewFolder(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🗄️</span>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Creator Vault
                </h1>
                <p className="text-gray-400 text-sm">Your AI asset library — designs, tattoos, vectors, and more</p>
              </div>
            </div>
            {stats && (
              <div className="hidden md:flex gap-4">
                {[
                  { label: 'Total Assets', value: stats.total_items },
                  { label: 'Folders', value: stats.total_folders },
                  { label: 'Favorites', value: stats.favorites },
                  { label: 'Saved Prompts', value: stats.total_prompts },
                ].map(s => (
                  <div key={s.label} className="text-center bg-gray-900 rounded-xl px-4 py-2 border border-gray-800">
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'gallery', label: '🖼️ Gallery' },
            { id: 'folders', label: '📁 Folders' },
            { id: 'prompts', label: '📝 Prompt History' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="flex gap-6">
            {/* Sidebar — categories */}
            <div className="w-48 flex-shrink-0 space-y-1">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => { setActiveCategory(c.id); setActiveFolder(null); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    activeCategory === c.id && !activeFolder
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}>
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                  {stats?.by_type?.[c.id] > 0 && (
                    <span className="ml-auto text-xs text-gray-500">{stats.by_type[c.id]}</span>
                  )}
                </button>
              ))}
              <hr className="border-gray-800 my-2" />
              <p className="text-xs text-gray-600 px-3 py-1">FOLDERS</p>
              {folders.map(f => (
                <button key={f.id} onClick={() => setActiveFolder(f.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    activeFolder === f.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                  }`}>
                  <span>📁</span>
                  <span className="truncate">{f.name}</span>
                  <span className="ml-auto text-xs text-gray-500">{f.item_count}</span>
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="border border-dashed border-gray-700 rounded-2xl p-16 text-center">
                  <span className="text-5xl">🗄️</span>
                  <p className="text-gray-400 mt-4 font-medium">Your vault is empty</p>
                  <p className="text-gray-600 text-sm mt-2">Generate something in the Tattoo Studio and save it here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(item => (
                    <div key={item.id}
                      className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer"
                      onClick={() => setSelected(item)}>
                      <div className="aspect-square relative overflow-hidden bg-gray-800">
                        <img src={item.image_url} alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                          <button onClick={e => { e.stopPropagation(); toggleFavorite(item); }}
                            className="w-8 h-8 bg-gray-900/80 rounded-full flex items-center justify-center text-sm">
                            {item.is_favorite ? '⭐' : '☆'}
                          </button>
                          <a href={item.image_url} download target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="w-8 h-8 bg-gray-900/80 rounded-full flex items-center justify-center text-sm">
                            ⬇️
                          </a>
                          <button onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                            className="w-8 h-8 bg-red-900/80 rounded-full flex items-center justify-center text-sm">
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-white text-xs font-medium truncate">{item.title}</p>
                        <p className="text-gray-500 text-xs truncate">{item.type} · {item.style || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOLDERS TAB */}
        {activeTab === 'folders' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">{folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
              <button onClick={() => setShowNewFolder(true)}
                className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition-all">
                + New Folder
              </button>
            </div>
            {showNewFolder && (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-4 flex gap-3">
                <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-purple-500"
                  onKeyDown={e => e.key === 'Enter' && createFolder()} />
                <button onClick={createFolder}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm">Create</button>
                <button onClick={() => setShowNewFolder(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-xl text-sm">Cancel</button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {folders.map(f => (
                <div key={f.id}
                  className="bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl p-6 cursor-pointer transition-all"
                  onClick={() => { setActiveTab('gallery'); setActiveFolder(f.id); }}>
                  <span className="text-3xl">📁</span>
                  <p className="text-white font-medium mt-2">{f.name}</p>
                  <p className="text-gray-500 text-sm">{f.item_count} item{f.item_count !== 1 ? 's' : ''}</p>
                </div>
              ))}
              {folders.length === 0 && (
                <div className="col-span-4 text-center py-16 text-gray-500">
                  No folders yet. Create one to organize your vault.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROMPTS TAB */}
        {activeTab === 'prompts' && (
          <div className="space-y-2">
            {prompts.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                No saved prompts yet. Generate designs to build your prompt history.
              </div>
            )}
            {prompts.map((p, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{p.prompt}</p>
                  <p className="text-gray-500 text-xs mt-1">{p.type} · {p.style || '—'} · {new Date(p.used_at || p.saved_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => { window.location.href = '/tools/tattoo-studio?prompt=' + encodeURIComponent(p.prompt); }}
                  className="text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg flex-shrink-0 transition-all">
                  🔄 Reuse
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-gray-900 rounded-3xl overflow-hidden max-w-2xl w-full border border-gray-700"
            onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt={selected.title} className="w-full max-h-96 object-contain bg-gray-800" />
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-white font-bold text-lg">{selected.title}</h3>
                {selected.prompt && <p className="text-gray-400 text-sm mt-1">{selected.prompt}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[selected.type, selected.style, ...(selected.tags || [])].filter(Boolean).map(t => (
                    <span key={t} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <a href={selected.image_url} download target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all">
                  ⬇️ Download
                </a>
                <button onClick={() => toggleFavorite(selected)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm transition-all">
                  {selected.is_favorite ? '⭐ Favorited' : '☆ Favorite'}
                </button>
                <button onClick={() => { deleteItem(selected.id); setSelected(null); }}
                  className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-xl text-sm transition-all">
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
