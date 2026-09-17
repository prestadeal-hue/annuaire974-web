const trimSlash = (u: string | undefined) => (u ?? '').replace(/\/+$/, '')

/** API REST Node.js (Render). Vide = non déployée, on reste sur Supabase direct. */
export const API_URL = trimSlash(import.meta.env.VITE_API_URL)

/** Supabase — la clé publique (publishable) n'est pas un secret. */
export const SUPABASE_URL = trimSlash(import.meta.env.VITE_SUPABASE_URL)
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const hasApi = API_URL.length > 0
export const hasSupabase = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
