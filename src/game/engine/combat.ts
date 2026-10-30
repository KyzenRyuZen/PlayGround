import type { DungeonDef, Element, GameState, Item, MonsterDef, MonsterInstance, SkillDef } from '../types'
import type { Rng } from '../rng'
import { MONSTERS, monsterById } from '../data/monsters'
import { MAX_STAGE, getStageInfo, stageBossId, stageLevel } from '../data/zones'
import { dungeonById } from '../data/dungeons'
import { SKILLS, skillsForClass } from '../data/classes'
import { getPlayerStats } from './stats'
import { grantXp, goldMultiplier, xpMultiplier, trackDaily, isMembershipActive } from './progression'
import { addFloater, addItemToInventory, addLog, dropLoot, grantGold, grantMaterials } from './rewards'
import { generateItem, rollRarity } from './items'
import { todayKey } from '../data/dailies'

export function dungeonAttemptsRemaining(state: GameState, def: DungeonDef): number {
  const used = state.dungeons.day === todayKey() ? (state.dungeons.used[def.id] ?? 0) : 0
  const total = def.attempts + (isMembershipActive(state) ? 1 : 0)
  return Math.max(0, total - used)
}

export function stageKillsNeededForBoss(): number {
  return 7
}

function makeMonster(def: MonsterDef, level: number, opts: { elite?: boolean; boss?: boolean } = {}): MonsterInstance {
  const elite = Boolean(opts.elite)
  const boss = Boolean(opts.boss || def.tier === 'boss')
  const hpMult = def.hpMult * (elite ? 2.6 : 1)
  const atkMult = def.atkMult * (elite ? 1.25 : 1)
  const hp = Math.round((30 + level * 17) * hpMult)
  return {
    defId: def.id,
    name: elite ? `${['Dread', 'Veteran', 'Ancient', 'Bloodsworn', 'Gloomtouched'][level % 5]} ${def.name}` : def.name,
    family: def.family,
    element: def.element,
    tier: def.tier,
    level,
    hp,
    maxHp: hp,
    attack: Math.round((4 + level * 2.7) * atkMult),
    defense: Math.round(level * 2.3 * def.defMult * (elite ? 1.15 : 1)),
    xp: Math.round((12 + level * 7) * def.xpMult * (elite ? 2.4 : 1)),
    gold: Math.round((8 + level * 4.5) * def.goldMult * (elite ? 2.8 : 1)),
    isBoss: boss,
    elite,
  }
}

export function createStageMonster(stage: number, state: GameState, rng: Rng): MonsterInstance {
  const info = getStageInfo(stage)
  const level = stageLevel(stage)

  if (info.isBossStage) {
    const bossDef = monsterById(stageBossId(stage))
    return makeMonster(bossDef, level + 2, { boss: true })
  }

  if (rng.chance(0.055)) {
    const stoneDef = rng.pick(MONSTERS.filter((m) => m.tier === 'stone'))
    return makeMonster(stoneDef, level)
  }

  const basePool = info.region.pool.filter((id) => monsterById(id).tier !== 'stone')
  const def = monsterById(rng.pick(basePool.length ? basePool : [info.region.pool[0]!]))
  const elite = rng.chance(0.12)
  return makeMonster(def, level, { elite })
}

export function createDungeonBoss(def: DungeonDef): MonsterInstance {
  const bossDef = monsterById(def.bossId)
  const enemy = makeMonster(bossDef, def.level, { boss: true })
  // Dungeon lords are tuned for a full skill rotation, not just auto-attacks.
  enemy.maxHp = Math.round(enemy.maxHp * 1.15)
  enemy.hp = enemy.maxHp
  return enemy
}

export function spawnStageEnemy(state: GameState, rng: Rng): void {
  const c = state.combat
  const stage = state.progress.farmStage
  state.player.hp = Math.min(state.player.hp, getPlayerStats(state).maxHp)
  c.enemy = createStageMonster(stage, state, rng)
  c.playerAtkCd = 0.55
  c.enemyAtkCd = 2.1
  c.mode = 'stage'
  c.dungeonId = null
}

function buffTotals(state: GameState) {
  const totals = { attackPct: 0, defensePct: 0, critAdd: 0, speedPct: 0 }
  for (const buff of state.combat.buffs) {
    totals.attackPct += buff.attackPct ?? 0
    totals.defensePct += buff.defensePct ?? 0
    totals.critAdd += buff.critAdd ?? 0
    totals.speedPct += buff.speedPct ?? 0
  }
  return totals
}

export function playerDamage(
  state: GameState,
  enemy: MonsterInstance,
  multiplier: number,
  rng: Rng,
  opts: { ignoreDefense?: number; bonusCrit?: number } = {},
): { value: number; crit: boolean } {
  const stats = getPlayerStats(state)
  const buffs = buffTotals(state)
  const attack = stats.attack * (1 + buffs.attackPct / 100)
  const defense = enemy.defense * (1 - stats.penetration / 100) * (1 - (opts.ignoreDefense ?? 0) / 100)
  const reduction = Math.min(0.82, defense / (defense + 150 + enemy.level * 8))
  let damage = attack * (1 - reduction) * multiplier
  const crit = rng.chance(stats.critChance + buffs.critAdd / 100 + (opts.bonusCrit ?? 0))
  if (crit) damage *= stats.critDamage
  if (enemy.isBoss) damage *= 1 + stats.bossDamage / 100
  else damage *= 1 + stats.monsterDamage / 100
  return { value: Math.max(1, Math.round(damage)), crit }
}

function dealDamage(state: GameState, enemy: MonsterInstance, value: number, crit: boolean, rng: Rng): void {
  enemy.hp -= value
  addFloater(state, `${crit ? '✹ ' : ''}${value.toLocaleString()}`, crit ? 'crit' : 'damage', 'enemy', (rng.next() - 0.5) * 24)
  const stats = getPlayerStats(state)
  if (stats.lifesteal > 0) {
    const heal = Math.max(1, Math.round(value * (stats.lifesteal / 100)))
    state.player.hp = Math.min(stats.maxHp, state.player.hp + heal)
  }
}

function enemyName(state: GameState): string {
  return state.combat.enemy?.name ?? 'the dark'
}

export function castSkill(state: GameState, skillId: string, rng: Rng, manual = false): boolean {
  const c = state.combat
  const skill = SKILLS.find((s) => s.id === skillId)
  if (!skill) return false
  if (!c.enemy || c.enemy.hp <= 0) return false
  if (state.player.level < skill.unlockLevel) return false
  if ((c.skillCds[skill.id] ?? 0) > 0) return false
  if (state.player.mp < skill.mpCost) return false

  const stats = getPlayerStats(state)
  const level = state.skillLevels[skill.id] ?? 1
  const buffs = buffTotals(state)

  if (skill.effect.kind === 'buff') {
    if (!manual && c.buffs.some((b) => b.id === skill.id && b.expiresAt > c.time + 1.2)) return false
    const eff = skill.effect
    if (eff.shieldPct) {
      c.shield += Math.round(stats.maxHp * eff.shieldPct * (1 + (level - 1) * 0.15))
      addFloater(state, `Barrier ${Math.round(stats.maxHp * eff.shieldPct)}`, 'heal', 'player')
    }
    if (eff.healPct) {
      const heal = Math.round(stats.maxHp * eff.healPct * (1 + (level - 1) * 0.12))
      state.player.hp = Math.min(stats.maxHp, state.player.hp + heal)
      addFloater(state, `+${heal}`, 'heal', 'player')
    }
    if (eff.attackPct || eff.defensePct || eff.critAdd || eff.speedPct) {
      c.buffs = c.buffs.filter((b) => b.id !== skill.id)
      c.buffs.push({
        id: skill.id,
        name: skill.name,
        attackPct: eff.attackPct ? eff.attackPct + skill.perLevel * 100 * (level - 1) : undefined,
        defensePct: eff.defensePct ? eff.defensePct + skill.perLevel * 100 * (level - 1) : undefined,
        critAdd: eff.critAdd ? eff.critAdd + skill.perLevel * 100 * (level - 1) : undefined,
        speedPct: eff.speedPct ? eff.speedPct + skill.perLevel * 100 * (level - 1) : undefined,
        expiresAt: c.time + eff.duration,
      })
    }
  } else {
    const eff = skill.effect
    const hits = eff.hits ?? 1
    const multiplier = eff.multiplier + skill.perLevel * (level - 1)
    for (let i = 0; i < hits; i++) {
      if (!c.enemy || c.enemy.hp <= 0) break
      const { value, crit } = playerDamage(state, c.enemy, multiplier, rng, {
        ignoreDefense: eff.ignoreDefense,
        bonusCrit: eff.bonusCrit,
      })
      dealDamage(state, c.enemy, value, crit, rng)
      if (c.enemy.hp <= 0) {
        killEnemy(state, rng)
        break
      }
    }
    if (eff.slow) c.enemySlowUntil = c.time + eff.slow
  }

  state.player.mp = Math.max(0, state.player.mp - skill.mpCost)
  c.skillCds[skill.id] = skill.cooldown
  c.skillLock = manual ? 0.25 : 0.35
  return true
}

function tryAutoSkills(state: GameState, rng: Rng): void {
  const c = state.combat
  if (c.skillLock > 0) return
  const unlocked = skillsForClass(state.player.classId).filter((s) => state.player.level >= s.unlockLevel)
  for (const skill of unlocked) {
    if ((c.skillCds[skill.id] ?? 0) > 0) continue
    if (state.player.mp < skill.mpCost) continue
    if (skill.effect.kind === 'buff' && c.buffs.some((b) => b.id === skill.id && b.expiresAt > c.time + 1.2)) continue
    if (castSkill(state, skill.id, rng)) return
  }
}

function enemyAttack(state: GameState, stats: ReturnType<typeof getPlayerStats>, rng: Rng): void {
  const c = state.combat
  if (!c.enemy) return
  if (c.respawnTimer > 0) return
  const buffs = buffTotals(state)
  const effectiveDefense = stats.defense * (1 + buffs.defensePct / 100)
  const mitigation = Math.min(0.78, effectiveDefense / (effectiveDefense + 90 + c.enemy.level * 7))
  const resist = stats.resistances[c.enemy.element as Element] ?? 0
  let raw = c.enemy.attack * rng.float(0.9, 1.12) * (1 - mitigation) * (1 - resist / 100)
  if (c.enemy.isBoss) raw *= 1.05
  let damage = Math.max(1, Math.round(raw))
  if (c.shield > 0) {
    const absorbed = Math.min(c.shield, damage)
    c.shield -= absorbed
    damage -= absorbed
    if (absorbed > 0) addFloater(state, `-${absorbed} shield`, 'heal', 'player', -14)
  }
  if (damage > 0) {
    state.player.hp -= damage
    addFloater(state, `-${damage.toLocaleString()}`, 'taken', 'player', (rng.next() - 0.5) * 18)
  }
  if (state.player.hp <= 0) {
    handlePlayerDeath(state, rng)
  }
}

function handlePlayerDeath(state: GameState, rng: Rng): void {
  const c = state.combat
  state.statistics.deaths += 1
  state.player.hp = 0
  if (c.mode === 'dungeon') {
    const dungeon = dungeonById(c.dungeonId ?? '')
    if (dungeon) finishDungeon(state, dungeon, rng, false)
    return
  }
  addLog(state, `You fall in ${getStageInfo(state.progress.farmStage).name}. The ember pulls you back.`, 'combat')
  const stats = getPlayerStats(state)
  c.respawnTimer = 1.6
  c.enemy = null
  state.player.hp = stats.maxHp
  state.player.mp = stats.maxMp
  addFloater(state, 'Ember Revival', 'heal', 'player')
}

function completeStage(state: GameState, rng: Rng): void {
  const current = state.progress.farmStage
  const cleared = getStageInfo(current)
  state.progress.highestStage = Math.max(state.progress.highestStage, current + 1)
  state.combat.stageKills = 0
  const nextUnlocked = Math.min(MAX_STAGE, current + 1)
  if (state.progress.autoAdvance && current < MAX_STAGE) {
    state.progress.farmStage = nextUnlocked
    addLog(state, `${cleared.name} cleared. Advancing to stage ${nextUnlocked}.`, 'level')
  } else {
    addLog(state, `${cleared.name} cleared. Farming the same stage.`, 'level')
  }
  addFloater(state, `STAGE ${current} CLEARED`, 'level', 'enemy')
}

export function killEnemy(state: GameState, rng: Rng): void {
  const c = state.combat
  const enemy = c.enemy
  if (!enemy || enemy.hp > 0) return

  const xp = Math.round(enemy.xp * xpMultiplier(state))
  const gold = Math.round(enemy.gold * goldMultiplier(state))
  grantGold(state, gold)
  addFloater(state, `+${gold} gold`, 'loot', 'enemy', 12)
  const xpResult = grantXp(state, xp)
  addFloater(state, `+${xp} XP`, 'loot', 'enemy', -10)
  state.statistics.kills += 1
  trackDaily(state, 'kills')
  if (enemy.isBoss) {
    state.statistics.bosses += 1
    trackDaily(state, 'bosses')
    addLog(state, `${enemy.name} is slain.`, 'combat')
  }
  for (const skillId of xpResult.skillUnlocks) {
    const skill = SKILLS.find((s) => s.id === skillId)
    if (skill) addLog(state, `New skill unlocked: ${skill.name}.`, 'level')
  }
  if (xpResult.levels > 0) {
    addLog(state, `Level ${state.player.level} reached. +${xpResult.levels * 5} attribute points.`, 'level')
    addFloater(state, `LEVEL ${state.player.level}`, 'level', 'player')
  }

  const source = c.mode === 'dungeon' ? 'dungeon' : enemy.isBoss ? 'boss' : 'normal'
  dropLoot(state, enemy, rng, source)

  if (c.mode === 'dungeon') {
    const dungeon = dungeonById(c.dungeonId ?? '')
    if (dungeon) {
      finishDungeon(state, dungeon, rng, true)
    }
    return
  }

  if (enemy.isBoss) {
    completeStage(state, rng)
  } else {
    c.stageKills += 1
  }
  c.enemy = null
  spawnStageEnemy(state, rng)
}

export function finishDungeon(state: GameState, dungeon: DungeonDef, rng: Rng, victory: boolean): void {
  const c = state.combat
  let gold = 0
  let xp = 0
  let item: Item | null = null
  let materials: DungeonDef['materials'] = {}

  if (victory) {
    gold = Math.round(dungeon.rewardGold * goldMultiplier(state))
    xp = Math.round(dungeon.rewardXp * xpMultiplier(state))
    materials = { ...dungeon.materials }
    grantMaterials(state, materials)
    grantGold(state, gold)
    grantXp(state, xp)
    // Guarantee the dungeon's rarity floor.
    item = generateItem(rng, {
      level: dungeon.level,
      source: 'dungeon',
      rarity: rollRarity(rng, 'dungeon', 0.4, dungeon.rarityFloor),
      classId: state.player.classId,
    })
    addItemToInventory(state, item)
    state.statistics.dungeonsCleared += 1
    trackDaily(state, 'dungeons')
    state.progress.highestStage = Math.max(state.progress.highestStage, Math.min(MAX_STAGE, dungeon.requiredLevel + 4))
    addLog(state, `${dungeon.name} conquered. ${dungeon.bossId ? monsterById(dungeon.bossId).name : 'The guardian'} falls.`, 'level')
    addFloater(state, 'DUNGEON CLEARED', 'level', 'enemy')
  } else {
    addLog(state, `${dungeon.name} failed. The guardian still waits.`, 'combat')
    addFloater(state, 'DUNGEON FAILED', 'taken', 'player')
  }

  state.lastDungeonResult = {
    dungeonId: dungeon.id,
    name: dungeon.name,
    victory,
    gold,
    xp,
    item,
    materials,
    at: Date.now(),
  }

  c.mode = 'stage'
  c.dungeonId = null
  c.dungeonTimeLeft = 0
  c.enemy = null
  c.stageKills = 0
  c.buffs = []
  c.shield = 0
  c.respawnTimer = 0
  const stats = getPlayerStats(state)
  state.player.hp = Math.max(1, Math.min(stats.maxHp, state.player.hp || stats.maxHp))
  state.player.mp = Math.min(stats.maxMp, state.player.mp)
  spawnStageEnemy(state, rng)
}

export function startDungeon(state: GameState, dungeonId: string, rng: Rng): { ok: boolean; error?: string } {
  const dungeon = dungeonById(dungeonId)
  if (!dungeon) return { ok: false, error: 'Unknown dungeon.' }
  if (state.player.level < dungeon.requiredLevel) {
    return { ok: false, error: `Requires level ${dungeon.requiredLevel}.` }
  }
  if (dungeonAttemptsRemaining(state, dungeon) <= 0) {
    return { ok: false, error: 'No attempts remaining today.' }
  }
  state.dungeons.used[dungeon.id] = (state.dungeons.used[dungeon.id] ?? 0) + 1
  const c = state.combat
  c.mode = 'dungeon'
  c.dungeonId = dungeon.id
  c.dungeonTimeLeft = dungeon.timeLimit
  c.stageKills = 0
  c.enemy = createDungeonBoss(dungeon)
  c.playerAtkCd = 0.7
  c.enemyAtkCd = 2.4
  c.buffs = []
  c.shield = 0
  c.respawnTimer = 0
  c.floaters = []
  const stats = getPlayerStats(state)
  state.player.hp = stats.maxHp
  state.player.mp = stats.maxMp
  addLog(state, `Entered ${dungeon.name}. ${c.enemy.name} awakens.`, 'combat')
  return { ok: true }
}

export function leaveDungeon(state: GameState, rng: Rng): void {
  const c = state.combat
  if (c.mode !== 'dungeon') return
  c.mode = 'stage'
  c.dungeonId = null
  c.enemy = null
  c.dungeonTimeLeft = 0
  c.buffs = []
  c.shield = 0
  spawnStageEnemy(state, rng)
  addLog(state, 'You retreat from the dungeon.', 'system')
}

export function tickCombat(state: GameState, dtSeconds: number, rng: Rng): void {
  const dt = Math.max(0, Math.min(1.5, dtSeconds))
  const c = state.combat
  c.time += dt
  state.statistics.playSeconds += dt

  c.floaters = c.floaters.filter((f) => f.t > c.time - 1.5)
  c.buffs = c.buffs.filter((b) => b.expiresAt > c.time)
  c.skillLock = Math.max(0, c.skillLock - dt)
  for (const key of Object.keys(c.skillCds)) {
    c.skillCds[key] = Math.max(0, (c.skillCds[key] ?? 0) - dt)
  }

  if (c.respawnTimer > 0) {
    c.respawnTimer -= dt
    if (c.respawnTimer <= 0) {
      c.respawnTimer = 0
      state.player.hp = getPlayerStats(state).maxHp
      spawnStageEnemy(state, rng)
    }
    return
  }

  if (c.mode === 'dungeon') {
    c.dungeonTimeLeft = Math.max(0, c.dungeonTimeLeft - dt)
    if (c.dungeonTimeLeft <= 0) {
      const dungeon = dungeonById(c.dungeonId ?? '')
      if (dungeon) finishDungeon(state, dungeon, rng, false)
      return
    }
  }

  if (!c.enemy) {
    spawnStageEnemy(state, rng)
    return
  }

  const stats = getPlayerStats(state)
  // Passive recovery keeps an idle hero in the fight.
  state.player.hp = Math.min(stats.maxHp, state.player.hp + stats.maxHp * 0.012 * dt)
  state.player.mp = Math.min(stats.maxMp, state.player.mp + (stats.maxMp * 0.018 + 2) * dt)

  const buffs = buffTotals(state)
  const interval = stats.attackInterval / (1 + buffs.speedPct / 100)
  c.playerAtkCd -= dt
  if (c.playerAtkCd <= 0 && c.enemy && c.enemy.hp > 0) {
    c.playerAtkCd = interval
    const { value, crit } = playerDamage(state, c.enemy, 1, rng)
    dealDamage(state, c.enemy, value, crit, rng)
    if (c.enemy.hp <= 0) killEnemy(state, rng)
  }

  if (state.progress.autoSkills && c.enemy && c.enemy.hp > 0) tryAutoSkills(state, rng)

  if (c.enemy && c.enemy.hp > 0) {
    c.enemyAtkCd -= dt
    if (c.enemyAtkCd <= 0) {
      const slowed = c.enemySlowUntil > c.time ? 1.45 : 1
      c.enemyAtkCd = (c.enemy.isBoss ? 2.35 : 2.0) * slowed
      enemyAttack(state, stats, rng)
    }
  }

  state.player.hp = Math.max(0, Math.min(state.player.hp, stats.maxHp))
  state.player.mp = Math.max(0, Math.min(state.player.mp, stats.maxMp))
}

export function selectStage(state: GameState, stage: number, rng: Rng): boolean {
  const target = Math.max(1, Math.min(MAX_STAGE, Math.floor(stage)))
  if (target > state.progress.highestStage) return false
  state.progress.farmStage = target
  state.combat.stageKills = 0
  state.combat.enemy = null
  state.combat.mode = 'stage'
  state.combat.dungeonId = null
  spawnStageEnemy(state, rng)
  addLog(state, `Now farming ${getStageInfo(target).name}.`, 'system')
  return true
}

export function monsterElementLabel(enemy: MonsterInstance): string {
  return enemy.element.charAt(0).toUpperCase() + enemy.element.slice(1)
}

export function skillById(id: string): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id)
}
