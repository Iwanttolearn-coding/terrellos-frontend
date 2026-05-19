import { useState, useRef } from 'react';
import {
  RefreshCw, ExternalLink, Copy, Monitor, Tablet, Smartphone,
  WifiOff, AlertCircle, CheckCircle, Clock, Loader2
} from 'lucide-react';
import { notify } from '@/components/NotificationCenter';
import { formatDistanceToNow } from 'date-fns';

const VIEWPORTS = [
  { key: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
  { key: 'tablet',  icon: Tablet,  label: 'Tablet',  width: '768px' },
  { key: 'mobile',  icon: Smartphone, label: 'Mobile', width: '375px' },
];

const BUILD_STATUS = {
  pending:   { color: 'text-slate-400',   icon: Clock,       label: 'Pending' },
  building:  { color: 'text-yellow-400',  icon: Loader2,     label: 'Building…', spin: true },
  deployed:  { color: 'text-emerald-400', icon: CheckCircle, label: 'Deployed' },
  failed:    { color: 'text-red-400',     icon: AlertCircle, label: 'Failed' },
};

export default function LivePreviewPanel({ project }) {
  const [viewport, setViewport] = useState('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef(null);

  const previewUrl = project?.live_url || project?.preview_url;
  const vp = VIEWPORTS.find(v => v.key === viewport);
  const buildInfo = BUILD_STATUS[project?.build_status] || BUILD_STATUS.pending;
  const BuildIcon = buildInfo.icon;

  function handleRefresh() {
    setRefreshKey(k => k + 1);
    notify.info('Preview refreshed');
  }

  function copyUrl() {
    if (!previewUrl) return notify.warn('No URL to copy');
    navigator.clipboard.writeText(previewUrl);
    notify.success('URL copied');
  }

  return (
    <div className="flex flex-col h-full bg-card/30 border border-border rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/60 flex-wrap">
        {/* Build status */}
        <div className={`flex items-center gap-1 text-xs ${buildInfo.color}`}>
          <BuildIcon className={`w-3 h-3 ${buildInfo.spin ? 'animate-spin' : ''}`} />
          <span className="font-mono">{buildInfo.label}</span>
        </div>

        <div className="flex-1" />

        {/* Viewport toggles */}
        <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5">
          {VIEWPORTS.map(v => (
            <button
              key={v.key}
              onClick={() => setViewport(v.key)}
              title={v.label}
              className={`p-1.5 rounded-md transition-colors ${viewport === v.key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <v.icon className="w-3 h-3" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <button onClick={handleRefresh} title="Refresh" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <RefreshCw className="w-3 h-3" />
        </button>
        <button onClick={copyUrl} title="Copy URL" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Copy className="w-3 h-3" />
        </button>
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer" title="Open in new tab" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* URL bar */}
      {previewUrl && (
        <div className="px-3 py-1.5 bg-secondary/20 border-b border-border/40">
          <span className="text-[10px] font-mono text-muted-foreground truncate block">{previewUrl}</span>
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 flex items-start justify-center overflow-auto bg-[#1a1a2e] p-2">
        {previewUrl ? (
          <div
            className="transition-all duration-300 h-full bg-white rounded overflow-hidden shadow-2xl"
            style={{ width: vp.width, minHeight: '100%' }}
          >
            <iframe
              key={refreshKey}
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              style={{ minHeight: '600px' }}
              title={`${project?.name} preview`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 gap-3">
            <WifiOff className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-muted-foreground">Preview not connected</p>
            <p className="text-xs text-muted-foreground/60 max-w-xs">Add a <strong>live URL</strong> or <strong>preview URL</strong> in Settings to see your app here.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {project?.last_deployed_at && (
        <div className="px-3 py-1.5 border-t border-border/40 bg-card/40">
          <span className="text-[10px] text-muted-foreground font-mono">
            Last deployed {formatDistanceToNow(new Date(project.last_deployed_at), { addSuffix: true })}
          </span>
        </div>
      )}
    </div>
  );
}