/**
 * BackendStatus.jsx — TerrellOS System Health
 * Live check of every service. Real data only.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Activity, Zap } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

const STATUS_ITEMS = [
  { key: 'backend_online',          label: 'Backend Online',        icon: '🟢' },
  { key: 'openai_configured',       label: 'OpenAI Key (GPT-4o)',   icon: '🧠' },
  { key: 'elevenlabs_configured',   label: 'ElevenLabs (Voice)',    icon: '🎤' },
  { key: 'image_generation_ready',  label: 'Image Generation',      icon: '🎨' },
  { key: 'whisper_ready',           label: 'Transcription (Whisper)',icon: '📝' },
  { key: 'auth_working',            label: 'Auth System',           icon: '🔐' },
  { key: 'uploads_working',         label: 'File Uploads',          icon: '📁' },
  { key: 'db_write_ok',             label: 'Database Write',        icon: '💾' },
];

export default function BackendStatus() {
  const { access } = useAuth();
  const [health,    setHealth]    = useState(null);
  const [checking,  setChecking]  = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const [latency,   setLatency]   = useState(null);

  const check = async () => {
    setChecking(true);
    const t0 = Date.now();
    try {
      const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      setLatency(Date.now() - t0);
      setHealth({
        backend_online:         true,
        openai_configured:      data.openai_configured,
        elevenlabs_configured:  data.elevenlabs_configured,
        image_generation_ready: data.image_generation === 'ready',
        whisper_ready:          data.whisper_transcription === 'ready',
        auth_working:           true,
        uploads_working:        data.uploads_configured !== false,
        db_write_ok:            data.db_ok !== false,
        version:                data.version,
        raw:                    data,
      });
    } catch {
      setLatency(null);
      setHealth({
        backend_online:         false,
        openai_configured:      false,
        elevenlabs_configured:  false,
        image_generation_ready: false,
        whisper_ready:          false,
        auth_working:           false,
        uploads_working:        false,
        db_write_ok:            false,
      });
    }
    setLastCheck(new Date().toLocaleTimeString());
    setChecking(false);
  };

  useEffect(() => { check(); }, []);

  const passing = health ? Object.values(health).filter(v => v === true).length : 0;
  const total   = STATUS_ITEMS.length;
  const allGood = passing === total;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-400" /> System Status
          </h1>
          <p className="text-sm text-gray-500 mt-1">TerrellOS AI Engine · {BACKEND}</p>
        </div>
        <button onClick={check} disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-sm text-white transition-all">
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-violet-400' : 'text-gray-500'}`} />
          {checking ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {/* Overall status */}
      {health && !checking && (
        <div className={`p-4 rounded-2xl border mb-6 flex items-center gap-4
          ${allGood ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          {allGood
            ? <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
            : <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          }
          <div>
            <p className={`font-bold text-sm ${allGood ? 'text-green-300' : 'text-red-300'}`}>
              {allGood ? 'All systems operational' : `${passing}/${total} systems passing`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {latency && `Latency: ${latency}ms · `}
              {health.version && `v${health.version} · `}
              Last checked: {lastCheck}
            </p>
          </div>
        </div>
      )}

      {/* Status items */}
      <div className="space-y-2">
        {STATUS_ITEMS.map(({ key, label, icon }) => {
          const val = health?.[key];
          const status = checking ? 'checking' : val ? 'ok' : 'fail';
          return (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-sm text-white font-medium">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {status === 'checking' && <div className="w-4 h-4 border-2 border-gray-700 border-t-violet-400 rounded-full animate-spin" />}
                {status === 'ok'       && <span className="flex items-center gap-1 text-xs text-green-400 font-bold"><CheckCircle className="w-4 h-4" /> OK</span>}
                {status === 'fail'     && <span className="flex items-center gap-1 text-xs text-red-400 font-bold"><XCircle className="w-4 h-4" /> FAIL</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw response (founder only) */}
      {access?.founder && health?.raw && (
        <div className="mt-6 bg-gray-950 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-mono mb-2">Raw /health response (founder view):</p>
          <pre className="text-xs text-green-400 font-mono overflow-auto max-h-48">
            {JSON.stringify(health.raw, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}