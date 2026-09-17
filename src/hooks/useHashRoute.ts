import { useCallback, useEffect, useState } from 'react'

/**
 * Mini-routeur par hash — le bouton « retour » du téléphone fonctionne
 * comme sur une vraie app native.
 * Routes : #/ (accueil) · #/favoris · #/notifications · #/compte · #/commerce/:id
 */
export type Route =
  | { name: 'home' }
  | { name: 'favoris' }
  | { name: 'notifications' }
  | { name: 'compte' }
  | { name: 'commerce'; id: string }

function parse(hash: string): Route {
  const h = hash.replace(/^#/, '')
  const parts = h.split('/').filter(Boolean)
  if (parts[0] === 'favoris') return { name: 'favoris' }
  if (parts[0] === 'notifications') return { name: 'notifications' }
  if (parts[0] === 'compte') return { name: 'compte' }
  if (parts[0] === 'commerce' && parts[1]) {
    const id = decodeURIComponent(parts[1])
    if (id.length > 0) return { name: 'commerce', id }
  }
  return { name: 'home' }
}

export function useHashRoute(): { route: Route; navigate: (to: string) => void } {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))

  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((to: string) => {
    const target = to.startsWith('#') ? to : `#${to}`
    if (window.location.hash === target) {
      setRoute(parse(target))
      return
    }
    window.location.hash = target
  }, [])

  return { route, navigate }
}
