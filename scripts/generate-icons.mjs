/* ══════════════════════════════════════════════════════════════════════════
   Les icônes — depuis la marque TiSite, plus depuis l'ancien logo.

   POURQUOI CE FICHIER A CHANGÉ (21/09/2026).

   Il générait les icônes depuis `public/logo-tisite.svg` : le logo VIOLET de
   l'annuaire d'avant, une épingle à tête violette sur fond violet. Le site,
   lui, est émeraude et or depuis la refonte. Résultat : une appli installée
   affichait une pastille violette — la seule chose du site qui n'était pas
   TiSite, et celle que le visiteur voit tous les jours sur son écran d'accueil.

   La source est maintenant `src/assets/brand/tisite-picto.png`, le pictogramme
   officiel (émeraude + or), repris de tisite.re pour que les deux sites
   portent exactement la même marque.

   `purpose: any` garde sa transparence ; le masquable et l'apple-touch, eux,
   prennent un fond plein — c'est la convention déjà en place sur tisite.re,
   dont l'apple-touch-icon est le pictogramme sur #0B3D2E.

   Usage : npm run icons
   ══════════════════════════════════════════════════════════════════════════ */

import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
// La source vit dans `src/assets/`, PAS dans `public/` : tout ce qui est dans
// public/ part dans le build (et se retrouve préchargé par le service worker).
// Un fichier de fabrication n'a rien à y faire.
const source = path.join(root, 'src', 'assets', 'brand', 'tisite-picto.png')
const outDir = path.join(root, 'public', 'icons')

/** L'émeraude du header TiSite — le fond des icônes opaques. */
const EMERAUDE = '#0B3D2E'

/** La marque seule, détourée, à une taille donnée. */
const marque = (taille) =>
  sharp(source)
    .resize(taille, taille, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

/* ── La zone de sécurité du masquable ───────────────────────────────────
   Android recadre l'icône en cercle (parfois en goutte ou en carré arrondi) et
   JETTE ce qui dépasse. Les coins d'un dessin carré passent donc à la trappe.
   On mesure d'abord ce que la marque occupe vraiment (`trim` ignore le vide),
   puis on la réduit à 78 % du carré : elle tient dans le cercle, quelle que
   soit la forme choisie par le lanceur.
   ──────────────────────────────────────────────────────────────────────── */
const zoneSure = 0.78

const marqueDetouree = await sharp(source).trim({ threshold: 1 }).toBuffer()
const boite = await sharp(marqueDetouree).metadata()
const coteMarque = Math.max(boite.width ?? 0, boite.height ?? 0)
const partOccupee = coteMarque / (await sharp(source).metadata()).width

/** La marque posée sur un fond plein — iOS et Android n'aiment pas le vide. */
const surFond = async (taille, fond) => {
  const cote = Math.round(taille * zoneSure)
  const dessin = await sharp(marqueDetouree)
    .resize(cote, cote, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const marge = Math.round((taille - cote) / 2)
  return sharp({ create: { width: taille, height: taille, channels: 4, background: fond } })
    .composite([{ input: dessin, top: marge, left: marge }])
    .png()
    .toBuffer()
}

/* ── 256 couleurs, et pourquoi ce n'est pas une perte ──────────────────
   Le pictogramme est un dégradé : en PNG « vraies couleurs », il pesait
   467 Ko à 512 px — et le service worker le précache, donc c'était un
   demi-mégaoctet sur le téléphone de chaque visiteur.

   Mesuré sur les pixels VISIBLES (ceux qui ne sont pas transparents) :
   l'écart avec l'original est de 1,9/255 au plein format, et de 0,8/255 à la
   taille où l'icône s'affiche vraiment (96 px). Autrement dit, personne ne
   peut le voir — alors qu'on passe de 467 Ko à 86 Ko.
   ────────────────────────────────────────────────────────────────────── */
const OPTIONS_PNG = { compressionLevel: 9, palette: true, colours: 256, dither: 1 }

await mkdir(outDir, { recursive: true })

await sharp(await marque(192)).png(OPTIONS_PNG).toFile(path.join(outDir, 'pwa-192.png'))
await sharp(await marque(512)).png(OPTIONS_PNG).toFile(path.join(outDir, 'pwa-512.png'))

// Masquable : Android recadre en cercle et rogne les bords — fond plein obligatoire.
await sharp(await surFond(512, EMERAUDE)).png(OPTIONS_PNG).toFile(path.join(outDir, 'pwa-maskable-512.png'))

// Apple : pas de transparence, iOS la remplit de noir sinon.
await sharp(await surFond(180, EMERAUDE)).png(OPTIONS_PNG).toFile(path.join(root, 'public', 'apple-touch-icon.png'))

console.log(`✅ Icônes régénérées depuis la marque TiSite (fond des opaques : ${EMERAUDE})`)
console.log(`   marque détourée ${boite.width}×${boite.height} — elle occupait ${Math.round(partOccupee * 100)} % du carré source, ramenée à ${Math.round(zoneSure * 100)} % sur les icônes masquables`)
