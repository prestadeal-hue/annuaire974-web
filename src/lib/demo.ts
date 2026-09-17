// Jeu de démo — affiché UNIQUEMENT si l'API REST et Supabase sont tous deux injoignables
// ou illisibles (RLS). Commerces fictifs mais réalistes. Ids UUID (schéma réel).
import type { Avis, Categorie, Commerce, Commune, Notification } from '../types'

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

export const DEMO_CATEGORIES: Categorie[] = [
  { id: uid(101), nom: 'Tatoueur', slug: 'tatoueur', icone: '🖋️', couleur: '#8B5CF6', ordre: 1 },
  { id: uid(102), nom: 'Coiffeur', slug: 'coiffeur', icone: '💇', couleur: '#EC4899', ordre: 2 },
  { id: uid(103), nom: 'Restaurant', slug: 'restaurant', icone: '🍽️', couleur: '#F59E0B', ordre: 3 },
  { id: uid(104), nom: 'VTC/Taxi', slug: 'vtc-taxi', icone: '🚐', couleur: '#10B981', ordre: 4 },
  { id: uid(105), nom: 'Plombier', slug: 'plombier', icone: '🔧', couleur: '#3B82F6', ordre: 5 },
  { id: uid(106), nom: 'Électricien', slug: 'electricien', icone: '💡', couleur: '#EAB308', ordre: 6 },
  { id: uid(107), nom: 'Cours/Sport', slug: 'cours-sport', icone: '🎾', couleur: '#EF4444', ordre: 7 },
  { id: uid(108), nom: 'Santé', slug: 'sante', icone: '🩺', couleur: '#06B6D4', ordre: 8 },
  { id: uid(109), nom: 'Éducation', slug: 'education', icone: '📚', couleur: '#8B5CF6', ordre: 9 },
  { id: uid(110), nom: 'Autre', slug: 'autre', icone: '✨', couleur: '#6B7280', ordre: 10 },
]

export const DEMO_COMMUNES: Commune[] = [
  { id: uid(1), nom: 'Saint-Denis' },
  { id: uid(2), nom: 'Saint-Paul' },
  { id: uid(3), nom: 'Saint-Pierre' },
  { id: uid(4), nom: 'Le Tampon' },
  { id: uid(5), nom: 'Saint-André' },
  { id: uid(6), nom: 'Saint-Louis' },
  { id: uid(7), nom: 'Le Port' },
  { id: uid(8), nom: 'La Possession' },
  { id: uid(9), nom: 'Saint-Leu' },
  { id: uid(10), nom: 'Sainte-Marie' },
]

function mk(
  id: string,
  nom: string,
  catSlug: string,
  commune: string,
  description: string,
  adresse: string,
  telephone: string,
  note: number,
  horaires: string,
): Commerce {
  const cat = DEMO_CATEGORIES.find((c) => c.slug === catSlug)!
  return {
    id,
    nom,
    description,
    adresse,
    commune,
    telephone,
    horaires,
    statut: 'approuve',
    actif: true,
    note_moyenne: note,
    categories: [cat],
    categorie: cat,
    photo_url: null,
    cree_le: '2026-01-15T08:00:00Z',
  }
}

export const DEMO_COMMERCES: Commerce[] = [
  mk(uid(1), 'La Forge Tatouages', 'tatoueur', 'Saint-Denis', 'Salon de tatouage personnalisé, hygiène irréprochable, sur rendez-vous.', '12 rue de la Compagnie', '0262 21 45 67', 4.8, 'Mar–Sam 9h–18h'),
  mk(uid(2), 'Ink Lagon', 'tatoueur', 'Saint-Pierre', 'Tatouages polynésiens et fineline, flash du vendredi.', '4 bd Hubert Delarue', '0262 48 12 30', 4.6, 'Mer–Dim 10h–19h'),
  mk(uid(3), 'Tindaire Tattoo', 'tatoueur', 'Saint-Paul', 'Blackwork et dotwork dans les Hauts.', '7 chemin Hoarau', '0262 53 87 91', 4.9, 'Lun–Ven 9h–17h'),
  mk(uid(4), 'Chez Barbara Coiffure', 'coiffeur', 'Saint-Denis', 'Coupes, couleurs, tresses et soins cheveux texturés.', '33 rue Maréchal Leclerc', '0262 41 09 22', 4.7, 'Mar–Sam 8h30–18h'),
  mk(uid(5), 'Tresse & Style', 'coiffeur', 'Saint-Denis', 'Spécialiste tresses africaines et tissages.', '8 rue Pasteur', '0262 41 77 05', 4.5, 'Lun–Sam 8h–19h'),
  mk(uid(6), 'Le K-case', 'coiffeur', 'Le Tampon', 'Barbier et coiffure générale, ambiance conviviale.', '15 rue Curbelin', '0262 47 33 18', 4.4, 'Mar–Sam 9h–18h30'),
  mk(uid(7), "Chez Doudou — table d'hôtes", 'restaurant', 'Saint-Leu', 'Cuisine créole familiale, cari massalé le mercredi.', '2 allée des Badamiers', '0262 34 85 60', 4.9, 'Lun–Sam 11h30–14h30, 18h30–21h'),
  mk(uid(8), 'Le Flagrant Délice', 'restaurant', 'Saint-Denis', 'Bistro moderne : burgers, salades et plats du jour.', '26 rue de Paris', '0262 20 15 84', 4.3, 'Lun–Ven 11h–14h30'),
  mk(uid(9), 'Ti Kaz Manapany', 'restaurant', 'Saint-Pierre', 'Cuisine de bord de mer, poissons frais du jour.', '1 rue du Lagon', '0262 39 04 76', 4.6, 'Jeu–Lun 11h30–15h, 18h30–22h'),
  mk(uid(10), "L'Atelier du Goût", 'restaurant', 'Saint-Paul', 'Pâtisserie-traiteur, gâteaux sur commande.', '19 rue de la Gare', '0262 45 21 09', 4.8, 'Mar–Sam 9h–18h'),
  mk(uid(11), 'Ride 974 VTC', 'vtc-taxi', 'Sainte-Marie', 'VTC 24h/24, aéroport Rolland Garros, forfaits longue distance.', '—', '0692 12 34 56', 4.7, '24h/24, 7j/7'),
  mk(uid(12), "Ti-Taxi de l'Ouest", 'vtc-taxi', 'Saint-Paul', 'Taxis conventionnés, mise à disposition à la demi-journée.', 'Gare routière', '0692 55 66 77', 4.2, 'Lun–Dim 5h–21h'),
  mk(uid(13), 'AquaPlomberie', 'plombier', 'Saint-Denis', 'Dépannage 7j/7 : fuites, chauffe-eau, rénovation salle de bain.', '—', '0692 44 55 66', 4.5, 'Lun–Sam 7h–19h, urgences 24h/24'),
  mk(uid(14), 'Élec Pilon', 'electricien', 'Le Tampon', 'Dépannage électrique, mise aux normes NF C 15-100.', '—', '0692 77 88 99', 4.6, 'Lun–Ven 7h30–17h30'),
  mk(uid(15), 'Volt Électricité', 'electricien', 'Saint-Pierre', 'Installation et dépannage, devis gratuit.', '—', '0692 22 33 44', 4.4, 'Lun–Ven 8h–18h'),
  mk(uid(16), 'Zoreol Squash & Padel', 'cours-sport', 'Saint-Denis', 'Complexe sportif : squash, padel, cours collectifs.', 'Rue de la Victoire', '0262 29 60 12', 4.5, 'Lun–Dim 8h–22h'),
  mk(uid(17), 'Surf School Étang-Salé', 'cours-sport', "L'Étang-Salé", 'Cours de surf encadrés, tous niveaux, dès 6 ans.', 'Plage des Aigrettes', '0692 90 12 34', 4.9, 'Tous les jours selon marées'),
  mk(uid(18), 'Yoga Ti Zen', 'cours-sport', 'Saint-Pierre', 'Yoga, pilates et méditation, cours en présentiel et en ligne.', '5 rue du Four à Chaux', '0692 33 44 55', 4.8, 'Lun–Sam 6h30–20h'),
  mk(uid(19), 'Cabinet Dentaire Molitor', 'sante', 'Saint-Denis', 'Soins dentaires, urgences dentaires le samedi matin.', '40 rue Molitor', '0262 30 44 55', 4.3, 'Lun–Ven 8h–18h, Sam 8h–12h'),
  mk(uid(20), 'Optique Santé Réunion', 'sante', 'Saint-Paul', 'Opticien-lunetier, essais et montage sur place.', '24 rue Marius et Ary Leblond', '0262 45 66 77', 4.6, 'Lun–Sam 8h30–17h30'),
  mk(uid(21), 'Auto-École Ti Permis', 'education', 'Le Tampon', 'Formation conduite B et A2, examens blancs inclus.', '3 rue Hubert Delarue', '0262 47 88 99', 4.4, 'Lun–Ven 9h–17h, Sam 9h–12h'),
  mk(uid(22), 'Soutien Scolaire 974', 'education', 'Saint-Denis', 'Cours de maths et français du collège au lycée, petits groupes.', '—', '0692 66 77 88', 4.7, 'Lun–Ven 17h–19h30'),
  mk(uid(23), 'Photographe Kader G.', 'autre', 'Saint-Pierre', 'Mariages, événements, portraits en studio.', '12 rue Éloi', '0692 10 20 30', 4.8, 'Sur rendez-vous'),
  mk(uid(24), 'Kaz à Vélo', 'autre', 'Saint-Leu', "Location et réparation de vélos, VTT et VA dans l'Ouest.", 'Port Ouest', '0262 34 12 78', 4.6, 'Lun–Dim 8h30–18h'),
]

export const DEMO_AVIS: Avis[] = [
  { id: uid(901), commerce_id: uid(7), auteur: 'Mimi', note: 5, commentaire: 'Le cari massalé est une tuerie ! Accueil au top.', cree_le: '2026-08-30T12:00:00Z' },
  { id: uid(902), commerce_id: uid(7), auteur: 'Jean-Yves', note: 5, commentaire: 'Cuisine familiale comme à la maison. On reviendra.', cree_le: '2026-08-14T12:00:00Z' },
  { id: uid(903), commerce_id: uid(1), auteur: 'Laura', note: 5, commentaire: "Travail propre et à l'écoute, je recommande.", cree_le: '2026-08-21T12:00:00Z' },
  { id: uid(904), commerce_id: uid(11), auteur: 'Saïd', note: 5, commentaire: "Ponctuel et conduit souplement, parfait pour l'aéroport.", cree_le: '2026-09-01T12:00:00Z' },
  { id: uid(905), commerce_id: uid(13), auteur: 'Nadia', note: 4, commentaire: 'Intervention rapide le dimanche, tarif correct.', cree_le: '2026-07-19T12:00:00Z' },
  { id: uid(906), commerce_id: uid(17), auteur: 'Bruno', note: 5, commentaire: 'Super pédagogue avec les enfants, on a pris plaisir.', cree_le: '2026-08-02T12:00:00Z' },
  { id: uid(907), commerce_id: uid(4), auteur: 'Vanessa', note: 4, commentaire: 'Très satisfaite des tresses, ambiance sympa.', cree_le: '2026-09-05T12:00:00Z' },
  { id: uid(908), commerce_id: uid(24), auteur: 'Pascal', note: 5, commentaire: 'VTT révisé en une heure, équipe pro.', cree_le: '2026-08-27T12:00:00Z' },
]

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: uid(801), titre: 'Nouveau commerce', message: "La Forge Tatouages a rejoint l'annuaire 🎉", type: 'nouveau', est_lu: false, cree_le: '2026-09-10T08:00:00Z' },
  { id: uid(802), titre: 'Promotion', message: "Le Flagrant Délice : -20% sur les burgers jusqu'à vendredi.", type: 'promo', est_lu: false, cree_le: '2026-09-09T10:00:00Z' },
  { id: uid(803), titre: 'Astuce', message: 'Ajoute tes commerces préférés aux favoris (string) pour les retrouver hors-ligne.', type: 'astuce', est_lu: true, cree_le: '2026-09-05T09:00:00Z' },
]
