/**
 * ConsentGate.jsx
 * Full-screen consent and disclosure flow before any recording begins.
 * Sacred, cinematic, emotionally safe — NOT a robotic form.
 * All checkboxes required. Timestamped consent record created on confirm.
 */
import { useState } from 'react';
import { CONSENT_DISCLOSURES, CONSENT_VERSION } from '@/lib/memoryEntities';
import { Shield, Heart, CheckCircle, ChevronRight, Download, Sparkles } from 'lucide-react';

export default function ConsentGate({ onConsent, onDecline }) {
  const [step, setStep] = useState('intro'); // intro | disclosures | confirm
  const [checks, setChecks] = useState(
    Object.fromEntries(CONSENT_DISCLOSURES.map(d => [d.key, false]))
  );
  const [signature, setSignature] = useState('');

  const allChecked = CONSENT_DISCLOSURES.every(d => checks[d.key]);
  const canConfirm = allChecked && signature.trim().length > 2;

  function toggle(key) {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleConfirm() {
    const consent = {
      ...checks,
      consent_timestamp: new Date().toISOString(),
      consent_version: CONSENT_VERSION,
      signature_text: signature.trim(),
      user_agent: navigator.userAgent,
    };
    onConsent(consent);
  }

  function downloadConsent() {
    const text = [
      'HEAVENLY ETERNAL ECHO — CONSENT RECORD',
      '=========================================',
      `Date: ${new Date().toLocaleString()}`,
      `Version: ${CONSENT_VERSION}`,
      `Signature: ${signature}`,
      '',
      'Approved:',
      ...CONSENT_DISCLOSURES.map(d => `  [${checks[d.key] ? 'X' : ' '}] ${d.label}`),
      '',
      'This record confirms explicit consent for the Eternal Echo memory session.',
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eternal-echo-consent-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── INTRO STEP ──────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080812] overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-blue-600/8 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative z-10 max-w-lg w-full mx-auto px-6 text-center space-y-8">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/20">
            <Sparkles className="w-9 h-9 text-purple-300" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Heavenly Eternal Echo
            </h1>
            <p className="text-lg text-purple-200/80 font-light leading-relaxed">
              A sacred space to preserve your voice, your stories, and your spirit.
            </p>
          </div>

          {/* Description */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-6 text-left space-y-4">
            <p className="text-sm text-white/70 leading-relaxed">
              This experience records your <span className="text-purple-300">voice</span>, <span className="text-blue-300">facial expressions</span>, <span className="text-pink-300">emotional tone</span>, and <span className="text-amber-300">conversational responses</span> to help build your Eternal Echo.
            </p>
            <p className="text-sm text-white/50 leading-relaxed">
              Nothing begins without your full understanding and explicit consent. You are in complete control of everything captured here.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={() => setStep('disclosures')}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-2xl shadow-purple-500/30 active:scale-98"
            >
              Begin — Review Consent
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onDecline}
              className="w-full py-3 text-sm text-white/30 hover:text-white/50 transition-colors"
            >
              Not now — return to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DISCLOSURES STEP ────────────────────────────────────────────────────────
  if (step === 'disclosures') {
    return (
      <div className="fixed inset-0 z-50 bg-[#080812] overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-300" />
            </div>
            <h2 className="text-2xl font-bold text-white">Your Consent</h2>
            <p className="text-sm text-white/50">Please read and approve each item below.</p>
          </div>

          {/* Disclosure items */}
          <div className="space-y-3">
            {CONSENT_DISCLOSURES.map(item => (
              <button
                key={item.key}
                onClick={() => toggle(item.key)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  checks[item.key]
                    ? 'bg-purple-600/15 border-purple-500/40'
                    : 'bg-white/3 border-white/8 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-md border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    checks[item.key] ? 'bg-purple-500 border-purple-400' : 'border-white/20'
                  }`}>
                    {checks[item.key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="text-xs text-white/50 mt-1 leading-relaxed">{item.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Progress indicator */}
          <div className="text-center text-xs text-white/30">
            {CONSENT_DISCLOSURES.filter(d => checks[d.key]).length} of {CONSENT_DISCLOSURES.length} approved
          </div>

          {/* Continue */}
          <button
            disabled={!allChecked}
            onClick={() => setStep('confirm')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            Continue — Confirm Identity
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={onDecline}
            className="w-full py-3 text-sm text-white/25 hover:text-white/40 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── CONFIRM STEP ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-[#080812] overflow-y-auto">
      <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-2xl font-bold text-white">Almost ready</h2>
          <p className="text-sm text-white/50">Type your full name to confirm your consent.</p>
        </div>

        {/* Summary */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-2">
          {CONSENT_DISCLOSURES.map(d => (
            <div key={d.key} className="flex items-center gap-2 text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-white/60">{d.label}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-white/8 text-xs text-white/30">
            Timestamp: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Signature */}
        <div className="space-y-2">
          <label className="text-sm text-white/60 font-medium block">Your full name (digital signature)</label>
          <input
            type="text"
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder="Type your full name…"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-purple-500/60 focus:bg-white/7 transition-all"
          />
        </div>

        <div className="space-y-3">
          <button
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xl shadow-purple-500/20 active:scale-98"
          >
            I understand — Begin My Session
          </button>
          <button
            onClick={downloadConsent}
            disabled={!canConfirm}
            className="w-full py-3 rounded-xl border border-white/10 text-sm text-white/40 hover:text-white/60 flex items-center justify-center gap-2 transition-colors disabled:opacity-20"
          >
            <Download className="w-4 h-4" /> Download consent copy
          </button>
          <button
            onClick={() => setStep('disclosures')}
            className="w-full py-3 text-sm text-white/25 hover:text-white/40 transition-colors"
          >
            ← Back to review
          </button>
        </div>
      </div>
    </div>
  );
}
