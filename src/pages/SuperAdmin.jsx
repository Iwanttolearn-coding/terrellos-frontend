import { loadUser, resolveUserAccess } from '@/lib/resolveUserAccess';
import { useEffect, useState } from 'react';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';
import { isOwner } from '@/lib/backendApi';
import { ShieldCheck, Plus, Loader2, Check, X, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const BLANK = { setting_key: '', label: '', setting_value: '', description: '', is_enabled: true, category: 'features' };

function ControlForm({ initial = BLANK, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="card-glass rounded-2xl p-5 mb-4 animate-fade-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={form.setting_key} onChange={e => set('setting_key', e.target.value)}
          placeholder="Setting key *" className="bg-secondary/50 border-border text-foreground font-mono" />
        <Input value={form.label || ''} onChange={e => set('label', e.target.value)}
          placeholder="Label" className="bg-secondary/50 border-border text-foreground" />
        <Input value={form.setting_value || ''} onChange={e => set('setting_value', e.target.value)}
          placeholder="Value" className="bg-secondary/50 border-border text-foreground" />
        <Select value={form.category} onValueChange={v => set('category', v)}>
          <SelectTrigger className="bg-secondary/50 border-border text-foreground"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['access','features','limits','maintenance'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="sm:col-span-2">
          <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
            placeholder="Description" rows={2} className="bg-secondary/50 border-border text-foreground resize-none" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={form.is_enabled} onCheckedChange={v => set('is_enabled', v)} />
          <span className="text-sm text-muted-foreground">Enabled</span>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button onClick={() => onSave(form)} disabled={saving || !form.setting_key}
          className="gradient-purple-blue text-white font-semibold rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {initial.id ? 'Save' : 'Create Control'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
          <X className="w-4 h-4 mr-2" />Cancel
        </Button>
      </div>
    </div>
  );
}

export default function SuperAdmin() {
  const [user, setUser] = useState(null);
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [me, ctrls] = await Promise.all([
      Promise.resolve(loadUser()),
      fetch(`${BACKEND_BASE_URL}/v1/admin/users`,{signal:AbortSignal.timeout(10000)}).then(r=>r.json()).then(d=>d.users||[]).catch(()=>[]),
    ]);
    setUser(me);
    setAuthorized(isOwner(me));
    setControls(ctrls);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
    const token = localStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-App-ID': 'terrellos' };
    if (form.id) {
      await fetch(`${BACKEND}/v1/admin/users/${form.id}`, { method: 'PATCH', headers, body: JSON.stringify(form) });
    } else {
      await fetch(`${BACKEND}/v1/admin/users`, { method: 'POST', headers, body: JSON.stringify(form) });
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleToggle = async (ctrl) => {
    const BACKEND2 = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
    const tok2 = localStorage.getItem('auth_token');
    const hdrs2 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok2}`, 'X-App-ID': 'terrellos' };
    await fetch(`${BACKEND2}/v1/admin/controls/${ctrl.id}/toggle`, { method: 'PATCH', headers: hdrs2 }).catch(() => {});
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.OwnerControl.delete(id);
    load();
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>;
  }

  if (!authorized) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card-glass rounded-2xl p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Super Admin is restricted to owner accounts only.<br />
            Authorized: millzterrell210@icloud.com, millsterrell5@gmail.com
          </p>
          {user && <p className="text-xs font-mono text-muted-foreground">Logged in as: {user.email}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-up">
      <PageHeader
        title="Super Admin"
        subtitle={`Owner controls — ${user?.email}`}
        action={
          <Button onClick={() => { setShowForm(true); setEditing(null); }}
            className="gradient-purple-blue text-white font-semibold rounded-xl px-5">
            <Plus className="w-4 h-4 mr-2" /> Add Control
          </Button>
        }
      />

      {/* Owner info */}
      <div className="card-glass rounded-2xl p-5 mb-6 border-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Terrell Mills — Owner</div>
            <div className="text-xs font-mono text-muted-foreground">{user?.email}</div>
          </div>
          <div className="ml-auto">
            <span className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/30">
              SUPER ADMIN
            </span>
          </div>
        </div>
      </div>

      {showForm && !editing && (
        <ControlForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
      )}
      {editing && (
        <ControlForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} saving={saving} />
      )}

      {controls.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No owner controls defined."
          description="Create controls to manage feature flags, access rules, and system limits."
          action={<Button onClick={() => setShowForm(true)} className="gradient-purple-blue text-white font-semibold rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Create First Control
          </Button>}
        />
      ) : (
        <div className="space-y-3">
          {['access','features','limits','maintenance'].map(cat => {
            const catControls = controls.filter(c => c.category === cat);
            if (catControls.length === 0) return null;
            return (
              <div key={cat}>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2 px-1">{cat}</div>
                <div className="space-y-2">
                  {catControls.map(ctrl => (
                    <div key={ctrl.id} className="card-glass rounded-xl p-4 flex items-center gap-4">
                      <Switch checked={ctrl.is_enabled} onCheckedChange={() => handleToggle(ctrl)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{ctrl.label || ctrl.setting_key}</div>
                        <div className="text-xs font-mono text-muted-foreground truncate">{ctrl.setting_key} = {ctrl.setting_value || '—'}</div>
                        {ctrl.description && <div className="text-xs text-muted-foreground mt-0.5">{ctrl.description}</div>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...ctrl }); setShowForm(false); }}
                          className="text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(ctrl.id)}
                          className="text-muted-foreground hover:text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}