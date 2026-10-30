import type { GameState, MaterialId, OfflineSummary } from '../types'
import type { Rng } from '../rng'
import { getPlayerStats } from './stats'
import { goldMultiplier, grantXp, lootMultiplier, trackDaily, xpMultiplier } from './progression'
import { createStageMonster } from './combat'
import { generateItem } from './items'
import { generateStone } from './stones'
import { addItemDirect, addLog, grantGold, grantMaterials } from './rewards'
import { MATERIALS } from '../data/materials'

export const OFFLINE_CAP_SECONDS = 12 * 60 * 60
const OFFLINE_MIN_SECONDS = 60
const OFFLINE_EFFICIENCY = 0.82

/**
 * Deterministically estimate the rewards earned while the player was away.
 * Rewards are applied immediately, then surfaced as a "welcome back" report.
 */
export function simulateOffline(state: GameState, secondsAway: number, rng: Rng): OfflineSummary | null {
  const seconds = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, Math.floor(secondsAway)))
  if (seconds < OFFLINE_MIN_SECONDS) return null

  const stats = getPlayerStats(state)
  const sample = createStageMonster(state.progress.farmStage, state, rng)
  const mitigation = Math.min(
    0.9,
    sample.defense / (sample.defense + 150 + sample.level * 8),
  )
  const critFactor = 1 + stats.critChance * (stats.critDamage - 1)
  const dps = (stats.attack / stats.attackInterval) * (1 - mitigation) * critFactor * (1 + stats.monsterDamage / 100)
  const killTime = Math.max(1.1, sample.maxHp / Math.max(1, dps) + 0.35)
  const kills = Math.max(0, Math.floor((seconds / killTime) * OFFLINE_EFFICIENCY))
  if (kills === 0) return null

  const xp = Math.round(kills * sample.xp * xpMultiplier(state) * OFFLINE_EFFICIENCY)
  const gold = Math.round(kills * sample.gold * goldMultiplier(state) * OFFLINE_EFFICIENCY)
  grantGold(state, gold)
  const xpResult = grantXp(state, xp)

  const items = [] as OfflineSummary['items']
  const lootChance = 0.17 * lootMultiplier(state) * 0.85
  const expectedItems = Math.min(24, kills * lootChance)
  let itemRolls = Math.floor(expectedItems)
  if (rng.chance(expectedItems - itemRolls)) itemRolls += 1
  for (let i = 0; i < itemRolls; i++) {
    if (state.inventory.length >= 150) break
    const item = generateItem(rng, {
      level: sample.level,
      source: 'normal',
      classId: state.player.classId,
    })
    addItemDirect(state, item, true)
    items.push(item)
  }

  const materials: Partial<Record<MaterialId, number>> = {}
  const expected = {
    weapon_stone: kills * 0.11,
    armor_stone: kills * 0.11,
    protection_scroll: kills * 0.008,
    mystic_rune: kills * 0.02,
    chaos_crystal: kills * 0.016,
    refinement_powder: kills * 0.025,
    pet_essence: kills * 0.02,
    mount_essence: kills * 0.016,
    stone_dust: kills * 0.05 + (kills > 40 ? 2 : 0),
  }
  for (const [id, value] of Object.entries(expected)) {
    let count = Math.floor(value)
    if (rng.chance(value - count)) count += 1
    if (count > 0) materials[id as MaterialId] = count
  }
  grantMaterials(state, materials)

  if (kills > 250 && rng.chance(0.5)) {
    const stone = generateStone(rng, sample.level, { gradeFloor: 1 })
    state.stones.inventory.push(stone)
    grantMaterials(state, { stone_dust: 4 })
  }

  state.statistics.kills += kills
  state.statistics.goldEarned += gold
  trackDaily(state, 'kills', kills)
  if (xpResult.levels > 0) {
    addLog(state, `Offline training reached level ${state.player.level}.`, 'level')
  }
  addLog(
    state,
    `While away: ${kills.toLocaleString()} monsters slain, ${gold.toLocaleString()} gold, ${items.length} items.`,
    'system',
  )

  const materialText = Object.entries(materials)
    .filter(([, v]) => v)
    .map(([id, v]) => `${v}× ${MATERIALS[id as MaterialId]?.name ?? id}`)
    .slice(0, 6)
    .join(', ')

  return {
    seconds,
    xp,
    gold,
    kills,
    items,
    materials,
    levels: xpResult.levels,
    materialText,
  }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
