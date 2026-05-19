/**
 * TranscriptPanel.jsx
 * Live transcript stream display.
 * Provider-agnostic — receives transcript lines from parent.
 * Prepares for: Whisper | Deepgram | AssemblyAI | OpenAI Realtime
 */
import { useEffect, useRef } from 'react';
import { Mic, FileText, Loader2 } from 'lucide-react';

export const TRANSCRIPT_PROVIDER = {
  PENDING:    'pending',
  WHISPER:    'whisper',
  DEEPGRAM:   'deepgram',
  ASSEMBLYAI: 'assemblyai',
  OPENAI:     'openai',
};

export default function TranscriptPanel({
  lines = [],           // [{ id, text, final, timestamp }]
  isListening = false,
  provider = TRANSCRIPT_PROVIDER.PENDING,
  interimText = '',
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, interimText]);

  const PROVIDER_LABELS = {
    pending:    'Transcript Engine Pending',
    whisper:    'Whisper STT',
    deepgram:   'Deepgram',
    assemblyai: 'AssemblyAI',
    openai:     'OpenAI Realtime',
  };

  return (
    <div className="flex flex-col h-full bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">Live Transcript</span>
        </div>
        <div className="flex items-center gap-2">
          {isListening && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs text-white/40 font-mono">LIVE</span>
            </div>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            provider === TRANSCRIPT_PROVIDER.PENDING
              ? 'bg-yellow-500/10 text-yellow-400/70 border border-yellow-500/20'
              : 'bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20'
          }`}>
            {PROVIDER_LABELS[provider] || provider}
          </span>
        </div>
      </div>

      {/* Pending state */}
      {provider === TRANSCRIPT_PROVIDER.PENDING && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
          <p className="text-xs text-yellow-300/70 leading-relaxed">
            Live transcription backend route pending. Add STT provider to FastAPI to enable real-time transcript.
          </p>
        </div>
      )}

      {/* Transcript lines */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[120px]">
        {lines.length === 0 && !interimText && (
          <div className="flex flex-col items-center justify-center h-full py-8 space-y-2">
            {isListening ? (
              <>
                <Loader2 className="w-5 h-5 text-purple-400/50 animate-spin" />
                <p className="text-xs text-white/25">Listening…</p>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 text-white/15" />
                <p className="text-xs text-white/20">Transcript will appear here once recording starts.</p>
              </>
            )}
          </div>
        )}

        {lines.map(line => (
          <div key={line.id} className="space-y-0.5">
            <p className="text-sm text-white/80 leading-relaxed">{line.text}</p>
            <span className="text-xs text-white/20 font-mono">
              {line.timestamp ? new Date(line.timestamp).toLocaleTimeString() : ''}
            </span>
          </div>
        ))}

        {/* Interim (in-progress) text */}
        {interimText && (
          <p className="text-sm text-white/40 italic leading-relaxed">{interimText}…</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-white/20 font-mono">{lines.length} segment{lines.length !== 1 ? 's' : ''}</span>
        {isListening && (
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
