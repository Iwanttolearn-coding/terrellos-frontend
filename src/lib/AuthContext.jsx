/**
 * AuthContext.jsx — TerrellOS
 * Thin wrapper over BootProvider. AuthContext no longer manages its own
 * localStorage or initAuth — BootProvider owns the boot sequence.
 * This eliminates the race condition where both tried to hydrate user state.
 */
import React, { createContext, useContext } from 'react';
import { useBoot } from '@/lib/BootProvider';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // All state flows from BootProvider — no duplicate localStorage reads
  const boot = useBoot();

  const value = {
    user:                    boot.user,
    access:                  boot.access,
    isAuthenticated:         !!boot.user,
    isLoadingAuth:           !boot.bootReady,
    isLoadingPublicSettings: false,
    authError:               null,
    authChecked:             boot.bootReady,
    logout:                  boot.logout,
    loginAsFounder:          boot.loginAsFounder,
    navigateToLogin:         boot.logout,
    checkUserAuth:           () => {},   // no-op — BootProvider owns this
    checkAppState:           () => {},
    founderAccess:           boot.access?.isFounder ? boot.access : null,
    appPublicSettings:       { app_name: 'TerrellOS' },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
