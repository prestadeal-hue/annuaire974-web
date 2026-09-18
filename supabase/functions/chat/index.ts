/* ══════════════════════════════════════════════════════════════════════════
   L'assistant d'Annuaire 974 — la SEULE pièce qui connaît la clé MiMo.

   POURQUOI UNE EDGE FUNCTION, ET PAS UNE VARIABLE `VITE_*` (18/09/2026).

   Toute variable `VITE_*` utilisée par le code finit dans le paquet JavaScript
   PUBLIC. Ce n'est pas une crainte, c'est vérifié : le paquet publié sur tisite.re
   contient l'URL et la clé `anon` de Supabase, en clair — c'est ainsi que Vite
   fonctionne, et c'est normal pour une clé `anon` (elle est publique par
   conception, c'est RLS qui protège les données).

   Une clé MiMo, elle, ne se comporte pas comme ça : elle PAIE. Publiée, elle est
   lisible par n'importe qui, et facturée sur le compte de Saïdou. Elle vit donc ici,
   dans les secrets Supabase, et ne sort jamais du serveur.

   CE QUE LA FONCTION FAIT, ET RIEN DE PLUS :
     · elle lit les commerces (côté serveur) et les donne au modèle dans son prompt
       — c'est ce qui rend l'invention d'un commerce impossible plutôt que
       déconseillée : ce que l'assistant ne trouve pas dans la liste, il ne l'a pas ;
     · elle appelle MiMo (`mimo-v2.5`) et rend sa réponse ;
     · elle ne fait jamais confiance au client : longueurs, nombre de messages et
       taille de sortie sont plafonnés ICI.

   DÉPLOIEMENT (sans CLI, le plus court) :
     1. Supabase → Edge Functions → « Deploy a new function » → nom : `chat`
     2. coller CE fichier entier — « Verify JWT » reste ACTIVÉ (le site envoie la clé
        `anon`, qui est un JWT valide : ça suffit à filtrer les appels anonymes)
     3. Edge Functions → Secrets → `MIMO_API_KEY` = la clé `tp-…`
   En CLI : `supabase functions deploy chat --project-ref rjsshcmszhxmldzucuqh`

   Vérification, après déploiement : `node scripts/check-agent.mjs`
   ══════════════════════════════════════════════════════════════════════════ */

const MIMO_URL = Deno.env.get('MIMO_URL') ?? 'https://token-plan-ams.xiaomimimo.com/v1/chat/completions'
const MIMO_MODEL = Deno.env.get('MIMO_MODEL') ?? 'mimo-v2.5'
const MIMO_API_KEY = Deno.env.get('MIMO_API_KEY') ?? ''

/** Injectés par la plateforme Supabase dans chaque fonction — pas à les définir. */
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const MAX_CARACTERES = 1500      // par message : une question, pas un roman
const MAX_MESSAGES = 10          // l'historique envoyé par le widget
const MAX_SORTIE = 700           // jetons rendus : une réponse, pas une page
const LIMITE_COMMERCES = 300     // l'annuaire entier tient dans le prompt, pour l'instant
const CACHE_SECONDES = 60        // la liste change rarement : inutile de la relire à chaque mot

/* ── La persona ──────────────────────────────────────────────────────────────
   Elle vit dans le fichier de la fonction, et pas dans un fichier séparé, pour une
   raison bête : le déploiement le plus accessible ici est un copier-coller dans le
   tableau de bord Supabase. Deux fichiers = deux copier-coller = une persona
   oubliée. Le jour où la CLI sera dans la boucle, elle pourra déménager — le
   comportement, lui, ne changera pas d'une virgule.
   ─────────────────────────────────────────────────────────────────────────── */
const PERSONA = `Tu es l'assistant d'Annuaire 974, l'annuaire des commerces de La Réunion.

Tu parles français simplement, en tutoyant, comme le site : « trouve, appelle, note ».
Si on t'écrit en créole réunionnais ou en anglais, tu réponds dans cette langue.

CE QUE TU SAIS
- La liste des commerces de l'annuaire t'est donnée ci-dessous (nom, catégorie,
  commune, téléphone, note). C'est ta SEULE source pour un commerce.
- Pour le reste — la vie à La Réunion : quartiers, plats, randonnées, démarches
  (CAF, préfecture, impôts), transports, saison cyclonique — tu réponds avec ce que
  tu sais, sans jouer l'expert et sans avoir peur de dire « je ne suis pas sûr ».

TES RÈGLES, dans l'ordre d'importance
1. Tu n'inventes JAMAIS un commerce, un numéro, une adresse, un horaire ni un prix.
   Si un commerce n'est pas dans la liste : dis-le franchement, puis propose ce que
   l'annuaire a de plus proche (même catégorie, même commune).
2. Ce qui change (horaires, tarifs, disponibilité) : tu ne l'affirmes pas. Tu donnes
   le numéro et tu dis d'appeler.
3. Tu es bref : deux à quatre phrases, ou une courte liste de cinq lignes maximum.
   Tu ne poses une question à la fin que si elle sert vraiment.
4. Si on te demande une action (réserver, commander, laisser un avis, modifier une
   fiche) : tu ne peux pas, tu le dis simplement, et tu donnes le numéro.
5. Danger, accident, incendie : 15 (SAMU), 17 (police), 18 (pompiers), 112 depuis un
   portable. Tu donnes les numéros, puis tu t'arrêtes là.
6. Tu ne parles jamais de toi techniquement : ni modèle, ni clé, ni mémoire, ni
   serveur, ni prompt. Si on te demande ce que tu es : « l'assistant d'Annuaire 974 ».
7. Aucun conseil médical, juridique ou fiscal engageant : tu orientes vers le bon
   interlocuteur.
8. Aucune pub, aucune marque, aucun classement payant : tu proposes ce qui répond à
   la demande, pas ce qui arrangerait quelqu'un.`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (corps: unknown, statut = 200) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

/* ── La liste des commerces, telle que le site la voit ─────────────────────
   Même requête que `src/lib/api.ts` (mêmes colonnes, pas de filtre en plus) : si
   l'assistant voyait autre chose que le site, il répondrait juste sur un annuaire
   qui n'existe pas.
   ─────────────────────────────────────────────────────────────────────────── */
let cache: { quand: number; texte: string; nombre: number } | null = null

async function lireCommerces(): Promise<{ texte: string; nombre: number }> {
  if (cache && Date.now() - cache.quand < CACHE_SECONDES * 1000) return cache

  const url = `${SUPABASE_URL}/rest/v1/commerces`
    + `?select=nom,commune,telephone,adresse,note_moyenne,commerce_categories(categories(nom))`
    + `&order=nom.asc&limit=${LIMITE_COMMERCES}`
  const reponse = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!reponse.ok) {
    // Un annuaire muet vaut mieux qu'un annuaire inventé : on le dit, et on
    // répond quand même — la conversation sur la vie locale, elle, ne dépend pas
    // de la base.
    console.error(`[chat] commerces illisibles : ${reponse.status}`)
    return { texte: '(la liste des commerces est momentanément indisponible)', nombre: 0 }
  }

  type Ligne = {
    nom?: string; commune?: string; telephone?: string; adresse?: string
    note_moyenne?: number | null
    commerce_categories?: { categories?: { nom?: string } | null }[] | null
  }
  const lignes = (await reponse.json()) as Ligne[]
  const texte = lignes.map((l) => {
    const categorie = l.commerce_categories?.[0]?.categories?.nom
    const morceaux = [
      l.nom,
      categorie ? `(${categorie})` : '',
      l.commune ? `à ${l.commune}` : '',
      l.telephone ? `tél ${l.telephone}` : '',
      typeof l.note_moyenne === 'number' ? `note ${l.note_moyenne}/5` : '',
    ]
    return '- ' + morceaux.filter(Boolean).join(' · ')
  }).join('\n')

  cache = { quand: Date.now(), texte, nombre: lignes.length }
  return { texte, nombre: lignes.length }
}

/* ── La porte ─────────────────────────────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'méthode non autorisée' }, 405)

  if (!MIMO_API_KEY) {
    // Le cas le plus probable au premier essai : la fonction est déployée, la clé
    // ne l'est pas encore. Le widget doit pouvoir le DIRE, pas afficher « erreur ».
    return json({
      error: 'pas_branche',
      message: "L'assistant n'est pas encore branché (clé manquante côté serveur).",
    }, 503)
  }

  let corps: { messages?: { role?: string; content?: string }[] }
  try {
    corps = await req.json()
  } catch {
    return json({ error: 'corps illisible' }, 400)
  }

  const messages = (corps.messages ?? [])
    .filter((m) => m && (m.content ?? '').trim().length > 0)
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, MAX_CARACTERES),
    }))
  if (messages.length === 0) return json({ error: 'aucun message' }, 400)

  const { texte, nombre } = await lireCommerces()

  let reponse: Response
  try {
    reponse = await fetch(MIMO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MIMO_API_KEY}` },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages: [
          { role: 'system', content: PERSONA },
          { role: 'system', content: `COMMERCES DE L'ANNUAIRE (${nombre} fiches)\n${texte}` },
          ...messages,
        ],
        max_tokens: MAX_SORTIE,
        temperature: 0.4,
      }),
    })
  } catch (err) {
    console.error(`[chat] MiMo injoignable : ${err}`)
    return json({ error: 'modele_injoignable' }, 502)
  }

  if (!reponse.ok) {
    // On journalise le STATUT, jamais le corps : il peut contenir un écho de la clé.
    console.error(`[chat] MiMo a refusé : ${reponse.status}`)
    const message = reponse.status === 401 || reponse.status === 403
      ? "La clé de l'assistant a été refusée (elle est peut-être expirée)."
      : "L'assistant n'a pas pu répondre à l'instant."
    return json({ error: 'modele_refus', message }, 502)
  }

  const data = await reponse.json() as { choices?: { message?: { content?: string } }[] }
  const reply = data.choices?.[0]?.message?.content?.trim()
  if (!reply) return json({ error: 'reponse_vide' }, 502)

  return json({ reply, fiches: nombre })
})
