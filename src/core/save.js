import { GAME, CLASS_START } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { SLOT_KEYS, MATERIAL_KEYS, MATERIALS } from '../data/items.js';
import { computeStats, baseMaterialState } from './stats.js';
import { generateItem } from './items.js';
import { ensureDaily, ensureSkillUnlocks, todayKey } from './progression.js';
import { createBattle } from './combat.js';

function starterItem(classId, slot, templateId) {
  const item = generateItem({ ilvl: 1, rarity: 'common', classId, slot, templateId, source: 'starter' });
  if (slot === 'weapon') item.name = CLASSES[classId].baseWeapon.name;
  if (slot === 'armor') item.name = 'Roadworn Cuirass';
  if (slot === 'shoes') item.name = 'Scuffed Trailboots';
  return item;
}

export function createNewGame(classId = 'warrior', name = 'Kaelen') {
  const cls = CLASSES[classId] || CLASSES.warrior;
  const safeName = String(name || 'Kaelen').trim().slice(0, 18) || 'Kaelen';
  const equipment = {};
  for (const slot of SLOT_KEYS) equipment[slot] = null;
  equipment.weapon = starterItem(cls.id, 'weapon', cls.id === 'warrior' ? 'w_oathblade' : cls.id === 'mage' ? 'w_runestaff' : 'w_longbow');
  equipment.armor = starterItem(cls.id, 'armor', 'a_cuirass');
  equipment.shoes = starterItem(cls.id, 'shoes', 'sh_boots');

  const skills = {};
  for (const skill of cls.skills) skills[skill.id] = skill.id === cls.startingSkill ? 1 : 0;

  const state = {
    version: GAME.saveVersion,
    createdAt: Date.now(),
    lastSeen: Date.now(),
    playSeconds: 0,
    hero: {
      name: safeName,
      classId: cls.id,
      level: 1,
      xp: 0,
      statPoints: 0,
      skillPoints: 1,
      autoAllocate: true,
      attributes: { ...CLASS_START[cls.id] },
      hp: 1,
      mp: 1,
      gold: GAME.startingGold,
      premiumCoins: GAME.startingPremiumCoins,
      inventory: [],
      capacity: GAME.startingInventory,
      equipment,
      skills,
      autoSkills: true,
      pets: { owned: { mossling: { level: 1 } }, active: 'mossling' },
      mounts: { owned: {}, active: null },
      companions: { owned: {}, active: null },
      costumes: { owned: [], equipped: { outfit: null, weapon: null, hair: null, effect: null } },
      stones: { owned: [], equipped: [null, null, null] },
      materials: {
        ...baseMaterialState(),
        upgradeStone: 14,
        protection: 1,
        enchant: 2,
        chaos: 1,
        blessing: 6,
        stoneDust: 12,
        petEssence: 6,
        mountFeed: 3,
      },
      boosters: { xpUntil: 0, lootUntil: 0, goldUntil: 0, membershipUntil: 0 },
      autoEquip: true,
      autoSellCommon: false,
      starterCacheClaimed: false,
      freeChestAt: 0,
      summonEggs: 0,
      summonWhistles: 0,
    },
    progress: {
      currentIndex: 1,
      unlockedIndex: 1,
      cleared: {},
      stageKills: 0,
      autoAdvance: true,
    },
    daily: { dayKey: todayKey(), progress: {}, claimed: [] },
    dungeonAttempts: { dayKey: todayKey(), used: {} },
    milestones: { claimed: [] },
    stats: {
      kills: 0, bossKills: 0, stoneKills: 0, dungeonClears: 0, deaths: 0,
      upgrades: 0, fusions: 0, legendaryFusions: 0, mythicFusions: 0,
      goldEarned: 0, bestUpgrade: 0, stagesCleared: 0, bestPower: 0,
      divineOwned: 0, itemsFound: 0, playSeconds: 0,
    },
    settings: {
      particles: true,
      damageNumbers: true,
      sound: false,
      reduceMotion: false,
      autoSellCommon: false,
    },
    session: { startedAt: Date.now(), kills: 0, gold: 0, xp: 0, drops: 0 },
    seen: { intro: false },
  };

  const stats = computeStats(state);
  state.hero.hp = stats.maxHp;
  state.hero.mp = stats.maxMp;
  state.stats.bestPower = stats.power;
  ensureSkillUnlocks(state);
  ensureDaily(state);
  return state;
}

export function defaultBattle() { return createBattle(); }

export function migrateState(raw) {
  if (!raw || typeof raw !== 'object' || !raw.hero) return null;
  const state = raw;
  state.version = GAME.saveVersion;
  const hero = state.hero;
  hero.attributes = { strength: 4, intelligence: 4, dexterity: 4, vitality: 4, ...(hero.attributes || {}) };
  for (const slot of SLOT_KEYS) {
    if (!(slot in (hero.equipment || {}))) hero.equipment = { ...(hero.equipment || {}), [slot]: null };
  }
  hero.inventory = Array.isArray(hero.inventory) ? hero.inventory : [];
  hero.capacity = Math.max(GAME.startingInventory, hero.capacity || GAME.startingInventory);
  hero.materials = { ...baseMaterialState(), ...(hero.materials || {}) };
  hero.boosters = { xpUntil: 0, lootUntil: 0, goldUntil: 0, membershipUntil: 0, ...(hero.boosters || {}) };
  hero.pets = { owned: {}, active: null, ...(hero.pets || {}) };
  hero.mounts = { owned: {}, active: null, ...(hero.mounts || {}) };
  hero.companions = { owned: {}, active: null, ...(hero.companions || {}) };
  hero.costumes = { owned: [], equipped: { outfit: null, weapon: null, hair: null, effect: null }, ...(hero.costumes || {}) };
  hero.stones = { owned: [], equipped: [null, null, null], ...(hero.stones || {}) };
  hero.skills = hero.skills || {};
  hero.autoEquip = hero.autoEquip !== false;
  hero.autoSellCommon = !!hero.autoSellCommon;
  hero.autoSkills = hero.autoSkills !== false;
  state.progress = { currentIndex: 1, unlockedIndex: 1, cleared: {}, stageKills: 0, autoAdvance: true, ...(state.progress || {}) };
  state.stats = {
    kills: 0, bossKills: 0, stoneKills: 0, dungeonClears: 0, deaths: 0, upgrades: 0,
    fusions: 0, legendaryFusions: 0, mythicFusions: 0, goldEarned: 0, bestUpgrade: 0,
    stagesCleared: 0, bestPower: 0, divineOwned: 0, itemsFound: 0, playSeconds: 0,
    ...(state.stats || {}),
  };
  state.settings = { particles: true, damageNumbers: true, sound: false, reduceMotion: false, autoSellCommon: false, ...(state.settings || {}) };
  state.milestones = { claimed: [], ...(state.milestones || {}) };
  state.session = { startedAt: Date.now(), kills: 0, gold: 0, xp: 0, drops: 0, ...(state.session || {}) };
  ensureDaily(state);
  ensureSkillUnlocks(state);
  const stats = computeStats(state);
  hero.hp = Math.min(hero.hp || stats.maxHp, stats.maxHp);
  hero.mp = Math.min(hero.mp || stats.maxMp, stats.maxMp);
  return state;
}

export function saveGame(state) {
  try {
    state.lastSeen = Date.now();
    state.playSeconds = (state.playSeconds || 0);
    localStorage.setItem(GAME.saveKey, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Save failed', err);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(GAME.saveKey);
    if (!raw) return null;
    return migrateState(JSON.parse(raw));
  } catch (err) {
    console.warn('Load failed', err);
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(GAME.saveKey); } catch {}
}

export function exportSave(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSave(text) {
  try {
    const json = decodeURIComponent(escape(atob(String(text).trim())));
    return migrateState(JSON.parse(json));
  } catch {
    return null;
  }
}

export function materialName(key) { return MATERIALS[key]?.name || key; }
