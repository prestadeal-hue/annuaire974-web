import { Header, OfflineBar } from './components/Shell'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { useOnline } from './hooks/useOnline'

/**
 * Le site tient en une page : l'assistant, encadré par le header et le footer
 * TiSite. Plus de routes, plus de liste : on parle, il répond.
 */
export default function App() {
  const online = useOnline()

  return (
    // `hors-ligne` laisse la place au bandeau : sans ça, la zone de saisie
    // glisse sous l'écran pile quand le visiteur cherche pourquoi rien ne part.
    <div className={online ? 'app' : 'app hors-ligne'}>
      <Header />
      <OfflineBar online={online} />
      <main className="app-main">
        <Home online={online} />
      </main>
      <Footer />
    </div>
  )
}
