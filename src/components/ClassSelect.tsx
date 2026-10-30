import { useState } from 'react'
import type { ClassId } from '../game/types'
import { CLASS_LIST, CLASSES } from '../game/data/classes'
import { HeroArt } from '../ui/HeroArt'
import { Backdrop } from '../ui/Backdrop'
import { Icon } from '../ui/Icon'
import { Bar } from '../ui/ui'

const ROLE: Record<ClassId, string> = {
  warrior: 'Bruiser · Frontline',
  mage: 'Spellblade · Burst',
  archer: 'Skirmisher · Precision',
}

export function ClassSelect({ onStart }: { onStart: (classId: ClassId, name: string) => void }) {
  const [selected, setSelected] = useState<ClassId>('warrior')
  const [name, setName] = useState('')
  const cls = CLASSES[selected]
  const maxStat = Math.max(...CLASS_LIST.flatMap((c) => Object.values(c.base)))

  return (
    <div className="class-select">
      <Backdrop palette={{ sky: '#100d18', far: '#1c1829', near: '#080610', glow: '#c9a84c', fog: 'rgba(201,168,76,.10)' }} />
      <div className="class-select-overlay" />
      <div className="ember-field" aria-hidden>
        {Array.from({ length: 26 }).map((_, i) => (
          <span key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 9) * 1.1}s`, animationDuration: `${7 + (i % 6)}s` }} />
        ))}
      </div>

      <div className="class-select-inner">
        <header className="title-lockup">
          <span className="title-glyph">
            <svg viewBox="0 0 60 60" width="46" height="46" aria-hidden>
              <path d="M30 4 L52 16 L52 44 L30 56 L8 44 L8 16 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M30 12 L44 20 L44 40 L30 48 L16 40 L16 20 Z" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
              <path d="M30 18 L36 30 L30 42 L24 30 Z" fill="currentColor" />
            </svg>
          </span>
          <h1>Aetherfall</h1>
          <span className="title-sub">Sundered Realms</span>
          <p>A world stitched from broken kingdoms. An ember in your chest that refuses to go out. Choose how you burn.</p>
        </header>

        <div className="class-cards">
          {CLASS_LIST.map((c) => (
            <button
              key={c.id}
              className={`class-card ${selected === c.id ? 'selected' : ''}`}
              onClick={() => setSelected(c.id)}
              style={{ '--class-color': c.color, '--class-accent': c.accent } as React.CSSProperties}
            >
              <div className="class-card-glow" />
              <span className="class-badge">{ROLE[c.id]}</span>
              <div className="class-card-art">
                <HeroArt classId={c.id} size={210} />
              </div>
              <div className="class-card-body">
                <span className="eyebrow">{c.title}</span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="class-stats-mini">
                  {(Object.keys(c.base) as (keyof typeof c.base)[]).map((key) => (
                    <div className="mini-stat" key={key}>
                      <span>{key.slice(0, 3).toUpperCase()}</span>
                      <div className="mini-track">
                        <i style={{ width: `${(c.base[key] / maxStat) * 100}%`, background: c.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="class-passive">
                  <Icon name="spark" size={13} /> {c.passive}
                </div>
              </div>
              {selected === c.id && <span className="chosen-mark">CHOSEN</span>}
            </button>
          ))}
        </div>

        <div className="start-panel">
          <div className="start-lore">
            <span className="eyebrow">The road ahead</span>
            <p>{cls.lore}</p>
            <div className="start-classline">
              <span style={{ color: cls.accent }}>{cls.name}</span>
              <span className="dot">·</span>
              <span>{cls.primary} focused</span>
              <span className="dot">·</span>
              <span>Weapon: {cls.id === 'warrior' ? 'greatswords' : cls.id === 'mage' ? 'staves' : 'longbows'}</span>
            </div>
          </div>
          <div className="start-form">
            <label htmlFor="hero-name">Name your wanderer</label>
            <input
              id="hero-name"
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={cls.name === 'Warrior' ? 'e.g. Kaelen' : cls.name === 'Mage' ? 'e.g. Seryth' : 'e.g. Morwen'}
            />
            <button className="btn btn-primary btn-lg" onClick={() => onStart(selected, name || 'Wanderer')}>
              <Icon name="flame" size={18} /> Enter the Realms
            </button>
            <p className="fineprint">
              Progress is saved on this device. Purchases are only available through Google Play and are verified server-side.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
