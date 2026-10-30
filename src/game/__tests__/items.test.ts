import { describe, expect, it } from 'vitest'
import { createRng } from '../rng'
import { RARITY_ORDER } from '../data/classes'
import {
  affixCap,
  fuseCost,
  fuseItems,
  generateItem,
  regenerateAffixes,
  resolveUpgrade,
  rollRarity,
  sellPrice,
  upgradeChance,
} from '../engine/items'
import { scriptedRng } from './helpers'

describe('item generation', () => {
  it('always rolls above the requested rarity floor', () => {
    const rng = createRng(7)
    for (let i = 0; i < 200; i++) {
      const rarity = rollRarity(rng, 'normal', 0, 'epic')
      expect(RARITY_ORDER.indexOf(rarity)).toBeGreaterThanOrEqual(RARITY_ORDER.indexOf('epic'))
    }
  })

  it('generates the expected number of distinct affixes for each rarity', () => {
    const rng = createRng(11)
    for (const rarity of RARITY_ORDER) {
      const item = generateItem(rng, { level: 20, rarity, baseId: 'ashen_longsword' })
      const stats = item.affixes.map((a) => a.stat)
      expect(item.affixes.length).toBeGreaterThanOrEqual(1)
      expect(new Set(stats).size).toBe(stats.length)
    }
  })

  it('uses a comma suffix when the base name already contains "of"', () => {
    const rng = createRng(3)
    for (let i = 0; i < 100; i++) {
      const item = generateItem(rng, { level: 30, rarity: 'legendary', baseId: 'bulwark_of_tides' })
      expect(item.name).not.toMatch(/ of .* of /)
      expect(item.name.startsWith('Dread Bulwark of Tides')).toBe(true)
    }
  })

  it('scales item level with base tier', () => {
    const rng = createRng(5)
    const tier1 = generateItem(rng, { level: 10, rarity: 'rare', baseId: 'oakguard_buckler' })
    const tier3 = generateItem(rng, { level: 10, rarity: 'rare', baseId: 'aegis_of_dawn' })
    expect(tier3.level).toBeGreaterThan(tier1.level)
  })
})

describe('fusion', () => {
  it('requires exactly four items', () => {
    const rng = createRng(1)
    const one = generateItem(rng, { level: 10, rarity: 'rare', baseId: 'ashen_longsword' })
    expect(() => fuseItems(rng, [one])).toThrow(/exactly 4/i)
  })

  it('fuses four identical rare items into one epic item of the same base', () => {
    const rng = createRng(42)
    const items = Array.from({ length: 4 }, () =>
      generateItem(rng, { level: 25, rarity: 'rare', baseId: 'ashen_longsword' }),
    )
    const fused = fuseItems(rng, items)
    expect(fused.rarity).toBe('epic')
    expect(fused.baseId).toBe('ashen_longsword')
    expect(fused.affixes.length).toBeGreaterThan(items[0]!.affixes.length)
    expect(fused.level).toBeGreaterThanOrEqual(25)
  })

  it('rejects mismatched bases or rarities', () => {
    const rng = createRng(9)
    const same = Array.from({ length: 3 }, () =>
      generateItem(rng, { level: 5, rarity: 'rare', baseId: 'ashen_longsword' }),
    )
    const other = generateItem(rng, { level: 5, rarity: 'rare', baseId: 'oakguard_buckler' })
    expect(() => fuseItems(rng, [...same, other])).toThrow(/same base/i)

    const legendary = generateItem(rng, { level: 5, rarity: 'legendary', baseId: 'ashen_longsword' })
    expect(() => fuseItems(rng, [...same, legendary])).toThrow(/same base/i)
  })

  it('refuses to fuse divine items', () => {
    const rng = createRng(4)
    const items = Array.from({ length: 4 }, () =>
      generateItem(rng, { level: 40, rarity: 'divine', baseId: 'ashen_longsword' }),
    )
    expect(() => fuseItems(rng, items)).toThrow(/divine/i)
  })

  it('charges more to fuse rarer items', () => {
    const rng = createRng(8)
    const rare = generateItem(rng, { level: 20, rarity: 'rare', baseId: 'ashen_longsword' })
    const epic = generateItem(rng, { level: 20, rarity: 'epic', baseId: 'ashen_longsword' })
    expect(fuseCost([epic])).toBeGreaterThan(fuseCost([rare]))
  })
})

describe('upgrading', () => {
  it('has decreasing success chances from +0 to +14', () => {
    for (let plus = 1; plus < 15; plus++) {
      expect(upgradeChance(plus)).toBeLessThanOrEqual(upgradeChance(plus - 1))
    }
    expect(upgradeChance(0)).toBe(1)
  })

  it('raises the plus level on success', () => {
    const item = generateItem(createRng(2), { level: 10, rarity: 'epic', baseId: 'ashen_longsword' })
    const outcome = resolveUpgrade(item, scriptedRng(1, [true]), false)
    expect(outcome).toEqual({ success: true, destroyed: false, downgraded: false, nextPlus: 1 })
  })

  it('never destroys a protected item at +10 or above', () => {
    const item = generateItem(createRng(2), { level: 10, rarity: 'epic', baseId: 'ashen_longsword' })
    item.plus = 12
    // fail the upgrade, then fail the 10% destruction roll and the 32% downgrade roll
    const outcome = resolveUpgrade(item, scriptedRng(1, [false, false, false]), true)
    expect(outcome.destroyed).toBe(false)
    expect(outcome.success).toBe(false)
    expect(outcome.nextPlus).toBe(12)
  })

  it('can destroy an unprotected high upgrade on a bad failure', () => {
    const item = generateItem(createRng(2), { level: 10, rarity: 'epic', baseId: 'ashen_longsword' })
    item.plus = 11
    const outcome = resolveUpgrade(item, scriptedRng(1, [false, true]), false)
    expect(outcome.destroyed).toBe(true)
  })

  it('cannot upgrade beyond +15', () => {
    const item = generateItem(createRng(2), { level: 10, rarity: 'epic', baseId: 'ashen_longsword' })
    item.plus = 15
    const outcome = resolveUpgrade(item, createRng(1), false)
    expect(outcome.success).toBe(false)
    expect(outcome.nextPlus).toBe(15)
  })
})

describe('affix operations', () => {
  it('allows one extra affix above the rarity roll', () => {
    const rng = createRng(13)
    const item = generateItem(rng, { level: 10, rarity: 'rare', baseId: 'ashen_longsword' })
    expect(affixCap(item)).toBe(3)
    expect(item.affixes.length).toBe(2)
    regenerateAffixes(rng, item)
    expect(item.affixes.length).toBe(2)
  })

  it('prices upgraded and rarer items higher when sold', () => {
    const rng = createRng(14)
    const item = generateItem(rng, { level: 20, rarity: 'legendary', baseId: 'ashen_longsword' })
    const before = sellPrice(item)
    item.plus = 10
    expect(sellPrice(item)).toBeGreaterThan(before)
  })
})
