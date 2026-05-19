/**
 * TerrellOS Real-Time Service
 * Manages WebSocket lifecycle + streaming AI responses.
 * Backend FastAPI endpoint: ws://.../ws/chat
 */

import { API_BASE_URL } from '@/lib/env';

const WS_BASE = API_BASE_URL.replace(/^http/, 'ws');
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000];

class RealtimeService {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.reconnectAttempt = 0;
    this.intentionallyClosed = false;
    this.sessionId = null;
  }

  // ── Connect ────────────────────────────────────────────────────────────────
  connect(sessionId) {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    this.sessionId = sessionId;
    this.intentionallyClosed = false;
    this._open();
  }

  _open() {
    try {
      this.socket = new WebSocket(`${WS_BASE}/ws/chat?session=${this.sessionId}`);

      this.socket.onopen = () => {
        this.reconnectAttempt = 0;
        this._emit('status', { connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._emit('message', data);
          if (data.type === 'chunk')  this._emit('chunk', data.content);
          if (data.type === 'done')   this._emit('done', data);
          if (data.type === 'error')  this._emit('error', data.message);
        } catch {
          this._emit('chunk', event.data);
        }
      };

      this.socket.onclose = () => {
        this._emit('status', { connected: false });
        if (!this.intentionallyClosed) this._scheduleReconnect();
      };

      this.socket.onerror = () => {
        this._emit('status', { connected: false, error: true });
      };
    } catch {
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt++;
    setTimeout(() => {
      if (!this.intentionallyClosed) this._open();
    }, delay);
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  send(payload) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  // ── Disconnect ─────────────────────────────────────────────────────────────
  disconnect() {
    this.intentionallyClosed = true;
    this.socket?.close();
    this.socket = null;
  }

  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // ── Event emitter ──────────────────────────────────────────────────────────
  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
    return () => { this.listeners[event] = this.listeners[event].filter(l => l !== cb); };
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach(cb => cb(data));
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;