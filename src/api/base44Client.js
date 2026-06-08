/**
 * base44Client.js — TerrellOS
 * Fully self-hosted — NO Base44 platform dependency.
 * Entity calls → terrellos-backend.fly.dev/v1/db/:entity
 * Function calls → terrellos-backend.fly.dev/v1/fn/:name
 * File uploads → terrellos-backend.fly.dev/v1/upload
 * Auth is handled by AuthContext + resolveUserAccess (JWT via Fly backend)
 */
import { loadUser } from '@/lib/resolveUserAccess';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';

function getToken() {
  try { return localStorage.getItem('terrellos_token') || localStorage.getItem('terrellos_access_token') || ''; } catch { return ''; }
}

async function flyFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BACKEND}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`[TerrellOS API] ${res.status} ${path}: ${err}`);
  }
  return res.json().catch(() => null);
}

// Entity proxy — maps base44.entities.X.method() → REST calls to Fly backend
function makeEntityProxy(entityName) {
  return {
    list:   (sort = '-created_date', limit = 50) =>
      flyFetch(`/v1/db/${entityName}?sort=${sort}&limit=${limit}`).then(d => d?.data || []).catch(() => []),
    get:    (id) =>
      flyFetch(`/v1/db/${entityName}/${id}`).then(d => d?.data || null).catch(() => null),
    filter: (query = {}, sort = '-created_date') =>
      flyFetch(`/v1/db/${entityName}/filter?sort=${sort}`, { method: 'POST', body: JSON.stringify(query) }).then(d => d?.data || []).catch(() => []),
    create: (data) =>
      flyFetch(`/v1/db/${entityName}`, { method: 'POST', body: JSON.stringify(data) }).then(d => d?.data || null).catch(() => null),
    update: (id, data) =>
      flyFetch(`/v1/db/${entityName}/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(d => d?.data || null).catch(() => null),
    delete: (id) =>
      flyFetch(`/v1/db/${entityName}/${id}`, { method: 'DELETE' }).catch(() => null),
  };
}

const authStub = {
  me: () => Promise.resolve(loadUser()),
  signIn:  () => Promise.resolve(null),
  signOut: () => Promise.resolve(null),
  token:   () => Promise.resolve(getToken()),
};

const integrationsStub = {
  Core: {
    UploadFile: async ({ file }) => {
      const token = getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${BACKEND}/v1/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
  },
};

export const base44 = {
  auth: authStub,
  entities: new Proxy({}, {
    get: (_, entityName) => makeEntityProxy(entityName),
  }),
  functions: new Proxy({}, {
    get: (_, fnName) => (payload) =>
      flyFetch(`/v1/fn/${fnName}`, { method: 'POST', body: JSON.stringify(payload || {}) }).catch(() => null),
  }),
  integrations: new Proxy({}, {
    get: (_, ns) => ns === 'Core' ? integrationsStub.Core : new Proxy({}, { get: () => () => Promise.resolve(null) }),
  }),
  analytics: {
    track: () => {},
  },
};

export default base44;
