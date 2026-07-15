import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/core': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api\/core/, ''),
        changeOrigin: true,
      },
      '/api/router': {
        target: 'http://localhost:8001',
        rewrite: (path) => path.replace(/^\/api\/router/, ''),
        changeOrigin: true,
      },
    },
  },
})
