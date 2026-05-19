/**
 * AppWorkspace — generic workspace shell for any TerrellOS sub-app.
 * Route: /apps/:appId
 * Pulls live project data from DB, renders tools grid + integrations.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ECOSYSTEM_APPS } from '@/config/apps_registry';
import { TERRELLOS_APPS } from '@/config/ecosystem_apps';
import {
  ArrowLeft, ExternalLink, RefreshCw, Zap, Database,
  Globe, CheckCircle, AlertTriangle, Settings, Activity,
  Wrench, Code2, MessageSquare, Upload, BarChart3, Brain,
  Heart, Home, Car, Shirt, Church, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const TOOL_ICONS = {
  'bible-study': Church, 'sermon-prep': Church, 'ai-builder': Code2,
  'voice-survey': MessageSquare, 'ai-companion': MessageSquare,
  'match-engine': Heart, 'compatibility': Brain, 'resident-portal': Home,
  'maintenance': Wrench, 'diagnostics': Activity, 'product-builder': Shirt,
  'gang-sheet': Shirt, 'uploads': Upload, 'deploy': Zap,
  'debug': Code2, 'logs': Activity, 'admin': Shield,
  'scheduler': Activity, 'inventory': BarChart3, 'customers': MessageSquare,
  default: Zap,
};

const STATUS_STYLE = {
  active:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  building: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  planned:  'bg-secondary text-muted-foreground border-border',
  error:    'bg-destructive/15 text-destructive border-destructive/30',
};

const INTEGRATION_ICONS = { openai: '🤖', supabase: '🗄️', wix_payments: '💳', github: '🐙', slack: '💬', default: '🔌' };

export default function AppWorkspace() {
  const { appId } = useParams();
  const [project, setProject] = useState(null);
  const [tools, setTools] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const ecosystemApp = ECOSYSTEM_APPS.find(a => a.id === appId);
  const configApp = TERRELLOS_APPS.find(a => a.slug === ecosystemApp?.route?.replace('/apps/', '') || a.slug === appId);

  useEffect(() => { load(); }, [appId]);

  async function load() {
    setLoading(true);
    try {
      // Find project by slug matching appId or ecosystemApp id
      const all = await base44.entities.Project.list('-created_date', 50);
      const match = all.find(p =>
        p.slug === appId ||
        p.slug === ecosystemApp?.route?.replace('/apps/', '') ||
        (ecosystemApp && p.name?.toLowerCase().includes(ecosystemApp.name?.toLowerCase().split(' ')[0].toLowerCase()))
      );
      if (match) {
        setProject(match);
        const [t, i] = await Promise.all([
          base44.entities.ProjectTool.filter({ project_id: match.id }),
          base44.entities.ProjectIntegration.filter({ project_id: match.id }),
        ]);
        setTools(t || []);
        setIntegrations(i || []);
      }
    } catch {}
    setLoading(false);
  }

  if (!ecosystemApp) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-4">App not found: {appId}</p>
          <Link to="/ecosystem"><Button size="sm" variant="outline">← Back to Ecosystem</Button></Link>
        </div>
      </div>
    );
  }

  const appName = ecosystemApp.name;
  const appEmoji = ecosystemApp.emoji;
  const appStatus = project?.status || ecosystemApp.status;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/ecosystem">
            <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Ecosystem
            </Button>
          </Link>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ecosystemApp.color} flex items-center justify-center text-3xl shadow-lg`}>
            {appEmoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{appName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{ecosystemApp.tagline}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${STATUS_STYLE[appStatus] || STATUS_STYLE.building}`}>
                {appStatus?.toUpperCase()}
              </span>
              {project?.tech_stack && (
                <span className="text-[10px] font-mono text-muted-foreground">{project.tech_stack}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load} className="gap-1">
            <RefreshCw className="w-3 h-3" />
          </Button>
          {project?.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1"><ExternalLink className="w-3 h-3" /> Open App</Button>
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card-glass rounded-2xl h-32 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Tools Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Tools & Modules</h2>
            {tools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tools.map(tool => {
                  const Icon = TOOL_ICONS[tool.slug] || TOOL_ICONS.default;
                  return (
                    <Link key={tool.id} to={tool.route || '#'}>
                      <div className="card-glass rounded-xl p-4 border border-border hover:border-primary/40 transition-all group cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                            {tool.icon_emoji || '🔧'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{tool.name}</span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${STATUS_STYLE[tool.status] || STATUS_STYLE.planned}`}>
                                {(tool.status || 'planned').toUpperCase()}
                              </span>
                            </div>
                            {tool.route && (
                              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">{tool.route}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              // Fallback to config tools if DB tools not seeded
              configApp?.tools ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {configApp.tools.map(tool => {
                    const Icon = TOOL_ICONS[tool.slug] || TOOL_ICONS.default;
                    return (
                      <Link key={tool.slug} to={tool.route || '#'}>
                        <div className="card-glass rounded-xl p-4 border border-border hover:border-primary/40 transition-all group cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                              {tool.icon_emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{tool.name}</span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${STATUS_STYLE[tool.status] || STATUS_STYLE.planned}`}>
                                  {tool.status?.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">{tool.route}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="card-glass rounded-xl p-8 text-center text-muted-foreground text-sm">No tools configured yet.</div>
              )
            )}
          </div>

          {/* Right: Info Panel */}
          <div className="space-y-4">
            {/* Project Info */}
            <div className="card-glass rounded-2xl p-4 border border-border space-y-3">
              <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Project Info</h2>
              <InfoRow icon={Globe} label="Domain" value={project?.domain || ecosystemApp?.route} />
              <InfoRow icon={Database} label="DB" value={project?.db_status === 'connected' ? 'Connected' : 'Unknown'} valueColor={project?.db_status === 'connected' ? 'text-emerald-400' : 'text-yellow-400'} />
              <InfoRow icon={Activity} label="Backend" value={project?.backend_status === 'connected' ? 'Online' : 'Unknown'} valueColor={project?.backend_status === 'connected' ? 'text-emerald-400' : 'text-yellow-400'} />
              {project?.updated_date && (
                <InfoRow icon={RefreshCw} label="Updated" value={formatDistanceToNow(new Date(project.updated_date), { addSuffix: true })} />
              )}
              <InfoRow icon={Code2} label="Framework" value={project?.framework || configApp?.framework || 'React + FastAPI'} />
            </div>

            {/* Integrations */}
            <div className="card-glass rounded-2xl p-4 border border-border">
              <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest mb-3">Integrations</h2>
              <div className="space-y-2">
                {(integrations.length > 0 ? integrations : configApp?.integrations || []).map((int, i) => (
                  <div key={int.id || i} className="flex items-center gap-2 text-xs">
                    <span>{INTEGRATION_ICONS[int.provider] || INTEGRATION_ICONS.default}</span>
                    <span className="text-foreground flex-1 truncate">{int.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${int.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'}`}>
                      {(int.status || 'pending').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card-glass rounded-2xl p-4 border border-border">
              <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/ai-builder" className="block">
                  <Button size="sm" variant="outline" className="w-full gap-2 justify-start text-xs">
                    <Brain className="w-3.5 h-3.5" /> AI Builder
                  </Button>
                </Link>
                <Link to="/build-logs" className="block">
                  <Button size="sm" variant="outline" className="w-full gap-2 justify-start text-xs">
                    <Activity className="w-3.5 h-3.5" /> Build Logs
                  </Button>
                </Link>
                <Link to="/founder/builder" className="block">
                  <Button size="sm" variant="outline" className="w-full gap-2 justify-start text-xs">
                    <Code2 className="w-3.5 h-3.5" /> Founder Builder
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueColor = 'text-foreground' }) {
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <span className={`font-mono truncate max-w-[140px] text-right ${valueColor}`}>{value || '—'}</span>
    </div>
  );
}