/* ---------------------------------------------------------------
   EMBERBOUND — static game data
   All balance numbers live here so the sim and the game agree.
   --------------------------------------------------------------- */

export const VERSION = 3;
export const SAVE_KEY = 'emberbound.save.v3';
export const MAX_LEVEL = 60;
export const ARENA = 1500;
export const PLAYER_R = 17;

export const BIOMES = {
  grove: {
    id: 'grove', name: 'Verdant Ruins', accent: '#6fd09a',
    floor: ['#15241f', '#0a1210'], fog: '#2d6b53', rock: '#233a31', rim: '#1b2c26',
    particle: '#8fe6b4', ambient: 'A ruined forest, still breathing.',
  },
  ember: {
    id: 'ember', name: 'Ashen Caverns', accent: '#ff9752',
    floor: ['#2a1813', '#130a09'], fog: '#7a2d18', rock: '#3a241d', rim: '#2a1713',
    particle: '#ffb36b', ambient: 'The mountain remembers every fire.',
  },
  frost: {
    id: 'frost', name: 'Frozen Spire', accent: '#8fdcff',
    floor: ['#152430', '#0a1119'], fog: '#2c6b86', rock: '#243b49', rim: '#172733',
    particle: '#c4f0ff', ambient: 'A silence sharp enough to cut.',
  },
  void: {
    id: 'void', name: 'Umbral Gate', accent: '#c48bff',
    floor: ['#1c1428', '#0c0814'], fog: '#5a2d88', rock: '#2d2140', rim: '#1a1228',
    particle: '#e0b6ff', ambient: 'Beyond the ninth gate, the dark is awake.',
  },
};

/* ---------------------------------------------------------------
   Classes
   --------------------------------------------------------------- */
export const CLASSES = {
  warrior: {
    id: 'warrior', name: 'Warrior', epithet: 'The Unbroken',
    role: 'Melee · Durable · Control',
    color: '#e0a15a', accent: '#ffd28a', dark: '#3a2412',
    glyph: 'sword',
    blurb: 'A wall of steel who thrives in the thick of battle. Cleaves through packs, shrugs off blows, and plants a banner no horde can break.',
    strengths: 'Highest health and defense. Basic attacks cleave every enemy in a wide arc.',
    weakness: 'Short reach. You must close the distance and commit.',
    passive: { name: 'Ironclad', desc: 'Takes 12% less damage from all sources. Healing received is increased by 15%.' },
    base: { hp: 265, atk: 17, def: 28, spd: 148, crit: 5, cdmg: 150 },
    attack: { type: 'melee', range: 124, arc: 2.15, cd: 0.62, mult: 1.12, lunge: 9 },
    skills: [
      { id: 'whirlwind', name: 'Whirlwind', icon: 'whirlwind', cd: 9, tag: 'Area', desc: 'Spin three times, striking every nearby foe. Take 40% less damage while spinning.' },
      { id: 'shieldbash', name: 'Shield Bash', icon: 'shieldbash', cd: 10, tag: 'Charge', desc: 'Charge forward. Enemies struck are shattered, stunned, and knocked back.' },
      { id: 'warbanner', name: 'War Banner', icon: 'banner', cd: 18, tag: 'Buff', desc: 'Plant a banner for 8s: +30% attack, +20% speed, and heal 18% of max health.' },
    ],
    tips: ['Cleave rewards fighting in the middle of a pack.', 'Shield Bash cancels boss wind-ups.', 'Whirlwind is your safest way out of trouble.'],
  },
  mage: {
    id: 'mage', name: 'Mage', epithet: 'The Starborn',
    role: 'Ranged · Area · Control',
    color: '#8f9cff', accent: '#d9d8ff', dark: '#1e2145',
    glyph: 'staff',
    blurb: 'Channels raw aether from a distance. Freezes packs solid, calls meteors from a clear sky, and blinks out of danger a heartbeat before it lands.',
    strengths: 'Long range, splash damage on every bolt, and the strongest area control in the game.',
    weakness: 'Fragile. Cornered and focused, a mage falls fast.',
    passive: { name: 'Arcane Echo', desc: 'Every basic-attack bolt detonates on impact, dealing 50% splash damage around the target.' },
    base: { hp: 158, atk: 22, def: 12, spd: 150, crit: 8, cdmg: 160 },
    attack: { type: 'projectile', range: 540, cd: 0.95, mult: 1.15, speed: 430, splash: 52, splashMult: 0.5, homing: 1.7, r: 6 },
    skills: [
      { id: 'frostnova', name: 'Frost Nova', icon: 'frost', cd: 9, tag: 'Freeze', desc: 'Freeze every enemy around you for 1.7s and deal heavy damage.' },
      { id: 'meteor', name: 'Meteor', icon: 'meteor', cd: 14, tag: 'Burst', desc: 'Call a meteor onto the nearest pack. Huge damage, then a burning crater for 3s.' },
      { id: 'blink', name: 'Blink', icon: 'blink', cd: 8, tag: 'Escape', desc: 'Teleport in your movement direction. Leave a rune that detonates and slows.' },
    ],
    tips: ['Arcane Echo makes clustered enemies melt.', 'Meteor rewards patience and a good prediction.', 'Blink has i-frames — use it through attacks, not away from them.'],
  },
  archer: {
    id: 'archer', name: 'Archer', epithet: 'The Deadeye',
    role: 'Ranged · Precision · Mobility',
    color: '#78d6a8', accent: '#d3ffe8', dark: '#14342a',
    glyph: 'bow',
    blurb: 'A nimble hunter who turns every opening into a kill. Fast arrows, brutal critical hits, and a shadow roll that slips out of any trap.',
    strengths: 'Highest single-target pressure. Every fourth arrow is a guaranteed critical hit.',
    weakness: 'Relies on spacing. Sustained pressure punishes poor positioning.',
    passive: { name: 'Deadeye', desc: 'Every 4th basic attack is a guaranteed critical hit. Arrows pierce one additional enemy.' },
    base: { hp: 180, atk: 19, def: 16, spd: 166, crit: 14, cdmg: 175 },
    attack: { type: 'arrow', range: 580, cd: 0.42, mult: 0.74, speed: 780, pierce: 1, r: 4 },
    skills: [
      { id: 'arrowrain', name: 'Arrow Rain', icon: 'rain', cd: 12, tag: 'Area', desc: 'Blanket an area with seven volleys of arrows that slow every enemy hit.' },
      { id: 'piercing', name: 'Piercing Shot', icon: 'pierce', cd: 9, tag: 'Line', desc: 'Fire a lance of an arrow that pierces every enemy in a line and knocks them back.' },
      { id: 'shadowroll', name: 'Shadow Roll', icon: 'roll', cd: 7.5, tag: 'Mobility', desc: 'Roll through danger. Your next three attacks are guaranteed critical hits.' },
    ],
    tips: ['Deadeye turns steady pressure into sudden bursts.', 'Arrow Rain slows a pack so you can kite it.', 'Shadow Roll is an offensive tool — crits win fights.'],
  },
};

/* ---------------------------------------------------------------
   Rarity + equipment
   --------------------------------------------------------------- */
export const RARITIES = [
  { id: 'common',    name: 'Common',    color: '#aeb6c1', mult: 1,    pct: 1,    value: 8,    aura: 'rgba(174,182,193,.28)' },
  { id: 'rare',      name: 'Rare',      color: '#59a7ff', mult: 2.2,  pct: 1.35, value: 32,   aura: 'rgba(89,167,255,.32)' },
  { id: 'epic',      name: 'Epic',      color: '#b97bff', mult: 4.8,  pct: 1.85, value: 120,  aura: 'rgba(185,123,255,.34)' },
  { id: 'legendary', name: 'Legendary', color: '#ffb454', mult: 10.5, pct: 2.5,  value: 460,  aura: 'rgba(255,180,84,.4)' },
  { id: 'mythic',    name: 'Mythic',    color: '#ff5f7d', mult: 23,   pct: 3.4,  value: 1800, aura: 'rgba(255,95,125,.46)' },
  { id: 'divine',    name: 'Divine',    color: '#fff1a8', mult: 50,   pct: 4.6,  value: 7200, aura: 'rgba(255,241,168,.55)' },
];
export const RARITY_BY_ID = Object.fromEntries(RARITIES.map(r => [r.id, r]));
export const RARITY_INDEX = Object.fromEntries(RARITIES.map((r, i) => [r.id, i]));

export const SLOTS = [
  { id: 'weapon',   name: 'Weapon',   icon: 'sword',      stats: { atk: 6, cdmg: 3 },        names: ['Iron Longsword', 'Tempered Blade', 'Runebound Saber', 'Sunsteel Edge', 'Astral Reaver', 'Godsfell'] },
  { id: 'armor',    name: 'Armor',    icon: 'armor',      stats: { hp: 42, def: 7 },         names: ["Traveler's Cuirass", 'Warden Plate', 'Runic Aegis', 'Emberforged Mail', 'Astral Carapace', 'Heart of the World'] },
  { id: 'bracelet', name: 'Bracelet', icon: 'bracelet',   stats: { atk: 4, crit: 1.2 },      names: ['Leather Cuff', 'Iron Bracer', 'Runed Manacle', 'Sunfire Bracer', 'Astral Coil', 'Band of Creation'] },
  { id: 'earrings', name: 'Earrings', icon: 'earrings',   stats: { crit: 1.5, spd: 5 },      names: ['Copper Studs', 'Silver Drops', 'Whisper Earrings', 'Starfall Earrings', 'Astral Echo', 'Whispers of Eternity'] },
  { id: 'helmet',   name: 'Helmet',   icon: 'helmet',     stats: { hp: 34, def: 5 },         names: ['Leather Cap', 'Iron Helm', 'Rune Crown', 'Ember Diadem', 'Astral Halo', 'Crown of the First Flame'] },
  { id: 'shield',   name: 'Shield',   icon: 'shield',     stats: { def: 9, hp: 26 },         names: ['Wooden Buckler', 'Tower Shield', 'Runewall', 'Sunforged Aegis', 'Astral Bastion', 'The Unbroken'] },
  { id: 'boots',    name: 'Boots',    icon: 'boots',      stats: { spd: 11, def: 3 },        names: ['Worn Boots', 'Iron Greaves', 'Windstep Boots', 'Emberstride', 'Astral Treads', 'Steps of the Sky'] },
  { id: 'necklace', name: 'Necklace', icon: 'necklace',   stats: { hp: 28, atk: 3 },         names: ['Bone Charm', 'Silver Locket', 'Emberheart Pendant', 'Sunflare Amulet', 'Astral Heart', 'Tear of the Dawn'] },
  { id: 'ring',     name: 'Ring',     icon: 'ring',       stats: { crit: 1.8, cdmg: 4 },     names: ['Copper Ring', 'Signet Ring', 'Band of Focus', 'Sunwheel Ring', 'Astral Loop', 'Ouroboros'] },
];
export const SLOT_BY_ID = Object.fromEntries(SLOTS.map(s => [s.id, s]));

export const SET_BONUSES = [
  { count: 3, mult: 0.05, label: '+5% Health, Attack & Defense' },
  { count: 6, mult: 0.10, label: '+10% Health, Attack & Defense' },
  { count: 9, mult: 0.16, label: '+16% Health, Attack & Defense' },
];

/* ---------------------------------------------------------------
   Enemies — base values at stage 1 before scaling
   --------------------------------------------------------------- */
export const ENEMIES = {
  crawler: {
    id: 'crawler', name: 'Thorn Crawler', hp: 38, atk: 7, def: 0, spd: 86, r: 14,
    xp: 7, gold: [2, 5], drop: 0.45, behavior: 'chase', color: '#6fbf87',
    attack: { range: 46, windup: 0.42, cd: 1.15, mult: 1.0, arc: 1.7 },
  },
  brute: {
    id: 'brute', name: 'Stone Brute', hp: 112, atk: 12, def: 8, spd: 50, r: 24,
    xp: 16, gold: [5, 10], drop: 0.6, behavior: 'chase', color: '#a68a74',
    attack: { range: 58, windup: 0.72, cd: 1.9, mult: 1.55, aoe: 66 },
  },
  wisp: {
    id: 'wisp', name: 'Ember Wisp', hp: 50, atk: 9, def: 2, spd: 72, r: 13,
    xp: 10, gold: [3, 7], drop: 0.5, behavior: 'ranged', color: '#ffb35e',
    preferred: 265, attack: { range: 330, windup: 0.52, cd: 1.85, mult: 1.0, projSpeed: 235, projR: 7 },
  },
  shade: {
    id: 'shade', name: 'Hollow Shade', hp: 64, atk: 10, def: 3, spd: 104, r: 15,
    xp: 13, gold: [4, 8], drop: 0.55, behavior: 'blink', color: '#9d86c8',
    attack: { range: 50, windup: 0.34, cd: 1.35, mult: 1.15, arc: 1.4 },
  },
  hexer: {
    id: 'hexer', name: 'Mire Hexer', hp: 76, atk: 8, def: 4, spd: 62, r: 16,
    xp: 15, gold: [5, 9], drop: 0.6, behavior: 'ranged', color: '#b0c46b',
    preferred: 300, attack: { range: 360, windup: 0.65, cd: 2.2, mult: 1.05, projSpeed: 205, projR: 9, slow: 0.42, slowT: 2.4 },
  },
  sentinel: {
    id: 'sentinel', name: 'Iron Sentinel', hp: 158, atk: 13, def: 15, spd: 44, r: 22,
    xp: 23, gold: [7, 12], drop: 0.7, behavior: 'chase', color: '#8e9bb0',
    attack: { range: 62, windup: 0.6, cd: 1.75, mult: 1.4, arc: 1.9 },
  },
};

/* ---------------------------------------------------------------
   Bosses
   --------------------------------------------------------------- */
export const BOSSES = {
  grovetender: {
    id: 'grovetender', name: 'The Grovetender', title: 'Warden of the Verdant Ruins',
    hpMult: 34, atkMult: 1.0, defMult: 1.1, r: 46, color: '#6fd09a', accent: '#d5ffb8',
    sequence: ['slam', 'seeds', 'summon', 'slam', 'roots'],
    phase2: ['roots', 'seeds', 'slam', 'summon', 'seeds'],
    intro: 'The roots remember every trespass.',
  },
  colossus: {
    id: 'colossus', name: 'Magma Colossus', title: 'Heart of the Ashen Caverns',
    hpMult: 40, atkMult: 1.12, defMult: 1.15, r: 52, color: '#ff8248', accent: '#ffd08a',
    sequence: ['charge', 'eruption', 'ring', 'charge', 'eruption'],
    phase2: ['eruption', 'ring', 'charge', 'eruption', 'ring'],
    intro: 'The mountain has decided you are fuel.',
  },
  warden: {
    id: 'warden', name: 'Frost Warden', title: 'Keeper of the Frozen Spire',
    hpMult: 46, atkMult: 1.24, defMult: 1.2, r: 50, color: '#8fdcff', accent: '#e6fbff',
    sequence: ['icefan', 'blizzard', 'blinkstrike', 'icefan', 'blizzard'],
    phase2: ['blizzard', 'blinkstrike', 'icefan', 'blizzard', 'blinkstrike'],
    intro: 'Warmth is a trespass here.',
  },
  sovereign: {
    id: 'sovereign', name: 'The Void Sovereign', title: 'Last Crown of the Ninth Rift',
    hpMult: 52, atkMult: 1.32, defMult: 1.25, r: 56, color: '#c48bff', accent: '#f2d8ff',
    sequence: ['voidbeam', 'rings', 'summon', 'voidbeam', 'rings'],
    phase2: ['rings', 'voidbeam', 'summon', 'rings', 'voidbeam'],
    intro: 'You have opened the door. It has been waiting.',
  },
};

/* ---------------------------------------------------------------
   Stages — 12 story stages + endless rift
   --------------------------------------------------------------- */
export const STAGES = [
  {
    id: 1, name: 'Verdant Threshold', biome: 'grove', par: 75, rec: 380,
    desc: 'The first step beyond the camp. Crawlers nest in the ruined road.',
    lootSlots: ['weapon', 'armor', 'boots', 'ring'],
    waves: [
      { enemies: [['crawler', 4]] },
      { enemies: [['crawler', 5]] },
      { enemies: [['crawler', 4], ['wisp', 2]] },
    ],
  },
  {
    id: 2, name: 'Mosslight Hollow', biome: 'grove', par: 90, rec: 470,
    desc: 'Lantern-moss lights a hollow where the wisps gather.',
    lootSlots: ['helmet', 'necklace', 'bracelet', 'weapon'],
    waves: [
      { enemies: [['crawler', 4], ['wisp', 2]] },
      { enemies: [['brute', 1], ['crawler', 4]] },
      { enemies: [['wisp', 3], ['crawler', 3], ['brute', 1]] },
    ],
  },
  {
    id: 3, name: 'The Old Grove', biome: 'grove', par: 120, rec: 620, boss: 'grovetender',
    desc: 'Something ancient tends the grove — and it does not welcome pruning.',
    lootSlots: ['weapon', 'armor', 'helmet', 'shield', 'earrings'],
    waves: [
      { enemies: [['crawler', 4], ['wisp', 2]] },
      { enemies: [['brute', 2], ['crawler', 3]] },
      { boss: 'grovetender', enemies: [['crawler', 2]] },
    ],
  },
  {
    id: 4, name: 'Emberfall Pass', biome: 'ember', par: 100, rec: 780,
    desc: 'Cinders drift like snow. The pass is watched by things that enjoy the heat.',
    lootSlots: ['armor', 'boots', 'bracelet', 'ring'],
    waves: [
      { enemies: [['crawler', 5], ['hexer', 1]] },
      { enemies: [['wisp', 3], ['crawler', 3]] },
      { enemies: [['brute', 2], ['hexer', 2], ['crawler', 2]] },
    ],
  },
  {
    id: 5, name: 'Cinder Warrens', biome: 'ember', par: 120, rec: 950,
    desc: 'Tunnels of glass and bone. Stone Brutes guard the deep seams.',
    lootSlots: ['weapon', 'helmet', 'shield', 'necklace'],
    waves: [
      { enemies: [['brute', 2], ['hexer', 2]] },
      { enemies: [['shade', 3], ['wisp', 2]] },
      { enemies: [['brute', 2], ['sentinel', 1], ['hexer', 2]] },
    ],
  },
  {
    id: 6, name: 'Molten Heart', biome: 'ember', par: 150, rec: 1180, boss: 'colossus',
    desc: 'The cavern opens onto a lake of slow fire. Something enormous is waking.',
    lootSlots: ['weapon', 'armor', 'bracelet', 'ring', 'earrings'],
    waves: [
      { enemies: [['brute', 2], ['hexer', 2], ['wisp', 2]] },
      { enemies: [['sentinel', 2], ['shade', 3]] },
      { boss: 'colossus', enemies: [['wisp', 2]] },
    ],
  },
  {
    id: 7, name: 'Rimeveil Steps', biome: 'frost', par: 120, rec: 1450,
    desc: 'A stair of blue ice climbs into silence. Shades move beneath it.',
    lootSlots: ['boots', 'helmet', 'necklace', 'weapon'],
    waves: [
      { enemies: [['shade', 3], ['wisp', 2]] },
      { enemies: [['sentinel', 2], ['hexer', 2]] },
      { enemies: [['shade', 4], ['sentinel', 2]] },
    ],
  },
  {
    id: 8, name: 'Frozen Reliquary', biome: 'frost', par: 135, rec: 1680,
    desc: 'The spire keeps its treasures behind walls of living frost.',
    lootSlots: ['armor', 'shield', 'bracelet', 'ring'],
    waves: [
      { enemies: [['sentinel', 2], ['hexer', 3]] },
      { enemies: [['brute', 3], ['shade', 3]] },
      { enemies: [['sentinel', 3], ['wisp', 3], ['hexer', 2]] },
    ],
  },
  {
    id: 9, name: 'The Shattered Spire', biome: 'frost', par: 165, rec: 1950, boss: 'warden',
    desc: 'The Warden has kept this vigil for a thousand years. It will not end today.',
    lootSlots: ['weapon', 'armor', 'helmet', 'shield', 'earrings'],
    waves: [
      { enemies: [['sentinel', 2], ['shade', 3], ['wisp', 2]] },
      { enemies: [['brute', 3], ['hexer', 2], ['sentinel', 2]] },
      { boss: 'warden', enemies: [['shade', 2]] },
    ],
  },
  {
    id: 10, name: 'Umbral Gate', biome: 'void', par: 130, rec: 2250,
    desc: 'The gate drinks the light. Beyond it, the Rift breathes.',
    lootSlots: ['weapon', 'bracelet', 'necklace', 'boots'],
    waves: [
      { enemies: [['shade', 4], ['hexer', 2]] },
      { enemies: [['sentinel', 3], ['wisp', 3]] },
      { enemies: [['shade', 4], ['brute', 2], ['hexer', 2]] },
    ],
  },
  {
    id: 11, name: 'Throne of Echoes', biome: 'void', par: 145, rec: 2580,
    desc: 'Every step repeats a step someone else took. None of them returned.',
    lootSlots: ['armor', 'helmet', 'shield', 'ring', 'earrings'],
    waves: [
      { enemies: [['sentinel', 3], ['shade', 4]] },
      { enemies: [['brute', 3], ['hexer', 3], ['wisp', 3]] },
      { enemies: [['sentinel', 3], ['shade', 3], ['brute', 3], ['hexer', 2]] },
    ],
  },
  {
    id: 12, name: 'The Ninth Rift', biome: 'void', par: 200, rec: 3000, boss: 'sovereign',
    desc: 'The last door. The crown beyond it was not made for mortal heads.',
    lootSlots: ['weapon', 'armor', 'bracelet', 'earrings', 'helmet', 'shield', 'boots', 'necklace', 'ring'],
    waves: [
      { enemies: [['shade', 4], ['sentinel', 3], ['wisp', 3]] },
      { enemies: [['brute', 3], ['hexer', 3], ['shade', 3], ['sentinel', 2]] },
      { boss: 'sovereign', enemies: [['shade', 2], ['wisp', 2]] },
    ],
  },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]));

/* Endless rift generator */
export function makeRiftStage(depth) {
  const d = Math.max(1, Math.floor(depth));
  const biomeIds = ['grove', 'ember', 'frost', 'void'];
  const biome = biomeIds[(d - 1) % biomeIds.length];
  const bosses = ['grovetender', 'colossus', 'warden', 'sovereign'];
  const boss = bosses[(d - 1) % bosses.length];
  const rec = Math.round(3000 * Math.pow(1.32, d));
  const pools = [
    [['crawler', 6], ['wisp', 3], ['hexer', 2]],
    [['shade', 5], ['brute', 3], ['sentinel', 2]],
    [['sentinel', 4], ['hexer', 3], ['wisp', 3], ['shade', 3]],
  ];
  return {
    id: 1000 + d, rift: true, depth: d, biome,
    name: `Rift ${d}`, par: 120 + d * 4, rec, boss,
    desc: `An unstable fold of the Rift. Depth ${d} burns with ${BIOMES[biome].name.toLowerCase()} echoes.`,
    lootSlots: SLOTS.map(s => s.id),
    waves: [
      { enemies: pools[(d - 1) % 3].map(([t, n]) => [t, n + 1]) },
      { enemies: pools[d % 3].map(([t, n]) => [t, n + 1]) },
      { boss, enemies: [['shade', 2], ['wisp', 2]] },
    ],
  };
}

/* ---------------------------------------------------------------
   Shop
   --------------------------------------------------------------- */
export const SHOP = [
  {
    id: 'cache', name: 'Sealed Cache', icon: 'chest',
    desc: 'One piece of gear from a slot of your choice. Rarity weighted by your deepest cleared stage.',
    base: 140, growth: 34,
  },
  {
    id: 'grand', name: 'Grand Cache', icon: 'chest2',
    desc: 'Five pieces from a chosen slot, with a greatly increased chance of rare and better gear.',
    base: 600, growth: 120, boost: 2.2, count: 5,
  },
  {
    id: 'offering', name: 'Ember Offering', icon: 'flame',
    desc: 'A one-time blessing for your next run: +12% maximum health and +8% attack.',
    base: 260, growth: 0, oneShot: true,
  },
];

export const RIFT_UNLOCK_STAGE = 12;
export const TUTORIAL_KEY = 'emberbound.tutorial.v3';

export const TIPS = [
  'Every 4 identical pieces can be fused into the next rarity at the Forge.',
  'Equip the highest rarity in every slot. Set bonuses reward matching rarities.',
  'Bosses are strongest at range — close the gap or break line of sight.',
  'Healing motes drop from fallen enemies. Do not be proud; walk over them.',
  'Death keeps your gold, but forfeits the run\'s loot. Revive if you can afford it.',
  'The Rift never ends. Its depths scale forever — and so does its loot.',
  'Shop caches let you target a stubborn equipment slot.',
  'Skills have i-frames. The best dodge is the one that also hits back.',
];
