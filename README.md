# Annuaire 974 — App web PWA

Application web **100 % responsive** des commerces et prestataires de La Réunion,
pensée mobile-first pour se rapprocher au maximum d'une application native.
Projet réalisé pour **TiSite** (tisite.re).

![stack](https://img.shields.io/badge/Vite%207-React%2019-7C3AED) ![pwa](https://img.shields.io/badge/PWA-installable-FB7185) ![ts](https://img.shields.io/badge/TypeScript-strict-3B0D73)

## ✨ Fonctionnalités

- **Recherche instantanée** : nom, métier, commune + filtres catégories (chips) et communes
- **Fiches commerce** : adresse, téléphone, WhatsApp, horaires, appel en 1 touche, partage natif (Web Share API)
- **Avis clients** : notes 1–5 étoiles + commentaires, publiés via la RPC `publier_avis` (aucun compte requis)
- **Favoris** : persistés localement (localStorage), disponibles hors-ligne
- **Notifications** : nouveaux commerces, promos, astuces
- **Thème clair / sombre** : suit le système, mémorisé
- **PWA complète** : installable, service worker, données en cache, bandeau hors-ligne
- **Nav native** : bottom tab bar + bouton retour Android/iOS fonctionnel (routing par hash)

## 🎨 Charte « tisite »

Violet/indigo moderne + accents corail (choisie avec le client) :

| Token | Clair | Sombre |
|---|---|---|
| `--brand` | `#7C3AED` | `#8B5CF6` |
| `--accent` (corail) | `#F43F5E` | `#F43F5E` |
| fond | `#FAF9FE` | `#14101F` |

Tous les tokens sont dans `src/styles.css`.

## 🛰️ Données — Supabase en direct

L'app essaie dans l'ordre et bascule automatiquement :

1. **Supabase direct** (PostgREST, clé publique) — lecture, écriture des avis incluse (RPC `publier_avis`)
2. **Jeu de démo local** — 24 commerces fictifs réalistes, si Supabase est injoignable
   ou si la base n'est pas encore seedée (identifié « démo » dans l'app)

Le mode actif est affiché en bas de l'accueil et sur la page Compte.

> **Il n'y a pas d'API — et c'est une décision, pas un chantier en attente** (18/09/2026).
> Une API REST Node.js avait été envisagée puis écartée : l'app lit et écrit déjà
> directement dans Supabase, une API n'ajouterait qu'un serveur à maintenir et une
> cible de déploiement de plus.
>
> La branche « API d'abord » reste dans le code (`src/lib/api.ts`, gardée par `hasApi`)
> mais **inerte** : `VITE_API_URL` doit rester **vide**. Renseignée mais injoignable,
> elle ferait payer un aller-retour perdu à chaque chargement avant le repli Supabase —
> exactement ce que portait `https://annuaire974-api.onrender.com` (un nom sans serveur
> derrière, HTTP 404) avant d'être retiré.

## 💬 L'assistant — MiMo, sans clé exposée

Le bouton de discussion (en bas à droite) parle à une **Edge Function Supabase**
(`supabase/functions/chat/index.ts`), jamais directement au modèle.

**Pourquoi pas une variable `VITE_*`** (18/09/2026) : toute variable `VITE_*` utilisée
par le code finit dans le paquet JavaScript **public** — c'est vérifié, la clé `anon`
de Supabase y est en clair. Une clé `anon` est publique par conception ; une clé de
modèle, elle, **paie**, et serait facturée à n'importe qui. Elle vit donc dans les
secrets Supabase.

Conséquence directe : **aucune variable d'environnement nouvelle**, ni sur GitHub Pages
ni sur tisite.re. L'assistant réutilise l'URL et la clé `anon` déjà en place.

Ce que la fonction garantit, côté serveur (le client n'est jamais cru) :

| | |
|---|---|
| **Aucun commerce inventé** | La liste réelle lui est donnée dans son prompt : ce qu'il ne trouve pas, il ne l'a pas. Un numéro hors annuaire se voit dans `check-agent` |
| **Bornes** | 10 messages, 1 500 caractères par message, 700 jetons de sortie |
| **Le site et l'assistant voient la même chose** | Même requête PostgREST que `src/lib/api.ts` |
| **Pas de bouton mort** | Le widget demande une fois si la fonction existe (un `GET`, gratuit). 404 → il ne s'affiche pas |

**Déploiement** (aucune CLI nécessaire) :

1. Supabase → **Edge Functions** → *Deploy a new function* → *Via Editor* → nom : `chat`
2. Coller `supabase/functions/chat/index.ts` en entier, puis *Deploy function*
3. Onglet **Details** de la fonction → *Verify JWT with legacy secret* → **OFF**
4. Edge Functions → **Secrets** → `MIMO_API_KEY` = la clé `tp-…`

> ⚠️ **L'étape 3 n'est pas une préférence, c'est une obligation.** Ce projet utilise les
> clés 2026 (`sb_publishable_…`), qui **ne sont pas des JWT**. Avec *Verify JWT* activé
> (le défaut), la passerelle rejette chaque appel en `401 {"error":"JWT is invalid"}` —
> confirmé par l'équipe Supabase : `--no-verify-jwt` est requis dès qu'on appelle avec une
> clé anon (publishable) ou secret.
>
> La contrepartie est réelle : **l'endpoint devient public**. La clé MiMo reste protégée,
> mais la dépense ne l'est pas — d'où les plafonds durs et la liste d'origines
> (`ORIGINES` : tisite.re, prestadeal-hue.github.io, localhost) dans la fonction. Un vrai
> plafond par adresse IP demanderait un état partagé, donc une table SQL : c'est le
> prochain palier si l'abus devient un sujet.

Puis, depuis un poste qui a le `.env` :

```bash
npm run check-agent            # la fonction est-elle en ligne ? (gratuit)
npm run check-agent -- --tester # 3 questions pièges (consomme le modèle)
```

Le contrôle cherche exactement ce qui ne se voit pas à l'œil : un **numéro absent de
l'annuaire**, un commerce annoncé qui n'existe pas, une réponse qui parle du modèle.

## 🗃️ Base de données — scripts SQL

Introspection faite via PostgREST : le schéma **réel** diffère de la doc initiale
(`commerces.commune` est une colonne **texte**, pas de `commune_id`/`whatsapp`/`nb_avis` ;
`avis.utilisateur_id → utilisateurs` ; `notifications.est_lu`).

| Script | Rôle |
|---|---|
| `scripts/rls-policies.sql` | **À exécuter en premier** — les tables contiennent déjà des données mais la clé publique voit 0 ligne (RLS fermée). Ajoute la lecture publique + l'insertion d'avis. Supabase → SQL Editor → Run. |
| `scripts/seed.sql` | Optionnel — complète/homogénéise les données (10 catégories, 24 communes, 24 commerces, avis, notifs). Idempotent. |

Après `rls-policies.sql`, l'app bascule automatiquement du mode démo vers les vraies données.

## 🚀 Démarrage

```bash
npm install
npm run dev        # http://localhost:5174
npm run typecheck  # 2 passes : src/ (navigateur) puis vite.config.ts (contexte Node)
npm run build      # dist/ + sw.js + manifest
npm run icons      # régénère les icônes PWA depuis public/logo-tisite.svg
npm run check-secrets  # contrôle avant commit (règle inversée)
npm run check-agent    # l'assistant est-il branché ? (voir § L'assistant)
```

## 🔐 Secrets

`.env` contient uniquement la **clé publique** Supabase (publishable) : ce n'est pas un
secret, elle est faite pour être exposée côté client. Le `.gitignore` suit la **règle
inversée** du dépôt parent : tout est ignoré, on rallume au cas par cas, et
`npm run check-secrets` bloque tout commit contenant une clé privée, un `sb_secret_`
ou un JWT legacy.

## 📦 Déploiement

Le build (`dist/`) est un site statique, en ligne à deux endroits :

| Adresse | Qui déploie |
|---|---|
| https://prestadeal-hue.github.io/annuaire974-web/ | `.github/workflows/deploy.yml`, à chaque push sur `main` |
| https://tisite.re/annuaire974/ | TiSite (nginx) |

⚠️ **Un `git push` sur `main` est un déploiement en production** (GitHub Pages).

Netlify, Vercel ou Cloudflare Pages conviendraient aussi — il n'y a aucun code serveur à
héberger. Variables d'environnement à définir chez l'hébergeur (et dans `.env` pour un
build local) :

```
VITE_SUPABASE_URL=https://rjsshcmszhxmldzucuqh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_API_URL=            # laisser VIDE — il n'y a pas d'API (voir § Données)
```

L'assistant n'ajoute **rien** à cette liste (voir § L'assistant) : sa clé de modèle est un
secret Supabase, pas une variable de build.

## 🗺️ Prochaines étapes

- [x] `rls-policies.sql` exécuté (lecture publique OK)
- [x] Seed exécuté : 10 catégories · 24 communes · 24 commerces · 8 avis — visibles via la clé publique
- [x] RPC `publier_avis` active (formulaire d'avis sans compte, validé côté base)
- [x] Publié sur GitHub + en ligne (GitHub Pages et tisite.re — voir § Déploiement)
- [x] Architecture tranchée (18/09) : **pas d'API** — l'app parle à Supabase en direct
- [x] Assistant : widget + Edge Function écrits (18/09) — la clé du modèle ne sort jamais du serveur
- [ ] Assistant : déployer la fonction dans Supabase (*Verify JWT* sur **OFF**) + le secret `MIMO_API_KEY`, puis `npm run check-agent`
- [ ] Assistant : écrire sa persona (`SOUL`) — aujourd'hui un prompt système sobre, dans la fonction
- [ ] Comptes utilisateurs (auth) et favoris synchronisés
