import { useEffect, useState } from 'react'
import type { Notification } from '../types'
import { getNotifications } from '../lib/api'
import { EmptyState, SkeletonList } from '../components/States'

const ICONS: Record<string, string> = { nouveau: '🆕', promo: '🏷️', astuce: '💡' }

export function Notifications() {
  const [items, setItems] = useState<Notification[] | null>(null)

  useEffect(() => {
    let alive = true
    void getNotifications()
      .then((n) => alive && setItems(n))
      .catch(() => alive && setItems([]))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="fade-in">
      <h1 className="page-title">🔔 Notifications</h1>
      {!items ? (
        <SkeletonList n={3} />
      ) : items.length === 0 ? (
        <EmptyState emoji="🔕" title="Rien de neuf" hint="Les nouveaux commerces et promos arriveront ici." />
      ) : (
        <div className="card-list">
          {items.map((n) => (
            <article key={n.id} className="review" style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }} aria-hidden>
                {ICONS[n.type ?? ''] ?? '📣'}
              </span>
              <div className="grow">
                <div className="author">{n.titre ?? 'Info'}</div>
                <p style={{ margin: '2px 0 0', fontSize: '0.9rem', color: 'var(--text-2)' }}>{n.message}</p>
                {n.cree_le && (
                  <div className="date" style={{ marginTop: 4 }}>
                    {new Date(n.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
              {!n.lu && <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--coral-500)', flex: 'none', marginTop: 6 }} aria-label="Non lu" />}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
