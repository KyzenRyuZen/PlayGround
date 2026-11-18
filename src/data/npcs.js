import { L } from '../core/i18n.js';

export const NPCS = [
  {
    id: 'elder', zone: 'greendale', title: L('Älteste der Wächter', 'Elder of the Wardens'), nameKey: 'npc.elder',
    pos: { x: 0.44, y: 0.81 }, role: 'quests', color: '#c9b889', robe: '#a89a7a', accent: '#d9b76a',
    greeting: 'npc.story1', actions: ['quests'],
    lines: [
      { de: 'Die Aetheria weint, {name}. Acht Reiche, acht Wunden. Doch du trägst das Licht in dir.', en: 'Aetheria weeps, {name}. Eight realms, eight wounds. Yet you carry the light within.' },
      { de: 'Greendale war einst ein Garten. Heute ist es ein Schlachtfeld. Die Wölfe tragen den Geruch der Asche in ihren Fängen.', en: 'Greendale was once a garden. Today it is a battlefield. The wolves carry the scent of ash in their jaws.' },
      { de: 'Der Hainwächter ist erwacht. Sein Herz aus Stein vergiftet die Wurzeln. Beende sein Leiden.', en: 'The Grove Warden has awoken. His heart of stone poisons the roots. End his suffering.' },
    ],
  },
  {
    id: 'smith', zone: 'greendale', title: L('Schmied', 'Blacksmith'), nameKey: 'npc.smith',
    pos: { x: 0.57, y: 0.83 }, role: 'forge', color: '#b5714b', robe: '#4a3a2f', accent: '#ff8a5c',
    greeting: 'npc.smithDialogue', actions: ['forge', 'fusion'],
    lines: [
      { de: 'Metall vergisst nichts. Es erinnert sich an jede Seele, die es geformt hat.', en: 'Metal forgets nothing. It remembers every soul that shaped it.' },
      { de: 'Vier gleiche Teile, eine neue Stufe. Kein Zauber, kein Risiko – nur Handwerk.', en: 'Four identical pieces, one new tier. No magic, no risk — just craft.' },
      { de: 'Legendäre Klingen werden hier geschmiedet. Sie fallen nicht vom Himmel.', en: 'Legendary blades are forged here. They do not fall from the sky.' },
    ],
  },
  {
    id: 'ysra', zone: 'greendale', title: L('Händlerin', 'Merchant'), nameKey: 'npc.ysra',
    pos: { x: 0.62, y: 0.78 }, role: 'shop', color: '#cf9c74', robe: '#6b3f52', accent: '#e0a35c',
    greeting: 'npc.ysraDialogue', actions: ['shop'],
    lines: [
      { de: 'Gold gegen Stahl, Gems gegen Geschichten. Was darf es sein?', en: 'Gold for steel, gems for stories. What will it be?' },
      { de: 'Flügel? Die verkaufe ich nicht. Die verdient man sich – oder findet sie im Aether-Shop.', en: 'Wings? I do not sell those. You earn them — or find them in the Aether Shop.' },
      { de: 'Keine Reparaturen, Liebes. In Aetheria nutzt sich Stahl nicht ab.', en: 'No repairs, dear. In Aetheria, steel does not wear out.' },
    ],
  },
  {
    id: 'iron_elder', zone: 'ironcrag', title: L('Ältester der Esse', 'Elder of the Forge'), nameKey: 'npc.elder',
    pos: { x: 0.44, y: 0.8 }, role: 'quests', color: '#d0a679', robe: '#514337', accent: '#ffbd6e',
    greeting: 'npc.story2', actions: ['quests'],
    lines: [
      { de: 'Im Eisenfirst schmieden sie Waffen für einen Krieg, den niemand gewinnen kann.', en: 'In the Iron Ridge they forge weapons for a war no one can win.' },
      { de: 'Der Schmiedekönig schlägt nicht mehr auf Ambosse. Er schlägt auf Seelen.', en: 'The Forge King no longer strikes anvils. He strikes souls.' },
    ],
  },
  {
    id: 'iron_smith', zone: 'ironcrag', title: L('Schmiedemeisterin', 'Forge Master'), nameKey: 'npc.smith',
    pos: { x: 0.56, y: 0.83 }, role: 'forge', color: '#b5714b', robe: '#45352d', accent: '#ffbd6e',
    greeting: 'npc.smithDialogue', actions: ['forge', 'fusion'],
    lines: [
      { de: 'Meine Esse brennt seit dreihundert Jahren. Sie wird nicht erlöschen, solange Eisen atmet.', en: 'My forge has burned for three hundred years. It will not die while iron breathes.' },
      { de: 'Bosssteine? Ich kann ihre Boni neu schmieden. Bis zu drei, nie mehr.', en: 'Boss stones? I can reforge their bonuses. Up to three, never more.' },
    ],
  },
  {
    id: 'iron_ysra', zone: 'ironcrag', title: L('Händlerin', 'Merchant'), nameKey: 'npc.ysra',
    pos: { x: 0.61, y: 0.78 }, role: 'shop', color: '#cf9c74', robe: '#6b3f52', accent: '#e0a35c',
    greeting: 'npc.ysraDialogue', actions: ['shop'],
    lines: [
      { de: 'In Greendale verkaufe ich Kräuter. Hier verkaufe ich Eisen. Überall verkaufe ich Hoffnung.', en: 'In Greendale I sell herbs. Here I sell iron. Everywhere I sell hope.' },
    ],
  },
];

export const RETURN_PORTALS = {
  greendale: { x: 0.5, y: 0.87, label: L('Weltportal', 'World Gate'), target: 'world' },
  ironcrag: { x: 0.5, y: 0.87, label: L('Rückkehr-Teleporter', 'Return Teleporter'), target: 'greendale' },
  venomwood: { x: 0.5, y: 0.87, label: L('Rückkehr-Teleporter', 'Return Teleporter'), target: 'greendale' },
  mistgrave: { x: 0.5, y: 0.87, label: L('Rückkehr-Teleporter', 'Return Teleporter'), target: 'greendale' },
  frostpeak: { x: 0.5, y: 0.87, label: L('Rückkehr-Teleporter', 'Return Teleporter'), target: 'greendale' },
  sunscorch: { x: 0.5, y: 0.87, label: L('Rückkehr-Teleporter', 'Return Teleporter'), target: 'greendale' },
  ashen: { x: 0.5, y: 0.87, label: L('Rückkehr-Teleporter', 'Return Teleporter'), target: 'greendale' },
  tower: { x: 0.5, y: 0.87, label: L('Rückkehr-Teleporter', 'Return Teleporter'), target: 'greendale' },
};

export function npcsInZone(zoneId) { return NPCS.filter((n) => n.zone === zoneId); }
