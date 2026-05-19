import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { testBackendConnection } from '@/lib/backendApi';
import { Settings as SettingsIcon, Plus, Trash2, Check, X, Loader2, Zap, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';

const BLANK_CONN = { name: '', base_url: '', environment: 'local', notes: '' };

function ConnectionForm({ initial = BLANK_CONN, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="card-glass rounded-2xl p-5 mb-4 animate-fade-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="Connection name *" className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
        <Select value={form.environment} onValueChange={v => set('environment', v)}>
          <SelectTrigger className="bg-secondary/50 border-border text-foreground"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['local','staging','production'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="sm:col-span-2">
          <Input value={form.base_url} onChange={e => set('base_url', e.target.value)}
            placeholder="Backend base URL (e.g. http://localhost:8000) *"
            className="bg-secondary/50 border-border text-foreground font-mono placeholder:text-muted-foreground" />
        </div>
        <div className="sm:col-span-2">
          <Input value={form.notes || ''} onChange={e => set('notes', e.target.value)}
            placeholder="Notes" className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button onClick={() => onSave(form)} disabled={saving || !form.name || !form.base_url}
          className="gradient-purple-blue text-white font-semibold rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {initial.id ? 'Save' : 'Add Connection'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground"><X className="w-4 h-4 mr-2" />Cancel</Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const [connections, setConnections] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editConn, setEditConn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const load = async () => {
    const [conns, setts] = await Promise.all([
      base44.entities.BackendConnection.list(),
      base44.entities.SystemSettings.list(),
    ]);
    setConnections(conns);
    setSettings(setts);
    const keySetting = setts.find(s => s.key === 'PYTHON_BACKEND_API_KEY');
    if (keySetting) setApiKey(keySetting.value || '');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSaveConn = async (form) => {
    setSaving(true);
    if (form.id) await base44.entities.BackendConnection.update(form.id, form);
    else await base44.entities.BackendConnection.create(form);
    setSaving(false);
    setShowForm(false);
    setEditConn(null);
    load();
  };

  const handleSetActive = async (id) => {
    for (const c of connections) {
      await base44.entities.BackendConnection.update(c.id, { is_active: c.id === id });
    }
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.BackendConnection.delete(id);
    load();
  };

  const handleTest = async (conn) => {
    setTesting(conn.id);
    const result = await testBackendConnection(conn);
    setTestResults(r => ({ ...r, [conn.id]: result }));
    await base44.entities.BackendConnection.update(conn.id, {
      last_tested_at: new Date().toISOString(),
      last_test_status: result.success ? 'connected' : 'failed',
      last_test_message: result.message,
    });
    setTesting(null);
    load();
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    // Always fetch fresh to avoid stale state
    const freshSettings = await base44.entities.SystemSettings.list();
    const existing = freshSettings.find(s => s.key === 'PYTHON_BACKEND_API_KEY');
    if (existing) {
      await base44.entities.SystemSettings.update(existing.id, { value: apiKey });
    } else {
      await base44.entities.SystemSettings.create({
        key: 'PYTHON_BACKEND_API_KEY',
        label: 'Python Backend API Key',
        value: apiKey,
        is_secret: true,
        category: 'backend',
      });
    }
    setSettings(freshSettings);
    setSavingKey(false);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 3000);
    load();
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-up">
      <PageHeader 
        title="Settings" 
        subtitle="Configure your app, backend, and publish to production"
        action={
          <a href="/publish" className="inline-block">
            <Button className="gradient-purple-blue text-white">
              <Zap className="w-4 h-4 mr-2" /> Publish App
            </Button>
          </a>
        }
      />

      {/* API Key */}
      <div className="card-glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Python Backend API Key</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Enter your Python backend API key…"
              className="bg-secondary/50 border-border text-foreground font-mono pr-10 placeholder:text-muted-foreground"
            />
            <button onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={handleSaveApiKey} disabled={savingKey}
            className="gradient-purple-blue text-white font-semibold rounded-xl px-6">
            {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : keySaved ? <><Check className="w-4 h-4 mr-1" />Saved!</> : 'Save Key'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Stored in database. Used as X-API-Key header when calling your FastAPI backend.</p>
      </div>

      {/* Backend connections */}
      <div className="card-glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Backend Connections</h2>
          <Button onClick={() => { setShowForm(true); setEditConn(null); }}
            className="gradient-purple-blue text-white font-semibold rounded-xl px-4 text-sm">
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>

        {showForm && !editConn && (
          <ConnectionForm onSave={handleSaveConn} onCancel={() => setShowForm(false)} saving={saving} />
        )}
        {editConn && (
          <ConnectionForm initial={editConn} onSave={handleSaveConn} onCancel={() => setEditConn(null)} saving={saving} />
        )}

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="rounded-xl h-16 bg-secondary/30 animate-pulse" />)}
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No backend connections configured yet. Add your Python backend URL above.
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => {
              const result = testResults[conn.id];
              return (
                <div key={conn.id} className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center gap-3
                  ${conn.is_active ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/30'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">{conn.name}</span>
                      <StatusBadge status={conn.last_test_status || 'unchecked'} />
                      {conn.is_active && <span className="text-xs text-primary font-semibold">● ACTIVE</span>}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground truncate">{conn.base_url}</div>
                    <div className="text-xs text-muted-foreground">{conn.environment}</div>
                    {result && (
                      <div className={`text-xs mt-1 ${result.success ? 'text-emerald-400' : 'text-destructive'}`}>
                        {result.message} {result.duration_ms ? `(${result.duration_ms}ms)` : ''}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => handleTest(conn)} disabled={testing === conn.id}
                      className="border-border text-muted-foreground hover:text-foreground rounded-lg text-xs">
                      {testing === conn.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                      Test
                    </Button>
                    {!conn.is_active && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActive(conn.id)}
                        className="border-primary/40 text-primary hover:bg-primary/10 rounded-lg text-xs">
                        Set Active
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setEditConn({ ...conn }); setShowForm(false); }}
                      className="text-muted-foreground hover:text-foreground text-xs">Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(conn.id)}
                      className="text-muted-foreground hover:text-destructive text-xs">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}