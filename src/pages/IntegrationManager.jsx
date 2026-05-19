import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, RefreshCw, Copy, CheckCircle, AlertCircle, GitBranch, MessageSquare, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notify } from '@/components/NotificationCenter';
import { formatDistanceToNow } from 'date-fns';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const INTEGRATIONS = [
  { type: 'github', label: 'GitHub', icon: GitBranch, color: 'from-gray-600 to-gray-800' },
  { type: 'slack', label: 'Slack', icon: MessageSquare, color: 'from-purple-600 to-purple-800' },
  { type: 'notion', label: 'Notion', icon: Database, color: 'from-slate-600 to-slate-800' },
];

export default function IntegrationManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    workflow_id: '',
    event_filter: '',
    api_key: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [w, wf] = await Promise.all([
        base44.entities.WebhookIntegration.list('-created_date', 20),
        base44.entities.Workflow.list('-created_date', 20),
      ]);
      setWebhooks(w);
      setWorkflows(wf);
    } catch (err) {
      notify.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function createWebhook() {
    if (!formData.name || !formData.workflow_id || !selectedType) {
      notify.error('Fill in all required fields');
      return;
    }

    try {
      const result = await safeInvoke('setupWebhook', {
        name: formData.name,
        integration_type: selectedType,
        workflow_id: formData.workflow_id,
        event_filter: formData.event_filter,
        api_key: formData.api_key,
      });

      notify.success(`Webhook created: ${formData.name}`);
      setShowForm(false);
      setFormData({ name: '', workflow_id: '', event_filter: '', api_key: '' });
      setSelectedType(null);
      await loadData();
    } catch (err) {
      notify.error(err.message);
    }
  }

  async function deleteWebhook(webhookId) {
    if (!window.confirm('Delete this webhook?')) return;
    try {
      await base44.entities.WebhookIntegration.delete(webhookId);
      notify.success('Webhook deleted');
      await loadData();
    } catch (err) {
      notify.error(err.message);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    notify.success('Copied to clipboard');
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Integration Manager</h1>
          <p className="text-xs text-muted-foreground mt-1">Connect GitHub, Slack, Notion to trigger workflows</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> New Integration
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card-glass rounded-2xl p-6 mb-6 border border-border">
          <h2 className="font-bold text-foreground mb-4">Create New Integration</h2>

          {/* Integration type selector */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {INTEGRATIONS.map(int => (
              <button
                key={int.type}
                onClick={() => setSelectedType(int.type)}
                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                  selectedType === int.type
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <int.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{int.label}</span>
              </button>
            ))}
          </div>

          {/* Form fields */}
          <div className="space-y-3 mb-4">
            <Input
              placeholder="Integration name (e.g., GitHub CI/CD)"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />

            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              value={formData.workflow_id}
              onChange={e => setFormData({ ...formData, workflow_id: e.target.value })}
            >
              <option value="">Select workflow to trigger</option>
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                </option>
              ))}
            </select>

            <Input
              placeholder="Event filter (e.g., 'push', 'pull_request', 'message')"
              value={formData.event_filter}
              onChange={e => setFormData({ ...formData, event_filter: e.target.value })}
            />

            {selectedType === 'notion' && (
              <Input
                placeholder="Notion API Key"
                type="password"
                value={formData.api_key}
                onChange={e => setFormData({ ...formData, api_key: e.target.value })}
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={createWebhook} className="flex-1">
              Create Integration
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      <div className="card-glass rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">Active Webhooks ({webhooks.length})</h2>
          <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {webhooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No webhooks configured yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(webhook => {
              const integration = INTEGRATIONS.find(i => i.type === webhook.integration_type);
              const Icon = integration?.icon;
              return (
                <div key={webhook.id} className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {Icon && <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{webhook.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono truncate">{webhook.webhook_url}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {webhook.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-400" /> Active
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-yellow-400" /> Inactive
                            </>
                          )}
                          {webhook.last_triggered_at && (
                            <>
                              · Last triggered {formatDistanceToNow(new Date(webhook.last_triggered_at), { addSuffix: true })}
                            </>
                          )}
                          {webhook.trigger_count > 0 && (
                            <>
                              · {webhook.trigger_count} triggers
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => deleteWebhook(webhook.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {webhook.last_error && (
                    <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive mb-3">
                      Last error: {webhook.last_error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Workflow:</span>
                      <span className="ml-2 font-mono text-foreground">{webhook.workflow_id}</span>
                    </div>
                    {webhook.event_filter && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Event filter:</span>
                        <span className="ml-2 font-mono text-foreground">{webhook.event_filter}</span>
                      </div>
                    )}
                    <div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 gap-1"
                        onClick={() => copyToClipboard(webhook.webhook_url)}
                      >
                        <Copy className="w-3 h-3" /> Copy Webhook URL
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="card-glass rounded-2xl p-6 border border-border mt-6">
        <h3 className="font-bold text-foreground mb-3">Setup Instructions</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">GitHub</p>
            <p className="text-xs">1. Go to repo Settings → Webhooks → Add webhook</p>
            <p className="text-xs">2. Paste the webhook URL above</p>
            <p className="text-xs">3. Content type: application/json, select events to trigger</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Slack</p>
            <p className="text-xs">1. Create a Slack App in your workspace</p>
            <p className="text-xs">2. Enable Event Subscriptions and subscribe to message events</p>
            <p className="text-xs">3. Paste the webhook URL as your Request URL</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Notion</p>
            <p className="text-xs">1. Create a Notion Integration at notion.so/my-integrations</p>
            <p className="text-xs">2. Generate an API key and paste above when creating integration</p>
            <p className="text-xs">3. Share your database with the integration</p>
          </div>
        </div>
      </div>
    </div>
  );
}