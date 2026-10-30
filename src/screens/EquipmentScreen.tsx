import { useState } from 'react'
import type { SlotId } from '../game/types'
import { useGame } from '../game/state/store'
import { getItemPower, getItemStats } from '../game/engine/stats'
import { SLOT_LABEL, SLOT_ORDER } from '../game/data/classes'
import { HeroArt } from '../ui/HeroArt'
import { ItemIcon, SlotGlyph } from '../ui/ItemIcon'
import { Panel, SectionTitle } from '../ui/ui'
import { ItemDetail } from '../components/ItemDetail'
import { Icon } from '../ui/Icon'

export function EquipmentScreen({ onNavigateInventory }: { onNavigateInventory: () => void }) {
  const state = useGame()
  const [selected, setSelected] = useState<string | null>(null)
  const allItems = Object.values(state.equipment).filter(Boolean)
  const totalPower = allItems.reduce((sum, item) => sum + (item ? getItemPower(item) : 0), 0)
  const selectedItem = allItems.find((i) => i?.uid === selected) ?? null

  const leftSlots: SlotId[] = ['weapon', 'armor', 'helmet', 'shield', 'bracelet']
  const rightSlots: SlotId[] = ['earring', 'necklace', 'shoes', 'belt']

  const renderSlot = (slot: SlotId) => {
    const item = state.equipment[slot]
    return (
      <button
        key={slot}
        className={`equip-slot ${item ? `filled rarity-edge-${item.rarity}` : 'empty'}`}
        onClick={() => item && setSelected(item.uid)}
      >
        {item ? (
          <>
            <ItemIcon slot={slot} rarity={item.rarity} plus={item.plus} size={44} />
            <span className="equip-slot-info">
              <em>{SLOT_LABEL[slot]}</em>
              <strong style={{ color: item.rarity === 'common' ? 'inherit' : undefined }}>{item.name}</strong>
              <small>Power {getItemPower(item).toLocaleString()}</small>
            </span>
          </>
        ) : (
          <>
            <span className="empty-slot-icon"><SlotGlyph slot={slot} size={26} /></span>
            <span className="equip-slot-info">
              <em>{SLOT_LABEL[slot]}</em>
              <strong className="muted">Empty</strong>
            </span>
          </>
        )}
      </button>
    )
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="The Wardrobe of War" title="Equipment">
        <span className="tag gold">{totalPower.toLocaleString()} gear power</span>
        <button className="btn btn-ghost btn-sm" onClick={onNavigateInventory}>
          <Icon name="inventory" size={15} /> Open bags
        </button>
      </SectionTitle>

      <div className="equipment-layout">
        <div className="equipment-doll">
          <div className="doll-slots left">{leftSlots.map(renderSlot)}</div>
          <div className="doll-center">
            <div className="doll-aura" />
            <HeroArt classId={state.player.classId} size={250} costumeIds={Object.values(state.costumes.equipped)} />
            <span className="doll-name">{state.player.name}</span>
            <span className="doll-class">Level {state.player.level} · {SLOT_ORDER.filter((s) => state.equipment[s]).length}/9 slots</span>
          </div>
          <div className="doll-slots right">{rightSlots.map(renderSlot)}</div>
        </div>
      </div>

      <div className="two-col">
        <Panel title="Gear Totals">
          <div className="stat-grid">
            {(() => {
              const totals: Record<string, number> = {}
              for (const item of allItems) {
                if (!item) continue
                const stats = getItemStats(item)
                for (const [k, v] of Object.entries(stats)) totals[k] = (totals[k] ?? 0) + (v ?? 0)
              }
              const rows: [string, string][] = [
                ['attack', 'Attack'],
                ['defense', 'Defense'],
                ['hp', 'Max HP'],
                ['critChance', 'Crit Chance'],
                ['attackSpeed', 'Attack Speed'],
                ['bossDamage', 'Boss Damage'],
                ['penetration', 'Penetration'],
                ['lifesteal', 'Lifesteal'],
              ]
              return rows.map(([key, label]) => (
                <div key={key}>
                  <span>{label}</span>
                  <strong>{+(totals[key] ?? 0).toFixed(1)}</strong>
                </div>
              ))
            })()}
          </div>
        </Panel>
        <Panel title="Set Wisdom">
          <div className="lore-block">
            <Icon name="info" size={18} />
            <p>
              Every equipped relic adds its implicit power and random bonuses. Upgrade gear at the Blacksmith, socket
              magical stones, and fuse four identical items to raise their rarity.
            </p>
          </div>
          <div className="mini-tips">
            <span><Icon name="check" size={13} /> Four identical items → next rarity</span>
            <span><Icon name="check" size={13} /> +15 upgrades multiply base stats</span>
            <span><Icon name="check" size={13} /> Random bonuses can be rerolled</span>
          </div>
        </Panel>
      </div>

      <ItemDetail item={selectedItem ?? null} equipped onClose={() => setSelected(null)} />
    </div>
  )
}
