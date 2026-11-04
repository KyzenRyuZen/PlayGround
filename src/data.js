// ============================================================
// AETHERIA — STATIC GAME DATA
// ============================================================

export const FACTIONS = {
  angel: {
    id: 'angel',
    name: 'Angels',
    title: 'Children of the Dawn',
    lore: 'Winged wardens of the high aether. Their light is a promise, their judgement a blade.',
    colors: { primary: '#f4e7c3', secondary: '#e8b54a', metal: '#d9c27a', skin: '#f0c9a4', accent: '#fff3c4', glow: '#ffe9a3' },
    eyes: ['#3f8cff', '#2f7a4d', '#7a4b2a'],
    wingPalette: ['#fff8df', '#ffe9a3', '#e8c46a', '#c79a3c']
  },
  demon: {
    id: 'demon',
    name: 'Demons',
    title: 'Heirs of the Ember',
    lore: 'Born beneath a crimson sky, demons trade in fire and old bargains. Their wings remember the abyss.',
    colors: { primary: '#3a2438', secondary: '#b13a4a', metal: '#7c3448', skin: '#d19584', accent: '#ff6b57', glow: '#ff7a5e' },
    eyes: ['#3f8cff', '#2f7a4d', '#7a4b2a'],
    wingPalette: ['#2b1728', '#5a2031', '#9b3243', '#d94a4a']
  }
};

export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    archetype: 'Strength',
    desc: 'A storm of steel. Heavy armor and a greatsword turn raw Strength into devastating melee damage.',
    primary: 'str',
    primaryName: 'Strength',
    armor: 'heavy',
    weapon: 'sword',
    base: { str: 12, int: 3, dex: 5, vit: 15 },
    growth: { str: 2.3, int: 0.25, dex: 0.4, vit: 2.5 },
    colors: { cloth: '#8f2d33', cloth2: '#5e1f2a', metal: '#9aa4b5', metal2: '#5c6678', trim: '#d5a44c', hair: '#5b3a25' },
    skill: {
      id: 'whirlwind',
      name: 'Whirlwind',
      desc: 'Spin with your blade, striking every nearby enemy.',
      icon: '⚔',
      cooldown: 7,
      radius: 2.5,
      multiplier: 2.1,
      mana: 16
    }
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    archetype: 'Intelligence',
    desc: 'Keeper of the arcane. Robes and staves amplify Intelligence into world-shaking spells.',
    primary: 'int',
    primaryName: 'Intelligence',
    armor: 'robes',
    weapon: 'staff',
    base: { str: 3, int: 14, dex: 5, vit: 9 },
    growth: { str: 0.25, int: 2.6, dex: 0.4, vit: 1.8 },
    colors: { cloth: '#274a8f', cloth2: '#1a2f63', metal: '#c8a84f', metal2: '#7a6227', trim: '#79d6ff', hair: '#d8d2c4' },
    skill: {
      id: 'nova',
      name: 'Arcane Nova',
      desc: 'Detonate a ring of arcane force, damaging and briefly stunning nearby foes.',
      icon: '✦',
      cooldown: 8.5,
      radius: 3.1,
      multiplier: 2.7,
      mana: 28
    }
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    archetype: 'Dexterity',
    desc: 'A whisper in the trees. Light armor and a longbow turn Dexterity into a rain of arrows.',
    primary: 'dex',
    primaryName: 'Dexterity',
    armor: 'light',
    weapon: 'bow',
    base: { str: 5, int: 4, dex: 14, vit: 10 },
    growth: { str: 0.4, int: 0.35, dex: 2.7, vit: 1.9 },
    colors: { cloth: '#2f6b4f', cloth2: '#1e4736', metal: '#8f7b50', metal2: '#5a4c2e', trim: '#a8e07a', hair: '#7a3f22' },
    skill: {
      id: 'arrowstorm',
      name: 'Arrow Storm',
      desc: 'Loose a volley of arrows at up to six enemies around you.',
      icon: '➶',
      cooldown: 7.5,
      radius: 5.2,
      multiplier: 1.35,
      mana: 22
    }
  }
};

export const SLOTS = [
  { id: 'weapon', name: 'Weapon', icon: '🗡', base: 10 },
  { id: 'helmet', name: 'Helmet', icon: '⛑', base: 5 },
  { id: 'chest', name: 'Chest', icon: '🛡', base: 8 },
  { id: 'gloves', name: 'Gloves', icon: '🧤', base: 4 },
  { id: 'pants', name: 'Pants', icon: '👖', base: 5 },
  { id: 'boots', name: 'Boots', icon: '🥾', base: 4 },
  { id: 'necklace', name: 'Necklace', icon: '📿', base: 2 },
  { id: 'chain', name: 'Chain', icon: '⛓', base: 2 },
  { id: 'earrings', name: 'Earrings', icon: '💎', base: 2 }
];

export const RARITIES = {
  common:    { id: 'common',    name: 'Common',    order: 0, color: '#c7c7c7', glow: '#9d9d9d', value: 1.0,  statMult: 1.0,  affixes: 0, directDrop: true },
  grey:      { id: 'grey',      name: 'Grey',      order: 1, color: '#9aa0a6', glow: '#7d838a', value: 1.15, statMult: 1.12, affixes: 0, directDrop: true },
  green:     { id: 'green',     name: 'Green',     order: 2, color: '#65d67a', glow: '#37b558', value: 1.6,  statMult: 1.5,  affixes: 1, directDrop: true },
  blue:      { id: 'blue',      name: 'Blue',      order: 3, color: '#5aa9ff', glow: '#2d7de0', value: 2.4,  statMult: 2.2,  affixes: 1, directDrop: true },
  epic:      { id: 'epic',      name: 'Epic',      order: 4, color: '#b079ff', glow: '#7b3ddb', value: 3.7,  statMult: 3.15, affixes: 2, directDrop: false },
  legendary: { id: 'legendary', name: 'Legendary', order: 5, color: '#ffb23e', glow: '#ff7a18', value: 6.0,  statMult: 4.8,  affixes: 3, directDrop: false },
  mythic:    { id: 'mythic',    name: 'Mythic',    order: 6, color: '#ff4d6d', glow: '#ff1744', value: 10.0, statMult: 7.5,  affixes: 4, directDrop: false },
  divine:    { id: 'divine',    name: 'Divine',    order: 7, color: '#fff2a8', glow: '#ffdf37', value: 18.0, statMult: 12.0, affixes: 5, directDrop: false }
};
export const RARITY_ORDER = ['common', 'grey', 'green', 'blue', 'epic', 'legendary', 'mythic', 'divine'];
export const DIRECT_DROP_RARITIES = ['common', 'grey', 'green', 'blue'];

export const TIERS = {
  3: { id: 3, name: 'T3', label: 'III', glow: 0, mult: 1.0 },
  2: { id: 2, name: 'T2', label: 'II', glow: 1, mult: 1.38 },
  1: { id: 1, name: 'T1', label: 'I', glow: 2, mult: 1.85 }
};

export const EYE_COLORS = [
  { id: 'blue', name: 'Azure', color: '#3f8cff' },
  { id: 'green', name: 'Verdant', color: '#2f8a4d' },
  { id: 'brown', name: 'Amber', color: '#8a572a' }
];

export const HAIR_STYLES = {
  male: [
    { id: 'short', name: 'Cropped', type: 'short' },
    { id: 'swept', name: 'Swept Back', type: 'swept' },
    { id: 'braid', name: 'Warrior Braid', type: 'braid' },
    { id: 'wild', name: 'Wild Mane', type: 'wild' },
    { id: 'topknot', name: 'Topknot', type: 'topknot' }
  ],
  female: [
    { id: 'long', name: 'Long Waves', type: 'long' },
    { id: 'ponytail', name: 'High Ponytail', type: 'pony' },
    { id: 'braids', name: 'Twin Braids', type: 'twin' },
    { id: 'bob', name: 'Moon Bob', type: 'bob' },
    { id: 'bun', name: 'Aether Bun', type: 'bun' }
  ]
};
export const HAIR_COLORS = [
  { id: 'raven', name: 'Raven', color: '#2d2530' },
  { id: 'chestnut', name: 'Chestnut', color: '#6b3b24' },
  { id: 'gold', name: 'Gilded', color: '#d8b05c' },
  { id: 'silver', name: 'Silver', color: '#d5d4d8' },
  { id: 'crimson', name: 'Crimson', color: '#9a2f3c' }
];

// ------------------------------------------------------------------
// REGIONS
// ------------------------------------------------------------------
export const REGIONS = {
  greendale: {
    id: 'greendale', name: 'Greendale', epithet: 'Where the World Wakes',
    lore: 'Soft hills, old oaks and the smell of rain. Greendale is the last peaceful place before the wilds begin.',
    levelRange: [1, 8], teleportTier: 'same', order: 0, size: 34,
    spawn: [17, 20], village: [17, 16], lair: [28, 27],
    palette: { sky: '#0c1d1a', ground1: '#3d6b40', ground2: '#47774a', ground3: '#335c37', path: '#7d6a45', water: '#2b6d78', accent: '#a8e06a', fog: 'rgba(130,210,150,0.05)' },
    ground: 'grass', weather: 'leaves', props: ['oak', 'oak', 'bush', 'rock', 'flowers', 'stump', 'oak'],
    material: { id: 'mat_silverleaf', name: 'Silverleaf', icon: '🌿' },
    monsters: ['slime', 'wolf', 'bandit'], boss: 'treant',
    hubName: 'Greendale Village'
  },
  ironcrag: {
    id: 'ironcrag', name: 'Ironcrag', epithet: 'The Anvil of the North',
    lore: 'Rust-red cliffs ring ancient forges. Every echo here sounds like a hammer falling.',
    levelRange: [6, 16], teleportTier: 'nearby', order: 1, size: 34,
    spawn: [16, 20], village: [16, 16], lair: [28, 27],
    palette: { sky: '#1b120d', ground1: '#6b5541', ground2: '#776048', ground3: '#584536', path: '#8a6b46', water: '#3d4b4a', accent: '#ff9c4a', fog: 'rgba(255,140,70,0.05)' },
    ground: 'rock', weather: 'embers', props: ['rock', 'rock', 'pine', 'ore', 'boulder', 'forge', 'rock'],
    material: { id: 'mat_iron_ore', name: 'Iron Ore', icon: '⛏' },
    monsters: ['boar', 'golem', 'iron_bandit'], boss: 'behemoth',
    hubName: 'Cragfall Outpost'
  },
  venomwood: {
    id: 'venomwood', name: 'Venomwood', epithet: 'The Breathing Dark',
    lore: 'The trees here lean toward travelers. Mushrooms glow with a poison light. Nothing in Venomwood sleeps.',
    levelRange: [12, 24], teleportTier: 'medium', order: 2, size: 36,
    spawn: [17, 21], village: [17, 17], lair: [29, 28],
    palette: { sky: '#101021', ground1: '#2e4a37', ground2: '#365540', ground3: '#253c2e', path: '#5e4d5d', water: '#3a6b4b', accent: '#b678ff', fog: 'rgba(140,90,210,0.09)' },
    ground: 'moss', weather: 'spores', props: ['mushroom', 'mushroom', 'dead_tree', 'bush', 'spiderweb', 'rock', 'mushroom'],
    material: { id: 'mat_spider_silk', name: 'Venom Silk', icon: '🕸' },
    monsters: ['spider', 'lurker', 'toad'], boss: 'broodmother',
    hubName: 'Thornwatch Camp'
  },
  mistgrave: {
    id: 'mistgrave', name: 'Mistgrave', epithet: 'The Silent Choir',
    lore: 'A drowned graveyard wrapped in cold mist. The dead do not rest; they wait.',
    levelRange: [18, 30], teleportTier: 'medium', order: 3, size: 36,
    spawn: [17, 21], village: [17, 17], lair: [29, 28],
    palette: { sky: '#0c1420', ground1: '#3a4450', ground2: '#434e5a', ground3: '#2c343e', path: '#555b60', water: '#26404f', accent: '#78c8ff', fog: 'rgba(110,160,210,0.11)' },
    ground: 'stone', weather: 'mist', props: ['gravestone', 'dead_tree', 'bone', 'crypt', 'gravestone', 'rock', 'candle'],
    material: { id: 'mat_grave_dust', name: 'Grave Dust', icon: '🕯' },
    monsters: ['wraith', 'skeleton', 'crypt_hound'], boss: 'grave_tyrant',
    hubName: 'Mistwatch Priory'
  },
  frostpeak: {
    id: 'frostpeak', name: 'Frostpeak', epithet: 'The White Silence',
    lore: 'A crown of ice above the clouds. The wind carries the names of everyone who ever froze here.',
    levelRange: [24, 36], teleportTier: 'far', order: 4, size: 36,
    spawn: [17, 21], village: [17, 17], lair: [29, 28],
    palette: { sky: '#0d1a24', ground1: '#d7e4ee', ground2: '#c5d6e2', ground3: '#aec4d4', path: '#8b9cae', water: '#5f9fbf', accent: '#8fe2ff', fog: 'rgba(190,230,255,0.10)' },
    ground: 'snow', weather: 'snow', props: ['pine_snow', 'ice', 'rock_snow', 'pine_snow', 'crystal', 'snowman', 'pine_snow'],
    material: { id: 'mat_frost_fang', name: 'Frost Fang', icon: '❄' },
    monsters: ['frost_wolf', 'ice_elemental', 'yeti'], boss: 'colossus',
    hubName: 'Hoarfrost Camp'
  },
  sunscorch: {
    id: 'sunscorch', name: 'Sunscorch Desert', epithet: 'The Golden Wound',
    lore: 'An ocean of glass and sand beneath a merciless sun. The ruins remember a king who tried to eat the sky.',
    levelRange: [30, 42], teleportTier: 'far', order: 5, size: 38,
    spawn: [18, 22], village: [18, 18], lair: [31, 30],
    palette: { sky: '#2a1a0c', ground1: '#d9b56b', ground2: '#e6c67d', ground3: '#c5a05a', path: '#b98d4a', water: '#3f8d93', accent: '#ffd36b', fog: 'rgba(255,200,100,0.06)' },
    ground: 'sand', weather: 'sand', props: ['cactus', 'dune', 'pillar', 'bones', 'palm', 'obelisk', 'cactus'],
    material: { id: 'mat_sun_relic', name: 'Sun Relic', icon: '☀' },
    monsters: ['scarab', 'raider', 'scorpion'], boss: 'sand_wyrm',
    hubName: 'Mirage Bazaar'
  },
  ashen: {
    id: 'ashen', name: 'Ashen Dominion', epithet: 'The Crown of Cinders',
    lore: 'The demons built a kingdom on the bones of a dead god. Its rivers run red and its throne is never empty.',
    levelRange: [36, 48], teleportTier: 'endgame', order: 6, size: 38,
    spawn: [18, 22], village: [18, 18], lair: [31, 30],
    palette: { sky: '#1a0708', ground1: '#4a2b2b', ground2: '#573232', ground3: '#3b2222', path: '#6b3a2d', water: '#b23418', accent: '#ff6a3d', fog: 'rgba(255,70,40,0.09)' },
    ground: 'ash', weather: 'embers', props: ['obsidian', 'lava_rock', 'dead_tree', 'spike', 'brazier', 'rubble', 'obsidian'],
    material: { id: 'mat_ashen_cinder', name: 'Ashen Cinder', icon: '🔥' },
    monsters: ['ash_demon', 'magma_hound', 'obsidian_knight'], boss: 'ashen_lord',
    hubName: 'Cinderhold Bastion'
  },
  tower: {
    id: 'tower', name: 'Tower of Eternity', epithet: 'The Last Question',
    lore: 'A spire outside of time. Every step is a memory. At its summit, something has been waiting for you.',
    levelRange: [45, 60], teleportTier: 'endgame', order: 7, size: 38,
    spawn: [18, 23], village: [18, 19], lair: [31, 31],
    palette: { sky: '#080716', ground1: '#2b2a55', ground2: '#343366', ground3: '#232246', path: '#514c8a', water: '#5b4fc4', accent: '#a99bff', fog: 'rgba(130,110,255,0.10)' },
    ground: 'void', weather: 'stars', props: ['void_crystal', 'rune', 'pillar', 'void_crystal', 'star_well', 'rune', 'void_crystal'],
    material: { id: 'mat_void_shard', name: 'Void Shard', icon: '✦' },
    monsters: ['void_sentinel', 'astral_wraith', 'seraph'], boss: 'eternal_guardian',
    hubName: 'Threshold of Eternity'
  }
};

export const REGION_ORDER = ['greendale', 'ironcrag', 'venomwood', 'mistgrave', 'frostpeak', 'sunscorch', 'ashen', 'tower'];

// ------------------------------------------------------------------
// MONSTERS
// ------------------------------------------------------------------
const M = (id, name, kind, level, hp, atk, xp, gold, color, extra = {}) => ({
  id, name, kind, level, hp, atk, xp, gold, color,
  speed: extra.speed ?? 1.5, radius: extra.radius ?? 0.32, range: extra.range ?? 1.15,
  aggro: extra.aggro ?? 5.2, attackSpeed: extra.attackSpeed ?? 1.7,
  boss: extra.boss ?? false, scale: extra.scale ?? 1, elite: extra.elite ?? false,
  mat: extra.mat ?? null
});

export const MONSTERS = {
  // Greendale
  slime: M('slime', 'Meadow Slime', 'slime', 1, 65, 6, 28, 55, '#7bd66b', { speed: 1.0, range: 1.0, aggro: 4 }),
  wolf: M('wolf', 'Greyfang Wolf', 'wolf', 4, 170, 14, 68, 95, '#8b8f98', { speed: 2.3 }),
  bandit: M('bandit', 'Roadside Bandit', 'humanoid', 6, 260, 20, 96, 150, '#a45a3c'),
  treant: M('treant', 'Elder Treant', 'tree', 9, 2100, 32, 900, 1800, '#5e8c46', { boss: true, speed: 1.1, radius: 0.7, range: 1.7, aggro: 7, scale: 1.5, attackSpeed: 2.4, mat: 'mat_silverleaf' }),

  // Ironcrag
  boar: M('boar', 'Crag Boar', 'boar', 8, 430, 26, 150, 190, '#8a5a3c', { speed: 1.9 }),
  golem: M('golem', 'Iron Golem', 'golem', 11, 900, 38, 240, 290, '#7d848c', { speed: 1.0, radius: 0.46, attackSpeed: 2.2 }),
  iron_bandit: M('iron_bandit', 'Forge Renegade', 'humanoid', 13, 780, 45, 290, 330, '#b05e38', { speed: 2.0 }),
  behemoth: M('behemoth', 'Ironhide Behemoth', 'golem', 16, 5600, 72, 2400, 4500, '#8f744c', { boss: true, speed: 1.2, radius: 0.85, range: 1.9, aggro: 7, scale: 1.7, attackSpeed: 2.5, mat: 'mat_iron_ore' }),

  // Venomwood
  spider: M('spider', 'Venom Spider', 'spider', 14, 1050, 48, 320, 350, '#6f4a86', { speed: 2.1, range: 1.3 }),
  lurker: M('lurker', 'Bog Lurker', 'lurker', 17, 1600, 60, 410, 420, '#4c6b44', { speed: 1.3, radius: 0.48 }),
  toad: M('toad', 'Plague Toad', 'toad', 19, 1350, 54, 380, 460, '#7aaa58', { speed: 1.5, range: 1.6 }),
  broodmother: M('broodmother', 'The Broodmother', 'spider', 23, 9800, 105, 5200, 7800, '#9250b0', { boss: true, speed: 1.5, radius: 0.9, range: 2.0, aggro: 8, scale: 1.9, attackSpeed: 1.8, mat: 'mat_spider_silk' }),

  // Mistgrave
  wraith: M('wraith', 'Mist Wraith', 'ghost', 21, 1900, 74, 470, 520, '#7aa8c8', { speed: 1.7, range: 1.7 }),
  skeleton: M('skeleton', 'Oathbound Skeleton', 'skeleton', 24, 2500, 88, 550, 590, '#cfd3cd', { speed: 1.8 }),
  crypt_hound: M('crypt_hound', 'Crypt Hound', 'hound', 26, 2200, 96, 580, 630, '#5c5c6e', { speed: 2.5 }),
  grave_tyrant: M('grave_tyrant', 'The Grave Tyrant', 'skeleton', 30, 16500, 145, 8200, 12500, '#9d7bc4', { boss: true, speed: 1.5, radius: 0.9, range: 2.0, aggro: 8, scale: 1.9, attackSpeed: 1.9, mat: 'mat_grave_dust' }),

  // Frostpeak
  frost_wolf: M('frost_wolf', 'Frost Wolf', 'wolf', 27, 2800, 112, 620, 680, '#b9dbe8', { speed: 2.5 }),
  ice_elemental: M('ice_elemental', 'Ice Elemental', 'elemental', 30, 3600, 125, 730, 790, '#85d6f0', { speed: 1.3, range: 1.8 }),
  yeti: M('yeti', 'Rime Yeti', 'yeti', 32, 4700, 138, 850, 900, '#dbe9ec', { speed: 1.7, radius: 0.5 }),
  colossus: M('colossus', 'Frost Colossus', 'elemental', 36, 24000, 195, 12500, 19000, '#9ae3ff', { boss: true, speed: 1.2, radius: 1.0, range: 2.2, aggro: 8, scale: 2.0, attackSpeed: 2.1, mat: 'mat_frost_fang' }),

  // Sunscorch
  scarab: M('scarab', 'Sun Scarab', 'scarab', 33, 4200, 150, 900, 950, '#d9a63c', { speed: 2.2 }),
  raider: M('raider', 'Dune Raider', 'humanoid', 36, 5000, 165, 1050, 1100, '#c78c4a', { speed: 2.1 }),
  scorpion: M('scorpion', 'Dune Scorpion', 'scorpion', 38, 5800, 178, 1180, 1200, '#b98b48', { speed: 1.9, range: 1.5 }),
  sand_wyrm: M('sand_wyrm', 'The Sand Wyrm', 'wyrm', 42, 36000, 245, 19000, 28000, '#e0b75c', { boss: true, speed: 1.4, radius: 1.1, range: 2.4, aggro: 9, scale: 2.2, attackSpeed: 2.0, mat: 'mat_sun_relic' }),

  // Ashen Dominion
  ash_demon: M('ash_demon', 'Ash Demon', 'demon', 39, 6400, 195, 1300, 1350, '#d9553c', { speed: 2.2 }),
  magma_hound: M('magma_hound', 'Magma Hound', 'hound', 42, 7200, 215, 1450, 1500, '#ff7a3c', { speed: 2.6 }),
  obsidian_knight: M('obsidian_knight', 'Obsidian Knight', 'knight', 45, 9200, 245, 1700, 1750, '#6b3d55', { speed: 1.8, radius: 0.46 }),
  ashen_lord: M('ashen_lord', 'The Ashen Lord', 'demon', 49, 52000, 320, 28000, 42000, '#ff5a3c', { boss: true, speed: 1.6, radius: 1.1, range: 2.2, aggro: 9, scale: 2.3, attackSpeed: 1.8, mat: 'mat_ashen_cinder' }),

  // Tower of Eternity
  void_sentinel: M('void_sentinel', 'Void Sentinel', 'sentinel', 47, 9000, 255, 1800, 1850, '#7b67e8', { speed: 1.9 }),
  astral_wraith: M('astral_wraith', 'Astral Wraith', 'ghost', 50, 10500, 285, 2000, 2050, '#b79cff', { speed: 2.1, range: 1.8 }),
  seraph: M('seraph', 'Fallen Seraph', 'seraph', 53, 12500, 320, 2350, 2400, '#ffe6a4', { speed: 2.2 }),
  eternal_guardian: M('eternal_guardian', 'The Eternal Guardian', 'sentinel', 60, 88000, 460, 60000, 90000, '#c9b4ff', { boss: true, speed: 1.5, radius: 1.2, range: 2.6, aggro: 10, scale: 2.5, attackSpeed: 1.7, mat: 'mat_void_shard' })
};

// ------------------------------------------------------------------
// NPCS
// ------------------------------------------------------------------
export const NPCS = {
  elder_mara: { id: 'elder_mara', name: 'Elder Mara', role: 'Quest Keeper', icon: '❖', color: '#d9c07a', region: 'greendale', dx: -2.5, dy: -1.5, greeting: 'The wind carries trouble from every corner of Aetheria. Will you answer?' },
  blacksmith_borin: { id: 'blacksmith_borin', name: 'Borin the Anvil', role: 'Blacksmith', icon: '⚒', color: '#c17a4a', region: 'greendale', dx: 2.4, dy: -1.2, greeting: 'Four of a kind make something finer. That is the law of the forge.' },
  potion_lina: { id: 'potion_lina', name: 'Lina', role: 'Potion Merchant', icon: '⚗', color: '#69c5a8', region: 'greendale', dx: -3.2, dy: 2.2, greeting: 'Potions by the hundred. A wise adventurer never travels light.' },
  teleporter_sera: { id: 'teleporter_sera', name: 'Sera', role: 'Teleporter', icon: '✧', color: '#8d8bff', region: 'greendale', dx: 3.1, dy: 2.1, greeting: 'The leylines are restless today. Where shall I send you?' },
  storage_grim: { id: 'storage_grim', name: 'Grim', role: 'Storage', icon: '▤', color: '#9d9d86', region: 'greendale', dx: 0.6, dy: 3.6, greeting: 'Your belongings are safe with me. Mostly.' },
  enchanter_vex: { id: 'enchanter_vex', name: 'Vex', role: 'Enchanter', icon: '◈', color: '#d17ad9', region: 'greendale', dx: -0.8, dy: -3.8, greeting: 'Boss stones carry old power. I can bind them to your gear. For a price.' },
  market_tomas: { id: 'market_tomas', name: 'Tomas', role: 'Market Stall', icon: '⚖', color: '#d8a55a', region: 'greendale', dx: 3.8, dy: -3.2, greeting: 'Five thousand gold for a stall, twenty-four hours of trade. No tax, no questions.' },

  scout_kael: { id: 'scout_kael', name: 'Scout Kael', role: 'Quest Keeper', icon: '❖', color: '#d9a77a', region: 'ironcrag', dx: -1.8, dy: -1.4, greeting: 'The mountain eats the careless. Keep your blade close.' },
  porter_durn: { id: 'porter_durn', name: 'Porter Durn', role: 'Teleporter', icon: '✧', color: '#a3a3ff', region: 'ironcrag', dx: 1.8, dy: -1.4, greeting: 'Leyline hub, Cragfall branch. Destinations, please.' },
  scout_ivy: { id: 'scout_ivy', name: 'Scout Ivy', role: 'Quest Keeper', icon: '❖', color: '#a5d9a0', region: 'venomwood', dx: -1.8, dy: -1.4, greeting: 'Do not touch the glowing mushrooms. Or do. I am not your mother.' },
  porter_nyx: { id: 'porter_nyx', name: 'Porter Nyx', role: 'Teleporter', icon: '✧', color: '#b3a0ff', region: 'venomwood', dx: 1.8, dy: -1.4, greeting: 'The leylines hum louder in the swamp. Mind the frogs.' },
  scout_edric: { id: 'scout_edric', name: 'Scout Edric', role: 'Quest Keeper', icon: '❖', color: '#aec6d9', region: 'mistgrave', dx: -1.8, dy: -1.4, greeting: 'The dead are polite here. They only scream at night.' },
  porter_mora: { id: 'porter_mora', name: 'Porter Mora', role: 'Teleporter', icon: '✧', color: '#9fb7ff', region: 'mistgrave', dx: 1.8, dy: -1.4, greeting: 'Mistwatch Priory, at your service.' },
  scout_bryn: { id: 'scout_bryn', name: 'Scout Bryn', role: 'Quest Keeper', icon: '❖', color: '#bfe9ff', region: 'frostpeak', dx: -1.8, dy: -1.4, greeting: 'Keep moving or the cold will make a statue of you.' },
  porter_yle: { id: 'porter_yle', name: 'Porter Yle', role: 'Teleporter', icon: '✧', color: '#a9d9ff', region: 'frostpeak', dx: 1.8, dy: -1.4, greeting: 'Hoarfrost Camp. Warm socks available for a fee. No refunds.' },
  scout_sun: { id: 'scout_sun', name: 'Scout Sunder', role: 'Quest Keeper', icon: '❖', color: '#ffd27a', region: 'sunscorch', dx: -1.8, dy: -1.4, greeting: 'The desert takes everything. Bring water and a bad temper.' },
  porter_aziz: { id: 'porter_aziz', name: 'Porter Aziz', role: 'Teleporter', icon: '✧', color: '#ffe1a0', region: 'sunscorch', dx: 1.8, dy: -1.4, greeting: 'Mirage Bazaar. All roads are illusions, but the fee is real.' },
  scout_vale: { id: 'scout_vale', name: 'Scout Vale', role: 'Quest Keeper', icon: '❖', color: '#ffb08a', region: 'ashen', dx: -1.8, dy: -1.4, greeting: 'The Dominion knows we are here. Make it regret that.' },
  porter_skar: { id: 'porter_skar', name: 'Porter Skar', role: 'Teleporter', icon: '✧', color: '#ff9a7a', region: 'ashen', dx: 1.8, dy: -1.4, greeting: 'Cinderhold. Stand clear of the gate when it opens.' },
  scout_lyra: { id: 'scout_lyra', name: 'Scout Lyra', role: 'Quest Keeper', icon: '❖', color: '#c9b4ff', region: 'tower', dx: -1.8, dy: -1.4, greeting: 'We are standing outside of time. Try not to think about it.' },
  porter_oh: { id: 'porter_oh', name: 'Porter Oh', role: 'Teleporter', icon: '✧', color: '#b7a8ff', region: 'tower', dx: 1.8, dy: -1.4, greeting: 'The Threshold. The last stop. Possibly.' }
};

// ------------------------------------------------------------------
// DUNGEONS — instanced runs launched from the teleporter
// ------------------------------------------------------------------
export const DUNGEONS = [
  { id: 'forge', name: 'The Molten Foundry', region: 'ironcrag', level: 16, cost: 25000, boss: 'behemoth', desc: 'A sealed forge where iron remembers the shape of a god.', minions: ['boar', 'golem', 'iron_bandit'] },
  { id: 'crypt', name: 'Sunken Crypt', region: 'mistgrave', level: 28, cost: 30000, boss: 'grave_tyrant', desc: 'A drowned royal tomb. The choir beneath the water never stops.', minions: ['wraith', 'skeleton', 'crypt_hound'] },
  { id: 'brood', name: 'Whispering Depths', region: 'venomwood', level: 24, cost: 25000, boss: 'broodmother', desc: 'Silk tunnels below Venomwood, warm and breathing.', minions: ['spider', 'lurker', 'toad'] },
  { id: 'sepulcher', name: 'Frozen Sepulcher', region: 'frostpeak', level: 36, cost: 35000, boss: 'colossus', desc: 'A tomb of blue ice. Something enormous is frozen upright.', minions: ['frost_wolf', 'ice_elemental', 'yeti'] },
  { id: 'sun_king', name: 'Tomb of the Sun King', region: 'sunscorch', level: 42, cost: 45000, boss: 'sand_wyrm', desc: 'The buried palace of a king who refused the sky.', minions: ['scarab', 'raider', 'scorpion'] },
  { id: 'eternal_spire', name: 'The Eternal Spire', region: 'tower', level: 58, cost: 50000, boss: 'eternal_guardian', desc: 'The final ascent. Every floor is the same floor.', minions: ['void_sentinel', 'astral_wraith', 'seraph'] }
];

// ------------------------------------------------------------------
// QUESTS
// ------------------------------------------------------------------
export const QUESTS = [
  // Main chain
  { id: 'main1', chain: 'main', title: 'A New Dawn', region: 'greendale', level: 1, giver: 'Elder Mara', type: 'kill', target: 'slime', required: 5, desc: 'Meadow slimes have grown bold near the village path. Thin them out.', rewards: { gold: 3000, xp: 420 }, requires: [] },
  { id: 'main2', chain: 'main', title: 'Iron and Ash', region: 'ironcrag', level: 6, giver: 'Scout Kael', type: 'kill', target: 'boar', required: 6, desc: 'Crag boars are trampling the supply lines. Hunt six of them.', rewards: { gold: 9000, xp: 1100 }, requires: ['main1'] },
  { id: 'main3', chain: 'main', title: 'Web of Whispers', region: 'venomwood', level: 12, giver: 'Scout Ivy', type: 'kill', target: 'spider', required: 8, desc: 'Venom spiders have webbed the eastern trail. Burn the nests by blade.', rewards: { gold: 18000, xp: 2600 }, requires: ['main2'] },
  { id: 'main4', chain: 'main', title: 'Restless Sleep', region: 'mistgrave', level: 18, giver: 'Scout Edric', type: 'kill', target: 'wraith', required: 10, desc: 'Mist wraiths drift toward the priory at dusk. Send them back to the grave.', rewards: { gold: 32000, xp: 5200, unlock: 'wings_quest' }, requires: ['main3'] },
  { id: 'main5', chain: 'main', title: 'The Frozen Crown', region: 'frostpeak', level: 24, giver: 'Scout Bryn', type: 'kill', target: 'frost_wolf', required: 10, desc: 'The frost wolves serve the Colossus. Break their pack.', rewards: { gold: 55000, xp: 9000 }, requires: ['main4'] },
  { id: 'main6', chain: 'main', title: 'Sand and Bone', region: 'sunscorch', level: 30, giver: 'Scout Sunder', type: 'kill', target: 'scorpion', required: 8, desc: 'Dune scorpions guard the tomb road. Clear the way.', rewards: { gold: 90000, xp: 15000 }, requires: ['main5'] },
  { id: 'main7', chain: 'main', title: 'Break the Dominion', region: 'ashen', level: 36, giver: 'Scout Vale', type: 'kill', target: 'ash_demon', required: 8, desc: 'The Ashen Lord gathers his legions. Show them what mortality can do.', rewards: { gold: 150000, xp: 26000 }, requires: ['main6'] },
  { id: 'main8', chain: 'main', title: "Eternity's End", region: 'tower', level: 45, giver: 'Scout Lyra', type: 'kill', target: 'eternal_guardian', required: 1, desc: 'Climb the Eternal Spire and face the thing that has been waiting.', rewards: { gold: 400000, xp: 90000, items: ['core'], title: 'Eternal' }, requires: ['main7'] },

  // Side quests
  { id: 'side_pest', chain: 'side', title: 'Pest Control', region: 'greendale', level: 1, giver: 'Elder Mara', type: 'kill', target: 'slime', required: 10, desc: 'Ten more slimes ought to keep the fields safe for a week.', rewards: { gold: 2500, xp: 300 }, requires: [] },
  { id: 'side_herbs', chain: 'side', title: 'Silverleaf for Lina', region: 'greendale', level: 2, giver: 'Elder Mara', type: 'collect', target: 'mat_silverleaf', required: 5, desc: 'Gather five Silverleaf. The slimes and wolves trample it, but it grows back.', rewards: { gold: 4000, xp: 380 }, requires: [] },
  { id: 'side_mount', chain: 'side', title: 'A Trusty Steed', region: 'greendale', level: 5, giver: 'Elder Mara', type: 'level', target: 'level', required: 5, desc: 'Reach level 5 and Mara will gift you a faithful steed.', rewards: { gold: 2000, xp: 500, unlock: 'mount_gift' }, requires: [] },
  { id: 'side_boar', chain: 'side', title: 'Boar Hunt', region: 'ironcrag', level: 7, giver: 'Scout Kael', type: 'kill', target: 'boar', required: 8, desc: 'Eight crag boars for the outpost kitchens.', rewards: { gold: 7500, xp: 800 }, requires: [] },
  { id: 'side_ore', chain: 'side', title: 'Ore for the Forge', region: 'ironcrag', level: 8, giver: 'Scout Kael', type: 'collect', target: 'mat_iron_ore', required: 5, desc: 'From golems and crag seams, bring back five Iron Ore.', rewards: { gold: 11000, xp: 1200 }, requires: [] },
  { id: 'side_silk', chain: 'side', title: 'Silk for the Weavers', region: 'venomwood', level: 13, giver: 'Scout Ivy', type: 'collect', target: 'mat_spider_silk', required: 5, desc: 'Venom silk is priceless to the camp tailors. Harvest five strands.', rewards: { gold: 16000, xp: 2100 }, requires: [] },
  { id: 'side_boss1', chain: 'side', title: 'The Old Grove', region: 'greendale', level: 8, giver: 'Elder Mara', type: 'kill', target: 'treant', required: 1, desc: 'The Elder Treant has woken angry. Put it back to sleep.', rewards: { gold: 14000, xp: 2400 }, requires: [] },
  { id: 'side_boss2', chain: 'side', title: 'Mountain Breaker', region: 'ironcrag', level: 15, giver: 'Scout Kael', type: 'kill', target: 'behemoth', required: 1, desc: 'Ironhide Behemoth blocks the deep vein. End it.', rewards: { gold: 26000, xp: 4200 }, requires: [] },
  { id: 'side_grave', chain: 'side', title: 'Grave Dust', region: 'mistgrave', level: 20, giver: 'Scout Edric', type: 'collect', target: 'mat_grave_dust', required: 5, desc: 'The priory needs grave dust for warding chalk.', rewards: { gold: 24000, xp: 3600 }, requires: [] },
  { id: 'side_crypt', chain: 'side', title: 'Crypt Delver', region: 'mistgrave', level: 28, giver: 'Scout Edric', type: 'kill', target: 'grave_tyrant', required: 1, desc: 'Descend into the Sunken Crypt and silence the Grave Tyrant.', rewards: { gold: 50000, xp: 9000 }, requires: [] },
  { id: 'side_fang', chain: 'side', title: 'Frozen Fangs', region: 'frostpeak', level: 26, giver: 'Scout Bryn', type: 'collect', target: 'mat_frost_fang', required: 5, desc: 'Frost fangs make the finest dagger hilts in the north.', rewards: { gold: 36000, xp: 6800 }, requires: [] },
  { id: 'side_relic', chain: 'side', title: 'Sunscorch Relics', region: 'sunscorch', level: 32, giver: 'Scout Sunder', type: 'collect', target: 'mat_sun_relic', required: 5, desc: 'Recover five Sun Relics from the dune raiders.', rewards: { gold: 68000, xp: 12000 }, requires: [] },
  { id: 'side_cinder', chain: 'side', title: 'Ashen Cinders', region: 'ashen', level: 38, giver: 'Scout Vale', type: 'collect', target: 'mat_ashen_cinder', required: 5, desc: 'Ashen cinders still burn. Bring them in a cold jar.', rewards: { gold: 110000, xp: 20000 }, requires: [] },
  { id: 'side_spire', chain: 'side', title: "The Spire's Secret", region: 'tower', level: 50, giver: 'Scout Lyra', type: 'kill', target: 'eternal_guardian', required: 1, desc: 'The Eternal Spire keeps one secret. Take it.', rewards: { gold: 250000, xp: 50000 }, requires: [] }
];

// ------------------------------------------------------------------
// SHOP — cosmetic / convenience, test purchases only
// ------------------------------------------------------------------
export const SHOP = {
  costumes: [
    { id: 'cost_verdant', name: 'Verdant Ranger', desc: 'Moss-green adventurer garb.', price: 450, palette: { cloth: '#2f6b4f', cloth2: '#1e4736', trim: '#a8e07a' } },
    { id: 'cost_crimson', name: 'Crimson Duelist', desc: 'A coat for those who enjoy an audience.', price: 450, palette: { cloth: '#7d2330', cloth2: '#4b1520', trim: '#e6b35a' } },
    { id: 'cost_astral', name: 'Astral Wanderer', desc: 'Woven from a sky that never existed.', price: 900, palette: { cloth: '#3a2f78', cloth2: '#241d52', trim: '#9ee6ff' } },
    { id: 'cost_gilded', name: 'Gilded Sovereign', desc: 'Gold enough to blind your enemies.', price: 1200, palette: { cloth: '#7a5a1f', cloth2: '#4a360f', trim: '#ffe08a' } }
  ],
  hairstyles: [
    { id: 'hair_ember', name: 'Emberfall', desc: 'Loose waves that catch the light.', price: 120, style: 'long', color: '#b4452c' },
    { id: 'hair_frost', name: 'Frostbraid', desc: 'A braid white as mountain snow.', price: 120, style: 'braid', color: '#d8e4ea' },
    { id: 'hair_void', name: 'Voidtress', desc: 'Hair that seems to drink the light.', price: 180, style: 'wild', color: '#3c2f55' }
  ],
  mounts: [
    { id: 'mount_steed', name: 'Greendale Steed', desc: 'A sturdy warhorse. +35% movement speed.', price: 500, speed: 1.35, kind: 'horse', color: '#8a5a3c' },
    { id: 'mount_wolf', name: 'Frostwolf', desc: 'A winter predator. +50% movement speed.', price: 900, speed: 1.5, kind: 'wolf', color: '#c9dde8' },
    { id: 'mount_drake', name: 'Ember Drake', desc: 'A small dragon with a large attitude. +65% movement speed.', price: 1500, speed: 1.65, kind: 'drake', color: '#d95a3c' }
  ],
  pets: [
    { id: 'pet_wisp', name: 'Aether Wisp', desc: 'A floating mote of friendly light.', price: 300, kind: 'wisp', color: '#8fe2ff' },
    { id: 'pet_imp', name: 'Tiny Imp', desc: 'It bites. Mostly furniture.', price: 300, kind: 'imp', color: '#e05a44' },
    { id: 'pet_cat', name: 'Void Cat', desc: 'Exists in several places at once.', price: 450, kind: 'cat', color: '#a99bff' }
  ],
  effects: [
    { id: 'fx_ember', name: 'Ember Edge', desc: 'Weapon trail of living embers.', price: 350, color: '#ff7a3c' },
    { id: 'fx_frost', name: 'Frost Edge', desc: 'Weapon trail of frozen shards.', price: 350, color: '#8fe2ff' },
    { id: 'fx_holy', name: 'Dawn Edge', desc: 'Weapon trail of golden light.', price: 600, color: '#ffe08a' },
    { id: 'fx_void', name: 'Void Edge', desc: 'Weapon trail that unstitches reality.', price: 800, color: '#b079ff' }
  ],
  wings: [
    { id: 'wings_dawn', name: 'Wings of Dawn', desc: 'Radiant feathered wings, etched with old prayers.', price: 700, faction: 'angel', style: 'feather', palette: ['#fff8df', '#ffe9a3', '#e8c46a'] },
    { id: 'wings_night', name: 'Wings of Night', desc: 'Bat wings veined with abyssal fire.', price: 700, faction: 'demon', style: 'bat', palette: ['#2b1728', '#5a2031', '#d94a4a'] },
    { id: 'wings_seraph', name: 'Seraphic Pinions', desc: 'Six wings of impossible gold. For the truly radiant.', price: 1600, faction: 'angel', style: 'seraph', palette: ['#fffbe8', '#ffe08a', '#ffb23e'] },
    { id: 'wings_abyss', name: 'Abyssal Crown', desc: 'Wings torn from the first dark. They still remember flight.', price: 1600, faction: 'demon', style: 'abyss', palette: ['#1c0f1c', '#7a1e33', '#ff4d6d'] }
  ],
  premium: [
    { id: 'prem_xp', name: 'Wanderer\'s Blessing', desc: '+50% experience for 24 hours.', price: 250, effect: 'xp' },
    { id: 'prem_gold', name: 'Fortune\'s Favor', desc: '+25% monster gold for 24 hours.', price: 250, effect: 'gold' },
    { id: 'prem_bag', name: 'Deep Satchel', desc: '+20 inventory slots, permanently.', price: 400, effect: 'bag' }
  ],
  offers: [
    { id: 'offer_adventurer', name: 'Adventurer Bundle', desc: 'Steed + Ember Edge + 24h XP blessing.', price: 990, bundle: ['mount_steed', 'fx_ember', 'prem_xp'], tag: 'SAVE 35%' },
    { id: 'offer_eternal', name: 'Eternal Ascension', desc: 'Seraphic/Abyssal wings + Ember Drake + 3000 gems.', price: 3990, bundle: ['wings_seraph', 'wings_abyss', 'mount_drake'], tag: 'ENDGAME' }
  ]
};

export const SHOP_CATEGORIES = [
  { id: 'gems', name: 'Gems', icon: '💎' },
  { id: 'offers', name: 'Offers', icon: '✦' },
  { id: 'wings', name: 'Wings', icon: '🪽' },
  { id: 'mounts', name: 'Mounts', icon: '🐎' },
  { id: 'costumes', name: 'Costumes', icon: '🥋' },
  { id: 'hairstyles', name: 'Hairstyles', icon: '✂' },
  { id: 'pets', name: 'Pets', icon: '🐾' },
  { id: 'effects', name: 'Weapon FX', icon: '✨' },
  { id: 'premium', name: 'Premium', icon: '👑' }
];

// ------------------------------------------------------------------
// BONUS STONES
// ------------------------------------------------------------------
export const BONUS_STATS = {
  str: { id: 'str', name: 'Strength', short: 'STR', icon: '💪', color: '#ff8a5c' },
  int: { id: 'int', name: 'Intelligence', short: 'INT', icon: '🔮', color: '#8fa7ff' },
  dex: { id: 'dex', name: 'Dexterity', short: 'DEX', icon: '🎯', color: '#8be08a' },
  vit: { id: 'vit', name: 'Life', short: 'VIT', icon: '❤', color: '#ff6b8a' },
  crit: { id: 'crit', name: 'Critical', short: 'CRIT', icon: '✹', color: '#ffd166' }
};

export const STONE_TIERS = {
  1: { name: 'Lesser', mult: 1.0, color: '#a9b4c2' },
  2: { name: 'Greater', mult: 1.65, color: '#5aa9ff' },
  3: { name: 'Sovereign', mult: 2.5, color: '#ffb23e' }
};

export const ACHIEVEMENT_TITLES = ['Wanderer', 'Kingslayer', 'Eternal'];

export const HOW_TO_PLAY = [
  ['Move', 'Drag the joystick, use WASD / arrow keys, or tap the ground.'],
  ['Fight', 'Tap an enemy or press Attack. Enemies drop gold, materials and T3 equipment.'],
  ['Loot', 'Walk over glowing loot. Everything is picked up automatically.'],
  ['Grow', 'Finish quests, level up, and spend skill points on your class skill.'],
  ['Forge', 'Four identical items fuse into a higher tier at the Blacksmith.'],
  ['Trade', 'Buy potions and gear, sell loot, or rent a market stall for 24h.'],
  ['Save', 'The game saves automatically to this browser. No account is required.']
];
