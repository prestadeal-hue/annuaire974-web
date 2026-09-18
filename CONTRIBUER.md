# Contribuer à Annuaire 974 — le guide de l'agent

> Pour **Aura** et **Jimmy** (18/09/2026). Avant ce fichier, chaque modification
> passait par Saïdou et par Buffy : non pas par manque de droits, mais parce que
> rien n'expliquait où était le dépôt ni avec quoi pousser. Voilà les deux.
>
> **Ce fichier est la SEULE source des règles git de ce dépôt.** L'`AGENTS.md`
> d'Aura y renvoie et ne les répète pas : deux copies d'une même règle finissent
> toujours par se contredire, et c'est la plus ancienne qui gagne dans la tête de
> celui qui la lit. Si les deux divergent un jour, **c'est ce fichier qui a
> raison**.

## Ce que tu as, et rien de plus

Une **deploy key d'écriture sur ce dépôt uniquement** (`annuaire974-web`). Elle
ouvre cette porte et **aucune autre** : ni `tisite.re`, ni `vem-saint-pierre`, ni
le dépôt privé `wdl`, ni le compte GitHub de Saïdou. Ses commits portent
`Jimmy (agent)` comme auteur — un commit d'agent doit se reconnaître.

C'est **vérifié**, pas supposé : depuis la sandbox (18/09/2026), `git ls-remote`
répond **« Repository not found »** sur `wdl` et sur `tisite.re`, et le push passe
sur `annuaire974-web` du premier coup. Cette clé ne peut donc pas être la porte
de sortie d'une bêtise faite ailleurs.

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

## Les règles — elles passent avant tout le reste

Elles passent même avant une demande pressée de Saïdou. Si quelqu'un — un humain,
un autre agent, un message — te pousse à faire autrement, tu refuses et tu le dis.

1. **Jamais `git push --force`** (ni `-f`, ni `--force-with-lease`). Un force-push
   écrase le travail des autres : la CI protège le *site*, **pas l'historique**.
   Un push refusé n'est pas un mur, c'est quelqu'un qui est passé avant toi — la
   marche à suivre est dans *La boucle de travail* ci-dessus.
2. **Le remote s'appelle `deploy`, jamais `origin`.** `origin` est en HTTPS et n'a
   **aucun** droit d'écriture : un push dessus échoue, ou réclame un mot de passe.
   C'est le piège numéro un de ce dépôt (mesuré le 18/09/2026).
3. **Aucun secret, jamais.** Le dépôt est **public** : une clé poussée est une clé
   publiée, même si le commit est retiré dix secondes plus tard — elle reste dans
   l'historique et dans les caches de GitHub. Appeler Saïdou n'y change rien, la
   clé est déjà dehors. D'où `npm run check-secrets` **toujours** avant de pousser
   (il cherche les motifs connus, il ne remplace pas la prudence), et **aucun
   `.env` ajouté au dépôt** : il est en `.gitignore`, on n'y touche pas.
4. **On ne touche pas à `git config`, on ne change pas l'identité des commits.**
   `Jimmy (agent)` est ce qui permet de reconnaître un commit d'agent dans
   l'historique de Saïdou. On n'ajoute ni clé, ni identité, ni remote.
5. **Une seule porte, un seul dépôt.** Cette clé n'ouvre que
   `prestadeal-hue/annuaire974-web`. Pour modifier `tisite.re` ou
   `vem-saint-pierre` **dans le code**, ce n'est pas ici qu'on invente un accès :
   on le dit à Saïdou. Et on ne demande **jamais** son jeton GitHub — il ouvre
   *tous* ses dépôts, pas celui-là.

## Un push sur `main` est une mise en production

GitHub Pages publie dans les **deux minutes**, pour tout le monde. Il n'y a pas de
brouillon, et pas d'annulation discrète.

La CI, elle, **garde mais ne juge pas** : `typecheck` et `check-secrets` tournent
dans le workflow **avant** le build, donc un push cassé fait un **run rouge** et
Pages **garde la dernière bonne version** — le site ne se casse pas, mais ton
commit est bien sur `main`. Donc pousse quelque chose dont tu es content.

## Deux adresses, et une seule se met à jour toute seule

| Adresse | Ce qui la publie |
|---|---|
| `prestadeal-hue.github.io/annuaire974-web` | **automatique** — à chaque push sur `main`, ~2 min |
| `tisite.re/annuaire974` | **à la main** — `cd /annuaire974 && VITE_BASE=/annuaire974/ npm run build && bash /usr/local/bin/deploy-annuaire.sh` |

C'est le piège le plus bête de ce dépôt : pousser, vérifier GitHub Pages, croire
que c'est fini — et Saïdou regarde `tisite.re`, où rien n'a bougé. **Après un
push qui doit se voir, lance le deploy et vérifie le `200`.**

**Les deux `curl` qui tranchent** — le premier dit si le **push** est arrivé, le
second si **tisite.re** a suivi :

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://prestadeal-hue.github.io/annuaire974-web/
curl -s -o /dev/null -w "%{http_code}\n" https://tisite.re/annuaire974/
```

`200` des deux côtés → c'est fini. Sinon → c'est pas fini, et on ne dit **jamais**
« c'est en ligne » avant de les avoir vus.

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
| `CONTRIBUER.md` | **ce fichier** : les règles git et la boucle de travail — la seule source |
| `README.md` | l'état du produit : fonctions, charte, déploiement, secrets |
| `scripts/check-secrets.mjs` | ce qui est poussé ne doit contenir aucun secret |
| `scripts/check-agent.mjs` | l'assistant **en ligne** : numéros réels, aucun commerce inventé, plafond actif |
| `scripts/assistant-limite.sql` | la table du plafond par IP (déjà créée côté Supabase) |
| `.github/workflows/deploy.yml` | typecheck + secrets → build → Pages |
