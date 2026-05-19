import { useState } from 'react';
import { useSupabase } from '@/lib/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, UserPlus, CheckCircle, ArrowRight } from 'lucide-react';
import { notify } from '@/components/NotificationCenter';
import { Link } from 'react-router-dom';

export default function SupabaseAuth() {
  const { login, signup, isLoggedIn, sbProfile, loading } = useSupabase();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoggedIn && sbProfile) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10">
        <div className="card-glass rounded-2xl p-6 border border-emerald-500/20 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <div className="text-lg font-bold text-foreground mb-1">Signed in as</div>
          <div className="text-sm text-muted-foreground font-mono mb-4">{sbProfile.email}</div>
          <Link to="/account">
            <Button className="gap-2 w-full">
              <ArrowRight className="w-4 h-4" /> Go to Account Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signup(email, password);
        notify.success('Account created! Check your email to confirm, then log in.');
        setMode('login');
      } else {
        await login(email, password);
        notify.success('Logged in to Supabase!');
      }
      setEmail(''); setPassword('');
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto mt-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Supabase Auth</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect your Supabase account</p>
      </div>

      <div className="card-glass rounded-2xl p-6 border border-border">
        <div className="flex gap-2 mb-6">
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Password</label>
            <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={busy} className="w-full gap-2">
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  );
}