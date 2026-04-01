import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/admin': 'http://127.0.0.1:8000',
      '/temples': 'http://127.0.0.1:8000', // API & Static
      '/contact': 'http://127.0.0.1:8000', // API
      '/upload': 'http://127.0.0.1:8000', // API
      '/team': 'http://127.0.0.1:8000',
    }
  }
})
