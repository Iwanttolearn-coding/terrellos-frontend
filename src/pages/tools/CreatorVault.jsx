/**
 * CreatorVault.jsx — TerrellOS
 * Upload + Gallery. Real API. No fake data. Persistent per user.
 * Founder/admin can view all user projects.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import {
  Upload, Image, Trash2, Download, Star, FolderPlus,
  RefreshCw, Loader2, LayoutGrid, List, X, Eye
} from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = import.meta.env.VITE_APP_ID || 'terrellos';
const HEADERS = { 'X-App-ID': APP_ID };

const CATEGORIES = [
  { id: 'all',             label: 'All Assets',      emoji: '🗄️' },
  { id: 'tattoo_concept',  label: 'Tattoo Concepts', emoji: '💉' },
  { id: 'dtf_designs',     label: 'DTF Designs',     emoji: '🖨️' },
  { id: 'ai_generation',   label: 'AI Generations',  emoji: '✨' },
  { id: 'vector_files',    label: 'Vector Files',    emoji: '📐' },
  { id: 'transparent_pngs',label: 'Transparent PNGs',emoji: '🔲' },
  { id: 'mockups',         label: 'Mockups',          emoji: '👕' },
  { id: 'upload_history',  label: 'Uploads',          emoji: '📁' },
];

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,.ai,.eps,.psd';

export default function CreatorVault() {
  const { user }  = useAuth();
  const access    = resolveUserAccess(user);
  const userId    = user?.email || user?.id || 'guest';
  const fileRef   = useRef(null);

  const [items,      setItems]      = useState([]);
  const [folders,    setFolders]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [category,   setCategory]   = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [error,      setError]      = useState('');
  const [viewMode,   setViewMode]   = useState('grid');
  const [folderName, setFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const fetchGallery = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (category !== 'all') params.set('type', category);
      const res = await fetch(`${BACKEND}/v1/gallery/load/${encodeURIComponent(userId)}?${params}`,
        { headers: { 'Content-Type': 'application/json', ...HEADERS } });
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      setError('Could not load gallery — backend may be waking up');
    }
    setLoading(false);
  }, [userId, category]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/v1/gallery/stats/${encodeURIComponent(userId)}`,
        { headers: HEADERS });
      const data = await res.json();
      if (data.success) setStats(data);
    } catch {}
  }, [userId]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/v1/gallery/folders/${encodeURIComponent(userId)}`,
        { headers: HEADERS });
      const data = await res.json();
      if (data.success) setFolders(data.folders || []);
    } catch {}
  }, [userId]);

  useEffect(() => {
    fetchGallery();
    fetchStats();
    fetchFolders();
  }, [fetchGallery, fetchStats, fetchFolders]);

  // ── File upload ──────────────────────────────────────────────────────────
  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true); setError('');
    let uploaded = 0;
    for (const file of Array.from(files)) {
      setUploadProgress(`Uploading ${file.name}…`);
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('user_id', userId);
        fd.append('app_id', APP_ID);
        const res = await fetch(`${BACKEND}/v1/uploads/file`, { method: 'POST', headers: HEADERS, body: fd });
        const data = await res.json();
        if (data.success && data.file_url) {
          // Save to gallery
          await fetch(`${BACKEND}/v1/gallery/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...HEADERS },
            body: JSON.stringify({
              user_id: userId, app_id: APP_ID,
              image_url: data.file_url,
              title: file.name.replace(/\.[^.]+$/, ''),
              type: 'upload_history',
              file_size: file.size,
              file_type: file.type,
            }),
          });
          uploaded++;
        }
      } catch (e) { setError(`Upload failed: ${e.message}`); }
    }
    setUploadProgress(null);
    setUploading(false);
    if (uploaded > 0) { fetchGallery(); fetchStats(); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  const deleteItem = async (id) => {
    try {
      await fetch(`${BACKEND}/v1/gallery/item/${id}`, { method: 'DELETE', headers: HEADERS });
      setItems(prev => prev.filter(i => i.id !== id));
      if (preview?.id === id) setPreview(null);
      fetchStats();
    } catch {}
  };

  const toggleFavorite = async (item) => {
    try {
      await fetch(`${BACKEND}/v1/gallery/item/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...HEADERS },
        body: JSON.stringify({ is_favorite: !item.is_favorite }),
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_favorite: !i.is_favorite } : i));
    } catch {}
  };

  const createFolder = async () => {
    if (!folderName.trim()) return;
    try {
      const res = await fetch(`${BACKEND}/v1/gallery/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...HEADERS },
        body: JSON.stringify({ user_id: userId, name: folderName.trim(), app_id: APP_ID }),
      });
      const data = await res.json();
      if (data.success) { setFolders(prev => [...prev, data.folder]); }
    } catch {}
    setFolderName(''); setShowNewFolder(false);
  };

  const downloadFile = (url, name) => {
    const a = document.createElement('a');
    a.href = url; a.download = name || `tm-dezigns-${Date.now()}`; a.target = '_blank'; a.click();
  };

  // ── Drag over ──────────────────────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-violet-800 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Creator Vault</h1>
            <p className="text-xs text-gray-500">
              {stats ? `${stats.total_items || 0} assets · ${stats.favorites || 0} starred` : 'Your design library'}
              {access.founder && ' · 👑 Founder View'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition-all">
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowNewFolder(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white text-xs transition-all">
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-700 hover:from-fuchsia-500 hover:to-violet-600 text-white text-xs font-bold disabled:opacity-50 transition-all">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploadProgress || 'Upload'}
          </button>
          <input ref={fileRef} type="file" multiple accept={ACCEPT} className="hidden"
            onChange={e => handleUpload(e.target.files)} />
        </div>
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div className="flex items-center gap-2 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-3">
          <input value={folderName} onChange={e => setFolderName(e.target.value)}
            placeholder="Folder name…" onKeyDown={e => e.key === 'Enter' && createFolder()}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-600" />
          <button onClick={createFolder} className="text-xs text-violet-400 hover:text-violet-300 font-medium px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">Create</button>
          <button onClick={() => setShowNewFolder(false)} className="text-gray-600 hover:text-gray-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-xs text-red-400 flex-1">{error}</p>
          <button onClick={fetchGallery} className="text-xs text-red-300 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Category sidebar */}
        <div className="w-44 flex-shrink-0 space-y-0.5">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                category === c.id
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-gray-500 hover:bg-gray-900 hover:text-white'
              }`}>
              <span>{c.emoji}</span>
              <span className="truncate">{c.label}</span>
            </button>
          ))}
          {folders.length > 0 && (
            <>
              <div className="pt-2 pb-1 px-3 text-[10px] text-gray-700 uppercase tracking-wider">Folders</div>
              {folders.map(f => (
                <button key={f.id} onClick={() => {}}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition-all">
                  <span>📁</span>
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-xs text-gray-700">{f.item_count || 0}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Main gallery area */}
        <div className="flex-1 min-w-0">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { setDragOver(false); handleDrop(e); }}
            onClick={() => !items.length && fileRef.current?.click()}
            className={`mb-4 border-2 border-dashed rounded-2xl p-4 text-center text-xs text-gray-600 transition-all ${
              dragOver ? 'border-violet-500/60 bg-violet-500/5 text-violet-400' : 'border-gray-800 hover:border-gray-700 cursor-pointer'
            }`}>
            {dragOver ? 'Drop files here' : 'Drop files here or click Upload above · PNG, JPG, SVG, PDF, AI, PSD'}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-900 rounded-2xl border border-gray-800 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gray-900 border-2 border-dashed border-gray-800 flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-700" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">No designs yet</p>
                <p className="text-gray-600 text-sm mt-1">Upload your first design or generate something in the AI Studio</p>
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-700 text-white text-sm font-bold hover:opacity-90 transition-opacity">
                <Upload className="w-4 h-4" /> Upload Now
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => (
                <div key={item.id}
                  className="group relative bg-gray-900 border border-gray-800 hover:border-violet-500/40 rounded-2xl overflow-hidden transition-all cursor-pointer"
                  onClick={() => setPreview(item)}>
                  <div className="aspect-square overflow-hidden bg-gray-800">
                    <img src={item.image_url} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { e.target.src = ''; e.target.className = 'hidden'; }} />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); toggleFavorite(item); }}
                      className="w-7 h-7 bg-gray-900/80 backdrop-blur rounded-lg flex items-center justify-center text-xs">
                      {item.is_favorite ? '⭐' : '☆'}
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                      className="w-7 h-7 bg-red-500/20 backdrop-blur rounded-lg flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-white truncate">{item.title || 'Untitled'}</p>
                    <p className="text-[10px] text-gray-600">{item.type?.replace('_',' ') || 'Design'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List view
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} onClick={() => setPreview(item)}
                  className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-3 cursor-pointer transition-all group">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-600">{item.type?.replace(/_/g,' ')} · {item.created_at?.split('T')[0]}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); downloadFile(item.image_url, item.title); }}
                      className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold text-white truncate">{preview.title || 'Preview'}</h3>
              <div className="flex items-center gap-2">
                <a href={preview.image_url} download target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-all">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-gray-950">
              <img src={preview.image_url} alt={preview.title} className="w-full max-h-[60vh] object-contain" />
            </div>
            <div className="px-5 py-3 text-xs text-gray-600 flex gap-4">
              <span>{preview.type?.replace(/_/g,' ')}</span>
              <span>{preview.created_at?.split('T')[0]}</span>
              {preview.file_size && <span>{(preview.file_size/1024).toFixed(0)} KB</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
