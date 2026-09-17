import { useApp } from '../context/AppContext'
import { CommerceCard } from '../components/CommerceCard'
import { EmptyState } from '../components/States'

export function Favoris({ navigate }: { navigate: (to: string) => void }) {
  const { favoris, commerces } = useApp()
  const list = commerces.filter((c) => favoris.includes(c.id))

  return (
    <div className="fade-in">
      <h1 className="page-title">❤️ Mes favoris</h1>
      {list.length === 0 ? (
        <EmptyState
          emoji="🤍"
          title="Aucun favori pour l'instant"
          hint="Touche le cœur sur un commerce pour le retrouver ici, même hors-ligne."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Découvrir l'annuaire
            </button>
          }
        />
      ) : (
        <div className="card-list">
          {list.map((c) => (
            <CommerceCard key={c.id} commerce={c} onOpen={(id) => navigate(`/commerce/${id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
