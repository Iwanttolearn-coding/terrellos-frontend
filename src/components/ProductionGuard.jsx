/**
 * ProductionGuard — wraps settings/write UIs.
 * Blocks interaction and shows a lock banner when not in production.
 */
import { IS_PRODUCTION, ENV } from '@/lib/envDetect';
import { Shield, Lock } from 'lucide-react';

export default function ProductionGuard({ children, label = 'This section' }) {
  if (IS_PRODUCTION) return children;

  return (
    <div className="relative">
      {/* Dimmed content */}
      <div className="opacity-30 pointer-events-none select-none">{children}</div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm border border-yellow-500/30">
        <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center">
          <Lock className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-bold text-yellow-300">{label} is production-locked</p>
          <p className="text-xs text-muted-foreground mt-1">
            You are in <span className="font-mono font-bold text-yellow-400">{ENV.toUpperCase()}</span>. 
            Deploy to <span className="font-mono text-foreground">terrellos.vercel.app</span> to unlock writes.
          </p>
        </div>
      </div>
    </div>
  );
}