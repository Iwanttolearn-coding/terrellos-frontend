import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const mockCreditData = [
  { date: '5/9', credits: 850, requests: 12 },
  { date: '5/10', credits: 720, requests: 18 },
  { date: '5/11', credits: 580, requests: 15 },
  { date: '5/12', credits: 420, requests: 22 },
  { date: '5/13', credits: 280, requests: 25 },
  { date: '5/14', credits: 150, requests: 20 },
  { date: '5/15', credits: 45, requests: 8 },
];

const mockProjectUsage = [
  { name: 'TerrellOS', credits: 850, limit: 1000, percentage: 85 },
  { name: 'Pastor AI', credits: 420, limit: 500, percentage: 84 },
  { name: 'Avatar Lab', credits: 280, limit: 300, percentage: 93 },
  { name: 'Memory Vault', credits: 150, limit: 250, percentage: 60 },
];

export default function CreditMonitor() {
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const newAlerts = mockProjectUsage.filter(p => p.percentage > 80).map(p => ({
      id: p.name,
      type: p.percentage > 90 ? 'critical' : 'warning',
      message: `${p.name} at ${p.percentage}% capacity`,
      timestamp: new Date(),
    }));
    setAlerts(newAlerts);
  }, []);

  const totalCredits = mockProjectUsage.reduce((sum, p) => sum + p.credits, 0);
  const totalLimit = mockProjectUsage.reduce((sum, p) => sum + p.limit, 0);
  const avgUsagePercent = Math.round((totalCredits / totalLimit) * 100);

  return (
    <div className="space-y-6">
      {/* Alert Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-300">Low Credit Alerts</span>
          </div>
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                'rounded-lg border p-3 flex items-start gap-3',
                alert.type === 'critical'
                  ? 'bg-destructive/10 border-destructive/40'
                  : 'bg-amber-500/10 border-amber-500/40'
              )}
            >
              <AlertTriangle className={cn(
                'w-4 h-4 flex-shrink-0 mt-0.5',
                alert.type === 'critical' ? 'text-destructive' : 'text-amber-500'
              )} />
              <div className="flex-1 min-w-0">
                <p className={alert.type === 'critical' ? 'text-destructive' : 'text-amber-300'}>
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-border bg-card/50">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest font-mono">Total Credits Used</div>
          <div className="text-2xl font-bold text-foreground">{totalCredits}</div>
          <div className="text-xs text-muted-foreground mt-2">/ {totalLimit} limit</div>
        </Card>
        <Card className="p-4 border border-border bg-card/50">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest font-mono">Overall Usage</div>
          <div className="text-2xl font-bold text-foreground">{avgUsagePercent}%</div>
          <div className="text-xs text-muted-foreground mt-2">across all projects</div>
        </Card>
        <Card className="p-4 border border-border bg-card/50">
          <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest font-mono">Active Projects</div>
          <div className="text-2xl font-bold text-foreground">{mockProjectUsage.length}</div>
          <div className="text-xs text-muted-foreground mt-2">{alerts.length} at risk</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Usage Timeline
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'projects'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Per Project
        </button>
      </div>

      {/* Chart - Usage Timeline */}
      {activeTab === 'overview' && (
        <Card className="p-6 border border-border bg-card/50">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            7-Day Credit Consumption
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockCreditData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="credits"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-4">
            📊 Trend: Credits declining as AI requests increase — upgrade plan to avoid burnout.
          </p>
        </Card>
      )}

      {/* Per Project Breakdown */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {mockProjectUsage.map(project => (
            <Card key={project.name} className="p-4 border border-border bg-card/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{project.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {project.credits} / {project.limit} credits
                  </p>
                </div>
                <Badge
                  variant={project.percentage > 90 ? 'destructive' : project.percentage > 80 ? 'outline' : 'default'}
                  className="flex-shrink-0"
                >
                  {project.percentage}%
                </Badge>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    project.percentage > 90
                      ? 'bg-destructive'
                      : project.percentage > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  )}
                  style={{ width: `${project.percentage}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
        <p>💡 Last updated 2 minutes ago • Real-time monitoring enabled</p>
      </div>
    </div>
  );
}