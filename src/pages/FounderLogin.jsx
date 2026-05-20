/**
 * FounderLogin.jsx — TM Dezigns AI Designer
 * Simple founder email login. No loops. No external auth.
 * On success → redirects to dashboard with full access.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isFounder } from '@/lib/resolveUserAccess';
import { Crown, Mail, ArrowRight, Loader2, Lock } from 'lucide-react';

export default function FounderLogin() {
  const { loginAsFounder, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in — go home
  if (user?.email) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Enter your founder email'); return; }
    if (!isFounder(trimmed)) {
      setError('Access denied. This login is for authorized founders only.');
      return;
    }
    setLoading(true);
    const success = loginAsFounder(trimmed);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('Login failed. Contact system admin.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">TM Dezigns</h1>
            <p className="text-sm text-gray-400">AI Designer · Founder Access</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Founder Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 focus:border-amber-500/50 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
              <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white py-3 rounded-xl font-bold transition-all active:scale-95">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
              : <><ArrowRight className="w-4 h-4" /> Enter as Founder</>
            }
          </button>
        </form>

        <p className="text-center text-xs text-gray-700">
          Powered by TerrellOS AI Engine · TM Dezigns
        </p>
      </div>
    </div>
  );
}
