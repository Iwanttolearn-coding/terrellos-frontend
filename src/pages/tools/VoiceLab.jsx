import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { speakText, transcribeAudio } from '@/lib/api';
import { Mic, Upload, Square, AlertTriangle, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/components/NotificationCenter';
import ModelBadge from '@/components/ModelBadge';
import { getModelForTool } from '@/lib/modelResolver';

const VOICE_PRESETS = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', lang: 'en', desc: 'Warm female' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi',   lang: 'en', desc: 'Strong female' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',  lang: 'en', desc: 'Soft female' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', lang: 'es', desc: 'Male español' },
];

// Deterministic pseudo-random heights based on index + tick to avoid Math.random
function barHeight(i, tick, level) {
  const seed = Math.sin(i * 2.3 + tick * 0.7) * 0.5 + 0.5;
  return Math.max(4, (level / 100) * 40 * (0.3 + seed * 0.7));
}

function WaveformBars({ active, level, tick }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-12">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all duration-75"
          style={{
            height: active ? `${barHeight(i, tick, level)}px` : '4px',
            background: 'hsl(265 80% 60% / 0.6)',
            opacity: active ? 0.8 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function VoiceLab() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [ttsText, setTtsText] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsUrl, setTtsUrl] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_PRESETS[0]);
  const [micLevel, setMicLevel] = useState(0);
  const [waveformTick, setWaveformTick] = useState(0);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => { getModelForTool('voice_assistant').then(setModelInfo); }, []);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const fileRef = useRef();
  const animRef = useRef(null);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setWaveformTick(v => v + 1), 80);
    return () => clearInterval(id);
  }, [recording]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(data);
        setMicLevel(Math.min(100, Math.round(data.reduce((a, b) => a + b, 0) / data.length * 2)));
        animRef.current = requestAnimationFrame(tick);
      }
      tick();

      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '' });
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animRef.current);
        setMicLevel(0);
      };
      mediaRef.current = mr;
      mr.start(100);
      setRecording(true);
    } catch (err) {
      notify.error('Microphone access denied: ' + err.message);
    }
  }

  function stopRecording() { mediaRef.current?.stop(); setRecording(false); }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setTranscript('');
  }

  async function handleTranscribe() {
    if (!audioBlob) return;
    setTranscribing(true);
    try {
      const file = audioBlob instanceof File ? audioBlob : new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const text = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
      const textStr = typeof text === 'string' ? text : text?.text || '';
      setTranscript(textStr);
      setTtsText(textStr);
      notify.success('Transcription complete!');
    } catch (err) {
      notify.error('Transcription failed: ' + err.message);
    } finally {
      setTranscribing(false);
    }
  }

  async function handleTTS() {
    if (!ttsText.trim()) return;
    setTtsLoading(true);
    setTtsUrl('');
    try {
      const res = await speakText(ttsText, selectedVoice.id);
      if (res?.audio_base64) {
        const dataUrl = `data:${res.audio_mime_type || 'audio/mpeg'};base64,${res.audio_base64}`;
        setTtsUrl(dataUrl);
        // Auto-play
        const audio = new Audio(dataUrl);
        audio.play().catch(() => {});
        notify.success('Voice generated via ElevenLabs ✓');
      } else if (res?.audio_data_url) {
        setTtsUrl(res.audio_data_url);
        const audio = new Audio(res.audio_data_url);
        audio.play().catch(() => {});
        notify.success('Voice generated ✓');
      } else {
        notify.warn(res?.message || 'Voice synthesis unavailable — set ELEVENLABS_API_KEY in Render.');
      }
    } catch (err) {
      notify.error('Voice synthesis failed: ' + err.message);
    } finally {
      setTtsLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-800 flex items-center justify-center flex-shrink-0">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
            Voice Lab
            <ModelBadge toolKey="voice_assistant" />
          </h1>
          <div className="text-xs text-muted-foreground">Record · Transcribe · Synthesize</div>
        </div>
      </div>
      {modelInfo && !modelInfo.is_active && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Voice Assistant is disabled. Enable it in <a href="/ai-models" className="underline ml-1">AI Models →</a>
        </div>
      )}

      {/* Waveform + Record */}
      <div className="card-glass rounded-2xl p-5 mb-4">
        <WaveformBars active={recording} level={micLevel} tick={waveformTick} />
        <div className="flex gap-3 mt-4">
          <Button onClick={recording ? stopRecording : startRecording} variant={recording ? 'destructive' : 'default'} className="flex-1" disabled={modelInfo?.is_active === false}>
            {recording ? <><Square className="w-4 h-4 mr-2" />Stop</> : <><Mic className="w-4 h-4 mr-2" />Record</>}
          </Button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-transparent text-sm cursor-pointer hover:bg-secondary transition-colors">
            <Upload className="w-4 h-4" /> File
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
        {recording && (
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs text-destructive font-mono">RECORDING · {micLevel}%</span>
          </div>
        )}
      </div>

      {/* Playback + Transcribe */}
      {audioUrl && (
        <div className="card-glass rounded-2xl p-4 mb-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Playback</div>
          <audio controls src={audioUrl} className="w-full mb-3" />
          <Button onClick={handleTranscribe} disabled={transcribing} className="w-full" variant="outline">
            {transcribing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcribing…</> : 'Transcribe Audio'}
          </Button>
        </div>
      )}

      {transcript && (
        <div className="card-glass rounded-2xl p-4 mb-4">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Transcript</div>
          <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* TTS */}
      <div className="card-glass rounded-2xl p-5">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Text-to-Speech</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {VOICE_PRESETS.map(v => (
            <button key={v.id} onClick={() => setSelectedVoice(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${selectedVoice.id === v.id ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-border/60'}`}>
              {v.lang === 'es' && <Globe className="w-3 h-3" />}
              {v.name} <span className="opacity-50">· {v.desc}</span>
            </button>
          ))}
        </div>
        <textarea
          className="w-full bg-input border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[80px] focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Enter text to synthesize…"
          value={ttsText}
          onChange={e => setTtsText(e.target.value)}
        />
        <Button onClick={handleTTS} disabled={ttsLoading || !ttsText.trim()} className="w-full mt-3">
          {ttsLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Synthesizing…</> : 'Generate Voice'}
        </Button>
        {ttsUrl && <audio controls src={ttsUrl} className="w-full mt-3" />}
        {!ttsUrl && !ttsLoading && (
          <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-muted-foreground font-mono text-emerald-400/70">● Connected → terrellos-backend.onrender.com/v1/voice/speak</span>
          </div>
        )}
      </div>
    </div>
  );
}