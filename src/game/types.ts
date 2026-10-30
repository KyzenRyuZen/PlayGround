// ─────────────────────────────────────────────────────────────────────────────
// Aetherfall — shared domain types
// Every system in the game is built from these primitives.
// ─────────────────────────────────────────────────────────────────────────────

export type ClassId = 'warrior' | 'mage' | 'archer'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine'

export type SlotId =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'shield'
  | 'bracelet'
  | 'earring'
  | 'necklace'
  | 'shoes'
  | 'belt'

export type Element = 'physical' | 'fire' | 'ice' | 'nature' | 'shadow' | 'holy' | 'void'

export type MonsterFamily =
  | 'wolf'
  | 'bear'
  | 'orc'
  | 'undead'
  | 'demon'
  | 'dragon'
  | 'golem'
  | 'spirit'
  | 'seraph'

export type MonsterTier = 'normal' | 'elite' | 'boss' | 'stone' | 'dungeon'

export type StatKey =
  | 'strength'
  | 'intelligence'
  | 'dexterity'
  | 'vitality'
  | 'attack'
  | 'defense'
  | 'hp'
  | 'mp'
  | 'attackPct'
  | 'defensePct'
  | 'hpPct'
  | 'critChance'
  | 'critDamage'
  | 'attackSpeed'
  | 'penetration'
  | 'monsterDamage'
  | 'bossDamage'
  | 'fireResist'
  | 'iceResist'
  | 'natureResist'
  | 'shadowResist'
  | 'holyResist'
  | 'voidResist'
  | 'goldFind'
  | 'xpBonus'
  | 'lifesteal'
  | 'allStats'

export type StatUnit = 'flat' | 'percent'

export interface Affix {
  id: string
  stat: StatKey
  value: number
  quality: number // 1 → 1.5, improved at the blacksmith
}

export interface ItemBase {
  id: string
  name: string
  slot: SlotId
  tier: 1 | 2 | 3 | 4
  classReq?: ClassId
  implicit: Partial<Record<StatKey, number>>
  perLevel: Partial<Record<StatKey, number>>
  flavor: string
}

export interface Item {
  uid: string
  baseId: string
  name: string
  slot: SlotId
  rarity: Rarity
  level: number
  plus: number
  classReq?: ClassId
  affixes: Affix[]
  locked: boolean
  createdAt: number
}

export interface Stone {
  uid: string
  typeId: StoneTypeId
  grade: number
  level: number
  affixes: Affix[]
  name: string
}

export type StoneTypeId = 'ruby' | 'sapphire' | 'emerald' | 'topaz' | 'onyx' | 'diamond'

export interface StoneType {
  id: StoneTypeId
  name: string
  color: string
  glow: string
  description: string
}

export interface CompanionDef {
  id: string
  name: string
  kind: 'pet' | 'mount'
  rarity: Rarity
  family: MonsterFamily
  description: string
  bonuses: Partial<Record<StatKey, number>>
}

export interface OwnedCompanion {
  id: string
  level: number
}

export interface CostumeDef {
  id: string
  name: string
  slot: 'armor' | 'weapon' | 'hair' | 'effect'
  rarity: Rarity
  description: string
  bonuses: Partial<Record<StatKey, number>>
  accent: string
  glow?: string
  hair?: 'mane' | 'braid' | 'ember' | 'hood'
}

export interface SkillDef {
  id: string
  classId: ClassId
  name: string
  description: string
  unlockLevel: number
  mpCost: number
  cooldown: number
  icon: string
  effect:
    | {
        kind: 'strike'
        multiplier: number
        hits?: number
        ignoreDefense?: number
        bonusCrit?: number
        slow?: number
      }
    | {
        kind: 'buff'
        attackPct?: number
        defensePct?: number
        critAdd?: number
        speedPct?: number
        duration: number
        shieldPct?: number
        healPct?: number
        slow?: number
      }
  perLevel: number
}

export interface ClassDef {
  id: ClassId
  name: string
  title: string
  description: string
  lore: string
  color: string
  accent: string
  primary: 'strength' | 'intelligence' | 'dexterity'
  base: Record<'strength' | 'intelligence' | 'dexterity' | 'vitality', number>
  baseAttack: number
  baseHp: number
  baseMp: number
  baseCrit: number
  baseCritDamage: number
  baseInterval: number
  autoWeights: Record<'strength' | 'intelligence' | 'dexterity' | 'vitality', number>
  passive: string
}

export interface MonsterDef {
  id: string
  name: string
  family: MonsterFamily
  element: Element
  tier: MonsterTier
  hpMult: number
  atkMult: number
  defMult: number
  xpMult: number
  goldMult: number
  description: string
}

export interface MonsterInstance {
  defId: string
  name: string
  family: MonsterFamily
  element: Element
  tier: MonsterTier
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  xp: number
  gold: number
  isBoss: boolean
  elite: boolean
}

export interface Region {
  id: string
  name: string
  subtitle: string
  stageStart: number
  stageEnd: number
  levelStart: number
  levelEnd: number
  palette: { sky: string; far: string; near: string; glow: string; fog: string }
  pool: string[]
  lore: string
}

export interface StageInfo {
  stage: number
  region: Region
  level: number
  isBossStage: boolean
  name: string
}

export interface DungeonDef {
  id: string
  name: string
  subtitle: string
  description: string
  requiredLevel: number
  bossId: string
  level: number
  timeLimit: number
  attempts: number
  rewardGold: number
  rewardXp: number
  rarityFloor: Rarity
  materials: Partial<Record<MaterialId, number>>
  palette: { sky: string; far: string; near: string; glow: string; fog: string }
}

export type MaterialId =
  | 'weapon_stone'
  | 'armor_stone'
  | 'protection_scroll'
  | 'mystic_rune'
  | 'chaos_crystal'
  | 'refinement_powder'
  | 'stone_dust'
  | 'pet_essence'
  | 'mount_essence'

export interface MaterialDef {
  id: MaterialId
  name: string
  description: string
  color: string
  glyph: string
}

export interface DailyDef {
  id: string
  title: string
  description: string
  metric: 'kills' | 'bosses' | 'upgrades' | 'dungeons'
  target: number
  rewards: { gold?: number; premiumCoins?: number; materials?: Partial<Record<MaterialId, number>> }
}

export interface CharacterAttributes {
  strength: number
  intelligence: number
  dexterity: number
  vitality: number
}

export interface Player {
  name: string
  classId: ClassId
  level: number
  xp: number
  gold: number
  premiumCoins: number
  freePoints: number
  skillPoints: number
  attributes: CharacterAttributes
  autoAssign: boolean
  hp: number
  mp: number
}

export interface PlayerStats {
  strength: number
  intelligence: number
  dexterity: number
  vitality: number
  maxHp: number
  maxMp: number
  attack: number
  defense: number
  critChance: number
  critDamage: number
  attackSpeed: number
  attackInterval: number
  penetration: number
  monsterDamage: number
  bossDamage: number
  lifesteal: number
  goldFind: number
  xpBonus: number
  resistances: Record<Element, number>
  power: number
}

export interface Buff {
  id: string
  name: string
  attackPct?: number
  defensePct?: number
  critAdd?: number
  speedPct?: number
  expiresAt: number
}

export interface Floater {
  id: number
  text: string
  kind: 'damage' | 'crit' | 'taken' | 'heal' | 'loot' | 'level'
  side: 'enemy' | 'player'
  t: number
  drift: number
}

export interface CombatState {
  mode: 'stage' | 'dungeon'
  enemy: MonsterInstance | null
  playerAtkCd: number
  enemyAtkCd: number
  skillLock: number
  skillCds: Record<string, number>
  buffs: Buff[]
  shield: number
  enemySlowUntil: number
  time: number
  floaters: Floater[]
  floaterSeq: number
  dungeonId: string | null
  dungeonTimeLeft: number
  stageKills: number
  respawnTimer: number
}

export interface LogEntry {
  id: number
  t: number
  text: string
  kind: 'combat' | 'loot' | 'level' | 'system' | 'forge' | 'shop'
}

export interface PendingLoot {
  id: string
  item: Item | null
  gold: number
  materials: Partial<Record<MaterialId, number>>
  label: string
}

export interface GameState {
  version: number
  createdAt: number
  lastActiveAt: number
  player: Player
  inventory: Item[]
  equipment: Record<SlotId, Item | null>
  materials: Record<MaterialId, number>
  skillLevels: Record<string, number>
  stones: { inventory: Stone[]; equipped: (Stone | null)[] }
  companions: { pets: OwnedCompanion[]; mounts: OwnedCompanion[]; activePet: string | null; activeMount: string | null }
  costumes: { owned: string[]; equipped: Partial<Record<CostumeDef['slot'], string>> }
  progress: {
    highestStage: number
    farmStage: number
    autoAdvance: boolean
    autoSkills: boolean
    autoLoot: boolean
    autoSellCommon: boolean
  }
  combat: CombatState
  pendingLoot: PendingLoot[]
  lastDungeonResult: DungeonResult | null
  dungeons: { used: Record<string, number>; day: string }
  dailies: { day: string; kills: number; bosses: number; upgrades: number; dungeons: number; claimed: string[] }
  shop: {
    membershipUntil: number
    xpBoostUntil: number
    lootBoostUntil: number
    verifiedPurchases: string[]
    ownedProducts: string[]
  }
  statistics: {
    kills: number
    bosses: number
    deaths: number
    goldEarned: number
    itemsFound: number
    fusions: number
    upgrades: number
    playSeconds: number
    dungeonsCleared: number
  }
  log: LogEntry[]
  logSeq: number
  settings: { reducedMotion: boolean; sound: boolean }
}

export interface OfflineSummary {
  seconds: number
  xp: number
  gold: number
  kills: number
  items: Item[]
  materials: Partial<Record<MaterialId, number>>
  levels: number
  materialText?: string
}

export interface DungeonResult {
  dungeonId: string
  name: string
  victory: boolean
  gold: number
  xp: number
  item: Item | null
  materials: Partial<Record<MaterialId, number>>
  at: number
}

export interface ShopProduct {
  id: string
  productId: string
  name: string
  coins: number
  priceEur: number
  bonusLabel?: string
  tagline: string
  featured?: boolean
}

export interface ShopOffer {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  category: 'booster' | 'cosmetic' | 'companion' | 'material' | 'membership'
  grant:
    | { kind: 'cosmetic'; costumeId: string }
    | { kind: 'pet'; petId: string }
    | { kind: 'mount'; mountId: string }
    | { kind: 'materials'; materials: Partial<Record<MaterialId, number>>; gold?: number }
    | { kind: 'booster'; booster: 'xp' | 'loot'; hours: number }
    | { kind: 'membership'; days: number }
  repeatable?: boolean
}
