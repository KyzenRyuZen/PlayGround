import { useMemo, useState } from 'react'
import type { Item, Rarity } from '../game/types'
import { useGame, game } from '../game/state/store'
import { fuseCost } from '../game/engine/items'
import { getItemPower } from '../game/engine/stats'
import { RARITY, RARITY_ORDER, SLOT_LABEL } from '../game/data/classes'
import { itemBaseById } from '../game/data/items'
import { ItemIcon } from '../ui/ItemIcon'
import { Panel, SectionTitle, EmptyState, CostChip } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/format'

interface Group {
  key: string
  baseId: string
  rarity: Rarity
  items: Item[]
}

const NEXT_PREFIX: Record<Rarity, string> = {
  common: 'Runed',
  rare: 'Sanctified',
  epic: 'Dread',
  legendary: 'Astral',
  mythic: 'Eternal',
  divine: '',
}

export function FusionScreen() {
  const state = useGame()
  const [groupKey, setGroupKey] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const item of state.inventory) {
      const key = `${item.baseId}:${item.rarity}`
      const group = map.get(key)
      if (group) group.items.push(item)
      else map.set(key, { key, baseId: item.baseId, rarity: item.rarity, items: [item] })
    }
    return [...map.values()]
      .filter((g) => g.items.length >= 4)
      .sort((a, b) => {
        const rarityDiff = RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity)
        return rarityDiff || b.items[0]!.level - a.items[0]!.level
      })
  }, [state.inventory])

  const group = groups.find((g) => g.key === groupKey) ?? groups[0] ?? null
  const activePicked = group ? group.items.filter((i) => picked.includes(i.uid)) : []
  const cost = activePicked.length === 4 ? fuseCost(activePicked) : group ? fuseCost(group.items.slice(0, 4)) : 0
  const nextRarityIndex = group ? RARITY_ORDER.indexOf(group.rarity) + 1 : 0
  const nextRarity = group ? RARITY_ORDER[nextRarityIndex] : null
  const base = group ? itemBaseById(group.baseId) : null
  const previewName = base && nextRarity ? `${NEXT_PREFIX[group!.rarity]} ${base.name}`.trim() : ''

  const togglePick = (uid: string) => {
    setPicked((prev) => {
      if (prev.includes(uid)) return prev.filter((id) => id !== uid)
      if (prev.length >= 4) return [...prev.slice(1), uid]
      return [...prev, uid]
    })
  }

  const pickBest = () => {
    if (!group) return
    setPicked(
      [...group.items]
        .sort((a, b) => getItemPower(b) - getItemPower(a))
        .slice(0, 4)
        .map((i) => i.uid),
    )
  }

  const chooseGroup = (key: string) => {
    setGroupKey(key)
    setPicked([])
  }

  const doFuse = () => {
    if (!group) return
    if (activePicked.length !== 4) {
      toast('Choose exactly four identical relics.', 'error')
      return
    }
    const result = game.fuse(activePicked.map((i) => i.uid))
    if (!result.ok) {
      toast(result.message ?? 'Fusion failed.', 'error')
      return
    }
    toast(result.message ?? 'Fusion complete.', 'success')
    setPicked([])
    setGroupKey(null)
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="Four Become One" title="Relic Fusion">
        <span className="tag gold">The altar consumes four alike relics</span>
      </SectionTitle>

      <div className="fusion-intro">
        <div className="fusion-rune"><Icon name="fusion" size={30} /></div>
        <div>
          <strong>Ascend the rarity ladder</strong>
          <p className="muted small">
            Four relics of the same base and rarity are consumed to forge one relic of the next rarity. The new relic
            keeps the highest item level and rolls fresh, stronger bonuses. Divine relics cannot be fused.
          </p>
        </div>
        <div className="rarity-ladder">
          {RARITY_ORDER.map((r, i) => (
            <span key={r} className="ladder-step" style={{ color: RARITY[r].color }}>
              {RARITY[r].name}
              {i < RARITY_ORDER.length - 1 && <em>→</em>}
            </span>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <Panel>
          <EmptyState icon="fusion" title="No complete sets yet">
            You need four relics with the same base item and rarity. Keep farming — commons and rares drop often, and
            auto-loot will gather them for you. Locked relics are still eligible.
          </EmptyState>
        </Panel>
      ) : (
        <div className="fusion-layout">
          <Panel title="Available Sets" className="fusion-sets" actions={<span className="badge">{groups.length}</span>}>
            <div className="fusion-group-list">
              {groups.map((g) => {
                const gBase = itemBaseById(g.baseId)
                const active = group?.key === g.key
                return (
                  <button
                    key={g.key}
                    className={`fusion-group ${active ? 'selected' : ''}`}
                    onClick={() => chooseGroup(g.key)}
                  >
                    <ItemIcon slot={gBase.slot} rarity={g.rarity} size={42} />
                    <span className="fusion-group-info">
                      <strong style={{ color: RARITY[g.rarity].color }}>{gBase.name}</strong>
                      <small>{RARITY[g.rarity].name} · {SLOT_LABEL[gBase.slot]} · {g.items.length} available</small>
                    </span>
                    <span className="fusion-group-count">{g.items.length}×</span>
                  </button>
                )
              })}
            </div>
          </Panel>

          {group && nextRarity && base ? (
            <div className="fusion-workspace">
              <Panel className="fusion-altar">
                <div className="altar-glow" style={{ background: `radial-gradient(circle, ${RARITY[nextRarity].glow}, transparent 68%)` }} />
                <div className="altar-circle">
                  <span className="altar-rune">✦</span>
                </div>
                <span className="eyebrow">The Altar Accepts</span>
                <div className="fusion-picked-row">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const item = activePicked[i]
                    return (
                      <button
                        key={item?.uid ?? `empty-${i}`}
                        className={`fusion-picked ${item ? 'filled' : 'empty'}`}
                        onClick={() => item && togglePick(item.uid)}
                        title={item ? 'Remove from altar' : 'Choose a relic below'}
                      >
                        {item ? (
                          <ItemIcon slot={item.slot} rarity={item.rarity} plus={item.plus} size={52} />
                        ) : (
                          <span className="empty-altar-mark"><Icon name="plus" size={18} /></span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="fusion-arrow"><Icon name="arrow" size={22} /></div>

                <div className="fusion-result">
                  <ItemIcon slot={base.slot} rarity={nextRarity} size={78} />
                  <div>
                    <span className="eyebrow" style={{ color: RARITY[nextRarity].color }}>{RARITY[nextRarity].name}</span>
                    <h3 style={{ color: RARITY[nextRarity].color }}>{previewName}</h3>
                    <span className="muted small">
                      Level {Math.max(...group.items.map((i) => i.level))} · {SLOT_LABEL[base.slot]} · random bonuses
                    </span>
                  </div>
                </div>

                <div className="fusion-costs">
                  <CostChip icon="coins" ok={state.player.gold >= cost}>{cost.toLocaleString()} gold</CostChip>
                  <CostChip icon="fusion" ok={activePicked.length === 4}>{activePicked.length} / 4 relics</CostChip>
                </div>
                <button className="btn btn-primary btn-block btn-lg" onClick={doFuse} disabled={activePicked.length !== 4}>
                  <Icon name="flame" size={17} /> Kindle the Fusion
                </button>
                <p className="fineprint center">The four chosen relics are destroyed, even if locked.</p>
              </Panel>

              <Panel
                title={`Choose Four · ${base.name}`}
                className="fusion-picker"
                actions={<button className="link-btn" onClick={pickBest}>Pick strongest</button>}
              >
                <div className="fusion-pick-grid">
                  {group.items.map((item) => {
                    const order = activePicked.findIndex((i) => i.uid === item.uid)
                    return (
                      <button
                        key={item.uid}
                        className={`fusion-pick-card rarity-edge-${item.rarity} ${order >= 0 ? 'picked' : ''}`}
                        onClick={() => togglePick(item.uid)}
                      >
                        {order >= 0 && <span className="pick-order">{order + 1}</span>}
                        <ItemIcon slot={item.slot} rarity={item.rarity} plus={item.plus} size={48} locked={item.locked} />
                        <span className="fusion-pick-meta">
                          <strong>{item.name}</strong>
                          <small>Lv {item.level} · {getItemPower(item).toLocaleString()} power</small>
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="muted small">
                  Select any four from this set. Mixing different bases or rarities is not permitted.
                </p>
              </Panel>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
