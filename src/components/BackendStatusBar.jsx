/**
 * BackendStatusBar.jsx — TerrellOS
 * Live backend status in topbar. Real ping. No demo.
 */
import { useState, useEffect } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

export default function BackendStatusBar() {
  const [status, setStatus] = useState('checking'); // checking | online | offline

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(6000) });
        if (!mounted) return;
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        if (mounted) setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 60000); // re-check every 60s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        status === 'checking' ? 'bg-yellow-400 animate-pulse' :
        status === 'online'   ? 'bg-green-400 animate-pulse' :
                                'bg-red-400'
      }`} />
      <span className={`hidden sm:block font-mono ${
        status === 'online' ? 'text-green-400/70' :
        status === 'offline' ? 'text-red-400/70' : 'text-gray-600'
      }`}>
        {status === 'checking' ? 'Connecting…' : status === 'online' ? 'AI Engine Online' : 'AI Engine Offline'}
      </span>
    </div>
  );
}
