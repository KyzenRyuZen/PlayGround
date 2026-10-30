import { useId } from 'react'
import type { ClassId } from '../game/types'
import { CLASSES } from '../game/data/classes'
import { costumeById } from '../game/data/costumes'

interface HeroArtProps {
  classId: ClassId
  size?: number
  costumeIds?: (string | undefined)[]
  className?: string
  pose?: 'idle' | 'battle'
}

/**
 * Original hand-drawn vector heroes. Every class has a distinct silhouette,
 * palette, weapon and posture. Cosmetics alter cloak, hair, weapon glow and aura.
 */
export function HeroArt({ classId, size = 260, costumeIds = [], className = '', pose = 'idle' }: HeroArtProps) {
  const rawId = useId().replace(/[:]/g, '')
  const cls = CLASSES[classId]
  const costumes = costumeIds.map((id) => (id ? costumeById(id) : undefined)).filter(Boolean)
  const armorCos = costumes.find((c) => c?.slot === 'armor')
  const weaponCos = costumes.find((c) => c?.slot === 'weapon')
  const hairCos = costumes.find((c) => c?.slot === 'hair')
  const effectCos = costumes.find((c) => c?.slot === 'effect')

  const accent = armorCos?.accent ?? cls.color
  const accentLight = cls.accent
  const glow = weaponCos?.glow ?? effectCos?.glow ?? `${cls.color}88`
  const skin = '#cfae94'
  const dark = '#0b0810'

  return (
    <svg
      viewBox="0 0 240 300"
      width={size}
      height={(size / 240) * 300}
      className={`hero-art ${className}`}
      role="img"
      aria-label={`${cls.name} character`}
    >
      <defs>
        <linearGradient id={`cloak${rawId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="60%" stopColor={accent} stopOpacity="0.86" />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`metal${rawId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8e8a96" />
          <stop offset="42%" stopColor="#3a3642" />
          <stop offset="100%" stopColor="#17141c" />
        </linearGradient>
        <linearGradient id={`cloth${rawId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentLight} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
        <radialGradient id={`orb${rawId}`}>
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="45%" stopColor={accentLight} />
          <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
        </radialGradient>
        <filter id={`soft${rawId}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Aura */}
      <ellipse cx="120" cy="268" rx="62" ry="13" fill={glow} opacity="0.32" filter={`url(#soft${rawId})`} />
      {effectCos && (
        <g className="hero-aura" stroke={effectCos.accent} fill="none">
          <ellipse cx="120" cy="264" rx="56" ry="11" strokeWidth="1.4" opacity="0.7" />
          <ellipse cx="120" cy="264" rx="72" ry="15" strokeWidth="0.8" opacity="0.35" strokeDasharray="2 7" />
        </g>
      )}

      {classId === 'warrior' && (
        <g className={pose === 'battle' ? 'hero-battle' : 'hero-idle'}>
          {/* Cloak */}
          <path d="M96 112 C70 130 60 190 50 246 C78 236 94 240 104 250 L120 160 Z" fill={`url(#cloak${rawId})`} opacity="0.92" />
          <path d="M144 112 C170 130 180 186 190 244 C164 236 148 242 140 250 L120 160 Z" fill={`url(#cloak${rawId})`} opacity="0.78" />
          {/* Legs */}
          <path d="M100 208 L96 258 L82 268 L112 268 L114 212 Z" fill={`url(#metal${rawId})`} stroke={dark} strokeWidth="2" />
          <path d="M140 208 L146 256 L160 268 L130 268 L126 212 Z" fill={`url(#metal${rawId})`} stroke={dark} strokeWidth="2" />
          <path d="M80 264 L114 264 L114 272 L78 272 Z" fill="#1a1518" stroke="#3c3138" />
          <path d="M160 264 L128 264 L128 272 L162 272 Z" fill="#1a1518" stroke="#3c3138" />
          {/* Torso */}
          <path d="M94 120 C104 110 136 110 146 120 L154 202 C136 214 104 214 86 202 Z" fill={`url(#metal${rawId})`} stroke={dark} strokeWidth="2.4" />
          <path d="M120 122 L120 206" stroke="#0c0a10" strokeWidth="2" opacity="0.6" />
          <path d="M98 150 Q120 164 142 150" fill="none" stroke={accentLight} strokeWidth="2" opacity="0.7" />
          {/* Pauldrons */}
          <path d="M96 116 C80 112 70 124 72 140 C86 146 96 138 102 128 Z" fill={`url(#metal${rawId})`} stroke={dark} strokeWidth="2" />
          <path d="M144 116 C160 112 172 124 170 140 C156 146 144 138 138 128 Z" fill={`url(#metal${rawId})`} stroke={dark} strokeWidth="2" />
          <path d="M72 132 L72 140" stroke={accent} strokeWidth="3" />
          {/* Belt */}
          <path d="M88 196 L152 196 L150 208 L90 208 Z" fill="#2a1c18" stroke="#5c4232" strokeWidth="1.4" />
          <circle cx="120" cy="202" r="5" fill={accentLight} stroke={dark} strokeWidth="1.4" />
          {/* Arms */}
          <path d="M84 140 C72 160 70 178 76 194 L92 190 C88 174 92 158 100 148 Z" fill={`url(#metal${rawId})`} stroke={dark} strokeWidth="2" />
          <path d="M156 140 C168 160 170 180 162 196 L146 192 C152 174 150 158 142 148 Z" fill={`url(#metal${rawId})`} stroke={dark} strokeWidth="2" />
          {/* Head */}
          <path d="M106 94 C106 78 134 78 134 94 L132 112 C132 124 108 124 108 112 Z" fill={skin} stroke={dark} strokeWidth="2" />
          <path d="M104 100 C100 80 140 74 136 100 L138 88 C134 70 106 70 102 88 Z" fill={`url(#metal${rawId})`} stroke={dark} strokeWidth="1.6" />
          <path d="M106 96 C100 88 96 78 100 72 C104 86 112 90 120 90 C128 90 136 86 140 72 C144 78 140 88 134 96 Z" fill={accent} opacity="0.85" />
          <path d="M96 78 Q104 60 118 68 Q112 54 100 60 Q90 66 96 78 Z" fill="#241a1e" stroke={accent} strokeWidth="1.2" />
          <path d="M144 78 Q136 60 122 68 Q128 54 140 60 Q150 66 144 78 Z" fill="#241a1e" stroke={accent} strokeWidth="1.2" />
          <path d="M111 102 L117 102" stroke="#1a1012" strokeWidth="2" />
          <path d="M125 102 L131 102" stroke="#1a1012" strokeWidth="2" />
          <path d="M116 113 Q121 116 126 113" fill="none" stroke="#7b4d45" strokeWidth="1.4" />
          {/* Greatsword */}
          <g transform="translate(172 44) rotate(9)">
            <path d="M0 0 L10 12 L8 176 L2 190 L-4 176 L-6 12 Z" fill={weaponCos ? weaponCos.accent : '#c8c9d2'} stroke={dark} strokeWidth="2" />
            <path d="M2 8 L2 172" stroke="#ffffff" strokeWidth="1.2" opacity="0.45" />
            <path d="M-20 8 L22 8 L22 16 L-20 16 Z" fill="#6c5330" stroke={dark} strokeWidth="1.4" />
            <path d="M-2 16 L6 16 L6 46 L-2 46 Z" fill="#39281a" stroke={dark} strokeWidth="1.2" />
            <circle cx="2" cy="-2" r="5" fill={weaponCos ? weaponCos.accent : accentLight} stroke={dark} strokeWidth="1.4" />
          </g>
        </g>
      )}

      {classId === 'mage' && (
        <g className={pose === 'battle' ? 'hero-battle' : 'hero-idle'}>
          {/* Robe */}
          <path d="M118 108 C96 130 76 208 62 264 C92 254 100 262 120 262 C140 262 150 254 178 264 C164 208 144 130 122 108 Z" fill={`url(#cloth${rawId})`} stroke={dark} strokeWidth="2.2" />
          <path d="M120 124 L120 260" stroke="#0d0b14" strokeWidth="2" opacity="0.5" />
          <path d="M88 232 Q120 244 152 232" fill="none" stroke={accentLight} strokeWidth="1.6" opacity="0.6" />
          <path d="M82 248 Q120 258 158 248" fill="none" stroke={accentLight} strokeWidth="1" opacity="0.35" />
          {/* Mantle */}
          <path d="M96 118 C108 106 132 106 144 118 L156 150 C136 162 104 162 84 150 Z" fill="#1a1524" stroke={accent} strokeWidth="1.8" />
          <path d="M84 150 C96 158 144 158 156 150" stroke={accentLight} strokeWidth="2" fill="none" opacity="0.8" />
          {/* Arms */}
          <path d="M92 138 C82 160 84 178 96 190 L106 182 C98 168 100 152 104 144 Z" fill={`url(#cloth${rawId})`} stroke={dark} strokeWidth="1.8" />
          <path d="M148 138 C158 158 158 172 150 184 L140 178 C146 166 144 152 138 144 Z" fill={`url(#cloth${rawId})`} stroke={dark} strokeWidth="1.8" />
          <path d="M96 186 C96 194 108 194 108 186" fill="none" stroke={skin} strokeWidth="5" strokeLinecap="round" />
          {/* Head + hood */}
          <path d="M106 92 C106 76 134 76 134 92 L132 112 C130 122 110 122 108 112 Z" fill={skin} stroke={dark} strokeWidth="1.8" />
          <path d="M94 106 C88 76 108 62 120 62 C134 62 152 76 146 106 C140 94 134 86 120 86 C108 86 100 92 94 106 Z" fill={armorCos?.accent ?? '#2b2240'} stroke={dark} strokeWidth="1.8" />
          <path d="M94 106 C92 118 100 126 104 130 L110 112 Z" fill={armorCos?.accent ?? '#2b2240'} stroke={dark} strokeWidth="1.4" />
          <path d="M146 106 C148 118 140 126 136 130 L130 112 Z" fill={armorCos?.accent ?? '#2b2240'} stroke={dark} strokeWidth="1.4" />
          <path d="M111 101 L117 101" stroke="#241820" strokeWidth="2" />
          <path d="M125 101 L131 101" stroke="#241820" strokeWidth="2" />
          <path d="M117 115 Q121 117 124 115" fill="none" stroke="#7b4d45" strokeWidth="1.2" />
          {/* Hair accent */}
          {hairCos && (
            <path d="M104 100 C108 88 120 82 132 90" fill="none" stroke={hairCos.accent} strokeWidth="4" strokeLinecap="round" opacity="0.9" />
          )}
          {/* Staff */}
          <g transform="translate(168 80)">
            <path d="M0 0 L0 186" stroke="#4a3826" strokeWidth="5" strokeLinecap="round" />
            <path d="M-2 22 Q-14 12 -12 0 Q-4 4 0 14" fill="none" stroke="#6b5234" strokeWidth="2.4" />
            <circle cx="0" cy="-2" r="18" fill={`url(#orb${rawId})`} />
            <circle cx="0" cy="-2" r="24" fill="none" stroke={accentLight} strokeWidth="0.8" opacity="0.45" />
            <path d="M-7 -9 L7 -9 M0 -16 L0 12" stroke="#fff8e2" strokeWidth="1" opacity="0.7" />
          </g>
          {/* Floating runes */}
          <g className="hero-runes" fill={accentLight} opacity="0.8">
            <circle cx="64" cy="120" r="1.6" />
            <circle cx="56" cy="160" r="1.2" />
            <path d="M178 180 l5 5 l-5 5 l-5 -5 z" />
            <path d="M58 214 l4 4 l-4 4 l-4 -4 z" />
          </g>
        </g>
      )}

      {classId === 'archer' && (
        <g className={pose === 'battle' ? 'hero-battle' : 'hero-idle'}>
          {/* Cloak */}
          <path d="M100 116 C78 140 70 200 64 250 C88 240 100 244 108 252 L120 156 Z" fill={`url(#cloak${rawId})`} opacity="0.9" />
          <path d="M140 116 C164 136 174 194 180 248 C158 240 144 244 134 252 L120 156 Z" fill={`url(#cloak${rawId})`} opacity="0.7" />
          {/* Legs */}
          <path d="M102 204 L96 254 L84 266 L110 266 L116 208 Z" fill="#2b2a2f" stroke={dark} strokeWidth="2" />
          <path d="M138 204 L144 252 L156 266 L130 266 L124 208 Z" fill="#232228" stroke={dark} strokeWidth="2" />
          <path d="M82 262 L112 262 L112 270 L80 270 Z" fill="#19161b" />
          <path d="M158 262 L128 262 L128 270 L160 270 Z" fill="#19161b" />
          {/* Torso */}
          <path d="M100 120 C110 112 130 112 140 120 L146 198 C130 210 110 210 94 198 Z" fill="#3a3430" stroke={dark} strokeWidth="2.2" />
          <path d="M98 126 L142 126 L138 142 L102 142 Z" fill={armorCos?.accent ?? '#4b5b46'} opacity="0.9" />
          <path d="M100 158 C112 166 128 166 140 158" fill="none" stroke="#7a633c" strokeWidth="2" />
          <path d="M94 198 L146 198 L144 208 L96 208 Z" fill="#2a2119" stroke="#54402a" />
          {/* Quiver */}
          <path d="M140 132 L158 120 L166 154 L148 162 Z" fill="#3b2a1c" stroke={dark} strokeWidth="1.6" />
          <path d="M151 122 L154 112 M157 125 L162 116 M162 128 L168 121" stroke="#b9a46a" strokeWidth="2" strokeLinecap="round" />
          {/* Arms */}
          <path d="M96 140 C86 158 84 176 90 190 L102 186 C98 172 100 156 106 146 Z" fill="#3a3430" stroke={dark} strokeWidth="2" />
          <path d="M142 140 C154 154 164 168 170 180 L160 188 C152 172 142 160 134 150 Z" fill="#3a3430" stroke={dark} strokeWidth="2" />
          {/* Head */}
          <path d="M106 94 C106 78 134 78 134 94 L132 112 C130 122 110 122 108 112 Z" fill={skin} stroke={dark} strokeWidth="1.8" />
          <path d="M96 108 C94 82 108 66 120 66 C134 66 148 82 144 108 C138 94 130 88 120 88 C110 88 102 94 96 108 Z" fill={armorCos?.accent ?? '#33402f'} stroke={dark} strokeWidth="1.8" />
          <path d="M96 108 C94 120 100 126 106 130 L108 112 Z" fill={armorCos?.accent ?? '#33402f'} stroke={dark} strokeWidth="1.4" />
          <path d="M144 108 C146 120 140 126 134 130 L132 112 Z" fill={armorCos?.accent ?? '#33402f'} stroke={dark} strokeWidth="1.4" />
          <path d="M110 102 L117 102" stroke="#17301f" strokeWidth="2" />
          <path d="M125 102 L132 102" stroke="#17301f" strokeWidth="2" />
          <path d="M116 114 Q121 117 126 114" fill="none" stroke="#7b4d45" strokeWidth="1.2" />
          {hairCos && (
            <path d="M104 104 C98 122 100 136 108 144" fill="none" stroke={hairCos.accent} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
          )}
          {/* Bow */}
          <path d="M176 104 C196 140 196 194 172 230" fill="none" stroke="#8c6b3e" strokeWidth="4" strokeLinecap="round" />
          <path d="M176 104 C186 140 186 194 172 230" fill="none" stroke="#3a2a18" strokeWidth="1.2" />
          <path d="M175 106 L172 228" stroke="#d8cba4" strokeWidth="0.8" />
          <path d="M172 166 L186 166" stroke={weaponCos?.accent ?? '#c8d8b0'} strokeWidth="2" strokeLinecap="round" />
          <path d="M186 166 l-8 -4 l0 8 z" fill={weaponCos?.accent ?? '#c8d8b0'} />
        </g>
      )}

      {/* Ember motes */}
      <g className="hero-motes" fill={accentLight}>
        <circle cx="70" cy="240" r="1.4" opacity="0.7" />
        <circle cx="180" cy="220" r="1" opacity="0.5" />
        <circle cx="160" cy="250" r="1.6" opacity="0.6" />
      </g>
    </svg>
  )
}
