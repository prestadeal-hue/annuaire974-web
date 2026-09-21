const trimSlash = (u: string | undefined) => (u ?? '').replace(/\/+$/, '')

/**
 * Supabase — la clé publique (publishable) n'est pas un secret.
 * Elle sert uniquement à joindre la fonction Edge de l'assistant.
 */
export const SUPABASE_URL = trimSlash(import.meta.env.VITE_SUPABASE_URL)
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const hasSupabase = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0

/**
 * L'assistant — il n'a PAS de clé à lui, et c'est tout l'intérêt.
 *
 * Décision du 18/09/2026 : ni la clé du modèle (MiMo) ni la clé de recherche
 * (Exa) ne passent par une variable `VITE_*`. Toute variable `VITE_*` utilisée
 * par le code finit dans le paquet JavaScript PUBLIC — vérifié : la clé `anon`
 * de Supabase y est en clair. Une clé `anon` est publique par conception ; une
 * clé de modèle ou de recherche, elle, PAIE, et serait facturée à n'importe qui.
 * Elles vivent donc dans les secrets Supabase, et le navigateur parle à une Edge
 * Function (`supabase/functions/chat/index.ts`).
 *
 * Conséquence : ZÉRO variable d'environnement sensible côté build. L'assistant
 * réutilise l'URL et la clé `anon` déjà présentes.
 */
export const AGENT_URL = SUPABASE_URL.length > 0 ? `${SUPABASE_URL}/functions/v1/chat` : ''
export const hasAgent = AGENT_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
