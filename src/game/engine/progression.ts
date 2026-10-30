import type { GameState, StatKey } from '../types'
import { CLASSES } from '../data/classes'
import { todayKey } from '../data/dailies'
import { getPlayerStats } from './stats'

export function xpToNext(level: number): number {
  return Math.floor(70 * Math.pow(level, 1.5) + 55 * level)
}

export function totalXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) total += xpToNext(i)
  return total
}

export function isMembershipActive(state: GameState, now = Date.now()): boolean {
  return state.shop.membershipUntil > now
}

export function xpMultiplier(state: GameState, now = Date.now()): number {
  let mult = 1 + getPlayerStats(state).xpBonus / 100
  if (state.shop.xpBoostUntil > now) mult *= 2
  if (isMembershipActive(state, now)) mult *= 1.15
  return mult
}

export function goldMultiplier(state: GameState, now = Date.now()): number {
  let mult = 1 + getPlayerStats(state).goldFind / 100
  if (isMembershipActive(state, now)) mult *= 1.15
  return mult
}

export function lootMultiplier(state: GameState, now = Date.now()): number {
  return state.shop.lootBoostUntil > now ? 2 : 1
}

export interface XpResult {
  levels: number
  skillUnlocks: string[]
}

/** Adds experience and resolves any number of level-ups. Mutates state. */
export function grantXp(state: GameState, amount: number): XpResult {
  const result: XpResult = { levels: 0, skillUnlocks: [] }
  if (amount <= 0) return result
  state.player.xp += Math.round(amount)
  let guard = 0
  while (state.player.xp >= xpToNext(state.player.level) && state.player.level < 100 && guard++ < 1000) {
    state.player.xp -= xpToNext(state.player.level)
    state.player.level += 1
    result.levels += 1
    const cls = CLASSES[state.player.classId]
    if (state.player.autoAssign) {
      const weights = cls.autoWeights
      const points = 5
      const total = weights.strength + weights.intelligence + weights.dexterity + weights.vitality
      const alloc: Record<keyof typeof weights, number> = {
        strength: Math.floor((points * weights.strength) / total),
        intelligence: Math.floor((points * weights.intelligence) / total),
        dexterity: Math.floor((points * weights.dexterity) / total),
        vitality: Math.floor((points * weights.vitality) / total),
      }
      let assigned = Object.values(alloc).reduce((a, b) => a + b, 0)
      const order: (keyof typeof weights)[] = ['strength', 'intelligence', 'dexterity', 'vitality']
      let i = 0
      while (assigned < points) {
        const key = order[i % 4]!
        if (weights[key] > 0) {
          alloc[key] += 1
          assigned += 1
        }
        i++
      }
      state.player.attributes.strength += alloc.strength
      state.player.attributes.intelligence += alloc.intelligence
      state.player.attributes.dexterity += alloc.dexterity
      state.player.attributes.vitality += alloc.vitality
    } else {
      state.player.freePoints += 5
    }
    state.player.skillPoints += 1
    // Skills unlock notification
    for (const [id, level] of Object.entries(SKILL_UNLOCKS)) {
      if (level === state.player.level) result.skillUnlocks.push(id)
    }
    const stats = getPlayerStats(state)
    state.player.hp = stats.maxHp
    state.player.mp = stats.maxMp
  }
  return result
}

export const SKILL_UNLOCKS: Record<string, number> = {
  riven_cleave: 1,
  arcane_lance: 1,
  piercing_shot: 1,
  iron_bulwark: 5,
  frost_nova: 5,
  hawk_eye: 5,
  storm_of_steel: 10,
  mana_shield: 10,
  rain_of_arrows: 10,
  titans_roar: 18,
  meteor: 18,
  venom_volley: 18,
}

export function allocatePoint(state: GameState, stat: keyof GameState['player']['attributes']): boolean {
  if (state.player.freePoints <= 0) return false
  state.player.freePoints -= 1
  state.player.attributes[stat] += 1
  return true
}

export function ensureDailyReset(state: GameState): void {
  const day = todayKey()
  if (state.dailies.day !== day) {
    state.dailies = { day, kills: 0, bosses: 0, upgrades: 0, dungeons: 0, claimed: [] }
  }
  if (state.dungeons.day !== day) {
    state.dungeons = { used: {}, day }
  }
}

export function memberGoldBonus(state: GameState): number {
  return isMembershipActive(state) ? 1.15 : 1
}

export function trackDaily(state: GameState, metric: 'kills' | 'bosses' | 'upgrades' | 'dungeons', amount = 1): void {
  ensureDailyReset(state)
  state.dailies[metric] += amount
}

export function statValueLabel(stat: StatKey, value: number): string {
  const percent = [
    'critChance',
    'critDamage',
    'attackSpeed',
    'penetration',
    'monsterDamage',
    'bossDamage',
    'fireResist',
    'iceResist',
    'natureResist',
    'shadowResist',
    'holyResist',
    'voidResist',
    'goldFind',
    'xpBonus',
    'lifesteal',
    'attackPct',
    'defensePct',
    'hpPct',
  ].includes(stat)
  return percent ? `+${+value.toFixed(1)}%` : `+${Math.round(value)}`
}
