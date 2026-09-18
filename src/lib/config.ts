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

/**
 * L'assistant — il n'a PAS de clé à lui, et c'est tout l'intérêt.
 *
 * Décision du 18/09/2026 : la clé du modèle (MiMo) ne passe jamais par une
 * variable `VITE_*`. Toute variable `VITE_*` utilisée par le code finit dans le
 * paquet JavaScript PUBLIC — ce n'est pas une crainte, c'est vérifié : la clé
 * `anon` de Supabase y est en clair (voir README § Données). Une clé `anon` est
 * publique par conception ; une clé de modèle, elle, PAIE, et serait facturée à
 * n'importe qui. Elle vit donc dans les secrets Supabase, et le navigateur parle
 * à une Edge Function (`supabase/functions/chat/index.ts`).
 *
 * Conséquence : ZÉRO variable d'environnement nouvelle. L'assistant réutilise
 * l'URL et la clé `anon` déjà présentes.
 */
export const AGENT_URL = SUPABASE_URL.length > 0 ? `${SUPABASE_URL}/functions/v1/chat` : ''
export const hasAgent = AGENT_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
