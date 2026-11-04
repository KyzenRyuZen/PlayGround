// ============================================================
// AETHERIA — GAMEPLAY LOOP, COMBAT, INTERACTION & TRAVEL
// ============================================================

import CONFIG from './config.js';
import { REGIONS, REGION_ORDER, MONSTERS, NPCS, DUNGEONS, QUESTS, RARITIES, CLASSES, SHOP } from './data.js';
import { Renderer } from './renderer.js';
import {
  buildWorld, populateEnemies, isBlocked, npcNear, nodeNear, hiddenNear,
  createEnemy, respawnPosition, activeTileAt
} from './world.js';
import { clamp, dist, fmt, makeRng, uid, Events } from './utils.js';
import { MATERIALS } from './state.js';
import { Sfx } from './audio.js';

export class Game {
  constructor(state, canvas) {
    this.state = state;
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, this);
    this.sfx = new Sfx();
    this.world = null;
    this.player = {
      x: 0, y: 0, facing: 1, moving: false, attackAnim: 0, casting: 0,
      dead: false, deathTimer: 0, lastDamageAt: 0
    };
    this.input = {
      up: false, down: false, left: false, right: false,
      joyX: 0, joyY: 0, moveTarget: null
    };
    this.target = null;
    this.interactTarget = null;
    this.interactLabel = '';
    this.effects = [];
    this.projectiles = [];
    this.groundLoot = [];
    this.attackCd = 0;
    this.skillCd = 0;
    this.bossRef = null;
    this.lastBossEmit = 0;
    this.screenShake = 0;
    this.transitioning = false;
    this.running = false;
    this.last = 0;
    this.time = 0;
    this.marketTick = 0;
    this.saveTick = 0;
    this.hudTick = 0;
    this.currentDungeon = null;
    this.dungeonCleared = false;
    this.pendingTeleport = null;
    this.lootToastCd = 0;
    this.loop = this.loop.bind(this);
    this.bindInput();
  }

  // ------------------------------------------------------------
  // START / REGION LOADING
  // ------------------------------------------------------------
  start(opts = {}) {
    const char = this.state.char;
    const regionId = REGIONS[char.region] ? char.region : 'greendale';
    this.running = true;
    this.enterRegion(regionId, {
      x: char.x, y: char.y,
      initial: true,
      silent: opts.silent
    });
    requestAnimationFrame(this.loop);
  }

  enterRegion(regionId, opts = {}) {
    if (this.transitioning) return;
    const region = REGIONS[regionId] || REGIONS.greendale;
    const dungeon = opts.dungeonId ? DUNGEONS.find(d => d.id === opts.dungeonId) : null;
    this.transitioning = true;
    this.setJoystick(0, 0);
    this.input.moveTarget = null;
    this.target = null;
    this.player.dead = false;
    this.player.deathTimer = 0;
    Events.emit('loading:start', { region, dungeon, initial: opts.initial });
    this.sfx.play('teleport');

    const finish = () => {
      this.world = buildWorld(regionId, { dungeonId: dungeon?.id });
      populateEnemies(this.world);
      const world = this.world;
      let px = opts.x ?? world.spawn.x;
      let py = opts.y ?? world.spawn.y;
      if (isBlocked(world, px, py, 0.25)) { px = world.spawn.x; py = world.spawn.y; }
      this.player.x = px;
      this.player.y = py;
      this.player.facing = 1;
      this.player.moving = false;
      this.player.attackAnim = 0;
      this.player.casting = 0;
      this.effects = [];
      this.projectiles = [];
      this.groundLoot = [];
      this.attackCd = 0;
      this.skillCd = 0;
      this.bossRef = null;
      this.currentDungeon = dungeon || null;
      this.dungeonCleared = false;
      this.state.char.region = regionId;
      this.state.char.x = px;
      this.state.char.y = py;
      this.state.data.flags.welcomeShown = true;
      this.renderer.setWorld(world, { snap: true });
      this.transitioning = false;
      Events.emit('region', { region, world, dungeon });
      Events.emit('loading:end', { region, dungeon });
      Events.emit('boss', null);
      this.state.save();
      const where = dungeon ? dungeon.name : region.hubName;
      Events.emit('toast', {
        msg: dungeon ? `Entered ${dungeon.name}. ${dungeon.desc}` : `Welcome to ${region.name} — ${region.epithet}.`,
        type: 'region', duration: 4200
      });
    };

    if (opts.initial) {
      // still show the loading transition, but shorter on a first visit
      setTimeout(finish, 780);
    } else {
      setTimeout(finish, 920);
    }
  }

  // ------------------------------------------------------------
  // MAIN LOOP
  // ------------------------------------------------------------
  loop(ts) {
    if (!this.running) return;
    const dt = Math.min(0.05, Math.max(0.001, (ts - this.last) / 1000 || 0));
    this.last = ts;
    this.time += dt;
    if (!this.transitioning && !this.player.dead) {
      this.update(dt);
    } else if (this.player.dead) {
      this.updateDeath(dt);
    }
    if (this.world) this.renderer.render(this, dt);
    if (!this.transitioning) {
      this.hudTick += dt;
      if (this.hudTick >= 0.1) {
        this.hudTick = 0;
        Events.emit('hud', { game: this });
      }
    }
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.state.addPlaytime(dt);
    this.state.clearExpiredBuffs();
    const stats = this.state.stats();
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.skillCd = Math.max(0, this.skillCd - dt);
    this.player.attackAnim = Math.max(0, this.player.attackAnim - dt * 3.2);
    this.player.casting = Math.max(0, this.player.casting - dt * 2);
    this.screenShake = Math.max(0, this.screenShake - dt * 20);
    this.lootToastCd = Math.max(0, this.lootToastCd - dt);

    this.updatePlayer(dt, stats);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateLoot(dt);
    this.updateEffects(dt);
    this.updateInteraction(dt);
    this.updateRegen(dt, stats);
    this.updateBossBar();

    this.marketTick += dt;
    if (this.marketTick > 4) {
      this.marketTick = 0;
      const sold = this.state.tickMarket();
      for (const s of sold) {
        Events.emit('toast', {
          msg: `Market sale: ${s.item.name} → +${fmt(s.price)} gold (simulated buyer)`,
          type: 'success', duration: 5200
        });
        this.sfx.play('coin');
      }
    }
    this.saveTick += dt;
    if (this.saveTick >= CONFIG.autosaveSeconds) {
      this.saveTick = 0;
      this.state.char.x = this.player.x;
      this.state.char.y = this.player.y;
      this.state.save();
    }
  }

  updatePlayer(dt, stats) {
    let sx = 0, sy = 0;
    if (this.input.up) sy -= 1;
    if (this.input.down) sy += 1;
    if (this.input.left) sx -= 1;
    if (this.input.right) sx += 1;
    if (Math.abs(this.input.joyX) > 0.12 || Math.abs(this.input.joyY) > 0.12) {
      sx = this.input.joyX;
      sy = this.input.joyY;
    }
    let moving = false;
    let vx = 0, vy = 0;
    if (sx || sy) {
      // screen direction -> isometric world direction
      vx = sx + sy;
      vy = sy - sx;
      const len = Math.hypot(vx, vy) || 1;
      vx /= len; vy /= len;
      this.input.moveTarget = null;
    } else if (this.input.moveTarget) {
      const mt = this.input.moveTarget;
      const d = Math.hypot(mt.x - this.player.x, mt.y - this.player.y);
      if (d < 0.18) {
        this.input.moveTarget = null;
      } else {
        vx = (mt.x - this.player.x) / d;
        vy = (mt.y - this.player.y) / d;
      }
    }
    if (vx || vy) {
      const speed = stats.moveSpeed;
      const nx = this.player.x + vx * speed * dt;
      const ny = this.player.y + vy * speed * dt;
      if (!isBlocked(this.world, nx, this.player.y, 0.22)) this.player.x = nx;
      if (!isBlocked(this.world, this.player.x, ny, 0.22)) this.player.y = ny;
      this.player.x = clamp(this.player.x, 1.05, this.world.size - 1.05);
      this.player.y = clamp(this.player.y, 1.05, this.world.size - 1.05);
      moving = true;
      if (Math.abs(vx - vy) > 0.1) {
        const screenDx = (vx - vy);
        if (Math.abs(screenDx) > 0.12) this.player.facing = screenDx > 0 ? 1 : -1;
      }
      // footstep dust
      if (Math.random() < dt * 7) {
        this.addParticle({ x: this.player.x, y: this.player.y, type: 'dust', color: '#d8c8a0', life: 0.4 });
      }
    }
    this.player.moving = moving;
    this.state.char.x = this.player.x;
    this.state.char.y = this.player.y;

    // target validity / auto-acquire
    if (this.target && (!this.target.alive || this.target.hp <= 0)) this.target = null;
    if (this.state.data.settings.autoAttack) {
      if (!this.target) {
        const near = this.nearestEnemy(stats.attackRange + 0.5);
        if (near) this.target = near;
      }
      if (this.target) {
        const d = Math.hypot(this.target.x - this.player.x, this.target.y - this.player.y);
        if (d <= stats.attackRange + 0.15 && this.attackCd <= 0) this.normalAttack(true);
      }
    }
  }

  updateRegen(dt, stats) {
    if (Date.now() - this.player.lastDamageAt > 4200) {
      const hp = stats.maxHp * 0.012 * dt;
      const mp = stats.maxMana * 0.018 * dt;
      if (this.state.char.hp < stats.maxHp) this.state.char.hp = Math.min(stats.maxHp, this.state.char.hp + hp);
      if (this.state.char.mana < stats.maxMana) this.state.char.mana = Math.min(stats.maxMana, this.state.char.mana + mp);
    }
  }

  // ------------------------------------------------------------
  // ENEMIES
  // ------------------------------------------------------------
  updateEnemies(dt) {
    const stats = this.state.stats();
    const now = Date.now();
    for (const e of this.world.enemies) {
      if (!e.alive) {
        if (now >= e.respawnAt) this.respawnEnemy(e);
        continue;
      }
      e.anim += dt;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt * 3);
      if (e.stunUntil && now < e.stunUntil) continue;

      const d = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      const aggro = e.boss ? e.def.aggro + 2 : e.def.aggro;
      if (!e.aggroed && d < aggro && !this.player.dead) {
        e.aggroed = true;
        if (e.boss) {
          this.sfx.play('boss');
          Events.emit('toast', { msg: `${e.def.name} has noticed you!`, type: 'danger' });
        }
      }
      if (e.aggroed) {
        const homeDist = Math.hypot(e.x - e.homeX, e.y - e.homeY);
        if (d > 16 || homeDist > 22 || this.player.dead) {
          e.aggroed = false;
          continue;
        }
        if (d > e.def.range) {
          const speed = e.def.speed * (e.elite ? 1.08 : 1);
          const vx = (this.player.x - e.x) / d;
          const vy = (this.player.y - e.y) / d;
          const nx = e.x + vx * speed * dt;
          const ny = e.y + vy * speed * dt;
          if (!isBlocked(this.world, nx, e.y, 0.2)) e.x = nx;
          if (!isBlocked(this.world, e.x, ny, 0.2)) e.y = ny;
          e.facing = (vx - vy) > 0 ? 1 : -1;
          e.state = 'chase';
        } else {
          e.state = 'attack';
          if (!e.attackCd || e.attackCd <= now) {
            e.attackCd = now + e.def.attackSpeed * 1000;
            e.attackAnim = 1;
            this.enemyHitPlayer(e);
          }
        }
        // boss ground slam
        if (e.boss) {
          e.bossCd = (e.bossCd || 0) - dt;
          if (e.bossCd <= 0 && d < 5.5) {
            e.bossCd = 8 + Math.random() * 3;
            this.bossSlam(e);
          }
        }
      } else {
        // idle wander
        e.wanderT = (e.wanderT || 0) - dt;
        if (e.wanderT <= 0) {
          e.wanderT = 2 + Math.random() * 4;
          e.wanderX = e.homeX + (Math.random() - 0.5) * 4;
          e.wanderY = e.homeY + (Math.random() - 0.5) * 4;
        }
        const wd = Math.hypot(e.wanderX - e.x, e.wanderY - e.y);
        if (wd > 0.3) {
          const vx = (e.wanderX - e.x) / wd;
          const vy = (e.wanderY - e.y) / wd;
          const nx = e.x + vx * e.def.speed * 0.34 * dt;
          const ny = e.y + vy * e.def.speed * 0.34 * dt;
          if (!isBlocked(this.world, nx, e.y, 0.15)) e.x = nx;
          if (!isBlocked(this.world, e.x, ny, 0.15)) e.y = ny;
        }
      }
    }
  }

  enemyHitPlayer(enemy) {
    if (this.player.dead) return;
    const raw = enemy.atk * (0.85 + Math.random() * 0.3);
    const dmg = this.state.damagePlayer(raw);
    this.player.lastDamageAt = Date.now();
    this.screenShake = 7;
    this.addEffect({ type: 'dmg', x: this.player.x, y: this.player.y, text: `-${dmg}`, color: '#ff7a7a', life: 0.9, maxLife: 0.9 });
    this.sfx.play('hit');
    Events.emit('playerHit', { damage: dmg, hp: this.state.char.hp });
    if (this.state.char.hp <= 0) this.playerDie();
  }

  bossSlam(boss) {
    const d = Math.hypot(this.player.x - boss.x, this.player.y - boss.y);
    this.addEffect({ type: 'ring', x: boss.x, y: boss.y, radius: 3.2, color: '#ff5a3c', life: 0.75, maxLife: 0.75, width: 4 });
    this.sfx.play('boss');
    this.screenShake = 12;
    if (d < 3.4) {
      const dmg = this.state.damagePlayer(boss.atk * 1.55);
      this.player.lastDamageAt = Date.now();
      this.addEffect({ type: 'dmg', x: this.player.x, y: this.player.y, text: `-${dmg}`, color: '#ffb08a', big: true, life: 1.1, maxLife: 1.1 });
      if (this.state.char.hp <= 0) this.playerDie();
    }
  }

  respawnEnemy(enemy) {
    const spot = respawnPosition(this.world, enemy);
    enemy.x = spot.x; enemy.y = spot.y; enemy.homeX = spot.x; enemy.homeY = spot.y;
    enemy.hp = enemy.maxHp;
    enemy.alive = true;
    enemy.aggroed = false;
    enemy.stunUntil = 0;
    enemy.attackCd = 0;
    enemy.hitFlash = 0;
    enemy.facing = 1;
  }

  // ------------------------------------------------------------
  // PLAYER COMBAT
  // ------------------------------------------------------------
  nearestEnemy(maxRange = 99) {
    let best = null, bestD = maxRange;
    for (const e of this.world.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  attackPressed() {
    if (this.transitioning || this.player.dead) return;
    const stats = this.state.stats();
    const near = this.nearestEnemy(stats.attackRange + 0.4);
    if (near) this.target = near;
    this.normalAttack(false);
  }

  normalAttack(auto = false) {
    const stats = this.state.stats();
    if (this.attackCd > 0) return;
    if (!this.target || !this.target.alive) {
      const near = this.nearestEnemy(stats.attackRange + 0.35);
      if (!near) {
        if (!auto) this.sfx.play('error');
        return;
      }
      this.target = near;
    }
    const d = Math.hypot(this.target.x - this.player.x, this.target.y - this.player.y);
    if (d > stats.attackRange + 0.35) {
      if (!auto) this.input.moveTarget = { x: this.target.x, y: this.target.y };
      return;
    }
    this.attackCd = stats.attackInterval;
    this.player.attackAnim = 1;
    this.player.facing = (this.target.x - this.target.y) > (this.player.x - this.player.y) ? 1 : -1;
    this.sfx.play('attack');
    const dmg = this.rollDamage(1.0);
    if (this.state.char.classId === 'warrior') {
      this.addEffect({ type: 'slash', x: this.target.x, y: this.target.y, color: '#ffe0a0', life: 0.25, maxLife: 0.25 });
      this.applyDamage(this.target, dmg.amount, dmg.crit);
    } else {
      this.spawnProjectile({
        type: this.state.char.classId === 'archer' ? 'arrow' : 'fire',
        target: this.target, amount: dmg.amount, crit: dmg.crit,
        speed: this.state.char.classId === 'archer' ? 14 : 9,
        color: this.state.char.classId === 'archer' ? '#e8dcc0' : '#ffb23e'
      });
    }
  }

  skillPressed() {
    if (this.transitioning || this.player.dead) return;
    const stats = this.state.stats();
    const skill = this.state.cls.skill;
    if (this.skillCd > 0) {
      Events.emit('toast', { msg: `${skill.name} is on cooldown (${this.skillCd.toFixed(1)}s).`, type: 'warn', small: true });
      this.sfx.play('error');
      return;
    }
    if (this.state.char.mana < skill.mana) {
      Events.emit('toast', { msg: 'Not enough mana.', type: 'warn', small: true });
      this.sfx.play('error');
      return;
    }
    this.state.char.mana -= skill.mana;
    this.skillCd = skill.cooldown;
    this.player.casting = 1;
    this.sfx.play('skill');

    const level = this.state.char.skillLevel;
    const mult = skill.multiplier * (1 + (level - 1) * 0.16);
    const radius = skill.radius + (level - 1) * 0.06;
    const targets = this.world.enemies.filter(e => e.alive && Math.hypot(e.x - this.player.x, e.y - this.player.y) <= radius);
    this.addEffect({ type: 'ring', x: this.player.x, y: this.player.y, radius, color: skill.id === 'nova' ? '#79d6ff' : skill.id === 'whirlwind' ? '#ffb23e' : '#a8e07a', life: 0.5, maxLife: 0.5, width: 4 });
    this.addEffect({ type: 'burst', x: this.player.x, y: this.player.y, color: '#ffe08a', life: 0.55, maxLife: 0.55 });

    if (skill.id === 'whirlwind') {
      for (const e of targets) {
        const dmg = this.rollDamage(mult);
        this.applyDamage(e, dmg.amount, dmg.crit);
      }
      if (!targets.length) Events.emit('toast', { msg: 'Whirlwind strikes empty air.', type: 'warn', small: true });
      this.screenShake = 4;
    } else if (skill.id === 'nova') {
      for (const e of targets) {
        const dmg = this.rollDamage(mult);
        this.applyDamage(e, dmg.amount, dmg.crit);
        e.stunUntil = Date.now() + 1200;
        this.addEffect({ type: 'burst', x: e.x, y: e.y, color: '#79d6ff', life: 0.4, maxLife: 0.4 });
      }
    } else {
      const volley = targets.slice(0, 6);
      if (!volley.length) {
        const t = this.nearestEnemy(radius + 2);
        if (t) volley.push(t);
      }
      for (const e of volley) {
        const dmg = this.rollDamage(mult);
        this.spawnProjectile({ type: 'arrow', target: e, amount: dmg.amount, crit: dmg.crit, speed: 18, color: '#d7ffb0' });
      }
      if (!volley.length) Events.emit('toast', { msg: 'Arrow Storm finds no target.', type: 'warn', small: true });
    }
    Events.emit('skillUsed', { skill, level });
  }

  rollDamage(mult = 1) {
    const stats = this.state.stats();
    const variance = 0.9 + Math.random() * 0.2;
    const crit = Math.random() < stats.crit;
    let amount = stats.attack * mult * variance;
    if (crit) amount *= stats.critDamage;
    return { amount: Math.max(1, Math.round(amount)), crit };
  }

  applyDamage(enemy, amount, crit) {
    if (!enemy.alive) return;
    enemy.hp -= amount;
    enemy.hitFlash = 0.12;
    this.addEffect({
      type: 'dmg', x: enemy.x, y: enemy.y,
      text: crit ? `${fmt(amount)}!` : fmt(amount),
      color: crit ? '#ffd166' : '#ffe8d0', big: crit,
      dx: (Math.random() - 0.5) * 24, offset: Math.random() * 8,
      life: 0.85, maxLife: 0.85
    });
    this.sfx.play(crit ? 'crit' : 'hit');
    if (enemy.hp <= 0) this.killEnemy(enemy);
    Events.emit('enemyHit', { enemy, amount, crit });
  }

  spawnProjectile(opts) {
    this.projectiles.push({
      type: opts.type,
      x: this.player.x, y: this.player.y,
      target: opts.target, speed: opts.speed || 12,
      amount: opts.amount, crit: opts.crit,
      color: opts.color, life: 3
    });
  }

  updateProjectiles(dt) {
    for (const pr of [...this.projectiles]) {
      pr.life -= dt;
      if (!pr.target || !pr.target.alive || pr.life <= 0) {
        this.projectiles = this.projectiles.filter(p => p !== pr);
        continue;
      }
      const d = Math.hypot(pr.target.x - pr.x, pr.target.y - pr.y);
      if (d < 0.35) {
        this.applyDamage(pr.target, pr.amount, pr.crit);
        this.projectiles = this.projectiles.filter(p => p !== pr);
        continue;
      }
      const step = Math.min(d, pr.speed * dt);
      pr.x += (pr.target.x - pr.x) / d * step;
      pr.y += (pr.target.y - pr.y) / d * step;
    }
  }

  // ------------------------------------------------------------
  // DEATH & LOOT
  // ------------------------------------------------------------
  killEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.hp = 0;
    enemy.deadT = Date.now();
    const def = enemy.def;
    const boss = def.boss;
    enemy.respawnAt = Date.now() + (boss ? CONFIG.combat.bossRespawnSeconds : enemy.elite ? CONFIG.combat.eliteRespawnSeconds : CONFIG.combat.respawnSeconds) * 1000;
    this.state.onKill(enemy.type);

    const rawGold = Math.round(enemy.gold * (CONFIG.drops.goldVariance[0] + Math.random() * (CONFIG.drops.goldVariance[1] - CONFIG.drops.goldVariance[0])));
    this.state.addGold(rawGold, 'monster', def.name);
    this.state.gainXp(enemy.xp, 'combat');
    this.addEffect({ type: 'dmg', x: enemy.x, y: enemy.y, text: `+${fmt(rawGold)}g`, color: '#ffd166', life: 1.2, maxLife: 1.2, offset: 16 });
    this.sfx.play('coin');

    const drops = [];
    // equipment (always T3)
    let gearRolls = 0;
    if (Math.random() < CONFIG.drops.equipmentChance) gearRolls = 1;
    if (boss) gearRolls = 1 + (Math.random() < (CONFIG.drops.bossEquipmentChance - 1) ? 1 : 0);
    if (enemy.elite && Math.random() < 0.25) gearRolls = Math.max(gearRolls, 1);
    for (let i = 0; i < gearRolls; i++) {
      const item = this.state.rollEquipmentDrop({ level: enemy.level }, { preferPlayer: boss });
      if (item) {
        this.groundLoot.push({ lid: uid('loot'), x: enemy.x + (Math.random() - 0.5) * 0.9, y: enemy.y + (Math.random() - 0.5) * 0.9, item, kind: 'equip', expires: Date.now() + 120000, bob: Math.random() * 6 });
        drops.push(item.name);
      }
    }
    // boss stones
    if (Math.random() < CONFIG.drops.stoneChance || boss) {
      const count = boss ? (enemy.level >= 40 ? 2 : 1) : 1;
      for (let i = 0; i < count; i++) {
        const stone = this.state.rollStone({ level: enemy.level });
        this.groundLoot.push({ lid: uid('loot'), x: enemy.x + (Math.random() - 0.5) * 1.1, y: enemy.y + (Math.random() - 0.5) * 1.1, item: stone, kind: 'stone', expires: Date.now() + 120000, bob: Math.random() * 6 });
        drops.push(stone.name);
      }
    }
    // region material
    if (Math.random() < CONFIG.drops.materialChance || boss) {
      const mat = this.world.region.material;
      const count = boss ? 2 : 1;
      for (let i = 0; i < count; i++) {
        this.groundLoot.push({
          lid: uid('loot'), x: enemy.x + (Math.random() - 0.5) * 1.1, y: enemy.y + (Math.random() - 0.5) * 1.1,
          item: { uid: uid('mat'), kind: 'material', materialId: mat.id, name: mat.name, icon: mat.icon, count: 1 },
          kind: 'material', expires: Date.now() + 120000, bob: Math.random() * 6
        });
      }
      drops.push(`${mat.name} ×${count}`);
    }
    // boss core (legendary crafting)
    if (boss) {
      this.groundLoot.push({
        lid: uid('loot'), x: enemy.x, y: enemy.y + 0.5,
        item: { uid: uid('mat'), kind: 'material', materialId: 'mat_primordial_core', name: 'Primordial Core', icon: '◉', count: 1 },
        kind: 'material', expires: Date.now() + 180000, bob: 0, special: true
      });
      drops.push('Primordial Core');
      this.sfx.play('level');
      Events.emit('toast', { msg: `${def.name} defeated! Boss loot dropped.`, type: 'success', duration: 5500 });
      if (this.currentDungeon && !this.dungeonCleared && def.id === this.currentDungeon.boss) {
        this.dungeonCleared = true;
        this.state.char.dungeons = (this.state.char.dungeons || 0) + 1;
        const bonus = 10000 + this.currentDungeon.level * 500;
        this.state.addGold(bonus, 'dungeon_clear', this.currentDungeon.name);
        Events.emit('toast', { msg: `Dungeon cleared: ${this.currentDungeon.name} — +${fmt(bonus)} gold!`, type: 'success', duration: 6500 });
        Events.emit('dungeonCleared', this.currentDungeon);
      }
    } else {
      Events.emit('toast', { msg: `${def.name} slain. +${fmt(rawGold)} gold, +${fmt(enemy.xp)} XP`, type: 'combat', duration: 2200, small: true });
    }
    Events.emit('kill', { enemy, drops });
    if (this.target === enemy) this.target = null;
  }

  updateLoot(dt) {
    const now = Date.now();
    const stats = this.state.stats();
    for (const loot of [...this.groundLoot]) {
      loot.bob = (loot.bob || 0) + dt * 3;
      if (now > loot.expires) {
        this.groundLoot = this.groundLoot.filter(l => l !== loot);
        continue;
      }
      const d = Math.hypot(loot.x - this.player.x, loot.y - this.player.y);
      if (d < 4.2) {
        // magnet
        const sp = 3.6 * dt;
        if (d > 0.2) {
          loot.x += (this.player.x - loot.x) / d * sp;
          loot.y += (this.player.y - loot.y) / d * sp;
        }
      }
      if (d < 0.7) this.pickupLoot(loot);
    }
  }

  pickupLoot(loot) {
    if (this.groundLoot.indexOf(loot) < 0) return;
    const item = loot.item;
    if (item.kind === 'material') {
      if (!this.state.hasInventorySpace()) { this.inventoryFullToast(); return; }
      this.state.addMaterial(item.materialId, item.count || 1);
      Events.emit('toast', { msg: `+${item.icon || ''} ${item.name} ×${item.count || 1}`, type: 'loot', small: true, duration: 1800 });
      this.sfx.play('loot');
    } else if (item.kind === 'stone') {
      if (!this.state.hasInventorySpace()) { this.inventoryFullToast(); return; }
      this.state.addStone(item);
      Events.emit('toast', { msg: `${item.icon} ${item.name}`, type: 'loot', small: true, duration: 2000 });
      this.sfx.play('loot');
    } else {
      if (!this.state.hasInventorySpace()) { this.inventoryFullToast(); return; }
      this.state.addItem(item);
      const rarity = RARITIES[item.rarity];
      Events.emit('toast', { msg: `${rarity.name} T${item.tier}: ${item.name}`, type: 'loot', color: rarity.color, duration: 2400 });
      this.sfx.play('loot');
    }
    this.groundLoot = this.groundLoot.filter(l => l !== loot);
  }

  inventoryFullToast() {
    if (this.lootToastCd > 0) return;
    this.lootToastCd = 5;
    Events.emit('toast', { msg: 'Inventory full — loot remains on the ground.', type: 'warn' });
  }

  // ------------------------------------------------------------
  // EFFECTS
  // ------------------------------------------------------------
  addEffect(fx) {
    fx.maxLife = fx.maxLife || fx.life || 1;
    this.effects.push(fx);
    if (this.effects.length > 60) this.effects.shift();
  }

  addParticle(p) { this.addEffect({ ...p, type: p.type || 'particle', maxLife: p.life || 0.5 }); }

  updateEffects(dt) {
    for (const fx of this.effects) fx.life -= dt;
    this.effects = this.effects.filter(fx => fx.life > 0);
  }

  // ------------------------------------------------------------
  // INTERACTION
  // ------------------------------------------------------------
  updateInteraction(dt) {
    const npc = npcNear(this.world, this.player.x, this.player.y, 2.4);
    const node = nodeNear(this.world, this.player.x, this.player.y, 1.8);
    const chest = hiddenNear(this.world, this.player.x, this.player.y, 1.9);
    let target = null;
    let label = '';
    if (npc) { target = npc; label = `Talk to ${npc.name}`; }
    else if (node) { target = node; label = `Gather ${node.name}`; }
    else if (chest) { target = chest; label = 'Open hidden cache'; }
    this.interactTarget = target;
    this.interactLabel = label;
  }

  interactPressed() {
    if (!this.interactTarget) {
      Events.emit('toast', { msg: 'Nothing nearby to interact with.', type: 'warn', small: true });
      return;
    }
    const target = this.interactTarget;
    if (target.role) {
      this.sfx.play('ui');
      Events.emit('npc', target);
      return;
    }
    if (target.materialId) {
      this.gatherNode(target);
      return;
    }
    if (target.hid) {
      this.openHidden(target);
    }
  }

  gatherNode(node) {
    if (node.respawnAt > Date.now()) {
      Events.emit('toast', { msg: 'This node is depleted. It will regrow soon.', type: 'warn', small: true });
      return;
    }
    const amount = 1 + (Math.random() < 0.35 ? 1 : 0);
    if (!this.state.hasInventorySpace()) { this.inventoryFullToast(); return; }
    this.state.addMaterial(node.materialId, amount);
    node.respawnAt = Date.now() + 75000;
    this.state.gainXp(8 + this.state.char.level * 4, 'gather');
    this.addEffect({ type: 'dmg', x: node.x, y: node.y, text: `+${node.icon} ${amount}`, color: '#b7ff9a', life: 1.1, maxLife: 1.1 });
    this.sfx.play('loot');
    Events.emit('toast', { msg: `Gathered ${node.name} ×${amount}.`, type: 'loot', small: true });
  }

  openHidden(chest) {
    if (chest.opened) return;
    chest.opened = true;
    const loot = chest.loot || {};
    if (loot.gold) this.state.addGold(Math.round(loot.gold), 'hidden_cache', 'Hidden cache');
    if (loot.material) {
      for (let i = 0; i < (loot.count || 1); i++) this.state.addMaterial(loot.material, 1);
    }
    if (Math.random() < 0.55) {
      const item = this.state.rollEquipmentDrop({ level: this.state.char.level + 2 });
      if (this.state.hasInventorySpace()) this.state.addItem(item);
    }
    this.addEffect({ type: 'burst', x: chest.x, y: chest.y, color: '#ffe08a', life: 1.1, maxLife: 1.1 });
    this.sfx.play('level');
    Events.emit('toast', { msg: `Hidden cache opened! +${fmt(loot.gold || 0)} gold and rare materials.`, type: 'success', duration: 5000 });
  }

  // ------------------------------------------------------------
  // TRAVEL
  // ------------------------------------------------------------
  teleportCostTo(regionId, dungeonId = null) {
    const from = this.currentDungeon ? this.currentDungeon.region : this.state.char.region;
    if (dungeonId) {
      const d = DUNGEONS.find(x => x.id === dungeonId);
      return d ? d.cost : CONFIG.teleport.dungeonMin;
    }
    if (regionId === from) return CONFIG.teleport.same;
    return this.state.teleportCost(from, regionId);
  }

  travelTo(regionId, opts = {}) {
    if (this.transitioning) return false;
    if (!REGIONS[regionId]) return false;
    const from = this.currentDungeon ? this.currentDungeon.region : this.state.char.region;
    if (regionId === from && !this.currentDungeon && opts.force !== true) {
      // fast travel within the same region: still costs the same-region fee
    }
    const cost = this.teleportCostTo(regionId, opts.dungeonId);
    if (cost > 0 && !this.state.spendGold(cost, 'teleport', `${regionId}${opts.dungeonId ? ':' + opts.dungeonId : ''}`)) {
      Events.emit('toast', { msg: `Not enough gold. Teleport costs ${fmt(cost)}.`, type: 'warn' });
      this.sfx.play('error');
      return false;
    }
    if (cost > 0) {
      Events.emit('toast', { msg: `Teleported for ${fmt(cost)} gold.`, type: 'info', small: true });
    }
    this.enterRegion(regionId, { dungeonId: opts.dungeonId, initial: false });
    return true;
  }

  enterDungeon(dungeonId) {
    const d = DUNGEONS.find(x => x.id === dungeonId);
    if (!d) return false;
    if (this.state.char.level + 3 < d.level) {
      Events.emit('toast', { msg: `Recommended level ${d.level}. You can still enter, but be careful.`, type: 'warn' });
    }
    return this.travelTo(d.region, { dungeonId: d.id });
  }

  returnToHub() {
    const base = this.currentDungeon ? this.currentDungeon.region : this.state.char.region;
    const cost = this.currentDungeon ? CONFIG.teleport.same : 0;
    if (cost && !this.state.spendGold(cost, 'teleport', 'Return to hub')) {
      Events.emit('toast', { msg: 'Not enough gold to return.', type: 'warn' });
      return;
    }
    this.enterRegion(base, { initial: false });
  }

  playerDie() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.player.deathTimer = 2.2;
    this.state.char.deaths++;
    this.state.char.hp = 0;
    this.sfx.play('death');
    this.target = null;
    this.input.moveTarget = null;
    this.setJoystick(0, 0);
    Events.emit('death', { region: this.state.region() });
    Events.emit('toast', { msg: 'You have fallen. Returning to the village...', type: 'danger', duration: 4000 });
  }

  updateDeath(dt) {
    this.player.deathTimer -= dt;
    if (this.player.deathTimer <= 0) {
      this.player.dead = false;
      const base = this.currentDungeon ? this.currentDungeon.region : this.state.char.region;
      this.state.char.buffs = [];
      this.enterRegion(base, { initial: false, x: null, y: null });
      setTimeout(() => {
        const st = this.state.stats();
        this.state.char.hp = Math.floor(st.maxHp * CONFIG.combat.playerRespawnHp);
        this.state.char.mana = st.maxMana;
        this.state.save();
        Events.emit('toast', { msg: 'You awaken at the village shrine. Your gear is intact.', type: 'info' });
      }, 1000);
    }
  }

  // ------------------------------------------------------------
  // UI ACTIONS
  // ------------------------------------------------------------
  useHealthPotion() {
    const c = this.state.char;
    const options = ['health_large', 'health_medium', 'health_small'];
    const id = options.find(k => (c.consumables[k] || 0) > 0);
    if (!id) { Events.emit('toast', { msg: 'No health potions. Visit the Potion Merchant.', type: 'warn' }); return; }
    const res = this.state.usePotion(id);
    if (res.ok) {
      this.sfx.play('loot');
      this.addEffect({ type: 'burst', x: this.player.x, y: this.player.y, color: '#ff8fa3', life: 0.5, maxLife: 0.5 });
    }
    Events.emit('toast', { msg: res.msg, type: res.ok ? 'success' : 'warn', small: true });
  }

  useManaPotion() {
    const c = this.state.char;
    const options = ['mana_large', 'mana_medium', 'mana_small'];
    const id = options.find(k => (c.consumables[k] || 0) > 0);
    if (!id) { Events.emit('toast', { msg: 'No mana potions. Visit the Potion Merchant.', type: 'warn' }); return; }
    const res = this.state.usePotion(id);
    Events.emit('toast', { msg: res.msg, type: res.ok ? 'success' : 'warn', small: true });
  }

  toggleMount() {
    const res = this.state.toggleMount();
    Events.emit('toast', { msg: res.msg, type: res.ok ? 'success' : 'warn', small: true });
    Events.emit('character', this.state.char);
  }

  toggleAutoAttack() {
    this.state.data.settings.autoAttack = !this.state.data.settings.autoAttack;
    Events.emit('toast', { msg: `Auto-attack ${this.state.data.settings.autoAttack ? 'enabled' : 'disabled'}.`, type: 'info', small: true });
  }

  // ------------------------------------------------------------
  // INPUT
  // ------------------------------------------------------------
  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(k)) { this.input.up = true; e.preventDefault(); }
      else if (['s', 'arrowdown'].includes(k)) { this.input.down = true; e.preventDefault(); }
      else if (['a', 'arrowleft'].includes(k)) { this.input.left = true; e.preventDefault(); }
      else if (['d', 'arrowright'].includes(k)) { this.input.right = true; e.preventDefault(); }
      else if (k === ' ') { this.attackPressed(); e.preventDefault(); }
      else if (k === 'q') { this.skillPressed(); e.preventDefault(); }
      else if (k === 'e') { this.interactPressed(); e.preventDefault(); }
      else if (k === 'h') { this.useHealthPotion(); e.preventDefault(); }
      else if (k === 'j') { this.useManaPotion(); e.preventDefault(); }
      else if (k === 'm') { Events.emit('openMap'); }
      else if (k === 'b') { Events.emit('openBag'); }
      else if (k === 'c') { Events.emit('openCharacter'); }
      else if (k === 'r') { this.toggleMount(); }
      else if (k === 'f') { this.toggleAutoAttack(); }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(k)) this.input.up = false;
      if (['s', 'arrowdown'].includes(k)) this.input.down = false;
      if (['a', 'arrowleft'].includes(k)) this.input.left = false;
      if (['d', 'arrowright'].includes(k)) this.input.right = false;
    });
    window.addEventListener('blur', () => {
      this.input.up = this.input.down = this.input.left = this.input.right = false;
      this.setJoystick(0, 0);
    });

    const canvas = this.canvas;
    canvas.addEventListener('pointerdown', (e) => {
      if (this.transitioning || this.player.dead) return;
      this.sfx.init();
      this.sfx.resume();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleTap(x, y);
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  setJoystick(x, y) {
    this.input.joyX = x;
    this.input.joyY = y;
  }

  handleTap(sx, sy) {
    const world = this.world;
    if (!world) return;
    // enemy click (screen distance)
    let picked = null, pickedD = 42;
    for (const e of world.enemies) {
      if (!e.alive) continue;
      const s = this.renderer.worldToScreen(e.x, e.y);
      const d = Math.hypot(s.x - sx, s.y - (sy + 18));
      if (d < pickedD + (e.boss ? 26 : 0)) { picked = e; pickedD = d; }
    }
    if (picked) {
      this.target = picked;
      const stats = this.state.stats();
      const d = Math.hypot(picked.x - this.player.x, picked.y - this.player.y);
      if (d > stats.attackRange + 0.2) {
        this.input.moveTarget = { x: picked.x, y: picked.y };
      } else {
        this.normalAttack(false);
      }
      return;
    }
    // npc click
    for (const npc of world.npcs) {
      const s = this.renderer.worldToScreen(npc.x, npc.y);
      if (Math.hypot(s.x - sx, s.y - (sy + 20)) < 34) {
        const d = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
        if (d < 2.6) {
          Events.emit('npc', npc);
        } else {
          this.input.moveTarget = { x: npc.x + 0.9, y: npc.y + 0.9 };
        }
        return;
      }
    }
    // node / chest click
    for (const node of world.nodes) {
      if (node.respawnAt > Date.now()) continue;
      const s = this.renderer.worldToScreen(node.x, node.y);
      if (Math.hypot(s.x - sx, s.y - (sy + 12)) < 28) {
        const d = Math.hypot(node.x - this.player.x, node.y - this.player.y);
        if (d < 2.1) this.gatherNode(node);
        else this.input.moveTarget = { x: node.x, y: node.y };
        return;
      }
    }
    // ground move
    const w = this.renderer.screenToWorld(sx, sy);
    if (w.x > 1 && w.y > 1 && w.x < world.size - 1 && w.y < world.size - 1 && !isBlocked(world, w.x, w.y, 0.2)) {
      this.input.moveTarget = { x: w.x, y: w.y };
      this.target = null;
    }
  }

  // ------------------------------------------------------------
  // MISC
  // ------------------------------------------------------------
  questDef(id) { return QUESTS.find(q => q.id === id); }

  updateBossBar() {
    const now = performance.now();
    if (now - this.lastBossEmit < 120) return;
    this.lastBossEmit = now;
    let boss = null;
    if (this.target?.boss && this.target.alive) boss = this.target;
    else {
      for (const e of this.world.enemies) {
        if (e.alive && e.boss && e.aggroed) { boss = e; break; }
      }
    }
    if (!boss) {
      if (this.bossRef) { this.bossRef = null; Events.emit('boss', null); }
      return;
    }
    this.bossRef = boss;
    Events.emit('boss', {
      name: boss.def.name,
      hp: boss.hp,
      maxHp: boss.maxHp,
      level: boss.level,
      color: boss.def.color,
      elite: boss.elite
    });
  }

  addStoneDrop(stone) {
    if (!stone) return;
    this.groundLoot.push({
      lid: uid('loot'), x: this.player.x, y: this.player.y,
      item: stone, kind: 'stone', expires: Date.now() + 120000, bob: Math.random() * 6
    });
  }

  regionProgress() {
    const region = this.state.region();
    const total = REGION_ORDER.length;
    return `${REGION_ORDER.indexOf(region.id) + 1}/${total}`;
  }

  goldPerHour() {
    return this.state.economySummary().goldPerHour;
  }
}

export default Game;
