/* ============================================================
   AETHERIA — DATA: constants, classes, items, monsters, regions,
   quests, recipes, shop, economy. Pure data + pure helpers.
   ============================================================ */
window.DATA = (function () {
  'use strict';

  /* ---------------- rarity & tier system ---------------- */
  const RARITIES = ['Common', 'Grey', 'Green', 'Blue', 'Purple', 'Legendary', 'Mythic', 'Divine'];
  const RARITY_COLOR = {
    Common: '#d8dee9', Grey: '#9aa4b0', Green: '#5fd35f', Blue: '#4aa3ff',
    Purple: '#b565ff', Legendary: '#ffb02e', Mythic: '#ff4d94', Divine: '#8ff5ff'
  };
  const RARITY_MULT = { Common: 1, Grey: 1.12, Green: 1.25, Blue: 1.42, Purple: 1.65, Legendary: 2.0, Mythic: 2.5, Divine: 3.2 };
  // Direct drop shares (purple+ never drop directly). All direct drops are T3.
  const DROP_SHARES = { Common: 60, Grey: 25, Green: 10, Blue: 5 };
  const TIER_MULT = { 3: 1.0, 2: 1.45, 1: 2.0 };
  const TIER_PREFIX = { 3: 'Worn', 2: 'Tempered', 1: 'Exalted' };
  const SLOTS = ['weapon', 'head', 'chest', 'hands', 'legs', 'feet', 'ring', 'amulet', 'cloak'];
  const SLOT_NAMES = {
    weapon: 'Weapon', head: 'Helmet', chest: 'Chest', hands: 'Gloves', legs: 'Legs',
    feet: 'Boots', ring: 'Ring', amulet: 'Amulet', cloak: 'Cloak'
  };
  const SLOT_ICON = {
    weapon: '⚔️', head: '⛑️', chest: '🥋', hands: '🧤', legs: '👖',
    feet: '👟', ring: '💍', amulet: '📿', cloak: '🧣'
  };
  // power scale anchored to monster/region level
  const powerAt = lvl => 8 + lvl * 2.4;

  /* ---------------- classes ---------------- */
  const CLASSES = {
    warrior: {
      key: 'warrior', name: 'Warrior', icon: '🛡️', desc: 'Strong melee fighter. High HP & defense.',
      baseAtk: 13, baseDef: 12, baseHp: 150, baseMp: 40, baseCrit: 5,
      gAtk: 3.4, gDef: 2.7, gHp: 17, gMp: 3.2,
      spd: 3.1, range: 1.7, atkInterval: 0.95, crit: 5,
      weaponIcon: '🗡️', armorSet: 'Ironplate', proj: null,
      skill: { name: 'EARTHSHATTER', icon: '💥', cd: 7, mana: 18, mult: 2.2, aoe: 2.6, desc: 'AoE ground smash (2.2x)' },
      outfit: ['Gladiator Gold', 'Crimson Vanguard', 'Steel Legion']
    },
    mage: {
      key: 'mage', name: 'Mage', icon: '🔮', desc: 'Powerful magic & ranged attacks.',
      baseAtk: 15, baseDef: 7, baseHp: 105, baseMp: 75, baseCrit: 6,
      gAtk: 4.0, gDef: 1.8, gHp: 11, gMp: 6.5,
      spd: 3.2, range: 4.6, atkInterval: 1.15, crit: 6,
      weaponIcon: '🪄', armorSet: 'Silkweave', proj: { color: '#7fa2ff', speed: 10 },
      skill: { name: 'METEOR FALL', icon: '☄️', cd: 9, mana: 26, mult: 2.7, aoe: 3.0, desc: 'Rain meteors in an area (2.7x)' },
      outfit: ['Celestine Robes', 'Voidstitch Robes', 'Academy Blue']
    },
    assassin: {
      key: 'assassin', name: 'Assassin', icon: '🗡️', desc: 'Fast attacks and critical damage.',
      baseAtk: 14, baseDef: 8, baseHp: 118, baseMp: 55, baseCrit: 15,
      gAtk: 3.8, gDef: 2.1, gHp: 13, gMp: 4.4,
      spd: 3.9, range: 1.35, atkInterval: 0.6, crit: 15,
      weaponIcon: '🔪', armorSet: 'Shadowleather', proj: null,
      skill: { name: 'SHADOW STRIKE', icon: '🌑', cd: 5, mana: 14, mult: 2.9, aoe: 1.6, desc: 'Lunge & strike for huge crits (2.9x)' },
      outfit: ['Nightweave', 'Crimson Fang', 'Ember Courier']
    }
  };

  const FACTIONS = {
    angel: { key: 'angel', name: 'Angels', icon: '😇', desc: 'Celestial order, radiance & sky.', color: '#ffe9a8', wingsName: 'Celestial Wings' },
    demon: { key: 'demon', name: 'Demons', icon: '😈', desc: 'Infernal power, shadow & flame.', color: '#ff8f8f', wingsName: 'Demonic Wings' }
  };

  /* ---------------- appearance options ---------------- */
  const HAIR_STYLES = ['Short', 'Long', 'Ponytail', 'Spiky', 'Braid'];
  const HAIR_COLORS = ['#2e241b', '#7a4a1e', '#c98c3f', '#e8d9a0', '#b03030', '#3d6fc4', '#4aa15f', '#8a4fc4', '#dfe6ef'];
  const EYE_COLORS = ['#4a6fc0', '#3d8a4f', '#8a4fc4', '#c4913d', '#3db0a8', '#c04a5f'];
  const GENDERS = ['female', 'male'];

  /* ---------------- items ---------------- */
  const classArmorNames = {
    warrior: 'Ironplate', mage: 'Silkweave', assassin: 'Shadowleather'
  };
  const weaponBase = { warrior: 'Warblade', mage: 'Aether Staff', assassin: 'Twin Fangs' };
  const miscBase = {
    ring: 'Ring of Aether', amulet: 'Amulet of Dawn', cloak: "Traveler's Cloak"
  };

  // creates a stat block for an item
  function makeItem(opts) {
    const { slot, cls = 'any', lvl, tier = 3, rarity = 'Common', stone = null, name = null } = opts;
    const P = powerAt(lvl) * TIER_MULT[tier] * RARITY_MULT[rarity];
    let stats = {}, nameBase;
    const armor = classArmorNames[cls] || 'Wanderer';
    const hiPrefix = { Legendary: 'Legendary ', Mythic: 'Mythic ', Divine: 'Divine ' }[rarity] || `${TIER_PREFIX[tier]} `;
    switch (slot) {
      case 'weapon': nameBase = `${hiPrefix}${weaponBase[cls]}`; stats = { atk: Math.round(P * 1.15), crit: +(0.012 * (TIER_MULT[tier] * RARITY_MULT[rarity])).toFixed(3) }; break;
      case 'head': nameBase = `${hiPrefix}${armor} Helm`; stats = { hp: Math.round(P * 3.2), def: Math.round(P * 0.35) }; break;
      case 'chest': nameBase = `${hiPrefix}${armor} Mail`; stats = { def: Math.round(P * 0.8), hp: Math.round(P * 2.8) }; break;
      case 'hands': nameBase = `${hiPrefix}${armor} Gauntlets`; stats = { atk: Math.round(P * 0.3), critDmg: Math.round(4 * TIER_MULT[tier] * RARITY_MULT[rarity]) }; break;
      case 'legs': nameBase = `${hiPrefix}${armor} Greaves`; stats = { hp: Math.round(P * 2.4), def: Math.round(P * 0.45) }; break;
      case 'feet': nameBase = `${hiPrefix}${armor} Sabatons`; stats = { spd: (TIER_MULT[tier] * RARITY_MULT[rarity] > 1.3 ? 2 : 1), def: Math.round(P * 0.3) }; break;
      case 'ring': nameBase = `${hiPrefix}${miscBase.ring}`; stats = { crit: +(0.03 * TIER_MULT[tier] * RARITY_MULT[rarity]).toFixed(3), atk: Math.round(P * 0.45) }; break;
      case 'amulet': nameBase = `${hiPrefix}${miscBase.amulet}`; stats = { hp: Math.round(P * 2.0), mp: Math.round(P * 1.4) }; break;
      case 'cloak': nameBase = `${hiPrefix}${miscBase.cloak}`; stats = { def: Math.round(P * 0.5), hp: Math.round(P * 1.1) }; break;
    }
    if (name) nameBase = name;
    const bonuses = stone ? stone.bonuses.map(b => ({ ...b })) : [];
    const item = {
      uid: 'i' + Math.random().toString(36).slice(2, 10),
      kind: 'gear', slot, cls, lvl, tier, rarity, name: nameBase,
      stats, bonuses, icon: SLOT_ICON[slot], clan: stone ? stone.src : null
    };
    item.value = Math.max(5, Math.round(Math.pow(P, 1.55) / 2));
    return item;
  }

  /* materials */
  const MATERIALS = {
    verdant_leaf: { name: 'Verdant Leaf', icon: '🍃', region: 'greendale' },
    iron_ore: { name: 'Iron Chunk', icon: '⛏️', region: 'ironcrag' },
    glow_silk: { name: 'Glow Silk', icon: '🧵', region: 'venomwood' },
    spectral_dust: { name: 'Spectral Dust', icon: '🕸️', region: 'mistgrave' },
    frost_shard: { name: 'Frost Shard', icon: '❄️', region: 'frostpeak' },
    sun_sand: { name: 'Golden Sand', icon: '🏜️', region: 'sunscorch' },
    ash_ember: { name: 'Ash Ember', icon: '🔥', region: 'ashen' },
    eternal_crystal: { name: 'Eternal Crystal', icon: '💠', region: 'tower' },
    ember_core: { name: 'Ember Core', icon: '🔆', region: 'any' },
    aether_pulver: { name: 'Aether Powder', icon: '✨', region: 'any' }
  };
  const mat = id => ({ uid: 'm' + Math.random().toString(36).slice(2, 9), kind: 'mat', id, name: MATERIALS[id].name, icon: MATERIALS[id].icon, value: 6 + id.length });

  // Boss stone: up to 3 bonus affixes (rolled on boss kill)
  const BOSS_AFFIXES = () => {
    const pool = [
      { stat: 'crit', label: 'Critical Chance', min: 0.02, max: 0.06 },
      { stat: 'critDmg', label: 'Critical Damage', min: 5, max: 15 },
      { stat: 'atk', label: 'Attack', min: 3, max: 12 },
      { stat: 'def', label: 'Defense', min: 3, max: 12 },
      { stat: 'hp', label: 'Health', min: 30, max: 120 },
      { stat: 'spd', label: 'Speed', min: 1, max: 3 },
      { stat: 'leech', label: 'Life Steal', min: 0.01, max: 0.04 }
    ];
    const n = 1 + Math.floor(Math.random() * 3); // 1..3 bonuses
    const shuffled = pool.slice().sort(() => Math.random() - .5).slice(0, n);
    return shuffled.map(p => {
      const v = p.min + Math.random() * (p.max - p.min);
      return { stat: p.stat, label: p.label, v: p.stat === 'crit' ? +v.toFixed(3) : Math.round(v) };
    });
  };
  function bossStone(bossDef) {
    const rnd = Math.random();
    const rarity = rnd < .10 ? 'Legendary' : rnd < .40 ? 'Purple' : rnd < .75 ? 'Blue' : 'Green';
    return {
      uid: 's' + Math.random().toString(36).slice(2, 9), kind: 'stone', rarity,
      name: `${bossDef.name} Stone`, icon: '🪨', srcLevel: bossDef.lvl, src: bossDef.name,
      bonuses: BOSS_AFFIXES(), value: 250
    };
  }

  /* ---------------- regions & monsters ---------------- */
  const MONSTER_KINDS = {
    slime: { shape: 'slime', hp: .8, atk: .8, spd: 1.4, size: 1.0 },
    sprite: { shape: 'wisp', hp: .6, atk: .9, spd: 2.6, size: .85 },
    wolf: { shape: 'beast', hp: 1.0, atk: 1.1, spd: 3.2, size: 1.05 },
    bandit: { shape: 'human', hp: 1.1, atk: 1.15, spd: 2.8, size: 1.0 },
    spider: { shape: 'spider', hp: .9, atk: 1.2, spd: 3.0, size: 1.0 },
    toad: { shape: 'slime', hp: 1.2, atk: 1.0, spd: 1.6, size: 1.15 },
    wraith: { shape: 'ghost', hp: .85, atk: 1.25, spd: 2.2, size: 1.05 },
    skeleton: { shape: 'human', hp: 1.0, atk: 1.1, spd: 2.4, size: 1.0 },
    yeti: { shape: 'brute', hp: 1.5, atk: 1.2, spd: 2.2, size: 1.3 },
    wisp: { shape: 'wisp', hp: .55, atk: 1.0, spd: 3.4, size: .8 },
    scorpion: { shape: 'spider', hp: 1.1, atk: 1.3, spd: 2.9, size: 1.0 },
    saruq: { shape: 'human', hp: .95, atk: 1.2, spd: 3.1, size: 1.0 },
    imp: { shape: 'ghost', hp: .8, atk: 1.35, spd: 3.0, size: .9 },
    demonkin: { shape: 'human', hp: 1.4, atk: 1.4, spd: 2.6, size: 1.15 },
    golem: { shape: 'brute', hp: 1.7, atk: 1.3, spd: 1.8, size: 1.35 },
    wardling: { shape: 'wisp', hp: 1.0, atk: 1.5, spd: 3.2, size: 1.0 },
    brute: { shape: 'brute', hp: 1.25, atk: 1.3, spd: 2.4, size: 1.5 }
  };
  const REGIONS = [
    {
      id: 'greendale', name: 'Greendale', minLvl: 1, biome: 'grass', size: 44,
      palette: { ground: ['#5da15c', '#6cb066', '#579a54'], accent: ['#4d8a4d'], path: '#b99b62', water: '#3f6fb5' },
      village: 'Dawnshire',
      monsters: [
        { kind: 'slime', name: 'Meadow Slime', lvl: 2 },
        { kind: 'sprite', name: 'Green Sprite', lvl: 3 },
        { kind: 'wolf', name: 'Dusk Wolf', lvl: 5, count: 8 }
      ],
      gather: { id: 'verdant_leaf', node: '🌿 Verdant Bush', icon: '🌿' },
      boss: { id: 'greendaleboss', name: 'Thornback the Verdant', label: 'Verdant Thorncaller', kind: 'brute', lvl: 12, tone: '#3f7d3f' },
      deco: ['oak', 'bush', 'flower', 'rock'], gates: { e: 'ironcrag' }
    },
    {
      id: 'ironcrag', name: 'Ironcrag', minLvl: 8, biome: 'mountain', size: 44,
      palette: { ground: ['#8d7362', '#7d6557', '#967a66'], accent: ['#6b574a'], path: '#a98d6a', water: '#4a6f8f' },
      village: 'Stonewatch',
      monsters: [
        { kind: 'bandit', name: 'Ironcrag Bandit', lvl: 9 },
        { kind: 'wolf', name: 'Crag Howler', lvl: 10 },
        { kind: 'slime', name: 'Slag Slime', lvl: 11 }
      ],
      gather: { id: 'iron_ore', node: '⛏️ Iron Vein', icon: '⛏️' },
      boss: { id: 'ironcragboss', name: 'Goremaw the Forgeborn', label: 'Iron Warden', kind: 'golem', lvl: 19, tone: '#8d5a3f' },
      deco: ['rock', 'rockbig', 'pine', 'crystal'], gates: { w: 'greendale', e: 'venomwood' }
    },
    {
      id: 'venomwood', name: 'Venomwood', minLvl: 15, biome: 'swamp', size: 44,
      palette: { ground: ['#4a5d3a', '#41522f', '#54684a'], accent: ['#365c3a'], path: '#7a6f4a', water: '#3a6b4a' },
      village: null,
      monsters: [
        { kind: 'spider', name: 'Venom Weaver', lvl: 16 },
        { kind: 'toad', name: 'Bog Toad', lvl: 17 },
        { kind: 'sprite', name: 'Toxic Wisp', lvl: 18 }
      ],
      gather: { id: 'glow_silk', node: '🕸️ Silkweb Pod', icon: '🕸️' },
      boss: { id: 'venomwoodboss', name: 'Matron Vileweaver', label: 'Weaver Matron', kind: 'spider', lvl: 26, tone: '#6a3a5f' },
      deco: ['mushroom', 'deadtree', 'bush', 'rock'], gates: { w: 'ironcrag', e: 'mistgrave', s: 'sunscorch' }
    },
    {
      id: 'mistgrave', name: 'Mistgrave', minLvl: 22, biome: 'grave', size: 44,
      palette: { ground: ['#5d6473', '#525a68', '#687080'], accent: ['#464c59'], path: '#6a6f80', water: '#3a5570' },
      village: null,
      monsters: [
        { kind: 'skeleton', name: 'Grave Sentinel', lvl: 23 },
        { kind: 'wraith', name: 'Mourning Wraith', lvl: 24 },
        { kind: 'wolf', name: 'Ashen Gnawer', lvl: 25 }
      ],
      gather: { id: 'spectral_dust', node: '🕯️ Spectral Flame', icon: '🕯️' },
      boss: { id: 'mistgraveboss', name: 'Duskbane the Hollow', label: 'Hollow King', kind: 'ghost', lvl: 33, tone: '#7a8fae' },
      deco: ['tomb', 'deadtree', 'lamp', 'rock'], gates: { w: 'venomwood', e: 'frostpeak' }
    },
    {
      id: 'frostpeak', name: 'Frostpeak', minLvl: 30, biome: 'snow', size: 44,
      palette: { ground: ['#c6d3e2', '#b8c7da', '#d4e0ec'], accent: ['#9db4cc'], path: '#8f9db0', water: '#5a7fc4' },
      village: 'Frosthaven',
      monsters: [
        { kind: 'yeti', name: 'Frost Yeti', lvl: 31 },
        { kind: 'wisp', name: 'Winter Wisp', lvl: 32 },
        { kind: 'wolf', name: 'Snow Prowler', lvl: 33 }
      ],
      gather: { id: 'frost_shard', node: '❄️ Frost Bloom', icon: '❄️' },
      boss: { id: 'frostpeakboss', name: 'Rimehorn the Ancient', label: 'Ancient Yeti', kind: 'brute', lvl: 40, tone: '#7fa8c4' },
      deco: ['pine', 'rock', 'crystal', 'flower'], gates: { w: 'mistgrave', e: 'sunscorch' }
    },
    {
      id: 'sunscorch', name: 'Sunscorch Desert', minLvl: 38, biome: 'desert', size: 44,
      palette: { ground: ['#d9b26a', '#cfa45e', '#e3bd77'], accent: ['#b98c4f'], path: '#b98c4f', water: '#4aa3a0' },
      village: 'Sunmarket',
      monsters: [
        { kind: 'scorpion', name: 'Dune Stalker', lvl: 39 },
        { kind: 'saruq', name: 'Saruq Marauder', lvl: 40 },
        { kind: 'wisp', name: 'Sand Phantom', lvl: 41 }
      ],
      gather: { id: 'sun_sand', node: '🏺 Sand Seep', icon: '🏺' },
      boss: { id: 'sunscorchboss', name: 'Scarab Sovereign', label: 'Scarab Sovereign', kind: 'spider', lvl: 48, tone: '#c4913d' },
      deco: ['cactus', 'rock', 'palm', 'tomb'], gates: { w: 'frostpeak', n: 'venomwood', e: 'ashen' }
    },
    {
      id: 'ashen', name: 'Ashen Dominion', minLvl: 46, biome: 'lava', size: 44,
      palette: { ground: ['#4a3a3f', '#41353a', '#544247'], accent: ['#6b2a33'], path: '#6b5248', water: '#e06a2a' },
      village: null,
      monsters: [
        { kind: 'imp', name: 'Cinder Imp', lvl: 47 },
        { kind: 'demonkin', name: 'Ashen Legionnaire', lvl: 48 },
        { kind: 'golem', name: 'Magma Construct', lvl: 50 }
      ],
      gather: { id: 'ash_ember', node: '🔥 Ember Vent', icon: '🔥' },
      boss: { id: 'ashenboss', name: 'Ashmaw the Tyrant', label: 'Ashen Tyrant', kind: 'brute', lvl: 56, tone: '#c4482f' },
      deco: ['deadtree', 'rock', 'crystal', 'lamp'], gates: { w: 'sunscorch', e: 'tower' }
    },
    {
      id: 'tower', name: 'Tower of Eternity', minLvl: 55, biome: 'void', size: 46, tall: true,
      palette: { ground: ['#3a3d5c', '#333647', '#444870'], accent: ['#5b4a8f'], path: '#555a80', water: '#7a4fc4' },
      village: null,
      monsters: [
        { kind: 'wardling', name: 'Eternal Wardling', lvl: 57 },
        { kind: 'demonkin', name: 'Ascended Vanguard', lvl: 58 },
        { kind: 'golem', name: 'Runed Sentinel', lvl: 60 }
      ],
      gather: { id: 'eternal_crystal', node: '💠 Crystal Spire', icon: '💠' },
      boss: { id: 'towerboss', name: 'The Eternal Warden', label: 'Warden of Eternity', kind: 'golem', lvl: 66, tone: '#8f6fff' },
      miniBosses: [
        { id: 'tb1', name: 'Sentinel Aeon', kind: 'ghost', lvl: 58, tone: '#5fc4b0' },
        { id: 'tb2', name: 'Chorus of Nine', kind: 'wisp', lvl: 61, tone: '#c45fb0' }
      ],
      deco: ['crystal', 'pillar', 'lamp', 'rock'], gates: { w: 'ashen' }
    }
  ];
  const regionById = id => REGIONS.find(r => r.id === id);

  /* shops & towns: services exist in listed towns */
  const TOWNS = {
    Dawnshire: { region: 'greendale', pos: { x: 12, y: 22 } },
    Stonewatch: { region: 'ironcrag', pos: { x: 16, y: 24 } },
    Sunmarket: { region: 'sunscorch', pos: { x: 15, y: 24 } },
    Frosthaven: { region: 'frostpeak', pos: { x: 16, y: 25 } }
  };

  /* ---------------- gathering / economy knobs (configurable) ---------------- */
  const ECON = {
    fusionFee: tier => ({ 3: 120, 2: 300, 1: 700 })[tier] || 120,
    potionBuy: { hp: 35, mp: 30 },
    potionSell: { hp: 12, mp: 10 },
    teleFee: (from, to) => 25 + Math.abs(REGIONS.indexOf(from) - REGIONS.indexOf(to)) * 15,
    storageFee: 0,
    gatherSecs: 40,
    respawnSecs: 9,
    bossRespawnSecs: 70,
    marketFee: 0.05
  };

  /* ---------------- quests ---------------- */
  const QUESTS = [
    {
      id: 'm1', main: true, giver: 'rowan', region: 'greendale', name: 'First Steps', minLvl: 1,
      desc: 'Danger creeps near Dawnshire. Thin out the Meadow Slimes.',
      objs: [{ type: 'kill', target: 'Meadow Slime', n: 8 }],
      rew: { xp: 90, gold: 60, items: [{ pot: 'hp', n: 3 }] }
    },
    {
      id: 'm2', main: true, giver: 'rowan', region: 'greendale', name: 'Tools of War', minLvl: 3, pre: 'm1',
      desc: 'Gather Verdant Leaves for the forge and prove your strength.',
      objs: [{ type: 'collect', target: 'Verdant Leaf', n: 4 }],
      rew: { xp: 130, gold: 90, items: [{ gear: { rarity: 'Green', slot: 'feet' } }] }
    },
    {
      id: 'w1', main: false, giver: 'faction', region: 'greendale', name: 'Trial of Ascension', minLvl: 4,
      desc: 'Your faction demands proof. Slay the wilds of Greendale and Ironcrag.',
      objs: [{ type: 'kill', target: 'Meadow Slime', n: 10 }, { type: 'kill', target: 'Dusk Wolf', n: 6 }, { type: 'kill', target: 'Ironcrag Bandit', n: 6 }],
      rew: { xp: 300, gold: 150, wings: true, gems: 10 }
    },
    {
      id: 'm3', main: true, giver: 'rowan', region: 'greendale', name: 'Road to Stonegate', minLvl: 5, pre: 'm2',
      desc: 'Travel to Ironcrag and warn Stonewatch of the shadow tide.',
      objs: [{ type: 'reach', target: 'Stonewatch' }, { type: 'talk', target: 'captain' }],
      rew: { xp: 260, gold: 140, gems: 5 }
    },
    {
      id: 'm4', main: true, giver: 'captain', region: 'ironcrag', name: 'Forgeborn Trials', minLvl: 8, pre: 'm3',
      desc: 'Prove yourself against the bandits and gather iron for the Stonewatch forge.',
      objs: [{ type: 'kill', target: 'Ironcrag Bandit', n: 10 }, { type: 'collect', target: 'Iron Chunk', n: 3 }],
      rew: { xp: 520, gold: 220, items: [{ chestRarity: 'Blue' }], gems: 5 }
    },
    {
      id: 's2a', main: false, giver: 'captain', region: 'ironcrag', name: 'Howling Culls', minLvl: 9,
      desc: 'Crag Howlers stalk the trade road. Cull the pack.',
      objs: [{ type: 'kill', target: 'Crag Howler', n: 12 }],
      rew: { xp: 340, gold: 160, items: [{ pot: 'mp', n: 4 }] }
    },
    {
      id: 'm5', main: true, giver: 'captain', region: 'ironcrag', name: 'The Venom Tongue', minLvl: 13, pre: 'm4',
      desc: 'Descend into Venomwood and end the Weaver Matron\'s brood.',
      objs: [{ type: 'reach', target: 'Venomwood' }, { type: 'kill', target: 'Venom Weaver', n: 10 }, { type: 'boss', target: 'Matron Vileweaver', n: 1 }],
      rew: { xp: 900, gold: 420, stones: 1, gems: 10 }
    },
    {
      id: 's3a', main: false, giver: 'tilda', region: 'greendale', name: 'Silk Road Supply', minLvl: 6,
      desc: 'Tilda needs wares from the bog. Gather and deliver.',
      objs: [{ type: 'collect', target: 'Glow Silk', n: 3 }],
      rew: { xp: 300, gold: 240, items: [{ pot: 'hp', n: 3 }] }
    },
    {
      id: 'm6', main: true, giver: 'rowan', region: 'universal', name: 'Voices of Mistgrave', minLvl: 20,
      desc: 'Whispers ride the mist. Lay the Hollow dead to rest.',
      objs: [{ type: 'kill', target: 'Grave Sentinel', n: 10 }, { type: 'collect', target: 'Spectral Dust', n: 5 }],
      rew: { xp: 1500, gold: 500, gems: 10 }
    },
    {
      id: 'm7', main: true, giver: 'rowan', region: 'universal', name: "Winter's Fang", minLvl: 28,
      desc: 'Rimehorn stirs beneath Frosthaven. Break the ancient.',
      objs: [{ type: 'reach', target: 'Frostpeak' }, { type: 'boss', target: 'Rimehorn the Ancient', n: 1 }],
      rew: { xp: 2600, gold: 800, stones: 1, gems: 15 }
    },
    {
      id: 'm8', main: true, giver: 'rowan', region: 'universal', name: 'Sun & Sand', minLvl: 36,
      desc: 'The Scarab Sovereign chokes the desert roads. End its reign.',
      objs: [{ type: 'reach', target: 'Sunscorch Desert' }, { type: 'boss', target: 'Scarab Sovereign', n: 1 }],
      rew: { xp: 4200, gold: 1200, stones: 1, gems: 20 }
    },
    {
      id: 'm9', main: true, giver: 'rowan', region: 'universal', name: 'Ashen Gate', minLvl: 44,
      desc: 'Bind the Dominion. Slay the Ashen Tyrant and claim the Eternity Gate key.',
      objs: [{ type: 'reach', target: 'Ashen Dominion' }, { type: 'boss', target: 'Ashmaw the Tyrant', n: 1 }],
      rew: { xp: 7000, gold: 2000, key: true, stones: 1, gems: 25 }
    },
    {
      id: 'm10', main: true, giver: 'rowan', region: 'universal', name: 'Eternal Ascent', minLvl: 55,
      desc: 'The Tower of Eternity opens. Ascend and face the Warden.',
      objs: [{ type: 'reach', target: 'Tower of Eternity' }, { type: 'boss', target: 'The Eternal Warden', n: 1 }],
      rew: { xp: 12000, gold: 4000, gems: 60, itemCraft: 'divineShard' }
    },
    {
      id: 's4a', main: false, giver: 'miri', region: 'greendale', name: 'Pack Mule', minLvl: 8,
      desc: 'Miris storage runneth empty. Deposit any 5 items at the bank.',
      objs: [{ type: 'deposit', n: 5 }],
      rew: { xp: 260, gold: 200, gems: 5 }
    },
    {
      id: 's5a', main: false, giver: 'bram', region: 'greendale', name: 'Forge Heat', minLvl: 10,
      desc: 'Test Bram\'s anvil: fuse any 4 items once.',
      objs: [{ type: 'fuse', n: 1 }],
      rew: { xp: 400, gold: 300, items: [{ gear: { rarity: 'Blue', slot: 'weapon' } }] }
    }
  ];
  const questById = id => QUESTS.find(q => q.id === id);

  const NPCS = {
    rowan: { name: 'Elder Rowan', icon: '🧙', role: 'Elder of Dawnshire', questGiver: true },
    bram: { name: 'Blacksmith Bram', icon: '🔧', role: 'Forge & anvil' },
    tilda: { name: 'Merchant Tilda', icon: '🧺', role: 'Goods & wares' },
    miri: { name: 'Storage Keeper Miri', icon: '📦', role: 'Bank of Aetheria' },
    orin: { name: 'Teleporter Orin', icon: '🌀', role: 'Waygates' },
    silas: { name: 'Broker Silas', icon: '💰', role: 'Marketplace' },
    aurora: { name: 'Gilded Aurora', icon: '👑', role: 'Boutique & Gems' },
    captain: { name: 'Captain Darion', icon: '🎖️', role: 'Stonewatch Watch' },
    faction: { name: 'Faction Herald', icon: factionIcon(), role: 'Faction trials' }
  };
  function factionIcon() { return '⚜️'; }

  /* ---------------- recipes (legendary) ---------------- */
  const RECIPES = [
    { id: 'r_war_w', cls: 'warrior', slot: 'weapon', name: 'Recipe: Legendary Warblade', fee: 2500, mats: { ash_ember: 8, iron_ore: 10, spectral_dust: 5 }, stone: 1 },
    { id: 'r_war_c', cls: 'warrior', slot: 'chest', name: 'Recipe: Legendary Ironplate Mail', fee: 2200, mats: { ash_ember: 6, iron_ore: 12, frost_shard: 6 }, stone: 1 },
    { id: 'r_mag_w', cls: 'mage', slot: 'weapon', name: 'Recipe: Legendary Aether Staff', fee: 2500, mats: { eternal_crystal: 4, glow_silk: 10, spectral_dust: 5 }, stone: 1 },
    { id: 'r_mag_c', cls: 'mage', slot: 'chest', name: 'Recipe: Legendary Silkweave Mail', fee: 2200, mats: { glow_silk: 12, sun_sand: 8, frost_shard: 6 }, stone: 1 },
    { id: 'r_ass_w', cls: 'assassin', slot: 'weapon', name: 'Recipe: Legendary Twin Fangs', fee: 2500, mats: { sun_sand: 10, ash_ember: 8, glow_silk: 5 }, stone: 1 },
    { id: 'r_ass_c', cls: 'assassin', slot: 'chest', name: 'Recipe: Legendary Shadowleather Mail', fee: 2200, mats: { glow_silk: 10, spectral_dust: 8, ash_ember: 6 }, stone: 1 }
  ];

  /* ---------------- gem shop catalogue ---------------- */
  const SHOP = {
    costumes: [
      { id: 'c_royal', name: 'Royal Regalia', icon: '🤴', gems: 60, type: 'costume' },
      { id: 'c_shade', name: 'Shadefashion', icon: '🕺', gems: 45, type: 'costume' },
      { id: 'c_celes', name: 'Celestial Gown', icon: '💃', gems: 45, type: 'costume' }
    ],
    hairstyles: [
      { id: 'h_silver', name: 'Flowing Silver', icon: '💇', gems: 20, type: 'hair' },
      { id: 'h_godcrown', name: 'Godcrown Braid', icon: '👑', gems: 25, type: 'hair' }
    ],
    mounts: [
      { id: 'mo_courser', name: 'Silver Courser', icon: '🐎', gems: 0, gold: 5000, spd: 3.1, type: 'mount' },
      { id: 'mo_wolf', name: 'Ridge Warg', icon: '🐺', gold: 12000, spd: 3.4, type: 'mount' },
      { id: 'mo_drake', name: 'Ember Drake', icon: '🐲', gems: 80, spd: 3.7, type: 'mount' },
      { id: 'mo_stag', name: 'Frost Stag', icon: '🦌', gems: 110, spd: 4.0, type: 'mount' }
    ],
    pets: [
      { id: 'pe_wisp', name: 'Sprite Wisp', icon: '🫧', gems: 0, gold: 2500, perk: 'Pickup', type: 'pet' },
      { id: 'pe_fox', name: 'Kit Fox', icon: '🦊', gold: 6000, perk: 'Pickup', type: 'pet' },
      { id: 'pe_dragonlet', name: 'Sky Dragonet', icon: '🐉', gems: 90, perk: 'Pickup +2% gold', type: 'pet' },
      { id: 'pe_moth', name: 'Grave Moth', icon: '🦋', gems: 70, perk: 'Pickup +5% XP', type: 'pet' }
    ],
    fx: [
      { id: 'fx_ember', name: 'Ember Trail', icon: '🔥', gems: 20, type: 'fx' },
      { id: 'fx_frost', name: 'Frost Trail', icon: '❄️', gems: 20, type: 'fx' },
      { id: 'fx_void', name: 'Void Trail', icon: '🌌', gems: 25, type: 'fx' },
      { id: 'fx_holy', name: 'Holy Trail', icon: '✨', gems: 35, type: 'fx' }
    ],
    wings: [
      { id: 'wn_golden', name: 'Seraphic Wings', icon: '🕊️', gems: 120, faction: 'angel', type: 'wings' },
      { id: 'wn_black', name: 'Nighthawk Wings', icon: '🦇', gems: 120, faction: 'demon', type: 'wings' }
    ],
    gems: [
      { id: 'g_small', name: 'Satchel of Gems', qty: 20, free: true, desc: 'Demo — earned via play (or funded)' },
      { id: 'g_mid', name: 'Coffer of Gems', qty: 60, free: true, desc: 'Demo — funded daily quest path' },
      { id: 'g_big', name: 'Vault of Gems', qty: 150, free: true, desc: 'Demo — funded events' }
    ],
    premium: { id: 'prem', name: 'Grace of Aetheria', days: 30, gems: 100, desc: '+50% Gold & XP, daily gem drip', badge: 'PREMIUM' }
  };

  /* ---------------- helper: roll loot ---------------- */
  function rollDropRarity() {
    const roll = Math.random() * 100;
    let acc = 0;
    for (const [r, w] of Object.entries(DROP_SHARES)) {
      acc += w;
      if (roll < acc) return r;
    }
    return 'Common';
  }

  return {
    RARITIES, RARITY_COLOR, RARITY_MULT, DROP_SHARES, TIER_MULT, TIER_PREFIX,
    SLOTS, SLOT_NAMES, SLOT_ICON, powerAt,
    CLASSES, FACTIONS, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, GENDERS,
    makeItem, mat, bossStone, BOSS_AFFIXES, MATERIALS,
    MONSTER_KINDS, REGIONS, regionById, TOWNS, NPCS, ECON,
    QUESTS, questById, RECIPES, SHOP, rollDropRarity
  };
})();
