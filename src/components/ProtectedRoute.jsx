/**
 * ProtectedRoute.jsx — TM Dezigns AI Designer
 * Uses resolveUserAccess() as the single source of truth.
 * Founder ALWAYS passes. No loops. No external auth checks.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';

export default function ProtectedRoute({ children, requireFounder = false, requireAdmin = false }) {
  const { user, isLoadingAuth } = useAuth();
  const access = resolveUserAccess(user);

  // Still loading — show nothing (prevents flash redirects)
  if (isLoadingAuth) return null;

  // Founder gates
  if (requireFounder && !access.founder) {
    return <Navigate to="/" replace />;
  }

  // Admin gates
  if (requireAdmin && !access.canViewAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
