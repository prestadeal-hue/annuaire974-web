import { IconBell, IconHome, IconMoon, IconSun, IconUser, IconWifiOff, IconHeart } from './Icons'
import { useApp } from '../context/AppContext'
import type { Route } from '../hooks/useHashRoute'

export function Header({ route, navigate }: { route: Route; navigate: (to: string) => void }) {
  const { theme, toggleTheme, online } = useApp()

  return (
    <header className="header">
      <button className="header-logo" onClick={() => navigate('/')} aria-label="Annuaire 974 — Accueil">
        <span className="logo-badge" aria-hidden>
          <span className="crest" />
        </span>
        <span>
          Annuaire <span className="muted">974</span>
        </span>
      </button>
      <span className="header-spacer" />
      {!online && <IconWifiOff size={18} />}
      <button className="icon-btn" onClick={toggleTheme} aria-label="Basculer le thème clair/sombre">
        {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
      </button>
      <button
        className="icon-btn"
        onClick={() => navigate('/notifications')}
        aria-label="Notifications"
        style={{ display: route.name === 'notifications' ? 'none' : undefined }}
      >
        <IconBell size={20} />
      </button>
    </header>
  )
}

const TABS = [
  { path: '/', label: 'Accueil', icon: IconHome },
  { path: '/favoris', label: 'Favoris', icon: IconHeart },
  { path: '/compte', label: 'Compte', icon: IconUser },
] as const

export function TabBar({ route }: { route: Route }) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {TABS.map(({ path, label, icon: Icon }) => {
        const active = route.name === (path === '/' ? 'home' : path.slice(1))
        return (
          <a
            key={path}
            href={`#${path}`}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab-ico">
              <Icon size={22} />
            </span>
            {label}
          </a>
        )
      })}
    </nav>
  )
}

export function OfflineBar({ online }: { online: boolean }) {
  if (online) return null
  return (
    <div className="offline-bar" role="status">
      <IconWifiOff size={16} /> Hors-ligne — les données en cache restent disponibles
    </div>
  )
}
