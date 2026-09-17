import type { Avis, Categorie, Commerce, Commune, DataMode, Notification } from '../types'
import { API_URL, SUPABASE_ANON_KEY, SUPABASE_URL, hasApi, hasSupabase } from './config'
import { DEMO_AVIS, DEMO_CATEGORIES, DEMO_COMMERCES, DEMO_COMMUNES, DEMO_NOTIFICATIONS } from './demo'

/* ── Mode de données ────────────────────────────────────────────────
   'api'      → API REST Node.js (Render) — prioritaire si configurée
   'supabase' → Supabase direct (PostgREST, clé publique) — repli auto
   Démo     → si les deux échouent (hors-ligne au premier chargement).
-------------------------------------------------------------------- */

let mode: DataMode | null = null
/** Dernière réponse valide mise en cache mémoire (session courante). */
const memo = new Map<string, unknown>()

export const getMode = (): DataMode | null => mode
export const setMode = (m: DataMode) => { mode = m }

const withTimeout = async (fetchi: () => Promise<Response>, ms = 6500) => {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetchi()
  } finally {
    clearTimeout(t)
  }
}

/* ── API REST ─────────────────────────────────────────────────────── */

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await withTimeout(() => fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  }))
  if (!res.ok) throw new Error(`API ${res.status}`)
  setMode('api')
  return (await res.json()) as T
}

/* ── Supabase direct (PostgREST) ──────────────────────────────────── */

async function sb<T>(path: string): Promise<T> {
  const res = await withTimeout(() => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  }))
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  setMode('supabase')
  return (await res.json()) as T
}

/** Écriture via PostgREST (avis, favoris). */
async function sbPost(table: string, body: unknown): Promise<void> {
  const res = await withTimeout(() => fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  }))
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
}

/* ── Repli automatique + mémo + démo ─────────────────────────────── */

async function hybrid<T>(key: string, viaApi: () => Promise<T>, viaSb: () => Promise<T>, demo: () => T): Promise<T> {
  const cached = memo.get(key)
  if (cached !== undefined) return cached as T

  if (hasApi) {
    try { return await viaApi() } catch { /* repli */ }
  }
  if (hasSupabase) {
    try {
      const data = await viaSb()
      memo.set(key, data)
      return data
    } catch { /* démo */ }
  }
  return demo()
}

/* ── Helpers Supabase ─────────────────────────────────────────────── */

function mapSbCommerce(row: Record<string, unknown>): Commerce {
  const cats = (row.commerce_categories as Array<{ categories: Categorie }> | null) ?? []
  return {
    ...(row as unknown as Commerce),
    communes: (row.communes as { nom: string } | null) ?? null,
    categories: cats.map((cc) => cc.categories).filter(Boolean),
    categorie: cats[0]?.categories ?? null,
  }
}

/* ── API publique ─────────────────────────────────────────────────── */

export interface CommerceFilters {
  q?: string
  categorie?: number
  commune?: number
}

export async function getCategories(): Promise<Categorie[]> {
  return hybrid<Categorie[]>(
    'categories',
    () => api('/api/categories'),
    () => sb('categories?select=*&order=nom.asc'),
    () => DEMO_CATEGORIES,
  )
}

export async function getCommunes(): Promise<Commune[]> {
  return hybrid<Commune[]>(
    'communes',
    () => api('/api/communes'),
    () => sb('communes?select=*&order=nom.asc'),
    () => DEMO_COMMUNES,
  )
}

export async function getCommerces(f: CommerceFilters = {}): Promise<Commerce[]> {
  const key = `commerces:${JSON.stringify(f)}`

  const viaSb = async (): Promise<Commerce[]> => {
    const params = new URLSearchParams({ select: '*' })
    if (f.categorie) {
      // Filtre par catégorie via la table de liaison
      const links = await sb<{ commerce_id: number }[]>(
        `commerce_categories?select=commerce_id&categorie_id=eq.${f.categorie}`,
      )
      const ids = links.map((l) => l.commerce_id)
      if (ids.length === 0) return []
      params.set('id', `in.(${ids.join(',')})`)
    }
    if (f.commune) params.set('commune_id', `eq.${f.commune}`)
    params.set('statut', 'eq.approuve')
    params.set('order', 'nom.asc')
    const rows = await sb<Record<string, unknown>[]>(`commerces?${params}`)
    // Catégories + communes en une passe (2 requêtes supplémentaires légères)
    const [cats, communes] = await Promise.all([
      sb<{ commerce_id: number; categories: Categorie }[]>(
        `commerce_categories?select=commerce_id,categories(id,nom,slug,icone)`,
      ),
      sb<{ id: number; nom: string }[]>(`communes?select=id,nom`),
    ])
    const communeById = new Map(communes.map((c) => [c.id, c.nom]))
    return rows.map((r) => {
      const c = mapSbCommerce({ ...r, communes: null, commerce_categories: undefined })
      c.categories = cats.filter((x) => x.commerce_id === r.id).map((x) => x.categories)
      c.categorie = c.categories?.[0] ?? null
      const nom = communeById.get(r.commune_id as number)
      c.communes = nom ? { nom } : null
      return c
    })
  }

  const viaApiFull = async (): Promise<Commerce[]> => {
    const params = new URLSearchParams()
    if (f.q) params.set('q', f.q)
    if (f.categorie) params.set('categorie', String(f.categorie))
    if (f.commune) params.set('commune', String(f.commune))
    const data = await api<Commerce[]>(`/api/commerces?${params}`)
    // Enrichissement notes/avis côté client si l'API ne le fait pas
    return data
  }

  let list = await hybrid<Commerce[]>(key, viaApiFull, viaSb, () =>
    filterDemo(f),
  )

  // Filtre texte local (le champ de recherche filtre aussi côté client,
  // utile en mode démo et si l'API ne gère pas `q`)
  if (f.q) {
    const q = f.q.toLowerCase()
    list = list.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        (c.communes?.nom ?? '').toLowerCase().includes(q),
    )
  }
  return list
}

export async function getCommerce(id: number): Promise<Commerce | null> {
  const key = `commerce:${id}`
  const viaSb = async (): Promise<Commerce | null> => {
    const rows = await sb<Record<string, unknown>[]>(
      `commerces?select=*,communes(nom),commerce_categories(categories(id,nom,slug,icone))&id=eq.${id}`,
    )
    return rows[0] ? mapSbCommerce(rows[0]) : null
  }
  return hybrid<Commerce | null>(
    key,
    async () => {
      try { return await api<Commerce>(`/api/commerces/${id}`) } catch { return null }
    },
    viaSb,
    () => DEMO_COMMERCES.find((c) => c.id === id) ?? null,
  )
}

export async function getAvis(commerceId: number): Promise<Avis[]> {
  return hybrid<Avis[]>(
    `avis:${commerceId}`,
    () => api(`/api/avis?commerce_id=${commerceId}`),
    () => sb(`avis?select=*&commerce_id=eq.${commerceId}&order=cree_le.desc`),
    () => DEMO_AVIS.filter((a) => a.commerce_id === commerceId),
  )
}

export async function postAvis(a: Omit<Avis, 'id' | 'cree_le'>): Promise<void> {
  if (hasApi) {
    try {
      await api('/api/avis', { method: 'POST', body: JSON.stringify(a) })
      return
    } catch { /* repli */ }
  }
  if (hasSupabase) {
    await sbPost('avis', a)
    return
  }
  throw new Error('Aucune backend disponible pour publier un avis')
}

export async function getNotifications(): Promise<Notification[]> {
  return hybrid<Notification[]>(
    'notifications',
    () => api('/api/notifications'),
    () => sb('notifications?select=*&order=cree_le.desc&limit=30'),
    () => DEMO_NOTIFICATIONS,
  )
}

/* ── Favoris : stockage local (défaut) + serveur si dispo ────────── */

const FAV_KEY = 'annuaire974.favoris'

export function getFavoris(): number[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as number[]
  } catch {
    return []
  }
}

export function toggleFavori(id: number): boolean {
  const favs = getFavoris()
  const on = !favs.includes(id)
  const next = on ? [...favs, id] : favs.filter((x) => x !== id)
  localStorage.setItem(FAV_KEY, JSON.stringify(next))
  return on
}

/* ── Jeu de démo (filtres appliqués localement) ───────────────────── */

function filterDemo(f: CommerceFilters): Commerce[] {
  let list = DEMO_COMMERCES
  if (f.categorie) list = list.filter((c) => c.categories?.some((k) => k.id === f.categorie))
  if (f.commune) {
    const com = DEMO_COMMUNES.find((x) => x.id === f.commune)
    if (com) list = list.filter((c) => c.communes?.nom === com.nom)
  }
  return list
}
