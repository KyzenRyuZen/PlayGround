import { useMemo, useState } from 'react'
import type { SlotId } from '../game/types'
import { useGame, game } from '../game/state/store'
import { AFFIX_OP_COSTS, affixCap, upgradeChance, upgradeCost } from '../game/engine/items'
import { getItemPower, getItemStats } from '../game/engine/stats'
import { MATERIALS } from '../game/data/materials'
import { RARITY, SLOT_LABEL } from '../game/data/classes'
import { formatStat, STAT_LABEL, PERCENT_STATS } from '../game/data/items'
import { ItemIcon } from '../ui/ItemIcon'
import { Panel, SectionTitle, CostChip, Toggle } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/format'

type Filter = 'all' | SlotId

export function BlacksmithScreen({ onNavigateFusion }: { onNavigateFusion: () => void }) {
  const state = useGame()
  const [selectedUid, setSelectedUid] = useState<string | null>(
    state.equipment.weapon?.uid ?? state.inventory[0]?.uid ?? null,
  )
  const [filter, setFilter] = useState<Filter>('all')
  const [protection, setProtection] = useState(false)

  const allItems = useMemo(
    () => [...Object.values(state.equipment).filter(Boolean), ...state.inventory].filter((i) => i !== null),
    [state.equipment, state.inventory],
  )
  const items = useMemo(
    () => allItems.filter((i) => filter === 'all' || i.slot === filter).sort((a, b) => getItemPower(b) - getItemPower(a)),
    [allItems, filter],
  )
  const selected = allItems.find((i) => i.uid === selectedUid) ?? null
  const stats = selected ? getItemStats(selected) : null
  const cost = selected ? upgradeCost(selected) : null
  const chance = selected ? upgradeChance(selected.plus) : 0
  const isEquipped = selected ? Object.values(state.equipment).some((i) => i?.uid === selected.uid) : false

  const doUpgrade = () => {
    if (!selected) return
    const result = game.upgradeItem(selected.uid, protection)
    if (!result.ok) {
      toast(result.message ?? 'Upgrade failed.', 'error')
      return
    }
    toast(
      result.message ?? '',
      result.destroyed ? 'error' : result.success ? 'success' : result.downgraded ? 'error' : 'info',
    )
    if (result.destroyed) setSelectedUid(null)
  }

  const doAffix = (action: 'add' | 'reroll' | 'empower') => {
    if (!selected) return
    const result =
      action === 'add' ? game.addBonus(selected.uid) : action === 'reroll' ? game.rerollBonuses(selected.uid) : game.empowerBonus(selected.uid)
    toast(result.message ?? (result.ok ? 'Done.' : 'Cannot perform that action.'), result.ok ? 'success' : 'error')
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="Iron and Ember" title="The Blacksmith">
        <button className="btn btn-ghost btn-sm" onClick={onNavigateFusion}>
          <Icon name="fusion" size={15} /> Go to Fusion
        </button>
      </SectionTitle>

      <div className="material-strip">
        {(Object.keys(MATERIALS) as (keyof typeof MATERIALS)[]).map((id) => (
          <span className="material-chip" key={id} title={MATERIALS[id].description}>
            <span className="material-dot" style={{ background: MATERIALS[id].color }} />
            <span>{MATERIALS[id].name}</span>
            <strong>{state.materials[id] ?? 0}</strong>
          </span>
        ))}
      </div>

      <div className="forge-layout">
        <Panel title="Choose a Relic" className="forge-list" actions={<span className="badge">{items.length}</span>}>
          <div className="forge-filters">
            <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            {(['weapon', 'armor', 'helmet', 'shield', 'shoes', 'belt', 'bracelet', 'earring', 'necklace'] as SlotId[]).map((s) => (
              <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                {SLOT_LABEL[s]}
              </button>
            ))}
          </div>
          <div className="forge-item-list">
            {items.map((item) => {
              const equipped = Object.values(state.equipment).some((i) => i?.uid === item.uid)
              return (
                <button
                  key={item.uid}
                  className={`forge-item ${selectedUid === item.uid ? 'selected' : ''}`}
                  onClick={() => setSelectedUid(item.uid)}
                >
                  <ItemIcon slot={item.slot} rarity={item.rarity} plus={item.plus} size={42} />
                  <span className="forge-item-info">
                    <strong style={{ color: RARITY[item.rarity].color }}>{item.name}</strong>
                    <small>{SLOT_LABEL[item.slot]} · Lv {item.level} {equipped ? '· EQUIPPED' : ''}</small>
                  </span>
                  <span className="forge-item-power">{getItemPower(item).toLocaleString()}</span>
                </button>
              )
            })}
            {!items.length && <p className="muted small center">No relics in this category. Farm more monsters.</p>}
          </div>
        </Panel>

        {selected && cost && stats ? (
          <div className="forge-workspace">
            <Panel className="forge-anvil">
              <div className="anvil-glow" />
              <div className="forge-item-hero">
                <ItemIcon slot={selected.slot} rarity={selected.rarity} plus={selected.plus} size={92} />
                <div>
                  <span className="eyebrow">{SLOT_LABEL[selected.slot]} {isEquipped ? '· equipped' : ''}</span>
                  <h3 style={{ color: RARITY[selected.rarity].color }}>{selected.name}</h3>
                  <span className="muted">Item level {selected.level} · {getItemPower(selected).toLocaleString()} power</span>
                  <div className="plus-pips">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <i key={i} className={i < selected.plus ? 'filled' : ''} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="upgrade-box">
                <div className="upgrade-head">
                  <span>Enhancement <strong>+{selected.plus} → +{selected.plus + 1}</strong></span>
                  <span className={`chance ${chance >= 0.5 ? 'good' : chance >= 0.25 ? 'warn' : 'bad'}`}>
                    {Math.round(chance * 100)}% success
                  </span>
                </div>
                <div className="chance-track"><i style={{ width: `${chance * 100}%` }} /></div>
                <div className="upgrade-costs">
                  <CostChip icon="coins" ok={state.player.gold >= cost.gold}>{cost.gold.toLocaleString()} gold</CostChip>
                  <CostChip icon="stones" ok={(state.materials[cost.material] ?? 0) >= cost.stones}>
                    {cost.stones}× {MATERIALS[cost.material].name}
                  </CostChip>
                  {protection && (
                    <CostChip icon="scroll" ok={(state.materials.protection_scroll ?? 0) > 0}>
                      1× Ward Scroll
                    </CostChip>
                  )}
                </div>
                <Toggle
                  checked={protection}
                  onChange={() => setProtection((p) => !p)}
                  label="Use Ward Scroll"
                  hint={`Prevents destruction above +10 · ${state.materials.protection_scroll ?? 0} owned`}
                />
                {selected.plus >= 10 && !protection && (
                  <p className="danger-note"><Icon name="info" size={13} /> A failed upgrade above +10 has a 10% chance to destroy this item.</p>
                )}
                {selected.plus >= 7 && (
                  <p className="muted small">Failure can also reduce the enhancement by one level.</p>
                )}
                <button className="btn btn-primary btn-block" onClick={doUpgrade} disabled={selected.plus >= 15}>
                  <Icon name="flame" size={16} /> {selected.plus >= 15 ? 'Maximum Enhancement' : 'Strike the Anvil'}
                </button>
              </div>

              <div className="item-stat-preview">
                {Object.entries(stats).filter(([, v]) => v).slice(0, 6).map(([key, value]) => (
                  <span key={key}>{STAT_LABEL[key as keyof typeof STAT_LABEL]} <strong>{formatStat(key as never, value ?? 0)}</strong></span>
                ))}
              </div>
            </Panel>

            <Panel title="Random Bonuses" className="affix-panel" actions={<span className="badge">{selected.affixes.length} / {affixCap(selected)}</span>}>
              <p className="muted small">Etch, reroll or empower the random bonuses on this relic.</p>
              <div className="affix-edit-list">
                {selected.affixes.map((affix) => (
                  <div className="affix-edit" key={affix.id}>
                    <div>
                      <span>{STAT_LABEL[affix.stat]}</span>
                      <strong>
                        +{PERCENT_STATS.includes(affix.stat) ? `${+(affix.value * affix.quality).toFixed(1)}%` : Math.round(affix.value * affix.quality)}
                      </strong>
                    </div>
                    <div className="quality-track"><i style={{ width: `${((affix.quality - 1) / 0.5) * 100}%` }} /></div>
                    <span className="quality-label">{Math.round(affix.quality * 100)}% quality</span>
                  </div>
                ))}
              </div>
              <div className="affix-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={selected.affixes.length >= affixCap(selected) || !game.state.materials.mystic_rune}
                  onClick={() => doAffix('add')}
                >
                  <Icon name="plus" size={14} /> Add bonus
                </button>
                <button className="btn btn-ghost btn-sm" disabled={!game.state.materials.chaos_crystal} onClick={() => doAffix('reroll')}>
                  <Icon name="spark" size={14} /> Reroll
                </button>
                <button className="btn btn-ghost btn-sm" disabled={!game.state.materials.refinement_powder} onClick={() => doAffix('empower')}>
                  <Icon name="flame" size={14} /> Empower
                </button>
              </div>
              <div className="affix-costs">
                <span><Icon name="rune" size={12} /> {AFFIX_OP_COSTS.add.materials.mystic_rune} rune + {AFFIX_OP_COSTS.add.gold.toLocaleString()}g</span>
                <span><Icon name="crystal" size={12} /> {AFFIX_OP_COSTS.reroll.materials.chaos_crystal} crystal + {AFFIX_OP_COSTS.reroll.gold.toLocaleString()}g</span>
                <span><Icon name="powder" size={12} /> {AFFIX_OP_COSTS.empower.materials.refinement_powder} powder + {AFFIX_OP_COSTS.empower.gold.toLocaleString()}g</span>
              </div>
            </Panel>
          </div>
        ) : (
          <Panel className="forge-empty">
            <div className="anvil-mark"><Icon name="blacksmith" size={48} /></div>
            <h3>The anvil waits.</h3>
            <p className="muted">Select a relic from the left to begin. Four identical relics can be fused into one of higher rarity.</p>
            <button className="btn btn-ghost" onClick={onNavigateFusion}><Icon name="fusion" size={15} /> Open Fusion</button>
          </Panel>
        )}
      </div>
    </div>
  )
}
