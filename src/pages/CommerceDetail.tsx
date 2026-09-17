import { useEffect, useState } from 'react'
import type { Avis, Commerce } from '../types'
import { getAvis, postAvis } from '../lib/api'
import { useApp } from '../context/AppContext'
import { useToast } from '../components/Toast'
import { EmptyState, SkeletonList, Stars } from '../components/States'
import { IconClock, IconHeart, IconPhone, IconPin, IconShare, IconStar } from '../components/Icons'

export function CommerceDetail({ id, navigate }: { id: number; navigate: (to: string) => void }) {
  const { commerceById, isFav, toggleFav } = useApp()
  const toast = useToast()

  const c: Commerce | undefined = commerceById(id)
  const [avis, setAvis] = useState<Avis[] | null>(null)
  const [note, setNote] = useState(5)
  const [pseudo, setPseudo] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [sending, setSending] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    let alive = true
    setAvis(null)
    void getAvis(id)
      .then((a) => alive && setAvis(a))
      .catch(() => alive && setAvis([]))
    return () => {
      alive = false
    }
  }, [id])

  if (!c) {
    return (
      <EmptyState
        emoji="🤷"
        title="Commerce introuvable"
        hint="Il a peut-être été retiré de l'annuaire."
        action={
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
        }
      />
    )
  }

  const fav = isFav(c.id)

  const submitAvis = async () => {
    if (!pseudo.trim() || !commentaire.trim()) {
      toast('Ajoute un pseudo et un commentaire', 'err')
      return
    }
    setSending(true)
    try {
      await postAvis({ commerce_id: c.id, auteur: pseudo.trim(), note, commentaire: commentaire.trim() })
      toast('Merci pour ton avis !')
      setPseudo('')
      setCommentaire('')
      setNote(5)
      setAvis((prev) => [
        { id: Date.now(), commerce_id: c.id, auteur: pseudo.trim(), note, commentaire: commentaire.trim(), cree_le: new Date().toISOString() },
        ...(prev ?? []),
      ])
    } catch {
      toast('Publication impossible pour le moment', 'err')
    } finally {
      setSending(false)
    }
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: c.nom, text: `${c.nom} — Annuaire 974`, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast('Lien copié !')
      }
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      /* partage annulé */
    }
  }

  const telHref = c.telephone ? `tel:${c.telephone.replace(/\s/g, '')}` : undefined
  const waHref = c.whatsapp
    ? `https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`
    : undefined

  return (
    <div className="fade-in">
      <button className="icon-btn" style={{ margin: '0 0 8px -8px' }} onClick={() => navigate('/')} aria-label="Retour">
        ←
      </button>

      <section className="detail-hero">
        <div className="emoji" aria-hidden>{c.categorie?.icone ?? '🏪'}</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{c.nom}</h1>
        <p style={{ margin: '6px 0 0', color: 'rgb(255 255 255 / 0.85)', fontSize: '0.95rem' }}>
          {c.categorie?.nom}
          {c.communes?.nom ? ` · ${c.communes.nom}` : ''}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          {typeof c.note_moyenne === 'number' && c.note_moyenne > 0 && (
            <span className="rating" style={{ color: '#fff' }}>
              <span className="star" style={{ color: '#FBBF24' }}>★</span>
              {c.note_moyenne.toFixed(1).replace('.', ',')}
              {typeof c.nb_avis === 'number' && <span className="count" style={{ color: 'rgb(255 255 255 / 0.7)' }}>({c.nb_avis})</span>}
            </span>
          )}
        </div>
      </section>

      <div className="row" style={{ marginTop: 14, gap: 10 }}>
        {telHref && (
          <a className="btn btn-primary grow" href={telHref}>
            <IconPhone size={18} /> Appeler
          </a>
        )}
        {waHref && (
          <a className="btn btn-coral" href={waHref} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        )}
        <button className={`fav-btn ${fav ? 'on' : ''}`} style={{ background: 'var(--bg-sunken)' }} onClick={() => toggleFav(c.id)} aria-label="Favori">
          <IconHeart size={20} />
        </button>
        <button className="icon-btn" onClick={share} aria-label="Partager" style={{ background: 'var(--bg-sunken)' }}>
          {shared ? '✓' : <IconShare size={20} />}
        </button>
      </div>

      <section className="section">
        <h2 className="section-title">Infos</h2>
        {c.description && (
          <div className="info-row">
            <span className="ico">ℹ️</span>
            <div>
              <div className="lbl">Description</div>
              <div className="val" style={{ fontWeight: 400 }}>{c.description}</div>
            </div>
          </div>
        )}
        {c.adresse && (
          <div className="info-row">
            <span className="ico"><IconPin size={18} /></span>
            <div>
              <div className="lbl">Adresse</div>
              <div className="val">{c.adresse}</div>
            </div>
          </div>
        )}
        {c.horaires && (
          <div className="info-row">
            <span className="ico"><IconClock size={18} /></span>
            <div>
              <div className="lbl">Horaires</div>
              <div className="val">{c.horaires}</div>
            </div>
          </div>
        )}
        {c.telephone && (
          <div className="info-row">
            <span className="ico"><IconPhone size={18} /></span>
            <div>
              <div className="lbl">Téléphone</div>
              <div className="val">{c.telephone}</div>
            </div>
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Avis clients ({avis?.length ?? '…'})</h2>
        {!avis ? (
          <SkeletonList n={2} />
        ) : avis.length === 0 ? (
          <p className="hint">Aucun avis pour le moment — sois le premier !</p>
        ) : (
          avis.map((a) => (
            <article key={a.id} className="review">
              <div className="head">
                <span className="avatar" aria-hidden>{(a.auteur ?? '?')[0]?.toUpperCase()}</span>
                <div className="grow">
                  <div className="author">{a.auteur ?? 'Anonyme'}</div>
                  <div className="date">{a.cree_le ? new Date(a.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</div>
                </div>
                <Stars note={a.note} />
              </div>
              {a.commentaire && <p>{a.commentaire}</p>}
            </article>
          ))
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Donner ton avis</h2>
        <div className="review">
          <div className="star-input" role="radiogroup" aria-label="Note">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} className={i <= note ? 'on' : ''} onClick={() => setNote(i)} role="radio" aria-checked={i === note} aria-label={`${i} étoile${i > 1 ? 's' : ''}`}>
                <IconStar size={24} filled={i <= note} />
              </button>
            ))}
          </div>
          <input
            className="searchbar"
            style={{ marginTop: 12 }}
            placeholder="Ton pseudo"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={40}
          />
          <textarea
            className="searchbar"
            style={{ marginTop: 10, minHeight: 84, borderRadius: 'var(--r-md)', resize: 'vertical' }}
            placeholder="Ton commentaire…"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            maxLength={600}
          />
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={submitAvis} disabled={sending}>
            {sending ? 'Envoi…' : 'Publier mon avis'}
          </button>
        </div>
      </section>
    </div>
  )
}
