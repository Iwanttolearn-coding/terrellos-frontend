/**
 * entities.js — TerrellOS Entity SDK
 * Wraps the Base44 entity REST API for CRUD operations.
 * Usage: import { ToolCard } from '@/api/entities'
 */

const APP_ID = '6a0a2d575b77f3b9ebb6b1c9';
const BASE = `/api/apps/prod/${APP_ID}/entities`;

function makeEntity(name) {
  const url = (id = '') => `${BASE}/${name}${id ? `/${id}` : ''}`;
  const headers = () => ({
    'Content-Type': 'application/json',
    'X-App-Id': APP_ID,
  });

  return {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${url()}${qs ? '?' + qs : ''}`, { headers: headers() });
      if (!res.ok) throw new Error(`Entity ${name} list failed: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : data.items || data.results || [];
    },
    async get(id) {
      const res = await fetch(url(id), { headers: headers() });
      if (!res.ok) throw new Error(`Entity ${name} get failed: ${res.status}`);
      return res.json();
    },
    async create(data) {
      const res = await fetch(url(), {
        method: 'POST', headers: headers(), body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Entity ${name} create failed: ${res.status}`);
      return res.json();
    },
    async update(id, data) {
      const res = await fetch(url(id), {
        method: 'PUT', headers: headers(), body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Entity ${name} update failed: ${res.status}`);
      return res.json();
    },
    async delete(id) {
      const res = await fetch(url(id), { method: 'DELETE', headers: headers() });
      if (!res.ok) throw new Error(`Entity ${name} delete failed: ${res.status}`);
      return res.ok;
    },
    async filter(params = {}) {
      return this.list(params);
    },
  };
}

export const ToolCard = makeEntity('ToolCard');
export const MemoryProfile = makeEntity('MemoryProfile');
export const MemorySession = makeEntity('MemorySession');
export const StoryFragment = makeEntity('StoryFragment');
export const LegacyConsent = makeEntity('LegacyConsent');
export const TrustedContact = makeEntity('TrustedContact');
export const CoreBelief = makeEntity('CoreBelief');
