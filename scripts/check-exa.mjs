// Contrôle EXA — la clé et le service de recherche répondent-ils VRAIMENT ?
//
// Pourquoi ce script est à part de `check-agent` :
//   · `check-agent --exa` prouve que la FONCTION déployée utilise Exa (côté Supabase) ;
//   · celui-ci prouve que la CLÉ Exa elle-même est vivante, en direct, SANS Supabase.
// C'est le contrôle qu'un agent — ou agent-reach — peut lancer avant de compter sur
// une « recherche temps réel ». La clé n'est jamais affichée en entier : seul son
// préfixe l'est, avec le nombre de résultats.
//
// Usage :
//   node scripts/check-exa.mjs
//   node scripts/check-exa.mjs "tatoueur Saint-Denis La Réunion"

import { readFileSync } from 'node:fs'

function lireEnv() {
  const vars = { ...process.env }
  for (const f of ['.env.local', '.env']) {
    let brut
    try {
      brut = readFileSync(f, 'utf8')
    } catch {
      continue
    }
    for (const ligne of brut.split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(ligne)
      if (m && vars[m[1]] === undefined) vars[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return vars
}

const cle = (lireEnv().EXA_API_KEY ?? '').trim()
if (!cle) {
  console.error("⛔ EXA_API_KEY absente (ni dans l'environnement, ni dans .env).")
  process.exit(1)
}

const question = process.argv.slice(2).join(' ') || 'restaurant créole Saint-Pierre La Réunion'

let reponse
try {
  reponse = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': cle },
    body: JSON.stringify({
      query: question,
      numResults: 3,
      type: 'auto',
      contents: { text: { maxCharacters: 300 } },
    }),
  })
} catch (err) {
  console.error(`⛔ Réseau : Exa injoignable (${err.message})`)
  process.exit(1)
}

if (!reponse.ok) {
  console.error(`⛔ Exa refusé : HTTP ${reponse.status} — clé expirée ou invalide ?`)
  process.exit(1)
}

const donnees = await reponse.json()
const resultats = donnees.results ?? []

console.log(`── Exa · clé ${cle.slice(0, 8)}…`)
console.log(`   question : « ${question} »`)

if (resultats.length === 0) {
  console.error("❌ Exa a répondu, mais sans résultat — la recherche ne sert à rien en l'état.")
  process.exit(1)
}

for (const x of resultats.slice(0, 3)) console.log(`   • ${x.title ?? '(sans titre)'} — ${x.url ?? ''}`)
console.log(`\n✅ EXA OK — ${resultats.length} résultat(s) en direct.`)
