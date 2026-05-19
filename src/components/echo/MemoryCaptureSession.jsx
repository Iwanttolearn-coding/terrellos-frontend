/**
 * MemoryCaptureSession.jsx
 * Orchestrates the full interview-style memory training session.
 * Wraps MirrorRecorder + TranscriptPanel + ConversationTrainer.
 * Handles: prompt cycling, session state, autosave, graceful errors.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useMountedRef } from '@/hooks/useSafeAsync';
import MirrorRecorder from '@/components/echo/MirrorRecorder';
import TranscriptPanel from '@/components/echo/TranscriptPanel';
import { TRAINING_PROMPTS } from '@/lib/memoryEntities';
import { startMemorySession, saveMemoryTranscript, endMemorySession } from '@/lib/api';
import { logger } from '@/lib/runtimeLogger';
import { ChevronRight, SkipForward, Heart, Save, Loader2, CheckCircle } from 'lucide-react';

const SESSION_PHASE = {
  READY:      'ready',
  RECORDING:  'recording',
  PAUSED:     'paused',
  SAVED:      'saved',
  COMPLETE:   'complete',
  ERROR:      'error',
};

export default function MemoryCaptureSession({ memoryProfileId, userId, onComplete }) {
  const mountedRef = useMountedRef();

  const [phase, setPhase] = useState(SESSION_PHASE.READY);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [transcript, setTranscript] = useState([]); // [{ id, text, timestamp }]
  const [interimText, setInterimText] = useState('');
  const [savedFragments, setSavedFragments] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [sessionId, setSessionId] = useState(null);

  const timerRef = useRef(null);
  const currentPrompt = TRAINING_PROMPTS[promptIndex] || null;

  // ── Session timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        if (mountedRef.current) setSessionDuration(d => d + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // ── Start session on backend ───────────────────────────────────────────────
  async function startSession() {
    if (!mountedRef.current) return;
    setPhase(SESSION_PHASE.RECORDING);
    setIsRecording(true);

    try {
      const res = await startMemorySession(userId || 'anonymous', {
        consentConfirmed: true,
        voiceActive: true,
        cameraActive: true,
      });
      if (mountedRef.current && res?.session_id) {
        setSessionId(res.session_id);
        logger.info('api', `Memory session started: ${res.session_id}`);
      }
    } catch (err) {
      // Backend route not yet live — session continues client-side
      const clientId = `local-${Date.now()}`;
      if (mountedRef.current) setSessionId(clientId);
      logger.warn('api', `Memory session backend pending — using local session: ${clientId}`);
    }
  }

  function toggleRecord() {
    if (phase === SESSION_PHASE.READY) {
      startSession();
    } else if (isRecording) {
      setIsRecording(false);
      setPhase(SESSION_PHASE.PAUSED);
    } else {
      setIsRecording(true);
      setPhase(SESSION_PHASE.RECORDING);
    }
  }

  // ── Save fragment ──────────────────────────────────────────────────────────
  async function saveFragment() {
    if (!currentPrompt || !mountedRef.current) return;
    setSaveStatus('saving');

    const fragment = {
      memory_profile_id: memoryProfileId,
      user_id: userId,
      session_id: sessionId,
      prompt: currentPrompt.text,
      response_text: transcript.map(t => t.text).join(' '),
      category: currentPrompt.category,
      duration_sec: sessionDuration,
      reviewed: false,
    };

    try {
      await saveMemoryTranscript(fragment.session_id, fragment.transcript);
      if (mountedRef.current) {
        setSavedFragments(prev => [...prev, { ...fragment, id: Date.now() }]);
        setSaveStatus('saved');
        setTranscript([]);
        setTimeout(() => { if (mountedRef.current) setSaveStatus(null); }, 2000);
      }
    } catch {
      // Graceful — store locally
      if (mountedRef.current) {
        setSavedFragments(prev => [...prev, { ...fragment, id: Date.now(), local: true }]);
        setSaveStatus('saved');
        setTimeout(() => { if (mountedRef.current) setSaveStatus(null); }, 2000);
      }
    }
  }

  function nextPrompt() {
    if (promptIndex < TRAINING_PROMPTS.length - 1) {
      setPromptIndex(i => i + 1);
      setTranscript([]);
      setInterimText('');
    } else {
      endSession();
    }
  }

  async function endSession() {
    setIsRecording(false);
    setPhase(SESSION_PHASE.COMPLETE);
    clearInterval(timerRef.current);

    try {
      await endMemorySession(sessionId);
    } catch {
      logger.warn('api', 'Memory session end backend pending — session complete locally');
    }

    if (onComplete) onComplete({ sessionId, fragments: savedFragments, duration: sessionDuration });
  }

  // ── Progress ────────────────────────────────────────────────────────────────
  const progressPct = Math.round((promptIndex / TRAINING_PROMPTS.length) * 100);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto px-4 pb-16">

      {/* Left: Mirror */}
      <div className="flex-1 min-w-0">
        <MirrorRecorder
          isRecording={isRecording}
          onToggleRecord={toggleRecord}
          onStop={endSession}
          currentPrompt={currentPrompt?.text}
          transcriptLine={interimText || transcript[transcript.length - 1]?.text}
          sessionDuration={sessionDuration}
        />
      </div>

      {/* Right: Session controls */}
      <div className="w-full lg:w-80 flex flex-col gap-4">

        {/* Progress */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Memory Progress</span>
            <span className="font-mono">{promptIndex + 1}/{TRAINING_PROMPTS.length}</span>
          </div>
          <div className="w-full bg-white/8 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <Heart className="w-3 h-3 text-pink-400/60" />
            {savedFragments.length} memory fragment{savedFragments.length !== 1 ? 's' : ''} saved
          </div>
        </div>

        {/* Current prompt */}
        <div className="bg-white/3 border border-purple-500/20 rounded-2xl p-4 space-y-3">
          <span className="text-xs text-purple-400/60 uppercase tracking-wide font-semibold">
            {currentPrompt?.category || 'prompt'}
          </span>
          <p className="text-sm text-white/80 leading-relaxed italic">
            "{currentPrompt?.text}"
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={saveFragment}
              disabled={transcript.length === 0 || saveStatus === 'saving'}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium disabled:opacity-30 hover:bg-purple-600/30 transition-all"
            >
              {saveStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
               saveStatus === 'saved' ? <CheckCircle className="w-3.5 h-3.5" /> :
               <Save className="w-3.5 h-3.5" />}
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save response'}
            </button>
            <button
              onClick={nextPrompt}
              className="flex items-center gap-1 py-2 px-3 rounded-xl border border-white/10 text-white/40 text-xs hover:text-white/60 hover:border-white/20 transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div className="flex-1 min-h-[200px]">
          <TranscriptPanel
            lines={transcript}
            isListening={isRecording}
            interimText={interimText}
          />
        </div>

        {/* Backend status notice */}
        <div className="bg-white/2 border border-white/6 rounded-xl px-3 py-2.5">
          <p className="text-xs text-white/25 leading-relaxed">
            Memory profile building in progress. Full AI synthesis and voice cloning features are in development.
          </p>
        </div>
      </div>
    </div>
  );
}
