/**
 * Client-side helpers for supabaseData backend function.
 * All methods require a valid Supabase access token.
 */
import { supabaseSession } from '@/lib/supabaseSession';
import { safeInvoke, api, sendChat } from '@/lib/apiClient';

function token() {
  return supabaseSession.getToken();
}

async function invoke(action, extra = {}) {
  const res = await safeInvoke('supabaseData', {
    action,
    access_token: token(),
    ...extra,
  });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
}

export const sbData = {
  // Status
  status: () => invoke('status'),

  // AI Chats
  saveChat: (data) => invoke('save_chat', { data }),
  updateChat: (data) => invoke('update_chat', { data }),
  listChats: (limit = 50) => invoke('list_chats', { limit }),
  getChat: (id) => invoke('get_chat', { data: { id } }),
  deleteChat: (id) => invoke('delete_chat', { data: { id } }),

  // Projects
  saveProject: (data) => invoke('save_project', { data }),
  listProjects: (limit = 50) => invoke('list_projects', { limit }),
  deleteProject: (id) => invoke('delete_project', { data: { id } }),

  // Build Logs
  saveBuildLog: (data) => invoke('save_build_log', { data }),
  listBuildLogs: (limit = 50) => invoke('list_build_logs', { limit }),

  // Uploads
  saveUpload: (data) => invoke('save_upload', { data }),
  listUploads: (limit = 50) => invoke('list_uploads', { limit }),

  // System Events
  logEvent: (event_type, description, metadata = null) =>
    invoke('log_event', { data: { event_type, description, metadata } }),
  listEvents: (limit = 100) => invoke('list_events', { limit }),

  // Subscriptions
  getSubscription: () => invoke('get_subscription'),
  upsertSubscription: (data) => invoke('upsert_subscription', { data }),
};