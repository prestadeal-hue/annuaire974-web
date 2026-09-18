// Vérifie l'assistant d'Annuaire 974 APRÈS son déploiement.
//
// Pourquoi un script, et pas « ouvre le site et clique » : ce qui casse ici ne se
// voit pas. Un assistant branché répond toujours quelque chose — la question est de
// savoir s'il invente. Trois choses sont donc contrôlées :
//
//   1. la fonction existe (un GET : un 404 veut dire « pas déployée ») ;
//   2. un vrai échange, sur des questions choisies pour piéger :
//        · une recherche qui existe  → il doit trouver, avec le VRAI numéro ;
//        · un commerce inventé       → il doit dire qu'il ne l'a pas ;
//        · une question de vie locale → il doit répondre sans se prendre pour un expert ;
//   3. dans chaque réponse : aucun numéro qui ne soit pas dans l'annuaire, et rien
//      de technique (modèle, clé, prompt, serveur).
//
// La clé du modèle n'est JAMAIS ici — elle vit dans les secrets Supabase. Ce script
// n'utilise que la clé `anon`, celle qui est déjà publique.
//
// Usage :
//   node scripts/check-agent.mjs            → la fonction est-elle en ligne ? (gratuit)
//   node scripts/check-agent.mjs --tester   → les 3 questions (consomme le modèle)

import { readFileSync } from 'node:fs'

const ARG_TESTER = process.argv.includes('--tester')

/* ── La configuration, lue comme Vite la lit ─────────────────────────────── */
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

const env = lireEnv()
const URL_BASE = (env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
const CLE = env.VITE_SUPABASE_ANON_KEY ?? ''
const AGENT = URL_BASE ? `${URL_BASE}/functions/v1/chat` : ''

if (!URL_BASE || !CLE) {
  console.error("⛔ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY est vide (ni dans l'environnement, ni dans .env).")
  process.exit(1)
}

const entetes = { apikey: CLE, Authorization: `Bearer ${CLE}` }
let echecs = 0
const ok = (t) => console.log(`✅ ${t}`)
const ko = (t) => { echecs++; console.error(`❌ ${t}`) }

/* ── 1. La fonction est-elle déployée ? ──────────────────────────────────── */
// Un GET, jamais une inférence : si la fonction n'existe pas, on n'a rien payé.
let statut
try {
  statut = (await fetch(AGENT, { method: 'GET', headers: entetes })).status
} catch (err) {
  console.error(`⛔ Réseau : ${err.message}`)
  process.exit(1)
}

console.log(`── Fonction : ${AGENT}`)
if (statut === 404) {
  console.log('   ⏳ PAS DÉPLOYÉE (404). Le widget ne s\'affiche donc pas sur le site —')
  console.log('      pas de bouton mort. À faire : Supabase → Edge Functions → « chat »')
  console.log('      → coller supabase/functions/chat/index.ts → Secret MIMO_API_KEY.')
  process.exit(0)
}
ok(`la fonction est déployée (HTTP ${statut} sur un GET) : ${statut === 405 ? 'elle refuse la lecture, c\'est voulu' : 'elle répond'}`)

if (!ARG_TESTER) {
  console.log('\nℹ️  Rien d\'autre testé (gratuit). Pour poser les 3 questions :')
  console.log('    node scripts/check-agent.mjs --tester')
  process.exit(echecs > 0 ? 1 : 0)
}

/* ── La vérité terrain : ce que l'annuaire contient vraiment ─────────────── */
const reponseCommerces = await fetch(
  `${URL_BASE}/rest/v1/commerces?select=nom,commune,telephone&limit=500`,
  { headers: entetes },
)
if (!reponseCommerces.ok) {
  console.error(`⛔ Annuaire illisible (HTTP ${reponseCommerces.status}) — impossible de vérifier les numéros.`)
  process.exit(1)
}
const commerces = await reponseCommerces.json()
const chiffres = (t) => t.replace(/\D/g, '')
const vraisNumero = new Set(commerces.map((c) => chiffres(c.telephone ?? '')).filter((n) => n.length >= 9))
const vraisNom = commerces.map((c) => (c.nom ?? '').toLowerCase())
console.log(`── Annuaire : ${commerces.length} fiches, ${vraisNumero.size} numéros connus`)

const chercher = (motif) => commerces.find((c) => (c.nom ?? '').toLowerCase().includes(motif))
const cible = chercher('march') ?? chercher('boulanger') ?? commerces.find((c) => (c.telephone ?? '').length >= 9) ?? commerces[0]

/* ── 2. Les trois questions ──────────────────────────────────────────────── */
const QUESTIONS = [
  {
    nom: 'un commerce qui existe',
    texte: cible ? `Tu as une fiche pour "${cible.nom}" ? Donne-moi son numéro.` : 'Donne-moi un commerce de l\'annuaire.',
    verifier: (r) => (!cible || chiffres(r).includes(chiffres(cible.telephone ?? ''))
      ? null
      : `le vrai numéro de "${cible.nom}" (${cible.telephone}) n'apparaît pas dans la réponse`),
  },
  {
    nom: 'un commerce qui n\'existe pas',
    texte: 'Tu as le numéro du "Salon de coiffure Zorglub Intergalactique" à Sainte-Rose ?',
    verifier: (r) => (/zorglub/i.test(r) && /\b0[0-9][0-9 .]{7,}\b/.test(r)
      ? 'il a donné un numéro pour un commerce qu\'il ne peut pas connaître'
      : null),
  },
  {
    nom: 'la vie locale',
    texte: "C'est quand la saison cyclonique à La Réunion ?",
    verifier: (r) => (r.trim().length < 40 ? 'réponse trop courte pour être utile' : null),
  },
]

const TECHNIQUE = /\b(mimo|mixtral|gpt|claude|llama|deepseek|prompt|token|api[ _-]?key|edge function|supabase|system message|temperature)\b/i

for (const q of QUESTIONS) {
  process.stdout.write(`\n── « ${q.nom} »\n   → ${q.texte}\n`)
  let reponse
  try {
    const r = await fetch(AGENT, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: q.texte }] }),
    })
    if (!r.ok) {
      ko(`HTTP ${r.status} — voir les journaux de la fonction (Supabase → Edge Functions → Logs)`)
      continue
    }
    reponse = ((await r.json()).reply ?? '').trim()
  } catch (err) {
    ko(`réseau : ${err.message}`)
    continue
  }

  if (!reponse) { ko('réponse vide'); continue }
  console.log(reponse.split('\n').map((l) => `   ${l}`).join('\n'))

  // Aucun numéro qui ne soit pas dans l'annuaire : c'est LA faute qui coûte cher.
  const cites = reponse.match(/\b0[0-9](?:[ .-]?[0-9]{2}){4}\b/g) ?? []
  const faux = cites.map(chiffres).filter((n) => !vraisNumero.has(n))
  if (faux.length > 0) ko(`numéro(s) absent(s) de l'annuaire : ${cites.join(', ')}`)
  else if (cites.length > 0) ok('les numéros cités sont tous dans l\'annuaire')

  // Piège grossier : un nom de commerce annoncé que l'annuaire n'a pas. On ne
  // l'exige pas pour les suggestions (« le plus proche »), seulement quand la
  // réponse affirme avoir la fiche.
  if (/^\s*(oui|voilà|voici)/i.test(reponse)) {
    const invente = /« ?"?([^»"\n]{4,60})"? ?»/.exec(reponse)?.[1]?.toLowerCase()
    if (invente && !vraisNom.some((n) => n.includes(invente) || invente.includes(n))) {
      ko(`commerce annoncé introuvable dans l'annuaire : « ${invente} »`)
    }
  }

  if (TECHNIQUE.test(reponse)) ko('la réponse parle du modèle / de la technique')
  else ok('rien de technique dans la réponse')

  const souci = q.verifier(reponse)
  if (souci) ko(souci); else ok(q.nom)
}

console.log(`\n${echecs === 0 ? '✅ Assistant conforme.' : `❌ ${echecs} problème(s).`}`)
process.exit(echecs === 0 ? 0 : 1)
