import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Categorie, Commerce, Commune } from '../types'
import { getCategories, getCommerce, getCommerces, getFavoris, getCommunes, getMode, toggleFavori } from '../lib/api'
import { DEMO_CATEGORIES, DEMO_COMMERCES, DEMO_COMMUNES } from '../lib/demo'

/* ── Thème ────────────────────────────────────────────────────────── */

type Theme = 'light' | 'dark'

/* ── Contexte ─────────────────────────────────────────────────────── */

interface AppState {
  theme: Theme
  toggleTheme: () => void
  online: boolean
  categories: Categorie[]
  communes: Commune[]
  commerces: Commerce[]
  loading: boolean
  mode: string | null
  favoris: string[]
  isFav: (id: string) => boolean
  toggleFav: (id: string) => boolean
  refresh: () => void
  commerceById: (id: string) => Commerce | undefined
}

const Ctx = createContext<AppState | null>(null)

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp hors AppProvider')
  return v
}

export function AppProvider({ children }: { children: ReactNode }) {
  /* Thème : suit le système au premier lancement, puis mémoire */
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('annuaire974.theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('annuaire974.theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  /* En ligne / hors ligne */
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  /* Données */
  const [categories, setCategories] = useState<Categorie[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [commerces, setCommerces] = useState<Commerce[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setModeState] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    void (async () => {
      try {
        const [cats, coms, comms] = await Promise.all([getCategories(), getCommerces(), getCommunes()])
        if (!alive) return
        if (cats.length === 0 && coms.length === 0) {
          // Backend joignable mais base vide (pas encore seedée) → jeu de démo identifié
          setCategories(DEMO_CATEGORIES)
          setCommerces(DEMO_COMMERCES)
          setCommunes(DEMO_COMMUNES)
          setModeState('demo')
        } else {
          setCategories(cats)
          setCommerces(coms)
          setCommunes(comms)
          setModeState(getMode())
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [tick])

  /* Favoris */
  const [favoris, setFavoris] = useState<string[]>(() => getFavoris())
  const isFav = useCallback((id: string) => favoris.includes(id), [favoris])
  const toggleFav = useCallback((id: string) => {
    const on = toggleFavori(id)
    setFavoris(getFavoris())
    return on
  }, [])

  const commerceById = useCallback((id: string) => commerces.find((c) => c.id === id), [commerces])

  const value = useMemo<AppState>(
    () => ({
      theme,
      toggleTheme,
      online,
      categories,
      communes,
      commerces,
      loading,
      mode,
      favoris,
      isFav,
      toggleFav,
      refresh: () => setTick((t) => t + 1),
      commerceById,
    }),
    [theme, toggleTheme, online, categories, communes, commerces, loading, mode, favoris, isFav, toggleFav, commerceById],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export { getCommerce }
