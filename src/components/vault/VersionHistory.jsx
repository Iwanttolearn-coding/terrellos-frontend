import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { GitBranch, RotateCcw, Eye, ChevronDown, ChevronUp, Loader2, Clock, GitCommit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const SOURCE_BADGE = {
  manual_upload: { label: 'Upload', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  ai_builder:    { label: 'AI Builder', color: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  github_push:   { label: 'GitHub', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  revert:        { label: 'Revert', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
};

export default function VersionHistory({ upload, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    const vs = await base44.entities.FileVersion.filter({ upload_id: upload.id }, '-version_number');
    setVersions(vs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [upload.id]);

  const handleRevert = async (version) => {
    setReverting(version.id);
    // Mark all existing versions as not current
    for (const v of versions.filter(v => v.is_current)) {
      await base44.entities.FileVersion.update(v.id, { is_current: false });
    }
    // Create a new version entry representing the revert
    const nextVersion = Math.max(...versions.map(v => v.version_number || 0)) + 1;
    await base44.entities.FileVersion.create({
      upload_id: upload.id,
      project_id: upload.project_id,
      file_name: upload.file_name,
      file_url: version.file_url,
      version_number: nextVersion,
      version_label: `v${nextVersion}.0`,
      change_summary: `Reverted to ${version.version_label || `v${version.version_number}`}`,
      changed_by: 'user',
      source: 'revert',
      is_current: true,
      diff_preview: `Reverted from current → ${version.version_label || `v${version.version_number}`}`,
    });
    // Update the Upload record to point to reverted file
    await base44.entities.Upload.update(upload.id, { file_url: version.file_url });
    await load();
    setReverting(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card-glass rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{upload.file_name}</div>
            <div className="text-xs text-muted-foreground">{versions.length} version{versions.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none px-1">×</button>
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No version history yet. Future uploads of this file will be tracked here.
            </div>
          ) : (
            versions.map((v, i) => {
              const badge = SOURCE_BADGE[v.source] || SOURCE_BADGE.manual_upload;
              const isOpen = expanded === v.id;
              return (
                <div key={v.id} className={`rounded-xl border transition-all ${v.is_current ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/20'}`}>
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <GitCommit className={`w-4 h-4 ${v.is_current ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-mono font-bold ${v.is_current ? 'text-primary' : 'text-muted-foreground'}`}>
                        {v.version_label || `v${v.version_number}`}
                      </span>
                    </div>
                    {v.is_current && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-primary/15 text-primary border-primary/25">CURRENT</span>
                    )}
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badge.color}`}>{badge.label}</span>
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {v.created_date ? formatDistanceToNow(new Date(v.created_date), { addSuffix: true }) : '—'}
                    </span>
                    <button
                      onClick={() => setExpanded(isOpen ? null : v.id)}
                      className="text-muted-foreground hover:text-foreground ml-1"
                    >
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-3 border-t border-border/50 mt-1 pt-3 space-y-2">
                      {v.change_summary && (
                        <p className="text-xs text-muted-foreground">{v.change_summary}</p>
                      )}
                      {v.github_commit_sha && (
                        <div className="text-xs font-mono text-muted-foreground">
                          SHA: <span className="text-foreground">{v.github_commit_sha.slice(0, 12)}</span>
                        </div>
                      )}
                      {v.diff_preview && (
                        <pre className="text-xs bg-secondary/40 rounded-lg p-2 font-mono text-muted-foreground overflow-x-auto">{v.diff_preview}</pre>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        {v.file_url && (
                          <a href={v.file_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <Eye className="w-3 h-3 mr-1" /> View
                            </Button>
                          </a>
                        )}
                        {!v.is_current && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                            disabled={!!reverting}
                            onClick={() => handleRevert(v)}
                          >
                            {reverting === v.id
                              ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              : <RotateCcw className="w-3 h-3 mr-1" />}
                            Revert to this version
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}