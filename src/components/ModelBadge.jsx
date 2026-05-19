/**
 * ModelBadge — shows which AI model is powering the current tool.
 * Usage: <ModelBadge toolKey="ai_builder" />
 */
import { useState, useEffect } from 'react';
import { Brain, Loader2, AlertTriangle } from 'lucide-react';
import { getModelForTool } from '@/lib/modelResolver';

const PROVIDER_COLOR = {
  openai:    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  anthropic: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  google:    'text-blue-400 border-blue-500/30 bg-blue-500/10',
  local:     'text-muted-foreground border-border bg-secondary/40',
  base44:    'text-primary border-primary/30 bg-primary/10',
};

export default function ModelBadge({ toolKey, className = '' }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!toolKey) return;
    getModelForTool(toolKey).then(setInfo);
  }, [toolKey]);

  if (!info) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-secondary/40 text-muted-foreground ${className}`}>
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        loading model…
      </span>
    );
  }

  if (!info.is_active) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 ${className}`}>
        <AlertTriangle className="w-2.5 h-2.5" />
        TOOL DISABLED
      </span>
    );
  }

  const color = PROVIDER_COLOR[info.provider] || PROVIDER_COLOR.local;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg border ${color} ${className}`}>
      <Brain className="w-2.5 h-2.5" />
      {info.model}
      {info.source === 'default' && (
        <span className="opacity-50 ml-0.5">(default)</span>
      )}
    </span>
  );
}