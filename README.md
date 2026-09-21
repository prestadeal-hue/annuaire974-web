# Annuaire 974 — L'assistant des commerces de La Réunion

Une page TiSite (tisite.re) : **un assistant qui parle**. L'utilisateur pose une
question sur les commerces et prestataires de La Réunion, l'assistant répond.

![stack](https://img.shields.io/badge/Vite%207-React%2019-7C3AED) ![pwa](https://img.shields.io/badge/PWA-installable-FB7185) ![ts](https://img.shields.io/badge/TypeScript-strict-3B0D73)

## Ce que le site est — et ce qu'il n'est plus

L'annuaire classique a été retiré (21/09/2026) : **plus de catégories, plus de
listes de commerces, plus de fiches, plus de favoris/notifications/compte**. Il
reste une seule page, le chat, encadré par le logo, le header et le footer TiSite.

Le message d'accueil, mot pour mot :

> Bonjour ! Je suis l'assistant Annuaire 974. Posez-moi une question sur les commerces de La Réunion.

La grande zone de saisie reste **collée en bas** de l'écran (comme ChatGPT) ;
l'accueil est centré tant qu'il n'y a pas de message, puis la conversation prend
la place. **La réponse s'affiche pendant qu'elle s'écrit**, mot après mot, au lieu
d'arriver d'un bloc à la fin. Le ton est **chaleureux, local, honnête** — comme un
ami qui connaît l'île, qui tutoie, et qui dit franchement quand il ne sait pas.

## 🎨 Charte « tisite »

Même identité que le site **tisite.re** — sombre premium, émeraude profond + or.
L'annuaire n'est pas un design à part : c'est une page TiSite, avec le même
header (logo, CTA or) et le même footer.

| Token | Valeur |
|---|---|
| `--color-primary` (fond header) | `#0B3D2E` |
| `--color-primary-600` (accents) | `#1EA574` |
| `--color-primary-500` | `#34D399` |
| `--color-accent` (or, CTA) | `#E8B84B` |
| fond | `#0A1410` |
| surface | `#0F1D16` |
| texte | `#E9F2EC` |

Tokens dans `src/styles.css`. Fontes **Manrope** (titres) et **Inter** (corps),
auto-hébergées dans `src/assets/fonts/`. Aucun émoji : les pictogrammes sont des
SVG (`src/components/Icons.tsx`).

Les icônes (favicon, PWA, apple-touch) viennent de la **marque TiSite**
(`src/assets/brand/tisite-picto.png`) — le pictogramme émeraude et or, le même
que tisite.re. Avant le 21/09/2026, elles étaient générées depuis
`logo-tisite.svg`, l'épingle **violette** de l'ancien annuaire : l'appli
installée affichait donc une pastille d'une autre marque que le site.
`npm run icons` les régénère (marque ramenée à 78 % sur les icônes masquables,
la zone que Android ne rogne pas).

## 🔎 SEO

Tout tient dans `index.html` — un seul fichier, relu d'un coup d'œil :

| | |
|---|---|
| **Canonique** | `https://tisite.re/annuaire974/` — le site est aussi servi sur GitHub Pages pour les aperçus : deux adresses, un seul contenu, donc une canonique (sinon signaux divisés) |
| **Open Graph + Twitter** | titre, description et `og:image`. C'est ce qui s'affiche quand le lien circule dans un groupe WhatsApp ou sur Facebook — sur une île où tout passe par le téléphone, c'est la première impression |
| **`og-image.png`** (1200×630) | **générée**, pas dessinée : `npm run og` reprend le dégradé du hero, l'or et le wordmark TiSite (`scripts/generate-og.mjs`) |
| **JSON-LD** | un graphe `Organization` (TiSite) + `WebSite` + `WebApplication` : qui édite, quel site, ce qu'est l'assistant, et la zone servie (La Réunion). Uniquement des informations vérifiables ailleurs sur la page |
| **Contenu lisible sans JavaScript** | l'écran d'accueil en clair est écrit dans `#root` : sans ça, un robot (ou un visiteur sans JS) ne trouvait qu'un rectangle vide. `src/main.tsx` le retire au démarrage — pas de doublon à l'écran, et il porte les mêmes classes que l'app, donc pas de saut visuel |
| **`public/sitemap.xml`** | l'annuaire est servi par nginx **avant** le site Astro : le sitemap de tisite.re ne le connaît pas (vérifié — `sitemap-0.xml` ne le contient pas) |

⚠️ **Ce sitemap n'est lu par personne en l'état.** Pour qu'il serve, il faut le
déclarer — une ligne dans le `robots.txt` de tisite.re (ils en acceptent
plusieurs) :

```
Sitemap: https://tisite.re/annuaire974/sitemap.xml
```

...ou le déposer dans la Search Console. La page n'est pas pour autant
introuvable : la page d'accueil de tisite.re pointe déjà vers l'annuaire.

## 💬 L'assistant — MiMo + Exa, sans clé exposée

Le chat parle à une **Edge Function Supabase** (`supabase/functions/chat/index.ts`),
jamais directement aux services. La fonction détient, côté serveur, **deux secrets** :

| Secret | Rôle |
|---|---|
| `MIMO_API_KEY` | le modèle qui rédige la réponse |
| `EXA_API_KEY` | la **recherche en temps réel** (Exa) qui enrichit la réponse |
| `FUSEAU` *(facultative)* | le fuseau des repères de date — `Indian/Reunion` par défaut |

### La date du jour, donnée au modèle (21/09/2026)

L'assistant a répondu **« demain, mercredi 16 septembre »** à une question posée le
**lundi 21** : il n'avait aucun repère de date, donc « demain », « ce soir » et
même les jours de la semaine sortaient de l'entraînement du modèle — c'est-à-dire
d'un calendrier qui n'est pas le nôtre. Un numéro inventé se voit ; une date
inventée, non.

La fonction calcule donc **côté serveur** (jamais côté navigateur : une date reçue
d'un client est manipulable, et elle ne dit rien de l'heure qu'il est sur l'île)
les repères — aujourd'hui, hier, demain, après-demain — et les met dans le prompt
**avant la liste des commerces**, avec une règle explicite : *une date ne s'invente
pas*. Le fuseau est celui de La Réunion (`Indian/Reunion`, UTC+4), réglable
par le secret `FUSEAU`.

**Pourquoi pas une variable `VITE_*`** : toute variable `VITE_*` utilisée par le
code finit dans le paquet JavaScript **public** — vérifié, la clé `anon` de
Supabase y est en clair. Une clé `anon` est publique par conception ; une clé de
modèle **ou de recherche**, elle, **paie**, et serait facturée à n'importe qui.
Les deux vivent donc dans les secrets Supabase.

### Ce qu'Exa apporte

Exa ne remplace pas l'annuaire : la liste des commerces (lue côté serveur dans
Supabase) reste la **source de vérité**. Exa vient **en complément**, à partir de
la dernière question de l'utilisateur :

- chercher des commerces en **temps réel** (au-delà de la base) ;
- enrichir avec des données **actualisées** (horaires, actualité locale) ;
- faire remonter des **avis clients** récents.

Le modèle reçoit ces résultats dans un message système, avec pour consigne de les
recouper, de ne jamais les présenter comme certains, et de citer le lien. Sans
clé Exa, l'assistant répond quand même — sans web.

### La réponse au fil de l'eau (SSE)

Depuis le 21/09/2026, la fonction rend la réponse **pendant qu'elle s'écrit** :
le visiteur voit le premier mot arriver en quelques centaines de millisecondes au
lieu de fixer trois points pendant cinq secondes. Le format sur le fil est le plus
simple qui existe — **SSE** : une ligne `data: {...}`, puis une ligne vide.

```
data: {"type":"delta","text":"Bon"}
data: {"type":"delta","text":"jour"}
data: {"type":"fin","fiches":24,"web":4}
```

- `delta` : un morceau à **concaténer** (jamais à remplacer) ;
- `fin` : la réponse est complète, avec `fiches` et `web` — ce que
  `check-agent --flux` et `--exa` lisent pour prouver, et non supposer ;
- `erreur` : le serveur s'est arrêté en route. **Ce qui est déjà reçu reste à
  l'écran** — le jeter effacerait du travail déjà payé.

Deux garanties qui comptent plus que le gain de vitesse :

- **le site marche même si la fonction déployée est l'ancienne** : elle répond
alors en JSON, et le client bascule sur ce chemin là sans rien casser (vérifié en
ligne le 21/09, fonction pas encore recollée) ;
- **le flux n'est pas celui du modèle** : la fonction le retraduit. Le site ne
dépend donc pas du fournisseur, et on peut glisser `fin` APRÈS le dernier mot —
impossible si on transmettait le flux tel quel.

Le découpage d'un flux (morceau coupé en deux par le réseau, accent à cheval sur
deux paquets, ligne parasite) vit dans `src/lib/flux.ts`, **séparé du React** pour
être testable : `npm test`. C'est la partie qui casse en silence, donc celle qui a
des tests.

### Ce que la fonction garantit, côté serveur (le client n'est jamais cru)

| | |
|---|---|
| **Aucun commerce inventé** | La liste réelle lui est donnée dans son prompt : ce qu'il ne trouve pas, il ne l'a pas |
| **Bornes** | 10 messages, 1 500 caractères par message, 700 jetons de sortie |
| **Un plafond par IP** | 20 questions par minute, tenu dans la base (`scripts/assistant-limite.sql`) |
| **Réunion + France** | Le pays vient de Cloudflare (`cf-ipcountry`). S'il manque, on **laisse passer** et on le note |
| **Pas de bouton mort** | Le chat demande une fois si la fonction existe (un `GET`, gratuit). 404 (pas déployée) ou 403 (hors zone) → il l'annonce honnêtement |

### Déploiement de la fonction (aucune CLI nécessaire)

1. Supabase → **Edge Functions** → *Deploy a new function* → *Via Editor* → nom : `chat`
2. Coller `supabase/functions/chat/index.ts` en entier, puis *Deploy function*
3. Onglet **Details** de la fonction → *Verify JWT with legacy secret* → **OFF**
4. Edge Functions → **Secrets** → `MIMO_API_KEY` = la clé `tp-…`
5. Edge Functions → **Secrets** → `EXA_API_KEY` = la clé Exa (`fd98…`)
6. SQL Editor → `scripts/assistant-limite.sql` → *Run* (le plafond par IP)

> ⚠️ **L'étape 3 n'est pas une préférence, c'est une obligation.** Ce projet utilise les
> clés 2026 (`sb_publishable_…`), qui **ne sont pas des JWT**. Avec *Verify JWT* activé
> (le défaut), la passerelle rejette chaque appel en `401 {"error":"JWT is invalid"}`.
>
> ⚠️ **Les étapes 4 et 5 se font ensemble** : sans `EXA_API_KEY`, l'assistant répond
> toujours (la recherche web est simplement absente). Le fichier de la fonction **part
> sur `main` comme le reste**, mais la fonction qui tourne chez Supabase est **collée à
> la main** — modifier le fichier ne change rien tant que ce geste n'est pas fait.

Puis, depuis un poste qui a le `.env` :

```bash
npm run check-agent            # la fonction est-elle en ligne ? (gratuit)
npm run check-agent -- --exa   # la recherche web est-elle branchée ? (1 question)
npm run check-agent -- --flux  # la réponse arrive-t-elle au fil de l'eau ? (1 question)
npm run check-agent -- --date  # l'assistant sait-il quel jour on est ? (1 question)
npm run check-agent -- --tester # 3 questions pièges + Exa + flux + date + plafond + pays
npm run check-exa              # la clé Exa répond-elle en direct ? (hors Supabase)
npm run check-fonction         # la Edge Function compile-t-elle ? (aucun réseau)
npm test                       # flux + repères de date (aucun réseau, aucun jeton)
```

### Les contrôles, et ce que chacun prouve

| Contrôle | Ce qu'il prouve |
|---|---|
| `npm run check-agent -- --exa` | que la **fonction déployée** utilise Exa : elle s'auto-décrit au `GET` (clé posée ou non), puis une question web doit rendre `web > 0` (le nombre de résultats Exa qui l'ont nourrie) |
| `npm run check-agent -- --flux` | que la fonction déployée **streame** : le `GET` annonce `flux: "pret"`, puis une vraie question doit rendre **plusieurs** morceaux. Un seul morceau de 800 caractères, c'est la réponse d'un bloc — le contrôle le dit au lieu de le cacher |
| `npm run check-agent -- --date` | que l'assistant **sait quel jour on est** : le `GET` publie la date du serveur, comparée à celle du contrôle dans le même fuseau ; puis la question qui a mal tourné le 21/09/2026 (« on est quel jour aujourd'hui ? ») doit rendre le bon jour **et** le bon mois |
| `npm run check-exa` | que la **clé Exa elle-même** est vivante, en direct, sans Supabase — utilisable par un agent (ou agent-reach) avant de compter sur la recherche temps réel |
| `npm run check-fonction` | que la **Edge Function compile** (TypeScript strict, avec un `Deno` minimal fabriqué pour l'occasion) : `npm run typecheck` ne regarde que `src/`, et c'est ce fichier-là qu'on colle à la main dans Supabase |
| `npm test` | que le **lecteur de flux** encaisse les découpages traîtres (paquet coupé en deux, deux événements collés, accent à cheval, fin sans retour à la ligne…), et que les **repères de date** tiennent le fuseau de l'île, la bascule de mois et celle d'année |

## 🗃️ Base de données

L'assistant lit les commerces **côté serveur** via PostgREST (même requête que
l'ancienne app). Les scripts SQL utiles restent dans `scripts/` :
`rls-policies.sql` (lecture publique), `seed.sql` (données), `assistant-limite.sql`
(plafond par IP).

## 🚀 Démarrage

```bash
npm install
npm run dev        # http://localhost:5174
npm run typecheck  # 2 passes : src/ (navigateur) puis vite.config.ts (contexte Node)
npm run build      # dist/ + sw.js + manifest
npm run icons      # régénère les icônes PWA depuis la marque TiSite
npm run og         # régénère l'image de partage (og-image.png, 1200×630)
npm test               # tests du lecteur de flux (Node 24+, aucun réseau)
npm run check-secrets  # contrôle avant commit (règle inversée)
npm run check-agent    # l'assistant est-il branché ? (voir § L'assistant)
npm run check-exa      # la clé Exa répond-elle ? (voir § L'assistant)
```

## 🔐 Secrets

`.env` ne contient que la **clé publique** Supabase (publishable) : elle n'est pas
un secret. La clé **Exa** est gardée dans le `.env` **local pour référence**, mais
elle ne sert **pas** au build — elle doit vivre dans les secrets Supabase (voir
§ L'assistant). Le `.gitignore` suit la **règle inversée** du dépôt parent : tout
est ignoré, on rallume au cas par cas, et `npm run check-secrets` bloque tout
commit contenant une clé privée, un `sb_secret_` ou un JWT legacy.

## 📦 Déploiement

Le build (`dist/`) est un site statique, en ligne à deux endroits :

| Adresse | Qui déploie |
|---|---|
| https://prestadeal-hue.github.io/annuaire974-web/ | `.github/workflows/deploy.yml`, à chaque push sur `main` |
| https://tisite.re/annuaire974/ | TiSite (nginx), à la main : `bash scripts/deploy-tisite.sh` |

⚠️ **Un `git push` sur `main` est un déploiement en production** (GitHub Pages).
Les règles git complètes vivent à un seul endroit : **`CONTRIBUER.md`**.

Variables d'environnement de build (une seule paire, non sensible) :

```
VITE_SUPABASE_URL=https://rjsshcmszhxmldzucuqh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

L'assistant n'ajoute **rien** à cette liste : ses clés (MiMo, Exa) sont des secrets
Supabase, pas des variables de build.

## 🗺️ Prochaines étapes

- [x] Refonte : le site devient le chat (catégories, listes et fiches retirées)
- [x] Chat centré façon ChatGPT, couleurs TiSite, message de bienvenue
- [x] Exa branché côté serveur (recherche temps réel + avis) — code + doc
- [x] Exa activé en ligne + persona complète de l'assistant
- [x] Contrôles : `check-agent --exa` (fonction) et `check-exa` (clé, en direct)
- [x] Réponse **au fil de l'eau** (SSE) + contrôle `check-agent --flux` + `npm test`
- [x] Ménage : code mort des pages retirées enlevé (CSS 1 132 → 654 lignes, 35 icônes → 4)
- [x] SEO : canonique, Open Graph + `og-image.png`, JSON-LD, contenu lisible sans JS, sitemap
- [x] Icônes PWA : passées de l'ancien logo violet à la marque TiSite (846 Ko → 180 Ko)
- [x] Dates : l'assistant reçoit la date et l'heure de La Réunion (il annonçait « demain, mercredi 16 septembre » un lundi 21) — contrôles `check-agent --date`, `npm test`, `check-fonction`
- [ ] Comptes utilisateurs (auth), si un jour le chat doit mémoriser les préférences
