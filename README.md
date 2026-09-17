# Annuaire 974 — App web PWA

Application web **100 % responsive** des commerces et prestataires de La Réunion,
pensée mobile-first pour se rapprocher au maximum d'une application native.
Projet réalisé pour **TiSite** (tisite.re).

![stack](https://img.shields.io/badge/Vite%207-React%2019-7C3AED) ![pwa](https://img.shields.io/badge/PWA-installable-FB7185) ![ts](https://img.shields.io/badge/TypeScript-strict-3B0D73)

## ✨ Fonctionnalités

- **Recherche instantanée** : nom, métier, commune + filtres catégories (chips) et communes
- **Fiches commerce** : adresse, téléphone, WhatsApp, horaires, appel en 1 touche, partage natif (Web Share API)
- **Avis clients** : notes 1–5 étoiles + commentaires, publication API puis repli Supabase
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

## 🛰️ Données — mode hybride

L'app essaie dans l'ordre et bascule automatiquement :

1. **API REST Node.js** (Render) — si `VITE_API_URL` est renseignée
2. **Supabase direct** (PostgREST, clé publique) — lecture seule, écriture des avis incluse
3. **Jeu de démo local** — 24 commerces fictifs réalistes, si les deux sont injoignables
   ou si la base n'est pas encore seedée (identifié « démo » dans l'app)

Le mode actif est affiché en bas de l'accueil et sur la page Compte.

## 🚀 Démarrage

```bash
npm install
npm run dev        # http://localhost:5174
npm run typecheck  # tsc --noEmit
npm run build      # dist/ + sw.js + manifest
npm run icons      # régénère les icônes PWA depuis public/logo-tisite.svg
npm run check-secrets  # contrôle avant commit (règle inversée)
```

## 🔐 Secrets

`.env` contient uniquement la **clé publique** Supabase (publishable) : ce n'est pas un
secret, elle est faite pour être exposée côté client. Le `.gitignore` suit la **règle
inversée** du dépôt parent : tout est ignoré, on rallume au cas par cas, et
`npm run check-secrets` bloque tout commit contenant une clé privée, un `sb_secret_`
ou un JWT legacy.

## 📦 Déploiement

Le build (`dist/`) est un site statique : Netlify, Vercel, Cloudflare Pages ou Render
Static Site conviennent. Variables d'environnement à définir chez l'hébergeur :

```
VITE_SUPABASE_URL=https://rjsshcmszhxmldzucuqh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_API_URL=            # URL de l'API Render quand elle sera en ligne
```

## 🗺️ Prochaines étapes

- [ ] Peupler Supabase avec `database.sql` (l'app sortira automatiquement du mode démo)
- [ ] Pousser l'API sur GitHub → déploiement Render → renseigner `VITE_API_URL`
- [ ] Connecter l'agent IA (SOUL + AGENTS) à l'API
- [ ] Comptes utilisateurs (auth Telegram/WhatsApp) et favoris synchronisés
