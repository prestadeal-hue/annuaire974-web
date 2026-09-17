import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useApp } from '../context/AppContext'
import { IconDownload } from '../components/Icons'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

/** Événement beforeinstallprompt, capté une seule fois. */
let deferredPrompt: BeforeInstallPromptEvent | null = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e as BeforeInstallPromptEvent
})

export function Compte() {
  const { favoris, commerces, mode, theme, toggleTheme } = useApp()
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    setCanInstall(deferredPrompt !== null)
  }, [])

  const install = async () => {
    const ev = deferredPrompt
    if (!ev) return
    await ev.prompt()
    deferredPrompt = null
    setCanInstall(false)
  }

  const mesAvis = 0 // à brancher sur l'API quand le compte sera actif

  const Card = ({ title, children, icon }: { title: string; children?: ReactNode; icon?: string }) => (
    <div className="info-row">
      <span className="ico">{icon}</span>
      <div className="grow">
        <div className="lbl">{title}</div>
        <div className="val">{children}</div>
      </div>
    </div>
  )

  return (
    <div className="fade-in">
      <section className="profile-hero">
        <div className="avatar" aria-hidden>🧑‍🦱</div>
        <div>
          <h2>Salut toi 👋</h2>
          <p>Ti Sèvis — l'annuaire qui connaît toute l'île</p>
        </div>
      </section>

      <div className="stat-grid">
        <div className="stat">
          <div className="num">{favoris.length}</div>
          <div className="lbl">Favoris</div>
        </div>
        <div className="stat">
          <div className="num">{commerces.length}</div>
          <div className="lbl">Commerces</div>
        </div>
        <div className="stat">
          <div className="num">{mesAvis}</div>
          <div className="lbl">Mes avis</div>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Application</h2>
        <Card title="Installer l'app" icon="📲">
          {canInstall ? (
            <button className="btn btn-primary btn-sm" onClick={install}>
              <IconDownload size={16} /> Installer sur mon téléphone
            </button>
          ) : (
            <span className="hint">
              Sur iPhone : Safari → Partager → « Sur l'écran d'accueil ». Sur Android : menu ⋮ → « Installer l'application ».
            </span>
          )}
        </Card>
        <Card title="Mode de données" icon="🛰️">
          {mode === 'api'
            ? 'API REST (Render)'
            : mode === 'supabase'
              ? 'Supabase direct'
              : mode === 'demo'
                ? 'Démo (base à peupler / hors-ligne)'
                : mode === null
                  ? '…'
                  : 'Démo hors-ligne'}
        </Card>
        <Card title="Apparence" icon="🎨">
          <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
            Passer en {theme === 'dark' ? 'clair' : 'sombre'}
          </button>
        </Card>
      </section>

      <section className="section">
        <h2 className="section-title">À propos</h2>
        <Card title="Annuaire 974" icon="ℹ️">
          <span className="hint">
            Annuaire des commerces et prestataires de La Réunion. Données : Supabase · API : Render · App : TiSite.
          </span>
        </Card>
      </section>
    </div>
  )
}
