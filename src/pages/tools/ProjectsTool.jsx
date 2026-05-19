import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/env';
import { FolderKanban, Loader2, Eye, Trash2, Calendar, Code2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectsTool() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  async function fetchProjects() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/projects`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      setError('Failed to load projects from backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProjects(); }, []);

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await fetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {}
    setDeleting(null);
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-purple-blue flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Saved Projects</h1>
            <div className="text-[10px] font-mono text-muted-foreground">{API_BASE_URL}/projects</div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={fetchProjects}>Refresh</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : error ? (
        <div className="text-center py-16 text-destructive text-sm">{error}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderKanban className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <div className="text-base font-medium mb-1">No saved projects yet</div>
          <div className="text-xs">Generate something in the AI Builder to see it here.</div>
          <Link to="/tools/ai-builder">
            <Button className="mt-4" size="sm">Open AI Builder</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {[...projects].reverse().map(p => (
            <div key={p.id} className="card-glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{p.project_name || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{p.prompt}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">{p.tool_type}</span>
                    {p.html && <span className="text-[10px] font-mono text-accent/80 bg-accent/10 px-2 py-0.5 rounded-full">HTML</span>}
                    {p.css && <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded-full">CSS</span>}
                    {p.js && <span className="text-[10px] font-mono text-yellow-400/80 bg-yellow-400/10 px-2 py-0.5 rounded-full">JS</span>}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {p.created_at ? formatDistanceToNow(new Date(p.created_at), { addSuffix: true }) : 'just now'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link to={`/tools/project-preview?id=${p.id}`}>
                    <Button size="icon" variant="ghost" className="w-8 h-8" title="Preview">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    title="Delete"
                  >
                    {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}