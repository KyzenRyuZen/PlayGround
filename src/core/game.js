import { CLASSES, CLASS_IDS, FACTION_BONUS, OUTFITS, HAIR_COLORS, EYE_COLORS, RANDOM_NAMES } from '../data/classes.js';
import { SLOT_IDS, SLOTS, makeEquip, starterGear, makeConsumable, makeMaterial, MATERIALS, fusionResult, makeFusionResult, RARITY, TIER_MULT, clampCrit, WINGS, aggregateStats, equipScore, itemName } from '../data/items.js';
import { ZONES, getZone } from '../data/zones.js';
import { QUESTS, getQuest, zoneStory } from '../data/quests.js';
import { MOUNTS } from '../data/shop.js';
import { t, tx } from './i18n.js';
import { clamp, uid, formatNumber, todayKey } from './utils.js';
import { saveGame } from './save.js';

export const App = {
  settings: null,
  game: null,
  engine: null,
  screen: null,
  ui: { panel: null, modal: null, busy: false, toastQueue: [] },
};

export const INVENTORY_SIZE = 48;
export const STORAGE_SIZE = 60;
export const MAX_LEVEL = 60;

export function xpForLevel(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.round(110 + level * 62 + Math.pow(level, 2.15) * 13);
}

export function newPlayer(opts) {
  const cls = CLASSES[opts.classId] ?? CLASSES.warrior;
  const player = {
    version: 1,
    name: opts.name,
    faction: opts.faction,
    gender: opts.gender,
    classId: cls.id,
    hair: opts.hair,
    hairColor: opts.hairColor,
    eyeColor: opts.eyeColor,
    outfit: opts.outfit,
    level: 1,
    xp: 0,
    gold: 160,
    gems: 50,
    essence: 0,
    hp: 1,
    resource: 0,
    zoneId: 'greendale',
    x: 0, y: 0,
    equipment: {},
    inventory: [],
    storage: [],
    stones: [],
    activeStone: null,
    quests: {},
    completedChapters: 0,
    discoveredZones: ['greendale'],
    visited: { greendale: true },
    kills: 0,
    bossKills: 0,
    questsDone: 0,
    playtimeMs: 0,
    createdAt: Date.now(),
    mounts: ['none'],
    mount: null,
    pets: [],
    pet: null,
    fxUnlocks: [],
    fx: null,
    wings: [],
    wing: null,
    costumes: [],
    costume: null,
    costumeColors: null,
    hairUnlocks: [],
    dailyClaim: null,
    dailyStreak: 0,
    buffs: {},
    bossFirstKills: {},
    gatherCount: 0,
    title: null,
    skillRanks: { 1: 1, 2: 1, 3: 1 },
  };
  for (const item of starterGear(cls.id)) player.equipment[item.slot] = item;
  player.equipment.weapon = makeEquip({ classId: cls.id, slot: 'weapon', rarity: 'common', tier: 'T3', level: 1 });
  recalc(player, true);
  player.hp = player.stats.maxHp;
  player.resource = Math.round(player.stats.maxResource * 0.6);
  player.inventory.push(makeConsumable('healPotion', 3));
  player.inventory.push(makeConsumable('manaPotion', 2));
  player.inventory.push(makeMaterial('herb', 2));
  const story = zoneStory('greendale');
  if (story) player.quests[story.id] = { state: 'active', progress: story.objectives.map(() => 0) };
  return player;
}

export function createGame(player) {
  return {
    version: 1,
    createdAt: player.createdAt,
    savedAt: Date.now(),
    settings: App.settings,
    player,
    stats: player.stats,
  };
}

export function recalc(player, full = false) {
  const cls = CLASSES[player.classId];
  const level = player.level;
  const g = cls.growth;
  const base = {
    attack: cls.base.attack + g.attack * (level - 1),
    armor: cls.base.armor + g.armor * (level - 1),
    hp: cls.base.hp + g.hp * (level - 1),
    crit: cls.base.crit + g.crit * (level - 1),
    critDmg: cls.base.critDmg + g.critDmg * (level - 1),
    hpRegen: cls.base.hpRegen + g.hpRegen * (level - 1),
    resourceRegen: cls.base.resourceRegen,
    speed: cls.base.speed,
  };
  const stone = player.stones.find((s) => s.uid === player.activeStone) ?? null;
  const gear = aggregateStats(player.equipment, stone, player.classId, level);
  const fb = FACTION_BONUS[player.faction] ?? {};
  const passiveArmor = player.classId === 'warrior' ? 0.12 : 0;
  const passiveCritDmg = player.classId === 'assassin' ? 0.15 : 0;
  const passiveRegen = player.classId === 'mage' ? 0.2 : 0;

  const gearArmor = (gear.armor ?? 0) + (gear.defense ?? 0);
  const stats = {
    attack: (base.attack + (gear.attack ?? 0)) * (1 + (fb.attack ?? 0)),
    armor: (base.armor + gearArmor) * (1 + passiveArmor + (fb.armor ?? 0)),
    maxHp: Math.round(base.hp + (gear.hp ?? 0)),
    crit: clampCrit(base.crit + (gear.crit ?? 0)),
    critDmg: base.critDmg + (gear.critDmg ?? 0) + passiveCritDmg,
    speed: base.speed * (1 + (gear.speed ?? 0)),
    lifesteal: clamp((gear.lifesteal ?? 0) + (fb.lifesteal ?? 0), 0, 0.5),
    goldFind: gear.goldFind ?? 0,
    gatherSpeed: clamp(gear.gatherSpeed ?? 0, 0, 1.5),
    hpRegen: base.hpRegen + (gear.hpRegen ?? 0),
    resourceRegen: (base.resourceRegen + (gear.resourceRegen ?? 0)) * (1 + passiveRegen),
    maxResource: cls.base.resourceMax,
    power: 0,
    gearScore: 0,
  };
  stats.power = Math.round(stats.attack * 4 + stats.armor * 3 + stats.maxHp * 0.35 + stats.crit * 800 + stats.critDmg * 120 + stats.lifesteal * 600);
  stats.gearScore = Object.values(player.equipment).reduce((s, it) => s + (it ? equipScore(it) : 0), 0) + (stone ? 120 : 0);
  player.stats = stats;
  if (full || player.hp == null) player.hp = stats.maxHp;
  player.hp = clamp(player.hp, 0, stats.maxHp);
  player.resource = clamp(player.resource ?? 0, 0, stats.maxResource);
  return stats;
}

export function statDamage(stats) { return stats.attack; }

export function armorReduction(armor, level) {
  return armor / (armor + 92 + level * 9);
}

export function playerPower(player) {
  return player.stats?.power ?? 0;
}

export function addXP(player, amount) {
  if (player.level >= MAX_LEVEL) return { levels: 0, xp: 0 };
  const xp = Math.max(1, Math.round(amount));
  player.xp += xp;
  let levels = 0;
  while (player.level < MAX_LEVEL && player.xp >= xpForLevel(player.level)) {
    player.xp -= xpForLevel(player.level);
    player.level++;
    levels++;
  }
  if (levels > 0) {
    const beforeHp = player.stats.maxHp;
    recalc(player);
    player.hp = player.stats.maxHp;
    player.resource = player.stats.maxResource;
    player.lastLevelGain = { levels, beforeHp };
  }
  return { levels, xp };
}

export function addGold(player, amount) {
  const n = Math.max(0, Math.round(amount));
  player.gold += n;
  return n;
}

export function addGems(player, amount) {
  const n = Math.max(0, Math.round(amount));
  player.gems += n;
  return n;
}

export function addEssence(player, amount) {
  player.essence = Math.max(0, (player.essence ?? 0) + Math.round(amount));
}

export function countInventory(player) { return player.inventory.length; }

export function addItem(player, item, opts = {}) {
  if (!item) return false;
  if (item.stack) {
    const existing = player.inventory.find((x) => x.kind === item.kind && x.id === item.id && x.qty < (x.stackLimit ?? item.stack ?? 20));
    if (existing && existing.qty + (item.qty ?? 1) <= (existing.stackLimit ?? 20)) {
      existing.qty += item.qty ?? 1;
      return true;
    }
    if (existing) {
      const room = (existing.stackLimit ?? 20) - existing.qty;
      const left = (item.qty ?? 1) - room;
      existing.qty += room;
      if (left > 0) return addItem(player, { ...item, qty: left }, opts);
      return true;
    }
  }
  if (player.inventory.length >= INVENTORY_SIZE) return false;
  player.inventory.push({ ...item, uid: item.uid ?? uid('it') });
  return true;
}

export function addMaterial(player, id, qty = 1) {
  const mat = MATERIALS[id];
  if (!mat) return false;
  return addItem(player, { ...makeMaterial(id, qty), stackLimit: 999 });
}

export function removeItem(player, itemRef, qty = 1) {
  const idx = player.inventory.findIndex((x) => x.uid === itemRef.uid || (x.stack && x.id === itemRef.id && x.kind === itemRef.kind));
  if (idx < 0) return false;
  const it = player.inventory[idx];
  if (it.stack && (it.qty ?? 1) > qty) it.qty -= qty;
  else player.inventory.splice(idx, 1);
  return true;
}

export function itemCount(player, predicate) { return player.inventory.filter(predicate).length; }

export function canEquip(player, item) {
  if (!item || item.kind !== 'equip') return { ok: false, reason: 'kind' };
  if (item.class !== player.classId) return { ok: false, reason: 'class' };
  if (item.reqLevel > player.level) return { ok: false, reason: 'level' };
  return { ok: true };
}

export function equipItem(player, item) {
  const check = canEquip(player, item);
  if (!check.ok) return check;
  const current = player.equipment[item.slot];
  const idx = player.inventory.findIndex((x) => x.uid === item.uid);
  if (idx < 0) return { ok: false, reason: 'missing' };
  player.inventory.splice(idx, 1);
  player.equipment[item.slot] = item;
  if (current) player.inventory.push(current);
  recalc(player);
  return { ok: true, replaced: current };
}

export function unequipItem(player, slot) {
  const current = player.equipment[slot];
  if (!current) return false;
  if (player.inventory.length >= INVENTORY_SIZE) return { ok: false, reason: 'full' };
  player.inventory.push(current);
  player.equipment[slot] = null;
  recalc(player);
  return { ok: true };
}

export function sellValue(item) {
  if (!item) return 0;
  if (item.kind === 'equip') return Math.round((item.value ?? 10) * (1 + (TIER_MULT[item.tier] ?? 1) * 0.3));
  return item.value ?? 5;
}

export function sellItem(player, itemRef) {
  const idx = player.inventory.findIndex((x) => x.uid === itemRef.uid);
  if (idx < 0) return 0;
  const it = player.inventory[idx];
  const qty = it.stack ? (it.qty ?? 1) : 1;
  const each = sellValue(it);
  player.inventory.splice(idx, 1);
  const total = each * qty;
  player.gold += total;
  return total;
}

export function salvageEssence(item) {
  if (!item || item.kind !== 'equip') return 0;
  const r = Object.keys(RARITY).indexOf(item.rarity);
  const tier = item.tier === 'T1' ? 3 : item.tier === 'T2' ? 2 : 1;
  return Math.max(1, Math.round((r + 1) * tier * 3));
}

// ── Fusion ────────────────────────────────────────────────────────────────
export function fusionGroups(player) {
  const groups = new Map();
  for (const it of player.inventory) {
    if (it.kind !== 'equip' || !it.fusable) continue;
    if (!fusionResult(it)) continue;
    const key = it.key ?? `${it.slot}|${it.class}|${it.rarity}|${it.tier}|${it.level}`;
    if (!groups.has(key)) groups.set(key, { key, items: [], sample: it, result: makeFusionResult(it) });
    groups.get(key).items.push(it);
  }
  return [...groups.values()].sort((a, b) => b.items.length - a.items.length);
}

export function canFuseGroup(group) { return group && group.items.length >= 4 && group.result; }

export function fuseGroup(player, group) {
  if (!canFuseGroup(group)) return null;
  const consumed = group.items.slice(0, 4);
  for (const it of consumed) {
    const idx = player.inventory.findIndex((x) => x.uid === it.uid);
    if (idx >= 0) player.inventory.splice(idx, 1);
  }
  const result = makeFusionResult(consumed[0]);
  if (!result) return null;
  addItem(player, result);
  return result;
}

export function fuseItem(player, item) {
  if (!item || item.kind !== 'equip') return null;
  const key = item.key;
  const matches = player.inventory.filter((x) => x.kind === 'equip' && x.key === key);
  if (matches.length < 4) return null;
  const group = { items: matches, sample: item, result: makeFusionResult(item) };
  return fuseGroup(player, group);
}

// ── Quests ────────────────────────────────────────────────────────────────
export function questEntry(player, questId) {
  return player.quests[questId] ?? null;
}

export function acceptQuest(player, questId) {
  const q = getQuest(questId);
  if (!q) return false;
  if (player.quests[questId]) return false;
  player.quests[questId] = { state: 'active', progress: q.objectives.map(() => 0) };
  return true;
}

export function questReady(player, questId) {
  const e = player.quests[questId];
  const q = getQuest(questId);
  if (!e || !q) return false;
  return e.state === 'active' && q.objectives.every((o, i) => (e.progress[i] ?? 0) >= o.count);
}

export function advanceQuests(player, type, target, count = 1) {
  const done = [];
  for (const [qid, entry] of Object.entries(player.quests)) {
    if (entry.state !== 'active') continue;
    const q = getQuest(qid);
    if (!q) continue;
    let changed = false;
    q.objectives.forEach((o, i) => {
      if (o.type !== type || o.target !== target) return;
      const before = entry.progress[i] ?? 0;
      if (before >= o.count) return;
      entry.progress[i] = Math.min(o.count, before + count);
      if (entry.progress[i] !== before) changed = true;
    });
    if (changed && questReady(player, qid)) {
      entry.state = 'done';
      done.push(q);
    }
  }
  return done;
}

export function claimQuest(player, questId, opts = {}) {
  const q = getQuest(questId);
  const entry = player.quests[questId];
  if (!q || !entry || entry.state !== 'done') return null;
  entry.state = 'claimed';
  player.questsDone++;
  const r = q.rewards ?? {};
  const gained = { xp: 0, gold: 0, gems: 0, items: [], unlocks: [] };
  if (r.xp) { addXP(player, r.xp); gained.xp = r.xp; }
  if (r.gold) { addGold(player, r.gold); gained.gold = r.gold; }
  if (r.gems) { addGems(player, r.gems); gained.gems = r.gems; }
  if (r.gear && opts.generateGear !== false) {
    const it = makeEquip({ classId: player.classId, slot: r.gear.slot, rarity: r.gear.rarity, tier: r.gear.tier, level: Math.max(1, getZone(q.zone).min) });
    if (!addItem(player, it)) { player.storage.push(it); gained.stored = true; }
    gained.items.push(it);
  }
  if (r.consumable) {
    const c = makeConsumable(r.consumable.id, r.consumable.qty ?? 1);
    c.stackLimit = 20;
    addItem(player, c);
    gained.items.push(c);
  }
  if (r.mount) {
    if (!player.mounts.includes(r.mount)) { player.mounts.push(r.mount); gained.mount = r.mount; }
  }
  if (r.wing) {
    if (!player.wings.includes(r.wing)) { player.wings.push(r.wing); gained.wing = r.wing; }
  }
  if (r.title) player.title = r.title;
  if (r.gems && q.story) {
    player.completedChapters = Math.max(player.completedChapters, q.chapter);
    const next = ZONES.find((z) => z.unlockChapter === q.chapter);
    if (next) {
      if (!player.discoveredZones.includes(next.id)) { player.discoveredZones.push(next.id); gained.zone = next.id; }
    }
  }
  recalc(player);
  return gained;
}

export function ensureStoryQuest(player, zoneId) {
  const q = zoneStory(zoneId);
  if (!q) return null;
  if (player.quests[q.id]) return null;
  const zone = getZone(zoneId);
  if ((player.completedChapters ?? 0) < zone.unlockChapter) return null;
  player.quests[q.id] = { state: 'active', progress: q.objectives.map(() => 0) };
  return q;
}

export function zoneUnlocked(player, zone) {
  return (player.completedChapters ?? 0) >= (zone.unlockChapter ?? 0);
}

export function questsInZone(player, zoneId) {
  return QUESTS.filter((q) => q.zone === zoneId).map((q) => ({
    quest: q, entry: player.quests[q.id] ?? null,
  }));
}

export function trackedQuest(player) {
  const active = Object.entries(player.quests).filter(([, e]) => e.state === 'active' || e.state === 'done');
  if (!active.length) return null;
  // prefer story, then first
  const withQuest = active.map(([id, e]) => ({ quest: getQuest(id), entry: e })).filter((x) => x.quest);
  withQuest.sort((a, b) => (b.quest.story ? 1 : 0) - (a.quest.story ? 1 : 0));
  return withQuest[0] ?? null;
}

export function questObjectiveText(quest, entry) {
  const zone = getZone(quest.zone);
  return quest.objectives.map((o, i) => {
    const done = (entry?.progress?.[i] ?? 0);
    let targetName = o.target;
    if (o.type === 'kill' || o.type === 'killElite' || o.type === 'boss') {
      const mon = zone.monsters.find((m) => m.id === o.target) ?? (zone.elite.id === o.target ? zone.elite : zone.boss.id === o.target ? zone.boss : null);
      targetName = mon ? tx(mon.name) : o.target;
    } else if (o.type === 'gather') {
      targetName = t(`gather.${o.target}`);
    }
    return { ...o, targetName, done, text: t(`quest.${o.type === 'boss' ? 'boss' : o.type === 'killElite' ? 'kill' : o.type}`, { target: targetName }), progressText: `${Math.min(done, o.count)}/${o.count}` };
  });
}

// ── Daily & shop ─────────────────────────────────────────────────────────
export function ensureDaily(player, settings) {
  const today = todayKey();
  if (player.dailyClaim !== today) return { ready: true, streak: player.dailyStreak ?? 0 };
  return { ready: false, streak: player.dailyStreak ?? 0 };
}

export function claimDaily(player) {
  const today = todayKey();
  if (player.dailyClaim === today) return null;
  const yesterday = todayKey(new Date(Date.now() - 86400000));
  player.dailyStreak = player.dailyClaim === yesterday ? (player.dailyStreak ?? 0) + 1 : 1;
  player.dailyClaim = today;
  addGems(player, 15);
  addGold(player, 250);
  return { gems: 15, gold: 250, streak: player.dailyStreak };
}

export function isUnlocked(player, type, id) {
  if (type === 'hair') return id <= 3 || player.hairUnlocks.includes(id);
  if (type === 'mount') return id === 'none' || player.mounts.includes(id);
  if (type === 'pet') return player.pets.includes(id);
  if (type === 'fx') return player.fxUnlocks.includes(id);
  if (type === 'wing') return player.wings.includes(id);
  if (type === 'costume') return player.costumes.includes(id);
  return false;
}

export function unlockCosmetic(player, item) {
  if (!item) return false;
  switch (item.type) {
    case 'hair': if (!player.hairUnlocks.includes(item.style)) player.hairUnlocks.push(item.style); return true;
    case 'mount': if (!player.mounts.includes(item.id)) player.mounts.push(item.id); return true;
    case 'pet': if (!player.pets.includes(item.id)) player.pets.push(item.id); return true;
    case 'fx': if (!player.fxUnlocks.includes(item.id)) player.fxUnlocks.push(item.id); return true;
    case 'wing': if (!player.wings.includes(item.id)) player.wings.push(item.id); return true;
    case 'costume': if (!player.costumes.includes(item.id)) player.costumes.push(item.id); return true;
    default: return false;
  }
}

export function cosmeticOwned(player, item) {
  if (!item) return false;
  if (item.type === 'wing') return player.wings.includes(item.id);
  if (item.type === 'mount') return player.mounts.includes(item.id);
  if (item.type === 'pet') return player.pets.includes(item.id);
  if (item.type === 'fx') return player.fxUnlocks.includes(item.id);
  if (item.type === 'costume') return player.costumes.includes(item.id);
  if (item.type === 'hair') return player.hairUnlocks.includes(item.style);
  return false;
}

export function playerEquippedCosmetic(player, type) {
  if (type === 'wing') return player.wing;
  if (type === 'mount') return player.mount;
  if (type === 'pet') return player.pet;
  if (type === 'fx') return player.fx;
  if (type === 'costume') return player.costume;
  return null;
}

export function applyCosmetic(player, type, id) {
  if (type === 'wing') { if (id && !player.wings.includes(id)) return false; player.wing = id; }
  else if (type === 'mount') { if (id && !player.mounts.includes(id)) return false; player.mount = id; }
  else if (type === 'pet') { if (id && !player.pets.includes(id)) return false; player.pet = id; }
  else if (type === 'fx') { if (id && !player.fxUnlocks.includes(id)) return false; player.fx = id; }
  else if (type === 'costume') {
    if (id && !player.costumes.includes(id)) return false;
    player.costume = id;
    player.costumeColors = id ? cosmeticColors(id) : null;
  }
  return true;
}

export function cosmeticColors(id) {
  const map = {
    costume_warden: ['#e8dfc8', '#c8a45c', '#3a3f54'],
    costume_ash: ['#3d2a2a', '#b65b47', '#241a1c'],
    costume_star: ['#2c2b4c', '#b9a2ff', '#16152a'],
    costume_royal: ['#5b1f26', '#e8c477', '#2a1114'],
  };
  return map[id] ?? null;
}

export function currentZone(player) { return getZone(player.zoneId); }

export function mountSpeed(player) {
  const m = player.mount ? MOUNTS[player.mount] : null;
  return m ? m.speed : 0;
}

export function randomHeroName(faction) {
  const list = RANDOM_NAMES[faction] ?? RANDOM_NAMES.angel;
  return list[Math.floor(Math.random() * list.length)];
}

export function defaultPlayer(opts) {
  return newPlayer({
    faction: 'angel', gender: 'female', classId: 'warrior', hair: 2,
    hairColor: 'silver', eyeColor: 'sapphire', outfit: 1, name: randomHeroName('angel'),
    ...opts,
  });
}

export function grantLootToPlayer(app, item) {
  const player = app.game.player;
  if (!addItem(player, item)) {
    const sold = sellValue(item);
    player.gold += sold;
    return { stored: false, sold };
  }
  return { stored: true, sold: 0 };
}

export function saveNow(immediate = false) {
  if (!App.game) return false;
  App.game.settings = App.settings;
  return saveGame(App.game, immediate);
}

export function fmt(n) { return formatNumber(n); }

export function totalEquippedScore(player) {
  return Object.values(player.equipment).reduce((s, it) => s + (it ? equipScore(it) : 0), 0);
}

export function gearSummary(player) {
  return SLOTS.map((s) => ({ slot: s.id, item: player.equipment[s.id] ?? null }));
}

export function playerDisplayClass(player) { return tx(CLASSES[player.classId].name); }

export function canLevelUpSkill() { return false; }

export { WINGS, SLOTS, getZone, ZONES };
