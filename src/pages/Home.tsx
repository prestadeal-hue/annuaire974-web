import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { CommerceCard } from '../components/CommerceCard'
import { EmptyState, SkeletonList } from '../components/States'
import { IconSearch, IconX } from '../components/Icons'

export function Home({ navigate }: { navigate: (to: string) => void }) {
  const { categories, communes, commerces, loading, mode, refresh } = useApp()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<number | null>(null)
  const [commune, setCommune] = useState<number | null>(null)

  const filtered = useMemo(() => {
    let list = commerces
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.nom.toLowerCase().includes(needle) ||
          (c.description ?? '').toLowerCase().includes(needle) ||
          (c.commune ?? '').toLowerCase().includes(needle),
      )
    }
    if (cat) list = list.filter((c) => c.categories?.some((k) => k.id === cat))
    if (commune) {
      const nom = communes.find((x) => x.id === commune)?.nom
      if (nom) list = list.filter((c) => c.commune === nom)
    }
    return list
  }, [commerces, q, cat, commune, communes])

  return (
    <div className="fade-in">
      <section className="hero">
        <span className="kicker">L'annuaire de La Réunion</span>
        <h1>
          Tous les commerces du 974,
          <br />
          dans ta poche.
        </h1>
        <p>Tatoueurs, coiffeurs, restos, VTC, artisans… Trouve, appelle, note.</p>
      </section>

      <div style={{ height: 16 }} />

      <div className="searchbar">
        <IconSearch size={20} />
        <input
          type="search"
          placeholder="Nom, métier, commune…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher un commerce"
        />
        {q && (
          <button className="clear-btn" onClick={() => setQ('')} aria-label="Effacer la recherche">
            <IconX size={14} />
          </button>
        )}
      </div>

      <div style={{ height: 12 }} />

      <div className="chip-row" role="tablist" aria-label="Catégories">
        <button className={`chip ${cat === null ? 'active' : ''}`} onClick={() => setCat(null)}>
          Tout
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`chip ${cat === c.id ? 'active' : ''}`}
            onClick={() => setCat(cat === c.id ? null : c.id)}
          >
            <span aria-hidden>{c.icone ?? '🏪'}</span>
            {c.nom}
          </button>
        ))}
      </div>

      <div className="row between" style={{ marginTop: 8 }}>
        <span className="hint">
          {loading ? 'Chargement…' : `${filtered.length} commerce${filtered.length > 1 ? 's' : ''}`}
          {!loading && mode && <span title="Source des données"> · {mode === 'api' ? 'API' : mode === 'supabase' ? 'direct' : 'démo'}</span>}
        </span>
        <select
          className="select"
          value={commune ?? ''}
          onChange={(e) => setCommune(e.target.value ? Number(e.target.value) : null)}
          aria-label="Filtrer par commune"
        >
          <option value="">Toute l'île</option>
          {communes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonList n={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Aucun résultat"
          hint="Essaie un autre mot-clé ou change de filtre."
          action={
            <button
              className="btn btn-ghost"
              onClick={() => {
                setQ('')
                setCat(null)
                setCommune(null)
                refresh()
              }}
            >
              Réinitialiser
            </button>
          }
        />
      ) : (
        <div className="card-list">
          {filtered.map((c) => (
            <CommerceCard key={c.id} commerce={c} onOpen={(id) => navigate(`/commerce/${id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
