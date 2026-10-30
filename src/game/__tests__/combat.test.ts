import { describe, expect, it } from 'vitest'
import { createNewGame } from '../state/initial'
import { createRng } from '../rng'
import {
  createDungeonBoss,
  createStageMonster,
  finishDungeon,
  selectStage,
  startDungeon,
  tickCombat,
} from '../engine/combat'
import { DUNGEONS } from '../data/dungeons'
import { getPlayerStats } from '../engine/stats'

describe('combat', () => {
  it('spawns regional monsters with scaled stats', () => {
    const state = createNewGame('warrior', 'Tester')
    const early = createStageMonster(1, state, createRng(1))
    const later = createStageMonster(30, state, createRng(1))
    expect(early.level).toBe(1)
    expect(later.level).toBeGreaterThan(early.level)
    expect(later.maxHp).toBeGreaterThan(early.maxHp)
    expect(later.attack).toBeGreaterThan(early.attack)
  })

  it('spawns a guardian on every eighth stage', () => {
    const state = createNewGame('warrior', 'Tester')
    expect(createStageMonster(8, state, createRng(1)).isBoss).toBe(true)
    expect(createStageMonster(16, state, createRng(1)).isBoss).toBe(true)
    expect(createStageMonster(7, state, createRng(1)).isBoss).toBe(false)
  })

  it('fights, kills and respawns enemies over time', () => {
    const state = createNewGame('warrior', 'Tester')
    state.player.hp = getPlayerStats(state).maxHp
    const rng = createRng(99)
    // 60 seconds at 10 ticks/second.
    for (let i = 0; i < 600; i++) tickCombat(state, 0.1, rng)
    expect(state.statistics.kills).toBeGreaterThan(0)
    expect(state.dailies.kills).toBeGreaterThan(0)
    expect(state.combat.time).toBeCloseTo(60, 1)
    expect(state.player.hp).toBeGreaterThan(0)
    expect(state.player.hp).toBeLessThanOrEqual(getPlayerStats(state).maxHp)
    expect(state.log.some((entry) => entry.text.length > 0)).toBe(true)
  })

  it('only lets the player farm unlocked stages', () => {
    const state = createNewGame('warrior', 'Tester')
    const rng = createRng(3)
    expect(selectStage(state, 5, rng)).toBe(false)
    state.progress.highestStage = 5
    expect(selectStage(state, 5, rng)).toBe(true)
    expect(state.progress.farmStage).toBe(5)
    expect(state.combat.enemy).not.toBeNull()
  })

  it('enforces dungeon level and daily attempt requirements', () => {
    const state = createNewGame('warrior', 'Tester')
    const rng = createRng(2)
    const dungeon = DUNGEONS[0]!
    expect(startDungeon(state, dungeon.id, rng).ok).toBe(false)

    state.player.level = dungeon.requiredLevel
    for (let i = 0; i < dungeon.attempts; i++) {
      expect(startDungeon(state, dungeon.id, rng).ok).toBe(true)
    }
    expect(startDungeon(state, dungeon.id, rng).ok).toBe(false)
    expect(state.dungeons.used[dungeon.id]).toBe(dungeon.attempts)
  })

  it('creates a tougher dungeon boss than the field monsters', () => {
    const state = createNewGame('warrior', 'Tester')
    const dungeon = DUNGEONS[0]!
    const boss = createDungeonBoss(dungeon)
    const field = createStageMonster(dungeon.requiredLevel, state, createRng(1))
    expect(boss.isBoss).toBe(true)
    expect(boss.level).toBe(dungeon.level)
    expect(boss.maxHp).toBeGreaterThan(field.maxHp)
  })

  it('grants gold, XP, materials and a rarity-floored item on dungeon victory', () => {
    const state = createNewGame('mage', 'Tester')
    state.player.level = 20
    const dungeon = DUNGEONS[0]!
    const rng = createRng(5)
    startDungeon(state, dungeon.id, rng)
    const gold = state.player.gold
    const xp = state.player.xp
    finishDungeon(state, dungeon, rng, true)

    expect(state.player.gold).toBeGreaterThan(gold)
    expect(state.player.xp).toBeGreaterThan(xp)
    expect(state.lastDungeonResult?.victory).toBe(true)
    expect(state.lastDungeonResult?.item).not.toBeNull()
    expect(state.inventory).toHaveLength(1)
    expect(state.statistics.dungeonsCleared).toBe(1)
    expect(state.materials.weapon_stone).toBeGreaterThan(0)
    expect(state.combat.mode).toBe('stage')
    expect(state.combat.enemy).not.toBeNull()
  })

  it('records a failed dungeon without rewards', () => {
    const state = createNewGame('warrior', 'Tester')
    const dungeon = DUNGEONS[0]!
    state.player.level = 10
    const rng = createRng(6)
    startDungeon(state, dungeon.id, rng)
    const gold = state.player.gold
    finishDungeon(state, dungeon, rng, false)
    expect(state.player.gold).toBe(gold)
    expect(state.lastDungeonResult?.victory).toBe(false)
    expect(state.inventory).toHaveLength(0)
  })
})
