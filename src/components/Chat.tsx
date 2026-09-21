import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AGENT_URL, SUPABASE_ANON_KEY, hasAgent } from '../lib/config'
import { IconPlus, IconSend, IconSparkles } from './Icons'

/**
 * Le chat d'Annuaire 974 — désormais TOUT le site.
 *
 * Mise en page « ChatGPT » : le fil occupe la hauteur disponible et défile tout
 * seul, la zone de saisie reste COLLÉE EN BAS. À l'ouverture, l'accueil est
 * centré ; dès le premier message, la conversation prend la place.
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
      noeuds.push(
        lien ? <a key={k} href={lien[2]} target="_blank" rel="noreferrer">{lien[1]}</a> : tok,
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

export function Chat() {
  const dispo = useAgentDisponible()
  const [messages, setMessages] = useState<Message[]>([])
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [souci, setSouci] = useState<string | null>(null)
  const champ = useRef<HTMLTextAreaElement>(null)
  const fil = useRef<HTMLDivElement>(null)
  /* Compteur de conversation : « Nouvelle conversation » l'incrémente, ce qui
     invalide toute réponse encore en vol (elle ne doit pas repeupler un fil vidé). */
  const conversation = useRef(0)

  const vide = messages.length === 0
  const indisponible = !hasAgent || dispo === 'absente'

  /* La zone de saisie grandit avec le texte, jusqu'à un plafond. */
  useEffect(() => {
    const t = champ.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, 200)}px`
  }, [saisie])

  /* À l'arrivée d'un message, on suit la conversation vers le bas. */
  useEffect(() => {
    const f = fil.current
    if (!f) return
    f.scrollTo({ top: f.scrollHeight, behavior: 'smooth' })
  }, [messages, enCours, souci])

  /** Repart à zéro : le fil se vide, l'accueil revient. */
  function nouvelle() {
    conversation.current += 1
    setMessages([])
    setSaisie('')
    setSouci(null)
    setEnCours(false)
  }

  async function envoyer(texte: string) {
    const question = texte.trim()
    if (!question || enCours || indisponible) return
    const cid = conversation.current
    const suite: Message[] = [...messages, { role: 'user', content: question }]
    setMessages(suite)
    setSaisie('')
    setSouci(null)
    setEnCours(true)
    try {
      const reponse = await fetch(AGENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // La clé `anon` est publique par conception : elle sert de JWT à la
          // fonction, elle n'autorise rien de plus que ce que RLS autorise déjà.
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: suite }),
      })
      const data = await reponse.json().catch(() => ({} as { reply?: string; message?: string }))
      if (cid !== conversation.current) return // une « nouvelle conversation » est passée
      if (!reponse.ok || !data.reply) {
        setSouci(
          data.message
            ?? (reponse.status === 404
              ? "L'assistant n'est pas encore en ligne sur ce site."
              : "L'assistant ne répond pas pour l'instant. Réessaie dans un moment."),
        )
        return
      }
      setMessages([...suite, { role: 'assistant', content: data.reply }])
    } catch {
      if (cid !== conversation.current) return
      setSouci('Pas de connexion — réessaie dans un instant.')
    } finally {
      if (cid === conversation.current) setEnCours(false)
    }
  }

  function surTouche(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Entrée envoie ; Maj+Entrée fait un retour à la ligne. On laisse passer
    // l'IME (clavier créole/chinois…) pendant la composition.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void envoyer(saisie)
    }
  }

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

      <div className={vide ? 'chat-fil vide' : 'chat-fil'} ref={fil} aria-live="polite">
        {vide ? (
          <div className="chat-accueil">
            <span className="kicker">Assistant Annuaire 974</span>
            <h1 className="chat-titre">{ACCUEIL}</h1>
            {indisponible ? (
              <p className="chat-note" role="status">
                L'assistant n'est pas joignable pour le moment. Reviens dans un petit moment.
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
                <div key={i} className="agent-lui">
                  <Rendu texte={m.content} />
                </div>
              ),
            )}

            {enCours && (
              <span className="agent-points" role="status" aria-label="L'assistant écrit">
                <span />
                <span />
                <span />
              </span>
            )}
            {souci && <p className="agent-note" role="status">{souci}</p>}
          </>
        )}
      </div>

      <form
        className="chat-composer"
        onSubmit={(e) => { e.preventDefault(); void envoyer(saisie) }}
      >
        <span className="chat-composer-ico" aria-hidden>
          <IconSparkles size={20} />
        </span>
        <textarea
          ref={champ}
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={surTouche}
          placeholder="Écris ta question… un resto, un artisan, un conseil sur l'île"
          aria-label="Ta question à l'assistant"
          rows={1}
          maxLength={1500}
          disabled={indisponible}
        />
        <button
          className="btn btn-gold chat-envoyer"
          type="submit"
          disabled={enCours || indisponible || saisie.trim().length === 0}
          aria-label="Envoyer"
        >
          <IconSend size={18} />
        </button>
      </form>
    </div>
  )
}
