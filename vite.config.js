import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// TerrellOS — fully self-hosted on Render (frontend) + Fly.io (backend)
// No Base44 platform dependency.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || 'https://terrellos-backend.fly.dev'
    ),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: { port: 5173 }
})
