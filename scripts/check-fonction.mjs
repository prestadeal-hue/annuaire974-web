/* ══════════════════════════════════════════════════════════════════════════
   La Edge Function compile-t-elle ? — `npm run check-fonction`.

   POURQUOI CE CONTRÔLE EXISTE. `npm run typecheck` ne regarde que `src/` : la
   fonction vit dans `supabase/functions/`, parce qu'elle utilise les globales
   Deno. Elle est donc le SEUL fichier du projet que personne ne vérifie — et
   c'est justement celui qu'on colle à la main dans le tableau de bord Supabase.
   Une virgule de trop se découvrirait à ce moment-là, en production, sur
   l'assistant que les clients utilisent.

   Ce script fabrique un `Deno` minimal (les deux seules choses utilisées :
   `Deno.env.get` et `Deno.serve`), puis passe le fichier au TypeScript du
   projet. Le shim vit dans un dossier temporaire : le dossier de la fonction
   reste un fichier unique, à coller en un seul geste.

   Ce que ce contrôle ne fait pas : il ne remplace pas Deno (pas de vérification
   des permissions, ni des imports distants — il n'y en a aucun ici).
   ══════════════════════════════════════════════════════════════════════════ */

import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const FONCTION = join(racine, 'supabase', 'functions', 'chat', 'index.ts')
const TSC = join(racine, 'node_modules', '.bin', 'tsc')

if (!existsSync(FONCTION)) {
  console.error(`⛔ introuvable : ${FONCTION}`)
  process.exit(1)
}
if (!existsSync(TSC)) {
  console.error('⛔ TypeScript absent (node_modules/.bin/tsc) — lancer `npm install`.')
  process.exit(1)
}

const temporaire = mkdtempSync(join(tmpdir(), 'fonction-'))
const shim = join(temporaire, 'deno.d.ts')
writeFileSync(
  shim,
  `// Le minimum de Deno utilisé par la fonction — pour le contrôle local seulement.
declare const Deno: {
  env: { get(cle: string): string | undefined }
  serve(handler: (req: Request) => Promise<Response> | Response): void
}
`,
)

const resultat = spawnSync(
  TSC,
  [
    '--noEmit',
    '--target', 'ES2022',
    '--lib', 'ES2022,DOM,DOM.Iterable',
    '--module', 'ESNext',
    '--moduleResolution', 'bundler',
    '--strict',
    '--skipLibCheck',
    '--noUnusedLocals',
    '--noUnusedParameters',
    FONCTION,
    shim,
  ],
  { cwd: racine, encoding: 'utf8' },
)

rmSync(temporaire, { recursive: true, force: true })

const sortie = `${resultat.stdout ?? ''}${resultat.stderr ?? ''}`.trim()
if (resultat.status === 0) {
  console.log('✅ la Edge Function compile (TypeScript strict, shim Deno minimal)')
  process.exit(0)
}

console.error('❌ la Edge Function ne compile pas :')
console.error(sortie || '(aucune sortie de tsc)')
console.error('\n   ⚠️ Ne PAS la coller dans Supabase dans cet état : c\'est la seule copie en service.')
process.exit(1)
