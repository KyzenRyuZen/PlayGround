import {
  SLOTS, SLOT_KEYS, RARITIES, RARITY_BY_ID, TEMPLATES, TEMPLATE_BY_ID,
  BASE_PROFILES, AFFIX_POOL, AFFIX_BY_STAT, SUFFIX_BY_STAT, PREFIXES, THEMES, THEME_KEYS,
  weaponTemplatesForClass,
} from '../data/items.js';
import { itemUpgradeScale } from './stats.js';
import { STONE_TYPES, STONE_GRADES, STONE_GRADE_BY_ID, STONE_AFFIXES } from '../data/collections.js';
import { rand, randInt, pick, weighted, chance, uid } from './rng.js';

const SLOT_WEIGHTS = { weapon: 20, armor: 17, helmet: 12, shield: 9, bracelet: 9, earring: 8, necklace: 8, shoes: 9, belt: 8 };
const PERCENT_STATS = new Set(['critChance', 'critDamage', 'penPercent', 'attackSpeed', 'monsterDamage', 'bossDamage', 'skillDamage', 'resistFire', 'resistIce', 'resistPoison', 'resistShadow', 'lifesteal', 'goldFind', 'lootFind', 'damageReduction', 'allResist']);

export function rarityWeights(source = 'normal', lootFind = 0) {
  const base = {
    normal: [620, 248, 94, 30, 7, 1],
    elite: [260, 355, 248, 105, 28, 4],
    miniboss: [120, 300, 320, 200, 52, 8],
    boss: [0, 150, 320, 340, 152, 38],
    dungeon: [0, 80, 280, 380, 200, 60],
    stone: [40, 320, 360, 220, 50, 10],
  }[source] || [620, 248, 94, 30, 7, 1];
  return RARITIES.map((r, i) => ({ ...r, weight: base[i] * (i === 0 ? 1 : 1 + lootFind * 0.004 * i) }));
}

export function rollRarity(source, lootFind = 0, r = Math.random) {
  return weighted(rarityWeights(source, lootFind), 'weight', r).id;
}

function roundStat(stat, value) {
  if (PERCENT_STATS.has(stat)) return Math.round(value * 10) / 10;
  return Math.round(value);
}

function chooseTemplate(slot, classId) {
  if (slot === 'weapon') {
    const pool = weaponTemplatesForClass(classId);
    return pool[Math.floor(Math.random() * pool.length)] || TEMPLATES[0];
  }
  const pool = TEMPLATES.filter(t => t.slot === slot);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function itemTheme(item) {
  return THEMES[item.theme] || THEMES.steel;
}

export function generateItem(opts = {}) {
  const {
    ilvl = 1, rarity = 'common', classId = 'warrior', slot = null,
    source = 'normal', lootFind = 0, templateId = null, theme = null,
  } = opts;
  const template = templateId ? TEMPLATE_BY_ID[templateId] : chooseTemplate(slot || weighted(Object.entries(SLOT_WEIGHTS).map(([id, weight]) => ({ id, weight }))).id, classId);
  const rar = RARITY_BY_ID[rarity] || RARITY_BY_ID.common;
  const lvl = Math.max(1, Math.min(140, Math.round(ilvl)));
  const profile = BASE_PROFILES[template.slot](template);
  const base = {};
  for (const [stat, [flat, perLevel]] of Object.entries(profile)) {
    let value = (flat + perLevel * lvl) * rar.mult * (template.mult || 1);
    value = roundStat(stat, value);
    if (value > 0) base[stat] = value;
  }

  const affixScale = 1 + rar.index * 0.17;
  const affixes = [];
  const available = AFFIX_POOL.filter(a => !affixes.some(x => x.stat === a.stat));
  for (let i = 0; i < rar.affixes; i++) {
    const pool = available.filter(a => !affixes.some(x => x.stat === a.stat));
    if (!pool.length) break;
    const def = weighted(pool);
    let value = (def.base + def.perLevel * lvl) * affixScale * rand(0.78, 1.24);
    if (def.cap != null) value = Math.min(def.cap, value);
    value = Math.max(def.decimals === 0 ? 1 : 0.1, roundStat(def.stat, value));
    affixes.push({ stat: def.stat, value, forged: 0, id: def.id });
  }

  const prefixPool = PREFIXES[rar] || PREFIXES.common;
  const prefix = prefixPool[Math.floor(Math.random() * prefixPool.length)];
  let name = `${prefix} ${template.name}`;
  if (affixes.length && (rar.index >= 2 || chance(0.35))) {
    const suffix = SUFFIX_BY_STAT[affixes[0].stat];
    if (suffix) name += ` ${suffix}`;
  }

  const chosenTheme = theme || template.theme || THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)];
  return {
    id: uid('itm'),
    templateId: template.id,
    slot: template.slot,
    classReq: template.classReq || null,
    type: template.type,
    name,
    rarity: rar.id,
    ilvl: lvl,
    upgrade: 0,
    base,
    affixes,
    theme: chosenTheme,
    source,
    createdAt: Date.now(),
    locked: false,
  };
}

export function makeAffix(def, ilvl, rarityId = 'common', r = Math.random) {
  const rar = RARITY_BY_ID[rarityId] || RARITY_BY_ID.common;
  const affixScale = 1 + rar.index * 0.17;
  let value = (def.base + def.perLevel * ilvl) * affixScale * (0.78 + r() * 0.46);
  if (def.cap != null) value = Math.min(def.cap, value);
  value = Math.max(def.decimals === 0 ? 1 : 0.1, roundStat(def.stat, value));
  return { stat: def.stat, value, forged: 0, id: def.id };
}

export function rollAffixes(ilvl, rarityId, count, r = Math.random, excludeStats = []) {
  const out = [];
  const exclude = new Set(excludeStats);
  for (let i = 0; i < count; i++) {
    const pool = AFFIX_POOL.filter(a => !exclude.has(a.stat) && !out.some(x => x.stat === a.stat));
    if (!pool.length) break;
    const def = weighted(pool, 'weight', r);
    out.push(makeAffix(def, ilvl, rarityId, r));
    exclude.add(def.stat);
  }
  return out;
}

export function itemTotalStats(item) {
  const out = {};
  if (!item) return out;
  const scale = itemUpgradeScale(item);
  for (const [stat, value] of Object.entries(item.base || {})) {
    out[stat] = (out[stat] || 0) + value * scale;
  }
  for (const affix of item.affixes || []) {
    out[affix.stat] = (out[affix.stat] || 0) + affix.value;
  }
  return out;
}

const SCORE_WEIGHTS = {
  attack: 2.8, defense: 1.9, hp: 0.16, mp: 0.4,
  critChance: 8, critDamage: 1.6, penetration: 1.8, penPercent: 4,
  attackSpeed: 6, monsterDamage: 4, bossDamage: 5.5, skillDamage: 4,
  resistFire: 1.8, resistIce: 1.8, resistPoison: 1.8, resistShadow: 1.8,
  lifesteal: 7, hpRegen: 1.7, goldFind: 1.2, lootFind: 1.5, damageReduction: 6,
};

export function itemScore(item) {
  if (!item) return 0;
  const stats = itemTotalStats(item);
  let score = 0;
  for (const [stat, value] of Object.entries(stats)) score += (SCORE_WEIGHTS[stat] || 0) * value;
  return Math.round(score);
}

export function itemSellPrice(item) {
  const rar = RARITY_BY_ID[item.rarity] || RARITY_BY_ID.common;
  return Math.max(1, Math.round((12 + item.ilvl * 5.2) * rar.sell * (1 + (item.upgrade || 0) * 0.3)));
}

export function canEquipToClass(item, classId) {
  return !item.classReq || item.classReq === classId;
}

export function findItem(state, itemId) {
  if (!itemId) return null;
  for (const slot of SLOT_KEYS) {
    const item = state.hero.equipment?.[slot];
    if (item?.id === itemId) return { item, equipped: true, slot };
  }
  const item = state.hero.inventory.find(i => i.id === itemId);
  return item ? { item, equipped: false, slot: item.slot } : null;
}

export function equippedItem(state, slot) {
  return state.hero.equipment?.[slot] || null;
}

export function itemStatLines(item, state) {
  const stats = itemTotalStats(item);
  const lines = [];
  const cls = state.hero.classId;
  for (const [stat, value] of Object.entries(stats)) {
    lines.push({ stat, value });
  }
  return lines;
}

export function generateStone(opts = {}) {
  const { source = 'normal', gradeBoost = 0, level = 1, typeId = null } = opts;
  const type = typeId ? STONE_TYPES[typeId] : STONE_TYPES[pick(Object.keys(STONE_TYPES))];
  const gradePool = STONE_GRADES.map(g => ({ ...g, weight: g.weight * (source === 'boss' ? 1 + g.mult * 0.25 : 1) }));
  let gradeIndex = STONE_GRADES.findIndex(g => g.id === weighted(gradePool).id);
  gradeIndex = Math.min(STONE_GRADES.length - 1, gradeIndex + gradeBoost);
  const grade = STONE_GRADES[gradeIndex];
  const lvl = Math.max(1, Math.min(grade.maxLevel, level));
  const affixDef = weighted(STONE_AFFIXES);
  let value = (affixDef.base + affixDef.perLevel * lvl) * grade.mult * rand(0.75, 1.25);
  value = roundStat(affixDef.stat, value);
  return {
    id: uid('stn'),
    type: type.id,
    grade: grade.id,
    level: lvl,
    affix: { stat: affixDef.stat, value },
    source,
    createdAt: Date.now(),
  };
}

export function stoneMainValue(stone) {
  const type = STONE_TYPES[stone.type];
  const grade = STONE_GRADE_BY_ID[stone.grade] || STONE_GRADE_BY_ID.chipped;
  if (!type) return 0;
  return (type.base + type.perLevel * Math.max(0, stone.level - 1)) * grade.mult;
}

export function stonePower(stone) {
  const main = stoneMainValue(stone) * (SCORE_WEIGHTS[STONE_TYPES[stone.type]?.stat] || 3);
  const aff = (stone.affix?.value || 0) * (SCORE_WEIGHTS[stone.affix?.stat] || 3);
  return Math.round(main + aff);
}

export function stoneLabel(stone) {
  const type = STONE_TYPES[stone.type];
  const grade = STONE_GRADE_BY_ID[stone.grade];
  return `${grade?.name || ''} ${type?.name || 'Stone'}`.trim();
}
