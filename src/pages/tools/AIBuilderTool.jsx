import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/lib/env';
import { Cpu, Send, Loader2, Bot, User, AlertTriangle, Trash2, ChevronDown, FlaskConical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import FineTuner from '@/components/FineTuner';
import { Link } from 'react-router-dom';
import { sbData } from '@/lib/supabaseData';
import { supabaseSession } from '@/lib/supabaseSession';
import { logActivity } from '@/lib/activityLog';
import { notify } from '@/components/NotificationCenter';
import ModelBadge from '@/components/ModelBadge';
import { getModelForTool } from '@/lib/modelResolver';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className || '')?.[1] || '';
  async function copy() {
    await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-secondary/80 px-3 py-1.5 rounded-t-lg border border-border border-b-0">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{lang || 'code'}</span>
        <button onClick={copy} className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-secondary/50 border border-border rounded-b-lg px-4 py-3 overflow-x-auto text-xs font-mono text-foreground leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg gradient-purple-blue flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        {isUser ? (
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
            {msg.content}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
            {msg.streaming && !msg.content ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            ) : (
              <ReactMarkdown
                className="prose prose-sm max-w-none prose-invert prose-p:my-1 prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono"
                components={{
                  code({ inline, className, children, ...props }) {
                    if (inline) return <code className={className} {...props}>{children}</code>;
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },
                  pre({ children }) { return <>{children}</>; },
                  a({ children, ...props }) { return <a {...props} target="_blank" rel="noreferrer" className="text-primary underline">{children}</a>; },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
            {msg.streaming && msg.content && (
              <span className="inline-block w-2 h-4 bg-primary/70 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        )}
        {msg.error && (
          <div className="mt-1.5 text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {msg.error}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function AIBuilderTool() {
  const [tab, setTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedChatId, setSavedChatId] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    getModelForTool('app_builder').then(setModelInfo);
  }, []);

  // Auto-scroll
  function scrollToBottom() { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }
  useEffect(() => { if (!showScrollBtn) scrollToBottom(); }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  async function send(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userMsg = { role: 'user', content: text, id: Date.now() };
    const asstMsg = { role: 'assistant', content: '', streaming: true, id: Date.now() + 1 };
    setMessages(prev => [...prev, userMsg, asstMsg]);
    setStreaming(true);
    setShowScrollBtn(false);
    scrollToBottom();

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, messages: messages.map(m => ({ role: m.role, content: m.content })) }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(res.status === 404 ? 'NOT_FOUND' : `HTTP ${res.status}: ${errText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      let finalContent = '';

      if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
        // Streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Handle SSE format
          const lines = chunk.split('\n');
          for (const line of lines) {
            let token = '';
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try { token = JSON.parse(data)?.choices?.[0]?.delta?.content || data; } catch { token = data; }
            } else {
              token = line;
            }
            if (token) {
              finalContent += token;
              setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: finalContent } : m));
            }
          }
        }
      } else {
        // JSON / non-streaming
        const data = await res.json();
        finalContent = data?.reply || data?.response || data?.message || data?.content ||
          (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
        setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: finalContent } : m));
      }

      // Finalize — remove streaming flag
      setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, streaming: false, content: finalContent || '(empty response)' } : m));

      // Persist to Supabase
      if (finalContent && supabaseSession.getToken()) {
        setSaving(true);
        try {
          const allMsgs = [...messages, { role: 'user', content: text }, { role: 'assistant', content: finalContent }];
          if (savedChatId) {
            await sbData.updateChat({ id: savedChatId, messages: allMsgs, title: text.slice(0, 80) });
          } else {
            const saved = await sbData.saveChat({ title: text.slice(0, 80), messages: allMsgs, model: 'gpt-4o-mini' });
            if (saved?.chat?.id) setSavedChatId(saved.chat.id);
          }
          await logActivity('ai_generation', `AI prompt: ${text.slice(0, 100)}`);
        } catch {
          notify.warn('Chat saved locally — Supabase write failed');
        }
        setSaving(false);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, streaming: false, content: m.content || '(cancelled)' } : m));
      } else {
        const errMsg = err.message?.includes('NOT_FOUND')
          ? '⚠️ `/chat` endpoint not found on backend. Deploy your AI route to activate this.'
          : err.message?.includes('timed out') || err.message?.includes('Failed to fetch')
            ? '⚠️ Backend unreachable. It may be cold-starting on Render — wait 30s and retry.'
            : `Error: ${err.message}`;
        setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, streaming: false, content: errMsg, error: true } : m));
      }
    } finally {
      setStreaming(false);
    }
  }

  function stopStream() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function clearHistory() {
    setMessages([]);
    setSavedChatId(null);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-card/50 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-lg gradient-purple-blue flex items-center justify-center flex-shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold gradient-text flex items-center gap-2">
            AI Builder
            <ModelBadge toolKey="app_builder" />
          </h1>
          <div className="text-[10px] font-mono text-muted-foreground truncate">{API_BASE_URL}/chat</div>
        </div>
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
          <button
            onClick={() => setTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'chat' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Bot className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            onClick={() => setTab('finetune')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'finetune' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> Fine-Tune
          </button>
        </div>
        {tab === 'chat' && messages.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearHistory} className="text-muted-foreground hover:text-destructive flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Action Bar */}
      {tab === 'chat' && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/20 overflow-x-auto">
          {saving ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>
          ) : savedChatId ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Save className="w-3 h-3" /> Saved to Supabase</span>
          ) : (
            <span className="text-xs text-muted-foreground">Generate a prompt to auto-save</span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <Link to="/tools/projects">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5">
                <Save className="w-3 h-3" /> All Projects
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Fine-Tune Tab */}
      {tab === 'finetune' && <FineTuner />}

      {/* Messages */}
      {modelInfo && !modelInfo.is_active && tab === 'chat' && (
      <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-sm flex-shrink-0">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        App Builder is disabled. Enable it in <a href="/ai-models" className="underline ml-1">AI Models →</a>
      </div>
    )}
    {tab === 'chat' && <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-dark">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-12">
            <div className="w-14 h-14 rounded-2xl gradient-purple-blue flex items-center justify-center mb-4 glow-purple">
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold gradient-text mb-1">TerrellOS AI Builder</h2>
            <p className="text-sm text-muted-foreground max-w-xs">Send a prompt to your backend AI. Supports streaming, markdown, and code highlighting.</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {['Create a React component', 'Debug this error', 'Generate a REST API', 'Explain this code'].map(s => (
                <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>}

      {/* Scroll to bottom btn */}
      {tab === 'chat' && showScrollBtn && (
        <button
          onClick={() => { scrollToBottom(); setShowScrollBtn(false); }}
          className="absolute bottom-20 right-6 w-8 h-8 rounded-full bg-primary/90 border border-primary flex items-center justify-center shadow-lg hover:bg-primary transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Input — only show in chat tab */}
      {tab === 'chat' && <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything… (Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-secondary/60 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors resize-none scrollbar-dark overflow-y-auto"
            disabled={streaming}
            style={{ minHeight: '42px', maxHeight: '160px' }}
          />
          {streaming ? (
            <Button onClick={stopStream} size="icon" variant="destructive" className="flex-shrink-0 h-10 w-10">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </Button>
          ) : (
            <Button onClick={send} size="icon" disabled={!input.trim() || modelInfo?.is_active === false} className="flex-shrink-0 h-10 w-10">
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-1.5">Enter to send · Shift+Enter for newline · History auto-saved</div>
      </div>}
    </div>
  );
}