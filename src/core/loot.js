import { generateItem, generateStone, rollRarity } from './items.js';
import { RARITIES, RARITY_BY_ID, MATERIAL_KEYS } from '../data/items.js';
import { PETS, MOUNTS, COSTUMES } from '../data/collections.js';
import { goldMultiplier, xpMultiplier } from './stats.js';
import { chance, randInt, pick } from './rng.js';

function emptyMaterials() {
  return Object.fromEntries(MATERIAL_KEYS.map(k => [k, 0]));
}

function addMat(materials, key, amount) {
  if (!key || !amount) return;
  materials[key] = (materials[key] || 0) + amount;
}

function boostRarityFloor(rarityId, floorIndex) {
  const current = RARITY_BY_ID[rarityId];
  if (!current || current.index >= floorIndex) return rarityId;
  return RARITIES[floorIndex].id;
}

export function rollEquipmentDrop(state, level, source, stats, rngFn = Math.random) {
  const lootFind = stats?.lootFind || 0;
  let rarity = rollRarity(source, lootFind, rngFn);
  if (source === 'boss') rarity = boostRarityFloor(rarity, 2);
  if (source === 'dungeon') rarity = boostRarityFloor(rarity, 3);
  return generateItem({
    ilvl: Math.max(1, level + randInt(0, 2)),
    rarity, classId: state.hero.classId, source, lootFind,
  });
}

export function rollKillRewards(state, monster, stats, now = Date.now(), rngFn = Math.random) {
  const source = monster.lootSource || (monster.isBoss ? 'boss' : 'normal');
  const gold = Math.max(1, Math.round(monster.gold * goldMultiplier(state, stats, now)));
  const xp = Math.max(1, Math.round(monster.exp * xpMultiplier(state, now)));
  const materials = emptyMaterials();
  const items = [];
  const stones = [];
  const lootFind = stats.lootFind || 0;

  let itemChance = 0.22;
  let guaranteed = monster.guaranteedItems || 0;
  if (source === 'elite') itemChance = 0.78;
  if (source === 'miniboss') { itemChance = 1; guaranteed = 1; }
  if (source === 'stone') itemChance = 0.9;
  if (source === 'boss') { itemChance = 1; guaranteed = Math.max(guaranteed, 3); }
  itemChance = Math.min(1, itemChance * (1 + lootFind * 0.004));

  const rolls = guaranteed + (chance(itemChance, rngFn) ? 1 : 0);
  for (let i = 0; i < rolls; i++) {
    items.push(rollEquipmentDrop(state, monster.level, source, stats, rngFn));
  }

  if (source === 'stone') {
    const stoneRolls = randInt(1, 2, rngFn);
    for (let i = 0; i < stoneRolls; i++) stones.push(generateStone({ source: 'stone', gradeBoost: 1 }));
    addMat(materials, 'upgradeStone', randInt(3, 6, rngFn));
    addMat(materials, 'stoneDust', randInt(2, 5, rngFn));
    addMat(materials, 'ember', chance(0.35, rngFn) ? 1 : 0);
  } else {
    if (chance(0.38, rngFn)) addMat(materials, 'upgradeStone', randInt(1, 2, rngFn));
    if (monster.level >= 30 && chance(0.018, rngFn)) addMat(materials, 'ember', 1);
    if (chance(0.12, rngFn)) addMat(materials, 'stoneDust', randInt(1, 2, rngFn));
    if (chance(0.04, rngFn)) addMat(materials, 'enchant', 1);
    if (chance(0.025, rngFn)) addMat(materials, 'chaos', 1);
    if (chance(0.05, rngFn)) addMat(materials, 'blessing', 1);
    if (chance(0.045, rngFn)) addMat(materials, 'petEssence', randInt(1, 2, rngFn));
    if (chance(0.03, rngFn)) addMat(materials, 'mountFeed', 1);
    if (chance(0.018, rngFn)) addMat(materials, 'soulEmber', 1);
    if (source === 'boss') {
      addMat(materials, 'ember', randInt(1, 2, rngFn));
      addMat(materials, 'upgradeStone', randInt(3, 6, rngFn));
      addMat(materials, 'blessing', randInt(1, 2, rngFn));
      if (chance(0.18, rngFn)) addMat(materials, 'protection', 1);
      if (chance(0.35, rngFn)) stones.push(generateStone({ source: 'boss', gradeBoost: 1 }));
    } else if (source === 'miniboss') {
      addMat(materials, 'upgradeStone', randInt(2, 4, rngFn));
      addMat(materials, 'ember', chance(0.4, rngFn) ? 1 : 0);
      if (chance(0.08, rngFn)) stones.push(generateStone({ source: 'elite' }));
    } else if (source === 'elite') {
      addMat(materials, 'upgradeStone', randInt(1, 3, rngFn));
      if (chance(0.06, rngFn)) stones.push(generateStone({ source: 'elite' }));
    }
  }

  return { gold, xp, items, stones, materials };
}

export function rollDungeonRewards(state, dungeon, stats, now = Date.now(), rngFn = Math.random) {
  const rew = dungeon.rewards;
  const gold = Math.round(rew.gold * goldMultiplier(state, stats, now));
  const xp = Math.round(rew.xp * xpMultiplier(state, now));
  const items = [];
  const stones = [];
  const materials = emptyMaterials();
  for (let i = 0; i < rew.items; i++) {
    items.push(rollEquipmentDrop(state, dungeon.level + randInt(0, 3, rngFn), 'dungeon', stats, rngFn));
  }
  for (let i = 0; i < rew.stones; i++) stones.push(generateStone({ source: 'boss', gradeBoost: 1, level: randInt(1, 2, rngFn) }));
  addMat(materials, rew.mat, rew.matQty);
  addMat(materials, 'upgradeStone', randInt(6, 12, rngFn));
  addMat(materials, 'stoneDust', randInt(4, 9, rngFn));
  if (chance(0.5, rngFn)) addMat(materials, 'protection', 1);

  const extras = {};
  if (chance(rew.chance.pet || 0, rngFn)) {
    extras.pet = pick(Object.keys(PETS).filter(id => PETS[id].rarity !== 'divine'), rngFn);
  }
  if (chance(rew.chance.mount || 0, rngFn)) {
    extras.mount = pick(Object.keys(MOUNTS).filter(id => MOUNTS[id].rarity !== 'divine'), rngFn);
  }
  if (chance(rew.chance.costume || 0, rngFn)) {
    const pool = Object.keys(COSTUMES).filter(id => COSTUMES[id].priceGold);
    if (pool.length) extras.costume = pick(pool, rngFn);
  }
  return { gold, xp, items, stones, materials, extras };
}
