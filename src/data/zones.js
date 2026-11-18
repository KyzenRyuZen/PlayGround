import { L } from '../core/i18n.js';

// Eight large, hand-tuned realms. Monster counts are per zone instance.
export const ZONES = [
  {
    id: 'greendale', key: 'zone.greendale', descKey: 'zone.greendaleDesc', index: 0,
    min: 1, max: 6, unlockChapter: 0, travelCost: 0, camp: true, map: { x: 22, y: 76 },
    palette: { base: '#16251b', base2: '#213726', base3: '#2c4630', accent: '#6f9c5b', path: '#4b4331', fog: '#0a140e', light: '#d6e9a6', water: '#2e4a46', prop: '#1f3222', prop2: '#3e5332' },
    weather: 'fireflies', props: ['tree', 'tree', 'tree', 'rock', 'ruin', 'bush', 'mushroom'],
    gather: ['herb', 'crystal'], bossStoneName: L('Herzstein des Hains', 'Heartstone of the Grove'),
    monsters: [
      { id: 'wolf', name: L('Grauwolf', 'Grey Wolf'), sprite: 'wolf', level: 2, count: 13, hp: 1, atk: 1, xp: 1, gold: 1, scale: 0.92 },
      { id: 'boar', name: L('Dornrücken-Eber', 'Thornback Boar'), sprite: 'boar', level: 3, count: 10, hp: 1.15, atk: 1.1, xp: 1.1, gold: 1.1, scale: 1.03 },
      { id: 'goblin', name: L('Moosgoblin', 'Moss Goblin'), sprite: 'goblin', level: 4, count: 10, hp: 0.9, atk: 1.1, xp: 1.1, gold: 1.2, scale: 0.88 },
      { id: 'treant', name: L('Junger Treant', 'Young Treant'), sprite: 'treant', level: 5, count: 7, hp: 1.7, atk: 1.25, xp: 1.4, gold: 1.4, scale: 1.16 },
    ],
    elite: { id: 'direwolf', name: L('Alpha-Schreckwolf', 'Alpha Direwolf'), sprite: 'wolf', level: 6, scale: 1.35, hp: 3.2, atk: 1.3, xp: 3.4, gold: 3, tint: '#9fbf8a' },
    boss: { id: 'grovewarden', name: L('Hainwächter', 'Grove Warden'), sprite: 'treant', level: 8, scale: 2.3, hp: 13, atk: 1.5, xp: 12, gold: 8, tint: '#b7d68f', stoneName: L('Herzstein des Hains', 'Heartstone of the Grove') },
  },
  {
    id: 'ironcrag', key: 'zone.ironcrag', descKey: 'zone.ironcragDesc', index: 1,
    min: 7, max: 12, unlockChapter: 1, travelCost: 120, camp: true, map: { x: 39, y: 62 },
    palette: { base: '#27231f', base2: '#38312a', base3: '#493d30', accent: '#c08a44', path: '#4f4639', fog: '#15120f', light: '#ffbd6e', water: '#3c4a4f', prop: '#332d27', prop2: '#5a4a36' },
    weather: 'embers', props: ['rock', 'rock', 'pine', 'ruin', 'ore', 'anvil', 'bush'],
    gather: ['ore', 'crystal'], bossStoneName: L('Herz der Esse', 'Heart of the Forge'),
    monsters: [
      { id: 'golem', name: L('Eisengolem', 'Iron Golem'), sprite: 'golem', level: 8, count: 12, hp: 1.6, atk: 1.2, xp: 1.2, gold: 1.3, scale: 1.05 },
      { id: 'bandit', name: L('Gratbandit', 'Ridge Bandit'), sprite: 'bandit', level: 9, count: 12, hp: 1, atk: 1.15, xp: 1.15, gold: 1.5, scale: 0.95 },
      { id: 'bat', name: L('Klippenfledermaus', 'Crag Bat'), sprite: 'bat', level: 9, count: 10, hp: 0.8, atk: 1.1, xp: 1, gold: 0.9, scale: 0.8 },
      { id: 'hound', name: L('Schlackenhund', 'Slag Hound'), sprite: 'wolf', level: 11, count: 8, hp: 1.2, atk: 1.3, xp: 1.4, gold: 1.2, scale: 1, tint: '#b5754e' },
    ],
    elite: { id: 'ironsentinel', name: L('Eisenwächter', 'Iron Sentinel'), sprite: 'golem', level: 12, scale: 1.5, hp: 3.4, atk: 1.4, xp: 3.6, gold: 3.4, tint: '#d2a35c' },
    boss: { id: 'forgeking', name: L('Schmiedekönig', 'Forge King'), sprite: 'golem', level: 14, scale: 2.35, hp: 14, atk: 1.6, xp: 13, gold: 9, tint: '#ffb45c', stoneName: L('Schmiedeherz', 'Forge Heart') },
  },
  {
    id: 'venomwood', key: 'zone.venomwood', descKey: 'zone.venomwoodDesc', index: 2,
    min: 13, max: 18, unlockChapter: 2, travelCost: 260, camp: false, map: { x: 55, y: 70 },
    palette: { base: '#15211a', base2: '#223529', base3: '#2e4634', accent: '#8ec455', path: '#3e4030', fog: '#0b160f', light: '#b5ff83', water: '#33493c', prop: '#263b2c', prop2: '#537d47' },
    weather: 'spores', props: ['mushroom', 'mushroom', 'tree', 'bush', 'ruin', 'web', 'rock'],
    gather: ['fungus', 'crystal'], bossStoneName: L('Giftkronjuwel', 'Venom Crown Jewel'),
    monsters: [
      { id: 'spider', name: L('Giftspinne', 'Venom Spider'), sprite: 'spider', level: 14, count: 13, hp: 1, atk: 1.25, xp: 1.2, gold: 1.2, scale: 0.95 },
      { id: 'sporeling', name: L('Sporenling', 'Sporeling'), sprite: 'mushroom', level: 15, count: 11, hp: 1.25, atk: 1.1, xp: 1.25, gold: 1.2, scale: 1 },
      { id: 'serpent', name: L('Sumpfschlange', 'Bog Serpent'), sprite: 'serpent', level: 16, count: 10, hp: 1.1, atk: 1.35, xp: 1.3, gold: 1.3, scale: 1.1 },
      { id: 'mirewraith', name: L('Moorseele', 'Mire Wraith'), sprite: 'wraith', level: 17, count: 7, hp: 0.95, atk: 1.45, xp: 1.4, gold: 1.3, scale: 1.05, tint: '#8ce07a' },
    ],
    elite: { id: 'broodmother', name: L('Brutmutter', 'Broodmother'), sprite: 'spider', level: 18, scale: 1.55, hp: 3.5, atk: 1.5, xp: 3.8, gold: 3.6, tint: '#c8ff7a' },
    boss: { id: 'plaguehydra', name: L('Seuchenhydra', 'Plague Hydra'), sprite: 'serpent', level: 20, scale: 2.5, hp: 15, atk: 1.7, xp: 14, gold: 10, tint: '#a8e05c', stoneName: L('Giftkronjuwel', 'Venom Crown Jewel') },
  },
  {
    id: 'mistgrave', key: 'zone.mistgrave', descKey: 'zone.mistgraveDesc', index: 3,
    min: 19, max: 24, unlockChapter: 3, travelCost: 420, camp: false, map: { x: 69, y: 58 },
    palette: { base: '#191b20', base2: '#262931', base3: '#343843', accent: '#8d9caf', path: '#3e434b', fog: '#0b0d12', light: '#c4d4e6', water: '#2d3942', prop: '#2a2c33', prop2: '#4d5360' },
    weather: 'mist', props: ['grave', 'grave', 'deadTree', 'ruin', 'rock', 'candle', 'bones'],
    gather: ['bone', 'crystal'], bossStoneName: L('Seelenlaterne', 'Soul Lantern'),
    monsters: [
      { id: 'skeleton', name: L('Grabgerippe', 'Grave Skeleton'), sprite: 'skeleton', level: 20, count: 13, hp: 1.05, atk: 1.2, xp: 1.25, gold: 1.2, scale: 0.98 },
      { id: 'ghoul', name: L('Nebelghul', 'Mist Ghoul'), sprite: 'ghoul', level: 21, count: 11, hp: 1.35, atk: 1.3, xp: 1.3, gold: 1.25, scale: 1.02 },
      { id: 'wraith', name: L('Klagegeist', 'Wailing Wraith'), sprite: 'wraith', level: 22, count: 9, hp: 0.9, atk: 1.5, xp: 1.4, gold: 1.35, scale: 1.05 },
      { id: 'raven', name: L('Aasrabe', 'Carrion Raven'), sprite: 'bat', level: 23, count: 8, hp: 0.75, atk: 1.35, xp: 1.25, gold: 1, scale: 0.9, tint: '#8fa3b8' },
    ],
    elite: { id: 'deathknight', name: L('Todesritter', 'Death Knight'), sprite: 'knight', level: 24, scale: 1.45, hp: 3.6, atk: 1.55, xp: 4, gold: 3.8, tint: '#a6b8cc' },
    boss: { id: 'gravelich', name: L('Grablicht', 'Grave Lich'), sprite: 'skeleton', level: 26, scale: 2.4, hp: 16, atk: 1.8, xp: 15, gold: 11, tint: '#bcd6ff', stoneName: L('Seelenlaterne', 'Soul Lantern') },
  },
  {
    id: 'frostpeak', key: 'zone.frostpeak', descKey: 'zone.frostpeakDesc', index: 4,
    min: 25, max: 30, unlockChapter: 4, travelCost: 620, camp: false, map: { x: 80, y: 41 },
    palette: { base: '#1b2632', base2: '#2a3b4a', base3: '#374c5e', accent: '#b9e6ff', path: '#4c5e6c', fog: '#0d1720', light: '#e2f4ff', water: '#345b6b', prop: '#2b3c4a', prop2: '#587488' },
    weather: 'snow', props: ['pineSnow', 'pineSnow', 'ice', 'rock', 'ruin', 'crystal', 'deadTree'],
    gather: ['ice', 'crystal'], bossStoneName: L('Himmelsfrost', 'Skyfrost'),
    monsters: [
      { id: 'icewolf', name: L('Frostwolf', 'Frost Wolf'), sprite: 'wolf', level: 26, count: 12, hp: 1.1, atk: 1.3, xp: 1.3, gold: 1.3, scale: 1, tint: '#bfe7ff' },
      { id: 'yeti', name: L('Frostyeti', 'Frost Yeti'), sprite: 'ghoul', level: 27, count: 10, hp: 1.6, atk: 1.4, xp: 1.4, gold: 1.4, scale: 1.18, tint: '#d8f3ff' },
      { id: 'icewarden', name: L('Eiswächter', 'Ice Warden'), sprite: 'knight', level: 28, count: 9, hp: 1.3, atk: 1.45, xp: 1.45, gold: 1.5, scale: 1.05, tint: '#9cd8ff' },
      { id: 'elemental', name: L('Eiselementar', 'Ice Elemental'), sprite: 'golem', level: 29, count: 8, hp: 1.4, atk: 1.5, xp: 1.5, gold: 1.45, scale: 1.05, tint: '#a8e6ff' },
    ],
    elite: { id: 'frostgiant', name: L('Frostriese', 'Frost Giant'), sprite: 'ghoul', level: 30, scale: 1.75, hp: 4, atk: 1.65, xp: 4.4, gold: 4.2, tint: '#e8faff' },
    boss: { id: 'skydrake', name: L('Himmelsdrache', 'Sky Drake'), sprite: 'dragon', level: 32, scale: 2.5, hp: 18, atk: 1.9, xp: 17, gold: 13, tint: '#c8eaff', stoneName: L('Himmelsfrost', 'Skyfrost') },
  },
  {
    id: 'sunscorch', key: 'zone.sunscorch', descKey: 'zone.sunscorchDesc', index: 5,
    min: 31, max: 36, unlockChapter: 5, travelCost: 850, camp: false, map: { x: 66, y: 29 },
    palette: { base: '#382818', base2: '#55402a', base3: '#6c5235', accent: '#f0c36a', path: '#7a5c39', fog: '#1a1109', light: '#ffd78a', water: '#4b6a63', prop: '#4a3624', prop2: '#7a5e3b' },
    weather: 'sand', props: ['cactus', 'cactus', 'rock', 'ruin', 'bones', 'palm', 'obelisk'],
    gather: ['sunstone', 'crystal'], bossStoneName: L('Sonnenkrone', 'Sun Crown'),
    monsters: [
      { id: 'scorpion', name: L('Dünen-Skorpion', 'Dune Scorpion'), sprite: 'scorpion', level: 32, count: 12, hp: 1.1, atk: 1.5, xp: 1.35, gold: 1.35, scale: 1.05 },
      { id: 'mummy', name: L('Sandmumie', 'Sand Mummy'), sprite: 'mummy', level: 33, count: 11, hp: 1.5, atk: 1.4, xp: 1.4, gold: 1.4, scale: 1.05 },
      { id: 'jackal', name: L('Schakal-Räuber', 'Jackal Raider'), sprite: 'bandit', level: 34, count: 10, hp: 1.15, atk: 1.55, xp: 1.45, gold: 1.6, scale: 0.98, tint: '#e0b06a' },
      { id: 'scarab', name: L('Sonnen-Skarabäus', 'Sun Scarab'), sprite: 'spider', level: 35, count: 8, hp: 1.25, atk: 1.5, xp: 1.5, gold: 1.4, scale: 1.1, tint: '#ffcf6a' },
    ],
    elite: { id: 'sandworm', name: L('Sandwurm', 'Sandworm'), sprite: 'serpent', level: 36, scale: 1.8, hp: 4.2, atk: 1.75, xp: 4.8, gold: 4.5, tint: '#e8c07a' },
    boss: { id: 'sunpharaoh', name: L('Sonnenpharao', 'Sun Pharaoh'), sprite: 'mummy', level: 38, scale: 2.5, hp: 20, atk: 2, xp: 19, gold: 15, tint: '#ffd77a', stoneName: L('Sonnenkrone', 'Sun Crown') },
  },
  {
    id: 'ashen', key: 'zone.ashen', descKey: 'zone.ashenDesc', index: 6,
    min: 37, max: 45, unlockChapter: 6, travelCost: 1150, camp: false, map: { x: 45, y: 20 },
    palette: { base: '#1c1113', base2: '#2e191b', base3: '#422223', accent: '#ff7b4a', path: '#4a2b26', fog: '#11090b', light: '#ff9a5c', water: '#5c2b1c', prop: '#2a1719', prop2: '#5c2f2c' },
    weather: 'ash', props: ['deadTree', 'deadTree', 'ruin', 'obsidian', 'lava', 'bones', 'banner'],
    gather: ['ember', 'crystal'], bossStoneName: L('Aschethron', 'Ashen Throne'),
    monsters: [
      { id: 'imp', name: L('Aschenbold', 'Ash Imp'), sprite: 'imp', level: 38, count: 12, hp: 1.1, atk: 1.65, xp: 1.45, gold: 1.4, scale: 0.9 },
      { id: 'ashknight', name: L('Aschenritter', 'Ash Knight'), sprite: 'knight', level: 40, count: 10, hp: 1.5, atk: 1.7, xp: 1.55, gold: 1.55, scale: 1.08, tint: '#ff9a7a' },
      { id: 'cinderhound', name: L('Glimmhund', 'Cinder Hound'), sprite: 'wolf', level: 41, count: 10, hp: 1.3, atk: 1.75, xp: 1.5, gold: 1.5, scale: 1.05, tint: '#ff8a5c' },
      { id: 'fiend', name: L('Abgrundschrecken', 'Abyss Fiend'), sprite: 'demon', level: 43, count: 8, hp: 1.35, atk: 1.85, xp: 1.7, gold: 1.7, scale: 1.15, tint: '#ff7a6b' },
    ],
    elite: { id: 'hellguard', name: L('Höllenwache', 'Hellguard'), sprite: 'knight', level: 44, scale: 1.55, hp: 4.5, atk: 1.9, xp: 5.2, gold: 5, tint: '#ff6b4a' },
    boss: { id: 'ashenlord', name: L('Aschenfürst', 'Ashen Lord'), sprite: 'demon', level: 47, scale: 2.6, hp: 22, atk: 2.15, xp: 22, gold: 18, tint: '#ff5c4a', stoneName: L('Aschethron', 'Ashen Throne') },
  },
  {
    id: 'tower', key: 'zone.tower', descKey: 'zone.towerDesc', index: 7,
    min: 46, max: 60, unlockChapter: 7, travelCost: 1600, camp: false, map: { x: 25, y: 33 },
    palette: { base: '#121222', base2: '#1d1c38', base3: '#2a2850', accent: '#b9a2ff', path: '#39345f', fog: '#08070f', light: '#d8c8ff', water: '#2a3d66', prop: '#1c1b33', prop2: '#48427a' },
    weather: 'stars', props: ['obelisk', 'obelisk', 'crystal', 'ruin', 'rune', 'void', 'statue'],
    gather: ['star', 'crystal'], bossStoneName: L('Auge des Aether', 'Eye of Aether'),
    monsters: [
      { id: 'voidling', name: L('Leerenwesen', 'Voidling'), sprite: 'voidling', level: 47, count: 12, hp: 1.2, atk: 1.9, xp: 1.6, gold: 1.6, scale: 0.95 },
      { id: 'seraph', name: L('Gefallener Seraph', 'Fallen Seraph'), sprite: 'seraph', level: 50, count: 10, hp: 1.6, atk: 2, xp: 1.7, gold: 1.7, scale: 1.15, tint: '#e8d8ff' },
      { id: 'watcher', name: L('Auge der Leere', 'Void Watcher'), sprite: 'eye', level: 53, count: 9, hp: 1.4, atk: 2.1, xp: 1.8, gold: 1.8, scale: 1.15 },
      { id: 'construct', name: L('Ewigkeitskonstrukt', 'Eternity Construct'), sprite: 'golem', level: 56, count: 8, hp: 1.9, atk: 2.15, xp: 1.9, gold: 1.9, scale: 1.15, tint: '#c8b8ff' },
    ],
    elite: { id: 'voidknight', name: L('Leerenritter', 'Void Knight'), sprite: 'knight', level: 58, scale: 1.65, hp: 5, atk: 2.3, xp: 6, gold: 6, tint: '#c8a8ff' },
    boss: { id: 'aethersov', name: L('Aetherherrscher', 'Aether Sovereign'), sprite: 'seraph', level: 60, scale: 2.8, hp: 26, atk: 2.5, xp: 30, gold: 24, tint: '#f0e0ff', stoneName: L('Auge des Aether', 'Eye of Aether') },
  },
];

export function getZone(id) { return ZONES.find((z) => z.id === id) ?? ZONES[0]; }
export function zoneByIndex(i) { return ZONES[i]; }

export const WORLD_ORDER = ZONES.map((z) => z.id);

// Camp positions in each zone (fractions of the world)
export const CAMP = { x: 0.5, y: 0.78 };
export const BOSS_POS = { x: 0.5, y: 0.16 };

// Gathering node definitions per material type
export const GATHER_NODES = {
  herb: { color: '#8fce6d', glow: '#b9ff8a', shape: 'herb' },
  ore: { color: '#c0a06a', glow: '#ffc46e', shape: 'ore' },
  fungus: { color: '#a8e05c', glow: '#d4ff7a', shape: 'mushroom' },
  bone: { color: '#d8d2c0', glow: '#fff0c8', shape: 'bones' },
  ice: { color: '#a8e6ff', glow: '#dff6ff', shape: 'crystal' },
  sunstone: { color: '#ffcf6a', glow: '#ffe9a8', shape: 'crystal' },
  ember: { color: '#ff8a5c', glow: '#ffb36e', shape: 'crystal' },
  star: { color: '#c8b8ff', glow: '#e8ddff', shape: 'crystal' },
  crystal: { color: '#b9a2ff', glow: '#d8c8ff', shape: 'crystal' },
};
