import { CLASS, CHAPTERS, BOSSES, ENEMIES, RARITY } from './data.js';
import {
  addItem, addXp, deriveStats, getTemplate, grantStageRewards, rollEnemyDrop
} from './state.js';
import { skillIcon, uiIcon, miniPortrait } from './icons.js';
import { audio, haptic } from './audio.js';
import { tilt } from './motion.js';
import { renderMethods } from './battle-render.js';
import { hudMethods } from './battle-hud.js';
import { combatMethods } from './battle-combat.js';

const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
const length = (x, y) => Math.hypot(x, y);

export class Battle {
  constructor(opts) {
    this.canvas = opts.canvas;
    this.hud = opts.hud;
    this.state = opts.state;
    this.stage = opts.stage;
    this.onVictory = opts.onVictory || (() => {});
    this.onDefeat = opts.onDefeat || (() => {});
    this.onExit = opts.onExit || (() => {});
    this.onRetry = opts.onRetry || (() => {});
    this.ctx = this.canvas.getContext('2d');
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = 0;
    this.H = 0;
    this.running = false;
    this.paused = false;
    this.finished = false;
    this.auto = false;
    this.time = 0;
    this.last = 0;
    this.raf = null;
    this.enemies = [];
    this.projectiles = [];
    this.telegraphs = [];
    this.effects = [];
    this.particles = [];
    this.numbers = [];
    this.vortexes = [];
    this.zones = [];
    this.waveIndex = -1;
    this.waveTotal = this.stage.waves.length + (this.stage.type === 'boss' ? 1 : 0);
    this.waveDelay = 0;
    this.waveIntro = 0;
    this.pendingWave = true;
    this.boss = null;
    this.rewarded = false;
    this.rewards = null;
    this.keys = new Set();
    this.input = { x: 0, y: 0, joystick: false };
    this.joystickPointer = null;
    this.shake = 0;
    this.damageFlash = 0;
    this.hudTimer = 0;
    this.toastQueue = [];
    this.toastActive = false;
    this.chapter = CHAPTERS[this.stage.chapter];
    this.cls = CLASS[this.state.classId];
    this.stats = deriveStats(this.state);
    this.bindings = [];
    this.defeatTimer = 0;
    this.victoryTimer = 0;
    this.enemySeq = 0;
    this.waveSpawned = false;
    this.autoSkillTimer = 0;
    this.lootForge = 0;
    this.bossIntroShown = false;
    this.player = this.makePlayer();
    Object.assign(this, hudMethods, renderMethods, combatMethods);
  }

  makePlayer() {
    const s = this.stats;
    return {
      x: 0, y: 0, r: 17, facing: 1, facingAngle: 0,
      hp: s.hp, maxHp: s.hp, atk: s.atk, def: s.def, crit: s.crit,
      rate: s.rate, speed: s.speed, range: s.range, skillPower: s.skillPower,
      lifesteal: s.lifesteal,
      attackTimer: 0, cooldowns: [0, 0, 0], dashCd: 0,
      shield: 0, shieldTime: 0, defBuff: 0, haste: 0, invuln: 0,
      guaranteedCrit: 0, hitFlash: 0, attackAnim: 0, attackKind: 'basic',
      dashAnim: 0, dead: false, burn: 0, slow: 0
    };
  }

  start() {
    this.resize();
    this.buildHud();
    this.buildBackground();
    this.bindInput();
    this.placePlayer();
    this.nextWave();
    this.running = true;
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  placePlayer() {
    const p = this.player;
    p.x = this.W > this.H ? this.W * .32 : this.W * .5;
    p.y = this.W > this.H ? this.H * .56 : this.H * .53;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.W = Math.max(320, rect.width);
    this.H = Math.max(480, rect.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.player) {
      this.player.x = clamp(this.player.x, 30, this.W - 30);
      this.player.y = clamp(this.player.y, 100, this.H - 90);
      for (const e of this.enemies) {
        e.x = clamp(e.x, 24, this.W - 24);
        e.y = clamp(e.y, 90, this.H - 70);
      }
      this.buildBackground();
    }
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(.033, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (!this.paused) this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 28);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 2.6);
    if (this.player.dead) {
      this.defeatTimer -= dt;
      this.updateEffects(dt);
      if (this.defeatTimer <= 0 && !this.finished) this.finishDefeat();
      return;
    }
    if (this.victoryTimer > 0) {
      this.victoryTimer -= dt;
      this.updateEffects(dt);
      this.updateParticles(dt);
      if (this.victoryTimer <= 0 && !this.finished) this.finishVictory();
      return;
    }

    this.updateWave(dt);
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateTelegraphs(dt);
    this.updateZones(dt);
    this.updateVortexes(dt);
    this.updateEffects(dt);
    this.updateParticles(dt);
    this.updateNumbers(dt);
    this.checkWaveClear();

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = .08;
      this.syncHud();
    }
  }

  /* ---------- waves ---------- */

  queueNextWave(delay = 0) {
    this.waveDelay = delay;
    this.pendingWave = true;
  }

  nextWave() {
    this.waveIndex++;
    this.waveSpawned = false;
    this.waveDelay = 0;
    this.waveIntro = 1.15;
    this.pendingWave = true;
    this.updateWavePips();
    if (this.waveIndex < this.stage.waves.length) {
      const label = `WAVE ${['I', 'II', 'III', 'IV', 'V'][this.waveIndex] || this.waveIndex + 1}`;
      this.showAnnouncement(label, this.stage.name, `${this.stage.waves[this.waveIndex].length} hostiles approaching`);
    } else {
      const boss = BOSSES[this.stage.boss];
      if (boss) {
        this.showAnnouncement('BOSS ENCOUNTER', boss.name, boss.title, true);
        audio.play('boss');
        haptic([30, 40, 60]);
      }
    }
  }

  updateWave(dt) {
    if (this.pendingWave) {
      if (this.waveIntro > 0) {
        this.waveIntro -= dt;
        return;
      }
      this.pendingWave = false;
      this.spawnWave();
    }
    if (this.waveDelay > 0) {
      this.waveDelay -= dt;
      if (this.waveDelay <= 0 && !this.finished) this.nextWave();
    }
  }

  spawnWave() {
    this.waveSpawned = true;
    this.updateWavePips();
    if (this.waveIndex < this.stage.waves.length) {
      const types = this.stage.waves[this.waveIndex];
      types.forEach((type, i) => {
        const angle = (i / types.length) * TAU + rand(-.3, .3);
        const radius = Math.min(this.W, this.H) * rand(.28, .4);
        let x = this.player.x + Math.cos(angle) * radius;
        let y = this.player.y + Math.sin(angle) * radius;
        if (this.W > this.H) x = Math.max(x, this.W * .52);
        x = clamp(x, 30, this.W - 30);
        y = clamp(y, 100, this.H - 90);
        this.spawnEnemy(type, x, y, .22 * i);
      });
    } else if (this.stage.type === 'boss' && this.stage.boss) {
      this.spawnBoss();
    }
  }

  checkWaveClear() {
    if (!this.waveSpawned || this.pendingWave || this.finished || this.waveDelay > 0) return;
    if (this.enemies.some(e => !e.dead)) return;
    if (this.victoryTimer > 0) return;
    if (this.waveIndex + 1 >= this.waveTotal) {
      if (this.stage.type === 'boss') {
        this.victoryTimer = 1.5;
        this.shake = 12;
        this.burst(this.player.x, this.player.y, this.chapter.colors[0], 40, 260);
        audio.play('victory');
      } else {
        this.victoryTimer = .9;
      }
      this.enemies = [];
      return;
    }
    this.waveDelay = 1.5;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * .1);
    this.showAnnouncement('WAVE CLEARED', 'Breathe. The next wave is coming.', '');
    audio.play('level');
  }

  spawnEnemy(type, x, y, delay = 0) {
    const cfg = ENEMIES[type];
    if (!cfg) return;
    const stageNum = this.stage.num;
    const hpScale = (42 * Math.pow(1.265, stageNum - 1) + 12 * stageNum) * cfg.hp;
    const atkScale = (4 * Math.pow(1.225, stageNum - 1) + stageNum * 1.1) * cfg.atk;
    const e = {
      id: ++this.enemySeq, type, cfg, x, y,
      spawnX: x, spawnY: y, r: cfg.radius,
      hp: hpScale, maxHp: hpScale, atk: atkScale, def: 2 + stageNum * 1.7,
      speed: cfg.speed, facing: 1,
      state: 'spawn', spawnTimer: .55 + delay, timer: 0,
      attackCd: rand(.3, 1), hitFlash: 0, slow: 0, stun: 0, burn: 0, burnDps: 0,
      dead: false, isBoss: false, phase: 1, abilityCd: 2.2, casting: false,
      lastAbility: '', angle: 0, dashV: { x: 0, y: 0 }
    };
    this.enemies.push(e);
    this.vfx('spawn', x, y, { color: cfg.glow, radius: cfg.radius * 2.6 });
  }

  spawnBoss() {
    const cfg = BOSSES[this.stage.boss];
    if (!cfg) return;
    const stageNum = this.stage.num;
    const hpScale = (42 * Math.pow(1.265, stageNum - 1) + 12 * stageNum) * cfg.hp;
    const atkScale = (4 * Math.pow(1.225, stageNum - 1) + stageNum * 1.1) * cfg.atk;
    const x = this.W > this.H ? this.W * .7 : this.W * .5;
    const y = this.W > this.H ? this.H * .46 : this.H * .29;
    const e = {
      id: ++this.enemySeq, type: this.stage.boss, cfg, x, y,
      spawnX: x, spawnY: y, r: cfg.radius,
      hp: hpScale, maxHp: hpScale, atk: atkScale, def: 6 + stageNum * 2.2,
      speed: cfg.speed, facing: -1,
      state: 'spawn', spawnTimer: 1.4, timer: 0,
      attackCd: 1.2, hitFlash: 0, slow: 0, stun: 0, burn: 0, burnDps: 0,
      dead: false, isBoss: true, phase: 1, abilityCd: 2.4, casting: false,
      lastAbility: '', angle: Math.PI
    };
    this.boss = e;
    this.enemies.push(e);
    this.vfx('bossSpawn', x, y, { color: cfg.glow, radius: 140 });
    this.setBossBar(e);
    this.shake = 14;
    this.burst(x, y, cfg.glow, 44, 300);
  }

  /* ---------- player ---------- */

  updatePlayer(dt) {
    const p = this.player;
    p.attackTimer -= dt;
    p.dashCd -= dt;
    p.invuln = Math.max(0, p.invuln - dt);
    p.haste = Math.max(0, p.haste - dt);
    p.defBuff = Math.max(0, p.defBuff - dt);
    p.shieldTime = Math.max(0, p.shieldTime - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    p.attackAnim = Math.max(0, p.attackAnim - dt);
    p.dashAnim = Math.max(0, p.dashAnim - dt);
    if (p.shieldTime <= 0) p.shield = 0;
    for (let i = 0; i < p.cooldowns.length; i++) p.cooldowns[i] = Math.max(0, p.cooldowns[i] - dt);

    let vx = 0, vy = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) vx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) vx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) vy -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) vy += 1;
    if (this.input.joystick) {
      vx = this.input.x;
      vy = this.input.y;
    } else if (tilt.enabled) {
      vx += tilt.vector.x;
      vy += tilt.vector.y;
    }
    if (this.auto) {
      const auto = this.autoMove(dt);
      if (auto) { vx = auto.x; vy = auto.y; }
    }
    const mag = length(vx, vy);
    if (mag > 1) { vx /= mag; vy /= mag; }
    if (mag > .05) {
      const buff = p.defBuff > 0 ? 1.18 : 1;
      p.x += vx * p.speed * buff * dt;
      p.y += vy * p.speed * buff * dt;
      p.facingAngle = Math.atan2(vy, vx);
      if (Math.abs(vx) > .12) p.facing = vx > 0 ? 1 : -1;
    }
    p.x = clamp(p.x, 28, this.W - 28);
    p.y = clamp(p.y, 104, this.H - 82);

    this.separatePlayer();

    const target = this.findNearest(p.x, p.y, p.range * 1.1);
    if (target) {
      p.facingAngle = Math.atan2(target.y - p.y, target.x - p.x);
      if (Math.abs(target.x - p.x) > 4) p.facing = target.x > p.x ? 1 : -1;
    }
    if (p.attackTimer <= 0 && target) this.basicAttack(target);
    if (this.auto) {
      this.autoSkillTimer -= dt;
      if (this.autoSkillTimer <= 0) {
        this.autoSkillTimer = .18;
        this.autoCast(target);
      }
    }
  }

  autoMove() {
    const p = this.player;
    const target = this.findNearest(p.x, p.y, 900);
    if (!target) return null;
    const d = Math.sqrt(dist2(p, target));
    const desired = this.cls.attack === 'melee' ? 65 : p.range * .7;
    let dx = target.x - p.x, dy = target.y - p.y;
    const l = length(dx, dy) || 1;
    dx /= l; dy /= l;
    if (this.cls.attack === 'melee') {
      if (d < 48) return { x: -dy * .9, y: dx * .9 };
      return { x: dx, y: dy };
    }
    if (d > desired + 35) return { x: dx, y: dy };
    if (d < desired - 55) return { x: -dx, y: -dy };
    return { x: -dy * .6, y: dx * .6 };
  }

  autoCast(target) {
    if (!target) return;
    const p = this.player;
    const d = Math.sqrt(dist2(p, target));
    for (let i = 2; i >= 0; i--) {
      if (p.cooldowns[i] > 0) continue;
      const id = this.cls.skills[i].id;
      if ((id === 'bulwark') && p.hp > p.maxHp * .55) continue;
      if ((id === 'earthshatter' || id === 'nova' || id === 'rain') && d > 220) continue;
      if ((id === 'meteor' || id === 'lance' || id === 'pierce') && d > 360) continue;
      this.castSkill(i);
      break;
    }
    if (p.hp < p.maxHp * .28 && p.dashCd <= 0) this.dash();
  }

  separatePlayer() {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead || e.state === 'spawn') continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy);
      const min = p.r + e.r * .62;
      if (d > 0 && d < min) {
        const push = (min - d) * .35;
        p.x += dx / d * push;
        p.y += dy / d * push;
      }
    }
  }

  findNearest(x, y, maxDist = Infinity) {
    let best = null, bestD = maxDist * maxDist;
    for (const e of this.enemies) {
      if (e.dead || e.state === 'spawn') continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  basicAttack(target) {
    const p = this.player;
    const haste = p.haste > 0 ? 1.5 : 1;
    p.attackTimer = 1 / (p.rate * haste);
    p.attackAnim = .24;
    p.attackKind = this.cls.id;
    p.facingAngle = Math.atan2(target.y - p.y, target.x - p.x);
    if (this.cls.attack === 'melee') {
      this.vfx('slash', p.x, p.y, { angle: p.facingAngle, color: this.cls.color, radius: 82 });
      for (const e of this.enemies) {
        if (e.dead || e.state === 'spawn') continue;
        const d = Math.sqrt(dist2(p, e));
        if (d > 100 + e.r) continue;
        const a = Math.atan2(e.y - p.y, e.x - p.x);
        let da = Math.abs(((a - p.facingAngle + Math.PI * 3) % TAU) - Math.PI);
        if (da < 1.45) this.dealDamageToEnemy(e, p.atk, { source: 'basic' });
      }
      audio.play('hit');
      this.shake = Math.max(this.shake, 1.2);
    } else {
      const isMage = this.cls.id === 'mage';
      this.spawnProjectile({
        team: 'player',
        x: p.x + Math.cos(p.facingAngle) * 18,
        y: p.y + Math.sin(p.facingAngle) * 18 - 14,
        angle: p.facingAngle,
        speed: isMage ? 520 : 720,
        damage: p.atk * (isMage ? 1.02 : 1),
        radius: isMage ? 8 : 4,
        color: isMage ? '#8ff6f1' : '#f0d88b',
        type: isMage ? 'orb' : 'arrow',
        crit: this.consumeCrit(),
        source: 'basic'
      });
    }
  }

  castSkill(index) {
    if (this.finished || this.player.dead) return;
    const p = this.player;
    if (p.cooldowns[index] > 0) return;
    const skill = this.cls.skills[index];
    if (!skill) return;
    p.cooldowns[index] = skill.cd;
    p.attackAnim = .38;
    p.attackKind = skill.id;
    const target = this.findNearest(p.x, p.y, 700);
    if (target) {
      p.facingAngle = Math.atan2(target.y - p.y, target.x - p.x);
      p.facing = target.x > p.x ? 1 : -1;
    }
    audio.play('skill');
    haptic(12);
    const sp = p.skillPower;
    switch (skill.id) {
      case 'cleave': {
        const angle = p.facingAngle;
        this.vfx('cleave', p.x, p.y, { angle, color: '#ffc06e', radius: 150 });
        let hits = 0;
        for (const e of this.enemies) {
          if (e.dead || e.state === 'spawn') continue;
          const d = Math.sqrt(dist2(p, e));
          if (d > 150 + e.r) continue;
          const a = Math.atan2(e.y - p.y, e.x - p.x);
          const da = Math.abs(((a - angle + Math.PI * 3) % TAU) - Math.PI);
          if (da < 1.95) {
            this.dealDamageToEnemy(e, p.atk * 1.9 * sp, { source: 'cleave' });
            hits++;
          }
        }
        if (hits) {
          p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .04 * hits);
          this.addNumber(p.x, p.y - 42, `+${Math.round(p.maxHp * .04 * hits)}`, '#78e7a1', false, 'heal');
        }
        this.shake = 7;
        haptic(22);
        break;
      }
      case 'bulwark': {
        p.shield = Math.max(p.shield, p.maxHp * .34);
        p.shieldTime = 4;
        p.defBuff = 4;
        this.vfx('shield', p.x, p.y, { color: '#ffd083', radius: 58 });
        this.addNumber(p.x, p.y - 48, 'BULWARK', '#ffd083', false, 'buff');
        audio.play('heavy');
        break;
      }
      case 'earthshatter': {
        this.vfx('quake', p.x, p.y, { color: '#ff9e5a', radius: 225 });
        this.shake = 15;
        for (const e of this.enemies) {
          if (e.dead || e.state === 'spawn') continue;
          const d = Math.sqrt(dist2(p, e));
          if (d < 210 + e.r) {
            this.dealDamageToEnemy(e, p.atk * 3.1 * sp, { source: 'earthshatter', heavy: true });
            e.stun = Math.max(e.stun, 1.6);
          }
        }
        haptic([20, 30, 35]);
        audio.play('heavy');
        break;
      }
      case 'lance': {
        const angle = p.facingAngle;
        this.spawnProjectile({
          team: 'player', x: p.x, y: p.y - 15, angle, speed: 580,
          damage: p.atk * 2.1 * sp, radius: 10, color: '#a99cff', type: 'lance',
          pierce: 3, crit: this.consumeCrit(), source: 'lance'
        });
        this.vfx('cast', p.x, p.y, { angle, color: '#9be9ff', radius: 55 });
        break;
      }
      case 'nova': {
        this.vfx('nova', p.x, p.y, { color: '#8fe8ff', radius: 205 });
        for (const e of this.enemies) {
          if (e.dead || e.state === 'spawn') continue;
          const d = Math.sqrt(dist2(p, e));
          if (d < 195 + e.r) {
            this.dealDamageToEnemy(e, p.atk * 1.65 * sp, { source: 'nova' });
            e.slow = Math.max(e.slow, 3);
          }
        }
        this.shake = 6;
        break;
      }
      case 'meteor': {
        const pos = this.bestCluster(target);
        this.telegraph({
          type: 'circle', x: pos.x, y: pos.y, r: 185, duration: .8,
          color: '#c7a0ff', label: 'STARFALL',
          onDone: () => {
            this.vfx('meteor', pos.x, pos.y, { color: '#c7a0ff', radius: 210 });
            this.shake = 12;
            audio.play('heavy');
            for (const e of this.enemies) {
              if (e.dead) continue;
              if (Math.sqrt(dist2(pos, e)) < 195 + e.r) {
                this.dealDamageToEnemy(e, p.atk * 3.4 * sp, { source: 'meteor', heavy: true });
                e.burn = 4; e.burnDps = p.atk * .22;
              }
            }
          }
        });
        break;
      }
      case 'pierce': {
        const angle = p.facingAngle;
        const ex = p.x + Math.cos(angle) * 720;
        const ey = p.y + Math.sin(angle) * 720;
        this.vfx('beam', p.x, p.y, { x2: ex, y2: ey, color: '#e8df9b', width: 4 });
        let pierced = 0;
        for (const e of this.enemies) {
          if (e.dead || e.state === 'spawn') continue;
          const d = this.distanceToSegment(e.x, e.y, p.x, p.y, ex, ey);
          if (d < 28 + e.r) {
            this.dealDamageToEnemy(e, p.atk * 2.2 * sp, { source: 'pierce', forceCrit: true });
            pierced++;
            if (pierced >= 3) break;
          }
        }
        this.shake = 5;
        break;
      }
      case 'rain': {
        const pos = target || { x: p.x + Math.cos(p.facingAngle) * 200, y: p.y + Math.sin(p.facingAngle) * 200 };
        this.zones.push({ type: 'rain', x: pos.x, y: pos.y, r: 160, time: 1.6, tick: 0, damage: p.atk * .72 * sp });
        this.telegraph({ type: 'circle', x: pos.x, y: pos.y, r: 160, duration: .35, color: '#b9e7a0', label: 'RAIN' });
        break;
      }
      case 'shadowstep': {
        let dx = this.input.x, dy = this.input.y;
        if (!this.input.joystick && length(dx, dy) < .1) { dx = Math.cos(p.facingAngle); dy = Math.sin(p.facingAngle); }
        const l = length(dx, dy) || 1;
        this.vfx('dash', p.x, p.y, { angle: Math.atan2(dy, dx), color: '#b7e59c' });
        p.x = clamp(p.x + dx / l * 175, 28, this.W - 28);
        p.y = clamp(p.y + dy / l * 175, 104, this.H - 82);
        p.invuln = Math.max(p.invuln, .4);
        p.haste = 2.2;
        p.guaranteedCrit = 3;
        this.vfx('shadow', p.x, p.y, { color: '#b7e59c', radius: 42 });
        break;
      }
      default: break;
    }
    haptic(10);
    this.syncHud();
  }

  bestCluster(fallback) {
    if (!fallback) return { x: this.player.x, y: this.player.y };
    let best = fallback, bestCount = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      let count = 0;
      for (const o of this.enemies) {
        if (!o.dead && dist2(e, o) < 170 * 170) count++;
      }
      if (count > bestCount) { bestCount = count; best = e; }
    }
    return { x: best.x, y: best.y };
  }

  dash() {
    const p = this.player;
    if (p.dashCd > 0 || p.dead) return;
    let dx = this.input.x, dy = this.input.y;
    if (!this.input.joystick && length(dx, dy) < .1) { dx = Math.cos(p.facingAngle); dy = Math.sin(p.facingAngle); }
    const l = length(dx, dy) || 1;
    dx /= l; dy /= l;
    this.vfx('dash', p.x, p.y, { angle: Math.atan2(dy, dx), color: this.cls.color });
    p.x = clamp(p.x + dx * 105, 28, this.W - 28);
    p.y = clamp(p.y + dy * 105, 104, this.H - 82);
    p.dashCd = 2.4;
    p.invuln = Math.max(p.invuln, .3);
    p.dashAnim = .28;
    audio.play('click');
    haptic(8);
  }

  consumeCrit() {
    const p = this.player;
    if (p.guaranteedCrit > 0) { p.guaranteedCrit--; return true; }
    return Math.random() * 100 < p.crit;
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (!l2) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
}

Object.assign(Battle.prototype, hudMethods, renderMethods);
