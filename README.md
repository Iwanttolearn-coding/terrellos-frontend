# Pastor AI Connect — Frontend
**Powered by TM Dezigns**

## Hosting: Cloudflare Pages
- **Live URL:** https://app.tm-dezigns.org
- **Platform:** Cloudflare Pages
- **Framework:** Vite (React)
- **Build command:** `vite build`
- **Output directory:** `dist`
- **Branch:** `main`

## Environment Variables (set in Cloudflare Pages dashboard)
```
VITE_BACKEND_URL=https://terrellos-backend.fly.dev
```

## Backend
- **Platform:** Fly.io
- **URL:** https://terrellos-backend.fly.dev
- **Repo:** Iwanttolearn-coding/terrellos-backend

## Platform Map
| Layer    | Platform         | URL                              |
|----------|------------------|----------------------------------|
| Frontend | Cloudflare Pages | https://app.tm-dezigns.org       |
| Backend  | Fly.io           | https://terrellos-backend.fly.dev|
| Railway  | ❌ NOT IN USE    | ignore                           |
| Vercel   | ❌ REPLACED      | replaced by Cloudflare Pages     |
| Base44   | Export only      | not runtime                      |
