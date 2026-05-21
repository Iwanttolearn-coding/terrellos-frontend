/**
 * TopBarIdentity — shows founder/user identity in the header.
 * Founder always shows SUPER ADMIN + ELITE, never "Member".
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveUserAccess , loadUser} from '@/lib/resolveUserAccess';
import { ShieldCheck, User } from 'lucide-react';

export default function TopBarIdentity() {
  const [access, setAccess] = useState(null);
  const [initials, setInitials] = useState('');

  useEffect(() => {
    Promise.resolve(loadUser())
      .then(u => {
        setAccess(resolveUserAccess(u));
        if (u?.full_name) {
          const parts = u.full_name.trim().split(' ');
          setInitials(parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0][0].toUpperCase());
        } else if (u?.email) {
          setInitials(u.email[0].toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  if (!access) return null;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {access.founder ? (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-mono text-primary font-bold hidden sm:inline">SUPER ADMIN</span>
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center">
          {initials ? (
            <span className="text-[10px] font-bold text-foreground">{initials}</span>
          ) : (
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}