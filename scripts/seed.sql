-- ═══════════════════════════════════════════════════════════════════════
--  ANNUAIRE 974 — Seed FINAL — écrit d'après le schéma complet
--  (information_schema), plus aucune devinette. Idempotent.
--
--  Choix clés :
--    • statut, est_verifie, nombre_avis : OMITTES (nullable → défaut/NULL,
--      recalculés en section 6) — évite les erreurs d'enum
--    • adresse NOT NULL → jamais NULL
--    • horaires jsonb → to_jsonb(texte affichable)
--    • communes.code_postal UNIQUE → 24 codes distincts
--    • utilisateurs.email + mot_de_passe_hash NOT NULL → email factice,
--      hash vide : aucune connexion possible (comptes de démo uniquement)
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. COMMUNES (24) ─────────────────────────────────────────────────
INSERT INTO communes (id, nom, code_postal)
SELECT v.id, v.nom, v.cp
FROM (VALUES
  (gen_random_uuid(),'Saint-Denis','97400'),
  (gen_random_uuid(),'Saint-Paul','97460'),
  (gen_random_uuid(),'Saint-Pierre','97410'),
  (gen_random_uuid(),'Le Tampon','97430'),
  (gen_random_uuid(),'Saint-André','97440'),
  (gen_random_uuid(),'Saint-Louis','97450'),
  (gen_random_uuid(),'Le Port','97420'),
  (gen_random_uuid(),'La Possession','97419'),
  (gen_random_uuid(),'Saint-Leu','97436'),
  (gen_random_uuid(),'Sainte-Marie','97438'),
  (gen_random_uuid(),'Sainte-Suzanne','97441'),
  (gen_random_uuid(),'Bras-Panon','97412'),
  (gen_random_uuid(),'Salazie','97433'),
  (gen_random_uuid(),'Entre-Deux','97414'),
  (gen_random_uuid(),'Les Avirons','97425'),
  (gen_random_uuid(),'Petite-Île','97429'),
  (gen_random_uuid(),'Saint-Philippe','97442'),
  (gen_random_uuid(),'Sainte-Rose','97439'),
  (gen_random_uuid(),'Saint-Benoît','97470'),
  (gen_random_uuid(),'Saint-Joseph','97480'),
  (gen_random_uuid(),'Cilaos','97413'),
  (gen_random_uuid(),'La Plaine-des-Palmistes','97431'),
  (gen_random_uuid(),'Trois-Bassins','97126'),
  (gen_random_uuid(),'L''Étang-Salé','97426')
) AS v(id, nom, cp)
WHERE NOT EXISTS (SELECT 1 FROM communes c WHERE c.nom = v.nom);

-- ── 2. COMMERCE (24) — statut omis (nullable), adresse toujours remplie ──
INSERT INTO commerces (id, nom, slug, description, adresse, commune, code_postal, telephone, horaires, note_moyenne, latitude, longitude)
SELECT v.id, v.nom, v.slug, v.description, v.adresse, v.commune, v.cp, v.tel, to_jsonb(v.horaires), v.note, v.lat, v.lon
FROM (VALUES
  (gen_random_uuid(),'La Forge Tatouages','la-forge-tatouages','Salon de tatouage personnalisé, hygiène irréprochable, sur rendez-vous.','12 rue de la Compagnie','Saint-Denis','97400','0262 21 45 67','Mar–Sam 9h–18h',4.8,-20.8789,55.4481),
  (gen_random_uuid(),'Ink Lagon','ink-lagon','Tatouages polynésiens et fineline, flash du vendredi.','4 bd Hubert Delarue','Saint-Pierre','97410','0262 48 12 30','Mer–Dim 10h–19h',4.6,-21.3393,55.4781),
  (gen_random_uuid(),'Tindaire Tattoo','tindaire-tattoo','Blackwork et dotwork dans les Hauts.','7 chemin Hoarau','Saint-Paul','97434','0262 53 87 91','Lun–Ven 9h–17h',4.9,-21.0096,55.2707),
  (gen_random_uuid(),'Chez Barbara Coiffure','chez-barbara-coiffure','Coupes, couleurs, tresses et soins cheveux texturés.','33 rue Maréchal Leclerc','Saint-Denis','97400','0262 41 09 22','Mar–Sam 8h30–18h',4.7,-20.8823,55.4504),
  (gen_random_uuid(),'Tresse & Style','tresse-style','Spécialiste tresses africaines et tissages.','8 rue Pasteur','Saint-Denis','97400','0262 41 77 05','Lun–Sam 8h–19h',4.5,-20.8790,55.4530),
  (gen_random_uuid(),'Le K-case','le-k-case','Barbier et coiffure générale, ambiance conviviale.','15 rue Curbelin','Le Tampon','97430','0262 47 33 18','Mar–Sam 9h–18h30',4.4,-21.2776,55.5166),
  (gen_random_uuid(),'Chez Doudou','chez-doudou','Table d''hôtes créole familiale, cari massalé le mercredi.','2 allée des Badamiers','Saint-Leu','97436','0262 34 85 60','Lun–Sam 11h30–14h30, 18h30–21h',4.9,-21.1706,55.2876),
  (gen_random_uuid(),'Le Flagrant Délice','le-flagrant-delice','Bistro moderne : burgers, salades et plats du jour.','26 rue de Paris','Saint-Denis','97400','0262 20 15 84','Lun–Ven 11h–14h30',4.3,-20.8747,55.4486),
  (gen_random_uuid(),'Ti Kaz Manapany','ti-kaz-manapany','Cuisine de bord de mer, poissons frais du jour.','1 rue du Lagoon','Saint-Pierre','97410','0262 39 04 76','Jeu–Lun 11h30–15h, 18h30–22h',4.6,-21.3530,55.5060),
  (gen_random_uuid(),'L''Atelier du Goût','latelier-du-gout','Pâtisserie-traiteur, gâteaux sur commande.','19 rue de la Gare','Saint-Paul','97434','0262 45 21 09','Mar–Sam 9h–18h',4.8,-21.0085,55.2698),
  (gen_random_uuid(),'Ride 974 VTC','ride-974-vtc','VTC 24h/24, aéroport Rolland Garros, forfaits longue distance.','Aéroport Rolland Garros','Sainte-Marie','97438','0692 12 34 56','24h/24, 7j/7',4.7,-20.8960,55.5300),
  (gen_random_uuid(),'Ti-Taxi de l''Ouest','ti-taxi-de-l-ouest','Taxis conventionnés, mise à disposition à la demi-journée.','Gare routière de Saint-Paul','Saint-Paul','97434','0692 55 66 77','Lun–Dim 5h–21h',4.2,-21.0050,55.2700),
  (gen_random_uuid(),'AquaPlomberie','aquaplomberie','Dépannage 7j/7 : fuites, chauffe-eau, rénovation salle de bain.','Interventions sur toute l''île','Saint-Denis','97400','0692 44 55 66','Lun–Sam 7h–19h, urgences 24h/24',4.5,-20.8800,55.4500),
  (gen_random_uuid(),'Élec Pilon','elec-pilon','Dépannage électrique, mise aux normes NF C 15-100.','Interventions sur le Sud','Le Tampon','97430','0692 77 88 99','Lun–Ven 7h30–17h30',4.6,-21.2800,55.5150),
  (gen_random_uuid(),'Volt Électricité','volt-electricite','Installation et dépannage, devis gratuit.','Interventions sur le Sud','Saint-Pierre','97410','0692 22 33 44','Lun–Ven 8h–18h',4.4,-21.3400,55.4800),
  (gen_random_uuid(),'Zoreol Squash & Padel','zoreol-squash-padel','Complexe sportif : squash, padel, cours collectifs.','Rue de la Victoire','Saint-Denis','97400','0262 29 60 12','Lun–Dim 8h–22h',4.5,-20.9100,55.4600),
  (gen_random_uuid(),'Surf School Étang-Salé','surf-school-etang-sale','Cours de surf encadrés, tous niveaux, dès 6 ans.','Plage des Aigrettes','L''Étang-Salé','97426','0692 90 12 34','Tous les jours selon marées',4.9,-21.2650,55.3670),
  (gen_random_uuid(),'Yoga Ti Zen','yoga-ti-zen','Yoga, pilates et méditation, présentiel et en ligne.','5 rue du Four à Chaux','Saint-Pierre','97410','0692 33 44 55','Lun–Sam 6h30–20h',4.8,-21.3390,55.4790),
  (gen_random_uuid(),'Cabinet Dentaire Molitor','cabinet-dentaire-molitor','Soins dentaires, urgences le samedi matin.','40 rue Molitor','Saint-Denis','97400','0262 30 44 55','Lun–Ven 8h–18h, Sam 8h–12h',4.3,-20.8760,55.4520),
  (gen_random_uuid(),'Optique Santé Réunion','optique-sante-reunion','Opticien-lunetier, essais et montage sur place.','24 rue Marius et Ary Leblond','Saint-Paul','97434','0262 45 66 77','Lun–Sam 8h30–17h30',4.6,-21.0070,55.2710),
  (gen_random_uuid(),'Auto-École Ti Permis','auto-ecole-ti-permis','Formation conduite B et A2, examens blancs inclus.','3 rue Hubert Delarue','Le Tampon','97430','0262 47 88 99','Lun–Ven 9h–17h, Sam 9h–12h',4.4,-21.2790,55.5180),
  (gen_random_uuid(),'Soutien Scolaire 974','soutien-scolaire-974','Cours de maths et français, petits groupes.','Cours à domicile et en ligne','Saint-Denis','97400','0692 66 77 88','Lun–Ven 17h–19h30',4.7,-20.8810,55.4510),
  (gen_random_uuid(),'Photographe Kader G.','photographe-kader-g','Mariages, événements, portraits en studio.','12 rue Éloi','Saint-Pierre','97410','0692 10 20 30','Sur rendez-vous',4.8,-21.3380,55.4770),
  (gen_random_uuid(),'Kaz à Vélo','kaz-a-velo','Location et réparation de vélos, VTT et VA dans l''Ouest.','Port Ouest','Saint-Leu','97436','0262 34 12 78','Lun–Dim 8h30–18h',4.6,-21.1720,55.2880)
) AS v(id, nom, slug, description, adresse, commune, cp, tel, horaires, note, lat, lon)
WHERE NOT EXISTS (SELECT 1 FROM commerces c WHERE c.slug = v.slug);

-- ── 3. LIAISONS N-N commerce ↔ catégorie ────────────────────────────
INSERT INTO commerce_categories (commerce_id, categorie_id)
SELECT c.id, k.id
FROM commerces c
JOIN categories k ON k.slug = (
  CASE c.slug
    WHEN 'la-forge-tatouages' THEN 'tatoueur'
    WHEN 'ink-lagon' THEN 'tatoueur'
    WHEN 'tindaire-tattoo' THEN 'tatoueur'
    WHEN 'chez-barbara-coiffure' THEN 'coiffeur'
    WHEN 'tresse-style' THEN 'coiffeur'
    WHEN 'le-k-case' THEN 'coiffeur'
    WHEN 'chez-doudou' THEN 'restaurant'
    WHEN 'le-flagrant-delice' THEN 'restaurant'
    WHEN 'ti-kaz-manapany' THEN 'restaurant'
    WHEN 'latelier-du-gout' THEN 'restaurant'
    WHEN 'ride-974-vtc' THEN 'vtc-taxi'
    WHEN 'ti-taxi-de-l-ouest' THEN 'vtc-taxi'
    WHEN 'aquaplomberie' THEN 'plombier'
    WHEN 'elec-pilon' THEN 'electricien'
    WHEN 'volt-electricite' THEN 'electricien'
    WHEN 'zoreol-squash-padel' THEN 'cours-sport'
    WHEN 'surf-school-etang-sale' THEN 'cours-sport'
    WHEN 'yoga-ti-zen' THEN 'cours-sport'
    WHEN 'cabinet-dentaire-molitor' THEN 'sante'
    WHEN 'optique-sante-reunion' THEN 'sante'
    WHEN 'auto-ecole-ti-permis' THEN 'education'
    WHEN 'soutien-scolaire-974' THEN 'education'
    WHEN 'photographe-kader-g' THEN 'autre'
    WHEN 'kaz-a-velo' THEN 'autre'
  END
)
WHERE NOT EXISTS (SELECT 1 FROM commerce_categories cc WHERE cc.commerce_id = c.id AND cc.categorie_id = k.id);

-- ── 4. UTILISATEURS de démo — email UNIQUE factice, hash vide :
--      aucun mot de passe ne fonctionne, c'est purement décoratif.
INSERT INTO utilisateurs (id, email, mot_de_passe_hash, prenom, nom, role)
SELECT gen_random_uuid(),
       'demo+' || lower(v.prenom) || replace(lower(v.nom), '.', '') || '@annuaire974.re',
       '', v.prenom, v.nom, NULL
FROM (VALUES
  ('Mimi','D.'),('Jean-Yves','P.'),('Laura','G.'),('Saïd','R.'),
  ('Nadia','M.'),('Bruno','L.'),('Vanessa','H.'),('Pascal','F.')
) AS v(prenom, nom)
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs u
                  WHERE u.prenom = v.prenom AND u.nom = v.nom);

-- ── 5. AVIS — statut omis (nullable), note 1-5 ──────────────────────
INSERT INTO avis (id, commerce_id, utilisateur_id, note, commentaire, cree_le)
SELECT gen_random_uuid(), c.id, u.id, v.note, v.commentaire, now() - make_interval(days => v.jours)
FROM (VALUES
  ('chez-doudou','Mimi','D.',5,'Le cari massalé est une tuerie ! Accueil au top.',18),
  ('chez-doudou','Jean-Yves','P.',5,'Cuisine familiale comme à la maison. On reviendra.',34),
  ('la-forge-tatouages','Laura','G.',5,'Travail propre et à l''écoute, je recommande.',27),
  ('ride-974-vtc','Saïd','R.',5,'Ponctuel et conduit souplement, parfait pour l''aéroport.',16),
  ('aquaplomberie','Nadia','M.',4,'Intervention rapide le dimanche, tarif correct.',60),
  ('surf-school-etang-sale','Bruno','L.',5,'Super pédagogue avec les enfants, on a pris plaisir.',46),
  ('chez-barbara-coiffure','Vanessa','H.',4,'Très satisfaite des tresses, ambiance sympa.',12),
  ('kaz-a-velo','Pascal','F.',5,'VTT révisé en une heure, équipe pro.',21)
) AS v(comslug, prenom, nom, note, commentaire, jours)
JOIN commerces c    ON c.slug = v.comslug
JOIN utilisateurs u ON u.prenom = v.prenom AND u.nom = v.nom
WHERE NOT EXISTS (SELECT 1 FROM avis a WHERE a.commerce_id = c.id AND a.commentaire = v.commentaire);

-- ── 6. RECALCUL note_moyenne + nombre_avis ──────────────────────────
UPDATE commerces c
SET note_moyenne = sub.avg_note,
    nombre_avis  = sub.nb
FROM (
  SELECT commerce_id, ROUND(AVG(note)::numeric, 2) AS avg_note, COUNT(*) AS nb
  FROM avis GROUP BY commerce_id
) sub
WHERE c.id = sub.commerce_id;

-- ── 7. NOTIFICATIONS — type est un enum NOT NULL : on essaie les valeurs
--      les plus probables et on s'arrête à la première qui passe.
DO $$
DECLARE
  candidats text[] := ARRAY['info','general','nouveau','systeme','annonce'];
  ok boolean := false;
  c text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM notifications) THEN
    FOREACH c IN ARRAY candidats LOOP
      BEGIN
        INSERT INTO notifications (type, titre, message, est_lu, cree_le) VALUES
          (c::text, 'Bienvenue', 'L''annuaire 974 est en ligne ! Découvre les commerces près de chez toi.', false, now() - interval '1 day');
        ok := true;
        EXIT;
      EXCEPTION WHEN others THEN
        ok := false;
      END;
    END LOOP;
    IF NOT ok THEN
      RAISE NOTICE 'Aucune valeur de l''enum notifications.type ne convient — vérifie avec: SELECT unnest(enum_range(NULL::text)) FROM pg_type WHERE typname = (SELECT udt_name FROM information_schema.columns WHERE table_name=''notifications'' AND column_name=''type'');';
    END IF;
  END IF;
END $$;

-- ── 8. RPC : publier un avis depuis l'app sans compte ───────────────
CREATE OR REPLACE FUNCTION publier_avis(p_commerce_id uuid, p_pseudo text, p_note int, p_commentaire text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_prenom text;
  v_nom text;
BEGIN
  IF p_note < 1 OR p_note > 5 THEN
    RAISE EXCEPTION 'note entre 1 et 5';
  END IF;
  IF length(trim(p_commentaire)) < 5 THEN
    RAISE EXCEPTION 'commentaire trop court';
  END IF;

  v_prenom := split_part(trim(p_pseudo), ' ', 1);
  v_nom    := nullif(trim(substring(trim(p_pseudo) from position(' ' in trim(p_pseudo)) + 1)), '');
  IF v_nom IS NULL THEN v_nom := '.'; END IF;

  SELECT id INTO v_user FROM utilisateurs WHERE prenom = v_prenom AND nom = v_nom LIMIT 1;
  IF v_user IS NULL THEN
    INSERT INTO utilisateurs (id, email, mot_de_passe_hash, prenom, nom)
    VALUES (gen_random_uuid(),
            'avis+' || lower(replace(v_prenom, ' ', '')) || floor(random() * 100000)::text || '@annuaire974.re',
            '', v_prenom, v_nom)
    RETURNING id INTO v_user;
  END IF;

  INSERT INTO avis (id, commerce_id, utilisateur_id, note, commentaire)
  VALUES (gen_random_uuid(), p_commerce_id, v_user, p_note, trim(p_commentaire));

  -- Tenir à jour la note et le nombre d'avis
  UPDATE commerces c
  SET note_moyenne = ROUND(AVG(a.note)::numeric, 2), nombre_avis = COUNT(*)
  FROM avis a WHERE a.commerce_id = p_commerce_id AND c.id = p_commerce_id;
END;
$$;

DROP POLICY IF EXISTS rpc_avis ON avis;
CREATE POLICY rpc_avis ON avis FOR INSERT WITH CHECK (true);
GRANT EXECUTE ON FUNCTION publier_avis(uuid, text, int, text) TO anon, authenticated;

-- ── Vérification finale ─────────────────────────────────────────────
SELECT 'communes' AS t, COUNT(*) FROM communes
UNION ALL SELECT 'commerces', COUNT(*) FROM commerces
UNION ALL SELECT 'liaisons', COUNT(*) FROM commerce_categories
UNION ALL SELECT 'utilisateurs', COUNT(*) FROM utilisateurs
UNION ALL SELECT 'avis', COUNT(*) FROM avis
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications;
