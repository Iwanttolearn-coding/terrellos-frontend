import { useState } from 'react';
import { AlertTriangle, CheckCircle, Zap, Database, GitBranch, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function ArchitectureViewer({ analysis, isLoading }) {
  const [expandedSection, setExpandedSection] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <div className="card-glass rounded-2xl p-8 border border-border text-center">
        <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 animate-pulse" />
        <p className="text-xs text-muted-foreground font-mono">Analyzing architecture…</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="card-glass rounded-2xl p-6 border border-border text-center">
        <Database className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No architecture analysis yet</p>
      </div>
    );
  }

  const healthBg = analysis.health_score >= 75 ? 'bg-emerald-500/10' :
                   analysis.health_score >= 50 ? 'bg-yellow-500/10' : 'bg-destructive/10';
  const healthBorder = analysis.health_score >= 75 ? 'border-emerald-500/25' :
                       analysis.health_score >= 50 ? 'border-yellow-500/25' : 'border-destructive/25';
  const healthText = analysis.health_score >= 75 ? 'text-emerald-400' :
                     analysis.health_score >= 50 ? 'text-yellow-400' : 'text-destructive';

  return (
    <div className="space-y-4">
      {/* Health Score */}
      <div className={`rounded-xl p-4 border ${healthBg} ${healthBorder}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-sm">Architecture Health</span>
          <span className={`text-2xl font-bold ${healthText}`}>{analysis.health_score}%</span>
        </div>
        <p className="text-xs text-muted-foreground">{analysis.health_summary}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Files', value: analysis.summary?.files_analyzed || 0 },
          { label: 'Routes', value: analysis.summary?.routes || 0 },
          { label: 'Backend Calls', value: analysis.summary?.backend_connections || 0 },
          { label: 'Issues', value: analysis.summary?.risk_patterns || 0 },
        ].map((stat, i) => (
          <div key={i} className="card-glass rounded-lg p-2.5 border border-border text-center">
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {/* Dependency Graph */}
        <button
          onClick={() => setExpandedSection(expandedSection === 'deps' ? null : 'deps')}
          className="w-full text-left p-3.5 rounded-lg card-glass border border-border hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Dependency Graph
            </span>
            <span className="text-xs text-muted-foreground">
              {analysis.dependency_graph?.most_imported?.length || 0} high-import files
            </span>
          </div>
        </button>
        {expandedSection === 'deps' && (
          <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-2">
            {analysis.dependency_graph?.most_imported?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground truncate">{item.file}</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] flex-shrink-0">
                  <Zap className="w-3 h-3" /> {item.import_count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Backend/Frontend Connections */}
        <button
          onClick={() => setExpandedSection(expandedSection === 'connections' ? null : 'connections')}
          className="w-full text-left p-3.5 rounded-lg card-glass border border-border hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Backend/Frontend Connections</span>
            <span className="text-xs text-muted-foreground">
              {analysis.backend_frontend_connections?.length || 0} functions
            </span>
          </div>
        </button>
        {expandedSection === 'connections' && (
          <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-2 max-h-48 overflow-y-auto">
            {analysis.backend_frontend_connections?.map((conn, i) => (
              <div key={i} className="text-xs">
                <div className="font-mono font-bold text-primary mb-1">{conn.backend_function}</div>
                <div className="text-muted-foreground pl-2 space-y-0.5">
                  {conn.called_by_pages?.slice(0, 3).map((page, j) => (
                    <div key={j} className="text-[10px]">→ {page.replace('pages/', '').replace('.jsx', '')}</div>
                  ))}
                  {conn.called_by_pages?.length > 3 && (
                    <div className="text-[10px] text-muted-foreground/60">+{conn.called_by_pages.length - 3} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Diagnostics & Issues */}
        {analysis.diagnostics?.length > 0 && (
          <>
            <button
              onClick={() => setExpandedSection(expandedSection === 'diag' ? null : 'diag')}
              className="w-full text-left p-3.5 rounded-lg card-glass border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Diagnostics
                </span>
                <span className="text-xs font-bold text-destructive">{analysis.diagnostics.length} issues</span>
              </div>
            </button>
            {expandedSection === 'diag' && (
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50 space-y-2 max-h-64 overflow-y-auto">
                {analysis.diagnostics.map((diag, i) => (
                  <div key={i} className="text-xs space-y-1 p-2 rounded bg-background/50 border border-border/50">
                    <div className="flex items-center gap-2">
                      {diag.severity === 'high' ? (
                        <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      )}
                      <span className="font-bold">{diag.type.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="ml-auto text-muted-foreground">×{diag.count}</span>
                    </div>
                    <p className="text-muted-foreground">{diag.message}</p>
                    {diag.files?.slice(0, 3).map((file, j) => (
                      <div key={j} className="text-[10px] font-mono text-muted-foreground/60 ml-4">
                        • {typeof file === 'string' ? file : file.file}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* High Risk Patterns */}
        {analysis.high_risk_patterns?.length > 0 && (
          <>
            <button
              onClick={() => setExpandedSection(expandedSection === 'risks' ? null : 'risks')}
              className="w-full text-left p-3.5 rounded-lg card-glass border border-destructive/25 hover:border-destructive/50 transition-colors bg-destructive/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> High-Risk Code Patterns
                </span>
                <span className="text-xs font-bold text-destructive">{analysis.high_risk_patterns.length}</span>
              </div>
            </button>
            {expandedSection === 'risks' && (
              <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/25 space-y-2 max-h-48 overflow-y-auto">
                {analysis.high_risk_patterns.map((risk, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-background/50 border border-destructive/25">
                    <div className="font-mono font-bold text-destructive mb-0.5">{risk.type}</div>
                    <div className="text-muted-foreground">{risk.detail}</div>
                    <div className="text-[10px] font-mono text-muted-foreground/60 mt-1">{risk.file}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* AI Insights */}
        {analysis.ai_insights?.architecture_recommendations?.length > 0 && (
          <>
            <button
              onClick={() => setExpandedSection(expandedSection === 'ai' ? null : 'ai')}
              className="w-full text-left p-3.5 rounded-lg card-glass border border-blue-500/25 hover:border-blue-500/50 transition-colors bg-blue-500/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-blue-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> AI Architecture Recommendations
                </span>
                <span className="text-xs font-bold text-blue-400">
                  {analysis.ai_insights.architecture_recommendations.length}
                </span>
              </div>
            </button>
            {expandedSection === 'ai' && (
              <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/25 space-y-2">
                {analysis.ai_insights.architecture_recommendations.map((rec, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-background/50 border border-blue-500/25">
                    <div className="font-bold text-blue-400 mb-1">{rec.title}</div>
                    <div className="text-muted-foreground">{rec.detail}</div>
                    {rec.priority && (
                      <div className={`text-[10px] font-bold mt-1 ${
                        rec.priority === 'high' ? 'text-destructive' :
                        rec.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        Priority: {rec.priority.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bundle Analysis */}
      {analysis.bundle_analysis?.length > 0 && (
        <div className="card-glass rounded-lg p-3.5 border border-border">
          <div className="text-xs font-bold text-muted-foreground mb-2 uppercase">Largest Files</div>
          <div className="space-y-1.5">
            {analysis.bundle_analysis.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground truncate">{item.file}</span>
                <span className="flex-shrink-0 ml-2 px-2 py-0.5 rounded bg-background/50 text-muted-foreground text-[10px] font-bold">
                  {item.size_kb}KB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}