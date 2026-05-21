import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { notify } from '@/components/NotificationCenter';
import { isOwnerEmail } from '@/lib/ownerConfig';
import {
  ShieldCheck, CheckCircle, AlertTriangle, XCircle, RefreshCw, Wrench,
  GitBranch, Code, Database, Terminal, Eye, EyeOff, Clock, ExternalLink, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import WorkflowStatusBar from '@/components/WorkflowStatusBar';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const FOUNDER_EMAILS = ['millzterrell210@icloud.com', 'millzterrell5@gmail.com'];

function VerificationCard({ category, status, detail, error }) {
  const icons = {
    PASS: CheckCircle,
    FAIL: XCircle,
    WARN: AlertTriangle,
  };
  const colors = {
    PASS: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    FAIL: 'bg-destructive/10 border-destructive/25 text-destructive',
    WARN: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400',
  };
  const Icon = icons[status];

  return (
    <div className={`rounded-lg border p-3.5 flex items-start gap-3 ${colors[status]}`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{category}</span>
          <span className="text-[10px] font-mono font-bold uppercase">{status}</span>
        </div>
        <p className="text-xs leading-snug">{detail}</p>
        {error && (
          <p className="text-[10px] font-mono text-muted-foreground mt-1.5 opacity-75">{error}</p>
        )}
      </div>
    </div>
  );
}

export default function PatchCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState(null);
  const [patches, setPatches] = useState([]);
  const [patchesLoading, setPatchesLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState('base44dev/terrellosbuild');
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);

  useEffect(() => {
    init();
    loadWorkflows();
  }, []);

  async function init() {
    setLoading(true);
    const u = await Promise.resolve(loadUser()).catch(() => null);
    setUser(u);
    setLoading(false);
    
    if (u && FOUNDER_EMAILS.includes(u.email?.toLowerCase())) {
      loadPatches();
    }
  }

  async function loadPatches() {
    setPatchesLoading(true);
    const data = await base44.entities.Patch.list('-created_date', 20).catch(() => []);
    setPatches(data);
    setPatchesLoading(false);
  }

  async function loadWorkflows() {
    const data = await base44.entities.WorkflowState.list('-updated_at', 10).catch(() => []);
    setWorkflows(data);
    if (data.length > 0) setActiveWorkflow(data[0]);
  }

  async function createNewWorkflow() {
    setCreatingWorkflow(true);
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const workflow = await base44.entities.WorkflowState.create({
        session_id: sessionId,
        repo: selectedRepo,
        branch: 'develop',
        current_phase: 'verification',
        phase_status: {
          verification: 'READY',
          architecture_analysis: 'LOCKED',
          code_diagnostics: 'LOCKED',
          patch_impact: 'LOCKED',
          patch_generation: 'LOCKED',
          founder_review: 'LOCKED',
          founder_approval: 'LOCKED',
          patch_branch_creation: 'LOCKED',
          commit: 'LOCKED',
          log_and_finish: 'LOCKED',
        },
        phase_blocking_reasons: {
          architecture_analysis: ['Run System Verification first'],
          code_diagnostics: ['Run System Verification and Architecture Analysis first'],
          patch_impact: ['Run Code Diagnostics first'],
          patch_generation: ['Complete prerequisites first'],
          founder_review: ['Generate patch plan first'],
          founder_approval: ['Complete patch generation and impact analysis'],
          patch_branch_creation: ['Get founder approval first'],
          commit: ['Create patch branch first'],
          log_and_finish: ['Complete commit first'],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        initiated_by: user.email,
      });
      setActiveWorkflow(workflow);
      setWorkflows([workflow, ...workflows]);
      notify.success('New workflow session created');
    } catch (err) {
      notify.error(`Workflow creation failed: ${err.message}`);
    }
    setCreatingWorkflow(false);
  }

  async function runVerification() {
    setVerifying(true);
    setVerificationResults(null);
    try {
      const res = await safeInvoke('verifyPatchSystem', {
        repo: selectedRepo,
      });
      setVerificationResults(res.data);
      
      const failCount = res.data.summary?.fail || 0;
      if (failCount === 0) {
        notify.success(`System verification passed: ${res.data.summary.pass} checks`);
      } else {
        notify.warn(`Verification complete: ${failCount} critical issues found`);
      }
    } catch (err) {
      notify.error(`Verification failed: ${err.message}`);
      setVerificationResults({
        error: err.message,
        summary: { pass: 0, warn: 0, fail: 999, overall: 'CRITICAL' },
      });
    }
    setVerifying(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-xs font-mono text-muted-foreground tracking-widest">AUTHENTICATING…</p>
        </div>
      </div>
    );
  }

  // Access gate
  if (!user || !FOUNDER_EMAILS.includes(user.email?.toLowerCase())) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center border border-destructive/30">
          <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">This area is restricted to TerrellOS founders only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple flex-shrink-0">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Patch Center</h1>
            <p className="text-xs text-muted-foreground font-mono">Approve & Deploy Safe Code Patches</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={runVerification}
            disabled={verifying}
            className="gap-2 gradient-purple-blue text-white border-0"
            size="sm"
          >
            {verifying ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying…</>
            ) : (
              <><ShieldCheck className="w-3.5 h-3.5" /> Run Verification</>
            )}
          </Button>
          <Button
            onClick={() => setShowTokenWarning(!showTokenWarning)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {showTokenWarning ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showTokenWarning ? 'Hide' : 'Show'} Security Info
          </Button>
        </div>
      </div>

      {/* ─── Token Warning (when toggled) ─── */}
      {showTokenWarning && (
        <div className="card-glass rounded-2xl p-4 border border-yellow-500/30 bg-yellow-500/10 mb-8 text-yellow-300 text-xs space-y-2">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Security Verification Checklist
          </div>
          <ul className="space-y-1 ml-6 list-disc text-muted-foreground">
            <li><span className="text-yellow-300 font-bold">Token Never in Frontend</span> — GITHUB_TOKEN is backend-only, not sent to browser</li>
            <li><span className="text-yellow-300 font-bold">No Token in Logs</span> — All sensitive values redacted in BuildLog before storage</li>
            <li><span className="text-yellow-300 font-bold">Founder-Only Access</span> — Patch approval requires email whitelist verification</li>
            <li><span className="text-yellow-300 font-bold">Approval Gate</span> — Patches require manual step-by-step approval before GitHub commit</li>
            <li><span className="text-yellow-300 font-bold">Error Logging</span> — Real errors logged to BuildLog, never token/secret content</li>
            <li><span className="text-yellow-300 font-bold">Rollback Ready</span> — Each commit SHA stored for manual rollback if needed</li>
          </ul>
        </div>
      )}

      {/* ─── Active Workflow Status ─── */}
      {activeWorkflow && (
        <div className="mb-8">
          <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Patch Workflow Pipeline</div>
          <WorkflowStatusBar workflow={activeWorkflow} />
        </div>
      )}

      {/* ─── Create New Workflow ─── */}
      {!activeWorkflow && (
        <div className="card-glass rounded-2xl p-6 border border-border mb-8 text-center">
          <Plus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No active workflow</p>
          <p className="text-xs text-muted-foreground mb-4">Start a new patch workflow to begin the safe engineering process</p>
          <Button
            onClick={createNewWorkflow}
            disabled={creatingWorkflow}
            className="gap-2 gradient-purple-blue text-white border-0"
          >
            {creatingWorkflow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {creatingWorkflow ? 'Creating…' : 'Start New Workflow'}
          </Button>
        </div>
      )}

      {/* ─── System Verification Section ─── */}
      <div className="mb-8">
        <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">System Verification Status</div>
        
        {!verificationResults ? (
          <div className="card-glass rounded-2xl p-8 border border-border text-center">
            <Terminal className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No verification run yet</p>
            <p className="text-xs text-muted-foreground mb-4">Press "Run Verification" to check all systems</p>
            <Button onClick={runVerification} size="sm" className="gradient-purple-blue text-white border-0">
              <ShieldCheck className="w-3.5 h-3.5" /> Start Verification
            </Button>
          </div>
        ) : verificationResults.error ? (
          <div className="card-glass rounded-2xl p-6 border border-destructive/30 bg-destructive/10">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-destructive mb-1">Verification Failed</h3>
                <p className="text-sm text-muted-foreground font-mono">{verificationResults.error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary banner */}
            <div className={`rounded-xl p-4 border flex items-center justify-between ${
              verificationResults.summary.overall === 'HEALTHY'
                ? 'bg-emerald-500/10 border-emerald-500/25'
                : verificationResults.summary.overall === 'DEGRADED'
                ? 'bg-yellow-500/10 border-yellow-500/25'
                : 'bg-destructive/10 border-destructive/25'
            }`}>
              <div className="flex items-center gap-3">
                {verificationResults.summary.overall === 'HEALTHY' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : verificationResults.summary.overall === 'DEGRADED' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <div>
                  <span className="font-bold text-sm">
                    {verificationResults.summary.overall === 'HEALTHY'
                      ? '✓ All Systems Healthy'
                      : verificationResults.summary.overall === 'DEGRADED'
                      ? '⚠ Some Issues Detected'
                      : '✗ Critical Issues Found'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {verificationResults.summary.pass} PASS · {verificationResults.summary.warn} WARN · {verificationResults.summary.fail} FAIL
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {new Date(verificationResults.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Verification checks grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {verificationResults.checks?.map((check, i) => (
                <VerificationCard
                  key={i}
                  category={check.category}
                  status={check.status}
                  detail={check.detail}
                  error={check.error}
                />
              ))}
            </div>

            {/* Action buttons */}
            {verificationResults.summary.overall === 'HEALTHY' && (
              <div className="card-glass rounded-xl p-4 border border-emerald-500/25 bg-emerald-500/5">
                <p className="text-xs text-emerald-300 mb-3">
                  ✓ System verification passed. Ready to scan, generate, and apply patches.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <a href="/founder/code-diagnostics">
                    <Button size="sm" className="gap-2 gradient-purple-blue text-white border-0">
                      <Code className="w-3.5 h-3.5" /> Go to Code Diagnostics
                    </Button>
                  </a>
                  <Button
                    onClick={runVerification}
                    disabled={verifying}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-verify
                  </Button>
                </div>
              </div>
            )}

            {verificationResults.summary.fail > 0 && (
              <div className="card-glass rounded-xl p-4 border border-destructive/25 bg-destructive/5">
                <p className="text-xs text-destructive mb-3">
                  ✗ Critical issues must be fixed before patch operations.
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Check the failed items above and resolve:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  {verificationResults.checks?.filter(c => c.status === 'FAIL').map((check, i) => (
                    <li key={i}>{check.category}: {check.error || check.detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Repository Config ─── */}
      <div className="mb-8">
        <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Repository Configuration</div>
        <div className="card-glass rounded-xl p-4 border border-border">
          <label className="text-xs text-muted-foreground mb-2 block">Target Repository</label>
          <div className="flex gap-2">
            <input
              value={selectedRepo}
              onChange={e => setSelectedRepo(e.target.value)}
              placeholder="owner/repo"
              className="flex-1 bg-input border border-border rounded-lg text-sm text-foreground px-3 py-2 font-mono focus:outline-none focus:border-primary/50"
            />
            <Button
              onClick={() => runVerification()}
              disabled={verifying || !selectedRepo.includes('/')}
              size="sm"
              className="gradient-purple-blue text-white border-0"
            >
              {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Recent Patches ─── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Patch History</div>
          <Button
            onClick={loadPatches}
            disabled={patchesLoading}
            size="sm"
            variant="ghost"
            className="h-6 text-xs gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${patchesLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {patchesLoading ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Loading patches…</div>
        ) : patches.length === 0 ? (
          <div className="card-glass rounded-xl p-6 border border-border text-center">
            <Database className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No patches yet. Run Code Diagnostics to generate patches.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {patches.map(patch => (
              <div key={patch.id} className="card-glass rounded-lg p-3.5 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground leading-tight">{patch.title}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{patch.repo} @ {patch.branch}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${
                    patch.status === 'applied'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : patch.status === 'approved'
                      ? 'bg-blue-500/20 text-blue-400'
                      : patch.status === 'rejected'
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {patch.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`flex items-center gap-1 ${
                    patch.estimated_impact === 'low'
                      ? 'text-emerald-400'
                      : patch.estimated_impact === 'medium'
                      ? 'text-yellow-400'
                      : 'text-destructive'
                  }`}>
                    {patch.estimated_impact?.toUpperCase()} IMPACT
                  </span>
                  <span className="text-muted-foreground">
                    {patch.created_date ? formatDistanceToNow(new Date(patch.created_date), { addSuffix: true }) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}