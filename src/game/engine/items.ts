import type { Affix, ClassId, Item, Rarity, SlotId, StatKey } from '../types'
import { AFFIX_POOL, ITEM_BASES, affixDef, itemBaseById, rarityIndex } from '../data/items'
import { RARITY, RARITY_ORDER } from '../data/classes'
import type { Rng } from '../rng'

export const INVENTORY_CAP = 150

const SLOT_WEIGHTS: { value: SlotId; weight: number }[] = [
  { value: 'weapon', weight: 14 },
  { value: 'armor', weight: 15 },
  { value: 'helmet', weight: 10 },
  { value: 'shield', weight: 8 },
  { value: 'bracelet', weight: 9 },
  { value: 'earring', weight: 8 },
  { value: 'necklace', weight: 8 },
  { value: 'shoes', weight: 10 },
  { value: 'belt', weight: 9 },
]

const RARITY_SUFFIX: Partial<Record<StatKey, string>> = {
  attack: 'the Blade',
  defense: 'the Wall',
  hp: 'the Bear',
  mp: 'the Well',
  strength: 'the Titan',
  intelligence: 'the Star',
  dexterity: 'the Hawk',
  vitality: 'the Root',
  critChance: 'the Gambler',
  critDamage: 'Ruin',
  attackSpeed: 'the Gale',
  penetration: 'the Sunderer',
  monsterDamage: 'the Hunter',
  bossDamage: 'Kingsbane',
  fireResist: 'Embers',
  iceResist: 'the Long Winter',
  natureResist: 'the Grove',
  shadowResist: 'the Pale Veil',
  holyResist: 'Dawn',
  voidResist: 'the Hollow',
  goldFind: 'the Miser',
  xpBonus: 'the Scholar',
  lifesteal: 'the Leech',
}

export type LootSource = 'normal' | 'elite' | 'boss' | 'dungeon'

const RARITY_WEIGHTS: Record<LootSource, number[]> = {
  normal: [58, 26, 10, 4, 1.4, 0.25],
  elite: [24, 34, 24, 12, 4.5, 1],
  boss: [0, 38, 32, 18, 9, 3],
  dungeon: [0, 30, 33, 22, 11, 4],
}

export function rollRarity(rng: Rng, source: LootSource, luck = 0, floor?: Rarity): Rarity {
  const weights = RARITY_WEIGHTS[source].map((w, i) => {
    // Luck pushes weight up the rarity ladder.
    const multiplier = 1 + luck * i * 0.22
    return { value: RARITY_ORDER[i]!, weight: w * multiplier }
  })
  let rarity = rng.weighted(weights)
  if (floor && rarityIndex(rarity) < rarityIndex(floor)) rarity = floor
  return rarity
}

export function generateAffix(
  rng: Rng,
  itemLevel: number,
  rarity: Rarity,
  used: Set<StatKey>,
  quality = 1,
): Affix {
  const available = AFFIX_POOL.filter((a) => !used.has(a.stat))
  const pool = available.length ? available : AFFIX_POOL
  const def = rng.weighted(pool.map((a) => ({ value: a, weight: a.weight })))
  used.add(def.stat)
  const rarityScale = 1 + rarityIndex(rarity) * def.rarityScale
  const raw = (rng.float(def.min, def.max) + def.perLevel * itemLevel) * rarityScale * quality
  const value = def.unit === 'flat' ? Math.max(1, Math.round(raw)) : Math.max(0.1, +raw.toFixed(1))
  return {
    id: `af_${def.stat}_${Math.floor(rng.next() * 1e9).toString(36)}`,
    stat: def.stat,
    value,
    quality,
  }
}

export interface GenerateItemOptions {
  level: number
  rarity?: Rarity
  source?: LootSource
  luck?: number
  slot?: SlotId
  classId?: ClassId
  baseId?: string
}

const PREFIX_BY_RARITY: Record<Rarity, string> = {
  common: '',
  rare: 'Runed',
  epic: 'Sanctified',
  legendary: 'Dread',
  mythic: 'Astral',
  divine: 'Eternal',
}

export function generateItem(rng: Rng, opts: GenerateItemOptions): Item {
  const level = Math.max(1, Math.round(opts.level))
  const rarity = opts.rarity ?? rollRarity(rng, opts.source ?? 'normal', opts.luck ?? 0)

  let base = opts.baseId ? itemBaseById(opts.baseId) : undefined
  if (!base) {
    if (opts.slot) {
      const candidates = ITEM_BASES.filter(
        (b) => b.slot === opts.slot && (!b.classReq || !opts.classId || b.classReq === opts.classId),
      )
      base = rng.pick(candidates.length ? candidates : ITEM_BASES.filter((b) => b.slot === opts.slot))
    } else {
      const slot = rng.weighted(SLOT_WEIGHTS)
      const candidates = ITEM_BASES.filter(
        (b) => b.slot === slot && (!b.classReq || !opts.classId || b.classReq === opts.classId),
      )
      base = rng.pick(candidates.length ? candidates : ITEM_BASES.filter((b) => b.slot === slot))
    }
  }
  const used = new Set<StatKey>()
  const affixCount = RARITY[rarity].affixes
  const affixes: Affix[] = []
  for (let i = 0; i < affixCount; i++) affixes.push(generateAffix(rng, level, rarity, used))

  const tierBonus = (base.tier - 1) * 0.06
  const displayName = `${PREFIX_BY_RARITY[rarity]} ${base.name}`.trim()
  const suffixStat = affixes[0]?.stat
  const suffixWord = suffixStat ? RARITY_SUFFIX[suffixStat] ?? '' : ''
  // Avoid "Bulwark of Tides of the Pale Veil": bases that already contain an
  // "of" clause take a comma-appositive suffix instead.
  const suffix =
    suffixStat && suffixWord && rarityIndex(rarity) >= 1
      ? displayName.includes(' of ')
        ? `, ${suffixWord}`
        : ` of ${suffixWord}`
      : ''

  return {
    uid: `it_${Date.now().toString(36)}_${Math.floor(rng.next() * 1e9).toString(36)}`,
    baseId: base.id,
    name: `${displayName}${suffix}`.trim(),
    slot: base.slot,
    rarity,
    level: Math.round(level * (1 + tierBonus)),
    plus: 0,
    classReq: base.classReq,
    affixes,
    locked: false,
    createdAt: Date.now(),
  }
}

export function regenerateAffixes(rng: Rng, item: Item, rarity = item.rarity): Affix[] {
  const used = new Set<StatKey>()
  const count = RARITY[rarity].affixes
  const affixes: Affix[] = []
  for (let i = 0; i < count; i++) affixes.push(generateAffix(rng, item.level, rarity, used))
  return affixes
}

export function addAffix(rng: Rng, item: Item): Affix | null {
  const cap = RARITY[item.rarity].affixes + 1
  if (item.affixes.length >= cap) return null
  const used = new Set(item.affixes.map((a) => a.stat))
  const affix = generateAffix(rng, item.level, item.rarity, used)
  item.affixes.push(affix)
  return affix
}

export function rerollAffixes(rng: Rng, item: Item): Affix[] {
  item.affixes = regenerateAffixes(rng, item)
  return item.affixes
}

export function empowerRandomAffix(rng: Rng, item: Item): Affix | null {
  const candidates = item.affixes.filter((a) => a.quality < 1.5)
  if (!candidates.length) return null
  const affix = rng.pick(candidates)
  affix.quality = Math.min(1.5, +(affix.quality + 0.1).toFixed(2))
  return affix
}

export function fuseItems(rng: Rng, items: Item[]): Item {
  if (items.length !== 4) throw new Error('Fusion requires exactly 4 items.')
  const first = items[0]!
  if (!items.every((i) => i.baseId === first.baseId && i.rarity === first.rarity)) {
    throw new Error('All four items must share the same base and rarity.')
  }
  if (first.rarity === 'divine') throw new Error('Divine items cannot be fused further.')
  const nextRarity = RARITY_ORDER[rarityIndex(first.rarity) + 1]!
  const level = Math.max(...items.map((i) => i.level))
  return generateItem(rng, {
    level,
    rarity: nextRarity,
    baseId: first.baseId,
    classId: first.classReq,
  })
}

export function sellPrice(item: Item): number {
  const base = (14 + item.level * 5) * RARITY[item.rarity].sellMult
  return Math.round(base * (1 + item.plus * 0.12))
}

export function fuseCost(items: Item[]): number {
  if (!items.length) return 0
  const item = items[0]!
  return Math.round((240 + item.level * 30) * RARITY[item.rarity].fuse)
}

// ── Blacksmith ───────────────────────────────────────────────────────────────

/** Chance to go from +N to +N+1. Index 0 = +0 → +1. */
export const UPGRADE_CHANCES = [1, 0.95, 0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.43, 0.36, 0.3, 0.24, 0.19, 0.15, 0.11]

export function upgradeChance(plus: number): number {
  return UPGRADE_CHANCES[Math.min(plus, UPGRADE_CHANCES.length - 1)] ?? 0.08
}

export function upgradeCost(item: Item): { gold: number; stones: number; material: 'weapon_stone' | 'armor_stone' } {
  const gold = Math.round((160 + item.level * 35) * Math.pow(item.plus + 1, 1.32) * RARITY[item.rarity].mult)
  const stones = 1 + Math.floor(item.plus / 3)
  const material = item.slot === 'weapon' ? 'weapon_stone' : 'armor_stone'
  return { gold, stones, material }
}

export interface UpgradeOutcome {
  success: boolean
  destroyed: boolean
  downgraded: boolean
  nextPlus: number
}

export function resolveUpgrade(item: Item, rng: Rng, protection: boolean): UpgradeOutcome {
  if (item.plus >= 15) return { success: false, destroyed: false, downgraded: false, nextPlus: 15 }
  const success = rng.chance(upgradeChance(item.plus))
  if (success) return { success: true, destroyed: false, downgraded: false, nextPlus: item.plus + 1 }
  if (item.plus >= 10) {
    if (protection) return { success: false, destroyed: false, downgraded: false, nextPlus: item.plus }
    if (rng.chance(0.1)) return { success: false, destroyed: true, downgraded: false, nextPlus: item.plus }
  }
  if (item.plus >= 7 && rng.chance(0.32)) {
    return { success: false, destroyed: false, downgraded: true, nextPlus: Math.max(0, item.plus - 1) }
  }
  return { success: false, destroyed: false, downgraded: false, nextPlus: item.plus }
}

export const AFFIX_OP_COSTS = {
  add: { gold: 2200, materials: { mystic_rune: 1 } as Partial<Record<'mystic_rune', number>> },
  reroll: { gold: 1800, materials: { chaos_crystal: 1 } as Partial<Record<'chaos_crystal', number>> },
  empower: { gold: 2600, materials: { refinement_powder: 2 } as Partial<Record<'refinement_powder', number>> },
}

export function affixCap(item: Item): number {
  return RARITY[item.rarity].affixes + 1
}

export function itemDisplayStats(item: Item): { label: string; value: string }[] {
  return item.affixes.map((a) => {
    const def = affixDef(a.stat)
    return {
      label: def.label,
      value: def.unit === 'percent' ? `+${+(a.value * a.quality).toFixed(1)}%` : `+${Math.round(a.value * a.quality)}`,
    }
  })
}
