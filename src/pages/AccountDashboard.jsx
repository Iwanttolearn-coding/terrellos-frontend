/**
 * AccountDashboard.jsx — TerrellOS
 * Full account view. Uses useAuth + resolveUserAccess only.
 * No Supabase, no Base44 SDK, no broken dependencies.
 * Route: /account
 */
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';
import {
  User, Shield, Crown, LogOut, Edit2, Save, X,
  CheckCircle, Zap, Star, Activity, Mail, CreditCard, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function PlanBadge({ plan }) {
  const map = {
    founder:    'bg-gradient-to-r from-amber-500 to-yellow-600 text-black',
    elite:      'bg-gradient-to-r from-violet-600 to-purple-800 text-white',
    pro:        'bg-gradient-to-r from-blue-600 to-blue-800 text-white',
    enterprise: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
    starter:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    free:       'bg-secondary text-muted-foreground',
  };
  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider', map[plan] || map.free)}>
      {plan}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-muted/50', color === 'text-primary' ? 'text-primary' : color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function AccountDashboard() {
  const { user, logout } = useAuth();
  const access = resolveUserAccess(user);

  const [editing,    setEditing]    = useState(false);
  const [displayName, setDisplayName] = useState(user?.full_name || user?.name || '');
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-10 text-center">
        <div className="bg-card border border-border rounded-2xl p-8">
          <User className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Not signed in</p>
          <Link to="/login" className="mt-4 inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const plan  = access?.plan  || user?.plan  || 'free';
  const role  = access?.role  || user?.role  || 'user';
  const email = user?.email   || '';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/v1/auth/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: displayName }),
      });
      if (res.ok) {
        setSaveMsg('Saved!');
        setEditing(false);
      } else {
        setSaveMsg('Save failed — try again.');
      }
    } catch {
      setSaveMsg('Network error.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout?.();
      window.location.href = '/login';
    }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">My Account</h1>
        {access?.isFounder && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown className="w-3 h-3" /> FOUNDER
          </span>
        )}
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {/* Avatar + identity */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-purple-500/20 flex-shrink-0">
            {(displayName || email)?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Display name"
                autoFocus
              />
            ) : (
              <p className="font-bold text-foreground text-base truncate">
                {displayName || email.split('@')[0]}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <PlanBadge plan={plan} />
              <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground capitalize">{role}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => { setEditing(false); setSaveMsg(''); }}
                  className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {saveMsg && (
          <p className={cn('text-xs font-medium', saveMsg.includes('Saved') ? 'text-green-400' : 'text-red-400')}>
            {saveMsg}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Mail}       label="Email"   value={email || '—'} />
          <StatCard icon={Shield}     label="Role"    value={role || 'user'} />
          <StatCard icon={Star}       label="Plan"    value={plan} color="text-amber-400" />
          <StatCard icon={Activity}   label="Status"  value="Active" color="text-green-400" />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/billing"
          className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Billing</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Link to="/pricing"
          className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Upgrade</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>

      {/* Founder panel */}
      {access?.isFounder && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">Founder Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Admin Panel',    to: '/admin' },
              { label: 'Backend Status', to: '/backend-status' },
              { label: 'System Logs',    to: '/system-logs' },
              { label: 'Founder Center', to: '/founder' },
            ].map(({ label, to }) => (
              <Link key={to} to={to}
                className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors text-center">
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button onClick={handleLogout} disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50">
        <LogOut className="w-4 h-4" />
        {loggingOut ? 'Signing out…' : 'Sign Out'}
      </button>

      {/* UPL disclaimer */}
      <p className="text-xs text-muted-foreground/50 text-center leading-relaxed">
        TerrellOS is an AI productivity platform — not a law firm. No attorney-client or professional privilege is created by use of this service.
      </p>
    </div>
  );
}
