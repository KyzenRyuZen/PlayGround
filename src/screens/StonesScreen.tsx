import { useMemo, useState } from 'react'
import type { Stone } from '../game/types'
import { useGame, game } from '../game/state/store'
import { stoneGradeLabel, stoneRarity, stoneUpgrade, stoneValue } from '../game/engine/stones'
import { getStoneStats } from '../game/engine/stats'
import { STONE_MAX_LEVEL, STONE_TYPES, stoneTypeById } from '../game/data/materials'
import { RARITY } from '../game/data/classes'
import { STAT_LABEL, PERCENT_STATS, formatStat } from '../game/data/items'
import { StoneIcon, StoneTypeDot } from '../ui/StoneIcon'
import { Panel, SectionTitle, EmptyState, CostChip } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/format'

export function StonesScreen() {
  const state = useGame()
  const allStones = useMemo(
    () => [...state.stones.equipped.filter(Boolean), ...state.stones.inventory].filter((s): s is Stone => Boolean(s)),
    [state.stones],
  )
  const [selectedUid, setSelectedUid] = useState<string | null>(state.stones.equipped[0]?.uid ?? state.stones.inventory[0]?.uid ?? null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const selected = allStones.find((s) => s.uid === selectedUid) ?? allStones[0] ?? null
  const selectedSocket = selected ? state.stones.equipped.findIndex((s) => s?.uid === selected.uid) : -1
  const selectedInventory = Boolean(selected && state.stones.inventory.some((s) => s.uid === selected.uid))

  const inventory = state.stones.inventory.filter((s) => typeFilter === 'all' || s.typeId === typeFilter)
  const totalStats = useMemo(() => {
    const out: Record<string, number> = {}
    for (const stone of state.stones.equipped) {
      if (!stone) continue
      for (const [key, value] of Object.entries(getStoneStats(stone))) out[key] = (out[key] ?? 0) + (value ?? 0)
    }
    return out
  }, [state.stones.equipped])

  const socket = (index: number) => {
    if (!selected || !selectedInventory) return
    const result = game.equipStone(selected.uid, index)
    toast(result.message ?? (result.ok ? 'Stone socketed.' : 'Cannot socket stone.'), result.ok ? 'success' : 'error')
  }

  const unsocket = (index: number) => {
    const result = game.unequipStone(index)
    toast(result.message ?? (result.ok ? 'Stone removed.' : 'That socket is empty.'), result.ok ? 'success' : 'error')
  }

  const upgrade = () => {
    if (!selected) return
    const result = game.upgradeStone(selected.uid)
    toast(result.message ?? (result.ok ? 'Stone empowered.' : 'Cannot empower stone.'), result.ok ? 'success' : 'error')
  }

  const crush = () => {
    if (!selected || !selectedInventory) return
    const result = game.sellStone(selected.uid)
    toast(result.message ?? (result.ok ? 'Stone crushed.' : 'Cannot crush stone.'), result.ok ? 'success' : 'error')
    if (result.ok) setSelectedUid(null)
  }

  const type = selected ? stoneTypeById(selected.typeId) : null
  const rarity = selected ? stoneRarity(selected.grade) : null
  const upgradeCost = selected ? stoneUpgrade(selected.level) : null

  return (
    <div className="screen">
      <SectionTitle eyebrow="Runebinding" title="Magical Stones">
        <span className="tag gold">{state.stones.inventory.length} in reserve</span>
        <span className="tag"><Icon name="dust" size={13} /> {state.materials.stone_dust} dust</span>
      </SectionTitle>

      <div className="stone-sockets-panel">
        <div className="sockets-head">
          <div>
            <span className="eyebrow">Bound to your soul</span>
            <h3>Three Sockets</h3>
          </div>
          <div className="sockets-total">
            {Object.entries(totalStats).filter(([, v]) => v).slice(0, 5).map(([key, value]) => (
              <span key={key}>{STAT_LABEL[key as never] ?? key} <strong>{formatStat(key as never, value)}</strong></span>
            ))}
            {!Object.values(totalStats).some((v) => v) && <span className="muted small">Socket stones to gain permanent bonuses.</span>}
          </div>
        </div>

        <div className="socket-row">
          {[0, 1, 2].map((index) => {
            const stone = state.stones.equipped[index]
            const socketType = stone ? stoneTypeById(stone.typeId) : null
            return (
              <div className={`socket ${stone ? 'filled' : 'empty'}`} key={index}>
                <span className="socket-number">SOCKET {index + 1}</span>
                {stone && socketType ? (
                  <>
                    <button className="socket-stone-btn" onClick={() => setSelectedUid(stone.uid)} title="Inspect stone">
                      <StoneIcon stone={stone} size={78} />
                    </button>
                    <strong style={{ color: RARITY[stoneRarity(stone.grade)].color }}>{stone.name}</strong>
                    <small className="muted">Level {stone.level} / {STONE_MAX_LEVEL}</small>
                    <div className="socket-bonuses">
                      {stone.affixes.map((a) => (
                        <span key={a.id}>{STAT_LABEL[a.stat]} <em>{formatStat(a.stat, a.value)}</em></span>
                      ))}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => unsocket(index)}>Remove</button>
                  </>
                ) : (
                  <>
                    <span className="socket-empty-gem">
                      <Icon name="stones" size={38} />
                    </span>
                    <strong className="muted">Empty socket</strong>
                    <small className="muted">Select a stone and bind it here.</small>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={!selected || !selectedInventory}
                      onClick={() => socket(index)}
                    >
                      <Icon name="plus" size={14} /> Socket selected
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="stone-layout">
        <Panel title="Stone Reserve" className="stone-reserve" actions={<span className="badge">{state.stones.inventory.length}</span>}>
          <div className="stone-filters">
            <button className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
            {STONE_TYPES.map((t) => (
              <button key={t.id} className={`filter-chip ${typeFilter === t.id ? 'active' : ''}`} onClick={() => setTypeFilter(t.id)}>
                <StoneTypeDot typeId={t.id} size={10} /> {t.name}
              </button>
            ))}
          </div>
          {inventory.length ? (
            <div className="stone-grid">
              {inventory.map((stone) => (
                <button
                  key={stone.uid}
                  className={`stone-card ${selectedUid === stone.uid ? 'selected' : ''}`}
                  onClick={() => setSelectedUid(stone.uid)}
                >
                  <StoneIcon stone={stone} size={54} />
                  <span className="stone-card-info">
                    <strong style={{ color: RARITY[stoneRarity(stone.grade)].color }}>{stone.name}</strong>
                    <small>{stoneGradeLabel(stone.grade)} · Lv {stone.level}</small>
                    <small className="muted">{stone.affixes.map((a) => `${STAT_LABEL[a.stat]} ${formatStat(a.stat, a.value)}`).join(' · ')}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon="stones" title="No stones in reserve">
              Stone-bearing monsters, dungeon guardians and the Premium Shop yield magical stones. Crushing a socketed
              stone costs nothing but also frees the socket.
            </EmptyState>
          )}
        </Panel>

        {selected && type && rarity && upgradeCost ? (
          <Panel className="stone-detail" title="Stone Lore">
            <div className="stone-detail-head">
              <div className="stone-detail-art" style={{ boxShadow: `0 0 40px ${type.glow}` }}>
                <StoneIcon stone={selected} size={108} />
              </div>
              <div>
                <span className="eyebrow" style={{ color: type.color }}>{type.name} · {stoneGradeLabel(selected.grade)}</span>
                <h3 style={{ color: RARITY[rarity].color }}>{selected.name}</h3>
                <span className="muted small">
                  {selectedSocket >= 0 ? `Socketed in slot ${selectedSocket + 1}` : 'In reserve'} · Level {selected.level}
                </span>
                <div className="stone-quality-pips">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i key={i} className={i < selected.grade ? 'filled' : ''} style={{ background: i < selected.grade ? type.color : undefined }} />
                  ))}
                </div>
              </div>
            </div>
            <p className="muted small">{type.description}</p>

            <div className="stone-affix-list">
              {selected.affixes.map((a) => (
                <div className="stone-affix" key={a.id}>
                  <span>{STAT_LABEL[a.stat]}</span>
                  <strong style={{ color: type.color }}>{formatStat(a.stat, a.value)}</strong>
                  <small>{PERCENT_STATS.includes(a.stat) ? 'percent bonus' : 'flat bonus'}</small>
                </div>
              ))}
            </div>

            <div className="stone-upgrade-box">
              <div className="upgrade-head">
                <span>Level <strong>{selected.level} → {Math.min(STONE_MAX_LEVEL, selected.level + 1)}</strong></span>
                <span className="muted small">+7.5% per level</span>
              </div>
              <div className="upgrade-costs">
                <CostChip icon="dust" ok={state.materials.stone_dust >= upgradeCost.dust}>{upgradeCost.dust} dust</CostChip>
                <CostChip icon="coins" ok={state.player.gold >= upgradeCost.gold}>{upgradeCost.gold.toLocaleString()} gold</CostChip>
              </div>
              <button className="btn btn-primary btn-block" onClick={upgrade} disabled={selected.level >= STONE_MAX_LEVEL}>
                <Icon name="spark" size={15} /> {selected.level >= STONE_MAX_LEVEL ? 'Fully Empowered' : 'Empower Stone'}
              </button>
            </div>

            <div className="stone-actions">
              {selectedInventory && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => socket([0, 1, 2].find((i) => !state.stones.equipped[i]) ?? 0)}>
                    <Icon name="plus" size={14} /> Socket
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={crush}>
                    <Icon name="trash" size={14} /> Crush · {stoneValue(selected).toLocaleString()}g
                  </button>
                </>
              )}
              {selectedSocket >= 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => unsocket(selectedSocket)}>
                  Remove from socket
                </button>
              )}
            </div>
            <p className="fineprint">Crushing returns gold and Runestone Dust. Removing a stone keeps it intact.</p>
          </Panel>
        ) : (
          <Panel className="stone-detail">
            <EmptyState icon="stones" title="Choose a stone">
              Select a stone from your reserve to inspect its bonuses, socket it, or empower it with Runestone Dust.
            </EmptyState>
          </Panel>
        )}
      </div>
    </div>
  )
}
