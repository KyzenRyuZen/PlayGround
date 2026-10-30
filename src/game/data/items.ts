import type { Affix, ItemBase, Rarity, StatKey, StatUnit } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Item bases — original names, nine equipment slots, four heritage tiers.
// ─────────────────────────────────────────────────────────────────────────────

export const ITEM_BASES: ItemBase[] = [
  // Weapons
  {
    id: 'ashen_longsword',
    name: 'Ashen Longsword',
    slot: 'weapon',
    tier: 1,
    classReq: 'warrior',
    implicit: { attack: 7 },
    perLevel: { attack: 2.1 },
    flavor: 'Forged from the last cold ember of a dead star.',
  },
  {
    id: 'ironfang_greatblade',
    name: 'Ironfang Greatblade',
    slot: 'weapon',
    tier: 2,
    classReq: 'warrior',
    implicit: { attack: 10, strength: 2 },
    perLevel: { attack: 2.6, strength: 0.06 },
    flavor: 'Its edge remembers every shield it has ever broken.',
  },
  {
    id: 'emberwrought_cleaver',
    name: 'Emberwrought Cleaver',
    slot: 'weapon',
    tier: 3,
    classReq: 'warrior',
    implicit: { attack: 13, critDamage: 4 },
    perLevel: { attack: 3.1, critDamage: 0.08 },
    flavor: 'The smith who made it never needed a fire again.',
  },
  {
    id: 'soulrender_axe',
    name: 'Soulrender Axe',
    slot: 'weapon',
    tier: 4,
    classReq: 'warrior',
    implicit: { attack: 17, lifesteal: 1 },
    perLevel: { attack: 3.7, lifesteal: 0.02 },
    flavor: 'It does not cut flesh. It cuts the idea of flesh.',
  },
  {
    id: 'nightroot_staff',
    name: 'Nightroot Staff',
    slot: 'weapon',
    tier: 1,
    classReq: 'mage',
    implicit: { attack: 8, mp: 6 },
    perLevel: { attack: 2.3, mp: 0.7 },
    flavor: 'Grown, not carved. It still hums with old rain.',
  },
  {
    id: 'cinderwood_scepter',
    name: 'Cinderwood Scepter',
    slot: 'weapon',
    tier: 2,
    classReq: 'mage',
    implicit: { attack: 11, intelligence: 2 },
    perLevel: { attack: 2.8, intelligence: 0.06 },
    flavor: 'The wood smoulders without ever being consumed.',
  },
  {
    id: 'voidglass_rod',
    name: 'Voidglass Rod',
    slot: 'weapon',
    tier: 3,
    classReq: 'mage',
    implicit: { attack: 14, penetration: 2 },
    perLevel: { attack: 3.3, penetration: 0.05 },
    flavor: 'A splinter of the space between stars, carefully mounted.',
  },
  {
    id: 'astral_grimoire',
    name: 'Astral Grimoire',
    slot: 'weapon',
    tier: 4,
    classReq: 'mage',
    implicit: { attack: 18, critChance: 2 },
    perLevel: { attack: 3.9, critChance: 0.03 },
    flavor: 'Every page is a door. Some of them are listening.',
  },
  {
    id: 'windpiercer_bow',
    name: 'Windpiercer Bow',
    slot: 'weapon',
    tier: 1,
    classReq: 'archer',
    implicit: { attack: 6, attackSpeed: 2 },
    perLevel: { attack: 2.0, attackSpeed: 0.03 },
    flavor: 'The string is a single strand of captured gale.',
  },
  {
    id: 'thornwood_longbow',
    name: 'Thornwood Longbow',
    slot: 'weapon',
    tier: 2,
    classReq: 'archer',
    implicit: { attack: 9, dexterity: 2 },
    perLevel: { attack: 2.5, dexterity: 0.06 },
    flavor: 'The thorns grow back each dawn, hungrier than before.',
  },
  {
    id: 'moonsilver_crossbow',
    name: 'Moonsilver Crossbow',
    slot: 'weapon',
    tier: 3,
    classReq: 'archer',
    implicit: { attack: 12, critChance: 2 },
    perLevel: { attack: 3.0, critChance: 0.03 },
    flavor: 'Its bolts are poured from the light that leaks through the moon.',
  },
  {
    id: 'stormfeather_bow',
    name: 'Stormfeather Bow',
    slot: 'weapon',
    tier: 4,
    classReq: 'archer',
    implicit: { attack: 16, attackSpeed: 3 },
    perLevel: { attack: 3.5, attackSpeed: 0.04 },
    flavor: 'Fletched with thunder. Loosed with a held breath.',
  },

  // Armor
  {
    id: 'wanderer_leathers',
    name: 'Wanderer Leathers',
    slot: 'armor',
    tier: 1,
    implicit: { defense: 4, hp: 12 },
    perLevel: { defense: 1.5, hp: 5.5 },
    flavor: 'Stitched with the road itself.',
  },
  {
    id: 'ironbound_plate',
    name: 'Ironbound Plate',
    slot: 'armor',
    tier: 2,
    implicit: { defense: 7, hp: 20 },
    perLevel: { defense: 1.9, hp: 7 },
    flavor: 'Each dent is a story the wearer refuses to tell.',
  },
  {
    id: 'shadowweave_robe',
    name: 'Shadowweave Robe',
    slot: 'armor',
    tier: 3,
    implicit: { defense: 6, hp: 16, mp: 10 },
    perLevel: { defense: 1.8, hp: 6, mp: 0.6 },
    flavor: 'Woven from the quiet between heartbeats.',
  },
  {
    id: 'dragonhide_cuirass',
    name: 'Dragonhide Cuirass',
    slot: 'armor',
    tier: 4,
    implicit: { defense: 11, hp: 34, fireResist: 6 },
    perLevel: { defense: 2.3, hp: 9, fireResist: 0.1 },
    flavor: 'The scales still remember flight.',
  },

  // Helmets
  {
    id: 'scout_hood',
    name: 'Scout Hood',
    slot: 'helmet',
    tier: 1,
    implicit: { defense: 2, hp: 8 },
    perLevel: { defense: 0.8, hp: 3.2 },
    flavor: 'Soft wool. Sharp eyes.',
  },
  {
    id: 'sentinel_helm',
    name: 'Sentinel Helm',
    slot: 'helmet',
    tier: 2,
    implicit: { defense: 4, hp: 14 },
    perLevel: { defense: 1.1, hp: 4.4 },
    flavor: 'The visor is shaped like a promise.',
  },
  {
    id: 'arcane_circlet',
    name: 'Arcane Circlet',
    slot: 'helmet',
    tier: 3,
    implicit: { defense: 3, mp: 12, intelligence: 2 },
    perLevel: { defense: 1.0, mp: 0.7, intelligence: 0.05 },
    flavor: 'A crown for thoughts that refuse to kneel.',
  },
  {
    id: 'crown_of_embers',
    name: 'Crown of Embers',
    slot: 'helmet',
    tier: 4,
    implicit: { defense: 6, hp: 24, critDamage: 5 },
    perLevel: { defense: 1.4, hp: 6, critDamage: 0.07 },
    flavor: 'It burns the unworthy. It is patient.',
  },

  // Shields
  {
    id: 'oakguard_buckler',
    name: 'Oakguard Buckler',
    slot: 'shield',
    tier: 1,
    implicit: { defense: 3, hp: 8 },
    perLevel: { defense: 1.3, hp: 3.2 },
    flavor: 'Roots hold what iron cannot.',
  },
  {
    id: 'bulwark_of_tides',
    name: 'Bulwark of Tides',
    slot: 'shield',
    tier: 2,
    implicit: { defense: 6, iceResist: 4 },
    perLevel: { defense: 1.7, iceResist: 0.1 },
    flavor: 'The sea gave it up. Reluctantly.',
  },
  {
    id: 'aegis_of_dawn',
    name: 'Aegis of Dawn',
    slot: 'shield',
    tier: 3,
    implicit: { defense: 9, hp: 22, holyResist: 5 },
    perLevel: { defense: 1.9, hp: 5, holyResist: 0.09 },
    flavor: 'When raised, night becomes a rumour.',
  },

  // Bracelets
  {
    id: 'copper_bracer',
    name: 'Copper Bracer',
    slot: 'bracelet',
    tier: 1,
    implicit: { attack: 2, defense: 1 },
    perLevel: { attack: 0.9, defense: 0.5 },
    flavor: 'Cheap metal. Expensive lessons.',
  },
  {
    id: 'bloodjade_band',
    name: 'Bloodjade Band',
    slot: 'bracelet',
    tier: 2,
    implicit: { attack: 4, critChance: 1 },
    perLevel: { attack: 1.2, critChance: 0.02 },
    flavor: 'The stone is warm even in winter.',
  },
  {
    id: 'starlit_manacle',
    name: 'Starlit Manacle',
    slot: 'bracelet',
    tier: 3,
    implicit: { attack: 6, critDamage: 6 },
    perLevel: { attack: 1.4, critDamage: 0.08 },
    flavor: 'It holds a constellation prisoner at the wrist.',
  },

  // Earrings
  {
    id: 'hawk_feather_earring',
    name: 'Hawk Feather Earring',
    slot: 'earring',
    tier: 1,
    implicit: { dexterity: 2, critChance: 1 },
    perLevel: { dexterity: 0.06, critChance: 0.02 },
    flavor: 'The feather still turns to follow the hunt.',
  },
  {
    id: 'sapphire_drop',
    name: 'Sapphire Drop',
    slot: 'earring',
    tier: 2,
    implicit: { intelligence: 3, mp: 8 },
    perLevel: { intelligence: 0.07, mp: 0.5 },
    flavor: 'A single tear from a sky that once wept sapphires.',
  },
  {
    id: 'whisper_of_the_void',
    name: 'Whisper of the Void',
    slot: 'earring',
    tier: 3,
    implicit: { attack: 4, penetration: 2 },
    perLevel: { attack: 1.1, penetration: 0.04 },
    flavor: 'Do not answer it. It learns.',
  },

  // Necklaces
  {
    id: 'wolf_fang_pendant',
    name: 'Wolf Fang Pendant',
    slot: 'necklace',
    tier: 1,
    implicit: { strength: 2, hp: 8 },
    perLevel: { strength: 0.05, hp: 3 },
    flavor: 'The fang was freely given. That is what they say.',
  },
  {
    id: 'emberheart_amulet',
    name: 'Emberheart Amulet',
    slot: 'necklace',
    tier: 2,
    implicit: { attack: 3, fireResist: 5 },
    perLevel: { attack: 1.0, fireResist: 0.1 },
    flavor: 'A caged heartbeat, still glowing.',
  },
  {
    id: 'tear_of_the_moon',
    name: 'Tear of the Moon',
    slot: 'necklace',
    tier: 3,
    implicit: { intelligence: 4, mp: 12, critDamage: 5 },
    perLevel: { intelligence: 0.08, mp: 0.6, critDamage: 0.07 },
    flavor: 'Cold, clear, and impossibly heavy.',
  },

  // Shoes
  {
    id: 'trailboots',
    name: 'Trailboots',
    slot: 'shoes',
    tier: 1,
    implicit: { defense: 1, hp: 6, attackSpeed: 1 },
    perLevel: { defense: 0.5, hp: 2.6, attackSpeed: 0.02 },
    flavor: 'Good for running toward trouble.',
  },
  {
    id: 'ironstep_greaves',
    name: 'Ironstep Greaves',
    slot: 'shoes',
    tier: 2,
    implicit: { defense: 3, hp: 12 },
    perLevel: { defense: 1.1, hp: 4.2 },
    flavor: 'Every step leaves a small crater of resolve.',
  },
  {
    id: 'windwalker_sandals',
    name: 'Windwalker Sandals',
    slot: 'shoes',
    tier: 3,
    implicit: { attackSpeed: 3, dexterity: 2 },
    perLevel: { attackSpeed: 0.05, dexterity: 0.05 },
    flavor: 'They remove the distance between want and arrival.',
  },

  // Belts
  {
    id: 'hidebound_belt',
    name: 'Hidebound Belt',
    slot: 'belt',
    tier: 1,
    implicit: { defense: 2, hp: 6 },
    perLevel: { defense: 0.6, hp: 3 },
    flavor: 'Holds everything except regret.',
  },
  {
    id: 'warrior_sash',
    name: 'Warrior Sash',
    slot: 'belt',
    tier: 2,
    implicit: { hp: 14, strength: 2 },
    perLevel: { hp: 4.5, strength: 0.04 },
    flavor: 'Dyed in a colour only the victorious recognise.',
  },
  {
    id: 'girdle_of_giants',
    name: 'Girdle of Giants',
    slot: 'belt',
    tier: 3,
    implicit: { defense: 5, hp: 24, vitality: 2 },
    perLevel: { defense: 1.2, hp: 6, vitality: 0.05 },
    flavor: 'Wearing it feels like being believed in.',
  },
]

export const itemBaseById = (id: string): ItemBase => ITEM_BASES.find((b) => b.id === id) ?? ITEM_BASES[0]!

export function basesForSlot(slot: ItemBase['slot']): ItemBase[] {
  return ITEM_BASES.filter((b) => b.slot === slot)
}

// ─────────────────────────────────────────────────────────────────────────────
// Affix pool — every equipment drop rolls random bonuses from this table.
// ─────────────────────────────────────────────────────────────────────────────

export interface AffixDef {
  stat: StatKey
  unit: StatUnit
  min: number
  max: number
  perLevel: number
  rarityScale: number
  weight: number
  label: string
}

export const AFFIX_POOL: AffixDef[] = [
  { stat: 'attack', unit: 'flat', min: 2, max: 5, perLevel: 0.85, rarityScale: 0.22, weight: 13, label: 'Attack' },
  { stat: 'defense', unit: 'flat', min: 2, max: 4, perLevel: 0.62, rarityScale: 0.2, weight: 11, label: 'Defense' },
  { stat: 'hp', unit: 'flat', min: 10, max: 20, perLevel: 3.6, rarityScale: 0.22, weight: 12, label: 'Max HP' },
  { stat: 'mp', unit: 'flat', min: 5, max: 10, perLevel: 0.9, rarityScale: 0.18, weight: 5, label: 'Max MP' },
  { stat: 'strength', unit: 'flat', min: 1, max: 2, perLevel: 0.08, rarityScale: 0.15, weight: 5, label: 'Strength' },
  { stat: 'intelligence', unit: 'flat', min: 1, max: 2, perLevel: 0.08, rarityScale: 0.15, weight: 5, label: 'Intelligence' },
  { stat: 'dexterity', unit: 'flat', min: 1, max: 2, perLevel: 0.08, rarityScale: 0.15, weight: 5, label: 'Dexterity' },
  { stat: 'vitality', unit: 'flat', min: 1, max: 2, perLevel: 0.08, rarityScale: 0.15, weight: 5, label: 'Vitality' },
  { stat: 'critChance', unit: 'percent', min: 1.1, max: 2.4, perLevel: 0.055, rarityScale: 0.2, weight: 10, label: 'Critical Chance' },
  { stat: 'critDamage', unit: 'percent', min: 3, max: 7, perLevel: 0.13, rarityScale: 0.22, weight: 9, label: 'Critical Damage' },
  { stat: 'attackSpeed', unit: 'percent', min: 1, max: 2.4, perLevel: 0.045, rarityScale: 0.18, weight: 8, label: 'Attack Speed' },
  { stat: 'penetration', unit: 'percent', min: 1, max: 2.6, perLevel: 0.045, rarityScale: 0.18, weight: 7, label: 'Penetration' },
  { stat: 'monsterDamage', unit: 'percent', min: 3, max: 7, perLevel: 0.11, rarityScale: 0.22, weight: 8, label: 'Monster Damage' },
  { stat: 'bossDamage', unit: 'percent', min: 2.5, max: 6, perLevel: 0.1, rarityScale: 0.22, weight: 6, label: 'Boss Damage' },
  { stat: 'fireResist', unit: 'percent', min: 2, max: 5, perLevel: 0.09, rarityScale: 0.18, weight: 5, label: 'Fire Resistance' },
  { stat: 'iceResist', unit: 'percent', min: 2, max: 5, perLevel: 0.09, rarityScale: 0.18, weight: 5, label: 'Ice Resistance' },
  { stat: 'natureResist', unit: 'percent', min: 2, max: 5, perLevel: 0.09, rarityScale: 0.18, weight: 5, label: 'Nature Resistance' },
  { stat: 'shadowResist', unit: 'percent', min: 2, max: 5, perLevel: 0.09, rarityScale: 0.18, weight: 5, label: 'Shadow Resistance' },
  { stat: 'holyResist', unit: 'percent', min: 2, max: 5, perLevel: 0.09, rarityScale: 0.18, weight: 4, label: 'Holy Resistance' },
  { stat: 'voidResist', unit: 'percent', min: 2, max: 5, perLevel: 0.09, rarityScale: 0.18, weight: 3, label: 'Void Resistance' },
  { stat: 'goldFind', unit: 'percent', min: 2, max: 5, perLevel: 0.06, rarityScale: 0.15, weight: 3, label: 'Gold Find' },
  { stat: 'xpBonus', unit: 'percent', min: 1.5, max: 3.5, perLevel: 0.04, rarityScale: 0.12, weight: 2, label: 'Experience Bonus' },
  { stat: 'lifesteal', unit: 'percent', min: 0.5, max: 1.2, perLevel: 0.02, rarityScale: 0.1, weight: 2, label: 'Lifesteal' },
]

export const affixDef = (stat: StatKey): AffixDef =>
  AFFIX_POOL.find((a) => a.stat === stat) ?? AFFIX_POOL[0]!

export const STAT_LABEL: Record<StatKey, string> = {
  strength: 'Strength',
  intelligence: 'Intelligence',
  dexterity: 'Dexterity',
  vitality: 'Vitality',
  attack: 'Attack',
  defense: 'Defense',
  hp: 'Max HP',
  mp: 'Max MP',
  attackPct: 'Attack',
  defensePct: 'Defense',
  hpPct: 'Max HP',
  critChance: 'Critical Chance',
  critDamage: 'Critical Damage',
  attackSpeed: 'Attack Speed',
  penetration: 'Penetration',
  monsterDamage: 'Monster Damage',
  bossDamage: 'Boss Damage',
  fireResist: 'Fire Resistance',
  iceResist: 'Ice Resistance',
  natureResist: 'Nature Resistance',
  shadowResist: 'Shadow Resistance',
  holyResist: 'Holy Resistance',
  voidResist: 'Void Resistance',
  goldFind: 'Gold Find',
  xpBonus: 'Experience Bonus',
  lifesteal: 'Lifesteal',
  allStats: 'All Stats',
}

export const PERCENT_STATS: StatKey[] = [
  'attackPct',
  'defensePct',
  'hpPct',
  'critChance',
  'critDamage',
  'attackSpeed',
  'penetration',
  'monsterDamage',
  'bossDamage',
  'fireResist',
  'iceResist',
  'natureResist',
  'shadowResist',
  'holyResist',
  'voidResist',
  'goldFind',
  'xpBonus',
  'lifesteal',
]

export function formatStat(stat: StatKey, value: number): string {
  if (PERCENT_STATS.includes(stat)) return `${value >= 100 ? Math.round(value) : +value.toFixed(1)}%`
  return `${Math.round(value)}`
}

export function rarityIndex(rarity: Rarity): number {
  return (['common', 'rare', 'epic', 'legendary', 'mythic', 'divine'] as Rarity[]).indexOf(rarity)
}
