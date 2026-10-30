import {
  SAVE_KEY, SAVE_VERSION, CLASSES, SLOTS, RARITIES, RARITY_BY_ID,
  getItem, itemKey, parseItemKey, mergeableGroups, mergePreview, xpForNext, MAX_LEVEL,
  stageIndex, totalInventoryCount,
} from './data.js';

const DEFAULT_SETTINGS = {
  muted: false,
  tilt: false,
  haptics: true,
  tutorialSeen: false,
};

export function newSave(classId, name) {
  const cls = CLASSES[classId];
  if (!cls) throw new Error('Unknown class');
  const hero = {
    name: (name || 'Wanderer').trim().slice(0, 14) || 'Wanderer',
    classId,
    level: 1,
    xp: 0,
    equipped: {
      weapon: itemKey(1, 'weapon', 'common'),
      armor: itemKey(1, 'armor', 'common'),
      boots: itemKey(1, 'boots', 'common'),
    },
    inventory: {},
  };
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hero,
    cleared: 0,
    settings: { ...DEFAULT_SETTINGS },
    stats: {
      kills: 0,
      bosses: 0,
      stagesCleared: 0,
      mergers: 0,
      lootCollected: 0,
      bestRarity: 'common',
      bestRarityRank: 0,
      defeats: 0,
      playSeconds: 0,
    },
    flags: {},
  };
}

function normalize(save) {
  if (!save || typeof save !== 'object') return null;
  if (!save.hero || !CLASSES[save.hero.classId]) return null;
  save.version = SAVE_VERSION;
  save.cleared = Number(save.cleared) || 0;
  save.hero.level = Math.max(1, Math.min(MAX_LEVEL, Number(save.hero.level) || 1));
  save.hero.xp = Math.max(0, Number(save.hero.xp) || 0);
  save.hero.inventory = save.hero.inventory && typeof save.hero.inventory === 'object' ? save.hero.inventory : {};
  save.hero.equipped = save.hero.equipped && typeof save.hero.equipped === 'object' ? save.hero.equipped : {};
  for (const slot of SLOTS) {
    if (!save.hero.equipped[slot.id]) continue;
    try { getItem(save.hero.equipped[slot.id]); }
    catch { delete save.hero.equipped[slot.id]; }
  }
  save.settings = { ...DEFAULT_SETTINGS, ...(save.settings || {}) };
  save.stats = {
    kills: 0, bosses: 0, stagesCleared: 0, mergers: 0, lootCollected: 0,
    bestRarity: 'common', bestRarityRank: 0, defeats: 0, playSeconds: 0,
    ...(save.stats || {}),
  };
  save.flags = save.flags || {};
  for (const [key, count] of Object.entries(save.hero.inventory)) {
    try { getItem(key); } catch { delete save.hero.inventory[key]; continue; }
    save.hero.inventory[key] = Math.max(1, Math.floor(Number(count) || 1));
  }
  return save;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch (err) {
    console.warn('Could not load save', err);
    return null;
  }
}

export function persist(save) {
  if (!save) return;
  save.updatedAt = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (err) {
    console.warn('Could not persist save', err);
  }
}

export function eraseSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

export function addItem(save, drop, count = drop.count || 1) {
  const key = itemKey(drop.tier, drop.slot, drop.rarity);
  save.hero.inventory[key] = (save.hero.inventory[key] || 0) + count;
  const item = getItem(key);
  save.stats.lootCollected += count;
  const rank = RARITY_BY_ID[drop.rarity]?.rank ?? 0;
  if (rank > (save.stats.bestRarityRank ?? 0)) {
    save.stats.bestRarityRank = rank;
    save.stats.bestRarity = drop.rarity;
  }
  return item;
}

export function removeItem(save, key, count = 1) {
  const current = save.hero.inventory[key] || 0;
  if (current < count) return false;
  if (current === count) delete save.hero.inventory[key];
  else save.hero.inventory[key] = current - count;
  return true;
}

export function equipFromInventory(save, key) {
  if (!save.hero.inventory[key]) return { ok: false, reason: 'This item is no longer in your pack.' };
  const item = getItem(key);
  const old = save.hero.equipped[item.slot] || null;
  removeItem(save, key, 1);
  if (old) save.hero.inventory[old] = (save.hero.inventory[old] || 0) + 1;
  save.hero.equipped[item.slot] = key;
  return { ok: true, item, old: old ? getItem(old) : null };
}

export function autoEquip(save) {
  let equipped = 0;
  const hero = save.hero;
  for (const slot of SLOTS) {
    const candidates = Object.entries(hero.inventory)
      .filter(([key, count]) => count > 0 && parseItemKey(key).slot === slot.id)
      .map(([key]) => getItem(key))
      .sort((a, b) => b.power - a.power);
    const currentKey = hero.equipped[slot.id];
    const current = currentKey ? getItem(currentKey) : null;
    if (candidates[0] && (!current || candidates[0].power > current.power)) {
      equipFromInventory(save, candidates[0].key);
      equipped++;
    }
  }
  return equipped;
}

export function mergeOne(save, key) {
  const count = save.hero.inventory[key] || 0;
  const preview = mergePreview(key);
  if (!preview) return { ok: false, reason: 'Divine relics cannot be merged further.' };
  if (count < 4) return { ok: false, reason: 'You need four identical copies.' };
  save.hero.inventory[key] = count - 4;
  if (save.hero.inventory[key] <= 0) delete save.hero.inventory[key];
  save.hero.inventory[preview.key] = (save.hero.inventory[preview.key] || 0) + 1;
  save.stats.mergers++;
  const rank = RARITY_BY_ID[preview.rarity].rank;
  if (rank > (save.stats.bestRarityRank ?? 0)) {
    save.stats.bestRarityRank = rank;
    save.stats.bestRarity = preview.rarity;
  }
  return { ok: true, item: preview, spent: 4 };
}

export function mergeAll(save) {
  const results = [];
  let guard = 0;
  while (guard++ < 5000) {
    const groups = mergeableGroups(save);
    if (!groups.length) break;
    // Lowest rarity first so a cascade can naturally climb the tiers.
    const group = groups[0];
    const res = mergeOne(save, group.key);
    if (!res.ok) break;
    results.push(res.item);
  }
  return results;
}

export function addXp(save, amount) {
  const hero = save.hero;
  if (hero.level >= MAX_LEVEL) return { levels: 0, levelsGained: [], xp: 0 };
  hero.xp += Math.max(0, Math.round(amount));
  const levelsGained = [];
  let guard = 0;
  while (hero.level < MAX_LEVEL && hero.xp >= xpForNext(hero.level) && guard++ < 100) {
    hero.xp -= xpForNext(hero.level);
    hero.level++;
    levelsGained.push(hero.level);
  }
  if (hero.level >= MAX_LEVEL) hero.xp = 0;
  return { levels: levelsGained.length, levelsGained, xp: Math.round(amount) };
}

export function recordStageClear(save, chapter, stage, boss) {
  const index = stageIndex(chapter, stage);
  const firstClear = index > save.cleared;
  if (firstClear) {
    save.cleared = index;
    save.stats.stagesCleared++;
  }
  return { firstClear, unlocked: index + 1 };
}

export function recordDefeat(save) {
  save.stats.defeats++;
}

export function recordKill(save, isBoss = false) {
  save.stats.kills++;
  if (isBoss) save.stats.bosses++;
}

export function isStageUnlocked(save, chapter, stage) {
  return stageIndex(chapter, stage) <= save.cleared + 1;
}

export function isStageCleared(save, chapter, stage) {
  return stageIndex(chapter, stage) <= save.cleared;
}

export function inventoryGroups(save) {
  return Object.entries(save.hero.inventory)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count, item: getItem(key), ...parseItemKey(key) }))
    .sort((a, b) => {
      const r = RARITY_BY_ID[b.rarity].rank - RARITY_BY_ID[a.rarity].rank;
      return r !== 0 ? r : b.tier - a.tier || a.item.slotName.localeCompare(b.item.slotName);
    });
}

export function inventoryBySlot(save, slot) {
  return inventoryGroups(save).filter(g => g.slot === slot);
}

export function totalPower(save) {
  let p = 0;
  for (const slot of SLOTS) {
    const k = save.hero.equipped[slot.id];
    if (k) p += getItem(k).power;
  }
  return p;
}

export function saveSummary(save) {
  return {
    name: save.hero.name,
    classId: save.hero.classId,
    level: save.hero.level,
    cleared: save.cleared,
    count: totalInventoryCount(save),
  };
}

export function highestRarity(save) {
  let best = RARITIES[0];
  for (const [key, count] of Object.entries(save.hero.inventory)) {
    if (!count) continue;
    const r = RARITY_BY_ID[parseItemKey(key).rarity];
    if (r.rank > best.rank) best = r;
  }
  for (const key of Object.values(save.hero.equipped)) {
    if (!key) continue;
    const r = RARITY_BY_ID[parseItemKey(key).rarity];
    if (r.rank > best.rank) best = r;
  }
  return best;
}
