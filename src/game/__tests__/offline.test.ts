import { describe, expect, it } from 'vitest'
import { createNewGame } from '../state/initial'
import { createRng } from '../rng'
import { OFFLINE_CAP_SECONDS, formatDuration, simulateOffline } from '../engine/offline'
import { xpToNext } from '../engine/progression'

describe('offline progression', () => {
  it('ignores absences shorter than a minute', () => {
    const state = createNewGame('warrior', 'Tester')
    expect(simulateOffline(state, 5, createRng(1))).toBeNull()
    expect(simulateOffline(state, 59, createRng(1))).toBeNull()
  })

  it('brings back gold, XP, kills and loot for an hour away', () => {
    const state = createNewGame('warrior', 'Tester')
    const summary = simulateOffline(state, 3600, createRng(2))
    expect(summary).not.toBeNull()
    expect(summary!.seconds).toBe(3600)
    expect(summary!.kills).toBeGreaterThan(0)
    expect(summary!.gold).toBeGreaterThan(0)
    expect(summary!.xp).toBeGreaterThan(0)
    expect(state.player.gold).toBeGreaterThan(750)
    expect(state.player.level).toBeGreaterThan(1)
    expect(state.statistics.kills).toBeGreaterThan(0)
    expect(summary!.items.length).toBeGreaterThanOrEqual(0)
    expect(summary!.items.length).toBeLessThanOrEqual(24)
  })

  it('caps offline rewards at twelve hours', () => {
    const state = createNewGame('warrior', 'Tester')
    const summary = simulateOffline(state, 60 * 60 * 48, createRng(3))
    expect(summary).not.toBeNull()
    expect(summary!.seconds).toBe(OFFLINE_CAP_SECONDS)
    expect(OFFLINE_CAP_SECONDS).toBe(12 * 60 * 60)
  })

  it('never overfills the inventory with offline loot', () => {
    const state = createNewGame('archer', 'Tester')
    state.inventory = Array.from({ length: 150 }, (_, i) => ({
      ...state.equipment.weapon!,
      uid: `filler_${i}`,
    }))
    const summary = simulateOffline(state, OFFLINE_CAP_SECONDS, createRng(4))
    expect(summary).not.toBeNull()
    expect(state.inventory).toHaveLength(150)
    expect(summary!.items).toHaveLength(0)
  })

  it('can level the hero several times during a long absence', () => {
    const state = createNewGame('warrior', 'Tester')
    const summary = simulateOffline(state, OFFLINE_CAP_SECONDS, createRng(5))
    expect(summary).not.toBeNull()
    expect(summary!.levels).toBeGreaterThanOrEqual(2)
    expect(xpToNext(state.player.level)).toBeGreaterThan(0)
  })

  it('formats durations for the welcome-back panel', () => {
    expect(formatDuration(0)).toContain('0')
    expect(formatDuration(3661)).toMatch(/1h/)
    expect(formatDuration(86400)).toMatch(/24h/)
  })
})
