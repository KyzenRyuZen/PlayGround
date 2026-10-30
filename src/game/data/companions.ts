import type { CompanionDef } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Pets & mounts. Bonuses are percent-based and scale with companion level.
// ─────────────────────────────────────────────────────────────────────────────

export const PETS: CompanionDef[] = [
  {
    id: 'ashling',
    name: 'Ashling',
    kind: 'pet',
    rarity: 'common',
    family: 'wolf',
    description: 'A soot-furred fox kit that hoards warm coals and warmer secrets.',
    bonuses: { xpBonus: 4 },
  },
  {
    id: 'gloomcat',
    name: 'Gloomcat',
    kind: 'pet',
    rarity: 'rare',
    family: 'wolf',
    description: 'It walks through shadows a half-step ahead of you.',
    bonuses: { critChance: 2.5, attackSpeed: 1 },
  },
  {
    id: 'stoneback',
    name: 'Stoneback',
    kind: 'pet',
    rarity: 'rare',
    family: 'golem',
    description: 'A palm-sized boulder with opinions. Loyal, heavy, immovable.',
    bonuses: { defensePct: 6, hpPct: 4 },
  },
  {
    id: 'emberbat',
    name: 'Cinder Bat',
    kind: 'pet',
    rarity: 'epic',
    family: 'demon',
    description: 'A coal-winged familiar that sets the air alight when it hunts.',
    bonuses: { attackPct: 6, critDamage: 4 },
  },
  {
    id: 'frostowl',
    name: 'Frost Owl',
    kind: 'pet',
    rarity: 'epic',
    family: 'spirit',
    description: 'Its hoot freezes the moment. Its eyes never blink.',
    bonuses: { attackSpeed: 4, iceResist: 6 },
  },
  {
    id: 'voidmoth',
    name: 'Void Moth',
    kind: 'pet',
    rarity: 'legendary',
    family: 'spirit',
    description: 'A wingbeat of nothing. It feeds on the space between guards.',
    bonuses: { penetration: 5, bossDamage: 5 },
  },
  {
    id: 'emberwhelp',
    name: 'Ember Whelp',
    kind: 'pet',
    rarity: 'mythic',
    family: 'dragon',
    description: 'A dragon the size of a cat. It already knows it will be enormous.',
    bonuses: { attackPct: 9, bossDamage: 9, fireResist: 5 },
  },
  {
    id: 'lumina',
    name: 'Lumina',
    kind: 'pet',
    rarity: 'divine',
    family: 'seraph',
    description: 'A shard of the old dawn, wearing the shape of a small winged lion.',
    bonuses: { attackPct: 7, defensePct: 5, hpPct: 5, critChance: 2, goldFind: 5 },
  },
]

export const MOUNTS: CompanionDef[] = [
  {
    id: 'moorpony',
    name: 'Marsh Pony',
    kind: 'mount',
    rarity: 'common',
    family: 'bear',
    description: 'Sure-footed, bad-tempered, and entirely indispensable in the Gloomfen.',
    bonuses: { goldFind: 5, hpPct: 2 },
  },
  {
    id: 'direwolf',
    name: 'Direwolf',
    kind: 'mount',
    rarity: 'rare',
    family: 'wolf',
    description: 'It runs because the world is chasing it. You are merely permitted to hold on.',
    bonuses: { attackSpeed: 4, attackPct: 2 },
  },
  {
    id: 'froststag',
    name: 'Frost Stag',
    kind: 'mount',
    rarity: 'epic',
    family: 'bear',
    description: 'Its antlers hold a small winter that never melts.',
    bonuses: { hpPct: 7, iceResist: 8 },
  },
  {
    id: 'obsidiandrake',
    name: 'Obsidian Drake',
    kind: 'mount',
    rarity: 'legendary',
    family: 'dragon',
    description: 'A drake of black glass and banked fire. The ground smokes where it steps.',
    bonuses: { attackPct: 9, bossDamage: 6 },
  },
  {
    id: 'stormgriffin',
    name: 'Storm Griffin',
    kind: 'mount',
    rarity: 'mythic',
    family: 'seraph',
    description: 'It nests in thunderheads and descends only for the worthy.',
    bonuses: { critChance: 4, attackSpeed: 5 },
  },
  {
    id: 'celestialwyrm',
    name: 'Celestial Wyrm',
    kind: 'mount',
    rarity: 'divine',
    family: 'dragon',
    description: 'A ribbon of starlight given appetite and wings.',
    bonuses: { attackPct: 7, hpPct: 6, critChance: 3, bossDamage: 8, goldFind: 6 },
  },
]

export const ALL_COMPANIONS = [...PETS, ...MOUNTS]
export const companionById = (id: string) => ALL_COMPANIONS.find((c) => c.id === id)

export function companionLevelBonus(def: CompanionDef, level: number, stat: keyof CompanionDef['bonuses']): number {
  const base = def.bonuses[stat] ?? 0
  return +(base * (1 + (level - 1) * 0.08)).toFixed(2)
}

export const COMPANION_MAX_LEVEL = 30
export const companionUpgradeCost = (level: number) => Math.floor(320 * Math.pow(1.18, level - 1))
