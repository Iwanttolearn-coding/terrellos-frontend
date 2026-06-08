import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  building: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  paused: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  archived: 'bg-muted text-muted-foreground border-border',
  error: 'bg-destructive/15 text-destructive border-destructive/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed: 'bg-destructive/15 text-destructive border-destructive/30',
  running: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  skipped: 'bg-muted text-muted-foreground border-border',
  connected: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  unchecked: 'bg-muted text-muted-foreground border-border',
  timeout: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  pass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  fail: 'bg-destructive/15 text-destructive border-destructive/30',
  skip: 'bg-muted text-muted-foreground border-border',
  healthy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  degraded: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
  available: 'bg-primary/15 text-primary border-primary/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  coming_soon: 'bg-muted text-muted-foreground border-border',
};

export default function StatusBadge({ status, className }) {
  const style = STATUS_STYLES[status] || 'bg-muted text-muted-foreground border-border';
  const label = (status || '').replace(/_/g, ' ');
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border uppercase tracking-wide',
      style, className
    )}>
      {label}
    </span>
  );
}