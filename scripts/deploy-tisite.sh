#!/usr/bin/env bash
# Déploiement de l'annuaire sur https://tisite.re/annuaire974/
# Build avec la base /annuaire974/ puis copie dans le webroot nginx.
# Aucune config nginx à recharger : le vhost sert déjà les fichiers statiques.
set -euo pipefail
cd "$(dirname "$0")/.."

DEST="/home/tisite-proxy/htdocs/tisite.re/annuaire974"
OWNER="tisite-proxy:tisite-proxy"

echo "▸ Build (base /annuaire974/)"
VITE_BASE=/annuaire974/ npm run build

echo "▸ Copie vers $DEST"
sudo mkdir -p "$DEST"
sudo rsync -a --delete dist/ "$DEST/"
sudo chown -R "$OWNER" "$DEST"
sudo chmod -R u+rwX,g+rwX,o+rX "$DEST"

echo "▸ Vérification"
curl -sL -o /dev/null -w "  site      : %{http_code}\n" https://tisite.re/annuaire974/
curl -s -o /dev/null -w "  manifest  : %{http_code}\n" https://tisite.re/annuaire974/manifest.webmanifest
curl -s -o /dev/null -w "  sw.js     : %{http_code}\n" https://tisite.re/annuaire974/sw.js
echo "✅ En ligne sur https://tisite.re/annuaire974"
