import { L } from '../core/i18n.js';

const r = (xp, gold, gems, extra = {}) => ({ xp, gold, gems, ...extra });

export const QUESTS = [
  // ── Chapter 1 · Greendale ─────────────────────────────────────────────
  {
    id: 'q_green_story', zone: 'greendale', chapter: 1, story: true, npc: 'elder',
    name: L('Die Wölfe von Greendale', 'The Wolves of Greendale'),
    desc: L('Die Grauwölfe dringen bis an das Lager heran. Vertreibe sie und stelle dich dem Hainwächter, der den Wald vergiftet.', 'The grey wolves press close to camp. Drive them back and face the Grove Warden who poisons the wood.'),
    objectives: [
      { type: 'kill', target: 'wolf', count: 10 },
      { type: 'killElite', target: 'direwolf', count: 1 },
      { type: 'boss', target: 'grovewarden', count: 1 },
    ],
    rewards: r(650, 320, 35, { mount: 'mount_stag', gear: { slot: 'weapon', rarity: 'blue', tier: 'T3' } }),
  },
  {
    id: 'q_green_side1', zone: 'greendale', chapter: 1, story: false, npc: 'ysra',
    name: L('Kräuter für Ysra', 'Herbs for Ysra'),
    desc: L('Ysra braucht frisches Aetherkraut für ihre Tränke. Sammle fünf Büschel im Wald.', 'Ysra needs fresh aetherweed for her potions. Gather five bundles in the wood.'),
    objectives: [{ type: 'gather', target: 'herb', count: 5 }],
    rewards: r(180, 90, 5, { consumable: { id: 'healPotion', qty: 3 } }),
  },
  {
    id: 'q_green_side2', zone: 'greendale', chapter: 1, story: false, npc: 'elder',
    name: L('Zähne des Waldes', 'Teeth of the Wood'),
    desc: L('Die Eber verwüsten die alten Pfade. Erlege sechs von ihnen.', 'The boars ravage the old paths. Slay six of them.'),
    objectives: [{ type: 'kill', target: 'boar', count: 6 }],
    rewards: r(220, 120, 6, { gear: { slot: 'boots', rarity: 'green', tier: 'T3' } }),
  },
  // ── Chapter 2 · Ironcrag ──────────────────────────────────────────────
  {
    id: 'q_iron_story', zone: 'ironcrag', chapter: 2, story: true, npc: 'elder',
    name: L('Der erloschene Hammer', 'The Dying Hammer'),
    desc: L('Im Eisenfirst schmiedet der Schmiedekönig eine Armee aus Erz. Zerschlage die Golems und beende seine Herrschaft.', 'In the Iron Ridge, the Forge King builds an army of ore. Break the golems and end his reign.'),
    objectives: [
      { type: 'kill', target: 'golem', count: 8 },
      { type: 'kill', target: 'bandit', count: 6 },
      { type: 'boss', target: 'forgeking', count: 1 },
    ],
    rewards: r(1500, 700, 45, { gear: { slot: 'chest', rarity: 'blue', tier: 'T2' } }),
  },
  {
    id: 'q_iron_side1', zone: 'ironcrag', chapter: 2, story: false, npc: 'smith',
    name: L('Erz für die Esse', 'Ore for the Forge'),
    desc: L('Bran benötigt Eisenerz für eine dringende Klinge. Bringe ihm sechs Brocken.', 'Bran needs iron ore for an urgent blade. Bring him six chunks.'),
    objectives: [{ type: 'gather', target: 'ore', count: 6 }],
    rewards: r(420, 220, 7, { consumable: { id: 'healPotion', qty: 4 } }),
  },
  {
    id: 'q_iron_side2', zone: 'ironcrag', chapter: 2, story: false, npc: 'smith',
    name: L('Fell und Stahl', 'Fur and Steel'),
    desc: L('Die Schlackenhunde jagen die Schmiede. Erlege fünf von ihnen.', 'The slag hounds hunt the smiths. Slay five of them.'),
    objectives: [{ type: 'kill', target: 'hound', count: 5 }],
    rewards: r(480, 260, 8, { gear: { slot: 'gloves', rarity: 'green', tier: 'T2' } }),
  },
  // ── Chapter 3 · Venomwood ─────────────────────────────────────────────
  {
    id: 'q_venom_story', zone: 'venomwood', chapter: 3, story: true,
    name: L('Unter dem Giftpilz', 'Beneath the Glowcap'),
    desc: L('Der Wald atmet Gift. Die Sporen fressen das Land. Finde die Brut und verbrenne die Quelle.', 'The wood breathes poison. The spores devour the land. Find the brood and burn the source.'),
    objectives: [
      { type: 'kill', target: 'spider', count: 10 },
      { type: 'gather', target: 'fungus', count: 5 },
      { type: 'boss', target: 'plaguehydra', count: 1 },
    ],
    rewards: r(2800, 1200, 50, { gear: { slot: 'helm', rarity: 'purple', tier: 'T3' } }),
  },
  {
    id: 'q_venom_side1', zone: 'venomwood', chapter: 3, story: false,
    name: L('Leuchtende Ernte', 'Glowing Harvest'),
    desc: L('Sammle sechs Leuchtpilze. Ihre Sporen halten die Nebelgeister fern.', 'Gather six glowcaps. Their spores keep the mist spirits away.'),
    objectives: [{ type: 'gather', target: 'fungus', count: 6 }],
    rewards: r(560, 280, 8),
  },
  {
    id: 'q_venom_side2', zone: 'venomwood', chapter: 3, story: false,
    name: L('Spinnennester', 'Spider Nests'),
    desc: L('Zerstöre zwölf Giftspinnen, bevor ihre Brut schlüpft.', 'Destroy twelve venom spiders before their brood hatches.'),
    objectives: [{ type: 'kill', target: 'spider', count: 12 }],
    rewards: r(620, 320, 10, { gear: { slot: 'ring', rarity: 'green', tier: 'T2' } }),
  },
  // ── Chapter 4 · Mistgrave ─────────────────────────────────────────────
  {
    id: 'q_mist_story', zone: 'mistgrave', chapter: 4, story: true,
    name: L('Die Laterne der Seelen', 'The Lantern of Souls'),
    desc: L('Das Grablicht hält die Toten von Aetheria gefangen. Zerbrich seine Laterne und schenke ihnen Frieden. Als Lohn warten die Flügel der Ewigkeit.', 'The Grave Lich holds the dead of Aetheria captive. Break his lantern and give them peace. The Wings of Eternity await as your reward.'),
    objectives: [
      { type: 'kill', target: 'skeleton', count: 10 },
      { type: 'killElite', target: 'deathknight', count: 1 },
      { type: 'boss', target: 'gravelich', count: 1 },
    ],
    rewards: r(5200, 2200, 65, { wing: 'wing_eternity', gear: { slot: 'amulet', rarity: 'purple', tier: 'T2' } }),
  },
  {
    id: 'q_mist_side1', zone: 'mistgrave', chapter: 4, story: false,
    name: L('Knochenstaub', 'Bone Dust'),
    desc: L('Der Nebel verdichtet sich. Sammle sieben Portionen Knochenstaub für die Schutzzauber.', 'The mist thickens. Gather seven portions of bone dust for the wards.'),
    objectives: [{ type: 'gather', target: 'bone', count: 7 }],
    rewards: r(800, 400, 10),
  },
  {
    id: 'q_mist_side2', zone: 'mistgrave', chapter: 4, story: false,
    name: L('Ruhelose Gräber', 'Restless Graves'),
    desc: L('Elf Klagegeister irren durch die Gruft. Erlöse sie.', 'Eleven wailing wraiths wander the crypt. Release them.'),
    objectives: [{ type: 'kill', target: 'wraith', count: 11 }],
    rewards: r(900, 450, 12, { gear: { slot: 'belt', rarity: 'blue', tier: 'T3' } }),
  },
  // ── Chapter 5 · Frostpeak ─────────────────────────────────────────────
  {
    id: 'q_frost_story', zone: 'frostpeak', chapter: 5, story: true,
    name: L('Der Himmelsdrache', 'The Sky Drake'),
    desc: L('Über dem Frostfirst kreist ein Drache aus blauem Glas. Sein Herz ist der Schlüssel zur Himmelsfestung.', 'Above the Frost Ridge circles a drake of blue glass. Its heart is the key to the Sky Fortress.'),
    objectives: [
      { type: 'kill', target: 'icewolf', count: 10 },
      { type: 'killElite', target: 'frostgiant', count: 1 },
      { type: 'boss', target: 'skydrake', count: 1 },
    ],
    rewards: r(9000, 3800, 80, { gear: { slot: 'weapon', rarity: 'purple', tier: 'T2' } }),
  },
  {
    id: 'q_frost_side1', zone: 'frostpeak', chapter: 5, story: false,
    name: L('Ewiges Eis', 'Eternal Ice'),
    desc: L('Sammle acht Frostessenzen aus den Gletschern.', 'Gather eight frost essences from the glaciers.'),
    objectives: [{ type: 'gather', target: 'ice', count: 8 }],
    rewards: r(1200, 600, 12),
  },
  {
    id: 'q_frost_side2', zone: 'frostpeak', chapter: 5, story: false,
    name: L('Yeti-Spuren', 'Yeti Tracks'),
    desc: L('Die Frostyeti blockieren den Pass. Erlege neun von ihnen.', 'The frost yetis block the pass. Slay nine of them.'),
    objectives: [{ type: 'kill', target: 'yeti', count: 9 }],
    rewards: r(1400, 700, 14, { gear: { slot: 'boots', rarity: 'blue', tier: 'T2' } }),
  },
  // ── Chapter 6 · Sunscorch Desert ──────────────────────────────────────
  {
    id: 'q_sun_story', zone: 'sunscorch', chapter: 6, story: true,
    name: L('Das Grab des Pharaos', 'The Pharaoh’s Tomb'),
    desc: L('Unter dem brennenden Sand schläft ein König aus Glas. Sein Erwachen würde die Wüste verschlingen.', 'Beneath the burning sand sleeps a king of glass. His awakening would swallow the desert.'),
    objectives: [
      { type: 'kill', target: 'mummy', count: 10 },
      { type: 'gather', target: 'sunstone', count: 8 },
      { type: 'boss', target: 'sunpharaoh', count: 1 },
    ],
    rewards: r(15000, 6000, 95, { gear: { slot: 'ring', rarity: 'purple', tier: 'T2' } }),
  },
  {
    id: 'q_sun_side1', zone: 'sunscorch', chapter: 6, story: false,
    name: L('Skorpiongift', 'Scorpion Venom'),
    desc: L('Die Dünen-Skorpione verseuchen die Wasserstellen. Erlege zwölf.', 'The dune scorpions poison the wells. Slay twelve.'),
    objectives: [{ type: 'kill', target: 'scorpion', count: 12 }],
    rewards: r(2200, 1100, 14),
  },
  {
    id: 'q_sun_side2', zone: 'sunscorch', chapter: 6, story: false,
    name: L('Glas und Gold', 'Glass and Gold'),
    desc: L('Sammle sechs Sonnensteine aus den Ruinen.', 'Gather six sunstones from the ruins.'),
    objectives: [{ type: 'gather', target: 'sunstone', count: 6 }],
    rewards: r(2400, 1200, 16, { gear: { slot: 'gloves', rarity: 'blue', tier: 'T2' } }),
  },
  // ── Chapter 7 · Ashen Dominion ────────────────────────────────────────
  {
    id: 'q_ash_story', zone: 'ashen', chapter: 7, story: true,
    name: L('Der Aschenfürst', 'The Ashen Lord'),
    desc: L('Der gefallene Fürst der Dämonen sammelt die Scherben der Ewigkeit. Stürze seinen Thron aus Obsidian.', 'The fallen demon lord gathers the shards of eternity. Topple his obsidian throne.'),
    objectives: [
      { type: 'kill', target: 'imp', count: 12 },
      { type: 'killElite', target: 'hellguard', count: 1 },
      { type: 'boss', target: 'ashenlord', count: 1 },
    ],
    rewards: r(26000, 10000, 120, { gear: { slot: 'chest', rarity: 'legendary', tier: 'T3' } }),
  },
  {
    id: 'q_ash_side1', zone: 'ashen', chapter: 7, story: false,
    name: L('Glimmende Ernte', 'Cinder Harvest'),
    desc: L('Sammle zehn Ascheglut aus dem verbrannten Boden.', 'Gather ten ashen embers from the burned ground.'),
    objectives: [{ type: 'gather', target: 'ember', count: 10 }],
    rewards: r(3800, 1800, 18),
  },
  {
    id: 'q_ash_side2', zone: 'ashen', chapter: 7, story: false,
    name: L('Gefallene Ritter', 'Fallen Knights'),
    desc: L('Zehn Aschenritter verweigern den Frieden. Brich ihren Willen.', 'Ten ash knights refuse peace. Break their will.'),
    objectives: [{ type: 'kill', target: 'ashknight', count: 10 }],
    rewards: r(4000, 2000, 20, { gear: { slot: 'amulet', rarity: 'blue', tier: 'T1' } }),
  },
  // ── Chapter 8 · Tower of Eternity ────────────────────────────────────
  {
    id: 'q_tower_story', zone: 'tower', chapter: 8, story: true,
    name: L('Das Auge des Aether', 'The Eye of Aether'),
    desc: L('Der letzte Turm öffnet sich nur für den, der alle acht Wunden kennt. Stelle dich dem Aetherherrscher und entscheide das Schicksal der Welt.', 'The last tower opens only to one who knows all eight wounds. Face the Aether Sovereign and decide the world’s fate.'),
    objectives: [
      { type: 'kill', target: 'voidling', count: 10 },
      { type: 'kill', target: 'seraph', count: 8 },
      { type: 'killElite', target: 'voidknight', count: 1 },
      { type: 'boss', target: 'aethersov', count: 1 },
    ],
    rewards: r(50000, 20000, 160, { gear: { slot: 'weapon', rarity: 'legendary', tier: 'T2' }, title: 'Aetherias Retter' }),
  },
  {
    id: 'q_tower_side1', zone: 'tower', chapter: 8, story: false,
    name: L('Sterne sammeln', 'Gathering Stars'),
    desc: L('Sammle zwölf Sternsplitter aus den Rissen der Ewigkeit.', 'Gather twelve star fragments from the rifts of eternity.'),
    objectives: [{ type: 'gather', target: 'star', count: 12 }],
    rewards: r(7000, 3200, 25),
  },
  {
    id: 'q_tower_side2', zone: 'tower', chapter: 8, story: false,
    name: L('Wächter der Leere', 'Wardens of the Void'),
    desc: L('Zwölf Leerenwesen bewachen den Aufstieg. Lösche sie aus.', 'Twelve voidlings guard the ascent. Extinguish them.'),
    objectives: [{ type: 'kill', target: 'voidling', count: 12 }],
    rewards: r(7500, 3600, 28, { gear: { slot: 'helm', rarity: 'purple', tier: 'T3' } }),
  },
];

export const QUESTS_BY_ZONE = {};
for (const q of QUESTS) {
  (QUESTS_BY_ZONE[q.zone] ??= []).push(q);
}
export const STORY_QUESTS = QUESTS.filter((q) => q.story);
export function getQuest(id) { return QUESTS.find((q) => q.id === id); }
export function zoneStory(zoneId) { return QUESTS.find((q) => q.zone === zoneId && q.story); }
