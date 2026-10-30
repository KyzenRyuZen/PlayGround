/* Combat simulation, boss behaviors, and cleanup for Aetherfall battles. */

import { addItem, addXp, grantStageRewards, rollEnemyDrop } from './state.js';
import { audio, haptic } from './audio.js';

const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export const combatMethods = {
  updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.slow = Math.max(0, e.slow - dt);
      e.stun = Math.max(0, e.stun - dt);
      if (e.burn > 0) {
        e.burn -= dt;
        e.hp -= e.burnDps * dt;
        if (Math.random() < dt * 5) this.spark(e.x + rand(-10, 10), e.y + rand(-18, 4), '#ff9e62', 1);
        if (e.hp <= 0) { this.killEnemy(e); continue; }
      }
      if (e.spawnTimer > 0) {
        e.spawnTimer -= dt;
        if (e.spawnTimer <= 0) e.state = 'idle';
        continue;
      }
      if (e.stun > 0) {
        e.state = 'stunned';
        continue;
      }
      if (e.isBoss) this.updateBoss(e, dt);
      else this.updateEnemy(e, dt);
      // keep entities apart
      for (const o of this.enemies) {
        if (o === e || o.dead || o.spawnTimer > 0) continue;
        const dx = e.x - o.x, dy = e.y - o.y;
        const d = Math.hypot(dx, dy);
        const min = (e.r + o.r) * .72;
        if (d > 0 && d < min) {
          const push = (min - d) * .045;
          e.x += dx / d * push;
          e.y += dy / d * push;
        }
      }
      e.x = clamp(e.x, 22, this.W - 22);
      e.y = clamp(e.y, 92, this.H - 64);
      e.facing = p.x >= e.x ? 1 : -1;
    }
    this.enemies = this.enemies.filter(e => !e.dead || e.isBoss);
  },

  updateEnemy(e, dt) {
    const p = this.player;
    const cfg = e.cfg;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = e.speed * (e.slow > 0 ? .55 : 1);
    e.attackCd -= dt;
    if (e.state === 'windup') {
      e.timer -= dt;
      if (e.timer <= 0) this.resolveEnemyAttack(e);
      return;
    }
    if (cfg.behavior === 'ranged') {
      const preferred = cfg.preferred || 200;
      if (d > preferred + 35) {
        e.x += dx / d * speed * dt;
        e.y += dy / d * speed * dt;
      } else if (d < preferred - 50) {
        e.x -= dx / d * speed * dt;
        e.y -= dy / d * speed * dt;
      } else {
        const side = (e.id % 2 ? 1 : -1);
        e.x += -dy / d * speed * .36 * dt * side;
        e.y += dx / d * speed * .36 * dt * side;
      }
      if (e.attackCd <= 0 && d < cfg.range) this.startEnemyWindup(e);
    } else {
      if (d > cfg.range - 8) {
        e.x += dx / d * speed * dt;
        e.y += dy / d * speed * dt;
      }
      if (e.attackCd <= 0 && d < cfg.range + 12) this.startEnemyWindup(e);
    }
    e.angle = Math.atan2(dy, dx);
  },

  startEnemyWindup(e) {
    const cfg = e.cfg;
    e.state = 'windup';
    e.timer = cfg.windup;
    e.windupMax = cfg.windup;
    e.attackType = cfg.behavior === 'ranged' ? 'ranged' : cfg.behavior === 'brute' ? 'slam' : 'melee';
    this.vfx('windup', e.x, e.y, { color: cfg.glow, radius: e.r * 2, duration: cfg.windup });
  },

  resolveEnemyAttack(e) {
    const p = this.player;
    const cfg = e.cfg;
    e.state = 'idle';
    e.attackCd = cfg.attackRate * rand(.86, 1.16);
    const d = Math.sqrt(dist2(p, e));
    if (e.attackType === 'ranged') {
      this.spawnProjectile({
        team: 'enemy', x: e.x, y: e.y - 8,
        angle: Math.atan2(p.y - e.y, p.x - e.x) + rand(-.04, .04),
        speed: 240, damage: e.atk, radius: 7, color: cfg.glow,
        type: 'orb', life: 4, source: 'enemy'
      });
      this.vfx('cast', e.x, e.y, { color: cfg.glow, radius: 26 });
    } else if (e.attackType === 'slam') {
      this.vfx('quake', e.x, e.y, { color: cfg.glow, radius: 105 });
      this.shake = Math.max(this.shake, 5);
      if (d < 105 + p.r) this.damagePlayer(e.atk * 1.15, e);
    } else {
      this.vfx('slash', e.x, e.y, { angle: e.angle, color: cfg.glow, radius: e.r * 2.2 + 20 });
      if (d < cfg.range + 26) this.damagePlayer(e.atk, e);
    }
    audio.play('hit');
  },

  updateBoss(e, dt) {
    const p = this.player;
    const cfg = e.cfg;
    if (e.phase === 1 && e.hp < e.maxHp * .5) {
      e.phase = 2;
      e.speed *= 1.18;
      this.showAnnouncement('ENRAGED', e.cfg.name, 'The air splits. Its true form awakens.', true);
      this.burst(e.x, e.y, cfg.glow, 48, 280);
      this.shake = 16;
      audio.play('boss');
      haptic([25, 40, 25, 40]);
    }
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.angle = Math.atan2(dy, dx);
    e.abilityCd -= dt;
    e.attackCd -= dt;

    if (e.casting) return;

    if (e.abilityCd <= 0) {
      this.castBossAbility(e);
      return;
    }
    const desired = 130;
    if (d > desired) {
      e.x += dx / d * e.speed * dt;
      e.y += dy / d * e.speed * dt;
    } else {
      e.x += -dy / d * e.speed * .3 * dt;
      e.y += dx / d * e.speed * .3 * dt;
    }
    if (d < 125 && e.attackCd <= 0) {
      e.attackCd = 1.75;
      e.casting = true;
      this.vfx('windup', e.x, e.y, { color: cfg.glow, radius: 98, duration: .55 });
      this.telegraph({
        type: 'circle', x: p.x, y: p.y, r: 92, duration: .55, color: cfg.glow, boss: true,
        onDone: () => {
          if (Math.sqrt(dist2(p, e)) < 145) this.damagePlayer(e.atk * .75, e);
          this.vfx('slash', e.x, e.y, { angle: e.angle, color: cfg.glow, radius: 115 });
          this.shake = Math.max(this.shake, 6);
          e.casting = false;
        }
      });
    }
  },

  castBossAbility(e) {
    const cfg = e.cfg;
    const p = this.player;
    const options = cfg.abilities.filter(a => a !== e.lastAbility);
    const ability = options[Math.floor(Math.random() * options.length)] || cfg.abilities[0];
    e.lastAbility = ability;
    e.casting = true;
    e.abilityCd = (e.phase === 2 ? 2.2 : 3.2) + rand(0, 1);
    const angle = Math.atan2(p.y - e.y, p.x - e.x);
    const finish = () => { e.casting = false; };

    if (ability === 'slam') {
      const tx = p.x, ty = p.y;
      this.telegraph({
        type: 'circle', x: tx, y: ty, r: 160, duration: 1.15, color: cfg.glow, boss: true, label: 'CRUSH',
        onDone: () => {
          this.vfx('quake', tx, ty, { color: cfg.glow, radius: 190 });
          this.burst(tx, ty, cfg.glow, 26, 220);
          if (Math.hypot(p.x - tx, p.y - ty) < 170) this.damagePlayer(e.atk * 1.45, e);
          this.shake = 14;
          audio.play('heavy');
          finish();
        }
      });
    } else if (ability === 'fan') {
      this.telegraph({
        type: 'cone', x: e.x, y: e.y, angle, r: 430, spread: .85, duration: .9, color: cfg.glow, boss: true,
        onDone: () => {
          for (let i = -2; i <= 2; i++) {
            this.spawnProjectile({
              team: 'enemy', x: e.x, y: e.y - 10, angle: angle + i * .2,
              speed: 245, damage: e.atk * .72, radius: 8, color: cfg.glow,
              type: 'orb', life: 4, source: 'boss'
            });
          }
          audio.play('skill');
          finish();
        }
      });
    } else if (ability === 'charge' || ability === 'teleport') {
      if (ability === 'teleport') {
        this.vfx('vanish', e.x, e.y, { color: cfg.glow, radius: 70 });
        const spot = this.pointNearPlayer(130);
        e.x = spot.x; e.y = spot.y;
        this.vfx('spawn', e.x, e.y, { color: cfg.glow, radius: 80 });
        this.telegraph({
          type: 'circle', x: p.x, y: p.y, r: 135, duration: .72, color: cfg.glow, boss: true, label: 'REAP',
          onDone: () => {
            this.vfx('quake', p.x, p.y, { color: cfg.glow, radius: 165 });
            if (Math.hypot(p.x - e.x, p.y - e.y) < 175) this.damagePlayer(e.atk * 1.25, e);
            this.shake = 11;
            finish();
          }
        });
      } else {
        const tx = clamp(p.x, 70, this.W - 70), ty = clamp(p.y, 100, this.H - 70);
        this.telegraph({
          type: 'line', x: e.x, y: e.y, x2: tx, y2: ty, width: 86, duration: .95, color: cfg.glow, boss: true,
          onDone: () => {
            const oldX = e.x, oldY = e.y;
            e.x = tx; e.y = ty;
            this.vfx('dash', oldX, oldY, { angle, color: cfg.glow });
            this.burst(tx, ty, cfg.glow, 22, 180);
            if (Math.hypot(p.x - tx, p.y - ty) < 120) this.damagePlayer(e.atk * 1.3, e);
            this.shake = 12;
            finish();
          }
        });
      }
    } else if (ability === 'rings' || ability === 'blades') {
      const count = ability === 'rings' ? 14 : 9;
      this.telegraph({
        type: 'ring', x: e.x, y: e.y, r: 150, duration: 1.05, color: cfg.glow, boss: true, label: ability === 'rings' ? 'TIDE' : 'EDGE',
        onDone: () => {
          for (let i = 0; i < count; i++) {
            const a = (i / count) * TAU + (ability === 'blades' ? e.angle : 0);
            this.spawnProjectile({
              team: 'enemy', x: e.x, y: e.y, angle: a, speed: ability === 'rings' ? 205 : 270,
              damage: e.atk * .55, radius: ability === 'rings' ? 7 : 6, color: cfg.glow,
              type: ability === 'rings' ? 'orb' : 'blade', life: 4.2, source: 'boss'
            });
          }
          audio.play('skill');
          finish();
        }
      });
    } else if (ability === 'summon') {
      this.telegraph({
        type: 'circle', x: e.x, y: e.y, r: 100, duration: .8, color: cfg.glow, boss: true,
        onDone: () => {
          const types = this.stage.chapter === 0 ? ['husk', 'stalker'] : this.stage.chapter === 1 ? ['wisp', 'mote'] : ['mote', 'stalker'];
          types.forEach((t, i) => {
            const a = rand(0, TAU);
            this.spawnEnemy(t, clamp(e.x + Math.cos(a) * 90, 30, this.W - 30), clamp(e.y + Math.sin(a) * 90, 100, this.H - 80), i * .1);
          });
          this.vfx('summon', e.x, e.y, { color: cfg.glow, radius: 120 });
          finish();
        }
      });
    } else if (ability === 'vortex') {
      this.telegraph({
        type: 'circle', x: e.x, y: e.y, r: 230, duration: .75, color: cfg.glow, boss: true, label: 'UNDERTOW',
        onDone: () => {
          this.vortexes.push({ x: e.x, y: e.y, r: 235, time: 2.4, tick: 0, damage: e.atk * .42, color: cfg.glow });
          finish();
        }
      });
    } else if (ability === 'beam') {
      const reach = 760;
      const x2 = e.x + Math.cos(angle) * reach;
      const y2 = e.y + Math.sin(angle) * reach;
      this.telegraph({
        type: 'line', x: e.x, y: e.y, x2, y2, width: 58, duration: 1.1, color: cfg.glow, boss: true, label: 'JUDGEMENT',
        onDone: () => {
          this.vfx('beam', e.x, e.y, { x2, y2, color: cfg.glow, width: 58, duration: .35 });
          if (this.distanceToSegment(p.x, p.y, e.x, e.y, x2, y2) < 54) this.damagePlayer(e.atk * 1.7, e);
          this.shake = 12;
          audio.play('heavy');
          finish();
        }
      });
    } else {
      finish();
      e.abilityCd = 2;
    }
  },

  pointNearPlayer(distance) {
    const p = this.player;
    const a = rand(0, TAU);
    return {
      x: clamp(p.x + Math.cos(a) * distance, 65, this.W - 65),
      y: clamp(p.y + Math.sin(a) * distance, 110, this.H - 65)
    };
  },

  damagePlayer(raw, source) {
    const p = this.player;
    if (p.dead || p.invuln > 0) return;
    const def = p.defBuff > 0 ? p.def * 1.45 : p.def;
    let amount = raw * 100 / (100 + def);
    if (source?.isBoss) amount *= 1.05;
    amount = Math.max(1, amount);
    this.damageFlash = Math.min(1, this.damageFlash + .65);
    this.shake = Math.max(this.shake, 7);
    haptic(18);
    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, amount);
      p.shield -= absorbed;
      amount -= absorbed;
      this.addNumber(p.x, p.y - 54, `-${Math.round(absorbed)}`, '#ffd083', false, 'shield');
    }
    if (amount > 0) {
      p.hp -= amount;
      p.hitFlash = .15;
      this.addNumber(p.x, p.y - 52, `-${Math.round(amount)}`, '#ff7d74', false, 'hurt');
      this.burst(p.x, p.y - 10, '#ff8b6c', 7, 90);
    }
    audio.play('hit');
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      this.defeatTimer = 1.65;
      this.shake = 16;
      this.burst(p.x, p.y - 20, '#ffb06e', 45, 260);
      this.vfx('death', p.x, p.y, { color: '#ffb06e', radius: 75 });
      this.showAnnouncement('YOU HAVE FALLEN', 'The ash remembers your name.', '');
      audio.play('defeat');
    }
    this.syncHud();
  },

  dealDamageToEnemy(e, raw, opts = {}) {
    if (!e || e.dead) return;
    const forceCrit = !!opts.forceCrit;
    const crit = forceCrit || Math.random() * 100 < this.player.crit;
    let amount = raw * 100 / (100 + e.def);
    if (crit) amount *= 1.75;
    if (e.isBoss && e.phase === 2) amount *= .92;
    amount = Math.max(1, amount);
    e.hp -= amount;
    e.hitFlash = .13;
    this.addNumber(e.x + rand(-8, 8), e.y - e.r - 8, Math.round(amount), crit ? '#ffd88c' : '#fff5e1', crit, crit ? 'crit' : 'damage');
    this.burst(e.x, e.y - e.r * .5, crit ? '#ffd88c' : this.cls.color, crit ? 10 : 4, crit ? 150 : 85);
    if (this.player.lifesteal > 0 && (opts.source === 'basic' || opts.source === 'cleave')) {
      const heal = amount * this.player.lifesteal;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    }
    if (crit) this.shake = Math.max(this.shake, 3.2);
    if (e.hp <= 0) this.killEnemy(e);
  },

  killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    this.state.stats.kills = (this.state.stats.kills || 0) + 1;
    const xp = Math.round((3 + this.stage.num * 2.2) * (e.cfg.xp || 1));
    const gold = 2 + this.stage.num;
    this.state.gold += gold;
    const levels = addXp(this.state, xp);
    if (levels > 0) {
      const p = this.player;
      p.maxHp += levels * 16;
      p.atk += levels * 1.9;
      p.def += levels * 1.25;
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .3);
      this.addNumber(p.x, p.y - 70, 'LEVEL UP', '#ffe1a0', false, 'buff');
      this.vfx('level', p.x, p.y, { color: '#ffe1a0', radius: 90 });
      this.burst(p.x, p.y - 20, '#ffe1a0', 30, 170);
      audio.play('level');
    }

    if (e.isBoss) {
      this.state.stats.bestStage = Math.max(this.state.stats.bestStage || 0, this.stage.num);
      this.burst(e.x, e.y - 20, e.cfg.glow, 70, 320);
      this.burst(e.x, e.y - 20, '#ffe3b0', 35, 240);
      this.shake = 18;
      this.hideBossBar();
      this.showAnnouncement('BOSS VANQUISHED', e.cfg.name, 'The path forward is open.');
      this.vfx('death', e.x, e.y, { color: e.cfg.glow, radius: 130 });
      audio.play('victory');
    } else {
      const drop = rollEnemyDrop(this.state, this.stage.num - 1);
      if (drop) {
        addItem(this.state, drop);
        this.pushLootToast(drop);
      }
      this.vfx('death', e.x, e.y, { color: e.cfg.glow, radius: e.r * 2 });
      this.burst(e.x, e.y - e.r, e.cfg.color, 12, 100);
      audio.play('hit');
    }
    this.syncHud();
  },

  spawnProjectile(opts) {
    const speed = opts.speed || 400;
    const angle = opts.angle || 0;
    this.projectiles.push({
      team: opts.team || 'player',
      x: opts.x, y: opts.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      damage: opts.damage || 1,
      radius: opts.radius || 5,
      color: opts.color || '#fff',
      type: opts.type || 'orb',
      crit: !!opts.crit,
      pierce: opts.pierce || 0,
      life: opts.life || 2.2,
      maxLife: opts.life || 2.2,
      hit: new Set(),
      source: opts.source || 'basic',
      t: 0
    });
  },

  updateProjectiles(dt) {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const b = this.projectiles[i];
      b.t += dt;
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let gone = b.life <= 0 || b.x < -40 || b.x > this.W + 40 || b.y < -40 || b.y > this.H + 40;
      if (!gone && b.team === 'player') {
        for (const e of this.enemies) {
          if (e.dead || b.hit.has(e.id) || e.spawnTimer > 0) continue;
          if (Math.hypot(b.x - e.x, b.y - (e.y - e.r * .45)) < b.radius + e.r) {
            b.hit.add(e.id);
            this.dealDamageToEnemy(e, b.damage, { source: b.source, forceCrit: b.crit });
            this.spark(b.x, b.y, b.color, 5);
            if (b.pierce > 0) b.pierce--;
            else { gone = true; break; }
          }
        }
      } else if (!gone && b.team === 'enemy') {
        if (Math.hypot(b.x - p.x, b.y - (p.y - 18)) < b.radius + p.r) {
          this.damagePlayer(b.damage, { isBoss: b.source === 'boss' });
          this.spark(b.x, b.y, b.color, 8);
          gone = true;
        }
      }
      if (gone) this.projectiles.splice(i, 1);
    }
  },

  telegraph(opts) {
    this.telegraphs.push({
      type: opts.type || 'circle', x: opts.x, y: opts.y, x2: opts.x2, y2: opts.y2,
      r: opts.r || 100, angle: opts.angle || 0, spread: opts.spread || 1,
      width: opts.width || 50, duration: opts.duration || 1, t: 0,
      color: opts.color || '#ffb06e', boss: !!opts.boss, label: opts.label || '',
      onDone: opts.onDone || (() => {})
    });
    audio.play('click');
  },

  updateTelegraphs(dt) {
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const t = this.telegraphs[i];
      t.t += dt;
      if (t.t >= t.duration) {
        this.telegraphs.splice(i, 1);
        t.onDone();
      }
    }
  },

  updateZones(dt) {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.time -= dt;
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = .3;
        for (const e of this.enemies) {
          if (!e.dead && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) {
            this.dealDamageToEnemy(e, z.damage, { source: 'rain' });
            e.slow = Math.max(e.slow, .5);
          }
        }
        this.vfx('rain', z.x + rand(-z.r * .7, z.r * .7), z.y + rand(-z.r * .7, z.r * .7), { color: '#b9e7a0', radius: 18 });
      }
      if (z.time <= 0) this.zones.splice(i, 1);
    }
  },

  updateVortexes(dt) {
    const p = this.player;
    for (let i = this.vortexes.length - 1; i >= 0; i--) {
      const v = this.vortexes[i];
      v.time -= dt;
      v.tick -= dt;
      const dx = v.x - p.x, dy = v.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < v.r) {
        p.x += dx / d * 90 * dt;
        p.y += dy / d * 90 * dt;
      }
      if (v.tick <= 0) {
        v.tick = .48;
        if (d < v.r) this.damagePlayer(v.damage, { isBoss: true });
        this.vfx('ring', v.x, v.y, { color: v.color, radius: v.r * .8, duration: .5 });
      }
      if (v.time <= 0) this.vortexes.splice(i, 1);
    }
  },

  vfx(type, x, y, opts = {}) {
    this.effects.push({
      type, x, y, x2: opts.x2, y2: opts.y2,
      color: opts.color || '#f2c77a',
      radius: opts.radius || 50,
      angle: opts.angle || 0,
      width: opts.width || 10,
      duration: opts.duration || (type === 'quake' ? .55 : type === 'meteor' ? .8 : .4),
      t: 0
    });
    if (this.effects.length > 80) this.effects.shift();
  },

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.t += dt;
      if (e.t >= e.duration) this.effects.splice(i, 1);
    }
  },

  burst(x, y, color, count = 12, speed = 120) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(speed * .2, speed);
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * .18,
        life: rand(.25, .8), maxLife: .8, size: rand(1.3, 3.4),
        color, gravity: 80
      });
    }
    if (this.particles.length > 360) this.particles.splice(0, this.particles.length - 360);
  },

  spark(x, y, color, count = 3) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(10, 70);
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: rand(.12, .35), maxLife: .35, size: rand(.7, 2),
        color, gravity: 0
      });
    }
  },

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.vx *= .985;
    }
  },

  addNumber(x, y, text, color, crit = false, kind = 'damage') {
    this.numbers.push({ x, y, text: String(text), color, crit, kind, life: kind === 'buff' ? 1.1 : .85, maxLife: kind === 'buff' ? 1.1 : .85, vy: kind === 'heal' ? -48 : -62 });
    if (this.numbers.length > 45) this.numbers.shift();
  },

  updateNumbers(dt) {
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.life -= dt;
      n.y += n.vy * dt;
      n.vy *= .94;
      if (n.life <= 0) this.numbers.splice(i, 1);
    }
  },

  finishVictory() {
    if (this.finished) return;
    this.finished = true;
    this.pendingWave = false;
    this.enemies = [];
    this.projectiles = [];
    this.telegraphs = [];
    this.vortexes = [];
    if (!this.rewarded) {
      this.rewarded = true;
      this.rewards = grantStageRewards(this.state, this.stage);
      this.onVictory(this.rewards);
    }
    this.hideBossBar();
    this.showResult('victory', this.rewards);
  },

  finishDefeat() {
    if (this.finished) return;
    this.finished = true;
    this.state.stats.deaths = (this.state.stats.deaths || 0) + 1;
    this.pendingWave = false;
    this.onDefeat();
    this.showResult('defeat');
  }
};
