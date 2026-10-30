import type { CompanionDef } from '../game/types'
import { RARITY } from '../game/data/classes'
import { MonsterArt } from './MonsterArt'

interface CompanionArtProps {
  def: CompanionDef
  size?: number
  level?: number
}

/** Pets and mounts reuse the bestiary silhouettes at companion scale. */
export function CompanionArt({ def, size = 120, level }: CompanionArtProps) {
  const r = RARITY[def.rarity]
  return (
    <div className="companion-art" style={{ width: size, height: size * 0.9 }}>
      <div className="companion-glow" style={{ background: `radial-gradient(circle, ${r.glow}, transparent 68%)` }} />
      <MonsterArt
        family={def.family}
        element={def.kind === 'pet' ? 'nature' : 'physical'}
        tier={def.rarity === 'divine' ? 'boss' : 'normal'}
        size={size * 0.92}
      />
      {level !== undefined && <span className="companion-level">Lv {level}</span>}
    </div>
  )
}
