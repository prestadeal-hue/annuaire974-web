import type { SVGProps } from 'react'

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

/* ── Navigation & interface ──────────────────────────────────────── */

export const IconSearch = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const IconHome = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
)

export const IconHeart = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 20.5s-8-4.9-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.1c0 5.5-8 10.4-8 10.4Z" />
  </svg>
)

export const IconBell = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)

export const IconUser = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5" />
  </svg>
)

export const IconMenu = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const IconX = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconChevronRight = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const IconChevronDown = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const IconChevronUp = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m6 15 6-6 6 6" />
  </svg>
)

export const IconMinus = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14" />
  </svg>
)

export const IconPlus = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconArrowUp = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 19V5m-6 6 6-6 6 6" />
  </svg>
)

export const IconArrowLeft = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M19 12H5m6-6-6 6 6 6" />
  </svg>
)

export const IconSend = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 11.5 20 4l-7.5 16-2-6.5-6.5-2Z" />
  </svg>
)

export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

/* ── Fiche commerce ──────────────────────────────────────────────── */

export const IconPin = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

export const IconPhone = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 3h4l1.5 5L8 10a13 13 0 0 0 6 6l2-2.5 5 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />
  </svg>
)

export const IconClock = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
)

export const IconStar = ({ size, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size)} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.9 6.4 20l1.3-6.2L3 9.5l6.3-.7Z" />
  </svg>
)

export const IconInfo = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)

export const IconShare = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v12" />
    <path d="m8 7 4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
)

export const IconWhatsapp = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3a9 9 0 0 0-7.7 13.7L3 21l4.4-1.2A9 9 0 1 0 12 3Z" />
    <path d="M8.5 8.5c0 3 2.5 5.5 5.5 5.5.6 0 1.2-.4 1.5-1l-1.6-.8-1 .8a5.5 5.5 0 0 1-2.4-2.4l.8-1L10 8c-.6.3-1.5.4-1.5 1Z" />
  </svg>
)

export const IconDownload = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v11" />
    <path d="m8 10 4 4 4-4" />
    <path d="M5 19h14" />
  </svg>
)

export const IconMap = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
    <path d="M9 3v15M15 6v15" />
  </svg>
)

export const IconWifiOff = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M2 4l20 16" />
    <path d="M8.5 12.5a5 5 0 0 1 5.6-.9" />
    <path d="M5 9.5a10 10 0 0 1 5.2-2.4M14.5 7.6A10 10 0 0 1 19 9.5" />
    <path d="M12 20h.01" />
  </svg>
)

export const IconChart = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 19V5m0 14h16" />
    <path d="m7 15 3-4 3 2 5-7" />
  </svg>
)

export const IconSparkles = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
  </svg>
)

export const IconTag = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </svg>
)

export const IconLightbulb = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.6 1 .6 1.7V16h6v-.5c0-.7.1-1.3.6-1.7A6 6 0 0 0 12 3Z" />
  </svg>
)

/* ── Catégories (remplacent les émojis de la base) ───────────────── */

export const IconPen = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 19l7-7-4-4-7 7v4h4Z" />
    <path d="m5 21 2-2M15 5l3-3 4 4-3 3" />
  </svg>
)

export const IconScissors = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <path d="M8 8l12 10M20 6 8 16" />
  </svg>
)

export const IconUtensils = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 3v7a3 3 0 0 0 6 0V3M8 10v11" />
    <path d="M17 3c-1.5 2-2 4-2 6s.5 3 2 3 2-1 2-3-.5-4-2-6ZM17 12v9" />
  </svg>
)

export const IconCar = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 16v3M19 16v3" />
    <path d="M3 12l2-5a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 7l2 5v4H3v-4Z" />
    <path d="M7 15h.01M17 15h.01" />
  </svg>
)

export const IconWrench = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4L15 12l-3-3 2.7-2.7Z" />
  </svg>
)

export const IconBolt = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
)

export const IconActivity = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />
  </svg>
)

export const IconStethoscope = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 3v5a4 4 0 0 0 8 0V3" />
    <path d="M9 12v3a5 5 0 0 0 10 0v-1" />
    <circle cx="19" cy="11" r="2" />
  </svg>
)

export const IconBook = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
    <path d="M4 19.5V6.5" />
  </svg>
)

export const IconStore = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" />
    <path d="M3 9l1.5-5h15L21 9M9 21v-6h6v6" />
  </svg>
)

export const IconInbox = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 13h4l1.5 3h5L16 13h4" />
    <path d="M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5l2-8Z" />
  </svg>
)
