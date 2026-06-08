/**
 * RouteGuard.jsx — TM Dezigns AI Designer
 * Uses AuthContext + resolveUserAccess ONLY. No Base44 SDK. No loops.
 * Founder always passes every gate.
 */
import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RouteGuard({ children, role = 'user', plan = null }) {
  const { user, isLoadingAuth } = useAuth();

  // Still loading — show spinner, do NOT redirect
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const access = resolveUserAccess(user);

  // Founder bypasses every gate — no exceptions
  if (access.founder) return children;

  const allowed =
    role === 'super_admin' ? access.role === 'super_admin' :
    role === 'admin'       ? access.canViewAdmin :
    role === 'member'      ? !!user :
    true;

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-black text-white">Access Restricted</h2>
        <p className="text-gray-400 text-sm max-w-sm">
          {user ? "Your current plan doesn't include access to this area." : "Sign in to access this area."}
        </p>
        <div className="flex gap-3">
          <Link to="/" className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white text-sm transition-all">
            Dashboard
          </Link>
          {!user && (
            <Link to="/login" className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          )}
          {user && (
            <Link to="/pricing" className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold hover:opacity-90 transition-opacity">
              Upgrade
            </Link>
          )}
        </div>
      </div>
    );
  }

  return children;
}
