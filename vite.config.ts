import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // App installabile e utilizzabile offline: il service worker tiene in cache i file
    // dell'app, e a ogni pubblicazione si aggiorna da solo alla visita successiva.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Duetrack',
        short_name: 'Duetrack',
        description: 'Chi ti deve cosa, letto dal tuo Google Calendar.',
        lang: 'it',
        // Relativi all'URL del manifest, così funzionano con qualunque percorso base.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#1d2b4f',
        theme_color: '#1d2b4f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Il font ha file per ogni alfabeto; per l'italiano bastano latin e latin-ext.
        // Gli altri il browser li scarica comunque se una pagina ne avesse bisogno.
        globIgnores: ['**/*-cyrillic*', '**/*-vietnamese*'],
      },
    }),
  ],
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
