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

export const IconWifiOff = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M2 4l20 16" />
    <path d="M8.5 12.5a5 5 0 0 1 5.6-.9" />
    <path d="M5 9.5a10 10 0 0 1 5.2-2.4M14.5 7.6A10 10 0 0 1 19 9.5" />
    <path d="M12 20h.01" />
  </svg>
)

export const IconX = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconShare = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v12" />
    <path d="m8 7 4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
)

export const IconSun = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
  </svg>
)

export const IconMoon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
  </svg>
)

export const IconDownload = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v11" />
    <path d="m8 10 4 4 4-4" />
    <path d="M5 19h14" />
  </svg>
)
