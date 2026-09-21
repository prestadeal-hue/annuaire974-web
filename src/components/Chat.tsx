import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AGENT_URL, SUPABASE_ANON_KEY, hasAgent } from '../lib/config'
import { lireFlux } from '../lib/flux'
import { IconPlus, IconSend, IconSparkles } from './Icons'

/**
 * Le chat d'Annuaire 974 — désormais TOUT le site.
 *
 * Mise en page « ChatGPT » : le fil occupe la hauteur disponible et défile tout
 * seul, la zone de saisie reste COLLÉE EN BAS. À l'ouverture, l'accueil est
 * centré ; dès le premier message, la conversation prend la place.
 *
 * La réponse s'affiche PENDANT qu'elle s'écrit (voir `src/lib/flux.ts`) : le
 * visiteur voit l'assistant travailler au lieu d'attendre une bulle vide. Si la
 * fonction déployée ne sait pas encore streamer, le chemin JSON d'avant prend le
 * relais sans que rien ne casse — un site ne doit jamais dépendre d'un
 * déploiement qui n'a pas encore eu lieu.
 *
 * Il ne connaît AUCUNE clé : il appelle une Edge Function Supabase
 * (`supabase/functions/chat/`), qui garde côté serveur la clé du modèle (MiMo)
 * ET la clé de recherche (Exa). C'est la seule raison d'exister de cette
 * fonction : toute variable `VITE_*` utilisée par le code se retrouve dans le
 * paquet JavaScript public — une clé de modèle ou de recherche, elle, se paie.
 */

type Message = { role: 'user' | 'assistant'; content: string }

/** Le message d'accueil, mot pour mot celui validé : chaleureux, local, honnête. */
const ACCUEIL =
  "Bonjour ! Je suis l'assistant Annuaire 974. Posez-moi une question sur les commerces de La Réunion."

const EXEMPLES = [
  'Un plombier à Saint-Denis',
  'Les meilleurs restos créoles vers Saint-Pierre',
  "C'est quand la saison cyclonique ?",
  'Une pharmacie ouverte le dimanche au Tampon',
]

/** Combien de messages partent au serveur. Au-delà, la fonction coupe d'elle-même
 *  (`MAX_MESSAGES` côté Edge Function) : autant ne pas envoyer ce qui sera jeté. */
const MESSAGES_ENVOYES = 10

/* ── Rendu markdown léger ────────────────────────────────────────────────────
   Le modèle répond en markdown (**gras**, listes « - », `code`, liens). Sans
   traitement, l'utilisateur lit les `**` en clair : on convertit donc en nœuds
   React — jamais `dangerouslySetInnerHTML`, donc rien d'injectable ne passe.
   ────────────────────────────────────────────────────────────────────────── */

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\))/g

function renduEnLigne(texte: string, cle: string): ReactNode[] {
  const noeuds: ReactNode[] = []
  let dernier = 0
  let m: RegExpExecArray | null
  let i = 0
  INLINE.lastIndex = 0
  while ((m = INLINE.exec(texte))) {
    if (m.index > dernier) noeuds.push(texte.slice(dernier, m.index))
    const tok = m[0]
    const k = `${cle}-${i++}`
    if (tok.startsWith('**')) noeuds.push(<strong key={k}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('`')) noeuds.push(<code key={k}>{tok.slice(1, -1)}</code>)
    else if (tok.startsWith('[')) {
      const lien = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)
      // Un lien que le modèle aurait fabriqué (jamais reçu dans les résultats
      // web) reste du texte : on n'ouvre pas une porte qu'on n'a pas ouverte.
      const sur = /^https?:\/\//i.test(lien?.[2] ?? '') ? lien?.[2] : undefined
      noeuds.push(
        sur && lien
          ? <a key={k} href={sur} target="_blank" rel="noreferrer noopener">{lien[1]}</a>
          : tok,
      )
    } else noeuds.push(<em key={k}>{tok.slice(1, -1)}</em>)
    dernier = m.index + tok.length
  }
  if (dernier < texte.length) noeuds.push(texte.slice(dernier))
  return noeuds
}

function Rendu({ texte }: { texte: string }) {
  const lignes = texte.split('\n')
  const blocs: ReactNode[] = []
  let puces: string[] = []

  const viderPuces = (k: string) => {
    if (puces.length === 0) return
    blocs.push(
      <ul key={k}>
        {puces.map((p, i) => (
          <li key={i}>{renduEnLigne(p, `${k}-${i}`)}</li>
        ))}
      </ul>,
    )
    puces = []
  }

  lignes.forEach((ligne, i) => {
    const l = ligne.trimEnd()
    const puce = /^\s*[-*•]\s+(.*)$/.exec(l)
    if (puce) {
      puces.push(puce[1])
      return
    }
    viderPuces(`ul-${i}`)
    if (l.trim() === '') return
    blocs.push(
      <span key={`l-${i}`} className="agent-ligne">
        {renduEnLigne(l, `l-${i}`)}
      </span>,
    )
  })
  viderPuces('ul-fin')

  return <>{blocs}</>
}

/* ── Le contrôle de disponibilité ────────────────────────────────────────────
   Un bouton qui n'aboutit à rien est pire que pas de bouton. On demande donc à
   la fonction si elle EXISTE — un GET, jamais une inférence, donc jamais un
   centime : non déployée, elle répond 404 sans exécuter une ligne de son code.

   ⚠️ La sonde ne porte AUCUN en-tête : avec `apikey`, la requête déclenche un
   contrôle CORS préalable, et quand la fonction n'existe pas ce contrôle échoue
   — le navigateur lève une erreur réseau au lieu de rendre le 404. Sans en-tête,
   la requête est « simple » : le 404 arrive lisible. Déployée, la fonction répond
   soit 200 (version récente, qui se décrit), soit 401/405 — tout ça veut dire « là ».

   Deux réponses veulent dire « elle ne me servira pas » : 404 (pas déployée) et
   403 (déployée mais refuse ce visiteur — hors Réunion / France). Le GET part
   sans `Origin`, donc un 403 ici ne peut venir que du pays.
   ────────────────────────────────────────────────────────────────────────── */
type Disponibilite = 'attente' | 'presente' | 'absente' | 'incertaine'

function useAgentDisponible(): Disponibilite {
  const [etat, setEtat] = useState<Disponibilite>('attente')
  useEffect(() => {
    if (!hasAgent) return
    let vivant = true
    fetch(AGENT_URL, { method: 'GET' })
      .then((r) => { if (vivant) setEtat(r.status === 404 || r.status === 403 ? 'absente' : 'presente') })
      .catch(() => { if (vivant) setEtat('incertaine') })
    return () => { vivant = false }
  }, [])
  return etat
}

export function Chat({ online }: { online: boolean }) {
  const dispo = useAgentDisponible()
  const [messages, setMessages] = useState<Message[]>([])
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  /** La réponse en train d'arriver. Vide tant que le premier mot n'est pas là. */
  const [reponse, setReponse] = useState('')
  const [souci, setSouci] = useState<string | null>(null)
  const champ = useRef<HTMLTextAreaElement>(null)
  const fil = useRef<HTMLDivElement>(null)
  /* Compteur de conversation : « Nouvelle conversation » l'incrémente, ce qui
     invalide toute réponse encore en vol (elle ne doit pas repeupler un fil vidé). */
  const conversation = useRef(0)
  /** La requête en cours, pour pouvoir la couper net si le visiteur repart à zéro. */
  const enVol = useRef<AbortController | null>(null)
  /* Le visiteur a-t-il le fil « collé » en bas ? S'il remonte lire un message, on
     ne le ramène pas de force à chaque mot qui arrive. */
  const coller = useRef(true)
  /* Les morceaux sont regroupés par image d'écran : sur un téléphone, redessiner
     à chaque jeton fait bégayer le défilement — exactement ce qu'on veut éviter. */
  const aPeindre = useRef('')
  const image = useRef<number | null>(null)

  const vide = messages.length === 0
  const indisponible = !hasAgent || dispo === 'absente'
  const bloque = indisponible || !online

  /* La zone de saisie grandit avec le texte, jusqu'à un plafond. */
  useEffect(() => {
    const t = champ.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, 200)}px`
  }, [saisie])

  /* À l'arrivée d'un message, on suit la conversation vers le bas — mais
     seulement si le visiteur y était déjà. Pendant que la réponse s'écrit, on
     suit sans animation : une animation relancée à chaque mot donne un
     défilement qui bave. */
  useEffect(() => {
    const f = fil.current
    if (!f || !coller.current) return
    f.scrollTo({ top: f.scrollHeight, behavior: reponse ? 'auto' : 'smooth' })
  }, [messages, enCours, souci, reponse])

  useEffect(() => () => { if (image.current !== null) cancelAnimationFrame(image.current) }, [])

  function peindre(texte: string) {
    aPeindre.current = texte
    if (image.current !== null) return
    image.current = requestAnimationFrame(() => {
      image.current = null
      setReponse(aPeindre.current)
    })
  }

  /** Repart à zéro : le fil se vide, l'accueil revient, la réponse en vol est coupée. */
  function nouvelle() {
    conversation.current += 1
    enVol.current?.abort()
    enVol.current = null
    setMessages([])
    setSaisie('')
    setReponse('')
    setSouci(null)
    setEnCours(false)
    champ.current?.focus()
  }

  /**
   * `dejaAffiche` : la question est DÉJÀ dans le fil — c'est un « réessayer ».
   * On la renvoie sans la dupliquer, sinon le visiteur verrait deux fois sa
   * question après un échec réseau.
   */
  async function envoyer(texte: string, { dejaAffiche = false } = {}) {
    const question = texte.trim()
    if (!question || enCours || bloque) return

    const cid = conversation.current
    const suite: Message[] = dejaAffiche
      ? messages
      : [...messages, { role: 'user', content: question }]
    enVol.current?.abort()
    const controleur = new AbortController()
    enVol.current = controleur

    setMessages(suite)
    setSaisie('')
    setSouci(null)
    setReponse('')
    setEnCours(true)
    coller.current = true

    let texte2 = ''
    try {
      const r = await fetch(AGENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // La clé `anon` est publique par conception : elle sert de JWT à la
          // fonction, elle n'autorise rien de plus que ce que RLS autorise déjà.
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: suite.slice(-MESSAGES_ENVOYES), stream: true }),
        signal: controleur.signal,
      })

      const type = r.headers.get('content-type') ?? ''

      // Fonction d'avant le flux (réponse JSON d'un bloc), ou refus (403, 429,
      // 503…) : même traitement, un seul message lisible.
      if (!r.ok || !r.body || !type.includes('text/event-stream')) {
        const data = await r.json().catch(() => ({} as { reply?: string; message?: string }))
        if (cid !== conversation.current) return
        const reply = typeof data.reply === 'string' ? data.reply : ''
        if (!r.ok || !reply) {
          setSouci(
            data.message
              ?? (r.status === 404
                ? "L'assistant n'est pas encore en ligne sur ce site."
                : "L'assistant ne répond pas pour l'instant. Réessaie dans un moment."),
          )
          return
        }
        setMessages([...suite, { role: 'assistant', content: reply }])
        return
      }

      // Chemin du flux : la réponse s'affiche pendant qu'elle s'écrit.
      for await (const evt of lireFlux(r.body)) {
        if (cid !== conversation.current) return // une « nouvelle conversation » est passée
        if (evt.type === 'delta') {
          texte2 += evt.text
          peindre(texte2)
        } else if (evt.type === 'erreur') {
          setSouci(evt.message ?? "L'assistant s'est interrompu en route. Réessaie dans un instant.")
        }
      }

      if (cid !== conversation.current) return
      if (!texte2) {
        setSouci("L'assistant n'a pas pu répondre à l'instant. Réessaie dans un moment.")
        return
      }
      setMessages([...suite, { role: 'assistant', content: texte2 }])
    } catch (err) {
      if (cid !== conversation.current) return
      // Un abandon volontaire (« Nouvelle conversation ») n'est pas une panne.
      if (err instanceof DOMException && err.name === 'AbortError') return
      // La réponse s'est arrêtée en route : ce qui est arrivé reste à l'écran.
      // Le jeter pour afficher « erreur » serait effacer du travail déjà payé.
      if (texte2) setMessages([...suite, { role: 'assistant', content: texte2 }])
      setSouci('La réponse s\'est arrêtée en route — vérifie ta connexion, puis réessaie.')
    } finally {
      if (cid === conversation.current) {
        if (image.current !== null) { cancelAnimationFrame(image.current); image.current = null }
        setReponse('')
        setEnCours(false)
      }
    }
  }

  /** Le dernier échec a laissé une question sans réponse : on la renvoie telle quelle. */
  function reessayer() {
    const derniere = [...messages].reverse().find((m) => m.role === 'user')
    if (derniere) void envoyer(derniere.content, { dejaAffiche: true })
  }

  function surTouche(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Entrée envoie ; Maj+Entrée fait un retour à la ligne. On laisse passer
    // l'IME (clavier créole/chinois…) pendant la composition.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void envoyer(saisie)
    }
  }

  const derniereEstUtilisateur = messages[messages.length - 1]?.role === 'user'

  return (
    <div className="chat">
      {!vide && (
        <div className="chat-barre">
          <button className="chat-nouvelle" type="button" onClick={nouvelle}>
            <IconPlus size={16} />
            Nouvelle conversation
          </button>
        </div>
      )}

      <div
        className={vide ? 'chat-fil vide' : 'chat-fil'}
        ref={fil}
        aria-busy={enCours}
        onScroll={() => {
          const f = fil.current
          if (f) coller.current = f.scrollTop + f.clientHeight >= f.scrollHeight - 48
        }}
      >
        {vide ? (
          <div className="chat-accueil">
            <span className="kicker">Assistant Annuaire 974</span>
            <h1 className="chat-titre">{ACCUEIL}</h1>
            {bloque ? (
              <p className="chat-note" role="status">
                {indisponible
                  ? "L'assistant n'est pas joignable pour le moment. Reviens dans un petit moment."
                  : 'Pas de connexion — l\u2019assistant a besoin d\u2019internet pour chercher.'}
              </p>
            ) : (
              <div className="chat-exemples">
                {EXEMPLES.map((ex) => (
                  <button key={ex} type="button" className="chip" onClick={() => void envoyer(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <p key={i} className="agent-moi">{m.content}</p>
              ) : (
                // `aria-live` seulement sur une réponse TERMINÉE : pendant le
                // flux, chaque mot déclencherait une annonce chez les lecteurs
                // d'écran — un bavardage insupportable.
                <div key={i} className="agent-lui" aria-live={enCours ? 'off' : 'polite'}>
                  <Rendu texte={m.content} />
                </div>
              ),
            )}

            {/* Le premier mot n'est pas encore là : trois points qui respirent. */}
            {enCours && !reponse && (
              <span className="agent-points" role="status" aria-label="L'assistant écrit">
                <span />
                <span />
                <span />
              </span>
            )}

            {/* La réponse s'écrit : elle est ici, et pas encore dans le fil. */}
            {enCours && reponse && (
              <div className="agent-lui flux" aria-live="off">
                <Rendu texte={reponse} />
              </div>
            )}

            {souci && (
              <p className="agent-note" role="status">
                {souci}
                {derniereEstUtilisateur && !enCours && (
                  <>
                    {' '}
                    <button type="button" className="agent-relance" onClick={reessayer}>
                      Réessayer
                    </button>
                  </>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {/* Cliquer n'importe où dans la barre — l'icône, la marge — place le
          curseur DANS le champ. La barre est le champ : il ne s'en ouvre pas
          un second, et le clic ne change rien d'autre à l'écran. */}
      <form
        className="chat-composer"
        onSubmit={(e) => { e.preventDefault(); void envoyer(saisie) }}
        onMouseDown={(e) => {
          const cible = e.target as HTMLElement
          if (cible === e.currentTarget || cible.closest('.chat-composer-ico')) {
            e.preventDefault()
            champ.current?.focus()
          }
        }}
      >
        <span className="chat-composer-ico" aria-hidden>
          <IconSparkles size={20} />
        </span>
        <textarea
          ref={champ}
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={surTouche}
          placeholder={
            indisponible
              ? "L'assistant n'est pas joignable pour l'instant"
              : !online
                ? 'Hors-ligne — reconnecte-toi pour poser ta question'
                : "Écris ta question… un resto, un artisan, un conseil sur l'île"
          }
          aria-label="Ta question à l'assistant"
          rows={1}
          maxLength={1500}
          disabled={bloque}
        />
        <button
          className="btn btn-gold chat-envoyer"
          type="submit"
          disabled={enCours || bloque || saisie.trim().length === 0}
          aria-label="Envoyer"
        >
          <IconSend size={18} />
        </button>
      </form>
    </div>
  )
}
