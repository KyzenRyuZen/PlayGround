// AETHERIA — central game configuration. All prices, odds and progression live here.

export const GAME = {
  title: 'AETHERIA',
  subtitle: 'Realms of the Sundered Sky',
  version: '1.0.0',
  saveKey: 'aetheria.save.v1',
  maxLevel: 60,
  inventorySize: 42,
  storageSize: 60,
  onlineMode: false,
  buildLabel: 'OFFLINE SOLO BUILD',
};

export const WORLD = {
  tileW: 96,
  tileH: 48,
  size: 64,
  elevation: 13,
  zoom: 0.9,
  cameraEase: 5.2,
};

export const TIERS = {
  T3: { key: 'T3', name: 'T3', mult: 1.0, color: '#b7b2a4', order: 3 },
  T2: { key: 'T2', name: 'T2', mult: 1.52, color: '#8bd7c2', order: 2 },
  T1: { key: 'T1', name: 'T1', mult: 2.3, color: '#f2ce7d', order: 1 },
};

export const RARITIES = {
  common: { key: 'common', name: 'Common', color: '#cfc9ba', glow: 'rgba(207,201,186,.28)', power: 1, dropChance: 60, next: 'grey' },
  grey: { key: 'grey', name: 'Grey', color: '#929ca4', glow: 'rgba(146,156,164,.34)', power: 1.22, dropChance: 25, next: 'green' },
  green: { key: 'green', name: 'Green', color: '#69d483', glow: 'rgba(105,212,131,.4)', power: 1.48, dropChance: 10, next: 'blue' },
  blue: { key: 'blue', name: 'Blue', color: '#65b7ff', glow: 'rgba(101,183,255,.46)', power: 1.82, dropChance: 5, next: 'purple' },
  purple: { key: 'purple', name: 'Purple', color: '#c184ff', glow: 'rgba(193,132,255,.52)', power: 2.25, dropChance: 0, next: null },
  legendary: { key: 'legendary', name: 'Legendary', color: '#ffab3d', glow: 'rgba(255,171,61,.56)', power: 2.95, dropChance: 0, next: 'mythic', craftOnly: true },
  mythic: { key: 'mythic', name: 'Mythic', color: '#ff5ce1', glow: 'rgba(255,92,225,.6)', power: 4.0, dropChance: 0, next: 'divine', craftOnly: true },
  divine: { key: 'divine', name: 'Divine', color: '#ffe98a', glow: 'rgba(255,233,138,.75)', power: 5.5, dropChance: 0, next: null, craftOnly: true },
};

export const DIRECT_DROPS = {
  equipmentChance: { normal: 0.34, elite: 0.62, boss: 1.0 },
  rarityWeights: [
    { rarity: 'common', chance: 60 },
    { rarity: 'grey', chance: 25 },
    { rarity: 'green', chance: 10 },
    { rarity: 'blue', chance: 5 },
  ],
  directTier: 'T3',
};

export const FUSION = {
  // Four identical pieces. T3 -> T2 -> T1 -> next rarity at T3.
  costGold: 0,
  purpleFusionCap: true,
  legendaryPattern: 4,
  mythicPattern: 4,
};

export const SLOTS = [
  { key: 'weapon', name: 'Weapon', stat: 'attack', base: 13, icon: 'sword' },
  { key: 'offhand', name: 'Offhand', stat: 'armor', base: 4, icon: 'shield' },
  { key: 'helm', name: 'Helm', stat: 'armor', base: 3, icon: 'helm' },
  { key: 'chest', name: 'Cuirass', stat: 'armor', base: 6, icon: 'chest' },
  { key: 'gloves', name: 'Gauntlets', stat: 'armor', base: 2, icon: 'glove' },
  { key: 'boots', name: 'Greaves', stat: 'armor', base: 2, icon: 'boot' },
  { key: 'belt', name: 'Belt', stat: 'armor', base: 2, icon: 'belt' },
  { key: 'ring', name: 'Ring', stat: 'attack', base: 3, icon: 'ring' },
  { key: 'amulet', name: 'Amulet', stat: 'attack', base: 2, icon: 'amulet' },
];

export const ITEM_BASES = {
  dawnblade: {
    weapon: { key: 'sunsteel_longsword', name: 'Sunsteel Longsword' },
    offhand: { key: 'dawnward_aegis', name: 'Dawnward Aegis' },
    helm: { key: 'sunforged_helm', name: 'Sunforged Helm' },
    chest: { key: 'sunforged_cuirass', name: 'Sunforged Cuirass' },
    gloves: { key: 'sunforged_gauntlets', name: 'Sunforged Gauntlets' },
    boots: { key: 'sunforged_greaves', name: 'Sunforged Greaves' },
    belt: { key: 'sunforged_belt', name: 'Sunforged Belt' },
    ring: { key: 'radiant_signet', name: 'Radiant Signet' },
    amulet: { key: 'dawnheart_amulet', name: 'Dawnheart Amulet' },
  },
  voidcaller: {
    weapon: { key: 'umbral_scepter', name: 'Umbral Scepter' },
    offhand: { key: 'nightbound_grimoire', name: 'Nightbound Grimoire' },
    helm: { key: 'voidweave_cowl', name: 'Voidweave Cowl' },
    chest: { key: 'voidweave_robes', name: 'Voidweave Robes' },
    gloves: { key: 'voidweave_handwraps', name: 'Voidweave Handwraps' },
    boots: { key: 'voidweave_slippers', name: 'Voidweave Slippers' },
    belt: { key: 'voidweave_sash', name: 'Voidweave Sash' },
    ring: { key: 'abyssal_band', name: 'Abyssal Band' },
    amulet: { key: 'nightstar_pendant', name: 'Nightstar Pendant' },
  },
  wildstalker: {
    weapon: { key: 'stormfang_blades', name: 'Stormfang Blades' },
    offhand: { key: 'gale_talisman', name: 'Gale Talisman' },
    helm: { key: 'wildroot_hood', name: 'Wildroot Hood' },
    chest: { key: 'wildroot_jerkin', name: 'Wildroot Jerkin' },
    gloves: { key: 'wildroot_grips', name: 'Wildroot Grips' },
    boots: { key: 'wildroot_striders', name: 'Wildroot Striders' },
    belt: { key: 'wildroot_baldric', name: 'Wildroot Baldric' },
    ring: { key: 'tempest_loop', name: 'Tempest Loop' },
    amulet: { key: 'hawkfeather_charm', name: 'Hawkfeather Charm' },
  },
};

const VITALITY_BASE = { weapon: 0, offhand: 2, helm: 3, chest: 5, gloves: 1, boots: 1, belt: 2, ring: 2, amulet: 3 };

export function makeItemKey(baseId, tier, rarity) {
  return `${baseId}|${tier}|${rarity}`;
}

export function parseItemKey(key) {
  const [baseId, tier = 'T3', rarity = 'common'] = String(key).split('|');
  return { baseId, tier, rarity };
}

export function baseFor(classId, slot) {
  return ITEM_BASES[classId]?.[slot] || ITEM_BASES.dawnblade[slot];
}

export function itemStats(key) {
  const { baseId, tier, rarity } = parseItemKey(key);
  let slot = 'ring';
  for (const cls of Object.values(ITEM_BASES)) {
    for (const [s, data] of Object.entries(cls)) if (data.key === baseId) slot = s;
  }
  const slotDef = SLOTS.find((s) => s.key === slot) || SLOTS[0];
  const tierMult = TIERS[tier]?.mult || 1;
  const rarityMult = RARITIES[rarity]?.power || 1;
  const power = tierMult * rarityMult;
  const attack = Math.round((slotDef.stat === 'attack' ? slotDef.base : 0) * power);
  const armor = Math.round((slotDef.stat === 'armor' ? slotDef.base : 0) * power);
  const vitality = Math.round((VITALITY_BASE[slot] || 1) * power);
  return { attack, armor, vitality, score: attack * 3 + armor * 2 + vitality * 4 };
}

export function itemInfo(key) {
  const { baseId, tier, rarity } = parseItemKey(key);
  let base = null;
  let slot = 'ring';
  for (const cls of Object.values(ITEM_BASES)) {
    for (const [s, data] of Object.entries(cls)) {
      if (data.key === baseId) { base = data; slot = s; }
    }
  }
  if (!base) base = { key: baseId, name: baseId.replace(/_/g, ' ') };
  return {
    key, ...parseItemKey(key), baseId, slot,
    name: base.name,
    tierName: TIERS[tier]?.name || tier,
    rarityName: RARITIES[rarity]?.name || rarity,
    rarityColor: RARITIES[rarity]?.color || '#ccc',
    stats: itemStats(key),
  };
}

export function itemValue(key) {
  const info = itemInfo(key);
  const tier = TIERS[info.tier]?.order || 3;
  const rarity = RARITIES[info.rarity]?.power || 1;
  return Math.round((18 + info.stats.score * 0.55) * (4 - tier) * rarity);
}

export const CLASSES = {
  dawnblade: {
    id: 'dawnblade',
    name: 'Dawnblade',
    role: 'Vanguard',
    weaponType: 'Longsword & Aegis',
    tagline: 'A blazing bulwark between the light and the dark.',
    lore: 'Sworn to the first sunrise, Dawnblades carve paths through shadow with sun-forged steel.',
    baseHp: 172, baseMana: 62, baseAttack: 15, baseArmor: 7,
    moveSpeed: 3.85, attackRange: 2.15, attackCooldown: 0.62, crit: 0.08,
    colors: { primary: '#c08a36', secondary: '#e8dfc8', accent: '#ffd36b', cape: '#661c25', metal: '#cfb378', cloth: '#7a2029', dark: '#34221a' },
    skill: {
      id: 'radiant_verdict', name: 'Radiant Verdict', type: 'verdict', color: '#ffd76b',
      desc: 'Call down three blades of dawnlight around your foe. Each beam scorches all enemies in a blazing radius.',
      mana: 22, cooldown: 6.2, baseDamage: 3.25, radius: 3.1,
    },
  },
  voidcaller: {
    id: 'voidcaller',
    name: 'Voidcaller',
    role: 'Arcanist',
    weaponType: 'Umbral Scepter',
    tagline: 'Reality bends where the scepter falls.',
    lore: 'They listened to the silence between stars. Now that silence answers their call.',
    baseHp: 128, baseMana: 136, baseAttack: 12, baseArmor: 4,
    moveSpeed: 3.7, attackRange: 6.2, attackCooldown: 0.82, crit: 0.13,
    colors: { primary: '#6c45b8', secondary: '#bca8d9', accent: '#a979ff', cape: '#24183f', metal: '#8d7bb3', cloth: '#2b1a4f', dark: '#130e24' },
    skill: {
      id: 'abyssal_singularity', name: 'Abyssal Singularity', type: 'singularity', color: '#b76bff',
      desc: 'Tear open a hungering rift that pulses five times, then collapses in a devastating void bloom.',
      mana: 34, cooldown: 7.8, baseDamage: 1.15, radius: 3.6,
    },
  },
  wildstalker: {
    id: 'wildstalker',
    name: 'Wildstalker',
    role: 'Shadehunter',
    weaponType: 'Stormfang Blades',
    tagline: 'The storm hunts at your heels.',
    lore: 'Exiles of the wild marches, they wield paired stormsteel fangs and strike before thunder follows.',
    baseHp: 146, baseMana: 92, baseAttack: 14, baseArmor: 5,
    moveSpeed: 4.35, attackRange: 4.8, attackCooldown: 0.5, crit: 0.18,
    colors: { primary: '#3d7c60', secondary: '#cdd6b1', accent: '#7ce3b0', cape: '#1d3f38', metal: '#a0b780', cloth: '#2d5b47', dark: '#182d27' },
    skill: {
      id: 'gale_barrage', name: 'Gale Barrage', type: 'barrage', color: '#72f1c2',
      desc: 'Summon a tempest of stormfang echoes above the target, striking five times with cutting gales.',
      mana: 27, cooldown: 6.8, baseDamage: 1.32, radius: 3.4,
    },
  },
};

export const FACTIONS = {
  angel: {
    id: 'angel',
    name: 'Angels',
    title: 'The Luminari',
    tagline: 'Mercy is a blade held with purpose.',
    lore: 'Wardens of the dawnroads. The Luminari seek to mend the Sundered Sky — even if the old laws must break.',
    colors: { primary: '#dfd8bd', metal: '#e8cb82', accent: '#ffd96f', dark: '#2a3140', glow: '#fff2b0' },
    bonus: 'Angels mend quickly: +12% healing and mana regeneration.',
  },
  demon: {
    id: 'demon',
    name: 'Demons',
    title: 'The Emberkin',
    tagline: 'Every crown is forged in fire.',
    lore: 'Heirs of the first flame. The Emberkin answer to no sky, and carve their own dominion from the ruins.',
    colors: { primary: '#8d2e35', metal: '#c07a46', accent: '#ff6a45', dark: '#231516', glow: '#ff855c' },
    bonus: 'Demons burn brighter: +8% weapon damage.',
  },
};

export const WINGS = {
  dawnfeather: {
    id: 'dawnfeather', name: 'Dawnfeather Pinions', faction: 'angel', source: 'quest', price: 0,
    desc: 'The first wings granted to a soul who answers the Sundered Sky.', colors: ['#f7f2de', '#ffdb86', '#d8b45c'], shape: 'feather',
  },
  emberpinions: {
    id: 'emberpinions', name: 'Emberpinions', faction: 'demon', source: 'quest', price: 0,
    desc: 'Wings of cinder and old fire, earned at the edge of the Ashen Gate.', colors: ['#7d2025', '#e65d35', '#ffb15c'], shape: 'bat',
  },
  seraphic: {
    id: 'seraphic', name: 'Seraphic Ascendance', faction: 'angel', source: 'shop', price: 900,
    desc: 'Six radiant pinions that shed gold-white embers with every beat.', colors: ['#fff9e5', '#ffd76b', '#80c9ff'], shape: 'seraph',
  },
  abyssal: {
    id: 'abyssal', name: 'Abyssal Crown', faction: 'demon', source: 'shop', price: 900,
    desc: 'Blackglass wings veined with violet lightning.', colors: ['#2a133e', '#9c51ff', '#ff52c8'], shape: 'bat',
  },
  sunspire: {
    id: 'sunspire', name: 'Sunspire Radiance', faction: 'angel', source: 'shop', price: 1600,
    desc: 'Pinions woven from the last light of the First Sun.', colors: ['#fff4c2', '#ffb43d', '#ff6b4a'], shape: 'seraph',
  },
  voidstar: {
    id: 'voidstar', name: 'Voidstar Remnant', faction: 'demon', source: 'shop', price: 1600,
    desc: 'The wings of a dead star, still burning at the edges.', colors: ['#120b24', '#6655ff', '#d8c8ff'], shape: 'bat',
  },
};

export const COSTUMES = [
  { id: 'verdant_wayfarer', name: 'Verdant Wayfarer', price: 500, desc: 'Moss-green travelling silks with leaf-gold stitching.', colors: { costumePrimary: '#39674f', costumeAccent: '#b8e08c', costumeCape: '#244837' } },
  { id: 'ashen_regalia', name: 'Ashen Regalia', price: 650, desc: 'Smoke-dark robes threaded with living embers.', colors: { costumePrimary: '#3b2727', costumeAccent: '#ff754a', costumeCape: '#1b1213' } },
  { id: 'astral_sovereign', name: 'Astral Sovereign', price: 1200, desc: 'A mantle cut from the night between stars.', colors: { costumePrimary: '#2a2c6a', costumeAccent: '#9b8dff', costumeCape: '#141534' } },
  { id: 'gilded_pilgrimage', name: 'Gilded Pilgrimage', price: 800, desc: 'Pilgrim vestments embroidered in temple gold.', colors: { costumePrimary: '#7a6038', costumeAccent: '#ffe08d', costumeCape: '#3e3021' } },
];

export const MOUNTS = {
  dawnmane: { id: 'dawnmane', name: 'Dawnmane Stag', price: 750, desc: 'An antlered spirit of the first forest.', speed: 0.32, colors: ['#eadcc0', '#c9a14b', '#fff1bc'], kind: 'stag' },
  nightmarish: { id: 'nightmarish', name: 'Nightmarish Steed', price: 750, desc: 'A coal-black charger wreathed in ember smoke.', speed: 0.32, colors: ['#2b2028', '#b84932', '#ff7a45'], kind: 'horse' },
  emerald_raptor: { id: 'emerald_raptor', name: 'Emerald Raptor', price: 950, desc: 'A swift jungle hunter with jade plumage.', speed: 0.4, colors: ['#3c785d', '#9fce77', '#d6e89b'], kind: 'raptor' },
  froststrider: { id: 'froststrider', name: 'Froststrider', price: 1100, desc: 'A creature of glacier and moonlit snow.', speed: 0.45, colors: ['#dbeaf4', '#78bfd7', '#f5ffff'], kind: 'stag' },
  cinder_wyrm: { id: 'cinder_wyrm', name: 'Cinder Wyrmling', price: 1500, desc: 'A small wyrm with a furnace in its chest.', speed: 0.5, colors: ['#391d1c', '#d14b2d', '#ffb04e'], kind: 'wyrm' },
};

export const PETS = {
  lumen_wisp: { id: 'lumen_wisp', name: 'Lumen Wisp', price: 300, desc: 'A little star that hums when you are near.', colors: ['#fff6bb', '#9bddff'], kind: 'wisp' },
  ember_imp: { id: 'ember_imp', name: 'Cinder Imp', price: 350, desc: 'Mischief with a tail made of sparks.', colors: ['#8f3030', '#ff8c4c'], kind: 'imp' },
  mossling: { id: 'mossling', name: 'Mossling', price: 280, desc: 'A sleepy forest spirit that smells of rain.', colors: ['#6b9e63', '#c7e68f'], kind: 'mossling' },
  frost_fox: { id: 'frost_fox', name: 'Frost Fox', price: 450, desc: 'Its pawprints freeze in the air for a heartbeat.', colors: ['#e7f5ff', '#8ed5ef'], kind: 'fox' },
  voidling: { id: 'voidling', name: 'Voidling', price: 600, desc: 'A friendly little tear in reality. Probably.', colors: ['#32204d', '#c381ff'], kind: 'wisp' },
};

export const WEAPON_EFFECTS = {
  sunfire: { id: 'sunfire', name: 'Sunfire Edge', price: 400, desc: 'Blade trails of molten gold.', color: '#ffd36b', glow: '#ff9c3d' },
  voidtear: { id: 'voidtear', name: 'Void Tear', price: 500, desc: 'A wound in reality follows your weapon.', color: '#b37cff', glow: '#6726d8' },
  frostbite: { id: 'frostbite', name: 'Frostbite', price: 450, desc: 'Shattering blue-white afterimages.', color: '#b9efff', glow: '#4bb8ff' },
  emberstorm: { id: 'emberstorm', name: 'Emberstorm', price: 550, desc: 'Sparks and ash trail every strike.', color: '#ff8a5c', glow: '#ff3d2e' },
};

export const SHOP_GEMS = [
  { id: 'gems_120', name: 'Pouch of Aether', gems: 120, price: '$1.99', bonus: 0, art: 'gem', desc: 'A small handful of crystallized aether.' },
  { id: 'gems_300', name: 'Coffer of Aether', gems: 300, price: '$4.99', bonus: 30, art: 'gem', desc: 'A velvet coffer with a few extra shards.' },
  { id: 'gems_750', name: 'Reliquary of Aether', gems: 750, price: '$9.99', bonus: 100, art: 'gem', desc: 'Enough aether to turn heads in any court.' },
  { id: 'gems_1600', name: 'Sovereign Cache', gems: 1600, price: '$19.99', bonus: 300, art: 'gem', desc: 'A vault-sealed cache of brilliant aether.' },
];

export const MEMBERSHIP = {
  id: 'premium_30',
  name: 'Skyward Membership',
  price: 800,
  days: 30,
  desc: '30 days of Skyward status: +10% experience, +10% gold, a gilded nameplate and an extra daily teleport.',
  perks: ['+10% experience', '+10% gold', 'Gilded nameplate', 'Daily fast-travel charge'],
};

export const SHOP = {
  gems: SHOP_GEMS,
  costumes: COSTUMES.map((x) => ({ ...x, currency: 'gems', art: 'costume' })),
  mounts: Object.values(MOUNTS).map((x) => ({ ...x, currency: 'gems', art: 'mount' })),
  pets: Object.values(PETS).map((x) => ({ ...x, currency: 'gems', art: 'pet' })),
  effects: Object.values(WEAPON_EFFECTS).map((x) => ({ ...x, currency: 'gems', art: 'effect' })),
  wings: Object.values(WINGS).filter((x) => x.source === 'shop').map((x) => ({ ...x, currency: 'gems', art: 'wings' })),
  membership: [{ ...MEMBERSHIP, currency: 'gems', art: 'membership' }],
};

export const PRICES = {
  potionHealth: 45,
  potionMana: 55,
  sellMultiplier: 0.32,
  marketListingDays: 3,
  marketMinPrice: 1,
  marketMaxPrice: 999999,
  skillUpgradeBase: 180,
  skillUpgradeGems: 0,
  legendaryCraftGold: 2200,
  legendaryCraftEssence: 2,
  potionBulk: 3,
};

export const QUESTS = {
  greendale: {
    id: 'trial_greendale', title: 'The Verdant Oath', giver: 'Warden Elowen', region: 'greendale',
    intro: 'Something old stirs beneath the roots of Oakhaven. Walk the green ways, still the beasts, and face the Thornmaw.',
    objectives: [{ type: 'kill', count: 8, label: 'Creatures subdued' }, { type: 'boss', target: 'thornmaw', label: 'Thornmaw defeated' }],
    rewards: { gold: 620, gems: 100, xp: 320, essence: 2, wing: 'dawnfeather' },
  },
  ironcrag: {
    id: 'trial_ironcrag', title: 'Rust and Ruin', giver: 'Forgemother Hild', region: 'ironcrag',
    intro: 'The Deepiron Foundry has gone silent. Break the crag-beasts and cast down the forge-master who sold his soul to slag.',
    objectives: [{ type: 'kill', count: 10, label: 'Crag creatures broken' }, { type: 'boss', target: 'korgrim', label: 'Korgrim defeated' }],
    rewards: { gold: 980, gems: 120, xp: 720, essence: 3, wing: null },
  },
  venomwood: {
    id: 'trial_venomwood', title: 'Where the Mire Sings', giver: 'Seer Sable', region: 'venomwood',
    intro: 'The bog has begun to dream. Cut back the brood and still the serpent queen before her song poisons the roots of the world.',
    objectives: [{ type: 'kill', count: 12, label: 'Bog creatures cleansed' }, { type: 'boss', target: 'vexmire', label: 'Queen Vexmire defeated' }],
    rewards: { gold: 1420, gems: 140, xp: 1320, essence: 3, wing: null },
  },
  mistgrave: {
    id: 'trial_mistgrave', title: 'Names in the Fog', giver: 'Keeper Orin', region: 'mistgrave',
    intro: 'The dead of Ravenwatch have forgotten their names. Lay the restless to rest and silence the lich beneath the Tomb of Whispers.',
    objectives: [{ type: 'kill', count: 14, label: 'Restless dead laid low' }, { type: 'boss', target: 'malakar', label: 'Malakar silenced' }],
    rewards: { gold: 1980, gems: 160, xp: 2050, essence: 4, wing: null },
  },
  frostpeak: {
    id: 'trial_frostpeak', title: 'The Long Winter', giver: 'Hearthkeeper Ysolde', region: 'frostpeak',
    intro: 'The glacier is waking, and its maw is hungry. Kindle the old braziers and bring down the Frostwyrm before the pass freezes forever.',
    objectives: [{ type: 'kill', count: 16, label: 'Frost creatures scattered' }, { type: 'boss', target: 'nivara', label: 'Nivara defeated' }],
    rewards: { gold: 2780, gems: 190, xp: 3100, essence: 4, wing: null },
  },
  sunscorch: {
    id: 'trial_sunscorch', title: 'The Buried Sun', giver: 'Sunseer Amara', region: 'sunscorch',
    intro: 'The desert has swallowed a thousand caravans. Follow the old stars into the Pharaoh Vault and break the crown that will not die.',
    objectives: [{ type: 'kill', count: 18, label: 'Dune creatures ended' }, { type: 'boss', target: 'anubis', label: 'Anubis unbound' }],
    rewards: { gold: 3820, gems: 220, xp: 4500, essence: 5, wing: null },
  },
  ashen: {
    id: 'trial_ashen', title: 'Crown of Cinders', giver: 'Ashwarden Vey', region: 'ashen',
    intro: 'The Ashen Dominion remembers every oath it broke. March into Blackpyre and end the tyrant who wears a crown of burning cities.',
    objectives: [{ type: 'kill', count: 20, label: 'Emberkin scattered' }, { type: 'boss', target: 'tyrant', label: 'The Ashen Tyrant defeated' }],
    rewards: { gold: 5200, gems: 280, xp: 6400, essence: 5, wing: null },
  },
  tower: {
    id: 'trial_tower', title: 'The Last Threshold', giver: 'The Watcher', region: 'tower',
    intro: 'At the top of Eternity, the Sundered Sky is still screaming. Climb the Spiral, face Aeon, and decide what the next age will remember.',
    objectives: [{ type: 'kill', count: 22, label: 'Astral wards broken' }, { type: 'boss', target: 'aeon', label: 'Aeon faced' }],
    rewards: { gold: 7500, gems: 500, xp: 10000, essence: 6, wing: null, title: 'Skybreaker' },
  },
};

export const REGIONS = {
  greendale: {
    id: 'greendale', name: 'Greendale', epithet: 'The Emerald Reach', level: 1, seed: 7,
    biome: 'meadow', weather: 'petals', mapPos: [23, 72], recommended: 'Levels 1–7',
    desc: 'Sun-dappled vales, old oaks and the lantern-lit village of Oakhaven.',
    palette: {
      sky: ['#41566a', '#bd9a74', '#f0c282'], fog: 'rgba(186,214,171,.14)', ambient: 'rgba(255,218,154,.12)',
      ground: ['#557d45', '#668d4c', '#739b55', '#4a713d'], cliff: '#5a4b39', cliffLight: '#7d6850',
      path: ['#9a7e50', '#8b6d45'], water: ['#2c6d70', '#499a8f', '#86c7ae'], rock: '#6b6656',
      accent: '#f3cf70', leaf: ['#37633e', '#4f7f49', '#6b9a54'], flowers: ['#f0d67c', '#e58f9a', '#b7d6ff'],
    },
    village: { name: 'Oakhaven', x: 20, y: 42, size: 7 },
    dungeon: { name: 'Hollowroot Crypt', x: 47, y: 18, size: 8 },
    bossId: 'thornmaw', spawns: ['moss_wolf', 'forest_boar', 'forest_sprite'], elite: 'elder_treant',
    quest: 'greendale', resource: { id: 'essence_greendale', name: 'Verdant Essence', color: '#8cdb7a' },
    giver: 'Warden Elowen', npcTitle: 'Warden of Oakhaven',
  },
  ironcrag: {
    id: 'ironcrag', name: 'Ironcrag', epithet: 'The Anvil of Kings', level: 8, seed: 31,
    biome: 'rock', weather: 'dust', mapPos: [47, 60], recommended: 'Levels 8–15',
    desc: 'Wind-scoured cliffs, foundry smoke and iron roads older than the first kingdoms.',
    palette: {
      sky: ['#3e4651', '#8e8174', '#d8ad77'], fog: 'rgba(203,194,172,.16)', ambient: 'rgba(255,193,114,.11)',
      ground: ['#716b5e', '#7d7566', '#666052', '#847b69'], cliff: '#4b4238', cliffLight: '#8e7d65',
      path: ['#a78a5d', '#937344'], water: ['#405b63', '#688a8d', '#9db3ad'], rock: '#655e50',
      accent: '#f2a34d', leaf: ['#4f6249', '#68764a', '#7f8450'], flowers: ['#e2b35a', '#cf7d5b', '#b5c4bb'],
    },
    village: { name: 'Forgehold', x: 22, y: 41, size: 7 },
    dungeon: { name: 'Deepiron Foundry', x: 45, y: 19, size: 8 },
    bossId: 'korgrim', spawns: ['iron_golem', 'crag_harpy', 'kobold'], elite: 'iron_golem',
    quest: 'ironcrag', resource: { id: 'essence_ironcrag', name: 'Embersteel Shard', color: '#ffb05c' },
    giver: 'Forgemother Hild', npcTitle: 'Master of Forgehold',
  },
  venomwood: {
    id: 'venomwood', name: 'Venomwood', epithet: 'The Singing Mire', level: 15, seed: 83,
    biome: 'swamp', weather: 'spores', mapPos: [72, 75], recommended: 'Levels 15–22',
    desc: 'Luminous fungus, black water and a song that makes the trees lean closer.',
    palette: {
      sky: ['#293c3a', '#576655', '#b49671'], fog: 'rgba(143,200,120,.18)', ambient: 'rgba(158,220,134,.12)',
      ground: ['#415e45', '#4e6b4d', '#3b5441', '#5b7552'], cliff: '#3e3a31', cliffLight: '#645d49',
      path: ['#6d6749', '#59523e'], water: ['#2d5048', '#4b7569', '#78a86c'], rock: '#4a4c3e',
      accent: '#b4ff83', leaf: ['#3b694a', '#587b53', '#7e8b52'], flowers: ['#e2ff9e', '#c478ff', '#7af8d2'],
    },
    village: { name: 'Mirefen', x: 20, y: 43, size: 7 },
    dungeon: { name: 'Serpent Hollow', x: 46, y: 19, size: 8 },
    bossId: 'vexmire', spawns: ['bog_lurker', 'venom_spider', 'sporeling'], elite: 'bog_lurker',
    quest: 'venomwood', resource: { id: 'essence_venomwood', name: 'Venomheart', color: '#b6ff68' },
    giver: 'Seer Sable', npcTitle: 'Mire-Speaker',
  },
  mistgrave: {
    id: 'mistgrave', name: 'Mistgrave', epithet: 'The Mourning Moors', level: 22, seed: 137,
    biome: 'graveyard', weather: 'mist', mapPos: [30, 44], recommended: 'Levels 22–30',
    desc: 'Cold stone, colder bells, and fog that remembers the faces of the drowned.',
    palette: {
      sky: ['#252d3c', '#54596a', '#8a7b76'], fog: 'rgba(168,181,205,.25)', ambient: 'rgba(156,186,222,.14)',
      ground: ['#4a4d51', '#565a5c', '#41464a', '#60615d'], cliff: '#38373b', cliffLight: '#656367',
      path: ['#6d6b60', '#5d5c54'], water: ['#293d48', '#445f6b', '#76878c'], rock: '#58565a',
      accent: '#a7d4ff', leaf: ['#3a4346', '#4c5556', '#60645c'], flowers: ['#c2d8f0', '#d6a8c8', '#e8d99b'],
    },
    village: { name: 'Ravenwatch', x: 22, y: 41, size: 7 },
    dungeon: { name: 'Tomb of Whispers', x: 44, y: 18, size: 8 },
    bossId: 'malakar', spawns: ['grave_wraith', 'skeleton_guard', 'ghoul'], elite: 'grave_wraith',
    quest: 'mistgrave', resource: { id: 'essence_mistgrave', name: 'Soulfrost', color: '#a8dcff' },
    giver: 'Keeper Orin', npcTitle: 'Keeper of Names',
  },
  frostpeak: {
    id: 'frostpeak', name: 'Frostpeak', epithet: 'The Crown of Winter', level: 30, seed: 211,
    biome: 'snow', weather: 'snow', mapPos: [60, 29], recommended: 'Levels 30–38',
    desc: 'White silence, blue glaciers and hearth-fires that hold back the endless dark.',
    palette: {
      sky: ['#2d4159', '#7594b3', '#d8e6ec'], fog: 'rgba(214,238,255,.23)', ambient: 'rgba(180,221,255,.15)',
      ground: ['#c4d4da', '#d5e3e7', '#adbec8', '#e7f0f2'], cliff: '#7c8d9a', cliffLight: '#b5c6ce',
      path: ['#a7b5ba', '#8f9fa7'], water: ['#4f89a5', '#76b5c8', '#b3e2e9'], rock: '#89959d',
      accent: '#9fe9ff', leaf: ['#3c5b5b', '#5e7e75', '#8faaa0'], flowers: ['#e8ffff', '#b4d9ff', '#d4b4ff'],
    },
    village: { name: 'Hearthvale', x: 21, y: 42, size: 7 },
    dungeon: { name: 'Glacier Maw', x: 45, y: 19, size: 8 },
    bossId: 'nivara', spawns: ['frost_wolf', 'ice_wraith', 'yeti'], elite: 'yeti',
    quest: 'frostpeak', resource: { id: 'essence_frostpeak', name: 'Glacier Tear', color: '#92e6ff' },
    giver: 'Hearthkeeper Ysolde', npcTitle: 'Keeper of the Hearth',
  },
  sunscorch: {
    id: 'sunscorch', name: 'Sunscorch Desert', epithet: 'The Buried Sun', level: 38, seed: 307,
    biome: 'desert', weather: 'dust', mapPos: [12, 38], recommended: 'Levels 38–46',
    desc: 'Dunes like hammered gold, temples drowned in sand and stars that burn in daylight.',
    palette: {
      sky: ['#523e48', '#b07a68', '#f2c383'], fog: 'rgba(246,205,146,.16)', ambient: 'rgba(255,186,105,.17)',
      ground: ['#b08a56', '#c09b62', '#a37c4c', '#d0ac70'], cliff: '#87613b', cliffLight: '#c89b61',
      path: ['#d0aa70', '#bb925c'], water: ['#2e7180', '#5aa79d', '#a7d6b5'], rock: '#947149',
      accent: '#ffc95c', leaf: ['#6d7848', '#8f8a4e', '#a88e4c'], flowers: ['#ffcf70', '#ff9a7c', '#c3e6b6'],
    },
    village: { name: 'Sunspire', x: 22, y: 40, size: 7 },
    dungeon: { name: "Pharaoh's Vault", x: 46, y: 20, size: 8 },
    bossId: 'anubis', spawns: ['dune_scorpion', 'sand_wraith', 'mummy'], elite: 'dune_scorpion',
    quest: 'sunscorch', resource: { id: 'essence_sunscorch', name: 'Sun Amber', color: '#ffc857' },
    giver: 'Sunseer Amara', npcTitle: 'Reader of the Burning Stars',
  },
  ashen: {
    id: 'ashen', name: 'Ashen Dominion', epithet: 'The Broken Crown', level: 46, seed: 401,
    biome: 'volcanic', weather: 'ash', mapPos: [79, 45], recommended: 'Levels 46–54',
    desc: 'Obsidian keeps, rivers of fire and a sky that has forgotten how to rain.',
    palette: {
      sky: ['#21171c', '#57302f', '#9b4f39'], fog: 'rgba(162,77,58,.18)', ambient: 'rgba(255,92,50,.14)',
      ground: ['#3f3333', '#4c3b37', '#332b2d', '#5b4239'], cliff: '#241f22', cliffLight: '#58403a',
      path: ['#6a5142', '#593f34'], water: ['#9b3a1f', '#d45b26', '#ffb43d'], rock: '#34282a',
      accent: '#ff7a42', leaf: ['#3a2b27', '#4d352d', '#633b2c'], flowers: ['#ff8c54', '#ffd36b', '#9c5e4d'],
    },
    village: { name: 'Cinderhold', x: 21, y: 41, size: 7 },
    dungeon: { name: 'Blackpyre Citadel', x: 45, y: 20, size: 8 },
    bossId: 'tyrant', spawns: ['magma_hound', 'ash_wraith', 'cinder_imp'], elite: 'magma_hound',
    quest: 'ashen', resource: { id: 'essence_ashen', name: 'Cinder Crown', color: '#ff8850' },
    giver: 'Ashwarden Vey', npcTitle: 'Warden of the Last Gate',
  },
  tower: {
    id: 'tower', name: 'Tower of Eternity', epithet: 'The Sundered Spiral', level: 55, seed: 503,
    biome: 'astral', weather: 'stars', mapPos: [51, 13], recommended: 'Levels 55–60',
    desc: 'A tower without a base, suspended in the wound where the sky was torn open.',
    palette: {
      sky: ['#0e1128', '#252759', '#7363a8'], fog: 'rgba(160,143,255,.2)', ambient: 'rgba(142,118,255,.17)',
      ground: ['#47436b', '#56517d', '#3d3a5d', '#69618c'], cliff: '#282544', cliffLight: '#6c6392',
      path: ['#7770a0', '#645d8b'], water: ['#302766', '#5e4fae', '#bcb7ff'], rock: '#3c3759',
      accent: '#c6b7ff', leaf: ['#443f69', '#5c5485', '#7f70a7'], flowers: ['#d8d1ff', '#7fd9ff', '#ffb6f1'],
    },
    village: { name: 'Astral Enclave', x: 22, y: 41, size: 7 },
    dungeon: { name: 'Eternity Spiral', x: 44, y: 20, size: 8 },
    bossId: 'aeon', spawns: ['star_wisp', 'void_sentinel', 'astral_horror'], elite: 'void_sentinel',
    quest: 'tower', resource: { id: 'essence_tower', name: 'Eternity Shard', color: '#c9baff' },
    giver: 'The Watcher', npcTitle: 'Keeper of the Last Threshold',
  },
};

// Shared enemy definitions. Bosses are included here for the codex and AI.
export const MONSTERS = {
  moss_wolf: { id: 'moss_wolf', name: 'Moss Wolf', kind: 'wolf', title: 'Beast', level: 1, hp: 64, damage: 7, speed: 1.65, radius: 0.3, xp: 26, gold: [5, 11], size: 0.8, colors: ['#526b43', '#809a5f', '#b9bf82'], aggro: 5.6 },
  forest_boar: { id: 'forest_boar', name: 'Forest Boar', kind: 'boar', title: 'Beast', level: 2, hp: 88, damage: 9, speed: 1.35, radius: 0.34, xp: 32, gold: [6, 13], size: 0.9, colors: ['#604831', '#9a7a51', '#d3bb8a'], aggro: 4.6 },
  forest_sprite: { id: 'forest_sprite', name: 'Glimmer Sprite', kind: 'sprite', title: 'Fae', level: 2, hp: 48, damage: 8, speed: 1.9, radius: 0.25, xp: 36, gold: [8, 15], size: 0.68, colors: ['#bfe783', '#f6f4b0', '#8fd7c2'], aggro: 5.2, ranged: true },
  elder_treant: { id: 'elder_treant', name: 'Elder Treant', kind: 'treant', title: 'Ancient', level: 4, hp: 340, damage: 13, speed: 0.9, radius: 0.52, xp: 150, gold: [40, 70], size: 1.25, colors: ['#4c5b39', '#82995c', '#d4c18a'], elite: true },

  iron_golem: { id: 'iron_golem', name: 'Iron Golem', kind: 'golem', title: 'Construct', level: 8, hp: 155, damage: 13, speed: 0.85, radius: 0.4, xp: 82, gold: [18, 30], size: 1.0, colors: ['#525b5d', '#8c7b63', '#c0a578'], aggro: 5.2 },
  crag_harpy: { id: 'crag_harpy', name: 'Crag Harpy', kind: 'harpy', title: 'Beast', level: 9, hp: 105, damage: 12, speed: 1.9, radius: 0.3, xp: 88, gold: [15, 26], size: 0.85, colors: ['#7a5b4c', '#c19e74', '#dcb78f'], aggro: 6.2, ranged: true },
  kobold: { id: 'kobold', name: 'Cinder Kobold', kind: 'kobold', title: 'Vermin', level: 9, hp: 88, damage: 11, speed: 1.7, radius: 0.25, xp: 74, gold: [14, 24], size: 0.7, colors: ['#73513e', '#bd8356', '#f1c87a'], aggro: 4.8 },

  bog_lurker: { id: 'bog_lurker', name: 'Bog Lurker', kind: 'lurker', title: 'Aberration', level: 15, hp: 205, damage: 18, speed: 1.0, radius: 0.4, xp: 150, gold: [28, 46], size: 1.0, colors: ['#3f5b43', '#74844f', '#b8d78c'], aggro: 5.0 },
  venom_spider: { id: 'venom_spider', name: 'Venom Spider', kind: 'spider', title: 'Beast', level: 16, hp: 145, damage: 16, speed: 1.7, radius: 0.32, xp: 142, gold: [25, 40], size: 0.85, colors: ['#3e3546', '#807034', '#b6d858'], aggro: 5.6 },
  sporeling: { id: 'sporeling', name: 'Sporeling', kind: 'mushroom', title: 'Fungus', level: 16, hp: 170, damage: 15, speed: 1.1, radius: 0.3, xp: 138, gold: [22, 38], size: 0.8, colors: ['#6e4d73', '#b56cab', '#dce995'], aggro: 4.8, ranged: true },

  grave_wraith: { id: 'grave_wraith', name: 'Grave Wraith', kind: 'wraith', title: 'Undead', level: 22, hp: 240, damage: 24, speed: 1.4, radius: 0.32, xp: 250, gold: [42, 64], size: 0.95, colors: ['#455668', '#9bb3c9', '#d7ecff'], aggro: 6.0 },
  skeleton_guard: { id: 'skeleton_guard', name: 'Skeleton Guard', kind: 'skeleton', title: 'Undead', level: 23, hp: 265, damage: 22, speed: 1.2, radius: 0.3, xp: 240, gold: [40, 61], size: 0.92, colors: ['#8b846f', '#d8d0b4', '#a9c8d8'], aggro: 5.4 },
  ghoul: { id: 'ghoul', name: 'Moor Ghoul', kind: 'ghoul', title: 'Undead', level: 23, hp: 290, damage: 26, speed: 1.55, radius: 0.34, xp: 266, gold: [45, 70], size: 0.95, colors: ['#596052', '#8b9578', '#c1cb9d'], aggro: 5.6 },

  frost_wolf: { id: 'frost_wolf', name: 'Frost Wolf', kind: 'wolf', title: 'Beast', level: 30, hp: 360, damage: 31, speed: 1.8, radius: 0.34, xp: 390, gold: [60, 90], size: 0.9, colors: ['#697f8b', '#bcd6df', '#effaff'], aggro: 6.4 },
  ice_wraith: { id: 'ice_wraith', name: 'Ice Wraith', kind: 'wraith', title: 'Elemental', level: 31, hp: 390, damage: 34, speed: 1.35, radius: 0.32, xp: 420, gold: [66, 100], size: 1.0, colors: ['#5f7f9b', '#a8d9ee', '#f1ffff'], aggro: 6.2, ranged: true },
  yeti: { id: 'yeti', name: 'Rime Yeti', kind: 'yeti', title: 'Beast', level: 32, hp: 520, damage: 42, speed: 1.15, radius: 0.46, xp: 470, gold: [75, 112], size: 1.15, colors: ['#aebec4', '#e8f2f3', '#7a9da9'], aggro: 5.2 },

  dune_scorpion: { id: 'dune_scorpion', name: 'Dune Scorpion', kind: 'scorpion', title: 'Beast', level: 38, hp: 610, damage: 48, speed: 1.45, radius: 0.42, xp: 620, gold: [92, 135], size: 1.05, colors: ['#8b663a', '#d1a356', '#f4d78a'], aggro: 5.8 },
  sand_wraith: { id: 'sand_wraith', name: 'Sand Wraith', kind: 'wraith', title: 'Undead', level: 39, hp: 570, damage: 46, speed: 1.5, radius: 0.32, xp: 640, gold: [90, 142], size: 1.0, colors: ['#7b6240', '#d7b775', '#ffe7a3'], aggro: 6.2, ranged: true },
  mummy: { id: 'mummy', name: 'Vault Mummy', kind: 'mummy', title: 'Undead', level: 40, hp: 700, damage: 52, speed: 1.0, radius: 0.36, xp: 680, gold: [100, 155], size: 1.0, colors: ['#90784d', '#d0bf8b', '#f0e3b9'], aggro: 5.0 },

  magma_hound: { id: 'magma_hound', name: 'Magma Hound', kind: 'wolf', title: 'Elemental', level: 46, hp: 880, damage: 62, speed: 1.8, radius: 0.36, xp: 900, gold: [130, 195], size: 0.98, colors: ['#3c2525', '#b4402b', '#ffb457'], aggro: 6.6 },
  ash_wraith: { id: 'ash_wraith', name: 'Ash Wraith', kind: 'wraith', title: 'Undead', level: 47, hp: 810, damage: 64, speed: 1.55, radius: 0.32, xp: 940, gold: [135, 210], size: 1.0, colors: ['#463b3c', '#b18c7a', '#ffb07a'], aggro: 6.4, ranged: true },
  cinder_imp: { id: 'cinder_imp', name: 'Cinder Imp', kind: 'imp', title: 'Fiend', level: 47, hp: 760, damage: 58, speed: 2.0, radius: 0.28, xp: 900, gold: [145, 215], size: 0.75, colors: ['#68232b', '#d2543a', '#ffbc64'], aggro: 6.8 },

  star_wisp: { id: 'star_wisp', name: 'Star Wisp', kind: 'sprite', title: 'Astral', level: 55, hp: 1100, damage: 78, speed: 1.7, radius: 0.28, xp: 1300, gold: [190, 280], size: 0.78, colors: ['#7b6bc5', '#d9d1ff', '#7fe5ff'], aggro: 6.8, ranged: true },
  void_sentinel: { id: 'void_sentinel', name: 'Void Sentinel', kind: 'golem', title: 'Construct', level: 56, hp: 1450, damage: 90, speed: 1.0, radius: 0.42, xp: 1450, gold: [210, 320], size: 1.15, colors: ['#373352', '#6a5f9a', '#c6b8ff'], aggro: 5.6 },
  astral_horror: { id: 'astral_horror', name: 'Astral Horror', kind: 'horror', title: 'Aberration', level: 57, hp: 1300, damage: 86, speed: 1.35, radius: 0.4, xp: 1500, gold: [220, 340], size: 1.08, colors: ['#352c50', '#8c6fc3', '#ffb6f1'], aggro: 6.2 },

  thornmaw: { id: 'thornmaw', name: 'Thornmaw the Verdant', kind: 'treant', title: 'Boss · Hollowroot Crypt', level: 6, hp: 780, damage: 18, speed: 0.95, radius: 0.7, xp: 560, gold: [210, 330], size: 1.7, colors: ['#3e5537', '#8f9f57', '#ffd078'], boss: true, aggro: 8 },
  korgrim: { id: 'korgrim', name: 'Forgemaster Korgrim', kind: 'golem', title: 'Boss · Deepiron Foundry', level: 13, hp: 1550, damage: 27, speed: 1.0, radius: 0.66, xp: 1400, gold: [380, 540], size: 1.65, colors: ['#4d5558', '#ae8358', '#ffb052'], boss: true, aggro: 8 },
  vexmire: { id: 'vexmire', name: 'Queen Vexmire', kind: 'serpent', title: 'Boss · Serpent Hollow', level: 20, hp: 2600, damage: 38, speed: 1.2, radius: 0.62, xp: 2800, gold: [560, 780], size: 1.6, colors: ['#3e4f36', '#84924d', '#c6ff76'], boss: true, aggro: 8.5 },
  malakar: { id: 'malakar', name: 'Lich Malakar', kind: 'lich', title: 'Boss · Tomb of Whispers', level: 28, hp: 4200, damage: 52, speed: 1.0, radius: 0.55, xp: 5200, gold: [820, 1100], size: 1.5, colors: ['#3c4156', '#98b5c9', '#bdf1ff'], boss: true, aggro: 9 },
  nivara: { id: 'nivara', name: 'Frostwyrm Nivara', kind: 'wyrm', title: 'Boss · Glacier Maw', level: 36, hp: 6700, damage: 68, speed: 1.35, radius: 0.8, xp: 8200, gold: [1100, 1550], size: 2.0, colors: ['#6f8795', '#d7edf5', '#8ce7ff'], boss: true, aggro: 9 },
  anubis: { id: 'anubis', name: 'Sandking Anubis', kind: 'pharaoh', title: 'Boss · Pharaoh Vault', level: 44, hp: 9800, damage: 88, speed: 1.15, radius: 0.6, xp: 12200, gold: [1500, 2100], size: 1.55, colors: ['#7f5c33', '#e2bd6d', '#ffe39c'], boss: true, aggro: 9 },
  tyrant: { id: 'tyrant', name: 'The Ashen Tyrant', kind: 'tyrant', title: 'Boss · Blackpyre Citadel', level: 52, hp: 14200, damage: 112, speed: 1.05, radius: 0.75, xp: 18000, gold: [2100, 2900], size: 1.85, colors: ['#3b2525', '#a33d2e', '#ff8a4a'], boss: true, aggro: 9.5 },
  aeon: { id: 'aeon', name: 'Aeon, the Unending', kind: 'aeon', title: 'Final Boss · Eternity Spiral', level: 60, hp: 21000, damage: 145, speed: 1.2, radius: 0.8, xp: 32000, gold: [3600, 5000], size: 1.9, colors: ['#39345d', '#c5b9ff', '#7fe5ff'], boss: true, aggro: 10 },
};

export const HAIRSTYLES = [
  { id: 'flowing', name: 'Flowing' },
  { id: 'braided', name: 'Braided' },
  { id: 'short', name: 'Cropped' },
  { id: 'wild', name: 'Wild' },
  { id: 'topknot', name: 'Topknot' },
  { id: 'shaved', name: 'Shaved' },
  { id: 'long_side', name: 'Temple Veil' },
];
export const HAIR_COLORS = ['#2a1b16', '#6a422c', '#a87845', '#d6bd85', '#ece5d4', '#9c2e32', '#4a2e68', '#ececec'];
export const EYE_COLORS = ['#8dd7ff', '#d9ff9f', '#ffd36b', '#ff8d6b', '#c993ff', '#7fffe2', '#e5e7eb', '#bf5d47'];
export const SKIN_TONES = ['#f1d2b6', '#dfb18f', '#bd825e', '#8e5a3f', '#65402f', '#d5a785', '#bca1a4'];
export const MARKINGS = [
  { id: 'none', name: 'None' },
  { id: 'rune', name: 'Rune Sigil' },
  { id: 'scar', name: 'War Scar' },
  { id: 'tears', name: 'Tear Lines' },
  { id: 'freckles', name: 'Freckles' },
];

export const LOADING_TIPS = [
  'Direct equipment drops are always T3 — higher rarities only come from fusion or forging.',
  'Four identical pieces fuse upward. No roll, no failure, no lost gear.',
  'Legendary gear is forged at the blacksmith, then four matching pieces become Mythic.',
  'Both factions walk the same realms. Your allegiance changes your wings, not your welcome.',
  'Waystones remember every village you have visited.',
  'Your pet is cosmetic-only. It will never judge your build. Probably.',
];

export const SERVICE_NPCS = {
  merchant: { name: 'Merchant', icon: 'cart' },
  blacksmith: { name: 'Blacksmith', icon: 'hammer' },
  keeper: { name: 'Vault Keeper', icon: 'chest' },
  questgiver: { name: 'Quest Giver', icon: 'scroll' },
  waystone: { name: 'Waystone', icon: 'spark' },
};
