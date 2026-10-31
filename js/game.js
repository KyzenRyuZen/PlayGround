/* Ashen Oath — game systems
   Save-compatible, dependency-free idle RPG state machine. */
(function () {
  'use strict';

  const D = window.GameData;
  const { RARITIES, RARITY_BY_ID, SLOTS, SLOT_BY_ID, PREFIXES, FLAVOR, AFFIXES, UPGRADES, ZONES, CONFIG } = D;
  const SAVE_KEY = 'ashen-oath-save-v1';
  const MAX_LEVEL = 100;

  let state = null;
  let hooks = {};
  let running = false;
  let paused = false;
  let lastFrame = 0;
  let autoTimer = 0;
  let enemyTimer = 0;
  let respawnTimer = 0;
  let vitalsTimer = 0;
  let saveTimer = 0;
  let logEntries = [];
  let offlineSummary = null;
  let lastRegenAt = 0;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const round1 = (n) => Math.round(n * 10) / 10;

  function freshZoneProgress() {
    const out = {};
    ZONES.forEach((z) => { out[z.id] = { kills: 0, bosses: 0, defeated: false }; });
    return out;
  }

  function createState() {
    const s = {
      version: 3,
      level: 1,
      xp: 0,
      gold: 20,
      hp: CONFIG.baseHp,
      inventory: [],
      equipment: { weapon: null, helmet: null, chest: null, gloves: null, boots: null, ring: null, necklace: null },
      upgrades: { damage: 0, speed: 0, crit: 0, lore: 0, fortune: 0 },
      autoStrike: false,
      autoEnabled: true,
      currentZone: 0,
      zoneProgress: freshZoneProgress(),
      enemy: null,
      downedUntil: 0,
      nextItemId: 1,
      records: { kills: 0, bosses: 0, goldEarned: 0, itemsFound: 0, itemsSold: 0, itemsForged: 0, startedAt: Date.now() },
      settings: { sound: true },
      lastSeen: Date.now(),
      firstRun: true
    };

    // A humble beginning: one worn blade and three relics begging to be fused.
    const starterWeapon = makeItem('weapon', 'common', 1);
    starterWeapon.id = 'starter_weapon';
    starterWeapon.name = 'Rusted Shortsword';
    starterWeapon.lore = 'The blade that refused to be buried with its first owner.';
    starterWeapon.fresh = false;
    s.equipment.weapon = starterWeapon;
    for (let i = 0; i < 3; i++) {
      const boot = makeItem('boots', 'common', 1 + i);
      // Stable ids keep resets from ever colliding with freshly generated relics.
      boot.id = `starter_boot_${i + 1}`;
      boot.fresh = i === 2;
      s.inventory.push(boot);
    }
    s.hp = computeStats(s).maxHp;
    return s;
  }

  function sanitizeItem(raw) {
    if (!raw || !SLOT_BY_ID[raw.slot] || !RARITY_BY_ID[raw.rarity]) return null;
    const item = {
      id: String(raw.id || ('it_' + Date.now())),
      slot: raw.slot,
      rarity: raw.rarity,
      name: String(raw.name || 'Relic'),
      ilvl: clamp(Math.round(Number(raw.ilvl) || 1), 1, 999),
      stats: {},
      affixes: Array.isArray(raw.affixes) ? raw.affixes.filter((a) => a && a.name) : [],
      lore: String(raw.lore || ''),
      fresh: !!raw.fresh
    };
    Object.keys(raw.stats || {}).forEach((k) => {
      const v = Number(raw.stats[k]);
      if (Number.isFinite(v) && v > 0 && D.STAT_LABELS[k]) item.stats[k] = v;
    });
    if (!Object.keys(item.stats).length) return null;
    item.power = itemScore(item);
    return item;
  }

  function sanitizeState(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const s = {
      version: 3,
      level: clamp(Math.round(Number(raw.level) || 1), 1, MAX_LEVEL),
      xp: Math.max(0, Number(raw.xp) || 0),
      gold: Math.max(0, Math.floor(Number(raw.gold) || 0)),
      hp: Math.max(0, Number(raw.hp) || CONFIG.baseHp),
      inventory: Array.isArray(raw.inventory) ? raw.inventory.map(sanitizeItem).filter(Boolean).slice(0, CONFIG.inventorySize) : [],
      equipment: { weapon: null, helmet: null, chest: null, gloves: null, boots: null, ring: null, necklace: null },
      upgrades: {},
      autoStrike: !!raw.autoStrike,
      autoEnabled: raw.autoEnabled !== false,
      currentZone: clamp(Math.round(Number(raw.currentZone) || 0), 0, ZONES.length - 1),
      zoneProgress: freshZoneProgress(),
      enemy: null,
      downedUntil: 0,
      nextItemId: Math.max(1, Math.floor(Number(raw.nextItemId) || 1)),
      records: Object.assign({ kills: 0, bosses: 0, goldEarned: 0, itemsFound: 0, itemsSold: 0, itemsForged: 0, startedAt: Date.now() }, raw.records || {}),
      settings: Object.assign({ sound: true }, raw.settings || {}),
      lastSeen: Number(raw.lastSeen) || Date.now(),
      firstRun: false
    };
    UPGRADES.forEach((u) => { s.upgrades[u.id] = clamp(Math.floor(Number(raw.upgrades?.[u.id]) || 0), 0, u.max); });
    ZONES.forEach((z) => {
      const p = raw.zoneProgress?.[z.id];
      if (p) s.zoneProgress[z.id] = { kills: clamp(Math.floor(Number(p.kills) || 0), 0, CONFIG.bossEvery), bosses: Math.max(0, Math.floor(Number(p.bosses) || 0)), defeated: !!p.defeated };
    });
    ['weapon', 'helmet', 'chest', 'gloves', 'boots', 'ring', 'necklace'].forEach((slot) => {
      const item = sanitizeItem(raw.equipment?.[slot]);
      if (item && item.slot === slot) s.equipment[slot] = item;
    });
    if (raw.enemy && raw.enemy.name && raw.enemy.hp > 0 && raw.enemy.maxHp > 0) {
      const zone = ZONES[s.currentZone];
      if (raw.enemy.zoneId === zone.id) {
        s.enemy = {
          name: String(raw.enemy.name),
          trait: String(raw.enemy.trait || ''),
          zoneId: zone.id,
          level: Math.max(1, Math.floor(Number(raw.enemy.level) || 1)),
          maxHp: Math.max(1, Math.floor(Number(raw.enemy.maxHp))),
          hp: clamp(Math.floor(Number(raw.enemy.hp)), 1, Number(raw.enemy.maxHp)),
          atk: Math.max(1, Math.floor(Number(raw.enemy.atk) || 1)),
          xp: Math.max(1, Math.floor(Number(raw.enemy.xp) || 1)),
          gold: Math.max(1, Math.floor(Number(raw.enemy.gold) || 1)),
          isBoss: !!raw.enemy.isBoss,
          rank: String(raw.enemy.rank || (raw.enemy.isBoss ? 'Zone Boss' : 'Lesser Fiend'))
        };
      }
    }
    s.hp = clamp(s.hp, 1, computeStats(s).maxHp);
    return s;
  }

  /* ── Item generation ─────────────────────────────────────── */
  function itemScore(item) {
    const s = item.stats || {};
    const score =
      (s.atk || 0) * 3.1 +
      (s.hp || 0) * 0.37 +
      (s.armor || 0) * 1.25 +
      (s.crit || 0) * 9 +
      (s.critDamage || 0) * 3.3 +
      (s.speed || 0) * 4.2 +
      (s.goldFind || 0) * 0.16 +
      (s.xpGain || 0) * 0.16 +
      (s.lootFind || 0) * 0.5 +
      (s.lifesteal || 0) * 8;
    return Math.max(1, Math.round(score));
  }

  function pickAffix(item, rarity) {
    const allowed = AFFIXES.filter((a) => a.minRarity <= rarity.index);
    if (!allowed.length) return null;
    const used = new Set(item.affixes.map((a) => a.id));
    const available = allowed.filter((a) => !used.has(a.id));
    if (!available.length) return null;
    const def = pick(available);
    const key = Object.keys(def.stats)[0];
    const range = def.stats[key];
    let value = round1(rand(range[0], range[1]));
    if (['crit', 'speed', 'lifesteal', 'critDamage', 'goldFind', 'xpGain', 'lootFind'].includes(key)) {
      // values are percentages; preserve one decimal
      value = round1(value);
    } else {
      value = Math.max(1, Math.round(value));
    }
    item.stats[key] = round1((item.stats[key] || 0) + value);
    item.affixes.push({
      id: def.id,
      name: def.name,
      icon: def.icon,
      stat: key,
      value,
      desc: def.desc.replace('{value}', key === 'armor' ? `+${value}` : `${value}%`)
    });
    return def;
  }

  function makeItem(slotId, rarityId, ilvl, options = {}) {
    const slot = SLOT_BY_ID[slotId] || pick(SLOTS);
    const rarity = RARITY_BY_ID[rarityId] || RARITIES[0];
    ilvl = clamp(Math.round(ilvl || 1), 1, 999);
    const power = (3.4 + ilvl * 1.53) * rarity.mult * rand(0.92, 1.08);
    const stats = {};

    switch (slot.id) {
      case 'weapon':
        stats.atk = Math.max(1, Math.round(power * 1.28));
        stats.crit = round1(rand(0.3, 1.1) + rarity.index * 0.22);
        break;
      case 'helmet':
        stats.armor = Math.max(1, Math.round(power * 0.58));
        stats.hp = Math.max(2, Math.round(power * 1.75));
        break;
      case 'chest':
        stats.armor = Math.max(1, Math.round(power * 0.92));
        stats.hp = Math.max(3, Math.round(power * 2.65));
        break;
      case 'gloves':
        stats.atk = Math.max(1, Math.round(power * 0.52));
        stats.crit = round1(0.4 + ilvl * 0.045 + rarity.index * 0.42 + rand(0, 0.6));
        break;
      case 'boots':
        stats.armor = Math.max(1, Math.round(power * 0.34));
        stats.speed = round1(1.8 + ilvl * 0.045 + rarity.index * 0.65 + rand(0, 0.65));
        break;
      case 'ring':
        stats.atk = Math.max(1, Math.round(power * 0.62));
        stats.crit = round1(0.3 + ilvl * 0.028 + rarity.index * 0.32 + rand(0, 0.5));
        stats.goldFind = round1(3 + ilvl * 0.16 + rarity.index * 1.5 + rand(0, 4));
        break;
      case 'necklace':
        stats.hp = Math.max(2, Math.round(power * 1.32));
        stats.xpGain = round1(2 + ilvl * 0.12 + rarity.index * 1.7 + rand(0, 3));
        stats.lootFind = round1(1 + rarity.index * 0.55 + rand(0, 0.9));
        break;
      default:
        stats.atk = Math.max(1, Math.round(power));
    }

    const item = {
      id: 'it_' + (state ? state.nextItemId++ : Date.now() + Math.floor(Math.random() * 9999)),
      slot: slot.id,
      rarity: rarity.id,
      ilvl,
      name: `${pick(PREFIXES[rarity.id])} ${pick(slot.base)}`,
      stats,
      affixes: [],
      lore: pick(FLAVOR[rarity.id]),
      fresh: options.fresh !== false
    };

    const affixChance = [0, 0, 0.5, 0.72, 1, 1][rarity.index];
    if (rarity.index >= 2 && Math.random() < affixChance) pickAffix(item, rarity);
    if (rarity.index === 5) pickAffix(item, rarity);

    item.power = itemScore(item);
    if (options.name) item.name = options.name;
    return item;
  }

  function rollRarity(luck = 0, boss = false) {
    const weights = RARITIES.map((r, i) => {
      if (i === 0) return r.weight;
      return r.weight * Math.pow(1 + luck + (boss ? 0.55 : 0), Math.max(1, i - 1) * 0.5);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return RARITIES[i];
    }
    return RARITIES[0];
  }

  function generateDrop(enemy, zone, bossDrop = false) {
    const stats = computeStats();
    const luck = zone.lootBonus + stats.upgrades.fortune * 0.015 + (bossDrop ? 0.45 : 0);
    const rarity = rollRarity(luck, bossDrop);
    const slot = pick(SLOTS).id;
    const ilvl = Math.max(1, enemy.level + (bossDrop ? 2 : 0) + randInt(-1, 1));
    return makeItem(slot, rarity.id, ilvl, { fresh: true });
  }

  function sellPrice(item) {
    const r = RARITY_BY_ID[item.rarity] || RARITIES[0];
    return Math.max(1, Math.round((4 + item.ilvl * 2.6) * r.sell));
  }

  function addItem(item) {
    if (state.inventory.length >= CONFIG.inventorySize) {
      const price = sellPrice(item);
      state.gold += price;
      state.records.goldEarned += price;
      emit('log', { text: `Satchel full — ${item.name} sold for ${price}g.`, type: 'muted' });
      return null;
    }
    state.inventory.push(item);
    state.records.itemsFound++;
    return item;
  }

  /* ── Stats & progression ─────────────────────────────────── */
  function computeStats(s = state) {
    if (!s) return {
      attack: 0, maxHp: CONFIG.baseHp, armor: 0, crit: 5, critMult: 1.8, interval: CONFIG.autoBaseInterval,
      xpMult: 1, goldMult: 1, lootChance: CONFIG.baseLootChance, lifesteal: 0, dps: 0, armorReduction: 0
    };
    const gear = {
      atk: 0, hp: 0, armor: 0, crit: 0, critDamage: 0, speed: 0,
      goldFind: 0, xpGain: 0, lootFind: 0, lifesteal: 0
    };
    SLOTS.forEach((slot) => {
      const item = s.equipment[slot.id];
      if (!item) return;
      Object.keys(item.stats || {}).forEach((key) => {
        if (gear[key] !== undefined) gear[key] += Number(item.stats[key]) || 0;
      });
    });

    const attack = Math.round(9 + (s.level - 1) * 2.5 + (s.upgrades.damage || 0) * 2.5 + gear.atk);
    const maxHp = Math.round(CONFIG.baseHp + (s.level - 1) * 17 + gear.hp);
    const crit = clamp(CONFIG.critBase + (s.upgrades.crit || 0) * 1 + gear.crit, 0, CONFIG.maxCrit);
    const critMult = CONFIG.critDamageBase + gear.critDamage / 100;
    const speedFactor = Math.pow(0.978, s.upgrades.speed || 0) * (1 - Math.min(0.45, gear.speed / 100));
    const interval = Math.max(0.34, CONFIG.autoBaseInterval * speedFactor);
    const lootChance = Math.min(0.72, CONFIG.baseLootChance + (s.upgrades.fortune || 0) * 0.007 + gear.lootFind / 100);
    const dps = (attack * (1 + (crit / 100) * (critMult - 1))) / interval;
    const armorReduction = Math.min(0.65, gear.armor / (gear.armor + 95 + s.level * 7));

    return {
      attack: Math.max(1, attack),
      maxHp: Math.max(1, maxHp),
      armor: Math.round(gear.armor),
      crit: round1(crit),
      critMult: Math.round(critMult * 100) / 100,
      interval: Math.round(interval * 100) / 100,
      xpMult: 1 + (s.upgrades.lore || 0) * 0.07 + gear.xpGain / 100,
      goldMult: 1 + gear.goldFind / 100,
      lootChance,
      lifesteal: gear.lifesteal,
      dps: Math.round(dps),
      gearSpeed: round1(gear.speed),
      armorReduction,
      upgrades: s.upgrades
    };
  }

  function xpToNext(level) {
    if (level >= MAX_LEVEL) return 0;
    return Math.round(CONFIG.xpBase * Math.pow(CONFIG.xpGrowth, level - 1));
  }

  function addXp(amount, silent = false) {
    if (state.level >= MAX_LEVEL) { state.xp = 0; return 0; }
    state.xp += Math.max(0, Math.round(amount));
    let gained = 0;
    while (state.level < MAX_LEVEL && state.xp >= xpToNext(state.level)) {
      state.xp -= xpToNext(state.level);
      state.level++;
      gained++;
      if (!silent) {
        state.hp = computeStats().maxHp;
        addLog(`<b>Level ${state.level}</b> reached. Power surges through you.`, 'level');
        emit('levelUp', { level: state.level });
        maybeAnnounceUnlock();
      }
    }
    if (state.level >= MAX_LEVEL) state.xp = 0;
    return gained;
  }

  function maybeAnnounceUnlock() {
    // A zone can become available when the level requirement catches up with a defeated boss.
    if (state.currentZone + 1 < ZONES.length) {
      const next = ZONES[state.currentZone + 1];
      if (zoneUnlocked(state.currentZone + 1) && state.level === next.unlockLevel) {
        emit('zoneUnlocked', { index: state.currentZone + 1, zone: next });
      }
    }
  }

  function zoneUnlocked(index) {
    if (index <= 0) return true;
    if (index >= ZONES.length) return false;
    const previous = ZONES[index - 1];
    const next = ZONES[index];
    return !!(state.zoneProgress[previous.id]?.defeated && state.level >= next.unlockLevel);
  }

  function getProgress(index = state.currentZone) {
    const zone = ZONES[index];
    return state.zoneProgress[zone.id];
  }

  function getZoneDifficulty(enemy) {
    if (!enemy) return 'Unknown';
    const diff = enemy.level - state.level;
    if (diff >= 8) return 'Deadly';
    if (diff >= 4) return 'Dire';
    if (diff >= 1) return 'Even';
    if (diff >= -3) return 'Favorable';
    return 'Trivial';
  }

  /* ── Enemies ─────────────────────────────────────────────── */
  function enemyBlueprint(zone, kills, forceBoss = false) {
    const isBoss = forceBoss || kills >= CONFIG.bossEvery;
    const regularLevel = zone.enemyLevel + Math.floor(kills / 2);
    const level = regularLevel + (isBoss ? 2 : 0);
    const hp = Math.round((38 + level * 14) * zone.hpMult * (isBoss ? 4.8 : 1));
    const atk = Math.round((3 + level * 1.15) * zone.atkMult * (isBoss ? 1.55 : 1));
    const xp = Math.round((9 + level * 3.4) * zone.rewardMult * (isBoss ? 5.2 : 1));
    const gold = Math.round((5 + level * 2.15) * zone.rewardMult * (isBoss ? 5.2 : 1));
    const template = isBoss ? zone.boss : zone.enemies[(kills + zone.tierNum) % zone.enemies.length];
    return {
      name: template.name,
      trait: template.trait,
      zoneId: zone.id,
      level,
      maxHp: hp,
      hp,
      atk,
      xp,
      gold,
      isBoss,
      rank: isBoss ? 'Zone Boss' : (zone.tierNum >= 5 ? 'Dread Fiend' : zone.tierNum >= 3 ? 'Greater Fiend' : 'Lesser Fiend')
    };
  }

  function spawnEnemy(forceBoss = false) {
    const zone = ZONES[state.currentZone];
    const progress = getProgress();
    const enemy = enemyBlueprint(zone, progress.kills, forceBoss);
    state.enemy = enemy;
    respawnTimer = 0;
    enemyTimer = CONFIG.enemyAttackInterval * 0.75;
    autoTimer = Math.min(autoTimer, 0.2);
    addLog(`${enemy.isBoss ? '<b>Boss:</b> ' : ''}${enemy.name} emerges in ${zone.name}.`, enemy.isBoss ? 'boss' : 'muted');
    emit('spawn', { enemy });
    if (enemy.isBoss) emit('bossSpawn', { enemy, zone });
    emit('render', { reason: 'spawn' });
    save();
  }

  function killEnemy() {
    const enemy = state.enemy;
    if (!enemy) return;
    const zone = ZONES[state.currentZone];
    const progress = getProgress();
    const stats = computeStats();
    const isBoss = enemy.isBoss;
    const isFirstBoss = isBoss && !progress.defeated;
    const goldGain = Math.round(enemy.gold * stats.goldMult);
    const xpGain = Math.round(enemy.xp * stats.xpMult);

    state.gold += goldGain;
    state.records.goldEarned += goldGain;
    state.records.kills++;
    if (isBoss) state.records.bosses++;

    const drops = [];
    let dropCount = 0;
    if (isBoss) {
      dropCount = 2 + (Math.random() < stats.lootChance ? 1 : 0);
    } else if (Math.random() < stats.lootChance) {
      dropCount = 1;
    }
    for (let i = 0; i < dropCount; i++) {
      const drop = generateDrop(enemy, zone, isBoss || i > 0);
      if (addItem(drop)) drops.push(drop);
    }

    if (isBoss) {
      progress.bosses++;
      progress.kills = 0;
      progress.defeated = true;
    } else {
      progress.kills = Math.min(CONFIG.bossEvery, progress.kills + 1);
    }

    state.hp = Math.min(stats.maxHp, state.hp + Math.round(stats.maxHp * 0.035));
    addLog(`<span class="log-kill">${enemy.name} slain.</span> +${goldGain}g${drops.length ? ` · ${drops.length} relic${drops.length > 1 ? 's' : ''}` : ''}`, isBoss ? 'boss' : 'kill');

    const levelsGained = addXp(xpGain);
    const nextZoneUnlocked = isBoss && isFirstBoss && state.currentZone + 1 < ZONES.length && zoneUnlocked(state.currentZone + 1);
    const nextZone = state.currentZone + 1 < ZONES.length ? ZONES[state.currentZone + 1] : null;

    const payload = {
      enemy: Object.assign({}, enemy, { zoneName: zone.name }),
      gold: goldGain,
      xp: xpGain,
      items: drops,
      boss: isBoss,
      firstBoss: isFirstBoss,
      levels: levelsGained,
      nextZone,
      nextZoneUnlocked,
      nextZoneRequirement: nextZone ? nextZone.unlockLevel : 0,
      zone
    };

    state.enemy = null;
    respawnTimer = 0.9;
    emit('kill', payload);
    emit('render', { reason: 'kill' });

    if (isBoss) {
      emit('bossDefeated', payload);
      if (isFirstBoss && nextZone) {
        if (nextZoneUnlocked) {
          addLog(`<b>${nextZone.name}</b> unlocked.`, 'unlock');
          emit('zoneUnlocked', { index: state.currentZone + 1, zone: nextZone });
        } else {
          addLog(`${nextZone.name} requires level ${nextZone.unlockLevel}.`, 'muted');
        }
      }
    } else if (drops.length && !isBoss) {
      drops.forEach((item) => emit('loot', { item }));
    }

    if (levelsGained) emit('render', { reason: 'level' });
    save();
  }

  function hitEnemy(crit, damage) {
    const enemy = state.enemy;
    const stats = computeStats();
    if (!enemy || state.hp <= 0) return;
    const dealt = Math.min(enemy.hp, damage);
    enemy.hp -= dealt;
    if (stats.lifesteal > 0) {
      const heal = Math.max(1, Math.round(dealt * stats.lifesteal / 100));
      const before = state.hp;
      state.hp = Math.min(stats.maxHp, state.hp + heal);
      if (state.hp > before) emit('heal', { amount: state.hp - before });
    }
    emit('hit', {
      damage,
      crit,
      lifesteal: stats.lifesteal,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      isBoss: enemy.isBoss
    });
    if (enemy.hp <= 0) {
      emit('enemyDown', { enemy });
      killEnemy();
    }
    vitalsTimer = 0;
  }

  function strike(fromAuto = false) {
    if (!state.enemy || paused || state.hp <= 0) return false;
    const stats = computeStats();
    const crit = Math.random() * 100 < stats.crit;
    let damage = stats.attack * rand(0.9, 1.1) * (crit ? stats.critMult : 1);
    damage = Math.max(1, Math.round(damage));
    if (fromAuto) autoTimer = stats.interval;
    emit('attack', { auto: fromAuto, crit, damage });
    hitEnemy(crit, damage);
    return true;
  }

  function enemyStrike() {
    const enemy = state.enemy;
    if (!enemy || state.hp <= 0 || paused) return;
    const stats = computeStats();
    const raw = enemy.atk * rand(0.86, 1.14) * (1 - stats.armorReduction);
    const damage = Math.max(1, Math.round(raw));
    state.hp = Math.max(0, state.hp - damage);
    enemyTimer = CONFIG.enemyAttackInterval;
    emit('enemyAttack', { damage, hp: state.hp, maxHp: stats.maxHp, enemy });
    if (state.hp <= 0) downHero();
  }

  function downHero() {
    const enemy = state.enemy;
    state.downedUntil = Date.now() + 3600;
    addLog('You fall to one knee. The dark presses close…', 'down');
    emit('downed', { duration: 3.6 });
    emit('render', { reason: 'downed' });
    save();
  }

  function reviveHero() {
    state.downedUntil = 0;
    state.hp = computeStats().maxHp;
    enemyTimer = CONFIG.enemyAttackInterval;
    autoTimer = 0.5;
    addLog('You rise again. The enemy\'s wounds remain.', 'unlock');
    emit('revived', {});
    emit('render', { reason: 'revived' });
  }

  /* ── Upgrades, equipment, forging ─────────────────────────── */
  function upgradeCost(id) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return Infinity;
    const lvl = state.upgrades[id] || 0;
    if (lvl >= def.max) return Infinity;
    return Math.floor(def.baseCost * Math.pow(def.growth, lvl));
  }

  function buyUpgrade(id) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    const cost = upgradeCost(id);
    if (!Number.isFinite(cost) || state.gold < cost) {
      emit('notice', { text: 'Not enough gold.', tone: 'bad' });
      return false;
    }
    state.gold -= cost;
    state.upgrades[id]++;
    addLog(`${def.name} increased to rank ${state.upgrades[id]}.`, 'unlock');
    emit('upgradeBought', { id, level: state.upgrades[id], def });
    emit('render', { reason: 'upgrade' });
    save();
    return true;
  }

  function purchaseAuto() {
    if (state.autoStrike) return true;
    if (state.gold < CONFIG.autoUnlockCost) {
      emit('notice', { text: `Auto-Strike requires ${CONFIG.autoUnlockCost} gold.`, tone: 'bad' });
      return false;
    }
    state.gold -= CONFIG.autoUnlockCost;
    state.autoStrike = true;
    state.autoEnabled = true;
    autoTimer = 0.3;
    addLog('<b>Auto-Strike</b> bound. Your oath now fights while you rest.', 'unlock');
    emit('autoUnlocked', {});
    emit('render', { reason: 'auto' });
    save();
    return true;
  }

  function toggleAuto() {
    if (!state.autoStrike) return purchaseAuto();
    state.autoEnabled = !state.autoEnabled;
    emit('autoToggled', { enabled: state.autoEnabled });
    emit('render', { reason: 'auto' });
    save();
    return true;
  }

  function equipItem(itemId) {
    const index = state.inventory.findIndex((i) => i.id === itemId);
    if (index < 0) return false;
    const item = state.inventory[index];
    const old = state.equipment[item.slot];
    state.inventory.splice(index, 1);
    state.equipment[item.slot] = item;
    item.fresh = false;
    if (old) {
      old.fresh = false;
      state.inventory.push(old);
    }
    state.hp = Math.min(state.hp, computeStats().maxHp);
    addLog(`Equipped <b>${item.name}</b>.`, 'loot');
    emit('equipped', { item, old });
    emit('render', { reason: 'equip' });
    save();
    return true;
  }

  function unequipItem(slotId) {
    const item = state.equipment[slotId];
    if (!item) return false;
    if (state.inventory.length >= CONFIG.inventorySize) {
      emit('notice', { text: 'Satchel is full.', tone: 'bad' });
      return false;
    }
    state.equipment[slotId] = null;
    item.fresh = false;
    state.inventory.push(item);
    state.hp = Math.min(state.hp, computeStats().maxHp);
    addLog(`Unequipped <b>${item.name}</b>.`, 'muted');
    emit('render', { reason: 'unequip' });
    save();
    return true;
  }

  function sellItem(itemId) {
    const index = state.inventory.findIndex((i) => i.id === itemId);
    if (index < 0) return null;
    const item = state.inventory[index];
    const price = sellPrice(item);
    state.inventory.splice(index, 1);
    state.gold += price;
    state.records.goldEarned += price;
    state.records.itemsSold++;
    emit('sold', { item, price });
    emit('render', { reason: 'sell' });
    save();
    return price;
  }

  function sellCommons() {
    const common = state.inventory.filter((i) => i.rarity === 'common');
    if (!common.length) {
      emit('notice', { text: 'No Common relics to sell.', tone: 'bad' });
      return 0;
    }
    const total = common.reduce((sum, i) => sum + sellPrice(i), 0);
    state.inventory = state.inventory.filter((i) => i.rarity !== 'common');
    state.gold += total;
    state.records.goldEarned += total;
    state.records.itemsSold += common.length;
    emit('soldBulk', { count: common.length, gold: total });
    emit('render', { reason: 'sell' });
    save();
    return total;
  }

  function getFusionGroups() {
    const groups = new Map();
    state.inventory.forEach((item) => {
      const next = RARITIES[RARITY_BY_ID[item.rarity].index + 1];
      if (!next) return;
      const key = `${item.slot}|${item.rarity}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const result = [];
    groups.forEach((items) => {
      if (items.length < 3) return;
      items.sort((a, b) => a.power - b.power || a.ilvl - b.ilvl);
      const slot = SLOT_BY_ID[items[0].slot];
      const rarity = RARITY_BY_ID[items[0].rarity];
      const next = RARITIES[rarity.index + 1];
      result.push({
        key: `${slot.id}|${rarity.id}`,
        slot,
        rarity,
        next,
        items,
        selected: items.slice(0, 3),
        count: items.length
      });
    });
    result.sort((a, b) => b.next.index - a.next.index || a.slot.name.localeCompare(b.slot.name));
    return result;
  }

  function fuse(slotId, rarityId) {
    const rarity = RARITY_BY_ID[rarityId];
    const next = rarity ? RARITIES[rarity.index + 1] : null;
    if (!next) return null;
    const candidates = state.inventory
      .filter((i) => i.slot === slotId && i.rarity === rarityId)
      .sort((a, b) => a.power - b.power || a.ilvl - b.ilvl);
    if (candidates.length < 3) {
      emit('notice', { text: 'Three matching relics are required.', tone: 'bad' });
      return null;
    }
    const consumed = candidates.slice(0, 3);
    const ids = new Set(consumed.map((i) => i.id));
    const maxIlvl = Math.max(...consumed.map((i) => i.ilvl));
    state.inventory = state.inventory.filter((i) => !ids.has(i.id));
    const result = makeItem(slotId, next.id, maxIlvl + 1, { fresh: true });
    result.name = `${pick(PREFIXES[next.id])} ${pick(SLOT_BY_ID[slotId].base)}`;
    addItem(result);
    state.records.itemsForged++;
    addLog(`Forge: three relics became <b>${result.name}</b>.`, 'loot');
    emit('fused', { result, consumed, next });
    emit('render', { reason: 'fuse' });
    save();
    return result;
  }

  function travelTo(index) {
    if (!zoneUnlocked(index)) {
      emit('notice', { text: 'That path is still sealed.', tone: 'bad' });
      return false;
    }
    if (index === state.currentZone) return true;
    state.currentZone = index;
    state.enemy = null;
    respawnTimer = 0;
    autoTimer = 0.5;
    enemyTimer = CONFIG.enemyAttackInterval;
    addLog(`Entered <b>${ZONES[index].name}</b>.`, 'unlock');
    emit('travel', { index, zone: ZONES[index] });
    if (state.downedUntil > Date.now()) state.downedUntil = 0;
    spawnEnemy();
    save();
    return true;
  }

  /* ── Idle / offline ──────────────────────────────────────── */
  function simulateOffline(seconds) {
    if (!state.autoStrike || !state.autoEnabled) return null;
    if (seconds < CONFIG.offlineMinSeconds) return null;
    const away = Math.min(seconds, CONFIG.offlineCapSeconds);
    const stats = computeStats();
    const zone = ZONES[state.currentZone];
    const progress = getProgress();
    let localKills = progress.kills;
    let kills = 0;
    let bosses = 0;
    let gold = 0;
    let xp = 0;
    let timeLeft = away;
    let iterations = 0;
    const drops = [];
    const startLevel = state.level;
    const startXp = state.xp;

    while (timeLeft > 1.2 && iterations < 2400) {
      iterations++;
      const isBoss = localKills >= CONFIG.bossEvery;
      const bp = enemyBlueprint(zone, localKills, isBoss);
      const dps = Math.max(1, stats.dps) * 0.78;
      const timeToKill = bp.maxHp / dps + 1.1;
      if (timeToKill > timeLeft) break;
      timeLeft -= timeToKill;
      kills++;
      if (isBoss) {
        bosses++;
        localKills = 0;
      } else {
        localKills++;
      }
      gold += Math.round(bp.gold * stats.goldMult);
      xp += Math.round(bp.xp * stats.xpMult);
      if (kills <= 1200) {
        let dropRolls = isBoss ? 2 : (Math.random() < stats.lootChance ? 1 : 0);
        for (let d = 0; d < dropRolls; d++) {
          if (drops.length >= 9) break;
          const item = generateDrop(bp, zone, isBoss);
          if (addItem(item)) drops.push(item);
        }
      }
      if (kills >= 1200) break; // generous but bounded offline haul
    }

    if (kills === 0 && gold === 0) return null;

    state.gold += gold;
    state.records.kills += kills;
    state.records.bosses += bosses;
    state.records.goldEarned += gold;
    progress.kills = localKills;
    if (bosses > 0) progress.defeated = true;
    const levels = addXp(xp, true);
    state.hp = computeStats().maxHp;
    state.enemy = null;
    offlineSummary = {
      seconds: away,
      kills,
      bosses,
      gold,
      xp,
      levels,
      startLevel,
      endLevel: state.level,
      startXp,
      endXp: state.xp,
      items: drops,
      zone: zone.name
    };
    addLog(`While away: ${kills} slain, ${gold}g earned${drops.length ? `, ${drops.length} relics recovered` : ''}.`, 'unlock');
    return offlineSummary;
  }

  /* ── Persistence ─────────────────────────────────────────── */
  function save() {
    if (!state) return;
    state.lastSeen = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      emit('saved', { at: Date.now() });
    } catch (err) {
      emit('saveError', { error: err });
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = sanitizeState(JSON.parse(raw));
      if (!parsed) return false;
      state = parsed;
      return true;
    } catch (err) {
      console.warn('Could not load save:', err);
      return false;
    }
  }

  function reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* ignore */ }
    state = createState();
    logEntries = [];
    addLog('A new oath is sworn. The hunt begins.', 'unlock');
    spawnEnemy();
    save();
    emit('reset', {});
    emit('render', { reason: 'reset' });
  }

  /* ── Events & loop ───────────────────────────────────────── */
  function emit(name, payload) {
    const fn = hooks[name];
    if (typeof fn === 'function') {
      try { fn(payload); } catch (err) { console.error('Hook error:', name, err); }
    }
  }

  function addLog(text, type = 'muted') {
    logEntries.push({ text, type });
    if (logEntries.length > 5) logEntries.shift();
    emit('log', { entries: logEntries.slice() });
  }

  function setPaused(value) {
    paused = !!value;
    lastFrame = performance.now();
    if (!paused) {
      autoTimer = Math.max(autoTimer, 0.1);
      enemyTimer = Math.max(enemyTimer, 0.5);
      lastRegenAt = performance.now();
    }
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = clamp((now - lastFrame) / 1000, 0, 0.26);
    lastFrame = now;
    if (paused || !state) return;

    if (state.downedUntil && Date.now() >= state.downedUntil) {
      reviveHero();
    }

    if (!state.downedUntil && state.enemy) {
      const stats = computeStats();
      if (state.hp > 0 && state.hp < stats.maxHp) {
        state.hp = Math.min(stats.maxHp, state.hp + stats.maxHp * 0.009 * dt);
      }

      if (state.autoStrike && state.autoEnabled) {
        autoTimer -= dt;
        if (autoTimer <= 0) {
          const didStrike = strike(true);
          if (!didStrike) autoTimer = 0.4;
        }
      }

      if (state.enemy && state.hp > 0) {
        enemyTimer -= dt;
        if (enemyTimer <= 0) enemyStrike();
      }
    } else if (!state.enemy && respawnTimer > 0 && !state.downedUntil) {
      respawnTimer -= dt;
      if (respawnTimer <= 0) spawnEnemy();
    }

    vitalsTimer -= dt;
    if (vitalsTimer <= 0) {
      vitalsTimer = 0.45;
      if (state.hp > 0 && state.hp < computeStats().maxHp) {
        emit('vitals', { hp: state.hp, maxHp: computeStats().maxHp });
      }
    }

    saveTimer += dt;
    if (saveTimer > 5) {
      saveTimer = 0;
      save();
    }
  }

  /* ── Init / API ──────────────────────────────────────────── */
  function init(userHooks) {
    hooks = userHooks || {};
    const hadSave = load();
    if (!hadSave) {
      state = createState();
      addLog('A new oath is sworn. The hunt begins.', 'unlock');
      addLog('Click the creature to strike. Its death is your first lesson.', 'muted');
    } else {
      const awaySeconds = Math.max(0, (Date.now() - state.lastSeen) / 1000);
      const wasDowned = state.downedUntil > Date.now();
      state.downedUntil = 0;
      if (wasDowned) state.hp = computeStats().maxHp;
      const summary = simulateOffline(awaySeconds);
      if (!summary && state.autoStrike) {
        addLog('The road was quiet while you rested. The hunt resumes.', 'muted');
      }
      if (!state.enemy) spawnEnemy();
      else {
        addLog(`${state.enemy.isBoss ? '<b>Boss:</b> ' : ''}${state.enemy.name} still waits in ${ZONES[state.currentZone].name}.`, state.enemy.isBoss ? 'boss' : 'muted');
      }
    }
    if (!state.enemy) spawnEnemy();
    state.hp = clamp(state.hp, 1, computeStats().maxHp);
    save();
    lastFrame = performance.now();
    lastRegenAt = performance.now();
    autoTimer = 0.6;
    enemyTimer = CONFIG.enemyAttackInterval;
    running = true;
    requestAnimationFrame(frame);
    return { offline: offlineSummary, hadSave };
  }

  function getState() { return state; }
  function getEnemy() { return state?.enemy || null; }
  function getLogs() { return logEntries.slice(); }
  function getZone() { return ZONES[state.currentZone]; }
  function getStats() { return computeStats(); }
  function isPaused() { return paused; }

  function setSound(enabled) {
    state.settings.sound = !!enabled;
    save();
    emit('render', { reason: 'sound' });
  }

  window.Game = {
    init, reset, save, setPaused,
    getState, getEnemy, getLogs, getZone, getStats,
    computeStats, strike, toggleAuto, purchaseAuto,
    buyUpgrade, upgradeCost, equipItem, unequipItem, sellItem, sellCommons,
    getFusionGroups, fuse, travelTo, zoneUnlocked, getProgress, xpToNext,
    makeItem, itemScore, sellPrice, setSound,
    isPaused,
    ZONES, SLOTS, RARITIES, RARITY_BY_ID, UPGRADES, AFFIXES, CONFIG,
    getOfflineSummary: () => offlineSummary
  };
})();
