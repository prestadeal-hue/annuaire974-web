export interface Categorie {
  id: number
  nom: string
  slug?: string | null
  icone?: string | null
}

export interface Commune {
  id: number
  nom: string
}

/**
 * Schéma réel Supabase (introspecté via PostgREST, sept. 2026) :
 * commerces.commune est une colonne TEXTE (+ code_postal, latitude, longitude).
 * Pas de whatsapp / nb_avis côté base — le whatsapp dérive du téléphone.
 */
export interface Commerce {
  id: number
  nom: string
  description?: string | null
  adresse?: string | null
  /** Nom de commune en texte (schéma réel) */
  commune?: string | null
  code_postal?: string | null
  latitude?: number | null
  longitude?: number | null
  telephone?: string | null
  horaires?: string | null
  photo_url?: string | null
  statut?: string | null
  cree_le?: string | null
  note_moyenne?: number | null
  /** Catégories embarquées (via commerce_categories) */
  categories?: Categorie[] | null
  categorie?: Categorie | null
}

export interface Avis {
  id: number
  commerce_id: number
  /** Résolu côté app depuis l'embed utilisateurs (prenom/nom) */
  auteur?: string | null
  note: number
  commentaire?: string | null
  cree_le?: string | null
  /** Embed PostgREST — anonyme si RLS bloque la lecture des utilisateurs */
  utilisateurs?: { prenom?: string | null; nom?: string | null } | null
}

export interface Notification {
  id: number
  titre?: string | null
  message?: string | null
  type?: string | null
  /** Colonne réelle : est_lu */
  est_lu?: boolean | null
  cree_le?: string | null
}

export type DataMode = 'api' | 'supabase' | 'demo'
