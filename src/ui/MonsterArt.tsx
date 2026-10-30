import { useId } from 'react'
import type { Element, MonsterFamily, MonsterTier } from '../game/types'

const ELEMENT_COLOR: Record<Element, string> = {
  physical: '#c2a77a',
  fire: '#ff7a3d',
  ice: '#8fdcff',
  nature: '#6fce9a',
  shadow: '#a07bff',
  holy: '#ffe09a',
  void: '#c16bff',
}

interface MonsterArtProps {
  family: MonsterFamily
  element?: Element
  tier?: MonsterTier
  size?: number
  className?: string
}

/**
 * Bestiary silhouettes drawn from scratch. Each family gets a distinct
 * anatomy, stance and silhouette; element drives the rim light.
 */
export function MonsterArt({ family, element = 'physical', tier = 'normal', size = 210, className = '' }: MonsterArtProps) {
  const rawId = useId().replace(/:/g, '')
  const accent = ELEMENT_COLOR[element]
  const dark = '#08070c'
  const body = '#211d26'
  const bodyLight = '#332c3a'
  const eye = accent
  const isBoss = tier === 'boss' || tier === 'dungeon'
  const isStone = tier === 'stone'

  return (
    <svg
      viewBox="0 0 240 230"
      width={size}
      height={(size / 240) * 230}
      className={`monster-art ${className}`}
      role="img"
      aria-label={`${family} monster`}
    >
      <defs>
        <linearGradient id={`mbody${rawId}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={bodyLight} />
          <stop offset="70%" stopColor={body} />
          <stop offset="100%" stopColor="#0d0b11" />
        </linearGradient>
        <radialGradient id={`mglow${rawId}`}>
          <stop offset="0%" stopColor={eye} stopOpacity="0.9" />
          <stop offset="45%" stopColor={eye} stopOpacity="0.28" />
          <stop offset="100%" stopColor={eye} stopOpacity="0" />
        </radialGradient>
        <filter id={`mblur${rawId}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <ellipse cx="120" cy="208" rx="78" ry="14" fill="#000" opacity="0.55" />
      <ellipse cx="120" cy="170" rx="88" ry="55" fill={`url(#mglow${rawId})`} opacity={isBoss ? 0.5 : 0.3} />

      {isStone && (
        <g className="stone-shimmer" stroke={accent} fill="none" opacity="0.6">
          <path d="M56 80 l-10 -20 l12 -12" strokeWidth="1.5" />
          <path d="M184 74 l12 -18 l-10 -12" strokeWidth="1.5" />
          <path d="M120 36 l0 -16" strokeWidth="1.5" />
          <circle cx="62" cy="50" r="2" fill={accent} />
          <circle cx="178" cy="46" r="2" fill={accent} />
        </g>
      )}

      {family === 'wolf' && (
        <g className="monster-idle">
          <path d="M62 176 C54 160 58 144 72 138 C88 130 152 130 170 142 C182 150 186 164 180 178 L162 178 L156 196 L142 196 L142 180 L102 180 L98 198 L84 198 L84 178 Z" fill={`url(#mbody${rawId})`} stroke={dark} strokeWidth="2.4" />
          <path d="M60 148 C48 140 42 126 46 114 C60 118 70 126 74 136 Z" fill={body} stroke={dark} strokeWidth="2" />
          <path d="M46 112 L50 96 L58 112 Z" fill={body} stroke={dark} strokeWidth="1.6" />
          <path d="M64 116 L72 102 L78 118 Z" fill={body} stroke={dark} strokeWidth="1.6" />
          <path d="M44 122 C32 118 30 126 38 132 L50 132 Z" fill={dark} />
          <path d="M80 118 C92 112 104 114 110 124 C104 132 92 134 82 130 Z" fill={bodyLight} stroke={dark} strokeWidth="1.4" />
          <path d="M60 140 C50 146 44 158 46 170 C54 166 62 160 66 152 Z" fill={body} stroke={dark} strokeWidth="1.6" />
          <path d="M176 150 C192 140 202 128 198 118 C188 124 180 132 172 140 Z" fill={body} stroke={dark} strokeWidth="1.6" />
          <path d="M60 118 L72 120" stroke={eye} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M78 118 L88 120" stroke={eye} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M54 128 L64 132 M56 126 L62 140" stroke="#d8cfc0" strokeWidth="1.4" />
          <path d="M86 168 L92 180 M116 168 L120 182 M148 170 L150 182" stroke={dark} strokeWidth="3" opacity="0.6" />
          {isBoss && <path d="M44 108 L36 90 L50 100 L54 84 L60 100" fill="none" stroke={accent} strokeWidth="2" opacity="0.8" />}
        </g>
      )}

      {family === 'bear' && (
        <g className="monster-idle">
          <path d="M54 178 C44 158 52 138 72 132 C96 124 152 126 172 140 C186 150 190 168 182 180 L164 180 L158 198 L144 198 L142 182 L100 182 L94 200 L80 200 L80 180 Z" fill={`url(#mbody${rawId})`} stroke={dark} strokeWidth="2.4" />
          <path d="M64 136 C54 124 58 110 70 104 C84 100 96 112 96 124 Z" fill={bodyLight} stroke={dark} strokeWidth="2" />
          <path d="M66 106 L60 92 L72 100 Z" fill={body} stroke={dark} strokeWidth="1.6" />
          <path d="M88 106 L94 92 L98 104 Z" fill={body} stroke={dark} strokeWidth="1.6" />
          <path d="M72 118 L82 120" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M88 122 L98 124" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M74 130 Q84 138 94 130" fill="none" stroke={dark} strokeWidth="2" />
          <path d="M82 134 L80 146 M90 134 L92 146" stroke="#e3d9c6" strokeWidth="2" />
          <path d="M48 150 C34 156 32 174 42 184 C52 176 56 164 58 156 Z" fill={body} stroke={dark} strokeWidth="2" />
          <path d="M174 146 C190 146 198 160 194 174 C184 168 178 160 172 154 Z" fill={body} stroke={dark} strokeWidth="2" />
          <path d="M58 150 C54 166 60 178 68 182" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.45" />
          <path d="M156 150 C162 164 158 176 152 180" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35" />
          <path d="M108 128 C112 122 120 122 124 128 C120 134 112 134 108 128 Z" fill={accent} opacity="0.25" />
        </g>
      )}

      {family === 'orc' && (
        <g className="monster-idle">
          <path d="M96 116 C88 138 84 170 82 192 L110 192 L112 152 L130 152 L132 192 L160 192 C158 168 154 136 146 116 Z" fill={body} stroke={dark} strokeWidth="2.2" />
          <path d="M88 128 C68 120 60 102 68 90 C82 96 94 108 98 120 Z" fill={bodyLight} stroke={dark} strokeWidth="2" />
          <path d="M148 128 C170 120 178 102 170 90 C156 96 144 108 140 120 Z" fill={bodyLight} stroke={dark} strokeWidth="2" />
          <path d="M96 96 C94 78 110 68 120 68 C132 68 148 78 146 96 L144 116 C138 126 102 126 96 116 Z" fill="#3a3b32" stroke={dark} strokeWidth="2" />
          <path d="M104 104 L114 104" stroke="#ffb347" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M126 104 L136 104" stroke="#ffb347" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M106 112 L110 122 L114 112 M126 112 L130 122 L134 112" fill="#d8c9a5" stroke={dark} strokeWidth="1" />
          <path d="M100 88 L92 72 L108 82 M140 88 L148 72 L132 82" fill={dark} stroke={accent} strokeWidth="1.4" />
          <path d="M92 132 L108 136 L106 154 L90 150 Z" fill="#4b4234" stroke={dark} strokeWidth="1.6" />
          <path d="M148 132 L132 136 L134 154 L150 150 Z" fill="#4b4234" stroke={dark} strokeWidth="1.6" />
          {/* Axe */}
          <path d="M174 88 L188 190" stroke="#5a4028" strokeWidth="5" strokeLinecap="round" />
          <path d="M166 92 C180 78 200 82 206 96 C194 104 178 104 166 100 Z" fill="#6b7178" stroke={dark} strokeWidth="2" />
          <path d="M170 96 L198 96" stroke="#aab0b6" strokeWidth="1.2" opacity="0.7" />
          <path d="M84 188 L82 202 L108 202 L110 188 M132 188 L130 202 L158 202 L160 188" fill="#151217" stroke={dark} strokeWidth="1.6" />
        </g>
      )}

      {family === 'undead' && (
        <g className="monster-idle">
          <path d="M96 120 C90 148 88 176 94 196 L110 196 L112 160 L128 160 L130 196 L146 196 C152 176 150 148 144 120 Z" fill="#1c1922" stroke={dark} strokeWidth="2" />
          <path d="M96 120 C88 110 86 100 92 92 C104 96 112 106 114 116 Z" fill="#2a2732" stroke={dark} strokeWidth="1.8" />
          <path d="M144 120 C152 110 154 100 148 92 C136 96 128 106 126 116 Z" fill="#2a2732" stroke={dark} strokeWidth="1.8" />
          <path d="M102 88 C102 70 138 70 138 88 L136 108 C132 118 108 118 104 108 Z" fill="#b9ad98" stroke={dark} strokeWidth="2" />
          <path d="M106 84 C108 72 132 72 134 84 L132 94 L108 94 Z" fill="#d6cdbd" opacity="0.5" />
          <path d="M108 92 L116 94 L114 102 L108 100 Z" fill={dark} />
          <path d="M124 94 L132 92 L132 100 L126 102 Z" fill={dark} />
          <path d="M117 104 L123 104 L122 108 L118 108 Z" fill={dark} />
          <path d="M110 108 L130 108 L128 116 L112 116 Z" fill="#7d7568" />
          <path d="M110 110 L110 116 M116 110 L116 116 M122 110 L122 116 M128 110 L128 116" stroke={dark} strokeWidth="1" />
          {/* Rib cage */}
          <path d="M106 130 C116 136 124 136 134 130 M106 138 C116 144 124 144 134 138 M108 146 C116 151 124 151 132 146" fill="none" stroke="#4e4756" strokeWidth="1.4" />
          {/* Sword */}
          <path d="M172 96 L166 196" stroke="#717883" strokeWidth="4" strokeLinecap="round" />
          <path d="M160 96 L182 96" stroke="#4b4237" strokeWidth="3" />
          <path d="M166 96 L166 74" stroke="#717883" strokeWidth="2" />
          <path d="M162 74 L170 74 L168 66 L164 66 Z" fill="#8d949c" />
          <path d="M150 196 L154 210 L170 210 L170 196" fill="#141116" stroke={dark} strokeWidth="1.4" />
          <path d="M86 200 L96 200 L96 208 L84 208 Z" fill="#0d0b10" />
          <path d="M144 200 L154 200 L156 208 L144 208 Z" fill="#0d0b10" />
          <circle cx="120" cy="82" r="24" fill={`url(#mglow${rawId})`} opacity="0.2" />
        </g>
      )}

      {family === 'demon' && (
        <g className="monster-idle">
          <path d="M84 138 C52 120 34 128 24 158 C48 154 62 162 78 174 Z" fill="#261a24" stroke={dark} strokeWidth="2" />
          <path d="M156 138 C188 120 206 128 216 158 C192 154 178 162 162 174 Z" fill="#261a24" stroke={dark} strokeWidth="2" />
          <path d="M84 132 C44 116 28 132 22 154 M156 132 C196 116 212 132 218 154" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
          <path d="M96 118 C90 146 88 176 86 198 L110 198 L112 160 L128 160 L130 198 L154 198 C152 176 150 146 144 118 Z" fill="#2a1520" stroke={dark} strokeWidth="2.2" />
          <path d="M96 120 C88 110 88 100 96 96 C108 100 114 110 114 120 Z" fill="#3a1a28" stroke={dark} strokeWidth="1.8" />
          <path d="M144 120 C152 110 152 100 144 96 C132 100 126 110 126 120 Z" fill="#3a1a28" stroke={dark} strokeWidth="1.8" />
          <path d="M104 84 C104 68 136 68 136 84 L134 106 C130 116 110 116 106 106 Z" fill="#3d1f2c" stroke={dark} strokeWidth="2" />
          <path d="M104 84 C98 70 88 64 80 68 C88 78 92 86 96 94 M136 84 C142 70 152 64 160 68 C152 78 148 86 144 94" fill="none" stroke="#5e3324" strokeWidth="4" strokeLinecap="round" />
          <path d="M108 90 L116 92" stroke={eye} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M124 92 L132 90" stroke={eye} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M112 102 L120 108 L128 102" fill="none" stroke="#a85060" strokeWidth="1.4" />
          <path d="M114 108 L116 114 M120 110 L120 116 M126 108 L124 114" stroke="#d8c9a5" strokeWidth="1" />
          <path d="M92 130 L78 140 L84 154 L98 148 Z" fill="#3a1a28" stroke={accent} strokeWidth="1.2" />
          <path d="M148 130 L162 140 L156 154 L142 148 Z" fill="#3a1a28" stroke={accent} strokeWidth="1.2" />
          <path d="M102 154 C112 148 128 148 138 154" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
          <path d="M86 198 L84 210 L108 210 L110 198 M132 198 L130 210 L154 210 L156 198" fill="#0e0a10" stroke={dark} strokeWidth="1.4" />
          <circle cx="120" cy="110" r="28" fill={`url(#mglow${rawId})`} opacity="0.18" />
        </g>
      )}

      {family === 'dragon' && (
        <g className="monster-idle">
          <path d="M92 150 C50 122 22 134 18 174 C48 162 70 168 86 184 Z" fill="#24120f" stroke={dark} strokeWidth="2" />
          <path d="M148 150 C190 122 218 134 222 174 C192 162 170 168 154 184 Z" fill="#24120f" stroke={dark} strokeWidth="2" />
          <path d="M80 156 C40 138 28 152 30 168 M160 156 C200 138 212 152 210 168" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.4" />
          <path d="M96 140 C88 164 86 186 90 202 L110 202 L114 172 L126 172 L130 202 L150 202 C154 186 152 164 144 140 Z" fill="#3a1a18" stroke={dark} strokeWidth="2.2" />
          <path d="M104 132 C100 108 108 92 124 88 C142 96 150 116 142 136 C132 146 112 146 104 132 Z" fill="#3a1a18" stroke={dark} strokeWidth="2" />
          <path d="M116 96 C108 82 108 70 116 60 C126 74 128 86 126 96 Z" fill="#4b211b" stroke={dark} strokeWidth="1.8" />
          <path d="M134 98 C142 84 150 78 158 84 C150 92 144 100 140 108 Z" fill="#4b211b" stroke={dark} strokeWidth="1.6" />
          <path d="M110 106 L118 108" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M128 108 L136 106" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M118 116 Q124 120 130 116" fill="none" stroke="#d8b06a" strokeWidth="1.4" />
          <path d="M114 122 L114 132 M120 124 L120 134 M126 122 L126 132" stroke="#d8d0bd" strokeWidth="1.4" />
          <path d="M142 140 C158 148 168 160 172 176 C160 172 148 168 140 160 Z" fill="#4b211b" stroke={dark} strokeWidth="1.6" />
          <path d="M90 200 L88 212 L110 212 L112 200 M130 200 L128 212 L152 212 L154 200" fill="#100b0a" />
          <path d="M104 146 C112 152 134 152 142 146" fill="none" stroke="#e2703a" strokeWidth="1" opacity="0.5" />
          <path d="M58 186 C50 194 46 202 48 208" fill="none" stroke={dark} strokeWidth="3" />
        </g>
      )}

      {family === 'golem' && (
        <g className="monster-idle">
          <path d="M82 106 L62 92 L48 108 L62 124 L58 164 L84 174 L96 146 L100 118 Z" fill="#2b2b30" stroke={dark} strokeWidth="2" />
          <path d="M158 106 L178 92 L192 108 L178 124 L182 164 L156 174 L144 146 L140 118 Z" fill="#2b2b30" stroke={dark} strokeWidth="2" />
          <path d="M94 118 C82 146 80 176 84 198 L110 198 L112 160 L128 160 L130 198 L156 198 C160 176 158 146 146 118 Z" fill="#36343b" stroke={dark} strokeWidth="2.4" />
          <path d="M100 104 C98 84 112 74 120 74 C130 74 144 84 142 104 L140 118 C134 130 106 130 100 118 Z" fill="#2f2d34" stroke={dark} strokeWidth="2" />
          <path d="M104 98 L114 98" stroke={isStone ? '#ffd27a' : accent} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M126 98 L136 98" stroke={isStone ? '#ffd27a' : accent} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M108 110 L120 114 L132 110" fill="none" stroke={dark} strokeWidth="2" />
          <path d="M114 88 L126 88 L126 98 L114 98 Z" fill={isStone ? '#6b4a1f' : '#26242b'} stroke={dark} strokeWidth="1.2" />
          {/* Rune core */}
          <circle cx="120" cy="148" r="14" fill={isStone ? '#c9942f' : '#514a5c'} stroke={dark} strokeWidth="2" />
          <path d="M120 138 L126 148 L120 158 L114 148 Z" fill={isStone ? '#ffe6a0' : accent} className="golem-core" />
          <path d="M120 134 L120 162 M106 148 L134 148" stroke={isStone ? '#ffe6a0' : accent} strokeWidth="0.8" opacity="0.45" />
          {/* Cracks */}
          <path d="M86 130 L94 138 L90 146 M154 130 L146 138 L150 146" fill="none" stroke={isStone ? '#d8a640' : accent} strokeWidth="1" opacity="0.5" />
          <path d="M96 118 L102 124 L98 132 M144 118 L138 124 L142 132" fill="none" stroke="#0a080c" strokeWidth="2" />
          <path d="M84 198 L82 212 L110 212 L112 198 M130 198 L128 212 L156 212 L158 198" fill="#19181d" stroke={dark} strokeWidth="1.6" />
          {isStone && (
            <g fill="#ffcf5c" opacity="0.85" className="stone-crystals">
              <path d="M64 96 L58 112 L68 108 L72 120 L76 100 Z" />
              <path d="M168 100 L164 116 L174 110 L180 122 L182 102 Z" />
            </g>
          )}
        </g>
      )}

      {family === 'spirit' && (
        <g className="monster-idle">
          <path d="M120 54 C90 54 76 80 80 118 C84 154 94 184 120 194 C146 184 156 154 160 118 C164 80 150 54 120 54 Z" fill="#221d2e" stroke={dark} strokeWidth="2" opacity="0.94" />
          <path d="M96 100 C88 126 92 162 104 184 M144 100 C152 126 148 162 136 184" fill="none" stroke={accent} strokeWidth="1" opacity="0.35" />
          <path d="M102 86 C104 72 136 72 138 86 L136 106 C132 116 108 116 104 106 Z" fill="#0d0b12" />
          <path d="M108 94 L116 96" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M124 96 L132 94" stroke={eye} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M114 108 Q120 112 126 108" fill="none" stroke={accent} strokeWidth="1" opacity="0.6" />
          <path d="M96 130 C106 136 134 136 144 130" fill="none" stroke="#4a4158" strokeWidth="1.2" />
          <path d="M120 140 L128 154 L120 168 L112 154 Z" fill={accent} opacity="0.55" className="spirit-core" />
          <path d="M82 160 C66 168 58 182 60 196 C74 188 86 184 96 184 Z" fill="#1a1622" stroke={dark} strokeWidth="1.4" />
          <path d="M158 160 C174 168 182 182 180 196 C166 188 154 184 144 184 Z" fill="#1a1622" stroke={dark} strokeWidth="1.4" />
          <path d="M120 194 L112 216 L120 208 L128 216 Z" fill="#1a1622" stroke={dark} strokeWidth="1.2" />
          <g className="spirit-wisps" fill={accent}>
            <circle cx="72" cy="110" r="2.5" opacity="0.7" />
            <circle cx="168" cy="88" r="1.8" opacity="0.5" />
            <circle cx="156" cy="150" r="2" opacity="0.6" />
            <circle cx="78" cy="170" r="1.4" opacity="0.4" />
          </g>
        </g>
      )}

      {family === 'seraph' && (
        <g className="monster-idle">
          <path d="M92 126 C52 104 28 116 20 146 C44 140 66 146 84 164 Z" fill="#2a2633" stroke={dark} strokeWidth="2" />
          <path d="M148 126 C188 104 212 116 220 146 C196 140 174 146 156 164 Z" fill="#2a2633" stroke={dark} strokeWidth="2" />
          <path d="M70 132 C44 126 32 136 30 150 M170 132 C196 126 208 136 210 150" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
          <path d="M98 120 C92 148 90 176 90 198 L112 198 L114 160 L126 160 L128 198 L150 198 C150 176 148 148 142 120 Z" fill="#3a3642" stroke={dark} strokeWidth="2.2" />
          <path d="M98 122 C90 112 90 100 98 96 C110 100 116 110 116 122 Z" fill="#4a4554" stroke={dark} strokeWidth="1.8" />
          <path d="M142 122 C150 112 150 100 142 96 C130 100 124 110 124 122 Z" fill="#4a4554" stroke={dark} strokeWidth="1.8" />
          <path d="M104 86 C104 68 136 68 136 86 L134 106 C130 116 110 116 106 106 Z" fill="#d8c6a8" stroke={dark} strokeWidth="2" />
          <path d="M106 84 C108 72 132 72 134 84 L132 92 L108 92 Z" fill="#8f8878" opacity="0.5" />
          <path d="M108 94 L116 96" stroke={eye} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M124 96 L132 94" stroke={eye} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M116 108 L124 108" stroke="#7b5a4a" strokeWidth="1.2" />
          <path d="M112 76 L120 58 L128 76" fill="none" stroke={accent} strokeWidth="2.4" />
          <ellipse cx="120" cy="54" rx="22" ry="6" fill="none" stroke={accent} strokeWidth="1.6" opacity="0.8" className="seraph-halo" />
          <path d="M96 126 C104 134 136 134 144 126" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.6" />
          <path d="M90 198 L88 212 L112 212 L114 198 M126 198 L126 212 L150 212 L152 198" fill="#18151d" />
          <path d="M120 146 L126 156 L120 166 L114 156 Z" fill={accent} opacity="0.5" />
          {isBoss && (
            <g fill={accent} opacity="0.8" className="seraph-broken">
              <path d="M96 62 L88 50 L96 54 L98 44 L104 56 Z" />
              <path d="M144 62 L152 50 L144 54 L142 44 L136 56 Z" />
            </g>
          )}
        </g>
      )}

      {/* Boss crown / aura */}
      {isBoss && (
        <g className="monster-aura">
          <ellipse cx="120" cy="204" rx="86" ry="17" fill="none" stroke={accent} strokeWidth="1" opacity="0.35" strokeDasharray="3 8" />
          <path d="M120 26 L124 34 L132 36 L126 42 L128 50 L120 46 L112 50 L114 42 L108 36 L116 34 Z" fill={accent} opacity="0.6" />
        </g>
      )}
      {tier === 'elite' && (
        <path d="M120 30 L124 38 L132 40 L126 46 L128 54 L120 50 L112 54 L114 46 L108 40 L116 38 Z" fill={accent} opacity="0.5" />
      )}
    </svg>
  )
}

export function elementColor(element: Element | undefined): string {
  return ELEMENT_COLOR[element ?? 'physical']
}
