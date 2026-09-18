const trimSlash = (u: string | undefined) => (u ?? '').replace(/\/+$/, '')

/**
 * Branche « API d'abord » — INERTE, et c'est voulu : il n'y a pas d'API.
 * Décision du 18/09/2026 : une API REST Node.js avait été envisagée puis écartée,
 * l'app lit et écrit déjà directement dans Supabase (PostgREST + RPC publier_avis).
 * Garder `VITE_API_URL` VIDE : une URL renseignée mais injoignable fait payer un
 * aller-retour perdu à chaque chargement avant le repli. Voir README § Données.
 */
export const API_URL = trimSlash(import.meta.env.VITE_API_URL)

/** Supabase — la clé publique (publishable) n'est pas un secret. */
export const SUPABASE_URL = trimSlash(import.meta.env.VITE_SUPABASE_URL)
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const hasApi = API_URL.length > 0
export const hasSupabase = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
