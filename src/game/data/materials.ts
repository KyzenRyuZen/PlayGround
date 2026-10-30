import type { Affix, MaterialDef, MaterialId, StatKey, StoneType } from '../types'

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  weapon_stone: {
    id: 'weapon_stone',
    name: 'Emberstone',
    description: 'A warm shard used to whet weapons at the Blacksmith.',
    color: '#e2703a',
    glyph: 'weapon',
  },
  armor_stone: {
    id: 'armor_stone',
    name: 'Wardstone',
    description: 'A dense blue shard used to reinforce armour and shields.',
    color: '#5d9bd6',
    glyph: 'armor',
  },
  protection_scroll: {
    id: 'protection_scroll',
    name: 'Ward Scroll',
    description: 'Prevents an item from being destroyed when an upgrade fails.',
    color: '#e6cf8b',
    glyph: 'scroll',
  },
  mystic_rune: {
    id: 'mystic_rune',
    name: 'Mystic Rune',
    description: 'Carves an additional random bonus onto a piece of equipment.',
    color: '#8f7bff',
    glyph: 'rune',
  },
  chaos_crystal: {
    id: 'chaos_crystal',
    name: 'Chaos Crystal',
    description: 'Unstable crystallised possibility. Rerolls every bonus on an item.',
    color: '#ff5d9e',
    glyph: 'crystal',
  },
  refinement_powder: {
    id: 'refinement_powder',
    name: 'Refinement Powder',
    description: 'Empowers one random bonus on a piece of equipment.',
    color: '#7ad6a6',
    glyph: 'powder',
  },
  stone_dust: {
    id: 'stone_dust',
    name: 'Runestone Dust',
    description: 'Ground runestone used to level magical stones.',
    color: '#c9a84c',
    glyph: 'dust',
  },
  pet_essence: {
    id: 'pet_essence',
    name: 'Beast Essence',
    description: 'Warm life-force used to level pets.',
    color: '#7fd8c3',
    glyph: 'essence',
  },
  mount_essence: {
    id: 'mount_essence',
    name: 'Tether Essence',
    description: 'Bonded energy used to level mounts.',
    color: '#d2a86a',
    glyph: 'essence',
  },
}

export const MATERIAL_LIST = Object.values(MATERIALS)

// ─────────────────────────────────────────────────────────────────────────────
// Magical stones
// ─────────────────────────────────────────────────────────────────────────────

export interface StoneAffixDef {
  stat: StatKey
  min: number
  max: number
  perLevel: number
  unit: 'flat' | 'percent'
}

export interface StoneTypeDef extends StoneType {
  pool: StoneAffixDef[]
}

export const STONE_TYPES: StoneTypeDef[] = [
  {
    id: 'ruby',
    name: 'Ruby',
    color: '#ff5c6a',
    glow: 'rgba(255,92,106,.5)',
    description: 'Blood-red stones that sharpen aggression.',
    pool: [
      { stat: 'attack', min: 3, max: 7, perLevel: 1.4, unit: 'flat' },
      { stat: 'attackPct', min: 1, max: 2.5, perLevel: 0.12, unit: 'percent' },
      { stat: 'critDamage', min: 2, max: 5, perLevel: 0.25, unit: 'percent' },
    ],
  },
  {
    id: 'sapphire',
    name: 'Sapphire',
    color: '#5b9dff',
    glow: 'rgba(91,157,255,.5)',
    description: 'Deep-sea stones that reward precision and insight.',
    pool: [
      { stat: 'intelligence', min: 1, max: 3, perLevel: 0.1, unit: 'flat' },
      { stat: 'mp', min: 8, max: 16, perLevel: 1.5, unit: 'flat' },
      { stat: 'critChance', min: 1, max: 2.5, perLevel: 0.08, unit: 'percent' },
    ],
  },
  {
    id: 'emerald',
    name: 'Emerald',
    color: '#4fd6a0',
    glow: 'rgba(79,214,160,.5)',
    description: 'Living stones that knit wounds and harden skin.',
    pool: [
      { stat: 'hp', min: 15, max: 30, perLevel: 5, unit: 'flat' },
      { stat: 'defense', min: 3, max: 6, perLevel: 1, unit: 'flat' },
      { stat: 'hpPct', min: 1, max: 2, perLevel: 0.1, unit: 'percent' },
    ],
  },
  {
    id: 'topaz',
    name: 'Topaz',
    color: '#ffcf5c',
    glow: 'rgba(255,207,92,.5)',
    description: 'Storm-charged stones that quicken the hand.',
    pool: [
      { stat: 'attackSpeed', min: 1.5, max: 3, perLevel: 0.08, unit: 'percent' },
      { stat: 'penetration', min: 1.5, max: 3, perLevel: 0.08, unit: 'percent' },
      { stat: 'dexterity', min: 1, max: 3, perLevel: 0.1, unit: 'flat' },
    ],
  },
  {
    id: 'onyx',
    name: 'Onyx',
    color: '#b487ff',
    glow: 'rgba(180,135,255,.5)',
    description: 'Void-dark stones that hunger for bosses.',
    pool: [
      { stat: 'bossDamage', min: 2, max: 5, perLevel: 0.18, unit: 'percent' },
      { stat: 'monsterDamage', min: 2, max: 5, perLevel: 0.18, unit: 'percent' },
      { stat: 'lifesteal', min: 0.5, max: 1.5, perLevel: 0.04, unit: 'percent' },
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    color: '#b9f2ff',
    glow: 'rgba(185,242,255,.55)',
    description: 'A clear stone that turns aside the elements.',
    pool: [
      { stat: 'fireResist', min: 3, max: 6, perLevel: 0.2, unit: 'percent' },
      { stat: 'iceResist', min: 3, max: 6, perLevel: 0.2, unit: 'percent' },
      { stat: 'shadowResist', min: 3, max: 6, perLevel: 0.2, unit: 'percent' },
      { stat: 'holyResist', min: 3, max: 6, perLevel: 0.2, unit: 'percent' },
      { stat: 'voidResist', min: 3, max: 6, perLevel: 0.2, unit: 'percent' },
      { stat: 'natureResist', min: 3, max: 6, perLevel: 0.2, unit: 'percent' },
    ],
  },
]

export const stoneTypeById = (id: string) => STONE_TYPES.find((s) => s.id === id) ?? STONE_TYPES[0]!

export const STONE_GRADE_MULT = [0, 1, 1.25, 1.55, 1.9, 2.4]
export const STONE_GRADE_NAME = ['', 'Chipped', 'Polished', 'Flawless', 'Radiant', 'Sovereign']
export const STONE_MAX_LEVEL = 12
export const STONE_SLOTS = 3

export function stoneUpgradeCost(level: number): { dust: number; gold: number } {
  return { dust: 6 + level * 4, gold: 250 + level * level * 40 }
}

export function stonePower(stone: { grade: number; level: number; affixes: Affix[] }): number {
  return Math.round(stone.grade * 100 + stone.level * 12 + stone.affixes.reduce((s, a) => s + a.value * 2, 0))
}
