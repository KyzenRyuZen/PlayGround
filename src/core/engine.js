import { GAME, SHOP, BILLING } from '../config.js';
import { CLASSES } from '../data/classes.js';
import {
  RARITIES, RARITY_BY_ID, SLOT_KEYS, MATERIALS, AFFIX_POOL,
  upgradeChance, upgradeGoldCost, upgradeStoneCost, upgradeEmberCost,
  UPGRADE_DOWNGRADE_RISK, UPGRADE_BREAK_RISK, nextRarity, TEMPLATE_BY_ID,
} from '../data/items.js';
import { PETS, MOUNTS, COMPANIONS, COSTUMES, STONE_TYPES, STONE_GRADES, STONE_GRADE_BY_ID, STONE_AFFIXES, STONE_SOCKET_LEVELS, MAX_STONE_SOCKETS } from '../data/collections.js';
import { DAILY_CONTRACTS, MILESTONES } from '../data/quests.js';
import { DUNGEONS, DUNGEON_BY_ID, stageCoords } from '../data/monsters.js';
import { computeStats, xpMultiplier, goldMultiplier, baseMaterialState } from './stats.js';
import { generateItem, generateStone, itemScore, itemSellPrice, findItem, canEquipToClass, rollAffixes, makeAffix, stoneLabel, stonePower, stoneMainValue } from './items.js';
import { createStageMonster, createDungeonBoss } from './monsters.js';
import { rollKillRewards, rollDungeonRewards } from './loot.js';
import { createBattle, resetBattle, updateCombat } from './combat.js';
import {
  grantXp, ensureSkillUnlocks, ensureDaily, allocateStat, autoAllocatePoints,
  travelToStage, progressStageKill, trackDaily, dungeonAttemptsLeft, useDungeonAttempt,
  claimDaily, availableClaims, metricValue, stageKillsRequired, currentStageCleared,
} from './progression.js';
import { createNewGame, loadGame, saveGame, migrateState, exportSave, importSave } from './save.js';
import { simulateOffline } from './offline.js';
import { randInt, chance, weighted, pick, uid } from './rng.js';

const ENGINE = {
  state: null,
  battle: createBattle(),
  stats: null,
  started: false,
  offlineReport: null,
  listeners: new Map(),
  recentFeed: [],
  recentDrops: [],
  lastTick: 0,
  lastSave: 0,
  playAccum: 0,
  hiddenAt: 0,
  loopTimer: null,
  lifecycleBound: false,

  on(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
    return () => this.listeners.get(type)?.delete(fn);
  },
  emit(type, payload) {
    const set = this.listeners.get(type);
    if (set) for (const fn of [...set]) { try { fn(payload); } catch (e) { console.warn('listener error', type, e); } }
    const all = this.listeners.get('*');
    if (all) for (const fn of [...all]) { try { fn(type, payload); } catch {} }
  },
  notify(message, type = 'info') { this.emit('toast', { message, type }); },

  boot() {
    const loaded = loadGame();
    if (!loaded) return { loaded: false, state: null, offline: null };
    this.state = loaded;
    this.initRuntime();
    const awayMs = Math.max(0, Date.now() - (loaded.lastSeen || Date.now()));
    if (awayMs > 65000) {
      const report = simulateOffline(loaded, awayMs, Date.now());
      if (report) {
        for (const item of report.items) this.receiveItem(item, { silent: true, offline: true });
        this.offlineReport = report;
      }
    }
    this.state.lastSeen = Date.now();
    this.state.session = { startedAt: Date.now(), kills: 0, gold: 0, xp: 0, drops: 0 };
    this.state.hero.hp = this.stats.maxHp;
    this.state.hero.mp = this.stats.maxMp;
    this.recalc();
    saveGame(this.state);
    this.startLoop();
    return { loaded: true, state: this.state, offline: this.offlineReport };
  },

  createHero(classId = 'warrior', name = 'Kaelen') {
    this.state = createNewGame(classId, name);
    this.initRuntime();
    this.battle = resetBattle(this.battle, { mode: 'stage', spawnDelay: 0.7 });
    saveGame(this.state);
    this.startLoop();
    this.emit('newHero', this.state);
    this.notify(`${this.state.hero.name} the ${CLASSES[classId].name} enters the vale.`, 'success');
    return this.state;
  },

  initRuntime() {
    ensureDaily(this.state);
    ensureSkillUnlocks(this.state);
    this.stats = computeStats(this.state);
    this.state.stats.bestPower = Math.max(this.state.stats.bestPower || 0, this.stats.power);
    this.state.hero.hp = Math.min(Math.max(1, this.state.hero.hp), this.stats.maxHp);
    this.state.hero.mp = Math.min(Math.max(0, this.state.hero.mp), this.stats.maxMp);
    this.battle = resetBattle(this.battle, { mode: 'stage', spawnDelay: 0.8 });
    this.lastTick = performance.now();
    this.lastSave = Date.now();
    this.offlineReport = null;
    this.bindLifecycle();
  },

  bindLifecycle() {
    if (this.lifecycleBound) return;
    this.lifecycleBound = true;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.hiddenAt = Date.now();
          this.save();
        } else if (this.hiddenAt && this.state) {
          const away = Date.now() - this.hiddenAt;
          this.hiddenAt = 0;
          if (away > 65000) {
            const report = simulateOffline(this.state, away, Date.now());
            if (report) {
              for (const item of report.items) this.receiveItem(item, { silent: true, offline: true });
              this.offlineReport = report;
              this.emit('offline', report);
            }
            this.battle = resetBattle(this.battle, { mode: 'stage', spawnDelay: 1.2 });
            this.recalc();
            this.state.hero.hp = this.stats.maxHp;
          }
          this.lastTick = performance.now();
        }
      });
      window.addEventListener('beforeunload', () => this.save());
    }
  },

  startLoop() {
    if (this.loopTimer) return;
    this.started = true;
    this.lastTick = performance.now();
    this.loopTimer = setInterval(() => this.tick(), GAME.combatTickMs);
  },
  stopLoop() {
    if (this.loopTimer) clearInterval(this.loopTimer);
    this.loopTimer = null;
    this.started = false;
  },

  tick() {
    if (!this.state || !this.started) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const now = performance.now();
    let dt = (now - this.lastTick) / 1000;
    this.lastTick = now;
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(0.5, dt);
    this.stats = this.getStats();
    updateCombat(this.battle, this.state, {
      getStats: () => this.getStats(),
      spawnMonster: () => this.spawnMonster(),
      onMonsterKilled: (monster) => this.handleMonsterKilled(monster),
      onHeroDeath: (monster) => this.handleHeroDeath(monster),
      emit: (type, payload) => this.emit(type, payload),
      rng: Math.random,
    }, dt, now);
    this.stats = this.getStats();
    this.state.hero.hp = Math.min(this.state.hero.hp, this.stats.maxHp);
    this.state.hero.mp = Math.min(this.state.hero.mp, this.stats.maxMp);
    this.state.playSeconds = (this.state.playSeconds || 0) + dt;
    this.state.stats.playSeconds = (this.state.stats.playSeconds || 0) + dt;
    this.playAccum += dt;
    if (this.playAccum >= 3) {
      this.playAccum = 0;
      this.emit('heartbeat', this.state);
    }
    if (Date.now() - this.lastSave > GAME.autosaveMs) this.save(true);
  },

  getStats(force = false) {
    if (!this.state) return null;
    if (!this.stats || force) this.stats = computeStats(this.state, this.battle?.buffs);
    if (this.stats.power > (this.state.stats.bestPower || 0)) {
      this.state.stats.bestPower = this.stats.power;
    }
    return this.stats;
  },
  recalc() {
    this.stats = computeStats(this.state, this.battle?.buffs);
    this.state.hero.hp = Math.min(this.state.hero.hp, this.stats.maxHp);
    this.state.hero.mp = Math.min(this.state.hero.mp, this.stats.maxMp);
    if (this.state.hero.hp <= 0) this.state.hero.hp = Math.round(this.stats.maxHp * 0.65);
    if (this.stats.power > (this.state.stats.bestPower || 0)) this.state.stats.bestPower = this.stats.power;
    this.refreshDivineOwned();
    return this.stats;
  },

  save(quiet = false) {
    if (!this.state) return;
    const ok = saveGame(this.state);
    this.lastSave = Date.now();
    if (!quiet && !ok) this.notify('Save failed — storage may be full.', 'danger');
  },

  spawnMonster() {
    if (!this.state) return null;
    if (this.battle.mode === 'dungeon' && this.battle.dungeonId) {
      const dungeon = DUNGEON_BY_ID[this.battle.dungeonId];
      return dungeon ? createDungeonBoss(dungeon, this.state) : null;
    }
    return createStageMonster(this.state);
  },

  addFeed(text, kind = 'info') {
    const entry = { text, kind, at: Date.now() };
    this.recentFeed.unshift(entry);
    this.recentFeed = this.recentFeed.slice(0, 9);
    this.emit('feed', entry);
  },

  handleMonsterKilled(monster) {
    const state = this.state;
    const stats = this.getStats();
    const isDungeon = !!monster.isDungeon;
    const rewards = isDungeon ? rollDungeonRewards(state, DUNGEON_BY_ID[monster.dungeonId], stats) : rollKillRewards(state, monster, stats);
    state.hero.gold += rewards.gold;
    state.stats.goldEarned += rewards.gold;
    state.session.gold = (state.session.gold || 0) + rewards.gold;

    const xpResult = grantXp(state, rewards.xp);
    state.session.xp = (state.session.xp || 0) + rewards.xp;
    const afterStats = this.recalc();
    if (xpResult.leveled) {
      state.hero.hp = afterStats.maxHp;
      state.hero.mp = afterStats.maxMp;
      this.addFeed(`Level ${state.hero.level} reached — attributes and skill points gained.`, 'level');
      this.notify(`Level up! You are now level ${state.hero.level}.`, 'success');
      this.emit('levelup', { level: state.hero.level, result: xpResult });
    }

    state.stats.kills += 1;
    state.session.kills = (state.session.kills || 0) + 1;
    if (monster.isBoss) state.stats.bossKills += 1;
    if (monster.isMini) state.stats.bossKills += 1;
    if (monster.isStone) { state.stats.stoneKills += 1; trackDaily(state, 'stoneKills', 1); }
    trackDaily(state, 'kills', 1);
    if (monster.isBoss || monster.isMini) trackDaily(state, 'bossKills', 1);
    trackDaily(state, 'goldEarned', rewards.gold);

    const itemNames = [];
    for (const item of rewards.items) {
      const res = this.receiveItem(item, { source: monster.name });
      if (res.item) itemNames.push(res.item.name);
    }
    for (const stone of rewards.stones) this.receiveStone(stone);
    for (const [key, amount] of Object.entries(rewards.materials || {})) {
      if (amount > 0) state.hero.materials[key] = (state.hero.materials[key] || 0) + amount;
    }
    if (rewards.extras) this.applyExtras(rewards.extras);

    state.session.drops = (state.session.drops || 0) + rewards.items.length + rewards.stones.length;
    this.addFeed(`Slain ${monster.name} · +${rewards.xp} XP · +${rewards.gold}g`, monster.isBoss ? 'boss' : 'kill');
    if (itemNames.length) this.addFeed(`Loot: ${itemNames.slice(0, 2).join(', ')}${itemNames.length > 2 ? '…' : ''}`, 'loot');
    this.emit('loot', { monster, rewards });
    this.emit('killRewards', { monster, rewards, xpResult });

    if (isDungeon) {
      state.stats.dungeonClears += 1;
      trackDaily(state, 'dungeonClears', 1);
      state.hero.hp = Math.max(state.hero.hp, Math.round(this.stats.maxHp * 0.5));
      this.addFeed(`Dungeon conquered: ${DUNGEON_BY_ID[monster.dungeonId].name}`, 'boss');
      this.emit('dungeonClear', { dungeon: DUNGEON_BY_ID[monster.dungeonId], rewards, monster });
      this.save(true);
      return { endBattle: true, respawnDelay: 4 };
    }

    const progress = progressStageKill(state);
    if (progress.clearedNow) {
      this.addFeed(`Stage cleared — ${progress.cleared.region.name}, stage ${progress.cleared.stage}.`, 'clear');
      this.emit('stageClear', progress);
      if (progress.regionUnlocked) {
        this.notify(`New region unlocked: ${stageCoords(this.state.progress.currentIndex).region.name}.`, 'success');
      } else if (progress.next) {
        this.notify(`Stage cleared. Advancing to stage ${stageCoords(progress.next).stage}.`, 'success');
      } else {
        this.notify('Stage cleared. Select the next stage from the world map.', 'success');
      }
    }
    state.stats.bestUpgrade = Math.max(state.stats.bestUpgrade || 0, 0);
    this.save(true);
    return {};
  },

  handleHeroDeath(monster) {
    const state = this.state;
    state.stats.deaths += 1;
    this.addFeed(`${state.hero.name} fell to ${monster.name}. Reviving…`, 'danger');
    if (this.battle.mode === 'dungeon') {
      const dungeon = DUNGEON_BY_ID[this.battle.dungeonId];
      this.notify(`The dungeon repels you. ${dungeon?.name || 'Expedition'} failed.`, 'danger');
      this.emit('dungeonFail', { dungeon });
      this.battle.mode = 'stage';
      this.battle.dungeonId = null;
      this.battle.spawnTimer = 2.5;
    } else {
      this.notify('You were defeated. Reviving at the hunt.', 'danger');
    }
    this.save(true);
  },

  receiveItem(item, opts = {}) {
    if (!item) return { ok: false };
    this.state.stats.itemsFound = (this.state.stats.itemsFound || 0) + 1;
    if (item.rarity === 'divine') this.refreshDivineOwned(item);
    if (this.state.hero.autoSellCommon && item.rarity === 'common' && !item.locked) {
      const price = itemSellPrice(item);
      this.state.hero.gold += price;
      this.state.stats.goldEarned += price;
      if (!opts.silent) this.addFeed(`Auto-sold ${item.name} for ${price}g.`, 'gold');
      this.emit('item', { item, equipped: false, returned: { sold: true, price }, autoSold: true });
      this.recalc();
      return { ok: true, item, equipped: false, sold: true, price };
    }
    const current = this.state.hero.equipment[item.slot];
    const canEquip = canEquipToClass(item, this.state.hero.classId);
    let equipped = false;
    let returned = null;
    if (this.state.hero.autoEquip && canEquip && itemScore(item) > itemScore(current)) {
      this.state.hero.equipment[item.slot] = item;
      equipped = true;
      if (current) returned = this.pushInventory(current, { quiet: true });
    } else {
      returned = this.pushInventory(item, { quiet: opts.silent });
    }
    this.recentDrops.unshift(item);
    this.recentDrops = this.recentDrops.slice(0, 18);
    const rar = RARITY_BY_ID[item.rarity];
    if (!opts.silent) {
      if (equipped) {
        this.notify(`Equipped ${item.name} (+${itemScore(item)} power).`, 'success');
        this.addFeed(`Equipped ${item.name}.`, 'loot');
      } else if (rar.index >= 2) {
        this.notify(`${rar.name} item found: ${item.name}.`, 'loot', rar.id);
      }
    }
    this.emit('item', { item, equipped, returned });
    this.recalc();
    return { ok: true, item, equipped, returned };
  },

  pushInventory(item, opts = {}) {
    if (!item) return null;
    if (this.state.hero.inventory.length >= this.state.hero.capacity) {
      const junk = this.state.hero.inventory
        .filter(i => !i.locked)
        .sort((a, b) => itemScore(a) - itemScore(b))[0];
      const autoSell = junk && RARITY_BY_ID[junk.rarity].index <= RARITY_BY_ID[item.rarity].index;
      if (autoSell) {
        this.state.hero.inventory = this.state.hero.inventory.filter(i => i.id !== junk.id);
        const price = itemSellPrice(junk);
        this.state.hero.gold += price;
        this.state.stats.goldEarned += price;
        if (!opts.quiet) this.addFeed(`Satchel full — sold ${junk.name} for ${price}g.`, 'gold');
      } else {
        const price = itemSellPrice(item);
        this.state.hero.gold += price;
        this.state.stats.goldEarned += price;
        if (!opts.quiet) this.notify(`Satchel full. ${item.name} converted to ${price} gold.`, 'info');
        return { sold: true, price };
      }
    }
    this.state.hero.inventory.push(item);
    return { sold: false };
  },

  receiveStone(stone) {
    if (!stone) return;
    if (this.state.hero.stones.owned.length >= GAME.maxStones) {
      this.state.hero.materials.stoneDust = (this.state.hero.materials.stoneDust || 0) + 8;
      this.addFeed('Stone vault full — converted to 8 Stone Dust.', 'gold');
      return;
    }
    this.state.hero.stones.owned.push(stone);
    const gradeIndex = STONE_GRADES.findIndex(g => g.id === stone.grade);
    if (gradeIndex >= 2) this.notify(`${stoneLabel(stone)} found.`, 'loot');
    this.emit('stone', { stone });
  },

  refreshDivineOwned() {
    let count = 0;
    for (const item of [this.state.hero.inventory, Object.values(this.state.hero.equipment)]) {
      const arr = Array.isArray(item) ? item : Object.values(item || {});
      for (const it of arr) if (it?.rarity === 'divine') count++;
    }
    if (count > 0) this.state.stats.divineOwned = Math.max(this.state.stats.divineOwned || 0, count);
  },

  applyExtras(extras) {
    if (extras.pet) {
      const owned = this.state.hero.pets.owned[extras.pet];
      if (owned) {
        this.state.hero.materials.petEssence = (this.state.hero.materials.petEssence || 0) + 20;
        this.notify(`${PETS[extras.pet].name} already bound — +20 Pet Essence.`, 'info');
      } else {
        this.state.hero.pets.owned[extras.pet] = { level: 1 };
        if (!this.state.hero.pets.active) this.state.hero.pets.active = extras.pet;
        this.notify(`New pet: ${PETS[extras.pet].name}!`, 'success');
      }
    }
    if (extras.mount) {
      const owned = this.state.hero.mounts.owned[extras.mount];
      if (owned) {
        this.state.hero.materials.mountFeed = (this.state.hero.materials.mountFeed || 0) + 15;
        this.notify(`${MOUNTS[extras.mount].name} already tamed — +15 Mount Feed.`, 'info');
      } else {
        this.state.hero.mounts.owned[extras.mount] = { level: 1 };
        if (!this.state.hero.mounts.active) this.state.hero.mounts.active = extras.mount;
        this.notify(`New mount: ${MOUNTS[extras.mount].name}!`, 'success');
      }
    }
    if (extras.costume) {
      if (!this.state.hero.costumes.owned.includes(extras.costume)) {
        this.state.hero.costumes.owned.push(extras.costume);
        this.notify(`Costume found: ${COSTUMES[extras.costume].name}!`, 'success');
      }
    }
  },

  /* ---------- player actions ------------------------------------------ */

  equipItem(itemId) {
    const found = findItem(this.state, itemId);
    if (!found || found.equipped) return { ok: false, message: 'Item not found in satchel.' };
    const { item } = found;
    if (!canEquipToClass(item, this.state.hero.classId)) return { ok: false, message: `Only a ${CLASSES[item.classReq]?.name || 'another class'} can wield this.` };
    this.state.hero.inventory = this.state.hero.inventory.filter(i => i.id !== itemId);
    const current = this.state.hero.equipment[item.slot];
    this.state.hero.equipment[item.slot] = item;
    if (current) this.pushInventory(current, { quiet: true });
    this.recalc();
    this.save(true);
    this.notify(`Equipped ${item.name}.`, 'success');
    this.emit('equipmentChanged', { item });
    return { ok: true, item };
  },

  unequipSlot(slot) {
    const item = this.state.hero.equipment[slot];
    if (!item) return { ok: false };
    if (this.state.hero.inventory.length >= this.state.hero.capacity) {
      this.notify('Satchel is full. Sell something first.', 'danger');
      return { ok: false, message: 'Satchel full' };
    }
    this.state.hero.equipment[slot] = null;
    this.state.hero.inventory.push(item);
    this.recalc();
    this.save(true);
    this.notify(`Unequipped ${item.name}.`, 'info');
    this.emit('equipmentChanged', { item });
    return { ok: true, item };
  },

  sellItem(itemId) {
    const found = findItem(this.state, itemId);
    if (!found || found.equipped) return { ok: false, message: 'Equipped items cannot be sold.' };
    if (found.item.locked) return { ok: false, message: 'Unlock the item first.' };
    const price = itemSellPrice(found.item);
    this.state.hero.inventory = this.state.hero.inventory.filter(i => i.id !== itemId);
    this.state.hero.gold += price;
    this.state.stats.goldEarned += price;
    this.save(true);
    this.notify(`Sold ${found.item.name} for ${price} gold.`, 'info');
    return { ok: true, price, item: found.item };
  },

  sellJunk(maxRarity = 'epic') {
    const maxIndex = RARITY_BY_ID[maxRarity]?.index ?? 2;
    const junk = this.state.hero.inventory.filter(i => !i.locked && RARITY_BY_ID[i.rarity].index <= maxIndex && !i.upgrade);
    if (!junk.length) return { ok: false, message: 'Nothing to sell.' };
    let total = 0;
    for (const item of junk) total += itemSellPrice(item);
    const ids = new Set(junk.map(i => i.id));
    this.state.hero.inventory = this.state.hero.inventory.filter(i => !ids.has(i.id));
    this.state.hero.gold += total;
    this.state.stats.goldEarned += total;
    this.save(true);
    this.notify(`Sold ${junk.length} items for ${total} gold.`, 'success');
    return { ok: true, count: junk.length, gold: total };
  },

  toggleLock(itemId) {
    const found = findItem(this.state, itemId);
    if (!found) return { ok: false };
    found.item.locked = !found.item.locked;
    this.save(true);
    return { ok: true, locked: found.item.locked };
  },

  allocate(stat, amount = 1) {
    if (!allocateStat(this.state, stat, amount)) return { ok: false, message: 'No attribute points available.' };
    this.recalc();
    this.save(true);
    return { ok: true };
  },

  setAutoAllocate(value) {
    this.state.hero.autoAllocate = !!value;
    if (value) autoAllocatePoints(this.state, this.state.hero.statPoints);
    this.recalc();
    this.save(true);
    return { ok: true };
  },

  upgradeSkill(skillId) {
    const cls = CLASSES[this.state.hero.classId];
    const skill = cls.skills.find(s => s.id === skillId);
    if (!skill) return { ok: false };
    const current = this.state.hero.skills[skillId] || 0;
    if (current <= 0) return { ok: false, message: `Unlocks at level ${skill.unlock}.` };
    if (current >= 20) return { ok: false, message: 'Skill is already master rank.' };
    if (this.state.hero.skillPoints < 1) return { ok: false, message: 'No skill points available.' };
    const cost = Math.round(160 * Math.pow(current, 1.55) + 80 * current);
    if (this.state.hero.gold < cost) return { ok: false, message: `Requires ${cost} gold.` };
    this.state.hero.gold -= cost;
    this.state.hero.skillPoints -= 1;
    this.state.hero.skills[skillId] = current + 1;
    this.save(true);
    this.notify(`${skill.name} reached rank ${current + 1}.`, 'success');
    return { ok: true, level: current + 1, cost };
  },

  upgradeItem(itemId, useProtection = false) {
    const found = findItem(this.state, itemId);
    if (!found) return { ok: false, message: 'Item not found.' };
    const item = found.item;
    if (item.upgrade >= GAME.maxItemUpgrade) return { ok: false, message: 'Already at maximum upgrade.' };
    const level = item.upgrade;
    const gold = upgradeGoldCost(item.ilvl, level);
    const stones = upgradeStoneCost(item.ilvl, level);
    const embers = upgradeEmberCost(level);
    const mat = this.state.hero.materials;
    if (this.state.hero.gold < gold) return { ok: false, message: 'Not enough gold.' };
    if ((mat.upgradeStone || 0) < stones) return { ok: false, message: 'Not enough Upgrade Stones.' };
    if (embers > 0 && (mat.ember || 0) < embers) return { ok: false, message: 'Not enough Celestial Embers.' };
    if (useProtection && (mat.protection || 0) < 1) return { ok: false, message: 'No Protection Scroll available.' };

    this.state.hero.gold -= gold;
    mat.upgradeStone -= stones;
    if (embers) mat.ember -= embers;
    if (useProtection) mat.protection -= 1;
    this.state.stats.upgrades = (this.state.stats.upgrades || 0) + 1;
    trackDaily(this.state, 'upgrades', 1);

    const target = level + 1;
    const success = Math.random() < upgradeChance(level);
    this.emit('forge', { stage: 'attempt', itemId, target });
    if (success) {
      item.upgrade = target;
      this.state.stats.bestUpgrade = Math.max(this.state.stats.bestUpgrade || 0, target);
      this.recalc();
      this.save(true);
      this.notify(`${item.name} upgraded to +${target}.`, 'success');
      this.addFeed(`Forge success: ${item.name} → +${target}.`, 'forge');
      this.emit('forge', { stage: 'success', itemId, item, target });
      return { ok: true, success: true, level: target, item };
    }

    let broke = false;
    let downgraded = false;
    if (!useProtection) {
      const breakRisk = UPGRADE_BREAK_RISK[target] || 0;
      const downRisk = UPGRADE_DOWNGRADE_RISK[target] || 0;
      if (Math.random() < breakRisk) {
        broke = true;
        if (found.equipped) this.state.hero.equipment[item.slot] = null;
        else this.state.hero.inventory = this.state.hero.inventory.filter(i => i.id !== item.id);
      } else if (Math.random() < downRisk && item.upgrade > 0) {
        item.upgrade -= 1;
        downgraded = true;
      }
    }
    this.recalc();
    this.save(true);
    this.addFeed(`Forge failed on ${item.name}${broke ? ' — the item shattered.' : downgraded ? ' — downgraded.' : ' — protected.'}`, 'danger');
    if (broke) {
      this.notify(`${item.name} shattered. The forge demands more than gold.`, 'danger');
      this.emit('forge', { stage: 'break', itemId, item });
    } else if (downgraded) {
      this.notify(`Upgrade failed. ${item.name} is now +${item.upgrade}.`, 'danger');
      this.emit('forge', { stage: 'downgrade', itemId, item });
    } else {
      this.notify(useProtection ? 'Upgrade failed, but the Protection Scroll held.' : 'Upgrade failed. Nothing was lost.', 'info');
      this.emit('forge', { stage: 'fail', itemId, item });
    }
    return { ok: true, success: false, broke, downgraded, item, level: item.upgrade };
  },

  enchantAdd(itemId) {
    const found = findItem(this.state, itemId);
    if (!found) return { ok: false };
    const item = found.item;
    if ((item.affixes?.length || 0) >= 5) return { ok: false, message: 'This item already carries five bonuses.' };
    const gold = 420 + item.ilvl * 26;
    if ((this.state.hero.materials.enchant || 0) < 1) return { ok: false, message: 'An Enchant Scroll is required.' };
    if (this.state.hero.gold < gold) return { ok: false, message: `Requires ${gold} gold.` };
    this.state.hero.gold -= gold;
    this.state.hero.materials.enchant -= 1;
    const existing = (item.affixes || []).map(a => a.stat);
    const affix = rollAffixes(item.ilvl, item.rarity, 1, Math.random, existing)[0];
    if (!affix) return { ok: false, message: 'No valid bonus could be added.' };
    item.affixes = item.affixes || [];
    item.affixes.push(affix);
    this.recalc();
    this.save(true);
    this.notify(`New bonus added: ${affix.stat} +${affix.value}.`, 'success');
    return { ok: true, affix, cost: gold };
  },

  rerollAffixes(itemId) {
    const found = findItem(this.state, itemId);
    if (!found) return { ok: false };
    const item = found.item;
    if (!item.affixes?.length) return { ok: false, message: 'This item has no random bonuses to reroll.' };
    const gold = 300 + item.ilvl * 18;
    if ((this.state.hero.materials.chaos || 0) < 1) return { ok: false, message: 'A Chaos Orb is required.' };
    if (this.state.hero.gold < gold) return { ok: false, message: `Requires ${gold} gold.` };
    this.state.hero.gold -= gold;
    this.state.hero.materials.chaos -= 1;
    item.affixes = rollAffixes(item.ilvl, item.rarity, item.affixes.length);
    this.recalc();
    this.save(true);
    this.notify('Random bonuses reforged.', 'success');
    return { ok: true, affixes: item.affixes, cost: gold };
  },

  improveAffix(itemId, index) {
    const found = findItem(this.state, itemId);
    if (!found) return { ok: false };
    const item = found.item;
    const affix = item.affixes?.[index];
    if (!affix) return { ok: false };
    if ((affix.forged || 0) >= GAME.maxAffixForges) return { ok: false, message: 'This bonus is fully tempered.' };
    const gold = 200 + item.ilvl * 12;
    if ((this.state.hero.materials.blessing || 0) < 1) return { ok: false, message: 'Blessing Dust is required.' };
    if (this.state.hero.gold < gold) return { ok: false, message: `Requires ${gold} gold.` };
    this.state.hero.gold -= gold;
    this.state.hero.materials.blessing -= 1;
    affix.value = Math.round(affix.value * 1.08 * 10) / 10;
    affix.forged = (affix.forged || 0) + 1;
    this.recalc();
    this.save(true);
    this.notify(`Bonus tempered (${affix.forged}/${GAME.maxAffixForges}).`, 'success');
    return { ok: true, affix, cost: gold };
  },

  fuseItems(itemId) {
    const base = this.state.hero.inventory.find(i => i.id === itemId);
    if (!base) return { ok: false, message: 'Select an item from your satchel.' };
    if (base.upgrade > 0) return { ok: false, message: 'Only +0 items can be fused.' };
    const next = nextRarity(base.rarity);
    if (!next) return { ok: false, message: 'Divine items cannot be fused further.' };
    const copies = this.state.hero.inventory.filter(i => i.templateId === base.templateId && i.rarity === base.rarity && i.upgrade === 0);
    if (copies.length < 4) return { ok: false, message: `Need 4 identical items (${copies.length}/4).` };
    const cost = Math.round((650 + base.ilvl * 70) * Math.pow(RARITY_BY_ID[base.rarity].index + 1, 1.5));
    if (this.state.hero.gold < cost) return { ok: false, message: `Requires ${cost} gold.` };
    const chosen = [base, ...copies.filter(i => i.id !== base.id).slice(0, 3)];
    const ids = new Set(chosen.map(i => i.id));
    this.state.hero.gold -= cost;
    this.state.hero.inventory = this.state.hero.inventory.filter(i => !ids.has(i.id));
    const result = generateItem({
      ilvl: Math.max(...chosen.map(i => i.ilvl)),
      rarity: next.id,
      classId: this.state.hero.classId,
      templateId: base.templateId,
      theme: base.theme,
      source: 'fusion',
    });
    this.pushInventory(result, { quiet: true });
    this.state.stats.fusions = (this.state.stats.fusions || 0) + 1;
    if (next.index >= 3) this.state.stats.legendaryFusions = (this.state.stats.legendaryFusions || 0) + 1;
    if (next.index >= 4) this.state.stats.mythicFusions = (this.state.stats.mythicFusions || 0) + 1;
    this.refreshDivineOwned();
    this.recalc();
    this.save(true);
    this.notify(`Fusion complete: ${result.name}.`, 'success');
    this.addFeed(`Fusion: four ${RARITY_BY_ID[base.rarity].name} items became ${next.name}.`, 'forge');
    this.emit('fusion', { result, next });
    return { ok: true, item: result, cost, next };
  },

  /* ---------- companions ---------------------------------------------- */

  equipPet(id) {
    if (!this.state.hero.pets.owned[id]) return { ok: false };
    this.state.hero.pets.active = this.state.hero.pets.active === id ? null : id;
    this.recalc();
    this.save(true);
    return { ok: true, active: this.state.hero.pets.active };
  },
  equipMount(id) {
    if (!this.state.hero.mounts.owned[id]) return { ok: false };
    this.state.hero.mounts.active = this.state.hero.mounts.active === id ? null : id;
    this.recalc();
    this.save(true);
    return { ok: true, active: this.state.hero.mounts.active };
  },
  equipCompanion(id) {
    if (!this.state.hero.companions.owned[id]) return { ok: false };
    this.state.hero.companions.active = this.state.hero.companions.active === id ? null : id;
    this.recalc();
    this.save(true);
    return { ok: true, active: this.state.hero.companions.active };
  },

  levelCollection(kind, id) {
    const map = { pet: PETS, mount: MOUNTS, companion: COMPANIONS }[kind];
    const bucket = kind === 'pet' ? this.state.hero.pets : kind === 'mount' ? this.state.hero.mounts : this.state.hero.companions;
    const data = map?.[id];
    const owned = bucket?.owned[id];
    if (!data || !owned) return { ok: false, message: 'Not yet collected.' };
    if (owned.level >= 20) return { ok: false, message: 'Already at max level.' };
    const rar = RARITY_BY_ID[data.rarity] || RARITY_BY_ID.common;
    const material = kind === 'pet' ? 'petEssence' : kind === 'mount' ? 'mountFeed' : 'soulEmber';
    const matCost = 2 + owned.level * 2 + rar.index * 2;
    const goldCost = Math.round((260 + owned.level * 170) * (1 + rar.index * 0.35));
    if ((this.state.hero.materials[material] || 0) < matCost) return { ok: false, message: `Requires ${matCost} ${MATERIALS[material].name}.` };
    if (this.state.hero.gold < goldCost) return { ok: false, message: `Requires ${goldCost} gold.` };
    this.state.hero.materials[material] -= matCost;
    this.state.hero.gold -= goldCost;
    owned.level += 1;
    this.recalc();
    this.save(true);
    this.notify(`${data.name} reached level ${owned.level}.`, 'success');
    return { ok: true, level: owned.level, goldCost, matCost };
  },

  summonEgg(kind = 'pet') {
    const costs = { pet: 2500, mount: 9000, companion: 6500 };
    const map = { pet: PETS, mount: MOUNTS, companion: COMPANIONS }[kind];
    const cost = costs[kind];
    if (this.state.hero.gold < cost) return { ok: false, message: `Requires ${cost} gold.` };
    this.state.hero.gold -= cost;
    const entries = Object.values(map).map(d => ({ ...d, weight: d.eggWeight || (10 - (RARITY_BY_ID[d.rarity]?.index || 0) * 1.6) }));
    const result = weighted(entries);
    const bucket = kind === 'pet' ? this.state.hero.pets : kind === 'mount' ? this.state.hero.mounts : this.state.hero.companions;
    if (bucket.owned[result.id]) {
      const mat = kind === 'pet' ? 'petEssence' : kind === 'mount' ? 'mountFeed' : 'soulEmber';
      this.state.hero.materials[mat] = (this.state.hero.materials[mat] || 0) + 15;
      this.notify(`${result.name} already bound — 15 ${MATERIALS[mat].name}.`, 'info');
    } else {
      bucket.owned[result.id] = { level: 1 };
      if (!bucket.active) bucket.active = result.id;
      this.notify(`Summoned ${result.name} (${RARITY_BY_ID[result.rarity].name}).`, 'success');
    }
    this.recalc();
    this.save(true);
    this.emit('summon', { kind, result });
    return { ok: true, result, cost, duplicate: !!bucket.owned[result.id] };
  },

  /* ---------- costumes / stones --------------------------------------- */

  buyCostume(id) {
    const costume = COSTUMES[id];
    if (!costume) return { ok: false };
    if (this.state.hero.costumes.owned.includes(id)) return { ok: false, message: 'Already owned.' };
    if (costume.priceCoins) {
      if (this.state.hero.premiumCoins < costume.priceCoins) return { ok: false, message: 'Not enough premium coins.' };
      this.state.hero.premiumCoins -= costume.priceCoins;
    } else {
      if (this.state.hero.gold < costume.priceGold) return { ok: false, message: 'Not enough gold.' };
      this.state.hero.gold -= costume.priceGold;
    }
    this.state.hero.costumes.owned.push(id);
    this.recalc();
    this.save(true);
    this.notify(`${costume.name} added to your wardrobe.`, 'success');
    return { ok: true, costume };
  },

  equipCostume(id) {
    const costume = COSTUMES[id];
    if (!costume) return { ok: false };
    if (!this.state.hero.costumes.owned.includes(id)) return { ok: false, message: 'Not owned.' };
    const eq = this.state.hero.costumes.equipped;
    eq[costume.slot] = eq[costume.slot] === id ? null : id;
    this.recalc();
    this.save(true);
    this.emit('costumeChanged', { id, slot: costume.slot });
    return { ok: true, equipped: eq[costume.slot] === id };
  },

  stoneSocketUnlocked(index) {
    return this.state.hero.level >= (STONE_SOCKET_LEVELS[index] || 1);
  },

  equipStone(stoneId, socketIndex = null) {
    const stone = this.state.hero.stones.owned.find(s => s.id === stoneId);
    if (!stone) return { ok: false };
    const sockets = this.state.hero.stones.equipped;
    let index = socketIndex;
    if (index == null) index = sockets.findIndex((s, i) => !s && this.stoneSocketUnlocked(i));
    if (index == null || index < 0 || index >= MAX_STONE_SOCKETS) return { ok: false, message: 'All sockets are occupied.' };
    if (!this.stoneSocketUnlocked(index)) return { ok: false, message: `Socket unlocks at level ${STONE_SOCKET_LEVELS[index]}.` };
    for (let i = 0; i < sockets.length; i++) if (sockets[i] === stoneId) sockets[i] = null;
    sockets[index] = stoneId;
    this.recalc();
    this.save(true);
    this.notify(`${stoneLabel(stone)} set in socket ${index + 1}.`, 'success');
    return { ok: true };
  },

  unequipStone(index) {
    if (!this.state.hero.stones.equipped[index]) return { ok: false };
    this.state.hero.stones.equipped[index] = null;
    this.recalc();
    this.save(true);
    return { ok: true };
  },

  levelStone(stoneId) {
    const stone = this.state.hero.stones.owned.find(s => s.id === stoneId);
    if (!stone) return { ok: false };
    const grade = STONE_GRADE_BY_ID[stone.grade];
    if (stone.level >= grade.maxLevel) return { ok: false, message: 'Maximum level for this grade. Ascend it to grow further.' };
    const dust = 4 + stone.level * 3;
    const gold = 120 + stone.level * 90;
    if ((this.state.hero.materials.stoneDust || 0) < dust) return { ok: false, message: `Requires ${dust} Stone Dust.` };
    if (this.state.hero.gold < gold) return { ok: false, message: `Requires ${gold} gold.` };
    this.state.hero.materials.stoneDust -= dust;
    this.state.hero.gold -= gold;
    stone.level += 1;
    this.recalc();
    this.save(true);
    this.notify(`${stoneLabel(stone)} reached level ${stone.level}.`, 'success');
    return { ok: true };
  },

  rerollStone(stoneId) {
    const stone = this.state.hero.stones.owned.find(s => s.id === stoneId);
    if (!stone) return { ok: false };
    const dust = 7 + stone.level * 2;
    const gold = 200 + stone.level * 55;
    if ((this.state.hero.materials.stoneDust || 0) < dust) return { ok: false, message: `Requires ${dust} Stone Dust.` };
    if (this.state.hero.gold < gold) return { ok: false, message: `Requires ${gold} gold.` };
    this.state.hero.materials.stoneDust -= dust;
    this.state.hero.gold -= gold;
    const def = weighted(STONE_AFFIXES);
    const grade = STONE_GRADE_BY_ID[stone.grade];
    let value = (def.base + def.perLevel * stone.level) * grade.mult * (0.75 + Math.random() * 0.5);
    value = def.stat === 'critChance' || def.stat === 'attackSpeed' || def.stat === 'lifesteal' || def.stat.startsWith('resist') || def.stat === 'monsterDamage' || def.stat === 'bossDamage' || def.stat === 'goldFind' || def.stat === 'lootFind'
      ? Math.round(value * 10) / 10 : Math.round(value);
    stone.affix = { stat: def.stat, value: Math.max(0.1, value) };
    this.recalc();
    this.save(true);
    this.notify('Stone echoes reshaped.', 'success');
    return { ok: true, stone };
  },

  ascendStone(stoneId) {
    const stone = this.state.hero.stones.owned.find(s => s.id === stoneId);
    if (!stone) return { ok: false };
    const gradeIndex = STONE_GRADES.findIndex(g => g.id === stone.grade);
    const grade = STONE_GRADES[gradeIndex];
    if (stone.level < grade.maxLevel) return { ok: false, message: `Reach level ${grade.maxLevel} before ascending.` };
    if (gradeIndex >= STONE_GRADES.length - 1) return { ok: false, message: 'Royal stones cannot ascend further.' };
    const fuel = this.state.hero.stones.owned.filter(s => s.id !== stone.id && s.type === stone.type && s.grade === stone.grade);
    if (fuel.length < 2) return { ok: false, message: 'Requires 2 more stones of the same type and grade.' };
    const dust = 30 + gradeIndex * 20;
    if ((this.state.hero.materials.stoneDust || 0) < dust) return { ok: false, message: `Requires ${dust} Stone Dust.` };
    const fuelIds = fuel.slice(0, 2).map(s => s.id);
    this.state.hero.materials.stoneDust -= dust;
    this.state.hero.stones.owned = this.state.hero.stones.owned.filter(s => !fuelIds.includes(s.id));
    for (let i = 0; i < this.state.hero.stones.equipped.length; i++) {
      if (fuelIds.includes(this.state.hero.stones.equipped[i])) this.state.hero.stones.equipped[i] = null;
    }
    stone.grade = STONE_GRADES[gradeIndex + 1].id;
    stone.level = 1;
    const def = weighted(STONE_AFFIXES);
    const ng = STONE_GRADES[gradeIndex + 1];
    let value = (def.base + def.perLevel) * ng.mult * (0.8 + Math.random() * 0.4);
    value = Math.round(value * 10) / 10;
    stone.affix = { stat: def.stat, value: Math.max(0.1, value) };
    this.recalc();
    this.save(true);
    this.notify(`${stoneLabel(stone)} ascended to ${ng.name}.`, 'success');
    return { ok: true, stone };
  },

  /* ---------- shop ---------------------------------------------------- */

  awardCoins(amount, meta = {}) {
    const coins = Math.max(0, Math.floor(Number(amount) || 0));
    if (!coins) return { ok: false };
    this.state.hero.premiumCoins += coins;
    this.emit('coinsGranted', { coins, ...meta });
    this.notify(`+${coins} premium coins added.`, 'success');
    this.save(true);
    return { ok: true, coins };
  },

  buyShopItem(itemId) {
    const item = SHOP.items.find(i => i.id === itemId);
    if (!item) return { ok: false, message: 'Unknown shop item.' };
    if (item.once && this.state.hero.shopPurchases?.[item.id]) return { ok: false, message: 'Already purchased.' };
    if (this.state.hero.premiumCoins < item.price) return { ok: false, message: 'Not enough premium coins.' };
    const now = Date.now();
    this.state.hero.premiumCoins -= item.price;
    if (!this.state.hero.shopPurchases) this.state.hero.shopPurchases = {};
    this.state.hero.shopPurchases[item.id] = (this.state.hero.shopPurchases[item.id] || 0) + 1;
    const materials = this.state.hero.materials;
    if (item.type === 'booster') {
      const key = `${item.booster}Until`;
      this.state.hero.boosters[key] = Math.max(now, this.state.hero.boosters[key] || 0) + item.duration * 1000;
    } else if (item.type === 'material') {
      materials[item.material] = (materials[item.material] || 0) + item.grant;
    } else if (item.type === 'inventory') {
      this.state.hero.capacity = Math.min(GAME.maxInventory, this.state.hero.capacity + item.grant);
    } else if (item.type === 'membership') {
      this.state.hero.boosters.membershipUntil = Math.max(now, this.state.hero.boosters.membershipUntil || 0) + item.duration * 1000;
    } else if (item.type === 'costume') {
      if (!this.state.hero.costumes.owned.includes(item.costumeId)) this.state.hero.costumes.owned.push(item.costumeId);
    } else if (item.type === 'pet') {
      if (!this.state.hero.pets.owned[item.petId]) this.state.hero.pets.owned[item.petId] = { level: 1 };
      if (!this.state.hero.pets.active) this.state.hero.pets.active = item.petId;
    } else if (item.type === 'mount') {
      if (!this.state.hero.mounts.owned[item.mountId]) this.state.hero.mounts.owned[item.mountId] = { level: 1 };
      if (!this.state.hero.mounts.active) this.state.hero.mounts.active = item.mountId;
    } else if (item.type === 'cache') {
      for (let i = 0; i < 2; i++) this.receiveItem(generateItem({ ilvl: Math.max(8, this.state.hero.level + 2), rarity: 'epic', classId: this.state.hero.classId, source: 'cache' }), { silent: true });
      this.receiveStone(generateStone({ source: 'boss', gradeBoost: 1, level: 2 }));
      this.receiveStone(generateStone({ source: 'boss', gradeBoost: 1, level: 2 }));
      materials.upgradeStone = (materials.upgradeStone || 0) + 15;
      materials.ember = (materials.ember || 0) + 3;
    }
    this.recalc();
    this.save(true);
    this.notify(`${item.name} delivered.`, 'success');
    this.emit('shopPurchase', { item });
    return { ok: true, item };
  },

  claimFreeChest(now = Date.now()) {
    if (now - (this.state.hero.freeChestAt || 0) < 20 * 3600 * 1000) {
      const remaining = 20 * 3600 * 1000 - (now - (this.state.hero.freeChestAt || 0));
      return { ok: false, remaining };
    }
    this.state.hero.freeChestAt = now;
    const gold = randInt(350, 900);
    const dust = randInt(3, 8);
    const stones = randInt(1, 2);
    this.state.hero.gold += gold;
    this.state.hero.materials.stoneDust = (this.state.hero.materials.stoneDust || 0) + dust;
    for (let i = 0; i < stones; i++) this.receiveStone(generateStone({ source: 'normal', level: 1 }));
    let item = null;
    if (chance(0.55)) {
      item = generateItem({ ilvl: Math.max(3, this.state.hero.level + 1), rarity: chance(0.12) ? 'epic' : 'rare', classId: this.state.hero.classId, source: 'freechest' });
      this.receiveItem(item, { silent: true });
    }
    this.save(true);
    this.notify(`Free cache: ${gold} gold, ${dust} Stone Dust${item ? `, ${item.name}` : ''}.`, 'success');
    this.emit('freeChest', { gold, dust, stones, item });
    return { ok: true, gold, dust, stones, item };
  },

  claimDaily(contractId) {
    const rewards = claimDaily(this.state, contractId);
    if (!rewards) return { ok: false, message: 'This contract is not ready.' };
    this.applyRewards(rewards);
    this.save(true);
    this.notify('Daily contract claimed.', 'success');
    this.emit('dailyClaimed', { contractId, rewards });
    return { ok: true, rewards };
  },

  claimMilestone(milestoneId) {
    const ms = MILESTONES.find(m => m.id === milestoneId);
    if (!ms) return { ok: false };
    if (this.state.milestones.claimed.includes(milestoneId)) return { ok: false, message: 'Already claimed.' };
    const value = metricValue(this.state, ms.metric, this.getStats());
    if (value < ms.target) return { ok: false, message: 'Not yet earned.' };
    this.state.milestones.claimed.push(milestoneId);
    this.applyRewards(ms.rewards);
    this.save(true);
    this.notify(`Milestone claimed: ${ms.name}.`, 'success');
    this.emit('milestoneClaimed', { milestone: ms, rewards: ms.rewards });
    return { ok: true, rewards: ms.rewards };
  },

  applyRewards(rewards = []) {
    for (const reward of rewards) {
      if (reward.type === 'gold') {
        this.state.hero.gold += reward.amount;
        this.state.stats.goldEarned += reward.amount;
      } else if (reward.type === 'premium') {
        this.state.hero.premiumCoins += reward.amount;
      } else if (reward.type === 'material') {
        this.state.hero.materials[reward.key] = (this.state.hero.materials[reward.key] || 0) + reward.amount;
      } else if (reward.type === 'item') {
        this.receiveItem(reward.item, { silent: true });
      } else if (reward.type === 'stone') {
        this.receiveStone(reward.stone);
      }
    }
    this.recalc();
  },

  /* ---------- world --------------------------------------------------- */

  startDungeon(dungeonId) {
    const dungeon = DUNGEON_BY_ID[dungeonId];
    if (!dungeon) return { ok: false };
    if (this.battle.mode === 'dungeon') return { ok: false, message: 'Finish the current expedition first.' };
    if (dungeonAttemptsLeft(this.state, dungeonId) <= 0) return { ok: false, message: 'No attempts left today.' };
    if (!useDungeonAttempt(this.state, dungeonId)) return { ok: false, message: 'No attempts left today.' };
    this.state.hero.hp = this.stats.maxHp;
    this.state.hero.mp = this.stats.maxMp;
    resetBattle(this.battle, { mode: 'dungeon', dungeonId, spawnDelay: 0.9 });
    this.battle.mode = 'dungeon';
    this.battle.dungeonId = dungeonId;
    this.addFeed(`Expedition begun: ${dungeon.name}.`, 'boss');
    this.notify(`${dungeon.name} — ${dungeon.boss.name} awaits.`, 'success');
    this.save(true);
    this.emit('battleMode', { mode: 'dungeon', dungeon });
    return { ok: true, dungeon };
  },

  travelStage(index) {
    if (this.battle.mode === 'dungeon') {
      this.battle.mode = 'stage';
      this.battle.dungeonId = null;
      this.resetTimer = true;
    }
    const safe = travelToStage(this.state, index);
    resetBattle(this.battle, { mode: 'stage', spawnDelay: 0.6 });
    this.addFeed(`Traveling to ${stageCoords(safe).region.name}, stage ${stageCoords(safe).stage}.`, 'info');
    this.save(true);
    this.emit('stageTravel', { index: safe });
    return { ok: true, index: safe };
  },

  toggleAutoAdvance(value) {
    this.state.progress.autoAdvance = value == null ? !this.state.progress.autoAdvance : !!value;
    this.save(true);
    return { ok: true, value: this.state.progress.autoAdvance };
  },

  toggleAutoSkills(value) {
    this.state.hero.autoSkills = value == null ? !this.state.hero.autoSkills : !!value;
    this.save(true);
    return { ok: true, value: this.state.hero.autoSkills };
  },

  setAutoEquip(value) {
    this.state.hero.autoEquip = !!value;
    this.save(true);
    return { ok: true, value: this.state.hero.autoEquip };
  },

  setSetting(key, value) {
    this.state.settings[key] = value;
    if (key === 'autoSellCommon') this.state.hero.autoSellCommon = !!value;
    this.save(true);
    return { ok: true };
  },

  reportState() {
    this.ensureClaims();
    return {
      state: this.state,
      stats: this.getStats(),
      battle: this.battle,
      feed: this.recentFeed,
      claims: availableClaims(this.state, this.getStats()),
    };
  },

  ensureClaims() {
    if (!this.state) return;
    ensureDaily(this.state);
  },

  export() { return exportSave(this.state); },
  import(text) {
    const migrated = importSave(text);
    if (!migrated) return { ok: false, message: 'Invalid save data.' };
    this.state = migrated;
    this.initRuntime();
    this.battle = resetBattle(this.battle, { mode: 'stage', spawnDelay: 0.8 });
    saveGame(this.state);
    this.emit('imported', this.state);
    return { ok: true };
  },
};

export const Engine = ENGINE;
