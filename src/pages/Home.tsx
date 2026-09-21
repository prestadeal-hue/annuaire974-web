import { Chat } from '../components/Chat'

/**
 * La page d'accueil EST le chat — il n'y a plus d'annuaire classique :
 * ni catégories, ni listes de commerces. L'utilisateur parle, l'assistant répond.
 *
 * `online` vient d'App : le chat doit savoir se taire proprement hors-ligne
 * plutôt que de laisser écrire une question qui ne partira pas.
 */
export function Home({ online }: { online: boolean }) {
  return <Chat online={online} />
}
