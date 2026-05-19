import { useState } from 'react';
import { useSupabase } from '@/lib/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User, Shield, Crown, LogOut, Edit2, Save, X,
  CheckCircle, Clock, Zap, Star, Activity
} from 'lucide-react';
import { notify } from '@/components/NotificationCenter';

function PlanBadge({ plan }) {
  const styles = {
    ELITE: 'bg-gradient-to-r from-violet-600 to-purple-800 text-white',
    pro: 'bg-gradient-to-r from-blue-600 to-blue-800 text-white',
    free: 'bg-secondary text-muted-foreground',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[plan] || styles.free}`}>
      {plan}
    </span>
  );
}

function RoleBadge({ role, isFounder }) {
  if (isFounder) return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
      <Crown className="w-3 h-3" /> FOUNDER · SUPER_ADMIN
    </span>
  );
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-muted-foreground">
      {role}
    </span>
  );
}

export default function AccountDashboard() {
  const { sbUser, sbProfile, logout, updateProfile, isFounder, isSuperAdmin, isLoggedIn } = useSupabase();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(sbProfile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isLoggedIn || !sbProfile) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-10 text-center">
        <div className="card-glass rounded-2xl p-8 border border-border">
          <User className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No Supabase session active.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Go to Tools → Supabase Auth to log in.</p>
        </div>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      notify.success('Profile saved!');
      setEditing(false);
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    notify.info('Logged out of Supabase.');
    setLoggingOut(false);
  }

  const initials = (sbProfile.full_name || sbProfile.email || '?').slice(0, 2).toUpperCase();
  const joinedDate = sbProfile.created_at ? new Date(sbProfile.created_at).toLocaleDateString() : '—';
  const lastLogin = sbProfile.last_login ? new Date(sbProfile.last_login).toLocaleString() : '—';

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Account Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your Supabase profile & session</p>
      </div>

      {/* Profile card */}
      <div className="card-glass rounded-2xl p-6 border border-border mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl gradient-purple-blue flex items-center justify-center text-white text-xl font-bold flex-shrink-0 glow-purple">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {editing ? (
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="h-8 text-sm max-w-xs"
                  placeholder="Full name"
                />
              ) : (
                <span className="text-lg font-bold text-foreground">
                  {sbProfile.full_name || 'No name set'}
                </span>
              )}
              {isFounder && <Star className="w-4 h-4 text-amber-400" />}
            </div>

            <p className="text-sm text-muted-foreground font-mono mb-3">{sbProfile.email}</p>

            <div className="flex flex-wrap gap-2">
              <RoleBadge role={sbProfile.role} isFounder={isFounder} />
              <PlanBadge plan={sbProfile.plan} />
            </div>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                  <Save className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1">
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card-glass rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Member Since</span>
          </div>
          <div className="text-sm font-semibold text-foreground">{joinedDate}</div>
        </div>
        <div className="card-glass rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Last Login</span>
          </div>
          <div className="text-sm font-semibold text-foreground">{lastLogin}</div>
        </div>
      </div>

      {/* Access level */}
      {isSuperAdmin && (
        <div className="card-glass rounded-xl p-4 border border-amber-500/20 bg-amber-500/5 mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-sm font-bold text-amber-400">SUPER_ADMIN · ELITE Access</div>
              <div className="text-xs text-muted-foreground">All tools unlocked · Unrestricted access · Founder privileges</div>
            </div>
            <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
          </div>
        </div>
      )}

      {/* Auth status */}
      <div className="card-glass rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5 mb-4">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-sm font-bold text-emerald-400">Session Active</div>
            <div className="text-xs text-muted-foreground font-mono">{sbUser?.id}</div>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
        </div>
      </div>

      {/* Logout */}
      <Button
        onClick={handleLogout}
        disabled={loggingOut}
        variant="destructive"
        className="w-full gap-2"
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? 'Logging out…' : 'Log out of Supabase'}
      </Button>
    </div>
  );
}