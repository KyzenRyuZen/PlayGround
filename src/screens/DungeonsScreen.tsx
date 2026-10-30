import { useGame, game } from '../game/state/store'
import { DUNGEONS } from '../game/data/dungeons'
import { monsterById } from '../game/data/monsters'
import { RARITY } from '../game/data/classes'
import { MATERIALS } from '../game/data/materials'
import { MonsterArt } from '../ui/MonsterArt'
import { Panel, SectionTitle } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { formatCompact, toast } from '../ui/format'

export function DungeonsScreen({ onNavigateBattle }: { onNavigateBattle: () => void }) {
  const state = useGame()
  const inDungeon = state.combat.mode === 'dungeon'

  const enter = (id: string) => {
    const result = game.startDungeon(id)
    if (result.ok) {
      toast('The guardian awakens.', 'level')
      onNavigateBattle()
    } else {
      toast(result.message ?? 'Cannot enter.', 'error')
    }
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow="Trials of the Sundered" title="Dungeons">
        <span className="tag">3 attempts each · daily</span>
        {inDungeon && (
          <button className="btn btn-primary btn-sm" onClick={onNavigateBattle}>
            <Icon name="battle" size={15} /> Return to fight
          </button>
        )}
      </SectionTitle>

      <Panel className="dungeon-intro">
        <div className="lore-block">
          <Icon name="info" size={18} />
          <p>
            Dungeon guardians are far stronger than stage monsters and must be defeated before the timer expires. Each
            clear guarantees an item at or above the listed rarity. Attempts refresh daily; Emberbound Membership grants
            one extra attempt per dungeon.
          </p>
        </div>
      </Panel>

      <div className="dungeon-grid">
        {DUNGEONS.map((dungeon) => {
          const boss = monsterById(dungeon.bossId)
          const remaining = game.dungeonRemaining(dungeon.id)
          const locked = state.player.level < dungeon.requiredLevel
          const active = inDungeon && state.combat.dungeonId === dungeon.id
          return (
            <Panel key={dungeon.id} className={`dungeon-card ${locked ? 'locked' : ''} ${active ? 'active' : ''}`}>
              <div className="dungeon-art" style={{ background: `linear-gradient(160deg, ${dungeon.palette.far}, ${dungeon.palette.near})` }}>
                <div className="dungeon-art-glow" style={{ background: `radial-gradient(circle, ${dungeon.palette.glow}33, transparent 65%)` }} />
                <MonsterArt family={boss.family} element={boss.element} tier="boss" size={190} />
                <span className="dungeon-level">LV {dungeon.level}</span>
                {locked && <span className="dungeon-lock"><Icon name="lock" size={18} /> Requires level {dungeon.requiredLevel}</span>}
              </div>
              <div className="dungeon-body">
                <span className="eyebrow">{dungeon.subtitle}</span>
                <h3>{dungeon.name}</h3>
                <p className="muted small">{dungeon.description}</p>
                <div className="dungeon-stats">
                  <span><Icon name="clock" size={13} /> {dungeon.timeLimit}s</span>
                  <span><Icon name="crown" size={13} /> {boss.name}</span>
                  <span><Icon name="flame" size={13} /> {boss.element}</span>
                </div>
                <div className="attempt-row">
                  <span>Attempts</span>
                  <div className="attempt-pips">
                    {Array.from({ length: dungeon.attempts + 1 }).map((_, i) => (
                      <i key={i} className={i < remaining ? 'filled' : ''} />
                    ))}
                  </div>
                  <strong>{remaining}/{dungeon.attempts + 1}</strong>
                </div>
                <div className="dungeon-rewards">
                  <span><Icon name="coins" size={13} /> {formatCompact(dungeon.rewardGold)}</span>
                  <span><Icon name="xp" size={13} /> {formatCompact(dungeon.rewardXp)}</span>
                  <span className="rarity-reward" style={{ color: RARITY[dungeon.rarityFloor].color }}>
                    <Icon name="spark" size={13} /> {RARITY[dungeon.rarityFloor].name}+
                  </span>
                </div>
                <div className="dungeon-mats">
                  {Object.entries(dungeon.materials).map(([id, count]) => (
                    <span key={id} title={MATERIALS[id as keyof typeof MATERIALS]?.name}>
                      {count}× {MATERIALS[id as keyof typeof MATERIALS]?.name}
                    </span>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-block"
                  disabled={locked || remaining <= 0 || inDungeon}
                  onClick={() => enter(dungeon.id)}
                >
                  {active ? 'In Progress' : remaining <= 0 ? 'No Attempts Left' : locked ? `Level ${dungeon.requiredLevel} Required` : 'Enter Dungeon'}
                </button>
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
