// cache-bust: 1781035734
// TerrellOS — Frontend: Netlify (app.tm-dezigns.com via Cloudflare DNS)
//              Backend:  Fly.io  (terrellos-backend.fly.dev)
//              DNS:      Cloudflare (lars + wally nameservers)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev'
    ),
    'import.meta.env.VITE_PLATFORM_FRONTEND': JSON.stringify('Netlify'),
    'import.meta.env.VITE_PLATFORM_DNS':       JSON.stringify('Cloudflare'),
    'import.meta.env.VITE_PLATFORM_BACKEND':   JSON.stringify('Fly.io'),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'https://terrellos-backend.fly.dev',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
