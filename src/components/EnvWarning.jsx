/**
 * EnvWarning — shows a founder/admin warning when VITE_BACKEND_URL is missing.
 */
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { isFounderEmail } from '@/lib/resolveUserAccess';

const BACKEND_URL = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_BACKEND_URL : null;

export default function EnvWarning({ userEmail }) {
  if (BACKEND_URL) return null;

  const isFounder = isFounderEmail(userEmail);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-xs ${
      isFounder
        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
        : 'bg-muted/50 border-border text-muted-foreground'
    }`}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        {isFounder ? (
          <>
            <span className="font-bold">VITE_BACKEND_URL missing.</span>{' '}
            Add <code className="font-mono bg-black/20 px-1 rounded">VITE_BACKEND_URL=https://terrellos-backend.fly.dev</code> to your environment variables.
          </>
        ) : (
          'Some features are temporarily unavailable. Please try again later.'
        )}
      </div>
    </div>
  );
}