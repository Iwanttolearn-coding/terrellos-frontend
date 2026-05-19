import { useState, useEffect } from 'react';
import { Brain, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/components/NotificationCenter';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const AVAILABLE_MODELS = [
  { value: 'gpt-4o',           label: 'GPT-4o',           provider: 'openai' },
  { value: 'gpt-4o-mini',      label: 'GPT-4o Mini',      provider: 'openai' },
  { value: 'gpt-4.1',          label: 'GPT-4.1',          provider: 'openai' },
  { value: 'claude-3-5-sonnet',label: 'Claude 3.5 Sonnet',provider: 'anthropic' },
  { value: 'claude-3-haiku',   label: 'Claude 3 Haiku',   provider: 'anthropic' },
  { value: 'gemini-pro',       label: 'Gemini Pro',       provider: 'google' },
  { value: 'elevenlabs',       label: 'ElevenLabs TTS',   provider: 'elevenlabs' },
  { value: 'whisper-1',        label: 'Whisper STT',      provider: 'openai' },
];

const TOOL_KEYS = [
  { key: 'ai_builder',         label: 'AI Builder' },
  { key: 'chat_engine',        label: 'Chat Engine' },
  { key: 'code_generator',     label: 'Code Generator' },
  { key: 'error_debugger',     label: 'Error Debugger' },
  { key: 'supabase_architect', label: 'Supabase Architect' },
  { key: 'voice_assistant',    label: 'Voice Assistant' },
  { key: 'app_builder',        label: 'App Builder' },
  { key: 'document_writer',    label: 'Document Writer' },
  { key: 'sermon_builder',     label: 'Sermon Builder' },
  { key: 'companion_ai',       label: 'Companion AI' },
];

export default function ModelRouter() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const rows = []; // AIModelSetting entity removed — models loaded from backend config
    const map = {};
    rows.forEach(r => { map[r.tool_key] = r; });
    setSettings(map);
    setLoading(false);
  }

  async function assign(toolKey, toolLabel, model) {
    setSaving(toolKey);
    try {
      const provider = AVAILABLE_MODELS.find(m => m.value === model)?.provider || 'openai';
      await safeInvoke('assignAIModelToTool', { toolKey, toolName: toolLabel, model, provider });
      setSettings(prev => ({ ...prev, [toolKey]: { ...prev[toolKey], model, provider } }));
      notify.success(`${toolLabel} → ${model}`);
    } catch (err) {
      notify.error(`Failed to assign: ${err.message}`);
    }
    setSaving('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-xs text-muted-foreground font-mono">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading model assignments…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-4">
        AI Model Router — Assign models to tools
      </div>
      {TOOL_KEYS.map(({ key, label }) => {
        const current = settings[key];
        const currentModel = current?.model || 'gpt-4o-mini';
        return (
          <div key={key} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
            <Brain className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{label}</div>
              <div className="text-[10px] font-mono text-muted-foreground">{key}</div>
            </div>
            <select
              value={currentModel}
              onChange={e => assign(key, label, e.target.value)}
              disabled={saving === key}
              className="bg-secondary border border-border rounded-lg text-xs text-foreground px-2 py-1.5 font-mono focus:outline-none focus:border-primary/50 min-w-[160px]"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label} ({m.provider})</option>
              ))}
            </select>
            {saving === key ? (
              <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin flex-shrink-0" />
            ) : current?.model ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}