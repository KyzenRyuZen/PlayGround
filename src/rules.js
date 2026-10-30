/* ---------------------------------------------------------------
   Pure game rules: stats, loot, merging, saves.
   No DOM access — used by the browser and by tools/balance.mjs.
   --------------------------------------------------------------- */
import {
  CLASSES, RARITIES, RARITY_BY_ID, RARITY_INDEX, SLOTS, SLOT_BY_ID,
  SET_BONUSES, MAX_LEVEL, VERSION, SAVE_KEY, STAGES, STAGE_BY_ID,
  ENEMIES, BOSSES, SHOP,
} from './data.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
export const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));
export const round1 = n => Math.round(n * 10) / 10;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function pickWeighted(rng, entries) {
  let total = 0;
  for (const e of entries) total += Math.max(0, e[1]);
  let roll = rng() * total;
  for (const e of entries) {
    roll -= Math.max(0, e[1]);
    if (roll <= 0) return e[0];
  }
  return entries[entries.length - 1][0];
}

export function formatNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(n));
}

/* ---------------------------------------------------------------
   Items & stats
   --------------------------------------------------------------- */
export function itemStats(slotId, rarityId) {
  const slot = SLOT_BY_ID[slotId];
  const rarity = RARITY_BY_ID[rarityId];
  if (!slot || !rarity) return {};
  const out = {};
  for (const [k, v] of Object.entries(slot.stats)) {
    if (k === 'def') out[k] = Math.round(v * Math.pow(rarity.mult, 0.72));
    else if (k === 'crit' || k === 'cdmg') out[k] = round1(v * rarity.pct);
    else out[k] = Math.round(v * rarity.mult);
  }
  return out;
}

export function itemDef(slotId, rarityId) {
  const slot = SLOT_BY_ID[slotId];
  const rarity = RARITY_BY_ID[rarityId];
  if (!slot || !rarity) return null;
  const idx = RARITY_INDEX[rarityId];
  return {
    slot: slotId, rarity: rarityId,
    name: slot.names[idx],
    slotName: slot.name,
    rarityName: rarity.name,
    color: rarity.color,
    stats: itemStats(slotId, rarityId),
    value: Math.round(rarity.value * (1 + idx * 0.15)),
  };
}

export function statSummary(stats) {
  const parts = [];
  if (stats.atk) parts.push(`+${stats.atk} ATK`);
  if (stats.hp) parts.push(`+${stats.hp} HP`);
  if (stats.def) parts.push(`+${stats.def} DEF`);
  if (stats.crit) parts.push(`+${stats.crit}% CRIT`);
  if (stats.cdmg) parts.push(`+${stats.cdmg}% CRIT DMG`);
  if (stats.spd) parts.push(`+${stats.spd} SPD`);
  return parts.join('  ·  ');
}

export function computeStats(character) {
  const cls = CLASSES[character.classId] || CLASSES.warrior;
  const level = clamp(character.level || 1, 1, MAX_LEVEL);
  const lf = 1 + 0.09 * (level - 1);
  let hp = cls.base.hp * lf;
  let atk = cls.base.atk * lf;
  let def = cls.base.def * lf;
  let spd = cls.base.spd;
  let crit = cls.base.crit;
  let cdmg = cls.base.cdmg;

  const equipped = character.equipped || {};
  const inv = character.inventory || {};
  const rarityCounts = {};

  for (const slot of SLOTS) {
    const r = equipped[slot.id];
    if (!r) continue;
    const count = inv[slot.id]?.[r] || 0;
    if (count <= 0) continue;
    const st = itemStats(slot.id, r);
    hp += st.hp || 0;
    atk += st.atk || 0;
    def += st.def || 0;
    spd += st.spd || 0;
    crit += st.crit || 0;
    cdmg += st.cdmg || 0;
    rarityCounts[r] = (rarityCounts[r] || 0) + 1;
  }

  // Best matching-rarity set bonus.
  let setCount = 0, setRarity = null, setMult = 0;
  for (const r of RARITIES) {
    const c = rarityCounts[r.id] || 0;
    if (c > setCount) { setCount = c; setRarity = r.id; }
  }
  for (const b of SET_BONUSES) if (setCount >= b.count) setMult = b.mult;

  hp *= 1 + setMult;
  atk *= 1 + setMult;
  def *= 1 + setMult;

  if (character.blessing) {
    hp *= 1.12;
    atk *= 1.08;
  }
  const clsMod = CLASSES[character.classId]?.mods;
  if (clsMod) {
    hp *= clsMod.hp || 1; atk *= clsMod.atk || 1; def *= clsMod.def || 1;
  }

  crit = clamp(crit, 0, 75);
  cdmg = Math.max(100, cdmg);

  const total = {
    hp: Math.round(hp), atk: Math.round(atk), def: Math.round(def),
    spd: Math.round(spd), crit: round1(crit), cdmg: Math.round(cdmg),
    setCount, setRarity, setMult,
  };
  total.power = powerOf(total);
  return total;
}

export function powerOf(s) {
  return Math.round(
    s.hp * 0.2 + s.atk * 6 + s.def * 2 + s.crit * 8 +
    Math.max(0, s.cdmg - 100) * 1.5 + s.spd * 0.5
  );
}

export function mitigation(def) {
  return clamp(def / (def + 300), 0, 0.72);
}

export function xpToNext(level) {
  return Math.round(55 * Math.pow(level, 1.42));
}

/* ---------------------------------------------------------------
   Loot
   --------------------------------------------------------------- */
export function rarityWeights(tier, boost = 1) {
  const t = Math.max(1, tier);
  return [
    ['common', Math.max(3, 70 - 4.5 * t)],
    ['rare', (22 + 1.2 * t) * boost],
    ['epic', (4 + 1.7 * t) * boost],
    ['legendary', (0.6 + 0.85 * t) * boost],
    ['mythic', (0.04 + 0.24 * t) * boost],
    ['divine', (0.003 + 0.032 * t) * boost],
  ];
}

export function rollRarity(tier, rng = Math.random, boost = 1) {
  return pickWeighted(rng, rarityWeights(tier, boost));
}

export function rollSlot(stage, rng = Math.random) {
  const pool = stage.lootSlots && stage.lootSlots.length ? stage.lootSlots : SLOTS.map(s => s.id);
  if (rng() < 0.82) return pool[Math.floor(rng() * pool.length)];
  return SLOTS[Math.floor(rng() * SLOTS.length)].id;
}

export function rollItem(stage, rng = Math.random, opts = {}) {
  const tier = stage.rift ? 12 + stage.depth : stage.id;
  const rarity = opts.rarity || rollRarity(tier, rng, opts.boost || 1);
  const slot = opts.slot || rollSlot(stage, rng);
  return { slot, rarity };
}

export function rollLoot(stage, count, rng = Math.random, opts = {}) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(rollItem(stage, rng, opts));
  return out;
}

export function addLoot(inventory, items) {
  for (const it of items) {
    if (!inventory[it.slot]) inventory[it.slot] = {};
    inventory[it.slot][it.rarity] = (inventory[it.slot][it.rarity] || 0) + 1;
  }
  return inventory;
}

export function countItem(inventory, slot, rarity) {
  return inventory?.[slot]?.[rarity] || 0;
}

export function totalItems(inventory) {
  let n = 0;
  for (const slot of Object.values(inventory || {})) for (const c of Object.values(slot)) n += c;
  return n;
}

export function bestRarity(inventory, slot) {
  const inv = inventory?.[slot] || {};
  for (let i = RARITIES.length - 1; i >= 0; i--) if ((inv[RARITIES[i].id] || 0) > 0) return RARITIES[i].id;
  return null;
}

export function equipBest(character) {
  const changed = [];
  for (const slot of SLOTS) {
    const best = bestRarity(character.inventory, slot.id);
    if (best && character.equipped[slot.id] !== best) {
      character.equipped[slot.id] = best;
      changed.push(slot.id);
    }
  }
  return changed;
}

export function mergeOne(character, slot, rarity) {
  const idx = RARITY_INDEX[rarity];
  if (idx === undefined || idx >= RARITIES.length - 1) return null;
  const inv = character.inventory[slot];
  if (!inv || (inv[rarity] || 0) < 4) return null;
  inv[rarity] -= 4;
  if (inv[rarity] <= 0) delete inv[rarity];
  const next = RARITIES[idx + 1].id;
  if (!inv[next]) inv[next] = 0;
  inv[next] += 1;
  if (character.equipped[slot] === rarity) character.equipped[slot] = next;
  return itemDef(slot, next);
}

export function salvageValue(item) {
  const r = RARITY_BY_ID[item.rarity];
  return Math.max(1, Math.round((r?.value || 1) * 0.4));
}

/* ---------------------------------------------------------------
   Stages & scaling
   --------------------------------------------------------------- */
export function stageScaling(stage) {
  if (!stage) return { hp: 1, atk: 1, def: 1 };
  if (stage.rift) {
    const d = Math.max(1, stage.depth);
    return {
      hp: Math.pow(1.23, 11) * Math.pow(1.13, d),
      atk: Math.pow(1.155, 11) * Math.pow(1.12, d),
      def: Math.pow(1.12, 11) * Math.pow(1.10, d),
      xp: Math.pow(1.16, 11) * Math.pow(1.09, d),
      gold: Math.pow(1.13, 11) * Math.pow(1.08, d),
    };
  }
  const s = stage.id - 1;
  return {
    hp: Math.pow(1.23, s),
    atk: Math.pow(1.155, s),
    def: Math.pow(1.12, s),
    xp: Math.pow(1.16, s),
    gold: Math.pow(1.13, s),
  };
}

export function enemyStats(typeId, stage, elite = false) {
  const base = ENEMIES[typeId];
  const sc = stageScaling(stage);
  const bump = elite ? 2.4 : 1;
  return {
    hp: Math.round(base.hp * sc.hp * bump),
    atk: Math.round(base.atk * sc.atk * (elite ? 1.3 : 1)),
    def: Math.round(base.def * sc.def * (elite ? 1.2 : 1)),
    spd: base.spd,
    xp: Math.round(base.xp * sc.xp * (elite ? 2.8 : 1)),
    goldMin: Math.round(base.gold[0] * sc.gold * (elite ? 2.5 : 1)),
    goldMax: Math.round(base.gold[1] * sc.gold * (elite ? 2.5 : 1)),
  };
}

export function bossStats(bossId, stage) {
  const b = BOSSES[bossId];
  const sc = stageScaling(stage);
  return {
    hp: Math.round(36 * b.hpMult * sc.hp),
    atk: Math.round(14 * b.atkMult * sc.atk),
    def: Math.round(10 * b.defMult * sc.def),
    spd: 58,
    xp: Math.round(180 * sc.xp),
    goldMin: Math.round(120 * sc.gold),
    goldMax: Math.round(200 * sc.gold),
  };
}

export function stageTier(stage) {
  return stage.rift ? 12 + stage.depth : stage.id;
}

export function shopPrice(entry, stage) {
  const t = stage ? stageTier(stage) : 1;
  if (entry.oneShot) return entry.base;
  return Math.round(entry.base + entry.growth * (t - 1));
}

export function getStage(id) {
  if (id >= 1000) return null;
  return STAGE_BY_ID[id] || null;
}

export function highestClearedStage(progress) {
  let max = 0;
  for (const k of Object.keys(progress?.cleared || {})) max = Math.max(max, Number(k));
  return max;
}

export function nextStageId(progress) {
  const high = highestClearedStage(progress);
  return Math.min(STAGES.length, high + 1);
}

/* ---------------------------------------------------------------
   Character / save
   --------------------------------------------------------------- */
export function newSave(classId, name) {
  const cls = CLASSES[classId] ? classId : 'warrior';
  return {
    version: VERSION,
    character: {
      name: (name || CLASSES[cls].name).slice(0, 16),
      classId: cls,
      level: 1,
      xp: 0,
      blessing: false,
      inventory: { weapon: { common: 1 }, armor: { common: 1 }, boots: { common: 1 } },
      equipped: { weapon: 'common', armor: 'common', boots: 'common' },
    },
    gold: 120,
    progress: { cleared: {}, riftBest: 0, currentStage: 1 },
    stats: { kills: 0, bosses: 0, merges: 0, deaths: 0, runs: 0, playtime: 0, bestRarity: 'common' },
    settings: { sound: true, volume: 0.65, shake: true, damageNumbers: true, tilt: false, reducedMotion: false },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function sanitizeSave(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const cls = CLASSES[raw.character?.classId] ? raw.character.classId : null;
  if (!cls) return null;
  const base = newSave(cls, raw.character?.name || CLASSES[cls].name);
  const save = {
    ...base,
    ...raw,
    character: { ...base.character, ...(raw.character || {}) },
    progress: { ...base.progress, ...(raw.progress || {}) },
    stats: { ...base.stats, ...(raw.stats || {}) },
    settings: { ...base.settings, ...(raw.settings || {}) },
  };
  save.version = VERSION;
  save.character.classId = cls;
  save.character.name = String(save.character.name || CLASSES[cls].name).slice(0, 16);
  save.character.level = clamp(Math.round(save.character.level || 1), 1, MAX_LEVEL);
  save.character.xp = Math.max(0, Math.round(save.character.xp || 0));
  save.gold = Math.max(0, Math.round(save.gold || 0));
  save.character.blessing = !!save.character.blessing;
  if (!save.character.inventory) save.character.inventory = base.character.inventory;
  if (!save.character.equipped) save.character.equipped = base.character.equipped;
  for (const slot of SLOTS) {
    if (!save.character.inventory[slot.id]) save.character.inventory[slot.id] = {};
    const row = save.character.inventory[slot.id];
    for (const r of RARITIES) {
      if (row[r.id]) row[r.id] = Math.max(0, Math.floor(row[r.id]));
      if (row[r.id] === 0) delete row[r.id];
    }
    const e = save.character.equipped[slot.id];
    if (e && !(row[e] > 0)) delete save.character.equipped[slot.id];
    if (!e) delete save.character.equipped[slot.id];
  }
  save.progress.cleared = save.progress.cleared && typeof save.progress.cleared === 'object' ? save.progress.cleared : {};
  save.progress.riftBest = Math.max(0, Math.round(save.progress.riftBest || 0));
  return save;
}

export function loadSave(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    return sanitizeSave(JSON.parse(raw));
  } catch { return null; }
}

export function writeSave(storage, save) {
  try {
    save.updatedAt = Date.now();
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch { return false; }
}

export function grantXp(character, amount) {
  if (!character || amount <= 0) return { levels: 0, remaining: 0 };
  if (character.level >= MAX_LEVEL) return { levels: 0, remaining: 0, maxed: true };
  character.xp += Math.round(amount);
  let levels = 0;
  while (character.level < MAX_LEVEL && character.xp >= xpToNext(character.level)) {
    character.xp -= xpToNext(character.level);
    character.level += 1;
    levels += 1;
  }
  let overflow = 0;
  if (character.level >= MAX_LEVEL) {
    overflow = character.xp;
    character.xp = 0;
  }
  return { levels, remaining: character.xp, overflow };
}

export function starsFor(stage, run) {
  if (!run?.win) return 0;
  let stars = 1;
  if ((run.revives || 0) === 0) stars++;
  if ((run.time || 0) <= (stage.par || 999)) stars++;
  return stars;
}

export function extractItem(save, item) {
  const inv = save.character.inventory[item.slot] || {};
  return inv[item.rarity] || 0;
}

export { CLASSES, RARITIES, RARITY_BY_ID, RARITY_INDEX, SLOTS, SLOT_BY_ID, SET_BONUSES, STAGES, ENEMIES, BOSSES, SHOP, STAGE_BY_ID };
