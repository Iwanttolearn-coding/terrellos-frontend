import { useState, useEffect } from 'react';
import { notify } from '@/components/NotificationCenter';
import { GitBranch, RefreshCw, CheckCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const DEFAULT_REPO = 'base44dev/terrellosbuild';
const DEFAULT_BRANCH = 'main';

export default function GitHubSync() {
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [branch, setBranch] = useState(DEFAULT_BRANCH);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, connected, failed
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    checkSyncStatus();
  }, []);

  async function checkSyncStatus() {
    try {
      const logs = []; // BuildLog loaded from backend /v1/logs if available
      const syncLog = logs.find(l => l.backend_response?.includes?.('github_sync'));
      if (syncLog) {
        setLastSync(syncLog.created_date);
        setSyncStatus(syncLog.status === 'success' ? 'connected' : 'failed');
        if (syncLog.status === 'failed') {
          setSyncError(syncLog.error_message || 'Last sync failed');
        }
      } else {
        setSyncStatus('idle');
      }
    } catch (err) {
      console.error('Failed to check sync status:', err);
    }
  }

  async function handleSync() {
    if (!repo.trim()) {
      notify.error('Repository URL is required');
      return;
    }

    setSyncing(true);
    setSyncError('');

    try {
      const res = await safeInvoke('githubSync', {
        repo: repo.trim(),
        branch: branch.trim() || DEFAULT_BRANCH,
      });

      if (res.data?.error) {
        setSyncStatus('failed');
        setSyncError(res.data.error);
        notify.error(`Sync failed: ${res.data.error}`);
      } else {
        setSyncStatus('connected');
        setLastSync(new Date().toISOString());
        notify.success(`Synced to ${res.data.repoUrl}/${res.data.branch}`);
      }
    } catch (error) {
      setSyncStatus('failed');
      setSyncError(error.message || 'Sync failed');
      notify.error(`GitHub sync error: ${error.message}`);
    } finally {
      setSyncing(false);
      checkSyncStatus();
    }
  }

  const statusConfig = {
    idle: { color: 'text-muted-foreground', bg: 'bg-muted/20', label: 'Not Connected', icon: Clock },
    connected: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Connected', icon: CheckCircle },
    failed: { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed', icon: AlertTriangle },
  };

  const config = statusConfig[syncStatus];
  const StatusIcon = config.icon;

  return (
    <div className="card-glass rounded-2xl p-5 border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">GitHub Sync</div>
        <a
          href={`https://github.com/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" /> View Repo
        </a>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg} ${config.color}`}>
        <StatusIcon className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-semibold">{config.label}</span>
        {lastSync && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Error display */}
      {syncError && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {syncError}
        </div>
      )}

      {/* Config inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Repository</label>
          <input
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="owner/repo"
            className="w-full bg-input border border-border rounded-lg text-sm text-foreground px-3 py-2 font-mono focus:outline-none focus:border-primary/50"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Branch</label>
          <input
            value={branch}
            onChange={e => setBranch(e.target.value)}
            placeholder="main"
            className="w-full bg-input border border-border rounded-lg text-sm text-foreground px-3 py-2 font-mono focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Sync button */}
      <Button
        onClick={handleSync}
        disabled={syncing || !repo.trim()}
        className="w-full gap-2 gradient-purple-blue text-white border-0"
      >
        {syncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Syncing…
          </>
        ) : (
          <>
            <GitBranch className="w-4 h-4" />
            Sync to GitHub
          </>
        )}
      </Button>
    </div>
  );
}