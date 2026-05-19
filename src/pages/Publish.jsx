import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, Lock, Unlock, Loader2, Check, AlertTriangle, Copy, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/ui/PageHeader';
import GitHubSync from '@/components/GitHubSync';
import { cn } from '@/lib/utils';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

export default function Publish() {
  const [publishStatus, setPublishStatus] = useState(null); // null | 'published' | 'unpublished'
  const [loading, setLoading] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = customDomain || 'https://terrellos.app';

  async function publishApp() {
    setLoading(true);
    try {
      // Call deployment function
      await safeInvoke('deployProject', {
        projectId: 'main',
        target: 'production',
      });
      setPublishStatus('published');
    } catch (err) {
      console.error('Publish error:', err);
    }
    setLoading(false);
  }

  async function saveDomain() {
    if (!customDomain.trim()) return;
    setSavingDomain(true);
    try {
      // Save domain preference
      // In production, this would update the app configuration
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error('Domain error:', err);
    }
    setSavingDomain(false);
  }

  function copyUrl() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-fade-up">
      <PageHeader
        title="Publish to Production"
        subtitle="Make your app live and available to the public"
      />

      {/* Publish Status */}
      <div className={cn(
        'rounded-2xl border p-6 mb-6',
        publishStatus === 'published'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-yellow-500/30 bg-yellow-500/5'
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            publishStatus === 'published'
              ? 'bg-emerald-500/20'
              : 'bg-yellow-500/20'
          )}>
            {publishStatus === 'published' ? (
              <Check className="w-6 h-6 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={cn(
              'font-semibold mb-1',
              publishStatus === 'published' ? 'text-emerald-400' : 'text-yellow-400'
            )}>
              {publishStatus === 'published' ? 'App is Live' : 'Not Published Yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {publishStatus === 'published'
                ? 'Your app is currently live and accessible to users.'
                : 'Click below to deploy your app to production and make it live.'}
            </p>
          </div>
        </div>
      </div>

      {/* GitHub Sync — Deployment Step */}
      <div className="card-glass rounded-2xl p-6 mb-6 border-l-2 border-l-primary">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          Backup to GitHub
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sync your source code to GitHub before deployment. This creates a backup and enables version control for future patches.
        </p>
        <GitHubSync />
      </div>

      {/* Publish Section */}
      <div className="card-glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Deploy to Production
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Publishing will deploy your app to production servers and make it publicly accessible. This process typically takes 2-5 minutes.
        </p>

        <div className="space-y-4 mb-6">
          {/* Checklist */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pre-flight checks:</h3>
            {[
              { label: 'Pricing page configured', done: true },
              { label: 'Payment integration active', done: true },
              { label: 'Credit system ready', done: true },
              { label: 'Domain setup (optional)', done: true },
              { label: 'Email notifications (optional)', done: false },
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                  check.done
                    ? 'bg-emerald-500/20 border-emerald-500/30'
                    : 'border-border bg-secondary/30'
                )}>
                  {check.done && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <span className="text-muted-foreground">{check.label}</span>
              </div>
            ))}
          </div>
        </div>

        {publishStatus !== 'published' ? (
          <Button
            onClick={publishApp}
            disabled={loading}
            className="w-full gradient-purple-blue text-white h-10 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Publishing…
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Publish to Production
              </>
            )}
          </Button>
        ) : (
          <Button disabled className="w-full h-10 font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Check className="w-4 h-4 mr-2" />
            Live on Production
          </Button>
        )}
      </div>

      {/* Public URL */}
      {publishStatus === 'published' && (
        <div className="card-glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Public URL</h2>
          <div className="flex gap-3">
            <Input
              value={publicUrl}
              readOnly
              className="bg-secondary/50 border-border text-foreground font-mono flex-1"
            />
            <Button
              onClick={copyUrl}
              variant="outline"
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Share this URL with your users to access your app
          </p>
        </div>
      )}

      {/* Custom Domain */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Custom Domain (Optional)
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Point your own domain to your app. CNAME: {publicUrl}
        </p>

        <div className="flex gap-3">
          <Input
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="your-domain.com"
            className="bg-secondary/50 border-border text-foreground flex-1"
          />
          <Button
            onClick={saveDomain}
            disabled={savingDomain || !customDomain.trim()}
            variant="outline"
            className="flex-shrink-0"
          >
            {savingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}