import { useEffect, useState } from 'react'
import { IconWifiOff } from './Icons'

/* ── Header — même structure et même habillage que tisite.re ─────────
   L'annuaire classique a disparu : il ne reste que le logo TiSite, le nom de
   la page, et un lien vers le site principal. Pas de menu à tiroirs pour deux
   liens — moins de code, et rien qui mène à une page qui n'existe plus.
   ─────────────────────────────────────────────────────────────────── */

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={scrolled ? 'site-header scrolled' : 'site-header'}>
      <div className="container bar">
        {/* `./` et non `#/` : le site n'a plus de routeur, un `#/` ne menait
            nulle part. Ici, on rechargera bien la page du chat. */}
        <a className="brand" href="./" aria-label="Annuaire 974 — Accueil">
          <img src={`${import.meta.env.BASE_URL}logo/tisite-logo.png`} alt="TiSite" width="115" height="53" />
          <span className="brand-page">Annuaire 974</span>
        </a>

        <nav className="nav-wrap">
          <ul className="nav">
            <li>
              <a href="https://tisite.re" className="externe">
                Site TiSite
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export function OfflineBar({ online }: { online: boolean }) {
  if (online) return null
  return (
    <div className="offline-bar" role="status">
      <IconWifiOff size={15} /> Hors-ligne — l'assistant a besoin d'une connexion
    </div>
  )
}
