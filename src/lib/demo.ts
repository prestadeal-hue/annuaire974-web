// Jeu de démo — affiché UNIQUEMENT si l'API REST et Supabase sont tous deux injoignables
// (premier lancement hors-ligne). Les commerces sont fictifs mais réalistes.
import type { Avis, Categorie, Commerce, Commune, Notification } from '../types'

export const DEMO_CATEGORIES: Categorie[] = [
  { id: 1, nom: 'Tatoueur', icone: '🖋️' },
  { id: 2, nom: 'Coiffeur', icone: '💇' },
  { id: 3, nom: 'Restaurant', icone: '🍽️' },
  { id: 4, nom: 'VTC/Taxi', icone: '🚐' },
  { id: 5, nom: 'Plombier', icone: '🔧' },
  { id: 6, nom: 'Électricien', icone: '💡' },
  { id: 7, nom: 'Cours/Sport', icone: '🎾' },
  { id: 8, nom: 'Santé', icone: '🩺' },
  { id: 9, nom: 'Éducation', icone: '📚' },
  { id: 10, nom: 'Autre', icone: '✨' },
]

export const DEMO_COMMUNES: Commune[] = [
  { id: 1, nom: 'Saint-Denis' },
  { id: 2, nom: 'Saint-Paul' },
  { id: 3, nom: 'Saint-Pierre' },
  { id: 4, nom: 'Le Tampon' },
  { id: 5, nom: 'Saint-André' },
  { id: 6, nom: 'Saint-Louis' },
  { id: 7, nom: 'Le Port' },
  { id: 8, nom: 'La Possession' },
  { id: 9, nom: 'Saint-Leu' },
  { id: 10, nom: 'Sainte-Marie' },
  { id: 11, nom: 'Sainte-Suzanne' },
  { id: 12, nom: 'Bras-Panon' },
  { id: 13, nom: 'Salazie' },
  { id: 14, nom: 'Entre-Deux' },
  { id: 15, nom: 'Les Avirons' },
  { id: 16, nom: 'Petite-Île' },
]

function mk(
  id: number,
  nom: string,
  catId: number,
  communeId: number,
  description: string,
  adresse: string,
  telephone: string,
  note: number,
  nb: number,
  horaires: string,
): Commerce {
  const cat = DEMO_CATEGORIES.find((c) => c.id === catId)!
  const commune = DEMO_COMMUNES.find((c) => c.id === communeId)!
  return {
    id,
    nom,
    description,
    adresse,
    telephone,
    whatsapp: telephone,
    horaires,
    statut: 'approuve',
    note_moyenne: note,
    nb_avis: nb,
    categories: [cat],
    categorie: cat,
    communes: { nom: commune.nom },
    photo_url: null,
    cree_le: '2026-01-15T08:00:00Z',
  }
}

export const DEMO_COMMERCES: Commerce[] = [
  mk(1, 'La Forge Tatouages', 1, 1, 'Salon de tatouage personnalisé, hygiène irréprochable, sur rendez-vous.', '12 rue de la Compagnie, Saint-Denis', '0262 21 45 67', 4.8, 42, 'Mar–Sam 9h–18h'),
  mk(2, 'Ink Lagon', 1, 3, 'Tatouages polynésiens et fineline, flash du vendredi.', '4 bd Hubert Delarue, Saint-Pierre', '0262 48 12 30', 4.6, 27, 'Mer–Dim 10h–19h'),
  mk(3, 'Tindaire Tattoo', 1, 2, 'Blackwork et dotwork dans les Hauts de Saint-Paul.', '7 chemin Hoarau, Saint-Paul', '0262 53 87 91', 4.9, 31, 'Lun–Ven 9h–17h'),
  mk(4, 'Chez Barbara Coiffure', 2, 1, 'Coupes, couleurs, tresses et soins cheveux texturés.', '33 rue Maréchal Leclerc, Saint-Denis', '0262 41 09 22', 4.7, 58, 'Mar–Sam 8h30–18h'),
  mk(5, 'Tresse & Style', 2, 1, 'Spécialiste tresses africaines et tissages.', '8 rue Pasteur, Saint-Denis', '0262 41 77 05', 4.5, 34, 'Lun–Sam 8h–19h'),
  mk(6, 'Le K-case', 2, 4, 'Barbier et coiffure générale, ambiance conviviale.', '15 rue Curbelin, Le Tampon', '0262 47 33 18', 4.4, 19, 'Mar–Sam 9h–18h30'),
  mk(7, "Chez Doudou — table d'hôtes", 3, 9, 'Cuisine créole familiale, cari massalé le mercredi.', '2 allée des Badamiers, Saint-Leu', '0262 34 85 60', 4.9, 112, 'Lun–Sam 11h30–14h30, 18h30–21h'),
  mk(8, 'Le Flagrant Délice', 3, 1, 'Bistro moderne : burgers, salades et plats du jour.', '26 rue de Paris, Saint-Denis', '0262 20 15 84', 4.3, 87, 'Lun–Ven 11h–14h30'),
  mk(9, 'Ti Kaz Manapany', 3, 3, 'Cuisine de bord de mer, poissons frais du jour.', '1 rue du Lagon, Manapany', '0262 39 04 76', 4.6, 64, 'Jeu–Lun 11h30–15h, 18h30–22h'),
  mk(10, "L'Atelier du Goût", 3, 2, 'Pâtisserie-traiteur, gâteaux sur commande.', '19 rue de la Gare, Saint-Paul', '0262 45 21 09', 4.8, 45, 'Mar–Sam 9h–18h'),
  mk(11, 'Ride 974 VTC', 4, 1, 'VTC disponible 24h/24, aéroport Rolland Garros, forfaits longue distance.', '—', '0692 12 34 56', 4.7, 89, '24h/24, 7j/7'),
  mk(12, "Ti-Taxi de l'Ouest", 4, 2, 'Taxis conventionnés, mise à disposition à la demi-journée.', 'Gare routière de Saint-Paul', '0692 55 66 77', 4.2, 38, 'Lun–Dim 5h–21h'),
  mk(13, 'AquaPlomberie', 5, 1, 'Dépannage 7j/7 : fuites, chauffe-eau, rénovation salle de bain.', '—', '0692 44 55 66', 4.5, 51, 'Lun–Sam 7h–19h, urgences 24h/24'),
  mk(14, 'Élec Pilon', 6, 4, 'Dépannage électrique, mise aux normes NF C 15-100.', '—', '0692 77 88 99', 4.6, 40, 'Lun–Ven 7h30–17h30'),
  mk(15, 'Volt Électricité', 6, 3, 'Installation et dépannage, devis gratuit.', '—', '0692 22 33 44', 4.4, 29, 'Lun–Ven 8h–18h'),
  mk(16, 'Zoreol Squash & Padel', 7, 1, 'Complexe sportif : squash, padel, cours collectifs.', 'Rue de la Victoire, Saint-Denis', '0262 29 60 12', 4.5, 66, 'Lun–Dim 8h–22h'),
  mk(17, "Surf School Étang-Salé", 7, 6, 'Cours de surf encadrés, tous niveaux, dès 6 ans.', "RdV plage de l'Étang-Salé-les-Bains", '0692 90 12 34', 4.9, 73, 'Tous les jours selon marées'),
  mk(18, 'Yoga Ti Zen', 7, 3, 'Yoga, pilates et méditation, cours en présentiel et en ligne.', '5 rue du Four à Chaux, Saint-Pierre', '0692 33 44 55', 4.8, 52, 'Lun–Sam 6h30–20h'),
  mk(19, 'Cabinet Dentaire Molitor', 8, 1, 'Soins dentaires, urgences dentaires le samedi matin.', '40 rue Molitor, Saint-Denis', '0262 30 44 55', 4.3, 61, 'Lun–Ven 8h–18h, Sam 8h–12h'),
  mk(20, 'Optique Santé Réunion', 8, 2, 'Opticien-lunetier, essais et montage sur place.', '24 rue Marius et Ary Leblond, Saint-Paul', '0262 45 66 77', 4.6, 35, 'Lun–Sam 8h30–17h30'),
  mk(21, 'Auto-École Ti Permis', 9, 4, 'Formation conduite B et A2, examens blancs inclus.', '3 rue Hubert Delarue, Le Tampon', '0262 47 88 99', 4.4, 48, 'Lun–Ven 9h–17h, Sam 9h–12h'),
  mk(22, 'Soutien Scolaire 974', 9, 1, 'Cours de maths et français du collège au lycée, petits groupes.', '—', '0692 66 77 88', 4.7, 25, 'Lun–Ven 17h–19h30'),
  mk(23, 'Photographe Kader G.', 10, 3, 'Mariages, événements, portraits en studio.', '12 rue Éloi, Saint-Pierre', '0692 10 20 30', 4.8, 39, 'Sur rendez-vous'),
  mk(24, 'Kaz à Vélo', 10, 9, "Location et réparation de vélos, VTT et VA dans l'Ouest.", 'Port Ouest, Saint-Leu', '0262 34 12 78', 4.6, 30, 'Lun–Dim 8h30–18h'),
]

export const DEMO_AVIS: Avis[] = [
  { id: 1, commerce_id: 7, auteur: 'Mimi', note: 5, commentaire: 'Le cari massalé est une tuerie ! Accueil au top.', cree_le: '2026-08-30T12:00:00Z' },
  { id: 2, commerce_id: 7, auteur: 'Jean-Yves', note: 5, commentaire: 'Cuisine familiale comme à la maison. On reviendra.', cree_le: '2026-08-14T12:00:00Z' },
  { id: 3, commerce_id: 1, auteur: 'Laura', note: 5, commentaire: "Travail propre et à l'écoute, je recommande.", cree_le: '2026-08-21T12:00:00Z' },
  { id: 4, commerce_id: 11, auteur: 'Saïd', note: 5, commentaire: "Ponctuel et conduit souplement, parfait pour l'aéroport.", cree_le: '2026-09-01T12:00:00Z' },
  { id: 5, commerce_id: 13, auteur: 'Nadia', note: 4, commentaire: 'Intervention rapide le dimanche, tarif correct.', cree_le: '2026-07-19T12:00:00Z' },
  { id: 6, commerce_id: 17, auteur: 'Bruno', note: 5, commentaire: 'Super pédagogue avec les enfants, on a pris plaisir.', cree_le: '2026-08-02T12:00:00Z' },
  { id: 7, commerce_id: 4, auteur: 'Vanessa', note: 4, commentaire: 'Très satisfaite des tresses, ambiance sympa.', cree_le: '2026-09-05T12:00:00Z' },
  { id: 8, commerce_id: 24, auteur: 'Pascal', note: 5, commentaire: 'VTT révisé en une heure, équipe pro.', cree_le: '2026-08-27T12:00:00Z' },
]

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, titre: 'Nouveau commerce', message: "La Forge Tatouages a rejoint l'annuaire 🎉", type: 'nouveau', lu: false, cree_le: '2026-09-10T08:00:00Z' },
  { id: 2, titre: 'Promotion', message: "Le Flagrant Délice : -20% sur les burgers jusqu'à vendredi.", type: 'promo', lu: false, cree_le: '2026-09-09T10:00:00Z' },
  { id: 3, titre: 'Astuce', message: 'Ajoute tes commerces préférés aux favoris pour les retrouver hors-ligne.', type: 'astuce', lu: true, cree_le: '2026-09-05T09:00:00Z' },
]
