/**
 * BackendWakeUp — shows friendly "waking up" state instead of error
 * when Fly.io backend is cold-starting.
 */
import { useState, useEffect } from 'react';
import { Server, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BackendWakeUp({ onRetry, message, coldStart = false }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!coldStart) return;
    const iv = setInterval(() => setDots(d => d.length < 3 ? d + '.' : ''), 500);
    return () => clearInterval(iv);
  }, [coldStart]);

  if (!coldStart && !message) return null;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
        {coldStart ? (
          <Server className="w-7 h-7 text-primary animate-pulse" />
        ) : (
          <WifiOff className="w-7 h-7 text-destructive" />
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-foreground mb-1">
          {coldStart ? `Backend waking up${dots}` : 'Backend Unavailable'}
        </h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          {coldStart
            ? 'The TerrellOS backend on Fly.io is spinning up. This takes a few seconds on first request.'
            : (message || 'Could not reach the backend. Please try again.')}
        </p>
      </div>

      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}