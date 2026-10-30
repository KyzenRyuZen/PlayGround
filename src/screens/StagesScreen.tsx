import { useState } from 'react'
import { useGame, game } from '../game/state/store'
import { REGIONS, REGION_BOSSES, getStageInfo, MAX_STAGE } from '../game/data/zones'
import { monsterById } from '../game/data/monsters'
import { Panel, SectionTitle, Toggle } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { MonsterArt } from '../ui/MonsterArt'
import { toast } from '../ui/format'

export function StagesScreen() {
  const state = useGame()
  const currentRegion = getStageInfo(state.progress.farmStage).region
  const [expanded, setExpanded] = useState<string>(currentRegion.id)

  const travel = (stage: number) => {
    const result = game.selectStage(stage)
    toast(result.message ?? (result.ok ? `Now farming stage ${stage}.` : 'Stage locked.'), result.ok ? 'success' : 'error')
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="The Sundered Map" title="World & Stages">
        <span className="tag gold">Highest stage {state.progress.highestStage} / {MAX_STAGE}</span>
        <Toggle checked={state.progress.autoAdvance} onChange={() => game.toggleAuto('autoAdvance')} label="Auto-advance" />
      </SectionTitle>

      <div className="stage-summary">
        <div className="stage-summary-art">
          <MonsterArt family={monsterById(REGION_BOSSES[currentRegion.id] ?? 'fenrir_mooneaten').family} element="shadow" tier="boss" size={110} />
        </div>
        <div>
          <span className="eyebrow">Current Hunting Grounds</span>
          <h3>{currentRegion.name} <span className="muted">· stage {state.progress.farmStage}</span></h3>
          <p className="muted">{currentRegion.lore}</p>
        </div>
        <div className="stage-summary-stats">
          <div><span>Region level</span><strong>{currentRegion.levelStart}–{currentRegion.levelEnd}</strong></div>
          <div><span>Progress</span><strong>{Math.min(8, Math.max(0, state.progress.highestStage - currentRegion.stageStart))} / 8</strong></div>
        </div>
      </div>

      <div className="region-list">
        {REGIONS.map((region) => {
          const unlocked = state.progress.highestStage >= region.stageStart
          const isOpen = expanded === region.id
          const boss = monsterById(REGION_BOSSES[region.id] ?? 'fenrir_mooneaten')
          const cleared = Math.min(8, Math.max(0, state.progress.highestStage - region.stageStart))
          return (
            <Panel key={region.id} className={`region-card ${unlocked ? '' : 'locked'} ${isOpen ? 'open' : ''}`}>
              <button
                className="region-head"
                onClick={() => setExpanded(isOpen ? '' : region.id)}
                disabled={!unlocked}
              >
                <div className="region-badge" style={{ background: `linear-gradient(135deg, ${region.palette.far}, ${region.palette.near})` }}>
                  <MonsterArt family={boss.family} element={boss.element} tier="boss" size={74} />
                </div>
                <div className="region-info">
                  <span className="eyebrow">{unlocked ? `${cleared} / 8 stages cleared` : 'Sealed region'}</span>
                  <h3>{region.name}</h3>
                  <span className="muted">{region.subtitle} · Lv {region.levelStart}–{region.levelEnd}</span>
                </div>
                <div className="region-right">
                  {!unlocked ? (
                    <span className="lock-tag"><Icon name="lock" size={14} /> Clear stage {region.stageStart - 1}</span>
                  ) : (
                    <span className="region-progress">{cleared}/8</span>
                  )}
                  <Icon name="chevron" size={18} className={isOpen ? 'rotate' : ''} />
                </div>
              </button>

              {isOpen && unlocked && (
                <div className="region-body">
                  <p className="region-lore">{region.lore}</p>
                  <div className="stage-nodes">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const stage = region.stageStart + i
                      const stageUnlocked = stage <= state.progress.highestStage
                      const isBoss = stage % 8 === 0
                      const isFarm = stage === state.progress.farmStage
                      const info = getStageInfo(stage)
                      return (
                        <button
                          key={stage}
                          className={`stage-node ${isBoss ? 'boss' : ''} ${isFarm ? 'current' : ''} ${stageUnlocked ? '' : 'locked'}`}
                          onClick={() => travel(stage)}
                          disabled={!stageUnlocked}
                          title={stageUnlocked ? `Farm ${info.name}` : `Clear stage ${stage - 1} to unlock`}
                        >
                          <span className="stage-node-num">{isBoss ? <Icon name="crown" size={16} /> : stage}</span>
                          <span className="stage-node-lv">Lv {info.level}</span>
                          {isFarm && <span className="stage-node-farm">FARMING</span>}
                        </button>
                      )
                    })}
                  </div>
                  <div className="region-monsters">
                    <span className="eyebrow">Native creatures</span>
                    <div className="region-monster-row">
                      {region.pool.map((id) => {
                        const m = monsterById(id)
                        return (
                          <span className="region-monster" key={id}>
                            <MonsterArt family={m.family} element={m.element} size={44} />
                            {m.name}
                          </span>
                        )
                      })}
                    </div>
                    <div className="region-boss">
                      <Icon name="crown" size={14} />
                      <span>Guardian: <strong>{boss.name}</strong></span>
                      <span className="muted">· stage {region.stageEnd}</span>
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
