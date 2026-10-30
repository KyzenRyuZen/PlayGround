import {
  CLASS, CLASSES, GEAR_NAMES, SLOT, SLOTS, RARITIES, RARITY, RARITY_INDEX,
  BOSS_RELICS, STAGES, RARITY_WEIGHTS, BOSSES
} from './data.js';

const SAVE_KEY = 'aetherfall.save.v1';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export function createHero(classId, name) {
  const cls = CLASS[classId] || CLASS.warrior;
  const starterWeapon = `${cls.id}-weapon`;
  const starterArmor = `${cls.id}-armor`;
  const state = {
    version: 1,
    createdAt: Date.now(),
    name: (name || '').trim().slice(0, 16) || 'The Nameless',
    classId: cls.id,
    level: 1,
    xp: 0,
    gold: 120,
    aether: 0,
    unlockedStage: 0,
    clearedStages: [],
    equipment: {
      weapon: { templateId: starterWeapon, rarity: 'common' },
      armor: { templateId: starterArmor, rarity: 'common' },
      bracelet: null,
      earrings: null,
      helmet: null,
      shield: null,
      boots: null,
      necklace: null,
      ring: null
    },
    inventory: [],
    relics: [],
    discovered: ['warrior-weapon', 'warrior-armor', 'mage-weapon', 'mage-armor', 'archer-weapon', 'archer-armor'],
    stats: { kills: 0, bossKills: 0, drops: 0, merges: 0, runs: 0, deaths: 0, bestStage: 0 },
    settings: { sound: true, haptics: true, tilt: false, motionAsked: false },
    lastLoot: [],
    updatedAt: Date.now()
  };
  // Starter cache: one extra weapon copy so the first duplicate feels tangible.
  addItem(state, { templateId: starterWeapon, rarity: 'common', silent: true });
  return state;
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !CLASS[parsed.classId]) return null;
    parsed.inventory ||= [];
    parsed.clearedStages ||= [];
    parsed.relics ||= [];
    parsed.discovered ||= [];
    parsed.lastLoot ||= [];
    parsed.settings ||= { sound: true, haptics: true, tilt: false, motionAsked: false };
    parsed.stats ||= { kills: 0, bossKills: 0, drops: 0, merges: 0, runs: 0, deaths: 0, bestStage: 0 };
    parsed.equipment ||= {};
    for (const slot of SLOTS) parsed.equipment[slot.id] ||= null;
    parsed.unlockedStage = Math.max(0, Math.min(STAGES.length - 1, Number(parsed.unlockedStage) || 0));
    validateInventory(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function validateInventory(state) {
  state.inventory = state.inventory
    .filter(g => g && typeof g.count === 'number' && g.count > 0 && templateById(g.templateId) && RARITY[g.rarity])
    .map(g => ({ ...g, count: Math.max(1, Math.floor(g.count)) }));
}

export function saveGame(state) {
  try {
    state.updatedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function wipeGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* no-op */ }
}

export function getTemplate(id) {
  return templateById(id);
}

const templateCache = new Map();
function templateById(id) {
  if (!id) return null;
  if (templateCache.has(id)) return templateCache.get(id);
  let t = null;
  const relic = BOSS_RELICS.find(r => r.id === id);
  if (relic) {
    t = { ...relic, unique: true, classId: null };
  } else {
    const m = /^(warrior|mage|archer)-(weapon|armor|bracelet|earrings|helmet|shield|boots|necklace|ring)$/.exec(id);
    if (m && GEAR_NAMES[m[1]]?.[m[2]]) {
      t = {
        id,
        classId: m[1],
        slot: m[2],
        name: GEAR_NAMES[m[1]][m[2]],
        lore: itemLore(m[2], m[1]),
        unique: false
      };
    }
  }
  if (t) templateCache.set(id, t);
  return t;
}

function itemLore(slot, classId) {
  const lore = {
    warrior: {
      weapon: 'Its edge has outlived twelve dynasties.', armor: 'Ashen plate, reforged after every death.',
      bracelet: 'A band of cooled cinders.', earrings: 'Trophies from a war no one won.',
      helmet: 'The visor never opens. It does not need to.', shield: 'A door torn from a burning cathedral.',
      boots: 'They leave scorch marks instead of footprints.', necklace: 'An oath, welded shut.',
      ring: 'Seal of the last warden of the gate.'
    },
    mage: {
      weapon: 'It pulls names out of the night sky.', armor: 'Woven from the space between echoes.',
      bracelet: 'Nine turns, no beginning.', earrings: 'Whispers caught in glass.',
      helmet: 'Wearers hear the future, slightly out of order.', shield: 'A hex rendered in physical form.',
      boots: 'Each step lands somewhere else.', necklace: 'A tear the void cried.',
      ring: 'The ninth sigil was never meant to be worn.'
    },
    archer: {
      weapon: 'Strung with a dead god’s hair.', armor: 'Light, silent, and impossible to stain.',
      bracelet: 'A hunter’s count of perfect shots.', earrings: 'Fangs of the thing that missed.',
      helmet: 'Its wearer has never been seen.', shield: 'Woven briar, harder than iron.',
      boots: 'The wind gets jealous.', necklace: 'Proof of a debt paid in blood.',
      ring: 'Mark of the one who never misses.'
    }
  };
  return lore[classId]?.[slot] || 'A relic of the shattered age.';
}

export function itemStats(templateId, rarityId) {
  const t = templateById(templateId);
  const r = RARITY[rarityId];
  if (!t || !r || !SLOT[t.slot]) return {};
  const base = SLOT[t.slot].base;
  const out = {};
  for (const [stat, value] of Object.entries(base)) {
    if (stat === 'crit') out[stat] = round1(value * (1 + (r.mult - 1) * .55));
    else if (stat === 'speed') out[stat] = Math.round(value * (1 + (r.mult - 1) * .42));
    else out[stat] = Math.max(1, Math.round(value * r.mult));
  }
  return out;
}

export function itemScore(templateId, rarityId) {
  const s = itemStats(templateId, rarityId);
  return Math.round((s.atk || 0) * 4.2 + (s.hp || 0) * .55 + (s.def || 0) * 2.8 + (s.crit || 0) * 8 + (s.speed || 0) * .8);
}

export function gearScore(state) {
  let total = 0;
  for (const slot of SLOTS) {
    const entry = state.equipment[slot.id];
    if (entry) total += itemScore(entry.templateId, entry.rarity);
  }
  return total;
}

export function deriveStats(state) {
  const cls = CLASS[state.classId] || CLASS.warrior;
  const level = Math.max(1, state.level);
  const s = {
    hp: cls.base.hp + (level - 1) * 16,
    atk: cls.base.atk + (level - 1) * 1.9,
    def: cls.base.def + (level - 1) * 1.25,
    speed: cls.base.speed + (level - 1) * .45,
    crit: cls.base.crit,
    rate: cls.base.rate,
    skillPower: cls.base.skillPower,
    lifesteal: cls.base.lifesteal,
    range: cls.base.range
  };
  let equipped = 0;
  for (const slot of SLOTS) {
    const entry = state.equipment[slot.id];
    if (!entry) continue;
    equipped++;
    const bonus = itemStats(entry.templateId, entry.rarity);
    for (const [stat, value] of Object.entries(bonus)) {
      if (stat === 'atk') s.atk += value;
      else if (stat === 'hp') s.hp += value;
      else if (stat === 'def') s.def += value;
      else if (stat === 'crit') s.crit += value;
      else if (stat === 'speed') s.speed += value;
    }
  }
  if (equipped === 9) {
    s.hp = Math.round(s.hp * 1.06);
    s.atk = Math.round(s.atk * 1.06);
    s.def = Math.round(s.def * 1.06);
  }
  s.crit = Math.min(75, round1(s.crit));
  s.power = Math.round(
    s.atk * s.rate * (1 + s.crit / 100) * (1 + s.skillPower * .18) +
    s.hp * .11 + s.def * 1.65 + s.speed * .16 + s.lifesteal * 130
  );
  s.equipped = equipped;
  return s;
}

export function xpForLevel(level) {
  return 70 + level * 45;
}

export function addXp(state, amount) {
  let levels = 0;
  state.xp += Math.max(0, Math.round(amount));
  while (state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level++;
    levels++;
  }
  return levels;
}

export function addItem(state, { templateId, rarity = 'common', count = 1, silent = false }) {
  const template = templateById(templateId);
  if (!template) return null;
  const key = `${templateId}|${rarity}`;
  let group = state.inventory.find(g => g.key === key);
  if (!group) {
    group = { key, templateId, rarity, count: 0 };
    state.inventory.push(group);
  }
  group.count += count;
  if (!state.discovered.includes(templateId)) state.discovered.push(templateId);
  state.stats.drops = (state.stats.drops || 0) + count;
  if (!silent) {
    state.lastLoot = [{ templateId, rarity, count }, ...(state.lastLoot || [])].slice(0, 8);
  }
  return group;
}

export function removeItem(state, key, count = 1) {
  const idx = state.inventory.findIndex(g => g.key === key);
  if (idx < 0) return false;
  const group = state.inventory[idx];
  if (group.count < count) return false;
  group.count -= count;
  if (group.count <= 0) state.inventory.splice(idx, 1);
  return true;
}

export function groupByKey(state, key) {
  return state.inventory.find(g => g.key === key) || null;
}

export function equipItem(state, key) {
  const group = groupByKey(state, key);
  if (!group) return { ok: false, reason: 'Relic not found.' };
  const template = templateById(group.templateId);
  if (!template) return { ok: false, reason: 'Unknown relic.' };
  if (template.classId && template.classId !== state.classId) {
    return { ok: false, reason: 'Your class cannot wield this relic.' };
  }
  const slot = template.slot;
  const current = state.equipment[slot];
  if (!removeItem(state, key, 1)) return { ok: false, reason: 'Relic not found.' };
  state.equipment[slot] = { templateId: group.templateId, rarity: group.rarity };
  if (current) {
    addItem(state, { templateId: current.templateId, rarity: current.rarity, silent: true });
  }
  return { ok: true, equipped: state.equipment[slot], replaced: current };
}

export function unequipItem(state, slotId) {
  const entry = state.equipment[slotId];
  if (!entry) return false;
  addItem(state, { templateId: entry.templateId, rarity: entry.rarity, silent: true });
  state.equipment[slotId] = null;
  return true;
}

export function bestUpgradeForSlot(state, slotId) {
  let best = null;
  for (const group of state.inventory) {
    const t = templateById(group.templateId);
    if (!t || t.slot !== slotId) continue;
    if (t.classId && t.classId !== state.classId) continue;
    const score = itemScore(group.templateId, group.rarity);
    if (!best || score > best.score) best = { group, score };
  }
  return best;
}

export function autoEquip(state) {
  let equipped = 0;
  for (const slot of SLOTS) {
    const best = bestUpgradeForSlot(state, slot.id);
    if (!best) continue;
    const current = state.equipment[slot.id];
    const currentScore = current ? itemScore(current.templateId, current.rarity) : -1;
    if (best.score > currentScore) {
      if (equipItem(state, best.group.key).ok) equipped++;
    }
  }
  return equipped;
}

export function canReforge(state, key) {
  const group = groupByKey(state, key);
  if (!group) return false;
  return group.count >= 4 && RARITY_INDEX[group.rarity] < RARITIES.length - 1;
}

export function reforgeItem(state, key) {
  if (!canReforge(state, key)) return { ok: false, reason: 'Four identical relics are required.' };
  const group = groupByKey(state, key);
  const next = RARITIES[RARITY_INDEX[group.rarity] + 1];
  const templateId = group.templateId;
  if (!removeItem(state, key, 4)) return { ok: false, reason: 'Four identical relics are required.' };
  addItem(state, { templateId, rarity: next.id, count: 1, silent: false });
  state.stats.merges = (state.stats.merges || 0) + 1;
  return { ok: true, templateId, rarity: next.id };
}

export function autoReforge(state) {
  const results = [];
  let guard = 0;
  while (guard++ < 100) {
    const ready = state.inventory.find(g => canReforge(state, g.key));
    if (!ready) break;
    const result = reforgeItem(state, ready.key);
    if (result.ok) results.push(result);
    else break;
  }
  return results;
}

export function stageCompleted(state, stage) {
  if (!state.clearedStages.includes(stage.id)) state.clearedStages.push(stage.id);
  const idx = STAGES.findIndex(s => s.id === stage.id);
  if (idx >= state.unlockedStage) state.unlockedStage = Math.min(STAGES.length - 1, idx + 1);
  state.stats.bestStage = Math.max(state.stats.bestStage || 0, stage.num);
}

export function isStageUnlocked(state, stage) {
  const idx = STAGES.findIndex(s => s.id === stage.id);
  return idx <= state.unlockedStage;
}

export function isStageCleared(state, stage) {
  return state.clearedStages.includes(stage.id);
}

export function nextStage(state) {
  return STAGES[Math.min(state.unlockedStage, STAGES.length - 1)];
}

export function weightedRarity(stageIndex, boss = false, bonusLuck = 0) {
  const table = RARITY_WEIGHTS[boss ? 'boss' : 'normal'];
  let row = table[Math.min(stageIndex, table.length - 1)].slice();
  if (bonusLuck > 0) {
    for (let i = 2; i < row.length; i++) row[i] *= (1 + bonusLuck * (i - 1) * .25);
  }
  const total = row.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < row.length; i++) {
    roll -= row[i];
    if (roll <= 0) return RARITIES[i].id;
  }
  return 'common';
}

export function rollStageItem(state, stageIndex, boss = false, forcedRarity = null) {
  const rarity = forcedRarity || weightedRarity(stageIndex, boss);
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  return { templateId: `${state.classId}-${slot.id}`, rarity, slot: slot.id };
}

export function rollEnemyDrop(state, stageIndex) {
  const chance = .16 + Math.min(.08, stageIndex * .006);
  if (Math.random() > chance) return null;
  const rarity = weightedRarity(stageIndex, false);
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  return { templateId: `${state.classId}-${slot.id}`, rarity, slot: slot.id };
}

export function grantStageRewards(state, stage) {
  const stageIndex = STAGES.findIndex(s => s.id === stage.id);
  const isBoss = stage.type === 'boss';
  const firstClear = !state.clearedStages.includes(stage.id);
  const rewards = { items: [], gold: stage.gold, xp: stage.xp, relic: null, levels: 0 };
  const count = isBoss ? 3 : (stageIndex >= 6 ? 2 : 1);
  for (let i = 0; i < count; i++) {
    const drop = rollStageItem(state, Math.max(0, stageIndex), isBoss);
    addItem(state, drop);
    rewards.items.push(drop);
  }
  if (firstClear && isBoss) {
    const relic = BOSS_RELICS.find(r => r.stage === stage.num);
    if (relic && !state.relics.includes(relic.id)) {
      addItem(state, { templateId: relic.id, rarity: relic.rarity });
      state.relics.push(relic.id);
      rewards.relic = relic;
      rewards.items.push({ templateId: relic.id, rarity: relic.rarity, slot: relic.slot });
    }
  }
  state.gold += rewards.gold;
  rewards.levels = addXp(state, rewards.xp);
  stageCompleted(state, stage);
  state.stats.runs = (state.stats.runs || 0) + 1;
  if (isBoss && firstClear) state.stats.bossKills = (state.stats.bossKills || 0) + 1;
  return rewards;
}

export function powerTone(power, rec) {
  if (!rec) return 'neutral';
  if (power >= rec * 1.2) return 'strong';
  if (power >= rec * .92) return 'ready';
  return 'risky';
}

export function chapterProgress(state, chapterIndex) {
  const stages = STAGES.filter(s => s.chapter === chapterIndex);
  const cleared = stages.filter(s => state.clearedStages.includes(s.id)).length;
  return { cleared, total: stages.length, pct: Math.round(cleared / stages.length * 100) };
}

export function currentChapterIndex(state) {
  const stage = STAGES[Math.min(state.unlockedStage, STAGES.length - 1)];
  return stage?.chapter ?? 0;
}

export function rarityProgressionCount(state, rarityId) {
  let n = 0;
  for (const g of state.inventory) {
    if (g.rarity === rarityId) n += g.count;
  }
  for (const entry of Object.values(state.equipment)) {
    if (entry?.rarity === rarityId) n++;
  }
  return n;
}

export function displayStat(stat, value) {
  if (stat === 'crit') return `${round1(value)}%`;
  if (stat === 'speed') return `${Math.round(value)}`;
  if (stat === 'hp' || stat === 'atk' || stat === 'def') return `${Math.round(value)}`;
  return `${value}`;
}

export function statName(stat) {
  return ({ hp: 'Health', atk: 'Attack', def: 'Defense', crit: 'Crit', speed: 'Speed' })[stat] || stat;
}

export function formatNumber(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}m`;
  if (n >= 10000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}

export function roman(n) {
  return ROMAN[n - 1] || `${n}`;
}

export function bossForStage(stageId) {
  const stage = STAGES.find(s => s.id === stageId);
  return stage?.boss ? BOSSES[stage.boss] : null;
}

export function heroTitle(state) {
  const cls = CLASS[state.classId];
  const level = state.level;
  if (level >= 20) return `Ascendant ${cls.name}`;
  if (level >= 12) return `${cls.role}`;
  if (level >= 6) return `Seasoned ${cls.name}`;
  return `Novice ${cls.name}`;
}

export function totalInventoryCount(state) {
  return state.inventory.reduce((a, g) => a + g.count, 0);
}

function round1(n) { return Math.round(n * 10) / 10; }
