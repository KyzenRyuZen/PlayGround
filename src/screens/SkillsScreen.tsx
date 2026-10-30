import { useGame, game } from '../game/state/store'
import { CLASSES, skillsForClass } from '../game/data/classes'
import type { SkillDef } from '../game/types'
import { Panel, SectionTitle, Toggle } from '../ui/ui'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/format'

const ICONS: Record<string, string> = {
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

function effectLine(skill: SkillDef, rank: number): string {
  const eff = skill.effect
  if (eff.kind === 'strike') {
    const mult = eff.multiplier + skill.perLevel * (rank - 1)
    return `${eff.hits && eff.hits > 1 ? `${eff.hits} hits × ` : ''}${Math.round(mult * 100)}% attack damage${eff.ignoreDefense ? ` · ignores ${eff.ignoreDefense}% defense` : ''}${eff.slow ? ' · slows' : ''}`
  }
  const parts: string[] = []
  if (eff.attackPct) parts.push(`+${(eff.attackPct + skill.perLevel * 100 * (rank - 1)).toFixed(0)}% Attack`)
  if (eff.defensePct) parts.push(`+${(eff.defensePct + skill.perLevel * 100 * (rank - 1)).toFixed(0)}% Defense`)
  if (eff.critAdd) parts.push(`+${(eff.critAdd + skill.perLevel * 100 * (rank - 1)).toFixed(0)}% Critical Chance`)
  if (eff.shieldPct) parts.push(`Absorbs ${Math.round((eff.shieldPct + skill.perLevel * (rank - 1)) * 100)}% max HP`)
  if (eff.healPct) parts.push(`Heals ${Math.round((eff.healPct + skill.perLevel * (rank - 1) * 0.3) * 100)}% max HP`)
  if (parts.length) parts.push(`for ${eff.duration}s`)
  return parts.join(' · ')
}

export function SkillsScreen() {
  const state = useGame()
  const cls = CLASSES[state.player.classId]
  const skills = skillsForClass(state.player.classId)

  const upgrade = (id: string) => {
    const result = game.upgradeSkill(id)
    toast(result.message ?? (result.ok ? 'Skill improved.' : 'Cannot improve.'), result.ok ? 'success' : 'error')
  }

  return (
    <div className="screen">
      <SectionTitle eyebrow={cls.title} title="Skills">
        <span className="tag gold">{state.player.skillPoints} skill points</span>
        <span className="tag">{state.player.gold.toLocaleString()} gold</span>
      </SectionTitle>

      <div className="skill-page-head">
        <div className="skill-passive">
          <span className="passive-glyph"><Icon name="spark" size={24} /></span>
          <div>
            <span className="eyebrow">Class Passive</span>
            <strong>{cls.passive}</strong>
          </div>
        </div>
        <Toggle
          checked={state.progress.autoSkills}
          onChange={() => game.toggleAuto('autoSkills')}
          label="Auto-cast skills"
          hint="Highest priority ready skill is cast automatically"
        />
      </div>

      <div className="skill-list">
        {skills.map((skill) => {
          const unlocked = state.player.level >= skill.unlockLevel
          const rank = state.skillLevels[skill.id] ?? 1
          const maxed = rank >= 10
          const cost = 400 * rank * rank
          return (
            <Panel key={skill.id} className={`skill-card ${unlocked ? '' : 'locked'}`}>
              <div className="skill-card-icon">
                <Icon name={ICONS[skill.icon] ?? 'spark'} size={30} />
              </div>
              <div className="skill-card-main">
                <div className="skill-card-title">
                  <h3>{skill.name}</h3>
                  <span className="tag">{skill.mpCost} MP</span>
                  <span className="tag">{skill.cooldown}s CD</span>
                  {unlocked ? <span className="tag gold">Rank {rank}</span> : <span className="tag">Unlocks Lv {skill.unlockLevel}</span>}
                </div>
                <p className="muted">{skill.description}</p>
                <div className="skill-effect-line">
                  <Icon name="spark" size={13} /> {effectLine(skill, rank)}
                </div>
                <div className="rank-pips">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <i key={i} className={i < rank ? 'filled' : ''} />
                  ))}
                </div>
              </div>
              <div className="skill-card-action">
                <div className="skill-cost">
                  <span><Icon name="coins" size={13} /> {cost.toLocaleString()}</span>
                  <span><Icon name="spark" size={13} /> 1 point</span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!unlocked || maxed || state.player.skillPoints < 1 || state.player.gold < cost}
                  onClick={() => upgrade(skill.id)}
                >
                  {maxed ? 'Max Rank' : `Rank ${rank + 1}`}
                </button>
              </div>
            </Panel>
          )
        })}
      </div>

      <Panel className="skill-tip">
        <Icon name="info" size={16} />
        <p>
          Skill points are earned every level. Rank 10 is the ceiling for each ability. Auto-cast prioritises the first
          ready skill in class order, so upgrade the abilities you want firing most often.
        </p>
      </Panel>
    </div>
  )
}
