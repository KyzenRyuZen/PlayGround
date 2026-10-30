import type { Element, GameState, Item, PlayerStats, StatKey, Stone } from '../types'
import { CLASSES, RARITY } from '../data/classes'
import { ITEM_BASES, itemBaseById } from '../data/items'
import { companionById, companionLevelBonus } from '../data/companions'
import { costumeById } from '../data/costumes'
import { STONE_TYPES, stoneTypeById } from '../data/materials'

export type StatMap = Partial<Record<StatKey, number>>

const add = (target: StatMap, key: StatKey, value: number) => {
  target[key] = (target[key] ?? 0) + value
}

export function emptyStats(): PlayerStats {
  return {
    strength: 0,
    intelligence: 0,
    dexterity: 0,
    vitality: 0,
    maxHp: 0,
    maxMp: 0,
    attack: 0,
    defense: 0,
    critChance: 0,
    critDamage: 0,
    attackSpeed: 0,
    attackInterval: 1.4,
    penetration: 0,
    monsterDamage: 0,
    bossDamage: 0,
    lifesteal: 0,
    goldFind: 0,
    xpBonus: 0,
    resistances: { physical: 0, fire: 0, ice: 0, nature: 0, shadow: 0, holy: 0, void: 0 },
    power: 0,
  }
}

/** Resolve an item's implicit and affix stats, including rarity and upgrade scaling. */
export function getItemStats(item: Item): StatMap {
  const base = itemBaseById(item.baseId)
  const rarityMult = RARITY[item.rarity].mult
  const upgradeMult = 1 + item.plus * 0.06
  const result: StatMap = {}
  for (const [key, value] of Object.entries(base.implicit)) {
    const per = base.perLevel[key as StatKey] ?? 0
    add(result, key as StatKey, Math.round(((value ?? 0) + per * item.level) * rarityMult * upgradeMult * 10) / 10)
  }
  for (const affix of item.affixes) {
    add(result, affix.stat, Math.round(affix.value * affix.quality * 10) / 10)
  }
  return result
}

export function getItemPower(item: Item): number {
  const stats = getItemStats(item)
  return Math.round(
    (stats.attack ?? 0) * 2.6 +
      (stats.defense ?? 0) * 2 +
      (stats.hp ?? 0) * 0.28 +
      (stats.mp ?? 0) * 0.12 +
      (stats.critChance ?? 0) * 18 +
      (stats.critDamage ?? 0) * 2.5 +
      (stats.attackSpeed ?? 0) * 7 +
      (stats.penetration ?? 0) * 6 +
      (stats.monsterDamage ?? 0) * 4 +
      (stats.bossDamage ?? 0) * 4 +
      (stats.strength ?? 0) * 6 +
      (stats.intelligence ?? 0) * 6 +
      (stats.dexterity ?? 0) * 6 +
      (stats.vitality ?? 0) * 6,
  )
}

export function getStoneStats(stone: Stone): StatMap {
  const result: StatMap = {}
  for (const affix of stone.affixes) add(result, affix.stat, affix.value)
  return result
}

/**
 * Aggregate every source of power for the active character.
 * Equipment, magical stones, active pet/mount, costumes and class passives.
 */
export function getPlayerStats(state: GameState): PlayerStats {
  const { player } = state
  const cls = CLASSES[player.classId]
  const totals: StatMap = {}

  const collect = (map: StatMap) => {
    for (const [key, value] of Object.entries(map)) add(totals, key as StatKey, value ?? 0)
  }

  // Equipment
  for (const item of Object.values(state.equipment)) {
    if (item) collect(getItemStats(item))
  }

  // Magical stones
  for (const stone of state.stones.equipped) {
    if (stone) collect(getStoneStats(stone))
  }

  // Pets and mounts
  const activePet = state.companions.activePet
  if (activePet) {
    const owned = state.companions.pets.find((p) => p.id === activePet)
    const def = companionById(activePet)
    if (owned && def) {
      const map: StatMap = {}
      for (const key of Object.keys(def.bonuses) as StatKey[]) {
        map[key] = companionLevelBonus(def, owned.level, key as keyof typeof def.bonuses)
      }
      collect(map)
    }
  }
  const activeMount = state.companions.activeMount
  if (activeMount) {
    const owned = state.companions.mounts.find((p) => p.id === activeMount)
    const def = companionById(activeMount)
    if (owned && def) {
      const map: StatMap = {}
      for (const key of Object.keys(def.bonuses) as StatKey[]) {
        map[key] = companionLevelBonus(def, owned.level, key as keyof typeof def.bonuses)
      }
      collect(map)
    }
  }

  // Costumes
  for (const costumeId of Object.values(state.costumes.equipped)) {
    if (!costumeId) continue
    const def = costumeById(costumeId)
    if (def) collect(def.bonuses)
  }

  // Class passive
  if (cls.id === 'warrior') {
    add(totals, 'defensePct', 12)
    add(totals, 'hpPct', 8)
  } else if (cls.id === 'mage') {
    add(totals, 'hpPct', 0)
  } else {
    add(totals, 'critChance', 6)
    add(totals, 'attackSpeed', 8)
  }

  const strength = cls.base.strength + player.attributes.strength + (totals.strength ?? 0)
  const intelligence = cls.base.intelligence + player.attributes.intelligence + (totals.intelligence ?? 0)
  const dexterity = cls.base.dexterity + player.attributes.dexterity + (totals.dexterity ?? 0)
  const vitality = cls.base.vitality + player.attributes.vitality + (totals.vitality ?? 0)

  const primary = cls.primary === 'strength' ? strength : cls.primary === 'intelligence' ? intelligence : dexterity
  const attackBase = cls.baseAttack + player.level * 1.15 + primary * 2.15 + (totals.attack ?? 0)
  const attack = attackBase * (1 + (totals.attackPct ?? 0) / 100)
  const defenseBase = 2 + player.level * 0.8 + vitality * 0.55 + (totals.defense ?? 0)
  const defense = defenseBase * (1 + (totals.defensePct ?? 0) / 100)
  const maxHpBase = cls.baseHp + player.level * 22 + vitality * 13 + (totals.hp ?? 0)
  const maxHp = maxHpBase * (1 + (totals.hpPct ?? 0) / 100)
  const maxMpBase = cls.baseMp + player.level * 6 + intelligence * 4 + (totals.mp ?? 0)
  const maxMp = maxMpBase * (cls.id === 'mage' ? 1.18 : 1)

  const critChance = Math.min(0.8, cls.baseCrit + dexterity * 0.0013 + (totals.critChance ?? 0) / 100)
  const critDamage = cls.baseCritDamage + (totals.critDamage ?? 0) / 100
  const attackSpeed = (totals.attackSpeed ?? 0)
  const attackInterval = Math.max(0.35, cls.baseInterval / (1 + attackSpeed / 100))

  const resistances: Record<Element, number> = {
    physical: 0,
    fire: Math.min(75, totals.fireResist ?? 0),
    ice: Math.min(75, totals.iceResist ?? 0),
    nature: Math.min(75, totals.natureResist ?? 0),
    shadow: Math.min(75, totals.shadowResist ?? 0),
    holy: Math.min(75, totals.holyResist ?? 0),
    void: Math.min(75, totals.voidResist ?? 0),
  }

  const power = Math.round(
    attack * 2.4 +
      defense * 1.5 +
      maxHp * 0.22 +
      maxMp * 0.08 +
      critChance * 900 +
      critDamage * 160 +
      attackSpeed * 9 +
      (totals.penetration ?? 0) * 7 +
      (totals.monsterDamage ?? 0) * 5 +
      (totals.bossDamage ?? 0) * 6,
  )

  return {
    strength,
    intelligence,
    dexterity,
    vitality,
    maxHp: Math.round(maxHp),
    maxMp: Math.round(maxMp),
    attack: Math.round(attack),
    defense: Math.round(defense),
    critChance: +critChance.toFixed(4),
    critDamage: +critDamage.toFixed(3),
    attackSpeed: +attackSpeed.toFixed(1),
    attackInterval: +attackInterval.toFixed(3),
    penetration: +(totals.penetration ?? 0).toFixed(1),
    monsterDamage: +(totals.monsterDamage ?? 0).toFixed(1),
    bossDamage: +(totals.bossDamage ?? 0).toFixed(1),
    lifesteal: +(totals.lifesteal ?? 0).toFixed(2),
    goldFind: +(totals.goldFind ?? 0).toFixed(1),
    xpBonus: +(totals.xpBonus ?? 0).toFixed(1),
    resistances,
    power,
  }
}

export function allItemBasesForClass(classId: 'warrior' | 'mage' | 'archer') {
  return ITEM_BASES.filter((b) => !b.classReq || b.classReq === classId)
}

export function stoneTypeName(typeId: string): string {
  return STONE_TYPES.find((s) => s.id === typeId)?.name ?? 'Stone'
}

export function stoneTypeColor(typeId: string): string {
  return STONE_TYPES.find((s) => s.id === typeId)?.color ?? '#c9a84c'
}
