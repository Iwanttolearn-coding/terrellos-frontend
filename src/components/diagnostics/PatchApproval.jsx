import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RISK_COLOR = {
  high:   'border-red-500/30 bg-red-500/5 text-red-400',
  medium: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
  low:    'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
};

function PatchStep({ step, index, onApprove, onReject, approved, rejected }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all',
      approved ? 'border-emerald-500/40 bg-emerald-500/5' :
      rejected ? 'border-red-500/30 bg-red-500/5 opacity-60' :
      'border-border bg-secondary/20'
    )}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary">{step.step}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{step.description}</div>
          <div className="text-[11px] font-mono text-muted-foreground truncate">{step.file}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded border', RISK_COLOR[step.risk] || RISK_COLOR.medium)}>
            {step.risk?.toUpperCase()} RISK
          </span>
          {step.requiresFounderApproval && <ShieldCheck className="w-3.5 h-3.5 text-primary" title="Requires founder approval" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 space-y-3">
          {step.bugRefs?.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">Fixes: </span>{step.bugRefs.join(', ')}
            </div>
          )}
          {step.patchCode && (
            <div>
              <div className="text-[10px] font-mono text-muted-foreground mb-1 flex items-center gap-1">
                <Code className="w-3 h-3" /> PATCH CODE
              </div>
              <pre className="bg-black/40 rounded-lg p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48 scrollbar-dark whitespace-pre-wrap">
                {step.patchCode}
              </pre>
            </div>
          )}
          {step.testInstruction && (
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">Test: </span>{step.testInstruction}
            </div>
          )}
          {!approved && !rejected && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => onApprove(index)} className="gap-1 flex-1 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject(index)} className="gap-1 flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          )}
          {approved && <div className="text-xs text-emerald-400 font-mono">✓ Approved by Founder</div>}
          {rejected && <div className="text-xs text-red-400 font-mono">✗ Rejected</div>}
        </div>
      )}
    </div>
  );
}

export default function PatchApproval({ plan, onComplete }) {
  const [approvals, setApprovals] = useState({});

  if (!plan?.patchPlan?.length) return null;

  const steps = plan.patchPlan;
  const approvedCount = Object.values(approvals).filter(v => v === 'approved').length;
  const rejectedCount = Object.values(approvals).filter(v => v === 'rejected').length;

  function approve(i) { setApprovals(p => ({ ...p, [i]: 'approved' })); }
  function reject(i)  { setApprovals(p => ({ ...p, [i]: 'rejected' })); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5">
        <div>
          <div className="text-sm font-bold text-foreground">Founder Approval Gate</div>
          <div className="text-xs text-muted-foreground font-mono">
            {approvedCount} approved · {rejectedCount} rejected · {steps.length - approvedCount - rejectedCount} pending
          </div>
        </div>
        <div className="flex items-center gap-2">
          {plan.warnings?.length > 0 && (
            <div className="flex items-center gap-1 text-yellow-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              {plan.warnings.length} warning{plan.warnings.length > 1 ? 's' : ''}
            </div>
          )}
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
      </div>

      {plan.warnings?.length > 0 && (
        <div className="rounded-xl p-3 border border-yellow-500/30 bg-yellow-500/5 space-y-1">
          {plan.warnings.map((w, i) => (
            <div key={i} className="text-xs text-yellow-400 font-mono">⚠ {w}</div>
          ))}
        </div>
      )}

      {plan.orderRationale && (
        <div className="text-xs text-muted-foreground px-1">
          <span className="text-foreground font-semibold">Order rationale: </span>{plan.orderRationale}
        </div>
      )}

      <div className="space-y-2">
        {steps.map((step, i) => (
          <PatchStep
            key={i}
            step={step}
            index={i}
            onApprove={approve}
            onReject={reject}
            approved={approvals[i] === 'approved'}
            rejected={approvals[i] === 'rejected'}
          />
        ))}
      </div>

      {approvedCount > 0 && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-muted-foreground">
          <span className="text-emerald-400 font-bold">{approvedCount} patches approved.</span> Apply these changes manually in your code editor or via GitHub. TerrellOS does not auto-commit — you remain in control.
        </div>
      )}
    </div>
  );
}