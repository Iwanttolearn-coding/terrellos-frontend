/**
 * useVoiceChat — Press-to-talk hook
 *
 * Flow:
 *   1. User holds button → MediaRecorder captures mic audio
 *   2. On release → WAV blob posted to backend /voice/stt → transcript
 *   3. Transcript sent to /chat → AI text response
 *   4. AI text posted to /voice/tts → audio ArrayBuffer streamed back
 *   5. Web Audio API decodes + plays audio chunks in order
 */

import { useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/env';

async function getApiKey() {
  try {
    const { base44 } = await import('@/api/base44Client');
    const settings = await base44.entities.SystemSettings.filter({ key: 'PYTHON_BACKEND_API_KEY' });
    return settings?.[0]?.value || '';
  } catch { return ''; }
}

async function buildHeaders(extra = {}) {
  const apiKey = await getApiKey();
  const h = { ...extra };
  if (apiKey) h['X-API-Key'] = apiKey;
  return h;
}

export function useVoiceChat({ onTranscript, onAiText, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);   // 0–100

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const playQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // ── Audio context (lazy) ──────────────────────────────────────────────────
  function getAudioCtx() {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  // ── Volume meter ──────────────────────────────────────────────────────────
  function startVolumeMeter(stream) {
    const ctx = getAudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    function tick() {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolumeLevel(Math.min(100, Math.round(avg * 2)));
      animFrameRef.current = requestAnimationFrame(tick);
    }
    tick();
  }

  function stopVolumeMeter() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setVolumeLevel(0);
  }

  // ── Playback queue (ensures ordered playback) ─────────────────────────────
  async function enqueueAudio(arrayBuffer) {
    playQueueRef.current.push(arrayBuffer);
    if (!isPlayingRef.current) drainQueue();
  }

  async function drainQueue() {
    if (playQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
    const buf = playQueueRef.current.shift();
    try {
      const ctx = getAudioCtx();
      const decoded = await ctx.decodeAudioData(buf.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);
      source.onended = drainQueue;
      source.start();
    } catch {
      drainQueue(); // skip bad chunk, continue
    }
  }

  // ── STT → Chat → TTS pipeline ─────────────────────────────────────────────
  async function processAudio(blob) {
    setIsProcessing(true);
    try {
      const headers = await buildHeaders();

      // 1. STT
      let transcript = '';
      try {
        const form = new FormData();
        form.append('audio', blob, 'recording.webm');
        const sttRes = await fetch(`${API_BASE_URL}/voice/stt`, {
          method: 'POST',
          headers,
          body: form,
          signal: AbortSignal.timeout(20000),
        });
        if (sttRes.ok) {
          const sttData = await sttRes.json();
          transcript = sttData?.transcript || sttData?.text || '';
        }
      } catch {}

      // Fallback: no STT route yet — let user know
      if (!transcript) {
        onError?.('STT not available. Deploy /voice/stt on backend.');
        return;
      }

      onTranscript?.(transcript);

      // 2. Chat
      const chatHeaders = await buildHeaders({ 'Content-Type': 'application/json' });
      const chatRes = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: chatHeaders,
        body: JSON.stringify({ prompt: transcript }),
        signal: AbortSignal.timeout(30000),
      });
      if (!chatRes.ok) throw new Error(`Chat failed: ${chatRes.status}`);
      const chatData = await chatRes.json();
      const aiText = chatData?.reply || chatData?.response || chatData?.message || '';
      if (!aiText) throw new Error('Empty AI response');
      onAiText?.(aiText);

      // 3. TTS — stream back audio
      const ttsHeaders = await buildHeaders({ 'Content-Type': 'application/json' });
      const ttsRes = await fetch(`${API_BASE_URL}/voice/tts`, {
        method: 'POST',
        headers: ttsHeaders,
        body: JSON.stringify({ text: aiText }),
        signal: AbortSignal.timeout(30000),
      });

      if (ttsRes.ok) {
        const ct = ttsRes.headers.get('content-type') || '';
        if (ct.includes('audio') || ct.includes('octet-stream')) {
          // Streamed audio — read in chunks and enqueue
          const reader = ttsRes.body.getReader();
          const collected = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            collected.push(value);
          }
          const total = collected.reduce((a, c) => a + c.byteLength, 0);
          const merged = new Uint8Array(total);
          let offset = 0;
          for (const c of collected) { merged.set(c, offset); offset += c.byteLength; }
          await enqueueAudio(merged.buffer);
        }
      }
      // If TTS not available yet, we still showed the text — graceful degradation
    } catch (err) {
      onError?.(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // ── Public controls ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      mediaRecorderRef.current = mr;

      startVolumeMeter(stream);
      setIsRecording(true);
    } catch (err) {
      onError?.(`Microphone access denied: ${err.message}`);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === 'inactive') return;

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
      processAudio(blob);
    };
    mr.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    stopVolumeMeter();
    setIsRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    stopVolumeMeter();
    setIsRecording(false);
    chunksRef.current = [];
  }, []);

  return { isRecording, isProcessing, isPlaying, volumeLevel, startRecording, stopRecording, cancelRecording };
}