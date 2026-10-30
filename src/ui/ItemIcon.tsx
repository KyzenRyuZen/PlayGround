import type { Rarity, SlotId } from '../game/types'
import { RARITY } from '../game/data/classes'

const GLYPHS: Record<SlotId, JSX.Element> = {
  weapon: (
    <g>
      <path d="M32 8 L38 16 L34 42 L32 48 L30 42 L26 16 Z" fill="currentColor" />
      <path d="M20 14 L44 14 L44 19 L20 19 Z" fill="currentColor" opacity="0.75" />
      <path d="M30 19 L34 19 L34 30 L30 30 Z" fill="currentColor" opacity="0.6" />
      <circle cx="32" cy="8" r="3" fill="currentColor" />
    </g>
  ),
  armor: (
    <g>
      <path d="M20 18 L26 12 L32 16 L38 12 L44 18 L42 34 L36 32 L36 52 L28 52 L28 32 L22 34 Z" fill="currentColor" />
      <path d="M32 20 L32 48" stroke="#0b0910" strokeWidth="1.2" opacity="0.5" />
      <path d="M24 24 L28 24 M36 24 L40 24" stroke="#0b0910" strokeWidth="1.2" opacity="0.5" />
    </g>
  ),
  helmet: (
    <g>
      <path d="M18 34 C18 20 26 12 32 12 C38 12 46 20 46 34 L46 42 L38 42 L38 52 L26 52 L26 42 L18 42 Z" fill="currentColor" />
      <path d="M24 32 L40 32 L40 38 L24 38 Z" fill="#0b0910" opacity="0.55" />
      <path d="M32 12 L32 30" stroke="#0b0910" strokeWidth="1.2" opacity="0.4" />
    </g>
  ),
  shield: (
    <g>
      <path d="M32 8 L48 15 L45 38 C42 46 36 51 32 54 C28 51 22 46 19 38 L16 15 Z" fill="currentColor" />
      <path d="M32 15 L32 47 M22 24 L42 24" stroke="#0b0910" strokeWidth="1.4" opacity="0.5" />
    </g>
  ),
  bracelet: (
    <g>
      <circle cx="32" cy="32" r="16" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="32" cy="16" r="4.5" fill="currentColor" />
      <circle cx="32" cy="16" r="2" fill="#0b0910" opacity="0.5" />
    </g>
  ),
  earring: (
    <g>
      <path d="M32 12 C22 12 18 22 22 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 26 L39 36 L32 52 L25 36 Z" fill="currentColor" />
      <path d="M32 31 L32 47" stroke="#0b0910" strokeWidth="1" opacity="0.45" />
    </g>
  ),
  necklace: (
    <g>
      <path d="M18 14 C20 32 26 36 32 36 C38 36 44 32 46 14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 34 L40 42 L32 54 L24 42 Z" fill="currentColor" />
      <circle cx="32" cy="43" r="2.5" fill="#0b0910" opacity="0.5" />
    </g>
  ),
  shoes: (
    <g>
      <path d="M16 28 L26 28 L28 42 L44 44 C50 45 52 48 52 52 L16 52 Z" fill="currentColor" />
      <path d="M16 44 L50 46" stroke="#0b0910" strokeWidth="2" opacity="0.5" />
      <path d="M24 34 L28 40 M32 36 L36 42" stroke="#0b0910" strokeWidth="1.4" opacity="0.45" />
    </g>
  ),
  belt: (
    <g>
      <path d="M8 26 L56 26 L56 38 L8 38 Z" fill="currentColor" />
      <rect x="24" y="22" width="16" height="20" rx="2" fill="#0b0910" opacity="0.55" />
      <rect x="27" y="25" width="10" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 30 L56 30" stroke="#0b0910" strokeWidth="1" opacity="0.35" />
    </g>
  ),
}

interface ItemIconProps {
  slot: SlotId
  rarity: Rarity
  plus?: number
  size?: number
  locked?: boolean
  className?: string
}

export function ItemIcon({ slot, rarity, plus = 0, size = 58, locked, className = '' }: ItemIconProps) {
  const r = RARITY[rarity]
  return (
    <span
      className={`item-icon rarity-${rarity} ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: r.color,
        boxShadow: `inset 0 0 18px ${r.glow}, 0 0 10px ${r.glow}`,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size - 10} height={size - 10} style={{ color: r.color }}>
        {GLYPHS[slot]}
      </svg>
      {plus > 0 && <span className="item-plus">+{plus}</span>}
      {locked && <span className="item-lock">◆</span>}
    </span>
  )
}

export function SlotGlyph({ slot, size = 24 }: { slot: SlotId; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ color: 'currentColor' }}>
      {GLYPHS[slot]}
    </svg>
  )
}
