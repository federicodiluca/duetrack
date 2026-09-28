/*
 * Rigenera l'immagine di anteprima per la condivisione del link (Open Graph, 1200×630):
 * `npm run social:build`. Il PNG è nel repo, quindi non serve rifarla a ogni build.
 *
 * L'icona è la stessa di scripts/icon-source.svg, ridisegnata qui in grande; il testo usa
 * i font di sistema, che sharp (librsvg) sa disegnare.
 */
import sharp from 'sharp'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const NIGHT = '#1d2b4f'
const AMBER = '#fbbf24'
const AMBER_DARK = '#b7791f'
const PAPER = '#f4f1ec'
const SOFT = '#4a5a80'

// L'icona su griglia 32, scalata ×9 (288 px) e posizionata a sinistra.
const icon = `
  <g transform="translate(96 171) scale(9)">
    <rect width="32" height="32" rx="7" fill="#26365f"/>
    <path d="M0 7a7 7 0 0 1 7-7h18a7 7 0 0 1 7 7v2H0z" fill="${AMBER}"/>
    <rect x="9" y="2.5" width="3.2" height="8" rx="1.6" fill="${PAPER}" stroke="#26365f" stroke-width="0.6"/>
    <rect x="19.8" y="2.5" width="3.2" height="8" rx="1.6" fill="${PAPER}" stroke="#26365f" stroke-width="0.6"/>
    <rect x="5.5" y="13.5" width="5" height="5" rx="1.5" fill="${SOFT}"/>
    <rect x="13.5" y="13.5" width="5" height="5" rx="1.5" fill="${SOFT}"/>
    <rect x="21.5" y="13.5" width="5" height="5" rx="1.5" fill="${SOFT}"/>
    <rect x="5.5" y="21.5" width="5" height="5" rx="1.5" fill="${SOFT}"/>
    <path d="M10.5 22v3.4a9 4.8 0 0 0 18 0V22z" fill="${AMBER_DARK}"/>
    <ellipse cx="19.5" cy="22" rx="9" ry="4.8" fill="${AMBER}"/>
    <ellipse cx="19.5" cy="22" rx="6.3" ry="3.12" fill="none" stroke="${AMBER_DARK}" stroke-width="1.2"/>
  </g>`

const font = `'Segoe UI', 'Helvetica Neue', Arial, sans-serif`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${NIGHT}"/>
  <rect y="598" width="1200" height="32" fill="${AMBER}"/>
  ${icon}
  <g font-family="${font}">
    <text x="456" y="262" font-size="96" font-weight="700" fill="#ffffff">Duetrack</text>
    <text x="456" y="330" font-size="38" font-weight="600" fill="${AMBER}">Chi ti deve cosa,</text>
    <text x="456" y="378" font-size="38" font-weight="600" fill="${AMBER}">letto dal tuo Google Calendar</text>
    <text x="456" y="446" font-size="26" fill="#c9d0e3">Tariffe, pagamenti e resoconti per chi lavora a ore.</text>
    <text x="456" y="484" font-size="26" fill="#c9d0e3">Nessun server: i dati restano sul tuo Google Drive.</text>
    <text x="1104" y="560" font-size="24" fill="#8f9bbb" text-anchor="end">duetrack.federicodiluca.com</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png().toFile(resolve(root, 'public/social-share.png'))
console.log('public/social-share.png aggiornata')
