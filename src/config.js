// ============================================================
// AETHERIA — CENTRAL CONFIGURATION
// Every price, drop rate, fusion cost and currency sink lives
// here so the live economy can be balanced without code edits.
// ============================================================

export const CONFIG = {
  version: 1,
  saveKey: 'aetheria_save_v1',

  // -------- world / combat --------
  combat: {
    critCap: 0.50,           // hard cap, all sources combined
    baseCrit: 0.05,
    respawnSeconds: 18,
    bossRespawnSeconds: 120,
    eliteRespawnSeconds: 35,
    lootPickupRadius: 1.15,
    playerRespawnHp: 0.55,
    xpCurve: (level) => Math.floor(90 * Math.pow(level, 1.62) + 60 * level),
    goldPerHourTarget: 100000
  },

  // -------- drops --------
  drops: {
    equipmentChance: 0.38,        // normal monsters
    bossEquipmentChance: 1.6,     // 1 guaranteed + 60% second item
    stoneChance: 0.14,
    bossStoneChance: 1.0,
    materialChance: 0.10,
    bossCoreChance: 1.0,
    // Direct drops are always T3. Epic+ can NEVER roll here.
    rarityWeights: {
      common: 60,
      grey: 25,
      green: 10,
      blue: 5
    },
    goldVariance: [0.8, 1.2],
    // Tiers rolled on a direct drop (spec: all equipment drops are T3)
    dropTier: 3
  },

  // -------- fusion --------
  // T3→T2 / T2→T1 / T1→next rarity T3
  fusion: {
    costs: {
      common:    { t3t2: 2000,   t2t1: 3500,   next: 5000 },
      grey:      { t3t2: 7500,   t2t1: 10000,  next: 15000 },
      green:     { t3t2: 20000,  t2t1: 30000,  next: 45000 },
      blue:      { t3t2: 60000,  t2t1: 85000,  next: 120000 },
      epic:      { t3t2: 175000, t2t1: 250000, next: 350000 },
      legendary: { t3t2: 750000, t2t1: 1500000, next: 3000000 },
      mythic:    { t3t2: 5000000, t2t1: 10000000, next: 20000000 },
      divine:    { t3t2: 25000000, t2t1: 50000000, next: null }
    },
    // Cross-rarity special rules
    special: {
      legendaryCraft: 5000000,   // rare materials + boss cores -> Legendary T3
      mythicFusion: 30000000,    // 4 matching Legendary -> Mythic T3
      divineFusion: 120000000    // 4 matching Mythic -> Divine T3
    },
    requirementCount: 4,
    legendaryCores: 3,
    legendaryMaterials: 5
  },

  // -------- teleportation --------
  teleport: {
    same: 500,
    nearby: 2000,
    medium: 5000,
    far: 10000,
    endgame: 20000,
    dungeonMin: 25000,
    dungeonMax: 50000
  },

  // -------- potions (packages of 100) --------
  potions: {
    health_small:  { name: 'Health Potion (Small)',  price: 5000,  heal: 120,  color: '#ff5d73' },
    health_medium: { name: 'Health Potion (Medium)', price: 15000, heal: 420,  color: '#ff3355' },
    health_large:  { name: 'Health Potion (Large)',  price: 40000, heal: 1400, color: '#d81b3c' },
    mana_small:    { name: 'Mana Potion (Small)',    price: 5000,  mana: 60,   color: '#5aa9ff' },
    mana_medium:   { name: 'Mana Potion (Medium)',   price: 15000, mana: 220,  color: '#3b7dff' },
    mana_large:    { name: 'Mana Potion (Large)',    price: 40000, mana: 760,  color: '#2155d8' },
    attack_small:  { name: 'Attack Speed Tonic',     price: 10000, buff: 'attackSpeed', seconds: 300, mult: 1.25, color: '#ffb347' },
    attack_medium: { name: 'Attack Speed Draught',   price: 25000, buff: 'attackSpeed', seconds: 600, mult: 1.32, color: '#ff9a3c' },
    attack_large:  { name: 'Attack Speed Elixir',    price: 60000, buff: 'attackSpeed', seconds: 900, mult: 1.4, color: '#ffcf5c' },
    move_small:    { name: 'Movement Speed Tonic',   price: 25000, buff: 'moveSpeed', seconds: 300, mult: 1.25, color: '#61e8a8' },
    move_medium:   { name: 'Movement Speed Draught', price: 40000, buff: 'moveSpeed', seconds: 600, mult: 1.32, color: '#43d68f' },
    move_large:    { name: 'Movement Speed Elixir',  price: 60000, buff: 'moveSpeed', seconds: 900, mult: 1.4, color: '#7dffc1' }
  },
  potionPackageSize: 100,

  // -------- market --------
  market: {
    stallCost: 5000,
    stallHours: 24,
    taxRate: 0,                 // no mandatory market tax
    simulatedBuyersPerHour: 3,  // LOCAL SIMULATION ONLY (not real players)
    listingSlots: 6
  },

  // -------- shop / billing --------
  shop: {
    testMode: true,             // no real money is ever charged in this build
    gemPacks: [
      { id: 'gems_100', gems: 100, price: '$1.99', tag: '' },
      { id: 'gems_550', gems: 550, price: '$9.99', tag: '+10%' },
      { id: 'gems_1200', gems: 1200, price: '$19.99', tag: '+20%' },
      { id: 'gems_2500', gems: 2500, price: '$39.99', tag: '+25%' },
      { id: 'gems_6500', gems: 6500, price: '$99.99', tag: '+30%' },
      { id: 'gems_15000', gems: 15000, price: '$199.99', tag: 'BEST VALUE' }
    ],
    // Future Google Play Billing product IDs line up 1:1 with these ids.
    playBillingSkuPrefix: 'aetheria.'
  },

  // -------- economy tracking --------
  economy: {
    startingGold: 2500,
    startingGems: 150,
    npcSellRate: 0.22,          // vendor buys equipment at 22% of nominal value
    goldLossOnDeath: 0,
    targetGoldPerHour: 100000
  },

  // -------- misc --------
  inventorySize: 80,
  storageSize: 240,
  staminaDrain: 0,              // no durability / repairs by design
  autosaveSeconds: 20
};

export default CONFIG;
