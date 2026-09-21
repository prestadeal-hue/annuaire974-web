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
//   node scripts/check-agent.mjs --exa      → la recherche web (Exa) est-elle branchée ?
//   node scripts/check-agent.mjs --flux     → la réponse arrive-t-elle au fil de l'eau ?
//   node scripts/check-agent.mjs --date     → la date du jour est-elle juste ? (1 question)
//   node scripts/check-agent.mjs --tester   → les 3 questions (consomme le modèle),
//                                             puis Exa, le flux, la date, le plafond
//                                             et le pays

import { readFileSync } from 'node:fs'

const ARG_TESTER = process.argv.includes('--tester')
const ARG_EXA = process.argv.includes('--exa')
const ARG_FLUX = process.argv.includes('--flux')
const ARG_DATE = process.argv.includes('--date')

// Le fuseau de l'assistant — le même que celui de la fonction par défaut. Sert
// à calculer la date attendue CÔTÉ CONTRÔLE, sans rien demander au serveur :
// comparer deux fois la même source ne prouverait rien.
const FUSEAU = process.env.FUSEAU ?? 'Indian/Reunion'

const dateAttendue = (maintenant = new Date()) => {
  const parties = new Intl.DateTimeFormat('en-GB', {
    timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(maintenant)
  const prendre = (type) => parties.find((p) => p.type === type)?.value ?? ''
  return {
    iso: `${prendre('year')}-${prendre('month')}-${prendre('day')}`,
    long: new Intl.DateTimeFormat('fr-FR', {
      timeZone: FUSEAU, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(maintenant),
  }
}

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
// La fonction récente se DÉCRIT dans sa réponse (les deux clés sont-elles posées ?) —
// c'est gratuit, et ça évite d'attendre une réponse payante pour le savoir.
let statut
let config = null
try {
  const r = await fetch(AGENT, { method: 'GET', headers: entetes })
  statut = r.status
  config = await r.json().catch(() => null)
} catch (err) {
  console.error(`⛔ Réseau : ${err.message}`)
  process.exit(1)
}

console.log(`── Fonction : ${AGENT}`)
if (statut === 404) {
  console.log('   ⏳ PAS DÉPLOYÉE (404). Le chat l\'annonce donc honnêtement sur le site —')
  console.log('      pas de bouton mort. À faire : Supabase → Edge Functions → « chat »')
  console.log('      → coller supabase/functions/chat/index.ts → Secrets MIMO_API_KEY + EXA_API_KEY.')
  process.exit(0)
}
ok(`la fonction est déployée (HTTP ${statut} sur un GET)`)
if (config && typeof config === 'object' && 'exa' in config) {
  console.log(`   ⓘ elle se décrit : modèle « ${config.modele ?? '?'} » · Exa « ${config.exa ?? '?'} »`)
}

if (!ARG_TESTER && !ARG_EXA && !ARG_FLUX && !ARG_DATE) {
  console.log('\nℹ️  Rien d\'autre testé (gratuit). Pour aller plus loin :')
  console.log('    node scripts/check-agent.mjs --exa     (la recherche web est-elle branchée ?)')
  console.log('    node scripts/check-agent.mjs --flux    (la réponse arrive-t-elle au fil de l\'eau ?)')
  console.log('    node scripts/check-agent.mjs --date    (la date du jour est-elle juste ?)')
  console.log('    node scripts/check-agent.mjs --tester  (les 3 questions pièges)')
  process.exit(echecs > 0 ? 1 : 0)
}

// `--exa` / `--flux` / `--date` : on ne paie que la ou les questions demandées.
if (!ARG_TESTER) {
  if (ARG_EXA) await verifierExa()
  if (ARG_FLUX) await verifierFlux()
  if (ARG_DATE) await verifierDate()
  console.log(`\n${echecs === 0 ? '✅ Conforme.' : `❌ ${echecs} problème(s).`}`)
  process.exit(echecs === 0 ? 0 : 1)
}

/* ── La recherche web (Exa), prouvée et non supposée ─────────────────────
   Deux preuves, dans cet ordre :
     1. la fonction dit ELLE-MÊME si `EXA_API_KEY` est posée (un GET, gratuit) ;
     2. une question qui a besoin du web — la réponse porte alors `web > 0`,
        le nombre de résultats Exa qui l'ont nourrie. C'est mesuré, pas deviné.
   Le repli, si la fonction n'annonce pas encore `web` (ancienne version) : on
   cherche un lien cité dans la réponse. Moins sûr, mais mieux que rien.
   ────────────────────────────────────────────────────────────────────────── */
async function verifierExa() {
  console.log(`\n── « la recherche Exa »`)

  if (config && typeof config.exa === 'string') {
    if (config.exa === 'pret') ok('la fonction annonce EXA_API_KEY configurée')
    else ko('la fonction annonce EXA_API_KEY ABSENTE — Supabase → Edge Functions → Secrets')
  } else {
    console.log("   ⓘ la fonction déployée ne se décrit pas (ancienne version) — on teste par la question.")
  }

  const question = 'Quels commerces ont ouvert récemment à Saint-Denis ? Cite tes sources.'
  console.log(`   → ${question}`)
  let corps
  try {
    const r = await fetch(AGENT, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
    })
    if (!r.ok) {
      ko(`HTTP ${r.status} — voir les journaux de la fonction`)
      return
    }
    corps = await r.json()
  } catch (err) {
    ko(`réseau : ${err.message}`)
    return
  }

  if (typeof corps.web === 'number') {
    if (corps.web > 0) ok(`Exa a fourni ${corps.web} résultat(s) web pour la question`)
    else ko("Exa n'a fourni AUCUN résultat (clé absente, ou Exa injoignable) — journaux de la fonction")
    return
  }

  const citeLien = /\]\(https?:\/\//.test(corps.reply ?? '')
  if (citeLien) ok('la réponse cite un lien web (à défaut du compte de résultats)')
  else ko("impossible de prouver l'usage d'Exa (fonction sans champ « web », aucun lien cité)")
}

/* ── La réponse au fil de l'eau, prouvée et non supposée ────────────────
   Deux preuves, une gratuite et une payante :
     1. la fonction DIT qu'elle sait streamer (un GET, gratuit) ;
     2. une vraie question doit rendre PLUSIEURS morceaux, et le premier doit
        arriver bien avant le dernier. C'est ça, « au fil de l'eau » : un seul
        morceau à la fin, c'est la réponse d'un bloc, et le visiteur attend.
   Le repli si la fonction déployée est l'ancienne : on le dit franchement, avec
   la marche à suivre — le site, lui, continue de fonctionner sans le flux.
   ────────────────────────────────────────────────────────────────────── */
async function verifierFlux() {
  console.log(`\n── « la réponse au fil de l'eau »`)

  if (config && typeof config.flux === 'string') ok('la fonction annonce qu\'elle sait streamer')
  else console.log("   ⓘ la fonction déployée ne se décrit pas (pas de champ « flux ») — version antérieure.")

  // Le lecteur de flux vit avec le site : c'est LUI qui tourne dans le
  // navigateur, donc c'est lui qu'il faut exercer, pas une copie.
  let lireFlux
  try {
    ({ lireFlux } = await import('../src/lib/flux.ts'))
  } catch (err) {
    console.log(`   ⓘ impossible de charger src/lib/flux.ts (${err.message}) — Node 24+ requis.`)
    return
  }

  const question = 'Un plombier à Saint-Denis, en deux phrases.'
  console.log(`   → ${question}`)
  const debut = Date.now()
  let premier = 0
  let morceaux = 0
  let texte = ''
  let arret = ''

  try {
    const r = await fetch(AGENT, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages: [{ role: 'user', content: question }], stream: true }),
    })
    if (!r.ok) {
      ko(`HTTP ${r.status} — voir les journaux de la fonction`)
      return
    }
    if (!(r.headers.get('content-type') ?? '').includes('text/event-stream')) {
      const corps = await r.json().catch(() => ({}))
      if (typeof corps.reply !== 'string' || !corps.reply) {
        ko('réponse illisible')
        return
      }
      ko("la fonction déployée répond d'un bloc : elle ne sait pas encore streamer")
      console.log('     → Supabase → Edge Functions → « chat » → Deploy updates → coller')
      console.log('       supabase/functions/chat/index.ts. Le site marche sans, mais le')
      console.log("       visiteur attend la réponse entière avant de lire le premier mot.")
      return
    }
    for await (const evt of lireFlux(r.body)) {
      if (evt.type === 'delta') {
        morceaux++
        if (!premier) premier = Date.now() - debut
        texte += evt.text
      } else if (evt.type === 'erreur') arret = evt.message ?? 'arrêt en route'
    }
  } catch (err) {
    ko(`réseau : ${err.message}`)
    return
  }

  if (arret) { ko(`le flux s'est interrompu : ${arret}`); return }
  if (!texte.trim()) { ko('flux vide — le visiteur ne verrait rien'); return }
  if (morceaux < 2) {
    ko(`un seul morceau de ${texte.length} caractères : la réponse arrive encore d'un bloc`)
    console.log('     → le modèle n\'a pas rendu un flux. Vérifier MIMO_URL (elle doit parler')
    console.log('       le dialecte OpenAI avec `stream: true`).')
    return
  }
  ok(`${morceaux} morceaux, premier après ${premier} ms, réponse complète en ${Date.now() - debut} ms`)
}

/* ── La date du jour, prouvée et non supposée ────────────────────────────
   Deux preuves, une gratuite et une payante :
     1. le GET publie la date telle que le SERVEUR la voit — on la compare à
        celle qu'on calcule ici, dans le même fuseau. Une fonction ancienne ne
        publie rien : elle le dit, au lieu de faire semblant.
     2. une vraie question : « on est quel jour aujourd'hui ? » doit rendre le
        bon jour ET le bon mois. C'est la question qui a mal tourné le
        21/09/2026 (« demain, mercredi 16 septembre », dit un lundi 21) :
        c'est donc elle qu'on repose.
   Sans `--date`, tout ceci est gratuit et ne consomme pas le modèle.
   ─────────────────────────────────────────────────────────────────────── */
async function verifierDate() {
  console.log('\n── « la date du jour »')

  const attendue = dateAttendue()
  console.log(`   ⓘ côté contrôle : ${attendue.long} (${attendue.iso}, fuseau ${FUSEAU})`)

  if (config && typeof config.date === 'string') {
    if (config.date === attendue.iso) {
      ok(`le serveur annonce la même date que nous (${config.date}, ${config.heure ?? '?'} à La Réunion)`)
    } else {
      ko(`le serveur annonce ${config.date} et nous ${attendue.iso} — fuseau à vérifier (secret FUSEAU)`)
    }
  } else {
    console.log("   ⓘ la fonction déployée ne publie pas de date (version antérieure) — on teste par la question.")
  }

  const question = "On est quel jour aujourd'hui ? Réponds en une phrase, sans détailler."
  console.log(`   → ${question}`)
  let corps
  try {
    const r = await fetch(AGENT, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
    })
    if (!r.ok) {
      ko(`HTTP ${r.status} — voir les journaux de la fonction`)
      return
    }
    corps = await r.json()
  } catch (err) {
    ko(`réseau : ${err.message}`)
    return
  }

  const reponse = (corps.reply ?? '').trim()
  if (!reponse) {
    ko('réponse vide')
    return
  }
  console.log(`   ⓘ réponse : ${reponse.slice(0, 160)}`)

  // Le jour du mois ET le mois, parce qu'un « 21 » tout seul peut venir d'une
  // phrase sur autre chose. Le nom du mois, lui, ne s'invente pas par hasard.
  const [, jour, mois] = attendue.long.split(' ')
  const aLeJour = new RegExp(`(^|[^0-9])${jour}([^0-9]|$)`).test(reponse)
  const aLeMois = reponse.toLowerCase().includes((mois ?? '').toLowerCase())
  if (aLeJour && aLeMois) ok(`la réponse donne bien le ${jour} ${mois}`)
  else {
    ko(`la réponse ne donne pas la date du jour — il fallait « ${attendue.long} »,`)
    console.log('     → c\'est l\'usage : les repères de date partent avec le prompt. Si la')
    console.log('       fonction en ligne est ancienne, recoller supabase/functions/chat/index.ts.')
  }
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
    // Le contrôle précédent était FAUX : il refusait la réponse dès qu'un numéro
    // apparaissait quelque part, alors que proposer des alternatives réelles avec
    // leurs vrais numéros est exactement ce qu'on demande. Ce qui serait grave,
    // c'est un numéro COLLÉ au commerce inventé. On ne regarde donc que les
    // 120 caractères qui suivent le nom inventé — et nommer ce commerce est
    // obligatoire : sans le nommer, on ne peut pas savoir s'il l'a inventé.
    // Deuxième correction, sur la même idée : exiger le nom inventé mot pour mot
    // était trop strict — un « Non, je n'ai pas ce salon dans mon annuaire » est une
    // EXCELLENTE réponse, et elle ne contient pas « Zorglub ». Donc deux formes :
    // il nomme le commerce (et alors il ne doit pas lui coller de numéro), ou il ne
    // le nomme pas (et alors il doit dire clairement qu'il ne l'a pas).
    verifier: (r) => {
      const i = r.search(/zorglub/i)
      const ditAbsent = /(je n'ai pas|je ne (l'ai|trouve|vois) pas|pas dans (mon|l')annuaire|introuvable|aucune (fiche|référence)|^\s*non\b)/i.test(r)
      if (i >= 0) {
        if (/\b0[0-9](?:[ .-]?[0-9]{2}){4}\b/.test(r.slice(i, i + 120))) {
          return 'il colle un numéro au commerce qu\'il ne peut pas connaître'
        }
        return ditAbsent ? null : 'il nomme le commerce inventé sans dire qu\'il ne l\'a pas'
      }
      return ditAbsent ? null : 'la réponse ne dit pas clairement que ce commerce est absent'
    },
  },
  {
    nom: 'la vie locale',
    texte: "C'est quand la saison cyclonique à La Réunion ?",
    verifier: (r) => (r.trim().length < 40 ? 'réponse trop courte pour être utile' : null),
  },
]

/* ── Le plafond par IP, vérifié sans payer un jeton ───────────────────────
   Le compteur est incrémenté AVANT la lecture du corps de la requête : on peut
   donc l'épuiser avec des requêtes vides, qui n'atteignent jamais le modèle. Si
   ce contrôle passait par de vraies questions, il coûterait 20 réponses.
   ────────────────────────────────────────────────────────────────────────── */
async function verifierPlafond() {
  const PLAFOND = 30
  console.log(`\n── « le plafond »\n   → ${PLAFOND} requêtes vides d'affilée, en espérant un refus`)
  let refuse = 0
  let statut = 0
  let corps = ''
  for (let i = 0; i < PLAFOND; i++) {
    const r = await fetch(AGENT, {
      method: 'POST',
      // Les mêmes en-têtes qu'un vrai client : sans clé, la PASSERELLE refuse avant
      // la fonction (`401 UNAUTHORIZED_NO_AUTH_HEADER`), et on ne mesurerait rien.
      headers: { ...entetes, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })
    statut = r.status
    corps = (await r.text()).slice(0, 120)
    if (r.status === 429) { refuse = i + 1; break }
  }
  if (refuse > 0) ok(`plafond atteint à la ${refuse}ᵉ requête, sans avoir payé un jeton`)
  else ko(`aucun plafond en ${PLAFOND} requêtes (dernière : HTTP ${statut} ${corps}) — soit la fonction déployée n'est pas la version avec le plafond, soit scripts/assistant-limite.sql n'est pas exécuté`)
  return refuse
}

/* ── La barrière pays ─────────────────────────────────────────────────────
   Le pays vient de Cloudflare, et on ne peut pas l'imiter depuis ici. On passe
   donc par la porte de secours `x-country`, prévue pour ce genre de contrôle :
   refusée → la barrière fonctionne. Acceptée → c'est que `cf-ipcountry` est déjà
   renseigné et autorisé (il passe avant), et l'essai ne dit alors rien de plus —
   mieux vaut le dire que d'afficher un ✅ qui ne prouve rien.
   ────────────────────────────────────────────────────────────────────────── */
async function verifierPays() {
  console.log(`\n── « la barrière pays »`)
  let r
  try {
    r = await fetch(AGENT, {
      method: 'POST',
      headers: { ...entetes, 'Content-Type': 'application/json', 'x-country': 'CN' },
      body: JSON.stringify({ messages: [] }),
    })
  } catch (err) {
    ko(`réseau : ${err.message}`)
    return
  }
  if (r.status === 403) ok('un pays hors zone est refusé (403)')
  else if (r.status === 400) {
    console.log("   ⓘ non concluant depuis ici, et on ne va pas prétendre le contraire :")
    console.log("     soit `cf-ipcountry` est renseigné et autorisé (il passe avant `x-country`),")
    console.log("     soit la fonction déployée n'a pas encore ce contrôle. Dans les deux cas,")
    console.log("     cet essai ne prouve rien. La vraie vérification est dans les journaux de")
    console.log("     la fonction : `[chat] pays RE · ip …` — c'est là qu'on voit si Cloudflare")
    console.log("     annonce bien La Réunion.")
  } else ko(`réponse inattendue : HTTP ${r.status}`)
}

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

await verifierExa()
await verifierFlux()
// La date : mesurée le 21/09/2026 (« demain, mercredi 16 septembre », dit un
// lundi 21). Elle fait partie de la batterie complète — c'est le genre de défaut
// qui se reproduit tout seul si personne ne repose la question.
await verifierDate()
await verifierPlafond()
await verifierPays()

console.log(`\n${echecs === 0 ? '✅ Assistant conforme.' : `❌ ${echecs} problème(s).`}`)
process.exit(echecs === 0 ? 0 : 1)
