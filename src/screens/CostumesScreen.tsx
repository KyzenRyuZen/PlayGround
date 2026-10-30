import { useState } from 'react'
import type { CostumeDef, StatKey } from '../game/types'
import { useGame, game } from '../game/state/store'
import { COSTUMES, COSTUME_SLOT_LABEL, costumeById } from '../game/data/costumes'
import { RARITY } from '../game/data/classes'
import { HeroArt } from '../ui/HeroArt'
import { Panel, SectionTitle, EmptyState } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/format'

const BONUS_LABEL: Partial<Record<StatKey, string>> = {
  attack: 'Attack',
  defense: 'Defense',
  hp: 'Max HP',
  attackPct: 'Attack',
  defensePct: 'Defense',
  hpPct: 'Max HP',
  critChance: 'Crit Chance',
  critDamage: 'Crit Damage',
  attackSpeed: 'Attack Speed',
  penetration: 'Penetration',
  monsterDamage: 'Monster Damage',
  bossDamage: 'Boss Damage',
  fireResist: 'Fire Resist',
  iceResist: 'Ice Resist',
  natureResist: 'Nature Resist',
  shadowResist: 'Shadow Resist',
  holyResist: 'Holy Resist',
  voidResist: 'Void Resist',
  goldFind: 'Gold Find',
  xpBonus: 'XP Bonus',
  lifesteal: 'Lifesteal',
}

type SlotFilter = 'all' | CostumeDef['slot']

export function CostumesScreen({ onNavigateShop }: { onNavigateShop: () => void }) {
  const state = useGame()
  const [filter, setFilter] = useState<SlotFilter>('all')
  const [previewId, setPreviewId] = useState<string | null>(null)

  const preview = previewId ? costumeById(previewId) : null
  const equippedIds = Object.values(state.costumes.equipped).filter(Boolean) as string[]
  const shown = COSTUMES.filter((c) => filter === 'all' || c.slot === filter)
  const previewEquipped = preview ? equippedIds.filter((id) => costumeById(id)?.slot !== preview.slot) : equippedIds
  const artCostumeIds = preview ? [...previewEquipped, preview.id] : equippedIds

  const equip = (def: CostumeDef) => {
    if (!state.costumes.owned.includes(def.id)) {
      toast('This costume is not yet owned.', 'error')
      return
    }
    const result = game.equipCostume(def.id)
    toast(result.message ?? (result.ok ? `${def.name} equipped.` : 'Cannot equip costume.'), result.ok ? 'success' : 'error')
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="The Wardrobe" title="Costumes & Skins">
        <span className="tag gold">{equippedIds.length} worn</span>
        <button className="btn btn-ghost btn-sm" onClick={onNavigateShop}>
          <Icon name="shop" size={15} /> Visit the shop
        </button>
      </SectionTitle>

      <div className="costume-layout">
        <Panel className="costume-preview">
          <div className="costume-stage">
            <div className="costume-aura" style={{ background: preview ? `radial-gradient(circle, ${preview.glow ?? preview.accent}55, transparent 66%)` : undefined }} />
            <HeroArt classId={state.player.classId} size={280} costumeIds={artCostumeIds} />
            <span className="costume-stage-label">{preview ? 'PREVIEW' : 'CURRENTLY WORN'}</span>
          </div>
          <h3>{state.player.name}</h3>
          <span className="muted small">Level {state.player.level} · {equippedIds.length ? 'Adorned for war' : 'Plain travelling clothes'}</span>
          <div className="equipped-costume-list">
            {(['armor', 'weapon', 'hair', 'effect'] as CostumeDef['slot'][]).map((slot) => {
              const def = costumeById(state.costumes.equipped[slot] ?? '')
              return (
                <div className="equipped-costume-row" key={slot}>
                  <span className="slot-tag">{COSTUME_SLOT_LABEL[slot]}</span>
                  {def ? (
                    <>
                      <span style={{ color: def.accent }}>{def.name}</span>
                      <button className="icon-btn tiny" onClick={() => game.unequipCostume(slot)} title="Remove">
                        <Icon name="close" size={13} />
                      </button>
                    </>
                  ) : (
                    <span className="muted">none</span>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel title="Cosmetic Bonuses" className="costume-bonus-panel">
          {preview ? (
            <>
              <span className="eyebrow" style={{ color: RARITY[preview.rarity].color }}>{RARITY[preview.rarity].name} · {COSTUME_SLOT_LABEL[preview.slot]}</span>
              <h3 style={{ color: preview.accent }}>{preview.name}</h3>
              <p className="muted small">{preview.description}</p>
              <div className="costume-bonus-list">
                {(Object.entries(preview.bonuses) as [StatKey, number][]).map(([key, value]) => (
                  <span key={key}>
                    {BONUS_LABEL[key] ?? key} <strong>+{value}{key.includes('Resist') || ['critChance', 'critDamage', 'attackSpeed', 'penetration', 'attackPct', 'defensePct', 'hpPct', 'monsterDamage', 'bossDamage', 'goldFind', 'xpBonus', 'lifesteal'].includes(key) ? '%' : ''}</strong>
                  </span>
                ))}
              </div>
              <div className="costume-bonus-actions">
                {state.costumes.owned.includes(preview.id) ? (
                  <button className="btn btn-primary btn-sm" onClick={() => equip(preview)}>
                    <Icon name="check" size={14} /> Equip
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={onNavigateShop}>
                    <Icon name="shop" size={14} /> Unlock in shop
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewId(null)}>Clear preview</button>
              </div>
            </>
          ) : (
            <>
              <div className="bonus-summary">
                <div className="bonus-ring"><Icon name="costumes" size={26} /></div>
                <h3>Wear your story</h3>
                <p className="muted small">
                  Costumes change the hero's silhouette, weapon glow, hair and aura. Every cosmetic carries a small
                  passive bonus. Four pieces can be worn at once: armor, weapon, hair and effect.
                </p>
              </div>
              <div className="costume-bonus-list">
                {equippedIds.length ? (
                  equippedIds.map((id) => {
                    const def = costumeById(id)
                    if (!def) return null
                    return (
                      <span key={id}>
                        {def.name} <strong>{(Object.entries(def.bonuses) as [StatKey, number][]).map(([k, v]) => `+${v}% ${BONUS_LABEL[k] ?? k}`).join(' · ')}</strong>
                      </span>
                    )
                  })
                ) : (
                  <span className="muted">No costume bonuses active.</span>
                )}
              </div>
            </>
          )}
        </Panel>
      </div>

      <div className="costume-filter-row">
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {(['armor', 'weapon', 'hair', 'effect'] as CostumeDef['slot'][]).map((slot) => (
          <button key={slot} className={`filter-chip ${filter === slot ? 'active' : ''}`} onClick={() => setFilter(slot)}>
            {COSTUME_SLOT_LABEL[slot]}
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="costume-grid">
          {shown.map((def) => {
            const owned = state.costumes.owned.includes(def.id)
            const worn = state.costumes.equipped[def.slot] === def.id
            const previewing = previewId === def.id
            return (
              <div className={`costume-card ${owned ? '' : 'locked'} ${worn ? 'worn' : ''} ${previewing ? 'previewing' : ''}`} key={def.id}>
                <div className="costume-card-art" style={{ background: `radial-gradient(circle at 50% 35%, ${def.glow ?? def.accent}33, transparent 70%)` }}>
                  <HeroArt classId={state.player.classId} size={160} costumeIds={[def.id]} />
                  {worn && <span className="worn-ribbon">WORN</span>}
                  {!owned && <span className="costume-lock"><Icon name="lock" size={18} /></span>}
                </div>
                <div className="costume-card-body">
                  <span className="eyebrow" style={{ color: RARITY[def.rarity].color }}>{RARITY[def.rarity].name} {COSTUME_SLOT_LABEL[def.slot]}</span>
                  <strong>{def.name}</strong>
                  <p className="muted small">{def.description}</p>
                  <div className="costume-bonus-list small">
                    {(Object.entries(def.bonuses) as [StatKey, number][]).map(([key, value]) => (
                      <span key={key}>{BONUS_LABEL[key] ?? key} <strong>+{value}%</strong></span>
                    ))}
                  </div>
                  <div className="costume-card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setPreviewId(previewing ? null : def.id)}>
                      {previewing ? 'Close' : 'Preview'}
                    </button>
                    {owned ? (
                      <button className="btn btn-primary btn-sm" onClick={() => equip(def)} disabled={worn}>
                        {worn ? 'Worn' : 'Equip'}
                      </button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={onNavigateShop}>
                        <Icon name="shop" size={13} /> Shop
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Panel>
          <EmptyState icon="costumes" title="No costumes in this category" />
        </Panel>
      )}
    </div>
  )
}
