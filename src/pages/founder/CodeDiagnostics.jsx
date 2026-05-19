import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { isFounderEmail } from '@/lib/production';
import { notify } from '@/components/NotificationCenter';
import ScanResults from '@/components/diagnostics/ScanResults';
import PatchApproval from '@/components/diagnostics/PatchApproval';
import ModelRouter from '@/components/diagnostics/ModelRouter';
import GitHubSync from '@/components/GitHubSync';
import {
  Terminal, GitBranch, Scan, RefreshCw, ShieldCheck,
  AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight, Layers, Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const TABS = [
  { id: 'scanner',  label: 'Code Scanner',   icon: Scan },
  { id: 'patches',  label: 'Patch Approval',  icon: ShieldCheck },
  { id: 'models',   label: 'Model Router',    icon: Layers },
  { id: 'history',  label: 'Build History',   icon: Clock },
];

const PRESET_REPOS = [
  { label: 'TerrellOS (this app)',     url: 'https://github.com/tmdesigns/terrellos',            branch: 'main' },
  { label: 'Heavenly Eternal Echo',    url: 'https://github.com/tmdesigns/heavenly-eternal-echo', branch: 'main' },
  { label: 'Pastor AI Connect',        url: 'https://github.com/tmdesigns/pastor-ai-connect',    branch: 'main' },
  { label: 'Kindred Love Birds',       url: 'https://github.com/tmdesigns/kindred-love-birds',   branch: 'main' },
  { label: 'ResidentSync AI',          url: 'https://github.com/tmdesigns/residentsync-ai',      branch: 'main' },
  { label: 'TMG Torque',               url: 'https://github.com/tmdesigns/tmg-torque',           branch: 'main' },
  { label: 'All Around Customs',       url: 'https://github.com/tmdesigns/all-around-customs',   branch: 'main' },
];

const SCAN_TYPES = [
  { value: 'full',    label: 'Full Scan' },
  { value: 'quick',   label: 'Quick Scan (imports + routes only)' },
  { value: 'auth',    label: 'Auth & Security Scan' },
  { value: 'deploy',  label: 'Deployment Readiness' },
];

export default function CodeDiagnostics() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('scanner');

  // Scanner state
  const [repoUrl, setRepoUrl]     = useState('');
  const [branch, setBranch]       = useState('main');
  const [scanType, setScanType]   = useState('full');
  const [targetApp, setTargetApp] = useState('TerrellOS');
  const [githubToken, setGithubToken] = useState('');
  const [scanning, setScanning]   = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError]   = useState('');

  // Patch state
  const [generatingPatch, setGeneratingPatch] = useState(false);
  const [patchPlan, setPatchPlan]   = useState(null);
  const [patchError, setPatchError] = useState('');

  // History
  const [logs, setLogs]         = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Auth guard
  if (user !== null && !isFounderEmail(user?.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card-glass rounded-2xl p-8 max-w-sm w-full text-center border border-destructive/30">
          <ShieldCheck className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Founder Access Required</h2>
          <p className="text-sm text-muted-foreground">This page is restricted to TerrellOS founders.</p>
        </div>
      </div>
    );
  }

  async function runScan() {
    if (!repoUrl.trim()) { setScanError('Repo URL is required.'); return; }
    setScanning(true);
    setScanError('');
    setScanResult(null);
    try {
      const res = await safeInvoke('analyzeCodebase', {
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || 'main',
        scanType,
        targetApp,
        githubToken: githubToken.trim() || undefined,
      });
      if (res.data?.error) {
        setScanError(res.data.error);
      } else {
        setScanResult(res.data);
        notify.success(`Scan complete — ${res.data.status}`);
      }
    } catch (err) {
      setScanError(err.message || 'Scan failed. Check backend logs.');
    }
    setScanning(false);
  }

  async function generatePatch() {
    if (!scanResult?.bugsFound?.length && !scanResult?.recommendedFixes?.length) {
      setPatchError('No bugs or fixes to generate a patch for.');
      return;
    }
    setGeneratingPatch(true);
    setPatchError('');
    setPatchPlan(null);
    try {
      const res = await safeInvoke('generatePatchPlan', {
        bugs: scanResult.bugsFound || [],
        recommendedFixes: scanResult.recommendedFixes || [],
        repoContext: `${scanResult.repo}@${scanResult.branch}`,
        targetApp,
      });
      if (res.data?.error) {
        setPatchError(res.data.error);
      } else {
        setPatchPlan(res.data);
        setActiveTab('patches');
        notify.success('Patch plan ready — awaiting founder approval');
      }
    } catch (err) {
      setPatchError(err.message || 'Patch generation failed.');
    }
    setGeneratingPatch(false);
  }

  async function loadHistory() {
    setLogsLoading(true);
    const rows = await base44.entities.BuildLog.list('-created_date', 30).catch(() => []);
    setLogs(rows.filter(r => ['analyze_screenshot', 'custom'].includes(r.command_type)));
    setLogsLoading(false);
  }

  const statusIcon = (s) => {
    if (s === 'success') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
    if (s === 'failed')  return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple flex-shrink-0">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Code Diagnostics</h1>
            <p className="text-xs text-muted-foreground font-mono">TerrellOS AI Software Mechanic — Scan · Debug · Patch · Deploy</p>
          </div>
        </div>
        <a href="/founder/patch-center">
          <Button size="sm" className="gap-2 gradient-purple-blue text-white border-0">
            <Wrench className="w-3.5 h-3.5" /> Go to Patch Center
          </Button>
        </a>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 mb-6 border-b border-border pb-0 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{tab.label}
              {tab.id === 'patches' && patchPlan && (
                <span className="ml-1 w-4 h-4 rounded-full bg-primary text-[9px] text-white flex items-center justify-center font-bold">
                  {patchPlan.patchPlan?.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── GITHUB SYNC ── */}
      <div className="mb-6">
        <GitHubSync />
      </div>

      {/* ── SCANNER TAB ── */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          {/* Config card */}
          <div className="card-glass rounded-2xl p-5 border border-border space-y-4">
            <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Repository Config</div>

            {/* Preset selector */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Quick Select App</label>
              <select
                className="w-full bg-secondary border border-border rounded-xl text-sm text-foreground px-3 py-2.5 font-mono focus:outline-none focus:border-primary/50"
                onChange={e => {
                  const preset = PRESET_REPOS.find(p => p.url === e.target.value);
                  if (preset) { setRepoUrl(preset.url); setBranch(preset.branch); setTargetApp(preset.label); }
                }}
                defaultValue=""
              >
                <option value="">— select a preset —</option>
                {PRESET_REPOS.map(p => <option key={p.url} value={p.url}>{p.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">GitHub Repo URL</label>
                <input
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full bg-input border border-border rounded-xl text-sm text-foreground px-3 py-2.5 font-mono focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Branch</label>
                <input
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-input border border-border rounded-xl text-sm text-foreground px-3 py-2.5 font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Scan Type</label>
                <select
                  value={scanType}
                  onChange={e => setScanType(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl text-sm text-foreground px-3 py-2.5 font-mono focus:outline-none focus:border-primary/50"
                >
                  {SCAN_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Target App Name</label>
                <input
                  value={targetApp}
                  onChange={e => setTargetApp(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl text-sm text-foreground px-3 py-2.5 font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                GitHub Token <span className="text-muted-foreground/50">(optional — required for private repos)</span>
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxx"
                className="w-full bg-input border border-border rounded-xl text-sm text-foreground px-3 py-2.5 font-mono focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
              />
            </div>

            {scanError && (
              <div className="flex items-start gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {scanError}
              </div>
            )}

            <Button
              onClick={runScan}
              disabled={scanning || !repoUrl.trim()}
              className="w-full gap-2 gradient-purple-blue text-white border-0 h-11"
            >
              {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              {scanning ? 'Scanning Repository…' : 'Run Code Scan'}
            </Button>
          </div>

          {/* Results */}
          {scanning && (
            <div className="card-glass rounded-2xl p-8 border border-border text-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Scanning {repoUrl}…</p>
              <p className="text-xs text-muted-foreground mt-1">Fetching file tree · Reading key files · Running AI analysis</p>
            </div>
          )}

          {scanResult && !scanning && (
            <ScanResults
              result={scanResult}
              onGeneratePatch={generatePatch}
            />
          )}

          {generatingPatch && (
            <div className="card-glass rounded-2xl p-6 border border-primary/30 text-center">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-foreground">Generating AI patch plan…</p>
            </div>
          )}

          {patchError && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {patchError}
            </div>
          )}
        </div>
      )}

      {/* ── PATCH APPROVAL TAB ── */}
      {activeTab === 'patches' && (
        <div>
          {patchPlan ? (
            <PatchApproval plan={patchPlan} />
          ) : (
            <div className="card-glass rounded-2xl p-12 border border-border text-center">
              <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">No patch plan yet</p>
              <p className="text-sm text-muted-foreground mb-4">Run a code scan first, then click "Generate Patch Plan" from the results.</p>
              <Button variant="outline" onClick={() => setActiveTab('scanner')} className="gap-1">
                <ChevronRight className="w-4 h-4" /> Go to Scanner
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── MODEL ROUTER TAB ── */}
      {activeTab === 'models' && (
        <div className="card-glass rounded-2xl p-5 border border-border">
          <ModelRouter />
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="card-glass rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Build &amp; Scan History
            </div>
            <Button size="sm" variant="ghost" onClick={loadHistory} disabled={logsLoading} className="h-7 text-xs gap-1">
              <RefreshCw className={`w-3 h-3 ${logsLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto scrollbar-dark">
            {logsLoading ? (
              <div className="py-10 text-center text-xs text-muted-foreground animate-pulse">Loading history…</div>
            ) : logs.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">No scan history yet. Run your first scan.</div>
            ) : logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="mt-0.5 flex-shrink-0">{statusIcon(log.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground font-medium truncate">{log.prompt || log.command_type}</div>
                  {log.project_name && <div className="text-[10px] font-mono text-muted-foreground">{log.project_name}</div>}
                  {log.backend_response && (() => {
                    try {
                      const d = JSON.parse(log.backend_response);
                      return <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
                        {d.status} · {d.bugs ?? ''}{d.bugs !== undefined ? ` bugs · ${d.critical} critical` : ''}
                      </div>;
                    } catch { return null; }
                  })()}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
                  {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}