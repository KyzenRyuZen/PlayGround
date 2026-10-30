import type { CompanionDef, StatKey } from '../game/types'
import { useGame, game } from '../game/state/store'
import { COMPANION_MAX_LEVEL, MOUNTS, PETS, companionById, companionLevelBonus, companionUpgradeCost } from '../game/data/companions'
import { RARITY } from '../game/data/classes'
import { CompanionArt } from '../ui/CompanionArt'
import { Panel, SectionTitle, EmptyState } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/format'

const LABEL: Partial<Record<StatKey, string>> = {
  attackPct: 'Attack',
  defensePct: 'Defense',
  hpPct: 'Max HP',
  critChance: 'Critical Chance',
  critDamage: 'Critical Damage',
  attackSpeed: 'Attack Speed',
  penetration: 'Penetration',
  monsterDamage: 'Monster Damage',
  bossDamage: 'Boss Damage',
  fireResist: 'Fire Resistance',
  iceResist: 'Ice Resistance',
  natureResist: 'Nature Resistance',
  shadowResist: 'Shadow Resistance',
  holyResist: 'Holy Resistance',
  voidResist: 'Void Resistance',
  goldFind: 'Gold Find',
  xpBonus: 'Experience Bonus',
  lifesteal: 'Lifesteal',
}

function Bonuses({ def, level }: { def: CompanionDef; level: number }) {
  return (
    <div className="companion-bonuses">
      {(Object.keys(def.bonuses) as StatKey[]).map((key) => (
        <span key={key}>
          +{companionLevelBonus(def, level, key as never)}% {LABEL[key] ?? key}
        </span>
      ))}
    </div>
  )
}

export function CompanionScreen({
  kind,
  onNavigate,
}: {
  kind: 'pet' | 'mount'
  onNavigate: (tab: 'pets' | 'mounts' | 'shop') => void
}) {
  const state = useGame()
  const defs = kind === 'pet' ? PETS : MOUNTS
  const ownedList = kind === 'pet' ? state.companions.pets : state.companions.mounts
  const activeId = kind === 'pet' ? state.companions.activePet : state.companions.activeMount
  const activeOwned = ownedList.find((c) => c.id === activeId)
  const activeDef = activeId ? companionById(activeId) : null
  const essenceId = kind === 'pet' ? 'pet_essence' : 'mount_essence'
  const essence = state.materials[essenceId]
  const ownedIds = new Set(ownedList.map((c) => c.id))

  const activate = (id: string) => {
    if (kind === 'pet') game.setActivePet(activeId === id ? null : id)
    else game.setActiveMount(activeId === id ? null : id)
    toast(activeId === id ? 'Companion dismissed.' : 'Companion bound.', 'success')
  }

  const upgrade = (id: string) => {
    const result = game.upgradeCompanion(kind, id)
    toast(result.message ?? (result.ok ? 'Companion empowered.' : 'Cannot empower.'), result.ok ? 'success' : 'error')
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="Bonds" title={kind === 'pet' ? 'Pets & Familiars' : 'Mounts & Steeds'}>
        <button className={`filter-chip ${kind === 'pet' ? 'active' : ''}`} onClick={() => onNavigate('pets')}>
          <Icon name="pets" size={14} /> Pets
        </button>
        <button className={`filter-chip ${kind === 'mount' ? 'active' : ''}`} onClick={() => onNavigate('mounts')}>
          <Icon name="mounts" size={14} /> Mounts
        </button>
        <span className="tag muted"><Icon name="essence" size={13} /> {essence} essence</span>
        <button className="link-btn" onClick={() => onNavigate('shop')}>Get more in the shop</button>
      </SectionTitle>

      {activeDef && activeOwned ? (
        <Panel className="companion-active" >
          <div className="companion-active-art">
            <CompanionArt def={activeDef} size={220} level={activeOwned.level} />
          </div>
          <div className="companion-active-body">
            <span className="eyebrow">Bound Companion</span>
            <h2 style={{ color: RARITY[activeDef.rarity].color }}>{activeDef.name}</h2>
            <span className="tag" style={{ borderColor: RARITY[activeDef.rarity].color, color: RARITY[activeDef.rarity].color }}>
              {RARITY[activeDef.rarity].name} {kind}
            </span>
            <p className="muted">{activeDef.description}</p>
            <div className="companion-level-row">
              <span>Level {activeOwned.level} / {COMPANION_MAX_LEVEL}</span>
              <div className="quality-track"><i style={{ width: `${(activeOwned.level / COMPANION_MAX_LEVEL) * 100}%` }} /></div>
            </div>
            <Bonuses def={activeDef} level={activeOwned.level} />
            <div className="companion-actions">
              <div className="skill-cost">
                <span><Icon name="coins" size={13} /> {companionUpgradeCost(activeOwned.level).toLocaleString()}</span>
                <span><Icon name="essence" size={13} /> {1 + Math.floor(activeOwned.level / 4)} {kind === 'pet' ? 'Beast Essence' : 'Tether Essence'}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => upgrade(activeDef.id)} disabled={activeOwned.level >= COMPANION_MAX_LEVEL}>
                {activeOwned.level >= COMPANION_MAX_LEVEL ? 'Max Level' : 'Empower'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => activate(activeDef.id)}>Dismiss</button>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel>
          <EmptyState icon={kind === 'pet' ? 'pets' : 'mounts'} title={`No ${kind} bound`}>
            Bind a companion below to gain permanent passive bonuses. Only one pet and one mount can be active.
          </EmptyState>
        </Panel>
      )}

      <h3 className="collection-title">Your Collection <span className="muted">({ownedList.length} / {defs.length})</span></h3>
      <div className="companion-grid">
        {defs.map((def) => {
          const owned = ownedList.find((c) => c.id === def.id)
          const active = activeId === def.id
          if (!owned) {
            return (
              <div className="companion-card locked" key={def.id}>
                <div className="locked-overlay">
                  <div className="companion-lock-icon"><Icon name="lock" size={24} /></div>
                  <CompanionArt def={def} size={110} />
                </div>
                <span className="eyebrow" style={{ color: RARITY[def.rarity].color }}>{RARITY[def.rarity].name}</span>
                <strong>???</strong>
                <p className="muted small">Not yet bound. Found in the Ember Vault, dungeons, or the Premium Shop.</p>
              </div>
            )
          }
          return (
            <div className={`companion-card ${active ? 'active' : ''}`} key={def.id}>
              {active && <span className="active-ribbon">BOUND</span>}
              <CompanionArt def={def} size={120} level={owned.level} />
              <span className="eyebrow" style={{ color: RARITY[def.rarity].color }}>{RARITY[def.rarity].name}</span>
              <strong>{def.name}</strong>
              <p className="muted small">{def.description}</p>
              <Bonuses def={def} level={owned.level} />
              <div className="companion-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => activate(def.id)}>
                  {active ? 'Dismiss' : 'Bind'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => upgrade(def.id)} disabled={owned.level >= COMPANION_MAX_LEVEL}>
                  {owned.level >= COMPANION_MAX_LEVEL ? 'Max' : `Lv ${owned.level + 1}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {ownedIds.size === 0 && (
        <Panel className="info-panel">
          <Icon name="info" size={16} />
          <p>Your first pet, Ashling, should be waiting. If not, visit the Premium Shop or clear a dungeon for companion essences and eggs.</p>
        </Panel>
      )}
    </div>
  )
}
