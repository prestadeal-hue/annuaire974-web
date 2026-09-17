import type { Avis, Categorie, Commerce, Commune, DataMode, Notification } from '../types'
import { API_URL, SUPABASE_ANON_KEY, SUPABASE_URL, hasApi, hasSupabase } from './config'
import { DEMO_AVIS, DEMO_CATEGORIES, DEMO_COMMERCES, DEMO_COMMUNES, DEMO_NOTIFICATIONS } from './demo'

/* ── Modes : 'api' (REST Render) → 'supabase' (direct) → démo ──────
   ⚠ Tous les ids sont des UUID (schéma réel) → traités comme string. */

let mode: DataMode | null = null
const memo = new Map<string, unknown>()

export const getMode = (): DataMode | null => mode
export const setMode = (m: DataMode) => { mode = m }

async function fetchTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

/* ── API REST (Render) ────────────────────────────────────────────── */

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchTimeout(
    `${API_URL}${path}`,
    { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } },
    6500,
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  setMode('api')
  return (await res.json()) as T
}

/* ── Supabase direct (PostgREST, clé publique) ───────────────────── */

async function sb<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchTimeout(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(init?.headers ?? {}),
    },
  }, 6500)
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  setMode('supabase')
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

/** API prioritaire, puis Supabase, puis démo — avec cache mémoire. */
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

/* ── Mapping Supabase → app ──────────────────────────────────────── */

interface SbCommerceRow {
  id: string
  nom: string
  slug?: string | null
  description?: string | null
  adresse?: string | null
  commune?: string | null
  code_postal?: string | null
  telephone?: string | null
  horaires?: string | null
  photo_url?: string | null
  statut?: string | null
  actif?: boolean | null
  note_moyenne?: number | null
  categorie_id?: string | null
  commerce_categories?: Array<{ categories: Categorie | null }> | null
}

function mapSbCommerce(row: SbCommerceRow): Commerce {
  const cats = (row.commerce_categories ?? [])
    .map((cc) => cc.categories)
    .filter((k): k is Categorie => k !== null)
  return {
    id: String(row.id),
    nom: row.nom,
    slug: row.slug ?? null,
    description: row.description ?? null,
    adresse: row.adresse ?? null,
    commune: row.commune ?? null,
    code_postal: row.code_postal ?? null,
    telephone: row.telephone ?? null,
    horaires: row.horaires ?? null,
    photo_url: row.photo_url ?? null,
    statut: row.statut ?? null,
    note_moyenne: row.note_moyenne ?? null,
    categories: cats,
    categorie: cats[0] ?? null,
  }
}

/* ── API publique ─────────────────────────────────────────────────── */

export interface CommerceFilters {
  q?: string
  categorie?: string
  commune?: string
}

export async function getCategories(): Promise<Categorie[]> {
  return hybrid<Categorie[]>(
    'categories',
    () => api('/api/categories'),
    () => sb('categories?select=*&order=ordre.asc'),
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

export async function getCommerces(): Promise<Commerce[]> {
  const viaSb = async (): Promise<Commerce[]> => {
    const rows = await sb<SbCommerceRow[]>(
      'commerces?select=*,commerce_categories(categories(id,nom,slug,icone))&order=nom.asc&limit=300',
    )
    return rows.map(mapSbCommerce)
  }
  return hybrid<Commerce[]>('commerces', () => api('/api/commerces'), viaSb, () => DEMO_COMMERCES)
}

export async function getCommerce(id: string): Promise<Commerce | null> {
  const viaSb = async (): Promise<Commerce | null> => {
    const rows = await sb<SbCommerceRow[]>(
      `commerces?select=*,commerce_categories(categories(id,nom,slug,icone))&id=eq.${id}`,
    )
    return rows[0] ? mapSbCommerce(rows[0]) : null
  }
  return hybrid<Commerce | null>(
    `commerce:${id}`,
    async () => {
      try { return await api<Commerce>(`/api/commerces/${id}`) } catch { return null }
    },
    viaSb,
    () => DEMO_COMMERCES.find((c) => c.id === id) ?? null,
  )
}

export async function getAvis(commerceId: string): Promise<Avis[]> {
  const viaSb = async (): Promise<Avis[]> => {
    const rows = await sb<Array<Record<string, unknown>>>(
      `avis?select=*,utilisateurs(prenom,nom)&commerce_id=eq.${commerceId}&order=cree_le.desc&limit=50`,
    )
    return rows.map((r) => {
      const u = r.utilisateurs as { prenom?: string | null; nom?: string | null } | null
      const auteur = u ? [u.prenom, u.nom].filter(Boolean).join(' ').replace(/\s*\.$/, '') || null : null
      return { ...(r as unknown as Avis), id: String(r.id), commerce_id: String(r.commerce_id), auteur }
    })
  }
  return hybrid<Avis[]>(
    `avis:${commerceId}`,
    () => api(`/api/avis?commerce_id=${commerceId}`),
    viaSb,
    () => DEMO_AVIS.filter((a) => a.commerce_id === commerceId),
  )
}

/**
 * Publie un avis : RPC publier_avis (pseudo résolu en utilisateur côté base),
 * puis repli API REST, puis insert direct si l'embed utilisateurs est ouvert.
 */
export async function postAvis(a: {
  commerce_id: string
  auteur: string
  note: number
  commentaire: string
}): Promise<void> {
  if (hasSupabase) {
    try {
      await sb('rpc/publier_avis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_commerce_id: a.commerce_id,
          p_pseudo: a.auteur,
          p_note: a.note,
          p_commentaire: a.commentaire,
        }),
      })
      return
    } catch { /* repli */ }
  }
  if (hasApi) {
    await api('/api/avis', { method: 'POST', body: JSON.stringify(a) })
    return
  }
  throw new Error('Aucune backend disponible')
}

export async function getNotifications(): Promise<Notification[]> {
  return hybrid<Notification[]>(
    'notifications',
    () => api('/api/notifications'),
    () => sb('notifications?select=*&order=cree_le.desc&limit=30'),
    () => DEMO_NOTIFICATIONS,
  )
}

/* ── Favoris : stockage local (défaut) ───────────────────────────── */

const FAV_KEY = 'annuaire974.favoris'

export function getFavoris(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as string[] } catch { return [] }
}

export function toggleFavori(id: string): boolean {
  const favs = getFavoris()
  const on = !favs.includes(id)
  localStorage.setItem(FAV_KEY, JSON.stringify(on ? [...favs, id] : favs.filter((x) => x !== id)))
  return on
}

