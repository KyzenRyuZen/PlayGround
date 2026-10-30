import { beforeEach, describe, expect, it } from 'vitest'
import { createNewGame, SAVE_VERSION } from '../state/initial'
import { clearSave, exportSave, importSave, loadGame, saveGame } from '../state/persistence'
import { installMemoryStorage } from './helpers'

const SAVE_KEY = 'aetherfall.save.v1'

describe('persistence', () => {
  beforeEach(() => {
    installMemoryStorage()
  })

  it('round-trips a saved game', () => {
    const state = createNewGame('archer', 'Sylva')
    state.player.gold = 4321
    state.inventory.push({
      ...state.equipment.weapon!,
      uid: 'it_test_1',
      name: 'Test Blade',
    })
    saveGame(state)

    const loaded = loadGame()
    expect(loaded).not.toBeNull()
    expect(loaded!.player.classId).toBe('archer')
    expect(loaded!.player.name).toBe('Sylva')
    expect(loaded!.player.gold).toBe(4321)
    expect(loaded!.inventory).toHaveLength(1)
    expect(loaded!.inventory[0]!.name).toBe('Test Blade')
  })

  it('never restores mid-combat state', () => {
    const state = createNewGame('warrior', 'Tester')
    state.combat.enemy = {
      defId: 'wolf',
      name: 'Test Wolf',
      family: 'wolf',
      element: 'physical',
      tier: 'normal',
      level: 1,
      hp: 5,
      maxHp: 5,
      attack: 1,
      defense: 1,
      xp: 1,
      gold: 1,
      isBoss: false,
      elite: false,
    }
    state.combat.mode = 'dungeon'
    state.combat.buffs = [{ id: 'x', name: 'X', expiresAt: 999 }]
    state.combat.dungeonId = 'crypt'
    saveGame(state)

    const loaded = loadGame()!
    expect(loaded.combat.enemy).toBeNull()
    expect(loaded.combat.mode).toBe('stage')
    expect(loaded.combat.buffs).toEqual([])
    expect(loaded.combat.dungeonId).toBeNull()
    expect(loaded.lastDungeonResult).toBeNull()
  })

  it('fills in new fields from defaults while keeping saved progress', () => {
    const state = createNewGame('mage', 'Tester')
    state.player.level = 12
    state.player.gold = 9000
    const raw = JSON.parse(JSON.stringify(state))
    delete raw.settings
    delete raw.statistics.fusions
    localStorage.setItem(SAVE_KEY, JSON.stringify(raw))

    const loaded = loadGame()!
    expect(loaded.player.level).toBe(12)
    expect(loaded.player.gold).toBe(9000)
    expect(loaded.settings).toEqual({ reducedMotion: false, sound: true })
    expect(loaded.statistics.fusions).toBe(0)
  })

  it('rejects saves from an incompatible version', () => {
    const state = createNewGame('warrior', 'Tester')
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...state, version: SAVE_VERSION + 1 }))
    expect(loadGame()).toBeNull()
  })

  it('rejects malformed saves without throwing', () => {
    localStorage.setItem(SAVE_KEY, '{not json')
    expect(loadGame()).toBeNull()
    localStorage.setItem(SAVE_KEY, JSON.stringify({ player: { classId: 'bard' } }))
    expect(loadGame()).toBeNull()
  })

  it('exports and imports a checksum-free base64 save', () => {
    const state = createNewGame('warrior', 'Tester')
    state.player.gold = 1234
    state.progress.highestStage = 9
    const code = exportSave(state)
    expect(typeof code).toBe('string')
    expect(code.length).toBeGreaterThan(20)

    const imported = importSave(code)
    expect(imported).not.toBeNull()
    expect(imported!.player.gold).toBe(1234)
    expect(imported!.progress.highestStage).toBe(9)
    expect(importSave('not-base64%%%')).toBeNull()
  })

  it('clears the save on request', () => {
    saveGame(createNewGame('warrior', 'Tester'))
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull()
    clearSave()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })
})
