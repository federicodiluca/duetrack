import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Content-Security-Policy: il browser carica ed esegue solo ciò che è elencato qui. Se uno
 * script riuscisse a entrare nella pagina (XSS) non potrebbe mandare il token Google altrove.
 * Sta in un <meta> perché GitHub Pages non permette header HTTP; solo nella build, perché il
 * server di sviluppo di Vite usa script inline che la policy bloccherebbe.
 */
const CSP = [
  "default-src 'self'",
  // Google Identity Services: lo script del login e il suo iframe.
  "script-src 'self' https://accounts.google.com/gsi/client",
  "frame-src https://accounts.google.com/gsi/",
  // API di Calendar e Drive (compreso l'upload), e le chiamate interne del login.
  "connect-src 'self' https://www.googleapis.com https://accounts.google.com/gsi/",
  // Gli stili inline servono a Radix e sonner per posizionare menu e avvisi.
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  "img-src 'self' data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'duetrack-csp',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    contentSecurityPolicy(),
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
