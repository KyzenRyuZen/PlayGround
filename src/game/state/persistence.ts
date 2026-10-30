import type { GameState } from '../types'
import { createNewGame, SAVE_VERSION } from './initial'

const SAVE_KEY = 'aetherfall.save.v1'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Fill in any fields added by newer patches while keeping saved progress. */
function mergeDefaults<T>(base: T, saved: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(saved) ? saved : base) as T
  if (isPlainObject(base)) {
    if (!isPlainObject(saved)) return base
    const out: Record<string, unknown> = { ...base }
    for (const key of Object.keys(base)) {
      out[key] = mergeDefaults((base as Record<string, unknown>)[key], saved[key])
    }
    return out as T
  }
  return (saved === undefined || saved === null ? base : saved) as T
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<GameState>
    if (!parsed || typeof parsed !== 'object' || !parsed.player) return null
    if (!['warrior', 'mage', 'archer'].includes(parsed.player.classId)) return null
    if (parsed.version !== SAVE_VERSION) return null
    const base = createNewGame(parsed.player.classId, parsed.player.name)
    const merged = mergeDefaults(base, parsed)
    // Combat always restarts cleanly; never trust a serialized mid-swing state.
    merged.combat.enemy = null
    merged.combat.buffs = []
    merged.combat.floaters = []
    merged.combat.shield = 0
    merged.combat.mode = 'stage'
    merged.combat.dungeonId = null
    merged.combat.dungeonTimeLeft = 0
    merged.combat.respawnTimer = 0
    merged.combat.skillCds = {}
    merged.lastDungeonResult = null
    return merged
  } catch (error) {
    console.warn('[Aetherfall] Could not load save:', error)
    return null
  }
}

export function saveGame(state: GameState): void {
  try {
    state.lastActiveAt = Date.now()
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('[Aetherfall] Could not save game:', error)
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}

export function exportSave(state: GameState): string {
  const json = JSON.stringify(state)
  return btoa(encodeURIComponent(json))
}

export function importSave(code: string): GameState | null {
  try {
    const json = decodeURIComponent(atob(code.trim()))
    const parsed = JSON.parse(json) as GameState
    if (!parsed.player || !['warrior', 'mage', 'archer'].includes(parsed.player.classId)) return null
    const base = createNewGame(parsed.player.classId, parsed.player.name)
    const merged = mergeDefaults(base, parsed)
    merged.combat.enemy = null
    merged.combat.mode = 'stage'
    merged.combat.dungeonId = null
    merged.combat.floaters = []
    merged.combat.buffs = []
    return merged
  } catch {
    return null
  }
}
