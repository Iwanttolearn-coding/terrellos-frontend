import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { getFounderAccess } from '@/lib/founderAccess';
import { isOwnerEmail } from '@/lib/ownerConfig';
import { applyFounderOverride } from '@/lib/production';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [founderAccess, setFounderAccess] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    checkAppState(controller.signal);
    return () => controller.abort();
  }, []);

  const checkAppState = async (signal) => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Fetch public settings directly via fetch — no Base44 SDK axios client
      try {
        const res = await fetch(`/api/apps/public/prod/public-settings/by-id/${appParams.appId}`, {
          headers: {
            'X-App-Id': appParams.appId,
            ...(appParams.token ? { Authorization: `Bearer ${appParams.token}` } : {}),
          },
        });

        if (res.ok) {
          const publicSettings = await res.json();
          setAppPublicSettings(publicSettings);

          if (appParams.token) {
            await checkUserAuth(signal);
          } else {
            setIsLoadingAuth(false);
            setIsAuthenticated(false);
            setAuthChecked(true);
          }
        } else {
          const data = await res.json().catch(() => ({}));
          const reason = data?.extra_data?.reason;

          if (res.status === 403 && reason) {
            if (reason === 'auth_required') {
              setAuthError({ type: 'auth_required', message: 'Authentication required' });
            } else if (reason === 'user_not_registered') {
              setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
            } else {
              setAuthError({ type: reason, message: data?.message || 'Access denied' });
            }
          } else {
            setAuthError({ type: 'unknown', message: data?.message || 'Failed to load app' });
          }
          setIsLoadingAuth(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        setAuthError({ type: 'unknown', message: appError.message || 'Failed to load app' });
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async (signal) => {
    try {
      setIsLoadingAuth(true);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('auth_timeout')), 12000)
      );

      let currentUser = await Promise.race([base44.auth.me(), timeoutPromise]);

      if (signal?.aborted) return;

      currentUser = applyFounderOverride(currentUser) || currentUser;
      setUser(currentUser);
      setFounderAccess(getFounderAccess(currentUser));
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      if (signal?.aborted) return;
      console.error('[AuthContext] user auth check failed:', error?.message);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);

      if (error.message === 'auth_timeout') {
        setAuthError({ type: 'auth_required', message: 'Auth timed out — please reload' });
      } else if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      founderAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
