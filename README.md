# TerrellOS — AI Command Center Frontend

**Owner:** Terrell Mills  
**Live URL:** https://app.tm-dezigns.com

---

## Hosting

| Layer | Platform | URL | Status |
|-------|----------|-----|--------|
| TerrellOS Frontend | **Netlify** | https://app.tm-dezigns.com | ✅ LIVE |
| TerrellOS Backend | Fly.io | https://terrellos-backend.fly.dev | ✅ LIVE |

- **Platform:** Netlify (terrellos-frontend-tm)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Branch:** `main`
- **Node version:** 20

> ⚠️ Vercel — NOT IN USE  
> ⚠️ Cloudflare Pages — NOT IN USE  
> ⚠️ Railway — NOT IN USE  
> ⚠️ Base44 — build tool / export only, NOT runtime hosting

---

## Environment Variables (set in Netlify dashboard)

```
VITE_BACKEND_URL=https://terrellos-backend.fly.dev
VITE_APP_NAME=TerrellOS
VITE_APP_DOMAIN=app.tm-dezigns.com
VITE_ENVIRONMENT=production
```

---

## Backend / AI Engine

- **Platform:** Fly.io
- **App name:** terrellos-backend
- **URL:** https://terrellos-backend.fly.dev
- **Deploy:** `flyctl deploy -a terrellos-backend`
- **Repo:** Iwanttolearn-coding/terrellos-backend

---

## Deploy

Auto-deploys on every push to `main` via Netlify GitHub integration.

Manual trigger: Netlify dashboard → **Deploys** → **Trigger deploy**

> If Netlify loses GitHub access: Settings → Build & Deploy → Link repository → re-authorize GitHub → select `Iwanttolearn-coding/terrellos-frontend`

---

## Fly.io Secrets (terrellos-backend)

```
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
FRONTEND_URL=https://app.tm-dezigns.com
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

---

## Founder Access

Always resolves to `super_admin / founder / unlimited`:
- `millzterrell210@icloud.com`
- `millzterrell5@gmail.com`

Enforced via `src/lib/founderAccess.js`

<!-- last updated: 2026-06-09 -->
