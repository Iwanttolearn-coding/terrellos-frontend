/**
 * RouteGuard — wraps routes that require a minimum role.
 * Usage: <RouteGuard role="super_admin"><AdminPage /></RouteGuard>
 */
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getEffectiveAccess, isOwnerEmail } from '@/lib/ownerConfig';
import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RouteGuard({ children, role = 'user', plan = null }) {
  const [access, setAccess] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.auth.me()
      .then(u => { if (!cancelled) setAccess(getEffectiveAccess(u)); })
      .catch(() => { if (!cancelled) setAccess(getEffectiveAccess(null)); });
    return () => { cancelled = true; };
  }, []);

  if (access === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allowed = role === 'super_admin'
    ? access.isSuperAdmin
    : role === 'admin'
      ? access.isSuperAdmin || access.effectiveRole === 'admin'
      : true;

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mb-4">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-6">You don't have permission to view this page.</p>
        <Link to="/" className="text-sm text-primary hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  return children;
}