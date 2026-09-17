import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider } from './components/Toast'
import { Header, TabBar, OfflineBar } from './components/Shell'
import { useHashRoute } from './hooks/useHashRoute'
import { Home } from './pages/Home'
import { CommerceDetail } from './pages/CommerceDetail'
import { Favoris } from './pages/Favoris'
import { Notifications } from './pages/Notifications'
import { Compte } from './pages/Compte'

function Router() {
  const { online } = useApp()
  const { route, navigate } = useHashRoute()

  return (
    <div className="app">
      <Header route={route} navigate={navigate} />
      <OfflineBar online={online} />
      <main className="app-main">
        {route.name === 'home' && <Home navigate={navigate} />}
        {route.name === 'commerce' && <CommerceDetail id={route.id} navigate={navigate} />}
        {route.name === 'favoris' && <Favoris navigate={navigate} />}
        {route.name === 'notifications' && <Notifications />}
        {route.name === 'compte' && <Compte />}
      </main>
      <TabBar route={route} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </AppProvider>
  )
}
