-- ═══════════════════════════════════════════════════════════════════════
--  ANNUAIRE 974 — Plafond de l'assistant, par adresse IP
--
--  POURQUOI ICI ET PAS DANS LA FONCTION : la fonction Edge tourne sur plusieurs
--  instances en parallèle, et deux instances ne se parlent pas. Un compteur en
--  mémoire ne protégerait donc rien (il suffit de tomber sur une autre instance,
--  et on repart à zéro). Le compteur doit être PARTAGÉ, donc dans la base.
--
--  À QUOI ÇA SERT : l'assistant appelle un modèle qui PAIE, et son endpoint est
--  public (« Verify JWT » doit être désactivé avec les clés 2026). Sans plafond,
--  qui connaît l'URL peut vider le crédit MiMo. 20 questions par minute et par IP
--  ne gênent personne qui discute : ça gêne un script.
--
--  ▸ Exécution : Supabase → SQL Editor → coller → Run
--  ▸ Idempotent : CREATE ... IF NOT EXISTS + CREATE OR REPLACE
--  ▸ Facultatif au sens strict : sans ce script, la fonction laisse passer (elle
--    le note dans ses journaux). Avec, le plafond s'applique.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Le compteur : une ligne par IP et par minute.
CREATE TABLE IF NOT EXISTS public.assistant_appels (
  ip     text        NOT NULL,
  minute timestamptz NOT NULL,
  appels integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, minute)
);

-- Aucune policy : personne ne lit cette table depuis l'extérieur, pas même la clé
-- publique. Seule la fonction y accède (via la clé de service, et par la fonction
-- SQL ci-dessous — qui est le seul chemin autorisé).
ALTER TABLE public.assistant_appels ENABLE ROW LEVEL SECURITY;

-- Index pour le ménage : on supprime par ancienneté, pas par IP.
CREATE INDEX IF NOT EXISTS assistant_appels_minute_idx ON public.assistant_appels (minute);

-- 2. La fonction atomique : incrémenter PUIS décider, en une seule requête.
--    Atomique parce que l'INSERT ... ON CONFLICT ... RETURNING se fait dans une
--    transaction : deux requêtes simultanées de la même IP ne peuvent pas lire
--    toutes les deux « 19 » et croire qu'il reste de la place.
CREATE OR REPLACE FUNCTION public.compter_appel(p_ip text, p_max integer DEFAULT 20)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appels integer;
BEGIN
  -- Pas d'IP identifiable (cas rare) : on ne compte pas, on laisse passer.
  IF p_ip IS NULL OR btrim(p_ip) = '' THEN
    RETURN true;
  END IF;

  INSERT INTO public.assistant_appels (ip, minute, appels)
  VALUES (left(p_ip, 64), date_trunc('minute', now()), 1)
  ON CONFLICT (ip, minute)
    DO UPDATE SET appels = public.assistant_appels.appels + 1
  RETURNING appels INTO v_appels;

  -- Ménage opportuniste : une requête sur mille efface l'historique d'il y a plus
  -- d'une heure. Pas de tâche planifiée à maintenir pour trois lignes de code.
  IF random() < 0.001 THEN
    DELETE FROM public.assistant_appels WHERE minute < now() - interval '1 hour';
  END IF;

  RETURN v_appels <= p_max;
END;
$$;

-- 3. Qui peut appeler cette fonction SQL : la clé de service, et personne d'autre.
--    Sans ce REVOKE, la clé publique (`sb_publishable_…`) pourrait incrémenter le
--    compteur d'une autre IP — donc bloquer quelqu'un d'autre. C'est exactement le
--    genre de porte qu'on laisse ouverte sans y penser.
REVOKE ALL ON FUNCTION public.compter_appel(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compter_appel(text, integer) TO service_role;

NOTIFY pgrst, 'reload schema';

-- ═══ Vérification (à exécuter à part, avec la clé de SERVICE) :
-- curl -s -X POST "https://rjsshcmszhxmldzucuqh.supabase.co/rest/v1/rpc/compter_appel" \
--   -H "apikey: sb_secret_..." -H "Content-Type: application/json" \
--   -d '{"p_ip":"203.0.113.7","p_max":2}'
-- → true, puis true, puis false (la 3e dépasse le plafond de 2)
