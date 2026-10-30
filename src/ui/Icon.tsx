import type { ReactNode } from 'react'
import type { Rarity } from '../game/types'
import { RARITY } from '../game/data/classes'

const PATHS: Record<string, ReactNode> = {
  battle: (
    <>
      <path d="M4 20 L15 9 M9 4 l11 11 M4 4 l4 4 M16 16 l4 4" />
      <path d="M14 3 l7 7 -3 3 -7-7 z" />
      <path d="M3 14 l7 7 3-3 -7-7 z" />
    </>
  ),
  character: (
    <>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21 C5 16 8 14 12 14 C16 14 19 16 19 21" />
    </>
  ),
  inventory: (
    <>
      <path d="M5 8 H19 L20 21 H4 Z" />
      <path d="M9 8 V6 C9 3.8 10.4 3 12 3 C13.6 3 15 3.8 15 6 V8" />
      <path d="M8 12 H16" />
    </>
  ),
  equipment: (
    <>
      <path d="M8 4 L12 6 L16 4 L20 7 L19 12 L16 11 V21 H8 V11 L5 12 L4 7 Z" />
    </>
  ),
  skills: (
    <>
      <path d="M5 4 H17 A2 2 0 0 1 19 6 V21 H7 A2 2 0 0 1 5 19 Z" />
      <path d="M5 17 H19" />
      <path d="M9 8 H15" />
    </>
  ),
  pets: (
    <>
      <circle cx="7" cy="8" r="2" />
      <circle cx="17" cy="8" r="2" />
      <circle cx="5" cy="13" r="1.8" />
      <circle cx="19" cy="13" r="1.8" />
      <path d="M12 12 C8 12 6 15 7 18 C8 21 10 21 12 20 C14 21 16 21 17 18 C18 15 16 12 12 12 Z" />
    </>
  ),
  mounts: (
    <>
      <path d="M5 20 L7 12 L13 8 L18 10 L20 16 L17 20" />
      <path d="M7 12 C4 12 3 9 4 6 L8 9" />
      <path d="M13 8 L15 4 L18 5 L17 9" />
    </>
  ),
  stages: (
    <>
      <path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z" />
      <path d="M9 4 V18 M15 6 V20" />
    </>
  ),
  dungeons: (
    <>
      <path d="M4 21 V11 A8 8 0 0 1 20 11 V21" />
      <path d="M8 21 V12 A4 4 0 0 1 16 12 V21" />
      <path d="M10 21 V17 H14 V21" />
    </>
  ),
  blacksmith: (
    <>
      <path d="M3 15 V11 H14 C17 11 19 9 19 6 H22 C22 12 19 15 14 15 H11 V21 H7 V15 Z" />
      <path d="M3 21 H13" />
    </>
  ),
  fusion: (
    <>
      <path d="M7 3 L12 8 L7 13 L2 8 Z" />
      <path d="M17 11 L22 16 L17 21 L12 16 Z" />
      <path d="M8 13 L12 17" />
    </>
  ),
  stones: (
    <>
      <path d="M12 2 L20 8 L17 19 L12 22 L7 19 L4 8 Z" />
      <path d="M12 2 V22 M4 8 L20 19 M20 8 L4 19" />
    </>
  ),
  costumes: (
    <>
      <path d="M4 10 C4 6 8 4 12 4 C16 4 20 6 20 10 L18 20 L14 16 L12 21 L10 16 L6 20 Z" />
      <path d="M8 9 C9 10 10 10 11 9 M13 9 C14 10 15 10 16 9" />
    </>
  ),
  shop: (
    <>
      <path d="M3 5 H5 L7 15 H18 L21 7 H6" />
      <circle cx="8" cy="19" r="1.6" />
      <circle cx="17" cy="19" r="1.6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M19 5 L17 7 M7 17 L5 19" />
    </>
  ),
  coins: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7 V17 M9.5 9.5 C9.5 8.6 10.6 8 12 8 C13.4 8 14.5 8.6 14.5 9.8 C14.5 12 9.5 11.3 9.5 14 C9.5 15.2 10.6 16 12 16 C13.4 16 14.5 15.4 14.5 14.5" />
    </>
  ),
  premium: (
    <>
      <path d="M4 9 L8 4 L12 8 L16 4 L20 9 L18 19 L12 21 L6 19 Z" />
      <path d="M8 4 L10 12 L6 19 M16 4 L14 12 L18 19" />
    </>
  ),
  close: <path d="M6 6 L18 18 M18 6 L6 18" />,
  chevron: <path d="M9 6 L15 12 L9 18" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10 V7 A4 4 0 0 1 16 7 V10" />
    </>
  ),
  check: <path d="M5 12 L10 17 L19 6" />,
  crown: <path d="M3 8 L7 12 L12 5 L17 12 L21 8 L19 19 H5 Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7 V12 L16 14" />
    </>
  ),
  spark: <path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z" />,
  arrow: <path d="M4 12 H20 M14 6 L20 12 L14 18" />,
  flame: <path d="M12 3 C12 8 6 9 6 14 C6 18 9 21 12 21 C15 21 18 18 18 14 C18 10 14 9 12 3 Z" />,
  xp: (
    <>
      <path d="M12 2 L15 9 L22 12 L15 15 L12 22 L9 15 L2 12 L9 9 Z" />
    </>
  ),
  gold: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  plus: <path d="M12 5 V19 M5 12 H19" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11 V17 M12 7.5 V8.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7 H20 M9 7 V4 H15 V7 M6 7 L7 21 H17 L18 7" />
      <path d="M10 11 V17 M14 11 V17" />
    </>
  ),
}

export function Icon({
  name,
  size = 20,
  className = '',
  filled = false,
}: {
  name: keyof typeof PATHS | string
  size?: number
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`icon ${className}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name] ?? PATHS.spark}
    </svg>
  )
}

export function RarityTag({ rarity, children }: { rarity: Rarity; children?: ReactNode }) {
  const r = RARITY[rarity]
  return (
    <span className="rarity-tag" style={{ color: r.color, borderColor: r.color }}>
      {children ?? r.name}
    </span>
  )
}
