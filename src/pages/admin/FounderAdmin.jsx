import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/SupabaseContext';
import { sbData } from '@/lib/supabaseData';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';
import RouteGuard from '@/components/RouteGuard';
import PageSkeleton from '@/components/PageSkeleton';
import { notify } from '@/components/NotificationCenter';
import { ShieldCheck, Users, ScrollText, Activity, RefreshCw, Trash2 } from 'lucide-react';
import BackendStatusCard from '@/components/BackendStatusCard';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">{title}</div>
      {children}
    </div>
  );
}

export default function FounderAdmin() {
  const { sbProfile } = useSupabase();
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  async function load() {
    setLoading(true);
    try {
      const [b44Users, eventsRes] = await Promise.all([
        fetch(`${BACKEND_BASE_URL}/v1/admin/users`,{signal:AbortSignal.timeout(10000)}).then(r=>r.json()).then(d=>d.users||[]).catch(()=>[]),
        sbData.listEvents(50),
      ]);
      setUsers(b44Users || []);
      setEvents(eventsRes?.events || []);
    } catch (err) {
      notify.error('Failed to load admin data: ' + err.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeRole(userId, newRole) {
    try {
      await fetch(`${BACKEND_BASE_URL}/v1/admin/users/${userId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({role: newRole}), signal: AbortSignal.timeout(8000) });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      notify.success('Role updated');
    } catch (err) {
      notify.error(err.message);
    }
  }

  return (
    <RouteGuard role="super_admin">
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-900 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Founder Admin</h1>
            <div className="text-xs font-mono text-muted-foreground">
              {sbProfile?.email || 'millzterrell5@gmail.com'} · SUPER_ADMIN · ELITE
            </div>
          </div>
          <Button size="sm" variant="outline" className="ml-auto gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Backend Connection Card */}
        <div className="mb-6">
          <BackendStatusCard />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/40 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'events', label: 'Activity Log', icon: Activity },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {loading ? <PageSkeleton rows={5} title={false} /> : (
          <>
            {tab === 'users' && (
              <Section title={`Users (${users.length})`}>
                <div className="space-y-2">
                  {users.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">No users found.</div>}
                  {users.map(u => (
                    <div key={u.id} className="card-glass rounded-xl p-4 border border-border flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{u.full_name || '(no name)'}</div>
                        <div className="text-xs font-mono text-muted-foreground truncate">{u.email}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Joined {u.created_date ? formatDistanceToNow(new Date(u.created_date), { addSuffix: true }) : '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                        }`}>{u.role || 'user'}</span>
                        {u.role !== 'admin' ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => changeRole(u.id, 'admin')}>
                            Make Admin
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => changeRole(u.id, 'user')}>
                            Demote
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {tab === 'events' && (
              <Section title={`Activity Log (${events.length})`}>
                <div className="space-y-2">
                  {events.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">No events logged yet.</div>}
                  {events.map((e, i) => (
                    <div key={e.id || i} className="card-glass rounded-xl p-3 border border-border flex items-start gap-3">
                      <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground">{e.description}</div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          {e.event_type} · {e.email} · {e.created_at ? formatDistanceToNow(new Date(e.created_at), { addSuffix: true }) : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </RouteGuard>
  );
}