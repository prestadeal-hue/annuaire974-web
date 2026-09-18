import { useEffect, useRef, useState } from 'react'
import { AGENT_URL, SUPABASE_ANON_KEY, hasAgent } from '../lib/config'
import { IconChat, IconX } from './Icons'

/**
 * L'assistant de l'annuaire — un fil de discussion, en bas à droite.
 *
 * Il ne connaît AUCUNE clé : il appelle une Edge Function Supabase
 * (`supabase/functions/chat/`), qui garde la clé du modèle côté serveur. C'est la
 * seule raison d'exister de cette fonction : toute variable `VITE_*` utilisée par le
 * code se retrouve dans le paquet JavaScript public (vérifié : la clé `anon` de
 * Supabase y est, et c'est normal — mais une clé de modèle, elle, se paie).
 *
 * Quand il n'y a pas de Supabase configuré (mode démonstration), le bouton n'existe
 * pas : un assistant qui ne peut rien chercher serait un mensonge de plus.
 */

type Message = { role: 'user' | 'assistant'; content: string }

const ACCUEIL = "Salut ! Dis-moi ce que tu cherches dans le 974 — un plombier, un resto, un coiffeur… Ou pose-moi une question sur l'île."
const EXEMPLES = ['Un plombier à Saint-Denis', 'Les restos vers Saint-Pierre', "C'est quand la saison cyclonique ?"]

/* ── Le contrôle de disponibilité ────────────────────────────────────────────
   Un bouton qui n'aboutit à rien est pire que pas de bouton : c'est l'icône
   noire, en pire. On demande donc à la fonction si elle EXISTE — un GET, jamais
   une inférence, donc jamais un centime : non déployée, elle répond 404 sans
   exécuter une ligne de son code.

   ⚠️ La sonde ne porte AUCUN en-tête, et ce n'est pas un détail : avec
   `apikey`, la requête déclenche un contrôle CORS préalable, et quand la fonction
   n'existe pas ce contrôle échoue — le navigateur lève alors une erreur réseau au
   lieu de rendre le 404. Résultat mesuré : la sonde ne concluait rien, le bouton
   restait affiché, et il était mort (constaté en production, pas en théorie).
   Sans en-tête, la requête est dite « simple » : pas de contrôle préalable, et le
   404 arrive lisible. Déployée, la fonction répond 401 (il manque l'en-tête) — et
   pour notre question, 401 = « là ».

   Trois états, parce qu'il y en a trois dans la vraie vie :
     · absente (404)     → rien à l'écran, jamais de bouton mort
     · présente          → le bouton, et la conversation fait le reste
     · incertaine        → attente : rien (évite un clignotement) ;
                           échec réseau : le bouton s'affiche, et le panneau dira
                           « pas de connexion » — un bouton qui parle reste utile.
   ────────────────────────────────────────────────────────────────────────── */
type Disponibilite = 'attente' | 'presente' | 'absente' | 'incertaine'

function useAgentDisponible(): Disponibilite {
  const [etat, setEtat] = useState<Disponibilite>('attente')
  useEffect(() => {
    if (!hasAgent) return
    let vivant = true
    fetch(AGENT_URL, { method: 'GET' })
      .then((r) => { if (vivant) setEtat(r.status === 404 ? 'absente' : 'presente') })
      .catch(() => { if (vivant) setEtat('incertaine') })
    return () => { vivant = false }
  }, [])
  return etat
}

export function AgentChat() {
  const [ouvert, setOuvert] = useState(false)
  const dispo = useAgentDisponible()
  const [messages, setMessages] = useState<Message[]>([])
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [souci, setSouci] = useState<string | null>(null)
  const fil = useRef<HTMLDivElement>(null)
  const champ = useRef<HTMLInputElement>(null)

  useEffect(() => { if (ouvert) champ.current?.focus() }, [ouvert])
  useEffect(() => { fil.current?.scrollTo({ top: fil.current.scrollHeight }) }, [messages, enCours, souci])
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false) }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [])

  if (!hasAgent || dispo === 'attente' || dispo === 'absente') return null

  async function envoyer(texte: string) {
    const question = texte.trim()
    if (!question || enCours) return
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
      setSouci('Pas de connexion — réessaie dans un instant.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <>
      <button
        className={ouvert ? 'agent-fab agent-fab-ouvert' : 'agent-fab'}
        onClick={() => setOuvert((o) => !o)}
        aria-label={ouvert ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        aria-expanded={ouvert}
      >
        <IconChat size={24} />
      </button>

      {ouvert && (
        <section className="agent-panneau" role="dialog" aria-label="Assistant de l'annuaire">
          <header className="agent-tete">
            <div>
              <strong>L'assistant</strong>
              <span className="agent-sous"> Annuaire 974</span>
            </div>
            <button className="icon-btn" onClick={() => setOuvert(false)} aria-label="Fermer">
              <IconX size={20} />
            </button>
          </header>

          <div className="agent-fil" ref={fil}>
            {messages.length === 0 && (
              <div className="agent-accueil">
                <p>{ACCUEIL}</p>
                <div className="agent-exemples">
                  {EXEMPLES.map((ex) => (
                    <button key={ex} className="chip" onClick={() => void envoyer(ex)}>{ex}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <p key={i} className={m.role === 'user' ? 'agent-moi' : 'agent-lui'}>{m.content}</p>
            ))}

            {enCours && <p className="agent-lui agent-attente" aria-live="polite">un instant…</p>}
            {souci && <p className="agent-note" role="status">{souci}</p>}
          </div>

          <form
            className="agent-form"
            onSubmit={(e) => { e.preventDefault(); void envoyer(saisie) }}
          >
            <input
              ref={champ}
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Écris ta question…"
              aria-label="Ta question"
              maxLength={500}
            />
            <button className="btn btn-coral btn-sm" type="submit" disabled={enCours || saisie.trim().length === 0}>
              Envoyer
            </button>
          </form>
        </section>
      )}
    </>
  )
}
