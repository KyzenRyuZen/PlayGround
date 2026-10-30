/* ==========================================================================
   EBONSPIRE · global configuration
   All gameplay pacing, shop products and billing settings are collected here
   so that live-ops tuning never requires touching the engine or UI.
   ========================================================================== */

export const GAME = {
  title: 'Ebonspire',
  subtitle: 'Riftbound Saga',
  version: 1,
  saveKey: 'ebonspire.riftbound.save.v1',
  saveVersion: 7,
  autosaveMs: 8000,
  offlineCapHours: 12,
  offlineEfficiency: 0.68,
  startingGold: 240,
  startingPremiumCoins: 200,
  startingInventory: 42,
  inventoryPerExpansion: 12,
  maxInventory: 120,
  maxHeroLevel: 120,
  stageKillsRequired: 15,
  dungeonAttemptsPerDay: 3,
  maxItemUpgrade: 15,
  maxAffixForges: 10,
  maxStones: 48,
  critCap: 75,
  speedCap: 160,
  lifestealCap: 18,
  resistCap: 65,
  autoSellRarities: ['common'],
  xpCurve: { base: 55, exponent: 1.5, linear: 45 },
  stationKeys: ['weapon', 'armor', 'helmet', 'shield', 'bracelet', 'earring', 'necklace', 'shoes', 'belt'],
  combatTickMs: 100,
  maxCombatCatchupSeconds: 45,
};

export const CLASS_START = {
  warrior: { strength: 12, intelligence: 4, dexterity: 6, vitality: 11 },
  mage: { strength: 4, intelligence: 13, dexterity: 6, vitality: 8 },
  archer: { strength: 6, intelligence: 6, dexterity: 13, vitality: 9 },
};

export const STAT_INFO = {
  attack: { label: 'Attack', short: 'ATK', kind: 'flat' },
  defense: { label: 'Defense', short: 'DEF', kind: 'flat' },
  hp: { label: 'Max HP', short: 'HP', kind: 'flat' },
  mp: { label: 'Max MP', short: 'MP', kind: 'flat' },
  critChance: { label: 'Critical Chance', short: 'CRIT', kind: 'percent' },
  critDamage: { label: 'Critical Damage', short: 'CRIT DMG', kind: 'percent' },
  penetration: { label: 'Armor Penetration', short: 'PEN', kind: 'flat' },
  penPercent: { label: 'Penetration', short: 'PEN %', kind: 'percent' },
  attackSpeed: { label: 'Attack Speed', short: 'SPD', kind: 'percent' },
  monsterDamage: { label: 'Monster Damage', short: 'MON DMG', kind: 'percent' },
  bossDamage: { label: 'Boss Damage', short: 'BOSS DMG', kind: 'percent' },
  skillDamage: { label: 'Skill Damage', short: 'SKILL', kind: 'percent' },
  resistFire: { label: 'Fire Resistance', short: 'FIRE RES', kind: 'percent' },
  resistIce: { label: 'Frost Resistance', short: 'FROST RES', kind: 'percent' },
  resistPoison: { label: 'Poison Resistance', short: 'POISON RES', kind: 'percent' },
  resistShadow: { label: 'Shadow Resistance', short: 'SHADOW RES', kind: 'percent' },
  lifesteal: { label: 'Life Steal', short: 'LIFESTEAL', kind: 'percent' },
  hpRegen: { label: 'HP Regeneration', short: 'REGEN', kind: 'flat' },
  goldFind: { label: 'Gold Find', short: 'GOLD', kind: 'percent' },
  lootFind: { label: 'Loot Find', short: 'LOOT', kind: 'percent' },
  damageReduction: { label: 'Damage Reduction', short: 'DR', kind: 'percent' },
};

export const RESIST_INFO = [
  { key: 'resistFire', label: 'Fire', element: 'fire', color: '#ff7a3d' },
  { key: 'resistIce', label: 'Frost', element: 'ice', color: '#7ecbff' },
  { key: 'resistPoison', label: 'Poison', element: 'poison', color: '#8cdf6e' },
  { key: 'resistShadow', label: 'Shadow', element: 'shadow', color: '#b08aff' },
];

export const ELEMENTS = {
  physical: { label: 'Physical', color: '#e8d9bd' },
  fire: { label: 'Fire', color: '#ff8a4c' },
  ice: { label: 'Frost', color: '#8bd6ff' },
  poison: { label: 'Poison', color: '#96e07a' },
  shadow: { label: 'Shadow', color: '#c09bff' },
  holy: { label: 'Holy', color: '#ffe1a0' },
  arcane: { label: 'Arcane', color: '#b49bff' },
};

/* -------- Premium shop configuration ------------------------------------
   Prices are display fallbacks only. On Android the live localized price is
   read from Google Play via the Digital Goods API. The verification server
   (see server/products.json) is the single source of truth for coin grants.
   ------------------------------------------------------------------------ */
export const SHOP = {
  currency: 'EUR',
  membershipPrice: 450,
  packages: [
    { id: 'pack_499', productId: 'ebonspire_coins_499', price: 4.99, coins: 500, bonus: 0, label: 'Wanderer', badge: '' },
    { id: 'pack_999', productId: 'ebonspire_coins_999', price: 9.99, coins: 1000, bonus: 100, label: 'Adventurer', badge: 'POPULAR' },
    { id: 'pack_2499', productId: 'ebonspire_coins_2499', price: 24.99, coins: 2500, bonus: 400, label: 'Champion', badge: '' },
    { id: 'pack_4999', productId: 'ebonspire_coins_4999', price: 49.99, coins: 5000, bonus: 1000, label: 'Warlord', badge: 'BEST VALUE' },
    { id: 'pack_9999', productId: 'ebonspire_coins_9999', price: 99.99, coins: 10000, bonus: 2500, label: 'Sovereign', badge: '' },
    { id: 'pack_19999', productId: 'ebonspire_coins_19999', price: 199.99, coins: 20000, bonus: 6000, label: 'Mythic', badge: '' },
  ],
  items: [
    { id: 'xp_elixir', name: 'Elixir of Insight', desc: 'Double experience from all hunts for 60 minutes.', icon: 'flask', price: 80, type: 'booster', booster: 'xp', duration: 3600, grant: 1 },
    { id: 'loot_charm', name: 'Gilded Loot Charm', desc: '+60% equipment and material drop chance for 60 minutes.', icon: 'charm', price: 70, type: 'booster', booster: 'loot', duration: 3600, grant: 1 },
    { id: 'gold_vein', name: 'Vein of Aurochs', desc: '+50% gold from every kill for 60 minutes.', icon: 'coin', price: 55, type: 'booster', booster: 'gold', duration: 3600, grant: 1 },
    { id: 'protection', name: 'Protection Scroll', desc: 'Prevents downgrade or destruction on a failed forge.', icon: 'scroll', price: 40, type: 'material', material: 'protection', grant: 1 },
    { id: 'protection_bundle', name: 'Ward Bundle', desc: 'Five protection scrolls for the forge.', icon: 'scroll', price: 170, type: 'material', material: 'protection', grant: 5 },
    { id: 'chaos_orb', name: 'Chaos Orb', desc: 'Rerolls every random bonus on a piece of gear.', icon: 'orb', price: 35, type: 'material', material: 'chaos', grant: 1 },
    { id: 'enchant_scroll', name: 'Enchant Scroll', desc: 'Adds a new random bonus to an item with room for one.', icon: 'scrollRune', price: 30, type: 'material', material: 'enchant', grant: 1 },
    { id: 'blessing_dust', name: 'Blessing Dust ×5', desc: 'Improves an existing bonus by 8% per use.', icon: 'dust', price: 25, type: 'material', material: 'blessing', grant: 5 },
    { id: 'embers', name: 'Celestial Embers ×10', desc: 'Rare forge fuel for upgrades beyond +9.', icon: 'ember', price: 90, type: 'material', material: 'ember', grant: 10 },
    { id: 'pet_treat', name: 'Pet Essence ×20', desc: 'Nourishment used to level companions.', icon: 'paw', price: 35, type: 'material', material: 'petEssence', grant: 20 },
    { id: 'mount_feed', name: 'Mount Feed ×10', desc: 'Feed used to raise the level of a mount.', icon: 'horseshoe', price: 35, type: 'material', material: 'mountFeed', grant: 10 },
    { id: 'inventory', name: 'Satchel Expansion', desc: '+12 inventory slots, forever.', icon: 'bag', price: 120, type: 'inventory', grant: 12 },
    { id: 'membership', name: 'Riftbound Membership', desc: '30 days: +15% XP, +15% gold, +1 daily dungeon attempt.', icon: 'crown', price: 500, type: 'membership', duration: 30 * 86400 },
    { id: 'starter_cache', name: 'Riftfound Cache', desc: 'One-time cache of Epic gear, stones and materials.', icon: 'chest', price: 300, type: 'cache', once: true },
    { id: 'costume_ember', name: 'Emberwake Regalia', desc: 'Legendary outfit · +2% critical damage.', icon: 'mask', price: 380, type: 'costume', costumeId: 'outfit_emberwake' },
    { id: 'costume_frost', name: 'Frostveil Veil', desc: 'Epic hair · +1% frost resistance.', icon: 'mask', price: 180, type: 'costume', costumeId: 'hair_frostveil' },
    { id: 'pet_ashwing', name: 'Ashwing the Emberling', desc: 'Legendary pet · periodic fire damage.', icon: 'paw', price: 460, type: 'pet', petId: 'ashwing' },
    { id: 'pet_moonhare', name: 'Lunemoth', desc: 'Epic pet · +8% gold find.', icon: 'paw', price: 280, type: 'pet', petId: 'lunemoth' },
    { id: 'mount_ashsteed', name: 'Cinderhoof', desc: 'Legendary mount · +8% attack speed.', icon: 'horseshoe', price: 620, type: 'mount', mountId: 'cinderhoof' },
    { id: 'mount_direwolf', name: 'Gloomfang', desc: 'Epic mount · +6% boss damage.', icon: 'horseshoe', price: 420, type: 'mount', mountId: 'gloomfang' },
  ],
};

/* Billing — replace verificationUrl with your deployed HTTPS endpoint.
   The client NEVER grants goods without a verified server response. */
export const BILLING = {
  packageName: 'com.ebonspire.riftbound',
  billingService: 'https://play.google.com/billing',
  verificationUrl: '',
  currencyFallback: 'EUR',
  enabled: true,
};

export const SAVE_LEADERBOARD_NOTE = 'Local-first save. For production, mirror the save to an authenticated account server.';
