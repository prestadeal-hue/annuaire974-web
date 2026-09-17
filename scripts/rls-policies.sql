-- ═══════════════════════════════════════════════════════════════════════
--  ANNUAIRE 974 — Policies RLS
--  Constat : les tables contiennent des données mais la clé publique
--  (sb_publishable_…) reçoit 0 ligne → aucune policy de lecture anonyme.
--
--  ▸ Exécution : Supabase → SQL Editor → coller → Run
--  ▸ Idempotent : DROP POLICY IF EXISTS avant chaque CREATE
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Activer RLS partout (bonne pratique, même pour de la lecture publique)
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerces           ENABLE ROW LEVEL SECURITY;
ALTER TABLE commerce_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoris             ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE recherches          ENABLE ROW LEVEL SECURITY;

-- 2. LECTURE PUBLIQUE — le contenu de l'annuaire est public par nature
DROP POLICY IF EXISTS public_read ON categories;
CREATE POLICY public_read ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS public_read ON communes;
CREATE POLICY public_read ON communes FOR SELECT USING (true);

DROP POLICY IF EXISTS public_read ON commerces;
CREATE POLICY public_read ON commerces FOR SELECT USING (true);

DROP POLICY IF EXISTS public_read ON commerce_categories;
CREATE POLICY public_read ON commerce_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS public_read ON avis;
CREATE POLICY public_read ON avis FOR SELECT USING (true);

-- Notifications globales lisibles ; les lignes ciblées (utilisateur_id non null)
-- peuvent être filtrées plus tard quand l'auth sera branchée.
DROP POLICY IF EXISTS public_read ON notifications;
CREATE POLICY public_read ON notifications FOR SELECT USING (true);

-- 3. ÉCRITURE — insertion d'avis depuis le formulaire public.
--    L'anti-spam reste du ressort de l'API (agent Feedback) ; si tu préfères
--    fermer, supprime ces 2 policy et passe uniquement par l'API REST.
DROP POLICY IF EXISTS public_insert ON avis;
CREATE POLICY public_insert ON avis FOR INSERT WITH CHECK (true);

-- 4. RESTRICTION — tout le reste reste fermé :
--    favoris, utilisateurs, recherches : aucune policy → invisible/anon,
--    écritures réservées à l'API (service_role) ou aux utilisateurs authentifiés.
--    (L'embed PostgREST avis→utilisateurs renverra null pour anon : l'app
--    affiche alors « Membre 974 » comme pseudo.)

-- 5. Rafraîchir le cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';

-- ═══ Vérification (à exécuter à part, avec la clé publique) :
-- curl "https://rjsshcmszhxmldzucuqh.supabase.co/rest/v1/commerces?select=nom&limit=5" \
--   -H "apikey: sb_publishable_xEJPj9ryr5Eygw_YnxkSHQ_u7_Z3FIE"
-- → doit renvoyer les 5 premiers commerces au lieu de []
