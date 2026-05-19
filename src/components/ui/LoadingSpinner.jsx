/**
 * LoadingSpinner — consistent full-page and inline loading states.
 * Usage:
 *   <LoadingSpinner /> — full page centered
 *   <LoadingSpinner size="sm" inline /> — inline small spinner
 *   <LoadingSpinner label="Fetching data…" /> — with label
 */
import { cn } from '@/lib/utils';

export default function LoadingSpinner({ size = 'md', inline = false, label = '', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-2' };

  const spinner = (
    <div className={cn(
      'rounded-full border-primary/30 border-t-primary animate-spin flex-shrink-0',
      sizes[size],
      className
    )} />
  );

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        {spinner}
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
      {label && <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">{label}</p>}
    </div>
  );
}