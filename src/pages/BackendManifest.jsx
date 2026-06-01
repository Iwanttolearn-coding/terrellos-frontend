import { useState } from 'react';
import { API_BASE_URL } from '@/lib/env';
import { FileCode, Copy, Check, ChevronDown, ChevronRight, Folder, File } from 'lucide-react';

const FILES = {
  'requirements.txt': `fastapi
uvicorn[standard]
gunicorn
python-dotenv
httpx
openai
supabase
python-multipart
pydantic
aiofiles
python-jose[cryptography]
passlib[bcrypt]
slowapi
elevenlabs`,

  '.env.template': `OPENAI_API_KEY=
ELEVENLABS_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
JWT_SECRET=
UPLOAD_SECRET=
API_SECRET=
ENVIRONMENT=production
OWNER_EMAIL=millzterrell210@icloud.com
CORS_ORIGINS=https://your-base44-app.base44.app`,

  'app.py': `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from middleware.security import SecurityMiddleware
from routes import health, chat, uploads, voice, memory, auth, admin, analytics, projects

app = FastAPI(title="TerrellOS API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityMiddleware)

app.include_router(health.router, tags=["health"])
app.include_router(auth.router,   prefix="/auth",      tags=["auth"])
app.include_router(chat.router,   prefix="/chat",      tags=["chat"])
app.include_router(uploads.router,prefix="/uploads",   tags=["uploads"])
app.include_router(voice.router,  prefix="/voice",     tags=["voice"])
app.include_router(memory.router, prefix="/memory",    tags=["memory"])
app.include_router(admin.router,  prefix="/admin",     tags=["admin"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])`,

  'config/settings.py': `from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    ENVIRONMENT: str = "production"
    OPENAI_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    JWT_SECRET: str = ""
    API_SECRET: str = ""
    OWNER_EMAIL: str = "millzterrell210@icloud.com"
    CORS_ORIGINS: List[str] = ["*"]
    MAX_UPLOAD_MB: int = 50
    AI_TIMEOUT_S: int = 30
    RATE_LIMIT: str = "100/minute"

    class Config:
        env_file = ".env"

settings = Settings()`,

  'database/client.py': `from supabase import create_client, Client
from config.settings import settings
import asyncio

_client: Client = None

def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client

async def query(table: str, filters: dict = None, limit: int = 50):
    client = get_client()
    q = client.table(table).select("*")
    if filters:
        for k, v in filters.items():
            q = q.eq(k, v)
    return q.limit(limit).execute()

async def insert(table: str, data: dict):
    return get_client().table(table).insert(data).execute()

async def update(table: str, id: str, data: dict):
    return get_client().table(table).update(data).eq("id", id).execute()`,

  'ai/openai_service.py': `import openai
from config.settings import settings
import httpx

openai.api_key = settings.OPENAI_API_KEY

PROVIDERS = ["openai", "gemini", "claude"]

async def generate_response(prompt: str, messages: list = None, system: str = None) -> str:
    """Generate AI response with provider fallback chain."""
    errors = []
    for provider in PROVIDERS:
        try:
            if provider == "openai":
                return await _openai_chat(prompt, messages, system)
            elif provider == "gemini":
                return await _gemini_chat(prompt, messages)
            elif provider == "claude":
                return await _claude_chat(prompt, messages)
        except Exception as e:
            errors.append(f"{provider}: {str(e)}")
    raise Exception(f"All AI providers failed: {errors}")

async def _openai_chat(prompt, messages, system):
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    msgs = []
    if system:
        msgs.append({"role": "system", "content": system})
    if messages:
        msgs.extend(messages)
    msgs.append({"role": "user", "content": prompt})
    res = await client.chat.completions.create(model="gpt-4o", messages=msgs)
    return res.choices[0].message.content

async def summarize_memory(memories: list) -> str:
    text = "\\n".join([m.get("content", "") for m in memories])
    return await generate_response(f"Summarize these memories concisely: {text}")

async def analyze_emotion(text: str) -> str:
    return await generate_response(
        f"Identify the primary emotion in this text (one word): {text}",
        system="You are an emotional intelligence engine."
    )`,

  'memory/memory_engine.py': `from database.client import query, insert
from ai.openai_service import summarize_memory, analyze_emotion
from datetime import datetime

async def store_message(user_id: str, session_id: str, role: str, content: str):
    emotion = None
    if role == "user":
        try:
            emotion = await analyze_emotion(content)
        except:
            pass
    return await insert("conversations", {
        "user_id": user_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "emotion": emotion,
        "created_at": datetime.utcnow().isoformat()
    })

async def recall_memory(user_id: str, limit: int = 20):
    return await query("conversations", filters={"user_id": user_id}, limit=limit)

async def summarize_user_memory(user_id: str) -> str:
    records = await recall_memory(user_id, limit=50)
    if not records.data:
        return "No memory yet."
    return await summarize_memory(records.data)`,

  'voice/elevenlabs_service.py': `import httpx
from config.settings import settings

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"
HEADERS = lambda: {"xi-api-key": settings.ELEVENLABS_API_KEY, "Content-Type": "application/json"}

async def text_to_speech(text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM", lang: str = "en") -> bytes:
    """Convert text to audio bytes."""
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"{ELEVENLABS_BASE}/text-to-speech/{voice_id}",
            headers=HEADERS(),
            json={"text": text, "model_id": "eleven_multilingual_v2",
                  "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}
        )
        res.raise_for_status()
        return res.content

async def list_voices() -> list:
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(f"{ELEVENLABS_BASE}/voices", headers=HEADERS())
        res.raise_for_status()
        return res.json().get("voices", [])`,

  'middleware/security.py': `from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from config.settings import settings

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Block oversized bodies (checked at middleware level)
        if request.headers.get("content-length"):
            size = int(request.headers["content-length"])
            if size > settings.MAX_UPLOAD_MB * 1024 * 1024:
                raise HTTPException(413, "Request too large")

        # API key check for protected routes
        protected = ["/admin", "/analytics", "/memory"]
        path = request.url.path
        if any(path.startswith(p) for p in protected):
            key = request.headers.get("X-API-Key", "")
            if settings.API_SECRET and key != settings.API_SECRET:
                raise HTTPException(401, "Invalid API key")

        return await call_next(request)`,

  'auth/owner_override.py': `from config.settings import settings

OWNER_EMAILS = [settings.OWNER_EMAIL, "millzterrell5@gmail.com"]

def is_owner(email: str) -> bool:
    return email.lower().strip() in [e.lower() for e in OWNER_EMAILS]

def get_effective_role(user: dict) -> str:
    if is_owner(user.get("email", "")):
        return "super_admin"
    return user.get("role", "user")

def get_effective_plan(user: dict) -> str:
    if is_owner(user.get("email", "")):
        return "elite"
    return user.get("plan", "free")

def get_permissions(user: dict) -> dict:
    if is_owner(user.get("email", "")):
        return {"all": True, "bypass_quota": True, "bypass_subscription": True}
    return {"all": False}`,

  'logs/logger.py': `import logging
import json
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("terrellos")

def log_event(event_type: str, data: dict = None, level: str = "info"):
    msg = json.dumps({"event": event_type, "data": data or {}, "ts": datetime.utcnow().isoformat()})
    getattr(logger, level, logger.info)(msg)

def log_api(method: str, path: str, status: int, ms: float):
    log_event("api_request", {"method": method, "path": path, "status": status, "ms": ms})

def log_ai_call(provider: str, tokens: int = 0, success: bool = True):
    log_event("ai_call", {"provider": provider, "tokens": tokens, "success": success})

def log_auth(email: str, action: str, success: bool):
    log_event("auth", {"email": email, "action": action, "success": success})`
};

const TREE = [
  { type: 'file', name: 'app.py' },
  { type: 'file', name: 'requirements.txt' },
  { type: 'file', name: '.env.template' },
  { type: 'dir', name: 'config', children: ['config/settings.py'] },
  { type: 'dir', name: 'database', children: ['database/client.py'] },
  { type: 'dir', name: 'ai', children: ['ai/openai_service.py'] },
  { type: 'dir', name: 'memory', children: ['memory/memory_engine.py'] },
  { type: 'dir', name: 'voice', children: ['voice/elevenlabs_service.py'] },
  { type: 'dir', name: 'middleware', children: ['middleware/security.py'] },
  { type: 'dir', name: 'auth', children: ['auth/owner_override.py'] },
  { type: 'dir', name: 'logs', children: ['logs/logger.py'] },
  { type: 'dir', name: 'routes', children: [] },
  { type: 'dir', name: 'uploads', children: [] },
  { type: 'dir', name: 'avatars', children: [] },
  { type: 'dir', name: 'analytics', children: [] },
];

export default function BackendManifest() {
  const [selected, setSelected] = useState('app.py');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({ config: true, database: true, ai: true, memory: true, voice: true, middleware: true, auth: true, logs: true });

  const code = FILES[selected] || '# File content will appear here';

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden">
      {/* File tree */}
      <div className="w-56 flex-shrink-0 border-r border-border bg-card/50 overflow-y-auto scrollbar-dark">
        <div className="px-3 pt-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Backend Manifest</span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">Production-grade Python backend structure for Fly.io deployment</div>
        </div>
        <div className="py-2">
          {TREE.map(item => item.type === 'file' ? (
            <button
              key={item.name}
              onClick={() => setSelected(item.name)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-secondary/50 transition-colors ${selected === item.name ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
            >
              <File className="w-3 h-3 flex-shrink-0" />
              <span className="font-mono truncate">{item.name}</span>
            </button>
          ) : (
            <div key={item.name}>
              <button
                onClick={() => setExpanded(e => ({ ...e, [item.name]: !e[item.name] }))}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-muted-foreground hover:bg-secondary/40 transition-colors"
              >
                {expanded[item.name] ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                <Folder className="w-3 h-3 flex-shrink-0 text-yellow-500/70" />
                <span className="font-mono">{item.name}/</span>
              </button>
              {expanded[item.name] && (item.children || []).map(child => (
                <button
                  key={child}
                  onClick={() => setSelected(child)}
                  className={`w-full flex items-center gap-2 pl-8 pr-3 py-1 text-left text-xs hover:bg-secondary/50 transition-colors ${selected === child ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                >
                  <File className="w-3 h-3 flex-shrink-0" />
                  <span className="font-mono truncate">{child.split('/').pop()}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Code viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50 flex-shrink-0">
          <span className="text-sm font-mono text-muted-foreground">{selected}</span>
          <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary">
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-5 text-xs font-mono text-foreground leading-relaxed bg-background scrollbar-dark whitespace-pre-wrap">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}