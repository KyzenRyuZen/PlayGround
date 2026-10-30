// Riftbound — static game data and pure rules.
// Everything here is deterministic so saves stay tiny and item stacks can merge cleanly.

export const SAVE_KEY = 'riftbound.save.v1';
export const SAVE_VERSION = 1;

export const RARITIES = [
  { id: 'common',    name: 'Common',    rank: 0, mult: 1.00, color: '#aab4c5', glow: 'rgba(170,180,197,.35)', css: 'r-common' },
  { id: 'rare',      name: 'Rare',      rank: 1, mult: 1.45, color: '#5eb0ff', glow: 'rgba(94,176,255,.45)',  css: 'r-rare' },
  { id: 'epic',      name: 'Epic',      rank: 2, mult: 2.05, color: '#c084fc', glow: 'rgba(192,132,252,.5)',  css: 'r-epic' },
  { id: 'legendary', name: 'Legendary', rank: 3, mult: 2.90, color: '#f6a94a', glow: 'rgba(246,169,74,.55)',  css: 'r-legendary' },
  { id: 'mythic',    name: 'Mythic',    rank: 4, mult: 4.10, color: '#fb5f8b', glow: 'rgba(251,95,139,.55)',  css: 'r-mythic' },
  { id: 'divine',    name: 'Divine',    rank: 5, mult: 5.80, color: '#ffe58a', glow: 'rgba(255,229,138,.7)',   css: 'r-divine' },
];

export const RARITY_BY_ID = Object.fromEntries(RARITIES.map(r => [r.id, r]));

export const SLOTS = [
  { id: 'weapon',   name: 'Weapon',   icon: 'weapon',   short: 'WPN' },
  { id: 'armor',    name: 'Armor',    icon: 'armor',    short: 'ARM' },
  { id: 'bracelet', name: 'Bracelet', icon: 'bracelet', short: 'BRC' },
  { id: 'earrings', name: 'Earrings', icon: 'earrings', short: 'EAR' },
  { id: 'helmet',   name: 'Helmet',   icon: 'helmet',   short: 'HLM' },
  { id: 'shield',   name: 'Shield',   icon: 'shield',   short: 'SHD' },
  { id: 'boots',    name: 'Boots',    icon: 'boots',    short: 'BTS' },
  { id: 'necklace', name: 'Necklace', icon: 'necklace', short: 'NCK' },
  { id: 'ring',     name: 'Ring',     icon: 'ring',     short: 'RNG' },
];

export const SLOT_BY_ID = Object.fromEntries(SLOTS.map(s => [s.id, s]));

export const CHAPTERS = [
  {
    id: 1, numeral: 'I', name: 'Emberfall Reach', tag: 'Where the first rift burns',
    boss: 'gorehide', accent: '#fb923c', fog: '#7c2d12', floor: '#170f0d', ember: true,
    names: ['Ashen Gate', 'Cinder Path', 'Smoldering Hollow', 'Emberfall Bridge', "Gorehide's Maw"],
    enemies: { crawler: 'Ash Crawler', wisp: 'Cinder Wisp', brute: 'Crag Brute', stalker: 'Scorch Stalker', shaman: 'Ember Shaman' },
  },
  {
    id: 2, numeral: 'II', name: 'Frostveil Peaks', tag: 'Silence, carved in ice',
    boss: 'vespera', accent: '#67e8f9', fog: '#164e63', floor: '#0b141c', ember: false,
    names: ['Frozen Threshold', 'Rime Steps', 'Hollow Chapel', 'Whiteout Pass', "Vespera's Web"],
    enemies: { crawler: 'Rime Crawler', wisp: 'Frost Wisp', brute: 'Glacier Brute', stalker: 'Snow Stalker', shaman: 'Ice Shaman' },
  },
  {
    id: 3, numeral: 'III', name: 'Blightmire', tag: 'The rot remembers',
    boss: 'mordrek', accent: '#a3e635', fog: '#365314', floor: '#0d130c', ember: false,
    names: ['Bog Entrance', 'Rotwood', 'Spore Caverns', 'Sunken Shrine', "Mordrek's Pit"],
    enemies: { crawler: 'Blight Crawler', wisp: 'Spore Wisp', brute: 'Rot Brute', stalker: 'Mire Stalker', shaman: 'Plague Shaman' },
  },
  {
    id: 4, numeral: 'IV', name: 'Stormreach', tag: 'The sky answers with thunder',
    boss: 'skyrend', accent: '#93c5fd', fog: '#1e3a8a', floor: '#0b1020', ember: false,
    names: ['Stormgate', 'Thunder Road', 'Shattered Spire', 'Tempest Court', "Skyrend's Roost"],
    enemies: { crawler: 'Storm Crawler', wisp: 'Arc Wisp', brute: 'Thunder Brute', stalker: 'Gale Stalker', shaman: 'Tempest Shaman' },
  },
  {
    id: 5, numeral: 'V', name: 'Voidspire', tag: 'Nothing waits at the top',
    boss: 'nyx', accent: '#e879f9', fog: '#581c87', floor: '#0a0912', ember: false,
    names: ['The Last Door', 'Null Expanse', 'Starless Hall', 'Edge of Nothing', 'Throne of Nyx'],
    enemies: { crawler: 'Void Crawler', wisp: 'Null Wisp', brute: 'Rift Brute', stalker: 'Shade Stalker', shaman: 'Void Shaman' },
  },
];

export const CHAPTER_SCALE = [1, 1.9, 3.4, 5.8, 9.5];

// One base item per slot per chapter. "Identical" is therefore easy to read:
// same slot + same chapter + same rarity. Four copies merge into the next rarity.
export const ITEM_NAMES = [
  { // I
    weapon: 'Ironfang Blade', armor: "Warden's Cuirass", bracelet: 'Emberband', earrings: 'Cinder Drops',
    helmet: 'Ironhelm', shield: 'Ember Bulwark', boots: 'Emberstriders', necklace: 'Ember Pendant', ring: 'Cinder Ring',
  },
  { // II
    weapon: 'Rimecleaver', armor: 'Frostweave Robe', bracelet: 'Frostlink Bracer', earrings: 'Icicle Drops',
    helmet: 'Rimehood', shield: 'Frostwall', boots: 'Frosttreads', necklace: 'Frost Shard', ring: 'Rime Ring',
  },
  { // III
    weapon: 'Blightthorn', armor: 'Boghide Vest', bracelet: 'Blightcoil', earrings: 'Spore Drops',
    helmet: 'Blightmask', shield: 'Carapace', boots: 'Mireboots', necklace: 'Blight Charm', ring: 'Rot Ring',
  },
  { // IV
    weapon: 'Stormcaller', armor: 'Stormhide Jerkin', bracelet: 'Stormloop', earrings: 'Thunder Drops',
    helmet: 'Stormcrown', shield: 'Thunderwall', boots: 'Stormstriders', necklace: 'Storm Sigil', ring: 'Bolt Ring',
  },
  { // V
    weapon: 'Voidreaver', armor: 'Voidmail', bracelet: 'Voidband', earrings: 'Null Drops',
    helmet: 'Voidhelm', shield: 'Nullwall', boots: 'Voidtreads', necklace: 'Void Locket', ring: 'Null Ring',
  },
];

export const TIER_FACTOR = [0, 1, 1.32, 1.7, 2.15, 2.7];

export const ITEM_STAT_WEIGHTS = {
  weapon:   { atk: 4.2 },
  armor:    { hp: 28, def: 2.4 },
  bracelet: { atk: 1.3, crit: 0.95 },
  earrings: { atk: 1.5, critDmg: 1.15 },
  helmet:   { hp: 22, def: 1.5 },
  shield:   { def: 2.9, hp: 11 },
  boots:    { speed: 0.65, def: 0.8 },
  necklace: { hp: 19, crit: 0.5 },
  ring:     { atk: 1.7, crit: 0.75 },
};

export const STAT_META = {
  atk:      { name: 'Attack',      icon: 'weapon',  suffix: '' },
  hp:       { name: 'Health',      icon: 'heart',   suffix: '' },
  def:      { name: 'Defense',     icon: 'shield',  suffix: '' },
  crit:     { name: 'Crit Chance', icon: 'spark',   suffix: '%' },
  critDmg:  { name: 'Crit Damage', icon: 'spark',   suffix: '%' },
  speed:    { name: 'Move Speed',  icon: 'boots',   suffix: '' },
};

export function itemKey(tier, slot, rarityId) {
  return `${tier}:${slot}:${rarityId}`;
}

export function parseItemKey(key) {
  const [tier, slot, rarity] = key.split(':');
  return { tier: Number(tier), slot, rarity };
}

export function getItem(keyOrParts) {
  const parts = typeof keyOrParts === 'string' ? parseItemKey(keyOrParts) : keyOrParts;
  const { tier, slot, rarity } = parts;
  const r = RARITY_BY_ID[rarity];
  const name = ITEM_NAMES[tier - 1]?.[slot] ?? 'Unknown Relic';
  const unit = TIER_FACTOR[tier] * (r?.mult ?? 1);
  const base = ITEM_STAT_WEIGHTS[slot] ?? {};
  const stats = {};
  for (const [stat, weight] of Object.entries(base)) {
    const value = weight * unit;
    stats[stat] = stat === 'crit' || stat === 'critDmg'
      ? Math.round(value * 10) / 10
      : Math.max(1, Math.round(value));
  }
  const displayStats = {};
  for (const [stat, value] of Object.entries(stats)) {
    displayStats[stat] = stat === 'crit' || stat === 'critDmg' ? `${value.toFixed(1)}%` : `+${value}`;
  }
  const power = Math.round(
    (stats.atk ?? 0) * 12 +
    (stats.hp ?? 0) * 0.55 +
    (stats.def ?? 0) * 7 +
    (stats.crit ?? 0) * 9 +
    (stats.critDmg ?? 0) * 2.2 +
    (stats.speed ?? 0) * 5
  );
  return {
    key: itemKey(tier, slot, rarity), tier, slot, rarity, name,
    rarityName: r?.name ?? 'Common', color: r?.color ?? '#aaa', css: r?.css ?? 'r-common',
    stats, displayStats, power,
    slotName: SLOT_BY_ID[slot]?.name ?? slot,
    chapterName: CHAPTERS[tier - 1]?.name ?? '',
  };
}

export function itemPower(key) {
  return getItem(key).power;
}

export const CLASSES = {
  warrior: {
    id: 'warrior', name: 'Warrior', title: 'Iron Vanguard', icon: 'warrior',
    color: '#f6b45c', color2: '#b45309', css: 'c-warrior',
    blurb: 'Hold the line. Break the line.',
    lore: 'A wall of steel and stubborn will. The Warrior closes distance, shrugs off blows, and turns a crowd of monsters into a single bad memory.',
    bars: { offense: 3.5, defense: 5, mobility: 3.2, range: 1.4 },
    base: { hp: 330, atk: 20, def: 20, crit: 5, critDmg: 155, speed: 205 },
    growth: { hp: 24, atk: 1.75, def: 1.4, crit: 0.16, speed: 0.35 },
    passive: {
      id: 'hardened', name: 'Battle Hardened',
      desc: 'Takes 12% less damage and restores 2% of max HP whenever an enemy falls.',
    },
    attack: { interval: 0.72, range: 86, cleave: 3, mult: 1.05, type: 'melee' },
    skills: [
      { id: 'whirlwind', name: 'Whirlwind', icon: 'whirlwind', cd: 8, color: '#f6b45c',
        desc: 'A full 360° slash dealing 250% ATK to every enemy nearby.' },
      { id: 'bash', name: 'Shield Bash', icon: 'bash', cd: 10, color: '#fbbf24',
        desc: 'Dash forward and smash for 180% ATK. Stuns for 1.3s.' },
      { id: 'fortress', name: 'Unbreakable', icon: 'fortress', cd: 16, color: '#fde68a',
        desc: 'Gain a shield worth 30% max HP, heal 12%, and gain +35% DEF for 6s.' },
    ],
  },
  mage: {
    id: 'mage', name: 'Mage', title: 'Rift Scholar', icon: 'mage',
    color: '#a78bfa', color2: '#4c1d95', css: 'c-mage',
    blurb: 'Rewrite the battlefield.',
    lore: 'A glass cannon with a library of answers. The Mage freezes packs in place, pierces armor with frost, and calls meteors from a sky that is not entirely there.',
    bars: { offense: 5, defense: 2, mobility: 3, range: 5 },
    base: { hp: 210, atk: 25, def: 8, crit: 8, critDmg: 165, speed: 205 },
    growth: { hp: 16, atk: 2.05, def: 0.7, crit: 0.18, speed: 0.35 },
    passive: {
      id: 'resonance', name: 'Arcane Resonance',
      desc: 'Skill damage is increased by 15%, and skill cooldowns are 10% shorter.',
    },
    attack: { interval: 0.95, range: 315, mult: 0.95, type: 'ranged', projectileSpeed: 430 },
    skills: [
      { id: 'nova', name: 'Arcane Nova', icon: 'nova', cd: 9, color: '#c4b5fd',
        desc: 'Detonate a 145-radius rune for 230% ATK and slow enemies by 40% for 2.5s.' },
      { id: 'lance', name: 'Frost Lance', icon: 'lance', cd: 7, color: '#67e8f9',
        desc: 'Hurl a piercing shard for 250% ATK. Freezes every enemy it touches for 1.5s.' },
      { id: 'meteor', name: 'Meteor', icon: 'meteor', cd: 14, color: '#fb7185',
        desc: 'Call down a meteor after 0.8s for 330% ATK in a 130 radius and burn for 3s.' },
    ],
  },
  archer: {
    id: 'archer', name: 'Archer', title: 'Veilrunner', icon: 'archer',
    color: '#5eead4', color2: '#0f766e', css: 'c-archer',
    blurb: 'Every opening. Every time.',
    lore: 'Precision made into a habit. The Archer dances at the edge of danger, threads arrows through a crowd, and turns a boss health bar into a countdown.',
    bars: { offense: 4.6, defense: 2.4, mobility: 5, range: 4.6 },
    base: { hp: 250, atk: 21, def: 10, crit: 22, critDmg: 170, speed: 225 },
    growth: { hp: 18, atk: 1.8, def: 0.9, crit: 0.28, speed: 0.5 },
    passive: {
      id: 'deadeye', name: 'Deadeye',
      desc: '+8% crit chance, +20% crit damage, and 8% bonus movement speed.',
    },
    attack: { interval: 0.38, range: 330, mult: 0.58, type: 'ranged', projectileSpeed: 585 },
    skills: [
      { id: 'fan', name: 'Fan of Arrows', icon: 'fan', cd: 8, color: '#5eead4',
        desc: 'Loose five arrows in a fan. Each deals 85% ATK and can crit.' },
      { id: 'shadowstep', name: 'Shadowstep', icon: 'shadowstep', cd: 10, color: '#2dd4bf',
        desc: 'Dash through the dark. Gain +45% ATK for 2.5s and slow nearby enemies.' },
      { id: 'rain', name: 'Rain of Arrows', icon: 'rain', cd: 14, color: '#99f6e4',
        desc: 'A 2s arrow storm: six waves of 55% ATK in a 125 radius, slowing by 30%.' },
    ],
  },
};

export const CLASS_LIST = Object.values(CLASSES);

export const ENEMY_TYPES = {
  crawler: {
    id: 'crawler', look: 'crawler', hp: 42, atk: 8, def: 2, speed: 74, radius: 14, xp: 7,
    melee: true, range: 36, interval: 1.25, windup: 0.36, color: '#f97316',
  },
  wisp: {
    id: 'wisp', look: 'wisp', hp: 30, atk: 9, def: 1, speed: 54, radius: 12, xp: 8,
    ranged: true, range: 255, keep: 185, interval: 2.1, windup: 0.5, projectileSpeed: 178, color: '#fb923c',
  },
  brute: {
    id: 'brute', look: 'brute', hp: 115, atk: 15, def: 5, speed: 42, radius: 22, xp: 14,
    melee: true, slam: true, range: 46, interval: 1.65, windup: 0.72, color: '#b45309',
  },
  stalker: {
    id: 'stalker', look: 'stalker', hp: 55, atk: 11, def: 2, speed: 92, radius: 15, xp: 10,
    melee: true, range: 38, interval: 1.1, windup: 0.3, color: '#a855f7', dasher: true,
  },
  shaman: {
    id: 'shaman', look: 'shaman', hp: 72, atk: 10, def: 3, speed: 48, radius: 17, xp: 13,
    ranged: true, range: 245, keep: 205, interval: 2.35, windup: 0.6, projectileSpeed: 165, color: '#84cc16',
  },
};

export const BOSSES = {
  gorehide: {
    id: 'gorehide', name: 'Gorehide', title: 'The Iron Brute', look: 'brute',
    hp: 780, atk: 26, def: 8, speed: 50, radius: 36, color: '#f97316',
    intro: 'The mountain has fists. It has always had fists.',
    abilities: ['slam', 'charge', 'summon'], summons: 'crawler',
  },
  vespera: {
    id: 'vespera', name: 'Vespera', title: 'The Frost Widow', look: 'widow',
    hp: 820, atk: 28, def: 7, speed: 54, radius: 33, color: '#67e8f9',
    intro: 'She has been waiting in the cold longer than the cold has existed.',
    abilities: ['volley', 'rain', 'summon'], summons: 'crawler',
  },
  mordrek: {
    id: 'mordrek', name: 'Mordrek', title: 'The Blight Oracle', look: 'oracle',
    hp: 860, atk: 30, def: 8, speed: 46, radius: 32, color: '#a3e635',
    intro: 'Every plague begins with a patient gardener.',
    abilities: ['rain', 'volley', 'blink', 'summon'], summons: 'shaman',
  },
  skyrend: {
    id: 'skyrend', name: 'Skyrend', title: 'The Storm Tyrant', look: 'tyrant',
    hp: 900, atk: 33, def: 9, speed: 58, radius: 37, color: '#93c5fd',
    intro: 'He took the sky because it was in his way.',
    abilities: ['charge', 'beam', 'volley'], summons: 'wisp',
  },
  nyx: {
    id: 'nyx', name: 'Nyx', title: 'The Void Sovereign', look: 'sovereign',
    hp: 980, atk: 36, def: 10, speed: 50, radius: 39, color: '#e879f9',
    intro: 'There is a throne at the end of everything. Someone is sitting in it.',
    abilities: ['slam', 'beam', 'rain', 'summon', 'volley'], summons: 'stalker',
  },
};

export const CHAPTER_BOSSES = ['gorehide', 'vespera', 'mordrek', 'skyrend', 'nyx'];

export function stageScale(chapter, stage) {
  return CHAPTER_SCALE[chapter - 1] * (1 + (stage - 1) * 0.1);
}

export function recommendedPower(chapter, stage) {
  return Math.round(980 * CHAPTER_SCALE[chapter - 1] * (1 + (stage - 1) * 0.12));
}

export function makeWaves(chapter, stage) {
  const c = chapter;
  const elite = { elite: true };
  if (stage === 5) {
    return [
      { title: 'Vanguard', enemies: [
        { type: 'crawler' }, { type: 'wisp' }, { type: 'crawler' }, { type: 'stalker' },
      ] },
      { title: 'The Chosen', enemies: [
        { type: 'brute', ...elite }, { type: 'wisp' }, { type: 'shaman' }, { type: 'stalker' },
      ] },
      { title: 'BOSS', boss: CHAPTER_BOSSES[c - 1], enemies: [] },
    ];
  }
  const pool = ['crawler', 'wisp', 'brute', 'stalker', 'shaman'];
  const wave1 = [
    { type: pool[(c + stage) % 3 === 0 ? 1 : 0] },
    { type: 'crawler' },
    { type: pool[(stage + 1) % 3 === 0 ? 3 : 1] },
  ];
  if (stage >= 2) wave1.push({ type: 'crawler' });
  const wave2 = [
    { type: stage >= 4 ? 'brute' : 'stalker', ...(stage >= 4 ? elite : {}) },
    { type: 'wisp' },
    { type: 'crawler' },
    ...(stage >= 3 ? [{ type: 'shaman' }] : []),
  ];
  const wave3 = [
    { type: 'brute', ...(stage >= 3 ? elite : {}) },
    { type: 'crawler' },
    { type: 'wisp' },
    ...(stage >= 2 ? [{ type: 'stalker' }] : []),
    ...(stage >= 4 ? [{ type: 'shaman' }] : []),
  ];
  return [
    { title: 'Scouting Party', enemies: wave1 },
    { title: 'The Pack', enemies: wave2 },
    { title: 'Stage Guardian', enemies: wave3 },
  ];
}

export function enemyStats(typeId, chapter, stage, elite = false) {
  const base = ENEMY_TYPES[typeId];
  const scale = stageScale(chapter, stage);
  const chapterTheme = CHAPTERS[chapter - 1];
  const name = chapterTheme.enemies[typeId] ?? base.id;
  const hpMul = elite ? 2.35 : 1;
  const atkMul = elite ? 1.3 : 1;
  const rMul = elite ? 1.3 : 1;
  return {
    ...base,
    type: typeId,
    name: elite ? `Elite ${name}` : name,
    hp: Math.round(base.hp * scale * hpMul),
    maxHp: Math.round(base.hp * scale * hpMul),
    atk: base.atk * scale * atkMul,
    def: base.def * Math.sqrt(scale),
    radius: base.radius * rMul,
    xp: Math.round(base.xp * (1 + (chapter - 1) * 0.8) * (elite ? 2.2 : 1)),
    elite,
    chapter,
    stage,
  };
}

export function bossStats(bossId, chapter, stage) {
  const base = BOSSES[bossId];
  const scale = stageScale(chapter, stage);
  return {
    ...base,
    boss: true,
    bossId,
    name: base.name,
    hp: Math.round(base.hp * scale * 1.15),
    maxHp: Math.round(base.hp * scale * 1.15),
    atk: base.atk * scale,
    def: base.def * Math.sqrt(scale),
    radius: base.radius,
    xp: Math.round(140 * (1 + (chapter - 1) * 0.9) * (1 + (stage - 1) * 0.05)),
    phase: 1,
  };
}

export function xpForNext(level) {
  return Math.round(50 + level * 20 + Math.pow(level, 1.7) * 6);
}

export function stageXpBonus(chapter, stage, boss) {
  return Math.round((24 + chapter * 16 + stage * 3) * (boss ? 2.2 : 1));
}

export function rarityWeights(chapter, boss = false) {
  const c = chapter - 1;
  if (boss) {
    return [
      0,
      Math.max(10, 30 - 3 * c),
      Math.max(20, 42 - c),
      20 + 2 * c,
      7 + 1.7 * c,
      3 + 0.6 * c,
    ];
  }
  return [
    Math.max(18, 64 - 9 * c),
    24 + 1.5 * c,
    8 + 2.4 * c,
    3 + 2.2 * c,
    0.8 + 1.1 * c,
    0.2 + 0.5 * c,
  ];
}

export function rollRarity(chapter, boss = false, rng = Math.random) {
  const weights = rarityWeights(chapter, boss);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return RARITIES[i].id;
  }
  return 'common';
}

export function randomSlot(rng = Math.random) {
  return SLOTS[Math.floor(rng() * SLOTS.length)].id;
}

export function rollDrop(chapter, { boss = false, rng = Math.random, count = 1 } = {}) {
  return {
    tier: chapter,
    slot: randomSlot(rng),
    rarity: rollRarity(chapter, boss, rng),
    count,
  };
}

export function itemSortValue(key) {
  const p = parseItemKey(key);
  return p.tier * 100 + RARITY_BY_ID[p.rarity].rank * 10;
}

export function heroStats(hero) {
  const cls = CLASSES[hero.classId];
  const level = hero.level;
  const stats = {
    maxHp: Math.round(cls.base.hp + cls.growth.hp * (level - 1)),
    atk: Math.round((cls.base.atk + cls.growth.atk * (level - 1)) * 10) / 10,
    def: Math.round((cls.base.def + cls.growth.def * (level - 1)) * 10) / 10,
    crit: Math.min(75, cls.base.crit + cls.growth.crit * (level - 1)),
    critDmg: cls.base.critDmg,
    speed: Math.round(cls.base.speed + cls.growth.speed * (level - 1)),
    shield: 0,
  };
  for (const slot of SLOTS) {
    const key = hero.equipped[slot.id];
    if (!key) continue;
    const item = getItem(key);
    stats.maxHp += item.stats.hp ?? 0;
    stats.atk += item.stats.atk ?? 0;
    stats.def += item.stats.def ?? 0;
    stats.crit += item.stats.crit ?? 0;
    stats.critDmg += item.stats.critDmg ?? 0;
    stats.speed += item.stats.speed ?? 0;
  }
  if (cls.passive.id === 'deadeye') {
    stats.crit += 8;
    stats.critDmg += 20;
    stats.speed = Math.round(stats.speed * 1.08);
  }
  stats.crit = Math.min(75, Math.round(stats.crit * 10) / 10);
  stats.critDmg = Math.min(350, Math.round(stats.critDmg * 10) / 10);
  stats.atk = Math.round(stats.atk);
  stats.def = Math.round(stats.def);
  stats.power = Math.round(
    stats.atk * 12 + stats.maxHp * 0.55 + stats.def * 7 +
    stats.crit * 9 + stats.critDmg * 2.2 + stats.speed * 0.8
  );
  stats.damageTaken = cls.passive.id === 'hardened' ? 0.88 : 1;
  stats.killHeal = cls.passive.id === 'hardened' ? 0.02 : 0;
  stats.skillPower = cls.passive.id === 'resonance' ? 1.15 : 1;
  stats.cdMult = cls.passive.id === 'resonance' ? 0.9 : 1;
  return stats;
}

export function itemComparison(hero, key) {
  const item = getItem(key);
  const currentKey = hero.equipped[item.slot];
  const current = currentKey ? getItem(currentKey) : null;
  const delta = {};
  for (const stat of ['atk', 'hp', 'def', 'crit', 'critDmg', 'speed']) {
    const diff = (item.stats[stat] ?? 0) - (current?.stats[stat] ?? 0);
    if (diff !== 0) delta[stat] = diff;
  }
  return { item, current, delta, powerDelta: item.power - (current?.power ?? 0) };
}

export function totalInventoryCount(save) {
  return Object.values(save.hero.inventory).reduce((a, b) => a + b, 0);
}

export function mergeableGroups(save) {
  const groups = [];
  for (const [key, count] of Object.entries(save.hero.inventory)) {
    if (count < 4) continue;
    const p = parseItemKey(key);
    if (RARITY_BY_ID[p.rarity].rank >= RARITIES.length - 1) continue;
    groups.push({ key, count, ...p, item: getItem(key) });
  }
  return groups.sort((a, b) => {
    const rd = RARITY_BY_ID[a.rarity].rank - RARITY_BY_ID[b.rarity].rank;
    return rd !== 0 ? rd : a.tier - b.tier || a.item.power - b.item.power;
  });
}

export function mergePreview(key) {
  const p = parseItemKey(key);
  const rank = RARITY_BY_ID[p.rarity].rank;
  if (rank >= RARITIES.length - 1) return null;
  const next = RARITIES[rank + 1];
  return getItem({ ...p, rarity: next.id });
}

export function stageLabel(chapter, stage) {
  return `${CHAPTERS[chapter - 1].numeral} · ${stage}`;
}

export function stageIndex(chapter, stage) {
  return (chapter - 1) * 5 + stage;
}

export function stageFromIndex(index) {
  return { chapter: Math.floor((index - 1) / 5) + 1, stage: ((index - 1) % 5) + 1 };
}

export function nextStage(chapter, stage) {
  if (stage < 5) return { chapter, stage: stage + 1 };
  if (chapter < CHAPTERS.length) return { chapter: chapter + 1, stage: 1 };
  return null;
}

export const MAX_LEVEL = 40;

export const RARITY_RULES = [
  { from: 'common', to: 'rare' },
  { from: 'rare', to: 'epic' },
  { from: 'epic', to: 'legendary' },
  { from: 'legendary', to: 'mythic' },
  { from: 'mythic', to: 'divine' },
];
