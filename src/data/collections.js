/* Collectible companions, mounts, costumes and magical stones. */

export const PETS = {
  mossling: {
    id: 'mossling', name: 'Mossling', rarity: 'common', visual: 'slime', element: 'poison',
    title: 'A damp little friend', source: 'Summoned from a Wild Egg',
    desc: 'A lump of living moss that hums when it is happy. It is usually happy.',
    bonus: [{ stat: 'hp', base: 25, perLevel: 12 }],
    skill: { name: 'Spore Burst', cooldown: 10, mult: 0.5, element: 'poison', desc: 'Poisonous spores damage the enemy.' },
    palette: { primary: '#6fa85a', secondary: '#2d4d2b', glow: '#b9e78e' }, eggWeight: 24,
  },
  cinderpup: {
    id: 'cinderpup', name: 'Cinderpup', rarity: 'common', visual: 'wolf', element: 'fire',
    title: 'A very warm puppy', source: 'Wild Egg · Ashen Marches',
    desc: 'Its tail leaves scorch marks on the furniture. Worth it.',
    bonus: [{ stat: 'attack', base: 8, perLevel: 4 }],
    skill: { name: 'Ember Nip', cooldown: 8, mult: 0.9, element: 'fire', desc: 'Bites with ember-hot teeth.' },
    palette: { primary: '#d5743f', secondary: '#5d2415', glow: '#ffb06e' }, eggWeight: 20,
  },
  gloomwolf: {
    id: 'gloomwolf', name: 'Gloomfang Pup', rarity: 'rare', visual: 'wolf', element: 'shadow',
    title: 'He remembers every hunt', source: 'Wild Egg · Dungeon chests',
    desc: 'A shadow-backed pup that sleeps in doorways and dreams of bigger prey.',
    bonus: [{ stat: 'critChance', base: 2, perLevel: 0.35 }],
    skill: { name: 'Shadow Pounce', cooldown: 9, mult: 1.3, element: 'shadow', desc: 'Pounces from the dark for a critical strike.' },
    palette: { primary: '#6f5e9b', secondary: '#231a38', glow: '#b49bff' }, eggWeight: 13,
  },
  stoneback: {
    id: 'stoneback', name: 'Stoneback', rarity: 'rare', visual: 'boar', element: 'physical',
    title: 'A walking wall', source: 'Wild Egg · Dungeon chests',
    desc: 'Half boar, half boulder, entirely immovable when it decides to nap.',
    bonus: [{ stat: 'defense', base: 16, perLevel: 9 }, { stat: 'hp', base: 30, perLevel: 15 }],
    skill: { name: 'Boulder Charge', cooldown: 12, mult: 0.8, element: 'physical', desc: 'Charges shoulder-first into the enemy.' },
    palette: { primary: '#8b8378', secondary: '#3d3935', glow: '#cfc4a8' }, eggWeight: 12,
  },
  runeraven: {
    id: 'runeraven', name: 'Runeraven', rarity: 'rare', visual: 'raven', element: 'arcane',
    title: 'Keeper of small secrets', source: 'Wild Egg · Umbral Depths',
    desc: 'It collects shiny things and inconvenient truths.',
    bonus: [{ stat: 'lootFind', base: 4, perLevel: 0.45 }, { stat: 'goldFind', base: 5, perLevel: 0.55 }],
    skill: { name: 'Talon Hex', cooldown: 11, mult: 0.7, element: 'arcane', desc: 'A cursed talon-rake that saps the enemy.' },
    palette: { primary: '#4f4170', secondary: '#1c142c', glow: '#a98bff' }, eggWeight: 10,
  },
  lunemoth: {
    id: 'lunemoth', name: 'Lunemoth', rarity: 'epic', visual: 'wisp', element: 'arcane',
    title: 'A lantern with wings', source: 'Wild Egg · Moonlit events',
    desc: 'Its wings hold the last light of a moon that fell behind the vale.',
    bonus: [{ stat: 'goldFind', base: 10, perLevel: 0.8 }, { stat: 'lootFind', base: 5, perLevel: 0.5 }],
    skill: { name: 'Moon Dust', cooldown: 10, mult: 1.1, element: 'arcane', desc: 'Scatters silver dust that burns the unholy.' },
    palette: { primary: '#cfd6ff', secondary: '#645d9e', glow: '#d9d2ff' }, eggWeight: 5,
  },
  emberfox: {
    id: 'emberfox', name: 'Emberfox', rarity: 'epic', visual: 'fox', element: 'fire',
    title: 'Nine tails, one temper', source: 'Wild Egg · Dragonfall',
    desc: 'A fox made of banked coals. It steals gloves and sets them on fire.',
    bonus: [{ stat: 'attackSpeed', base: 4, perLevel: 0.3 }, { stat: 'attack', base: 12, perLevel: 6 }],
    skill: { name: 'Foxfire', cooldown: 7, mult: 1.4, element: 'fire', desc: 'Blue flame leaps from its tails.' },
    palette: { primary: '#e8824f', secondary: '#6b2717', glow: '#ffb26b' }, eggWeight: 4,
  },
  voidcat: {
    id: 'voidcat', name: 'Nyx Kitten', rarity: 'epic', visual: 'fox', element: 'shadow',
    title: 'Exists in two places', source: 'Wild Egg · Astral Throne',
    desc: 'A cat-shaped absence. Do not look directly at the tail.',
    bonus: [{ stat: 'resistShadow', base: 4, perLevel: 0.4 }, { stat: 'critChance', base: 2, perLevel: 0.25 }],
    skill: { name: 'Rift Claw', cooldown: 8, mult: 1.5, element: 'shadow', desc: 'Rakes through a seam in reality.' },
    palette: { primary: '#7e67b6', secondary: '#231b3b', glow: '#c3a8ff' }, eggWeight: 4,
  },
  ashwing: {
    id: 'ashwing', name: 'Ashwing the Emberling', rarity: 'legendary', visual: 'imp', element: 'fire',
    title: 'Born in the Worldflame', source: 'Premium shop · Dragonfall chests',
    desc: 'A fist-sized ember demon with enormous opinions and a taste for boss armor.',
    bonus: [{ stat: 'bossDamage', base: 6, perLevel: 0.45 }, { stat: 'attack', base: 22, perLevel: 10 }],
    skill: { name: 'Cinder Dive', cooldown: 8, mult: 1.8, element: 'fire', desc: 'Dives into the enemy in a burst of cinders.' },
    palette: { primary: '#ff8950', secondary: '#56170d', glow: '#ffcf8a' }, eggWeight: 1.5,
  },
  stormdrake: {
    id: 'stormdrake', name: 'Stormdrake Whelp', rarity: 'mythic', visual: 'drake', element: 'ice',
    title: 'A thundercloud with claws', source: 'Astral Throne · Mythic eggs',
    desc: 'It hatched during a storm that has not stopped since.',
    bonus: [{ stat: 'skillDamage', base: 8, perLevel: 0.55 }, { stat: 'attack', base: 35, perLevel: 16 }, { stat: 'attackSpeed', base: 3, perLevel: 0.2 }],
    skill: { name: 'Storm Breath', cooldown: 9, mult: 2.1, element: 'ice', desc: 'A cone of lightning and sleet.' },
    palette: { primary: '#7ec8e8', secondary: '#283c66', glow: '#c4f1ff' }, eggWeight: 0.4,
  },
  seraphwing: {
    id: 'seraphwing', name: 'Seraphwing', rarity: 'divine', visual: 'seraph', element: 'holy',
    title: 'A feather from the broken sky', source: 'The Sundered King · Divine egg',
    desc: 'It sings in a language that makes the rift hesitate.',
    bonus: [{ stat: 'attack', base: 60, perLevel: 26 }, { stat: 'allResist', base: 5, perLevel: 0.45 }, { stat: 'goldFind', base: 12, perLevel: 0.8 }],
    skill: { name: 'Hymn of Dawn', cooldown: 12, mult: 2.4, element: 'holy', desc: 'A radiant note that unmakes shadow.' },
    palette: { primary: '#fff0c2', secondary: '#b18445', glow: '#fff4c9' }, eggWeight: 0.08,
  },
};

export const MOUNTS = {
  vale_mare: {
    id: 'vale_mare', name: 'Vale Mare', rarity: 'common', visual: 'horse', title: 'Sure-footed and unimpressed',
    source: 'Stable · Wild Whistle', desc: 'A sturdy grey mare who has seen worse things than you.',
    bonus: [{ stat: 'attackSpeed', base: 2, perLevel: 0.22 }, { stat: 'hp', base: 20, perLevel: 10 }],
    skill: { name: 'Gallop', cooldown: 14, mult: 0.6, element: 'physical', desc: 'Tramples the enemy in passing.' },
    palette: { primary: '#9b9486', secondary: '#3c3730', glow: '#d8cfb5' }, eggWeight: 28,
  },
  direboar: {
    id: 'direboar', name: 'Bristleback', rarity: 'rare', visual: 'boar', title: 'The forest\'s worst neighbor',
    source: 'Stable · Wild Whistle', desc: 'It runs first and considers the direction later.',
    bonus: [{ stat: 'defense', base: 12, perLevel: 7 }, { stat: 'hp', base: 40, perLevel: 18 }],
    skill: { name: 'Tusk Rush', cooldown: 12, mult: 0.9, element: 'physical', desc: 'A bone-shaking tusk charge.' },
    palette: { primary: '#7c5d45', secondary: '#30231b', glow: '#d09b6d' }, eggWeight: 16,
  },
  gloomfang: {
    id: 'gloomfang', name: 'Gloomfang', rarity: 'epic', visual: 'wolf', title: 'The shadow that runs beside you',
    source: 'Premium shop · Gloomfang Den', desc: 'A dire wolf with a coat like spilled ink and eyes like old stars.',
    bonus: [{ stat: 'bossDamage', base: 5, perLevel: 0.42 }, { stat: 'critChance', base: 1.4, perLevel: 0.12 }, { stat: 'attackSpeed', base: 3, perLevel: 0.22 }],
    skill: { name: 'Dusk Pounce', cooldown: 9, mult: 1.2, element: 'shadow', desc: 'Bites from an angle that should not exist.' },
    palette: { primary: '#504373', secondary: '#171025', glow: '#a98bff' }, eggWeight: 7,
  },
  frostmaw: {
    id: 'frostmaw', name: 'Frostmaw', rarity: 'rare', visual: 'bear', title: 'Glacier-born',
    source: 'Stable · Frostveil Peaks', desc: 'A polar bear the size of a small house. Surprisingly polite.',
    bonus: [{ stat: 'defense', base: 18, perLevel: 10 }, { stat: 'resistIce', base: 4, perLevel: 0.3 }],
    skill: { name: 'Glacial Maul', cooldown: 11, mult: 1.1, element: 'ice', desc: 'A paw-swipe that leaves frost behind.' },
    palette: { primary: '#c6dfea', secondary: '#436277', glow: '#c9f3ff' }, eggWeight: 11,
  },
  cinderhoof: {
    id: 'cinderhoof', name: 'Cinderhoof', rarity: 'legendary', visual: 'horse', title: 'Born from the caldera',
    source: 'Premium shop · Wyrmfire Core', desc: 'A nightmare-black stallion whose hooves strike sparks from bare stone.',
    bonus: [{ stat: 'attackSpeed', base: 8, perLevel: 0.4 }, { stat: 'attack', base: 25, perLevel: 12 }, { stat: 'resistFire', base: 6, perLevel: 0.3 }],
    skill: { name: 'Cinder Charge', cooldown: 10, mult: 1.7, element: 'fire', desc: 'Leaves a trail of burning hoofprints.' },
    palette: { primary: '#5a2c23', secondary: '#1c0d0d', glow: '#ff8950' }, eggWeight: 1.2 },
  drakewing: {
    id: 'drakewing', name: 'Drakewing', rarity: 'mythic', visual: 'drake', title: 'The sky is not the limit',
    source: 'Astral Throne · Mythic Whistle', desc: 'A young drake who considers the ground optional.',
    bonus: [{ stat: 'bossDamage', base: 10, perLevel: 0.55 }, { stat: 'skillDamage', base: 6, perLevel: 0.35 }, { stat: 'attackSpeed', base: 5, perLevel: 0.28 }],
    skill: { name: 'Wingstorm', cooldown: 9, mult: 2.0, element: 'fire', desc: 'A hurricane of burning feathers.' },
    palette: { primary: '#a35d74', secondary: '#3a1b3d', glow: '#ff9ed1' }, eggWeight: 0.3 },
  starlancer: {
    id: 'starlancer', name: 'Starlancer', rarity: 'divine', visual: 'horse', title: 'Rides the seam of heaven',
    source: 'The Sundered King · Divine Whistle', desc: 'A celestial steed with a mane of falling stars.',
    bonus: [{ stat: 'attack', base: 55, perLevel: 24 }, { stat: 'attackSpeed', base: 10, perLevel: 0.5 }, { stat: 'bossDamage', base: 8, perLevel: 0.4 }, { stat: 'allResist', base: 4, perLevel: 0.3 }],
    skill: { name: 'Starfall Charge', cooldown: 12, mult: 2.5, element: 'arcane', desc: 'Calls down a line of falling stars.' },
    palette: { primary: '#c8d3ff', secondary: '#514784', glow: '#e6e0ff' }, eggWeight: 0.06 },
};

export const COMPANIONS = {
  sera: {
    id: 'sera', name: 'Sera, the Dawnkeeper', rarity: 'rare', visual: 'seraph', title: 'Healer · Spirit of first light',
    source: 'Whitegrave Crypt', desc: 'A quiet spirit who never learned how to abandon anyone.',
    bonus: [{ stat: 'hp', base: 35, perLevel: 16 }, { stat: 'hpRegen', base: 2, perLevel: 1.2 }],
    skill: { name: 'Dawn Prayer', cooldown: 12, heal: 0.08, desc: 'Heals 8% of maximum HP.' },
    palette: { primary: '#ffe6a8', secondary: '#8a6b3b', glow: '#fff0c2' },
  },
  brom: {
    id: 'brom', name: 'Brom, the Stoneward', rarity: 'epic', visual: 'golemStone', title: 'Guardian · The last wall',
    source: 'Gloomfang Den · Emberhold Keep', desc: 'A stone guardian who decided one small hero was worth protecting.',
    bonus: [{ stat: 'defense', base: 24, perLevel: 14 }, { stat: 'damageReduction', base: 2, perLevel: 0.18 }],
    skill: { name: 'Aegis Vow', cooldown: 15, shield: 0.12, desc: 'Grants a shield absorbing 12% of max HP.' },
    palette: { primary: '#8b8378', secondary: '#3d3935', glow: '#d6c9a7' },
  },
  nyx: {
    id: 'nyx', name: 'Nyx, the Quiet', rarity: 'legendary', visual: 'wraith', title: 'Assassin · A blade with no shadow',
    source: 'Abyssal Chancel', desc: 'She does not speak. The enemies never get the chance either.',
    bonus: [{ stat: 'critChance', base: 4, perLevel: 0.4 }, { stat: 'bossDamage', base: 4, perLevel: 0.3 }],
    skill: { name: 'Silent Verdict', cooldown: 10, mult: 1.9, element: 'shadow', desc: 'Strikes from nowhere for heavy damage.' },
    palette: { primary: '#6b5a95', secondary: '#20162f', glow: '#c3a8ff' },
  },
  orrin: {
    id: 'orrin', name: 'Orrin, the Emberbard', rarity: 'epic', visual: 'imp', title: 'Support · Singer of small victories',
    source: 'Emberhold Keep', desc: 'His songs are terrible. His buffs are not.',
    bonus: [{ stat: 'goldFind', base: 8, perLevel: 0.6 }, { stat: 'skillDamage', base: 4, perLevel: 0.24 }],
    skill: { name: 'Rousing Verse', cooldown: 16, buff: { stat: 'attackPct', value: 18, duration: 6 }, desc: 'Inspires +18% attack for 6 seconds.' },
    palette: { primary: '#c7894f', secondary: '#51301b', glow: '#ffc27d' },
  },
  mora: {
    id: 'mora', name: 'Mora, the Veiled', rarity: 'mythic', visual: 'serpent', title: 'Oracle · She has seen the end',
    source: 'Astral Throne', desc: 'She will not say how the story ends. Only that it is not here yet.',
    bonus: [{ stat: 'skillDamage', base: 8, perLevel: 0.45 }, { stat: 'allResist', base: 3, perLevel: 0.25 }],
    skill: { name: 'Fate Thread', cooldown: 13, mult: 2.2, element: 'arcane', desc: 'Cuts a thread of fate for arcane damage.' },
    palette: { primary: '#8ed1d8', secondary: '#2b5360', glow: '#c3fbff' },
  },
};

export const COSTUMES = {
  outfit_wanderer: { id: 'outfit_wanderer', slot: 'outfit', name: 'Wanderer\'s Mantle', rarity: 'common', type: 'Outfit', source: 'Gold', priceGold: 1200, bonus: [], desc: 'A patched cloak for a road with no end.', colors: { primary: '#6d6252', trim: '#b59c6e', cloth: '#3e3a32', aura: null } },
  outfit_moonweave: { id: 'outfit_moonweave', slot: 'outfit', name: 'Moonweave Vestments', rarity: 'rare', type: 'Outfit', source: 'Gold', priceGold: 8000, bonus: [{ stat: 'goldFind', value: 1.5 }], desc: 'Threads of moon-silver that never quite touch the ground.', colors: { primary: '#6f7fa8', trim: '#d4dbff', cloth: '#343d5c', aura: 'rgba(180,200,255,.16)' } },
  outfit_ashenwarlord: { id: 'outfit_ashenwarlord', slot: 'outfit', name: 'Ashen Warlord Plate', rarity: 'epic', type: 'Outfit', source: 'Gold', priceGold: 24000, bonus: [{ stat: 'attack', value: 1.5 }], desc: 'Blackened plate worn by the last warchief who kept his word.', colors: { primary: '#6e4433', trim: '#e0a45c', cloth: '#2d1b16', aura: 'rgba(255,138,76,.12)' } },
  outfit_frostveil: { id: 'outfit_frostveil', slot: 'outfit', name: 'Frostveil Regalia', rarity: 'epic', type: 'Outfit', source: 'Gold', priceGold: 24000, bonus: [{ stat: 'resistIce', value: 2 }], desc: 'A ceremonial coat woven from the breath of a glacier.', colors: { primary: '#6f9ab5', trim: '#d7f3ff', cloth: '#2a4358', aura: 'rgba(160,220,255,.18)' } },
  outfit_gravewarden: { id: 'outfit_gravewarden', slot: 'outfit', name: 'Gravewarden Shroud', rarity: 'legendary', type: 'Outfit', source: 'Premium', priceCoins: 380, bonus: [{ stat: 'resistShadow', value: 2.5 }], desc: 'The dark parts around it, as if afraid to touch the hem.', colors: { primary: '#4a3d62', trim: '#bba2ff', cloth: '#21192e', aura: 'rgba(170,130,255,.2)' } },
  outfit_emberwake: { id: 'outfit_emberwake', slot: 'outfit', name: 'Emberwake Regalia', rarity: 'legendary', type: 'Outfit', source: 'Premium', priceCoins: 380, bonus: [{ stat: 'critDamage', value: 2 }], desc: 'Forged from the last scale of a dragon that refused to die quietly.', colors: { primary: '#8d3a27', trim: '#ffc56b', cloth: '#3a1611', aura: 'rgba(255,120,60,.22)' } },
  outfit_riftwalker: { id: 'outfit_riftwalker', slot: 'outfit', name: 'Riftwalker Vestments', rarity: 'mythic', type: 'Outfit', source: 'Astral Throne', priceCoins: 900, bonus: [{ stat: 'skillDamage', value: 3 }], desc: 'Worn by those who stepped between stars and came back changed.', colors: { primary: '#4b3a83', trim: '#9fe8ff', cloth: '#1b1536', aura: 'rgba(120,210,255,.22)' } },
  hair_wild: { id: 'hair_wild', slot: 'hair', name: 'Wildwind Cut', rarity: 'common', type: 'Hairstyle', source: 'Gold', priceGold: 400, bonus: [], desc: 'Windblown, practical, and deeply unimpressed by helmets.', colors: { hair: '#6b4d33', aura: null } },
  hair_raven: { id: 'hair_raven', slot: 'hair', name: 'Ravenfall Locks', rarity: 'rare', type: 'Hairstyle', source: 'Gold', priceGold: 3000, bonus: [{ stat: 'critChance', value: 0.5 }], desc: 'Black as a crow\'s wing, and twice as sharp.', colors: { hair: '#24202c', aura: null } },
  hair_gilded: { id: 'hair_gilded', slot: 'hair', name: 'Gilded Braids', rarity: 'legendary', type: 'Hairstyle', source: 'Premium', priceCoins: 120, bonus: [{ stat: 'goldFind', value: 2 }], desc: 'Braided with thread-of-gold and the good intentions of the dead.', colors: { hair: '#d3a956', aura: 'rgba(255,220,140,.12)' } },
  hair_frostveil: { id: 'hair_frostveil', slot: 'hair', name: 'Frostveil Veil', rarity: 'epic', type: 'Hairstyle', source: 'Premium', priceCoins: 180, bonus: [{ stat: 'resistIce', value: 1 }], desc: 'A veil of frost that never melts, even in the caldera.', colors: { hair: '#c3e6f7', aura: 'rgba(180,230,255,.18)' } },
  weapon_emberbrand: { id: 'weapon_emberbrand', slot: 'weapon', name: 'Emberbrand Skin', rarity: 'epic', type: 'Weapon skin', source: 'Premium', priceCoins: 160, bonus: [], desc: 'Your weapon burns with a quiet, banked flame.', colors: { weapon: '#ff8a4c', aura: 'rgba(255,130,60,.15)' } },
  weapon_frostbite: { id: 'weapon_frostbite', slot: 'weapon', name: 'Frostbite Skin', rarity: 'epic', type: 'Weapon skin', source: 'Premium', priceCoins: 160, bonus: [], desc: 'Frost creeps along the blade in slow, patient veins.', colors: { weapon: '#9fdcff', aura: 'rgba(150,220,255,.14)' } },
  weapon_voidreaver: { id: 'weapon_voidreaver', slot: 'weapon', name: 'Voidreaver Skin', rarity: 'legendary', type: 'Weapon skin', source: 'Premium', priceCoins: 260, bonus: [{ stat: 'bossDamage', value: 1 }], desc: 'A blade edge that seems to cut the space before it.', colors: { weapon: '#c3a8ff', aura: 'rgba(170,130,255,.2)' } },
  effect_embertrail: { id: 'effect_embertrail', slot: 'effect', name: 'Ember Trail', rarity: 'rare', type: 'Effect', source: 'Gold', priceGold: 9000, bonus: [], desc: 'A trail of harmless embers follows your steps.', colors: { aura: 'rgba(255,130,60,.16)', fx: 'ember' } },
  effect_frosthalo: { id: 'effect_frosthalo', slot: 'effect', name: 'Frost Halo', rarity: 'epic', type: 'Effect', source: 'Premium', priceCoins: 140, bonus: [], desc: 'A ring of snow-dust hangs above your shoulders.', colors: { aura: 'rgba(160,225,255,.18)', fx: 'frost' } },
  effect_voidhalo: { id: 'effect_voidhalo', slot: 'effect', name: 'Void Halo', rarity: 'legendary', type: 'Effect', source: 'Premium', priceCoins: 300, bonus: [], desc: 'A crown of nothing that still manages to be beautiful.', colors: { aura: 'rgba(170,130,255,.22)', fx: 'void' } },
  effect_sunwreath: { id: 'effect_sunwreath', slot: 'effect', name: 'Sunwreath', rarity: 'mythic', type: 'Effect', source: 'Divine fusion', priceCoins: 1200, bonus: [{ stat: 'allResist', value: 1 }], desc: 'Seven small suns orbit your shoulders in a slow, loyal dance.', colors: { aura: 'rgba(255,215,130,.22)', fx: 'sun' } },
};
export const COSTUME_SLOTS = ['outfit', 'weapon', 'hair', 'effect'];
export const COSTUME_SLOT_LABELS = { outfit: 'Outfit', weapon: 'Weapon skin', hair: 'Hairstyle', effect: 'Aura effect' };

export const STONE_TYPES = {
  ruby: { id: 'ruby', name: 'Ruby', stat: 'attack', label: 'Attack', base: 6, perLevel: 3.2, color: '#ff5f6d', glow: 'rgba(255,95,109,.35)', icon: 'ruby', desc: 'A shard of crystallized fury.' },
  sapphire: { id: 'sapphire', name: 'Sapphire', stat: 'critChance', label: 'Critical Chance', base: 1.2, perLevel: 0.42, color: '#5b9cf5', glow: 'rgba(91,156,245,.35)', icon: 'sapphire', desc: 'Clarity sharpened into a single perfect moment.' },
  emerald: { id: 'emerald', name: 'Emerald', stat: 'hp', label: 'Maximum HP', base: 30, perLevel: 14, color: '#59d98b', glow: 'rgba(89,217,139,.3)', icon: 'emerald', desc: 'The stubborn green of things that refuse to die.' },
  amethyst: { id: 'amethyst', name: 'Amethyst', stat: 'defense', label: 'Defense', base: 10, perLevel: 5.5, color: '#a879ff', glow: 'rgba(168,121,255,.35)', icon: 'amethyst', desc: 'A violet ward against the world\'s teeth.' },
  topaz: { id: 'topaz', name: 'Topaz', stat: 'attackSpeed', label: 'Attack Speed', base: 1.5, perLevel: 0.45, color: '#f2c14e', glow: 'rgba(242,193,78,.32)', icon: 'topaz', desc: 'A heartbeat compressed into a gemstone.' },
  onyx: { id: 'onyx', name: 'Onyx', stat: 'bossDamage', label: 'Boss Damage', base: 2, perLevel: 0.55, color: '#b26bff', glow: 'rgba(178,107,255,.35)', icon: 'onyx', desc: 'Darkness that remembers every crowned head.' },
  diamond: { id: 'diamond', name: 'Diamond', stat: 'allResist', label: 'All Resistance', base: 1.2, perLevel: 0.3, color: '#9fe8ff', glow: 'rgba(159,232,255,.35)', icon: 'diamond', desc: 'The sky, folded small and made unbreakable.' },
};

export const STONE_GRADES = [
  { id: 'chipped', name: 'Chipped', mult: 1.0, color: '#9a94a8', maxLevel: 5, weight: 55 },
  { id: 'flawed', name: 'Flawed', mult: 1.35, color: '#7fc3e8', maxLevel: 7, weight: 26 },
  { id: 'fine', name: 'Fine', mult: 1.8, color: '#b58cff', maxLevel: 8, weight: 12 },
  { id: 'perfect', name: 'Perfect', mult: 2.4, color: '#ffc46b', maxLevel: 9, weight: 5 },
  { id: 'royal', name: 'Royal', mult: 3.2, color: '#6ff5da', maxLevel: 10, weight: 1.2 },
];
export const STONE_GRADE_BY_ID = Object.fromEntries(STONE_GRADES.map(g => [g.id, g]));

export const STONE_AFFIXES = [
  { stat: 'attack', label: 'Attack', base: 2, perLevel: 1.2, weight: 30 },
  { stat: 'defense', label: 'Defense', base: 3, perLevel: 1.8, weight: 24 },
  { stat: 'hp', label: 'Maximum HP', base: 10, perLevel: 6, weight: 26 },
  { stat: 'critChance', label: 'Critical Chance', base: 0.6, perLevel: 0.16, weight: 14 },
  { stat: 'critDamage', label: 'Critical Damage', base: 3, perLevel: 0.35, weight: 12 },
  { stat: 'penetration', label: 'Penetration', base: 1, perLevel: 0.3, weight: 10 },
  { stat: 'attackSpeed', label: 'Attack Speed', base: 1, perLevel: 0.12, weight: 9 },
  { stat: 'monsterDamage', label: 'Monster Damage', base: 1.5, perLevel: 0.18, weight: 10 },
  { stat: 'bossDamage', label: 'Boss Damage', base: 1.5, perLevel: 0.2, weight: 9 },
  { stat: 'resistFire', label: 'Fire Resistance', base: 1.5, perLevel: 0.14, weight: 5 },
  { stat: 'resistShadow', label: 'Shadow Resistance', base: 1.5, perLevel: 0.14, weight: 5 },
  { stat: 'lifesteal', label: 'Life Steal', base: 0.3, perLevel: 0.03, weight: 4 },
  { stat: 'goldFind', label: 'Gold Find', base: 2.5, perLevel: 0.2, weight: 6 },
  { stat: 'lootFind', label: 'Loot Find', base: 1.5, perLevel: 0.16, weight: 5 },
];
export const STONE_AFFIX_BY_STAT = Object.fromEntries(STONE_AFFIXES.map(a => [a.stat, a]));
export const MAX_STONE_SOCKETS = 3;
export const STONE_SOCKET_LEVELS = [1, 20, 40];
