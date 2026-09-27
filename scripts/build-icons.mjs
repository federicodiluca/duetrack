/*
 * Rigenera le icone da scripts/icon-source.svg.
 * Da lanciare a mano dopo aver cambiato il sorgente: `npm run icons:build`.
 *
 *   public/favicon.svg                  copia del sorgente, per le schede del browser
 *   public/icons/icon-192.png           192×192, angoli arrotondati trasparenti
 *   public/icons/icon-512.png           512×512, angoli arrotondati trasparenti
 *   public/icons/maskable-512.png       512×512, a tutto campo, disegno nell'area sicura
 *   public/icons/apple-touch-icon.png   180×180, a tutto campo: iOS arrotonda da sé
 *                                       e riempirebbe di nero gli angoli trasparenti
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BACKGROUND = '#1d2b4f'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(resolve(root, 'scripts/icon-source.svg'))
const out = (name) => resolve(root, 'public/icons', name)

// density alta: sharp rasterizza l'SVG a 72 dpi, e un viewBox di 32 unità verrebbe sgranato.
const render = (size) => sharp(src, { density: 72 * (size / 32) * 2 }).resize(size, size)

/** Il disegno ridotto a `scale` e centrato su un quadrato pieno del colore di fondo. */
async function fullBleed(size, scale) {
  const inner = Math.round(size * scale)
  const offset = Math.round((size - inner) / 2)
  return sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } }).composite([
    { input: await render(inner).png().toBuffer(), top: offset, left: offset },
  ])
}

await render(192).png().toFile(out('icon-192.png'))
await render(512).png().toFile(out('icon-512.png'))
// Android ritaglia le icone maskable a cerchio, goccia o squircle: il disegno deve stare
// nel cerchio centrale che copre l'80% del lato.
await (await fullBleed(512, 0.78)).png().toFile(out('maskable-512.png'))
await (await fullBleed(180, 1)).png().toFile(out('apple-touch-icon.png'))
writeFileSync(resolve(root, 'public/favicon.svg'), src)

console.log('icone aggiornate: favicon.svg, icon-192, icon-512, maskable-512, apple-touch-icon')
