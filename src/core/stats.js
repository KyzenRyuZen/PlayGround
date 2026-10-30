import { CLASSES } from '../data/classes.js';
import { PETS, MOUNTS, COMPANIONS, COSTUMES, STONE_TYPES, STONE_GRADE_BY_ID } from '../data/collections.js';
import { SLOT_KEYS, AFFIX_BY_STAT, MATERIAL_KEYS } from '../data/items.js';
import { GAME, STAT_INFO } from '../config.js';

const STAT_KEYS = [
  'attack', 'defense', 'hp', 'mp', 'critChance', 'critDamage', 'penetration', 'penPercent',
  'attackSpeed', 'monsterDamage', 'bossDamage', 'skillDamage', 'resistFire', 'resistIce',
  'resistPoison', 'resistShadow', 'lifesteal', 'hpRegen', 'goldFind', 'lootFind', 'damageReduction',
];

function blankBonuses() {
  return Object.fromEntries(STAT_KEYS.map(k => [k, 0]));
}

export function itemUpgradeScale(item) {
  return 1 + (item.upgrade || 0) * 0.07;
}

export function sumItemBonuses(item, out = blankBonuses()) {
  if (!item) return out;
  const scale = itemUpgradeScale(item);
  for (const [stat, value] of Object.entries(item.base || {})) {
    if (stat === 'allResist') continue;
    if (out[stat] != null) out[stat] += value * scale;
  }
  for (const affix of item.affixes || []) {
    if (affix.stat === 'allResist') continue;
    if (out[affix.stat] != null) out[affix.stat] += affix.value;
  }
  return out;
}

export function collectionBonuses() {
  return blankBonuses();
}

export function addOwnedBonus(bonuses, data, level = 1) {
  for (const b of data?.bonus || []) {
    const value = (b.base || 0) + (b.perLevel || 0) * Math.max(0, level - 1);
    if (b.stat === 'allResist') {
      bonuses.resistFire += value; bonuses.resistIce += value;
      bonuses.resistPoison += value; bonuses.resistShadow += value;
    } else if (bonuses[b.stat] != null) {
      bonuses[b.stat] += value;
    }
  }
}

export function equippedItems(state) {
  const out = [];
  for (const slot of SLOT_KEYS) {
    const item = state.hero.equipment?.[slot];
    if (item) out.push(item);
  }
  return out;
}

export function activeStoneBonuses(state, bonuses) {
  const { stones } = state.hero;
  if (!stones?.equipped) return;
  for (const stoneId of stones.equipped) {
    if (!stoneId) continue;
    const stone = stones.owned.find(s => s.id === stoneId);
    if (!stone) continue;
    const type = STONE_TYPES[stone.type];
    const grade = STONE_GRADE_BY_ID[stone.grade] || STONE_GRADE_BY_ID.chipped;
    if (!type || !grade) continue;
    const main = (type.base + type.perLevel * Math.max(0, stone.level - 1)) * grade.mult;
    if (type.stat === 'allResist') {
      bonuses.resistFire += main; bonuses.resistIce += main;
      bonuses.resistPoison += main; bonuses.resistShadow += main;
    } else if (bonuses[type.stat] != null) {
      bonuses[type.stat] += main;
    }
    if (stone.affix?.stat) {
      if (stone.affix.stat === 'allResist') {
        bonuses.resistFire += stone.affix.value; bonuses.resistIce += stone.affix.value;
        bonuses.resistPoison += stone.affix.value; bonuses.resistShadow += stone.affix.value;
      } else if (bonuses[stone.affix.stat] != null) {
        bonuses[stone.affix.stat] += stone.affix.value;
      }
    }
  }
}

export function costumeBonuses(state, pctBonuses) {
  const equipped = state.hero.costumes?.equipped || {};
  for (const costumeId of Object.values(equipped)) {
    const costume = COSTUMES[costumeId];
    if (!costume) continue;
    for (const b of costume.bonus || []) {
      if (b.stat === 'attack' || b.stat === 'defense' || b.stat === 'hp') {
        pctBonuses[`${b.stat}Pct`] += b.value;
      } else if (b.stat === 'allResist') {
        pctBonuses.allResist += b.value;
      } else if (pctBonuses[b.stat] != null) {
        pctBonuses[b.stat] += b.value;
      }
    }
  }
}

export function computeStats(state, buffs = []) {
  const hero = state.hero;
  const cls = CLASSES[hero.classId] || CLASSES.warrior;
  const attrs = hero.attributes;
  const level = hero.level;

  const gear = blankBonuses();
  for (const item of equippedItems(state)) sumItemBonuses(item, gear);

  const collect = blankBonuses();
  if (hero.pets?.active) {
    const pet = PETS[hero.pets.active];
    const levelOwned = hero.pets.owned?.[hero.pets.active]?.level || 1;
    addOwnedBonus(collect, pet, levelOwned);
  }
  if (hero.mounts?.active) {
    const mount = MOUNTS[hero.mounts.active];
    const levelOwned = hero.mounts.owned?.[hero.mounts.active]?.level || 1;
    addOwnedBonus(collect, mount, levelOwned);
  }
  if (hero.companions?.active) {
    const comp = COMPANIONS[hero.companions.active];
    const levelOwned = hero.companions.owned?.[hero.companions.active]?.level || 1;
    addOwnedBonus(collect, comp, levelOwned);
  }

  activeStoneBonuses(state, collect);

  const pct = {
    attackPct: 0, defensePct: 0, hpPct: 0, mpPct: 0,
    skillDamage: 0, critChance: 0, attackSpeed: 0,
    ...blankBonuses(), allResist: 0,
  };
  // class passive
  for (const [k, v] of Object.entries(cls.passive.bonuses || {})) {
    if (k === 'hpPct') pct.hpPct += v;
    else if (k === 'mpPct') pct.mpPct += v;
    else if (k === 'defensePct') pct.defensePct += v;
    else if (k === 'mpRegenPct') pct.mpRegenPct = v;
    else if (pct[k] != null) pct[k] += v;
  }
  costumeBonuses(state, pct);

  // temporary battle buffs
  let buffAttackPct = 0, buffCrit = 0, buffDR = 0;
  for (const b of buffs || []) {
    if (!b || (b.until && b.until <= performance.now())) continue;
    if (b.stat === 'attackPct') buffAttackPct += b.value;
    else if (b.stat === 'critChance') buffCrit += b.value;
    else if (b.stat === 'damageReduction') buffDR += b.value;
  }

  const primary = cls.id === 'warrior' ? attrs.strength : cls.id === 'mage' ? attrs.intelligence : attrs.dexterity;
  const rawAttack = 12 + primary * 2.4 + level * 2.6 + gear.attack + collect.attack;
  const rawDefense = 5 + attrs.vitality * 1.1 + level * 1.2 + gear.defense + collect.defense;
  const rawHp = 80 + attrs.vitality * 12 + level * 22 + gear.hp + collect.hp;
  const rawMp = 30 + attrs.intelligence * 5 + level * 4 + gear.mp + collect.mp;

  const attackPct = pct.attackPct + buffAttackPct;
  const attack = Math.max(1, rawAttack * (1 + attackPct / 100));
  const defense = Math.max(0, rawDefense * (1 + pct.defensePct / 100));
  const maxHp = Math.max(1, rawHp * (1 + pct.hpPct / 100));
  const maxMp = Math.max(1, rawMp * (1 + pct.mpPct / 100));

  const critChance = Math.min(GAME.critCap, cls.baseCrit + attrs.dexterity * 0.18 + gear.critChance + collect.critChance + pct.critChance + buffCrit);
  const critDamage = 150 + gear.critDamage + collect.critDamage + pct.critDamage;
  const attackSpeedPct = Math.min(GAME.speedCap, gear.attackSpeed + collect.attackSpeed + pct.attackSpeed);
  const attackRate = cls.baseWeapon.speed * (1 + attrs.dexterity * 0.002 + attackSpeedPct / 100);
  const allResist = collect.allResist + pct.allResist;
  const resist = {
    fire: Math.min(GAME.resistCap, gear.resistFire + collect.resistFire + pct.resistFire + allResist),
    ice: Math.min(GAME.resistCap, gear.resistIce + collect.resistIce + pct.resistIce + allResist),
    poison: Math.min(GAME.resistCap, gear.resistPoison + collect.resistPoison + pct.resistPoison + allResist),
    shadow: Math.min(GAME.resistCap, gear.resistShadow + collect.resistShadow + pct.resistShadow + allResist),
  };

  const holyResist = resist.shadow;
  resist.holy = holyResist;

  const stats = {
    level, className: cls.name,
    strength: attrs.strength, intelligence: attrs.intelligence, dexterity: attrs.dexterity, vitality: attrs.vitality,
    attack, defense, maxHp, maxMp, critChance, critDamage,
    penetration: gear.penetration + collect.penetration,
    penPercent: Math.min(60, gear.penPercent + collect.penPercent),
    attackSpeed: attackSpeedPct, attackRate, attackInterval: 1 / Math.max(0.1, attackRate),
    monsterDamage: gear.monsterDamage + collect.monsterDamage,
    bossDamage: gear.bossDamage + collect.bossDamage,
    skillDamage: gear.skillDamage + collect.skillDamage + pct.skillDamage,
    lifesteal: Math.min(GAME.lifestealCap, gear.lifesteal + collect.lifesteal),
    hpRegen: 1 + level * 0.2 + gear.hpRegen + collect.hpRegen,
    goldFind: gear.goldFind + collect.goldFind,
    lootFind: gear.lootFind + collect.lootFind,
    damageReduction: Math.min(40, gear.damageReduction + collect.damageReduction + pct.damageReduction + buffDR),
    resist,
    allResist,
    mpRegen: 2.2 + attrs.intelligence * 0.075 + (pct.mpRegenPct ? (2.2 + attrs.intelligence * 0.075) * pct.mpRegenPct / 100 : 0),
    primary,
  };
  stats.power = Math.round(
    stats.attack * 2.8 + stats.defense * 1.8 + stats.maxHp * 0.14 +
    stats.critChance * 7 + Math.max(0, stats.critDamage - 150) * 1.5 +
    stats.attackSpeed * 8 + stats.monsterDamage * 4 + stats.bossDamage * 6 +
    stats.penetration * 1.5 + stats.penPercent * 4 + stats.skillDamage * 4 +
    (resist.fire + resist.ice + resist.poison + resist.shadow) * 1.5 +
    stats.lifesteal * 8 + stats.hpRegen * 1.5
  );
  return stats;
}

export function xpToNext(level) {
  const { base, exponent, linear } = GAME.xpCurve;
  return Math.floor(base * Math.pow(level, exponent) + linear * level + 40);
}

export function xpMultiplier(state, now = Date.now()) {
  let mult = 1;
  if (state.hero.boosters?.xpUntil > now) mult += 1;
  if (state.hero.boosters?.membershipUntil > now) mult += 0.15;
  return mult;
}

export function goldMultiplier(state, stats, now = Date.now()) {
  let mult = 1 + (stats?.goldFind || 0) / 100;
  if (state.hero.boosters?.goldUntil > now) mult += 0.5;
  if (state.hero.boosters?.membershipUntil > now) mult += 0.15;
  return mult;
}

export function lootMultiplier(state, now = Date.now()) {
  let mult = 1;
  if (state.hero.boosters?.lootUntil > now) mult += 0.6;
  if (state.hero.boosters?.membershipUntil > now) mult += 0.1;
  return mult;
}

export function statLabel(stat) {
  if (stat === 'allResist') return 'All Resistance';
  return STAT_INFO[stat]?.label || AFFIX_BY_STAT[stat]?.label || stat;
}

export function statSuffix(stat) {
  if (stat === 'allResist') return '%';
  return STAT_INFO[stat]?.kind === 'percent' ? '%' : '';
}

export function baseMaterialState() {
  return Object.fromEntries(MATERIAL_KEYS.map(k => [k, 0]));
}
