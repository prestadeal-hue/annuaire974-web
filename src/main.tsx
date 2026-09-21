import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

const racine = document.getElementById('root')!

/* Le contenu de repli écrit dans `index.html` (l'écran d'accueil en clair, ce
   que lisent les robots et les visiteurs sans JavaScript) est retiré ICI, avant
   le montage. React le remplacerait de toute façon, mais s'en remettre à ce
   détail d'implémentation pour éviter un doublon à l'écran serait léger : deux
   lignes, et plus de question. */
racine.replaceChildren()

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
