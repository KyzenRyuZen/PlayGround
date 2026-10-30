import { CLASSES } from '../data/classes.js';
import { PETS, MOUNTS, COMPANIONS } from '../data/collections.js';
import { rand, chance } from './rng.js';

export function createBattle() {
  return {
    mode: 'stage',
    dungeonId: null,
    monster: null,
    spawnTimer: 0.8,
    heroTimer: 0.35,
    monsterTimer: 1.2,
    skillTimer: 0.6,
    petTimer: 3,
    mountTimer: 5,
    companionTimer: 6,
    cooldowns: {},
    buffs: [],
    shield: 0,
    shieldUntil: 0,
    deathTimer: 0,
    elapsed: 0,
    frozenUntil: 0,
    postKillDelay: 0,
    sessionKills: 0,
    enrageAnnounced: false,
  };
}

export function resetBattle(battle, opts = {}) {
  battle.mode = opts.mode || 'stage';
  battle.dungeonId = opts.dungeonId || null;
  battle.monster = null;
  battle.spawnTimer = opts.spawnDelay ?? 0.7;
  battle.heroTimer = 0.4;
  battle.monsterTimer = 1.0;
  battle.skillTimer = 0.5;
  battle.petTimer = 2.5;
  battle.mountTimer = 4;
  battle.companionTimer = 5;
  battle.cooldowns = {};
  battle.buffs = [];
  battle.shield = 0;
  battle.shieldUntil = 0;
  battle.deathTimer = 0;
  battle.elapsed = 0;
  battle.frozenUntil = 0;
  battle.postKillDelay = 0;
  battle.enrageAnnounced = false;
  return battle;
}

export function activeBuffs(battle, now = performance.now()) {
  return (battle.buffs || []).filter(b => !b.until || b.until > now);
}

function useSkill(battle, state, stats, api, now, dt) {
  if (!state.hero.autoSkills || battle.skillTimer > 0 || !battle.monster) return;
  const cls = CLASSES[state.hero.classId];
  if (!cls) return;
  const hpPct = state.hero.hp / stats.maxHp;
  const available = [];
  for (const skill of cls.skills) {
    const level = state.hero.skills[skill.id] || 0;
    if (level <= 0) continue;
    if ((battle.cooldowns[skill.id] || 0) > now) continue;
    if (state.hero.mp < skill.mana) continue;
    if (skill.condition === 'hpBelow75' && hpPct >= 0.75) continue;
    if (skill.condition === 'hpBelow70' && hpPct >= 0.70) continue;
    if (skill.type === 'buff' && battle.buffs.some(b => b.id === skill.id && b.until > now)) continue;
    if (skill.type === 'shield' && battle.shield > stats.maxHp * 0.08) continue;
    available.push({ skill, level });
  }
  if (!available.length) return;
  available.sort((a, b) => {
    const ac = a.skill.condition ? 1 : 0;
    const bc = b.skill.condition ? 1 : 0;
    if (ac !== bc) return bc - ac;
    return (b.skill.priority || 0) - (a.skill.priority || 0);
  });
  const { skill, level } = available[0];
  state.hero.mp -= skill.mana;
  battle.cooldowns[skill.id] = now + skill.cooldown * 1000;
  battle.skillTimer = 0.75;
  const power = 1 + (level - 1) * 0.085;

  if (skill.type === 'damage') {
    const monster = battle.monster;
    let raw = stats.attack * skill.mult * power * rand(0.92, 1.08) * (1 + stats.skillDamage / 100);
    if (monster.isBoss) raw *= 1 + stats.bossDamage / 100;
    else raw *= 1 + stats.monsterDamage / 100;
    let effDef = Math.max(0, monster.defense - stats.penetration) * (1 - stats.penPercent / 100);
    if (skill.armorPen) effDef *= 1 - skill.armorPen / 100;
    const mitigation = Math.min(0.75, effDef / (effDef + 160 + stats.level * 14));
    let crit = chance(0.03 + stats.critChance / 100, api.rng);
    if (skill.bossCrit && monster.isBoss) crit = true;
    const damage = Math.max(1, Math.round(raw * (1 - mitigation) * (crit ? stats.critDamage / 100 : 1)));
    monster.hp -= damage;
    const healed = Math.round(damage * stats.lifesteal / 100);
    if (healed > 0) state.hero.hp = Math.min(stats.maxHp, state.hero.hp + healed);
    api.emit('hit', {
      source: 'hero', damage, crit, skill: skill.name, color: skill.color,
      element: skill.element, monsterUid: monster.uid,
    });
    if (skill.freeze) {
      battle.frozenUntil = now + skill.freeze * 1000;
      battle.monsterTimer = Math.max(battle.monsterTimer, skill.freeze);
      api.emit('status', { text: 'Frozen', color: skill.color });
    }
    if (monster.hp <= 0) handleKill(battle, monster, api, stats);
  } else if (skill.type === 'buff') {
    battle.buffs.push({
      id: skill.id, name: skill.name, stat: skill.buff.stat,
      value: skill.buff.value * (1 + (level - 1) * 0.035),
      until: now + skill.buff.duration * 1000, color: skill.color,
    });
    api.emit('buff', { name: skill.name, color: skill.color, stat: skill.buff.stat });
  } else if (skill.type === 'shield') {
    const amount = stats.maxHp * skill.shieldPct / 100 * (1 + (level - 1) * 0.05);
    battle.shield = Math.max(battle.shield, amount);
    battle.shieldUntil = now + skill.duration * 1000;
    api.emit('shield', { amount, color: skill.color, name: skill.name });
  }
}

function handleKill(battle, monster, api, stats) {
  const result = api.onMonsterKilled(monster) || {};
  api.emit('kill', { monster, result });
  battle.monster = null;
  battle.shield = 0;
  battle.frozenUntil = 0;
  battle.enrageAnnounced = false;
  battle.spawnTimer = result.endBattle ? (result.respawnDelay ?? 3.2) : 1.5;
  battle.postKillDelay = battle.spawnTimer;
  if (result.endBattle) {
    battle.mode = 'stage';
    battle.dungeonId = null;
  }
  battle.elapsed = 0;
}

function assist(battle, state, stats, api, now, dt) {
  if (!battle.monster) return;
  const tryAssist = (data, timerName, kind) => {
    if (!data) return;
    if (battle[timerName] > 0) return;
    const skill = data.skill;
    if (!skill) { battle[timerName] = 999; return; }
    battle[timerName] = skill.cooldown || 10;
    if (skill.heal) {
      const heal = stats.maxHp * skill.heal;
      state.hero.hp = Math.min(stats.maxHp, state.hero.hp + heal);
      api.emit('heal', { amount: Math.round(heal), color: '#8ef0a5', source: kind });
    } else if (skill.shield) {
      battle.shield = Math.max(battle.shield, stats.maxHp * skill.shield);
      battle.shieldUntil = now + 8000;
      api.emit('shield', { amount: stats.maxHp * skill.shield, color: '#8ad4ff', name: skill.name });
    } else if (skill.buff) {
      battle.buffs.push({ id: `${kind}_${data.id}`, name: skill.name, stat: skill.buff.stat, value: skill.buff.value, until: now + skill.buff.duration * 1000, color: '#ffd27c' });
      api.emit('buff', { name: skill.name, color: '#ffd27c', stat: skill.buff.stat });
    } else if (skill.mult) {
      const monster = battle.monster;
      const damage = Math.max(1, Math.round(stats.attack * skill.mult * 0.55 * rand(0.9, 1.1)));
      monster.hp -= damage;
      api.emit('hit', {
        source: kind, damage, crit: false, skill: skill.name, color: '#ffd08a',
        element: skill.element || 'physical', monsterUid: monster.uid,
      });
      if (monster.hp <= 0) handleKill(battle, monster, api, stats);
    }
  };
  tryAssist(state.hero.pets?.active ? PETS[state.hero.pets.active] : null, 'petTimer', 'pet');
  if (!battle.monster) return;
  tryAssist(state.hero.mounts?.active ? MOUNTS[state.hero.mounts.active] : null, 'mountTimer', 'mount');
  if (!battle.monster) return;
  tryAssist(state.hero.companions?.active ? COMPANIONS[state.hero.companions.active] : null, 'companionTimer', 'companion');
}

export function updateCombat(battle, state, api, dt, now = performance.now()) {
  const stats = api.getStats();
  state.hero.hp = Math.min(state.hero.hp, stats.maxHp);
  state.hero.mp = Math.min(state.hero.mp, stats.maxMp);

  if (battle.deathTimer > 0) {
    battle.deathTimer -= dt;
    if (battle.deathTimer <= 0) {
      state.hero.hp = Math.max(1, Math.round(stats.maxHp * 0.65));
      state.hero.mp = Math.round(stats.maxMp * 0.5);
      battle.monster = null;
      battle.spawnTimer = 1.4;
      battle.buffs = [];
      battle.shield = 0;
      api.emit('respawn', { hp: state.hero.hp });
    }
    return;
  }

  if (battle.buffs.length) battle.buffs = battle.buffs.filter(b => !b.until || b.until > now);
  if (battle.shieldUntil && battle.shieldUntil <= now) { battle.shield = 0; battle.shieldUntil = 0; }

  state.hero.mp = Math.min(stats.maxMp, state.hero.mp + stats.mpRegen * dt);
  state.hero.hp = Math.min(stats.maxHp, state.hero.hp + stats.hpRegen * dt);

  if (!battle.monster) {
    battle.spawnTimer -= dt;
    if (battle.spawnTimer <= 0) {
      const monster = api.spawnMonster();
      if (monster) {
        battle.monster = monster;
        battle.monsterTimer = 1.15;
        battle.heroTimer = 0.25;
        battle.elapsed = 0;
        battle.enrageAnnounced = false;
        api.emit('spawn', { monster });
      } else {
        battle.spawnTimer = 1;
      }
    }
    return;
  }

  battle.elapsed += dt;

  // Enemy enrage
  const monster = battle.monster;
  if (monster.isBoss && monster.enrageAt && battle.elapsed > monster.enrageAt) {
    if (!battle.enrageAnnounced) {
      battle.enrageAnnounced = true;
      api.emit('enrage', { monster });
    }
  }

  // Timers
  battle.heroTimer -= dt;
  battle.monsterTimer -= dt;
  battle.skillTimer = Math.max(0, battle.skillTimer - dt);
  battle.petTimer = Math.max(0, battle.petTimer - dt);
  battle.mountTimer = Math.max(0, battle.mountTimer - dt);
  battle.companionTimer = Math.max(0, battle.companionTimer - dt);

  // Pet / mount / companion assists
  assist(battle, state, stats, api, now, dt);
  if (!battle.monster) return;

  // Skills
  useSkill(battle, state, stats, api, now, dt);
  if (!battle.monster) return;

  const currentMonster = battle.monster;

  // Hero basic attack
  if (battle.heroTimer <= 0) {
    battle.heroTimer = Math.max(0.12, stats.attackInterval);
    let raw = stats.attack * rand(0.9, 1.1);
    if (currentMonster.isBoss) raw *= 1 + stats.bossDamage / 100;
    else raw *= 1 + stats.monsterDamage / 100;
    const effDef = Math.max(0, currentMonster.defense - stats.penetration) * (1 - stats.penPercent / 100);
    const mitigation = Math.min(0.75, effDef / (effDef + 160 + stats.level * 14));
    const crit = chance(stats.critChance / 100, api.rng);
    const damage = Math.max(1, Math.round(raw * (1 - mitigation) * (crit ? stats.critDamage / 100 : 1)));
    currentMonster.hp -= damage;
    const healed = Math.round(damage * stats.lifesteal / 100);
    if (healed > 0) state.hero.hp = Math.min(stats.maxHp, state.hero.hp + healed);
    api.emit('hit', { source: 'hero', damage, crit, skill: null, color: crit ? '#ffd06b' : '#f4e4c3', element: 'physical', monsterUid: currentMonster.uid });
    if (currentMonster.hp <= 0) {
      handleKill(battle, currentMonster, api, stats);
      return;
    }
  }

  // Monster attack
  if (battle.monsterTimer <= 0 && now >= battle.frozenUntil) {
    const speedMult = battle.enrageAnnounced ? 1.25 : 1;
    battle.monsterTimer = Math.max(0.3, currentMonster.attackInterval / speedMult);
    let enrage = 1;
    if (currentMonster.isBoss && currentMonster.enrageAt && battle.elapsed > currentMonster.enrageAt) {
      enrage = Math.min(2.6, 1 + ((battle.elapsed - currentMonster.enrageAt) / 12) * 0.4);
    }
    let raw = currentMonster.attack * rand(0.9, 1.1) * enrage;
    const mitigation = Math.min(0.8, stats.defense / (stats.defense + 150 + currentMonster.level * 12));
    const resKey = currentMonster.element === 'holy' ? 'shadow' : currentMonster.element;
    const resist = stats.resist?.[resKey] || 0;
    let damage = Math.max(1, Math.round(raw * (1 - mitigation) * (1 - resist / 100) * (1 - stats.damageReduction / 100)));
    const crit = chance(0.045, api.rng);
    if (crit) damage = Math.round(damage * 1.5);
    let absorbed = 0;
    if (battle.shield > 0) {
      absorbed = Math.min(battle.shield, damage);
      battle.shield -= absorbed;
      damage -= absorbed;
    }
    state.hero.hp -= damage;
    api.emit('hit', { source: 'monster', damage, absorbed, crit, skill: null, color: currentMonster.element === 'fire' ? '#ff8a5c' : '#ff7c8a', element: currentMonster.element, monsterUid: currentMonster.uid });
    if (state.hero.hp <= 0) {
      state.hero.hp = 0;
      battle.monster = null;
      battle.deathTimer = 3;
      battle.shield = 0;
      battle.buffs = [];
      battle.frozenUntil = 0;
      api.emit('heroDown', { monster: currentMonster });
      api.onHeroDeath(currentMonster);
    }
  }
}

export function combatDps(stats) {
  const critMult = 1 + (stats.critChance / 100) * (stats.critDamage / 100 - 1);
  return stats.attack * stats.attackRate * critMult * (1 + stats.monsterDamage / 100) * (1 + stats.skillDamage / 100) * 1.2;
}
