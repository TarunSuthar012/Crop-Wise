import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AIML_TARGET = process.env.VITE_AIML_PROXY_TARGET || 'http://localhost:8001'

export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/mandi-api': {
        target: AIML_TARGET,
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/mandi-api/, ''),
      },
      '/schemes-api': {
        target: AIML_TARGET,
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/schemes-api/, '/schemes'),
      },
      '/chatbot-api': {
        target: AIML_TARGET,
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/chatbot-api/, '/chatbot'),
      },
      // PMFBY PDFs only; avoid using '/schemes' alone.
      '/schemes/static': { target: AIML_TARGET, changeOrigin: true },
    },
  },
})
