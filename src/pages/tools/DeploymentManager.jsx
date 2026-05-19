import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Rocket, CheckCircle, XCircle, Loader2, ExternalLink,
  Globe, Zap, Copy, RefreshCw
} from 'lucide-react';
import { notify } from '@/components/NotificationCenter';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const PLATFORMS = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Zero-config deployments. Global CDN.',
    color: 'border-white/20 hover:border-white/50',
    activeColor: 'border-white bg-white/10',
    dot: 'bg-white',
    secretKey: 'VERCEL_TOKEN',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Instant deploys. Built-in CI/CD.',
    color: 'border-teal-500/30 hover:border-teal-400/60',
    activeColor: 'border-teal-400 bg-teal-400/10',
    dot: 'bg-teal-400',
    secretKey: 'NETLIFY_TOKEN',
  },
];

const STATUS_MAP = {
  READY: { icon: CheckCircle, color: 'text-emerald-400', label: 'Live' },
  ready: { icon: CheckCircle, color: 'text-emerald-400', label: 'Live' },
  BUILDING: { icon: Loader2, color: 'text-yellow-400', label: 'Building', spin: true },
  building: { icon: Loader2, color: 'text-yellow-400', label: 'Building', spin: true },
  processing: { icon: Loader2, color: 'text-yellow-400', label: 'Processing', spin: true },
  ERROR: { icon: XCircle, color: 'text-destructive', label: 'Error' },
  error: { icon: XCircle, color: 'text-destructive', label: 'Error' },
};

function DeployResult({ result }) {
  const s = STATUS_MAP[result.status] || STATUS_MAP['BUILDING'];
  const Icon = s.icon;

  function copy() {
    navigator.clipboard.writeText(result.url);
    notify.success('URL copied!');
  }

  return (
    <div className="card-glass rounded-2xl p-5 mt-4 border border-emerald-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${s.color} ${s.spin ? 'animate-spin' : ''}`} />
        <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
        <span className="text-xs text-muted-foreground ml-auto font-mono">{result.platform?.toUpperCase()}</span>
      </div>
      <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2.5">
        <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-mono text-foreground flex-1 truncate">{result.url}</span>
        <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
          <Copy className="w-3.5 h-3.5" />
        </button>
        <a href={result.url} target="_blank" rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      {result.deploymentId && (
        <div className="mt-2 text-[10px] font-mono text-muted-foreground">
          ID: {result.deploymentId}
        </div>
      )}
    </div>
  );
}

export default function DeploymentManager() {
  const [platform, setPlatform] = useState('vercel');
  const [projectName, setProjectName] = useState('');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function deploy() {
    if (!html.trim()) { notify.warn('HTML is required to deploy'); return; }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await safeInvoke('deployProject', {
        platform,
        html,
        css,
        js,
        projectName: projectName || 'TerrellOS App',
      });
      setResult(res.data);
      notify.success(`Deployed to ${platform}!`);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Deploy failed';
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple flex-shrink-0">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold gradient-text">Deployment Manager</h1>
          <p className="text-xs text-muted-foreground">Push generated code live to Vercel or Netlify instantly</p>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            className={`rounded-xl border p-4 text-left transition-all ${platform === p.id ? p.activeColor : p.color} card-glass`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${p.dot}`} />
              <span className="text-sm font-semibold text-foreground">{p.name}</span>
              {platform === p.id && <Zap className="w-3 h-3 text-primary ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground">{p.description}</p>
            <p className="text-[10px] font-mono text-muted-foreground/50 mt-1">Requires: {p.secretKey}</p>
          </button>
        ))}
      </div>

      {/* Project Name */}
      <div className="mb-4">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1.5 block">Project Name</label>
        <Input
          placeholder="my-terrellos-app"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className="bg-secondary/40 border-border font-mono text-sm"
        />
      </div>

      {/* Code Inputs */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1.5 block">
            HTML <span className="text-destructive">*</span>
          </label>
          <Textarea
            placeholder="<div>Your generated HTML here...</div>"
            value={html}
            onChange={e => setHtml(e.target.value)}
            className="bg-secondary/40 border-border font-mono text-xs min-h-[140px] resize-y"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1.5 block">CSS</label>
            <Textarea
              placeholder="body { ... }"
              value={css}
              onChange={e => setCss(e.target.value)}
              className="bg-secondary/40 border-border font-mono text-xs min-h-[100px] resize-y"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1.5 block">JavaScript</label>
            <Textarea
              placeholder="console.log('live');"
              value={js}
              onChange={e => setJs(e.target.value)}
              className="bg-secondary/40 border-border font-mono text-xs min-h-[100px] resize-y"
            />
          </div>
        </div>
      </div>

      {/* Deploy Button */}
      <Button
        onClick={deploy}
        disabled={loading}
        className="w-full gradient-purple-blue text-white font-semibold h-11 glow-purple"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deploying…</>
          : <><Rocket className="w-4 h-4 mr-2" />Deploy to {PLATFORMS.find(p => p.id === platform)?.name}</>
        }
      </Button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive flex gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && <DeployResult result={result} />}

      {/* Info banner */}
      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
        <div className="font-semibold text-primary mb-1 font-mono">HOW TO CONNECT</div>
        <p>Add <span className="font-mono text-foreground">VERCEL_TOKEN</span> or <span className="font-mono text-foreground">NETLIFY_TOKEN</span> in Settings → Secrets to enable live deployments.</p>
        <p className="mt-1">Get tokens at <span className="font-mono text-accent">vercel.com/account/tokens</span> or <span className="font-mono text-accent">app.netlify.com/user/applications</span>.</p>
      </div>
    </div>
  );
}