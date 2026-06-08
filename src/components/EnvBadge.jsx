/**
 * EnvBadge — global environment indicator shown in the top bar.
 * PRODUCTION / STAGING / DEV
 */
import React from 'react';
import { ENV, currentEnvConfig } from '@/lib/envDetect';
import { Shield } from 'lucide-react';

export default function EnvBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${currentEnvConfig.badgeClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${currentEnvConfig.dotClass} animate-pulse`} />
      {currentEnvConfig.label}
      {currentEnvConfig.writeProtected && (
        <Shield className="w-2.5 h-2.5 ml-0.5 opacity-70" />
      )}
    </span>
  );
}