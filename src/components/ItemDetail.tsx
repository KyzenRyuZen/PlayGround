import type { Item } from '../game/types'
import { sellPrice } from '../game/engine/items'
import { getItemPower, getItemStats } from '../game/engine/stats'
import { RARITY, SLOT_LABEL } from '../game/data/classes'
import { formatStat, STAT_LABEL, PERCENT_STATS } from '../game/data/items'
import { ItemIcon } from '../ui/ItemIcon'
import { Modal } from '../ui/ui'
import { RarityTag, Icon } from '../ui/Icon'
import { game } from '../game/state/store'
import { toast } from '../ui/format'

interface ItemDetailProps {
  item: Item | null
  equipped: boolean
  onClose: () => void
  onNavigateBlacksmith?: () => void
}

export function ItemDetail({ item, equipped, onClose, onNavigateBlacksmith }: ItemDetailProps) {
  if (!item) return null
  const state = game.state
  const stats = getItemStats(item)
  const power = getItemPower(item)
  const equippedItem = state.equipment[item.slot]
  const comparePower = equippedItem && !equipped ? getItemPower(equippedItem) : null
  const delta = comparePower !== null ? power - comparePower : null

  const run = (fn: () => { ok: boolean; message?: string }, close = true) => {
    const result = fn()
    toast(result.message ?? (result.ok ? 'Done.' : 'That action failed.'), result.ok ? 'success' : 'error')
    if (result.ok && close) onClose()
  }

  return (
    <Modal open onClose={onClose} title="Relic" className="item-detail">
      <div className="item-detail-head">
        <ItemIcon slot={item.slot} rarity={item.rarity} plus={item.plus} size={86} />
        <div className="item-detail-title">
          <RarityTag rarity={item.rarity} />
          <h3 style={{ color: RARITY[item.rarity].color }}>{item.name}</h3>
          <span className="muted">
            {SLOT_LABEL[item.slot]} · Item level {item.level}
            {item.classReq ? ` · ${item.classReq} only` : ''}
          </span>
          <div className="item-detail-power">
            <Icon name="spark" size={14} /> {power.toLocaleString()} power
            {delta !== null && <em className={delta >= 0 ? 'up' : 'down'}>{delta >= 0 ? '+' : ''}{delta.toLocaleString()} vs equipped</em>}
          </div>
        </div>
      </div>

      <div className="item-stats">
        {Object.entries(stats)
          .filter(([, value]) => (value ?? 0) !== 0)
          .map(([key, value]) => (
            <div className="item-stat" key={key}>
              <span>{STAT_LABEL[key as keyof typeof STAT_LABEL] ?? key}</span>
              <strong>{formatStat(key as never, value ?? 0)}</strong>
            </div>
          ))}
      </div>

      <div className="affix-list">
        <span className="eyebrow">Random bonuses · {item.affixes.length} / {RARITY[item.rarity].affixes + 1}</span>
        {item.affixes.map((affix) => (
          <div className="affix-row" key={affix.id}>
            <div className="affix-info">
              <span>{STAT_LABEL[affix.stat]}</span>
              <em>
                +{PERCENT_STATS.includes(affix.stat) ? `${+(affix.value * affix.quality).toFixed(1)}%` : Math.round(affix.value * affix.quality)}
              </em>
            </div>
            <div className="quality-track" title={`Bonus quality ${Math.round(affix.quality * 100)}%`}>
              <i style={{ width: `${((affix.quality - 1) / 0.5) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="item-actions">
        {equipped ? (
          <button className="btn btn-ghost" onClick={() => run(() => game.unequipSlot(item.slot))}>
            Unequip
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={Boolean(item.classReq && item.classReq !== state.player.classId)}
            onClick={() => run(() => game.equipItem(item.uid))}
          >
            Equip
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => { game.toggleLock(item.uid); toast(item.locked ? 'Item unlocked.' : 'Item locked.', 'info') }}>
          <Icon name="lock" size={15} /> {item.locked ? 'Unlock' : 'Lock'}
        </button>
        {!equipped && (
          <button
            className="btn btn-danger"
            disabled={item.locked}
            onClick={() => run(() => game.sellItem(item.uid))}
          >
            Sell · {sellPrice(item).toLocaleString()}
          </button>
        )}
        {onNavigateBlacksmith && (
          <button className="btn btn-ghost" onClick={() => { onClose(); onNavigateBlacksmith() }}>
            <Icon name="blacksmith" size={15} /> Forge
          </button>
        )}
      </div>
    </Modal>
  )
}
