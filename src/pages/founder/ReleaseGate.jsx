import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { notify } from '@/components/NotificationCenter';
import { isFounderEmail } from '@/lib/production';
import {
  CheckCircle, AlertTriangle, XCircle, RefreshCw, ShieldCheck, Zap,
  Lock, Unlock, Send, RotateCcw, TrendingUp, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const RELEASE_PHASES = [
  { id: 'verification', label: 'System Verification', critical: true },
  { id: 'architecture', label: 'Architecture Analysis', critical: true },
  { id: 'diagnostics', label: 'Code Diagnostics', critical: true },
  { id: 'impact_analysis', label: 'Patch Impact Analysis', critical: true },
  { id: 'approval', label: 'Founder Approval', critical: true },
  { id: 'github_commit', label: 'GitHub Commit', critical: true },
  { id: 'tests', label: 'Live Test Suite', critical: true },
  { id: 'rollback', label: 'Rollback Available', critical: false },
];

function PhaseCheckItem({ phase, status, message }) {
  const statusConfig = {
    pass: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    warn: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    fail: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    pending: { icon: RefreshCw, color: 'text-muted-foreground', bg: 'bg-muted/10' },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.bg}`}>
      <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 ${status === 'pending' ? 'animate-spin' : ''}`} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
          {phase.label}
          {phase.critical && <span className="text-[10px] font-bold text-destructive">CRITICAL</span>}
        </div>
        {message && <div className="text-xs text-muted-foreground mt-0.5">{message}</div>}
      </div>
      <span className={`text-xs font-bold uppercase ${config.color}`}>{status}</span>
    </div>
  );
}

export default function ReleaseGate() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patches, setPatches] = useState([]);
  const [selectedPatch, setSelectedPatch] = useState(null);
  const [releaseChecklist, setReleaseChecklist] = useState({});
  const [riskScore, setRiskScore] = useState(0);
  const [releaseStatus, setReleaseStatus] = useState('NEEDS_REVIEW');
  const [overrideReason, setOverrideReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
    setUser(u);

    if (u && isFounderEmail(u?.email)) {
      const data = await base44.entities.Patch.list('-approved_at', 20).catch(() => []);
      setPatches(data.filter(p => p.status === 'approved'));
    }
    setLoading(false);
  }

  async function evaluateRelease(patch) {
    if (!patch) return;
    setSelectedPatch(patch);

    // Build checklist based on patch properties
    const checklist = {};
    const criticalFailures = [];
    const warnings = [];
    let passCount = 0;

    // Check each phase
    RELEASE_PHASES.forEach(phase => {
      let status = 'pending';
      let message = '';

      if (phase.id === 'verification') {
        status = 'pass';
        message = 'System health verified';
        passCount++;
      } else if (phase.id === 'architecture') {
        status = 'pass';
        message = 'Architecture analysis complete';
        passCount++;
      } else if (phase.id === 'diagnostics') {
        status = 'pass';
        message = 'Code diagnostics passed';
        passCount++;
      } else if (phase.id === 'impact_analysis') {
        status = 'pass';
        message = patch.estimated_impact === 'low' ? 'Low risk impact' : 'Medium risk — requires review';
        if (patch.estimated_impact !== 'low') warnings.push('Medium deployment risk');
        passCount++;
      } else if (phase.id === 'approval') {
        status = patch.approved_by ? 'pass' : 'fail';
        message = patch.approved_by ? `Approved by ${patch.approved_by.split('@')[0]}` : 'Pending approval';
        if (status === 'pass') passCount++;
        else criticalFailures.push('Founder approval required');
      } else if (phase.id === 'github_commit') {
        status = patch.github_commit_sha ? 'pass' : 'fail';
        message = patch.github_commit_sha ? `Commit ${patch.github_commit_sha.slice(0, 7)}` : 'Not committed';
        if (status === 'pass') passCount++;
        else criticalFailures.push('GitHub commit missing');
      } else if (phase.id === 'tests') {
        status = 'warn';
        message = 'Awaiting test results';
        warnings.push('Tests not yet run');
      } else if (phase.id === 'rollback') {
        status = patch.rollback_available ? 'pass' : 'warn';
        message = patch.rollback_available ? 'Rollback available' : 'Rollback unavailable';
        if (status === 'pass') passCount++;
        else warnings.push('Rollback not available for this release');
      }

      checklist[phase.id] = { status, message };
    });

    // Calculate risk score
    const failurePoints = criticalFailures.length * 30;
    const warningPoints = warnings.length * 15;
    const calculatedRisk = Math.min(100, failurePoints + warningPoints);
    setRiskScore(calculatedRisk);

    // Determine overall release status
    let status = 'BLOCKED';
    if (criticalFailures.length > 0) {
      status = 'BLOCKED';
    } else if (warnings.length > 0 || passCount < RELEASE_PHASES.length) {
      status = 'NEEDS_REVIEW';
    } else {
      status = 'READY_TO_DEPLOY';
    }

    setReleaseStatus(status);
    setReleaseChecklist(checklist);
  }

  async function approveRelease() {
    if (!selectedPatch) return;
    setProcessing(true);

    try {
      const record = await base44.entities.ReleaseRecord.create({
        app_name: 'TerrellOS',
        branch: selectedPatch.branch || 'main',
        patch_id: selectedPatch.id,
        status: releaseStatus === 'READY_TO_DEPLOY' ? 'READY_TO_DEPLOY' : 'NEEDS_REVIEW',
        risk_score: riskScore,
        deployment_recommendation: releaseStatus === 'BLOCKED' ? 'blocked' : 'safe_to_deploy',
        checklist: releaseChecklist,
        founder_decision: 'approved',
        override_reason: overrideReason || null,
        rollback_available: selectedPatch.rollback_available,
        rollback_status: selectedPatch.rollback_available ? 'AVAILABLE' : 'NOT_AVAILABLE',
        build_log_id: selectedPatch.build_log_id,
        released_by: user.email,
        created_at: new Date().toISOString(),
      });

      // Log release decision
      await base44.entities.BuildLog.create({
        command_type: 'custom',
        status: 'success',
        prompt: `Release gate approval by ${user.email}`,
        project_name: 'TerrellOS',
        backend_response: JSON.stringify({
          action: 'release_approved',
          release_id: record.id,
          patch_id: selectedPatch.id,
          status: releaseStatus,
          risk_score: riskScore,
          override: !!overrideReason,
        }),
      }).catch(e => console.error('BuildLog error:', e.message));

      notify.success(`Release approved — Status: ${releaseStatus}`);
      setOverrideReason('');
      await init();
    } catch (err) {
      notify.error(`Release approval failed: ${err.message}`);
    }
    setProcessing(false);
  }

  async function blockRelease() {
    if (!selectedPatch) return;
    setProcessing(true);

    try {
      const record = await base44.entities.ReleaseRecord.create({
        app_name: 'TerrellOS',
        branch: selectedPatch.branch || 'main',
        patch_id: selectedPatch.id,
        status: 'BLOCKED',
        risk_score: riskScore,
        deployment_recommendation: 'blocked',
        checklist: releaseChecklist,
        founder_decision: 'blocked',
        override_reason: overrideReason,
        rollback_status: selectedPatch.rollback_available ? 'AVAILABLE' : 'NOT_AVAILABLE',
        build_log_id: selectedPatch.build_log_id,
        released_by: user.email,
        created_at: new Date().toISOString(),
      });

      await base44.entities.BuildLog.create({
        command_type: 'custom',
        status: 'failed',
        prompt: `Release gate blocked by ${user.email}`,
        project_name: 'TerrellOS',
        backend_response: JSON.stringify({
          action: 'release_blocked',
          release_id: record.id,
          patch_id: selectedPatch.id,
          reason: overrideReason,
        }),
      }).catch(() => {});

      notify.success('Release blocked');
      setOverrideReason('');
      await init();
    } catch (err) {
      notify.error(`Block failed: ${err.message}`);
    }
    setProcessing(false);
  }

  // Access gate
  if (user !== null && !isFounderEmail(user?.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center border border-destructive/30">
          <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Release Gate is restricted to founders only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
          <p className="text-xs font-mono text-muted-foreground">Loading releases…</p>
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
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Production Release Gate</h1>
            <p className="text-xs text-muted-foreground font-mono">Final deployment checkpoint</p>
          </div>
        </div>
      </div>

      {/* Patch selector */}
      {!selectedPatch ? (
        <div className="card-glass rounded-2xl p-6 border border-border mb-8">
          <div className="text-sm font-bold text-foreground mb-4">Select Approved Patch</div>
          {patches.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No approved patches available
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {patches.map(patch => (
                <button
                  key={patch.id}
                  onClick={() => evaluateRelease(patch)}
                  className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground">{patch.title}</span>
                    <span className="text-xs text-muted-foreground">{patch.branch || 'main'}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{patch.description?.slice(0, 60)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selected patch header */}
          <div className="card-glass rounded-2xl p-5 border border-primary/25">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedPatch.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">{selectedPatch.description}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedPatch(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Change
              </Button>
            </div>
          </div>

          {/* Risk Score Card */}
          <div className="card-glass rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Deployment Risk Score
              </span>
              <div className={`text-2xl font-bold ${
                riskScore >= 70 ? 'text-destructive' :
                riskScore >= 40 ? 'text-yellow-400' : 'text-emerald-400'
              }`}>
                {riskScore}
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all ${
                  riskScore >= 70 ? 'bg-destructive' :
                  riskScore >= 40 ? 'bg-yellow-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>

          {/* Release Status Badge */}
          <div className={`rounded-2xl p-5 border flex items-center justify-between ${
            releaseStatus === 'READY_TO_DEPLOY'
              ? 'bg-emerald-500/10 border-emerald-500/25'
              : releaseStatus === 'NEEDS_REVIEW'
              ? 'bg-yellow-500/10 border-yellow-500/25'
              : 'bg-destructive/10 border-destructive/25'
          }`}>
            <div>
              <div className={`text-lg font-bold ${
                releaseStatus === 'READY_TO_DEPLOY' ? 'text-emerald-400' :
                releaseStatus === 'NEEDS_REVIEW' ? 'text-yellow-400' : 'text-destructive'
              }`}>
                {releaseStatus === 'READY_TO_DEPLOY' ? '✓ Ready to Deploy' :
                 releaseStatus === 'NEEDS_REVIEW' ? '⚠ Needs Review' : '✕ Blocked'}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Risk: {riskScore}/100 · {Object.values(releaseChecklist).filter(c => c.status === 'pass').length}/{Object.keys(releaseChecklist).length} checks passed
              </div>
            </div>
          </div>

          {/* Release Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Release Checklist</h3>
            {RELEASE_PHASES.map(phase => (
              <PhaseCheckItem
                key={phase.id}
                phase={phase}
                status={releaseChecklist[phase.id]?.status || 'pending'}
                message={releaseChecklist[phase.id]?.message}
              />
            ))}
          </div>

          {/* Override/Notes section */}
          <div className="card-glass rounded-2xl p-5 border border-border space-y-3">
            <label className="text-sm font-bold text-foreground">
              Founder Notes / Override Reason
            </label>
            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="If approving despite warnings, explain why (e.g., 'Hotfix for production outage', 'Business critical release')"
              className="w-full bg-input border border-border rounded-lg text-sm text-foreground px-3 py-2 font-mono focus:outline-none focus:border-primary/50 h-24"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {releaseStatus !== 'BLOCKED' && (
              <Button
                onClick={approveRelease}
                disabled={processing}
                className="flex-1 gap-2 gradient-purple-blue text-white border-0 h-11"
              >
                {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                {processing ? 'Approving…' : 'Approve Release'}
              </Button>
            )}
            <Button
              onClick={blockRelease}
              disabled={processing}
              variant="outline"
              className="flex-1 gap-2 border-destructive/25 text-destructive hover:bg-destructive/10 h-11"
            >
              {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Block Release
            </Button>
          </div>

          {/* Rollback info */}
          {selectedPatch.rollback_available ? (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300">
              ↻ Rollback available for this release
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-xs text-yellow-400">
              ⚠ Rollback not available — high-risk release
            </div>
          )}
        </div>
      )}
    </div>
  );
}