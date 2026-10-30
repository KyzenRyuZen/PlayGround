import { useId } from 'react'

interface BackdropProps {
  palette: { sky: string; far: string; near: string; glow: string; fog: string }
  boss?: boolean
  className?: string
}

/** Layered parallax-style fantasy landscape, drawn as pure SVG. */
export function Backdrop({ palette, boss = false, className = '' }: BackdropProps) {
  const id = useId().replace(/:/g, '')
  return (
    <div className={`backdrop ${className}`} style={{ background: palette.sky }} aria-hidden>
      <svg viewBox="0 0 800 420" preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id={`moon${id}`} cx="0.5" cy="0.5">
            <stop offset="0%" stopColor={palette.glow} stopOpacity="0.95" />
            <stop offset="55%" stopColor={palette.glow} stopOpacity="0.25" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`far${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.far} />
            <stop offset="100%" stopColor={palette.sky} />
          </linearGradient>
          <linearGradient id={`near${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.near} />
            <stop offset="100%" stopColor="#050409" />
          </linearGradient>
          <filter id={`fog${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        <rect width="800" height="420" fill={palette.sky} />
        <circle cx="640" cy="92" r="120" fill={`url(#moon${id})`} opacity={boss ? 0.85 : 0.6} />
        <circle cx="640" cy="92" r="34" fill={palette.glow} opacity={boss ? 0.5 : 0.28} />
        <g fill={`url(#far${id})`} opacity="0.9">
          <path d="M0 300 L80 210 L140 255 L210 160 L300 260 L380 190 L470 270 L540 205 L640 285 L720 220 L800 280 L800 420 L0 420 Z" />
        </g>
        <g fill={palette.far} opacity="0.55">
          <path d="M0 330 L100 270 L180 310 L260 250 L350 320 L440 265 L520 315 L620 255 L710 320 L800 285 L800 420 L0 420 Z" />
        </g>
        <g fill={`url(#near${id})`}>
          <path d="M0 372 L60 330 L110 360 L170 320 L240 368 L320 340 L390 380 L470 335 L540 372 L620 330 L700 370 L800 340 L800 420 L0 420 Z" />
        </g>
        <g stroke={palette.glow} strokeWidth="1" opacity="0.25">
          <path d="M60 330 L60 300 M170 320 L170 285 M320 340 L320 300 M470 335 L470 292 M620 330 L620 296" />
        </g>
        <ellipse cx="400" cy="352" rx="440" ry="58" fill={palette.fog} filter={`url(#fog${id})`} />
        <ellipse cx="240" cy="330" rx="260" ry="32" fill={palette.fog} filter={`url(#fog${id})`} opacity="0.7" />
        <g fill={palette.glow} className="backdrop-motes">
          <circle cx="120" cy="150" r="1.6" opacity="0.5" />
          <circle cx="220" cy="220" r="1.1" opacity="0.35" />
          <circle cx="320" cy="120" r="1.8" opacity="0.45" />
          <circle cx="520" cy="180" r="1.2" opacity="0.3" />
          <circle cx="700" cy="250" r="1.5" opacity="0.4" />
          <circle cx="440" cy="90" r="1" opacity="0.3" />
          <circle cx="80" cy="300" r="1.4" opacity="0.35" />
        </g>
        {boss && (
          <g stroke={palette.glow} fill="none" opacity="0.25">
            <path d="M0 40 C120 10 200 80 320 40 S560 10 800 60" strokeWidth="1" />
            <path d="M0 70 C140 40 220 110 360 70 S600 40 800 90" strokeWidth="0.6" />
          </g>
        )}
      </svg>
      <div className="backdrop-vignette" />
    </div>
  )
}
