/** Formate les horaires (jsonb ou texte) pour l'affichage. */
export function formatHoraires(h: unknown): string {
  if (h == null) return ''
  if (typeof h === 'string') {
    // JSON string → parse ; texte simple → tel quel
    const t = h.trim()
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return formatHoraires(JSON.parse(t))
      } catch {
        return t
      }
    }
    return t
  }
  if (Array.isArray(h)) return h.map((x) => formatHoraires(x)).filter(Boolean).join(' · ')
  if (typeof h === 'object') {
    return Object.entries(h as Record<string, unknown>)
      .map(([jour, val]) => `${jour} : ${formatHoraires(val)}`)
      .join(' · ')
  }
  return String(h)
}
