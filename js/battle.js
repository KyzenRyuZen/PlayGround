import {
  CLASSES, CHAPTERS, enemyStats, bossStats, makeWaves, rollDrop, heroStats, xpForNext,
} from './data.js';
import { clamp, rand, randInt, choice, dist, angleTo, normalize, round } from './util.js';
import { audio } from './audio.js';
import { icon } from './ui.js';

const TAU = Math.PI * 2;
const pointSegmentDist = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

const BOSS_COOLDOWNS = {
  slam: 7.5, charge: 9, volley: 8, rain: 9, summon: 15, beam: 10.5, blink: 11,
};

export class Battle {
  constructor({ save, chapter, stage, hooks = {} }) {
    this.save = save;
    this.chapter = chapter;
    this.stage = stage;
    this.isBossStage = stage === 5;
    this.hooks = hooks;
    this.cls = CLASSES[save.hero.classId];
    this.stats = heroStats(save.hero);
    this.waveDefs = makeWaves(chapter, stage);
    this.chapterData = CHAPTERS[chapter - 1];

    this.canvas = document.getElementById('battle-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.bounds = { left: 20, right: 370, top: 100, bottom: 600 };

    this.player = {
      x: 0, y: 0, r: 17,
      hp: this.stats.maxHp, maxHp: this.stats.maxHp,
      shield: 0, facing: -Math.PI / 2,
      attackCd: 0.2, attackKick: 0, hurtFlash: 0,
      moving: false, dead: false,
    };
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.slashes = [];
    this.telegraphs = [];
    this.zones = [];
    this.timers = [];
    this.buffs = [];
    this.cooldowns = [0, 0, 0];
    this.skillTotals = this.cls.skills.map(s => s.cd * this.stats.cdMult);
    this.potions = this.isBossStage ? 3 : 2;
    this.potionCd = 0;

    this.waveIndex = 0;
    this.waveActive = false;
    this.waveCleared = false;
    this.nextWaveTimer = 0;
    this.winTimer = 0;
    this.endTimer = 0;
    this.boss = null;
    this.bossDefeated = false;

    this.kills = 0;
    this.xpGained = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.elapsed = 0;
    this.lootMap = new Map();
    this.ended = false;
    this.paused = false;
    this.running = false;
    this.lastTs = 0;
    this.time = 0;
    this.shake = 0;
    this.hurtVignette = 0;
    this.raf = 0;
    this.lastHitSound = 0;
    this.tutorialTime = 0;
    this.killIds = 0;

    this.joy = { active: false, pointerId: null, x: 0, y: 0, mag: 0 };
    this.keys = new Set();
    this.tilt = { x: 0, y: 0, base: null, enabled: !!save.settings.tilt };
    this.moveVec = { x: 0, y: 0, mag: 0 };
    this.inputHandler = null;
    this.setupDom();
  }

  setupDom() {
    const $ = id => document.getElementById(id);
    this.el = {
      chapter: $('battle-chapter'), name: $('battle-name'), wave: $('battle-wave'),
      level: $('battle-level'), hpLabel: $('battle-hp-label'), hpFill: $('battle-hp-fill'),
      shieldFill: $('battle-shield-fill'), xpFill: $('battle-xp-fill'),
      buffs: $('battle-buffs'), bossHud: $('boss-hud'), bossName: $('boss-name'),
      bossPhase: $('boss-phase'), bossFill: $('boss-hp-fill'),
      banner: $('wave-banner'), bannerKicker: $('wave-kicker'), bannerTitle: $('wave-title'),
      feed: $('loot-feed'), joystick: $('joystick'), knob: $('joystick-knob'),
      potionBtn: $('potion-btn'), potionCount: $('potion-count'),
      overlay: $('battle-overlay'), tutorial: $('tutorial-tip'),
      xpBar: document.querySelector('.battle-hud .xp-bar'),
    };
    this.el.chapter.textContent = `RIFT ${this.chapterData.numeral}`;
    this.el.name.textContent = `${this.stage}. ${this.chapterData.names[this.stage - 1]}`;
    this.el.level.textContent = this.save.hero.level;
    this.el.bossHud.hidden = true;
    this.el.banner.hidden = true;
    this.el.overlay.hidden = true;
    this.el.overlay.innerHTML = '';
    this.el.feed.innerHTML = '';
    this.el.hpFill.style.width = '100%';

    const buttons = [...document.querySelectorAll('.skill-btn[data-skill]')];
    for (const btn of buttons) {
      const index = Number(btn.dataset.skill);
      const skill = this.cls.skills[index];
      btn.querySelector('svg use')?.setAttribute('href', `#i-${skill.icon}`);
      btn.style.setProperty('--skill', skill.color);
      btn.querySelector('.skill-key').textContent = String(index + 1);
      btn.setAttribute('aria-label', `${skill.name}, skill ${index + 1}`);
      btn.classList.remove('cooling', 'ready-pulse');
      btn.querySelector('.skill-cd').style.setProperty('--cd', 0);
    }
    this.el.potionCount.textContent = this.potions;

    if (!this.save.settings.tutorialSeen) {
      this.tutorialTime = 7;
      this.el.tutorial.hidden = false;
      this.el.tutorial.innerHTML = `<span>${icon('spark')} Drag the left pad to move. Skills lock on automatically.</span>${this.save.settings.tilt ? `<span>${icon('tilt')} Tilt also steers your hero.</span>` : ''}`;
      this.el.tutorial.classList.remove('out');
    } else {
      this.el.tutorial.hidden = true;
    }
  }

  start() {
    this.resize();
    this.attachInputs();
    this.player.x = this.w / 2;
    this.player.y = this.bounds.bottom - 90;
    this.player.hp = this.stats.maxHp;
    this.running = true;
    this.lastTs = performance.now();
    this.showBanner(`RIFT ${this.chapterData.numeral}`, this.chapterData.names[this.stage - 1], 1600);
    this.spawnWave(0, 0.55);
    this.raf = requestAnimationFrame(ts => this.loop(ts));
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(280, Math.round(rect.width));
    this.h = Math.max(420, Math.round(rect.height));
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.bounds = {
      left: 22, right: this.w - 22,
      top: Math.min(150, this.h * 0.18),
      bottom: this.h - Math.max(136, Math.min(190, this.h * 0.22)),
    };
    if (this.player) {
      this.player.x = clamp(this.player.x || this.w / 2, this.bounds.left + 20, this.bounds.right - 20);
      this.player.y = clamp(this.player.y || this.bounds.bottom - 90, this.bounds.top + 26, this.bounds.bottom - 20);
    }
    this.buildBackground();
  }

  attachInputs() {
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    this.onKeyDown = e => {
      if (this.ended) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', '1', '2', '3'].includes(e.key)) e.preventDefault();
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { this.togglePause(); return; }
      if (this.paused) return;
      this.keys.add(e.key.toLowerCase());
      if (e.key === '1') this.useSkill(0);
      if (e.key === '2') this.useSkill(1);
      if (e.key === '3') this.useSkill(2);
      if (e.key === ' ' || e.key === 'q' || e.key === 'Q') this.usePotion();
    };
    this.onKeyUp = e => this.keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.setupJoystick();
    this.setupSkillButtons();
    this.el.potionBtn.addEventListener('pointerdown', e => { e.preventDefault(); this.usePotion(); });
    document.getElementById('battle-pause')?.addEventListener('click', () => this.togglePause());

    this.onVisibility = () => { if (document.hidden && !this.ended && !this.paused) this.pause(); };
    document.addEventListener('visibilitychange', this.onVisibility);

    this.onOrientation = e => {
      if (!this.tilt.enabled || e.gamma == null || e.beta == null) return;
      if (this.tilt.base == null) this.tilt.base = { gamma: e.gamma, beta: e.beta };
      const dead = 3.5;
      let gx = e.gamma - this.tilt.base.gamma;
      let gy = e.beta - this.tilt.base.beta;
      if (Math.abs(gx) < dead) gx = 0;
      if (Math.abs(gy) < dead) gy = 0;
      this.tilt.x = clamp(gx / 24, -1, 1);
      this.tilt.y = clamp(gy / 20, -1, 1);
    };
    if (this.tilt.enabled) window.addEventListener('deviceorientation', this.onOrientation);
  }

  setupJoystick() {
    const base = this.el.joystick;
    if (!base) return;
    const maxR = Math.max(34, base.clientWidth * 0.32);
    const set = e => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > maxR) { dx = dx / len * maxR; dy = dy / len * maxR; }
      this.el.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joy.x = dx / maxR;
      this.joy.y = dy / maxR;
      this.joy.mag = Math.min(1, len / maxR);
      this.joy.active = true;
      if (this.tutorialTime > 0) this.hideTutorial();
    };
    const end = () => {
      this.joy.active = false;
      this.joy.pointerId = null;
      this.joy.x = 0;
      this.joy.y = 0;
      this.joy.mag = 0;
      this.el.knob.style.transform = 'translate(0px, 0px)';
    };
    base.addEventListener('pointerdown', e => {
      if (this.paused || this.ended) return;
      e.preventDefault();
      this.joy.pointerId = e.pointerId;
      base.setPointerCapture?.(e.pointerId);
      set(e);
    });
    base.addEventListener('pointermove', e => {
      if (!this.joy.active || e.pointerId !== this.joy.pointerId) return;
      e.preventDefault();
      set(e);
    });
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);

  }

  setupSkillButtons() {
    for (const btn of document.querySelectorAll('.skill-btn[data-skill]')) {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (this.paused || this.ended) return;
        this.useSkill(Number(btn.dataset.skill));
      });
    }
  }

  loop(ts) {
    if (!this.running) return;
    const raw = (ts - this.lastTs) / 1000;
    const dt = clamp(raw || 0, 0, 0.04);
    this.lastTs = ts;
    if (!this.paused && !this.ended) this.update(dt);
    else this.time += dt * 0.25;
    this.render(this.time);
    this.raf = requestAnimationFrame(next => this.loop(next));
  }

  update(dt) {
    this.time += dt;
    this.elapsed += dt;
    this.shake = Math.max(0, this.shake - dt * 26);
    this.hurtVignette = Math.max(0, this.hurtVignette - dt * 2.2);

    if (this.tutorialTime > 0) {
      this.tutorialTime -= dt;
      if (this.tutorialTime <= 0) this.hideTutorial();
    }

    this.updateTimers(dt);
    this.updatePlayer(dt);
    if (this.player.dead) {
      this.updateEffects(dt);
      return;
    }
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateEffects(dt);
    this.updateWaveState(dt);
    this.updateHud();
  }

  updateTimers(dt) {
    for (const timer of this.timers) timer.t -= dt;
    const due = this.timers.filter(t => t.t <= 0);
    this.timers = this.timers.filter(t => t.t > 0);
    for (const timer of due) {
      try { timer.fn(); } catch (err) { console.warn(err); }
    }
    for (const t of this.telegraphs) t.t -= dt;
    this.telegraphs = this.telegraphs.filter(t => t.t > 0);
    for (const b of this.buffs) b.time -= dt;
    this.buffs = this.buffs.filter(b => b.time > 0);
    if (!this.buffs.some(b => b.id === 'shield')) this.player.shield = 0;
    for (let i = 0; i < this.cooldowns.length; i++) {
      if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
    }
    this.potionCd = Math.max(0, this.potionCd - dt);
  }

  getInputVec() {
    let x = 0, y = 0;
    if (this.joy.active) { x = this.joy.x; y = this.joy.y; }
    else {
      if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
      if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
      if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
      if (!x && !y && this.tilt.enabled) { x = this.tilt.x; y = this.tilt.y; }
    }
    const n = normalize(x, y);
    this.moveVec = { x: n.x, y: n.y, mag: Math.min(1, n.len) };
    return this.moveVec;
  }

  updatePlayer(dt) {
    const p = this.player;
    const v = this.getInputVec();
    p.attackKick = Math.max(0, p.attackKick - dt * 4.5);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt * 6);
    p.attackCd = Math.max(0, p.attackCd - dt);
    if (p.dead) return;

    if (v.mag > 0.06) {
      const speed = this.stats.speed * (p.hurtFlash > 0 ? 0.65 : 1);
      const mag = Math.min(1, Math.hypot(v.x, v.y));
      p.x += v.x * speed * mag * dt;
      p.y += v.y * speed * mag * dt;
      p.moving = true;
      if (!this.nearestEnemy()) p.facing = Math.atan2(v.y, v.x);
    } else {
      p.moving = false;
    }
    p.x = clamp(p.x, this.bounds.left + 16, this.bounds.right - 16);
    p.y = clamp(p.y, this.bounds.top + 16, this.bounds.bottom - 8);

    const target = this.nearestEnemy();
    if (target) {
      const d = dist(p, target);
      if (d <= this.cls.attack.range + target.r + 8) {
        p.facing = angleTo(p, target);
        if (p.attackCd <= 0) this.playerAttack(target);
      } else if (!p.moving) {
        p.facing = angleTo(p, target);
      }
    }

    // Warrior's kill-heal passive is applied on kill; shield expiry is handled by buffs.
    const atkBuff = 1 + this.buffs.filter(b => b.stat === 'atk').reduce((a, b) => a + b.amount, 0);
    const defBuff = 1 + this.buffs.filter(b => b.stat === 'def').reduce((a, b) => a + b.amount, 0);
    this.atkBuff = atkBuff;
    this.defBuff = defBuff;
  }

  nearestEnemy(from = this.player, maxDist = Infinity) {
    let best = null, bestD = maxDist;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist(from, e) - e.r;
      if (d < bestD) { best = e; bestD = d; }
    }
    return best;
  }

  aimVector() {
    const v = this.moveVec;
    if (v.mag > 0.15) return { x: v.x, y: v.y };
    const target = this.nearestEnemy();
    if (target) { const n = normalize(target.x - this.player.x, target.y - this.player.y); return n; }
    return { x: Math.cos(this.player.facing), y: Math.sin(this.player.facing) };
  }

  playerAttack(target) {
    const p = this.player;
    const atk = this.cls.attack;
    p.attackCd = atk.interval;
    p.attackKick = 1;
    this.player.facing = angleTo(p, target);
    if (atk.type === 'melee') {
      const facing = p.facing;
      const targets = this.enemies
        .filter(e => !e.dead && dist(p, e) <= atk.range + e.r + 6)
        .sort((a, b) => dist(p, a) - dist(p, b))
        .slice(0, atk.cleave);
      for (const e of targets) {
        const { amount, crit } = this.rollDamage(this.stats.atk * atk.mult);
        this.hitEnemy(e, amount, { crit, color: '#ffd98a' });
        this.applyKnockback(e, 18, 0.12);
      }
      this.slashes.push({ x: p.x, y: p.y, angle: facing, radius: atk.range + 12, arc: 1.9, life: 0.18, max: 0.18, color: '#ffe7a8' });
      if (targets.length) audio.play('hit');
    } else {
      const a = angleTo(p, target);
      const spread = rand(-0.025, 0.025);
      const roll = this.rollDamage(this.stats.atk * atk.mult);
      this.spawnPlayerProjectile(p.x + Math.cos(a) * 16, p.y + Math.sin(a) * 16, a + spread, atk.projectileSpeed, roll.amount, {
        color: this.cls.id === 'mage' ? '#c4b5fd' : '#99f6e4',
        kind: this.cls.id === 'mage' ? 'bolt' : 'arrow',
        radius: this.cls.id === 'mage' ? 6 : 4,
        crit: roll.crit,
      });
      audio.play('shoot');
    }
  }

  rollDamage(base) {
    const crit = Math.random() * 100 < this.stats.crit;
    const variance = rand(0.9, 1.1);
    const amount = base * variance * (crit ? this.stats.critDmg / 100 : 1) * (this.atkBuff || 1);
    return { amount, crit };
  }

  spawnPlayerProjectile(x, y, angle, speed, raw, opts = {}) {
    this.projectiles.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: opts.radius ?? 5, raw, owner: 'player',
      color: opts.color ?? '#fff', kind: opts.kind ?? 'bolt',
      pierce: opts.pierce ?? 0, hit: new Set(), life: opts.life ?? 1.4,
      freeze: opts.freeze ?? 0, slow: opts.slow ?? 0, crit: opts.crit ?? false,
      angle,
    });
  }

  useSkill(index) {
    if (this.paused || this.ended || this.player.dead) return;
    const skill = this.cls.skills[index];
    if (!skill) return;
    if (this.cooldowns[index] > 0) {
      audio.play('error');
      return;
    }
    this.cooldowns[index] = this.skillTotals[index];
    this.player.attackKick = 1;
    const aim = this.aimVector();
    const p = this.player;
    const sp = this.stats.skillPower || 1;
    switch (skill.id) {
      case 'whirlwind': {
        const radius = 126;
        this.rings.push({ x: p.x, y: p.y, r0: 18, r1: radius, life: 0.32, max: 0.32, color: '#ffd27a', width: 4 });
        this.slashes.push({ x: p.x, y: p.y, angle: p.facing, radius, arc: TAU, life: 0.32, max: 0.32, color: '#ffe6a3' });
        for (const e of [...this.enemies]) {
          if (e.dead) continue;
          if (dist(p, e) <= radius + e.r) {
            const { amount, crit } = this.rollDamage(this.stats.atk * 2.5 * sp);
            this.hitEnemy(e, amount, { crit, color: '#ffcf7a' });
            this.applyKnockback(e, 32, 0.2);
          }
        }
        this.shake = Math.max(this.shake, 4);
        audio.play('skill');
        break;
      }
      case 'bash': {
        const from = { x: p.x, y: p.y };
        p.x = clamp(p.x + aim.x * 118, this.bounds.left + 16, this.bounds.right - 16);
        p.y = clamp(p.y + aim.y * 118, this.bounds.top + 16, this.bounds.bottom - 8);
        this.slashes.push({ x: p.x, y: p.y, angle: Math.atan2(aim.y, aim.x), radius: 80, arc: 2.1, life: 0.25, max: 0.25, color: '#ffe08a' });
        this.rings.push({ x: p.x, y: p.y, r0: 8, r1: 74, life: 0.3, max: 0.3, color: '#ffd27a', width: 5 });
        for (const e of [...this.enemies]) {
          if (e.dead) continue;
          if (dist(p, e) <= 76 + e.r) {
            const { amount, crit } = this.rollDamage(this.stats.atk * 1.8 * sp);
            this.hitEnemy(e, amount, { crit, color: '#ffe08a' });
            e.stun = Math.max(e.stun, 1.3);
            this.applyKnockback(e, 35, 0.24);
          }
        }
        this.burst(from.x, from.y, '#ffe0a0', 10, 80, 3, 0.3);
        this.shake = Math.max(this.shake, 6);
        audio.play('skill');
        break;
      }
      case 'fortress': {
        const shield = Math.round(this.stats.maxHp * 0.3);
        this.player.shield = Math.max(this.player.shield, shield);
        this.buffs = this.buffs.filter(b => b.id !== 'shield' && b.id !== 'fortress');
        this.buffs.push({ id: 'shield', time: 5, shield });
        this.buffs.push({ id: 'fortress', stat: 'def', amount: 0.35, time: 6 });
        this.healPlayer(this.stats.maxHp * 0.12);
        this.rings.push({ x: p.x, y: p.y, r0: 16, r1: 62, life: 0.5, max: 0.5, color: '#ffe9a8', width: 5 });
        audio.play('upgrade');
        break;
      }
      case 'nova': {
        const radius = 148;
        this.rings.push({ x: p.x, y: p.y, r0: 12, r1: radius, life: 0.45, max: 0.45, color: '#c4b5fd', width: 6 });
        this.rings.push({ x: p.x, y: p.y, r0: 8, r1: radius * 0.7, life: 0.32, max: 0.32, color: '#67e8f9', width: 3 });
        for (const e of [...this.enemies]) {
          if (e.dead) continue;
          if (dist(p, e) <= radius + e.r) {
            const { amount, crit } = this.rollDamage(this.stats.atk * 2.3 * sp);
            this.hitEnemy(e, amount, { crit, color: '#d8c8ff' });
            e.slow = Math.max(e.slow, 2.5);
            e.slowAmt = Math.max(e.slowAmt || 0, 0.4);
          }
        }
        this.burst(p.x, p.y, '#c4b5fd', 26, 180, 4, 0.55);
        this.shake = Math.max(this.shake, 6);
        audio.play('nova');
        break;
      }
      case 'lance': {
        const roll = this.rollDamage(this.stats.atk * 2.5 * sp);
        this.spawnPlayerProjectile(p.x, p.y, Math.atan2(aim.y, aim.x), 620, roll.amount, {
          color: '#7dd3fc', kind: 'lance', radius: 9, pierce: 99, freeze: 1.5, life: 1.1, crit: roll.crit,
        });
        this.rings.push({ x: p.x, y: p.y, r0: 8, r1: 38, life: 0.25, max: 0.25, color: '#7dd3fc', width: 3 });
        audio.play('skill');
        break;
      }
      case 'meteor': {
        const target = this.skillTarget();
        const delay = 0.8;
        this.telegraphs.push({ kind: 'circle', x: target.x, y: target.y, r: 132, t: delay, total: delay, color: '#fb7185', fill: '#fb7185' });
        this.after(delay, () => {
          this.rings.push({ x: target.x, y: target.y, r0: 10, r1: 140, life: 0.45, max: 0.45, color: '#fda4af', width: 8 });
          this.burst(target.x, target.y, '#fb7185', 34, 230, 5, 0.65);
          for (const e of [...this.enemies]) {
            if (e.dead) continue;
            if (dist(target, e) <= 132 + e.r) {
              const { amount, crit } = this.rollDamage(this.stats.atk * 3.3 * sp);
              this.hitEnemy(e, amount, { crit, color: '#fda4af' });
              e.burn = Math.max(e.burn, 3);
              e.burnDps = Math.max(e.burnDps || 0, this.stats.atk * 0.18 * sp);
            }
          }
          this.shake = Math.max(this.shake, 10);
          audio.play('crit');
        });
        audio.play('skill');
        break;
      }
      case 'fan': {
        const base = this.nearestEnemy() ? angleTo(p, this.nearestEnemy()) : Math.atan2(aim.y, aim.x);
        for (let i = -2; i <= 2; i++) {
          const a = base + i * 0.14;
          const proj = this.rollDamage(this.stats.atk * 0.85 * sp);
          this.spawnPlayerProjectile(p.x, p.y, a, 660, proj.amount, {
            color: '#5eead4', kind: 'arrow', radius: 4, crit: proj.crit, life: 0.9,
          });
        }
        this.slashes.push({ x: p.x, y: p.y, angle: base, radius: 45, arc: 1.8, life: 0.18, max: 0.18, color: '#99f6e4' });
        audio.play('shoot');
        break;
      }
      case 'shadowstep': {
        const from = { x: p.x, y: p.y };
        p.x = clamp(p.x + aim.x * 176, this.bounds.left + 16, this.bounds.right - 16);
        p.y = clamp(p.y + aim.y * 176, this.bounds.top + 16, this.bounds.bottom - 8);
        this.buffs = this.buffs.filter(b => b.id !== 'shadow');
        this.buffs.push({ id: 'shadow', stat: 'atk', amount: 0.45, time: 2.5 });
        for (const e of [...this.enemies]) {
          if (e.dead) continue;
          if (dist(p, e) <= 96 + e.r) {
            e.slow = Math.max(e.slow, 2);
            e.slowAmt = Math.max(e.slowAmt || 0, 0.35);
          }
        }
        for (let i = 0; i < 5; i++) this.burst(from.x + rand(-10, 10), from.y + rand(-12, 12), '#2dd4bf', 1, 30, 3, 0.35);
        this.burst(p.x, p.y, '#5eead4', 16, 110, 3, 0.4);
        audio.play('skill');
        break;
      }
      case 'rain': {
        const target = this.skillTarget();
        this.zones.push({
          x: target.x, y: target.y, r: 128, life: 2.05, tick: 0.06,
          interval: 0.31, raw: this.stats.atk * 0.55 * sp, color: '#5eead4', type: 'rain',
        });
        this.telegraphs.push({ kind: 'circle', x: target.x, y: target.y, r: 128, t: 0.35, total: 0.35, color: '#5eead4' });
        audio.play('skill');
        break;
      }
      default: break;
    }
    navigator.vibrate?.(this.save.settings.haptics ? 12 : 0);
  }

  skillTarget() {
    const target = this.nearestEnemy();
    if (target) return { x: target.x, y: target.y };
    const aim = this.aimVector();
    return {
      x: clamp(this.player.x + aim.x * 190, this.bounds.left + 40, this.bounds.right - 40),
      y: clamp(this.player.y + aim.y * 190, this.bounds.top + 30, this.bounds.bottom - 30),
    };
  }

  usePotion() {
    if (this.paused || this.ended || this.player.dead) return;
    if (this.potions <= 0 || this.potionCd > 0) { audio.play('error'); return; }
    this.potions--;
    this.potionCd = 1.2;
    this.el.potionCount.textContent = this.potions;
    this.healPlayer(this.stats.maxHp * 0.36);
    this.rings.push({ x: this.player.x, y: this.player.y, r0: 10, r1: 54, life: 0.45, max: 0.45, color: '#86efac', width: 4 });
    this.burst(this.player.x, this.player.y, '#86efac', 14, 70, 3, 0.5);
    audio.play('potion');
    this.el.potionBtn.classList.toggle('empty', this.potions <= 0);
  }

  healPlayer(amount) {
    if (this.player.dead) return;
    const before = this.player.hp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
    const healed = Math.round(this.player.hp - before);
    if (healed > 0) this.addText(this.player.x, this.player.y - 30, `+${healed}`, '#86efac', 15);
  }

  after(t, fn) { this.timers.push({ t, fn }); }

  applyKnockback(e, amount, time = 0.15) {
    if (e.boss) amount *= 0.25;
    e.knock = { x: Math.cos(this.player.facing) * amount, y: Math.sin(this.player.facing) * amount, t: time, max: time };
  }

  hitEnemy(e, raw, { crit = false, color = '#fff', dot = false } = {}) {
    if (!e || e.dead) return;
    const reduction = 100 / (100 + (e.def || 0) * 1.2);
    const amount = Math.max(1, Math.round(raw * reduction));
    e.hp -= amount;
    e.hitFlash = 0.13;
    this.damageDealt += amount;
    this.addText(e.x + rand(-4, 4), e.y - e.r - 10, String(amount), crit ? '#ffd166' : color, crit ? 20 : 13, crit);
    if (!dot) this.burst(e.x, e.y, color, crit ? 7 : 3, 55, crit ? 3 : 2, 0.22);
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    this.kills++;
    this.xpGained += e.xp || 0;
    this.hooks.onKill?.(e);
    this.burst(e.x, e.y, e.color || '#f87171', e.boss ? 60 : 16, e.boss ? 240 : 100, e.boss ? 5 : 3, e.boss ? 0.9 : 0.45);
    if (e.boss) {
      this.boss = null;
      this.bossDefeated = true;
      this.shake = 18;
      this.rings.push({ x: e.x, y: e.y, r0: 20, r1: 260, life: 0.8, max: 0.8, color: e.color, width: 8 });
      this.el.bossHud.hidden = true;
      this.showBanner('BOSS DEFEATED', `${e.name} falls`, 1900);
      audio.play('victory');
      for (const add of this.enemies) {
        if (!add.dead && !add.boss) this.killEnemy(add);
      }
    } else {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.stats.killHeal * this.player.maxHp);
    }
  }

  takeDamage(raw, source = null) {
    if (this.player.dead) return;
    const def = this.stats.def * (this.defBuff || 1);
    const reduction = 100 / (100 + def * 1.25);
    let amount = raw * reduction * this.stats.damageTaken;
    if (this.player.shield > 0) {
      const absorbed = Math.min(this.player.shield, amount);
      this.player.shield -= absorbed;
      amount -= absorbed;
      this.addText(this.player.x, this.player.y - 34, `-${Math.round(absorbed)}`, '#fcd34d', 12);
      if (this.player.shield <= 0) this.buffs = this.buffs.filter(b => b.id !== 'shield');
    }
    this.damageTaken += amount;
    if (amount > 0.5) {
      this.player.hp -= amount;
      this.addText(this.player.x + rand(-5, 5), this.player.y - 24, `-${Math.round(amount)}`, '#fb7185', 15);
      this.player.hurtFlash = 1;
      this.hurtVignette = Math.min(1, this.hurtVignette + 0.35);
      this.shake = Math.max(this.shake, Math.min(9, 2 + amount / 8));
      if (this.time - this.lastHitSound > 0.12) {
        audio.play('hurt');
        this.lastHitSound = this.time;
      }
      navigator.vibrate?.(this.save.settings.haptics ? 18 : 0);
    }
    if (this.player.hp <= 0) this.die();
  }

  die() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.player.hp = 0;
    this.updateHud();
    this.player.deadTime = 1.6;
    this.shake = 14;
    this.endTimer = 1.5;
    this.showBanner('YOU FELL', 'The rift keeps its secrets', 1800);
    audio.play('defeat');
    this.after(1.4, () => this.finish('defeat'));
  }

  spawnWave(index, delay = 1.2) {
    this.waveIndex = index;
    this.waveActive = false;
    this.waveCleared = false;
    this.nextWaveTimer = delay;
    this.pendingWave = true;
    this.el.wave.textContent = `WAVE ${index + 1}/${this.waveDefs.length}`;
  }

  spawnWaveNow() {
    const wave = this.waveDefs[this.waveIndex];
    if (!wave) return;
    this.pendingWave = false;
    this.waveActive = true;
    this.waveCleared = false;
    this.el.wave.textContent = wave.boss ? 'BOSS' : `WAVE ${this.waveIndex + 1}/${this.waveDefs.length}`;
    if (wave.boss) {
      const bs = bossStats(wave.boss, this.chapter, this.stage);
      const e = this.createEnemy(bs, this.w / 2, this.bounds.top + 74);
      e.isBoss = true;
      this.boss = e;
      this.enemies.push(e);
      this.el.bossHud.hidden = false;
      this.el.bossName.textContent = `${bs.name} — ${bs.title}`;
      this.el.bossPhase.textContent = 'PHASE I';
      this.el.bossFill.style.width = '100%';
      this.showBanner('BOSS', `${bs.name} · ${bs.title}`, 2200);
      this.shake = 8;
      audio.play('boss');
    } else {
      const positions = this.spawnPositions(wave.enemies.length);
      wave.enemies.forEach((def, i) => {
        const stats = enemyStats(def.type, this.chapter, this.stage, !!def.elite);
        const pos = positions[i] || this.randomSpawn();
        this.enemies.push(this.createEnemy(stats, pos.x, pos.y));
      });
      this.showBanner(this.waveIndex === 0 ? 'THE RIFT STIRS' : `WAVE ${this.waveIndex + 1}`, wave.title, 1300);
    }
  }

  createEnemy(stats, x, y) {
    const e = {
      ...stats,
      id: ++this.killIds,
      x, y, r: stats.radius ?? stats.r ?? 16,
      hp: stats.hp, maxHp: stats.maxHp ?? stats.hp,
      atkCd: rand(0.5, 1.5),
      windup: 0, windupMax: stats.windup || 0.62, attackAngle: 0,
      stun: 0, freeze: 0, slow: 0, slowAmt: 0, burn: 0, burnDps: 0, burnTick: 0,
      hitFlash: 0, dead: false, bob: rand(0, TAU), dashCd: rand(1.5, 3.5),
      phase: 1, castLock: 1.4,
      abilityTimers: (stats.abilities || []).map((id, i) => ({ id, t: 2.2 + i * 1.5 })),
    };
    if (stats.boss) {
      e.castLock = 1.7;
      e.charge = null;
      e.enraged = false;
    }
    return e;
  }

  spawnPositions(count) {
    const positions = [];
    const p = this.player;
    for (let i = 0; i < count; i++) {
      let pos = null;
      for (let tries = 0; tries < 30; tries++) {
        const side = i % 4;
        const margin = 38;
        let x, y;
        if (side === 0) { x = rand(this.bounds.left + margin, this.bounds.right - margin); y = this.bounds.top + rand(30, 90); }
        else if (side === 1) { x = this.bounds.right - rand(20, 80); y = rand(this.bounds.top + 60, this.bounds.bottom - 60); }
        else if (side === 2) { x = rand(this.bounds.left + margin, this.bounds.right - margin); y = this.bounds.bottom - rand(10, 60); }
        else { x = this.bounds.left + rand(20, 80); y = rand(this.bounds.top + 60, this.bounds.bottom - 60); }
        x = clamp(x, this.bounds.left + 24, this.bounds.right - 24);
        y = clamp(y, this.bounds.top + 24, this.bounds.bottom - 24);
        if (dist({ x, y }, p) > 180) { pos = { x, y }; break; }
      }
      positions.push(pos || this.randomSpawn());
    }
    return positions;
  }

  randomSpawn() {
    for (let i = 0; i < 40; i++) {
      const x = rand(this.bounds.left + 30, this.bounds.right - 30);
      const y = rand(this.bounds.top + 30, this.bounds.bottom - 30);
      if (dist({ x, y }, this.player) > 190) return { x, y };
    }
    return { x: this.w / 2, y: this.bounds.top + 60 };
  }

  updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.bob += dt;
      if (e.burn > 0) {
        e.burn -= dt;
        e.burnTick -= dt;
        if (e.burnTick <= 0) {
          e.burnTick = 0.45;
          this.hitEnemy(e, e.burnDps * 0.45, { dot: true, color: '#fb923c' });
          if (e.dead) continue;
        }
      }
      if (e.knock) {
        e.x += e.knock.x * (e.knock.t / e.knock.max);
        e.y += e.knock.y * (e.knock.t / e.knock.max);
        e.knock.t -= dt;
        if (e.knock.t <= 0) e.knock = null;
      }
      if (e.freeze > 0) { e.freeze -= dt; continue; }
      if (e.stun > 0) { e.stun -= dt; continue; }
      if (e.slow > 0) { e.slow -= dt; if (e.slow <= 0) e.slowAmt = 0; }

      if (e.boss) { this.updateBoss(e, dt); continue; }
      if (e.dasher) {
        if (this.updateStalker(e, dt)) continue;
      }
      const d = dist(e, p);
      const slowMul = e.slow > 0 ? 1 - e.slowAmt : 1;
      const speed = e.speed * slowMul;

      if (e.ranged) {
        if (e.windup > 0) {
          e.windup -= dt;
          if (e.windup <= 0) {
            const a = angleTo(e, p);
            this.spawnEnemyProjectile(e, a, e.projectileSpeed, e.atk * 0.95, e.color);
            e.atkCd = e.interval;
            e.windup = 0;
          }
        } else {
          e.atkCd -= dt;
          if (e.atkCd <= 0 && d <= e.range) {
            e.windup = e.windupMax || 0.5;
            e.attackAngle = angleTo(e, p);
          } else {
            const aim = normalize(p.x - e.x, p.y - e.y);
            if (d > e.range * 0.9) {
              e.x += aim.x * speed * dt; e.y += aim.y * speed * dt;
            } else if (d < e.keep * 0.72) {
              e.x -= aim.x * speed * dt; e.y -= aim.y * speed * dt;
            } else {
              const strafe = Math.sin(this.time * 1.4 + e.bob) > 0 ? 1 : -1;
              e.x += -aim.y * strafe * speed * 0.5 * dt;
              e.y += aim.x * strafe * speed * 0.5 * dt;
            }
          }
        }
      } else {
        if (e.windup > 0) {
          e.windup -= dt;
          if (e.windup <= 0) {
            const range = (e.slam ? e.r + 48 : e.range) + p.r + 8;
            if (dist(e, p) <= range) {
              const mult = e.slam ? 1.2 : 1;
              this.takeDamage(e.atk * mult, e);
              if (e.slam) {
                this.rings.push({ x: e.x, y: e.y, r0: 10, r1: e.r + 52, life: 0.3, max: 0.3, color: e.color, width: 4 });
                this.shake = Math.max(this.shake, 4);
              }
            }
            e.atkCd = e.interval;
            e.windup = 0;
          }
        } else {
          e.atkCd -= dt;
          if (e.atkCd <= 0 && d <= (e.slam ? e.r + 58 : e.range) + p.r) {
            e.windup = e.windupMax || this.windupOf(e);
            e.attackAngle = angleTo(e, p);
          } else if (d > (e.slam ? e.r + 34 : e.range) * 0.9) {
            const a = angleTo(e, p);
            e.x += Math.cos(a) * speed * dt;
            e.y += Math.sin(a) * speed * dt;
          }
        }
      }
      e.x = clamp(e.x, this.bounds.left + e.r, this.bounds.right - e.r);
      e.y = clamp(e.y, this.bounds.top + e.r, this.bounds.bottom - e.r);
    }

    // Soft separation keeps packs readable.
    for (let i = 0; i < this.enemies.length; i++) {
      const a = this.enemies[i];
      if (a.dead) continue;
      for (let j = i + 1; j < this.enemies.length; j++) {
        const b = this.enemies[j];
        if (b.dead) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = (a.r + b.r) * 0.82;
        if (d > 0 && d < min) {
          const push = (min - d) / d * 0.5;
          const ax = a.boss ? 0.15 : 1, bx = b.boss ? 0.15 : 1;
          a.x -= dx * push * ax; a.y -= dy * push * ax;
          b.x += dx * push * bx; b.y += dy * push * bx;
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  windupOf(e) {
    if (e.slam) return 0.7;
    return e.windup || 0.5;
  }

  updateStalker(e, dt) {
    const p = this.player;
    if (e.dash) {
      e.dash.t -= dt;
      e.x += e.dash.vx * dt;
      e.y += e.dash.vy * dt;
      if (!e.dash.hit && dist(e, p) < e.r + p.r + 8) {
        e.dash.hit = true;
        this.takeDamage(e.atk * 1.15, e);
      }
      if (e.dash.t <= 0) e.dash = null;
      e.x = clamp(e.x, this.bounds.left + e.r, this.bounds.right - e.r);
      e.y = clamp(e.y, this.bounds.top + e.r, this.bounds.bottom - e.r);
      return true;
    }
    if (e.dashWindup > 0) {
      e.dashWindup -= dt;
      if (e.dashWindup <= 0) {
        const a = angleTo(e, p);
        e.dash = { vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, t: 0.24, hit: false };
        this.burst(e.x, e.y, e.color, 8, 55, 2, 0.25);
        audio.play('shoot');
      }
      return true;
    }
    e.dashCd -= dt;
    const d = dist(e, p);
    if (e.dashCd <= 0 && d > 90 && d < 340) {
      e.dashWindup = 0.55;
      e.attackAngle = angleTo(e, p);
      e.dashCd = rand(3.2, 5.2);
      return true;
    }
    return false;
  }

  updateBoss(e, dt) {
    const p = this.player;
    e.castLock = Math.max(0, e.castLock - dt);
    e.atkCd = Math.max(0, e.atkCd - dt);
    if (e.charge) {
      e.charge.t -= dt;
      e.x += e.charge.vx * dt;
      e.y += e.charge.vy * dt;
      if (!e.charge.hit && dist(e, p) < e.r + p.r + 10) {
        e.charge.hit = true;
        this.takeDamage(e.atk * 1.25, e);
        this.shake = Math.max(this.shake, 8);
      }
      if (e.charge.t <= 0) {
        e.charge = null;
        this.burst(e.x, e.y, e.color, 18, 120, 4, 0.4);
      }
      e.x = clamp(e.x, this.bounds.left + e.r, this.bounds.right - e.r);
      e.y = clamp(e.y, this.bounds.top + e.r, this.bounds.bottom - e.r);
      return;
    }

    if (e.phase === 1 && e.hp <= e.maxHp * 0.5) {
      e.phase = 2;
      e.enraged = true;
      e.castLock = 1.1;
      e.speed *= 1.12;
      this.showBanner('PHASE II', `${e.name} is enraged`, 1700);
      this.rings.push({ x: e.x, y: e.y, r0: 20, r1: 180, life: 0.6, max: 0.6, color: e.color, width: 6 });
      this.burst(e.x, e.y, e.color, 30, 180, 4, 0.7);
      this.shake = 12;
      audio.play('boss');
      this.el.bossPhase.textContent = 'PHASE II';
    }

    // Ability selection
    if (e.castLock <= 0) {
      for (const ab of e.abilityTimers) {
        ab.t -= dt;
        if (ab.t <= 0) {
          if (ab.id === 'summon' && this.enemies.filter(x => !x.dead && !x.boss).length >= 5) {
            ab.t = 2;
            continue;
          }
          this.castBossAbility(e, ab.id);
          const cd = (BOSS_COOLDOWNS[ab.id] || 9) * (e.enraged ? 0.68 : 1);
          ab.t = cd;
          break;
        }
      }
    }

    const d = dist(e, p);
    if (e.castLock > 0) {
      e.facing = angleTo(e, p);
      return;
    }
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        if (dist(e, p) <= e.r + p.r + 42) {
          this.takeDamage(e.atk * 0.95, e);
          this.slashes.push({ x: e.x, y: e.y, angle: e.attackAngle, radius: e.r + 48, arc: 2, life: 0.2, max: 0.2, color: e.color });
        }
        e.atkCd = 1.55;
        e.windup = 0;
      }
      return;
    }
    if (e.atkCd <= 0 && d < e.r + p.r + 44) {
      e.windup = 0.62;
      e.attackAngle = angleTo(e, p);
      return;
    }
    const a = angleTo(e, p);
    const speed = e.speed * (e.enraged ? 1.1 : 1);
    if (d > e.r + 92) {
      e.x += Math.cos(a) * speed * dt;
      e.y += Math.sin(a) * speed * dt;
    } else if (d < e.r + 58) {
      e.x -= Math.cos(a) * speed * 0.4 * dt;
      e.y -= Math.sin(a) * speed * 0.4 * dt;
    }
    e.x = clamp(e.x, this.bounds.left + e.r, this.bounds.right - e.r);
    e.y = clamp(e.y, this.bounds.top + e.r, this.bounds.bottom - e.r);
  }

  castBossAbility(e, id) {
    const p = this.player;
    const color = e.color;
    const scale = e.phase === 2 ? 1.15 : 1;
    e.castLock = 0.95;
    switch (id) {
      case 'slam': {
        const r = 132;
        this.telegraphs.push({ kind: 'circle', x: e.x, y: e.y, r, t: 0.95, total: 0.95, color, fill: color });
        this.after(0.95, () => {
          if (e.dead) return;
          this.rings.push({ x: e.x, y: e.y, r0: 12, r1: r + 10, life: 0.4, max: 0.4, color, width: 7 });
          if (dist(e, p) < r + p.r) this.takeDamage(e.atk * 1.15 * scale, e);
          this.shake = Math.max(this.shake, 9);
          audio.play('hit');
        });
        break;
      }
      case 'charge': {
        const a = angleTo(e, p);
        const len = 460;
        const x2 = e.x + Math.cos(a) * len;
        const y2 = e.y + Math.sin(a) * len;
        this.telegraphs.push({ kind: 'line', x1: e.x, y1: e.y, x2, y2, width: 58, t: 0.8, total: 0.8, color, fill: color });
        this.after(0.8, () => {
          if (e.dead) return;
          e.charge = { vx: Math.cos(a) * 720, vy: Math.sin(a) * 720, t: 0.34, hit: false };
          audio.play('boss');
        });
        break;
      }
      case 'volley': {
        this.rings.push({ x: e.x, y: e.y, r0: 24, r1: 90, life: 0.7, max: 0.7, color, width: 3 });
        this.after(0.7, () => {
          if (e.dead) return;
          const count = e.enraged ? 16 : 12;
          const offset = angleTo(e, p);
          for (let i = 0; i < count; i++) {
            const a = offset + (i / count) * TAU;
            this.spawnEnemyProjectile(e, a, 190, e.atk * 0.62 * scale, color);
          }
          audio.play('skill');
        });
        break;
      }
      case 'rain': {
        const count = e.enraged ? 7 : 5;
        for (let i = 0; i < count; i++) {
          const x = clamp(p.x + rand(-110, 110), this.bounds.left + 30, this.bounds.right - 30);
          const y = clamp(p.y + rand(-110, 110), this.bounds.top + 30, this.bounds.bottom - 30);
          const delay = 0.55 + i * 0.14;
          this.telegraphs.push({ kind: 'circle', x, y, r: 58, t: delay, total: delay, color, fill: color });
          this.after(delay, () => {
            if (e.dead || this.player.dead) return;
            this.rings.push({ x, y, r0: 8, r1: 64, life: 0.3, max: 0.3, color, width: 4 });
            if (dist({ x, y }, this.player) < 58 + this.player.r) this.takeDamage(e.atk * 0.85 * scale, e);
          });
        }
        break;
      }
      case 'summon': {
        this.rings.push({ x: e.x, y: e.y, r0: 20, r1: 120, life: 0.6, max: 0.6, color, width: 4 });
        this.after(0.55, () => {
          if (e.dead) return;
          const type = e.summons || 'crawler';
          for (let i = 0; i < 3; i++) {
            const a = rand(0, TAU);
            const sx = clamp(e.x + Math.cos(a) * rand(80, 130), this.bounds.left + 30, this.bounds.right - 30);
            const sy = clamp(e.y + Math.sin(a) * rand(80, 130), this.bounds.top + 30, this.bounds.bottom - 30);
            const stats = enemyStats(type, this.chapter, this.stage, false);
            stats.hp = Math.round(stats.hp * 0.7);
            stats.maxHp = stats.hp;
            this.enemies.push(this.createEnemy(stats, sx, sy));
            this.burst(sx, sy, color, 12, 90, 3, 0.4);
          }
          audio.play('wave');
        });
        break;
      }
      case 'beam': {
        const a = angleTo(e, p);
        const len = 900;
        const x2 = e.x + Math.cos(a) * len;
        const y2 = e.y + Math.sin(a) * len;
        this.telegraphs.push({ kind: 'line', x1: e.x, y1: e.y, x2, y2, width: 46, t: 0.9, total: 0.9, color, fill: color });
        this.after(0.9, () => {
          if (e.dead) return;
          const dd = pointSegmentDist(this.player.x, this.player.y, e.x, e.y, x2, y2);
          if (dd < 46 / 2 + this.player.r) this.takeDamage(e.atk * 1.35 * scale, e);
          this.telegraphs.push({ kind: 'line', x1: e.x, y1: e.y, x2, y2, width: 22, t: 0.22, total: 0.22, color: '#ffffff', fill: '#ffffff' });
          this.shake = Math.max(this.shake, 8);
          audio.play('skill');
        });
        break;
      }
      case 'blink': {
        this.burst(e.x, e.y, color, 22, 140, 4, 0.5);
        this.after(0.3, () => {
          if (e.dead) return;
          const a = rand(0, TAU);
          e.x = clamp(p.x + Math.cos(a) * 150, this.bounds.left + e.r, this.bounds.right - e.r);
          e.y = clamp(p.y + Math.sin(a) * 150, this.bounds.top + e.r, this.bounds.bottom - e.r);
          this.burst(e.x, e.y, color, 22, 140, 4, 0.5);
          audio.play('skill');
        });
        break;
      }
      default: break;
    }
    audio.play('boss');
  }

  spawnEnemyProjectile(e, angle, speed, raw, color) {
    this.projectiles.push({
      x: e.x + Math.cos(angle) * (e.r * 0.7),
      y: e.y + Math.sin(angle) * (e.r * 0.7),
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: 7, raw, owner: 'enemy', color: color || '#fb7185', kind: 'enemy',
      life: 3, angle,
    });
  }

  updateProjectiles(dt) {
    const alive = [];
    for (const proj of this.projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
      if (proj.life <= 0 || proj.x < -30 || proj.x > this.w + 30 || proj.y < -30 || proj.y > this.h + 30) continue;
      if (proj.owner === 'player') {
        for (const e of this.enemies) {
          if (e.dead || proj.hit.has(e.id)) continue;
          if (dist(proj, e) < e.r + proj.r) {
            proj.hit.add(e.id);
            this.hitEnemy(e, proj.raw, { crit: proj.crit, color: proj.color });
            if (proj.freeze) e.freeze = Math.max(e.freeze, proj.freeze);
            if (proj.slow) { e.slow = Math.max(e.slow, 2); e.slowAmt = Math.max(e.slowAmt, proj.slow); }
            this.burst(proj.x, proj.y, proj.color, 5, 55, 2, 0.2);
            if (proj.pierce > 0) proj.pierce--; else { proj.life = 0; break; }
          }
        }
      } else {
        if (dist(proj, this.player) < this.player.r + proj.r) {
          this.takeDamage(proj.raw, null);
          this.burst(proj.x, proj.y, proj.color, 7, 60, 2, 0.25);
          continue;
        }
      }
      if (proj.life > 0) alive.push(proj);
    }
    this.projectiles = alive;
  }

  updateZones(dt) {
    for (const z of this.zones) {
      z.life -= dt;
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = z.interval;
        for (const e of [...this.enemies]) {
          if (!e.dead && dist(z, e) < z.r + e.r) {
            this.hitEnemy(e, z.raw, { color: '#5eead4' });
            e.slow = Math.max(e.slow, 0.8);
            e.slowAmt = Math.max(e.slowAmt, 0.3);
          }
        }
      }
    }
    this.zones = this.zones.filter(z => z.life > 0);
  }

  updateEffects(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.96; p.vy = p.vy * 0.96 + p.gravity * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const t of this.texts) { t.y -= 28 * dt; t.life -= dt; }
    this.texts = this.texts.filter(t => t.life > 0);
    for (const r of this.rings) { r.life -= dt; r.r = r.r0 + (r.r1 - r.r0) * (1 - r.life / r.max); }
    this.rings = this.rings.filter(r => r.life > 0);
    for (const s of this.slashes) s.life -= dt;
    this.slashes = this.slashes.filter(s => s.life > 0);
  }

  updateWaveState(dt) {
    if (this.endTimer > 0) {
      this.endTimer -= dt;
      return;
    }
    if (this.pendingWave) {
      this.nextWaveTimer -= dt;
      if (this.nextWaveTimer <= 0) this.spawnWaveNow();
      return;
    }
    if (this.winTimer > 0) {
      this.winTimer -= dt;
      if (this.winTimer <= 0) this.finish('victory');
      return;
    }
    if (!this.waveActive) return;
    const living = this.enemies.some(e => !e.dead);
    if (!living) this.waveClear();
  }

  waveClear() {
    if (this.waveCleared) return;
    this.waveCleared = true;
    this.waveActive = false;
    this.awardWaveLoot(this.waveDefs[this.waveIndex]);
    this.healPlayer(this.player.maxHp * 0.06);
    for (const b of this.buffs) {
      if (b.id === 'shield') continue;
    }
    if (this.waveIndex >= this.waveDefs.length - 1) {
      this.showBanner('RIFT CLEARED', this.isBossStage ? 'The boss has fallen' : 'The path is open', 1800);
      this.winTimer = 1.65;
      this.shake = Math.max(this.shake, 5);
    } else {
      this.waveIndex++;
      this.nextWaveTimer = 1.45;
      this.pendingWave = true;
      this.showBanner('WAVE CLEARED', this.waveDefs[this.waveIndex]?.title || 'Onward', 1300);
      audio.play('wave');
    }
  }

  awardWaveLoot(wave) {
    const bossWave = !!wave?.boss;
    if (bossWave) {
      for (let i = 0; i < 4; i++) this.awardDrop(rollDrop(this.chapter, { boss: true, count: 2 }));
    } else if (Math.random() < 0.74) {
      this.awardDrop(rollDrop(this.chapter, { count: 1 }));
    }
  }

  awardDrop(drop) {
    const key = `${drop.tier}:${drop.slot}:${drop.rarity}`;
    const existing = this.lootMap.get(key);
    if (existing) existing.count += drop.count;
    else this.lootMap.set(key, { ...drop, count: drop.count });
    this.hooks.onLoot?.(drop);
    this.addLootFeed(drop);
  }

  addLootFeed(drop) {
    if (!this.el.feed) return;
    const name = this.lootName(drop);
    const color = { common: 'r-common', rare: 'r-rare', epic: 'r-epic', legendary: 'r-legendary', mythic: 'r-mythic', divine: 'r-divine' }[drop.rarity];
    const node = document.createElement('div');
    node.className = `loot-feed-item ${color}`;
    node.innerHTML = `<span class="feed-ic">${icon(drop.slot)}</span><span><b>${name}</b><small>${drop.rarity}${drop.count > 1 ? ` ×${drop.count}` : ''}</small></span>`;
    this.el.feed.prepend(node);
    requestAnimationFrame(() => node.classList.add('in'));
    setTimeout(() => { node.classList.remove('in'); setTimeout(() => node.remove(), 250); }, 2800);
    while (this.el.feed.children.length > 4) this.el.feed.lastElementChild?.remove();
    audio.play(drop.rarity === 'common' || drop.rarity === 'rare' ? 'loot' : 'rare');
  }

  lootName(drop) {
    const names = {
      weapon: ['Ironfang Blade', 'Rimecleaver', 'Blightthorn', 'Stormcaller', 'Voidreaver'],
      armor: ["Warden's Cuirass", 'Frostweave Robe', 'Boghide Vest', 'Stormhide Jerkin', 'Voidmail'],
      bracelet: ['Emberband', 'Frostlink Bracer', 'Blightcoil', 'Stormloop', 'Voidband'],
      earrings: ['Cinder Drops', 'Icicle Drops', 'Spore Drops', 'Thunder Drops', 'Null Drops'],
      helmet: ['Ironhelm', 'Rimehood', 'Blightmask', 'Stormcrown', 'Voidhelm'],
      shield: ['Ember Bulwark', 'Frostwall', 'Carapace', 'Thunderwall', 'Nullwall'],
      boots: ['Emberstriders', 'Frosttreads', 'Mireboots', 'Stormstriders', 'Voidtreads'],
      necklace: ['Ember Pendant', 'Frost Shard', 'Blight Charm', 'Storm Sigil', 'Void Locket'],
      ring: ['Cinder Ring', 'Rime Ring', 'Rot Ring', 'Bolt Ring', 'Null Ring'],
    };
    return names[drop.slot]?.[drop.tier - 1] || 'Relic';
  }

  updateHud() {
    const p = this.player;
    this.el.hpLabel.textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
    this.el.hpFill.style.width = `${clamp(p.hp / p.maxHp, 0, 1) * 100}%`;
    if (this.el.shieldFill) this.el.shieldFill.style.width = `${clamp(p.shield / p.maxHp, 0, 1) * 100}%`;
    const need = xpForNext(this.save.hero.level);
    this.el.xpFill.style.width = `${clamp((this.save.hero.xp + this.xpGained) / need, 0, 1) * 100}%`;
    const buffs = [];
    if (p.shield > 0) buffs.push('SHIELD');
    if (this.buffs.some(b => b.stat === 'atk')) buffs.push('ATK ▲');
    if (this.buffs.some(b => b.stat === 'def')) buffs.push('DEF ▲');
    this.el.buffs.textContent = buffs.join(' · ');
    if (this.boss) {
      this.el.bossFill.style.width = `${clamp(this.boss.hp / this.boss.maxHp, 0, 1) * 100}%`;
      this.el.bossPhase.textContent = this.boss.phase === 2 ? 'PHASE II' : 'PHASE I';
    }
    const buttons = document.querySelectorAll('.skill-btn[data-skill]');
    for (const btn of buttons) {
      const i = Number(btn.dataset.skill);
      const cd = this.cooldowns[i];
      const total = this.skillTotals[i] || 1;
      const frac = clamp(cd / total, 0, 1);
      btn.classList.toggle('cooling', cd > 0.05);
      btn.classList.toggle('ready-pulse', cd <= 0.05);
      btn.querySelector('.skill-cd')?.style.setProperty('--cd', frac);
    }
    this.el.potionBtn.classList.toggle('empty', this.potions <= 0);
    this.el.potionCount.textContent = this.potions;
  }

  hideTutorial() {
    this.tutorialTime = 0;
    this.el.tutorial.classList.add('out');
    setTimeout(() => { this.el.tutorial.hidden = true; }, 300);
  }

  showBanner(kicker, title, ms = 1500) {
    const b = this.el.banner;
    if (!b) return;
    this.el.bannerKicker.textContent = kicker;
    this.el.bannerTitle.textContent = title;
    b.hidden = false;
    b.classList.remove('in', 'out');
    void b.offsetWidth;
    b.classList.add('in');
    clearTimeout(this._bannerTimeout);
    this._bannerTimeout = setTimeout(() => {
      b.classList.add('out');
      setTimeout(() => { b.hidden = true; }, 350);
    }, ms);
  }

  addText(x, y, text, color, size = 13, crit = false) {
    this.texts.push({ x, y, text, color, size, crit, life: crit ? 0.9 : 0.7, max: crit ? 0.9 : 0.7 });
    if (this.texts.length > 50) this.texts.shift();
  }

  burst(x, y, color, count = 8, speed = 80, size = 3, life = 0.4) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(speed * 0.2, speed);
      this.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: rand(life * 0.6, life), max: life, size: rand(size * 0.5, size),
        color, gravity: rand(-10, 30),
      });
    }
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260);
  }

  togglePause() {
    if (this.ended) return;
    if (this.paused) this.resume();
    else this.pause();
  }

  pause() {
    if (this.paused || this.ended) return;
    this.paused = true;
    this.keys.clear();
    this.el.overlay.hidden = false;
    this.el.overlay.innerHTML = `
      <div class="battle-overlay-card pause-card">
        <p class="eyebrow">RIFT HELD</p>
        <h3>Paused</h3>
        <p class="overlay-copy">${this.chapterData.numeral} · ${this.chapterData.names[this.stage - 1]}</p>
        <div class="pause-actions">
          <button class="btn btn-primary" id="resume-btn">Resume</button>
          <button class="btn btn-ghost" id="retreat-btn">Retreat to camp</button>
        </div>
        <p class="fine-print">Retreating keeps the loot you have already secured.</p>
      </div>`;
    this.el.overlay.querySelector('#resume-btn')?.addEventListener('click', () => this.resume());
    this.el.overlay.querySelector('#retreat-btn')?.addEventListener('click', () => this.retreat());
    audio.play('back');
  }

  resume() {
    if (!this.paused || this.ended) return;
    this.paused = false;
    this.el.overlay.hidden = true;
    this.el.overlay.innerHTML = '';
    this.lastTs = performance.now();
    audio.play('click');
  }

  retreat() {
    if (this.ended) return;
    this.finish('retreat');
  }

  finish(result) {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.el.overlay.hidden = true;
    this.el.overlay.innerHTML = '';
    this.detachInputs();
    if (result === 'victory') audio.play('victory');
    else if (result === 'defeat') audio.play('defeat');
    const loot = [...this.lootMap.values()];
    this.hooks.onEnd?.(result, {
      chapter: this.chapter,
      stage: this.stage,
      boss: this.isBossStage,
      victory: result === 'victory',
      kills: this.kills,
      xp: this.xpGained,
      time: this.elapsed,
      damageDealt: Math.round(this.damageDealt),
      damageTaken: Math.round(this.damageTaken),
      loot,
      playerHp: Math.max(0, Math.round(this.player.hp)),
      playerMaxHp: this.player.maxHp,
    });
  }

  detachInputs() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('deviceorientation', this.onOrientation);
    document.removeEventListener('visibilitychange', this.onVisibility);
    clearTimeout(this._bannerTimeout);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.detachInputs();
    this.paused = true;
    this.ended = true;
  }

  // ────────────────────────────── rendering ──────────────────────────────

  buildBackground() {
    const w = this.w, h = this.h;
    const c = document.createElement('canvas');
    c.width = Math.round(w * this.dpr);
    c.height = Math.round(h * this.dpr);
    const x = c.getContext('2d');
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const accent = this.chapterData.accent;
    const floor = this.chapterData.floor;
    const base = x.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, '#04060c');
    base.addColorStop(0.28, floor);
    base.addColorStop(1, '#04060c');
    x.fillStyle = base;
    x.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h * 0.52;
    const rx = Math.min(w * 0.72, 340);
    const ry = Math.min(h * 0.46, 440);
    const aura = x.createRadialGradient(cx, cy, 20, cx, cy, Math.max(rx, ry));
    aura.addColorStop(0, this.hexA(accent, 0.16));
    aura.addColorStop(0.55, this.hexA(accent, 0.05));
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = aura;
    x.fillRect(0, 0, w, h);

    x.save();
    x.translate(cx, cy);
    x.scale(1, ry / rx);
    const floorGrad = x.createRadialGradient(0, 0, 10, 0, 0, rx);
    floorGrad.addColorStop(0, 'rgba(42,51,78,.72)');
    floorGrad.addColorStop(0.68, 'rgba(24,30,49,.6)');
    floorGrad.addColorStop(1, 'rgba(7,10,18,.15)');
    x.fillStyle = floorGrad;
    x.beginPath();
    x.arc(0, 0, rx, 0, TAU);
    x.fill();
    x.strokeStyle = this.hexA(accent, 0.3);
    x.lineWidth = 1.5;
    x.beginPath(); x.arc(0, 0, rx * 0.97, 0, TAU); x.stroke();
    x.strokeStyle = 'rgba(170,190,230,.09)';
    x.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      x.beginPath(); x.arc(0, 0, rx * (0.22 + i * 0.14), 0, TAU); x.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      x.strokeStyle = i % 3 === 0 ? this.hexA(accent, 0.32) : 'rgba(180,200,235,.09)';
      x.lineWidth = i % 3 === 0 ? 2 : 1;
      x.beginPath();
      x.moveTo(Math.cos(a) * rx * 0.84, Math.sin(a) * rx * 0.84);
      x.lineTo(Math.cos(a) * rx * 0.94, Math.sin(a) * rx * 0.94);
      x.stroke();
      if (i % 3 === 0) {
        x.save();
        x.translate(Math.cos(a) * rx * 0.9, Math.sin(a) * rx * 0.9);
        x.rotate(a + Math.PI / 2);
        x.strokeStyle = this.hexA(accent, 0.4);
        x.strokeRect(-3.5, -4, 7, 8);
        x.restore();
      }
    }
    x.restore();

    // Stone seams and cracks, deterministic so the arena does not crawl.
    let seed = 918273 + this.chapter * 77;
    const rng = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    x.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      let px = cx + (rng() - 0.5) * rx * 1.35;
      let py = cy + (rng() - 0.5) * ry * 1.5;
      x.strokeStyle = `rgba(0,0,0,${0.1 + rng() * 0.16})`;
      x.lineWidth = 0.8 + rng() * 1.2;
      x.beginPath();
      x.moveTo(px, py);
      const segs = 2 + Math.floor(rng() * 3);
      for (let s = 0; s < segs; s++) {
        px += (rng() - 0.5) * 36;
        py += (rng() - 0.5) * 28;
        x.lineTo(px, py);
      }
      x.stroke();
    }

    // Rim torches / rift crystals.
    for (const side of [-1, 1]) {
      const tx = cx + side * rx * 0.92;
      const ty = cy + ry * 0.05;
      const g = x.createRadialGradient(tx, ty, 2, tx, ty, 70);
      g.addColorStop(0, this.hexA(accent, 0.34));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(tx, ty, 70, 0, TAU); x.fill();
      x.fillStyle = this.hexA(accent, 0.9);
      x.beginPath();
      x.moveTo(tx, ty - 8); x.lineTo(tx + 4, ty); x.lineTo(tx, ty + 8); x.lineTo(tx - 4, ty);
      x.closePath(); x.fill();
    }

    // Readability veils behind the HUD and controls.
    const topVeil = x.createLinearGradient(0, 0, 0, 190);
    topVeil.addColorStop(0, 'rgba(2,5,11,.92)');
    topVeil.addColorStop(1, 'rgba(2,5,11,0)');
    x.fillStyle = topVeil;
    x.fillRect(0, 0, w, 190);
    const bottomVeil = x.createLinearGradient(0, h - 190, 0, h);
    bottomVeil.addColorStop(0, 'rgba(2,5,11,0)');
    bottomVeil.addColorStop(1, 'rgba(2,5,11,.9)');
    x.fillStyle = bottomVeil;
    x.fillRect(0, h - 190, w, 190);

    this.bgCanvas = c;
    this.motes = Array.from({ length: 26 }, () => ({
      x: rng() * w, y: rng() * h, s: 0.4 + rng() * 1.5,
      sp: 3 + rng() * 11, ph: rng() * TAU, a: 0.1 + rng() * 0.3,
    }));
  }

  hexA(hex, alpha) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  render(time) {
    const x = this.ctx;
    const w = this.w, h = this.h;
    x.clearRect(0, 0, w, h);
    x.save();
    if (this.shake > 0.1) {
      x.translate(rand(-this.shake, this.shake) * 0.6, rand(-this.shake, this.shake) * 0.6);
    }
    if (this.bgCanvas) x.drawImage(this.bgCanvas, 0, 0, w, h);

    // Rotating rift rune.
    const cx = w / 2, cy = h * 0.52;
    x.save();
    x.translate(cx, cy);
    x.rotate(time * 0.05);
    x.strokeStyle = this.hexA(this.chapterData.accent, 0.12);
    x.lineWidth = 1;
    x.setLineDash([3, 14]);
    x.beginPath(); x.arc(0, 0, Math.min(w * 0.31, 132), 0, TAU); x.stroke();
    x.setLineDash([]);
    x.rotate(-time * 0.11);
    x.strokeStyle = this.hexA(this.chapterData.accent, 0.08);
    x.beginPath(); x.arc(0, 0, Math.min(w * 0.23, 100), 0, TAU); x.stroke();
    x.restore();

    // Ambient motes.
    for (const m of this.motes || []) {
      const yy = ((m.y - time * m.sp) % (h + 30) + h + 30) % (h + 30);
      const xx = m.x + Math.sin(time * 0.35 + m.ph) * 14;
      x.globalAlpha = m.a * (0.7 + Math.sin(time + m.ph) * 0.3);
      x.fillStyle = this.chapterData.accent;
      x.beginPath(); x.arc(xx, yy, m.s, 0, TAU); x.fill();
    }
    x.globalAlpha = 1;

    this.drawZones(x, time);
    this.drawTelegraphs(x);

    const entities = [...this.enemies.filter(e => !e.dead), this.player].sort((a, b) => a.y - b.y);
    for (const e of entities) this.drawShadow(x, e);
    for (const e of entities) {
      if (e === this.player) this.drawHero(x, e, time);
      else this.drawEnemy(x, e, time);
    }

    this.drawProjectiles(x, time);
    this.drawEffects(x);
    this.drawTexts(x);

    if (this.hurtVignette > 0) {
      const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(190,30,45,0)');
      g.addColorStop(1, `rgba(190,30,45,${0.34 * this.hurtVignette})`);
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
    }

    const vig = x.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.28, w / 2, h * 0.5, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,.55)');
    x.fillStyle = vig;
    x.fillRect(0, 0, w, h);
    x.restore();
  }

  drawShadow(x, e) {
    const r = e === this.player ? 19 : e.r;
    x.save();
    x.translate(e.x, e.y + r * 0.62);
    x.scale(1, 0.38);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(0,0,0,.46)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    x.restore();
  }

  drawTelegraphs(x) {
    for (const t of this.telegraphs) {
      const progress = 1 - clamp(t.t / t.total, 0, 1);
      x.save();
      x.globalAlpha = 0.16 + progress * 0.24;
      x.fillStyle = t.fill || t.color;
      x.strokeStyle = t.color;
      x.lineWidth = 1.5;
      x.setLineDash([6, 7]);
      if (t.kind === 'circle') {
        x.beginPath(); x.arc(t.x, t.y, t.r, 0, TAU); x.fill(); x.stroke();
        x.globalAlpha = 0.4 + progress * 0.4;
        x.beginPath(); x.arc(t.x, t.y, t.r * progress, 0, TAU); x.stroke();
      } else if (t.kind === 'line') {
        const dx = t.x2 - t.x1, dy = t.y2 - t.y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len * t.width / 2, ny = dx / len * t.width / 2;
        x.beginPath();
        x.moveTo(t.x1 + nx, t.y1 + ny);
        x.lineTo(t.x2 + nx, t.y2 + ny);
        x.lineTo(t.x2 - nx, t.y2 - ny);
        x.lineTo(t.x1 - nx, t.y1 - ny);
        x.closePath(); x.fill(); x.stroke();
        x.globalAlpha = 0.5 + progress * 0.4;
        x.beginPath(); x.moveTo(t.x1, t.y1); x.lineTo(t.x2, t.y2); x.stroke();
      }
      x.restore();
    }
  }

  drawZones(x, time) {
    for (const z of this.zones) {
      x.save();
      const a = clamp(z.life / 2.05, 0, 1);
      x.globalAlpha = 0.16 * a;
      x.fillStyle = z.color;
      x.beginPath(); x.arc(z.x, z.y, z.r, 0, TAU); x.fill();
      x.globalAlpha = 0.5 * a;
      x.strokeStyle = z.color;
      x.setLineDash([4, 8]);
      x.beginPath(); x.arc(z.x, z.y, z.r, 0, TAU); x.stroke();
      x.setLineDash([]);
      x.globalAlpha = 0.7 * a;
      for (let i = 0; i < 9; i++) {
        const yy = ((time * 130 + i * 53) % 220);
        const xx = z.x + Math.sin(i * 2.7 + time) * z.r * 0.76;
        const py = z.y - z.r + yy;
        x.strokeStyle = z.color;
        x.lineWidth = 1.6;
        x.beginPath(); x.moveTo(xx, py); x.lineTo(xx, py + 12); x.stroke();
        x.beginPath(); x.moveTo(xx - 3, py + 8); x.lineTo(xx, py + 12); x.lineTo(xx + 3, py + 8); x.stroke();
      }
      x.restore();
    }
  }

  drawProjectiles(x, time) {
    for (const p of this.projectiles) {
      x.save();
      x.translate(p.x, p.y);
      x.rotate(p.angle || 0);
      if (p.owner === 'enemy') {
        x.shadowColor = p.color;
        x.shadowBlur = 12;
        x.fillStyle = p.color;
        x.beginPath(); x.arc(0, 0, p.r, 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,255,255,.8)';
        x.beginPath(); x.arc(0, 0, p.r * 0.42, 0, TAU); x.fill();
        x.globalAlpha = 0.35;
        x.fillStyle = p.color;
        x.beginPath(); x.ellipse(-p.r * 2.2, 0, p.r * 1.8, p.r * 0.55, 0, 0, TAU); x.fill();
      } else if (p.kind === 'arrow') {
        x.strokeStyle = p.color;
        x.lineWidth = 2;
        x.beginPath(); x.moveTo(-12, 0); x.lineTo(7, 0); x.stroke();
        x.fillStyle = p.color;
        x.beginPath(); x.moveTo(10, 0); x.lineTo(3, -3.5); x.lineTo(3, 3.5); x.closePath(); x.fill();
        x.globalAlpha = 0.3;
        x.beginPath(); x.moveTo(-26, 0); x.lineTo(-12, 0); x.stroke();
      } else if (p.kind === 'lance') {
        x.shadowColor = p.color;
        x.shadowBlur = 16;
        x.fillStyle = p.color;
        x.beginPath(); x.ellipse(0, 0, 19, 6, 0, 0, TAU); x.fill();
        x.fillStyle = '#e0f2fe';
        x.beginPath(); x.ellipse(4, 0, 10, 2.4, 0, 0, TAU); x.fill();
      } else {
        x.shadowColor = p.color;
        x.shadowBlur = 10;
        x.fillStyle = p.color;
        x.beginPath(); x.arc(0, 0, p.r, 0, TAU); x.fill();
        x.fillStyle = '#f5f3ff';
        x.beginPath(); x.arc(0, 0, p.r * 0.4, 0, TAU); x.fill();
      }
      x.restore();
    }
  }

  drawEffects(x) {
    for (const p of this.particles) {
      x.globalAlpha = clamp(p.life / p.max, 0, 1);
      x.fillStyle = p.color;
      x.beginPath(); x.arc(p.x, p.y, p.size, 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
    for (const r of this.rings) {
      x.globalAlpha = clamp(r.life / r.max, 0, 1) * 0.85;
      x.strokeStyle = r.color;
      x.lineWidth = r.width;
      x.beginPath(); x.arc(r.x, r.y, r.r, 0, TAU); x.stroke();
    }
    x.globalAlpha = 1;
    for (const s of this.slashes) {
      x.save();
      x.translate(s.x, s.y);
      x.rotate(s.angle);
      x.globalAlpha = clamp(s.life / s.max, 0, 1) * 0.9;
      x.strokeStyle = s.color;
      x.lineWidth = 4;
      x.lineCap = 'round';
      x.beginPath(); x.arc(0, 0, s.radius, -s.arc / 2, s.arc / 2); x.stroke();
      x.globalAlpha *= 0.45;
      x.lineWidth = 10;
      x.beginPath(); x.arc(0, 0, s.radius - 3, -s.arc / 2, s.arc / 2); x.stroke();
      x.restore();
    }
    x.globalAlpha = 1;
  }

  drawTexts(x) {
    for (const t of this.texts) {
      const a = clamp(t.life / t.max, 0, 1);
      x.save();
      x.globalAlpha = a;
      x.textAlign = 'center';
      x.font = `${t.crit ? '800' : '700'} ${t.size}px "Trebuchet MS", system-ui, sans-serif`;
      x.lineWidth = 3;
      x.strokeStyle = 'rgba(0,0,0,.55)';
      x.strokeText(t.text, t.x, t.y);
      x.fillStyle = t.color;
      x.fillText(t.text, t.x, t.y);
      x.restore();
    }
  }

  drawHero(x, p, t) {
    const cls = this.cls;
    const bob = Math.sin(t * (p.moving ? 11 : 5)) * (p.moving ? 1.7 : 0.8);
    const swing = Math.sin(p.attackKick * Math.PI) * 0.7;
    x.save();
    x.translate(p.x, p.y + bob);

    if (p.shield > 0) {
      x.save();
      x.globalAlpha = 0.38 + Math.sin(t * 6) * 0.1;
      x.strokeStyle = '#fcd34d';
      x.lineWidth = 2;
      x.setLineDash([5, 5]);
      x.beginPath(); x.arc(0, 1, 26, 0, TAU); x.stroke();
      x.restore();
    }
    if (this.buffs.some(b => b.stat === 'atk')) {
      x.save();
      x.globalAlpha = 0.25 + Math.sin(t * 8) * 0.08;
      x.strokeStyle = '#5eead4';
      x.lineWidth = 2;
      x.beginPath(); x.arc(0, 2, 23, 0, TAU); x.stroke();
      x.restore();
    }

    if (cls.id === 'warrior') {
      x.fillStyle = '#5c1d1d';
      x.beginPath();
      x.moveTo(-9, -5); x.lineTo(0, 1); x.lineTo(9, -5);
      x.lineTo(7, 14); x.quadraticCurveTo(0, 19, -7, 14); x.closePath(); x.fill();
      x.fillStyle = '#1f2937';
      x.roundRect(-7.5, 7, 5, 10, 2); x.roundRect(2.5, 7, 5, 10, 2); x.fill();
      x.fillStyle = '#78350f';
      x.roundRect(-8.5, 15, 6.5, 3, 1.5); x.roundRect(2, 15, 6.5, 3, 1.5); x.fill();
      const g = x.createLinearGradient(0, -7, 0, 14);
      g.addColorStop(0, '#cbd5e1'); g.addColorStop(0.5, '#8493a8'); g.addColorStop(1, '#4b5563');
      x.fillStyle = g;
      x.beginPath(); x.roundRect(-10, -7, 20, 19, 4); x.fill();
      x.strokeStyle = '#f3c96b'; x.lineWidth = 1.4;
      x.beginPath(); x.moveTo(-9, -1); x.lineTo(9, -1); x.stroke();
      x.fillStyle = '#b45309'; x.fillRect(-9, 5.5, 18, 3);
      x.fillStyle = '#f3c96b'; x.fillRect(-2, 5.5, 4, 3);
      x.fillStyle = '#9ca3af';
      x.beginPath(); x.arc(-11, -3, 5.4, 0, TAU); x.arc(11, -3, 5.4, 0, TAU); x.fill();
      x.strokeStyle = '#f3c96b'; x.lineWidth = 1.2;
      x.beginPath(); x.arc(-11, -3, 4, 0, TAU); x.arc(11, -3, 4, 0, TAU); x.stroke();
      x.fillStyle = '#e8b48c';
      x.beginPath(); x.arc(0, -12, 6.6, 0, TAU); x.fill();
      x.fillStyle = '#cbd5e1';
      x.beginPath(); x.arc(0, -13, 7, Math.PI, TAU); x.lineTo(6.7, -10); x.lineTo(3.4, -12.2); x.lineTo(2.2, -8.4); x.lineTo(-2.2, -8.4); x.lineTo(-3.4, -12.2); x.lineTo(-6.7, -10); x.closePath(); x.fill();
      x.strokeStyle = '#64748b'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(0, -14); x.lineTo(0, -8); x.stroke();
      x.fillStyle = '#ef4444';
      x.beginPath(); x.moveTo(-1, -19); x.quadraticCurveTo(4, -23, 7, -16); x.quadraticCurveTo(3, -17, 1, -15); x.closePath(); x.fill();
      x.save();
      x.translate(12, 2); x.rotate(p.facing + swing - 0.25);
      x.strokeStyle = '#d6b25e'; x.lineWidth = 3.2;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(5, 0); x.stroke();
      x.fillStyle = '#f3c96b';
      x.fillRect(-5, -4, 2.2, 8);
      const blade = x.createLinearGradient(5, 0, 28, 0);
      blade.addColorStop(0, '#f8fafc'); blade.addColorStop(1, '#cbd5e1');
      x.fillStyle = blade;
      x.beginPath(); x.moveTo(5, -2.7); x.lineTo(27, -1); x.lineTo(31, 0); x.lineTo(27, 1); x.lineTo(5, 2.7); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(7, 0); x.lineTo(27, 0); x.stroke();
      x.restore();
      x.fillStyle = '#94a3b8';
      x.beginPath(); x.roundRect(-17, -3, 11, 15, 4); x.fill();
      x.strokeStyle = '#f3c96b'; x.lineWidth = 1.2;
      x.beginPath(); x.roundRect(-15.5, -1.5, 8, 12, 3); x.stroke();
      x.beginPath(); x.moveTo(-11.5, 0); x.lineTo(-11.5, 9); x.stroke();
    } else if (cls.id === 'mage') {
      x.fillStyle = '#2e1065';
      x.beginPath();
      x.moveTo(-8, -4); x.lineTo(8, -4); x.lineTo(14, 19);
      x.quadraticCurveTo(0, 24, -14, 19); x.closePath(); x.fill();
      const rg = x.createLinearGradient(-12, -4, 12, 18);
      rg.addColorStop(0, '#7c3aed'); rg.addColorStop(0.6, '#4c1d95'); rg.addColorStop(1, '#2e1065');
      x.fillStyle = rg;
      x.beginPath();
      x.moveTo(-9, -5); x.lineTo(0, -8); x.lineTo(9, -5); x.lineTo(12, 17);
      x.quadraticCurveTo(0, 21, -12, 17); x.closePath(); x.fill();
      x.strokeStyle = '#c4b5fd'; x.lineWidth = 1.1;
      x.beginPath(); x.moveTo(-10, 12); x.quadraticCurveTo(0, 16, 10, 12); x.stroke();
      x.fillStyle = '#fbbf24';
      x.beginPath(); x.arc(0, 4, 2, 0, TAU); x.fill();
      x.fillStyle = '#f5d0fe';
      x.beginPath(); x.arc(0, -13, 6.4, 0, TAU); x.fill();
      x.fillStyle = '#3b0764';
      x.beginPath(); x.arc(0, -12.5, 5.4, 0, TAU); x.fill();
      x.fillStyle = '#5eead4';
      x.beginPath(); x.arc(-2, -12.5, 1.15, 0, TAU); x.arc(2, -12.5, 1.15, 0, TAU); x.fill();
      x.fillStyle = '#7c3aed';
      x.beginPath();
      x.moveTo(-8, -15); x.quadraticCurveTo(0, -27, 8, -15);
      x.quadraticCurveTo(0, -18, -8, -15); x.fill();
      x.save();
      x.translate(10, 1); x.rotate(p.facing + swing * 0.3);
      x.strokeStyle = '#a78bfa'; x.lineWidth = 2.2;
      x.beginPath(); x.moveTo(-11, 0); x.lineTo(18, 0); x.stroke();
      x.fillStyle = '#fbbf24';
      x.beginPath(); x.arc(-12, 0, 2.2, 0, TAU); x.fill();
      x.shadowColor = '#67e8f9'; x.shadowBlur = 16;
      x.fillStyle = '#a5f3fc';
      x.beginPath(); x.arc(21, 0, 4.6, 0, TAU); x.fill();
      x.fillStyle = '#ecfeff';
      x.beginPath(); x.arc(21, 0, 2, 0, TAU); x.fill();
      x.restore();
      for (let i = 0; i < 3; i++) {
        const a = t * 1.5 + i * TAU / 3;
        const orbX = Math.cos(a) * 21;
        const orbY = Math.sin(a) * 12 - 2;
        x.globalAlpha = 0.5 + Math.sin(t * 3 + i) * 0.2;
        x.fillStyle = '#c4b5fd';
        x.beginPath(); x.arc(orbX, orbY, 1.7, 0, TAU); x.fill();
      }
      x.globalAlpha = 1;
    } else {
      // Archer
      x.fillStyle = '#134e4a';
      x.beginPath();
      x.moveTo(-9, -4); x.quadraticCurveTo(-17, 8, -12, 17); x.lineTo(-4, 13); x.closePath(); x.fill();
      x.fillStyle = '#1f2937';
      x.roundRect(-7.5, 7, 5, 10, 2); x.roundRect(2.5, 7, 5, 10, 2); x.fill();
      x.fillStyle = '#0f766e';
      x.roundRect(-8.5, 15, 6.5, 3, 1.5); x.roundRect(2, 15, 6.5, 3, 1.5); x.fill();
      const ag = x.createLinearGradient(0, -6, 0, 14);
      ag.addColorStop(0, '#2dd4bf'); ag.addColorStop(1, '#115e59');
      x.fillStyle = ag;
      x.beginPath(); x.roundRect(-9, -6, 18, 18, 5); x.fill();
      x.strokeStyle = '#f3c96b'; x.lineWidth = 1.1;
      x.beginPath(); x.moveTo(-8, 2); x.lineTo(8, 2); x.stroke();
      x.fillStyle = '#f3c96b';
      x.beginPath(); x.moveTo(6, -3); x.lineTo(12, 11); x.lineTo(8, 13); x.lineTo(2, -1); x.closePath(); x.fill();
      x.fillStyle = '#e8b48c';
      x.beginPath(); x.arc(0, -12, 6.2, 0, TAU); x.fill();
      x.fillStyle = '#0f766e';
      x.beginPath(); x.arc(0, -13.5, 7.2, Math.PI * 0.85, Math.PI * 2.15); x.lineTo(6, -8); x.lineTo(2, -10); x.lineTo(0, -7.5); x.lineTo(-2, -10); x.lineTo(-6, -8); x.closePath(); x.fill();
      x.fillStyle = '#fbbf24';
      x.beginPath(); x.arc(-2.3, -12, 0.9, 0, TAU); x.arc(2.3, -12, 0.9, 0, TAU); x.fill();
      x.save();
      x.translate(10, 0); x.rotate(p.facing + swing * 0.55);
      x.strokeStyle = '#d6b25e'; x.lineWidth = 1.8;
      x.beginPath(); x.arc(0, 0, 17, -1.15, 1.15); x.stroke();
      x.strokeStyle = 'rgba(226,232,240,.85)'; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(6.9, -15.5); x.lineTo(6.9, 15.5); x.stroke();
      if (p.attackKick > 0.1) {
        x.strokeStyle = '#99f6e4'; x.lineWidth = 1.6;
        x.beginPath(); x.moveTo(4, 0); x.lineTo(29, 0); x.stroke();
        x.fillStyle = '#5eead4';
        x.beginPath(); x.moveTo(32, 0); x.lineTo(26, -3); x.lineTo(26, 3); x.closePath(); x.fill();
      }
      x.restore();
      x.fillStyle = '#0d9488';
      x.beginPath(); x.moveTo(-8, 2); x.quadraticCurveTo(-18, 5, -19, 11); x.quadraticCurveTo(-13, 7, -6, 8); x.closePath(); x.fill();
    }

    if (p.hurtFlash > 0) {
      x.globalAlpha = Math.min(0.55, p.hurtFlash * 0.5);
      x.fillStyle = '#fecaca';
      x.beginPath(); x.arc(0, -1, 20, 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
    x.restore();
  }

  drawEnemy(x, e, t) {
    if (e.boss) { this.drawBoss(x, e, t); return; }
    const bob = Math.sin(t * 3.2 + e.bob) * (e.look === 'wisp' ? 3 : 1);
    x.save();
    x.translate(e.x, e.y + bob);
    const facing = this.player.x < e.x ? -1 : 1;
    x.scale(facing, 1);
    const r = e.r;
    const color = e.color || '#f87171';

    if (e.elite) {
      x.save();
      x.globalAlpha = 0.75;
      x.strokeStyle = '#f3c96b';
      x.lineWidth = 1.4;
      x.setLineDash([3, 4]);
      x.beginPath(); x.arc(0, 0, r + 5, 0, TAU); x.stroke();
      x.restore();
    }

    switch (e.look) {
      case 'wisp': {
        const g = x.createRadialGradient(0, 0, 1, 0, 0, r * 2.4);
        g.addColorStop(0, this.hexA(color, 0.55));
        g.addColorStop(1, this.hexA(color, 0));
        x.fillStyle = g;
        x.beginPath(); x.arc(0, 0, r * 2.4, 0, TAU); x.fill();
        x.fillStyle = color;
        x.beginPath(); x.arc(0, 0, r * 0.85, 0, TAU); x.fill();
        x.fillStyle = '#fff7ed';
        x.beginPath(); x.arc(0, 0, r * 0.42, 0, TAU); x.fill();
        x.strokeStyle = this.hexA(color, 0.55);
        x.lineWidth = 2.5;
        x.beginPath();
        x.moveTo(-r * 0.4, r * 0.5);
        x.quadraticCurveTo(-r * 1.4, r * 1.5, -r * 0.3, r * 2.1);
        x.quadraticCurveTo(r * 0.8, r * 2.6, r * 0.4, r * 3.2);
        x.stroke();
        x.fillStyle = '#1e1b4b';
        x.beginPath(); x.arc(-3, -2, 1.2, 0, TAU); x.arc(3, -2, 1.2, 0, TAU); x.fill();
        break;
      }
      case 'brute': {
        const g = x.createRadialGradient(-r * 0.3, -r * 0.4, 2, 0, 0, r * 1.2);
        g.addColorStop(0, this.hexA(color, 0.95));
        g.addColorStop(0.65, this.hexA(color, 0.55));
        g.addColorStop(1, '#1c1917');
        x.fillStyle = g;
        x.beginPath(); x.ellipse(0, 0, r * 1.05, r * 1.15, 0, 0, TAU); x.fill();
        x.fillStyle = '#1c1917';
        x.beginPath(); x.arc(-r * 0.95, r * 0.25, r * 0.42, 0, TAU); x.arc(r * 0.95, r * 0.25, r * 0.42, 0, TAU); x.fill();
        x.strokeStyle = '#fde68a'; x.lineWidth = 1.6;
        x.beginPath(); x.arc(-r * 0.95, r * 0.25, r * 0.42, 0, TAU); x.arc(r * 0.95, r * 0.25, r * 0.42, 0, TAU); x.stroke();
        x.fillStyle = '#292524';
        x.beginPath();
        x.moveTo(-r * 0.7, -r * 0.9); x.lineTo(-r * 0.45, -r * 1.5); x.lineTo(-r * 0.2, -r * 0.95); x.closePath(); x.fill();
        x.beginPath();
        x.moveTo(r * 0.7, -r * 0.9); x.lineTo(r * 0.45, -r * 1.5); x.lineTo(r * 0.2, -r * 0.95); x.closePath(); x.fill();
        x.fillStyle = '#fbbf24';
        x.beginPath(); x.arc(-r * 0.28, -r * 0.2, 2.2, 0, TAU); x.arc(r * 0.28, -r * 0.2, 2.2, 0, TAU); x.fill();
        x.strokeStyle = this.hexA('#fde68a', 0.55); x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(-r * 0.4, r * 0.35); x.lineTo(-r * 0.1, r * 0.5); x.lineTo(r * 0.1, r * 0.3); x.stroke();
        break;
      }
      case 'stalker': {
        x.fillStyle = 'rgba(15,23,42,.92)';
        x.beginPath();
        x.moveTo(-r, r * 0.7); x.quadraticCurveTo(-r * 1.1, -r * 0.9, 0, -r * 1.2);
        x.quadraticCurveTo(r * 1.1, -r * 0.9, r, r * 0.7);
        x.quadraticCurveTo(0, r * 1.15, -r, r * 0.7); x.fill();
        x.fillStyle = '#020617';
        x.beginPath(); x.arc(0, -r * 0.3, r * 0.62, 0, TAU); x.fill();
        x.fillStyle = color;
        x.shadowColor = color; x.shadowBlur = 10;
        x.beginPath(); x.ellipse(-r * 0.25, -r * 0.32, 1.8, 1.1, 0, 0, TAU); x.ellipse(r * 0.25, -r * 0.32, 1.8, 1.1, 0, 0, TAU); x.fill();
        x.shadowBlur = 0;
        x.strokeStyle = this.hexA(color, 0.75); x.lineWidth = 1.6;
        x.beginPath(); x.moveTo(-r * 0.8, r * 0.5); x.lineTo(-r * 1.4, r * 0.9); x.moveTo(-r * 0.8, r * 0.7); x.lineTo(-r * 1.35, r * 1.2); x.stroke();
        x.beginPath(); x.moveTo(r * 0.8, r * 0.5); x.lineTo(r * 1.4, r * 0.9); x.moveTo(r * 0.8, r * 0.7); x.lineTo(r * 1.35, r * 1.2); x.stroke();
        x.globalAlpha = 0.3;
        x.strokeStyle = color;
        x.beginPath(); x.arc(0, 0, r * 1.4, 0.4, 2.1); x.stroke();
        break;
      }
      case 'shaman': {
        x.fillStyle = '#1a2e05';
        x.beginPath();
        x.moveTo(-r * 0.7, -r * 0.2); x.lineTo(r * 0.7, -r * 0.2); x.lineTo(r, r * 1.3);
        x.quadraticCurveTo(0, r * 1.55, -r, r * 1.3); x.closePath(); x.fill();
        x.strokeStyle = color; x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(-r * 0.65, r * 0.6); x.quadraticCurveTo(0, r * 0.9, r * 0.65, r * 0.6); x.stroke();
        x.fillStyle = '#e7e5e4';
        x.beginPath(); x.ellipse(0, -r * 0.55, r * 0.42, r * 0.52, 0, 0, TAU); x.fill();
        x.fillStyle = '#1a2e05';
        x.beginPath(); x.arc(-r * 0.14, -r * 0.6, 1.4, 0, TAU); x.arc(r * 0.14, -r * 0.6, 1.4, 0, TAU); x.fill();
        x.strokeStyle = '#854d0e'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(r * 0.75, r * 0.8); x.lineTo(r * 1.1, -r * 1.3); x.stroke();
        x.fillStyle = color;
        x.shadowColor = color; x.shadowBlur = 10;
        x.beginPath(); x.arc(r * 1.15, -r * 1.4, 3, 0, TAU); x.fill();
        x.shadowBlur = 0;
        break;
      }
      default: {
        // crawler
        const legPhase = Math.sin(t * 8 + e.bob) * 3;
        x.strokeStyle = this.hexA(color, 0.85);
        x.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const off = (i - 1) * r * 0.45;
          x.beginPath();
          x.moveTo(-r * 0.65, off * 0.4);
          x.lineTo(-r * 1.45, off + legPhase);
          x.moveTo(r * 0.65, off * 0.4);
          x.lineTo(r * 1.45, off - legPhase);
          x.stroke();
        }
        const g = x.createRadialGradient(-r * 0.2, -r * 0.3, 1, 0, 0, r * 1.1);
        g.addColorStop(0, this.hexA(color, 0.9));
        g.addColorStop(1, '#1c1917');
        x.fillStyle = g;
        x.beginPath(); x.ellipse(0, 0, r, r * 0.78, 0, 0, TAU); x.fill();
        x.fillStyle = '#1c1917';
        x.beginPath(); x.ellipse(0, -r * 0.15, r * 0.45, r * 0.55, 0, 0, TAU); x.fill();
        x.fillStyle = '#fff7ed';
        x.beginPath(); x.arc(-r * 0.25, -r * 0.3, 1.2, 0, TAU); x.arc(r * 0.25, -r * 0.3, 1.2, 0, TAU); x.fill();
        x.strokeStyle = this.hexA(color, 0.6); x.lineWidth = 1;
        x.beginPath(); x.moveTo(-r * 0.55, r * 0.25); x.lineTo(0, r * 0.35); x.lineTo(r * 0.55, r * 0.25); x.stroke();
      }
    }

    if (e.elite) {
      x.fillStyle = '#f3c96b';
      x.beginPath();
      x.moveTo(-6, -r - 12); x.lineTo(-3, -r - 7); x.lineTo(0, -r - 12); x.lineTo(3, -r - 7); x.lineTo(6, -r - 12);
      x.lineTo(5, -r - 4); x.lineTo(-5, -r - 4); x.closePath(); x.fill();
    }

    if (e.hitFlash > 0) {
      x.globalAlpha = Math.min(0.6, e.hitFlash * 4);
      x.fillStyle = '#fff';
      x.beginPath(); x.ellipse(0, 0, r * 1.05, r * 1.1, 0, 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
    x.restore();

    if (e.freeze > 0) {
      x.save();
      x.globalAlpha = 0.4 + Math.sin(t * 6) * 0.1;
      x.strokeStyle = '#7dd3fc';
      x.fillStyle = 'rgba(125,211,252,.14)';
      x.lineWidth = 1.6;
      x.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = t * 0.6 + i * TAU / 6;
        const xx = e.x + Math.cos(a) * (e.r + 6);
        const yy = e.y + Math.sin(a) * (e.r + 6);
        if (i === 0) x.moveTo(xx, yy); else x.lineTo(xx, yy);
      }
      x.closePath(); x.fill(); x.stroke();
      x.restore();
    }
    if (e.stun > 0) {
      x.save();
      x.fillStyle = '#fde68a';
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + i * TAU / 3;
        x.globalAlpha = 0.7;
        x.beginPath();
        x.arc(e.x + Math.cos(a) * (e.r + 7), e.y - e.r - 9 + Math.sin(a) * 3, 1.5, 0, TAU);
        x.fill();
      }
      x.restore();
    }

    if (e.windup > 0) this.drawEnemyWindup(x, e);
    if (e.dashWindup > 0) {
      x.save();
      x.globalAlpha = 0.25;
      x.strokeStyle = e.color;
      x.lineWidth = 1.6;
      x.setLineDash([5, 6]);
      x.beginPath();
      x.moveTo(e.x, e.y);
      const len = 360;
      x.lineTo(e.x + Math.cos(e.attackAngle) * len, e.y + Math.sin(e.attackAngle) * len);
      x.stroke();
      x.restore();
    }
    this.drawEnemyBar(x, e);
  }

  drawEnemyWindup(x, e) {
    const progress = 1 - clamp(e.windup / (e.windupMax || this.windupOf(e)), 0, 1);
    x.save();
    x.globalAlpha = 0.16 + progress * 0.3;
    if (e.slam) {
      x.strokeStyle = e.color; x.fillStyle = e.color;
      x.beginPath(); x.arc(e.x, e.y, e.r + 52, 0, TAU); x.fill(); x.stroke();
    } else if (e.ranged) {
      x.strokeStyle = e.color;
      x.setLineDash([4, 7]);
      x.beginPath(); x.moveTo(e.x, e.y); x.lineTo(this.player.x, this.player.y); x.stroke();
    } else {
      x.translate(e.x, e.y);
      x.rotate(e.attackAngle);
      x.strokeStyle = e.color;
      x.fillStyle = this.hexA(e.color, 0.25);
      x.beginPath();
      x.moveTo(0, 0);
      x.arc(0, 0, (e.range || e.r + 34) + 16, -0.55, 0.55);
      x.closePath();
      x.fill(); x.stroke();
    }
    x.restore();
  }

  drawEnemyBar(x, e) {
    const width = e.boss ? 0 : Math.max(26, e.r * 2.1);
    if (!width) return;
    const yy = e.y - e.r - 13;
    const ratio = clamp(e.hp / e.maxHp, 0, 1);
    x.save();
    x.globalAlpha = 0.85;
    x.fillStyle = 'rgba(2,6,15,.8)';
    x.beginPath(); x.roundRect(e.x - width / 2, yy, width, 3.5, 2); x.fill();
    x.fillStyle = e.elite ? '#f3c96b' : '#f87171';
    x.beginPath(); x.roundRect(e.x - width / 2, yy, width * ratio, 3.5, 2); x.fill();
    x.restore();
  }

  drawBoss(x, e, t) {
    const r = e.r;
    const color = e.color;
    const bob = Math.sin(t * 2.2) * 2;
    x.save();
    x.translate(e.x, e.y + bob);

    const aura = x.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 2.3);
    aura.addColorStop(0, this.hexA(color, e.phase === 2 ? 0.28 : 0.14));
    aura.addColorStop(1, this.hexA(color, 0));
    x.fillStyle = aura;
    x.beginPath(); x.arc(0, 0, r * 2.3, 0, TAU); x.fill();

    x.strokeStyle = this.hexA(color, 0.4);
    x.lineWidth = 1.5;
    x.setLineDash([5, 9]);
    x.save();
    x.rotate(t * 0.4);
    x.beginPath(); x.arc(0, 0, r * 1.35, 0, TAU); x.stroke();
    x.restore();
    x.setLineDash([]);

    const face = this.player.x < e.x ? -1 : 1;
    x.scale(face, 1);

    if (e.look === 'brute') {
      const g = x.createRadialGradient(-r * 0.35, -r * 0.4, 3, 0, 0, r * 1.2);
      g.addColorStop(0, '#7f1d1d'); g.addColorStop(0.55, '#3f1515'); g.addColorStop(1, '#140a0a');
      x.fillStyle = g;
      x.beginPath(); x.ellipse(0, 0, r * 1.08, r * 1.18, 0, 0, TAU); x.fill();
      x.strokeStyle = this.hexA('#fca5a5', 0.5); x.lineWidth = 1.5;
      x.beginPath(); x.ellipse(0, 0, r * 1.08, r * 1.18, 0, 0, TAU); x.stroke();
      x.fillStyle = '#1c1917';
      x.beginPath(); x.arc(-r * 1.02, r * 0.15, r * 0.5, 0, TAU); x.arc(r * 1.02, r * 0.15, r * 0.5, 0, TAU); x.fill();
      x.strokeStyle = '#f3c96b'; x.lineWidth = 1.8;
      x.beginPath(); x.arc(-r * 1.02, r * 0.15, r * 0.45, 0, TAU); x.arc(r * 1.02, r * 0.15, r * 0.45, 0, TAU); x.stroke();
      x.fillStyle = '#292524';
      x.beginPath(); x.moveTo(-r * 0.78, -r * 0.9); x.quadraticCurveTo(-r * 0.65, -r * 1.8, -r * 0.18, -r * 1.25); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(r * 0.78, -r * 0.9); x.quadraticCurveTo(r * 0.65, -r * 1.8, r * 0.18, -r * 1.25); x.closePath(); x.fill();
      x.fillStyle = '#fbbf24';
      x.shadowColor = '#f59e0b'; x.shadowBlur = 12;
      x.beginPath(); x.arc(-r * 0.28, -r * 0.18, 3, 0, TAU); x.arc(r * 0.28, -r * 0.18, 3, 0, TAU); x.fill();
      x.shadowBlur = 0;
      x.strokeStyle = '#f97316'; x.lineWidth = 1.3;
      x.beginPath(); x.moveTo(-r * 0.35, r * 0.3); x.lineTo(-r * 0.12, r * 0.5); x.lineTo(r * 0.08, r * 0.28); x.lineTo(r * 0.35, r * 0.5); x.stroke();
      x.fillStyle = '#f3c96b';
      x.beginPath();
      x.moveTo(-r * 0.45, -r * 1.18); x.lineTo(-r * 0.32, -r * 1.45); x.lineTo(-r * 0.18, -r * 1.2);
      x.lineTo(0, -r * 1.5); x.lineTo(r * 0.18, -r * 1.2); x.lineTo(r * 0.32, -r * 1.45); x.lineTo(r * 0.45, -r * 1.18);
      x.lineTo(r * 0.36, -r * 1.05); x.lineTo(-r * 0.36, -r * 1.05); x.closePath(); x.fill();
    } else if (e.look === 'widow') {
      x.strokeStyle = this.hexA(color, 0.75);
      x.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const a = -0.7 + i * 0.46;
        const swing = Math.sin(t * 2.4 + i) * 0.1;
        for (const side of [-1, 1]) {
          x.beginPath();
          x.moveTo(side * r * 0.55, 0);
          x.quadraticCurveTo(side * r * 1.25, Math.sin(a) * r, side * (r * 1.55), Math.sin(a + swing) * r * 1.3);
          x.stroke();
        }
      }
      const g = x.createRadialGradient(-r * 0.2, -r * 0.3, 2, 0, 0, r * 1.1);
      g.addColorStop(0, '#67e8f9'); g.addColorStop(0.4, '#0e7490'); g.addColorStop(1, '#082f49');
      x.fillStyle = g;
      x.beginPath(); x.ellipse(0, r * 0.15, r * 0.9, r * 1.05, 0, 0, TAU); x.fill();
      x.fillStyle = '#083344';
      x.beginPath(); x.arc(0, -r * 0.62, r * 0.5, 0, TAU); x.fill();
      x.fillStyle = '#a5f3fc';
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU;
        x.beginPath(); x.arc(Math.cos(a) * r * 0.2, -r * 0.62 + Math.sin(a) * r * 0.16, 1.5, 0, TAU); x.fill();
      }
      x.fillStyle = '#ecfeff'; x.shadowColor = '#67e8f9'; x.shadowBlur = 10;
      x.beginPath(); x.arc(-r * 0.28, -r * 0.66, 2.2, 0, TAU); x.arc(r * 0.28, -r * 0.66, 2.2, 0, TAU); x.fill();
      x.shadowBlur = 0;
      x.fillStyle = this.hexA(color, 0.35);
      x.beginPath(); x.ellipse(0, r * 0.15, r * 0.45, r * 0.6, 0, 0, TAU); x.fill();
    } else if (e.look === 'oracle') {
      x.fillStyle = '#1a2e05';
      x.beginPath();
      x.moveTo(-r * 0.75, -r * 0.82); x.quadraticCurveTo(-r * 1.1, r * 0.3, -r * 1.25, r * 1.35);
      x.quadraticCurveTo(0, r * 1.7, r * 1.25, r * 1.35);
      x.quadraticCurveTo(r * 1.1, r * 0.3, r * 0.75, -r * 0.82); x.closePath(); x.fill();
      x.strokeStyle = this.hexA(color, 0.55); x.lineWidth = 1.4;
      x.beginPath(); x.moveTo(-r * 0.8, r * 0.8); x.quadraticCurveTo(0, r * 1.12, r * 0.8, r * 0.8); x.stroke();
      for (let i = 0; i < 3; i++) {
        const a = t * 0.8 + i * TAU / 3;
        const ox = Math.cos(a) * r * 1.45;
        const oy = Math.sin(a) * r * 0.6 - r * 0.2;
        x.fillStyle = this.hexA(color, 0.65);
        x.shadowColor = color; x.shadowBlur = 10;
        x.beginPath(); x.arc(ox, oy, 4.5, 0, TAU); x.fill();
        x.shadowBlur = 0;
      }
      x.fillStyle = '#e7e5e4';
      x.beginPath(); x.ellipse(0, -r * 0.7, r * 0.42, r * 0.55, 0, 0, TAU); x.fill();
      x.fillStyle = '#1a2e05';
      x.beginPath(); x.arc(-r * 0.13, -r * 0.73, 1.7, 0, TAU); x.arc(r * 0.13, -r * 0.73, 1.7, 0, TAU); x.fill();
      x.strokeStyle = '#4d7c0f'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(-r * 0.35, -r * 1.15); x.quadraticCurveTo(0, -r * 1.45, r * 0.35, -r * 1.15); x.stroke();
    } else if (e.look === 'tyrant') {
      const g = x.createLinearGradient(0, -r, 0, r);
      g.addColorStop(0, '#1e3a8a'); g.addColorStop(0.6, '#172554'); g.addColorStop(1, '#020617');
      x.fillStyle = g;
      x.beginPath(); x.roundRect(-r * 0.85, -r, r * 1.7, r * 2, r * 0.4); x.fill();
      x.strokeStyle = '#93c5fd'; x.lineWidth = 1.5;
      x.beginPath(); x.roundRect(-r * 0.85, -r, r * 1.7, r * 2, r * 0.4); x.stroke();
      x.fillStyle = '#1e293b';
      x.beginPath(); x.arc(-r * 0.95, -r * 0.3, r * 0.45, 0, TAU); x.arc(r * 0.95, -r * 0.3, r * 0.45, 0, TAU); x.fill();
      x.strokeStyle = '#93c5fd'; x.beginPath(); x.arc(-r * 0.95, -r * 0.3, r * 0.38, 0, TAU); x.arc(r * 0.95, -r * 0.3, r * 0.38, 0, TAU); x.stroke();
      x.fillStyle = '#0f172a';
      x.beginPath(); x.arc(0, -r * 0.72, r * 0.48, 0, TAU); x.fill();
      x.strokeStyle = '#93c5fd'; x.lineWidth = 1.3;
      x.beginPath(); x.arc(0, -r * 0.72, r * 0.4, 0, TAU); x.stroke();
      x.fillStyle = '#e0f2fe'; x.shadowColor = '#93c5fd'; x.shadowBlur = 10;
      x.beginPath(); x.arc(-r * 0.14, -r * 0.74, 2.1, 0, TAU); x.arc(r * 0.14, -r * 0.74, 2.1, 0, TAU); x.fill();
      x.shadowBlur = 0;
      x.strokeStyle = '#93c5fd'; x.lineWidth = 2.4;
      for (let i = 0; i < 3; i++) {
        const sx = -r + i * r;
        x.beginPath();
        x.moveTo(sx, -r * 0.6);
        x.lineTo(sx + Math.sin(t * 6 + i) * 8, -r * 1.2);
        x.lineTo(sx + Math.cos(t * 5 + i) * 7, -r * 1.7);
        x.stroke();
      }
      x.fillStyle = '#f3c96b';
      x.beginPath();
      x.moveTo(-r * 0.42, -r * 1.15); x.lineTo(-r * 0.25, -r * 1.5); x.lineTo(-r * 0.08, -r * 1.2);
      x.lineTo(0, -r * 1.58); x.lineTo(r * 0.08, -r * 1.2); x.lineTo(r * 0.25, -r * 1.5); x.lineTo(r * 0.42, -r * 1.15);
      x.closePath(); x.fill();
    } else {
      // sovereign
      const g = x.createRadialGradient(-r * 0.2, -r * 0.3, 2, 0, 0, r);
      g.addColorStop(0, '#f0abfc'); g.addColorStop(0.35, '#a21caf'); g.addColorStop(1, '#1e1b4b');
      x.fillStyle = g;
      x.beginPath(); x.arc(0, 0, r * 0.95, 0, TAU); x.fill();
      x.strokeStyle = '#f5d0fe'; x.lineWidth = 1.4;
      x.beginPath(); x.arc(0, 0, r * 0.95, 0, TAU); x.stroke();
      for (let i = 0; i < 9; i++) {
        const a = t * 0.5 + i * TAU / 9;
        x.strokeStyle = this.hexA('#e879f9', 0.55);
        x.lineWidth = 1.6;
        x.beginPath();
        x.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
        x.quadraticCurveTo(Math.cos(a + 0.2) * r * 1.35, Math.sin(a + 0.2) * r * 1.35, Math.cos(a + 0.1) * r * 1.7, Math.sin(a + 0.1) * r * 1.7);
        x.stroke();
      }
      x.fillStyle = '#fef3c7'; x.shadowColor = '#e879f9'; x.shadowBlur = 18;
      x.beginPath(); x.ellipse(0, 0, r * 0.38, r * 0.5, 0, 0, TAU); x.fill();
      x.shadowBlur = 0;
      x.fillStyle = '#3b0764';
      x.beginPath(); x.ellipse(0, 0, r * 0.13, r * 0.34, 0, 0, TAU); x.fill();
      x.fillStyle = '#facc15';
      x.beginPath();
      x.moveTo(-r * 0.42, -r * 0.85); x.lineTo(-r * 0.28, -r * 1.25); x.lineTo(-r * 0.1, -r * 0.9);
      x.lineTo(0.05 * r, -r * 1.35); x.lineTo(r * 0.18, -r * 0.9); x.lineTo(r * 0.35, -r * 1.22); x.lineTo(r * 0.45, -r * 0.82);
      x.closePath(); x.fill();
    }

    if (e.hitFlash > 0) {
      x.globalAlpha = Math.min(0.6, e.hitFlash * 4);
      x.fillStyle = '#fff';
      x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
    x.restore();

    if (e.windup > 0) {
      x.save();
      const progress = 1 - clamp(e.windup / 0.62, 0, 1);
      x.globalAlpha = 0.18 + progress * 0.32;
      x.translate(e.x, e.y); x.rotate(e.attackAngle);
      x.fillStyle = color; x.strokeStyle = color;
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, r + 62, -0.5, 0.5); x.closePath(); x.fill(); x.stroke();
      x.restore();
    }
  }
}
