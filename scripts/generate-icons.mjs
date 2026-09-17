// Génère les icônes PWA PNG depuis le logo SVG (sharp, devDependency uniquement).
// Usage : npm run icons
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const svgPath = path.join(root, 'public', 'logo-tisite.svg')
const outDir = path.join(root, 'public', 'icons')

const svg = await sharp(svgPath, { density: 300 }).resize(512, 512).png().toBuffer()

await mkdir(outDir, { recursive: true })

await sharp(svg).resize(192, 192).png().toFile(path.join(outDir, 'pwa-192.png'))
await sharp(svg).resize(512, 512).png().toFile(path.join(outDir, 'pwa-512.png'))

// Maskable : le logo est réduit à 78 % sur fond plein, zone de sécurité
const maskable = await sharp(svg)
  .resize(400, 400)
  .png()
  .toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#5B21B6' },
})
  .composite([{ input: maskable, top: 56, left: 56 }])
  .png()
  .toFile(path.join(outDir, 'pwa-maskable-512.png'))

await sharp(svg).resize(180, 180).png().toFile(path.join(root, 'public', 'apple-touch-icon.png'))

console.log('✅ Icônes générées dans public/icons/ + apple-touch-icon.png')
