import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, FileCode, Zap, Shield, Server, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEV_COLOR = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

const STATUS_CONFIG = {
  PASS: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'PASS' },
  WARN: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'WARN' },
  FAIL: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', label: 'FAIL' },
};

function StatCard({ label, value, sub, color = 'text-foreground' }) {
  return (
    <div className="card-glass rounded-xl p-4 border border-border">
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div>}
    </div>
  );
}

function BugCard({ bug, index }) {
  return (
    <div className={cn('rounded-xl p-3.5 border', SEV_COLOR[bug.severity] || SEV_COLOR.low)}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider">{bug.severity}</span>
        <span className="text-[10px] font-mono text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded">{bug.category}</span>
      </div>
      <p className="text-sm text-foreground font-medium mb-1">{bug.description}</p>
      {bug.file && (
        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
          <FileCode className="w-3 h-3" /> {bug.file}{bug.line ? `:${bug.line}` : ''}
        </div>
      )}
    </div>
  );
}

function FixCard({ fix }) {
  return (
    <div className="rounded-xl p-3.5 border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-mono font-bold text-primary bg-primary/15 px-2 py-0.5 rounded">#{fix.priority}</span>
        <span className="text-xs font-mono text-muted-foreground truncate">{fix.file}</span>
      </div>
      <p className="text-sm text-foreground font-medium mb-1">{fix.action}</p>
      <p className="text-xs text-muted-foreground">{fix.reason}</p>
    </div>
  );
}

function RiskCard({ risk }) {
  return (
    <div className={cn('rounded-xl p-3.5 border', SEV_COLOR[risk.severity] || SEV_COLOR.medium)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase">{risk.severity}</span>
        <Server className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <p className="text-sm text-foreground mb-1">{risk.risk}</p>
      <p className="text-xs text-muted-foreground">{risk.resolution}</p>
    </div>
  );
}

export default function ScanResults({ result, onGeneratePatch }) {
  if (!result) return null;
  const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.WARN;
  const Icon = cfg.icon;

  return (
    <div className="space-y-6">
      {/* Overall status bar */}
      <div className={cn('flex items-center justify-between p-4 rounded-2xl border', cfg.bg)}>
        <div className="flex items-center gap-3">
          <Icon className={cn('w-7 h-7', cfg.color)} />
          <div>
            <div className={cn('text-lg font-bold', cfg.color)}>{cfg.label} — {result.summary}</div>
            <div className="text-xs font-mono text-muted-foreground">{result.repo}@{result.branch} · {result.scannedAt ? new Date(result.scannedAt).toLocaleString() : ''}</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Files Scanned" value={result.stats?.keyFilesScanned || 0} sub={`of ${result.stats?.totalFiles || 0} total`} />
        <StatCard label="Bugs Found" value={result.stats?.bugsCount || 0} color={result.stats?.bugsCount > 0 ? 'text-orange-400' : 'text-emerald-400'} />
        <StatCard label="Critical" value={result.stats?.criticalCount || 0} color={result.stats?.criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <StatCard label="Fixes Suggested" value={result.recommendedFixes?.length || 0} color="text-primary" />
      </div>

      {/* Missing env vars + broken imports */}
      {(result.missingEnvVars?.length > 0 || result.brokenImports?.length > 0 || result.routingIssues?.length > 0 || result.authIssues?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.missingEnvVars?.length > 0 && (
            <div className="rounded-xl p-4 border border-orange-500/30 bg-orange-500/5">
              <div className="text-xs font-mono font-bold text-orange-400 mb-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> MISSING ENV VARS</div>
              {result.missingEnvVars.map((v, i) => <div key={i} className="text-xs font-mono text-muted-foreground py-0.5">• {v}</div>)}
            </div>
          )}
          {result.brokenImports?.length > 0 && (
            <div className="rounded-xl p-4 border border-red-500/30 bg-red-500/5">
              <div className="text-xs font-mono font-bold text-red-400 mb-2 flex items-center gap-1"><FileCode className="w-3.5 h-3.5" /> BROKEN IMPORTS</div>
              {result.brokenImports.map((v, i) => <div key={i} className="text-xs font-mono text-muted-foreground py-0.5">• {v}</div>)}
            </div>
          )}
          {result.routingIssues?.length > 0 && (
            <div className="rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5">
              <div className="text-xs font-mono font-bold text-yellow-400 mb-2 flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> ROUTING ISSUES</div>
              {result.routingIssues.map((v, i) => <div key={i} className="text-xs font-mono text-muted-foreground py-0.5">• {v}</div>)}
            </div>
          )}
          {result.authIssues?.length > 0 && (
            <div className="rounded-xl p-4 border border-purple-500/30 bg-purple-500/5">
              <div className="text-xs font-mono font-bold text-purple-400 mb-2 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> AUTH ISSUES</div>
              {result.authIssues.map((v, i) => <div key={i} className="text-xs font-mono text-muted-foreground py-0.5">• {v}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Bugs */}
      {result.bugsFound?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-3">Bugs Detected ({result.bugsFound.length})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.bugsFound.map((bug, i) => <BugCard key={i} bug={bug} index={i} />)}
          </div>
        </div>
      )}

      {/* Recommended fixes */}
      {result.recommendedFixes?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-3">Recommended Fixes</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.recommendedFixes.map((fix, i) => <FixCard key={i} fix={fix} />)}
          </div>
          <button
            onClick={onGeneratePatch}
            className="mt-4 w-full py-3 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Generate Patch Plan for These Fixes
          </button>
        </div>
      )}

      {/* Deployment risks */}
      {result.deploymentRisks?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-3">Deployment Risks</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.deploymentRisks.map((risk, i) => <RiskCard key={i} risk={risk} />)}
          </div>
        </div>
      )}

      {/* Model placement plan */}
      {result.modelPlacementPlan?.length > 0 && (
        <div>
          <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-3">AI Model Placement Recommendations</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.modelPlacementPlan.map((m, i) => (
              <div key={i} className="rounded-xl p-3.5 border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{m.tool}</span>
                  <span className="text-[10px] font-mono text-primary bg-primary/20 px-2 py-0.5 rounded">{m.recommendedModel}</span>
                </div>
                <p className="text-xs text-muted-foreground">{m.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}