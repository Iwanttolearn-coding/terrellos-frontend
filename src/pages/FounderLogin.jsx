/**
 * FounderLogin.jsx — Quick founder access
 * Enter your founder email → instant full access, no password needed.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const FOUNDER_EMAILS = ['millzterrell210@icloud.com', 'millzterrell5@gmail.com'];

export default function FounderLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginAsFounder } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const normalized = email.toLowerCase().trim();
    
    // Try backend bypass first for a real token
    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
      const res = await fetch(`${BACKEND}/v1/auth/founder-bypass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-ID': 'terrellos' },
        body: JSON.stringify({ email: normalized }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('terrellos_token', data.token);
          localStorage.setItem('terrellos_user', JSON.stringify(data.user));
        }
      }
    } catch (e) {
      console.warn('[FounderLogin] Backend bypass failed, using local auth', e);
    }

    // Local founder login always works regardless of backend
    const success = loginAsFounder(normalized);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('This email does not have founder access.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-purple-blue flex items-center justify-center mx-auto mb-4 glow-purple">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-white">TerrellOS</h1>
          <p className="text-gray-400 text-sm mt-1">Founder Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
              Founder Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="millzterrell5@gmail.com"
              autoComplete="email"
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed
              bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : 'Access TerrellOS'}
          </button>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
              Continue as guest →
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <p className="text-gray-600 text-xs text-center">
            Founder-only access · No password required<br/>
            TM Dezigns ecosystem · v9.1.0
          </p>
        </div>
      </div>
    </div>
  );
}
