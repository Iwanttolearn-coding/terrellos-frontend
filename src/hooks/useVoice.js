/**
 * useVoice.js — TerrellOS
 * ─────────────────────────────────────────────────────────────────
 * React hook for ElevenLabs-powered voice synthesis via Fly.io backend.
 *
 * Usage:
 *   const { speak, speaking, audioRef, error } = useVoice();
 *   await speak("Tell me about your earliest memory.");
 *
 * For combined AI text + voice in one call:
 *   const { autoRespond, response, speaking } = useVoice();
 *   await autoRespond("What did home feel like as a child?");
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useRef, useCallback } from 'react';
import api from '@/lib/apiClient';

export function useVoice() {
  const [speaking,  setSpeaking]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [response,  setResponse]  = useState(null);  // last text reply (from autoRespond)
  const audioRef  = useRef(null);

  // ── play a base64 data URL as audio ──────────────────────────────────────
  const playDataUrl = useCallback((dataUrl) => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(dataUrl);
      audioRef.current = audio;
      audio.onended  = () => { setSpeaking(false); resolve(); };
      audio.onerror  = (e) => { setSpeaking(false); reject(e); };
      setSpeaking(true);
      audio.play().catch(reject);
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
  }, []);

  // ── speak(text) — TTS only, no AI generation ─────────────────────────────
  const speak = useCallback(async (text, voiceId = null) => {
    if (!text?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/v1/companion/voice', {
        message:  text,
        voice_id: voiceId,
      });
      if (res?.audio_data_url) {
        await playDataUrl(res.audio_data_url);
      } else if (res?.voice_synthesis_status === 'unconfigured') {
        setError('Voice synthesis not yet configured — check ELEVENLABS_API_KEY is set on the backend.');
      } else {
        setError(res?.message || 'Voice synthesis failed.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [playDataUrl]);

  // ── autoRespond(prompt) — AI text reply + voice synthesis in one call ────
  const autoRespond = useCallback(async (prompt, voiceId = null) => {
    if (!prompt?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/v1/companion/voice/auto', {
        message:  prompt,
        voice_id: voiceId,
      });
      if (res?.text_reply) setResponse(res.text_reply);
      if (res?.audio_data_url) {
        await playDataUrl(res.audio_data_url);
      } else if (res?.voice_synthesis_status === 'unconfigured') {
        // Voice not configured — still show the text reply silently
        setError('Voice unavailable (ELEVENLABS_API_KEY not set) — text reply available.');
      } else if (!res?.audio_data_url) {
        setError(res?.message || 'Voice synthesis failed.');
      }
      return res;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [playDataUrl]);

  return {
    speak,
    autoRespond,
    stop,
    speaking,
    loading,
    error,
    response,
    audioRef,
  };
}

export default useVoice;
