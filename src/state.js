// ============================================================
// AETHERIA — GAME STATE, ITEMS, ECONOMY & SAVE SYSTEM
// Runs entirely locally. No multiplayer server is present.
// ============================================================

import CONFIG from './config.js';
import {
  CLASSES, FACTIONS, SLOTS, RARITIES, RARITY_ORDER, TIERS,
  REGIONS, REGION_ORDER, MONSTERS, NPCS, QUESTS, DUNGEONS,
  SHOP, BONUS_STATS, HAIR_STYLES, HAIR_COLORS, EYE_COLORS
} from './data.js';
import {
  clamp, uid, fmt, weightedPick, makeRng, deepClone, Events, hashString
} from './utils.js';

export const MATERIALS = {
  mat_silverleaf: { id: 'mat_silverleaf', name: 'Silverleaf', icon: '🌿', desc: 'A herb that grows where dawn touches the grass.' },
  mat_iron_ore: { id: 'mat_iron_ore', name: 'Iron Ore', icon: '⛏', desc: 'Heavy, warm, and full of old mountain.' },
  mat_spider_silk: { id: 'mat_spider_silk', name: 'Venom Silk', icon: '🕸', desc: 'Stronger than steel, if you can get it clean.' },
  mat_grave_dust: { id: 'mat_grave_dust', name: 'Grave Dust', icon: '🕯', desc: 'Used to draw wards that the dead respect.' },
  mat_frost_fang: { id: 'mat_frost_fang', name: 'Frost Fang', icon: '❄', desc: 'Cold enough to burn.' },
  mat_sun_relic: { id: 'mat_sun_relic', name: 'Sun Relic', icon: '☀', desc: 'A fragment of a king who tried to eat the sky.' },
  mat_ashen_cinder: { id: 'mat_ashen_cinder', name: 'Ashen Cinder', icon: '🔥', desc: 'It never stops smoldering.' },
  mat_void_shard: { id: 'mat_void_shard', name: 'Void Shard', icon: '✦', desc: 'A splinter of somewhere else.' },
  mat_primordial_core: { id: 'mat_primordial_core', name: 'Primordial Core', icon: '◉', desc: 'The beating heart of an ancient boss. Required to craft Legendary gear.' }
};

const CLASS_ITEM_NAMES = {
  warrior: {
    weapon: ['Greatsword', 'Warblade', 'Iron Cleaver'],
    helmet: ['Warguard Helm', 'Dread Visor', 'Tempered Barbute'],
    chest: ['Battleplate', 'Warlord Cuirass', 'Iron Bastion'],
    gloves: ['Gauntlets', 'Grip of Ruin', 'Steelclasp Gauntlets'],
    pants: ['Warlegs', 'Tasset Guard', 'Iron Greaves'],
    boots: ['Warboots', 'Stompers', 'Anvil Treads'],
    necklace: ['War Medallion', 'Chain of Command', 'Blood Pendant'],
    chain: ['Oath Chain', 'Iron Links', 'Girdle of Valor'],
    earrings: ['War Studs', 'Earring of Wrath', 'Battle Signet']
  },
  mage: {
    weapon: ['Archstaff', 'Runewood Staff', 'Spire Rod'],
    helmet: ['Arcane Hood', 'Circlet of Stars', 'Seer Cowl'],
    chest: ['Robe of Tides', 'Astral Vestment', 'Emberweave Robe'],
    gloves: ['Spellbinder Gloves', 'Silk Wraps', 'Runic Handguards'],
    pants: ['Rune Leggings', 'Astral Trousers', 'Tidecloth Leggings'],
    boots: ['Step of Echoes', 'Mistwalkers', 'Rune Slippers'],
    necklace: ['Star Locket', 'Pendant of Insight', 'Aether Amulet'],
    chain: ['Focus Chain', 'Silver Leylinks', 'Chain of Wards'],
    earrings: ['Whisper Earrings', 'Drop Studs', 'Earring of Clarity']
  },
  archer: {
    weapon: ['Longbow', 'Hunting Bow', 'Windstring'],
    helmet: ['Ranger Hood', 'Hawk Cowl', 'Leaf Visor'],
    chest: ['Scout Jerkin', 'Windweave Vest', 'Ranger Coat'],
    gloves: ['Fingerless Grips', 'Draw Gloves', 'Thornwraps'],
    pants: ['Trail Leggings', 'Leafcloth Pants', 'Strider Legs'],
    boots: ['Softboots', 'Trailrunners', 'Foxstep Boots'],
    necklace: ['Hawkeye Pendant', 'Trail Charm', 'Beasttooth Necklace'],
    chain: ['Quiver Chain', 'Bowstring Belt', 'Yew Links'],
    earrings: ['Hunter Studs', 'Feather Drops', 'Earring of Focus']
  }
};

const RARITY_PREFIX = {
  common: ['Worn', 'Plain', 'Sturdy'],
  grey: ['Dulled', 'Weathered', 'Grey'],
  green: ['Verdant', 'Keen', 'Grove'],
  blue: ['Tideforged', 'Azure', 'Storm'],
  epic: ['Dread', 'Astral', 'Sovereign'],
  legendary: ['Dawnfire', 'Kingslayer', 'Everbound'],
  mythic: ['Worldbreaker', 'Fatesever', 'Abyssal'],
  divine: ['Eternal', 'Godforged', 'Radiant']
};

const FACTION_ITEM_PREFIX = {
  angel: ['Radiant', 'Dawn', 'Hallowed'],
  demon: ['Ember', 'Abyssal', 'Crimson']
};

const STAT_WEIGHTS = {
  weapon:  { atk: 1.0, def: 0.05, primary: 0.55, vit: 0.20, crit: 0.20 },
  helmet:  { atk: 0.0, def: 0.60, primary: 0.22, vit: 0.30, crit: 0.05 },
  chest:   { atk: 0.0, def: 0.85, primary: 0.25, vit: 0.45, crit: 0.02 },
  gloves:  { atk: 0.25, def: 0.30, primary: 0.30, vit: 0.15, crit: 0.15 },
  pants:   { atk: 0.0, def: 0.55, primary: 0.18, vit: 0.28, crit: 0.03 },
  boots:   { atk: 0.0, def: 0.30, primary: 0.15, vit: 0.18, crit: 0.05 },
  necklace:{ atk: 0.10, def: 0.05, primary: 0.45, vit: 0.22, crit: 0.25 },
  chain:   { atk: 0.10, def: 0.10, primary: 0.38, vit: 0.24, crit: 0.20 },
  earrings:{ atk: 0.08, def: 0.04, primary: 0.40, vit: 0.18, crit: 0.30 }
};

export const ITEM_BASE = {
  warrior: {
    weapon: { dmg: 1.0, speed: 2.0 }, helmet: {}, chest: {}, gloves: {}, pants: {}, boots: {}, necklace: {}, chain: {}, earrings: {}
  },
  mage: {
    weapon: { dmg: 0.82, speed: 2.2 }, helmet: {}, chest: {}, gloves: {}, pants: {}, boots: {}, necklace: {}, chain: {}, earrings: {}
  },
  archer: {
    weapon: { dmg: 0.72, speed: 1.55 }, helmet: {}, chest: {}, gloves: {}, pants: {}, boots: {}, necklace: {}, chain: {}, earrings: {}
  }
};

function roll(seed) { return makeRng(seed); }

export class AetheriaState {
  constructor() {
    this.data = null;
    this._statsCache = null;
    this._statsDirty = true;
    this.lastSave = 0;
  }

  // ------------------------------------------------------------
  // creation / save
  // ------------------------------------------------------------
  newGame(opts) {
    const cls = CLASSES[opts.classId] ? opts.classId : 'warrior';
    const faction = FACTIONS[opts.faction] ? opts.faction : 'angel';
    const gender = opts.gender === 'female' ? 'female' : 'male';
    const hairStyle = HAIR_STYLES[gender].some(h => h.id === opts.hair) ? opts.hair : HAIR_STYLES[gender][0].id;
    const hairColor = HAIR_COLORS.some(h => h.id === opts.hairColor) ? opts.hairColor : HAIR_COLORS[0].id;
    const eyes = EYE_COLORS.some(e => e.id === opts.eyes) ? opts.eyes : 'blue';
    const name = (opts.name || 'Wanderer').trim().slice(0, 16) || 'Wanderer';
    const region = REGIONS.greendale;
    const spawn = region.spawn;

    this.data = {
      version: CONFIG.version,
      createdAt: Date.now(),
      playtime: 0,
      character: {
        name, faction, classId: cls, gender, hair: hairStyle, hairColor, eyes,
        level: 1, xp: 0, gold: CONFIG.economy.startingGold, gems: CONFIG.economy.startingGems,
        region: 'greendale', x: spawn[0], y: spawn[1],
        hp: 1, mana: 1,
        skillLevel: 1,
        title: 'Wanderer',
        wingsUnlocked: [], wingsActive: null,
        mountsOwned: [], mountActive: null,
        petsOwned: [], petActive: null,
        costumesOwned: [], costume: null,
        hairstylesOwned: [], hairEffectsOwned: [], weaponFx: null,
        premium: { xpUntil: 0, goldUntil: 0 },
        bagBonus: 0,
        consumables: { health_small: 20, mana_small: 10 },
        buffs: [],
        deaths: 0, kills: 0, bosses: 0, dungeons: 0,
        highestGoldPerHour: 0,
        tutorialStep: 0
      },
      equipped: { weapon: null, helmet: null, chest: null, gloves: null, pants: null, boots: null, necklace: null, chain: null, earrings: null },
      inventory: [],
      storage: [],
      stones: [],
      quests: { active: [], completed: [], claimed: [] },
      market: { stallUntil: 0, listings: [], sold: [] },
      shop: { owned: [], purchases: [] },
      economy: {
        sources: {}, sinks: {}, history: [], lifetimeEarned: 0, lifetimeSpent: 0,
        sessionEarned: 0, sessionStart: Date.now()
      },
      flags: { welcomeShown: false, wingsQuestDone: false },
      settings: { sound: true, autoAttack: true, showNames: true, quality: 'high' },
      lastSaved: Date.now()
    };

    // starter gear (T3, common — exactly like world drops)
    const weapon = this.createEquip({ slot: 'weapon', rarity: 'common', tier: 3, classId: cls, faction, level: 1 });
    const chest = this.createEquip({ slot: 'chest', rarity: 'common', tier: 3, classId: cls, faction, level: 1 });
    const boots = this.createEquip({ slot: 'boots', rarity: 'common', tier: 3, classId: cls, faction, level: 1 });
    this.data.equipped.weapon = weapon;
    this.data.equipped.chest = chest;
    this.data.equipped.boots = boots;
    this.data.inventory.push(weapon, chest, boots);
    // move equipped out of inventory view
    this._syncEquippedRemoval();

    const st = this.stats();
    this.data.character.hp = st.maxHp;
    this.data.character.mana = st.maxMana;
    this.data.economy.sources.starter_fund = CONFIG.economy.startingGold;
    this.data.economy.lifetimeEarned += CONFIG.economy.startingGold;
    this.data.economy.history.push({
      ts: Date.now(), type: 'in', amount: CONFIG.economy.startingGold, category: 'starter_fund', note: 'Starting gold'
    });
    this.save();
    this._statsDirty = true;
    return this.data;
  }

  _syncEquippedRemoval() {
    // starter items are both equipped and pushed for convenience: remove duplicates
    const equippedIds = new Set(Object.values(this.data.equipped).filter(Boolean).map(i => i.uid));
    this.data.inventory = this.data.inventory.filter(i => !equippedIds.has(i.uid));
  }

  save() {
    if (!this.data) return false;
    try {
      this.data.lastSaved = Date.now();
      localStorage.setItem(CONFIG.saveKey, JSON.stringify(this.data));
      this.lastSave = Date.now();
      Events.emit('saved', this.lastSave);
      return true;
    } catch (err) {
      console.warn('Save failed', err);
      return false;
    }
  }

  static hasSave() {
    try { return !!localStorage.getItem(CONFIG.saveKey); } catch { return false; }
  }

  load() {
    try {
      const raw = localStorage.getItem(CONFIG.saveKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed?.character || parsed.version !== CONFIG.version) return false;
      this.data = parsed;
      // heal any save-schema gaps from patches
      this.data.stones = this.data.stones || [];
      this.data.quests = this.data.quests || { active: [], completed: [], claimed: [] };
      this.data.market = this.data.market || { stallUntil: 0, listings: [], sold: [] };
      this.data.character.buffs = this.data.character.buffs || [];
      this.data.character.consumables = this.data.character.consumables || {};
      this.data.character.wingsUnlocked = this.data.character.wingsUnlocked || [];
      this.data.character.mountsOwned = this.data.character.mountsOwned || [];
      this.data.character.petsOwned = this.data.character.petsOwned || [];
      this.data.character.costumesOwned = this.data.character.costumesOwned || [];
      this.data.shop = this.data.shop || { owned: [], purchases: [] };
      this._statsDirty = true;
      const st = this.stats();
      this.data.character.hp = clamp(this.data.character.hp || st.maxHp, 1, st.maxHp);
      this.data.character.mana = clamp(this.data.character.mana || st.maxMana, 0, st.maxMana);
      return true;
    } catch (err) {
      console.warn('Load failed', err);
      return false;
    }
  }

  resetSave() {
    try { localStorage.removeItem(CONFIG.saveKey); } catch {}
    this.data = null;
  }

  // ------------------------------------------------------------
  // core character helpers
  // ------------------------------------------------------------
  get char() { return this.data?.character; }
  get cls() { return CLASSES[this.char?.classId] || CLASSES.warrior; }
  get faction() { return FACTIONS[this.char?.faction] || FACTIONS.angel; }

  _invalidate() {
    this._statsDirty = true;
    this._statsCache = null;
  }

  xpToNext(level = this.char.level) {
    return CONFIG.combat.xpCurve(level);
  }

  stats() {
    if (!this.data) return null;
    if (!this._statsDirty && this._statsCache) return this._statsCache;
    const c = this.char;
    const base = this.cls.base;
    const growth = this.cls.growth;
    const lv = c.level;
    const stats = {
      str: base.str + growth.str * (lv - 1),
      int: base.int + growth.int * (lv - 1),
      dex: base.dex + growth.dex * (lv - 1),
      vit: base.vit + growth.vit * (lv - 1),
      crit: CONFIG.combat.baseCrit,
      atk: 0, def: 0, critBonus: 0
    };
    for (const slot of SLOTS) {
      const item = this.data.equipped[slot.id];
      if (!item) continue;
      for (const key of ['str', 'int', 'dex', 'vit', 'atk', 'def']) {
        stats[key] += item.stats?.[key] || 0;
      }
      if (item.stats?.crit) stats.critBonus += item.stats.crit;
      for (const b of item.bonuses || []) {
        if (b.stat === 'crit') stats.critBonus += b.value / 100;
        else if (stats[b.stat] !== undefined) stats[b.stat] += b.value;
      }
    }
    const primary = stats[this.cls.primary] || 0;
    stats.primary = primary;
    stats.maxHp = Math.floor(70 + stats.vit * 15 + lv * 12);
    stats.maxMana = Math.floor(30 + stats.int * 11 + lv * 5);
    stats.attack = Math.floor(8 + stats.atk * 1.25 + primary * 2.35 + lv * 1.6);
    stats.defense = Math.floor(stats.def * 1.7 + stats.vit * 0.3);
    stats.damageReduction = stats.defense / (stats.defense + 160);
    stats.crit = clamp(stats.crit + stats.critBonus, 0, CONFIG.combat.critCap);
    stats.critDamage = 1.75;
    const weapon = this.data.equipped.weapon;
    const weaponSpeed = ITEM_BASE[c.classId]?.weapon?.speed || 2.0;
    const tierSpeed = weapon ? ({ 1: 0.95, 2: 0.9, 3: 0.86 }[weapon.tier] || 0.9) : 1;
    let attackInterval = weaponSpeed * tierSpeed;
    const asBuff = this.activeBuff('attackSpeed');
    if (asBuff) attackInterval /= asBuff.mult;
    stats.attackInterval = attackInterval;
    stats.attackSpeedPct = 1 / attackInterval;
    stats.attackRange = c.classId === 'archer' ? 3.4 : c.classId === 'mage' ? 2.9 : 1.65;
    let move = 3.1;
    if (c.mountActive) {
      const mount = SHOP.mounts.find(m => m.id === c.mountActive);
      if (mount) move *= mount.speed;
    }
    const msBuff = this.activeBuff('moveSpeed');
    if (msBuff) move *= msBuff.mult;
    stats.moveSpeed = move;
    stats.power = Math.floor(stats.attack * (1 + stats.crit * (stats.critDamage - 1)) * 1.2 + stats.maxHp * 0.08 + stats.defense * 0.5);
    this._statsCache = stats;
    this._statsDirty = false;
    return stats;
  }

  recalcHP() {
    const st = this.stats();
    this.char.hp = clamp(this.char.hp, 1, st.maxHp);
    this.char.mana = clamp(this.char.mana, 0, st.maxMana);
  }

  heal(amount) {
    const st = this.stats();
    this.char.hp = clamp(this.char.hp + amount, 0, st.maxHp);
    Events.emit('hp', this.char.hp);
    return this.char.hp;
  }

  restoreMana(amount) {
    const st = this.stats();
    this.char.mana = clamp(this.char.mana + amount, 0, st.maxMana);
    Events.emit('mana', this.char.mana);
  }

  damagePlayer(amount) {
    const st = this.stats();
    const reduced = Math.max(1, Math.round(amount * (1 - st.damageReduction)));
    this.char.hp = Math.max(0, this.char.hp - reduced);
    Events.emit('hp', this.char.hp);
    return reduced;
  }

  gainXp(amount, category = 'combat') {
    if (amount <= 0) return;
    if (this.char.premium.xpUntil > Date.now()) amount = Math.round(amount * 1.5);
    this.char.xp += amount;
    let levels = 0;
    while (this.char.level < 60 && this.char.xp >= this.xpToNext()) {
      this.char.xp -= this.xpToNext();
      this.char.level++;
      levels++;
      this._invalidate();
      const st = this.stats();
      this.char.hp = st.maxHp;
      this.char.mana = st.maxMana;
      Events.emit('levelup', this.char.level);
    }
    if (this.char.level >= 60) this.char.xp = Math.min(this.char.xp, this.xpToNext(60));
    Events.emit('xp', { xp: this.char.xp, level: this.char.level, levels });
    Events.emit('character', this.char);
    return levels;
  }

  activeBuff(type) {
    const now = Date.now();
    return (this.char.buffs || []).find(b => b.type === type && b.until > now);
  }

  activeBuffs() {
    const now = Date.now();
    return (this.char.buffs || []).filter(b => b.until > now);
  }

  clearExpiredBuffs() {
    const before = (this.char.buffs || []).length;
    this.char.buffs = (this.char.buffs || []).filter(b => b.until > Date.now());
    if (before !== this.char.buffs.length) this._invalidate();
  }

  addBuff(def) {
    const existing = this.char.buffs.find(b => b.id === def.id);
    if (existing) {
      existing.until = Date.now() + def.seconds * 1000;
    } else {
      this.char.buffs.push({ id: def.id, type: def.buff, mult: def.mult, name: def.name, until: Date.now() + def.seconds * 1000 });
    }
    this._invalidate();
  }

  usePotion(id) {
    const def = CONFIG.potions[id];
    if (!def) return { ok: false, msg: 'Unknown potion.' };
    const count = this.char.consumables[id] || 0;
    if (count <= 0) return { ok: false, msg: 'You have none of those.' };
    if (def.heal) {
      const st = this.stats();
      if (this.char.hp >= st.maxHp) return { ok: false, msg: 'Health is already full.' };
      this.char.consumables[id] = count - 1;
      this.heal(def.heal);
      return { ok: true, msg: `Restored ${def.heal} health.` };
    }
    if (def.mana) {
      const st = this.stats();
      if (this.char.mana >= st.maxMana) return { ok: false, msg: 'Mana is already full.' };
      this.char.consumables[id] = count - 1;
      this.restoreMana(def.mana);
      return { ok: true, msg: `Restored ${def.mana} mana.` };
    }
    if (def.buff) {
      this.char.consumables[id] = count - 1;
      this.addBuff({ ...def, id });
      return { ok: true, msg: `${def.name} active for ${Math.round(def.seconds / 60)} minutes.` };
    }
    return { ok: false, msg: 'Nothing happens.' };
  }

  buyPotion(id, packages = 1) {
    const def = CONFIG.potions[id];
    if (!def) return { ok: false, msg: 'Unknown potion.' };
    const total = def.price * packages;
    if (!this.spendGold(total, 'potion_purchase', `${def.name} ×${CONFIG.potionPackageSize * packages}`)) {
      return { ok: false, msg: 'Not enough gold.' };
    }
    const amount = CONFIG.potionPackageSize * packages;
    this.char.consumables[id] = (this.char.consumables[id] || 0) + amount;
    Events.emit('inventory', this.data.inventory);
    return { ok: true, msg: `Purchased ${amount} × ${def.name}.` };
  }

  // ------------------------------------------------------------
  // economy ledger
  // ------------------------------------------------------------
  addGold(amount, category = 'misc', note = '') {
    amount = Math.max(0, Math.round(amount));
    if (!amount) return 0;
    if (category === 'monster' && this.char.premium.goldUntil > Date.now()) amount = Math.round(amount * 1.25);
    this.char.gold += amount;
    const eco = this.data.economy;
    eco.sources[category] = (eco.sources[category] || 0) + amount;
    eco.lifetimeEarned += amount;
    eco.sessionEarned += amount;
    eco.history.unshift({ ts: Date.now(), type: 'in', amount, category, note });
    eco.history = eco.history.slice(0, 120);
    Events.emit('gold', this.char.gold);
    Events.emit('economy', eco);
    return amount;
  }

  spendGold(amount, category = 'misc', note = '') {
    amount = Math.max(0, Math.round(amount));
    if (amount <= 0) return true;
    if (this.char.gold < amount) return false;
    this.char.gold -= amount;
    const eco = this.data.economy;
    eco.sinks[category] = (eco.sinks[category] || 0) + amount;
    eco.lifetimeSpent += amount;
    eco.history.unshift({ ts: Date.now(), type: 'out', amount, category, note });
    eco.history = eco.history.slice(0, 120);
    Events.emit('gold', this.char.gold);
    Events.emit('economy', eco);
    return true;
  }

  addGems(amount) {
    this.char.gems += amount;
    Events.emit('gems', this.char.gems);
  }

  spendGems(amount) {
    if (this.char.gems < amount) return false;
    this.char.gems -= amount;
    Events.emit('gems', this.char.gems);
    return true;
  }

  economySummary() {
    const eco = this.data.economy;
    const hours = Math.max(0.01, this.data.playtime / 3600);
    const goldPerHour = eco.lifetimeEarned / hours;
    const totalIn = Object.values(eco.sources).reduce((a, b) => a + b, 0);
    const totalOut = Object.values(eco.sinks).reduce((a, b) => a + b, 0);
    return {
      totalIn, totalOut, net: totalIn - totalOut,
      sources: eco.sources, sinks: eco.sinks,
      lifetimeEarned: eco.lifetimeEarned, lifetimeSpent: eco.lifetimeSpent,
      goldPerHour, hours,
      target: CONFIG.combat.goldPerHourTarget,
      history: eco.history
    };
  }

  // ------------------------------------------------------------
  // inventory
  // ------------------------------------------------------------
  inventoryCap() {
    return CONFIG.inventorySize + (this.char.bagBonus || 0);
  }

  inventoryCount() {
    return this.data.inventory.length + this.data.stones.length;
  }

  hasInventorySpace() {
    return this.inventoryCount() < this.inventoryCap();
  }

  addItem(item) {
    if (!item) return false;
    if (!this.hasInventorySpace()) {
      Events.emit('toast', { msg: 'Inventory full. Sell or store something.', type: 'warn' });
      return false;
    }
    if (item.kind === 'stone') {
      this.data.stones.push(item);
    } else if (item.kind === 'material') {
      const stack = this.data.inventory.find(i => i.kind === 'material' && i.materialId === item.materialId);
      if (stack) stack.count += item.count;
      else this.data.inventory.push(item);
      this.onCollect(item.materialId, item.count);
    } else {
      this.data.inventory.push(item);
    }
    this._invalidate();
    Events.emit('inventory', this.data.inventory);
    return true;
  }

  addMaterial(materialId, count = 1) {
    const mat = MATERIALS[materialId];
    if (!mat) return false;
    const stack = this.data.inventory.find(i => i.kind === 'material' && i.materialId === materialId);
    if (stack) {
      stack.count += count;
    } else {
      if (!this.hasInventorySpace()) {
        Events.emit('toast', { msg: 'Inventory full — material left behind.', type: 'warn' });
        return false;
      }
      this.data.inventory.push({ uid: uid('mat'), kind: 'material', materialId, name: mat.name, icon: mat.icon, desc: mat.desc, count });
    }
    this.onCollect(materialId, count);
    Events.emit('inventory', this.data.inventory);
    return true;
  }

  countMaterial(materialId) {
    return this.data.inventory.filter(i => i.kind === 'material' && i.materialId === materialId)
      .reduce((s, i) => s + i.count, 0);
  }

  removeMaterial(materialId, count = 1) {
    let left = count;
    for (const item of this.data.inventory) {
      if (item.kind !== 'material' || item.materialId !== materialId) continue;
      const take = Math.min(left, item.count);
      item.count -= take;
      left -= take;
      if (left <= 0) break;
    }
    this.data.inventory = this.data.inventory.filter(i => i.kind !== 'material' || i.count > 0);
    this._invalidate();
    Events.emit('inventory', this.data.inventory);
    return left === 0;
  }

  addStone(stone) {
    if (!this.hasInventorySpace()) {
      Events.emit('toast', { msg: 'Stone bag full.', type: 'warn' });
      return false;
    }
    stone.kind = 'stone';
    this.data.stones.push(stone);
    Events.emit('stones', this.data.stones);
    return true;
  }

  removeStone(uidValue) {
    const idx = this.data.stones.findIndex(s => s.uid === uidValue);
    if (idx < 0) return null;
    return this.data.stones.splice(idx, 1)[0];
  }

  findItem(uidValue) {
    return this.data.inventory.find(i => i.uid === uidValue)
      || this.data.stones.find(i => i.uid === uidValue)
      || Object.values(this.data.equipped).find(i => i?.uid === uidValue)
      || this.data.storage.find(i => i.uid === uidValue)
      || this.data.market.listings.find(l => l.item.uid === uidValue)?.item;
  }

  // ------------------------------------------------------------
  // equipment
  // ------------------------------------------------------------
  createEquip(opts = {}) {
    const classId = opts.classId || this.char?.classId || 'warrior';
    const faction = opts.faction || this.char?.faction || 'angel';
    const slot = opts.slot || 'weapon';
    const rarity = opts.rarity || 'common';
    const tier = opts.tier || 3;
    const level = Math.max(1, Math.round(opts.level || this.char?.level || 1));
    const rng = makeRng(uid('roll'));
    const rDef = RARITIES[rarity];
    const tDef = TIERS[tier];
    const slotDef = SLOTS.find(s => s.id === slot);
    const scale = (0.75 + level * 0.075) * rDef.statMult * tDef.mult;
    const weights = STAT_WEIGHTS[slot];
    const stats = { atk: 0, def: 0, str: 0, int: 0, dex: 0, vit: 0, crit: 0 };

    const dmgBase = slot === 'weapon' ? (8 + level * 2.3) * (ITEM_BASE[classId].weapon.dmg) : 0;
    if (dmgBase) stats.atk = Math.round(dmgBase * scale * (0.9 + rng.next() * 0.2));
    if (weights.def > 0) stats.def = Math.round(slotDef.base * (0.7 + level * 0.055) * scale * weights.def * 2.1);
    stats[CLASSES[classId].primary] = Math.round((2 + level * 0.55) * scale * weights.primary * 1.7);
    stats.vit = Math.round((1.5 + level * 0.32) * scale * weights.vit * 1.4);
    if (weights.crit > 0) {
      const crit = (0.0015 + level * 0.00012) * scale * weights.crit * 2.2;
      stats.crit = Math.round(crit * 1000) / 1000;
    }

    // rarity affixes add extra primary/vitality/crit
    for (let i = 0; i < (rDef.affixes || 0); i++) {
      const pick = rng.pick(['primary', 'vit', 'crit', 'def']);
      if (pick === 'primary') stats[CLASSES[classId].primary] += Math.max(1, Math.round(level * 0.5 * rDef.statMult * 0.5));
      else if (pick === 'vit') stats.vit += Math.max(1, Math.round(level * 0.4 * rDef.statMult * 0.5));
      else if (pick === 'crit') stats.crit = Math.round((stats.crit + 0.004 * rDef.statMult) * 1000) / 1000;
      else stats.def += Math.max(1, Math.round(level * 0.7 * rDef.statMult * 0.4));
    }

    const baseNames = CLASS_ITEM_NAMES[classId][slot];
    const baseName = rng.pick(baseNames);
    const prefixSet = rng.chance(0.5) ? FACTION_ITEM_PREFIX[faction] : RARITY_PREFIX[rarity];
    const prefix = rng.pick(prefixSet);
    const name = `${prefix} ${baseName}${tier === 1 ? ' of Ascension' : tier === 2 ? ' of Power' : ''}`;
    const value = Math.round(slotDef.base * (5 + level * 1.9) * rDef.value * tDef.mult * 3.2);
    return {
      uid: uid('eq'), kind: 'equip', slot, classId, faction, rarity, tier, level,
      name, stats, bonuses: [], createdAt: Date.now(), value,
      icon: slotDef.icon
    };
  }

  rarityRoll() {
    return weightedPick(makeRng(uid('r')), CONFIG.drops.rarityWeights);
  }

  rollEquipmentDrop(monster, opts = {}) {
    const rng = makeRng(uid('drop'));
    const cls = rng.chance(opts.preferPlayer === false ? 0.25 : 0.55) ? this.char.classId : rng.pick(['warrior', 'mage', 'archer']);
    const fac = rng.chance(0.55) ? this.char.faction : rng.pick(['angel', 'demon']);
    const slot = rng.pick(SLOTS).id;
    const rarity = this.rarityRoll();
    const level = Math.max(1, Math.min(60, Math.round((monster?.level || this.char.level) * 0.9 + 1)));
    return this.createEquip({ slot, rarity, tier: CONFIG.drops.dropTier, classId: cls, faction: fac, level });
  }

  rollStone(monster) {
    const rng = makeRng(uid('stone'));
    const classId = rng.chance(0.55) ? this.char.classId : rng.pick(['warrior', 'mage', 'archer']);
    const primary = CLASSES[classId].primary;
    const stat = rng.pick([primary, primary, 'vit', 'crit']);
    let tier = 1;
    const lv = monster?.level || 1;
    if (lv >= 38) tier = 3; else if (lv >= 18) tier = 2;
    const t = [{}, { mult: 1, name: 'Lesser' }, { mult: 1.65, name: 'Greater' }, { mult: 2.5, name: 'Sovereign' }][tier];
    let value;
    if (stat === 'crit') value = Math.round((0.6 + rng.next() * 0.8) * t.mult * 100) / 100;
    else if (stat === 'vit') value = Math.round((5 + rng.next() * 5) * t.mult);
    else value = Math.round((4 + rng.next() * 4) * t.mult);
    const sdef = BONUS_STATS[stat];
    return {
      uid: uid('st'), kind: 'stone', classId, stat, value, tier,
      name: `${t.name} ${sdef.name} Stone`, icon: sdef.icon,
      desc: `${sdef.icon} +${value}${stat === 'crit' ? '%' : ''} ${sdef.name} — boss stone, tradeable.`
    };
  }

  canEquip(item) {
    if (!item || item.kind !== 'equip') return { ok: false, reason: 'Not equipment' };
    if (item.classId !== this.char.classId) {
      return { ok: false, reason: `${CLASSES[item.classId].name}s only` };
    }
    if (item.faction !== this.char.faction) {
      return { ok: false, reason: `${FACTIONS[item.faction].name} only` };
    }
    return { ok: true };
  }

  equip(itemUid) {
    const item = this.data.inventory.find(i => i.uid === itemUid);
    if (!item || item.kind !== 'equip') return { ok: false, msg: 'Item not found.' };
    const check = this.canEquip(item);
    if (!check.ok) return { ok: false, msg: `Cannot equip: ${check.reason}.` };
    const current = this.data.equipped[item.slot];
    this.data.inventory = this.data.inventory.filter(i => i.uid !== itemUid);
    this.data.equipped[item.slot] = item;
    if (current) this.data.inventory.push(current);
    this._invalidate();
    this.recalcHP();
    Events.emit('equipment', this.data.equipped);
    Events.emit('inventory', this.data.inventory);
    Events.emit('character', this.char);
    return { ok: true, msg: `Equipped ${item.name}.` };
  }

  unequip(slot) {
    const item = this.data.equipped[slot];
    if (!item) return { ok: false, msg: 'Nothing equipped there.' };
    if (!this.hasInventorySpace()) return { ok: false, msg: 'Inventory full.' };
    this.data.equipped[slot] = null;
    this.data.inventory.push(item);
    this._invalidate();
    this.recalcHP();
    Events.emit('equipment', this.data.equipped);
    Events.emit('inventory', this.data.inventory);
    return { ok: true, msg: `Unequipped ${item.name}.` };
  }

  sellItem(itemUid) {
    const idx = this.data.inventory.findIndex(i => i.uid === itemUid);
    if (idx < 0) return { ok: false, msg: 'Item not found.' };
    const item = this.data.inventory[idx];
    if (item.kind === 'material') {
      const total = Math.round(150 * item.count * (item.materialId === 'mat_primordial_core' ? 500 : 1));
      this.removeMaterial(item.materialId, item.count);
      this.addGold(total, 'npc_sale', `Sold ${item.count} × ${item.name}`);
      return { ok: true, msg: `Sold ${item.name} for ${fmt(total)} gold.`, gold: total };
    }
    if (item.kind !== 'equip') return { ok: false, msg: 'This cannot be sold here.' };
    const price = Math.max(1, Math.round((item.value || 100) * CONFIG.economy.npcSellRate));
    this.data.inventory.splice(idx, 1);
    this.addGold(price, 'npc_sale', `Sold ${item.name}`);
    this._invalidate();
    Events.emit('inventory', this.data.inventory);
    return { ok: true, msg: `Sold ${item.name} for ${fmt(price)} gold.`, gold: price };
  }

  // ------------------------------------------------------------
  // fusion / crafting
  // ------------------------------------------------------------
  fusionKey(item) {
    return [item.classId, item.faction, item.slot, item.rarity, item.tier].join('|');
  }

  fusionGroups() {
    const map = new Map();
    for (const item of this.data.inventory) {
      if (item.kind !== 'equip') continue;
      const key = this.fusionKey(item);
      if (!map.has(key)) map.set(key, { key, items: [], sample: item });
      map.get(key).items.push(item);
    }
    return [...map.values()].filter(g => g.items.length >= CONFIG.fusion.requirementCount)
      .sort((a, b) => RARITIES[b.sample.rarity].order - RARITIES[a.sample.rarity].order || a.sample.tier - b.sample.tier);
  }

  fusionCost(item) {
    const costs = CONFIG.fusion.costs[item.rarity];
    if (!costs) return null;
    if (item.tier > 1) return costs[item.tier === 3 ? 't3t2' : 't2t1'];
    if (item.rarity === 'divine') return null;
    if (item.rarity === 'legendary') return CONFIG.fusion.special.mythicFusion;
    if (item.rarity === 'mythic') return CONFIG.fusion.special.divineFusion;
    return costs.next;
  }

  fusionNext(item) {
    if (item.tier > 1) return { rarity: item.rarity, tier: item.tier - 1 };
    const idx = RARITY_ORDER.indexOf(item.rarity);
    if (idx < 0 || idx >= RARITY_ORDER.length - 1) return null;
    return { rarity: RARITY_ORDER[idx + 1], tier: 3 };
  }

  fuseGroup(key) {
    const group = this.fusionGroups().find(g => g.key === key);
    if (!group) return { ok: false, msg: 'You need 4 identical items.' };
    const items = group.items.slice(0, 4);
    const sample = items[0];
    const cost = this.fusionCost(sample);
    if (cost == null) return { ok: false, msg: 'Divine T1 is the final tier — no further fusion.' };
    const next = this.fusionNext(sample);
    if (!next) return { ok: false, msg: 'This item cannot be fused further.' };
    if (!this.spendGold(cost, 'fusion', `${sample.rarity} ${sample.slot} fusion`)) {
      return { ok: false, msg: `Not enough gold. Need ${fmt(cost)}.` };
    }
    // preserve all bonuses without destroying stones: keep best 3, refund the rest as loose stones
    const bonusMap = new Map();
    for (const it of items) for (const b of it.bonuses || []) {
      const prev = bonusMap.get(b.stat);
      if (!prev || b.value > prev.value) bonusMap.set(b.stat, b);
    }
    const kept = [...bonusMap.values()].slice(0, 3);
    const refunded = [...bonusMap.values()].slice(3);
    const removeIds = new Set(items.map(i => i.uid));
    this.data.inventory = this.data.inventory.filter(i => !removeIds.has(i.uid));
    const result = this.createEquip({
      slot: sample.slot, rarity: next.rarity, tier: next.tier,
      classId: sample.classId, faction: sample.faction,
      level: Math.max(sample.level, this.char.level)
    });
    result.bonuses = kept;
    this.data.inventory.push(result);
    for (const b of refunded) {
      const stat = BONUS_STATS[b.stat];
      this.addStone({ uid: uid('st'), kind: 'stone', classId: result.classId, stat: b.stat, value: b.value, tier: 3, name: `Sovereign ${stat.name} Stone`, icon: stat.icon, desc: `Refunded bonus. ${b.value} ${stat.name}.` });
    }
    this._invalidate();
    Events.emit('inventory', this.data.inventory);
    Events.emit('stones', this.data.stones);
    Events.emit('toast', { msg: `Fusion complete: ${result.name} (${TIERS[next.tier].name})`, type: 'success' });
    return { ok: true, item: result, msg: `Forged ${result.name}!` };
  }

  craftLegendary(slot = 'weapon') {
    const cost = CONFIG.fusion.special.legendaryCraft;
    const cores = this.countMaterial('mat_primordial_core');
    if (cores < CONFIG.fusion.legendaryCores) {
      return { ok: false, msg: `Need ${CONFIG.fusion.legendaryCores} Primordial Cores (you have ${cores}). Defeat bosses to obtain them.` };
    }
    const mats = REGION_ORDER.map(r => REGIONS[r].material.id).reduce((s, id) => s + this.countMaterial(id), 0);
    if (mats < CONFIG.fusion.legendaryMaterials) {
      return { ok: false, msg: `Need ${CONFIG.fusion.legendaryMaterials} rare region materials (you have ${mats}).` };
    }
    if (!this.spendGold(cost, 'legendary_craft', 'Legendary crafting')) {
      return { ok: false, msg: `Not enough gold. Need ${fmt(cost)}.` };
    }
    this.removeMaterial('mat_primordial_core', CONFIG.fusion.legendaryCores);
    let left = CONFIG.fusion.legendaryMaterials;
    for (const r of REGION_ORDER) {
      if (left <= 0) break;
      const id = REGIONS[r].material.id;
      const have = this.countMaterial(id);
      const take = Math.min(have, left);
      if (take > 0) { this.removeMaterial(id, take); left -= take; }
    }
    const item = this.createEquip({ slot, rarity: 'legendary', tier: 3, classId: this.char.classId, faction: this.char.faction, level: this.char.level });
    this.data.inventory.push(item);
    this._invalidate();
    Events.emit('inventory', this.data.inventory);
    Events.emit('toast', { msg: `Legendary crafted: ${item.name}`, type: 'success' });
    return { ok: true, item, msg: `The forge sings. ${item.name} is yours.` };
  }

  // ------------------------------------------------------------
  // bonuses / enchanting
  // ------------------------------------------------------------
  enchantCost(stone) {
    return stone.tier === 3 ? 40000 : stone.tier === 2 ? 15000 : 5000;
  }

  applyStone(itemUidToEnchant, stoneUid, replaceIndex = -1) {
    const item = this.findItem(itemUidToEnchant);
    const stone = this.data.stones.find(s => s.uid === stoneUid);
    if (!item || item.kind !== 'equip') return { ok: false, msg: 'Select a valid item.' };
    if (!stone) return { ok: false, msg: 'Select a boss stone.' };
    if (item.classId !== stone.classId) return { ok: false, msg: `This stone only fits ${CLASSES[stone.classId].name} equipment.` };
    item.bonuses = item.bonuses || [];
    const cost = this.enchantCost(stone);
    if (item.bonuses.length >= 3 && replaceIndex < 0) {
      return { ok: false, msg: 'This item already has 3 bonuses. Choose one to replace.' };
    }
    if (!this.spendGold(cost, 'enchant', `Applied ${stone.name}`)) {
      return { ok: false, msg: `Not enough gold. Need ${fmt(cost)}.` };
    }
    this.data.stones = this.data.stones.filter(s => s.uid !== stoneUid);
    let replaced = null;
    if (item.bonuses.length >= 3 && replaceIndex >= 0) {
      replaced = item.bonuses.splice(replaceIndex, 1)[0];
    }
    item.bonuses.push({ stat: stone.stat, value: stone.value, tier: stone.tier });
    if (replaced) {
      const stat = BONUS_STATS[replaced.stat];
      this.addStone({
        uid: uid('st'), kind: 'stone', classId: item.classId, stat: replaced.stat, value: replaced.value,
        tier: replaced.tier || 3, name: `Recovered ${stat.name} Stone`, icon: stat.icon,
        desc: `Recovered bonus. +${replaced.value} ${stat.name}.`
      });
    }
    this._invalidate();
    this.recalcHP();
    Events.emit('inventory', this.data.inventory);
    Events.emit('stones', this.data.stones);
    Events.emit('equipment', this.data.equipped);
    return { ok: true, msg: `${stone.name} bound to ${item.name}. No item was destroyed.`, replaced };
  }

  // ------------------------------------------------------------
  // quests
  // ------------------------------------------------------------
  questState(id) {
    if (this.data.quests.completed.includes(id)) return 'completed';
    if (this.data.quests.active.some(q => q.id === id)) return 'active';
    return 'available';
  }

  activeQuest(id) { return this.data.quests.active.find(q => q.id === id); }

  questProgress(q) {
    if (q.type === 'level') return Math.min(this.char.level, q.required);
    if (q.type === 'collect') return Math.min(this.countMaterial(q.target), q.required);
    return Math.min(this.activeQuest(q.id)?.progress || 0, q.required);
  }

  canAcceptQuest(def) {
    if (!def) return { ok: false, reason: 'Unknown quest.' };
    if (this.questState(def.id) !== 'available') return { ok: false, reason: 'Quest already taken or completed.' };
    if (this.char.level < def.level) return { ok: false, reason: `Requires level ${def.level}.` };
    const missing = (def.requires || []).filter(id => !this.data.quests.completed.includes(id));
    if (missing.length) return { ok: false, reason: 'Prerequisite quest incomplete.' };
    return { ok: true };
  }

  acceptQuest(id) {
    const def = QUESTS.find(q => q.id === id);
    const check = this.canAcceptQuest(def);
    if (!check.ok) return { ok: false, msg: check.reason };
    const q = { id, progress: 0, acceptedAt: Date.now() };
    if (def.type === 'collect') q.progress = Math.min(def.required, this.countMaterial(def.target));
    this.data.quests.active.push(q);
    Events.emit('quests', this.data.quests);
    return { ok: true, msg: `Quest accepted: ${def.title}` };
  }

  abandonQuest(id) {
    const before = this.data.quests.active.length;
    this.data.quests.active = this.data.quests.active.filter(q => q.id !== id);
    if (before !== this.data.quests.active.length) {
      Events.emit('quests', this.data.quests);
      return { ok: true, msg: 'Quest abandoned.' };
    }
    return { ok: false, msg: 'Quest not active.' };
  }

  isQuestComplete(def) {
    if (!def) return false;
    return this.questProgress(def) >= def.required;
  }

  onKill(monsterId) {
    this.char.kills++;
    for (const q of this.data.quests.active) {
      const def = QUESTS.find(d => d.id === q.id);
      if (!def) continue;
      if (def.type === 'kill' && def.target === monsterId) {
        q.progress = Math.min(def.required, (q.progress || 0) + 1);
      }
    }
    if (MONSTERS[monsterId]?.boss) this.char.bosses++;
    Events.emit('quests', this.data.quests);
  }

  onCollect(materialId, count = 1) {
    for (const q of this.data.quests.active) {
      const def = QUESTS.find(d => d.id === q.id);
      if (!def || def.type !== 'collect' || def.target !== materialId) continue;
      q.progress = Math.min(def.required, this.countMaterial(materialId));
    }
    Events.emit('quests', this.data.quests);
  }

  claimQuest(id) {
    const def = QUESTS.find(q => q.id === id);
    const active = this.activeQuest(id);
    if (!def || !active) return { ok: false, msg: 'Quest not active.' };
    if (!this.isQuestComplete(def)) return { ok: false, msg: 'Objective incomplete.' };
    this.data.quests.active = this.data.quests.active.filter(q => q.id !== id);
    if (!this.data.quests.completed.includes(id)) this.data.quests.completed.push(id);
    this.data.quests.claimed.push(id);
    const r = def.rewards || {};
    if (r.gold) this.addGold(r.gold, 'quest', def.title);
    if (r.xp) this.gainXp(r.xp, 'quest');
    if (r.items?.includes('core')) this.addMaterial('mat_primordial_core', 1);
    if (r.unlock === 'wings_quest') {
      this.unlockQuestWings();
    }
    if (r.unlock === 'mount_gift') {
      if (!this.char.mountsOwned.includes('mount_steed')) this.char.mountsOwned.push('mount_steed');
      Events.emit('toast', { msg: 'Mount unlocked: Greendale Steed. Toggle it from the HUD.', type: 'success' });
    }
    if (r.title) this.char.title = r.title;
    Events.emit('quests', this.data.quests);
    Events.emit('toast', { msg: `Quest complete: ${def.title} — +${fmt(r.gold || 0)} gold`, type: 'success' });
    return { ok: true, msg: `Reward claimed: ${fmt(r.gold || 0)} gold, ${fmt(r.xp || 0)} XP.` };
  }

  unlockQuestWings() {
    const id = this.char.faction === 'angel' ? 'wings_dawn' : 'wings_night';
    if (!this.char.wingsUnlocked.includes(id)) this.char.wingsUnlocked.push(id);
    this.char.wingsActive = id;
    this.data.flags.wingsQuestDone = true;
    Events.emit('toast', { msg: `Wings unlocked: ${id === 'wings_dawn' ? 'Wings of Dawn' : 'Wings of Night'}!`, type: 'success' });
    Events.emit('character', this.char);
  }

  // ------------------------------------------------------------
  // teleport pricing
  // ------------------------------------------------------------
  teleportCost(fromId, toId, dungeonCost = null) {
    if (dungeonCost != null) return dungeonCost;
    const a = REGION_ORDER.indexOf(fromId);
    const b = REGION_ORDER.indexOf(toId);
    if (a < 0 || b < 0) return CONFIG.teleport.far;
    const diff = Math.abs(a - b);
    if (diff === 0) return CONFIG.teleport.same;
    if (diff === 1) return CONFIG.teleport.nearby;
    if (diff <= 3) return CONFIG.teleport.medium;
    if (diff <= 5) return CONFIG.teleport.far;
    return CONFIG.teleport.endgame;
  }

  // ------------------------------------------------------------
  // wings / mounts / cosmetics
  // ------------------------------------------------------------
  equipWings(id) {
    if (!this.char.wingsUnlocked.includes(id)) return { ok: false, msg: 'Wings not unlocked.' };
    this.char.wingsActive = this.char.wingsActive === id ? null : id;
    Events.emit('character', this.char);
    return { ok: true, msg: this.char.wingsActive ? 'Wings equipped.' : 'Wings hidden.' };
  }

  toggleMount() {
    if (!this.char.mountsOwned.length) return { ok: false, msg: 'You have no mounts yet.' };
    if (this.char.mountActive) {
      this.char.mountActive = null;
      this._invalidate();
      return { ok: true, msg: 'Dismounted.', mounted: false };
    }
    this.char.mountActive = this.char.mountsOwned[0];
    this._invalidate();
    return { ok: true, msg: `Mounted: ${SHOP.mounts.find(m => m.id === this.char.mountActive)?.name || 'Mount'}.`, mounted: true };
  }

  setMount(id) {
    if (!this.char.mountsOwned.includes(id)) return { ok: false, msg: 'Mount not owned.' };
    this.char.mountActive = id;
    this._invalidate();
    return { ok: true, msg: 'Mount equipped.' };
  }

  setPet(id) {
    if (!this.char.petsOwned.includes(id)) return { ok: false, msg: 'Pet not owned.' };
    this.char.petActive = this.char.petActive === id ? null : id;
    return { ok: true, msg: this.char.petActive ? 'Pet summoned.' : 'Pet dismissed.' };
  }

  setCostume(id) {
    if (id === null) { this.char.costume = null; return { ok: true, msg: 'Costume removed.' }; }
    if (!this.char.costumesOwned.includes(id)) return { ok: false, msg: 'Costume not owned.' };
    this.char.costume = this.char.costume === id ? null : id;
    return { ok: true, msg: this.char.costume ? 'Costume applied.' : 'Costume removed.' };
  }

  setHair(style, color, owned = false) {
    if (owned) {
      if (!this.char.hairstylesOwned.includes(style)) this.char.hairstylesOwned.push(style);
    }
    this.char.hair = style;
    if (color) this.char.hairColor = color;
    Events.emit('character', this.char);
    return { ok: true, msg: 'Hairstyle changed.' };
  }

  hairColorHex() {
    return HAIR_COLORS.find(h => h.id === this.char.hairColor)?.color || '#5b3a25';
  }

  eyeColorHex() {
    return EYE_COLORS.find(e => e.id === this.char.eyes)?.color || '#3f8cff';
  }

  // ------------------------------------------------------------
  // market (local simulation — buyers are not real players)
  // ------------------------------------------------------------
  stallActive() {
    return this.data.market.stallUntil > Date.now();
  }

  rentStall() {
    if (this.stallActive()) return { ok: false, msg: 'Your stall is already active.' };
    if (!this.spendGold(CONFIG.market.stallCost, 'market_stall', '24h market stall')) {
      return { ok: false, msg: `Need ${fmt(CONFIG.market.stallCost)} gold.` };
    }
    this.data.market.stallUntil = Date.now() + CONFIG.market.stallHours * 3600 * 1000;
    Events.emit('market', this.data.market);
    return { ok: true, msg: 'Market stall rented for 24 hours.' };
  }

  listItem(itemUid, price) {
    if (!this.stallActive()) return { ok: false, msg: 'Rent a market stall first.' };
    if (this.data.market.listings.length >= CONFIG.market.listingSlots) return { ok: false, msg: 'All listing slots are full.' };
    price = Math.floor(Number(price));
    if (!Number.isFinite(price) || price <= 0) return { ok: false, msg: 'Enter a valid price.' };
    const idx = this.data.inventory.findIndex(i => i.uid === itemUid);
    if (idx < 0) return { ok: false, msg: 'Item not found.' };
    const item = this.data.inventory[idx];
    if (item.kind !== 'equip') return { ok: false, msg: 'Only equipment can be listed.' };
    this.data.inventory.splice(idx, 1);
    const listing = {
      id: uid('lst'), item, price, listedAt: Date.now(),
      buyerAt: Date.now() + (45000 + Math.random() * 180000), // simulated buyer window
      simulated: true
    };
    this.data.market.listings.push(listing);
    this._invalidate();
    Events.emit('inventory', this.data.inventory);
    Events.emit('market', this.data.market);
    return { ok: true, msg: `${item.name} listed for ${fmt(price)} gold (simulated buyers).` };
  }

  cancelListing(listingId) {
    const idx = this.data.market.listings.findIndex(l => l.id === listingId);
    if (idx < 0) return { ok: false, msg: 'Listing not found.' };
    const [listing] = this.data.market.listings.splice(idx, 1);
    if (!this.hasInventorySpace()) {
      this.data.market.listings.push(listing);
      return { ok: false, msg: 'No inventory space.' };
    }
    this.data.inventory.push(listing.item);
    Events.emit('inventory', this.data.inventory);
    Events.emit('market', this.data.market);
    return { ok: true, msg: 'Listing cancelled, item returned.' };
  }

  // called by the game loop periodically
  tickMarket(now = Date.now()) {
    if (!this.stallActive()) return [];
    const sold = [];
    for (const listing of [...this.data.market.listings]) {
      if (now >= listing.buyerAt) {
        const idx = this.data.market.listings.indexOf(listing);
        this.data.market.listings.splice(idx, 1);
        this.data.market.sold.unshift({ ...listing, soldAt: now, buyer: 'Traveling Adventurer' });
        this.data.market.sold = this.data.market.sold.slice(0, 30);
        this.addGold(listing.price, 'market_sale', `Market sale: ${listing.item.name} (simulated buyer)`);
        sold.push(listing);
      }
    }
    if (sold.length) Events.emit('market', this.data.market);
    return sold;
  }

  listingsExpired() {
    return this.data.market.stallUntil > 0 && this.data.market.stallUntil <= Date.now();
  }

  // ------------------------------------------------------------
  // shop (test purchases only — no real money)
  // ------------------------------------------------------------
  ownsShopItem(id) {
    return this.char.wingsUnlocked.includes(id)
      || this.char.mountsOwned.includes(id)
      || this.char.petsOwned.includes(id)
      || this.char.costumesOwned.includes(id)
      || this.char.hairstylesOwned.includes(id)
      || this.char.weaponFx === id
      || this.data.shop.owned.includes(id);
  }

  buyGems(packId) {
    const pack = CONFIG.shop.gemPacks.find(p => p.id === packId);
    if (!pack) return { ok: false, msg: 'Unknown gem pack.' };
    this.addGems(pack.gems);
    this.data.shop.owned.push(packId);
    this.data.shop.purchases.push({ id: packId, ts: Date.now(), testMode: true, gems: pack.gems });
    return { ok: true, msg: `TEST PURCHASE: +${fmt(pack.gems)} gems. No money was charged.` };
  }

  buyShopItem(category, id) {
    if (category === 'gems') return this.buyGems(id);
    if (category === 'offers') {
      const offer = SHOP.offers.find(o => o.id === id);
      if (!offer) return { ok: false, msg: 'Unknown offer.' };
      if (this.ownsShopItem(id)) return { ok: false, msg: 'Already purchased.' };
      if (!this.spendGems(offer.price)) return { ok: false, msg: `Not enough gems (need ${offer.price}).` };
      for (const productId of offer.bundle) {
        if (productId === 'wings_seraph' || productId === 'wings_night' || productId === 'wings_dawn' || productId === 'wings_abyss') {
          if (!this.char.wingsUnlocked.includes(productId)) this.char.wingsUnlocked.push(productId);
          const w = SHOP.wings.find(x => x.id === productId);
          if (w && w.faction === this.char.faction) this.char.wingsActive = productId;
        } else if (productId.startsWith('mount_')) {
          if (!this.char.mountsOwned.includes(productId)) this.char.mountsOwned.push(productId);
        } else if (productId.startsWith('fx_')) {
          this.char.weaponFx = productId;
        } else if (productId === 'prem_xp') {
          this.char.premium.xpUntil = Date.now() + 86400000;
        } else if (productId === 'prem_gold') {
          this.char.premium.goldUntil = Date.now() + 86400000;
        } else if (productId === 'prem_bag') {
          this.char.bagBonus = (this.char.bagBonus || 0) + 20;
        }
      }
      this.data.shop.owned.push(id);
      this.data.shop.purchases.push({ id, category, ts: Date.now(), testMode: true });
      this._invalidate();
      Events.emit('character', this.char);
      return { ok: true, msg: `TEST PURCHASE: ${offer.name} unlocked. No money was charged.` };
    }

    const list = SHOP[category];
    if (!list) return { ok: false, msg: 'Unknown shop category.' };
    const item = list.find(i => i.id === id);
    if (!item) return { ok: false, msg: 'Unknown item.' };
    if (category === 'premium') {
      // consumable premium services can be bought repeatedly, but bag has a cap
      if (item.effect === 'bag' && this.char.bagBonus >= 100) return { ok: false, msg: 'Bag upgrade cap reached.' };
    } else if (this.ownsShopItem(id)) {
      return { ok: false, msg: 'Already owned.' };
    }
    // Validate faction restrictions BEFORE spending gems so a rejected
    // purchase can never consume currency.
    if (category === 'wings' && item.faction !== this.char.faction) {
      return { ok: false, msg: `These wings are for ${FACTIONS[item.faction].name} only.` };
    }
    if (!this.spendGems(item.price)) return { ok: false, msg: `Not enough gems (need ${item.price}).` };

    if (category === 'wings') {
      if (!this.char.wingsUnlocked.includes(id)) this.char.wingsUnlocked.push(id);
      this.char.wingsActive = id;
    } else if (category === 'mounts') {
      if (!this.char.mountsOwned.includes(id)) this.char.mountsOwned.push(id);
      this.char.mountActive = id;
    } else if (category === 'pets') {
      if (!this.char.petsOwned.includes(id)) this.char.petsOwned.push(id);
      this.char.petActive = id;
    } else if (category === 'costumes') {
      if (!this.char.costumesOwned.includes(id)) this.char.costumesOwned.push(id);
      this.char.costume = id;
    } else if (category === 'hairstyles') {
      if (!this.char.hairstylesOwned.includes(id)) this.char.hairstylesOwned.push(id);
      this.char.hair = item.style;
      const hc = HAIR_COLORS.find(h => h.color === item.color);
      this.char.hairColor = hc?.id || 'silver';
    } else if (category === 'effects') {
      this.char.weaponFx = id;
    } else if (category === 'premium') {
      if (item.effect === 'xp') this.char.premium.xpUntil = Date.now() + 86400000;
      if (item.effect === 'gold') this.char.premium.goldUntil = Date.now() + 86400000;
      if (item.effect === 'bag') { this.char.bagBonus = (this.char.bagBonus || 0) + 20; this._invalidate(); }
    }
    this.data.shop.owned.push(id);
    this.data.shop.purchases.push({ id, category, ts: Date.now(), testMode: true });
    this._invalidate();
    Events.emit('character', this.char);
    Events.emit('shop', this.data.shop);
    return { ok: true, msg: `TEST PURCHASE: ${item.name} unlocked. No money was charged.` };
  }

  petDef() {
    return SHOP.pets.find(p => p.id === this.char.petActive) || null;
  }

  mountDef() {
    return SHOP.mounts.find(m => m.id === this.char.mountActive) || null;
  }

  costumePalette() {
    const c = SHOP.costumes.find(x => x.id === this.char.costume);
    return c?.palette || null;
  }

  wingsDef() {
    return SHOP.wings.find(w => w.id === this.char.wingsActive) || null;
  }

  weaponFxDef() {
    return SHOP.effects.find(e => e.id === this.char.weaponFx) || null;
  }

  title() {
    return this.char.title || 'Wanderer';
  }

  // ------------------------------------------------------------
  // storage
  // ------------------------------------------------------------
  depositItem(itemUid) {
    const idx = this.data.inventory.findIndex(i => i.uid === itemUid);
    if (idx < 0) return { ok: false, msg: 'Item not found.' };
    if (this.data.storage.length >= CONFIG.storageSize) return { ok: false, msg: 'Storage is full.' };
    const [item] = this.data.inventory.splice(idx, 1);
    this.data.storage.push(item);
    Events.emit('inventory', this.data.inventory);
    Events.emit('storage', this.data.storage);
    return { ok: true, msg: `${item.name} stored.` };
  }

  withdrawItem(itemUid) {
    const idx = this.data.storage.findIndex(i => i.uid === itemUid);
    if (idx < 0) return { ok: false, msg: 'Item not found.' };
    if (!this.hasInventorySpace()) return { ok: false, msg: 'Inventory full.' };
    const [item] = this.data.storage.splice(idx, 1);
    this.data.inventory.push(item);
    Events.emit('inventory', this.data.inventory);
    Events.emit('storage', this.data.storage);
    return { ok: true, msg: `${item.name} withdrawn.` };
  }

  // ------------------------------------------------------------
  // skill
  // ------------------------------------------------------------
  skillUpgradeCost(level = this.char.skillLevel) {
    return Math.floor(2500 * Math.pow(level, 1.65));
  }

  skillUpgradeLevelReq(level = this.char.skillLevel) {
    return Math.max(1, (level) * 4);
  }

  upgradeSkill() {
    const lv = this.char.skillLevel;
    if (lv >= 10) return { ok: false, msg: 'Skill is already at maximum level.' };
    if (this.char.level < this.skillUpgradeLevelReq(lv)) {
      return { ok: false, msg: `Reach level ${this.skillUpgradeLevelReq(lv)} to upgrade.` };
    }
    const cost = this.skillUpgradeCost(lv);
    if (!this.spendGold(cost, 'skill_upgrade', `${this.cls.skill.name} level ${lv + 1}`)) {
      return { ok: false, msg: `Need ${fmt(cost)} gold.` };
    }
    this.char.skillLevel = lv + 1;
    Events.emit('skill', this.char.skillLevel);
    Events.emit('character', this.char);
    return { ok: true, msg: `${this.cls.skill.name} upgraded to level ${lv + 1}.` };
  }

  // ------------------------------------------------------------
  // progress helpers for UI
  // ------------------------------------------------------------
  region() { return REGIONS[this.char.region] || REGIONS.greendale; }

  availableQuests() {
    return QUESTS.filter(q => {
      const state = this.questState(q.id);
      if (state !== 'available') return false;
      return this.char.level >= q.level && (q.requires || []).every(id => this.data.quests.completed.includes(id));
    });
  }

  trackQuest() {
    const active = this.data.quests.active
      .map(a => ({ ...a, def: QUESTS.find(q => q.id === a.id) }))
      .filter(q => q.def);
    return active[0] || null;
  }

  markTutorial(step) {
    if (step > (this.char.tutorialStep || 0)) this.char.tutorialStep = step;
  }

  addPlaytime(dt) {
    if (!this.data) return;
    this.data.playtime += dt;
    const eco = this.data.economy;
    const hours = Math.max(0.02, this.data.playtime / 3600);
    const gph = eco.lifetimeEarned / hours;
    if (gph > (this.char.highestGoldPerHour || 0)) this.char.highestGoldPerHour = gph;
  }
}

export const State = new AetheriaState();
export default State;
