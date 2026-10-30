import { GAME } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { xpToNext } from './stats.js';
import { DAILY_CONTRACTS, MILESTONES } from '../data/quests.js';
import { MAX_STAGE_INDEX, stageCoords, stageGlobalIndex } from '../data/monsters.js';

export function todayKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function autoAllocatePoints(state, count = state.hero.statPoints) {
  if (count <= 0) return {};
  const cls = CLASSES[state.hero.classId] || CLASSES.warrior;
  const pattern = [];
  for (const [stat, weight] of Object.entries(cls.autoWeights)) {
    for (let i = 0; i < weight; i++) pattern.push(stat);
  }
  const gained = {};
  let remaining = Math.min(count, state.hero.statPoints);
  for (let i = 0; i < remaining; i++) {
    const stat = pattern[i % pattern.length];
    state.hero.attributes[stat] += 1;
    gained[stat] = (gained[stat] || 0) + 1;
    state.hero.statPoints -= 1;
  }
  return gained;
}

export function grantXp(state, amount) {
  if (!amount || amount <= 0 || state.hero.level >= GAME.maxHeroLevel) {
    return { levels: 0, leveled: false, spent: 0 };
  }
  let levels = 0;
  let guard = 0;
  state.hero.xp += amount;
  while (state.hero.level < GAME.maxHeroLevel && state.hero.xp >= xpToNext(state.hero.level) && guard < 200) {
    state.hero.xp -= xpToNext(state.hero.level);
    state.hero.level += 1;
    state.hero.statPoints += 3;
    state.hero.skillPoints += 1;
    levels++;
    guard++;
  }
  if (state.hero.level >= GAME.maxHeroLevel) state.hero.xp = 0;
  let spent = 0;
  if (state.hero.autoAllocate) {
    const before = state.hero.statPoints;
    autoAllocatePoints(state, state.hero.statPoints);
    spent = before - state.hero.statPoints;
  }
  ensureSkillUnlocks(state);
  return { levels, leveled: levels > 0, spent };
}

export function ensureSkillUnlocks(state) {
  const cls = CLASSES[state.hero.classId] || CLASSES.warrior;
  for (const skill of cls.skills) {
    if (state.hero.level >= skill.unlock && !(state.hero.skills[skill.id] > 0)) {
      state.hero.skills[skill.id] = 1;
    }
  }
}

export function allocateStat(state, stat, amount = 1) {
  if (!['strength', 'intelligence', 'dexterity', 'vitality'].includes(stat)) return false;
  if (state.hero.statPoints <= 0) return false;
  const n = Math.min(amount, state.hero.statPoints);
  state.hero.attributes[stat] += n;
  state.hero.statPoints -= n;
  return true;
}

export function stageKillsRequired(state, index = state.progress.currentIndex) {
  const coords = stageCoords(index);
  if (coords.stage === 10 || coords.stage === 20) return 1;
  return GAME.stageKillsRequired;
}

export function currentStageCleared(state) {
  return !!state.progress.cleared[String(state.progress.currentIndex)];
}

export function travelToStage(state, index) {
  const safe = Math.max(1, Math.min(state.progress.unlockedIndex, index));
  if (safe !== state.progress.currentIndex) {
    state.progress.currentIndex = safe;
    state.progress.stageKills = 0;
  }
  return safe;
}

export function advanceIfAble(state) {
  const { currentIndex } = state.progress;
  if (!state.progress.autoAdvance) return null;
  if (!state.progress.cleared[String(currentIndex)]) return null;
  const next = Math.min(state.progress.unlockedIndex, currentIndex + 1);
  if (next !== currentIndex) {
    state.progress.currentIndex = next;
    state.progress.stageKills = 0;
    return next;
  }
  return null;
}

export function progressStageKill(state) {
  const index = state.progress.currentIndex;
  if (state.progress.cleared[String(index)]) {
    state.progress.stageKills = Math.min(state.progress.stageKills + 1, stageKillsRequired(state, index));
    return { clearedNow: false, progress: 1 };
  }
  state.progress.stageKills += 1;
  const needed = stageKillsRequired(state, index);
  if (state.progress.stageKills >= needed) {
    state.progress.cleared[String(index)] = true;
    state.stats.stagesCleared += 1;
    state.progress.unlockedIndex = Math.min(MAX_STAGE_INDEX, Math.max(state.progress.unlockedIndex, index + 1));
    const cleared = stageCoords(index);
    const next = advanceIfAble(state);
    return { clearedNow: true, cleared, next, regionUnlocked: next ? stageCoords(next).region.id !== cleared.region.id : false };
  }
  return { clearedNow: false, progress: state.progress.stageKills / needed };
}

export function ensureDaily(state, now = Date.now()) {
  const key = todayKey(new Date(now));
  if (!state.daily) state.daily = { dayKey: key, progress: {}, claimed: [] };
  if (state.daily.dayKey !== key) {
    state.daily.dayKey = key;
    state.daily.progress = {};
    state.daily.claimed = [];
  }
  if (!state.dungeonAttempts) state.dungeonAttempts = { dayKey: key, used: {} };
  if (state.dungeonAttempts.dayKey !== key) {
    state.dungeonAttempts.dayKey = key;
    state.dungeonAttempts.used = {};
  }
  if (!Array.isArray(state.daily.claimed)) state.daily.claimed = [];
}

export function trackDaily(state, metric, amount = 1, now = Date.now()) {
  ensureDaily(state, now);
  state.daily.progress[metric] = (state.daily.progress[metric] || 0) + amount;
}

export function maxDungeonAttempts(state, now = Date.now()) {
  let max = GAME.dungeonAttemptsPerDay;
  if (state.hero.boosters?.membershipUntil > now) max += 1;
  return max;
}

export function dungeonAttemptsLeft(state, dungeonId, now = Date.now()) {
  ensureDaily(state, now);
  const used = state.dungeonAttempts.used[dungeonId] || 0;
  return Math.max(0, maxDungeonAttempts(state, now) - used);
}

export function useDungeonAttempt(state, dungeonId, now = Date.now()) {
  ensureDaily(state, now);
  if (dungeonAttemptsLeft(state, dungeonId, now) <= 0) return false;
  state.dungeonAttempts.used[dungeonId] = (state.dungeonAttempts.used[dungeonId] || 0) + 1;
  return true;
}

export function metricValue(state, metric, stats) {
  switch (metric) {
    case 'kills': return state.stats.kills;
    case 'bossKills': return state.stats.bossKills;
    case 'goldEarned': return state.stats.goldEarned;
    case 'dungeonClears': return state.stats.dungeonClears;
    case 'upgrades': return state.stats.upgrades;
    case 'level': return state.hero.level;
    case 'power': return Math.max(state.stats.bestPower || 0, stats?.power || 0);
    case 'bestUpgrade': return state.stats.bestUpgrade || 0;
    case 'legendaryFusions': return state.stats.legendaryFusions || 0;
    case 'stagesCleared': return state.stats.stagesCleared || 0;
    case 'divineOwned': return state.stats.divineOwned || 0;
    case 'fusions': return state.stats.fusions || 0;
    default: return 0;
  }
}

export function dailyProgress(state, contract) {
  return state.daily?.progress?.[contract.metric] || 0;
}

export function milestoneValue(state, milestone, stats) {
  return metricValue(state, milestone.metric, stats);
}

export function availableClaims(state, stats) {
  ensureDaily(state);
  let daily = 0, milestones = 0;
  for (const c of DAILY_CONTRACTS) {
    if (!state.daily.claimed.includes(c.id) && dailyProgress(state, c) >= c.target) daily++;
  }
  for (const m of MILESTONES) {
    if (!state.milestones.claimed.includes(m.id) && milestoneValue(state, m, stats) >= m.target) milestones++;
  }
  return { daily, milestones, total: daily + milestones };
}

export function claimDaily(state, contractId, now = Date.now()) {
  ensureDaily(state, now);
  const contract = DAILY_CONTRACTS.find(c => c.id === contractId);
  if (!contract || state.daily.claimed.includes(contractId)) return null;
  if (dailyProgress(state, contract) < contract.target) return null;
  state.daily.claimed.push(contractId);
  return contract.rewards;
}
