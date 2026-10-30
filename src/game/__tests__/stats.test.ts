import { describe, expect, it } from 'vitest'
import { createNewGame } from '../state/initial'
import { createRng } from '../rng'
import { getPlayerStats } from '../engine/stats'
import { generateItem } from '../engine/items'
import { generateStone } from '../engine/stones'
import { xpMultiplier } from '../engine/progression'

describe('stat aggregation', () => {
  it('counts equipped items in the final stats', () => {
    const state = createNewGame('warrior', 'Tester')
    const withGear = getPlayerStats(state)
    state.equipment.weapon = null
    state.equipment.armor = null
    state.equipment.shoes = null
    const bare = getPlayerStats(state)
    expect(withGear.attack).toBeGreaterThan(bare.attack)
    expect(withGear.power).toBeGreaterThan(bare.power)
  })

  it('applies upgrade multipliers to item stats', () => {
    const state = createNewGame('warrior', 'Tester')
    const item = generateItem(createRng(1), { level: 20, rarity: 'epic', baseId: 'ashen_longsword' })
    state.equipment.weapon = item
    const before = getPlayerStats(state).attack
    item.plus = 10
    const after = getPlayerStats(state).attack
    expect(after).toBeGreaterThan(before)
  })

  it('adds socketed stones to the totals', () => {
    const state = createNewGame('warrior', 'Tester')
    const before = getPlayerStats(state)
    const stone = generateStone(createRng(22), 20, { typeId: 'ruby', gradeFloor: 3 })
    state.stones.equipped[0] = stone
    const after = getPlayerStats(state)
    expect(after.power).toBeGreaterThan(before.power)
  })

  it('applies active pet bonuses but ignores inactive pets', () => {
    const state = createNewGame('warrior', 'Tester')
    const active = getPlayerStats(state)
    state.companions.activePet = null
    const inactive = getPlayerStats(state)
    // The starter Ashling grants +4% XP rather than raw power.
    expect(active.xpBonus).toBeGreaterThan(inactive.xpBonus)
    expect(xpMultiplier(state)).toBe(1)
    state.companions.activePet = 'ashling'
    expect(xpMultiplier(state)).toBeCloseTo(1.04)
  })

  it('applies equipped costume bonuses', () => {
    const state = createNewGame('warrior', 'Tester')
    const before = getPlayerStats(state).goldFind
    state.costumes.owned.push('crimson_court')
    state.costumes.equipped.armor = 'crimson_court'
    const after = getPlayerStats(state).goldFind
    expect(after).toBeGreaterThan(before)
  })

  it('caps elemental resistance at 75%', () => {
    const state = createNewGame('warrior', 'Tester')
    state.stones.equipped[0] = {
      uid: 'st_test',
      typeId: 'ruby',
      grade: 5,
      level: 60,
      name: 'Flawless Ruby Stone',
      affixes: [{ id: 'af_fire', stat: 'fireResist', value: 400, quality: 1 }],
    }
    expect(getPlayerStats(state).resistances.fire).toBe(75)
  })

  it('keeps attack interval above the hard floor', () => {
    const state = createNewGame('archer', 'Tester')
    state.stones.equipped[0] = {
      uid: 'st_speed',
      typeId: 'topaz',
      grade: 5,
      level: 60,
      name: 'Flawless Topaz Stone',
      affixes: [{ id: 'af_speed', stat: 'attackSpeed', value: 500, quality: 1 }],
    }
    expect(getPlayerStats(state).attackInterval).toBeGreaterThanOrEqual(0.35)
  })
})
