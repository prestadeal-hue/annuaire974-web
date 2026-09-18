# Contribuer à Annuaire 974 — le guide de l'agent

> Pour **Aura** et **Jimmy** (18/09/2026). Avant ce fichier, chaque modification
> passait par Saïdou et par Buffy : non pas par manque de droits, mais parce que
> rien n'expliquait où était le dépôt ni avec quoi pousser. Voilà les deux.

## Ce que tu as, et rien de plus

Une **deploy key d'écriture sur ce dépôt uniquement** (`annuaire974-web`). Elle
ouvre cette porte et **aucune autre** : ni `tisite.re`, ni `vem-saint-pierre`, ni
le dépôt privé `wdl`, ni le compte GitHub de Saïdou. Ses commits portent
`Jimmy (agent)` comme auteur — un commit d'agent doit se reconnaître.

Rien à configurer : c'est déjà dans l'environnement de la sandbox.

| | |
|---|---|
| **Le dépôt, vu de la sandbox** | `/annuaire974` (déjà monté, aucun clone à faire) |
| **Le remote à utiliser** | `deploy` — **pas** `origin` (lui est en HTTPS, sans droits d'écriture) |
| **L'identité des commits** | `Jimmy (agent)` — déjà réglée, ne pas la changer |
| **Le dépôt est PUBLIC** | donc **lire** ne demande rien, et **tout ce qui est poussé est visible** |

## La boucle de travail

```bash
cd /annuaire974

git pull --rebase deploy main        # 1. partir de la dernière version
#   … modifier …

npm run typecheck                    # 2. les deux contrôles que la CI exige
npm run check-secrets
npm run build                        #    (facultatif, mais il dit la vérité)

git add -A && git commit -m "…"      # 3. un message qui dit POURQUOI
git push deploy main                 # 4. en production dans les ~2 minutes
```

**Si le push est refusé** (`non-fast-forward`), quelqu'un a poussé avant toi :
`git pull --rebase deploy main`, relance les contrôles, pousse. **Jamais
`--force`** : sur ce dépôt, un force-push peut effacer le travail d'un autre.

## Les trois règles

1. **Aucun secret, jamais.** Le dépôt est public : une clé poussée est une clé
   publiée, même si le commit est retiré dix secondes plus tard (elle reste dans
   l'historique et dans les caches de GitHub). `npm run check-secrets` cherche les
   motifs connus — il ne remplace pas la prudence. Les clés vivent dans les
   **secrets Supabase** ou dans l'environnement, jamais dans un fichier suivi.
2. **Un push sur `main` est une mise en production.** GitHub Pages publie dans les
   deux minutes, pour tout le monde. Il n'y a pas de brouillon.
3. **La CI garde, mais elle ne juge pas.** `typecheck` et `check-secrets` tournent
   dans le workflow **avant** le build : un push cassé fait un run rouge et Pages
   **garde la dernière bonne version** — le site ne se casse pas, mais ton commit
   est bien sur `main`. Donc pousse quelque chose dont tu es content.

## Deux adresses, et une seule se met à jour toute seule

| Adresse | Ce qui la publie |
|---|---|
| `prestadeal-hue.github.io/annuaire974-web` | **automatique** — à chaque push sur `main`, ~2 min |
| `tisite.re/annuaire974` | **à la main** — `cd /annuaire974 && VITE_BASE=/annuaire974/ npm run build && bash /usr/local/bin/deploy-annuaire.sh` |

C'est le piège le plus bête de ce dépôt : pousser, vérifier GitHub Pages, croire
que c'est fini — et Saïdou regarde `tisite.re`, où rien n'a bougé. **Après un
push qui doit se voir, lance le deploy et vérifie le `200`.**

## Ce que la CI ne fait pas — et c'est à savoir

**La fonction Edge de l'assistant n'est déployée par personne d'automatique.**
`supabase/functions/chat/index.ts` part sur `main` comme le reste, mais la
fonction qui tourne chez Supabase est **collée à la main** dans le tableau de
bord (Edge Functions → *Deploy updates*). Modifier le fichier ne change donc
**rien** tant que ce geste n'est pas fait — c'est exactement le piège rencontré
le 18/09 : le code avait changé dans le dépôt, la fonction en ligne, non. Dis-le
à Saïdou quand tu touches à ce fichier.

De même, `npm run check-agent` interroge la fonction **réellement déployée** :
c'est le seul contrôle qui dit si les deux sont d'accord.

## Quand tu ne sais pas

**Tu t'arrêtes et tu demandes.** Ce dépôt n'a ni PR obligatoire ni relecteur :
c'est la confiance qui tient le clavier, et elle se perd sur une supposition
poussée en production. Trois cas où l'on demande *avant* de pousser :

- une modification qui touche **l'argent** (le plafond de l'assistant, l'abonnement) ;
- une modification qui touche **les données de quelqu'un** (une table Supabase, une
  suppression) ;
- une chose qui te ferait dire « ça devrait aller » — ce « devrait » est justement
  le moment d'appeler.

## Ce qui existe déjà, et qu'il ne faut pas réécrire

| Fichier | Rôle |
|---|---|
| `README.md` | l'état du produit : fonctions, charte, déploiement, secrets |
| `scripts/check-secrets.mjs` | ce qui est poussé ne doit contenir aucun secret |
| `scripts/check-agent.mjs` | l'assistant **en ligne** : numéros réels, aucun commerce inventé, plafond actif |
| `scripts/assistant-limite.sql` | la table du plafond par IP (déjà créée côté Supabase) |
| `.github/workflows/deploy.yml` | typecheck + secrets → build → Pages |
