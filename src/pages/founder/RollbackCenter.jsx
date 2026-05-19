import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { notify } from '@/components/NotificationCenter';
import { isFounderEmail } from '@/lib/production';
import {
  RotateCcw, CheckCircle, XCircle, AlertTriangle, RefreshCw, GitBranch,
  Eye, Download, ShieldCheck, Clock, Zap, FileText, Lock, Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const ROLLBACK_STATUSES = {
  AVAILABLE: { icon: Unlock, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  PARTIAL: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/25' },
  NOT_AVAILABLE: { icon: Lock, color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-muted/25' },
  FAILED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/25' },
};

function RollbackBadge({ status }) {
  const config = ROLLBACK_STATUSES[status] || ROLLBACK_STATUSES.NOT_AVAILABLE;
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${config.bg} ${config.border}`}>
      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      <span className={`text-xs font-bold ${config.color}`}>{status}</span>
    </div>
  );
}

function PatchAuditCard({ patch, onViewDetails, onInitiateRollback }) {
  const isApproved = patch.status === 'approved';
  const hasCommitSha = !!patch.github_commit_sha;
  const canRollback = isApproved && hasCommitSha;

  const affectedFileCount = (patch.steps || []).reduce((acc, step) => {
    if (step.file && !acc.includes(step.file)) acc.push(step.file);
    return acc;
  }, []).length;

  const riskColor = patch.estimated_impact === 'high' ? 'text-destructive' :
                    patch.estimated_impact === 'medium' ? 'text-yellow-400' : 'text-emerald-400';

  return (
    <div className="card-glass rounded-xl p-4 border border-border hover:border-primary/30 transition-colors space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-foreground truncate">{patch.title}</span>
            {isApproved ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : patch.status === 'rejected' ? (
              <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            )}
          </div>
          <div className="text-xs text-muted-foreground font-mono">{patch.description?.slice(0, 60)}</div>
        </div>
        <RollbackBadge status={canRollback ? 'AVAILABLE' : patch.status === 'rejected' ? 'NOT_AVAILABLE' : 'PARTIAL'} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-background/50 rounded p-2 text-center">
          <div className="font-bold text-foreground">{affectedFileCount}</div>
          <div className="text-muted-foreground text-[10px]">Files</div>
        </div>
        <div className="bg-background/50 rounded p-2 text-center">
          <div className={`font-bold ${riskColor}`}>{(patch.estimated_impact || 'low').toUpperCase()}</div>
          <div className="text-muted-foreground text-[10px]">Risk</div>
        </div>
        <div className="bg-background/50 rounded p-2 text-center">
          <div className="font-bold text-foreground">{(patch.steps || []).length}</div>
          <div className="text-muted-foreground text-[10px]">Steps</div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {patch.approved_at && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Approved {formatDistanceToNow(new Date(patch.approved_at), { addSuffix: true })}</span>
            {patch.approved_by && <span className="ml-auto font-mono text-[10px]">{patch.approved_by.split('@')[0]}</span>}
          </div>
        )}
        {patch.applied_at && (
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Applied {formatDistanceToNow(new Date(patch.applied_at), { addSuffix: true })}</span>
          </div>
        )}
        {patch.github_commit_sha && (
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="font-mono text-[10px]">{patch.github_commit_sha.slice(0, 7)}</span>
            {patch.rollback_available && <span className="ml-auto text-emerald-400">↻ Reversible</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border/50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetails?.(patch)}
          className="flex-1 h-7 text-xs gap-1"
        >
          <Eye className="w-3 h-3" /> Details
        </Button>
        {canRollback && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInitiateRollback?.(patch)}
            className="flex-1 h-7 text-xs gap-1 border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/10"
          >
            <RotateCcw className="w-3 h-3" /> Rollback
          </Button>
        )}
      </div>
    </div>
  );
}

function PatchDetailsModal({ patch, onClose }) {
  if (!patch) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-glass rounded-2xl border border-primary/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" /> Patch Details
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Header info */}
          <div className="space-y-2">
            <div className="text-lg font-bold text-foreground">{patch.title}</div>
            <p className="text-sm text-muted-foreground">{patch.description}</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Status</span>
              <div className="font-mono font-bold text-primary capitalize">{patch.status}</div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Risk Level</span>
              <div className="font-mono font-bold text-foreground capitalize">{patch.estimated_impact}</div>
            </div>
            {patch.approved_by && (
              <div>
                <span className="text-muted-foreground text-xs">Approved By</span>
                <div className="font-mono text-xs text-foreground">{patch.approved_by}</div>
              </div>
            )}
            {patch.github_commit_sha && (
              <div>
                <span className="text-muted-foreground text-xs">Commit SHA</span>
                <div className="font-mono text-xs text-blue-400">{patch.github_commit_sha.slice(0, 12)}</div>
              </div>
            )}
          </div>

          {/* Steps */}
          {patch.steps?.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Patch Steps</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {patch.steps.map((step, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-background/50 border border-border/50 font-mono text-muted-foreground">
                    <div className="font-bold text-foreground mb-0.5">{step.file}</div>
                    <div className="text-[10px]">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BuildLog link */}
          {patch.build_log_id && (
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/25">
              <a
                href={`#build-log-${patch.build_log_id}`}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> View Build Log
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RollbackCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patches, setPatches] = useState([]);
  const [selectedPatch, setSelectedPatch] = useState(null);
  const [filter, setFilter] = useState('all'); // all, approved, rejected, available
  const [initiatingRollback, setInitiatingRollback] = useState(false);
  const [rollbackPatch, setRollbackPatch] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    setUser(u);

    if (u && isFounderEmail(u?.email)) {
      const data = await base44.entities.Patch.list('-created_date', 50).catch(() => []);
      setPatches(data);
    }
    setLoading(false);
  }

  const filteredPatches = patches.filter(p => {
    if (filter === 'approved') return p.status === 'approved';
    if (filter === 'rejected') return p.status === 'rejected';
    if (filter === 'available') return p.status === 'approved' && p.github_commit_sha && p.rollback_available;
    return true;
  });

  async function initiateRollback(patch) {
    setInitiatingRollback(true);
    try {
      const res = await safeInvoke('generateRollbackPatch', {
        originalPatchId: patch.id,
        repo: patch.repo,
        branch: patch.branch,
        commitSha: patch.github_commit_sha,
      });

      if (res.data?.error) {
        notify.error(res.data.error);
      } else {
        setRollbackPatch(res.data);
        notify.success('Rollback patch generated — awaiting founder approval');
      }
    } catch (err) {
      notify.error(`Rollback generation failed: ${err.message}`);
    }
    setInitiatingRollback(false);
  }

  // Access gate
  if (user !== null && !isFounderEmail(user?.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center border border-destructive/30">
          <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Rollback Center is restricted to TerrellOS founders only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
          <p className="text-xs font-mono text-muted-foreground">Loading patch history…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple flex-shrink-0">
            <RotateCcw className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Patch Audit Trail & Rollback</h1>
            <p className="text-xs text-muted-foreground font-mono">Trace · Review · Reverse — Full auditability</p>
          </div>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all', label: 'All Patches', count: patches.length },
          { value: 'approved', label: 'Approved', count: patches.filter(p => p.status === 'approved').length },
          { value: 'rejected', label: 'Rejected', count: patches.filter(p => p.status === 'rejected').length },
          { value: 'available', label: 'Rollback Available', count: patches.filter(p => p.status === 'approved' && p.rollback_available).length },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {f.label} <span className="ml-1 opacity-60">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Patch grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {filteredPatches.length === 0 ? (
          <div className="col-span-full card-glass rounded-2xl p-12 border border-border text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No patches found</p>
            <p className="text-xs text-muted-foreground mt-1">Patches will appear here once they're created</p>
          </div>
        ) : (
          filteredPatches.map(patch => (
            <PatchAuditCard
              key={patch.id}
              patch={patch}
              onViewDetails={setSelectedPatch}
              onInitiateRollback={initiateRollback}
            />
          ))
        )}
      </div>

      {/* Rollback generation feedback */}
      {rollbackPatch && (
        <div className="card-glass rounded-2xl p-5 border border-yellow-500/25 bg-yellow-500/5">
          <div className="text-sm font-bold text-yellow-400 mb-3">↻ Rollback Patch Generated</div>
          <p className="text-xs text-muted-foreground mb-3">
            Review the rollback plan below. Founder approval is required before applying to GitHub.
          </p>
          <pre className="text-[10px] font-mono bg-background/50 p-3 rounded border border-border/50 overflow-x-auto max-h-48 overflow-y-auto">
            {JSON.stringify(rollbackPatch, null, 2)}
          </pre>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" onClick={() => setRollbackPatch(null)} className="text-xs h-8">
              Dismiss
            </Button>
            <Button className="text-xs h-8 gradient-purple-blue text-white border-0">
              Approve Rollback
            </Button>
          </div>
        </div>
      )}

      {/* Details modal */}
      {selectedPatch && (
        <PatchDetailsModal patch={selectedPatch} onClose={() => setSelectedPatch(null)} />
      )}
    </div>
  );
}