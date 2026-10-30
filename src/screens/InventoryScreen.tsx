import { useMemo, useState } from 'react'
import type { Rarity, SlotId } from '../game/types'
import { useGame, game } from '../game/state/store'
import { getItemPower } from '../game/engine/stats'
import { RARITY, SLOT_LABEL, SLOT_ORDER } from '../game/data/classes'
import { ItemIcon } from '../ui/ItemIcon'
import { EmptyState, Panel, SectionTitle } from '../ui/ui'
import { ItemDetail } from '../components/ItemDetail'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/format'

type Sort = 'power' | 'newest' | 'level'

export function InventoryScreen({ onNavigate }: { onNavigate: (tab: 'blacksmith' | 'fusion' | 'shop') => void }) {
  const state = useGame()
  const [slot, setSlot] = useState<'all' | SlotId>('all')
  const [rarity, setRarity] = useState<'all' | Rarity>('all')
  const [sort, setSort] = useState<Sort>('power')
  const [selected, setSelected] = useState<string | null>(null)

  const items = useMemo(() => {
    const list = state.inventory.filter(
      (i) => (slot === 'all' || i.slot === slot) && (rarity === 'all' || i.rarity === rarity),
    )
    return [...list].sort((a, b) => {
      if (sort === 'power') return getItemPower(b) - getItemPower(a)
      if (sort === 'level') return b.level - a.level
      return b.createdAt - a.createdAt
    })
  }, [state.inventory, slot, rarity, sort])

  const selectedItem = state.inventory.find((i) => i.uid === selected) ?? null

  return (
    <div className="screen">
      <SectionTitle eyebrow="Spoils" title="Inventory">
        <span className="tag">{state.inventory.length} / 150</span>
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('blacksmith')}>
          <Icon name="blacksmith" size={15} /> Forge
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('fusion')}>
          <Icon name="fusion" size={15} /> Fuse
        </button>
      </SectionTitle>

      <Panel className="inventory-panel">
        <div className="inventory-toolbar">
          <div className="filter-row">
            <button className={`filter-chip ${slot === 'all' ? 'active' : ''}`} onClick={() => setSlot('all')}>All</button>
            {SLOT_ORDER.map((s) => (
              <button key={s} className={`filter-chip ${slot === s ? 'active' : ''}`} onClick={() => setSlot(s)}>
                {SLOT_LABEL[s]}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select value={rarity} onChange={(e) => setRarity(e.target.value as 'all' | Rarity)} aria-label="Filter rarity">
              <option value="all">All rarities</option>
              {(Object.keys(RARITY) as Rarity[]).map((r) => (
                <option key={r} value={r}>{RARITY[r].name}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort items">
              <option value="power">Sort: Power</option>
              <option value="newest">Sort: Newest</option>
              <option value="level">Sort: Item level</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              const res = game.sellUnlockedBelow('common')
              toast(res.message ?? 'Done.', res.ok ? 'loot' : 'error')
            }}>
              Sell commons
            </button>
          </div>
        </div>

        {items.length ? (
          <div className="item-grid">
            {items.map((item) => (
              <button
                key={item.uid}
                className={`item-card rarity-edge-${item.rarity}`}
                onClick={() => setSelected(item.uid)}
              >
                <ItemIcon slot={item.slot} rarity={item.rarity} plus={item.plus} size={58} locked={item.locked} />
                <div className="item-card-info">
                  <span className="item-card-name" style={{ color: RARITY[item.rarity].color }}>{item.name}</span>
                  <span className="item-card-meta">{SLOT_LABEL[item.slot]} · Lv {item.level}</span>
                  <span className="item-card-power">{getItemPower(item).toLocaleString()} power</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon="inventory" title="No relics match this filter">
            Farm monsters, clear dungeons, or fuse four identical items to fill these shelves.
          </EmptyState>
        )}
      </Panel>

      <ItemDetail
        item={selectedItem}
        equipped={false}
        onClose={() => setSelected(null)}
        onNavigateBlacksmith={() => onNavigate('blacksmith')}
      />
    </div>
  )
}
