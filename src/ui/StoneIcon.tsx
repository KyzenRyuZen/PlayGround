import type { Stone } from '../game/types'
import { stoneTypeById } from '../game/data/materials'
import { stoneRarity } from '../game/engine/stones'
import { RARITY } from '../game/data/classes'

export function StoneIcon({ stone, size = 56 }: { stone: Stone; size?: number }) {
  const type = stoneTypeById(stone.typeId)
  const r = RARITY[stoneRarity(stone.grade)]
  const rawId = stone.uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6)
  return (
    <span
      className="stone-icon"
      style={{
        width: size,
        height: size,
        borderColor: r.color,
        boxShadow: `inset 0 0 16px ${type.glow}, 0 0 8px ${type.glow}`,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size - 8} height={size - 8}>
        <defs>
          <linearGradient id={`sg${rawId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="30%" stopColor={type.color} />
            <stop offset="100%" stopColor="#1a1020" />
          </linearGradient>
        </defs>
        <path d="M32 5 L52 19 L47 47 L32 59 L17 47 L12 19 Z" fill={`url(#sg${rawId})`} stroke="#0b0910" strokeWidth="2" />
        <path d="M32 5 L32 59 M12 19 L52 47 M52 19 L12 47" stroke="#ffffff" strokeWidth="0.7" opacity="0.28" />
        <path d="M32 16 L42 26 L32 42 L22 26 Z" fill="#ffffff" opacity="0.18" />
      </svg>
      <span className="stone-level">{stone.level}</span>
    </span>
  )
}

export function StoneTypeDot({ typeId, size = 12 }: { typeId: string; size?: number }) {
  const type = stoneTypeById(typeId)
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: type.color,
        boxShadow: `0 0 8px ${type.glow}`,
      }}
    />
  )
}
