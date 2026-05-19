import { createContext, useContext, useState, useEffect } from 'react';
import { supabaseSession } from '@/lib/supabaseSession';
import { isOwnerEmail } from '@/lib/ownerConfig';
import { logActivity } from '@/lib/activityLog';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const [sbUser, setSbUser] = useState(null);
  const [sbProfile, setSbProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(token) {
    try {
      const res = await safeInvoke('supabaseProfile', {
        action: 'get_or_create_profile',
        access_token: token,
      });
      if (res.data?.success) {
        const profile = res.data.profile;
        // Force founder privileges client-side regardless of DB value
        if (isOwnerEmail(res.data.user?.email)) {
          profile.role = 'SUPER_ADMIN';
          profile.plan = 'ELITE';
          profile.is_founder = true;
        }
        setSbUser(res.data.user);
        setSbProfile(profile);
      } else {
        supabaseSession.clearToken();
      }
    } catch {
      // Network error or expired token — clear session silently
      supabaseSession.clearToken();
    }
  }

  useEffect(() => {
    const token = supabaseSession.getToken();
    if (token) {
      loadProfile(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    try {
      const res = await safeInvoke('supabaseAuth', { action: 'login', email, password });
      if (res.data?.error) throw new Error(res.data.error);
      supabaseSession.setToken(res.data.access_token);
      await loadProfile(res.data.access_token);
      logActivity('login', 'User logged in via Supabase');
      return res.data;
    } catch (err) {
      throw new Error(err.message || 'Login failed — check your connection');
    }
  }

  async function signup(email, password) {
    const res = await safeInvoke('supabaseAuth', { action: 'signup', email, password });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  }

  async function logout() {
    const token = supabaseSession.getToken();
    if (token) {
      await logActivity('logout', 'User logged out');
      await safeInvoke('supabaseAuth', { action: 'logout', access_token: token }).catch(() => {});
    }
    supabaseSession.clearToken();
    setSbUser(null);
    setSbProfile(null);
  }

  async function updateProfile(data) {
    const token = supabaseSession.getToken();
    const res = await safeInvoke('supabaseProfile', {
      action: 'update_profile',
      access_token: token,
      profile_data: data,
    });
    if (res.data?.success) setSbProfile(res.data.profile);
    return res.data;
  }

  const isFounder = sbProfile?.is_founder || false;
  const isSuperAdmin = sbProfile?.role === 'SUPER_ADMIN';

  return (
    <SupabaseContext.Provider value={{
      sbUser, sbProfile, loading,
      login, signup, logout, updateProfile,
      isFounder, isSuperAdmin,
      isLoggedIn: !!sbUser,
    }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext);
}