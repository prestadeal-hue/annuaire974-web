import type { Commerce } from '../types'
import { useApp } from '../context/AppContext'
import { IconHeart } from './Icons'

export function CommerceCard({
  commerce: c,
  onOpen,
}: {
  commerce: Commerce
  onOpen: (id: number) => void
}) {
  const { isFav, toggleFav } = useApp()
  const fav = isFav(c.id)

  return (
    <article className="card" onClick={() => onOpen(c.id)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(c.id) }}>
      <div className="card-thumb" aria-hidden>
        {c.categorie?.icone ?? (c.categorie?.nom?.[0]?.toUpperCase() ?? '🏪')}
      </div>
      <div className="card-body">
        <div className="card-title">
          <span className="name">{c.nom}</span>
          {c.categorie && <span className="badge-cat">{c.categorie.nom}</span>}
        </div>
        <div className="card-meta">
          {typeof c.note_moyenne === 'number' && c.note_moyenne > 0 && (
            <span className="rating">
              <span className="star">★</span>
              {c.note_moyenne.toFixed(1).replace('.', ',')}
            </span>
          )}
          {c.commune && <span>📍 {c.commune}</span>}
        </div>
      </div>
      <button
        className={`fav-btn ${fav ? 'on' : ''}`}
        aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-pressed={fav}
        onClick={(e) => {
          e.stopPropagation()
          toggleFav(c.id)
        }}
      >
        <IconHeart size={21} />
      </button>
    </article>
  )
}
