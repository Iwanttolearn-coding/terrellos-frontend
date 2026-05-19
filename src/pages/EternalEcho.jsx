/**
 * EternalEcho.jsx — Main page
 * Entry point for the Heavenly Eternal Echo memory preservation experience.
 * Routes: ConsentGate → MemoryCaptureSession → Completion
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsentGate from '@/components/echo/ConsentGate';
import MemoryCaptureSession from '@/components/echo/MemoryCaptureSession';
import { saveMemoryConsent } from '@/lib/api';
import { logger } from '@/lib/runtimeLogger';
import { Sparkles, Heart, ChevronRight } from 'lucide-react';

const PAGE_STATE = {
  LANDING:   'landing',
  CONSENT:   'consent',
  SESSION:   'session',
  COMPLETE:  'complete',
};

export default function EternalEcho() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState(PAGE_STATE.LANDING);
  const [consentRecord, setConsentRecord] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);

  async function handleConsent(consent) {
    setConsentRecord(consent);
    // Record consent
    try {
      await saveMemoryConsent(consent.user_id || 'anonymous', consent);
    } catch {
      logger.warn('api', 'Memory consent backend pending — consent stored locally');
    }
    setPageState(PAGE_STATE.SESSION);
  }

  function handleSessionComplete(result) {
    setSessionResult(result);
    setPageState(PAGE_STATE.COMPLETE);
  }

  // ── LANDING ────────────────────────────────────────────────────────────────
  if (pageState === PAGE_STATE.LANDING) {
    return (
      <div className="min-h-screen bg-[#080812] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Background ambient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-purple-900/20 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-t from-blue-900/10 to-transparent" />
          {/* Particle dots */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-white/20 animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-2xl w-full mx-auto text-center space-y-12">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-pink-600/10 border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/20">
            <Sparkles className="w-11 h-11 text-purple-300" />
          </div>

          {/* Hero */}
          <div className="space-y-5">
            <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
              Heavenly<br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Eternal Echo
              </span>
            </h1>
            <p className="text-xl text-white/50 font-light leading-relaxed max-w-lg mx-auto">
              Your voice. Your stories. Your spirit. Preserved for those who love you most.
            </p>
          </div>

          {/* Feature points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: '🎙️', title: 'Voice & Presence', desc: 'Capture your voice, cadence, and emotional tone.' },
              { icon: '📖', title: 'Your Stories', desc: 'Guided conversations that preserve what matters most.' },
              { icon: '💌', title: 'For Those You Love', desc: 'Your Echo lives on, safely, for the people you choose.' },
            ].map(f => (
              <div key={f.title} className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-2">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <button
              onClick={() => setPageState(PAGE_STATE.CONSENT)}
              className="w-full sm:w-auto mx-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg shadow-2xl shadow-purple-500/25 hover:opacity-90 transition-all active:scale-98"
            >
              <Heart className="w-5 h-5" />
              Begin Your Echo
              <ChevronRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-white/20">
              Your full consent is required before any recording begins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── CONSENT ────────────────────────────────────────────────────────────────
  if (pageState === PAGE_STATE.CONSENT) {
    return (
      <ConsentGate
        onConsent={handleConsent}
        onDecline={() => setPageState(PAGE_STATE.LANDING)}
      />
    );
  }

  // ── SESSION ────────────────────────────────────────────────────────────────
  if (pageState === PAGE_STATE.SESSION) {
    return (
      <div className="min-h-screen bg-[#080812] py-8">
        <MemoryCaptureSession
          memoryProfileId={consentRecord?.memory_profile_id || 'new'}
          userId={consentRecord?.user_id || 'session'}
          onComplete={handleSessionComplete}
        />
      </div>
    );
  }

  // ── COMPLETE ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080812] flex flex-col items-center justify-center px-6 py-16">
      <div className="relative z-10 max-w-lg w-full mx-auto text-center space-y-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600/30 to-blue-600/20 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/15">
          <Heart className="w-9 h-9 text-emerald-300" />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white">Session Complete</h2>
          <p className="text-white/50 leading-relaxed">
            Your memories are being preserved. Every story you shared is now part of your Eternal Echo.
          </p>
        </div>

        {sessionResult && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Fragments saved</span>
              <span className="text-white font-semibold">{sessionResult.fragments?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Session duration</span>
              <span className="text-white font-semibold">
                {Math.floor((sessionResult.duration || 0) / 60)}m {(sessionResult.duration || 0) % 60}s
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Memory profile status</span>
              <span className="text-yellow-300 text-xs">Building in progress</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => setPageState(PAGE_STATE.LANDING)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 transition-all"
          >
            Continue adding memories
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
