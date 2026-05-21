/**
 * base44Client.js — TM Dezigns AI Designer
 * SAFE STUB — replaces legacy Base44 SDK.
 * All methods return safe defaults. No network calls. No throws. No loops.
 * Auth is handled exclusively by AuthContext + resolveUserAccess.
 */
import { loadUser } from '@/lib/resolveUserAccess';

const noop = () => Promise.resolve(null);

const authStub = {
  me: () => {
    // Return localStorage user synchronously wrapped in Promise — no network call
    return Promise.resolve(loadUser());
  },
  signIn:  noop,
  signOut: noop,
  token:   () => Promise.resolve(null),
};

export const base44 = {
  auth:       authStub,
  entities:   new Proxy({}, { get: () => ({ list: () => Promise.resolve([]), get: noop, create: noop, update: noop, delete: noop, filter: () => Promise.resolve([]) }) }),
  functions:  new Proxy({}, { get: () => noop }),
  integrations: new Proxy({}, { get: () => ({ getAuthUrl: noop }) }),
};

export default base44;
