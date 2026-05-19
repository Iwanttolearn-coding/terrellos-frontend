import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { HardDrive, Upload, Trash2, Link2, Loader2, FileImage, FileText, FileCode, File, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import VersionHistory from '@/components/vault/VersionHistory';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS = {
  screenshot: FileImage,
  photo: FileImage,
  document: FileText,
  code: FileCode,
  other: File,
};

function guessType(mime = '') {
  if (mime.startsWith('image/')) return 'screenshot';
  if (mime === 'application/pdf' || mime.includes('text')) return 'document';
  if (mime.includes('javascript') || mime.includes('python') || mime.includes('json')) return 'code';
  return 'other';
}

export default function UploadVault() {
  const [uploads, setUploads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterProject, setFilterProject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [linkProjectId, setLinkProjectId] = useState('');
  const [versionTarget, setVersionTarget] = useState(null);
  const fileRef = useRef();

  const load = async () => {
    const [ups, ps] = await Promise.all([
      base44.entities.Upload.list('-created_date'),
      base44.entities.Project.list(),
    ]);
    setUploads(ups);
    setProjects(ps);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const type = guessType(file.type);

      // Check if a file with this name + project already exists (new version)
      const existing = uploads.find(u => u.file_name === file.name && u.project_id === (linkProjectId || ''));

      const upload = await base44.entities.Upload.create({
        file_name: file.name,
        file_url,
        file_type: type,
        file_size_kb: Math.round(file.size / 1024),
        mime_type: file.type,
        project_id: linkProjectId || '',
      });

      // Determine version number
      let nextVersion = 1;
      if (existing) {
        const prevVersions = await base44.entities.FileVersion.filter({ upload_id: existing.id });
        nextVersion = (prevVersions.length > 0 ? Math.max(...prevVersions.map(v => v.version_number || 0)) : 0) + 1;
        // Mark old current versions as not current
        for (const v of prevVersions.filter(v => v.is_current)) {
          await base44.entities.FileVersion.update(v.id, { is_current: false });
        }
      }

      // Create version record
      await base44.entities.FileVersion.create({
        upload_id: upload.id,
        project_id: linkProjectId || '',
        file_name: file.name,
        file_url,
        version_number: nextVersion,
        version_label: `v${nextVersion}.0`,
        change_summary: nextVersion === 1 ? 'Initial upload' : `Manual re-upload (version ${nextVersion})`,
        changed_by: 'user',
        source: 'manual_upload',
        is_current: true,
        diff_preview: `[UPLOAD] ${file.name} (${Math.round(file.size / 1024)} KB)`,
      });
    }
    setUploading(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Upload.delete(id);
    load();
  };

  const handleLink = async (uploadId, projectId) => {
    await base44.entities.Upload.update(uploadId, { project_id: projectId });
    load();
  };

  const filtered = uploads.filter(u => {
    if (filterProject && u.project_id !== filterProject) return false;
    if (filterType && u.file_type !== filterType) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 animate-fade-up">
      <PageHeader title="Upload Vault" subtitle="Screenshots, photos, documents, and code references" />

      {/* Upload zone */}
      <div
        className="card-glass rounded-2xl border-2 border-dashed border-primary/30 p-10 text-center mb-6 hover:border-primary/60 transition-colors duration-200 cursor-pointer"
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <input ref={fileRef} type="file" multiple className="hidden"
          accept="image/*,.pdf,.txt,.md,.js,.ts,.py,.json,.html,.css"
          onChange={e => handleFiles(e.target.files)} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground">Images, PDFs, text, code files</p>
          </div>
        )}
      </div>

      {/* Filters + link selector */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-44 bg-secondary/50 border-border text-foreground">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36 bg-secondary/50 border-border text-foreground">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All types</SelectItem>
            {['screenshot','photo','document','code','other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={linkProjectId} onValueChange={setLinkProjectId}>
          <SelectTrigger className="w-52 bg-secondary/50 border-border text-foreground">
            <SelectValue placeholder="Link uploads to project…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>No project link</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="card-glass rounded-2xl h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="No uploads yet."
          description="Upload screenshots, photos, documents, or code references. Attach them to your projects."
          action={<Button onClick={() => fileRef.current?.click()} className="gradient-purple-blue text-white font-semibold rounded-xl px-6">
            <Upload className="w-4 h-4 mr-2" /> Upload First File
          </Button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const Icon = TYPE_ICONS[u.file_type] || File;
            const proj = projects.find(p => p.id === u.project_id);
            return (
              <div key={u.id} className="card-glass rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors duration-150">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{u.file_name}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{u.file_type}</span>
                    {u.file_size_kb && <span>{u.file_size_kb} KB</span>}
                    {proj && <span className="text-primary">{proj.name}</span>}
                    <span>{u.created_date ? formatDistanceToNow(new Date(u.created_date), { addSuffix: true }) : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select value={u.project_id || ''} onValueChange={v => handleLink(u.id, v)}>
                    <SelectTrigger className="w-32 h-8 text-xs bg-secondary/50 border-border text-muted-foreground">
                      <SelectValue placeholder="Link project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>No link</SelectItem>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => setVersionTarget(u)}
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" title="Version history" aria-label="Version history">
                    <GitBranch className="w-4 h-4" />
                  </button>
                  <a href={u.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors" aria-label="View file">
                    <Link2 className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(u.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer" aria-label="Delete upload">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {versionTarget && (
        <VersionHistory upload={versionTarget} onClose={() => setVersionTarget(null)} />
      )}
    </div>
  );
}