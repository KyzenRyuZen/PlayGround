import { describe, expect, it } from 'vitest'
import { createNewGame } from '../state/initial'
import { createRng } from '../rng'
import {
  allocatePoint,
  ensureDailyReset,
  goldMultiplier,
  grantXp,
  isMembershipActive,
  lootMultiplier,
  totalXpForLevel,
  trackDaily,
  xpMultiplier,
  xpToNext,
} from '../engine/progression'
import { todayKey } from '../data/dailies'

describe('progression', () => {
  it('requires more XP for each level', () => {
    for (let level = 1; level < 100; level++) {
      expect(xpToNext(level + 1)).toBeGreaterThan(xpToNext(level))
    }
    expect(totalXpForLevel(1)).toBe(0)
    expect(totalXpForLevel(3)).toBe(xpToNext(1) + xpToNext(2))
  })

  it('resolves multiple level-ups from a single large XP grant', () => {
    const state = createNewGame('warrior', 'Tester')
    const result = grantXp(state, xpToNext(1) + xpToNext(2) + 5)
    expect(result.levels).toBe(2)
    expect(state.player.level).toBe(3)
    expect(state.player.xp).toBe(5)
    expect(state.player.skillPoints).toBe(2)
    // autoAssign is on by default, so no free points accumulate
    expect(state.player.freePoints).toBe(0)
    expect(state.player.attributes.strength + state.player.attributes.vitality).toBeGreaterThan(0)
  })

  it('banks free points when auto-assign is disabled', () => {
    const state = createNewGame('mage', 'Tester')
    state.player.autoAssign = false
    grantXp(state, xpToNext(1) + 1)
    expect(state.player.freePoints).toBe(5)
    expect(state.player.attributes.intelligence).toBe(0)
    expect(allocatePoint(state, 'intelligence')).toBe(true)
    expect(state.player.attributes.intelligence).toBe(1)
    expect(state.player.freePoints).toBe(4)
  })

  it('stops at level 100 and keeps excess XP', () => {
    const state = createNewGame('archer', 'Tester')
    state.player.level = 100
    const before = state.player.xp
    grantXp(state, 5000)
    expect(state.player.level).toBe(100)
    expect(state.player.xp).toBe(before + 5000)
  })

  it('applies membership and booster multipliers', () => {
    const state = createNewGame('warrior', 'Tester')
    const now = Date.now()
    expect(isMembershipActive(state, now)).toBe(false)
    const baseXp = xpMultiplier(state, now)
    const baseGold = goldMultiplier(state, now)
    // The starter pet already grants a small XP bonus.
    expect(baseXp).toBeGreaterThanOrEqual(1)
    state.shop.membershipUntil = now + 60_000
    state.shop.xpBoostUntil = now + 60_000
    state.shop.lootBoostUntil = now + 60_000
    expect(isMembershipActive(state, now)).toBe(true)
    expect(xpMultiplier(state, now)).toBeCloseTo(baseXp * 2 * 1.15)
    expect(goldMultiplier(state, now)).toBeCloseTo(baseGold * 1.15)
    expect(lootMultiplier(state, now)).toBe(2)
    expect(xpMultiplier(state, now + 120_000)).toBe(baseXp)
  })

  it('resets daily counters on a new day', () => {
    const state = createNewGame('warrior', 'Tester')
    state.dailies.day = '1999-01-01'
    state.dailies.kills = 99
    state.dailies.claimed = ['kills_50']
    state.dungeons.day = '1999-01-01'
    state.dungeons.used = { crypt: 2 }
    ensureDailyReset(state)
    expect(state.dailies.day).toBe(todayKey())
    expect(state.dailies.kills).toBe(0)
    expect(state.dailies.claimed).toEqual([])
    expect(state.dungeons.used).toEqual({})
    trackDaily(state, 'kills', 2)
    expect(state.dailies.kills).toBe(2)
  })

  it('rolls XP into the next level rather than losing it', () => {
    const state = createNewGame('warrior', 'Tester')
    const need = xpToNext(1)
    grantXp(state, need - 1)
    expect(state.player.level).toBe(1)
    const source = createRng(1)
    expect(source.next()).toBeGreaterThanOrEqual(0)
    grantXp(state, 2)
    expect(state.player.level).toBe(2)
    expect(state.player.xp).toBe(1)
  })
})
