import { useGame, game } from '../game/state/store'
import { getPlayerStats } from '../game/engine/stats'
import { getStageInfo } from '../game/data/zones'
import { CLASSES, skillsForClass } from '../game/data/classes'
import { HeroArt } from '../ui/HeroArt'
import { MonsterArt, elementColor } from '../ui/MonsterArt'
import { Backdrop } from '../ui/Backdrop'
import { Bar, Panel, Toggle, SectionTitle } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { formatCompact } from '../ui/format'
import { dungeonById } from '../game/data/dungeons'

const SKILL_ICON: Record<string, string> = {
  cleave: 'battle',
  shield: 'equipment',
  whirl: 'spark',
  roar: 'flame',
  lance: 'spark',
  frost: 'spark',
  meteor: 'flame',
  arrow: 'arrow',
  eye: 'spark',
  rain: 'arrow',
  venom: 'spark',
}

export function BattleScreen({ onNavigateStages }: { onNavigateStages: () => void }) {
  const state = useGame()
  const stats = getPlayerStats(state)
  const info = getStageInfo(state.progress.farmStage)
  const cls = CLASSES[state.player.classId]
  const enemy = state.combat.enemy
  const inDungeon = state.combat.mode === 'dungeon'
  const dungeon = inDungeon ? dungeonById(state.combat.dungeonId ?? '') : null
  const palette = dungeon?.palette ?? info.region.palette
  const skills = skillsForClass(state.player.classId)
  const floaters = state.combat.floaters
  const progress = Math.min(7, state.combat.stageKills)
  const enemyName = enemy?.name ?? 'The ember stirs…'
  const enemyLevel = enemy?.level ?? info.level
  const isBoss = Boolean(enemy?.isBoss)
  const recentLog = state.log.slice(-5).reverse()

  return (
    <div className="screen battle-screen">
      <SectionTitle eyebrow="The Hunt" title={inDungeon ? dungeon?.name ?? 'Dungeon' : info.region.name}>
        <button className="btn btn-ghost btn-sm" onClick={onNavigateStages}>
          <Icon name="stages" size={15} /> Change stage
        </button>
      </SectionTitle>

      <div className="battle-layout">
        <div className="battle-main">
          <div className="stage-ribbon">
            <div className="stage-ribbon-left">
              <span className={`stage-pill ${isBoss ? 'boss' : ''}`}>
                {inDungeon ? 'DUNGEON' : `STAGE ${state.progress.farmStage}`} · LV {enemyLevel}
              </span>
              <span className="stage-sub">{inDungeon ? dungeon?.subtitle : info.region.subtitle}</span>
            </div>
            <div className="stage-pips" aria-label={`Stage progress ${progress} of 7`}>
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className={`pip ${i < progress ? 'filled' : ''}`} />
              ))}
              <span className={`pip boss-pip ${isBoss || progress >= 7 ? 'filled' : ''}`}>
                <Icon name="crown" size={10} />
              </span>
            </div>
            <div className="stage-ribbon-right">
              {inDungeon ? (
                <span className="dungeon-timer">
                  <Icon name="clock" size={14} /> {Math.ceil(state.combat.dungeonTimeLeft)}s
                </span>
              ) : (
                <span className="stage-level">Item level {enemyLevel}</span>
              )}
            </div>
          </div>

          <div className={`battlefield ${isBoss ? 'boss-fight' : ''}`}>
            <Backdrop palette={palette} boss={isBoss} />
            {isBoss && <div className="boss-vignette" />}

            <div className="arena">
              <div className="fighter player-fighter">
                <div className="fighter-hud">
                  <div className="fighter-label">
                    <span className="fname">{state.player.name}</span>
                    <span className="flvl">Lv {state.player.level} {cls.name}</span>
                  </div>
                  <Bar value={state.player.hp} max={stats.maxHp} kind="hp" compact />
                  <Bar value={state.player.mp} max={stats.maxMp} kind="mp" compact />
                  {state.combat.shield > 0 && (
                    <span className="shield-badge">
                      <Icon name="shield" size={12} /> {formatCompact(state.combat.shield)}
                    </span>
                  )}
                </div>
                <HeroArt
                  classId={state.player.classId}
                  size={230}
                  costumeIds={Object.values(state.costumes.equipped)}
                  className="fighter-art player-art"
                  pose="battle"
                />
                {state.combat.buffs.length > 0 && (
                  <div className="buff-row">
                    {state.combat.buffs.map((b) => (
                      <span className="buff-chip" key={b.id} title={`${b.name} active`}>
                        {b.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="floater-layer player-floaters">
                  {floaters
                    .filter((f) => f.side === 'player')
                    .map((f) => (
                      <span
                        key={f.id}
                        className={`floater ${f.kind}`}
                        style={{ '--drift': `${f.drift}px` } as React.CSSProperties}
                      >
                        {f.text}
                      </span>
                    ))}
                </div>
              </div>

              <div className="arena-center">
                <span className={`versus ${isBoss ? 'boss' : ''}`}>{isBoss ? '✦' : '◆'}</span>
                <span className="ground-line" />
              </div>

              <div className="fighter enemy-fighter">
                <div className="fighter-hud enemy-hud">
                  <div className="fighter-label">
                    <span className="fname">{enemyName}</span>
                    <span className="flvl">
                      Lv {enemyLevel}
                      {enemy?.elite && <em className="tag elite">ELITE</em>}
                      {enemy?.tier === 'stone' && <em className="tag stone">STONE</em>}
                      {isBoss && <em className="tag boss">GUARDIAN</em>}
                    </span>
                  </div>
                  {enemy && <Bar value={enemy.hp} max={enemy.maxHp} kind={isBoss ? 'boss' : 'hp'} compact />}
                </div>
                {enemy ? (
                  <MonsterArt
                    family={enemy.family}
                    element={enemy.element}
                    tier={enemy.isBoss ? 'boss' : enemy.elite ? 'elite' : enemy.tier}
                    size={isBoss ? 245 : 210}
                    className="fighter-art monster-art-main"
                  />
                ) : (
                  <div className="respawning">
                    <span className="ember-spin" />
                    <span>The ember rekindles you…</span>
                  </div>
                )}
                {enemy && (
                  <div className="enemy-meta">
                    <span style={{ color: elementColor(enemy.element) }}>
                      <Icon name="spark" size={11} /> {enemy.element}
                    </span>
                    <span>ATK {formatCompact(enemy.attack)}</span>
                    <span>DEF {formatCompact(enemy.defense)}</span>
                  </div>
                )}
                <div className="floater-layer enemy-floaters">
                  {floaters
                    .filter((f) => f.side === 'enemy')
                    .map((f) => (
                      <span
                        key={f.id}
                        className={`floater ${f.kind}`}
                        style={{ '--drift': `${f.drift}px` } as React.CSSProperties}
                      >
                        {f.text}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="arena-footer">
              <span className="arena-hint">
                {state.progress.autoSkills ? 'Skills auto-cast in priority order' : 'Skills are manual'} ·{' '}
                {state.progress.autoAdvance ? 'Auto-advance on' : 'Farming selected stage'}
              </span>
              <span className="arena-hint right">
                {state.combat.buffs.length > 0 ? `Buffs: ${state.combat.buffs.map((b) => b.name).join(', ')}` : 'No active buffs'}
              </span>
            </div>
          </div>

          <div className="skill-bar">
            <div className="skill-slots">
              {skills.map((skill) => {
                const unlocked = state.player.level >= skill.unlockLevel
                const cd = state.combat.skillCds[skill.id] ?? 0
                const canCast = unlocked && cd <= 0 && state.player.mp >= skill.mpCost
                const ratio = skill.cooldown > 0 ? Math.min(1, cd / skill.cooldown) : 0
                return (
                  <button
                    key={skill.id}
                    className={`skill-btn ${unlocked ? '' : 'locked'} ${cd > 0 ? 'cooling' : ''}`}
                    onClick={() => game.castSkill(skill.id)}
                    disabled={!unlocked || cd > 0 || state.player.mp < skill.mpCost}
                    title={unlocked ? `${skill.name} — ${skill.description} (${skill.mpCost} MP)` : `Unlocks at level ${skill.unlockLevel}`}
                  >
                    <span className="skill-glyph">
                      <Icon name={SKILL_ICON[skill.icon] ?? 'spark'} size={22} />
                    </span>
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-mp">{skill.mpCost} MP</span>
                    {cd > 0 && <span className="cooldown-overlay" style={{ height: `${ratio * 100}%` }} />}
                    {cd > 0 && <span className="cooldown-text">{Math.ceil(cd)}</span>}
                    {!unlocked && <span className="skill-lock">Lv {skill.unlockLevel}</span>}
                    {canCast && <span className="ready-pip" />}
                  </button>
                )
              })}
            </div>
            <div className="skill-bar-side">
              <Toggle
                checked={state.progress.autoSkills}
                onChange={() => game.toggleAuto('autoSkills')}
                label="Auto-skills"
              />
              <button className="btn btn-ghost btn-sm" onClick={() => game.toggleAuto('autoAdvance')}>
                <Icon name={state.progress.autoAdvance ? 'check' : 'arrow'} size={14} /> Auto-advance
              </button>
            </div>
          </div>
        </div>

        <aside className="battle-side">
          <Panel title="Auto-Farming" className="side-panel">
            <Toggle
              checked={state.progress.autoAdvance}
              onChange={() => game.toggleAuto('autoAdvance')}
              label="Advance stages"
              hint="Move on after clearing a stage"
            />
            <Toggle
              checked={state.progress.autoSkills}
              onChange={() => game.toggleAuto('autoSkills')}
              label="Cast skills"
              hint="Use abilities whenever ready"
            />
            <Toggle
              checked={state.progress.autoLoot}
              onChange={() => game.toggleAuto('autoLoot')}
              label="Auto-loot"
              hint="Collect drops automatically"
            />
            <Toggle
              checked={state.progress.autoSellCommon}
              onChange={() => game.toggleAuto('autoSellCommon')}
              label="Sell commons"
              hint="Convert common drops to gold"
            />
            <button className="btn btn-ghost btn-block btn-sm" onClick={() => game.selectStage(Math.max(1, state.progress.farmStage - 1))} disabled={state.progress.farmStage <= 1 || inDungeon}>
              <Icon name="chevron" size={14} className="flip" /> Previous stage
            </button>
            <button
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => game.selectStage(state.progress.farmStage + 1)}
              disabled={state.progress.farmStage >= state.progress.highestStage || inDungeon}
            >
              Next stage <Icon name="chevron" size={14} />
            </button>
            {inDungeon && (
              <button className="btn btn-danger btn-block btn-sm" onClick={() => game.leaveDungeon()}>
                Retreat from dungeon
              </button>
            )}
          </Panel>

          <Panel title="Drop Tray" className="side-panel" actions={<span className="badge">{state.pendingLoot.length}</span>}>
            {state.pendingLoot.length ? (
              <>
                <p className="muted small">Auto-loot is off. Collect your spoils before they fade.</p>
                <div className="pending-list">
                  {state.pendingLoot.slice(-4).map((p) => (
                    <span key={p.id}>{p.label}</span>
                  ))}
                </div>
                <button className="btn btn-primary btn-block btn-sm" onClick={() => game.collectLoot()}>
                  Collect all
                </button>
              </>
            ) : (
              <p className="muted small">No loot waiting. Every drop is being collected automatically while auto-loot is on.</p>
            )}
          </Panel>

          <Panel title="Combat Log" className="side-panel log-panel">
            <div className="combat-log">
              {recentLog.map((entry) => (
                <p key={entry.id} className={`log-line ${entry.kind}`}>
                  <span className="log-time">{new Date(entry.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {entry.text}
                </p>
              ))}
            </div>
          </Panel>

          <Panel title="This Session" className="side-panel">
            <div className="stat-grid">
              <div>
                <span>Kills</span>
                <strong>{state.statistics.kills.toLocaleString()}</strong>
              </div>
              <div>
                <span>Guardians</span>
                <strong>{state.statistics.bosses.toLocaleString()}</strong>
              </div>
              <div>
                <span>Gold earned</span>
                <strong>{formatCompact(state.statistics.goldEarned)}</strong>
              </div>
              <div>
                <span>Items found</span>
                <strong>{state.statistics.itemsFound.toLocaleString()}</strong>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
