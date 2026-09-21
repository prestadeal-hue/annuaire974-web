/* ══════════════════════════════════════════════════════════════════════════
   L'image de partage — celle qu'on voit quand le lien circule.

   Un lien vers l'annuaire collé dans un groupe WhatsApp, sur Facebook ou dans
   un message affiche une vignette : sans image, c'est un rectangle vide avec
   une URL. Sur une île où tout circule par téléphone, c'est la première
   impression qui manque — d'où ce fichier.

   Généré, pas dessiné à la main : il suit la charte (même dégradé que le hero,
   même or, mêmes fontes de la marque) et se régénère avec `npm run og`.

   Les textes sont rendus par le rasteriseur SVG avec DejaVu Sans — la police
   disponible sur une machine Linux nue. Elle n'est pas Manrope (la police du
   site), mais elle est lisible et sans surprise ; le wordmark TiSite, lui, est
   l'original, donc la marque reste exacte là où ça compte.
   ══════════════════════════════════════════════════════════════════════════ */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const LARGEUR = 1200
const HAUTEUR = 630
const LARGEUR_LOGO = 360

const TITRE = 'Annuaire 974'
const SOUS_TITRE = "L'assistant des commerces et des prestataires de La Réunion"
const PIED = 'tisite.re/annuaire974'

/* Le fond : le même dégradé que le hero du site (émeraude profond), plus deux
   halos — émeraude en haut à droite, or en bas à gauche. */
const fond = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${HAUTEUR}">
  <defs>
    <linearGradient id="fond" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0E4A37"/>
      <stop offset="0.6" stop-color="#0B3D2E"/>
      <stop offset="1" stop-color="#082B20"/>
    </linearGradient>
    <radialGradient id="haloVert" cx="0.88" cy="-0.1" r="0.9">
      <stop offset="0" stop-color="#1EA574" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#1EA574" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="haloOr" cx="0.08" cy="1.1" r="0.7">
      <stop offset="0" stop-color="#E8B84B" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#E8B84B" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${LARGEUR}" height="${HAUTEUR}" fill="url(#fond)"/>
  <rect width="${LARGEUR}" height="${HAUTEUR}" fill="url(#haloVert)"/>
  <rect width="${LARGEUR}" height="${HAUTEUR}" fill="url(#haloOr)"/>
</svg>`

/* Les textes, posés SOUS le wordmark (qui est composité par-dessus). */
const textes = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${HAUTEUR}">
  <style>
    .nom { font-family: 'DejaVu Sans', sans-serif; font-weight: bold; font-size: 74px; fill: #E9F2EC; }
    .role { font-family: 'DejaVu Sans', sans-serif; font-size: 30px; fill: #A8BDB1; }
    .lien { font-family: 'DejaVu Sans', sans-serif; font-weight: bold; font-size: 24px; fill: #E8B84B; }
  </style>
  <text class="nom" x="${LARGEUR / 2}" y="430" text-anchor="middle">${TITRE}</text>
  <text class="role" x="${LARGEUR / 2}" y="486" text-anchor="middle">${SOUS_TITRE}</text>
  <text class="lien" x="${LARGEUR / 2}" y="572" text-anchor="middle">${PIED}</text>
</svg>`

const wordmark = await sharp(path.join(root, 'public', 'logo', 'tisite-logo.png'))
  .resize({ width: LARGEUR_LOGO })
  .png()
  .toBuffer()

const hauteurLogo = (await sharp(wordmark).metadata()).height ?? 0

await sharp(Buffer.from(fond))
  .composite([
    { input: Buffer.from(textes), top: 0, left: 0 },
    { input: wordmark, top: 132, left: Math.round((LARGEUR - LARGEUR_LOGO) / 2) },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'public', 'og-image.png'))

console.log(`✅ public/og-image.png — ${LARGEUR}×${HAUTEUR}, wordmark ${LARGEUR_LOGO}×${hauteurLogo}`)
