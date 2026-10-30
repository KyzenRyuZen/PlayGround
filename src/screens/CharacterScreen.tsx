import { useGame, game } from '../game/state/store'
import { getPlayerStats } from '../game/engine/stats'
import { CLASSES } from '../game/data/classes'
import { xpToNext } from '../game/engine/progression'
import { HeroArt } from '../ui/HeroArt'
import { Panel, SectionTitle, Bar, Toggle } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { formatStat } from '../game/data/items'
import { companionById, companionLevelBonus } from '../game/data/companions'
import { costumeById } from '../game/data/costumes'
import { toast } from '../ui/format'

const ATTR_LABEL: Record<string, string> = {
  strength: 'Strength',
  intelligence: 'Intelligence',
  dexterity: 'Dexterity',
  vitality: 'Vitality',
}

export function CharacterScreen({ onNavigate }: { onNavigate: (tab: 'equipment' | 'costumes' | 'pets' | 'mounts') => void }) {
  const state = useGame()
  const stats = getPlayerStats(state)
  const cls = CLASSES[state.player.classId]
  const nextXp = xpToNext(state.player.level)
  const pet = state.companions.activePet ? companionById(state.companions.activePet) : null
  const petOwned = state.companions.activePet
    ? state.companions.pets.find((p) => p.id === state.companions.activePet)
    : null
  const mount = state.companions.activeMount ? companionById(state.companions.activeMount) : null
  const mountOwned = state.companions.activeMount
    ? state.companions.mounts.find((p) => p.id === state.companions.activeMount)
    : null
  const costumes = Object.values(state.costumes.equipped).filter(Boolean)

  const allocate = (stat: 'strength' | 'intelligence' | 'dexterity' | 'vitality') => {
    const result = game.allocate(stat)
    if (!result.ok) toast(result.message ?? 'No points available.', 'error')
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="Hero" title={state.player.name}>
        <span className="tag gold">{cls.name} · Level {state.player.level}</span>
      </SectionTitle>

      <div className="character-grid">
        <Panel className="character-portrait-panel">
          <div className="character-portrait">
            <div className="portrait-glow" style={{ background: `radial-gradient(circle, ${cls.color}55, transparent 65%)` }} />
            <HeroArt classId={state.player.classId} size={250} costumeIds={Object.values(state.costumes.equipped)} />
            <span className="portrait-level">LV {state.player.level}</span>
          </div>
          <span className="eyebrow">{cls.title}</span>
          <h3 className="character-name">{state.player.name}</h3>
          <p className="muted center small">{cls.lore}</p>
          <div className="xp-block">
            <div className="xp-labels">
              <span>Experience</span>
              <span>{state.player.xp.toLocaleString()} / {nextXp.toLocaleString()}</span>
            </div>
            <Bar value={state.player.xp} max={nextXp} kind="xp" compact showText={false} />
          </div>
          <div className="power-seal">
            <Icon name="spark" size={18} />
            <strong>{stats.power.toLocaleString()}</strong>
            <span>combat power</span>
          </div>
          <div className="portrait-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('equipment')}>
              <Icon name="equipment" size={15} /> Gear
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('costumes')}>
              <Icon name="costumes" size={15} /> Costumes
            </button>
          </div>
        </Panel>

        <Panel
          title="Attributes"
          className="attributes-panel"
          actions={<span className={`badge ${state.player.freePoints > 0 ? 'gold' : ''}`}>{state.player.freePoints} points</span>}
        >
          <p className="muted small">5 points are gained per level. Auto-assign follows your class's calling.</p>
          <div className="attribute-list">
            {(Object.keys(ATTR_LABEL) as ('strength' | 'intelligence' | 'dexterity' | 'vitality')[]).map((key) => {
              const value = state.player.attributes[key] + cls.base[key]
              const isPrimary = cls.primary === key
              return (
                <div className={`attribute-row ${isPrimary ? 'primary' : ''}`} key={key}>
                  <span className="attr-name">
                    {ATTR_LABEL[key]} {isPrimary && <em>CLASS FOCUS</em>}
                  </span>
                  <span className="attr-value">{value}</span>
                  <button
                    className="plus-btn"
                    onClick={() => allocate(key)}
                    disabled={state.player.freePoints <= 0}
                    aria-label={`Add point to ${ATTR_LABEL[key]}`}
                  >
                    +
                  </button>
                </div>
              )
            })}
          </div>
          <Toggle
            checked={state.player.autoAssign}
            onChange={() => game.toggleAutoAssign()}
            label="Auto-assign stats"
            hint="Spend new points automatically on level up"
          />
          <div className="attr-note">
            <Icon name="info" size={14} />
            <span>
              Strength scales Warrior attack · Intelligence scales Mage attack and MP · Dexterity scales Archer attack and
              Critical Chance · Vitality scales HP and Defense.
            </span>
          </div>
        </Panel>
      </div>

      <div className="two-col stats-and-bonds">
        <Panel title="Combat Statistics">
          <div className="stat-table">
            <div><span>Attack</span><strong>{stats.attack.toLocaleString()}</strong></div>
            <div><span>Defense</span><strong>{stats.defense.toLocaleString()}</strong></div>
            <div><span>Max HP</span><strong>{stats.maxHp.toLocaleString()}</strong></div>
            <div><span>Max MP</span><strong>{stats.maxMp.toLocaleString()}</strong></div>
            <div><span>Critical Chance</span><strong>{formatStat('critChance', stats.critChance * 100)}</strong></div>
            <div><span>Critical Damage</span><strong>{formatStat('critDamage', stats.critDamage * 100)}</strong></div>
            <div><span>Attack Speed</span><strong>{formatStat('attackSpeed', stats.attackSpeed)}</strong></div>
            <div><span>Attack Interval</span><strong>{stats.attackInterval.toFixed(2)}s</strong></div>
            <div><span>Penetration</span><strong>{formatStat('penetration', stats.penetration)}</strong></div>
            <div><span>Monster Damage</span><strong>{formatStat('monsterDamage', stats.monsterDamage)}</strong></div>
            <div><span>Boss Damage</span><strong>{formatStat('bossDamage', stats.bossDamage)}</strong></div>
            <div><span>Lifesteal</span><strong>{formatStat('lifesteal', stats.lifesteal)}</strong></div>
            <div><span>Gold Find</span><strong>{formatStat('goldFind', stats.goldFind)}</strong></div>
            <div><span>Experience Bonus</span><strong>{formatStat('xpBonus', stats.xpBonus)}</strong></div>
          </div>
          <div className="resist-row">
            {Object.entries(stats.resistances)
              .filter(([, v]) => v > 0)
              .map(([element, value]) => (
                <span className="resist-chip" key={element}>
                  {element} {value}%
                </span>
              ))}
            {Object.values(stats.resistances).every((v) => v === 0) && <span className="muted small">No elemental resistances yet.</span>}
          </div>
        </Panel>

        <div className="stack">
          <Panel title="Active Bond" actions={<button className="link-btn" onClick={() => onNavigate('pets')}>Manage</button>}>
            {pet && petOwned ? (
              <div className="bond-row">
                <div className="bond-emblem" style={{ color: '#7fd8c3' }}><Icon name="pets" size={22} /></div>
                <div>
                  <strong>{pet.name}</strong>
                  <span className="muted small">Level {petOwned.level} pet · {Object.entries(pet.bonuses).map(([k, v]) => `${k} +${companionLevelBonus(pet, petOwned.level, k as never)}%`).join(', ')}</span>
                </div>
              </div>
            ) : (
              <p className="muted small">No pet bound. Visit the Bonds screen.</p>
            )}
            {mount && mountOwned ? (
              <div className="bond-row">
                <div className="bond-emblem" style={{ color: '#d2a86a' }}><Icon name="mounts" size={22} /></div>
                <div>
                  <strong>{mount.name}</strong>
                  <span className="muted small">Level {mountOwned.level} mount · {Object.entries(mount.bonuses).map(([k, v]) => `${k} +${companionLevelBonus(mount, mountOwned.level, k as never)}%`).join(', ')}</span>
                </div>
              </div>
            ) : (
              <p className="muted small">No mount bound.</p>
            )}
          </Panel>

          <Panel title="Costumes" actions={<button className="link-btn" onClick={() => onNavigate('costumes')}>Wardrobe</button>}>
            {costumes.length ? (
              <div className="costume-chips">
                {costumes.map((id) => {
                  const c = costumeById(id!)
                  return c ? <span className="costume-chip" key={id} style={{ borderColor: c.accent }}>{c.name}</span> : null
                })}
              </div>
            ) : (
              <p className="muted small">No cosmetics worn. Find them in dungeons or the Premium Shop.</p>
            )}
          </Panel>

          <Panel title="Lifetime">
            <div className="stat-grid">
              <div><span>Kills</span><strong>{state.statistics.kills.toLocaleString()}</strong></div>
              <div><span>Guardians</span><strong>{state.statistics.bosses.toLocaleString()}</strong></div>
              <div><span>Dungeons</span><strong>{state.statistics.dungeonsCleared}</strong></div>
              <div><span>Deaths</span><strong>{state.statistics.deaths}</strong></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
