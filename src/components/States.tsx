import type { ReactNode } from 'react'
import { IconStar } from './Icons'

export function Spinner() {
  return <div className="spinner" aria-label="Chargement" />
}

export function SkeletonList({ n = 5 }: { n?: number }) {
  return (
    <div className="card-list" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton card" />
      ))}
    </div>
  )
}

export function EmptyState({
  emoji,
  title,
  hint,
  action,
}: {
  emoji: string
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="state">
      <div className="big" aria-hidden>
        {emoji}
      </div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function Stars({ note, size = 14 }: { note: number; size?: number }) {
  return (
    <span className="rating" aria-label={`Note ${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={size} filled={i <= Math.round(note)} className="star" />
      ))}
    </span>
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      emoji="📡"
      title="Impossible de charger"
      hint="Vérifie ta connexion puis réessaie."
      action={
        onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            Réessayer
          </button>
        )
      }
    />
  )
}
