-- ═══════════════════════════════════════════════════════════════════════
--  ANNUAIRE 974 — Seed de démonstration (OPTIONNEL)
--  ⚠ Tes tables contiennent déjà des données (9 catégories, 23 commerces…).
--    Ce seed ne sert que si tu veux homogénéiser avec le jeu de démo de l'app.
--    Il n'insère QUE les lignes dont l'id n'existe pas encore (idempotent).
--
--  Schéma = introspection réelle (PostgREST, sept. 2026) :
--    commerces.commune TEXT (+ code_postal, latitude, longitude) — pas de commune_id
--    avis.utilisateur_id → utilisateurs (pas de colonne « auteur »)
--    notifications.est_lu
--  Colonnes manquantes dans l'instance : whatsapp, nb_avis → non insérées.
--
--  Exécution : Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════

-- 1. CATÉGORIES (complète vers 10 si certaines manquent)
INSERT INTO categories (id, nom, slug, icone)
SELECT v.id, v.nom, v.slug, v.icone
FROM (VALUES
  (1,  'Tatoueur',    'tatoueur',    '🖋️'),
  (2,  'Coiffeur',    'coiffeur',    '💇'),
  (3,  'Restaurant',  'restaurant',  '🍽️'),
  (4,  'VTC/Taxi',    'vtc-taxi',    '🚐'),
  (5,  'Plombier',    'plombier',    '🔧'),
  (6,  'Électricien', 'electricien', '💡'),
  (7,  'Cours/Sport', 'cours-sport', '🎾'),
  (8,  'Santé',       'sante',       '🩺'),
  (9,  'Éducation',   'education',   '📚'),
  (10, 'Autre',       'autre',       '✨')
) AS v(id, nom, slug, icone)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = v.id);

-- 2. COMMUNES (complète vers les 24 communes de l'île)
INSERT INTO communes (id, nom)
SELECT v.id, v.nom
FROM (VALUES
  (1,  'Saint-Denis'),   (2,  'Saint-Paul'),      (3,  'Saint-Pierre'),
  (4,  'Le Tampon'),     (5,  'Saint-André'),     (6,  'Saint-Louis'),
  (7,  'Le Port'),       (8,  'La Possession'),   (9,  'Saint-Leu'),
  (10, 'Sainte-Marie'),  (11, 'Sainte-Suzanne'),  (12, 'Bras-Panon'),
  (13, 'Salazie'),       (14, 'Entre-Deux'),      (15, 'Les Avirons'),
  (16, 'Petite-Île'),    (17, 'Saint-Philippe'),  (18, 'Sainte-Rose'),
  (19, 'Saint-Benoît'),  (20, 'Saint-Joseph'),    (21, 'Cilaos'),
  (22, 'Trois-Bassins'), (23, 'Saint-Louis-Haut'),NULL,
  (24, 'L''Étang-Salé')
) AS v(id, nom)
WHERE v.nom IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM communes c WHERE c.id = v.id);

-- 3. COMMERCES (24, ids 1-24 si libres)
INSERT INTO commerces (id, nom, description, adresse, commune, code_postal, telephone, horaires, statut, latitude, longitude)
SELECT v.id, v.nom, v.description, v.adresse, v.commune, v.cp, v.tel, v.horaires, 'approuve', v.lat, v.lon
FROM (VALUES
  (1,  'La Forge Tatouages',       'Salon de tatouage personnalisé, hygiène irréprochable, sur rendez-vous.', '12 rue de la Compagnie',   'Saint-Denis',   '97400', '0262 21 45 67', 'Mar–Sam 9h–18h',                 -20.8789, 55.4481),
  (2,  'Ink Lagon',                'Tatouages polynésiens et fineline, flash du vendredi.',                   '4 bd Hubert Delarue',      'Saint-Pierre',  '97410', '0262 48 12 30', 'Mer–Dim 10h–19h',                -21.3393, 55.4781),
  (3,  'Tindaire Tattoo',          'Blackwork et dotwork dans les Hauts.',                                    '7 chemin Hoarau',          'Saint-Paul',    '97434', '0262 53 87 91', 'Lun–Ven 9h–17h',                 -21.0096, 55.2707),
  (4,  'Chez Barbara Coiffure',    'Coupes, couleurs, tresses et soins cheveux texturés.',                    '33 rue Maréchal Leclerc',  'Saint-Denis',   '97400', '0262 41 09 22', 'Mar–Sam 8h30–18h',               -20.8823, 55.4504),
  (5,  'Tresse & Style',           'Spécialiste tresses africaines et tissages.',                             '8 rue Pasteur',            'Saint-Denis',   '97400', '0262 41 77 05', 'Lun–Sam 8h–19h',                 -20.8790, 55.4530),
  (6,  'Le K-case',                'Barbier et coiffure générale, ambiance conviviale.',                      '15 rue Curbelin',          'Le Tampon',     '97430', '0262 47 33 18', 'Mar–Sam 9h–18h30',               -21.2776, 55.5166),
  (7,  'Chez Doudou',              'Table d''hôtes créole familiale, cari massalé le mercredi.',              '2 allée des Badamiers',    'Saint-Leu',     '97436', '0262 34 85 60', 'Lun–Sam 11h30–14h30, 18h30–21h', -21.1706, 55.2876),
  (8,  'Le Flagrant Délice',       'Bistro moderne : burgers, salades et plats du jour.',                     '26 rue de Paris',          'Saint-Denis',   '97400', '0262 20 15 84', 'Lun–Ven 11h–14h30',              -20.8747, 55.4486),
  (9,  'Ti Kaz Manapany',          'Cuisine de bord de mer, poissons frais du jour.',                         '1 rue du Lagoon',          'Saint-Pierre',  '97410', '0262 39 04 76', 'Jeu–Lun 11h30–15h, 18h30–22h',   -21.3530, 55.5060),
  (10, 'L''Atelier du Goût',       'Pâtisserie-traiteur, gâteaux sur commande.',                              '19 rue de la Gare',        'Saint-Paul',    '97434', '0262 45 21 09', 'Mar–Sam 9h–18h',                 -21.0085, 55.2698),
  (11, 'Ride 974 VTC',             'VTC 24h/24, aéroport Rolland Garros, forfaits longue distance.',          NULL,                       'Sainte-Marie',  '97438', '0692 12 34 56', '24h/24, 7j/7',                   -20.8960, 55.5300),
  (12, 'Ti-Taxi de l''Ouest',      'Taxis conventionnés, mise à disposition à la demi-journée.',              'Gare routière',            'Saint-Paul',    '97434', '0692 55 66 77', 'Lun–Dim 5h–21h',                 -21.0050, 55.2700),
  (13, 'AquaPlomberie',            'Dépannage 7j/7 : fuites, chauffe-eau, rénovation salle de bain.',         NULL,                       'Saint-Denis',   '97400', '0692 44 55 66', 'Lun–Sam 7h–19h, urgences 24h/24',-20.8800, 55.4500),
  (14, 'Élec Pilon',               'Dépannage électrique, mise aux normes NF C 15-100.',                      NULL,                       'Le Tampon',     '97430', '0692 77 88 99', 'Lun–Ven 7h30–17h30',             -21.2800, 55.5150),
  (15, 'Volt Électricité',         'Installation et dépannage, devis gratuit.',                               NULL,                       'Saint-Pierre',  '97410', '0692 22 33 44', 'Lun–Ven 8h–18h',                 -21.3400, 55.4800),
  (16, 'Zoreol Squash & Padel',    'Complexe sportif : squash, padel, cours collectifs.',                     'Rue de la Victoire',       'Saint-Denis',   '97400', '0262 29 60 12', 'Lun–Dim 8h–22h',                 -20.9100, 55.4600),
  (17, 'Surf School Étang-Salé',   'Cours de surf encadrés, tous niveaux, dès 6 ans.',                        'Plage des Aigrettes',      'L''Étang-Salé', '97427', '0692 90 12 34', 'Tous les jours selon marées',    -21.2650, 55.3670),
  (18, 'Yoga Ti Zen',              'Yoga, pilates et méditation, présentiel et en ligne.',                    '5 rue du Four à Chaux',    'Saint-Pierre',  '97410', '0692 33 44 55', 'Lun–Sam 6h30–20h',               -21.3390, 55.4790),
  (19, 'Cabinet Dentaire Molitor', 'Soins dentaires, urgences le samedi matin.',                              '40 rue Molitor',           'Saint-Denis',   '97400', '0262 30 44 55', 'Lun–Ven 8h–18h, Sam 8h–12h',     -20.8760, 55.4520),
  (20, 'Optique Santé Réunion',    'Opticien-lunetier, essais et montage sur place.',                         '24 rue M. et A. Leblond',  'Saint-Paul',    '97434', '0262 45 66 77', 'Lun–Sam 8h30–17h30',             -21.0070, 55.2710),
  (21, 'Auto-École Ti Permis',     'Formation conduite B et A2, examens blancs inclus.',                      '3 rue Hubert Delarue',     'Le Tampon',     '97430', '0262 47 88 99', 'Lun–Ven 9h–17h, Sam 9h–12h',     -21.2790, 55.5180),
  (22, 'Soutien Scolaire 974',     'Cours de maths et français, petits groupes.',                             NULL,                       'Saint-Denis',   '97400', '0692 66 77 88', 'Lun–Ven 17h–19h30',              -20.8810, 55.4510),
  (23, 'Photographe Kader G.',     'Mariages, événements, portraits en studio.',                              '12 rue Éloi',              'Saint-Pierre',  '97410', '0692 10 20 30', 'Sur rendez-vous',                -21.3380, 55.4770),
  (24, 'Kaz à Vélo',               'Location et réparation de vélos, VTT et VA dans l''Ouest.',               'Port Ouest',               'Saint-Leu',     '97436', '0262 34 12 78', 'Lun–Dim 8h30–18h',               -21.1720, 55.2880)
) AS v(id, nom, description, adresse, commune, cp, tel, horaires, lat, lon)
WHERE NOT EXISTS (SELECT 1 FROM commerces c WHERE c.id = v.id);

-- 4. LIENS COMMERCE ↔ CATÉGORIE
INSERT INTO commerce_categories (commerce_id, categorie_id)
SELECT v.commerce_id, v.categorie_id
FROM (VALUES
  (1,1),(2,1),(3,1),          -- Tatoueur
  (4,2),(5,2),(6,2),          -- Coiffeur
  (7,3),(8,3),(9,3),(10,3),   -- Restaurant
  (11,4),(12,4),              -- VTC/Taxi
  (13,5),                     -- Plombier
  (14,6),(15,6),              -- Électricien
  (16,7),(17,7),(18,7),       -- Cours/Sport
  (19,8),(20,8),              -- Santé
  (21,9),(22,9),              -- Éducation
  (23,10),(24,10)             -- Autre
) AS v(commerce_id, categorie_id)
WHERE NOT EXISTS (
  SELECT 1 FROM commerce_categories cc
  WHERE cc.commerce_id = v.commerce_id AND cc.categorie_id = v.categorie_id
);

-- 5. UTILISATEURS de démo (nécessaires pour les avis — FK utilisateur_id)
INSERT INTO utilisateurs (id, prenom, nom, role)
SELECT v.id, v.prenom, v.nom, 'client'
FROM (VALUES
  (1, 'Mimi', 'D.'),  (2, 'Jean-Yves', 'P.'), (3, 'Laura', 'G.'), (4, 'Saïd', 'R.'),
  (5, 'Nadia', 'M.'), (6, 'Bruno', 'L.'),    (7, 'Vanessa', 'H.'), (8, 'Pascal', 'F.')
) AS v(id, prenom, nom)
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs u WHERE u.id = v.id);

-- 6. AVIS (liés aux utilisateurs de démo)
INSERT INTO avis (id, commerce_id, utilisateur_id, note, commentaire, cree_le)
SELECT v.id, v.commerce_id, v.utilisateur_id, v.note, v.commentaire, now() - make_interval(days => v.jours)
FROM (VALUES
  (1, 7,  1, 5, 'Le cari massalé est une tuerie ! Accueil au top.',          18),
  (2, 7,  2, 5, 'Cuisine familiale comme à la maison. On reviendra.',        34),
  (3, 1,  3, 5, 'Travail propre et à l''écoute, je recommande.',             27),
  (4, 11, 4, 5, 'Ponctuel et conduit souplement, parfait pour l''aéroport.', 16),
  (5, 13, 5, 4, 'Intervention rapide le dimanche, tarif correct.',           60),
  (6, 17, 6, 5, 'Super pédagogue avec les enfants, on a pris plaisir.',      46),
  (7, 4,  7, 4, 'Très satisfaite des tresses, ambiance sympa.',              12),
  (8, 24, 8, 5, 'VTT révisé en une heure, équipe pro.',                       21)
) AS v(id, commerce_id, utilisateur_id, note, commentaire, jours)
WHERE NOT EXISTS (SELECT 1 FROM avis a WHERE a.id = v.id);

-- 7. NOTIFICATIONS globales
INSERT INTO notifications (titre, message, type, est_lu, cree_le)
SELECT v.titre, v.message, v.type, false, now() - make_interval(days => v.jours)
FROM (VALUES
  ('Nouveau commerce', 'La Forge Tatouages a rejoint l''annuaire 🎉', 'nouveau', 7),
  ('Promotion',        'Le Flagrant Délice : -20 % sur les burgers jusqu''à vendredi.', 'promo', 8),
  ('Astuce',           'Ajoute tes commerces préférés aux favoris pour les retrouver hors-ligne.', 'astuce', 12)
) AS v(titre, message, type, jours)
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n WHERE n.titre = v.titre AND n.message = v.message
);

-- 8. RECALCUL des notes moyennes
UPDATE commerces c
SET note_moyenne = ROUND(sub.avg_note, 2)
FROM (
  SELECT commerce_id, ROUND(AVG(note)::numeric, 2) AS avg_note
  FROM avis GROUP BY commerce_id
) sub
WHERE c.id = sub.commerce_id;

-- ═══ Vérification ═══
SELECT 'categories' AS t, COUNT(*) FROM categories
UNION ALL SELECT 'communes',     COUNT(*) FROM communes
UNION ALL SELECT 'commerces',    COUNT(*) FROM commerces
UNION ALL SELECT 'liaisons',     COUNT(*) FROM commerce_categories
UNION ALL SELECT 'avis',         COUNT(*) FROM avis
UNION ALL SELECT 'utilisateurs', COUNT(*) FROM utilisateurs
UNION ALL SELECT 'notifications',COUNT(*) FROM notifications;
