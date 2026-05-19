import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getEffectiveAccess } from '@/lib/ownerConfig';
import { Brain, Save, RefreshCw, Loader2, CheckCircle, AlertTriangle, Zap, DollarSign, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ── Model registry ────────────────────────────────────────────────
const MODEL_OPTIONS = [
  { value: 'gpt-4.1',             label: 'GPT-4.1',             provider: 'openai',    cost: 'high',      desc: 'Advanced coding + deep reasoning' },
  { value: 'gpt-4.1-mini',        label: 'GPT-4.1 mini',        provider: 'openai',    cost: 'low',       desc: 'Cheap, fast — ideal for simple tasks' },
  { value: 'gpt-4o',              label: 'GPT-4o',              provider: 'openai',    cost: 'medium',    desc: 'Voice + multimodal, balanced speed' },
  { value: 'gpt-4o-mini',         label: 'GPT-4o mini',         provider: 'openai',    cost: 'low',       desc: 'Lightweight chat and summaries' },
  { value: 'claude-sonnet-4',     label: 'Claude Sonnet 4',     provider: 'anthropic', cost: 'high',      desc: 'Code review, long context, analysis' },
  { value: 'claude-opus-4',       label: 'Claude Opus 4',       provider: 'anthropic', cost: 'very_high', desc: 'Max intelligence — complex reasoning' },
  { value: 'gemini-2.0-flash',    label: 'Gemini 2.0 Flash',    provider: 'google',    cost: 'low',       desc: 'Fast web-aware tasks' },
  { value: 'local-fallback',      label: 'Local / Fallback',    provider: 'local',     cost: 'low',       desc: 'Disabled or coming soon' },
];

// ── Default tool configurations ───────────────────────────────────
const DEFAULT_TOOLS = [
  { tool_key: 'ai_builder',         tool_name: 'AI Builder',            model: 'gpt-4.1',      provider: 'openai',    cost_level: 'high',      best_use: 'Full app generation and complex prompts',   is_active: true },
  { tool_key: 'error_debugger',     tool_name: 'Error Debugger',        model: 'gpt-4.1',      provider: 'openai',    cost_level: 'high',      best_use: 'Root cause analysis and fix generation',    is_active: true },
  { tool_key: 'code_generator',     tool_name: 'Code Generator',        model: 'gpt-4.1',      provider: 'openai',    cost_level: 'high',      best_use: 'Precise code output with line changes',     is_active: true },
  { tool_key: 'supabase_architect', tool_name: 'Supabase Architect',    model: 'gpt-4.1-mini', provider: 'openai',    cost_level: 'low',       best_use: 'Schema design + SQL generation',            is_active: true },
  { tool_key: 'vercel_fixer',       tool_name: 'Vercel Deployment Fixer', model: 'gpt-4.1',    provider: 'openai',    cost_level: 'high',      best_use: 'Deployment errors + config issues',         is_active: true },
  { tool_key: 'voice_assistant',    tool_name: 'Voice Assistant',       model: 'gpt-4o',       provider: 'openai',    cost_level: 'medium',    best_use: 'Real-time voice and multimodal tasks',      is_active: true },
  { tool_key: 'app_builder',        tool_name: 'App Builder',           model: 'gpt-4.1',      provider: 'openai',    cost_level: 'high',      best_use: 'Full-stack app scaffolding',                is_active: true },
  { tool_key: 'document_writer',    tool_name: 'Document Writer',       model: 'gpt-4.1-mini', provider: 'openai',    cost_level: 'low',       best_use: 'Docs, readmes, changelogs, summaries',      is_active: true },
];

const COST_STYLE = {
  low:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  medium:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  high:      'bg-orange-500/15 text-orange-400 border-orange-500/25',
  very_high: 'bg-red-500/15 text-red-400 border-red-500/25',
};
const COST_LABEL = { low: '$', medium: '$$', high: '$$$', very_high: '$$$$' };

const PROVIDER_STYLE = {
  openai:    'bg-emerald-500/10 text-emerald-300',
  anthropic: 'bg-orange-500/10 text-orange-300',
  google:    'bg-blue-500/10 text-blue-300',
  local:     'bg-secondary text-muted-foreground',
  base44:    'bg-primary/10 text-primary',
};

function GlobalModelCard({ label, desc, value, options, onChange }) {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Cpu className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-secondary/50 border-border text-foreground text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(m => (
            <SelectItem key={m.value} value={m.value}>
              {m.label} — {m.desc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function AIModels() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [access, setAccess] = useState(null);
  const [globalAdvanced, setGlobalAdvanced] = useState('gpt-4.1');
  const [globalFast, setGlobalFast] = useState('gpt-4.1-mini');
  const [globalVoice, setGlobalVoice] = useState('gpt-4o');

  useEffect(() => {
    async function init() {
      const u = await base44.auth.me().catch(() => null);
      const acc = getEffectiveAccess(u);
      setAccess(acc);

      if (!acc.isSuperAdmin) { setLoading(false); return; }

      const existing = await base44.entities.AIModelSetting.list('-created_date');

      if (existing.length === 0) {
        // Seed defaults
        const seeded = await Promise.all(
          DEFAULT_TOOLS.map(t => base44.entities.AIModelSetting.create(t))
        );
        setSettings(seeded);
      } else {
        // Merge — ensure all default tools exist
        const existingKeys = new Set(existing.map(s => s.tool_key));
        const missing = DEFAULT_TOOLS.filter(t => !existingKeys.has(t.tool_key));
        if (missing.length > 0) {
          const added = await Promise.all(missing.map(t => base44.entities.AIModelSetting.create(t)));
          setSettings([...existing, ...added]);
        } else {
          setSettings(existing);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleModelChange = (id, field, value) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    setSaved(prev => ({ ...prev, [id]: false }));
  };

  const handleSave = async (setting) => {
    setSaving(prev => ({ ...prev, [setting.id]: true }));
    await base44.entities.AIModelSetting.update(setting.id, {
      model: setting.model,
      provider: setting.provider,
      cost_level: setting.cost_level,
      is_active: setting.is_active,
    });
    setSaving(prev => ({ ...prev, [setting.id]: false }));
    setSaved(prev => ({ ...prev, [setting.id]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [setting.id]: false })), 2000);
  };

  const handleSaveAll = async () => {
    for (const s of settings) await handleSave(s);
  };

  if (!access) return null;

  if (!access.isSuperAdmin) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="card-glass rounded-2xl p-10 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">AI Model Settings are only accessible to super_admin / founder accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 animate-fade-up max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">AI Models</h1>
            <p className="text-xs text-muted-foreground">Configure which model powers each TerrellOS tool</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-primary/15 text-primary border-primary/25">SUPER ADMIN</span>
          <Button size="sm" variant="outline" onClick={handleSaveAll} disabled={loading}>
            <Save className="w-3 h-3 mr-1" /> Save All
          </Button>
        </div>
      </div>

      {/* Global Defaults */}
      <div className="mb-7">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap className="w-3 h-3" /> Global Defaults
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <GlobalModelCard
            label="Advanced Coding"
            desc="Used by AI Builder, Code Generator, Error Debugger"
            value={globalAdvanced}
            options={MODEL_OPTIONS.filter(m => m.provider !== 'local')}
            onChange={setGlobalAdvanced}
          />
          <GlobalModelCard
            label="Fast / Simple Tasks"
            desc="Used by Supabase Architect, Document Writer"
            value={globalFast}
            options={MODEL_OPTIONS}
            onChange={setGlobalFast}
          />
          <GlobalModelCard
            label="Voice + Multimodal"
            desc="Used by Voice Assistant"
            value={globalVoice}
            options={MODEL_OPTIONS.filter(m => ['gpt-4o', 'gpt-4o-mini', 'gemini-2.0-flash'].includes(m.value))}
            onChange={setGlobalVoice}
          />
        </div>
      </div>

      {/* Per-tool settings */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
        <Cpu className="w-3 h-3" /> Per-Tool Model Config
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="card-glass rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {settings.map(s => {
            const currentModel = MODEL_OPTIONS.find(m => m.value === s.model);
            return (
              <div key={s.id} className={`card-glass rounded-2xl p-4 border transition-all ${s.is_active ? 'border-border' : 'border-border/30 opacity-60'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Tool name */}
                  <div className="flex items-center gap-2 w-44 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                    <span className="text-sm font-semibold text-foreground">{s.tool_name}</span>
                  </div>

                  {/* Provider badge */}
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${PROVIDER_STYLE[s.provider] || PROVIDER_STYLE.local}`}>
                    {s.provider?.toUpperCase()}
                  </span>

                  {/* Cost badge */}
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${COST_STYLE[s.cost_level] || COST_STYLE.medium}`}>
                    <DollarSign className="w-2.5 h-2.5" />
                    {COST_LABEL[s.cost_level] || '$$'}
                  </span>

                  {/* Best use */}
                  <span className="text-xs text-muted-foreground flex-1 hidden md:block truncate">{s.best_use}</span>

                  {/* Model selector */}
                  <div className="w-52">
                    <Select
                      value={s.model}
                      onValueChange={v => {
                        const m = MODEL_OPTIONS.find(x => x.value === v);
                        handleModelChange(s.id, 'model', v);
                        if (m) {
                          handleModelChange(s.id, 'provider', m.provider);
                          handleModelChange(s.id, 'cost_level', m.cost);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-secondary/50 border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_OPTIONS.map(m => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => handleModelChange(s.id, 'is_active', !s.is_active)}
                    className={`text-xs px-2 py-1 rounded border font-mono transition-colors ${
                      s.is_active
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {s.is_active ? 'ON' : 'OFF'}
                  </button>

                  {/* Save button */}
                  <Button
                    size="sm"
                    className="h-8 text-xs gradient-purple-blue text-white rounded-lg px-3"
                    onClick={() => handleSave(s)}
                    disabled={saving[s.id]}
                  >
                    {saving[s.id] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : saved[s.id] ? (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* Best use on mobile */}
                <div className="mt-2 text-xs text-muted-foreground md:hidden">{s.best_use}</div>

                {/* Current model detail row */}
                {currentModel && (
                  <div className="mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
                    <span className="font-mono text-foreground/70">{currentModel.label}</span>
                    <span className="mx-2">·</span>
                    {currentModel.desc}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-6 text-xs text-muted-foreground text-center font-mono opacity-60">
        Settings saved to TerrellOS database · Changes apply to next AI invocation
      </div>
    </div>
  );
}