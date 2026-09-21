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

La grande zone de saisie est au centre de la page ; les réponses s'affichent en
dessous. Le ton est **chaleureux, local, honnête** — comme un ami qui connaît
l'île, qui tutoie, et qui dit franchement quand il ne sait pas.

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

## 💬 L'assistant — MiMo + Exa, sans clé exposée

Le chat parle à une **Edge Function Supabase** (`supabase/functions/chat/index.ts`),
jamais directement aux services. La fonction détient, côté serveur, **deux secrets** :

| Secret | Rôle |
|---|---|
| `MIMO_API_KEY` | le modèle qui rédige la réponse |
| `EXA_API_KEY` | la **recherche en temps réel** (Exa) qui enrichit la réponse |

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
npm run check-agent -- --tester # 3 questions pièges + Exa + plafond + pays
npm run check-exa              # la clé Exa répond-elle en direct ? (hors Supabase)
```

### Les deux contrôles Exa, et pourquoi il y en a deux

| Contrôle | Ce qu'il prouve |
|---|---|
| `npm run check-agent -- --exa` | que la **fonction déployée** utilise Exa : elle s'auto-décrit au `GET` (clé posée ou non), puis une question web doit rendre `web > 0` (le nombre de résultats Exa qui l'ont nourrie) |
| `npm run check-exa` | que la **clé Exa elle-même** est vivante, en direct, sans Supabase — utilisable par un agent (ou agent-reach) avant de compter sur la recherche temps réel |

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
npm run icons      # régénère les icônes PWA depuis public/logo-tisite.svg
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
- [ ] Comptes utilisateurs (auth), si un jour le chat doit mémoriser les préférences
