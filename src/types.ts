/** ⚠ Tous les id sont des UUID → traités comme des string partout. */

export interface Categorie {
  id: string
  nom: string
  slug?: string | null
  icone?: string | null
  couleur?: string | null
  ordre?: number | null
}

export interface Commune {
  id: string
  nom: string
  slug?: string | null
  code_postal?: string | null
}

export interface Commerce {
  id: string
  nom: string
  slug?: string | null
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
  actif?: boolean | null
  cree_le?: string | null
  note_moyenne?: number | null
  /** Catégories embarquées (via commerce_categories) */
  categories?: Categorie[] | null
  categorie?: Categorie | null
}

export interface Avis {
  id: string
  commerce_id: string
  /** Résolu côté app depuis l'embed utilisateurs (prenom/nom) */
  auteur?: string | null
  note: number
  commentaire?: string | null
  cree_le?: string | null
  utilisateurs?: { prenom?: string | null; nom?: string | null } | null
}

export interface Notification {
  id: string
  titre?: string | null
  message?: string | null
  type?: string | null
  /** Colonne réelle : est_lu */
  est_lu?: boolean | null
  cree_le?: string | null
}

export type DataMode = 'api' | 'supabase' | 'demo'
