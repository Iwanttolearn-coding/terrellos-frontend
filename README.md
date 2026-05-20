# Pastor AI Connect — Frontend
**Powered by TM Dezigns**
**Connected to TerrellOS AI Engine**

---

## App Identity

| App | Role |
|-----|------|
| **Pastor AI Connect** | Standalone frontend app — church tools, sermons, discipleship, Bible study |
| **TerrellOS** | Master AI/backend engine — AI, voice, memory, system tools |

Pastor AI Connect is its own app.
It uses TerrellOS as its shared AI and backend engine.
They are **not** the same app.

---

## Hosting: Cloudflare Pages

- **Live URL:** https://app.tm-dezigns.org
- **Platform:** Cloudflare Pages
- **Framework:** Vite (React)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Branch:** `main`

---

## Environment Variables (set in Cloudflare Pages dashboard)

```
VITE_BACKEND_URL=https://terrellos-backend.fly.dev
```

---

## Backend / AI Engine

- **System:** TerrellOS
- **Platform:** Fly.io
- **URL:** https://terrellos-backend.fly.dev
- **Repo:** Iwanttolearn-coding/terrellos-backend
- **What it provides:** AI chat, voice synthesis, image generation, memory, sermon engine, transcription

---

## Platform Map

| Layer | Platform | URL | Status |
|-------|----------|-----|--------|
| Pastor AI Frontend | Cloudflare Pages | https://app.tm-dezigns.org | ✅ Active |
| TerrellOS Backend / AI Engine | Fly.io | https://terrellos-backend.fly.dev | ✅ Active |
| Railway | — | — | ❌ NOT IN USE |
| Vercel | — | — | ❌ REPLACED by Cloudflare Pages |
| Base44 | Export/build source | — | 🔧 Build tool only, not runtime |

---

## Fly.io Secrets Required (terrellos-backend)

```
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
FRONTEND_URL=https://app.tm-dezigns.org
```

---

## Founder Access

The following emails always resolve to `super_admin / founder / unlimited`:
- `millzterrell210@icloud.com`
- `millzterrell5@gmail.com`

Enforced globally via `src/lib/founderAccess.js`

<!-- build trigger: 2026-05-20T17:12 -->
