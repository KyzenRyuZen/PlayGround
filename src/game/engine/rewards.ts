import type { GameState, Item, MaterialId, MonsterInstance } from '../types'
import type { Rng } from '../rng'
import { generateItem, sellPrice } from './items'
import { generateStone } from './stones'
import { MATERIALS } from '../data/materials'
import { isMembershipActive } from './progression'

export const LOG_LIMIT = 80

export function addLog(state: GameState, text: string, kind: GameState['log'][number]['kind'] = 'system'): void {
  state.logSeq += 1
  state.log.push({ id: state.logSeq, t: Date.now(), text, kind })
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT)
}

export function addFloater(
  state: GameState,
  text: string,
  kind: GameState['combat']['floaters'][number]['kind'],
  side: GameState['combat']['floaters'][number]['side'],
  drift = 0,
): void {
  const c = state.combat
  c.floaterSeq += 1
  c.floaters.push({ id: c.floaterSeq, text, kind, side, t: c.time, drift })
  if (c.floaters.length > 30) c.floaters.shift()
}

export function grantGold(state: GameState, amount: number): void {
  const value = Math.max(0, Math.round(amount))
  state.player.gold += value
  state.statistics.goldEarned += value
}

export function grantMaterials(state: GameState, materials: Partial<Record<MaterialId, number>>): void {
  for (const [id, amount] of Object.entries(materials)) {
    if (!amount) continue
    state.materials[id as MaterialId] = (state.materials[id as MaterialId] ?? 0) + amount
  }
}

export function hasMaterials(state: GameState, materials: Partial<Record<MaterialId, number>>): boolean {
  return Object.entries(materials).every(([id, amount]) => (state.materials[id as MaterialId] ?? 0) >= (amount ?? 0))
}

export function spendMaterials(state: GameState, materials: Partial<Record<MaterialId, number>>): boolean {
  if (!hasMaterials(state, materials)) return false
  for (const [id, amount] of Object.entries(materials)) {
    state.materials[id as MaterialId] -= amount ?? 0
  }
  return true
}

/**
 * Add an item to the inventory. Handles auto-sell and full bags by
 * converting overflow into gold instead of silently deleting loot.
 */
export function addItemToInventory(state: GameState, item: Item, silent = false): boolean {
  const autoLoot = state.progress.autoLoot || isMembershipActive(state)
  if (!autoLoot && state.pendingLoot.length < 40) {
    state.pendingLoot.push({ id: item.uid, item, gold: 0, materials: {}, label: item.name })
    if (!silent) addLog(state, `Loot waiting: ${item.name}`, 'loot')
    return true
  }
  return addItemDirect(state, item, silent)
}

export function addItemDirect(state: GameState, item: Item, silent = false): boolean {
  state.statistics.itemsFound += 1
  if (state.progress.autoSellCommon && item.rarity === 'common') {
    const price = sellPrice(item)
    grantGold(state, price)
    if (!silent) addLog(state, `Auto-sold ${item.name} for ${price.toLocaleString()} gold.`, 'loot')
    return true
  }
  if (state.inventory.length >= 150) {
    const price = sellPrice(item)
    grantGold(state, price)
    addLog(state, `Bags full — ${item.name} converted to ${price.toLocaleString()} gold.`, 'loot')
    return false
  }
  state.inventory.push(item)
  if (!silent) addLog(state, `Found ${item.name}!`, 'loot')
  return true
}

export function collectPendingLoot(state: GameState): number {
  const pending = state.pendingLoot
  state.pendingLoot = []
  let count = 0
  for (const entry of pending) {
    if (entry.item) addItemDirect(state, entry.item)
    grantGold(state, entry.gold)
    grantMaterials(state, entry.materials)
    count++
  }
  if (count) addLog(state, `Collected ${count} pending loot drops.`, 'loot')
  return count
}

export function dropLoot(state: GameState, enemy: MonsterInstance, rng: Rng, source: 'normal' | 'boss' | 'dungeon'): void {
  const now = Date.now()
  const lootBoost = state.shop.lootBoostUntil > now ? 2 : 1
  const itemChance =
    (enemy.tier === 'boss' || source === 'dungeon'
      ? 1
      : enemy.tier === 'stone'
        ? 0.8
        : enemy.elite
          ? 0.42
          : 0.17) * lootBoost
  const itemSource = source === 'normal' ? (enemy.elite ? 'elite' : 'normal') : source

  if (rng.chance(Math.min(1, itemChance))) {
    const item = generateItem(rng, {
      level: enemy.level,
      source: itemSource,
      classId: state.player.classId,
    })
    addItemToInventory(state, item)
  }

  const stoneChance = (enemy.tier === 'stone' ? 1 : enemy.isBoss ? 0.35 : 0.018) * lootBoost
  if (rng.chance(stoneChance)) {
    const stone = generateStone(rng, enemy.level, {
      gradeFloor: enemy.isBoss ? 2 : 1,
      rarityBoost: enemy.isBoss ? 1 : 0,
    })
    state.stones.inventory.push(stone)
    addLog(state, `A ${stone.name} clatters to the ground.`, 'loot')
    grantMaterials(state, { stone_dust: 2 + stone.grade * 2 })
  }

  const rareMult = enemy.isBoss ? 3 : enemy.elite ? 1.6 : 1
  const materialDrops: Partial<Record<MaterialId, number>> = {}
  const roll = (chance: number, id: MaterialId, amount = 1) => {
    if (rng.chance(chance * rareMult * lootBoost)) {
      materialDrops[id] = (materialDrops[id] ?? 0) + amount
    }
  }
  roll(0.13, 'weapon_stone', enemy.isBoss ? 3 : 1)
  roll(0.13, 'armor_stone', enemy.isBoss ? 3 : 1)
  roll(0.012, 'protection_scroll')
  roll(0.025, 'mystic_rune')
  roll(0.02, 'chaos_crystal')
  roll(0.03, 'refinement_powder')
  roll(0.025, 'pet_essence')
  roll(0.02, 'mount_essence')
  if (enemy.tier === 'stone') {
    materialDrops.stone_dust = (materialDrops.stone_dust ?? 0) + 6 + enemy.level
  }
  grantMaterials(state, materialDrops)
  const materialText = Object.entries(materialDrops)
    .filter(([, v]) => v)
    .map(([id, v]) => `${v}× ${MATERIALS[id as MaterialId]?.name ?? id}`)
    .join(', ')
  if (materialText) addLog(state, `Salvaged ${materialText}.`, 'loot')
}
