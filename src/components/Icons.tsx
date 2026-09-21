import type { SVGProps } from 'react'

/**
 * Les icônes du site — quatre, et pas une de plus.
 *
 * Le fichier en portait trente-cinq : loupe, cœur, cloche, étoile, épingle…
 * Tout ce qu'il fallait pour dessiner les pages de l'annuaire classique. Ces
 * pages n'existent plus ; les icônes non plus. Le reste (elles étaient
 * éliminées du paquet par le « tree shaking », mais lues et maintenues ici)
 * ne servait qu'à donner l'illusion d'un catalogue.
 */

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

/** La seule icône de la barre de saisie : l'étincelle de l'assistant. */
export const IconSparkles = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
  </svg>
)

/** Nouvelle conversation. */
export const IconPlus = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconSend = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 11.5 20 4l-7.5 16-2-6.5-6.5-2Z" />
  </svg>
)

/** Le bandeau hors-ligne. */
export const IconWifiOff = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M2 4l20 16" />
    <path d="M8.5 12.5a5 5 0 0 1 5.6-.9" />
    <path d="M5 9.5a10 10 0 0 1 5.2-2.4M14.5 7.6A10 10 0 0 1 19 9.5" />
    <path d="M12 20h.01" />
  </svg>
)
