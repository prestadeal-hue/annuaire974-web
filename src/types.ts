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

export interface Commerce {
  id: number
  nom: string
  description?: string | null
  adresse?: string | null
  commune_id?: number | null
  telephone?: string | null
  whatsapp?: string | null
  horaires?: string | null
  photo_url?: string | null
  statut?: string | null
  cree_le?: string | null
  note_moyenne?: number | null
  nb_avis?: number | null
  /** Catégories embarquées (via commerce_categories) */
  categories?: Categorie[] | null
  categorie?: Categorie | null
  /** Commune embarquée via la FK */
  communes?: { nom: string } | null
}

export interface Avis {
  id: number
  commerce_id: number
  auteur?: string | null
  note: number
  commentaire?: string | null
  cree_le?: string | null
}

export interface Notification {
  id: number
  titre?: string | null
  message?: string | null
  type?: string | null
  lu?: boolean | null
  cree_le?: string | null
}

export type DataMode = 'api' | 'supabase'
