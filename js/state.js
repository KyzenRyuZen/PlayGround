import {
  GAME, CLASSES, FACTIONS, SLOTS, RARITIES, TIERS, DIRECT_DROPS, QUESTS, REGIONS,
  baseFor, makeItemKey, parseItemKey, itemInfo, itemValue, ITEM_BASES,
  PRICES, WINGS, FUSION,
} from './config.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function xpForLevel(level) {
  return Math.round(74 + level * 58 + Math.pow(level, 1.72) * 7);
}

export function createDefaultState(creation) {
  const cls = CLASSES[creation.classId] || CLASSES.dawnblade;
  const faction = FACTIONS[creation.faction] || FACTIONS.angel;
  const equipment = {};
  for (const slot of SLOTS) {
    const base = baseFor(cls.id, slot.key);
    equipment[slot.key] = makeItemKey(base.key, 'T3', 'common');
  }
  const starterRing = baseFor(cls.id, 'ring');
  const inventory = {};
  const invKey = makeItemKey(starterRing.key, 'T3', 'common');
  inventory[invKey] = 4; // Enough for the first fusion lesson.
  inventory[makeItemKey(baseFor(cls.id, 'gloves').key, 'T3', 'grey')] = 1;

  const state = {
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    profile: {
      name: (creation.name || 'Aetherborn').trim().slice(0, 18) || 'Aetherborn',
      faction: faction.id,
      classId: cls.id,
      gender: creation.gender || 'female',
      hairstyle: creation.hairstyle || 'flowing',
      hairColor: creation.hairColor || '#2a1b16',
      eyeColor: creation.eyeColor || '#8dd7ff',
      skinTone: creation.skinTone || '#f1d2b6',
      marking: creation.marking || 'none',
      title: 'Skybound',
    },
    level: 1,
    xp: 0,
    gold: 250,
    gems: 300,
    hp: 0,
    mana: 0,
    equipment,
    inventory,
    storage: {},
    materials: {},
    potions: { health: 3, mana: 2 },
    skillLevel: 1,
    wings: [],
    owned: { costumes: [], mounts: [], pets: [], effects: [], wings: [] },
    equipped: { costume: null, mount: null, pet: null, effect: null, wings: null },
    premiumUntil: 0,
    mounted: false,
    quests: {},
    trackedQuest: 'trial_greendale',
    bounties: {},
    visitedRegions: ['greendale'],
    // The offline build attunes every waystone so all eight realms can be explored.
    waypoints: Object.keys(REGIONS),
    bossDefeated: {},
    location: { regionId: 'greendale', x: REGIONS.greendale.village.x, y: REGIONS.greendale.village.y + 2 },
    market: [],
    stats: { kills: 0, bosses: 0, fusions: 0, quests: 0, deaths: 0, playSeconds: 0 },
    settings: { lighting: true, weather: true, screenShake: true, music: false, sfx: true },
    flags: { creationComplete: true, tutorialFusion: false, firstWing: false, sawMarketNotice: false },
    title: 'Skybound',
  };
  ensureQuest(state, 'greendale');
  syncVitals(state, true);
  return state;
}

export function ensureQuest(state, regionId) {
  const quest = QUESTS[regionId];
  if (!quest) return null;
  if (!state.quests[quest.id]) {
    state.quests[quest.id] = { status: 'active', kills: 0, boss: false, startedAt: Date.now() };
  }
  return state.quests[quest.id];
}

export function computeStats(state) {
  const cls = CLASSES[state.profile.classId] || CLASSES.dawnblade;
  let attack = cls.baseAttack + state.level * 2.1;
  let armor = cls.baseArmor + state.level * 1.3;
  let vitality = 0;
  let crit = cls.crit;
  for (const slot of SLOTS) {
    const key = state.equipment[slot.key];
    if (!key) continue;
    const stats = itemInfo(key).stats;
    attack += stats.attack;
    armor += stats.armor;
    vitality += stats.vitality;
    crit += stats.attack * 0.0008;
  }
  if (state.profile.faction === 'demon') attack *= 1.08;
  const premium = state.premiumUntil > Date.now();
  const maxHp = Math.round(cls.baseHp + state.level * 13 + vitality * 4.2);
  const maxMana = Math.round(cls.baseMana + state.level * 5 + vitality * 1.1);
  return {
    attack: Math.round(attack * 10) / 10,
    armor: Math.round(armor * 10) / 10,
    crit: clamp(crit, 0, 0.55),
    maxHp,
    maxMana,
    speed: cls.moveSpeed + (premium ? 0.03 : 0),
    power: Math.round(attack * 3 + armor * 2 + maxHp * 0.4),
    premium,
  };
}

export function syncVitals(state, full = false) {
  const stats = computeStats(state);
  state.hp = full ? stats.maxHp : clamp(state.hp == null ? stats.maxHp : state.hp, 0, stats.maxHp);
  state.mana = full ? stats.maxMana : clamp(state.mana == null ? stats.maxMana : state.mana, 0, stats.maxMana);
  return stats;
}

export function gainXp(state, amount) {
  const premium = state.premiumUntil > Date.now();
  const total = Math.round(amount * (premium ? 1.1 : 1));
  state.xp += total;
  const levels = [];
  while (state.level < GAME.maxLevel && state.xp >= xpForLevel(state.level)) {
    state.xp -= xpForLevel(state.level);
    state.level += 1;
    levels.push(state.level);
    const stats = computeStats(state);
    state.hp = stats.maxHp;
    state.mana = stats.maxMana;
  }
  return { total, levels };
}

export function inventoryList(state) {
  return Object.entries(state.inventory)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => ({ key, qty, ...itemInfo(key) }))
    .sort((a, b) => {
      const rarity = (RARITIES[b.rarity]?.power || 0) - (RARITIES[a.rarity]?.power || 0);
      if (rarity) return rarity;
      const tier = (TIERS[a.tier]?.order || 3) - (TIERS[b.tier]?.order || 3);
      if (tier) return tier;
      return a.name.localeCompare(b.name);
    });
}

export function addItem(state, key, qty = 1, allowOverflow = false) {
  if (!state.inventory[key] && Object.keys(state.inventory).length >= GAME.inventorySize && !allowOverflow) {
    return false;
  }
  state.inventory[key] = (state.inventory[key] || 0) + qty;
  return true;
}

export function removeItem(state, key, qty = 1) {
  if (!state.inventory[key] || state.inventory[key] < qty) return false;
  state.inventory[key] -= qty;
  if (state.inventory[key] <= 0) delete state.inventory[key];
  return true;
}

export function canEquip(state, key) {
  const info = itemInfo(key);
  // Weapons are inherently class-bound by base id; sanity check anyway.
  const allowed = Object.values(ITEM_BASES[state.profile.classId] || {}).some((b) => b.key === info.baseId);
  return allowed || !SLOTS.some((s) => s.key === info.slot);
}

export function equipItem(state, key) {
  if (!canEquip(state, key)) return { ok: false, reason: 'This relic answers to another calling.' };
  const info = itemInfo(key);
  if (!state.inventory[key]) return { ok: false, reason: 'That item is no longer in your satchel.' };
  const old = state.equipment[info.slot] || null;
  removeItem(state, key, 1);
  state.equipment[info.slot] = key;
  if (old) addItem(state, old, 1, true);
  syncVitals(state);
  return { ok: true, item: info, replaced: old ? itemInfo(old) : null };
}

export function unequipSlot(state, slot) {
  const key = state.equipment[slot];
  if (!key) return { ok: false, reason: 'Nothing is equipped there.' };
  if (!addItem(state, key, 1)) return { ok: false, reason: 'Your satchel is full.' };
  state.equipment[slot] = null;
  syncVitals(state);
  return { ok: true };
}

export function nextFusionFor(key) {
  const info = itemInfo(key);
  const { tier, rarity, baseId, name } = info;
  if (rarity === 'divine') return null;
  if (rarity === 'mythic') return { key: makeItemKey(baseId, 'T1', 'divine'), label: 'Divine', note: '4 matching Mythic' };
  if (rarity === 'legendary') return { key: makeItemKey(baseId, info.tier, 'mythic'), label: 'Mythic', note: '4 matching Legendary' };
  if (tier === 'T3') return { key: makeItemKey(baseId, 'T2', rarity), label: `${RARITIES[rarity].name} T2`, note: '4 identical T3' };
  if (tier === 'T2') return { key: makeItemKey(baseId, 'T1', rarity), label: `${RARITIES[rarity].name} T1`, note: '4 identical T2' };
  const next = RARITIES[rarity]?.next;
  if (!next || (next === 'legendary' && FUSION.purpleFusionCap)) {
    return { capped: true, reason: 'Purple T1 is the fusion cap. Legendary relics must be forged by a master blacksmith.' };
  }
  return { key: makeItemKey(baseId, 'T3', next), label: `${RARITIES[next].name} T3`, note: `4 identical ${RARITIES[rarity].name} T1` };
}

export function fuseItem(state, key) {
  if ((state.inventory[key] || 0) < 4) return { ok: false, reason: 'You need four identical pieces.' };
  const next = nextFusionFor(key);
  if (!next || next.capped) return { ok: false, reason: next?.reason || 'This relic cannot be fused further.' };
  removeItem(state, key, 4);
  addItem(state, next.key, 1, true);
  state.stats.fusions += 1;
  return { ok: true, result: itemInfo(next.key), next };
}

export function rollEquipmentDrop(state, tierKind = 'normal', rng = Math.random) {
  const chance = DIRECT_DROPS.equipmentChance[tierKind] ?? DIRECT_DROPS.equipmentChance.normal;
  if (rng() > chance) return null;
  const rarityRoll = rng() * 100;
  let acc = 0;
  let rarity = 'common';
  for (const entry of DIRECT_DROPS.rarityWeights) {
    acc += entry.chance;
    if (rarityRoll < acc) { rarity = entry.rarity; break; }
  }
  const slot = SLOTS[Math.floor(rng() * SLOTS.length)];
  const base = baseFor(state.profile.classId, slot.key);
  const key = makeItemKey(base.key, DIRECT_DROPS.directTier, rarity);
  return { key, info: itemInfo(key), slot: slot.key };
}

export function genericDropFor(state, rarity = 'common', tier = 'T3', slotKey = null, rng = Math.random) {
  const slot = slotKey ? SLOTS.find((s) => s.key === slotKey) : SLOTS[Math.floor(rng() * SLOTS.length)];
  const base = baseFor(state.profile.classId, slot.key);
  return makeItemKey(base.key, tier, rarity);
}

export function questProgress(state, regionId) {
  const q = QUESTS[regionId];
  if (!q) return null;
  const saved = state.quests[q.id];
  if (!saved) return { status: 'unavailable', kills: 0, boss: false, quest: q };
  return { ...saved, quest: q };
}

export function notifyKill(state, regionId, monsterId, isBoss = false) {
  const quest = QUESTS[regionId];
  if (!quest) return [];
  const saved = state.quests[quest.id];
  if (!saved || saved.status === 'claimed') return [];
  const updates = [];
  const killObj = quest.objectives.find((o) => o.type === 'kill');
  if (killObj && saved.kills < killObj.count) {
    saved.kills += 1;
    updates.push({ type: 'kill', text: `${killObj.label}: ${saved.kills}/${killObj.count}` });
  }
  const bossObj = quest.objectives.find((o) => o.type === 'boss');
  if (isBoss && bossObj && monsterId === bossObj.target) {
    saved.boss = true;
    updates.push({ type: 'boss', text: `${bossObj.label}` });
  }
  if (saved.kills >= (killObj?.count || 0) && (!bossObj || saved.boss)) {
    if (saved.status !== 'complete') {
      saved.status = 'complete';
      updates.push({ type: 'complete', text: 'Trial complete — claim your reward.' });
    }
  }
  return updates;
}

export function claimQuest(state, regionId) {
  const quest = QUESTS[regionId];
  if (!quest) return { ok: false, reason: 'No trial found.' };
  const saved = state.quests[quest.id];
  if (!saved || saved.status !== 'complete') return { ok: false, reason: 'The trial is not yet complete.' };
  saved.status = 'claimed';
  saved.claimedAt = Date.now();
  const r = quest.rewards;
  state.gold += r.gold;
  state.gems += r.gems;
  gainXp(state, r.xp);
  if (r.essence) state.materials[REGIONS[regionId].resource.id] = (state.materials[REGIONS[regionId].resource.id] || 0) + r.essence;
  const unlocked = [];
  if (r.wing || (!state.flags.firstWing && regionId === 'greendale')) {
    const wingId = state.profile.faction === 'angel' ? 'dawnfeather' : 'emberpinions';
    if (!state.wings.includes(wingId)) {
      state.wings.push(wingId);
      state.equipped.wings = wingId;
      state.flags.firstWing = true;
      unlocked.push(WINGS[wingId]);
    }
  }
  if (regionId === 'tower') {
    const finalWing = state.profile.faction === 'angel' ? 'sunspire' : 'voidstar';
    if (!state.wings.includes(finalWing)) {
      state.wings.push(finalWing);
      state.equipped.wings = finalWing;
      unlocked.push(WINGS[finalWing]);
    }
    state.title = 'Skybreaker';
    state.profile.title = 'Skybreaker';
  }
  state.stats.quests += 1;
  return { ok: true, rewards: r, unlocked };
}

export function bountyFor(regionId) {
  const region = REGIONS[regionId];
  if (!region) return null;
  return {
    id: `bounty_${regionId}`,
    region: regionId,
    title: `Bounty: ${region.name}`, giver: region.giver,
    intro: `Cull the threats around ${region.village.name} for the local wardens.`,
    objectives: [{ type: 'kill', count: 6, label: 'Creatures culled' }],
    rewards: { gold: Math.round(140 * (1 + region.level * 0.20)), gems: 12, xp: Math.round(110 * (1 + region.level * 0.22)) },
    repeatable: true,
  };
}

export function progressBounty(state, regionId, monsterId) {
  const region = REGIONS[regionId];
  if (!region) return null;
  const saved = state.bounties[regionId] || (state.bounties[regionId] = { kills: 0, completed: 0 });
  if (saved.kills >= 6) return null;
  saved.kills += 1;
  const done = saved.kills >= 6;
  return { saved, done };
}

export function claimBounty(state, regionId) {
  const region = REGIONS[regionId];
  const saved = state.bounties[regionId];
  if (!region || !saved || saved.kills < 6) return { ok: false };
  const bounty = bountyFor(regionId);
  saved.completed = (saved.completed || 0) + 1;
  saved.kills = 0;
  state.gold += bounty.rewards.gold;
  state.gems += bounty.rewards.gems;
  gainXp(state, bounty.rewards.xp);
  return { ok: true, rewards: bounty.rewards };
}

export function upgradeSkill(state) {
  if (state.skillLevel >= 10) return { ok: false, reason: 'Your calling is already perfected.' };
  const cost = Math.round(PRICES.skillUpgradeBase * Math.pow(state.skillLevel, 1.45));
  if (state.gold < cost) return { ok: false, reason: `You need ${cost - state.gold} more gold.` };
  state.gold -= cost;
  state.skillLevel += 1;
  return { ok: true, level: state.skillLevel, cost };
}

export function craftLegendary(state, slotKey) {
  const slot = SLOTS.find((s) => s.key === slotKey);
  if (!slot) return { ok: false, reason: 'No such equipment slot.' };
  const region = REGIONS[state.location?.regionId || 'greendale'] || REGIONS.greendale;
  const essenceId = region.resource.id;
  const essence = state.materials[essenceId] || 0;
  if (state.gold < PRICES.legendaryCraftGold) {
    return { ok: false, reason: `You need ${PRICES.legendaryCraftGold - state.gold} more gold.` };
  }
  if (essence < PRICES.legendaryCraftEssence) {
    return { ok: false, reason: `You need ${PRICES.legendaryCraftEssence - essence} more ${region.resource.name}.` };
  }
  state.gold -= PRICES.legendaryCraftGold;
  state.materials[essenceId] = essence - PRICES.legendaryCraftEssence;
  if (state.materials[essenceId] <= 0) delete state.materials[essenceId];
  const base = baseFor(state.profile.classId, slotKey);
  const key = makeItemKey(base.key, 'T3', 'legendary');
  addItem(state, key, 1, true);
  return { ok: true, key, info: itemInfo(key) };
}

export function toggleEquipOwned(state, category, id) {
  const map = { costumes: 'costume', mounts: 'mount', pets: 'pet', effects: 'effect', wings: 'wings' };
  const eqKey = map[category];
  if (!eqKey) return { ok: false };
  if (!state.owned[category]?.includes(id) && !(category === 'wings' && state.wings.includes(id))) {
    return { ok: false, reason: 'You do not own that yet.' };
  }
  if (state.equipped[eqKey] === id) {
    state.equipped[eqKey] = null;
    return { ok: true, equipped: false };
  }
  state.equipped[eqKey] = id;
  return { ok: true, equipped: true };
}

export function materialList(state, regionId) {
  const region = REGIONS[regionId];
  return state.materials[region.resource.id] || 0;
}

export function serialize(state) {
  state.updatedAt = Date.now();
  return JSON.stringify(state);
}

export function deserialize(raw) {
  if (!raw) return null;
  const state = JSON.parse(raw);
  if (!state || state.version !== 1 || !state.profile) throw new Error('Unknown save format');
  // Defensive fill for forward-compatible local saves.
  state.inventory ||= {};
  state.storage ||= {};
  state.market ||= [];
  state.materials ||= {};
  state.quests ||= {};
  state.bounties ||= {};
  state.owned ||= { costumes: [], mounts: [], pets: [], effects: [], wings: [] };
  state.equipped ||= { costume: null, mount: null, pet: null, effect: null, wings: null };
  state.settings ||= { lighting: true, weather: true, screenShake: true, music: false, sfx: true };
  state.flags ||= {};
  state.stats ||= {};
  state.mounted = !!state.mounted;
  // All waystones are available in this offline build, including older local saves.
  state.waypoints = Object.keys(REGIONS);
  ensureQuest(state || {}, state.location?.regionId || 'greendale');
  syncVitals(state);
  return state;
}

export class LocalSaveAdapter {
  constructor(key = GAME.saveKey) { this.key = key; }
  load() {
    try { return deserialize(localStorage.getItem(this.key)); }
    catch (error) { console.warn('[Aetheria] Save could not be read', error); return null; }
  }
  save(state) {
    try { localStorage.setItem(this.key, serialize(state)); return true; }
    catch (error) { console.warn('[Aetheria] Save failed', error); return false; }
  }
  clear() { localStorage.removeItem(this.key); }
}

/**
 * Reserved for the future authenticated game service.
 * This class intentionally does NOT simulate another player or a server.
 * It throws until a real secure endpoint and session token are configured.
 */
export class OnlineSaveAdapter {
  constructor(endpoint, getToken) { this.endpoint = endpoint; this.getToken = getToken; }
  async load() { throw new Error('Online services are not enabled in this offline build.'); }
  async save() { throw new Error('Online services are not enabled in this offline build.'); }
}

export const saveAdapter = new LocalSaveAdapter();

export function loadState() { return saveAdapter.load(); }
export function saveState(state) { return saveAdapter.save(state); }

export function healState(state, amount) {
  const stats = computeStats(state);
  state.hp = clamp(state.hp + amount, 0, stats.maxHp);
}
export function restoreMana(state, amount) {
  const stats = computeStats(state);
  state.mana = clamp(state.mana + amount, 0, stats.maxMana);
}
export function spendMana(state, amount) {
  if (state.mana < amount) return false;
  state.mana -= amount;
  return true;
}
export function addGold(state, amount) {
  const mult = state.premiumUntil > Date.now() ? 1.1 : 1;
  state.gold += Math.round(amount * mult);
}
