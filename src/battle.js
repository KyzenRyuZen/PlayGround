/* ---------------------------------------------------------------
   EMBERBOUND — battle simulation.
   DOM-free: the renderer reads this state, tools/balance.mjs can
   run the same rules headlessly.
   --------------------------------------------------------------- */
import { ARENA, PLAYER_R, ENEMIES, BOSSES, CLASSES } from './data.js';
import {
  clamp, dist, mitigation, rollItem, enemyStats, bossStats,
} from './rules.js';

const TAU = Math.PI * 2;
const rnd = Math.random;

function angleDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = dx * dx + dy * dy;
  if (len === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export class Battle {
  constructor(opts) {
    this.stage = opts.stage;
    this.classId = opts.classId;
    this.stats = opts.stats;
    this.rng = opts.rng || rnd;
    this.emit = opts.onEvent || (() => {});
    this.time = 0;
    this.waveIndex = -1;
    this.waves = this.stage.waves;
    this.state = 'combat';
    this.pending = [];
    this.enemies = [];
    this.projectiles = [];
    this.hazards = [];
    this.pickups = [];
    this.particles = [];
    this.floaters = [];
    this.slashes = [];
    this.banners = [];
    this.loot = [];
    this.gold = 0;
    this.xp = 0;
    this.kills = 0;
    this.revives = 0;
    this.bossDefeated = false;
    this.boss = null;
    this.endTimer = -1;
    this.intermission = 0;
    this.shake = 0;
    this.flash = 0;
    this.slowmo = 0;
    this.hitStop = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.cooldowns = [0, 0, 0];
    this.skillDefs = CLASSES[this.classId].skills;
    this.player = {
      x: ARENA / 2, y: ARENA * 0.62, r: PLAYER_R,
      hp: this.stats.hp, maxHp: this.stats.hp,
      facing: -Math.PI / 2, vx: 0, vy: 0,
      atkTimer: 0.4, invuln: 0, slowT: 0, slow: 0,
      invulnT: 0, attackAnim: 0, castAnim: 0, attackCount: 0,
      guaranteed: 0, whirl: null, dash: null,
      drT: 0, drValue: 0, buffs: [], burn: null,
      hitFlash: 0, moving: false, lastMove: { x: 0, y: -1 },
    };
    this._startWave(0);
    this.emit({ type: 'start', stage: this.stage });
  }

  /* ---------------------------------------------------------- waves */
  _startWave(index) {
    this.waveIndex = index;
    const w = this.waves[index];
    if (!w) return this._finish(true);
    this.intermission = 0;
    this.state = 'combat';
    this.emit({ type: 'wave', index, total: this.waves.length });
    if (w.boss) {
      const b = this._spawnBoss(w.boss);
      this.emit({ type: 'banner', sub: 'Boss', main: BOSSES[w.boss].name, boss: true });
      this.emit({ type: 'boss', boss: b });
      this.shake = Math.max(this.shake, 10);
      for (const [type, count] of (w.enemies || [])) this._spawnGroup(type, count, b.x, b.y, false, 110);
    } else {
      this.emit({ type: 'banner', sub: `Wave ${index + 1} of ${this.waves.length}`, main: this.stage.name });
      for (const [type, count] of (w.enemies || [])) this._spawnGroup(type, count, this.player.x, this.player.y, false);
    }
  }

  _spawnGroup(type, count, cx, cy, elite, radius = 0) {
    const eliteChance = this.stage.rift ? 0.16 : clamp((this.stage.id - 3) * 0.028, 0, 0.2);
    let usedElite = false;
    for (let i = 0; i < count; i++) {
      const isElite = elite || (!usedElite && count > 2 && this.rng() < eliteChance);
      if (isElite) usedElite = true;
      const a = this.rng() * TAU;
      let x, y, tries = 0;
      do {
        const d = radius ? radius + this.rng() * 90 : 280 + this.rng() * 220;
        x = clamp(cx + Math.cos(a + i * 0.8) * d, 70, ARENA - 70);
        y = clamp(cy + Math.sin(a + i * 0.8) * d, 70, ARENA - 70);
        tries++;
      } while (tries < 8 && dist(x, y, this.player.x, this.player.y) < 190);
      this._spawnEnemy(type, x, y, isElite);
    }
  }

  _spawnEnemy(typeId, x, y, elite = false) {
    const base = ENEMIES[typeId];
    const s = enemyStats(typeId, this.stage, elite);
    const e = {
      id: ++Battle._id, type: typeId, name: (elite ? 'Elite ' : '') + base.name,
      x, y, r: base.r * (elite ? 1.18 : 1), hp: s.hp, maxHp: s.hp, atk: s.atk, def: s.def,
      spd: s.spd, xp: s.xp, goldMin: s.goldMin, goldMax: s.goldMax,
      behavior: base.behavior, color: base.color, elite,
      state: 'idle', t: 0, cd: this.rng() * 0.8, angle: 0, hitDone: false,
      spawnT: 0.55, flash: 0, stun: 0, freezeT: 0, slowT: 0, slow: 0,
      knockX: 0, knockY: 0, blinkCd: 2 + this.rng() * 3, burn: null,
      attackRange: base.attack?.range || 44, windup: base.attack?.windup || 0.5,
      anim: this.rng() * TAU, phase: 0, boss: false,
    };
    this.enemies.push(e);
    return e;
  }

  _spawnBoss(bossId) {
    const meta = BOSSES[bossId];
    const s = bossStats(bossId, this.stage);
    const b = {
      id: ++Battle._id, type: bossId, bossId, name: meta.name, boss: true,
      x: ARENA / 2, y: 300, r: meta.r, hp: s.hp, maxHp: s.hp, atk: s.atk, def: s.def,
      spd: s.spd, xp: s.xp, goldMin: s.goldMin, goldMax: s.goldMax,
      behavior: 'boss', color: meta.color, accent: meta.accent, elite: false,
      state: 'idle', t: 0, cd: 0, angle: Math.PI / 2, hitDone: false,
      spawnT: 0.8, flash: 0, stun: 0, freezeT: 0, slowT: 0, slow: 0,
      knockX: 0, knockY: 0, burn: null, phase: 1, patternIndex: 0,
      patternTimer: 1.6, charge: null, castT: 0, anim: 0, attackRange: 90,
    };
    this.enemies.push(b);
    this.boss = b;
    return b;
  }

  schedule(delay, fn) { this.pending.push({ t: delay, fn }); }

  /* ---------------------------------------------------------- update */
  update(dt, input = {}) {
    if (this.state === 'victory' || this.state === 'defeat') {
      this._updateEffects(dt);
      return;
    }
    const realDt = Math.min(dt, 0.05);
    this.time += realDt;
    let worldDt = realDt;
    if (this.hitStop > 0) { this.hitStop -= realDt; worldDt *= 0.18; }
    if (this.slowmo > 0) { this.slowmo -= realDt; worldDt *= 0.4; }

    this.shake = Math.max(0, this.shake - realDt * 38);
    this.flash = Math.max(0, this.flash - realDt * 3);

    this._updatePlayer(worldDt, input);
    for (let i = 0; i < this.cooldowns.length; i++) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - worldDt);
    this._updatePending(worldDt);
    this._updateHazards(worldDt);
    this._updateProjectiles(worldDt);
    this._updateEnemies(worldDt);
    this._updatePickups(worldDt);
    this._updateEffects(worldDt);
    this._separate();

    if (this.state === 'combat') {
      if (this.endTimer > 0) {
        this.endTimer -= realDt;
        if (this.endTimer <= 0) this._finish(true);
      } else if (this.bossDefeated && !this.boss) {
        this.endTimer = 1.7;
      } else if (this.enemies.length === 0) {
        if (this.waveIndex >= this.waves.length - 1) {
          this.endTimer = 1.0;
        } else if (this.intermission <= 0) {
          this.intermission = 1.25;
          this.emit({ type: 'waveClear', index: this.waveIndex });
        }
      }
      if (this.intermission > 0) {
        this.intermission -= realDt;
        if (this.intermission <= 0) this._startWave(this.waveIndex + 1);
      }
    }
  }

  _updatePlayer(dt, input) {
    const p = this.player;
    p.invuln = Math.max(0, p.invuln - dt);
    p.slowT = Math.max(0, p.slowT - dt);
    if (p.slowT <= 0) p.slow = 0;
    p.drT = Math.max(0, p.drT - dt);
    p.attackAnim = Math.max(0, p.attackAnim - dt * 3.5);
    p.castAnim = Math.max(0, p.castAnim - dt * 2.5);
    p.hitFlash = Math.max(0, p.hitFlash - dt * 5);
    for (const b of p.buffs) b.t -= dt;
    p.buffs = p.buffs.filter(b => b.t > 0);

    if (p.burn) {
      p.burn.t -= dt;
      p.burn.tick = (p.burn.tick || 0) + dt;
      if (p.burn.tick >= 0.5) {
        p.burn.tick -= 0.5;
        this._hurtPlayer(p.burn.dps * 0.5, { silent: true, noDR: true, burn: true });
      }
      if (p.burn.t <= 0) p.burn = null;
    }

    let mx = input.move?.x || 0, my = input.move?.y || 0;
    const mag = Math.hypot(mx, my);
    if (mag > 1) { mx /= mag; my /= mag; }
    p.moving = mag > 0.08;
    if (p.moving) p.lastMove = { x: mx, y: my };

    if (p.dash) {
      const d = p.dash;
      d.t -= dt;
      const step = d.speed * dt;
      p.x = clamp(p.x + d.dx * step, 26, ARENA - 26);
      p.y = clamp(p.y + d.dy * step, 26, ARENA - 26);
      p.facing = Math.atan2(d.dy, d.dx);
      this._dashTrail(p.x, p.y);
      if (d.kind === 'bash') this._bashHits(d);
      if (d.t <= 0) p.dash = null;
      return;
    }

    if (p.freezeT > 0) { p.freezeT -= dt; return; }

    let spd = this.stats.spd * (1 - p.slow);
    for (const b of p.buffs) if (b.spd) spd *= 1 + b.spd;
    p.x = clamp(p.x + mx * spd * dt, 24, ARENA - 24);
    p.y = clamp(p.y + my * spd * dt, 24, ARENA - 24);
    if (p.moving) p.facing = Math.atan2(my, mx);

    if (p.whirl) {
      p.whirl.t -= dt;
      p.whirl.tick = (p.whirl.tick || 0) + dt;
      if (p.whirl.tick >= 0.36) {
        p.whirl.tick -= 0.36;
        this._whirlTick();
      }
      if (p.whirl.t <= 0) p.whirl = null;
    }

    p.atkTimer = Math.max(0, p.atkTimer - dt);
    if (p.atkTimer <= 0 && p.invuln < 999) this._autoAttack();
  }

  _autoAttack() {
    const p = this.player;
    const atk = CLASSES[this.classId].attack;
    const target = this._nearestEnemy(p.x, p.y, atk.range + 30);
    if (!target) return;
    const a = Math.atan2(target.y - p.y, target.x - p.x);
    p.facing = a;
    p.attackCount++;
    const mult = atk.mult * (1 + (p.buffs.find(b => b.atk)?.atk || 0));
    let guaranteed = false;
    if (this.classId === 'archer' && (p.attackCount % 4 === 0 || p.guaranteed > 0)) {
      guaranteed = true;
      if (p.guaranteed > 0) p.guaranteed--;
    }
    if (this.classId === 'warrior') {
      const range = atk.range;
      let hit = false;
      for (const e of this.enemies) {
        if (e.spawnT > 0) continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d > range + e.r) continue;
        const ea = Math.atan2(e.y - p.y, e.x - p.x);
        if (Math.abs(angleDiff(ea, a)) > atk.arc / 2) continue;
        this._hitEnemy(e, mult * this.stats.atk, { crit: this._crit(false) });
        hit = true;
      }
      p.atkTimer = atk.cd;
      p.attackAnim = 1;
      this.slashes.push({ x: p.x, y: p.y, angle: a, range: range + 10, arc: atk.arc, life: 0.16, max: 0.16, color: '#ffd28a' });
      if (hit) this.emit({ type: 'sfx', name: 'swing' });
      p.x = clamp(p.x + Math.cos(a) * atk.lunge, 24, ARENA - 24);
      p.y = clamp(p.y + Math.sin(a) * atk.lunge, 24, ARENA - 24);
    } else if (this.classId === 'mage') {
      p.atkTimer = atk.cd;
      p.attackAnim = 1;
      this.projectiles.push({
        x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20,
        vx: Math.cos(a) * atk.speed, vy: Math.sin(a) * atk.speed,
        r: atk.r, dmg: mult * this.stats.atk, owner: 'player', life: 1.4,
        homing: atk.homing, splash: atk.splash, splashMult: atk.splashMult,
        color: '#a9b6ff', kind: 'bolt', crit: this._crit(false), hitSet: new Set(),
      });
      this.emit({ type: 'sfx', name: 'cast' });
    } else {
      p.atkTimer = atk.cd;
      p.attackAnim = 1;
      this.projectiles.push({
        x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20,
        vx: Math.cos(a) * atk.speed, vy: Math.sin(a) * atk.speed,
        r: atk.r, dmg: mult * this.stats.atk, owner: 'player', life: 1.0,
        pierce: atk.pierce, color: '#b7ffd9', kind: 'arrow', crit: guaranteed ? true : this._crit(false),
        hitSet: new Set(), trail: true,
      });
      this.emit({ type: 'sfx', name: 'bow' });
    }
  }

  _crit(guaranteed = false) {
    if (guaranteed) return true;
    return this.rng() * 100 < this.stats.crit;
  }

  /* ---------------------------------------------------------- skills */
  castSkill(index, input = {}) {
    if (this.state !== 'combat' || this.player.hp <= 0) return false;
    if (this.cooldowns[index] > 0) return false;
    const skill = this.skillDefs[index];
    if (!skill) return false;
    const p = this.player;
    this.cooldowns[index] = skill.cd;
    this.emit({ type: 'skill', skill: skill.id });
    switch (skill.id) {
      case 'whirlwind': {
        p.whirl = { t: 1.12, tick: 0 };
        p.drT = 1.2; p.drValue = 0.4;
        this._whirlTick();
        this.emit({ type: 'sfx', name: 'whirl' });
        break;
      }
      case 'shieldbash': {
        let dx = input.move?.x || 0, dy = input.move?.y || 0;
        if (Math.hypot(dx, dy) < 0.1) { dx = Math.cos(p.facing); dy = Math.sin(p.facing); }
        else { const l = Math.hypot(dx, dy); dx /= l; dy /= l; }
        p.dash = { dx, dy, t: 0.23, speed: 960, kind: 'bash', hit: new Set() };
        p.invuln = 0.36;
        p.attackAnim = 1;
        this.shake = Math.max(this.shake, 3);
        this.emit({ type: 'sfx', name: 'dash' });
        break;
      }
      case 'warbanner': {
        p.buffs = p.buffs.filter(b => b.id !== 'banner');
        p.buffs.push({ id: 'banner', t: 8, atk: 0.3, spd: 0.2 });
        this._healPlayer(this.stats.hp * 0.18);
        p.slow = 0; p.slowT = 0;
        this.banners.push({ x: p.x, y: p.y, t: 8, max: 8 });
        this.emit({ type: 'sfx', name: 'banner' });
        break;
      }
      case 'frostnova': {
        this._nova(p.x, p.y, 228, 1.8, '#bfe9ff', 1.7);
        this.emit({ type: 'sfx', name: 'nova' });
        break;
      }
      case 'meteor': {
        const t = this._nearestEnemy(p.x, p.y, 800);
        const tx = t ? t.x : clamp(p.x + Math.cos(p.facing) * 300, 80, ARENA - 80);
        const ty = t ? t.y : clamp(p.y + Math.sin(p.facing) * 300, 80, ARENA - 80);
        this.hazards.push({
          kind: 'meteor', x: tx, y: ty, r: 154, delay: 1.0, dmg: 4.2 * this.stats.atk,
          color: '#ff9a5e', after: 'burn', slow: 0,
        });
        this.emit({ type: 'sfx', name: 'meteor' });
        break;
      }
      case 'blink': {
        let dx = input.move?.x || 0, dy = input.move?.y || 0;
        if (Math.hypot(dx, dy) < 0.1) {
          const t = this._nearestEnemy(p.x, p.y, 900);
          const a = t ? Math.atan2(p.y - t.y, p.x - t.x) : p.facing;
          dx = Math.cos(a); dy = Math.sin(a);
        } else { const l = Math.hypot(dx, dy); dx /= l; dy /= l; }
        const ox = p.x, oy = p.y;
        p.x = clamp(p.x + dx * 255, 26, ARENA - 26);
        p.y = clamp(p.y + dy * 255, 26, ARENA - 26);
        p.invuln = 0.5;
        this.hazards.push({
          kind: 'circle', x: ox, y: oy, r: 120, delay: 0.12, dmg: 1.6 * this.stats.atk,
          color: '#b7a6ff', slow: 0.4, slowT: 2.2,
        });
        this._burst(ox, oy, '#b7a6ff', 22, 190);
        this._burst(p.x, p.y, '#dcd2ff', 16, 120);
        this.emit({ type: 'sfx', name: 'blink' });
        break;
      }
      case 'arrowrain': {
        const t = this._nearestEnemy(p.x, p.y, 700);
        const tx = t ? t.x : clamp(p.x + Math.cos(p.facing) * 300, 80, ARENA - 80);
        const ty = t ? t.y : clamp(p.y + Math.sin(p.facing) * 300, 80, ARENA - 80);
        for (let i = 0; i < 7; i++) {
          this.schedule(i * 0.27, () => {
            const a = this.rng() * TAU, d = this.rng() * 72;
            this.hazards.push({
              kind: 'rain', x: clamp(tx + Math.cos(a) * d, 60, ARENA - 60),
              y: clamp(ty + Math.sin(a) * d, 60, ARENA - 60), r: 102, delay: 0.18,
              dmg: 0.7 * this.stats.atk, color: '#b7ffd9', slow: 0.3, slowT: 2,
            });
            this.emit({ type: 'sfx', name: 'rain' });
          });
        }
        break;
      }
      case 'piercing': {
        const t = this._nearestEnemy(p.x, p.y, 900);
        const a = t ? Math.atan2(t.y - p.y, t.x - p.x) : p.facing;
        p.facing = a;
        this.projectiles.push({
          x: p.x, y: p.y, vx: Math.cos(a) * 1450, vy: Math.sin(a) * 1450,
          r: 15, dmg: 3.6 * this.stats.atk, owner: 'player', life: 0.62,
          pierce: 99, color: '#e2fff1', kind: 'lance', crit: this._crit(false),
          hitSet: new Set(), knock: 210, trail: true,
        });
        this.slashes.push({ x: p.x, y: p.y, angle: a, range: 620, arc: 0.12, life: 0.2, max: 0.2, color: '#d8ffe9', line: true });
        this.shake = Math.max(this.shake, 4);
        this.emit({ type: 'sfx', name: 'lance' });
        break;
      }
      case 'shadowroll': {
        let dx = input.move?.x || 0, dy = input.move?.y || 0;
        if (Math.hypot(dx, dy) < 0.1) { dx = Math.cos(p.facing); dy = Math.sin(p.facing); }
        else { const l = Math.hypot(dx, dy); dx /= l; dy /= l; }
        p.dash = { dx, dy, t: 0.25, speed: 1080, kind: 'roll', hit: new Set() };
        p.invuln = 0.5;
        p.guaranteed = Math.min(6, p.guaranteed + 3);
        this.emit({ type: 'sfx', name: 'roll' });
        break;
      }
    }
    return true;
  }

  _whirlTick() {
    const p = this.player;
    const dmg = 0.85 * this.stats.atk;
    for (const e of this.enemies) {
      if (e.spawnT > 0) continue;
      if (dist(p.x, p.y, e.x, e.y) <= 158 + e.r) {
        this._hitEnemy(e, dmg, { crit: this._crit(false), knock: 24 });
      }
    }
    this.slashes.push({ x: p.x, y: p.y, angle: p.facing, range: 166, arc: TAU, life: 0.2, max: 0.2, color: '#ffd28a', spin: true });
    this._burst(p.x, p.y, '#ffd28a', 8, 120);
  }

  _bashHits(d) {
    const p = this.player;
    for (const e of this.enemies) {
      if (d.hit.has(e.id) || e.spawnT > 0) continue;
      if (dist(p.x, p.y, e.x, e.y) <= 54 + e.r) {
        d.hit.add(e.id);
        this._hitEnemy(e, 2.4 * this.stats.atk, { crit: this._crit(false), knock: 210 });
        e.stun = e.boss ? 0.7 : 1.35;
        e.state = 'idle';
        this._burst(e.x, e.y, '#ffe7b0', 14, 150);
        this.shake = Math.max(this.shake, 5);
      }
    }
  }

  _nova(x, y, radius, mult, color, freeze) {
    for (const e of this.enemies) {
      if (e.spawnT > 0) continue;
      if (dist(x, y, e.x, e.y) <= radius + e.r) {
        this._hitEnemy(e, mult * this.stats.atk, { crit: this._crit(false) });
        e.freezeT = Math.max(e.freezeT, freeze * (e.boss ? 0.35 : 1));
        e.state = 'idle';
      }
    }
    this.hazards.push({ kind: 'nova', x, y, r: radius, delay: 0, dmg: 0, color, life: 0.4, maxLife: 0.4 });
    this.shake = Math.max(this.shake, 5);
  }

  /* ---------------------------------------------------------- enemies */
  _updateEnemies(dt) {
    for (const e of this.enemies) {
      e.flash = Math.max(0, e.flash - dt * 6);
      e.anim += dt * (e.boss ? 1.2 : 2);
      e.cd = Math.max(0, e.cd - dt);
      e.stun = Math.max(0, e.stun - dt);
      e.freezeT = Math.max(0, e.freezeT - dt);
      e.slowT = Math.max(0, e.slowT - dt);
      if (e.slowT <= 0) e.slow = 0;
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      if (e.hp <= 0) continue;

      if (e.burn) {
        e.burn.t -= dt; e.burn.tick = (e.burn.tick || 0) + dt;
        if (e.burn.tick >= 0.4) {
          e.burn.tick -= 0.4;
          this._hitEnemy(e, e.burn.dps * 0.4, { noCrit: true, silent: true, burn: true });
        }
        if (e.burn.t <= 0) e.burn = null;
      }

      if (e.stun > 0 || e.freezeT > 0) continue;

      if (e.knockX || e.knockY) {
        e.x = clamp(e.x + e.knockX * dt, 24, ARENA - 24);
        e.y = clamp(e.y + e.knockY * dt, 24, ARENA - 24);
        e.knockX *= Math.pow(0.02, dt);
        e.knockY *= Math.pow(0.02, dt);
        if (Math.abs(e.knockX) < 2) e.knockX = 0;
        if (Math.abs(e.knockY) < 2) e.knockY = 0;
      }

      if (e.boss) { this._updateBoss(e, dt); continue; }

      const d = dist(e.x, e.y, this.player.x, this.player.y);
      if (e.behavior === 'ranged') this._updateRanged(e, d, dt);
      else if (e.behavior === 'blink') this._updateBlink(e, d, dt);
      else this._updateChase(e, d, dt);
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
  }

  _moveEnemy(e, tx, ty, speedMult, dt) {
    const a = Math.atan2(ty - e.y, tx - e.x);
    const spd = e.spd * speedMult * (1 - e.slow);
    e.x = clamp(e.x + Math.cos(a) * spd * dt, 22, ARENA - 22);
    e.y = clamp(e.y + Math.sin(a) * spd * dt, 22, ARENA - 22);
    e.anim += dt * spd * 0.02;
    return a;
  }

  _updateChase(e, d, dt) {
    if (e.state === 'windup') {
      e.t -= dt;
      e.angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      if (e.t <= 0) {
        const base = ENEMIES[e.type].attack;
        if (d <= (base.aoe || base.range) + this.player.r + 14) {
          this._hurtPlayer(e.atk * base.mult);
        }
        if (base.aoe) {
          this.hazards.push({ kind: 'slam', x: e.x, y: e.y, r: base.aoe, delay: 0, dmg: 0, color: '#ffb18a', life: 0.32, maxLife: 0.32 });
        }
        e.state = 'chase';
        e.cd = base.cd;
        this.slashes.push({ x: e.x, y: e.y, angle: e.angle, range: (base.aoe || base.range) + 14, arc: base.arc || TAU, life: 0.16, max: 0.16, color: '#ff9b7e' });
      }
      return;
    }
    if (d > e.attackRange + this.player.r - 4) {
      this._moveEnemy(e, this.player.x, this.player.y, 1, dt);
    } else if (e.cd <= 0) {
      e.state = 'windup'; e.t = e.windup;
      e.angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      e.cd = e.windup + 0.3;
    }
  }

  _updateRanged(e, d, dt) {
    const base = ENEMIES[e.type].attack;
    const preferred = ENEMIES[e.type].preferred || 260;
    if (e.state === 'windup') {
      e.t -= dt;
      e.angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      if (e.t <= 0) {
        this._enemyShot(e, base);
        e.state = 'idle';
        e.cd = base.cd;
      }
      return;
    }
    if (d < preferred * 0.72) this._moveEnemy(e, e.x * 2 - this.player.x, e.y * 2 - this.player.y, 0.9, dt);
    else if (d > base.range) this._moveEnemy(e, this.player.x, this.player.y, 0.8, dt);
    else {
      const a = Math.atan2(this.player.y - e.y, this.player.x - e.x) + Math.PI / 2;
      const spd = e.spd * 0.35;
      e.x = clamp(e.x + Math.cos(a) * spd * dt, 22, ARENA - 22);
      e.y = clamp(e.y + Math.sin(a) * spd * dt, 22, ARENA - 22);
      if (e.cd <= 0) { e.state = 'windup'; e.t = e.windup; }
    }
  }

  _enemyShot(e, base) {
    const a = Math.atan2(this.player.y - e.y, this.player.x - e.x);
    this.projectiles.push({
      x: e.x + Math.cos(a) * e.r, y: e.y + Math.sin(a) * e.r,
      vx: Math.cos(a) * base.projSpeed, vy: Math.sin(a) * base.projSpeed,
      r: base.projR || 7, dmg: e.atk * base.mult, owner: 'enemy', life: 3.2,
      color: e.type === 'hexer' ? '#c7e37b' : '#ffb35e', kind: 'enemy',
      slow: base.slow || 0, slowT: base.slowT || 0, source: e,
    });
    this.emit({ type: 'sfx', name: 'shoot' });
  }

  _updateBlink(e, d, dt) {
    e.blinkCd -= dt;
    if (e.blinkCd <= 0 && d > 110 && d < 620) {
      e.blinkCd = 4.5 + this.rng() * 2;
      const a = Math.atan2(this.player.y - e.y, this.player.x - e.x) + (this.rng() - 0.5) * 1.2;
      const nx = clamp(this.player.x + Math.cos(a) * 82, 30, ARENA - 30);
      const ny = clamp(this.player.y + Math.sin(a) * 82, 30, ARENA - 30);
      this._burst(e.x, e.y, '#b9a3e8', 16, 100);
      e.x = nx; e.y = ny;
      this._burst(e.x, e.y, '#b9a3e8', 12, 90);
      e.cd = 0.35;
      return;
    }
    this._updateChase(e, d, dt);
  }

  /* ---------------------------------------------------------- boss */
  _updateBoss(b, dt) {
    if (b.castT > 0) b.castT -= dt;
    if (b.charge) {
      const c = b.charge;
      c.t -= dt;
      b.x = clamp(b.x + c.dx * c.speed * dt, 40, ARENA - 40);
      b.y = clamp(b.y + c.dy * c.speed * dt, 40, ARENA - 40);
      this._dashTrail(b.x, b.y, b.color, true);
      if (!c.hit && dist(b.x, b.y, this.player.x, this.player.y) < b.r + this.player.r + 20) {
        c.hit = true;
        this._hurtPlayer(b.atk * 1.8, { knockback: 250 });
      }
      if (c.t <= 0) b.charge = null;
      return;
    }
    if (b.freezeT > 0) return;

    if (b.phase === 1 && b.hp < b.maxHp * 0.5) {
      b.phase = 2;
      b.spd *= 1.12;
      b.patternTimer = 0.8;
      this.slowmo = 0.7;
      this.shake = 14;
      this.emit({ type: 'banner', sub: 'The air breaks', main: 'Enraged', boss: true });
      this.emit({ type: 'sfx', name: 'enrage' });
    }

    const d = dist(b.x, b.y, this.player.x, this.player.y);
    if (d > 290) this._moveEnemy(b, this.player.x, this.player.y, 0.55, dt);
    else if (d < 150) this._moveEnemy(b, b.x * 2 - this.player.x, b.y * 2 - this.player.y, 0.4, dt);
    else {
      const a = Math.atan2(this.player.y - b.y, this.player.x - b.x) + Math.PI / 2;
      b.x += Math.cos(a) * b.spd * 0.22 * dt;
      b.y += Math.sin(a) * b.spd * 0.22 * dt;
    }

    b.patternTimer -= dt;
    if (b.patternTimer <= 0) {
      const meta = BOSSES[b.bossId];
      const seq = b.phase === 2 ? meta.phase2 : meta.sequence;
      const pattern = seq[b.patternIndex % seq.length];
      b.patternIndex++;
      b.patternTimer = (b.phase === 2 ? 2.15 : 2.9) + this.rng() * 0.5;
      this._bossPattern(b, pattern);
    }
  }

  _bossPattern(b, pattern) {
    const P = this.player;
    const atk = b.atk;
    const col = b.accent || b.color;
    b.angle = Math.atan2(P.y - b.y, P.x - b.x);
    switch (pattern) {
      case 'slam': {
        b.castT = 0.7;
        for (let i = 0; i < 3; i++) {
          this.schedule(i * 0.18, () => {
            const a = this.rng() * TAU, d = i === 0 ? 0 : 45 + this.rng() * 55;
            this.hazards.push({
              kind: 'circle', x: clamp(P.x + Math.cos(a) * d, 60, ARENA - 60),
              y: clamp(P.y + Math.sin(a) * d, 60, ARENA - 60),
              r: 82, delay: 0.8, dmg: atk * 1.3, color: col,
            });
          });
        }
        this.emit({ type: 'sfx', name: 'slam' });
        break;
      }
      case 'seeds': {
        b.castT = 0.5;
        this.schedule(0.38, () => {
          const base = Math.atan2(P.y - b.y, P.x - b.x);
          for (let i = -3; i <= 3; i++) {
            const a = base + i * 0.15;
            this.projectiles.push({
              x: b.x, y: b.y, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250,
              r: 7, dmg: atk * 1.0, owner: 'enemy', life: 3, color: col, kind: 'seed',
            });
          }
          this.emit({ type: 'sfx', name: 'shoot' });
        });
        break;
      }
      case 'summon': {
        b.castT = 0.6;
        this.schedule(0.5, () => {
          if (this.enemies.length > 16) return;
          const types = this.stage.biome === 'grove' ? ['crawler', 'wisp'] : this.stage.biome === 'ember' ? ['wisp', 'shade'] : this.stage.biome === 'frost' ? ['shade', 'sentinel'] : ['shade', 'wisp'];
          const t = types[Math.floor(this.rng() * types.length)];
          this._spawnGroup(t, 2, b.x, b.y, false, 100);
          this._burst(b.x, b.y, col, 18, 150);
          this.emit({ type: 'sfx', name: 'summon' });
        });
        break;
      }
      case 'roots': {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + this.rng() * 0.3;
          this.hazards.push({
            kind: 'circle', x: clamp(P.x + Math.cos(a) * 95, 60, ARENA - 60),
            y: clamp(P.y + Math.sin(a) * 95, 60, ARENA - 60), r: 54, delay: 0.75 + i * 0.05,
            dmg: atk * 1.1, color: col,
          });
        }
        this.emit({ type: 'sfx', name: 'slam' });
        break;
      }
      case 'charge': {
        const tx = P.x, ty = P.y;
        this.hazards.push({ kind: 'line', x1: b.x, y1: b.y, x2: tx, y2: ty, width: 78, delay: 0.9, dmg: atk * 1.2, color: '#ff7f55' });
        this.schedule(0.9, () => {
          const a = Math.atan2(P.y - b.y, P.x - b.x);
          b.charge = { dx: Math.cos(a), dy: Math.sin(a), t: 0.5, speed: 900, hit: false };
          this.emit({ type: 'sfx', name: 'charge' });
        });
        this.emit({ type: 'sfx', name: 'aim' });
        break;
      }
      case 'eruption': {
        for (let i = 0; i < 5; i++) {
          const a = this.rng() * TAU, d = 30 + this.rng() * 150;
          const x = clamp(P.x + Math.cos(a) * d, 60, ARENA - 60);
          const y = clamp(P.y + Math.sin(a) * d, 60, ARENA - 60);
          this.hazards.push({
            kind: 'circle', x, y, r: 78, delay: 1.05, dmg: atk * 1.2, color: '#ff7f55',
            after: 'lava',
          });
        }
        this.emit({ type: 'sfx', name: 'rumble' });
        break;
      }
      case 'ring':
      case 'rings': {
        for (let i = 0; i < 2; i++) {
          this.schedule(i * 0.55, () => {
            this.hazards.push({
              kind: 'ring', x: b.x, y: b.y, r0: 36, r1: 470, delay: 0.15,
              life: 0.95, maxLife: 0.95, dmg: atk * 1.4, color: col, ringHit: false,
            });
          });
        }
        this.emit({ type: 'sfx', name: 'ring' });
        break;
      }
      case 'icefan': {
        this.schedule(0.35, () => {
          const base = Math.atan2(P.y - b.y, P.x - b.x);
          for (let i = -4; i <= 4; i++) {
            const a = base + i * 0.13;
            this.projectiles.push({
              x: b.x, y: b.y, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280,
              r: 6, dmg: atk * 0.9, owner: 'enemy', life: 2.8, color: '#bdeeff', kind: 'shard',
              slow: 0.35, slowT: 2,
            });
          }
          this.emit({ type: 'sfx', name: 'shoot' });
        });
        break;
      }
      case 'blizzard': {
        for (let i = 0; i < 3; i++) {
          const a = this.rng() * TAU, d = i === 0 ? 0 : 60 + this.rng() * 90;
          this.hazards.push({
            kind: 'zone', x: clamp(P.x + Math.cos(a) * d, 80, ARENA - 80),
            y: clamp(P.y + Math.sin(a) * d, 80, ARENA - 80), r: 105,
            delay: 0.65, life: 4.2, maxLife: 4.2, tick: 0, dmg: atk * 0.42,
            color: '#a8e8ff', slow: 0.35, slowT: 1.2,
          });
        }
        this.emit({ type: 'sfx', name: 'blizzard' });
        break;
      }
      case 'blinkstrike': {
        this._burst(b.x, b.y, col, 24, 180);
        const a = this.rng() * TAU;
        b.x = clamp(P.x + Math.cos(a) * 120, 60, ARENA - 60);
        b.y = clamp(P.y + Math.sin(a) * 120, 60, ARENA - 60);
        this._burst(b.x, b.y, col, 24, 180);
        this.hazards.push({ kind: 'circle', x: b.x, y: b.y, r: 165, delay: 0.68, dmg: atk * 1.65, color: col });
        this.emit({ type: 'sfx', name: 'blink' });
        break;
      }
      case 'voidbeam': {
        for (let i = 0; i < 3; i++) {
          this.schedule(i * 0.42, () => {
            const a = Math.atan2(P.y - b.y, P.x - b.x) + (i - 1) * 0.22;
            const x2 = clamp(b.x + Math.cos(a) * 900, 0, ARENA);
            const y2 = clamp(b.y + Math.sin(a) * 900, 0, ARENA);
            this.hazards.push({ kind: 'line', x1: b.x, y1: b.y, x2, y2, width: 64, delay: 0.55, dmg: atk * 1.45, color: '#d9a6ff' });
            this.emit({ type: 'sfx', name: 'beam' });
          });
        }
        break;
      }
      case 'summonvoid': {
        if (this.enemies.length > 15) return;
        this._spawnGroup('shade', 2, b.x, b.y, false, 100);
        this._spawnGroup('wisp', 2, b.x, b.y, false, 120);
        break;
      }
    }
  }

  /* ---------------------------------------------------------- hazards */
  _updateHazards(dt) {
    for (const h of this.hazards) {
      const oneShot = h.kind === 'circle' || h.kind === 'line' || h.kind === 'meteor' || h.kind === 'rain';
      if (h.delay > 0) {
        h.delay -= dt;
        if (h.delay <= 0) {
          if (h.kind !== 'zone' && h.kind !== 'nova' && h.kind !== 'slam' && h.kind !== 'rain') this._hazardHit(h);
          if (h.kind === 'nova' || h.kind === 'slam' || h.kind === 'rain') this._hazardHit(h);
          if (oneShot) h.done = true;
          if (h.after === 'burn') {
            this.hazards.push({
              kind: 'zone', x: h.x, y: h.y, r: h.r * 0.7, delay: 0, life: 3,
              maxLife: 3, tick: 0, dmg: this.stats.atk * 0.3, color: '#ff9a5e', burn: true,
            });
          }
          if (h.after === 'lava') {
            this.hazards.push({
              kind: 'zone', x: h.x, y: h.y, r: h.r * 0.66, delay: 0, life: 4,
              maxLife: 4, tick: 0, dmg: h.dmg * 0.3, color: '#ff6a3d',
            });
          }
        }
      }
      if (h.inactive || h.done) continue;
      if (h.life !== undefined) {
        h.life -= dt;
        if (h.kind === 'zone' && h.delay <= 0) {
          h.tick += dt;
          if (h.tick >= 0.5) {
            h.tick -= 0.5;
            if (dist(this.player.x, this.player.y, h.x, h.y) <= h.r + this.player.r) {
              this._hurtPlayer(h.dmg, { silent: false });
              if (h.slow) { this.player.slow = h.slow; this.player.slowT = Math.max(this.player.slowT, h.slowT); }
            }
          }
        }
        if (h.kind === 'ring' && h.life > 0) {
          const prog = 1 - h.life / h.maxLife;
          const radius = h.r0 + (h.r1 - h.r0) * prog;
          h.radius = radius;
          const d = dist(this.player.x, this.player.y, h.x, h.y);
          if (!h.ringHit && Math.abs(d - radius) < 26 + this.player.r) {
            h.ringHit = true;
            this._hurtPlayer(h.dmg, { knockback: 120 });
          }
        }
      }
    }
    this.hazards = this.hazards.filter(h => {
      if (h.done) return false;
      if (h.kind === 'zone') return h.life > 0;
      if (h.kind === 'ring') return h.delay > 0 || h.life > 0;
      if (h.delay > 0) return true;
      if (h.life !== undefined) return h.life > 0;
      return true;
    });
  }

  _hazardHit(h) {
    const p = this.player;
    let hit = false;
    if (h.kind === 'line') {
      hit = segDist(p.x, p.y, h.x1, h.y1, h.x2, h.y2) <= h.width / 2 + p.r;
    } else if (h.kind === 'ring') {
      return;
    } else {
      hit = dist(p.x, p.y, h.x, h.y) <= h.r + p.r;
    }
    if (hit) {
      this._hurtPlayer(h.dmg, { knockback: 60 });
      if (h.slow) { p.slow = h.slow; p.slowT = Math.max(p.slowT, h.slowT || 1.5); }
      if (h.burn) p.burn = { t: 2.5, dps: h.dmg * 0.8, tick: 0 };
    }
    if (h.kind === 'circle' || h.kind === 'line' || h.kind === 'rain') {
      this.hazards.push({
        kind: 'burst', x: h.x ?? (h.x1 + h.x2) / 2, y: h.y ?? (h.y1 + h.y2) / 2,
        r: h.r || h.width, color: h.color || '#ff9b7e', life: 0.3, maxLife: 0.3, delay: 0, dmg: 0,
      });
    }
    if (h.color) this._burst(h.x ?? (h.x1 + h.x2) / 2, h.y ?? (h.y1 + h.y2) / 2, h.color, 10, 110);
  }

  /* ---------------------------------------------------------- projectiles */
  _updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      pr.life -= dt;
      if (pr.homing) {
        let best = null, bd = 1e9;
        for (const e of this.enemies) {
          if (e.hp <= 0 || e.spawnT > 0) continue;
          const d = dist(pr.x, pr.y, e.x, e.y);
          if (d < bd) { bd = d; best = e; }
        }
        if (best && bd < 380) {
          const a = Math.atan2(best.y - pr.y, best.x - pr.x);
          const spd = Math.hypot(pr.vx, pr.vy);
          const ca = Math.atan2(pr.vy, pr.vx);
          const na = ca + clamp(angleDiff(a, ca), -pr.homing * dt, pr.homing * dt);
          pr.vx = Math.cos(na) * spd; pr.vy = Math.sin(na) * spd;
        }
      }
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (pr.trail) this.particles.push({
        x: pr.x, y: pr.y, vx: 0, vy: 0, life: 0.2, max: 0.2,
        size: pr.r * 0.8, color: pr.color, glow: true,
      });
      if (pr.x < -40 || pr.y < -40 || pr.x > ARENA + 40 || pr.y > ARENA + 40) pr.life = 0;

      if (pr.owner === 'player') {
        for (const e of this.enemies) {
          if (e.hp <= 0 || e.spawnT > 0 || pr.hitSet.has(e.id)) continue;
          if (dist(pr.x, pr.y, e.x, e.y) > e.r + pr.r) continue;
          pr.hitSet.add(e.id);
          this._hitEnemy(e, pr.dmg, { crit: !!pr.crit, knock: pr.knock || 20 });
          if (pr.splash) {
            for (const o of this.enemies) {
              if (o === e || o.hp <= 0 || pr.hitSet.has(o.id)) continue;
              if (dist(pr.x, pr.y, o.x, o.y) <= pr.splash + o.r) {
                pr.hitSet.add(o.id);
                this._hitEnemy(o, pr.dmg * pr.splashMult, { crit: false });
              }
            }
          }
          if (pr.kind === 'bolt') this._burst(pr.x, pr.y, pr.color, 10, 100);
          if (pr.kind === 'lance') this.shake = Math.max(this.shake, 4);
          if (pr.pierce > 0) { pr.pierce--; } else { pr.life = 0; break; }
        }
      } else {
        if (dist(pr.x, pr.y, this.player.x, this.player.y) <= pr.r + this.player.r) {
          if (this.player.invuln <= 0) {
            this._hurtPlayer(pr.dmg, {});
            if (pr.slow) { this.player.slow = Math.max(this.player.slow, pr.slow); this.player.slowT = Math.max(this.player.slowT, pr.slowT || 1.5); }
            this._burst(pr.x, pr.y, pr.color, 8, 90);
          }
          pr.life = 0;
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0);
  }

  /* ---------------------------------------------------------- damage */
  _hitEnemy(e, raw, opts = {}) {
    if (!e || e.hp <= 0) return;
    const crit = !!opts.crit;
    let dmg = raw * (1 - mitigation(e.def));
    if (crit) dmg *= this.stats.cdmg / 100;
    dmg = Math.max(1, dmg);
    e.hp -= dmg;
    this.damageDealt += dmg;
    e.flash = 0.14;
    if (opts.knock) {
      const a = Math.atan2(e.y - this.player.y, e.x - this.player.x);
      const kb = e.boss ? opts.knock * 0.2 : opts.knock;
      e.knockX += Math.cos(a) * kb;
      e.knockY += Math.sin(a) * kb;
    }
    this.floaters.push({
      x: e.x + (this.rng() - 0.5) * 12, y: e.y - e.r - 6,
      text: String(Math.round(dmg)), color: crit ? '#ffe6a0' : (opts.burn ? '#ffb078' : '#f2ede2'),
      life: 0.7, max: 0.7, size: crit ? 20 : 13, crit, vy: -42,
    });
    this._burst(e.x, e.y, crit ? '#ffe6a0' : '#ffd4b0', crit ? 7 : 3, crit ? 150 : 80);
    if (e.hp <= 0) this._killEnemy(e);
  }

  _killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    this.enemies = this.enemies.filter(x => x !== e);
    this.kills++;
    this.xp += e.xp;
    const gold = Math.round(e.goldMin + this.rng() * Math.max(1, e.goldMax - e.goldMin));
    this.gold += gold;
    this.emit({ type: 'gold', amount: gold, total: this.gold });
    this.emit({ type: 'kill', enemy: e });
    this._burst(e.x, e.y, e.color || '#ffd4b0', e.boss ? 60 : 14, e.boss ? 280 : 160);
    this.shake = Math.max(this.shake, e.boss ? 18 : 3);
    if (e.boss) {
      this.bossDefeated = true;
      this.boss = null;
      this.slowmo = 1.2;
      this.emit({ type: 'bossDown', boss: e });
      const count = 6 + Math.min(4, Math.floor((this.stage.depth || 0) / 3));
      for (let i = 0; i < count; i++) this._dropItem({ boost: 2.6 });
      this.emit({ type: 'sfx', name: 'bossdown' });
    } else {
      if (e.elite) this._dropItem({ boost: 1.5 });
      else if (this.rng() < (ENEMIES[e.type]?.drop || 0.4)) this._dropItem({});
      if (this.rng() < 0.11) {
        this.pickups.push({ x: e.x, y: e.y, type: 'heart', life: 18, bob: this.rng() * TAU });
      }
    }
  }

  _dropItem(opts = {}) {
    const item = rollItem(this.stage, this.rng, opts);
    this.loot.push(item);
    this.emit({ type: 'loot', item });
    return item;
  }

  _hurtPlayer(raw, opts = {}) {
    const p = this.player;
    if (p.hp <= 0 || this.state !== 'combat') return 0;
    if (p.invuln > 0 && !opts.burn) return 0;
    let dmg = raw * (1 - mitigation(this.stats.def));
    if (this.classId === 'warrior') dmg *= 0.88;
    if (p.drT > 0) dmg *= 1 - p.drValue;
    for (const b of p.buffs) if (b.dr) dmg *= 1 - b.dr;
    dmg = Math.max(1, dmg);
    p.hp -= dmg;
    this.damageTaken += dmg;
    p.hitFlash = 1;
    this.flash = Math.min(1, this.flash + 0.35);
    this.shake = Math.max(this.shake, 6);
    if (!opts.silent) this.emit({ type: 'sfx', name: 'hurt' });
    this.floaters.push({
      x: p.x, y: p.y - 30, text: '-' + Math.round(dmg), color: opts.burn ? '#ffb078' : '#ff8e86',
      life: 0.65, max: 0.65, size: 14, vy: -50, player: true,
    });
    if (opts.knockback) {
      p.x = clamp(p.x + (Math.random() - 0.5) * opts.knockback * 0.3, 24, ARENA - 24);
      p.y = clamp(p.y + (Math.random() - 0.5) * opts.knockback * 0.3, 24, ARENA - 24);
    }
    if (p.hp <= 0) {
      p.hp = 0;
      this.state = 'defeat';
      this.emit({ type: 'defeat' });
      this.emit({ type: 'sfx', name: 'death' });
      this.shake = 20;
    }
    return dmg;
  }

  _healPlayer(amount) {
    const heal = amount * (this.classId === 'warrior' ? 1.15 : 1);
    const before = this.player.hp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    const gained = this.player.hp - before;
    if (gained > 0) {
      this.floaters.push({ x: this.player.x, y: this.player.y - 34, text: '+' + Math.round(gained), color: '#9df0b4', life: 0.9, max: 0.9, size: 14, vy: -44, player: true });
    }
  }

  /* ---------------------------------------------------------- pickups & fx */
  _updatePickups(dt) {
    for (const pk of this.pickups) {
      pk.life -= dt; pk.bob += dt * 3;
      const d = dist(pk.x, pk.y, this.player.x, this.player.y);
      if (d < 70) {
        const a = Math.atan2(this.player.y - pk.y, this.player.x - pk.x);
        const spd = 180 + (70 - d) * 4;
        pk.x += Math.cos(a) * spd * dt;
        pk.y += Math.sin(a) * spd * dt;
      }
      if (d < 24) {
        pk.life = 0;
        this._healPlayer(this.player.maxHp * 0.12);
        this.emit({ type: 'sfx', name: 'heal' });
      }
    }
    this.pickups = this.pickups.filter(p => p.life > 0);
  }

  _updatePending(dt) {
    if (!this.pending.length) return;
    const keep = [];
    for (const p of this.pending) {
      p.t -= dt;
      if (p.t <= 0) { try { p.fn(); } catch (e) { console.error(e); } }
      else keep.push(p);
    }
    this.pending = keep;
  }

  _updateEffects(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.pow(0.15, dt); p.vy *= Math.pow(0.15, dt);
      if (p.gravity) p.vy += p.gravity * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const f of this.floaters) { f.life -= dt; f.y += (f.vy || -40) * dt; if (f.vy) f.vy *= Math.pow(0.2, dt); }
    this.floaters = this.floaters.filter(f => f.life > 0);
    for (const s of this.slashes) s.life -= dt;
    this.slashes = this.slashes.filter(s => s.life > 0);
    for (const b of this.banners) b.t -= dt;
    this.banners = this.banners.filter(b => b.t > 0);
    if (this.particles.length > 500) this.particles.splice(0, this.particles.length - 500);
    if (this.floaters.length > 80) this.floaters.splice(0, this.floaters.length - 80);
  }

  _dashTrail(x, y, color = '#ffd28a', boss = false) {
    if (this.rng() < (boss ? 0.8 : 0.6)) this.particles.push({
      x, y, vx: (this.rng() - .5) * 30, vy: (this.rng() - .5) * 30,
      life: 0.35, max: 0.35, size: boss ? 16 : 10, color, glow: true,
    });
  }

  _burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * TAU, s = speed * (0.3 + this.rng() * 0.7);
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.3 + this.rng() * 0.4, max: 0.7, size: 2 + this.rng() * 4,
        color, glow: true,
      });
    }
  }

  _separate() {
    const arr = this.enemies;
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      for (let j = i + 1; j < arr.length; j++) {
        const b = arr[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = a.r + b.r;
        if (d > 0 && d < min) {
          const push = (min - d) * 0.5;
          const nx = dx / d, ny = dy / d;
          const aw = a.boss ? 0.2 : 1, bw = b.boss ? 0.2 : 1;
          a.x -= nx * push * aw; a.y -= ny * push * aw;
          b.x += nx * push * bw; b.y += ny * push * bw;
        }
      }
    }
  }

  _nearestEnemy(x, y, maxRange = Infinity) {
    let best = null, bd = maxRange * maxRange;
    for (const e of this.enemies) {
      if (e.hp <= 0 || e.spawnT > 0) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  revive() {
    if (this.state !== 'defeat') return false;
    this.revives++;
    this.state = 'combat';
    this.player.hp = this.player.maxHp;
    this.player.invuln = 3;
    this.player.burn = null;
    this.player.slow = 0; this.player.slowT = 0;
    for (const e of this.enemies) {
      const a = Math.atan2(e.y - this.player.y, e.x - this.player.x);
      e.knockX += Math.cos(a) * 280;
      e.knockY += Math.sin(a) * 280;
      e.stun = Math.max(e.stun, 0.8);
    }
    this.pending = [];
    this.hazards = this.hazards.filter(h => h.delay <= 0 && h.life !== undefined);
    this._burst(this.player.x, this.player.y, '#ffe6a0', 40, 260);
    this.emit({ type: 'revive' });
    this.emit({ type: 'sfx', name: 'revive' });
    return true;
  }

  _finish(win) {
    if (this.state === 'victory' || this.state === 'defeat') return;
    this.state = win ? 'victory' : 'defeat';
    this.result = {
      win, stage: this.stage, time: this.time, loot: this.loot,
      gold: this.gold, xp: this.xp, kills: this.kills, revives: this.revives,
      damageDealt: this.damageDealt, damageTaken: this.damageTaken,
    };
    this.boss = null;
    this.emit({ type: win ? 'victory' : 'defeat', result: this.result });
    this.emit({ type: 'sfx', name: win ? 'victory' : 'death' });
  }

  getResult() {
    return this.result || {
      win: this.state === 'victory', stage: this.stage, time: this.time, loot: this.loot,
      gold: this.gold, xp: this.xp, kills: this.kills, revives: this.revives,
    };
  }
}
Battle._id = 0;
