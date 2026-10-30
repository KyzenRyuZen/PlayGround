import type { ClassId, GameState, Item, MaterialId, Player, SlotId } from '../types'
import { CLASSES } from '../data/classes'
import { createRng } from '../rng'
import { generateItem } from '../engine/items'
import { getPlayerStats } from '../engine/stats'
import { todayKey } from '../data/dailies'

export const SAVE_VERSION = 1

export const STARTER_WEAPONS: Record<ClassId, string> = {
  warrior: 'ashen_longsword',
  mage: 'nightroot_staff',
  archer: 'windpiercer_bow',
}

export const STARTING_MATERIALS: Record<MaterialId, number> = {
  weapon_stone: 6,
  armor_stone: 6,
  protection_scroll: 1,
  mystic_rune: 1,
  chaos_crystal: 1,
  refinement_powder: 2,
  stone_dust: 12,
  pet_essence: 3,
  mount_essence: 0,
}

const emptyEquipment = (): Record<SlotId, Item | null> => ({
  weapon: null,
  armor: null,
  helmet: null,
  shield: null,
  bracelet: null,
  earring: null,
  necklace: null,
  shoes: null,
  belt: null,
})

export function createPlayer(classId: ClassId, name: string): Player {
  return {
    name,
    classId,
    level: 1,
    xp: 0,
    gold: 750,
    premiumCoins: 0,
    freePoints: 0,
    skillPoints: 0,
    attributes: { strength: 0, intelligence: 0, dexterity: 0, vitality: 0 },
    autoAssign: true,
    hp: 100,
    mp: 50,
  }
}

export function createNewGame(classId: ClassId, name = 'Wanderer'): GameState {
  const rng = createRng(Date.now())
  const now = Date.now()
  const player = createPlayer(classId, name)
  const equipment = emptyEquipment()
  const weapon = generateItem(rng, { baseId: STARTER_WEAPONS[classId], level: 1, rarity: 'common', classId })
  const armor = generateItem(rng, { baseId: 'wanderer_leathers', level: 1, rarity: 'common' })
  const shoes = generateItem(rng, { baseId: 'trailboots', level: 1, rarity: 'common' })
  equipment.weapon = weapon
  equipment.armor = armor
  equipment.shoes = shoes

  const state: GameState = {
    version: SAVE_VERSION,
    createdAt: now,
    lastActiveAt: now,
    player,
    inventory: [],
    equipment,
    materials: { ...STARTING_MATERIALS },
    skillLevels: { riven_cleave: 1, arcane_lance: 1, piercing_shot: 1 },
    stones: { inventory: [], equipped: [null, null, null] },
    companions: {
      pets: [{ id: 'ashling', level: 1 }],
      mounts: [],
      activePet: 'ashling',
      activeMount: null,
    },
    costumes: { owned: [], equipped: {} },
    progress: {
      highestStage: 1,
      farmStage: 1,
      autoAdvance: true,
      autoSkills: true,
      autoLoot: true,
      autoSellCommon: false,
    },
    combat: {
      mode: 'stage',
      enemy: null,
      playerAtkCd: 0,
      enemyAtkCd: 2,
      skillLock: 0,
      skillCds: {},
      buffs: [],
      shield: 0,
      enemySlowUntil: 0,
      time: 0,
      floaters: [],
      floaterSeq: 0,
      dungeonId: null,
      dungeonTimeLeft: 0,
      stageKills: 0,
      respawnTimer: 0,
    },
    pendingLoot: [],
    lastDungeonResult: null,
    dungeons: { used: {}, day: todayKey() },
    dailies: { day: todayKey(), kills: 0, bosses: 0, upgrades: 0, dungeons: 0, claimed: [] },
    shop: {
      membershipUntil: 0,
      xpBoostUntil: 0,
      lootBoostUntil: 0,
      verifiedPurchases: [],
      ownedProducts: [],
    },
    statistics: {
      kills: 0,
      bosses: 0,
      deaths: 0,
      goldEarned: 0,
      itemsFound: 0,
      fusions: 0,
      upgrades: 0,
      playSeconds: 0,
      dungeonsCleared: 0,
    },
    log: [],
    logSeq: 0,
    settings: { reducedMotion: false, sound: true },
  }

  const stats = getPlayerStats(state)
  state.player.hp = stats.maxHp
  state.player.mp = stats.maxMp
  state.player.name = name || CLASSES[classId].title
  return state
}
