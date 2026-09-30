/*
 * Rigenera l'immagine da condividere nelle storie di Instagram (1080×1920):
 * `npm run story:build`. Il PNG è nel repo, quindi non serve rifarla a ogni build.
 *
 * Mostra l'app con una schermata finta della panoramica. Il link è scritto in grande perché
 * Instagram, di una condivisione, prende solo l'immagine. Contenuti importanti tra y 250 e
 * y 1670: sopra e sotto le storie coprono con la barra e il campo di risposta.
 */
import sharp from 'sharp'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const NIGHT = '#1d2b4f'
const NIGHT_LIGHT = '#26365f'
const AMBER = '#fbbf24'
const AMBER_DARK = '#b7791f'
const PAPER = '#f4f1ec'
const SOFT = '#4a5a80'
const INK = '#1d2b4f'
const MUTED = '#6b7593'
const GREEN = '#15803d'

const font = `'Segoe UI', 'Helvetica Neue', Arial, sans-serif`

// L'icona su griglia 32 (come scripts/icon-source.svg), scalata ×6: 192 px.
const icon = (x, y) => `
  <g transform="translate(${x} ${y}) scale(6)">
    <rect width="32" height="32" rx="7" fill="${NIGHT_LIGHT}"/>
    <path d="M0 7a7 7 0 0 1 7-7h18a7 7 0 0 1 7 7v2H0z" fill="${AMBER}"/>
    <rect x="9" y="2.5" width="3.2" height="8" rx="1.6" fill="${PAPER}" stroke="${NIGHT_LIGHT}" stroke-width="0.6"/>
    <rect x="19.8" y="2.5" width="3.2" height="8" rx="1.6" fill="${PAPER}" stroke="${NIGHT_LIGHT}" stroke-width="0.6"/>
    <rect x="5.5" y="13.5" width="5" height="5" rx="1.5" fill="${SOFT}"/>
    <rect x="13.5" y="13.5" width="5" height="5" rx="1.5" fill="${SOFT}"/>
    <rect x="21.5" y="13.5" width="5" height="5" rx="1.5" fill="${SOFT}"/>
    <rect x="5.5" y="21.5" width="5" height="5" rx="1.5" fill="${SOFT}"/>
    <path d="M10.5 22v3.4a9 4.8 0 0 0 18 0V22z" fill="${AMBER_DARK}"/>
    <ellipse cx="19.5" cy="22" rx="9" ry="4.8" fill="${AMBER}"/>
    <ellipse cx="19.5" cy="22" rx="6.3" ry="3.12" fill="none" stroke="${AMBER_DARK}" stroke-width="1.2"/>
  </g>`

// La schermata finta: clienti inventati, come nella demo (npm run demo).
const clients = [
  { name: 'Davide', detail: '4 lezioni · 6 h', amount: '120 €', due: true },
  { name: 'Giulia', detail: '2 lezioni · 2 h 30', amount: '50 €', due: true },
  { name: 'Marco', detail: 'da pagare dal 1° set · 3 h', amount: '60 €', due: true },
  { name: 'Sara', detail: 'tutto saldato', amount: '0 €', due: false },
]

const PX = 150 // margine della schermata
const PW = 1080 - PX * 2
const rows = clients
  .map((c, i) => {
    const y = 1010 + i * 132
    return `
    <g transform="translate(${PX + 40} ${y})">
      <rect width="${PW - 80}" height="112" rx="20" fill="#ffffff"/>
      <circle cx="56" cy="56" r="30" fill="${c.due ? AMBER : '#dfe3ec'}"/>
      <text x="56" y="67" font-size="30" font-weight="700" fill="${INK}" text-anchor="middle">${c.name[0]}</text>
      <text x="108" y="50" font-size="32" font-weight="600" fill="${INK}">${c.name}</text>
      <text x="108" y="88" font-size="24" fill="${MUTED}">${c.detail}</text>
      <text x="${PW - 110}" y="68" font-size="34" font-weight="700" fill="${c.due ? INK : GREEN}" text-anchor="end">${c.amount}</text>
    </g>`
  })
  .join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NIGHT_LIGHT}"/>
      <stop offset="1" stop-color="${NIGHT}"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>

  <g font-family="${font}">
    ${icon(444, 260)}
    <text x="540" y="590" font-size="112" font-weight="700" fill="#ffffff" text-anchor="middle">Duetrack</text>
    <text x="540" y="665" font-size="44" font-weight="600" fill="${AMBER}" text-anchor="middle">Chi ti deve cosa,</text>
    <text x="540" y="722" font-size="44" font-weight="600" fill="${AMBER}" text-anchor="middle">letto dal tuo Google Calendar</text>

    <g filter="url(#shadow)">
      <rect x="${PX}" y="800" width="${PW}" height="750" rx="44" fill="${PAPER}"/>
    </g>
    <text x="${PX + 48}" y="878" font-size="30" fill="${MUTED}">Da incassare</text>
    <text x="${PX + 48}" y="950" font-size="64" font-weight="700" fill="${INK}">230 €</text>
    <text x="${PX + PW - 48}" y="950" font-size="28" fill="${MUTED}" text-anchor="end">3 clienti</text>
    ${rows}

    <text x="540" y="1628" font-size="34" fill="#c9d0e3" text-anchor="middle">Gratis, dal browser. I dati restano sul tuo Drive.</text>
    <text x="540" y="1694" font-size="46" font-weight="700" fill="${AMBER}" text-anchor="middle">duetrack.federicodiluca.com</text>
  </g>
</svg>`

await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(resolve(root, 'public/story.png'))
console.log('public/story.png aggiornata')
