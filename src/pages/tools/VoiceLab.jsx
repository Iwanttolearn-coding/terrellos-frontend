/**
 * VoiceLab.jsx — TerrellOS Voice Lab
 * TTS via ElevenLabs · Transcription via Whisper
 * Wired to live Fly.io backend.
 */
import { useState, useRef } from 'react';
import { Mic, Square, Play, Loader2, Volume2, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { speakText } from '@/lib/terrellOS';
import { BACKEND_BASE_URL } from '@/lib/terrellOS';

const VOICE_PRESETS = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',  desc: 'Warm female · EN' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi',    desc: 'Strong female · EN' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',   desc: 'Soft female · EN' },
  { id: 'ErXwobaYiN019PkySvjV',  name: 'Antoni',  desc: 'Male · ES' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold',  desc: 'Strong male · EN' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',    desc: 'Deep male · EN' },
];

function WaveBar({ i, active, level }) {
  const h = active ? Math.max(4, (level / 100) * 40 * (0.3 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 0.7)) : 4;
  return (
    <div className="w-1 rounded-full transition-all duration-75"
      style={{ height: `${h}px`, background: 'hsl(265 80% 60% / 0.7)', opacity: active ? 0.8 : 0.3 }} />
  );
}

export default function VoiceLab() {
  const [selectedVoice, setSelectedVoice] = useState(VOICE_PRESETS[0]);
  const [ttsText, setTtsText] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudio, setTtsAudio] = useState(null);
  const [ttsError, setTtsError] = useState('');

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState('');
  const [micLevel, setMicLevel] = useState(0);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const fileRef = useRef(null);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const handleSpeak = async () => {
    if (!ttsText.trim()) return;
    setTtsLoading(true); setTtsError(''); setTtsAudio(null);
    try {
      const res = await speakText({ text: ttsText, voice_id: selectedVoice.id });
      if (res?.audio_base64) {
        const bytes = Uint8Array.from(atob(res.audio_base64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        setTtsAudio(URL.createObjectURL(blob));
      } else {
        setTtsError('No audio returned from backend');
      }
    } catch (e) { setTtsError(e.message); }
    setTtsLoading(false);
  };

  const downloadTTS = () => {
    if (!ttsAudio) return;
    const a = document.createElement('a'); a.href = ttsAudio;
    a.download = `terrellos-voice-${Date.now()}.mp3`; a.click();
  };

  // ── Mic recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animRef.current);
        setMicLevel(0);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);

      // Visualizer
      const tick = () => {
        const arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
        setMicLevel(Math.min(100, (avg / 128) * 200));
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { setTranscribeError('Microphone access denied'); }
  };

  const stopRecording = () => { mediaRef.current?.stop(); setRecording(false); };

  const handleTranscribe = async (blob) => {
    const b = blob || audioBlob;
    if (!b) return;
    setTranscribing(true); setTranscribeError(''); setTranscript('');
    try {
      const form = new FormData();
      form.append('file', b, 'recording.webm');
      const res = await fetch(`${BACKEND_BASE_URL}/v1/voice/transcribe-upload`, {
        method: 'POST', body: form,
        headers: { 'X-App-ID': 'terrellos' },
      });
      if (!res.ok) throw new Error(`Transcription failed: HTTP ${res.status}`);
      const data = await res.json();
      setTranscript(data?.transcript || 'No transcript returned');
    } catch (e) { setTranscribeError(e.message); }
    setTranscribing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleTranscribe(file);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Voice Lab</h1>
          <p className="text-xs text-muted-foreground">ElevenLabs TTS · Whisper Transcription · terrellos-backend.fly.dev</p>
        </div>
      </div>

      {/* ── TTS Panel ── */}
      <div className="card-glass rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-pink-400" /> Text-to-Speech
        </h2>

        {/* Voice selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VOICE_PRESETS.map(v => (
            <button key={v.id} onClick={() => setSelectedVoice(v)}
              className={cn('text-left px-3 py-2.5 rounded-xl border text-xs transition-all',
                selectedVoice.id === v.id
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-200'
                  : 'bg-card border-border text-muted-foreground hover:border-pink-500/30')}>
              <p className="font-semibold">{v.name}</p>
              <p className="opacity-70 text-[10px] mt-0.5">{v.desc}</p>
            </button>
          ))}
        </div>

        {/* Text input */}
        <textarea value={ttsText} onChange={e => setTtsText(e.target.value)}
          rows={4} placeholder="Enter text to convert to speech…"
          className="w-full bg-background border border-border focus:border-pink-500/50 text-foreground text-sm rounded-xl px-4 py-3 focus:outline-none resize-none transition-colors" />

        {ttsError && <p className="text-xs text-destructive">{ttsError}</p>}

        <div className="flex gap-3">
          <button onClick={handleSpeak} disabled={ttsLoading || !ttsText.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-500 hover:to-rose-600 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
            {ttsLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Volume2 className="w-4 h-4" /> Speak</>}
          </button>
          {ttsAudio && (
            <button onClick={downloadTTS}
              className="flex items-center gap-2 bg-card border border-border hover:border-pink-500/40 text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl text-sm transition-all">
              <Download className="w-4 h-4" /> Download
            </button>
          )}
        </div>

        {ttsAudio && (
          <div className="mt-2">
            <audio controls src={ttsAudio} className="w-full h-10 rounded-xl" />
          </div>
        )}
      </div>

      {/* ── Transcription Panel ── */}
      <div className="card-glass rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Mic className="w-4 h-4 text-violet-400" /> Transcription (Whisper)
        </h2>

        {/* Waveform */}
        <div className="bg-background border border-border rounded-xl p-4 flex items-center justify-center gap-0.5 h-16">
          {Array.from({ length: 24 }).map((_, i) => (
            <WaveBar key={i} i={i} active={recording} level={micLevel} />
          ))}
        </div>

        {transcribeError && <p className="text-xs text-destructive">{transcribeError}</p>}

        <div className="flex gap-3 flex-wrap">
          {!recording ? (
            <button onClick={startRecording}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              <Mic className="w-4 h-4" /> Record
            </button>
          ) : (
            <button onClick={stopRecording}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all animate-pulse">
              <Square className="w-4 h-4" /> Stop
            </button>
          )}

          {audioBlob && !recording && (
            <button onClick={() => handleTranscribe()} disabled={transcribing}
              className="flex items-center gap-2 bg-card border border-border hover:border-violet-500/40 text-muted-foreground hover:text-foreground disabled:opacity-40 px-4 py-2.5 rounded-xl text-sm transition-all">
              {transcribing ? <><Loader2 className="w-4 h-4 animate-spin" /> Transcribing…</> : <><Play className="w-4 h-4" /> Transcribe</>}
            </button>
          )}

          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-card border border-border hover:border-violet-500/40 text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl text-sm transition-all">
            <Upload className="w-4 h-4" /> Upload Audio
          </button>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
        </div>

        {transcript && (
          <div className="bg-background border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">Transcript</p>
            <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
            <button onClick={() => navigator.clipboard.writeText(transcript)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Copy to clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
