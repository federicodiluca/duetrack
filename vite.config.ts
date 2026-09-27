import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Google accetta il login solo dalle origini autorizzate, porta compresa: se la 5173
    // è occupata meglio un errore chiaro che un server su un'altra porta dove il login fallisce.
    port: 5173,
    strictPort: true,
  },
})
