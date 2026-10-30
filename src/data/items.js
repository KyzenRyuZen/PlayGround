/* Item architecture: slots, templates, rarities, affix pool and forge rules. */

export const SLOTS = {
  weapon:    { id: 'weapon',    label: 'Weapon',    icon: 'sword',     order: 1 },
  armor:     { id: 'armor',     label: 'Armor',     icon: 'armor',     order: 2 },
  helmet:    { id: 'helmet',    label: 'Helmet',    icon: 'helm',      order: 3 },
  shield:    { id: 'shield',    label: 'Shield',    icon: 'shield',    order: 4 },
  bracelet:  { id: 'bracelet',  label: 'Bracelet',  icon: 'bracelet',  order: 5 },
  earring:   { id: 'earring',   label: 'Earring',   icon: 'earring',   order: 6 },
  necklace:  { id: 'necklace',  label: 'Necklace',  icon: 'necklace',  order: 7 },
  shoes:     { id: 'shoes',     label: 'Shoes',     icon: 'boots',     order: 8 },
  belt:      { id: 'belt',      label: 'Belt',      icon: 'belt',      order: 9 },
};
export const SLOT_KEYS = Object.keys(SLOTS);

export const RARITIES = [
  { id: 'common',    name: 'Common',    index: 0, color: '#a9b2c0', mult: 1.00, affixes: 0, sell: 1,   weight: 590, glow: 'rgba(169,178,192,.15)' },
  { id: 'rare',      name: 'Rare',      index: 1, color: '#4d9df5', mult: 1.18, affixes: 1, sell: 2.2, weight: 265, glow: 'rgba(77,157,245,.25)' },
  { id: 'epic',      name: 'Epic',      index: 2, color: '#ad74f5', mult: 1.46, affixes: 2, sell: 5,   weight: 102, glow: 'rgba(173,116,245,.3)' },
  { id: 'legendary', name: 'Legendary', index: 3, color: '#f0b34e', mult: 1.88, affixes: 3, sell: 12,  weight: 34,  glow: 'rgba(240,179,78,.35)' },
  { id: 'mythic',    name: 'Mythic',    index: 4, color: '#ff5f7a', mult: 2.48, affixes: 4, sell: 30,  weight: 8,   glow: 'rgba(255,95,122,.4)' },
  { id: 'divine',    name: 'Divine',    index: 5, color: '#5cf0d1', mult: 3.35, affixes: 5, sell: 80,  weight: 1,   glow: 'rgba(92,240,209,.45)' },
];
export const RARITY_BY_ID = Object.fromEntries(RARITIES.map(r => [r.id, r]));
export function nextRarity(id) {
  const i = RARITIES.findIndex(r => r.id === id);
  return i >= 0 && i < RARITIES.length - 1 ? RARITIES[i + 1] : null;
}

export const THEMES = {
  steel:   { name: 'Steel',   color: '#b8c4d6', deep: '#53637b', glow: 'rgba(184,196,214,.28)' },
  ember:   { name: 'Ember',   color: '#ff9254', deep: '#8a3520', glow: 'rgba(255,146,84,.35)' },
  frost:   { name: 'Frost',   color: '#8dd8ff', deep: '#28638c', glow: 'rgba(141,216,255,.32)' },
  shadow:  { name: 'Umbral',  color: '#b493ff', deep: '#4a2f85', glow: 'rgba(180,147,255,.33)' },
  verdant: { name: 'Verdant', color: '#8ee0a4', deep: '#2d6b41', glow: 'rgba(142,224,164,.3)' },
  radiant: { name: 'Radiant', color: '#ffe0a0', deep: '#8c5f27', glow: 'rgba(255,224,160,.35)' },
  blood:   { name: 'Blood',   color: '#ff7d8c', deep: '#7a1d2d', glow: 'rgba(255,125,140,.33)' },
};
export const THEME_KEYS = Object.keys(THEMES);

const WEAPON_TEMPLATES = [
  // warrior
  { id: 'w_oathblade', slot: 'weapon', classReq: 'warrior', type: 'Sword', name: 'Oathblade', mult: 1.00, theme: 'steel' },
  { id: 'w_greatsword', slot: 'weapon', classReq: 'warrior', type: 'Greatsword', name: 'Greatsword', mult: 1.05, theme: 'steel' },
  { id: 'w_runeblade', slot: 'weapon', classReq: 'warrior', type: 'Sword', name: 'Runeblade', mult: 1.02, theme: 'shadow' },
  { id: 'w_dreadcleaver', slot: 'weapon', classReq: 'warrior', type: 'Cleaver', name: 'Dreadcleaver', mult: 1.07, theme: 'blood' },
  { id: 'w_sunsteel', slot: 'weapon', classReq: 'warrior', type: 'Sword', name: 'Sunsteel Blade', mult: 1.06, theme: 'radiant' },
  // mage
  { id: 'w_runestaff', slot: 'weapon', classReq: 'mage', type: 'Staff', name: 'Runestaff', mult: 0.94, theme: 'shadow' },
  { id: 'w_grimwand', slot: 'weapon', classReq: 'mage', type: 'Wand', name: 'Grimwand', mult: 0.90, theme: 'shadow' },
  { id: 'w_starcaller', slot: 'weapon', classReq: 'mage', type: 'Staff', name: 'Starcaller', mult: 0.98, theme: 'frost' },
  { id: 'w_voidstaff', slot: 'weapon', classReq: 'mage', type: 'Staff', name: 'Voidwood Staff', mult: 1.02, theme: 'shadow' },
  { id: 'w_aether', slot: 'weapon', classReq: 'mage', type: 'Scepter', name: 'Aether Scepter', mult: 1.00, theme: 'radiant' },
  // archer
  { id: 'w_longbow', slot: 'weapon', classReq: 'archer', type: 'Bow', name: 'Longbow', mult: 0.97, theme: 'verdant' },
  { id: 'w_warbow', slot: 'weapon', classReq: 'archer', type: 'Bow', name: 'Warbow', mult: 1.00, theme: 'steel' },
  { id: 'w_windstring', slot: 'weapon', classReq: 'archer', type: 'Bow', name: 'Windstring', mult: 0.95, theme: 'verdant' },
  { id: 'w_dragonbone', slot: 'weapon', classReq: 'archer', type: 'Bow', name: 'Dragonbone Bow', mult: 1.06, theme: 'ember' },
  { id: 'w_moonshot', slot: 'weapon', classReq: 'archer', type: 'Bow', name: 'Moonshot Recurve', mult: 1.02, theme: 'frost' },
];

const ARMOR_TEMPLATES = [
  { id: 'a_cuirass', slot: 'armor', type: 'Heavy Armor', name: 'Cuirass', mult: 1.00 },
  { id: 'a_hauberk', slot: 'armor', type: 'Mail', name: 'Hauberk', mult: 1.03 },
  { id: 'a_duskweave', slot: 'armor', type: 'Robe', name: 'Duskweave Robe', mult: 0.95 },
  { id: 'a_wardenmail', slot: 'armor', type: 'Mail', name: 'Warden Mail', mult: 1.01 },
  { id: 'a_battleplate', slot: 'armor', type: 'Plate', name: 'Battleplate', mult: 1.05 },
];
const HELMET_TEMPLATES = [
  { id: 'h_barbute', slot: 'helmet', type: 'Helm', name: 'Barbute', mult: 1.00 },
  { id: 'h_hood', slot: 'helmet', type: 'Hood', name: 'Shadow Hood', mult: 0.95 },
  { id: 'h_crown', slot: 'helmet', type: 'Crown', name: 'Crownhelm', mult: 0.98 },
  { id: 'h_dragon', slot: 'helmet', type: 'Great Helm', name: 'Dragonhelm', mult: 1.04 },
];
const SHIELD_TEMPLATES = [
  { id: 's_kite', slot: 'shield', type: 'Kite Shield', name: 'Kite Shield', mult: 1.00 },
  { id: 's_bulwark', slot: 'shield', type: 'Bulwark', name: 'Bulwark', mult: 1.04 },
  { id: 's_aegis', slot: 'shield', type: 'Aegis', name: 'Aegis', mult: 0.98 },
  { id: 's_tower', slot: 'shield', type: 'Tower Shield', name: 'Tower Shield', mult: 1.06 },
];
const BRACELET_TEMPLATES = [
  { id: 'b_bracer', slot: 'bracelet', type: 'Bracer', name: 'Bracer', mult: 1.00 },
  { id: 'b_armlet', slot: 'bracelet', type: 'Armlet', name: 'Armlet', mult: 1.02 },
  { id: 'b_warcuff', slot: 'bracelet', type: 'Cuff', name: 'Warcuff', mult: 0.98 },
];
const EARRING_TEMPLATES = [
  { id: 'e_loop', slot: 'earring', type: 'Earring', name: 'Silver Loop', mult: 1.00 },
  { id: 'e_shard', slot: 'earring', type: 'Earring', name: 'Rift Shard Earring', mult: 1.03 },
  { id: 'e_whisper', slot: 'earring', type: 'Earring', name: 'Whisper Earring', mult: 0.97 },
];
const NECKLACE_TEMPLATES = [
  { id: 'n_amulet', slot: 'necklace', type: 'Amulet', name: 'Amulet', mult: 1.00 },
  { id: 'n_pendant', slot: 'necklace', type: 'Pendant', name: 'Pendant', mult: 1.02 },
  { id: 'n_torc', slot: 'necklace', type: 'Torc', name: 'Warden Torc', mult: 0.98 },
];
const SHOES_TEMPLATES = [
  { id: 'sh_boots', slot: 'shoes', type: 'Boots', name: 'Boots', mult: 1.00 },
  { id: 'sh_greaves', slot: 'shoes', type: 'Greaves', name: 'Greaves', mult: 1.04 },
  { id: 'sh_striders', slot: 'shoes', type: 'Striders', name: 'Striders', mult: 0.97 },
  { id: 'sh_treads', slot: 'shoes', type: 'Treads', name: 'Treads', mult: 1.01 },
];
const BELT_TEMPLATES = [
  { id: 'be_belt', slot: 'belt', type: 'Belt', name: 'Belt', mult: 1.00 },
  { id: 'be_girdle', slot: 'belt', type: 'Girdle', name: 'Girdle', mult: 1.03 },
  { id: 'be_sash', slot: 'belt', type: 'Sash', name: 'Battle Sash', mult: 0.98 },
];

export const TEMPLATES = [...WEAPON_TEMPLATES, ...ARMOR_TEMPLATES, ...HELMET_TEMPLATES, ...SHIELD_TEMPLATES, ...BRACELET_TEMPLATES, ...EARRING_TEMPLATES, ...NECKLACE_TEMPLATES, ...SHOES_TEMPLATES, ...BELT_TEMPLATES];
export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map(t => [t.id, t]));

export function weaponTemplatesForClass(classId) {
  return WEAPON_TEMPLATES.filter(t => t.classReq === classId);
}

/* Base stat profiles. [flat at ilvl 0, gain per item level] */
export const BASE_PROFILES = {
  weapon: (t) => {
    const base = { attack: [7, 5.25] };
    if (t.classReq === 'mage') base.skillDamage = [1.6, 0.022];
    if (t.classReq === 'archer') base.critChance = [0.9, 0.022];
    if (t.classReq === 'warrior') base.critDamage = [2.5, 0.05];
    return base;
  },
  armor: () => ({ defense: [4, 2.9], hp: [16, 7.5] }),
  helmet: () => ({ defense: [3, 2.2], hp: [10, 5.2] }),
  shield: () => ({ defense: [5, 3.3], hp: [8, 4.2] }),
  bracelet: () => ({ attack: [2, 1.05], critChance: [0.7, 0.026] }),
  earring: () => ({ critChance: [1.0, 0.03], penetration: [1, 0.24] }),
  necklace: () => ({ hp: [12, 6.2], resistShadow: [1.2, 0.018] }),
  shoes: () => ({ defense: [2, 1.35], attackSpeed: [1.4, 0.017] }),
  belt: () => ({ hp: [9, 4.8], defense: [2, 1.25] }),
};

export const PREFIXES = {
  common: ['Weathered', 'Rusted', 'Scavenged', 'Plain', 'Frayed'],
  rare: ['Steel', 'Runed', 'Warden\'s', 'Gloomtouched', 'Hunter\'s'],
  epic: ['Duskforged', 'Stormbound', 'Bloodsworn', 'Umbral', 'Wildbound'],
  legendary: ['Dragonbone', 'Sunsteel', 'Nightreaper', 'Kingsfall', 'Emberwake'],
  mythic: ['Voidforged', 'Starfall', 'Worldender', 'Soulflayed', 'Riftcursed'],
  divine: ['Eternal', 'Godsteel', 'Radiant', 'Fatebinder', 'Sundered'],
};

export const AFFIX_POOL = [
  { id: 'attack', stat: 'attack', label: 'Attack', base: 2.5, perLevel: 0.92, weight: 100, decimals: 0, cap: null },
  { id: 'defense', stat: 'defense', label: 'Defense', base: 3, perLevel: 1.05, weight: 82, decimals: 0, cap: null },
  { id: 'hp', stat: 'hp', base: 10, perLevel: 3.8, weight: 92, decimals: 0, cap: null },
  { id: 'critChance', stat: 'critChance', label: 'Critical Chance', base: 0.8, perLevel: 0.027, weight: 54, decimals: 1, cap: 16, suffix: '%' },
  { id: 'critDamage', stat: 'critDamage', label: 'Critical Damage', base: 4, perLevel: 0.13, weight: 55, decimals: 1, cap: 55, suffix: '%' },
  { id: 'penetration', stat: 'penetration', label: 'Penetration', base: 1, perLevel: 0.28, weight: 46, decimals: 0, cap: null },
  { id: 'penPercent', stat: 'penPercent', label: 'Armor Piercing', base: 1.2, perLevel: 0.035, weight: 32, decimals: 1, cap: 22, suffix: '%' },
  { id: 'attackSpeed', stat: 'attackSpeed', label: 'Attack Speed', base: 1.4, perLevel: 0.02, weight: 43, decimals: 1, cap: 18, suffix: '%' },
  { id: 'monsterDamage', stat: 'monsterDamage', label: 'Monster Damage', base: 2, perLevel: 0.055, weight: 50, decimals: 1, cap: 40, suffix: '%' },
  { id: 'bossDamage', stat: 'bossDamage', label: 'Boss Damage', base: 2, perLevel: 0.065, weight: 44, decimals: 1, cap: 50, suffix: '%' },
  { id: 'skillDamage', stat: 'skillDamage', label: 'Skill Damage', base: 2.8, perLevel: 0.07, weight: 30, decimals: 1, cap: 50, suffix: '%' },
  { id: 'resistFire', stat: 'resistFire', label: 'Fire Resistance', base: 2, perLevel: 0.035, weight: 24, decimals: 1, cap: 25, suffix: '%' },
  { id: 'resistIce', stat: 'resistIce', label: 'Frost Resistance', base: 2, perLevel: 0.035, weight: 24, decimals: 1, cap: 25, suffix: '%' },
  { id: 'resistPoison', stat: 'resistPoison', label: 'Poison Resistance', base: 2, perLevel: 0.035, weight: 22, decimals: 1, cap: 25, suffix: '%' },
  { id: 'resistShadow', stat: 'resistShadow', label: 'Shadow Resistance', base: 2, perLevel: 0.035, weight: 24, decimals: 1, cap: 25, suffix: '%' },
  { id: 'lifesteal', stat: 'lifesteal', label: 'Life Steal', base: 0.4, perLevel: 0.008, weight: 16, decimals: 1, cap: 5, suffix: '%' },
  { id: 'hpRegen', stat: 'hpRegen', label: 'HP Regeneration', base: 1, perLevel: 0.22, weight: 24, decimals: 0, cap: null },
  { id: 'goldFind', stat: 'goldFind', label: 'Gold Find', base: 3, perLevel: 0.055, weight: 28, decimals: 1, cap: 45, suffix: '%' },
  { id: 'lootFind', stat: 'lootFind', label: 'Loot Find', base: 2, perLevel: 0.04, weight: 22, decimals: 1, cap: 35, suffix: '%' },
];
export const AFFIX_BY_STAT = Object.fromEntries(AFFIX_POOL.map(a => [a.stat, a]));

export const SUFFIX_BY_STAT = {
  attack: 'of Ruin',
  defense: 'of the Bastion',
  hp: 'of Vitality',
  critChance: 'of Precision',
  critDamage: 'of Cruelty',
  penetration: 'of Sundering',
  penPercent: 'of the Rift',
  attackSpeed: 'of Haste',
  monsterDamage: 'of the Hunt',
  bossDamage: 'of Kingslaying',
  skillDamage: 'of Power',
  resistFire: 'of Embers',
  resistIce: 'of Winter',
  resistPoison: 'of Antidotes',
  resistShadow: 'of Dusk',
  lifesteal: 'of Hunger',
  hpRegen: 'of Renewal',
  goldFind: 'of Avarice',
  lootFind: 'of Fortune',
};

/* Upgrade economy */
export const UPGRADE_CHANCES = [1, 1, 1, 0.95, 0.90, 0.82, 0.74, 0.66, 0.57, 0.48, 0.40, 0.34, 0.28, 0.22, 0.16, 0.10];
export const UPGRADE_DOWNGRADE_RISK = [0, 0, 0, 0, 0, 0.45, 0.45, 0.45, 0.45, 0.45, 0.60, 0.60, 0.60, 0.60, 0.60, 0.60];
export const UPGRADE_BREAK_RISK =      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.08, 0.08, 0.08, 0.15, 0.15, 0.15];

export function upgradeChance(level) { return UPGRADE_CHANCES[Math.min(level + 1, 15)] ?? 0.10; }
export function upgradeGoldCost(ilvl, level) { return Math.round((90 + ilvl * 14) * Math.pow(level + 1, 1.42)); }
export function upgradeStoneCost(ilvl, level) { return 2 + Math.floor(level / 2) + Math.floor(ilvl / 35); }
export function upgradeEmberCost(level) { return level >= 10 ? 1 + Math.floor((level - 10) / 3) : 0; }

export const MATERIALS = {
  upgradeStone: { id: 'upgradeStone', name: 'Upgrade Stone', icon: 'stone', desc: 'Common forge stone used for every upgrade.' },
  ember: { id: 'ember', name: 'Celestial Ember', icon: 'ember', desc: 'Rare forge fuel required beyond +9.' },
  protection: { id: 'protection', name: 'Protection Scroll', icon: 'scroll', desc: 'Prevents downgrade or destruction.' },
  enchant: { id: 'enchant', name: 'Enchant Scroll', icon: 'scrollRune', desc: 'Adds a new random bonus.' },
  chaos: { id: 'chaos', name: 'Chaos Orb', icon: 'orb', desc: 'Rerolls all random bonuses.' },
  blessing: { id: 'blessing', name: 'Blessing Dust', icon: 'dust', desc: 'Improves one existing bonus by 8%.' },
  stoneDust: { id: 'stoneDust', name: 'Stone Dust', icon: 'dust', desc: 'Levels and reshapes magical stones.' },
  petEssence: { id: 'petEssence', name: 'Pet Essence', icon: 'paw', desc: 'Raises companion levels.' },
  mountFeed: { id: 'mountFeed', name: 'Mount Feed', icon: 'horseshoe', desc: 'Raises mount levels.' },
  soulEmber: { id: 'soulEmber', name: 'Soul Ember', icon: 'soul', desc: 'Raises spirit companion levels.' },
};

export const MATERIAL_KEYS = Object.keys(MATERIALS);

export function itemBaseName(templateId, rarityId) {
  const t = TEMPLATE_BY_ID[templateId];
  if (!t) return 'Unknown Relic';
  const pool = PREFIXES[rarityId] || PREFIXES.common;
  return `${pool[Math.floor(Math.random() * pool.length)]} ${t.name}`;
}
