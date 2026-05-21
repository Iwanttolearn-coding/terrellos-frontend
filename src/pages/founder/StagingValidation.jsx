import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { notify } from '@/components/NotificationCenter';
import { isFounderEmail } from '@/lib/production';
import {
  CheckCircle, AlertTriangle, XCircle, RefreshCw, ShieldCheck, Activity,
  Server, Zap, RotateCcw, Clock, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const PHASE_STEPS = [
  { id: 'validation_gate', label: 'Pre-Deployment Validation', icon: ShieldCheck },
  { id: 'create_snapshot', label: 'Create Deployment Snapshot', icon: FileText },
  { id: 'execute_deployment', label: 'Execute Staging Deployment', icon: Zap },
  { id: 'live_validation', label: 'Live Staging Validation', icon: Activity },
  { id: 'monitoring', label: 'Staging Health Monitoring', icon: Clock },
  { id: 'final_report', label: 'Final Staging Report', icon: CheckCircle },
];

function StatusBadge({ status, label }) {
  const styles = {
    BLOCKED: 'bg-destructive/10 text-destructive border-destructive/30',
    PASSED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    RUNNING: 'bg-primary/10 text-primary border-primary/30',
    HEALTHY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    DEGRADED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    CRITICAL: 'bg-destructive/10 text-destructive border-destructive/30',
    PENDING: 'bg-muted/50 text-muted-foreground border-border',
  };

  return (
    <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${styles[status] || styles.PENDING}`}>
      {status}
    </div>
  );
}

function ResultCard({ title, status, details, items = [] }) {
  const Icon = status === 'PASS' ? CheckCircle : status === 'FAIL' ? XCircle : AlertTriangle;
  const iconColor = status === 'PASS' ? 'text-emerald-400' : status === 'FAIL' ? 'text-destructive' : 'text-yellow-400';

  return (
    <div className="card-glass rounded-2xl p-4 border border-border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
        </div>
        <StatusBadge status={status} />
      </div>
      {details && <p className="text-xs text-muted-foreground">{details}</p>}
      {items.length > 0 && (
        <div className="space-y-1 text-xs mt-2 pt-2 border-t border-border/30">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-muted-foreground flex-shrink-0 mt-0.5">•</span>
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StagingValidation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseStatus, setPhaseStatus] = useState({});
  const [phaseResults, setPhaseResults] = useState({});
  const [running, setRunning] = useState(false);
  const [stagingReport, setStagingReport] = useState(null);

  useEffect(() => {
    Promise.resolve(loadUser()).then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Access gate
  if (user !== null && !resolveUserAccess(user?.email).founder) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center border border-destructive/30">
          <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Founder Access Required</h2>
          <p className="text-sm text-muted-foreground">Staging Validation is restricted to founders only.</p>
        </div>
      </div>
    );
  }

  async function runPhase(phaseId) {
    setPhaseStatus(prev => ({ ...prev, [phaseId]: 'RUNNING' }));
    setRunning(true);

    try {
      let result;

      if (phaseId === 'validation_gate') {
        const res = await safeInvoke('stagingValidationGate', {});
        result = res.data;
        setPhaseResults(prev => ({ ...prev, [phaseId]: result }));
        if (result.gate_status === 'BLOCKED') {
          notify.error('Staging deployment blocked by validation gate');
          setPhaseStatus(prev => ({ ...prev, [phaseId]: 'BLOCKED' }));
        } else {
          notify.success('Staging validation gate passed');
          setPhaseStatus(prev => ({ ...prev, [phaseId]: 'PASSED' }));
        }
      } else if (phaseId === 'create_snapshot') {
        const res = await safeInvoke('createDeploymentSnapshot', {
          release_id: phaseResults.validation_gate?.latest_release_id,
          environment: 'staging',
          branch: 'main',
        });
        result = res.data;
        setPhaseResults(prev => ({ ...prev, [phaseId]: result }));
        notify.success('Deployment snapshot created');
        setPhaseStatus(prev => ({ ...prev, [phaseId]: 'PASSED' }));
      } else if (phaseId === 'execute_deployment') {
        const res = await safeInvoke('executeDeployment', {
          environment: 'staging',
          release_id: phaseResults.validation_gate?.latest_release_id,
          branch: 'main',
        });
        result = res.data;
        setPhaseResults(prev => ({ ...prev, [phaseId]: result }));
        notify.success('Staging deployment queued');
        setPhaseStatus(prev => ({ ...prev, [phaseId]: 'PASSED' }));
      } else if (phaseId === 'live_validation') {
        const res = await safeInvoke('validateStagingEnvironment', {
          staging_url: 'https://staging.tm-dezigns.org',
        });
        result = res.data;
        setPhaseResults(prev => ({ ...prev, [phaseId]: result }));
        if (result.is_healthy) {
          notify.success('Staging environment healthy');
          setPhaseStatus(prev => ({ ...prev, [phaseId]: 'PASSED' }));
        } else {
          notify.warn('Staging validation issues detected');
          setPhaseStatus(prev => ({ ...prev, [phaseId]: result.health_score >= 75 ? 'PASSED' : 'WARNING' }));
        }
      } else if (phaseId === 'monitoring') {
        const res = await safeInvoke('monitorStagingHealth', {});
        result = res.data;
        setPhaseResults(prev => ({ ...prev, [phaseId]: result }));
        const status = result.status === 'HEALTHY' ? 'PASSED' : 'WARNING';
        notify[status === 'PASSED' ? 'success' : 'warn'](`Staging health: ${result.health_score}/100`);
        setPhaseStatus(prev => ({ ...prev, [phaseId]: status }));
      } else if (phaseId === 'final_report') {
        const res = await safeInvoke('generateStagingReport', {
          validation_results: phaseResults.live_validation,
          monitoring_results: phaseResults.monitoring,
          deployment_details: phaseResults.execute_deployment,
        });
        result = res.data;
        setStagingReport(result);
        setPhaseResults(prev => ({ ...prev, [phaseId]: result }));
        notify.success('Staging report generated');
        setPhaseStatus(prev => ({ ...prev, [phaseId]: 'PASSED' }));
      }
    } catch (err) {
      notify.error(`Phase failed: ${err.message}`);
      setPhaseStatus(prev => ({ ...prev, [phaseId]: 'FAILED' }));
    }

    setRunning(false);
  }

  async function runAllPhases() {
    setRunning(true);
    for (const step of PHASE_STEPS) {
      const prevStatus = phaseStatus[step.id];
      if (prevStatus === 'FAILED') break;

      await runPhase(step.id);
      await new Promise(r => setTimeout(r, 500));
    }
    setRunning(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs font-mono text-muted-foreground">Loading staging validation…</p>
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
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Staging Validation Phase 1</h1>
            <p className="text-xs text-muted-foreground font-mono">Real operational deployment validation with live environment verification</p>
          </div>
        </div>
      </div>

      {!stagingReport ? (
        <div className="space-y-6">
          {/* Control buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => runPhase(PHASE_STEPS[currentPhase].id)}
              disabled={running || currentPhase >= PHASE_STEPS.length}
              className="flex-1 gap-2 gradient-purple-blue text-white h-11"
            >
              {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {running ? 'Running Phase…' : `Run Phase ${currentPhase + 1}`}
            </Button>
            <Button
              onClick={runAllPhases}
              disabled={running}
              variant="outline"
              className="flex-1 gap-2 h-11"
            >
              {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              Run All Phases
            </Button>
          </div>

          {/* Phase timeline */}
          <div className="card-glass rounded-2xl p-5 border border-border space-y-3">
            <h3 className="text-sm font-bold text-foreground">Validation Phases</h3>
            <div className="space-y-2">
              {PHASE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const status = phaseStatus[step.id];
                const isActive = idx === currentPhase;

                return (
                  <button
                    key={step.id}
                    onClick={() => !running && setCurrentPhase(idx)}
                    disabled={running}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-primary/20 border-primary/40'
                        : status === 'PASSED'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : status === 'BLOCKED' || status === 'FAILED'
                        ? 'bg-destructive/10 border-destructive/30'
                        : status === 'WARNING'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-secondary/20 border-border hover:bg-secondary/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      status === 'PASSED' ? 'bg-emerald-400 text-background' :
                      status === 'BLOCKED' || status === 'FAILED' ? 'bg-destructive text-white' :
                      status === 'WARNING' ? 'bg-yellow-400 text-background' :
                      status === 'RUNNING' ? 'bg-primary text-white' :
                      'bg-muted'
                    }`}>
                      {status === 'RUNNING' ? '⟳' : status === 'PASSED' ? '✓' : status === 'BLOCKED' || status === 'FAILED' ? '✕' : idx + 1}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-foreground">{step.label}</div>
                      {status && <div className="text-[10px] text-muted-foreground mt-0.5">{status}</div>}
                    </div>
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current phase results */}
          {Object.keys(phaseResults).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground">Phase Results</h3>

              {phaseResults.validation_gate && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">Pre-Deployment Validation</h4>
                  {phaseResults.validation_gate.blockers?.length > 0 && (
                    <div className="space-y-2">
                      {phaseResults.validation_gate.blockers.map((blocker, i) => (
                        <ResultCard
                          key={i}
                          title={blocker.check}
                          status="FAIL"
                          details={blocker.reason}
                          items={[`Remediation: ${blocker.remediation}`]}
                        />
                      ))}
                    </div>
                  )}
                  {phaseResults.validation_gate.passed?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {phaseResults.validation_gate.passed.map((check, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs text-emerald-300 font-mono">{check}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {phaseResults.live_validation && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">Staging Environment Health: {phaseResults.live_validation.health_score}/100</h4>
                  {phaseResults.live_validation.critical_failures?.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <div className="text-xs font-bold text-destructive mb-2">Critical Failures</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {phaseResults.live_validation.critical_failures.map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {phaseResults.monitoring && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">Health Monitoring: {phaseResults.monitoring.health_score}/100</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-secondary/30 border border-border">
                      <div className="text-muted-foreground text-[10px]">BuildLog</div>
                      <div className="font-mono text-foreground">{phaseResults.monitoring.monitoring?.buildlog_health?.health_status}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/30 border border-border">
                      <div className="text-muted-foreground text-[10px]">Deployments</div>
                      <div className="font-mono text-foreground">{phaseResults.monitoring.monitoring?.deployment_stability?.stability_status}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/30 border border-border">
                      <div className="text-muted-foreground text-[10px]">Persistence</div>
                      <div className="font-mono text-foreground text-[11px]">{phaseResults.monitoring.monitoring?.entity_persistence?.persistence_status}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/30 border border-border">
                      <div className="text-muted-foreground text-[10px]">Async</div>
                      <div className="font-mono text-foreground">{phaseResults.monitoring.monitoring?.async_stability?.async_status}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Staging report */}
          <div className={`rounded-2xl p-5 border flex items-center justify-between ${
            stagingReport.section_8_production_recommendation.recommendation === 'BLOCK_PRODUCTION'
              ? 'bg-destructive/10 border-destructive/25'
              : stagingReport.section_8_production_recommendation.recommendation === 'NEEDS_REVIEW'
              ? 'bg-yellow-500/10 border-yellow-500/25'
              : 'bg-emerald-500/10 border-emerald-500/25'
          }`}>
            <div>
              <div className={`text-lg font-bold ${
                stagingReport.section_8_production_recommendation.recommendation === 'BLOCK_PRODUCTION'
                  ? 'text-destructive'
                  : stagingReport.section_8_production_recommendation.recommendation === 'NEEDS_REVIEW'
                  ? 'text-yellow-400'
                  : 'text-emerald-400'
              }`}>
                {stagingReport.section_8_production_recommendation.recommendation}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stagingReport.section_8_production_recommendation.reasoning}
              </div>
            </div>
          </div>

          {/* Report sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard
              title="Critical Failures"
              status={stagingReport.section_1_critical_failures.count === 0 ? 'PASS' : 'FAIL'}
              details={`${stagingReport.section_1_critical_failures.count} critical issue(s)`}
              items={stagingReport.section_1_critical_failures.failures.slice(0, 3)}
            />
            <ResultCard
              title="Warnings"
              status={stagingReport.section_2_warnings.count === 0 ? 'PASS' : 'WARNING'}
              details={`${stagingReport.section_2_warnings.count} warning(s)`}
              items={stagingReport.section_2_warnings.warnings.slice(0, 3)}
            />
            <ResultCard
              title="Deployment Health"
              status="PASS"
              details={`Reliability Score: ${stagingReport.section_4_deployment_health.deployment_reliability_score}/100`}
              items={[
                `Validation: ${stagingReport.section_4_deployment_health.validation_score}/100`,
                `Monitoring: ${stagingReport.section_4_deployment_health.monitoring_score}/100`,
              ]}
            />
            <ResultCard
              title="Rollback Readiness"
              status={stagingReport.section_6_rollback_readiness.available ? 'PASS' : 'WARNING'}
              details={stagingReport.section_6_rollback_readiness.status}
            />
          </div>

          <Button
            onClick={() => {
              setStagingReport(null);
              setCurrentPhase(0);
              setPhaseStatus({});
              setPhaseResults({});
            }}
            variant="outline"
            className="w-full gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Run Another Validation
          </Button>
        </div>
      )}
    </div>
  );
}