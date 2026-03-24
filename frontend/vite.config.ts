import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const localBackendTarget = process.env.VITE_LOCAL_API_PROXY_TARGET ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: localBackendTarget,
        changeOrigin: true,
      },
      '/health': {
        target: localBackendTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-markdown')) {
            return 'markdown'
          }

          if (
            id.includes('node_modules/@mui/') ||
            id.includes('node_modules/@emotion/')
          ) {
            return 'mui'
          }

          return undefined
        },
      },
    },
  },
})
