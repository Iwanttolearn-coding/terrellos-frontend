import { useState } from 'react';
import { CheckCircle, AlertTriangle, ChevronDown, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PatchApprovalUI({ plan, onApproveStep, isApproving }) {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [approvedSteps, setApprovedSteps] = useState({});
  const [copiedStep, setCopiedStep] = useState(null);

  function toggleStep(stepNum) {
    setExpandedSteps(p => ({ ...p, [stepNum]: !p[stepNum] }));
  }

  function copyCode(stepNum) {
    const step = plan.patchPlan?.find(s => s.step === stepNum);
    if (step?.patchCode) {
      navigator.clipboard.writeText(step.patchCode);
      setCopiedStep(stepNum);
      setTimeout(() => setCopiedStep(null), 2000);
    }
  }

  async function approveStep(stepNum) {
    setApprovedSteps(p => ({ ...p, [stepNum]: true }));
    await onApproveStep(stepNum - 1);
  }

  if (!plan?.patchPlan?.length) {
    return (
      <div className="card-glass rounded-2xl p-8 border border-border text-center">
        <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium">No patches in this plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {plan.patchPlan.map((step, idx) => {
        const isExpanded = expandedSteps[step.step];
        const isApproved = approvedSteps[step.step];
        const riskColor = step.risk === 'low' ? 'text-emerald-400' :
                          step.risk === 'medium' ? 'text-yellow-400' : 'text-destructive';

        return (
          <div key={idx} className="card-glass rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors">
            {/* Header */}
            <button
              onClick={() => toggleStep(step.step)}
              className="w-full flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {isApproved ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-4 h-4 rounded border border-border flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground mb-0.5">
                    Step {step.step}: {step.description}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                    <span className="font-mono">{step.file}</span>
                    <span className={`font-bold uppercase ${riskColor}`}>
                      {step.action} · {step.risk} risk
                    </span>
                    {step.requiresFounderApproval && (
                      <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        ⭐ Requires Approval
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-border/50 px-4 py-3.5 space-y-3 bg-secondary/20">
                {/* Reason */}
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground mb-1.5 uppercase font-bold">Reason</p>
                  <p className="text-xs text-foreground leading-relaxed">{step.reason}</p>
                </div>

                {/* Bug References */}
                {step.bugRefs?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground mb-1.5 uppercase font-bold">Fixes</p>
                    <div className="space-y-1">
                      {step.bugRefs.map((ref, i) => (
                        <div key={i} className="text-xs text-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{ref}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Preview */}
                {step.patchCode && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Code Change</p>
                      <button
                        onClick={() => copyCode(step.step)}
                        className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedStep === step.step ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border border-border/30 font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-48 overflow-y-auto scrollbar-dark">
                      <pre>{step.patchCode}</pre>
                    </div>
                  </div>
                )}

                {/* Test Instruction */}
                {step.testInstruction && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground mb-1.5 uppercase font-bold">How to Test</p>
                    <p className="text-xs text-foreground leading-relaxed">{step.testInstruction}</p>
                  </div>
                )}

                {/* Risk Assessment */}
                <div className={cn(
                  'p-2.5 rounded-lg border text-xs',
                  step.risk === 'low' && 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
                  step.risk === 'medium' && 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400',
                  'high' && 'bg-destructive/10 border-destructive/25 text-destructive'
                )}>
                  <span className="font-bold">Risk Level:</span> {step.risk.toUpperCase()}
                  {step.risk !== 'low' && ' — Review carefully before approval'}
                </div>

                {/* Approval Button */}
                {!isApproved && (
                  <Button
                    onClick={() => approveStep(step.step)}
                    disabled={isApproving}
                    className="w-full h-9 gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400"
                    variant="outline"
                  >
                    {isApproving ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Approving…</>
                    ) : (
                      <><CheckCircle className="w-3.5 h-3.5" /> Approve This Patch</>
                    )}
                  </Button>
                )}

                {isApproved && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Approved by founder
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="card-glass rounded-xl p-4 border border-border/50 bg-secondary/30 mt-4">
        <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase font-bold">Summary</p>
        <p className="text-xs text-foreground mb-2">
          <span className="font-bold">{plan.patchPlan?.length} patches</span> planned for {plan.estimatedImpact} impact.
        </p>
        <p className="text-xs text-muted-foreground">
          {plan.orderRationale}
        </p>
      </div>
    </div>
  );
}