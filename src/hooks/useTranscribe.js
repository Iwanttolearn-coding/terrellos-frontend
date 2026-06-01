/**
 * useTranscribe.js — TerrellOS / TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * Real-time audio transcription via OpenAI Whisper (Fly.io backend).
 * Routes:  POST /v1/memory/transcribe       (multipart file upload)
 *          POST /v1/memory/session/transcript (auto-save if sessionId given)
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { transcribeAudio, saveMemoryTranscript } from '@/lib/api';

export function useTranscribe() {
  const [transcript, setTranscript] = useState('');
  const [language,   setLanguage]   = useState(null);
  const [duration,   setDuration]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  /**
   * transcribe(audioFile, sessionId?)
   * audioFile — File | Blob (webm, mp3, wav, m4a, ogg, flac)
   * sessionId — optional: auto-saves transcript to /v1/memory/session/transcript
   */
  const transcribe = useCallback(async (audioFile, sessionId = null) => {
    if (!audioFile) return null;
    setLoading(true);
    setError(null);

    try {
      // Ensure File object with proper name (required by Whisper endpoint)
      const file = audioFile instanceof File
        ? audioFile
        : new File(
            [audioFile],
            `recording_${Date.now()}.webm`,
            { type: audioFile.type || 'audio/webm' }
          );

      const res = await transcribeAudio(file);

      if (res?.transcript) {
        setTranscript(res.transcript);
        setLanguage(res.language || null);
        setDuration(res.duration || null);

        // Auto-save to memory session if sessionId provided
        if (sessionId) {
          try {
            await saveMemoryTranscript(sessionId, res.transcript);
          } catch (saveErr) {
            console.warn('[useTranscribe] Session transcript save failed:', saveErr.message);
          }
        }

        return res;
      }

      // Surface missing-key error cleanly
      if (res?.note || !res?.transcript) {
        const msg = res?.note || 'Transcription returned no text — check OPENAI_API_KEY is set on the backend.';
        if (msg.includes('OPENAI_API_KEY') || msg.includes('not configured')) {
          setError('Whisper transcription unavailable — check OPENAI_API_KEY is set on the backend.');
        } else {
          setError(msg);
        }
      }
      return res;
    } catch (e) {
      const msg = e.message || 'Transcription failed';
      if (msg.includes('OPENAI_API_KEY') || msg.includes('not configured')) {
        setError('Whisper transcription unavailable — check OPENAI_API_KEY is set on the backend.');
      } else {
        setError(msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setTranscript('');
    setLanguage(null);
    setDuration(null);
    setError(null);
  }, []);

  return { transcribe, transcript, language, duration, loading, error, clear };
}

export default useTranscribe;
