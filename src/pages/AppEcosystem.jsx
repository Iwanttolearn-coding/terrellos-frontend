import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { TERRELLOS_APPS } from '@/config/ecosystem_apps';
import { ECOSYSTEM_APPS } from '@/config/apps_registry';
import { Layers, Plus, RefreshCw, ExternalLink, Wifi, WifiOff, Database, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/components/NotificationCenter';

const STATUS_COLORS = {
  active:    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  building:  'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  paused:    'text-slate-400 border-slate-500/30 bg-slate-500/10',
  archived:  'text-red-400 border-red-500/30 bg-red-500/10',
  error:     'text-red-400 border-red-500/30 bg-red-500/10',
};

function ConnectionDot({ status }) {
  if (status === 'connected') return <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />;
  if (status === 'disconnected') return <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />;
}

export default function AppEcosystem() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Project.list('-created_date', 50);
      setProjects(data);
    } catch (err) {
      notify.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  async function seedApps() {
    setSeeding(true);
    try {
      // Check which slugs already exist
      const existing = await base44.entities.Project.list('-created_date', 50);
      const existingSlugs = new Set(existing.map(p => p.slug).filter(Boolean));

      let created = 0;
      for (const app of TERRELLOS_APPS) {
        if (existingSlugs.has(app.slug)) continue;

        const project = await base44.entities.Project.create({
          name: app.name,
          slug: app.slug,
          description: app.description,
          emoji: app.emoji,
          domain: app.domain,
          live_url: app.live_url,
          backend_url: app.backend_url,
          framework: app.framework,
          tech_stack: app.tech_stack,
          status: app.status,
          backend_status: 'unknown',
          db_status: 'unknown',
        });

        // Seed tools
        for (let i = 0; i < app.tools.length; i++) {
          const tool = app.tools[i];
          await base44.entities.ProjectTool.create({
            project_id: project.id,
            name: tool.name,
            slug: tool.slug,
            icon_emoji: tool.icon_emoji,
            status: tool.status,
            route: tool.route,
            enabled: true,
            sort_order: i,
          });
        }

        // Seed integrations
        for (const int of app.integrations) {
          await base44.entities.ProjectIntegration.create({
            project_id: project.id,
            provider: int.provider,
            name: int.name,
            env_key_name: int.env_key_name,
            status: int.status,
          });
        }
        created++;
      }

      notify.success(`Seeded ${created} apps into projects`);
      await loadProjects();
    } catch (err) {
      notify.error(`Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  const appProjects = projects.filter(p => p.slug);

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple flex-shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">App Ecosystem</h1>
            <p className="text-xs text-muted-foreground font-mono">TerrellOS Master Command Center — {appProjects.length} projects</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadProjects} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {appProjects.length < TERRELLOS_APPS.length && (
            <Button size="sm" onClick={seedApps} disabled={seeding} className="gap-1">
              <Plus className="w-3 h-3" />
              {seeding ? 'Seeding...' : 'Import Real Apps'}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="card-glass rounded-2xl h-56 animate-pulse" />
          ))}
        </div>
      ) : appProjects.length === 0 ? (
        <div className="card-glass rounded-2xl p-12 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold mb-2">No real app records found</p>
          <p className="text-muted-foreground text-sm mb-4">Click "Import Real Apps" to seed all 7 TerrellOS apps with their tools, integrations, and workspace data.</p>
          <Button onClick={seedApps} disabled={seeding}>
            {seeding ? 'Seeding...' : 'Import Real Apps'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {appProjects.map(project => {
            // Find matching ecosystem app for workspace route
            const ecoApp = ECOSYSTEM_APPS.find(a =>
              a.route?.replace('/apps/', '') === project.slug ||
              project.name?.toLowerCase().includes(a.name?.toLowerCase().split(' ')[0].toLowerCase())
            );
            const workspaceRoute = ecoApp ? `/apps/${ecoApp.id}` : `/project/${project.id}`;
            return (
              <ProjectCard key={project.id} project={project} onOpen={() => navigate(workspaceRoute)} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onOpen }) {
  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.building;

  return (
    <div
      className="card-glass rounded-2xl p-5 flex flex-col cursor-pointer hover:border-primary/40 transition-all duration-200 group"
      onClick={onOpen}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
          {project.emoji || '📦'}
        </div>
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${statusColor}`}>
          {project.status?.toUpperCase()}
        </span>
      </div>

      {/* Name + desc */}
      <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight">{project.name}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1 line-clamp-2">{project.description}</p>

      {/* Connection status */}
      <div className="space-y-1 mb-3">
        {project.domain ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ConnectionDot status={project.backend_status || 'unknown'} />
            <span className="font-mono truncate">{project.domain}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-yellow-500">
            <WifiOff className="w-3 h-3" />
            <span>Connect domain</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="w-3 h-3" />
          <span className={project.db_status === 'connected' ? 'text-emerald-400' : 'text-yellow-400'}>
            {project.db_status === 'connected' ? 'DB Connected' : 'DB: Unknown'}
          </span>
        </div>
      </div>

      {/* Tech stack */}
      {project.tech_stack && (
        <p className="text-[9px] font-mono text-muted-foreground mb-3 truncate">{project.tech_stack}</p>
      )}

      {/* Open workspace button */}
      <button
        className="w-full py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors flex items-center justify-center gap-2 group-hover:border-primary/60"
        onClick={onOpen}
      >
        <ExternalLink className="w-3 h-3" />
        Open Workspace
      </button>
    </div>
  );
}