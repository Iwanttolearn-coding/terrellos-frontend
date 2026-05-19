import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/env';
import { Loader2, Eye, Code2, Palette, Zap, Copy, ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CodeEditor from '@/components/CodeEditor';
import { notify } from '@/components/NotificationCenter';

function buildPreviewHtml(html, css, js) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>${css || ''}</style>
</head>
<body>
${html || '<div style="padding:2rem;font-family:sans-serif;color:#888">No HTML content.</div>'}
<script>${js || ''}<\/script>
</body>
</html>`;
}

const TABS = [
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'html',    label: 'HTML',    icon: Code2 },
  { key: 'css',     label: 'CSS',     icon: Palette },
  { key: 'js',      label: 'JS',      icon: Zap },
];

export default function ProjectPreview() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const [project, setProject]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState('preview');
  const [copied, setCopied]     = useState('');
  const [saving, setSaving]     = useState(false);

  // Editable code state
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode,  setCssCode]  = useState('');
  const [jsCode,   setJsCode]   = useState('');

  // Live preview src — only updated on "Run" / tab switch to preview
  const [previewSrc, setPreviewSrc] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!projectId) { setError('No project ID provided.'); setLoading(false); return; }
    fetch(`${API_BASE_URL}/projects/${projectId}`)
      .then(r => r.json())
      .then(data => {
        if (data.project) {
          const p = data.project;
          setProject(p);
          setHtmlCode(p.html || '');
          setCssCode(p.css  || '');
          setJsCode(p.js   || '');
          setPreviewSrc(buildPreviewHtml(p.html, p.css, p.js));
        } else {
          setError('Project not found.');
        }
      })
      .catch(() => setError('Failed to load project.'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const runPreview = useCallback(() => {
    setPreviewSrc(buildPreviewHtml(htmlCode, cssCode, jsCode));
    setTab('preview');
    notify.success('Preview updated');
  }, [htmlCode, cssCode, jsCode]);

  async function saveChanges() {
    if (!project) return;
    setSaving(true);
    const updated = { ...project, html: htmlCode, css: cssCode, js: jsCode };
    const res = await fetch(`${API_BASE_URL}/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: htmlCode, css: cssCode, js: jsCode }),
    });
    setSaving(false);
    if (res.ok) {
      setProject(updated);
      notify.success('Project saved');
    } else {
      notify.warn('Save failed — changes kept locally');
    }
  }

  async function copy(text, key) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  }

  const codeByTab = { html: htmlCode, css: cssCode, js: jsCode };
  const setByTab  = { html: setHtmlCode, css: setCssCode, js: setJsCode };
  const langByTab = { html: 'html', css: 'css', js: 'js' };

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-65px)]">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-65px)] text-destructive gap-3">
      <div className="text-sm">{error}</div>
      <Link to="/tools/projects"><Button size="sm" variant="outline">Back to Projects</Button></Link>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-shrink-0 bg-card/50">
        <Link to="/tools/projects">
          <Button size="icon" variant="ghost" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="w-7 h-7 rounded-lg gradient-purple-blue flex items-center justify-center flex-shrink-0">
          <Eye className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold gradient-text truncate">{project?.project_name || 'Project Preview'}</h1>
          {project?.prompt && <div className="text-[10px] text-muted-foreground truncate">{project.prompt}</div>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {tab !== 'preview' && (
            <Button size="sm" variant="outline" onClick={() => copy(codeByTab[tab], tab)} className="h-7 text-xs gap-1">
              <Copy className="w-3 h-3" />
              {copied === tab ? 'Copied!' : 'Copy'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={runPreview} className="h-7 text-xs gap-1">
            <RefreshCw className="w-3 h-3" /> Run
          </Button>
          <Button size="sm" onClick={saveChanges} disabled={saving} className="h-7 text-xs gap-1 gradient-purple-blue text-white border-0">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5 flex-shrink-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { if (key === 'preview') runPreview(); else setTab(key); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === key ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'preview' ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewSrc}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin"
            title="Project Preview"
          />
        ) : (
          <div className="h-full flex flex-col">
            {/* Editor label bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/60 border-b border-border flex-shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{tab} — live editor</span>
              <span className="text-[10px] font-mono text-muted-foreground/60">Edit then click Run to refresh preview</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                key={tab}
                language={langByTab[tab]}
                value={codeByTab[tab]}
                onChange={setByTab[tab]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}