/* Monster families, six world regions, bosses and dungeon expeditions. */

export const MONSTERS = {
  thornwolf: { id: 'thornwolf', name: 'Thornwolf', visual: 'wolf', element: 'physical', hp: 1.0, atk: 1.0, def: 0.8, exp: 1.0, gold: 1.0, size: 1.0, lore: 'Briar-backed hunters that run in silence until the last moment.' },
  mossboar: { id: 'mossboar', name: 'Mossboar', visual: 'boar', element: 'poison', hp: 1.35, atk: 0.85, def: 1.25, exp: 1.15, gold: 1.1, size: 1.04, lore: 'A walking hill of fungus and bad temper.' },
  grimwood_bear: { id: 'grimwood_bear', name: 'Grimwood Bear', visual: 'bear', element: 'physical', hp: 1.7, atk: 1.12, def: 1.35, exp: 1.5, gold: 1.45, size: 1.22, lore: 'Old enough to remember when the vale had another name.' },
  grove_wisp: { id: 'grove_wisp', name: 'Grove Wisp', visual: 'wisp', element: 'arcane', hp: 0.7, atk: 1.3, def: 0.45, exp: 1.2, gold: 1.15, size: 0.86, lore: 'A lost lantern-spirit looking for a road that no longer exists.' },
  moonstone_sentinel: { id: 'moonstone_sentinel', name: 'Moonstone Sentinel', visual: 'golemStone', element: 'arcane', hp: 3.1, atk: 0.72, def: 2.1, exp: 2.2, gold: 4.6, size: 1.04, stone: true, lore: 'The vale\'s old guardian, now cracked and hungry for trespassers.' },

  ashclaw_imp: { id: 'ashclaw_imp', name: 'Ashclaw Imp', visual: 'imp', element: 'fire', hp: 0.8, atk: 1.2, def: 0.7, exp: 1.05, gold: 1.15, size: 0.88, lore: 'Petty, spiteful, and entirely too fond of open flame.' },
  cinder_orc: { id: 'cinder_orc', name: 'Cinder Orc', visual: 'orc', element: 'fire', hp: 1.45, atk: 1.15, def: 1.2, exp: 1.35, gold: 1.3, size: 1.12, lore: 'Exiled from the northern clans for burning their own war-camp.' },
  blight_hound: { id: 'blight_hound', name: 'Blight Hound', visual: 'hound', element: 'poison', hp: 0.95, atk: 1.1, def: 0.75, exp: 1.1, gold: 1.1, size: 0.96, lore: 'Its breath wilts the grass a full pace before it arrives.' },
  ember_shaman: { id: 'ember_shaman', name: 'Ember Shaman', visual: 'shaman', element: 'fire', hp: 1.05, atk: 1.45, def: 0.7, exp: 1.5, gold: 1.6, size: 1.0, lore: 'Speaks to the smoke. The smoke answers with teeth.' },
  slag_golem: { id: 'slag_golem', name: 'Slag Golem', visual: 'golemStone', element: 'fire', hp: 3.4, atk: 0.8, def: 2.3, exp: 2.4, gold: 4.8, size: 1.08, stone: true, lore: 'A furnace given legs and a grudge.' },

  rimewolf: { id: 'rimewolf', name: 'Rimewolf', visual: 'wolf', element: 'ice', hp: 1.1, atk: 1.1, def: 0.9, exp: 1.05, gold: 1.05, size: 1.04, lore: 'Its howl freezes the breath before it reaches your lips.' },
  frost_troll: { id: 'frost_troll', name: 'Frost Troll', visual: 'troll', element: 'ice', hp: 2.0, atk: 1.25, def: 1.45, exp: 1.7, gold: 1.6, size: 1.3, lore: 'Slow until it is not. Then the mountain seems to move with it.' },
  pale_revenant: { id: 'pale_revenant', name: 'Pale Revenant', visual: 'undead', element: 'shadow', hp: 1.15, atk: 1.2, def: 0.9, exp: 1.3, gold: 1.25, size: 1.0, lore: 'A climber who never accepted that the summit was out of reach.' },
  glacier_bear: { id: 'glacier_bear', name: 'Glacier Bear', visual: 'bear', element: 'ice', hp: 1.9, atk: 1.2, def: 1.5, exp: 1.6, gold: 1.55, size: 1.26, lore: 'White fur, blue claws, and an appetite that ignores winter.' },
  froststone_colossus: { id: 'froststone_colossus', name: 'Froststone Colossus', visual: 'golemStone', element: 'ice', hp: 3.8, atk: 0.85, def: 2.5, exp: 2.6, gold: 5.2, size: 1.12, stone: true, lore: 'A shard of the first glacier, still trying to walk home.' },

  crypt_ghoul: { id: 'crypt_ghoul', name: 'Crypt Ghoul', visual: 'undead', element: 'poison', hp: 1.15, atk: 1.15, def: 0.95, exp: 1.1, gold: 1.1, size: 1.0, lore: 'It remembers being a person only as a kind of distant ache.' },
  soul_wraith: { id: 'soul_wraith', name: 'Soul Wraith', visual: 'wraith', element: 'shadow', hp: 0.9, atk: 1.5, def: 0.6, exp: 1.45, gold: 1.35, size: 1.06, lore: 'Not a ghost. A hunger that learned to imitate one.' },
  abyss_demon: { id: 'abyss_demon', name: 'Abyss Demon', visual: 'demon', element: 'shadow', hp: 1.55, atk: 1.35, def: 1.05, exp: 1.6, gold: 1.65, size: 1.15, lore: 'Every promise it makes is true. That is the trap.' },
  shadow_knight: { id: 'shadow_knight', name: 'Shadow Knight', visual: 'knight', element: 'shadow', hp: 1.8, atk: 1.15, def: 1.8, exp: 1.7, gold: 1.8, size: 1.08, lore: 'Sworn to a king whose name was cut from every book.' },
  obsidian_sentinel: { id: 'obsidian_sentinel', name: 'Obsidian Sentinel', visual: 'golemStone', element: 'shadow', hp: 4.0, atk: 0.9, def: 2.6, exp: 2.8, gold: 5.5, size: 1.1, stone: true, lore: 'Black glass folded into the shape of obedience.' },

  magma_drake: { id: 'magma_drake', name: 'Magma Drake', visual: 'drake', element: 'fire', hp: 1.35, atk: 1.35, def: 1.2, exp: 1.35, gold: 1.4, size: 1.12, lore: 'A lesser cousin of the Worldflame, and twice as eager to prove it.' },
  cinder_wyrm: { id: 'cinder_wyrm', name: 'Cinder Wyrm', visual: 'dragon', element: 'fire', hp: 2.2, atk: 1.55, def: 1.4, exp: 2.0, gold: 2.1, size: 1.3, lore: 'It sleeps beneath the caldera and dreams in lava.' },
  dragonkin_zealot: { id: 'dragonkin_zealot', name: 'Dragonkin Zealot', visual: 'knight', element: 'fire', hp: 1.7, atk: 1.3, def: 1.7, exp: 1.65, gold: 1.75, size: 1.1, lore: 'Scaled pilgrims who believe the mountain will eat them into godhood.' },
  flamewrought_demon: { id: 'flamewrought_demon', name: 'Flamewrought Demon', visual: 'demon', element: 'fire', hp: 1.6, atk: 1.5, def: 1.05, exp: 1.7, gold: 1.8, size: 1.18, lore: 'Forged in the first eruption, still glowing at the seams.' },
  volcanic_colossus: { id: 'volcanic_colossus', name: 'Volcanic Colossus', visual: 'golemStone', element: 'fire', hp: 4.3, atk: 0.95, def: 2.8, exp: 3.0, gold: 6.0, size: 1.18, stone: true, lore: 'The mountain stood up. It is not happy about it.' },

  void_stalker: { id: 'void_stalker', name: 'Void Stalker', visual: 'wraith', element: 'shadow', hp: 1.1, atk: 1.6, def: 0.85, exp: 1.3, gold: 1.3, size: 1.05, lore: 'It hunts the space between heartbeats.' },
  star_serpent: { id: 'star_serpent', name: 'Star Serpent', visual: 'serpent', element: 'arcane', hp: 1.55, atk: 1.5, def: 1.15, exp: 1.65, gold: 1.7, size: 1.2, lore: 'Its scales are constellations that have not yet happened.' },
  fallen_seraph: { id: 'fallen_seraph', name: 'Fallen Seraph', visual: 'seraph', element: 'holy', hp: 1.55, atk: 1.55, def: 1.35, exp: 1.8, gold: 1.9, size: 1.12, lore: 'It still believes it is doing the right thing. That is what makes it dangerous.' },
  chaos_herald: { id: 'chaos_herald', name: 'Chaos Herald', visual: 'demon', element: 'shadow', hp: 1.8, atk: 1.7, def: 1.2, exp: 2.0, gold: 2.1, size: 1.2, lore: 'It announces the end of the world with obvious delight.' },
  astral_golem: { id: 'astral_golem', name: 'Astral Golem', visual: 'golemStone', element: 'arcane', hp: 4.5, atk: 1.0, def: 3.0, exp: 3.2, gold: 6.5, size: 1.2, stone: true, lore: 'A collapsed star wearing a body of rune-carved stone.' },
};

export const REGIONS = [
  {
    id: 'moonshade', index: 1, name: 'Moonshade Vale', short: 'The Vale', levelRange: '1–20',
    subtitle: 'Where the old forest dreams with its eyes open.',
    lore: 'A silver-green hollow beneath a moon that never quite sets. The wolves have grown bold, the sentinels have cracked, and something in the roots is learning to howl.',
    palette: { skyTop: '#0c1420', skyBottom: '#1d2a25', mountain: '#16201f', mountainFar: '#243229', ground: '#131a15', groundFar: '#1c261c', accent: '#c3e19a', glow: '#9bdcae', haze: 'rgba(150,205,160,.08)', moon: '#e8f0cc', particle: 'firefly' },
    motif: 'forest', base: { hp: 65, atk: 9, def: 3, exp: 16, gold: 10 },
    monsters: ['thornwolf', 'mossboar', 'grimwood_bear', 'grove_wisp', 'moonstone_sentinel'],
    miniboss: { name: 'Alpha Thornhowl', visual: 'wolf', element: 'physical', hp: 5.5, atk: 1.35, def: 1.2, exp: 6, gold: 7, size: 1.35, lore: 'The first wolf of the vale, and the last to leave a fight.' },
    boss: { name: 'Fenryr, the Moonhowl', visual: 'wolf', element: 'shadow', hp: 12, atk: 1.55, def: 1.5, exp: 15, gold: 16, size: 1.65, lore: 'The moon did not make Fenryr. Fenryr made the moon afraid.' },
  },
  {
    id: 'ashen', index: 2, name: 'Ashen Marches', short: 'Marches', levelRange: '21–40',
    subtitle: 'A war that never ended, fought by those who did.',
    lore: 'The old clans burned their dead here. The ash never cooled. Now the orc warbands pick through the cinders for anything still worth killing, and the slag remembers every blade that fell.',
    palette: { skyTop: '#18080b', skyBottom: '#391512', mountain: '#26100f', mountainFar: '#431b16', ground: '#1c100e', groundFar: '#2b1712', accent: '#ff9459', glow: '#ff6b38', haze: 'rgba(255,110,60,.08)', moon: '#ffb383', particle: 'ember' },
    motif: 'crags', base: { hp: 190, atk: 19, def: 8, exp: 42, gold: 26 },
    monsters: ['ashclaw_imp', 'cinder_orc', 'blight_hound', 'ember_shaman', 'slag_golem'],
    miniboss: { name: 'Uzgarn the Branded', visual: 'orc', element: 'fire', hp: 5.8, atk: 1.4, def: 1.3, exp: 6.2, gold: 7.2, size: 1.4, lore: 'He lost the argument with the war-camp. Then he won the rematch.' },
    boss: { name: 'Gorrak Ashfang', visual: 'orc', element: 'fire', hp: 12.5, atk: 1.6, def: 1.6, exp: 15.5, gold: 17, size: 1.7, lore: 'Warchief of the cinder clans. His axe was quenched in the blood of a volcano.' },
  },
  {
    id: 'frostveil', index: 3, name: 'Frostveil Peaks', short: 'Peaks', levelRange: '41–60',
    subtitle: 'The mountain keeps every promise it makes.',
    lore: 'Above the tree line, the wind speaks in the voices of missing climbers. Frozen pilgrims still kneel along the pass, waiting for a dawn that has not come in four hundred years.',
    palette: { skyTop: '#0a1624', skyBottom: '#1c3a52', mountain: '#14293b', mountainFar: '#244459', ground: '#172c3b', groundFar: '#203948', accent: '#b7e8ff', glow: '#7ecbff', haze: 'rgba(180,225,255,.1)', moon: '#e8f6ff', particle: 'snow' },
    motif: 'peaks', base: { hp: 540, atk: 40, def: 17, exp: 112, gold: 68 },
    monsters: ['rimewolf', 'frost_troll', 'pale_revenant', 'glacier_bear', 'froststone_colossus'],
    miniboss: { name: 'Jorunn the Pale', visual: 'undead', element: 'ice', hp: 6, atk: 1.45, def: 1.35, exp: 6.3, gold: 7.4, size: 1.45, lore: 'The last guide to cross the pass. She has been waiting for company ever since.' },
    boss: { name: 'The Whitegrave Queen', visual: 'undead', element: 'ice', hp: 13, atk: 1.65, def: 1.65, exp: 16, gold: 18, size: 1.7, lore: 'Buried in a tomb of glacier ice, crowned by the frozen tears of her court.' },
  },
  {
    id: 'umbral', index: 4, name: 'Umbral Depths', short: 'Depths', levelRange: '61–80',
    subtitle: 'Below the world, something keeps the lantern lit.',
    lore: 'The old kings built their tombs downward, as if trying to bury the sky. Now the dark has learned to walk, and the choirs beneath the earth still sing the names of the living.',
    palette: { skyTop: '#0c0718', skyBottom: '#231333', mountain: '#150c21', mountainFar: '#2a163e', ground: '#140d1e', groundFar: '#20132e', accent: '#c3a2ff', glow: '#a575ff', haze: 'rgba(160,110,255,.1)', moon: '#d9c6ff', particle: 'soul' },
    motif: 'pillars', base: { hp: 1520, atk: 84, def: 34, exp: 300, gold: 180 },
    monsters: ['crypt_ghoul', 'soul_wraith', 'abyss_demon', 'shadow_knight', 'obsidian_sentinel'],
    miniboss: { name: "Malzareth's Echo", visual: 'demon', element: 'shadow', hp: 6.2, atk: 1.5, def: 1.4, exp: 6.5, gold: 7.6, size: 1.5, lore: 'A splinter of the Hollow King, still repeating his favorite threat.' },
    boss: { name: 'Malzareth the Hollow', visual: 'demon', element: 'shadow', hp: 14, atk: 1.7, def: 1.7, exp: 17, gold: 19, size: 1.75, lore: 'He traded his name, his face, and his shadow for a crown that rules nothing.' },
  },
  {
    id: 'dragonfall', index: 5, name: 'Dragonfall Caldera', short: 'Caldera', levelRange: '81–100',
    subtitle: 'Where the first dragon fell, and the fire stayed.',
    lore: 'The caldera is a wound in the world. Rivers of gold and magma braid through the bones of something too large to have ever flown. The wyrmkin call it holy. It is only hungry.',
    palette: { skyTop: '#1f0706', skyBottom: '#4d160c', mountain: '#2a0e0a', mountainFar: '#5b2011', ground: '#24100b', groundFar: '#38170f', accent: '#ffb066', glow: '#ff6a2b', haze: 'rgba(255,100,40,.11)', moon: '#ffc27d', particle: 'ember' },
    motif: 'volcano', base: { hp: 4300, atk: 172, def: 68, exp: 800, gold: 480 },
    monsters: ['magma_drake', 'cinder_wyrm', 'dragonkin_zealot', 'flamewrought_demon', 'volcanic_colossus'],
    miniboss: { name: 'Ignarion the Scorched', visual: 'dragon', element: 'fire', hp: 6.4, atk: 1.55, def: 1.45, exp: 6.7, gold: 7.8, size: 1.55, lore: 'He flew too close to his own reflection and has been furious ever since.' },
    boss: { name: 'Pyraxis, the Worldflame', visual: 'dragon', element: 'fire', hp: 15, atk: 1.8, def: 1.8, exp: 18, gold: 20, size: 1.85, lore: 'The last true dragon. Its heartbeat is the reason the caldera still breathes.' },
  },
  {
    id: 'rift', index: 6, name: 'Celestial Rift', short: 'Rift', levelRange: '101–120',
    subtitle: 'The sky tore open, and something remembered us.',
    lore: 'Beyond the last mountain, the heavens have split like a rotten sail. Constellations fall upwards. The Sundered King sits on a throne of broken stars, and every road now leads to him.',
    palette: { skyTop: '#09051d', skyBottom: '#1d1045', mountain: '#100a26', mountainFar: '#2a1850', ground: '#0e0a20', groundFar: '#191034', accent: '#9fe8ff', glow: '#8b7dff', haze: 'rgba(150,140,255,.12)', moon: '#e5dbff', particle: 'star' },
    motif: 'rift', base: { hp: 12000, atk: 350, def: 135, exp: 2100, gold: 1280 },
    monsters: ['void_stalker', 'star_serpent', 'fallen_seraph', 'chaos_herald', 'astral_golem'],
    miniboss: { name: 'The Sundered Echo', visual: 'knight', element: 'shadow', hp: 6.8, atk: 1.6, def: 1.5, exp: 6.9, gold: 8, size: 1.6, lore: 'A rehearsal of the final blow, played on repeat across the rift.' },
    boss: { name: 'The Sundered King', visual: 'knight', element: 'shadow', hp: 16, atk: 1.9, def: 1.9, exp: 20, gold: 22, size: 1.9, lore: 'He broke the heavens to make a crown. Now he cannot remember why he wanted one.' },
  },
];
export const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));
export const REGION_COUNT = REGIONS.length;
export const STAGES_PER_REGION = 20;
export const MAX_STAGE_INDEX = REGION_COUNT * STAGES_PER_REGION;

export function stageCoords(globalIndex) {
  const i = Math.max(1, Math.min(MAX_STAGE_INDEX, globalIndex));
  const regionIndex = Math.floor((i - 1) / STAGES_PER_REGION);
  const stage = ((i - 1) % STAGES_PER_REGION) + 1;
  return { regionIndex, region: REGIONS[regionIndex], stage, globalIndex: i };
}
export function stageGlobalIndex(regionId, stage) {
  const region = REGION_BY_ID[regionId];
  if (!region) return 1;
  return (region.index - 1) * STAGES_PER_REGION + Math.max(1, Math.min(STAGES_PER_REGION, stage));
}
export function stageKind(stage) {
  if (stage === STAGES_PER_REGION) return 'boss';
  if (stage === 10) return 'miniboss';
  return 'normal';
}
export function monsterLevel(region, stage) {
  return (region.index - 1) * 20 + stage;
}

export const DUNGEONS = [
  {
    id: 'gloomfang_den', name: 'Gloomfang Den', regionId: 'moonshade', level: 8, rank: 'I', difficulty: 'Initiate',
    desc: 'The pack has dragged something ancient into the roots. It is still breathing.',
    boss: { name: 'Gloomfang Matriarch', visual: 'wolf', element: 'shadow', hp: 11, atk: 1.55, def: 1.4, exp: 30, gold: 32, size: 1.8, lore: 'Mother of every howl in the vale.' },
    rewards: { gold: 900, xp: 420, items: 2, stones: 2, mat: 'upgradeStone', matQty: 8, chance: { pet: 0.08, mount: 0, costume: 0.04 } },
    palette: 'forest',
  },
  {
    id: 'emberhold', name: 'Emberhold Keep', regionId: 'ashen', level: 25, rank: 'II', difficulty: 'Adept',
    desc: 'A burned fortress that still refuses to fall. Its warchief has not left the throne room in decades.',
    boss: { name: 'Gorrak, the Ashen Warchief', visual: 'orc', element: 'fire', hp: 12.5, atk: 1.65, def: 1.55, exp: 34, gold: 36, size: 1.85, lore: 'He kept the war going after everyone else went home.' },
    rewards: { gold: 3200, xp: 1600, items: 3, stones: 3, mat: 'ember', matQty: 3, chance: { pet: 0.1, mount: 0.06, costume: 0.06 } },
    palette: 'crags',
  },
  {
    id: 'whitegrave', name: 'Whitegrave Crypt', regionId: 'frostveil', level: 45, rank: 'III', difficulty: 'Expert',
    desc: 'A tomb carved inside a glacier. The queen still holds court, and the court still applauds.',
    boss: { name: 'The Pale Queen', visual: 'undead', element: 'ice', hp: 13.5, atk: 1.7, def: 1.65, exp: 38, gold: 40, size: 1.9, lore: 'She has been dead longer than the mountain has been cold.' },
    rewards: { gold: 9800, xp: 5400, items: 3, stones: 4, mat: 'stoneDust', matQty: 12, chance: { pet: 0.12, mount: 0.08, costume: 0.07 } },
    palette: 'peaks',
  },
  {
    id: 'abyssal_chancel', name: 'Abyssal Chancel', regionId: 'umbral', level: 65, rank: 'IV', difficulty: 'Master',
    desc: 'A cathedral built upside down beneath the earth. The choir has no mouths, but it never stops.',
    boss: { name: 'Malzareth Reborn', visual: 'demon', element: 'shadow', hp: 14.5, atk: 1.75, def: 1.75, exp: 42, gold: 44, size: 1.95, lore: 'The Hollow King, wearing a newer, angrier face.' },
    rewards: { gold: 27500, xp: 16500, items: 4, stones: 5, mat: 'chaos', matQty: 2, chance: { pet: 0.14, mount: 0.1, costume: 0.08 } },
    palette: 'pillars',
  },
  {
    id: 'wyrmfire_core', name: 'Wyrmfire Core', regionId: 'dragonfall', level: 85, rank: 'V', difficulty: 'Nightmare',
    desc: 'The heart-chamber of the caldera. Every step melts a little more of your resolve.',
    boss: { name: 'Pyraxis, Undying Flame', visual: 'dragon', element: 'fire', hp: 16, atk: 1.85, def: 1.85, exp: 48, gold: 50, size: 2.05, lore: 'You cannot kill a fire by killing the thing that burns.' },
    rewards: { gold: 76000, xp: 48000, items: 4, stones: 6, mat: 'ember', matQty: 8, chance: { pet: 0.16, mount: 0.12, costume: 0.1 } },
    palette: 'volcano',
  },
  {
    id: 'astral_throne', name: 'Astral Throne', regionId: 'rift', level: 105, rank: 'VI', difficulty: 'Mythic',
    desc: 'The last road. The throne waits at the edge of a sky that has forgotten how to hold stars.',
    boss: { name: 'The Sundered King', visual: 'knight', element: 'shadow', hp: 18, atk: 2.0, def: 2.0, exp: 55, gold: 58, size: 2.1, lore: 'He has been waiting for someone worthy enough to end him.' },
    rewards: { gold: 210000, xp: 140000, items: 5, stones: 8, mat: 'protection', matQty: 2, chance: { pet: 0.2, mount: 0.15, costume: 0.12 } },
    palette: 'rift',
  },
];
export const DUNGEON_BY_ID = Object.fromEntries(DUNGEONS.map(d => [d.id, d]));

export const REGION_ART = {
  forest: { label: 'Moonshade Vale', motif: 'forest' },
  crags: { label: 'Ashen Marches', motif: 'crags' },
  peaks: { label: 'Frostveil Peaks', motif: 'peaks' },
  pillars: { label: 'Umbral Depths', motif: 'pillars' },
  volcano: { label: 'Dragonfall Caldera', motif: 'volcano' },
  rift: { label: 'Celestial Rift', motif: 'rift' },
};
