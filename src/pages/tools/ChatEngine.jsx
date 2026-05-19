import { useState, useRef, useEffect } from 'react';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import VoiceButton from '@/components/VoiceButton';
import ReactMarkdown from 'react-markdown';
import {
  MessageSquare, Send, Loader2, AlertTriangle,
  Bot, User, Volume2, VolumeX, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ModelBadge from '@/components/ModelBadge';
import { getModelForTool } from '@/lib/modelResolver';

// Direct Render backend URL — uses VITE_API_URL env var if set, fallback to hardcoded
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://terrellos-backend.onrender.com";

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ role, content, isStreaming }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={cn(
        'max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground',
      )}>
        {isUser ? content : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              code: ({ inline, children }) => inline
                ? <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{children}</code>
                : <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto my-2"><code>{children}</code></pre>,
              p: ({ children }) => <p className="my-1">{children}</p>,
            }}
          >
            {content}
          </ReactMarkdown>
        )}
        {isStreaming && <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-sm ml-0.5 animate-pulse align-text-bottom" />}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ── Voice status bar ──────────────────────────────────────────────────────────
function VoiceStatus({ isRecording, isProcessing, isPlaying, volumeLevel }) {
  if (isPlaying) return (
    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
      <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Playing AI audio…
    </div>
  );
  if (isProcessing) return (
    <div className="flex items-center gap-2 text-xs text-primary font-mono">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
    </div>
  );
  if (isRecording) return (
    <div className="flex items-center gap-2 text-xs text-destructive font-mono">
      <Radio className="w-3.5 h-3.5 animate-pulse" /> Recording · {volumeLevel}%
    </div>
  );
  return <span className="text-xs text-muted-foreground font-mono">Hold mic to talk</span>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatEngine() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [error, setError] = useState('');
  const [modelInfo, setModelInfo] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { getModelForTool('voice_assistant').then(setModelInfo).catch(() => {}); }, []);

  const { isRecording, isProcessing, isPlaying, volumeLevel, startRecording, stopRecording } = useVoiceChat({
    onTranscript: (transcript) => {
      setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: transcript }]);
    },
    onAiText: (text) => {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: text }]);
    },
    onError: (msg) => setError(msg),
  });

  // ── Text chat — direct POST to Render backend /chat ───────────────────────
  async function send(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError('');

    const userMsg = { id: Date.now(), role: 'user', content: text };
    const aiId = Date.now() + 1;
    const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg, { id: aiId, role: 'assistant', content: '' }]);
    setLoading(true);
    setStreamingId(aiId);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.status === 404) {
        throw new Error('Chat endpoint not found on backend (404) — check /chat route on Render');
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Backend error ${res.status}: ${txt.slice(0, 200)}`);
      }

      const data = await res.json();
      const reply = data?.reply || data?.response || data?.message || data?.content
        || (typeof data === 'string' ? data : '(no response)');
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: reply } : m));
    } catch (err) {
      const friendly = err.name === 'AbortError'
        ? 'Request timed out — backend may be cold-starting on Render. Try again in a moment.'
        : err.message;
      // Show error inline in the message bubble — does NOT crash the app
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: `⚠️ ${friendly}` } : m));
      setError(friendly);
    } finally {
      setLoading(false);
      setStreamingId(null);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const busy = loading || isProcessing || isRecording;

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold gradient-text flex items-center gap-2">
            Chat Engine
            <ModelBadge toolKey="voice_assistant" />
          </h1>
          <div className="text-[10px] text-muted-foreground font-mono">
            {voiceMode ? 'VOICE MODE — full-duplex' : 'TEXT MODE — direct Render backend'}
          </div>
        </div>
        <button
          onClick={() => { setVoiceMode(v => !v); setError(''); }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors',
            voiceMode
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          {voiceMode ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          {voiceMode ? 'VOICE ON' : 'VOICE OFF'}
        </button>
      </div>

      {/* Error banner — dismissable, never crashes the app */}
      {modelInfo && !modelInfo.is_active && (
        <div className="mx-4 mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 flex gap-2 items-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-yellow-300">Voice Assistant is disabled. Enable it in <a href="/ai-models" className="underline">AI Models →</a></span>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 rounded-xl border border-yellow-500/25 bg-yellow-500/5 p-3 flex gap-2 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-dark">
        {messages.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-15" />
            <div className="text-sm font-medium">No messages yet</div>
            <div className="text-xs mt-1 opacity-60">
              {voiceMode ? 'Hold the mic button to speak.' : 'Type a message or enable voice mode.'}
            </div>
          </div>
        )}
        {messages.map(m => (
          <Bubble key={m.id} role={m.role} content={m.content} isStreaming={m.id === streamingId} />
        ))}
        {(loading && !streamingId) && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border px-4 py-2.5 rounded-2xl flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border flex-shrink-0">
        {voiceMode ? (
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <VoiceStatus
              isRecording={isRecording}
              isProcessing={isProcessing}
              isPlaying={isPlaying}
              volumeLevel={volumeLevel}
            />
            <VoiceButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              volumeLevel={volumeLevel}
              onStart={startRecording}
              onStop={stopRecording}
            />
          </div>
        ) : (
          <form onSubmit={send} className="flex items-center gap-2 px-4 py-3">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message TerrellOS…"
              disabled={busy}
              className="flex-1 bg-card border-border text-sm"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} className="flex-shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
