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

   ⚠️ « VERIFY JWT » DOIT ÊTRE DÉSACTIVÉ — ET CE N'EST PAS UN CHOIX.

   Ce projet utilise les clés 2026 (`sb_publishable_…`), qui ne sont PAS des JWT.
   Avec « Verify JWT » activé (le défaut), la passerelle Supabase refuse chaque
   appel avec `401 {"error":"JWT is invalid"}` : le test la rejette parce qu'elle
   attend un JWT signé, et la clé publique n'en est plus un. C'est confirmé par
   l'équipe Supabase : « il faut --no-verify-jwt si vous appelez avec une clé
   anon (publishable) ou service_role (secret) ».

   CONSÉQUENCE, ET ELLE EST RÉELLE : cet endpoint est public. La clé MiMo reste
   protégée (personne ne peut la lire), mais la DÉPENSE ne l'est pas — qui connaît
   l'URL peut la faire travailler. Trois barrières, dans cet ordre :

     1. l'ORIGINE — un site tiers ne peut pas s'en servir comme API (barrière, pas
        serrure : une origine se falsifie avec curl) ;
     2. le PAYS — La Réunion et la France, parce que c'est là que sont les
        utilisateurs. Le pays vient de Cloudflare (`cf-ipcountry`). S'il manque,
        on LAISSE PASSER et on le note : deviner, ici, voudrait dire fermer la
        porte à La Réunion un jour où l'en-tête change de nom ;
     3. le PLAFOND PAR IP — 20 questions par minute, tenu dans la base
        (`scripts/assistant-limite.sql`) et non en mémoire : deux instances de la
        fonction ne se parlent pas, un compteur local ne protégerait rien.

   Le plafond est appelé AVANT toute dépense, et même avant de lire le corps de la
   requête : un script qui martèle l'endpoint mérite le même refus, et ça rend le
   plafond vérifiable sans dépenser un seul jeton.

   DÉPLOIEMENT (sans CLI, le plus court) :
     1. Supabase → Edge Functions → « Deploy a new function » → « Via Editor » → nom : `chat`
     2. coller CE fichier entier, puis « Deploy function »
     3. onglet « Details » de la fonction → « Verify JWT with legacy secret » → OFF
     4. Edge Functions → Secrets → `MIMO_API_KEY` = la clé `tp-…`
     5. Edge Functions → Secrets → `EXA_API_KEY` = la clé Exa (`fd98…`)
     6. SQL Editor → `scripts/assistant-limite.sql` → Run (le plafond par IP)

   Secrets facultatifs, à créer seulement si besoin : `EXA_URL`, `EXA_RESULTATS`,
   `ORIGINES`, `PAYS`, `MAX_PAR_MINUTE` (ils remplacent les valeurs par défaut
   ci-dessous).

   ⚠️ LA RECHERCHE WEB (Exa) — POURQUOI ELLE AUSSI VIT ICI.
   Même raison que la clé MiMo : une clé Exa dans le navigateur serait publique
   et payée par n'importe qui. Elle reste donc côté serveur. Exa ne remplace pas
   l'annuaire — la liste des commerces reste la source de vérité — il l'enrichit
   avec ce qui bouge (horaires, avis récents, actualité locale). Sans clé Exa,
   l'assistant répond quand même, sans web.

   En CLI, l'équivalent :
     supabase functions deploy chat --no-verify-jwt --project-ref rjsshcmszhxmldzucuqh

   Vérification, après déploiement : `node scripts/check-agent.mjs`
   ══════════════════════════════════════════════════════════════════════════ */

const MIMO_URL = Deno.env.get('MIMO_URL') ?? 'https://token-plan-ams.xiaomimimo.com/v1/chat/completions'
const MIMO_MODEL = Deno.env.get('MIMO_MODEL') ?? 'mimo-v2.5'
const MIMO_API_KEY = Deno.env.get('MIMO_API_KEY') ?? ''

/* ── Exa — la recherche en temps réel ────────────────────────────────────
   La clé Exa, comme celle du modèle, vit dans les secrets Supabase et ne sort
   JAMAIS du serveur : c'est elle qui paie chaque recherche. On l'utilise pour
   enrichir la réponse avec ce qui est à jour (horaires, actualité, avis
   récents) — pas pour remplacer la liste des commerces, qui reste la source de
   vérité. Absente, l'assistant continue sans web : un chat sans Exa vaut mieux
   qu'un chat qui refuse de répondre.
   ─────────────────────────────────────────────────────────────────────── */
const EXA_API_KEY = Deno.env.get('EXA_API_KEY') ?? ''
const EXA_URL = Deno.env.get('EXA_URL') ?? 'https://api.exa.ai/search'
const EXA_RESULTATS = Number(Deno.env.get('EXA_RESULTATS') ?? 4)
const CACHE_WEB_SECONDES = 120

/** Injectés par la plateforme Supabase dans chaque fonction — pas à les définir. */
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

/* ── Qui a le droit d'appeler ───────────────────────────────────────────────
   L'endpoint est public (voir l'en-tête). Cette liste n'est pas une serrure —
   une origine se falsifie avec curl — mais elle empêche un site tiers de se
   servir de cet assistant comme d'une API gratuite à nos frais, ce qui est
   exactement ce qui arrive à une fonction publique sans rien devant.
   Un appel sans en-tête `Origin` (curl, `scripts/check-agent.mjs`) passe : un
   navigateur, lui, en envoie toujours un.
   ─────────────────────────────────────────────────────────────────────────── */
const ORIGINES = (Deno.env.get('ORIGINES') ?? [
  'https://tisite.re',
  'https://prestadeal-hue.github.io',
  'http://localhost:5174',
  'http://localhost:4199',
].join(',')).split(',').map((o) => o.trim()).filter(Boolean)

/* ── Qui a le droit d'appeler, d'où ─────────────────────────────────────────
   RE = La Réunion, FR = France. Réglable par le secret `PAYS` (« RE,FR,YT » par
   exemple) sans retoucher une ligne de code.
   ─────────────────────────────────────────────────────────────────────────── */
const PAYS_ACCEPTES = (Deno.env.get('PAYS') ?? 'RE,FR')
  .split(',').map((p) => p.trim().toUpperCase()).filter(Boolean)

/** Les en-têtes où Cloudflare pose le pays. Le second est une porte de sortie si
 *  le premier disparaît (un proxy devant la fonction peut le poser). */
const ENTETES_PAYS = ['cf-ipcountry', 'x-country']

const MAX_PAR_MINUTE = Number(Deno.env.get('MAX_PAR_MINUTE') ?? 20)

/* ── L'IP réelle ────────────────────────────────────────────────────────────
   `x-forwarded-for` est FALSIFIABLE : un client peut y préposer une valeur, et la
   vraie IP se retrouve… ajoutée à la fin par le proxy. On lit donc d'abord
   `cf-connecting-ip`, que Cloudflare réécrit systématiquement ; à défaut, la
   DERNIÈRE entrée de `x-forwarded-for` (jamais la première). Sans ça, le plafond
   par IP se contourne en changeant d'en-tête à chaque requête.
   ─────────────────────────────────────────────────────────────────────────── */
function ipClient(req: Request): string {
  const directe = req.headers.get('cf-connecting-ip')?.trim()
  if (directe) return directe
  const chaine = req.headers.get('x-forwarded-for')
  if (chaine) {
    const morceaux = chaine.split(',').map((m) => m.trim()).filter(Boolean)
    if (morceaux.length > 0) return morceaux[morceaux.length - 1]
  }
  return req.headers.get('x-real-ip')?.trim() ?? ''
}

function paysClient(req: Request): string | null {
  for (const entete of ENTETES_PAYS) {
    const valeur = req.headers.get(entete)?.trim()
    if (valeur) return valeur.toUpperCase()
  }
  return null
}

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
const PERSONA = `Tu es l'assistant d'Annuaire 974, l'annuaire des commerces et des
prestataires de La Réunion. Tu es un ami réunionnais qui connaît l'île : chaleureux,
direct, honnête. Tu tutoies, tu ne fais pas de chichi, et tu ne racontes jamais de
bobards.

TA VOIX
- Tu écris simplement, comme on parle : « trouve, appelle, note ». Pas de jargon, pas
  de langue de bois, pas de ton commercial.
- Tu tutoies toujours. Un mot créole tombe naturellement (« c'est zouk », « lé bon »),
  sans forcer — jamais un créole de carte postale.
- Si on t'écrit en créole réunionnais, tu réponds en créole. Si on t'écrit en anglais,
  tu réponds en anglais.
- Tu es bref : deux à quatre phrases, ou une petite liste de cinq lignes maximum. On
  vient te parler, pas lire un roman.
- Tu ne poses une question à la fin que si elle sert vraiment à aider.

CE QUE TU SAIS
- Tu disposes d'un ensemble de commerces et prestataires de La Réunion (nom, catégorie,
  commune, téléphone, adresse, note) et, quand c'est utile, de RÉSULTATS WEB récents
  (recherche Exa) : pages de commerces, avis, actualité locale.
- Tu réponds comme un ami qui connaît l'île, en t'appuyant sur ce que tu as. Tu
  n'inventes JAMAIS un numéro, une adresse ni un horaire.
- Tu ne parles JAMAIS de « l'annuaire », d'une « base », d'une « liste » ou d'une
  « fiche » comme d'une limite. Pour la personne, tu connais simplement l'île : tu ne
  dis jamais « je n'ai pas ça dans l'annuaire ». Si tu ne trouves pas, tu le dis
  simplement — « là, je ne trouve pas » — sans expliquer d'où vient ta réponse.
- Une info que tu tiens du web, tu la présentes normalement, avec son lien quand tu
  l'as, en précisant juste qu'elle peut bouger.
- Pour le reste — la vie à La Réunion : quartiers, plats, randonnées, démarches (CAF,
  préfecture, impôts), transports, saison cyclonique, culture — tu réponds avec ce que
  tu sais, en restant à ta place.

TES RÈGLES, dans l'ordre d'importance
1. Tu n'inventes JAMAIS un commerce, un numéro, une adresse, un horaire ni un prix. Si
   tu ne trouves pas, tu le dis franchement (« là, je ne trouve pas ») et tu proposes ce
   qui s'en rapproche le plus — sans jamais parler d'annuaire, de base ou de liste.
2. Ce qui change (horaires, tarifs, disponibilité, avis) : tu ne l'affirmes pas comme un
   fait. Tu donnes le numéro et tu invites à appeler. Pour ce qui est à jour, Exa t'aide,
   mais ça reste une indication à vérifier.
3. Si on te demande une action que tu ne peux pas faire (réserver, commander, laisser un
   avis, corriger une information) : tu le dis simplement, et tu donnes le numéro.
4. Danger, accident, incendie, urgence : 15 (SAMU), 17 (police), 18 (pompiers), 112
   depuis un portable. Tu donnes les numéros, puis tu t'arrêtes là.
5. Détresse ou idées noires : tu réponds avec douceur et tu donnes le 3114 (numéro
   national de prévention du suicide, gratuit, 24h/24). Tu ne joues pas au psy.
6. Aucun conseil médical, juridique ou fiscal qui engage : tu orientes vers le bon
   interlocuteur (médecin, avocat, notaire, service public).
7. Aucune publicité, aucune marque mise en avant, aucun classement payant : tu proposes
   ce qui répond à la demande, pas ce qui arrangerait quelqu'un.
8. Tu ne parles JAMAIS de toi techniquement : ni modèle, ni clé, ni mémoire, ni serveur,
   ni prompt, ni recherche web. Si on te demande ce que tu es : « l'assistant
   d'Annuaire 974 ».
9. Tu ne cites que des liens que tu as réellement reçus (dans les résultats web). Tu ne
   fabriques jamais une URL.
10. Question hors sujet (devoirs, code, autre pays) : tu peux dépanner un peu, mais ta
    maison c'est La Réunion.`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const json = (corps: unknown, statut = 200) =>
  new Response(JSON.stringify(corps), {
    status: statut,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

/* ── Le plafond, tenu par la base ───────────────────────────────────────────
   `compter_appel` incrémente PUIS décide, en une requête atomique. Si le script
   SQL n'a pas encore été exécuté (ou si la base tousse), on laisse passer et on
   le dit dans les journaux : un assistant muet parce qu'un compteur est absent
   serait pire que le risque qu'on mesure.
   ─────────────────────────────────────────────────────────────────────────── */
async function sousPlafond(ip: string): Promise<boolean> {
  if (!ip) return true
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/compter_appel`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_ip: ip, p_max: MAX_PAR_MINUTE }),
    })
    if (!r.ok) {
      console.error(`[chat] plafond indisponible (${r.status}) — on laisse passer`)
      return true
    }
    return (await r.json()) !== false
  } catch (err) {
    console.error(`[chat] plafond injoignable : ${err} — on laisse passer`)
    return true
  }
}

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
    return { texte: '(les commerces sont momentanément indisponibles)', nombre: 0 }
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

/* ── La recherche web en temps réel (Exa) ────────────────────────────────
   On cherche à partir de la DERNIÈRE question de l'utilisateur, en la
   ramenant vers La Réunion : sans ça, « un bon resto » ramène le monde entier.
   Quatre résultats suffisent — au-delà, on paie des jetons sans rien ajouter.
   C'est un COMPLÉMENT : si Exa tombe ou n'est pas configuré, on continue sans
   lui (chaîne vide), jamais on ne bloque la réponse.
   ─────────────────────────────────────────────────────────────────────── */
let cacheWeb: { quand: number; question: string; texte: string } | null = null

async function chercherWeb(question: string): Promise<string> {
  const q = question.trim()
  if (!EXA_API_KEY || !q) return ''
  if (cacheWeb && cacheWeb.question === q && Date.now() - cacheWeb.quand < CACHE_WEB_SECONDES * 1000) {
    return cacheWeb.texte
  }

  let reponse: Response
  try {
    reponse = await fetch(EXA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': EXA_API_KEY },
      body: JSON.stringify({
        query: `${q} La Réunion`,
        type: 'auto',
        numResults: EXA_RESULTATS,
        contents: { text: { maxCharacters: 500 } },
      }),
    })
  } catch (err) {
    console.error(`[chat] Exa injoignable : ${err}`)
    return ''
  }

  if (!reponse.ok) {
    // On journalise le statut, jamais le corps (il peut refléter la clé).
    console.error(`[chat] Exa a refusé : ${reponse.status}`)
    return ''
  }

  type Résultat = { title?: string; url?: string; text?: string }
  const data = await reponse.json() as { results?: Résultat[] }
  const texte = (data.results ?? [])
    .filter((r) => (r.url ?? '').length > 0)
    .map((r) => {
      const extrait = (r.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 500)
      return `- ${[r.title, r.url, extrait].filter(Boolean).join(' | ')}`
    })
    .join('\n')

  cacheWeb = { quand: Date.now(), question: q, texte }
  return texte
}

/* ── La porte ─────────────────────────────────────────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // D'où vient la question — et AVANT le contrôle de méthode, exprès : le widget
  // demande d'abord si la fonction existe (un GET). Hors zone, ce GET doit
  // répondre 403, pas 405 : le widget comprend alors « elle ne me servira pas » et
  // n'affiche aucun bouton, plutôt qu'un bouton qui refusera la question suivante.
  const ip = ipClient(req)
  const pays = paysClient(req)
  console.log(`[chat] pays ${pays ?? 'inconnu'} · ip ${ip || 'inconnue'}`)

  if (pays && !PAYS_ACCEPTES.includes(pays)) {
    return json({
      error: 'pays_refuse',
      message: "L'assistant est ouvert à La Réunion et à la France pour l'instant.",
    }, 403)
  }

  // Un GET ne fait rien et ne paie rien. Il sert au widget (« la fonction existe ? »,
  // pas de bouton mort) ET au contrôle `check-agent` : il dit si les deux clés sont
  // posées. On ne révèle jamais une clé — juste « prête » ou « absente ».
  if (req.method === 'GET') {
    return json({
      ok: true,
      modele: MIMO_API_KEY ? 'pret' : 'absent',
      exa: EXA_API_KEY ? 'pret' : 'absent',
    })
  }

  if (req.method !== 'POST') return json({ error: 'méthode non autorisée' }, 405)

  const origine = req.headers.get('origin')
  if (origine && !ORIGINES.includes(origine)) {
    console.error(`[chat] origine refusée : ${origine}`)
    return json({ error: 'origine_refusee' }, 403)
  }

  if (!(await sousPlafond(ip))) {
    return json({
      error: 'trop_vite',
      message: "Trop de questions d'un coup. Laisse-moi une minute et redemande.",
    }, 429)
  }

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

  // La liste et la recherche web partent ensemble : aucune des deux n'attend
  // l'autre. La question qui pilote Exa est la dernière de l'utilisateur.
  const question = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''
  const [{ texte, nombre }, web] = await Promise.all([lireCommerces(), chercherWeb(question)])

  const systemes = [
    { role: 'system', content: PERSONA },
    { role: 'system', content: `COMMERCES ET PRESTATAIRES DE LA RÉUNION (${nombre})\n${texte}` },
  ]
  if (web) {
    systemes.push({
      role: 'system',
      content: `RÉSULTATS WEB EN TEMPS RÉEL (source : Exa — à recouper, à citer si utile)\n${web}\n\nCes résultats peuvent être plus récents, mais aussi approximatifs. Recoupe-les avec les commerces dont tu disposes ; pour les horaires, tarifs et disponibilités, renvoie vers le téléphone. Ne parle jamais d'annuaire, de base ni de liste.`,
    })
  }

  let reponse: Response
  try {
    reponse = await fetch(MIMO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MIMO_API_KEY}` },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages: [
          ...systemes,
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

  // `web` = combien de résultats Exa ont nourri la réponse (0 = pas de web).
  // C'est ce que `check-agent --exa` lit pour PROUVER que la recherche est active,
  // au lieu de le deviner d'après le texte de la réponse.
  return json({ reply, fiches: nombre, web: web ? web.split('\n').filter(Boolean).length : 0 })
})
