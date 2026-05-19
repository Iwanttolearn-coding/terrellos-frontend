import { CheckCircle, AlertTriangle, Lock, Clock, Play, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASES = [
  { id: 'verification', label: 'Verify System', short: 'VERIFY' },
  { id: 'architecture_analysis', label: 'Analyze Arch', short: 'ARCH' },
  { id: 'code_diagnostics', label: 'Scan Code', short: 'SCAN' },
  { id: 'patch_impact', label: 'Analyze Impact', short: 'IMPACT' },
  { id: 'patch_generation', label: 'Generate Plan', short: 'PLAN' },
  { id: 'founder_review', label: 'Review', short: 'REVIEW' },
  { id: 'founder_approval', label: 'Approve', short: 'APPROVE' },
  { id: 'patch_branch_creation', label: 'Create Branch', short: 'BRANCH' },
  { id: 'commit', label: 'Commit', short: 'COMMIT' },
  { id: 'log_and_finish', label: 'Finish', short: 'FINISH' },
];

function PhaseButton({ phase, status, blockingReasons, isActive, onClick }) {
  const statusConfig = {
    LOCKED: { icon: Lock, color: 'bg-muted/20 border-muted/30 text-muted-foreground cursor-not-allowed' },
    READY: { icon: Clock, color: 'bg-blue-500/10 border-blue-500/25 text-blue-400 cursor-pointer hover:bg-blue-500/20' },
    RUNNING: { icon: Play, color: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400 animate-pulse' },
    PASS: { icon: CheckCircle, color: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' },
    WARN: { icon: AlertTriangle, color: 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400' },
    FAIL: { icon: XCircle, color: 'bg-destructive/10 border-destructive/25 text-destructive' },
  };

  const config = statusConfig[status] || statusConfig.LOCKED;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        disabled={status === 'LOCKED'}
        title={blockingReasons?.join(', ') || status}
        className={cn(
          'flex flex-col items-center justify-center w-14 h-14 rounded-lg border transition-all',
          config.color,
          isActive && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        <Icon className="w-5 h-5" />
      </button>
      <div className="text-center">
        <div className="text-[10px] font-mono font-bold uppercase text-muted-foreground whitespace-nowrap">
          {phase.short}
        </div>
        <div className="text-[9px] text-muted-foreground/60">{status}</div>
      </div>
      {blockingReasons?.length > 0 && (
        <div className="text-[8px] text-destructive font-bold mt-0.5 text-center max-w-[60px]">
          {blockingReasons[0].split(' ')[0]}
        </div>
      )}
    </div>
  );
}

export default function WorkflowStatusBar({ workflow, onPhaseClick }) {
  if (!workflow) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        No workflow session active
      </div>
    );
  }

  const phaseStatuses = workflow.phase_status || {};
  const currentPhase = workflow.current_phase;

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="card-glass rounded-lg p-3 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground">Workflow Status</span>
          <span className="text-[10px] font-mono text-muted-foreground">{workflow.session_id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs">
            Phase: <span className="font-bold text-primary">{currentPhase?.replace(/_/g, ' ').toUpperCase()}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {Object.values(phaseStatuses).filter(s => s === 'PASS').length} / {PHASES.length}
          </span>
        </div>
        {workflow.workflow_error && (
          <div className="text-[10px] text-destructive mt-2 font-mono">⚠ {workflow.workflow_error}</div>
        )}
      </div>

      {/* Phase Timeline */}
      <div className="overflow-x-auto pb-2 scrollbar-dark">
        <div className="flex gap-2 min-w-min">
          {PHASES.map((phase, idx) => (
            <div key={phase.id}>
              <PhaseButton
                phase={phase}
                status={phaseStatuses[phase.id] || 'LOCKED'}
                blockingReasons={
                  workflow.phase_blocking_reasons?.[phase.id] || 
                  (phaseStatuses[phase.id] === 'LOCKED' ? ['Not Ready'] : null)
                }
                isActive={currentPhase === phase.id}
                onClick={() => onPhaseClick?.(phase.id)}
              />
              {idx < PHASES.length - 1 && (
                <div className="h-0.5 bg-border/30 mt-2 mx-1" style={{ width: '8px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blocking Reasons if any */}
      {workflow.blocked_at_phase && Object.values(workflow.phase_blocking_reasons || {}).some(r => r?.length) && (
        <div className="card-glass rounded-lg p-3 border border-yellow-500/25 bg-yellow-500/5">
          <div className="text-xs font-bold text-yellow-400 mb-2">Blocked at: {workflow.blocked_at_phase}</div>
          <ul className="text-[10px] text-muted-foreground space-y-0.5">
            {Object.entries(workflow.phase_blocking_reasons || {}).map(([phase, reasons]) => {
              if (!reasons?.length) return null;
              return (
                <li key={phase} className="flex gap-2">
                  <span className="text-yellow-400">→</span>
                  <span>{phase}: {reasons.join(', ')}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}