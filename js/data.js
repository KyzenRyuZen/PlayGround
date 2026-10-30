/* Aetherfall — static game data. All tuning lives here. */

export const RARITIES = [
  { id: 'common',    name: 'Common',    short: 'C', color: '#aeb9be', deep: '#3b4347', mult: 1,    glow: 'rgba(174,185,190,.28)' },
  { id: 'rare',      name: 'Rare',      short: 'R', color: '#5fa8ff', deep: '#173459', mult: 1.8,  glow: 'rgba(95,168,255,.32)' },
  { id: 'epic',      name: 'Epic',      short: 'E', color: '#b47aff', deep: '#3b1d60', mult: 3.2,  glow: 'rgba(180,122,255,.34)' },
  { id: 'legendary', name: 'Legendary', short: 'L', color: '#ffb35e', deep: '#573112', mult: 5.6,  glow: 'rgba(255,179,94,.38)' },
  { id: 'mythic',    name: 'Mythic',    short: 'M', color: '#ff6f91', deep: '#5a1730', mult: 9.5,  glow: 'rgba(255,111,145,.38)' },
  { id: 'divine',    name: 'Divine',    short: 'D', color: '#f9efbd', deep: '#615220', mult: 16,   glow: 'rgba(249,239,189,.55)' }
];

export const RARITY = Object.fromEntries(RARITIES.map(r => [r.id, r]));
export const RARITY_INDEX = Object.fromEntries(RARITIES.map((r, i) => [r.id, i]));
export const RARITY_UP = RARITIES.map((r, i) => RARITIES[i + 1] || null);

export const SLOTS = [
  { id: 'weapon',   name: 'Weapon',   icon: 'weapon',   base: { atk: 9 } },
  { id: 'armor',    name: 'Armor',    icon: 'armor',    base: { hp: 70, def: 4 } },
  { id: 'bracelet', name: 'Bracelet', icon: 'bracelet', base: { atk: 4, crit: 1.5 } },
  { id: 'earrings', name: 'Earrings', icon: 'earrings', base: { atk: 3, crit: 2 } },
  { id: 'helmet',   name: 'Helmet',   icon: 'helmet',   base: { hp: 48, def: 3 } },
  { id: 'shield',   name: 'Shield',   icon: 'shield',   base: { def: 6, hp: 38 } },
  { id: 'boots',    name: 'Boots',    icon: 'boots',    base: { speed: 13, hp: 28 } },
  { id: 'necklace', name: 'Necklace', icon: 'necklace', base: { atk: 5, crit: 1 } },
  { id: 'ring',     name: 'Ring',     icon: 'ring',     base: { atk: 4, crit: 1.5 } }
];

export const SLOT = Object.fromEntries(SLOTS.map(s => [s.id, s]));

export const CLASSES = [
  {
    id: 'warrior',
    name: 'Warrior',
    order: 'I',
    role: 'Iron Vanguard',
    color: '#e5a35d',
    accent: '#ff7047',
    tagline: 'Hold the line. Break the horde.',
    description: 'A mountain of scarred plate. Warriors wade into the thick of battle, turning punishment into momentum.',
    stats: { might: 9, guard: 10, agility: 4, focus: 4 },
    base: { hp: 380, atk: 30, def: 24, speed: 176, crit: 5, rate: 1, skillPower: 1, lifesteal: .04, range: 92 },
    attack: 'melee',
    weapon: 'Embercleaver',
    palette: ['#f7c477', '#c06a35', '#45233a'],
    skills: [
      { id: 'cleave',    name: 'Cleave',       icon: 'cleave',   cd: 4.6,  tag: 'Arc strike', desc: 'Unleash a 220° sweep for 190% weapon damage. Each enemy struck steels you for 4% max health.' },
      { id: 'bulwark',   name: 'Bulwark',      icon: 'bulwark',  cd: 11,   tag: 'Guard',      desc: 'Raise an aegis worth 34% max health for 4s. While it holds, gain 45% defense and 18% move speed.' },
      { id: 'earthshatter', name: 'Earthshatter', icon: 'shatter', cd: 19, tag: 'Ultimate',   desc: 'Sunder the ground for 310% damage in a wide ring and stun survivors for 1.6s.' }
    ]
  },
  {
    id: 'mage',
    name: 'Mage',
    order: 'II',
    role: 'Void Scholar',
    color: '#77d7db',
    accent: '#b276ff',
    tagline: 'Rewrite the laws of battle.',
    description: 'A keeper of forbidden formulae. Mages bend distance and frost to erase packs before they close.',
    stats: { might: 10, guard: 4, agility: 5, focus: 8 },
    base: { hp: 280, atk: 36, def: 12, speed: 168, crit: 7, rate: .9, skillPower: 1.25, lifesteal: 0, range: 330 },
    attack: 'ranged',
    weapon: 'Starbinder Staff',
    palette: ['#9eeff0', '#3f91c9', '#241e57'],
    skills: [
      { id: 'lance',   name: 'Arcane Lance', icon: 'lance',   cd: 3.4,  tag: 'Pierce',    desc: 'Hurl a lance that pierces up to 3 foes for 210% spell damage. Applies 1 stack of Ruin.' },
      { id: 'nova',    name: 'Frost Nova',   icon: 'nova',    cd: 8,    tag: 'Control',   desc: 'Detonate a frost ring for 165% damage and chill enemies by 45% for 3s.' },
      { id: 'meteor',  name: 'Meteor Sigil', icon: 'meteor',  cd: 18,   tag: 'Ultimate',  desc: 'Call a starfall after 0.8s. Deals 340% damage in a large radius and burns for 4s.' }
    ]
  },
  {
    id: 'archer',
    name: 'Archer',
    order: 'III',
    role: 'Night Stalker',
    color: '#93d9a2',
    accent: '#f4d06f',
    tagline: 'One breath. One shot.',
    description: 'A ghost of the high passes. Archers dance beyond reach, stacking precision into devastating criticals.',
    stats: { might: 8, guard: 5, agility: 10, focus: 4 },
    base: { hp: 310, atk: 25, def: 16, speed: 202, crit: 17, rate: 1.3, skillPower: 1.05, lifesteal: .02, range: 390 },
    attack: 'ranged',
    weapon: 'Nightfall Longbow',
    palette: ['#cfeeae', '#5f9e6d', '#27343c'],
    skills: [
      { id: 'pierce',  name: 'Piercing Shot', icon: 'pierce',  cd: 3.8,  tag: 'Precision', desc: 'Loose an unerring arrow for 220% damage. Always critically strikes and passes through 2 foes.' },
      { id: 'rain',    name: 'Rain of Arrows', icon: 'rain',    cd: 9,    tag: 'Barrage',   desc: 'Blanket a target area with 5 volleys over 1.6s, each dealing 72% damage and slowing.' },
      { id: 'shadowstep', name: 'Shadowstep', icon: 'shadow',  cd: 13,   tag: 'Ultimate',  desc: 'Blink 170 units, becoming untouchable for .4s. Your next 3 shots crit and fire 50% faster.' }
    ]
  }
];

export const CLASS = Object.fromEntries(CLASSES.map(c => [c.id, c]));

export const STAT_LABELS = {
  might: 'Might',
  guard: 'Guard',
  agility: 'Agility',
  focus: 'Focus'
};

/* One named artifact per slot for each class. Identical copies are forge fuel. */
const WARRIOR_GEAR = {
  weapon: 'Embercleaver',
  armor: 'Ashen Bulwark',
  bracelet: 'Cinderband',
  earrings: 'Warring Drop',
  helmet: 'Iron Vigil',
  shield: 'Aegis of Ruin',
  boots: 'Emberstride',
  necklace: 'Oathchain',
  ring: "Warden's Seal"
};
const MAGE_GEAR = {
  weapon: 'Starbinder Staff',
  armor: 'Veil of Echoes',
  bracelet: 'Runespiral',
  earrings: 'Whisper Shards',
  helmet: "Oracle's Diadem",
  shield: 'Aether Ward',
  boots: 'Riftwalkers',
  necklace: 'Tear of the Void',
  ring: 'Sigil of Nine'
};
const ARCHER_GEAR = {
  weapon: 'Nightfall Longbow',
  armor: 'Shrouded Coat',
  bracelet: 'Hawthorn Loop',
  earrings: 'Talon Drops',
  helmet: "Stalker's Hood",
  shield: 'Briar Buckler',
  boots: 'Windstep Boots',
  necklace: 'Fang Pendant',
  ring: "Hunter's Mark"
};

export const GEAR_NAMES = { warrior: WARRIOR_GEAR, mage: MAGE_GEAR, archer: ARCHER_GEAR };

export const BOSS_RELICS = [
  { id: 'crown-cinders', name: 'Crown of Cinders', slot: 'helmet', stage: 4, rarity: 'epic',
    lore: 'A circlet hammered from the first king’s funeral mask.' },
  { id: 'tidelord-aegis', name: "Tidelord's Aegis", slot: 'shield', stage: 8, rarity: 'epic',
    lore: 'The drowned archive itself shaped into a shield.' },
  { id: 'hollow-crown', name: 'The Hollow Crown', slot: 'helmet', stage: 12, rarity: 'mythic',
    lore: 'It remembers every head that wore it. None of them were enough.' }
];

export const ENEMIES = {
  husk: {
    name: 'Ash Husk', behavior: 'melee', hp: 1, atk: 1, speed: 67, radius: 16,
    color: '#c47b4c', glow: '#ffb064', xp: 1, attackRate: 1.35, windup: .55, range: 58
  },
  stalker: {
    name: 'Cinder Stalker', behavior: 'melee', hp: .72, atk: .88, speed: 139, radius: 14,
    color: '#b35b6d', glow: '#ff728f', xp: 1.1, attackRate: 1.05, windup: .38, range: 54
  },
  wisp: {
    name: 'Pale Wisp', behavior: 'ranged', hp: .62, atk: .74, speed: 82, radius: 13,
    color: '#64cfc6', glow: '#9ffff0', xp: 1.1, attackRate: 1.9, windup: .5, range: 250, preferred: 215
  },
  brute: {
    name: 'Grave Brute', behavior: 'brute', hp: 2.2, atk: 1.55, speed: 49, radius: 25,
    color: '#9a7350', glow: '#ffab59', xp: 2, attackRate: 2.2, windup: .95, range: 74
  },
  sentinel: {
    name: 'Rift Sentinel', behavior: 'sentinel', hp: 1.55, atk: .9, speed: 54, radius: 21,
    color: '#668eaa', glow: '#75dbff', xp: 1.6, attackRate: 1.65, windup: .7, range: 66
  },
  mote: {
    name: 'Star Mote', behavior: 'ranged', hp: .38, atk: .48, speed: 116, radius: 9,
    color: '#b58aff', glow: '#ddc6ff', xp: .6, attackRate: 1.6, windup: .4, range: 210, preferred: 175
  }
};

export const BOSSES = {
  cinderwarden: {
    name: 'The Cinder Warden',
    title: 'Keeper of the First Flame',
    hp: 17, atk: 2.15, speed: 62, radius: 42,
    color: '#c96b3c', glow: '#ffb05c', xp: 9,
    abilities: ['slam', 'fan', 'charge'],
    intro: 'The gate exhales. Something enormous lifts its blade.',
    quote: '“No flame may pass unjudged.”'
  },
  tidebound: {
    name: 'The Tidebound Scribe',
    title: 'Last Reader of the Drowned Archive',
    hp: 16, atk: 2.2, speed: 55, radius: 38,
    color: '#4d9fb7', glow: '#8ff5ff', xp: 12,
    abilities: ['rings', 'summon', 'vortex'],
    intro: 'Pages spiral upward through black water. A hundred eyes open.',
    quote: '“Every ending has already been written.”'
  },
  hollowking: {
    name: 'The Hollow King',
    title: 'Sovereign of the Shattered Crown',
    hp: 20, atk: 2.55, speed: 58, radius: 46,
    color: '#8e71b8', glow: '#e0bcff', xp: 18,
    abilities: ['blades', 'beam', 'teleport', 'summon'],
    intro: 'The empty throne turns. It has been waiting for you.',
    quote: '“Kneel, or be remembered.”'
  }
};

export const CHAPTERS = [
  {
    id: 'ashen', numeral: 'I', name: 'The Ashen Reach', short: 'Ashen Reach',
    subtitle: 'Where the first flame died', biome: 'ashen',
    colors: ['#db8b4d', '#7f382e', '#1d1215'],
    boss: 'cinderwarden',
    blurb: 'A dead king’s road winds through cinder fields and broken chapels. The Cinder Warden still keeps its gate.'
  },
  {
    id: 'drowned', numeral: 'II', name: 'The Drowned Archive', short: 'Drowned Archive',
    subtitle: 'Every secret leaves a stain', biome: 'drowned',
    colors: ['#64c6cf', '#225a78', '#0b1720'],
    boss: 'tidebound',
    blurb: 'Sunken shelves stretch into black water. Ink still moves beneath the surface, and something is reading aloud.'
  },
  {
    id: 'hollow', numeral: 'III', name: 'The Hollow Peaks', short: 'Hollow Peaks',
    subtitle: 'The throne of a broken god', biome: 'hollow',
    colors: ['#b393ec', '#553c83', '#120d1d'],
    boss: 'hollowking',
    blurb: 'Above the storm, a crownless sovereign waits among pillars of frozen lightning. End the age of empty thrones.'
  }
];

export const STAGES = [
  {
    id: '1-1', num: 1, chapter: 0, name: 'Cinder Gate', sub: 'The road begins',
    desc: 'Ash husks gather beneath a dead arch. Break through and claim your first relic.',
    recPower: 150, xp: 34, gold: 48, type: 'normal',
    waves: [['husk', 'husk', 'husk'], ['husk', 'husk', 'wisp']],
    foes: ['Ash Husk', 'Pale Wisp']
  },
  {
    id: '1-2', num: 2, chapter: 0, name: 'Gallows Road', sub: 'Nothing stays buried',
    desc: 'The old pilgrim road is thick with cinder stalkers. They hunt in threes.',
    recPower: 220, xp: 48, gold: 66, type: 'normal',
    waves: [['stalker', 'stalker', 'husk'], ['stalker', 'stalker', 'wisp', 'husk']],
    foes: ['Cinder Stalker', 'Ash Husk', 'Pale Wisp']
  },
  {
    id: '1-3', num: 3, chapter: 0, name: 'Chapel of Ash', sub: 'A prayer left unanswered',
    desc: 'Rift Sentinels guard a collapsed nave. A Grave Brute kneels at the altar.',
    recPower: 310, xp: 64, gold: 88, type: 'normal',
    waves: [['sentinel', 'sentinel', 'wisp'], ['brute', 'husk', 'husk', 'wisp']],
    foes: ['Rift Sentinel', 'Grave Brute', 'Pale Wisp']
  },
  {
    id: '1-4', num: 4, chapter: 0, name: 'The Cinder Warden', sub: 'Chapter boss',
    desc: 'The gatekeeper has not left his post in a thousand years. He will not leave it now.',
    recPower: 430, xp: 140, gold: 220, type: 'boss', boss: 'cinderwarden',
    waves: [['husk', 'husk', 'stalker'], ['sentinel', 'sentinel', 'brute']],
    foes: ['Ash Husk', 'Rift Sentinel', 'Grave Brute']
  },
  {
    id: '2-1', num: 5, chapter: 1, name: 'Drowned Steps', sub: 'The tide remembers',
    desc: 'Black water climbs impossible stairs. Pale Wisps drift between broken columns.',
    recPower: 560, xp: 92, gold: 122, type: 'normal',
    waves: [['wisp', 'wisp', 'husk', 'husk'], ['sentinel', 'wisp', 'stalker', 'stalker']],
    foes: ['Pale Wisp', 'Rift Sentinel', 'Cinder Stalker']
  },
  {
    id: '2-2', num: 6, chapter: 1, name: 'Hall of Ink', sub: 'Words that cut',
    desc: 'The archive answers intruders with living script. Star Motes burn between the shelves.',
    recPower: 710, xp: 112, gold: 146, type: 'normal',
    waves: [['mote', 'mote', 'mote', 'sentinel'], ['wisp', 'mote', 'stalker', 'stalker']],
    foes: ['Star Mote', 'Pale Wisp', 'Cinder Stalker']
  },
  {
    id: '2-3', num: 7, chapter: 1, name: 'The Undertow', sub: 'Down is the only way',
    desc: 'A brine-soaked brute blocks the descent. The current pulls at your heels.',
    recPower: 900, xp: 136, gold: 178, type: 'normal',
    waves: [['brute', 'brute', 'wisp'], ['sentinel', 'sentinel', 'mote', 'mote'], ['brute', 'stalker', 'stalker', 'wisp']],
    foes: ['Grave Brute', 'Rift Sentinel', 'Star Mote']
  },
  {
    id: '2-4', num: 8, chapter: 1, name: 'The Tidebound Scribe', sub: 'Chapter boss',
    desc: 'The last reader has written your name in the margin. The ink is already drying.',
    recPower: 1120, xp: 260, gold: 360, type: 'boss', boss: 'tidebound',
    waves: [['mote', 'mote', 'sentinel', 'sentinel'], ['brute', 'brute', 'wisp', 'wisp']],
    foes: ['Star Mote', 'Rift Sentinel', 'Grave Brute']
  },
  {
    id: '3-1', num: 9, chapter: 2, name: 'Storm Ladder', sub: 'Climb into the wound',
    desc: 'Frozen lightning stitches the cliffs together. The air tastes of iron and ozone.',
    recPower: 1380, xp: 170, gold: 225, type: 'normal',
    waves: [['stalker', 'stalker', 'stalker', 'mote'], ['sentinel', 'sentinel', 'brute', 'mote']],
    foes: ['Cinder Stalker', 'Rift Sentinel', 'Grave Brute']
  },
  {
    id: '3-2', num: 10, chapter: 2, name: 'Pale Meridian', sub: 'No shadow to hide in',
    desc: 'A white sun hangs motionless above the pass. Everything beneath it is exposed.',
    recPower: 1680, xp: 210, gold: 275, type: 'normal',
    waves: [['mote', 'mote', 'mote', 'wisp'], ['brute', 'brute', 'sentinel', 'stalker'], ['stalker', 'stalker', 'mote', 'mote']],
    foes: ['Star Mote', 'Grave Brute', 'Rift Sentinel']
  },
  {
    id: '3-3', num: 11, chapter: 2, name: 'The Last Stair', sub: 'A thousand steps',
    desc: 'Every step is a king’s name. The Hollow King’s honor guard still stands.',
    recPower: 2050, xp: 260, gold: 340, type: 'normal',
    waves: [['sentinel', 'sentinel', 'sentinel', 'wisp'], ['brute', 'brute', 'stalker', 'mote'], ['sentinel', 'brute', 'brute', 'mote']],
    foes: ['Rift Sentinel', 'Grave Brute', 'Star Mote']
  },
  {
    id: '3-4', num: 12, chapter: 2, name: 'The Hollow King', sub: 'Final boss',
    desc: 'The Shattered Crown sits on an empty throne. It has been waiting for a worthy head.',
    recPower: 2600, xp: 520, gold: 720, type: 'boss', boss: 'hollowking',
    waves: [['sentinel', 'sentinel', 'brute', 'brute'], ['mote', 'mote', 'stalker', 'stalker', 'wisp']],
    foes: ['Rift Sentinel', 'Grave Brute', 'Star Mote']
  }
];

export const STAGE = Object.fromEntries(STAGES.map(s => [s.id, s]));

export const RARITY_WEIGHTS = {
  normal: [
    [720, 210, 55, 13, 2, 0],
    [720, 210, 55, 13, 2, 0],
    [720, 210, 55, 13, 2, 0],
    [560, 280, 118, 35, 6, 1],
    [620, 260, 90, 24, 5, 1],
    [620, 260, 90, 24, 5, 1],
    [600, 265, 100, 28, 6, 1],
    [500, 280, 140, 58, 18, 4],
    [500, 280, 140, 58, 18, 4],
    [480, 282, 146, 64, 22, 6],
    [460, 285, 152, 70, 27, 6],
    [420, 290, 165, 84, 34, 7]
  ],
  boss: [
    [350, 350, 200, 80, 18, 2],
    [350, 350, 200, 80, 18, 2],
    [300, 340, 225, 105, 26, 4],
    [220, 330, 260, 140, 43, 7],
    [200, 320, 270, 155, 48, 7],
    [180, 310, 280, 165, 55, 10],
    [150, 290, 290, 180, 75, 15],
    [80, 200, 290, 230, 160, 20]
  ]
};

export const TIPS = [
  'Four identical relics can be reforged into one of the next rarity.',
  'Bosses guarantee higher-rarity relics on every clear.',
  'Critical chance benefits every class. It is never wasted.',
  'The Forge preserves equipped items. Only spare copies are consumed.',
  'Boss relics are unique to their keeper and cannot be found elsewhere.',
  'Tilt controls can be enabled in Settings on supported phones and tablets.'
];
