import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Mirrors the routers mounted in backend/main.py.
    proxy: {
      '/admin': 'http://127.0.0.1:8000',
      '/lineage': 'http://127.0.0.1:8000',
      '/projects': 'http://127.0.0.1:8000',
      '/galleries': 'http://127.0.0.1:8000',
      '/statics': 'http://127.0.0.1:8000',
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Split the large, rarely-changing libraries so a content edit does
        // not invalidate them in the browser cache.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'gsap-vendor': ['gsap'],
          'supabase-vendor': ['@supabase/supabase-js'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
