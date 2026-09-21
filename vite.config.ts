import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Base configurable : /annuaire974-web/ (GitHub Pages) ou /annuaire974/ (tisite.re)
const BASE = (process.env.VITE_BASE ?? '/annuaire974-web/').replace(/\/?$/, '/')

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'logo-tisite.svg'],
      manifest: {
        name: 'Annuaire 974',
        short_name: 'Annuaire974',
        description:
          "L'assistant des commerces et prestataires de La Réunion. Posez votre question, il répond.",
        lang: 'fr',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0A1410',
        theme_color: '#0B3D2E',
        categories: ['business', 'food', 'shopping', 'travel'],
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: `${BASE}index.html`,
        // Plus de données à mettre en cache : le chat a besoin du réseau. On ne
        // garde que la coquille de l'app (HTML, JS, CSS, images, fontes).
      },
    }),
  ],
  server: { port: 5174, host: true },
})
