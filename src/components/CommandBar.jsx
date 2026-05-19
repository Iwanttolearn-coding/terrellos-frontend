import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, FolderKanban, HardDrive, ScrollText, X, Loader2, ArrowRight } from 'lucide-react';

const TYPE_META = {
  project:  { icon: FolderKanban, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Project',   path: (id) => `/tools/projects?focus=${id}` },
  upload:   { icon: HardDrive,    color: 'text-blue-400',    bg: 'bg-blue-500/10',     label: 'Upload',    path: (id) => `/tools/uploads?focus=${id}` },
  log:      { icon: ScrollText,   color: 'text-yellow-400',  bg: 'bg-yellow-500/10',   label: 'Log',       path: (id) => `/tools/logs?focus=${id}` },
};

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function CommandBar({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search across all entities
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [projects, uploads, logs] = await Promise.all([
          base44.entities.Project.list('-updated_date', 50),
          base44.entities.Upload.list('-updated_date', 50),
          base44.entities.BuildLog.list('-created_date', 50),
        ]);
        if (cancelled) return;
        const q = query.toLowerCase();
        const matched = [
          ...projects
            .filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
            .map(p => ({ type: 'project', id: p.id, title: p.name, sub: p.description || p.status, raw: p })),
          ...uploads
            .filter(u => u.file_name?.toLowerCase().includes(q) || u.description?.toLowerCase().includes(q))
            .map(u => ({ type: 'upload', id: u.id, title: u.file_name, sub: u.mime_type || u.file_type, raw: u })),
          ...logs
            .filter(l => l.project_name?.toLowerCase().includes(q) || l.command_type?.toLowerCase().includes(q) || l.prompt?.toLowerCase().includes(q))
            .map(l => ({ type: 'log', id: l.id, title: l.command_type?.replace(/_/g, ' ') || 'Log', sub: l.project_name || l.status, raw: l })),
        ].slice(0, 12);
        setResults(matched);
        setSelected(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  function go(item) {
    navigate(TYPE_META[item.type].path(item.id));
    onClose();
  }

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) go(results[selected]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, selected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          {loading ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" /> : <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, uploads, logs…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex items-center gap-2">
            <kbd className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">ESC</kbd>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {!query.trim() && (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">Type to search across Projects, Uploads, and Logs</p>
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for <span className="text-foreground font-medium">"{query}"</span>
            </div>
          )}

          {results.map((item, i) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            return (
              <button
                key={item.id}
                onClick={() => go(item)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === selected ? 'bg-secondary' : 'hover:bg-secondary/60'} ${i < results.length - 1 ? 'border-b border-border/40' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {highlight(item.title, query)}
                  </div>
                  {item.sub && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {highlight(item.sub, query)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>{meta.label}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/30">
          <span className="text-[10px] text-muted-foreground"><kbd className="font-mono bg-secondary px-1 py-0.5 rounded">↑↓</kbd> navigate</span>
          <span className="text-[10px] text-muted-foreground"><kbd className="font-mono bg-secondary px-1 py-0.5 rounded">↵</kbd> open</span>
          <span className="text-[10px] text-muted-foreground"><kbd className="font-mono bg-secondary px-1 py-0.5 rounded">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}