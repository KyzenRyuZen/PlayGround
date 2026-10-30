import { GAME } from '../config.js';
import { computeStats, goldMultiplier, xpMultiplier, xpToNext } from './stats.js';
import { createStageMonster } from './monsters.js';
import { combatDps } from './combat.js';
import { grantXp, trackDaily } from './progression.js';
import { generateItem, itemSellPrice, rollRarity } from './items.js';
import { createRng, chance, randInt } from './rng.js';

export function simulateOffline(state, elapsedMs, now = Date.now()) {
  const cappedMs = Math.min(elapsedMs, GAME.offlineCapHours * 3600 * 1000);
  if (cappedMs < 60000) return null;
  const stats = computeStats(state);
  const r = createRng((state.createdAt || 1) ^ Math.floor(cappedMs / 1000));
  const monster = createStageMonster(state, { rng: r, forceElite: false });
  if (!monster) return null;

  const dps = combatDps(stats);
  const effDef = Math.max(0, monster.defense - stats.penetration) * (1 - stats.penPercent / 100);
  const mitigation = Math.min(0.8, effDef / (effDef + 160 + stats.level * 14));
  const effectiveDps = Math.max(1, dps * (1 - mitigation));
  const ttk = monster.maxHp / effectiveDps + 1.45;

  const monMitigation = Math.min(0.8, stats.defense / (stats.defense + 150 + monster.level * 12));
  const resKey = monster.element === 'holy' ? 'shadow' : monster.element;
  const resist = stats.resist?.[resKey] || 0;
  const incoming = (monster.attack / monster.attackInterval) * (1 - monMitigation) * (1 - resist / 100) * (1 - stats.damageReduction / 100);
  const sustain = stats.hpRegen + (stats.lifesteal / 100) * dps;
  const net = incoming - sustain;
  const surviveTime = net > 0 ? stats.maxHp / net : Infinity;
  const deaths = net > 0 ? Math.floor(ttk / Math.max(1, surviveTime)) : 0;
  const cycleTime = ttk + (deaths > 0 ? 3 : 0);

  const effectiveSeconds = (cappedMs / 1000) * GAME.offlineEfficiency;
  const kills = Math.max(0, Math.floor(effectiveSeconds / cycleTime));
  const gold = Math.round(monster.gold * kills * goldMultiplier(state, stats, now));
  const xp = Math.round(monster.exp * kills * xpMultiplier(state, now));
  const lootFind = stats.lootFind || 0;
  const dropChance = Math.min(0.9, 0.22 * (1 + lootFind * 0.004) * (state.hero.boosters?.lootUntil > now ? 1.6 : 1));
  const equipmentDrops = Math.floor(kills * dropChance);
  const itemSample = Math.min(8, equipmentDrops);
  const items = [];
  let autoSoldGold = 0;
  for (let i = 0; i < itemSample; i++) {
    const rarity = rollRarity('normal', lootFind, r);
    const item = generateItem({
      ilvl: Math.max(1, monster.level + randInt(0, 2, r)),
      rarity, classId: state.hero.classId, source: 'offline', lootFind,
    });
    items.push(item);
  }
  const autoSoldCount = Math.max(0, equipmentDrops - itemSample);
  if (autoSoldCount > 0) {
    autoSoldGold = autoSoldCount * Math.round((12 + monster.level * 5.2) * 1.6);
  }

  const materials = {};
  const addExpected = (key, expected) => {
    const n = Math.floor(expected + (r() < expected % 1 ? 1 : 0));
    if (n > 0) materials[key] = (materials[key] || 0) + n;
  };
  addExpected('upgradeStone', kills * 0.38 * 1.2);
  addExpected('stoneDust', kills * 0.12);
  addExpected('enchant', kills * 0.04);
  addExpected('chaos', kills * 0.025);
  addExpected('blessing', kills * 0.05);
  addExpected('petEssence', kills * 0.045);
  addExpected('mountFeed', kills * 0.03);
  addExpected('soulEmber', kills * 0.018);
  if (monster.level >= 30) addExpected('ember', kills * 0.018);

  const beforeLevel = state.hero.level;
  const xpResult = grantXp(state, xp);
  state.hero.hp = computeStats(state).maxHp;
  state.hero.mp = computeStats(state).maxMp;
  state.stats.kills += kills;
  state.stats.goldEarned += gold + autoSoldGold;
  state.hero.gold += gold + autoSoldGold;
  trackDaily(state, 'kills', kills, now);
  trackDaily(state, 'goldEarned', gold + autoSoldGold, now);
  for (const [key, amount] of Object.entries(materials)) {
    state.hero.materials[key] = (state.hero.materials[key] || 0) + amount;
  }

  return {
    seconds: Math.floor(cappedMs / 1000),
    efficiency: GAME.offlineEfficiency,
    kills,
    gold: gold + autoSoldGold,
    xp,
    levels: state.hero.level - beforeLevel,
    fromLevel: beforeLevel,
    toLevel: state.hero.level,
    items,
    materials,
    autoSoldCount,
    monsterName: monster.name,
    stageLevel: monster.level,
  };
}

export function estimateStagePowerGap(state) {
  const stats = computeStats(state);
  const monster = createStageMonster(state, { rng: () => 0.5 });
  if (!monster) return { ok: true };
  const dps = combatDps(stats);
  const ttk = monster.maxHp / Math.max(1, dps);
  return { ok: ttk < 12, ttk, monster };
}

export function secondsToLevel(state, xpPerKill) {
  const needed = xpToNext(state.hero.level) - state.hero.xp;
  return Math.ceil(needed / Math.max(1, xpPerKill));
}
