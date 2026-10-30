import type { Affix, GameState, MaterialId, Rarity, Stone } from '../types'
import { STONE_GRADE_MULT, STONE_GRADE_NAME, STONE_MAX_LEVEL, STONE_TYPES } from '../data/materials'
import { RARITY, RARITY_ORDER } from '../data/classes'
import type { Rng } from '../rng'

export function generateStone(
  rng: Rng,
  level: number,
  opts: { typeId?: string; gradeFloor?: number; rarityBoost?: number } = {},
): Stone {
  const type = opts.typeId
    ? STONE_TYPES.find((t) => t.id === opts.typeId)!
    : rng.pick(STONE_TYPES)
  const gradeRoll = rng.weighted([
    { value: 1, weight: 46 },
    { value: 2, weight: 27 },
    { value: 3, weight: 15 },
    { value: 4, weight: 8 },
    { value: 5, weight: 4 },
  ])
  const grade = Math.min(5, Math.max(opts.gradeFloor ?? 0, gradeRoll + (opts.rarityBoost ?? 0)))
  const count = grade >= 4 ? 2 : 1
  const pool = [...type.pool]
  const affixes: Affix[] = []
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(rng.next() * pool.length)
    const def = pool.splice(idx, 1)[0]!
    const raw = (rng.float(def.min, def.max) + def.perLevel * level) * STONE_GRADE_MULT[grade]
    affixes.push({
      id: `sa_${def.stat}_${Math.floor(rng.next() * 1e9).toString(36)}`,
      stat: def.stat,
      value: def.unit === 'flat' ? Math.max(1, Math.round(raw)) : Math.max(0.1, +raw.toFixed(1)),
      quality: 1,
    })
  }
  return {
    uid: `st_${Date.now().toString(36)}_${Math.floor(rng.next() * 1e9).toString(36)}`,
    typeId: type.id,
    grade,
    level: Math.min(STONE_MAX_LEVEL, Math.max(1, level)),
    affixes,
    name: `${STONE_GRADE_NAME[grade]} ${type.name} Stone`,
  }
}

export function levelUpStone(stone: Stone): Stone {
  if (stone.level >= STONE_MAX_LEVEL) return stone
  stone.level += 1
  stone.affixes = stone.affixes.map((a) => ({ ...a, value: +(a.value * 1.075).toFixed(1) }))
  stone.name = `${STONE_GRADE_NAME[stone.grade]} ${STONE_TYPES.find((t) => t.id === stone.typeId)!.name} Stone`
  return stone
}

export function stoneRarity(grade: number): Rarity {
  return RARITY_ORDER[Math.min(5, Math.max(0, grade - 1))] ?? 'common'
}

export function stoneGradeLabel(grade: number): string {
  return STONE_GRADE_NAME[grade] ?? 'Chipped'
}

export function stoneUpgrade(level: number): { dust: number; gold: number } {
  return { dust: 6 + level * 4, gold: 250 + level * level * 40 }
}

export function stoneValue(stone: Stone): number {
  return Math.round((80 + stone.level * 20) * stone.grade * RARITY[stoneRarity(stone.grade)].mult)
}

export function dustReward(grade: number): number {
  return 2 + grade * 2
}

export function materialName(id: MaterialId): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
