/* Ashen Oath — content definitions
   Add zones, names, affixes, and upgrades here without touching combat code. */
(function () {
  'use strict';

  const RARITIES = [
    { id: 'common',    name: 'Common',    color: '#9aa0a1', glow: '#717879', mult: 1.00, weight: 100, sell: 1.0, index: 0 },
    { id: 'uncommon',  name: 'Uncommon',  color: '#7fb08a', glow: '#5f8f6a', mult: 1.30, weight: 34,  sell: 1.8, index: 1 },
    { id: 'rare',      name: 'Rare',      color: '#6fa3cf', glow: '#4a7fae', mult: 1.72, weight: 11,  sell: 3.4, index: 2 },
    { id: 'epic',      name: 'Epic',      color: '#b183d4', glow: '#895cae', mult: 2.28, weight: 3.2, sell: 6.2, index: 3 },
    { id: 'legendary', name: 'Legendary', color: '#e0a457', glow: '#b57b34', mult: 3.05, weight: 0.70, sell: 11.5, index: 4 },
    { id: 'mythic',    name: 'Mythic',    color: '#e36b67', glow: '#b33f3e', mult: 4.10, weight: 0.085, sell: 22, index: 5 }
  ];

  const SLOTS = [
    { id: 'weapon',   name: 'Weapon',   icon: 'i-sword',    base: ['Blade', 'Longsword', 'Cleaver', 'Falchion', 'Warhammer', 'Glaive'] },
    { id: 'helmet',   name: 'Helmet',   icon: 'i-helmet',   base: ['Helm', 'Cowl', 'Visage', 'Barbute', 'Crown'] },
    { id: 'chest',    name: 'Chest',    icon: 'i-chest',    base: ['Cuirass', 'Hauberk', 'Vestment', 'Plate', 'Brigandine'] },
    { id: 'gloves',   name: 'Gloves',   icon: 'i-gloves',   base: ['Gauntlets', 'Grips', 'Handwraps', 'Vambraces'] },
    { id: 'boots',    name: 'Boots',    icon: 'i-boots',    base: ['Greaves', 'Treads', 'Sabatons', 'Striders'] },
    { id: 'ring',     name: 'Ring',     icon: 'i-ring',     base: ['Band', 'Signet', 'Loop', 'Seal', 'Ring'] },
    { id: 'necklace', name: 'Necklace', icon: 'i-necklace', base: ['Amulet', 'Pendant', 'Talisman', 'Torc', 'Reliquary'] }
  ];

  const SLOT_BY_ID = Object.fromEntries(SLOTS.map((s) => [s.id, s]));
  const RARITY_BY_ID = Object.fromEntries(RARITIES.map((r) => [r.id, r]));

  const PREFIXES = {
    common:    ['Worn', 'Cracked', 'Tarnished', 'Ashen', 'Rusted', 'Faded'],
    uncommon:  ['Sturdy', 'Gloomforged', 'Huntsman\u2019s', 'Oathbound', 'Weathered', 'Ironwood'],
    rare:      ['Wraithbound', 'Emberforged', 'Moonlit', 'Dread', 'Hallowed', 'Stormwrought'],
    epic:      ['Soulrend', 'Bloodsworn', 'Voidtouched', 'Cinderking\u2019s', 'Graveborn', 'Starfall'],
    legendary: ['Godslayer', 'Eternal', 'Doombringer', 'Dawnbringer', 'Nightfall', 'Sovereign\u2019s'],
    mythic:    ['Worldbreaker', 'Primordial', 'Beyond', 'Ashen Apotheosis', 'Firstborn']
  };

  const FLAVOR = {
    common: ['It has seen better hands.', 'The metal is pitted, but it remembers the fight.', 'A humble relic of a forgotten levy.'],
    uncommon: ['A cut above the common dead.', 'Old runes flicker when danger draws near.', 'Carried by one who almost survived.'],
    rare: ['The air hums with a barely contained hunger.', 'A relic of the old oath, still keeping its promise.', 'Its edge remembers the dark it has tasted.'],
    epic: ['Something inside it is awake.', 'Forged in a fire that no mortal tended.', 'The dead whisper when it is drawn.'],
    legendary: ['A name outlives the hand that carried it.', 'Kings were buried for less.', 'Even the Abyss remembers this one.'],
    mythic: ['It should not exist. It insists on doing so.', 'A fragment of the world before the first oath.', 'The gods left fingerprints on it.']
  };

  const STAT_LABELS = {
    atk: 'Attack',
    hp: 'Vitality',
    armor: 'Armor',
    crit: 'Critical Chance',
    critDamage: 'Critical Damage',
    speed: 'Attack Speed',
    goldFind: 'Gold Find',
    xpGain: 'XP Gain',
    lootFind: 'Loot Find',
    lifesteal: 'Life Steal'
  };

  const PERCENT_STATS = ['crit', 'critDamage', 'speed', 'goldFind', 'xpGain', 'lootFind', 'lifesteal'];

  const AFFIXES = [
    { id: 'vampiric', name: 'Vampiric', icon: 'i-heart', minRarity: 2, stats: { lifesteal: [2, 4.5] }, desc: 'Heal for {value} of all damage dealt.' },
    { id: 'keen', name: 'Keen', icon: 'i-star', minRarity: 2, stats: { crit: [3, 6.5] }, desc: 'Adds {value} critical strike chance.' },
    { id: 'frenzied', name: 'Frenzied', icon: 'i-flash', minRarity: 2, stats: { speed: [5, 11] }, desc: 'Attacks {value} faster.' },
    { id: 'avaricious', name: 'Avaricious', icon: 'i-coin', minRarity: 2, stats: { goldFind: [15, 35] }, desc: 'Increases gold gained by {value}.' },
    { id: 'sage', name: 'Sage\u2019s', icon: 'i-star', minRarity: 2, stats: { xpGain: [10, 25] }, desc: 'Increases experience gained by {value}.' },
    { id: 'scavenger', name: 'Scavenger', icon: 'i-bag', minRarity: 2, stats: { lootFind: [3, 7] }, desc: 'Increases loot find by {value}.' },
    { id: 'cruel', name: 'Cruel', icon: 'i-sword', minRarity: 2, stats: { critDamage: [20, 45] }, desc: 'Critical strikes deal {value} more damage.' },
    { id: 'bulwark', name: 'Bulwark', icon: 'i-shield', minRarity: 3, stats: { armor: [8, 18] }, desc: 'Adds {value} armor.' }
  ];

  const UPGRADES = [
    {
      id: 'damage', name: 'Cruel Might', icon: 'i-sword', color: '#c18063',
      desc: 'Raw power behind every blow.', effect: (n) => `+${(n * 2.5).toFixed(0)} attack`, baseCost: 16, growth: 1.47, max: 100, stat: 'damage'
    },
    {
      id: 'speed', name: 'Quickened Blood', icon: 'i-flash', color: '#8eb0c1',
      desc: 'Strike before the enemy draws breath.', effect: (n) => `${(n * 2.2).toFixed(0)}% faster attacks`, baseCost: 26, growth: 1.51, max: 60, stat: 'speed'
    },
    {
      id: 'crit', name: 'Hunter\u2019s Eye', icon: 'i-star', color: '#d3aa63',
      desc: 'Find the seam in every hide and plate.', effect: (n) => `+${(n * 1).toFixed(0)}% critical chance`, baseCost: 38, growth: 1.55, max: 45, stat: 'crit'
    },
    {
      id: 'lore', name: 'Ancient Lore', icon: 'i-arrow-up', color: '#8f9c76',
      desc: 'Every death teaches something.', effect: (n) => `+${(n * 7).toFixed(0)}% experience`, baseCost: 32, growth: 1.53, max: 60, stat: 'xp'
    },
    {
      id: 'fortune', name: 'Grave Fortune', icon: 'i-bag', color: '#b08c55',
      desc: 'The dead rarely need their treasures.', effect: (n) => `+${(n * 0.7).toFixed(1)}% loot find`, baseCost: 40, growth: 1.57, max: 55, stat: 'loot'
    }
  ];

  const ZONES = [
    {
      id: 'crypt', name: 'Ashen Crypts', tier: 'I', tierNum: 1,
      desc: 'Where the first oath was broken.',
      level: 1, unlockLevel: 1, art: 'wraith', color: '#90a5a4',
      hpMult: 1.00, atkMult: 1.00, rewardMult: 1.00, lootBonus: 0.00,
      enemyLevel: 1,
      enemies: [
        { name: 'Grave Wisp', trait: 'It watches from the dark.' },
        { name: 'Bone Shade', trait: 'Hunger outlives flesh.' },
        { name: 'Crypt Stalker', trait: 'It has learned the sound of breathing.' }
      ],
      boss: { name: 'The Hollow Warden', trait: 'The oathbreaker guards what he cannot remember.' }
    },
    {
      id: 'wood', name: 'Gloomfang Wood', tier: 'II', tierNum: 2,
      desc: 'The forest eats its own young.',
      level: 3, unlockLevel: 3, art: 'wolf', color: '#89a77a',
      hpMult: 1.55, atkMult: 1.28, rewardMult: 1.52, lootBonus: 0.10,
      enemyLevel: 4,
      enemies: [
        { name: 'Thornmaw Wolf', trait: 'Bark splits where it walks.' },
        { name: 'Gloomfang Stalker', trait: 'You hear it only when it allows you.' },
        { name: 'Mossback Direwolf', trait: 'Its hide blossoms with dead things.' }
      ],
      boss: { name: 'Gloomfang, the Elder', trait: 'The first hunger of the wood.' }
    },
    {
      id: 'reliquary', name: 'Sunken Reliquary', tier: 'III', tierNum: 3,
      desc: 'Drowned prayers still echo below.',
      level: 6, unlockLevel: 6, art: 'leviathan', color: '#7fb5c2',
      hpMult: 2.35, atkMult: 1.66, rewardMult: 2.25, lootBonus: 0.20,
      enemyLevel: 8,
      enemies: [
        { name: 'Drowned Watcher', trait: 'It prays to something beneath the silt.' },
        { name: 'Abyssal Eye', trait: 'A pupil ringed with broken reliquaries.' },
        { name: 'Tidebound Oculi', trait: 'The sea refuses to keep it.' }
      ],
      boss: { name: 'The Leviathan Eye', trait: 'A pupil the size of a drowned cathedral.' }
    },
    {
      id: 'emberhold', name: 'Emberhold Depths', tier: 'IV', tierNum: 4,
      desc: 'The forge never cooled. Neither did its prisoners.',
      level: 10, unlockLevel: 10, art: 'golem', color: '#d2874e',
      hpMult: 3.50, atkMult: 2.12, rewardMult: 3.15, lootBonus: 0.33,
      enemyLevel: 13,
      enemies: [
        { name: 'Cinder Golem', trait: 'It giggles as the stone blisters.' },
        { name: 'Magma Fist', trait: 'Its footprints cool into black glass.' },
        { name: 'Forge Golem', trait: 'A furnace with fists.' }
      ],
      boss: { name: 'Varkos the Molten', trait: 'He stoked the world\u2019s first fire.' }
    },
    {
      id: 'sepulcher', name: 'Frozen Sepulcher', tier: 'V', tierNum: 5,
      desc: 'Silence, preserved in blue glass.',
      level: 15, unlockLevel: 15, art: 'reaper', color: '#9fc5d8',
      hpMult: 5.20, atkMult: 2.70, rewardMult: 4.30, lootBonus: 0.48,
      enemyLevel: 19,
      enemies: [
        { name: 'Rime Wraith', trait: 'Every word it speaks becomes frost.' },
        { name: 'Icebound Knight', trait: 'Still standing its final watch.' },
        { name: 'Pale Horror', trait: 'It wears the winter like a coat.' }
      ],
      boss: { name: 'The Queen of the Pale', trait: 'She keeps the dead where nothing decays.' }
    },
    {
      id: 'voidscar', name: 'Voidscar Sanctum', tier: 'VI', tierNum: 6,
      desc: 'A wound in the world that learned to breathe.',
      level: 21, unlockLevel: 21, art: 'void', color: '#a88bd0',
      hpMult: 7.40, atkMult: 3.45, rewardMult: 5.85, lootBonus: 0.64,
      enemyLevel: 26,
      enemies: [
        { name: 'Void Seer', trait: 'It has seen the end and found it funny.' },
        { name: 'Null Fiend', trait: 'A hole shaped like a hunger.' },
        { name: 'Star-Eaten Eye', trait: 'Its shadow points the wrong way.' }
      ],
      boss: { name: 'The Unmade', trait: 'It was never born. It will never die.' }
    },
    {
      id: 'dragon', name: 'Dragon\u2019s Crown', tier: 'VII', tierNum: 7,
      desc: 'The last mountain bows to a dying king.',
      level: 28, unlockLevel: 28, art: 'dragon', color: '#df8560',
      hpMult: 10.20, atkMult: 4.35, rewardMult: 7.80, lootBonus: 0.82,
      enemyLevel: 34,
      enemies: [
        { name: 'Wyrmling', trait: 'Small wings. Ancient malice.' },
        { name: 'Scale Guard', trait: 'It has never once lowered its spear.' },
        { name: 'Flame Drake', trait: 'The air bends before its breath.' }
      ],
      boss: { name: 'Aurelion, Last Wyrm', trait: 'The final flame of a broken sky.' }
    },
    {
      id: 'throne', name: 'The Abyss Throne', tier: 'VIII', tierNum: 8,
      desc: 'Every road of ash ends here.',
      level: 36, unlockLevel: 36, art: 'king', color: '#c49c6d',
      hpMult: 13.80, atkMult: 5.40, rewardMult: 10.20, lootBonus: 1.00,
      enemyLevel: 43,
      enemies: [
        { name: 'Nightmare Herald', trait: 'It announces a kingdom that is only smoke.' },
        { name: 'Throne Warden', trait: 'There is no throne left to guard.' },
        { name: 'Ash Revenant', trait: 'Every fallen hero, wearing one face.' }
      ],
      boss: { name: 'The Ashen King', trait: 'The first oath. The last lie.' }
    }
  ];

  const CONFIG = {
    bossEvery: 10,
    inventorySize: 60,
    offlineCapSeconds: 8 * 60 * 60,
    offlineMinSeconds: 60,
    autoUnlockCost: 30,
    autoBaseInterval: 1.55,
    enemyAttackInterval: 2.45,
    baseHp: 120,
    xpBase: 28,
    xpGrowth: 1.225,
    baseLootChance: 0.18,
    bossLootChance: 0.55,
    critBase: 5,
    critDamageBase: 1.8,
    maxCrit: 75,
    maxLootFind: 55
  };

  window.GameData = {
    RARITIES, SLOTS, SLOT_BY_ID, RARITY_BY_ID, PREFIXES, FLAVOR, STAT_LABELS, PERCENT_STATS,
    AFFIXES, UPGRADES, ZONES, CONFIG
  };
})();
