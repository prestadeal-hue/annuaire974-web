/* ══════════════════════════════════════════════════════════════════════════
   Lire la réponse de l'assistant pendant qu'elle s'écrit.

   Le site n'attend plus la fin : la fonction Edge lui envoie la réponse au fur
   et à mesure (« SSE », le format le plus simple qui existe — chaque morceau
   est une ligne `data: {...}` suivie d'une ligne vide).

   POURQUOI CE FICHIER EXISTE SÉPARÉMENT.
   Le découpage d'un flux est la partie qui casse en silence : un paquet réseau
   peut couper un morceau en deux, deux morceaux peuvent arriver collés, et un
   « data: » incomplet ne doit surtout pas être interprété. Enfermé dans un
   composant React, ce code ne se testerait qu'à l'œil. Ici, il se teste :
   `npm test` lui envoie des flux découpés n'importe comment.

   Il ne connaît ni React, ni le réseau, ni Supabase : il prend un flux
   d'octets et rend des événements.
   ────────────────────────────────────────────────────────────────────────── */

export type EvenementFlux =
  /** Un morceau de la réponse. À concaténer, jamais à remplacer. */
  | { type: 'delta'; text: string }
  /** La réponse est finie. `web` = combien de résultats Exa l'ont nourrie. */
  | { type: 'fin'; fiches?: number; web?: number }
  /** Le serveur s'est arrêté en route : ce qui est déjà reçu reste valable. */
  | { type: 'erreur'; message?: string }

/** Transforme une ligne SSE en événement, ou `null` si elle ne dit rien. */
function evenement(ligne: string): EvenementFlux | null {
  const brut = ligne.trim()
  // `event:`, `id:`, `retry:`, un commentaire `: keep-alive`… tout est ignoré :
  // le protocole en prévoit plus qu'on n'en utilise, et un inconnu ne doit pas
  // faire tomber le reste du flux.
  if (!brut.startsWith('data:')) return null

  const charge = brut.slice(5).trim()
  if (!charge || charge === '[DONE]') return null

  let brutJson: unknown
  try {
    brutJson = JSON.parse(charge)
  } catch {
    // Une ligne tronquée ou un texte parasite : on la saute. Jeter tout le flux
    // parce qu'un morceau est illisible serait la pire des réactions — la
    // réponse est peut-être déjà à moitié arrivée.
    return null
  }

  const evt = brutJson as { type?: unknown; text?: unknown; message?: unknown; fiches?: unknown; web?: unknown }
  if (evt.type === 'delta' && typeof evt.text === 'string') return { type: 'delta', text: evt.text }
  if (evt.type === 'erreur') {
    return { type: 'erreur', message: typeof evt.message === 'string' ? evt.message : undefined }
  }
  if (evt.type === 'fin') {
    return {
      type: 'fin',
      fiches: typeof evt.fiches === 'number' ? evt.fiches : undefined,
      web: typeof evt.web === 'number' ? evt.web : undefined,
    }
  }
  return null
}

/**
 * Rend les événements du flux, dans l'ordre, tels qu'ils arrivent.
 *
 * Le lecteur est TOUJOURS relâché, y compris si l'appelant s'arrête en cours de
 * route (le visiteur a cliqué sur « Nouvelle conversation ») : sans ça, la
 * connexion reste ouverte à gaspiller des jetons que personne ne lit.
 */
export async function* lireFlux(flux: ReadableStream<Uint8Array>): AsyncGenerator<EvenementFlux> {
  const lecteur = flux.getReader()
  const decodeur = new TextDecoder()
  let tampon = ''

  try {
    for (;;) {
      const { done, value } = await lecteur.read()
      if (done) break

      // `stream: true` : un caractère accentué peut être coupé en deux octets
      // entre deux paquets — sans ça, « Réunion » arrive en « R�union ».
      tampon += decodeur.decode(value, { stream: true })

      const lignes = tampon.split('\n')
      // Le dernier morceau est presque toujours incomplet : on le garde pour le
      // paquet suivant au lieu de le lire de travers.
      tampon = lignes.pop() ?? ''

      for (const ligne of lignes) {
        const evt = evenement(ligne)
        if (evt) yield evt
      }
    }

    // Le flux s'est terminé sans nouvelle ligne finale : le dernier morceau est
    // un événement complet, il ne faut pas le perdre.
    const dernier = evenement(tampon)
    if (dernier) yield dernier
  } finally {
    // `cancel` relâche la connexion ; si elle est déjà fermée, l'erreur ne nous
    // apprend rien et ne doit pas remonter au visiteur.
    await lecteur.cancel().catch(() => {})
  }
}
