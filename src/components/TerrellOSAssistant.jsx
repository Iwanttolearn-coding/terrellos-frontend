/**
 * TerrellOSAssistant.jsx — TerrellOS
 * Floating AI companion. Loads after login.
 * - Knows current page via useLocation
 * - Explains pages, launches tools, answers system questions
 * - Text chat always works
 * - Voice (ElevenLabs TTS) optional — degrades gracefully
 * - English / Spanish toggle
 * - Session memory (in-component)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';
import {
  MessageSquare, X, Send, Mic, MicOff, Volume2, VolumeX,
  Globe, Minimize2, Maximize2, Zap
} from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev';
const APP_ID  = 'terrellos';

// ── Route → page context ──────────────────────────────────────────────────────
const PAGE_CONTEXT = {
  '/terrellos/welcome':      { en: 'TerrellOS command center. Live system health, quick-launch tools, deployment status.', es: 'Centro de comando de TerrellOS. Salud del sistema en vivo, herramientas de lanzamiento rápido.' },
  '/dashboard':              { en: 'Dashboard with tool shortcuts and backend status.',                                     es: 'Panel con accesos directos a herramientas y estado del backend.' },
  '/tools/chat-engine':      { en: 'AI Chat powered by GPT-4o. Ask anything — design help, code, strategy.',               es: 'Chat con IA impulsado por GPT-4o. Pregunta lo que quieras — diseño, código, estrategia.' },
  '/tools/voice-lab':        { en: 'Voice Lab — text-to-speech via ElevenLabs and audio transcription via Whisper.',        es: 'Laboratorio de voz — texto a voz con ElevenLabs y transcripción con Whisper.' },
  '/tools/tattoo-studio':    { en: 'AI Tattoo Studio — generate tattoo art, outlines, and stencils from a text prompt.',    es: 'Estudio de tatuajes con IA — genera arte, contornos y plantillas desde texto.' },
  '/tools/creator-vault':    { en: 'Creator Vault — manage your saved designs, AI outputs, and uploaded assets.',           es: 'Bóveda del creador — administra tus diseños guardados y activos subidos.' },
  '/tools/style-advisor':    { en: 'Style Advisor — ask for creative direction, color palettes, and design recommendations.',es: 'Asesor de estilo — pide dirección creativa, paletas de colores y recomendaciones.' },
  '/tools/print-readiness':  { en: 'Print Readiness — upload a file to check its quality for DTF or stencil printing.',     es: 'Preparación para impresión — sube un archivo para verificar su calidad.' },
  '/tools/deploy':           { en: 'Deployment Health — live status for the Fly.io backend and Cloudflare Pages frontend.',  es: 'Salud del despliegue — estado en vivo del backend en Fly.io y frontend en Cloudflare.' },
  '/tools/uploads':          { en: 'Upload Manager — drag and drop files to store them in the TerrellOS backend.',          es: 'Gestor de subidas — arrastra y suelta archivos para guardarlos en el backend.' },
  '/diagnostics':            { en: 'System Diagnostics — run checks on OpenAI keys, backend health, voice, and uploads.',   es: 'Diagnósticos del sistema — verifica claves de OpenAI, backend, voz y subidas.' },
  '/founder':                { en: 'Founder Command Center — full system access, audit logs, and admin controls.',           es: 'Centro de comando del fundador — acceso total al sistema, registros de auditoría.' },
};

const SUGGESTIONS = {
  en: ['Open Tattoo Studio', 'Check system health', 'Go to Voice Lab', 'Open AI Chat', 'Check deployment status', 'Upload a file'],
  es: ['Abrir Estudio de Tatuajes', 'Verificar salud del sistema', 'Ir al Lab de Voz', 'Abrir Chat con IA', 'Ver estado del despliegue', 'Subir un archivo'],
};

const ROUTE_MAP = {
  'tattoo studio': '/tools/tattoo-studio', 'estudio de tatuajes': '/tools/tattoo-studio',
  'voice lab': '/tools/voice-lab', 'lab de voz': '/tools/voice-lab',
  'ai chat': '/tools/chat-engine', 'chat': '/tools/chat-engine',
  'uploads': '/tools/uploads', 'subir': '/tools/uploads',
  'style advisor': '/tools/style-advisor', 'asesor': '/tools/style-advisor',
  'print': '/tools/print-readiness', 'impresión': '/tools/print-readiness',
  'deployment': '/tools/deploy', 'despliegue': '/tools/deploy',
  'diagnostics': '/diagnostics', 'diagnósticos': '/diagnostics',
  'vault': '/tools/creator-vault', 'bóveda': '/tools/creator-vault',
  'founder': '/founder', 'fundador': '/founder',
  'dashboard': '/dashboard', 'welcome': '/terrellos/welcome',
};

async function chat(message, pageCtx, lang, history) {
  const systemPrompt = `You are the TerrellOS AI assistant — a smart, friendly guide built into the TerrellOS AI Operating System by TM Designs. You help users navigate the platform, launch tools, explain errors, and get things done.

Current page: ${pageCtx}
Language: ${lang === 'es' ? 'Spanish — respond ONLY in Spanish' : 'English — respond ONLY in English'}

Rules:
- Be concise (2-4 sentences max unless explaining something technical)
- If user asks to open/go to a tool, say "Opening [tool name] now…" and the route will be handled
- If asked about system health, direct them to /diagnostics or /tools/deploy
- Never mention Base44, Render, Railway, Vercel, or other hosting platforms
- Founder emails: millzterrell210@icloud.com and millzterrell5@gmail.com have full access
- If voice fails, say text chat is always available as backup`;

  const r = await fetch(`${BACKEND}/v1/core/chat`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'X-App-ID':APP_ID },
    body: JSON.stringify({
      message,
      system_prompt: systemPrompt,
      history: history.slice(-6).map(m => ({ role: m.role, content: m.content })),
      max_tokens: 300,
      language: lang,
      output_language: lang,
      app_id: APP_ID,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`${r.status}`);
  const d = await r.json();
  return d.reply || d.response || d.message || '';
}

async function speak(text, lang) {
  const r = await fetch(`${BACKEND}/v1/voice/speak`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'X-App-ID':APP_ID },
    body: JSON.stringify({ text, language: lang, voice_id: null, app_id: APP_ID }),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) return null;
  const ct = r.headers.get('content-type') || '';
  if (ct.includes('audio')) {
    const blob = await r.blob();
    return URL.createObjectURL(blob);
  }
  const d = await r.json();
  return d.audio_url || d.url || null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TerrellOSAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [open,       setOpen]       = useState(false);
  const [minimized,  setMinimized]  = useState(false);
  const [lang,       setLang]       = useState('en');
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [voiceOn,    setVoiceOn]    = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [greeted,    setGreeted]    = useState(false);
  const bottomRef = useRef();
  const audioRef  = useRef();

  const access = resolveUserAccess(user);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  // Greet on first open
  useEffect(() => {
    if (!open || greeted) return;
    setGreeted(true);
    const pageCtx = PAGE_CONTEXT[location.pathname]?.[lang] || `the ${location.pathname} page`;
    const greeting = lang === 'es'
      ? `¡Hola${access.displayName && access.displayName !== 'User' ? `, ${access.displayName}` : ''}! Estás en ${pageCtx} ¿En qué puedo ayudarte?`
      : `Hey${access.displayName && access.displayName !== 'User' ? ` ${access.displayName}` : ''}! You're on ${pageCtx} What can I help you with?`;
    setMessages([{ role:'assistant', content: greeting, id: Date.now() }]);
  }, [open, greeted, location.pathname, lang, access.displayName]);

  // Detect tool navigation requests
  const checkRouteIntent = useCallback((text) => {
    const lower = text.toLowerCase();
    for (const [keyword, route] of Object.entries(ROUTE_MAP)) {
      if (lower.includes(keyword)) return route;
    }
    return null;
  }, []);

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    setInput('');
    const userMsg = { role:'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Check for navigation intent
    const targetRoute = checkRouteIntent(text);

    try {
      const pageCtx = PAGE_CONTEXT[location.pathname]?.[lang] || `the ${location.pathname} page`;
      const reply = await chat(text, pageCtx, lang, [...messages, userMsg]);
      const assistantMsg = { role:'assistant', content: reply, id: Date.now() + 1 };
      setMessages(prev => [...prev, assistantMsg]);

      // Navigate after reply if tool was requested
      if (targetRoute) {
        setTimeout(() => navigate(targetRoute), 600);
      }

      // Optional TTS
      if (voiceOn && !voiceError) {
        try {
          const audioUrl = await speak(reply, lang);
          if (audioUrl && audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play().catch(() => setVoiceError(true));
          }
        } catch { setVoiceError(true); }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role:'assistant',
        content: lang === 'es' ? 'Lo siento, hubo un error. El chat de texto siempre está disponible aunque falle la voz.' : 'Sorry, something went wrong. Text chat always works even if voice fails.',
        id: Date.now() + 1,
        error: true,
      }]);
    }
    setLoading(false);
  }, [input, loading, messages, location.pathname, lang, voiceOn, voiceError, navigate, checkRouteIntent]);

  const toggleVoice = () => {
    if (voiceError) setVoiceError(false);
    setVoiceOn(v => !v);
  };

  // Hide on login page
  if (location.pathname === '/login' || !user) return null;

  return (
    <>
      <audio ref={audioRef} hidden />

      {/* Floating orb button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="TerrellOS AI Assistant"
          style={{
            position:'fixed', bottom:24, right:24, zIndex:1000,
            width:52, height:52, borderRadius:'50%',
            background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
            border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 20px rgba(124,58,237,0.5), 0 0 0 0 rgba(124,58,237,0.4)',
            animation:'assistantPulse 3s ease-in-out infinite',
          }}>
          <Zap size={22} color="white" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position:'fixed', bottom:24, right:24, zIndex:1000,
          width: minimized ? 280 : 360,
          background:'#0a0a0a',
          border:'1px solid rgba(124,58,237,0.3)',
          borderRadius:18,
          boxShadow:'0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)',
          display:'flex', flexDirection:'column',
          transition:'all 0.2s ease',
          overflow:'hidden',
        }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(124,58,237,0.08)', borderBottom:'1px solid rgba(124,58,237,0.15)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Zap size={14} color="white" />
              </div>
              <div>
                <p style={{ fontSize:12, fontWeight:800, color:'white', margin:0 }}>TerrellOS AI</p>
                <p style={{ fontSize:10, color:'#4b5563', margin:0 }}>{loading ? 'thinking…' : 'online'}</p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              {/* Lang toggle */}
              <button onClick={() => { setLang(l => l === 'en' ? 'es' : 'en'); setGreeted(false); }}
                style={{ fontSize:10, padding:'3px 7px', borderRadius:6, background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.2)', color:'#a78bfa', cursor:'pointer', fontWeight:700 }}>
                {lang === 'en' ? 'ES' : 'EN'}
              </button>
              {/* Voice toggle */}
              <button onClick={toggleVoice} title={voiceError ? 'Voice unavailable' : voiceOn ? 'Mute voice' : 'Enable voice'}
                style={{ padding:'4px', borderRadius:6, background: voiceOn ? 'rgba(74,222,128,0.12)' : 'rgba(124,58,237,0.08)', border:`1px solid ${voiceOn ? 'rgba(74,222,128,0.25)' : 'rgba(124,58,237,0.2)'}`, color: voiceError ? '#f87171' : voiceOn ? '#4ade80' : '#4b5563', cursor:'pointer', display:'flex' }}>
                {voiceOn ? <Volume2 size={12}/> : <VolumeX size={12}/>}
              </button>
              <button onClick={() => setMinimized(m => !m)} style={{ padding:'4px', borderRadius:6, background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.15)', color:'#4b5563', cursor:'pointer', display:'flex' }}>
                {minimized ? <Maximize2 size={12}/> : <Minimize2 size={12}/>}
              </button>
              <button onClick={() => { setOpen(false); setGreeted(false); }}
                style={{ padding:'4px', borderRadius:6, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.15)', color:'#f87171', cursor:'pointer', display:'flex' }}>
                <X size={12}/>
              </button>
            </div>
          </div>

          {/* Voice error banner */}
          {voiceError && (
            <div style={{ padding:'6px 14px', background:'rgba(251,191,36,0.08)', borderBottom:'1px solid rgba(251,191,36,0.15)' }}>
              <p style={{ fontSize:10, color:'#fbbf24', margin:0 }}>⚠ Voice unavailable — text chat works fine</p>
            </div>
          )}

          {!minimized && (
            <>
              {/* Messages */}
              <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8, maxHeight:320 }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display:'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'85%', padding:'8px 11px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: msg.role === 'user' ? 'rgba(124,58,237,0.25)' : msg.error ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.35)' : msg.error ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      fontSize:12, color: msg.error ? '#f87171' : '#d1d5db', lineHeight:1.6,
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ display:'flex', gap:3 }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:'#4b5563', animation:`dotBounce 1.2s ease-in-out infinite`, animationDelay:`${i*0.2}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions */}
              {messages.length <= 1 && (
                <div style={{ padding:'0 14px 8px', display:'flex', gap:4, flexWrap:'wrap' }}>
                  {SUGGESTIONS[lang].slice(0,3).map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      style={{ fontSize:10, padding:'4px 8px', borderRadius:8, background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.15)', color:'#a78bfa', cursor:'pointer', whiteSpace:'nowrap' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ display:'flex', gap:6, padding:'8px 14px 14px', flexShrink:0 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                  placeholder={lang === 'es' ? 'Pregunta algo…' : 'Ask anything…'}
                  style={{ flex:1, background:'#111', border:'1px solid #1f2937', borderRadius:10, padding:'8px 12px', fontSize:12, color:'white', outline:'none' }}
                />
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                  style={{ width:34, borderRadius:10, border:'none', background: loading || !input.trim() ? '#111' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'white', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Send size={13}/>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes assistantPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(124,58,237,0.5), 0 0 0 0 rgba(124,58,237,0.4); }
          50%       { box-shadow: 0 4px 28px rgba(124,58,237,0.7), 0 0 0 8px rgba(124,58,237,0.0); }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
