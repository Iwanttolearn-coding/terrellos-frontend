/**
 * FounderLogin.jsx — TerrellOS
 * Clean login page. Founder shortcut + email/password flow.
 * No Base44. No broken redirects. No redirectToLogin calls.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isFounder } from '@/lib/resolveUserAccess';
import { Crown, Lock, AlertCircle, Loader2, Zap } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = import.meta.env.VITE_APP_ID || 'terrellos';

export default function FounderLogin() {
  const { loginAsFounder, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Enter your email.'); return; }

    setLoading(true);
    try {
      // 1. Founder shortcut — no backend call needed
      if (isFounder(email.trim())) {
        const ok = loginAsFounder(email.trim());
        if (ok) { navigate('/terrellos/welcome', { replace: true }); return; }
      }

      // 2. Regular login via backend
      const res = await fetch(`${BACKEND}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-ID': APP_ID },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) localStorage.setItem('terrellos_token', data.token);
        await checkUserAuth();
        navigate('/terrellos/welcome', { replace: true });
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || err.message || 'Login failed. Check your credentials.');
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setError('Connection timed out. Check your network.');
      } else {
        setError('Could not reach the server. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">TerrellOS</h1>
          <p className="text-sm text-gray-500 mt-1">AI Engine · app.tm-dezigns.com</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-purple-500/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {/* Founder hint */}
          {isFounder(email) && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400 text-xs">
              <Crown className="w-3.5 h-3.5" />
              Founder email detected — full access will be granted automatically.
            </div>
          )}
        </form>

        <p className="text-center text-xs text-gray-700 mt-6">TerrellOS AI Engine · Powered by TerrellOS</p>
      </div>
    </div>
  );
}