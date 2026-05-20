/**
 * ChatEngine.jsx — TerrellOS AI Chat
 * Wired to /v1/core/chat on the live Fly.io backend.
 */
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Send, Loader2, Bot, User, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendChat } from '@/lib/terrellOS';
import { useAuth } from '@/lib/AuthContext';

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={cn(
        'max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-card border border-border text-foreground rounded-tl-sm'
      )}>
        {isUser ? (
          <p>{content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              code: ({ inline, children }) => inline
                ? <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{children}</code>
                : <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto my-2"><code>{children}</code></pre>,
              p: ({ children }) => <p className="my-1">{children}</p>,
            }}>
            {content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  'What can you do?',
  'Generate a sermon outline on Psalm 23',
  'Help me debug a React component',
  'Explain DTF printing for beginners',
  'Write a Python FastAPI endpoint',
];

export default function ChatEngine() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { access } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await sendChat(msg);
      const reply = res?.reply || res?.message || JSON.stringify(res);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message || 'Failed to reach backend');
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clear = () => setMessages([]);

  const exportChat = () => {
    const text = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `terrellos-chat-${Date.now()}.txt`; a.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">TerrellOS AI</p>
            <p className="text-xs text-muted-foreground">GPT-4o · terrellos-backend.fly.dev</p>
          </div>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <>
              <button onClick={exportChat} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={clear} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-purple-blue flex items-center justify-center glow-purple">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">TerrellOS Chat</h2>
              <p className="text-sm text-muted-foreground mt-1">Powered by GPT-4o via your live backend</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-xs bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-2.5 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive">
          ⚠ {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={e => { e.preventDefault(); send(); }}
          className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message TerrellOS AI…"
            disabled={loading}
            className="flex-1 bg-card border border-border focus:border-primary/60 text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors disabled:opacity-50"
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-primary hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all">
            {loading ? <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" /> : <Send className="w-4 h-4 text-primary-foreground" />}
          </button>
        </form>
      </div>
    </div>
  );
}
