import { L, tx } from '../core/i18n.js';
import { rngFrom, clamp } from '../core/utils.js';

export const RARITY_ORDER = ['grey', 'common', 'green', 'blue', 'purple', 'legendary', 'mythic', 'divine'];
export const RARITY = {
  grey: { mult: 0.72, color: '#a7a7a7', weight: 25, sell: 4 },
  common: { mult: 1, color: '#dcd6c5', weight: 60, sell: 9 },
  green: { mult: 1.32, color: '#78d69b', weight: 10, sell: 22 },
  blue: { mult: 1.74, color: '#6fb5f2', weight: 5, sell: 48 },
  purple: { mult: 2.3, color: '#b98af0', weight: 0, sell: 130 },
  legendary: { mult: 3.1, color: '#f4b95e', weight: 0, sell: 420 },
  mythic: { mult: 4.4, color: '#ff7a6b', weight: 0, sell: 1200 },
  divine: { mult: 6.2, color: '#f6f0c8', weight: 0, sell: 3600 },
};
export const DROP_WEIGHTS = [
  { v: 'common', w: 60 }, { v: 'grey', w: 25 }, { v: 'green', w: 10 }, { v: 'blue', w: 5 },
];

export const TIERS = ['T1', 'T2', 'T3'];
export const TIER_MULT = { T3: 1, T2: 1.55, T1: 2.35 };
export const TIER_ORDER = ['T3', 'T2', 'T1'];

export const SLOTS = [
  { id: 'weapon', icon: 'sword', group: 'weapons' },
  { id: 'offhand', icon: 'shield', group: 'weapons' },
  { id: 'helm', icon: 'helm', group: 'armor' },
  { id: 'chest', icon: 'chest', group: 'armor' },
  { id: 'gloves', icon: 'glove', group: 'armor' },
  { id: 'boots', icon: 'boot', group: 'armor' },
  { id: 'belt', icon: 'belt', group: 'armor' },
  { id: 'ring', icon: 'ring', group: 'jewelry' },
  { id: 'amulet', icon: 'amulet', group: 'jewelry' },
];
export const SLOT_IDS = SLOTS.map((s) => s.id);

const BASES = {
  warrior: {
    weapon: L('Kriegsaxt', 'War Axe'),
    offhand: L('Turmschild', 'Tower Shield'),
    helm: L('Sturmhelm', 'Storm Helm'),
    chest: L('Plattenharnisch', 'Plate Harness'),
    gloves: L('Eisengriffe', 'Iron Grips'),
    boots: L('Schwerstiefel', 'Heavy Boots'),
    belt: L('Gurt der Stärke', 'Girdle of Might'),
    ring: L('Blutring', 'Blood Ring'),
    amulet: L('Kriegermedaillon', 'Warrior Medallion'),
  },
  mage: {
    weapon: L('Aetherstab', 'Aether Staff'),
    offhand: L('Zauberfoliant', 'Grimoire'),
    helm: L('Mondkrone', 'Moon Crown'),
    chest: L('Sternenrobe', 'Star Robe'),
    gloves: L('Runenhandschuhe', 'Rune Gloves'),
    boots: L('Traumwandler', 'Dreamwalkers'),
    belt: L('Gürtel des Flusses', 'River Sash'),
    ring: L('Saphirring', 'Sapphire Ring'),
    amulet: L('Amulett der Sphären', 'Amulet of Spheres'),
  },
  assassin: {
    weapon: L('Zwillingsklinge', 'Twin Blade'),
    offhand: L('Wurfdolche', 'Throwing Knives'),
    helm: L('Schleierkapuze', 'Veil Hood'),
    chest: L('Nachtschuppen', 'Nightscale'),
    gloves: L('Samthandschuhe', 'Velvet Gloves'),
    boots: L('Leisetreter', 'Silent Treads'),
    belt: L('Diebesgürtel', 'Thief’s Belt'),
    ring: L('Onyxring', 'Onyx Ring'),
    amulet: L('Splitter der Leere', 'Shard of the Void'),
  },
};

const PREFIX = {
  grey: L('Verwittert', 'Worn'),
  common: L('', ''),
  green: L('Aether', 'Aether'),
  blue: L('Runen', 'Runed'),
  purple: L('Schatten', 'Umbral'),
  legendary: L('Drachen', 'Dragonforged'),
  mythic: L('Götter', 'Godforged'),
  divine: L('Ewig', 'Eternal'),
};

export const STAT_LABEL = {
  attack: 'stats.attack', defense: 'stats.defense', hp: 'stats.hp', crit: 'stats.crit',
  critDmg: 'stats.critDmg', speed: 'stats.speed', lifesteal: 'stats.lifesteal',
  goldFind: 'stats.goldFind', gatherSpeed: 'stats.gatherSpeed', hpRegen: 'stats.hpRegen',
  resourceRegen: 'stats.manaRegen',
};

export function itemKey(slot, classId, rarity, tier, level) {
  return `${slot}|${classId}|${rarity}|${tier}|${level}`;
}

export function itemName(item) {
  if (!item) return '';
  if (item.customName) return tx(item.customName);
  if (item.kind === 'material' || item.kind === 'consumable' || item.kind === 'wing') return tx(item.name);
  if (item.kind === 'stone') return tx(item.name);
  const base = BASES[item.class]?.[item.slot];
  if (!base) return tx(item.name ?? L('Unbekannt', 'Unknown'));
  const prefix = PREFIX[item.rarity];
  const ptxt = prefix ? tx(prefix) : '';
  return ptxt ? `${ptxt} ${tx(base)}` : tx(base);
}

export function makeEquip({ classId, slot, rarity, tier, level = 1 }) {
  const rng = rngFrom('equip', itemKey(slot, classId, rarity, tier, level));
  const rm = RARITY[rarity]?.mult ?? 1;
  const tm = TIER_MULT[tier] ?? 1;
  const scale = rm * tm;
  const lvl = Math.max(1, level);
  const stats = {};
  const isWeapon = slot === 'weapon';
  const isArmor = ['helm', 'chest', 'gloves', 'boots', 'belt', 'offhand'].includes(slot);
  const isJewel = ['ring', 'amulet'].includes(slot);

  if (isWeapon) {
    stats.attack = Math.round((6 + lvl * 2.15) * scale);
    if (rarity !== 'grey') stats.crit = +(0.008 + lvl * 0.00012).toFixed(4) * rm;
  } else if (isArmor) {
    stats.defense = Math.round((4.5 + lvl * 1.85) * scale);
    stats.hp = Math.round((14 + lvl * 5.2) * scale * (slot === 'chest' ? 1.35 : slot === 'offhand' ? 1.2 : 1));
  } else {
    stats.attack = Math.round((3 + lvl * 1.05) * scale);
    stats.crit = +((0.012 + lvl * 0.00016) * rm).toFixed(4);
    stats.critDmg = +((0.02 + lvl * 0.0004) * rm).toFixed(3);
  }

  const extraCount = rarity === 'grey' ? 0 : rarity === 'common' ? 1 : rarity === 'green' ? 2 : rarity === 'blue' ? 2 : rarity === 'purple' ? 3 : rarity === 'legendary' ? 3 : rarity === 'mythic' ? 4 : 4;
  const pool = [
    () => (stats.attack = (stats.attack ?? 0) + Math.round((2 + lvl * 0.6) * scale * 0.6)),
    () => (stats.defense = (stats.defense ?? 0) + Math.round((2 + lvl * 0.55) * scale * 0.55)),
    () => (stats.hp = (stats.hp ?? 0) + Math.round((7 + lvl * 2.2) * scale * 0.6)),
    () => (stats.crit = +((stats.crit ?? 0) + (0.006 + lvl * 0.00008) * (0.8 + rng())).toFixed(4)),
    () => (stats.critDmg = +((stats.critDmg ?? 0) + (0.015 + lvl * 0.0003) * (0.7 + rng())).toFixed(3)),
    () => (stats.lifesteal = +((stats.lifesteal ?? 0) + 0.003 + rng() * 0.008).toFixed(4)),
    () => (stats.goldFind = +((stats.goldFind ?? 0) + 0.01 + rng() * 0.03).toFixed(3)),
    () => (stats.gatherSpeed = +((stats.gatherSpeed ?? 0) + 0.01 + rng() * 0.03).toFixed(3)),
    () => (stats.hpRegen = Math.round((stats.hpRegen ?? 0) + (1 + lvl * 0.18) * scale * 0.3)),
  ];
  const used = new Set();
  for (let i = 0; i < extraCount; i++) {
    let idx = Math.floor(rng() * pool.length);
    let guard = 0;
    while (used.has(idx) && guard++ < 12) idx = Math.floor(rng() * pool.length);
    used.add(idx);
    pool[idx]();
  }
  for (const k of Object.keys(stats)) {
    if (k === 'crit' || k === 'critDmg' || k === 'lifesteal' || k === 'goldFind' || k === 'gatherSpeed') {
      stats[k] = +stats[k].toFixed(4);
    } else stats[k] = Math.round(stats[k]);
  }
  const item = {
    uid: `eq_${slot}_${classId}_${rarity}_${tier}_${lvl}_${Math.floor(rng() * 1e6)}`,
    key: itemKey(slot, classId, rarity, tier, lvl),
    kind: 'equip', slot, class: classId, rarity, tier, level: lvl, reqLevel: lvl, stats,
    value: Math.round(RARITY[rarity].sell * (1 + lvl * 0.25) * (1 + TIER_MULT[tier])),
    tradeable: true, fusable: true,
  };
  return item;
}

// Recreate an item from a persisted key (used for merchants / rewards)
export function itemFromKey(key, uidOverride) {
  const [slot, classId, rarity, tier, lv] = key.split('|');
  const it = makeEquip({ classId, slot, rarity, tier, level: Number(lv) });
  if (uidOverride) it.uid = uidOverride;
  return it;
}

export function starterGear(classId) {
  return SLOTS.map((s) => makeEquip({ classId, slot: s.id, rarity: 'common', tier: 'T3', level: 1 }));
}

const MATERIAL_DEFS = {
  herb: { name: L('Aetherkraut', 'Aetherweed'), icon: 'herb', zone: 'greendale', value: 6 },
  ore: { name: L('Eisenerz', 'Iron Ore'), icon: 'ore', zone: 'ironcrag', value: 8 },
  fungus: { name: L('Leuchtpilz', 'Glowcap'), icon: 'fungus', zone: 'venomwood', value: 11 },
  bone: { name: L('Knochenstaub', 'Bone Dust'), icon: 'bone', zone: 'mistgrave', value: 14 },
  ice: { name: L('Frostessenz', 'Frost Essence'), icon: 'ice', zone: 'frostpeak', value: 18 },
  sunstone: { name: L('Sonnenstein', 'Sunstone'), icon: 'sunstone', zone: 'sunscorch', value: 22 },
  ember: { name: L('Ascheglut', 'Ashen Ember'), icon: 'ember', zone: 'ashen', value: 28 },
  star: { name: L('Sternsplitter', 'Star Fragment'), icon: 'star', zone: 'tower', value: 36 },
  crystal: { name: L('Splitterkristall', 'Shard Crystal'), icon: 'crystal', zone: 'all', value: 16 },
};
export const MATERIALS = {};
for (const [id, d] of Object.entries(MATERIAL_DEFS)) {
  MATERIALS[id] = { id, kind: 'material', name: d.name, icon: d.icon, value: d.value, stack: 999, zone: d.zone, tradeable: true };
}

export function makeMaterial(id, qty = 1) {
  const m = MATERIALS[id];
  return { uid: `mat_${id}`, ...m, qty, stack: true, tradeable: true };
}

export const CONSUMABLES = {
  healPotion: { id: 'healPotion', kind: 'consumable', name: L('Heiltrank', 'Healing Potion'), icon: 'potionRed', value: 45, price: 50, stack: 20, descKey: 'consume.healPotionDesc', heal: 0.45 },
  manaPotion: { id: 'manaPotion', kind: 'consumable', name: L('Manatrank', 'Mana Potion'), icon: 'potionBlue', value: 40, price: 45, stack: 20, descKey: 'consume.manaPotionDesc', resource: 0.45 },
  elixir: { id: 'elixir', kind: 'consumable', name: L('Elixier der Erfahrung', 'Elixir of Experience'), icon: 'elixir', value: 120, price: 180, stack: 10, descKey: 'consume.elixirDesc', buff: 'xp' },
  charm: { id: 'charm', kind: 'consumable', name: L('Sammelamulett', 'Gathering Charm'), icon: 'charm', value: 100, price: 160, stack: 10, descKey: 'consume.charmDesc', buff: 'gather' },
  moonbread: { id: 'moonbread', kind: 'consumable', name: L('Mondbrot', 'Moonbread'), icon: 'food', value: 30, price: 35, stack: 20, descKey: 'consume.foodDesc', regen: 0.3 },
};

export function makeConsumable(id, qty = 1) {
  const c = CONSUMABLES[id];
  return { uid: `con_${id}`, ...c, qty, stack: true, tradeable: true, fusable: false };
}

export const WINGS = {
  wing_light: { id: 'wing_light', kind: 'wing', name: L('Lichtschwingen', 'Wings of Light'), desc: L('Schwingen aus reinem Morgenlicht. Rein kosmetisch.', 'Wings of pure morning light. Purely cosmetic.'), price: 420, icon: 'wings', tradeable: false, fusable: false, color: '#d9ecff', source: 'shop' },
  wing_void: { id: 'wing_void', kind: 'wing', name: L('Schattenflügel', 'Void Wings'), desc: L('Flügel aus gefalteter Leere. Rein kosmetisch.', 'Wings of folded void. Purely cosmetic.'), price: 420, icon: 'wings', tradeable: false, fusable: false, color: '#c08cf0', source: 'shop' },
  wing_eternity: { id: 'wing_eternity', kind: 'wing', name: L('Flügel der Ewigkeit', 'Wings of Eternity'), desc: L('Nur die Vollendung von Kapitel 4 verleiht diese Flügel.', 'Granted only by completing Chapter 4.'), price: 0, icon: 'wings', tradeable: false, fusable: false, color: '#f4df9a', source: 'quest' },
};

const STONE_BONUS_POOL = [
  { stat: 'attack', min: 0.02, max: 0.06, pct: true },
  { stat: 'defense', min: 0.02, max: 0.06, pct: true },
  { stat: 'hp', min: 0.03, max: 0.08, pct: true },
  { stat: 'crit', min: 0.015, max: 0.04, pct: true },
  { stat: 'critDmg', min: 0.04, max: 0.12, pct: true },
  { stat: 'lifesteal', min: 0.005, max: 0.015, pct: true },
  { stat: 'goldFind', min: 0.02, max: 0.06, pct: true },
  { stat: 'gatherSpeed', min: 0.02, max: 0.06, pct: true },
];

export function makeBossStone(zoneId, bossName) {
  const rng = rngFrom('stone', zoneId, Date.now(), Math.random());
  const count = 2 + (rng() > 0.35 ? 1 : 0);
  const picked = [];
  const pool = STONE_BONUS_POOL.slice();
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    const b = pool.splice(idx, 1)[0];
    const value = b.min + rng() * (b.max - b.min);
    picked.push({ stat: b.stat, value: +value.toFixed(4), pct: b.pct });
  }
  return {
    uid: `stone_${zoneId}_${Date.now().toString(36)}_${Math.floor(rng() * 1e6)}`,
    kind: 'stone', name: bossName, zone: zoneId, bonuses: picked, tradeable: false, fusable: false, rarity: 'legendary',
  };
}

export function rerollStone(stone) {
  const fresh = makeBossStone(stone.zone, stone.name);
  return { ...stone, bonuses: fresh.bonuses };
}

export function fusionResult(item) {
  if (!item || item.kind !== 'equip' || !item.fusable) return null;
  const ri = RARITY_ORDER.indexOf(item.rarity);
  if (ri < 0) return null;
  if (TiER_INVALID(item)) return null;
  if (item.tier === 'T3') return { rarity: item.rarity, tier: 'T2', level: item.level, classId: item.class, slot: item.slot };
  if (item.tier === 'T2') return { rarity: item.rarity, tier: 'T1', level: item.level, classId: item.class, slot: item.slot };
  if (item.tier === 'T1') {
    if (item.rarity === 'divine') return null;
    return { rarity: RARITY_ORDER[ri + 1], tier: 'T3', level: item.level, classId: item.class, slot: item.slot };
  }
  return null;
}

function TiER_INVALID(item) { return !TIER_ORDER.includes(item.tier); }

export function makeFusionResult(item) {
  const r = fusionResult(item);
  if (!r) return null;
  return makeEquip({ classId: r.classId, slot: r.slot, rarity: r.rarity, tier: r.tier, level: r.level });
}

export function aggregateStats(equipment, stone, classId, level) {
  const totals = { attack: 0, defense: 0, hp: 0, crit: 0, critDmg: 0, speed: 0, lifesteal: 0, goldFind: 0, gatherSpeed: 0, hpRegen: 0, resourceRegen: 0 };
  for (const it of Object.values(equipment)) {
    if (!it?.stats) continue;
    for (const [k, v] of Object.entries(it.stats)) totals[k] = (totals[k] ?? 0) + v;
  }
  if (stone?.bonuses) {
    for (const b of stone.bonuses) {
      if (!(b.stat in totals)) totals[b.stat] = 0;
      totals[b.stat] += b.value;
    }
  }
  return totals;
}

export function itemStatLines(item) {
  if (!item?.stats) return [];
  return Object.entries(item.stats).map(([k, v]) => ({
    stat: k,
    labelKey: STAT_LABEL[k],
    value: v,
    isPct: ['crit', 'critDmg', 'lifesteal', 'goldFind', 'gatherSpeed', 'speed'].includes(k),
  }));
}

export function equipScore(item) {
  if (!item?.stats) return 0;
  const s = item.stats;
  return Math.round((s.attack ?? 0) * 2 + (s.defense ?? 0) * 1.6 + (s.hp ?? 0) * 0.22 + (s.crit ?? 0) * 900 + (s.critDmg ?? 0) * 260 + (s.lifesteal ?? 0) * 700);
}

export function rarityLabelKey(r) { return `rarity.${r}`; }
export function tierLabelKey(tr) { return `tier.${tr}`; }
export function clampCrit(c) { return clamp(c, 0, 0.5); }
