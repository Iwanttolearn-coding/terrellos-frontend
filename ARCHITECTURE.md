# Pastor AI Connect — Architecture Reference
**Powered by TM Dezigns**

## ✅ Clean Platform Map

| Layer     | Platform  | URL                                  |
|-----------|-----------|--------------------------------------|
| Frontend  | Vercel    | https://app.tm-dezigns.org           |
| Backend   | Fly.io    | https://terrellos-backend.fly.dev    |
| Source    | GitHub    | Iwanttolearn-coding/terrellos        |
| Railway   | ❌ IGNORE | Do not deploy here right now         |
| Base44    | Export only | Source/builder only, not runtime   |

## Vercel Environment Variables
```
VITE_BACKEND_URL=https://terrellos-backend.fly.dev
```

## Fly.io Secrets (set via `fly secrets set`)
```
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
FRONTEND_URL=https://app.tm-dezigns.org
```

## Deploy Commands
```bash
# Frontend — auto-deploys on push to main via Vercel
git push origin main

# Backend — manual deploy to Fly.io
fly deploy
```

## Do NOT
- ❌ Push backend to Railway (extra noise)
- ❌ Use Base44 SDK runtime in production code
- ❌ Have multiple VITE_BACKEND_URL values pointing to different hosts
