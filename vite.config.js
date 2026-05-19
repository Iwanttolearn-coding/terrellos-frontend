import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  define: {
    // Fallback so the app works even without .env set on Vercel
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev'
    )
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: { port: 5173 }
})
