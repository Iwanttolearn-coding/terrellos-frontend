/**
 * NotificationCenter — global toast system.
 * Usage: import { notify } from '@/components/NotificationCenter'
 * notify.success('Done!') / notify.error('...') / notify.warn('...')
 */

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

let _dispatch = null;
let _soundEnabled = true;

function playBeep(type) {
  if (!_soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = type === 'success' ? 880 : type === 'error' ? 220 : 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warn: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error:   'border-destructive/30 bg-destructive/10 text-destructive',
  warn:    'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  info:    'border-primary/30 bg-primary/10 text-primary',
};

let _id = 0;

export const notify = {
  success: (msg) => _dispatch?.({ id: ++_id, type: 'success', msg }),
  error:   (msg) => _dispatch?.({ id: ++_id, type: 'error',   msg }),
  warn:    (msg) => _dispatch?.({ id: ++_id, type: 'warn',    msg }),
  info:    (msg) => _dispatch?.({ id: ++_id, type: 'info',    msg }),
};

export default function NotificationCenter() {
  const [toasts, setToasts] = useState([]);
  const [sound, setSound] = useState(true);

  const add = useCallback((toast) => {
    playBeep(toast.type);
    setToasts(p => [...p.slice(-4), toast]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== toast.id)), 4500);
  }, []);

  useEffect(() => { _dispatch = add; return () => { _dispatch = null; }; }, [add]);

  function toggleSound() {
    _soundEnabled = !sound;
    setSound(v => !v);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        className="pointer-events-auto mb-1 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors opacity-50 hover:opacity-100"
        title={sound ? 'Mute notifications' : 'Unmute notifications'}
      >
        <Volume2 className={`w-3 h-3 ${sound ? 'text-foreground' : 'text-muted-foreground'}`} />
      </button>

      {toasts.map(t => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm shadow-xl max-w-xs w-full animate-fade-up',
              STYLES[t.type]
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1 leading-snug">{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-60 hover:opacity-100 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}