import {
  GAME, WORLD, REGIONS, MONSTERS, CLASSES, FACTIONS, MOUNTS, PETS, WINGS,
  WEAPON_EFFECTS, COSTUMES, PRICES, SLOTS,
} from './config.js';
import {
  computeStats, syncVitals, gainXp, addItem, addGold, rollEquipmentDrop, itemInfo,
  equipItem, notifyKill, claimQuest, progressBounty, ensureQuest, saveState, restoreMana,
  spendMana, serialize, healState,
} from './state.js';
import { World } from './world.js';
import { drawHero, drawMonster, drawPet, drawWings, clamp, lerp, TAU, rgba, shade } from './art.js';

const TILE = WORLD.tileW;
const TILE_H = WORLD.tileH;

const WEATHER = {
  petals: { count: 42, color: ['#ffd6e0', '#fff0bd', '#d6ffc5'], speed: 18, sway: 24, size: [2, 4], kind: 'petal' },
  dust: { count: 55, color: ['#e0c38b', '#bda475'], speed: 9, sway: 10, size: [1, 3], kind: 'dot' },
  spores: { count: 50, color: ['#b6ff88', '#d8ffa0', '#79e6c4'], speed: 7, sway: 18, size: [1.4, 3.4], kind: 'glow' },
  mist: { count: 22, color: ['#c7d6e4'], speed: 6, sway: 30, size: [60, 130], kind: 'mist' },
  snow: { count: 90, color: ['#ffffff', '#d9f3ff'], speed: 24, sway: 16, size: [1, 3], kind: 'dot' },
  ash: { count: 70, color: ['#ff9a62', '#a57b6d', '#ffcf92'], speed: 12, sway: 25, size: [1, 3], kind: 'ember' },
  stars: { count: 55, color: ['#c8bfff', '#8fe6ff', '#ffffff'], speed: 2, sway: 12, size: [1, 2.4], kind: 'star' },
};

function isoAngle(dx, dy) { return Math.atan2(dy, dx); }

export class Game {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.running = false;
    this.lastTime = 0;
    this.time = 0;
    this.accumSave = 0;
    this.ui = null;
    this.paused = false;
    this.modalOpen = false;
    this.region = null;
    this.world = null;
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.zones = [];
    this.pickups = [];
    this.texts = [];
    this.particles = [];
    this.weather = [];
    this.interactable = null;
    this.target = null;
    this.camera = { x: 0, y: 0, zoom: 0.9, shakeX: 0, shakeY: 0, shake: 0 };
    this.input = { up: false, down: false, left: false, right: false, vector: { x: 0, y: 0 }, target: null, pointerActive: false };
    this.playerAttackTimer = 0;
    this.playerAttackCooldown = 0;
    this.skillCooldown = 0;
    this.potionCooldown = 0;
    this.hitStop = 0;
    this.bossVisible = null;
    this.fps = 60;
    this.lowPower = false;
    this._bindEvents();
    this.resize();
  }

  _bindEvents() {
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    const blocked = (target) => target && (target.closest('input, textarea, select, [contenteditable]') || this.modalOpen);
    this._onKeyDown = (e) => {
      if (blocked(e.target)) return;
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) { this.input.up = true; e.preventDefault(); }
      if (['s', 'arrowdown'].includes(key)) { this.input.down = true; e.preventDefault(); }
      if (['a', 'arrowleft'].includes(key)) { this.input.left = true; e.preventDefault(); }
      if (['d', 'arrowright'].includes(key)) { this.input.right = true; e.preventDefault(); }
      if (key === ' ' || key === 'spacebar') { this.tryAttack(); e.preventDefault(); }
      if (key === 'q') { this.trySkill(); e.preventDefault(); }
      if (key === 'e' || key === 'f') { this.interact(); e.preventDefault(); }
      if (key === 'r') { this.usePotion('health'); }
      if (key === 'm') this.ui?.openPanel('map');
      if (key === 'i' || key === 'b') this.ui?.openPanel('inventory');
    };
    this._onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(key)) this.input.up = false;
      if (['s', 'arrowdown'].includes(key)) this.input.down = false;
      if (['a', 'arrowleft'].includes(key)) this.input.left = false;
      if (['d', 'arrowright'].includes(key)) this.input.right = false;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this._onCanvasClick = (e) => {
      if (this.modalOpen || !this.player) return;
      const r = this.canvas.getBoundingClientRect();
      const sx = e.clientX - r.left, sy = e.clientY - r.top;
      // Ignore controls (they're DOM, but be defensive on mobile).
      if (e.target !== this.canvas) return;
      this.setMoveTargetFromScreen(sx, sy);
    };
    this.canvas.addEventListener('pointerdown', this._onCanvasClick);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(320, rect.width || window.innerWidth);
    this.height = Math.max(240, rect.height || window.innerHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.camera.zoom = clamp(this.width / 1480, 0.64, 0.98);
    if (this.world && this.player) {
      const p = this.world.iso(this.player.x, this.player.y);
      this.camera.x = p.x; this.camera.y = p.y;
    }
  }

  setModal(open) {
    this.modalOpen = !!open;
    this.paused = !!open;
    if (open) { this.input.up = this.input.down = this.input.left = this.input.right = false; this.input.vector = { x: 0, y: 0 }; }
  }

  makePlayer(state) {
    const loc = state.location;
    const regionId = loc?.regionId || 'greendale';
    const region = REGIONS[regionId];
    const fallback = { x: region.village.x, y: region.village.y + 2 };
    const p = {
      x: loc?.x ?? fallback.x, y: loc?.y ?? fallback.y,
      facing: 1, direction: 'down', moving: false, walkPhase: 0,
      attackTimer: 0, invuln: 0, hitFlash: 0, dead: false,
      deathTimer: 0, mountBob: 0,
    };
    return p;
  }

  async begin(state = this.state) {
    this.state = state;
    this.player = this.makePlayer(state);
    const regionId = state.location?.regionId || 'greendale';
    await this.setRegion(regionId, { spawn: null, instant: true });
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  async setRegion(regionId, opts = {}) {
    const region = REGIONS[regionId];
    if (!region) return;
    this.ui?.setLoading(true, `Waking the ${region.name}...`);
    await new Promise((r) => setTimeout(r, 30));
    this.region = region;
    this.regionId = regionId;
    this.world = new World(regionId);
    if (!opts.spawn) {
      if (this.player?.regionId === regionId) {
        // keep
      } else if (this.state.location?.regionId === regionId && !opts.resetPosition) {
        this.player.x = this.state.location.x; this.player.y = this.state.location.y;
      } else {
        this.player.x = region.village.x; this.player.y = region.village.y + 2.3;
      }
    } else if (opts.spawn === 'village') {
      this.player.x = region.village.x; this.player.y = region.village.y + 2.5;
    } else if (opts.spawn === 'dungeon') {
      this.player.x = region.dungeon.x; this.player.y = region.dungeon.y + 3.5;
    } else if (typeof opts.spawn === 'object') {
      this.player.x = opts.spawn.x; this.player.y = opts.spawn.y;
    }
    this.player.regionId = regionId;
    this.player.dead = false;
    this.player.invuln = 1.2;
    this.enemies = this.world.spawns.map((s, index) => this.makeEnemy(s, index));
    this.projectiles = [];
    this.effects = [];
    this.zones = [];
    this.pickups = [];
    this.texts = [];
    this.bossVisible = null;
    const p = this.world.iso(this.player.x, this.player.y);
    this.camera.x = p.x; this.camera.y = p.y;
    this.initWeather();
    ensureQuest(this.state, regionId);
    if (!this.state.visitedRegions.includes(regionId)) this.state.visitedRegions.push(regionId);
    if (!this.state.waypoints.includes(regionId)) this.state.waypoints.push(regionId);
    this.state.location = { regionId, x: this.player.x, y: this.player.y };
    syncVitals(this.state);
    this.ui?.onRegionChanged(region);
    this.ui?.refreshHud(true);
    this.ui?.setLoading(false);
    this.saveSoon(true);
  }

  makeEnemy(spawn, index) {
    const def = MONSTERS[spawn.monster] || MONSTERS.moss_wolf;
    const p = this.world.iso(spawn.x, spawn.y);
    return {
      id: `${spawn.monster}_${index}`, def, x: spawn.x, y: spawn.y, homeX: spawn.x, homeY: spawn.y,
      hp: def.hp, maxHp: def.hp, alive: true, isBoss: !!spawn.boss || !!def.boss, elite: !!spawn.elite || !!def.elite,
      facing: 1, state: 'idle', aggro: false, attackTimer: 0.8 + Math.random(), attackAnim: 0,
      hitFlash: 0, respawnTimer: 0, walkPhase: Math.random() * TAU, moving: false, telegraph: 0,
      seed: index * 2.3, spawn, p,
    };
  }

  initWeather() {
    const cfg = WEATHER[this.region.weather] || WEATHER.petals;
    this.weather = [];
    for (let i = 0; i < cfg.count; i++) {
      this.weather.push({
        x: Math.random() * this.width, y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * cfg.sway, vy: cfg.speed * (0.5 + Math.random()),
        size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
        phase: Math.random() * TAU, color: cfg.color[Math.floor(Math.random() * cfg.color.length)],
        alpha: 0.25 + Math.random() * 0.55,
      });
    }
  }

  loop(now) {
    if (!this.running) return;
    const dtRaw = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    if (!this.paused) {
      if (this.hitStop > 0) { this.hitStop -= dtRaw; }
      else this.update(dtRaw);
    }
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.time += dt;
    if (!this.player || !this.world) return;
    this.accumSave += dt;
    this.state.stats.playSeconds = (this.state.stats.playSeconds || 0) + dt;
    if (this.accumSave > 12) { this.saveSoon(); this.accumSave = 0; }
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updateEffects(dt);
    this.updatePickups(dt);
    this.updateCamera(dt);
    this.updateWeather(dt);
    this.interactable = this.world.nearInteractable(this.player.x, this.player.y, 1.55);
    if (this.playerAttackCooldown > 0) this.playerAttackCooldown -= dt;
    if (this.skillCooldown > 0) this.skillCooldown -= dt;
    if (this.potionCooldown > 0) this.potionCooldown -= dt;
    if (this.player.attackTimer > 0) this.player.attackTimer = Math.max(0, this.player.attackTimer - dt);
    if (this.player.invuln > 0) this.player.invuln -= dt;
    if (this.player.hitFlash > 0) this.player.hitFlash -= dt;
    // out-of-combat regen
    const inCombat = this.enemies.some((e) => e.alive && e.aggro && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 7);
    if (inCombat) this.combatTimer = 4; else if (this.combatTimer > 0) this.combatTimer -= dt;
    if (!this.combatTimer || this.combatTimer <= 0) {
      const stats = computeStats(this.state);
      const angel = this.state.profile.faction === 'angel';
      this.state.hp = Math.min(stats.maxHp, this.state.hp + dt * (1.3 + stats.maxHp * 0.006) * (angel ? 1.12 : 1));
      this.state.mana = Math.min(stats.maxMana, this.state.mana + dt * (1.9 + stats.maxMana * 0.007) * (angel ? 1.12 : 1));
    }
    this.state.hp = clamp(this.state.hp, 0, computeStats(this.state).maxHp);
    this.state.mana = clamp(this.state.mana, 0, computeStats(this.state).maxMana);
    if (this.state.hp <= 0 && !this.player.dead) this.die();
    // boss bar / UI
    const boss = this.enemies.find((e) => e.isBoss && e.alive && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 15);
    if ((boss?.id || null) !== (this.bossVisible?.id || null)) {
      this.bossVisible = boss || null;
      this.ui?.setBoss(boss);
    } else if (boss && this.bossVisible) this.bossVisible = boss;
    this.ui?.tick(dt);
  }

  updatePlayer(dt) {
    const p = this.player;
    if (p.dead) return;
    let mx = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    let my = (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0);
    if (this.input.vector && Math.hypot(this.input.vector.x, this.input.vector.y) > 0.05) {
      mx = this.input.vector.x; my = this.input.vector.y;
    }
    // click/tap-to-move fallback
    if (Math.hypot(mx, my) < 0.08 && this.input.target && !this.modalOpen) {
      const dx = this.input.target.x - p.x, dy = this.input.target.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.16) { mx = dx / d; my = dy / d; } else this.input.target = null;
    }
    const mag = Math.hypot(mx, my);
    if (mag > 1) { mx /= mag; my /= mag; }
    const stats = computeStats(this.state);
    let speed = stats.speed;
    if (this.state.mounted && this.state.equipped.mount && MOUNTS[this.state.equipped.mount]) speed *= 1 + MOUNTS[this.state.equipped.mount].speed;
    const moving = mag > 0.08;
    p.moving = moving;
    if (moving) {
      this.input.target = null;
      const nx = p.x + mx * speed * dt;
      const ny = p.y + my * speed * dt;
      const resolved = this.world.resolveMove(p.x, p.y, nx, ny, 0.27);
      p.x = resolved.x; p.y = resolved.y;
      p.walkPhase += dt * (7.5 + speed);
      p.facing = mx >= 0 ? 1 : -1;
      p.direction = Math.abs(my) > Math.abs(mx) ? (my < 0 ? 'up' : 'down') : 'side';
      if (Math.random() < dt * 8) {
        const iso = this.world.iso(p.x, p.y);
        this.effects.push({ type: 'step', x: iso.x, y: iso.y, time: 0, dur: 1.0, color: this.region.palette.path[0] });
      }
    } else {
      p.walkPhase += dt * 1.5;
      if (p.direction === 'side') p.direction = 'down';
    }
    if (this.state.mounted && this.state.equipped.mount) {
      // pet and mount stay visual only; no extra simulation burden
    }
    // nearby loot pickup (magnet-like)
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;
      const d = Math.hypot(pickup.x - p.x, pickup.y - p.y);
      if (d < 1.5) pickup.magnet = true;
      if (pickup.magnet) {
        const sp = 3.5 + (1 - d / 2) * 4;
        const dx = p.x - pickup.x, dy = p.y - pickup.y;
        const dd = Math.hypot(dx, dy) || 1;
        pickup.x += dx / dd * sp * dt; pickup.y += dy / dd * sp * dt;
        if (dd < 0.38) this.collectPickup(pickup);
      }
    }
    // pet follow
    if (this.state.equipped.pet) {
      if (!this.petPos) this.petPos = { x: p.x - 1, y: p.y + 0.8 };
      const tx = p.x - 0.85 * p.facing, ty = p.y + 0.95;
      this.petPos.x = lerp(this.petPos.x, tx, dt * 3);
      this.petPos.y = lerp(this.petPos.y, ty, dt * 3);
    }
    // save position roughly
    if (Math.floor(this.time * 2) !== this._lastSaveStep) {
      this._lastSaveStep = Math.floor(this.time * 2);
      this.state.location = { regionId: this.regionId, x: p.x, y: p.y };
    }
  }

  updateEnemies(dt) {
    const p = this.player;
    const stats = computeStats(this.state);
    for (const e of this.enemies) {
      if (!e.alive) {
        if (e.respawnTimer > 0) e.respawnTimer -= dt;
        if (e.respawnTimer <= 0 && !e.isBoss && !e.def.boss) {
          e.alive = true; e.hp = e.maxHp; e.x = e.homeX; e.y = e.homeY; e.aggro = false; e.state = 'idle';
        }
        continue;
      }
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.attackAnim = Math.max(0, e.attackAnim - dt);
      if (e.telegraph > 0) e.telegraph -= dt;
      if (p.dead) { e.aggro = false; e.moving = false; continue; }
      const dx = p.x - e.x, dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      const aggroRange = e.isBoss ? 15 : (e.def.aggro || 5.5);
      if (!e.aggro && dist < aggroRange) e.aggro = true;
      const leash = e.isBoss ? 18 : 12;
      if (e.aggro && Math.hypot(e.homeX - e.x, e.homeY - e.y) > leash) {
        e.aggro = false;
        e.returning = true;
      }
      if (e.returning) {
        const hx = e.homeX - e.x, hy = e.homeY - e.y, hd = Math.hypot(hx, hy);
        if (hd < 0.4) { e.returning = false; e.hp = Math.min(e.maxHp, e.hp + 25); }
        else { e.x += hx / hd * e.def.speed * dt * 0.8; e.y += hy / hd * e.def.speed * dt * 0.8; e.moving = true; }
        continue;
      }
      if (e.aggro && dist > 0.9) {
        const ranged = e.def.ranged;
        const range = ranged ? 3.9 : (e.isBoss ? 1.55 : 1.15);
        if (dist > range) {
          const nx = e.x + dx / (dist || 1) * e.def.speed * dt;
          const ny = e.y + dy / (dist || 1) * e.def.speed * dt;
          const resolved = this.world.resolveMove(e.x, e.y, nx, ny, e.def.radius || 0.3);
          e.x = resolved.x; e.y = resolved.y;
          e.moving = true; e.walkPhase += dt * (4 + e.def.speed);
          e.facing = dx >= 0 ? 1 : -1;
        } else {
          e.moving = false;
          if (!ranged && e.attackTimer <= 0) {
            e.attackTimer = e.isBoss ? 1.1 : 1.55;
            e.attackAnim = 0.36;
            this.damagePlayer(e.def.damage, e);
          }
          if (ranged && e.attackTimer <= 0) {
            e.attackTimer = 1.8;
            e.attackAnim = 0.4;
            const ang = Math.atan2(dy, dx);
            this.projectiles.push({ owner: 'enemy', x: e.x, y: e.y, tx: p.x, ty: p.y, vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5, life: 3, damage: e.def.damage * 0.8, color: e.def.colors[2], radius: 0.15 });
          }
        }
        if (e.isBoss && e.attackTimer <= 0 && dist < 7) {
          e.attackTimer = 5.8;
          e.telegraph = 1.35;
          const tx = p.x, ty = p.y;
          this.zones.push({
            owner: 'enemy', type: 'telegraph', x: tx, y: ty, radius: 2.5, delay: 1.35, time: 0,
            color: e.def.colors[2], damage: e.def.damage * 1.7, done: false,
          });
          this.ui?.toast('danger', `${e.def.name} is gathering a devastating strike!`);
        }
      } else if (!e.aggro) {
        e.moving = Math.random() < dt * 0.4;
        e.walkPhase += dt * (e.moving ? 3 : 1);
      }
      if (e.attackTimer > 0) e.attackTimer -= dt;
      // soft separation so packs don't perfectly stack
      for (const other of this.enemies) {
        if (other === e || !other.alive) continue;
        const sx = e.x - other.x, sy = e.y - other.y;
        const sd = Math.hypot(sx, sy);
        const min = (e.def.radius || .3) + (other.def.radius || .3);
        if (sd > 0.001 && sd < min) {
          e.x += sx / sd * 0.3 * dt; e.y += sy / sd * 0.3 * dt;
        }
      }
      e.x = clamp(e.x, 1, this.world.size - 1); e.y = clamp(e.y, 1, this.world.size - 1);
    }
    // update boss bar text
    if (this.bossVisible && this.ui) this.ui.updateBossHp(this.bossVisible);
  }

  updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      pr.life -= dt;
      if (pr.owner === 'player' && pr.target && pr.target.alive) {
        const ang = Math.atan2(pr.target.y - pr.y, pr.target.x - pr.x);
        const speed = Math.hypot(pr.vx, pr.vy);
        pr.vx = lerp(pr.vx, Math.cos(ang) * speed, dt * 3.5);
        pr.vy = lerp(pr.vy, Math.sin(ang) * speed, dt * 3.5);
      }
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      if (pr.owner === 'player') {
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - pr.x, e.y - pr.y) < (e.def.radius || .35) + (pr.radius || .2)) {
            this.damageEnemy(e, pr.damage, pr.crit, pr.color);
            this.spawnImpact(pr.x, pr.y, pr.color, 6);
            pr.life = 0; break;
          }
        }
      } else {
        if (Math.hypot(this.player.x - pr.x, this.player.y - pr.y) < 0.38 && !this.player.dead) {
          this.damagePlayer(pr.damage, null);
          this.spawnImpact(pr.x, pr.y, pr.color, 5);
          pr.life = 0;
        }
      }
      if (pr.life <= 0) pr.dead = true;
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);
  }

  updateZones(dt) {
    for (const z of this.zones) {
      z.time += dt;
      if (z.type === 'telegraph') {
        if (!z.done && z.time >= z.delay) {
          z.done = true;
          const iso = this.world.iso(z.x, z.y);
          this.spawnImpact(z.x, z.y, z.color, 22);
          this.camera.shake = 10;
          if (Math.hypot(this.player.x - z.x, this.player.y - z.y) < z.radius && !this.player.dead) this.damagePlayer(z.damage, null);
          this.effects.push({ type: 'shock', x: iso.x, y: iso.y, color: z.color, time: 0, dur: 0.5, radius: z.radius * TILE });
        }
        continue;
      }
      z.tickTimer -= dt;
      if (z.tickIndex < z.ticks && z.tickTimer <= 0) {
        z.tickTimer = z.interval;
        z.tickIndex++;
        if (z.owner === 'player') {
          for (const e of this.enemies) {
            if (!e.alive) continue;
            if (Math.hypot(e.x - z.x, e.y - z.y) < z.radius) this.damageEnemy(e, z.damage, Math.random() < computeStats(this.state).crit, z.color);
          }
        }
        const iso = this.world.iso(z.x, z.y);
        this.effects.push({ type: 'zonePulse', x: iso.x, y: iso.y, color: z.color, time: 0, dur: 0.38, radius: z.radius * TILE, delay: z.tickIndex === z.ticks });
      }
      if (z.tickIndex >= z.ticks) z.done = true;
    }
    this.zones = this.zones.filter((z) => !z.done && z.time < 12);
  }

  updateEffects(dt) {
    for (const fx of this.effects) { fx.time += dt; if (fx.vy) fx.y += fx.vy * dt; }
    this.effects = this.effects.filter((fx) => fx.time < fx.dur);
    for (const tx of this.texts) { tx.time += dt; tx.y += tx.vy * dt; tx.vy += 18 * dt; }
    this.texts = this.texts.filter((tx) => tx.time < tx.dur);
    this.camera.shake = Math.max(0, this.camera.shake - dt * 18);
    if (this.camera.shake > 0) {
      this.camera.shakeX = (Math.random() - .5) * this.camera.shake;
      this.camera.shakeY = (Math.random() - .5) * this.camera.shake;
    } else { this.camera.shakeX = 0; this.camera.shakeY = 0; }
  }

  updatePickups(dt) {
    for (const p of this.pickups) p.time += dt;
  }

  updateCamera(dt) {
    const p = this.world.iso(this.player.x, this.player.y);
    // lead camera slightly in the direction of movement; keeps zoomed-out scenes readable.
    const lead = this.player.moving ? 20 * this.player.facing : 0;
    this.camera.x = lerp(this.camera.x, p.x + lead, 1 - Math.exp(-dt * WORLD.cameraEase));
    this.camera.y = lerp(this.camera.y, p.y, 1 - Math.exp(-dt * WORLD.cameraEase));
    this.camera.zoom = lerp(this.camera.zoom, clamp(this.width / 1480, 0.64, 0.98), 1 - Math.exp(-dt * 4));
  }

  updateWeather(dt) {
    if (!this.state.settings.weather) return;
    const cfg = WEATHER[this.region.weather] || WEATHER.petals;
    for (const w of this.weather) {
      w.x += (w.vx + Math.sin(this.time * 0.7 + w.phase) * 8) * dt;
      w.y += w.vy * dt;
      if (w.y > this.height + 20) { w.y = -20; w.x = Math.random() * this.width; }
      if (w.x < -20) w.x = this.width + 15;
      if (w.x > this.width + 20) w.x = -15;
    }
  }

  setMoveTargetFromScreen(sx, sy) {
    const zoom = this.camera.zoom;
    const ox = this.width / 2 + this.camera.shakeX;
    const oy = this.height * 0.57 + this.camera.shakeY;
    const gx = (sx - ox) / zoom + this.camera.x;
    const gy = (sy - oy) / zoom + this.camera.y;
    const u = (gx - this.world.origin.x) / (TILE / 2);
    const v = (gy - this.world.origin.y) / (TILE_H / 2);
    let tx = (u + v) / 2, ty = (v - u) / 2;
    tx = clamp(tx, 2, this.world.size - 2); ty = clamp(ty, 2, this.world.size - 2);
    this.input.target = { x: tx, y: ty };
  }

  _nearestEnemy(maxRange = 7, includeBoss = true) {
    let best = null;
    for (const e of this.enemies) {
      if (!e.alive || (e.isBoss && !includeBoss)) continue;
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < maxRange && (!best || d < best.dist)) best = { enemy: e, dist: d };
    }
    return best;
  }

  tryAttack() {
    if (this.modalOpen || this.player.dead || this.playerAttackCooldown > 0) return;
    const cls = CLASSES[this.state.profile.classId];
    this.playerAttackCooldown = cls.attackCooldown;
    this.player.attackTimer = 0.3;
    const stats = computeStats(this.state);
    const target = this._nearestEnemy(cls.attackRange + 3.1);
    if (target) this.player.facing = target.enemy.x >= this.player.x ? 1 : -1;
    const crit = Math.random() < stats.crit;
    let dmg = stats.attack * (0.92 + Math.random() * 0.18) * (crit ? 1.72 : 1);
    const iso = this.world.iso(this.player.x, this.player.y);
    const weaponEffect = this.state.equipped.effect ? WEAPON_EFFECTS[this.state.equipped.effect] : null;
    const color = weaponEffect?.color || cls.colors.accent;
    if (this.state.profile.classId === 'dawnblade') {
      const angle = target ? Math.atan2(target.enemy.y - this.player.y, target.enemy.x - this.player.x) : (this.player.facing > 0 ? 0.25 : Math.PI - 0.25);
      this.effects.push({ type: 'slash', x: iso.x, y: iso.y - 23, time: 0, dur: 0.3, radius: 42, angle, color });
      let hits = 0;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < cls.attackRange + (e.def.radius || 0)) {
          const ad = Math.atan2(e.y - this.player.y, e.x - this.player.x);
          let diff = Math.abs(ad - angle);
          if (diff > Math.PI) diff = TAU - diff;
          if (diff < 1.6 || d < 1.0) { this.damageEnemy(e, dmg, crit, color); hits++; }
        }
      }
      if (hits) this.camera.shake = 2.2;
      this.effects.push({ type: 'swing', x: iso.x, y: iso.y, color, time: 0, dur: .28, facing: this.player.facing });
    } else if (this.state.profile.classId === 'voidcaller') {
      const targetE = target?.enemy || null;
      let tx, ty;
      if (targetE) { tx = targetE.x; ty = targetE.y; }
      else {
        const ang = this.player.facing > 0 ? -0.35 : Math.PI + 0.35;
        tx = this.player.x + Math.cos(ang) * 4.2; ty = this.player.y + Math.sin(ang) * 3.2;
      }
      const ang = Math.atan2(ty - this.player.y, tx - this.player.x);
      const speed = 11;
      this.projectiles.push({
        owner: 'player', x: this.player.x, y: this.player.y - 0.4, tx, ty, target: targetE,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 1.4, damage: dmg, crit,
        color, radius: .2, arcane: true,
      });
      this.effects.push({ type: 'cast', x: iso.x, y: iso.y - 28, color, time: 0, dur: 0.25 });
    } else {
      const targetE = target?.enemy || null;
      let ang;
      if (targetE) ang = Math.atan2(targetE.y - this.player.y, targetE.x - this.player.x);
      else ang = this.player.facing > 0 ? -0.2 : Math.PI + 0.2;
      for (const s of [-1, 1]) {
        this.projectiles.push({
          owner: 'player', x: this.player.x, y: this.player.y, tx: this.player.x + Math.cos(ang) * 5,
          ty: this.player.y + Math.sin(ang) * 5, target: targetE,
          vx: Math.cos(ang + s * 0.045) * 12, vy: Math.sin(ang + s * 0.045) * 12,
          life: 1.1, damage: dmg * 0.58, crit, color, radius: .17, dagger: true,
        });
      }
      this.effects.push({ type: 'dashLine', x: iso.x, y: iso.y, color, time: 0, dur: .22 });
    }
  }

  trySkill() {
    if (this.modalOpen || this.player.dead || this.skillCooldown > 0) return;
    const cls = CLASSES[this.state.profile.classId];
    const skill = cls.skill;
    if (!spendMana(this.state, skill.mana)) { this.ui?.toast('warn', 'Not enough mana.'); return; }
    this.skillCooldown = Math.max(2.4, skill.cooldown - (this.state.skillLevel - 1) * 0.11);
    const stats = computeStats(this.state);
    const target = this._nearestEnemy(11);
    let tx = target?.enemy.x ?? this.player.x + (this.player.facing > 0 ? 3 : -3);
    let ty = target?.enemy.y ?? this.player.y + 1.4;
    const levelMult = 1 + (this.state.skillLevel - 1) * 0.155;
    const radius = skill.radius + (this.state.skillLevel - 1) * 0.055;
    const dmg = stats.attack * skill.baseDamage * levelMult;
    const iso = this.world.iso(this.player.x, this.player.y);
    this.player.attackTimer = 0.55;
    if (skill.type === 'verdict') {
      this.camera.shake = 7;
      this.effects.push({ type: 'skillBurst', x: iso.x, y: iso.y - 25, color: skill.color, time: 0, dur: 0.9, radius: radius * TILE * 0.6 });
      const offsets = [[0, 0], [-1.4, 1.3], [1.5, 1.1]];
      offsets.forEach(([ox, oy], i) => {
        const bx = tx + ox, by = ty + oy;
        this.effects.push({ type: 'beam', x: this.world.iso(bx, by).x, y: this.world.iso(bx, by).y, color: skill.color, time: -i * 0.1, dur: 0.7, height: 280 });
        this.damageArea(bx, by, radius * 0.72, dmg * (i === 0 ? 1.3 : 0.9), skill.color);
      });
      this.damageArea(tx, ty, radius, dmg * 0.45, skill.color);
      this.ui?.toast('skill', `${skill.name}!`);
    } else if (skill.type === 'singularity') {
      this.camera.shake = 5;
      this.zones.push({
        owner: 'player', type: 'singularity', x: tx, y: ty, radius, ticks: 5, interval: 0.30, tickTimer: 0.1, tickIndex: 0,
        time: 0, color: skill.color, damage: dmg * 0.62,
      });
      this.ui?.toast('skill', `${skill.name}!`);
    } else {
      this.camera.shake = 4;
      this.zones.push({
        owner: 'player', type: 'barrage', x: tx, y: ty, radius, ticks: 5, interval: 0.25, tickTimer: 0.08, tickIndex: 0,
        time: 0, color: skill.color, damage: dmg * 0.5,
      });
      this.ui?.toast('skill', `${skill.name}!`);
    }
  }

  damageArea(x, y, radius, damage, color) {
    const stats = computeStats(this.state);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (Math.hypot(e.x - x, e.y - y) < radius) this.damageEnemy(e, damage, Math.random() < stats.crit, color);
    }
  }

  damageEnemy(enemy, damage, crit = false, color = '#ffd36b') {
    if (!enemy.alive) return;
    enemy.hp -= damage;
    enemy.hitFlash = 0.15;
    enemy.aggro = true;
    const iso = this.world.iso(enemy.x, enemy.y);
    this.texts.push({ x: iso.x + (Math.random() - .5) * 20, y: iso.y - 45 - (enemy.def.size || 1) * 9, text: Math.round(damage).toString(), color: crit ? '#ffd36b' : '#fff4df', crit, time: 0, dur: 0.95, vy: -32 });
    this.effects.push({ type: 'impact', x: iso.x, y: iso.y - 20, color, time: 0, dur: 0.25, count: crit ? 9 : 5 });
    this.hitStop = crit ? 0.035 : 0.012;
    this.ui?.refreshHud();
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    if (!enemy.alive) return;
    enemy.alive = false;
    enemy.respawnTimer = enemy.isBoss ? 90 : 16 + Math.random() * 8;
    enemy.aggro = false;
    const iso = this.world.iso(enemy.x, enemy.y);
    this.effects.push({ type: 'death', x: iso.x, y: iso.y - 20, color: enemy.def.colors?.[2] || '#fff', time: 0, dur: 0.7, count: 16 });
    this.camera.shake = enemy.isBoss ? 14 : 3;
    this.state.stats.kills += 1;
    if (enemy.isBoss) this.state.stats.bosses += 1;
    const level = this.state.level;
    const xpGain = Math.round(enemy.def.xp * (1 + Math.max(0, enemy.def.level - level) * 0.015));
    const leveled = gainXp(this.state, xpGain);
    const gold = Math.round((enemy.def.gold[0] + Math.random() * (enemy.def.gold[1] - enemy.def.gold[0])) * (enemy.isBoss ? 1.1 : 1));
    addGold(this.state, gold);
    this.texts.push({ x: iso.x, y: iso.y - 60, text: `+${Math.round(xpGain)} XP`, color: '#9fe0ff', time: 0, dur: 1.2, vy: -24 });
    this.texts.push({ x: iso.x + 25, y: iso.y - 44, text: `+${gold} gold`, color: '#ffd877', time: 0, dur: 1.1, vy: -22 });
    // Equipment: direct drops are ALWAYS T3. Rarity follows config weights.
    const drop = rollEquipmentDrop(this.state, enemy.isBoss ? 'boss' : enemy.elite ? 'elite' : 'normal');
    if (drop) {
      this.pickups.push({ type: 'equipment', x: enemy.x, y: enemy.y, key: drop.key, info: drop.info, time: 0, bob: Math.random() * TAU });
      if (enemy.isBoss) {
        // boss guarantees a second direct T3 pickup, still within the same direct-drop rules
        const extra = rollEquipmentDrop(this.state, 'boss');
        if (extra) this.pickups.push({ type: 'equipment', x: enemy.x + 0.6, y: enemy.y - 0.5, key: extra.key, info: extra.info, time: 0, bob: Math.random() * TAU });
      }
    }
    if (enemy.isBoss) {
      const resource = this.region.resource;
      this.state.materials[resource.id] = (this.state.materials[resource.id] || 0) + (this.regionId === 'tower' ? 3 : 2);
      this.state.bossDefeated[this.regionId] = true;
      this.pickups.push({ type: 'material', x: enemy.x - 0.6, y: enemy.y + 0.4, material: resource, amount: 2, time: 0, bob: 1.2 });
      this.ui?.toast('boss', `${enemy.def.name} has fallen!`);
      this.ui?.bossDefeated(enemy);
      this.bossVisible = null; this.ui?.setBoss(null);
    }
    // quest progress for region trials and repeatable bounties
    const updates = notifyKill(this.state, this.regionId, enemy.def.id, enemy.isBoss);
    for (const u of updates) {
      if (u.type === 'complete') this.ui?.toast('quest', 'Trial complete! Open Quests to claim your reward.');
      else this.ui?.toast('quest', u.text);
    }
    if (!enemy.isBoss) {
      const bounty = progressBounty(this.state, this.regionId, enemy.def.id);
      if (bounty?.done) this.ui?.toast('quest', 'Bounty ready to claim.');
    }
    if (leveled.levels.length) {
      this.ui?.levelUp(leveled.levels[leveled.levels.length - 1]);
      this.effects.push({ type: 'levelup', x: this.world.iso(this.player.x, this.player.y).x, y: this.world.iso(this.player.x, this.player.y).y, color: '#ffe28a', time: 0, dur: 1.4, radius: 150 });
    }
    this.ui?.refreshHud(true);
    this.saveSoon();
  }

  damagePlayer(amount, source) {
    if (this.player.dead || this.player.invuln > 0) return;
    const stats = computeStats(this.state);
    const mitigated = Math.max(1, amount * (100 / (100 + stats.armor * 2.2)));
    this.state.hp -= mitigated;
    this.player.hitFlash = 0.22;
    this.player.invuln = 0.38;
    this.camera.shake = Math.max(this.camera.shake, 5);
    this.ui?.flashDamage();
    const iso = this.world.iso(this.player.x, this.player.y);
    this.texts.push({ x: iso.x, y: iso.y - 54, text: `-${Math.round(mitigated)}`, color: '#ff7e72', time: 0, dur: 0.9, vy: -28 });
    this.spawnImpact(this.player.x, this.player.y, '#ff7e72', 7);
    this.ui?.refreshHud();
    if (this.state.hp <= 0) this.die();
  }

  die() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.state.hp = 0;
    this.state.stats.deaths += 1;
    this.player.deathTimer = 0;
    this.camera.shake = 12;
    this.ui?.showDeath();
    this.saveSoon(true);
  }

  respawn() {
    const region = this.region;
    this.player.dead = false;
    this.player.x = region.village.x;
    this.player.y = region.village.y + 2.6;
    this.player.invuln = 3;
    this.state.hp = Math.max(1, Math.round(computeStats(this.state).maxHp * 0.65));
    this.state.mana = Math.max(1, Math.round(computeStats(this.state).maxMana * 0.5));
    this.enemies.forEach((e) => { e.aggro = false; if (!e.isBoss && e.alive) { e.x = e.homeX; e.y = e.homeY; } });
    this.zones = [];
    this.ui?.hideDeath();
    this.ui?.refreshHud(true);
    this.saveSoon(true);
  }

  usePotion(kind = 'health') {
    if (this.player.dead || this.potionCooldown > 0) return;
    if ((this.state.potions[kind] || 0) <= 0) { this.ui?.toast('warn', `No ${kind} potion left. Visit a merchant.`); return; }
    this.state.potions[kind]--;
    const stats = computeStats(this.state);
    if (kind === 'health') healState(this.state, stats.maxHp * 0.45 + 25);
    else restoreMana(this.state, stats.maxMana * 0.5 + 20);
    this.potionCooldown = 3;
    const iso = this.world.iso(this.player.x, this.player.y);
    this.effects.push({ type: 'heal', x: iso.x, y: iso.y - 30, color: kind === 'health' ? '#86efac' : '#8dc8ff', time: 0, dur: 0.8 });
    this.ui?.toast('info', kind === 'health' ? 'Health restored.' : 'Mana restored.');
    this.ui?.refreshHud(true);
    this.saveSoon();
  }

  toggleMount() {
    if (!this.state.equipped.mount) { this.ui?.toast('warn', 'No mount equipped. Visit the boutique.'); return; }
    this.state.mounted = !this.state.mounted;
    this.ui?.toast('info', this.state.mounted ? `Riding ${MOUNTS[this.state.equipped.mount]?.name || 'your mount'}.` : 'Dismounted.');
    this.ui?.refreshHud(true);
    this.saveSoon();
  }

  collectPickup(pickup) {
    if (pickup.collected) return;
    pickup.collected = true;
    if (pickup.type === 'equipment') {
      const added = addItem(this.state, pickup.key, 1);
      if (!added) {
        // No item destruction: overflow goes directly to the vault.
        this.state.storage[pickup.key] = (this.state.storage[pickup.key] || 0) + 1;
        this.ui?.toast('warn', `Satchel full — ${pickup.info.name} sent to your vault.`);
      } else {
        this.ui?.toast('loot', `Found ${pickup.info.rarityName} ${pickup.info.name} (T3).`);
      }
      this.effects.push({ type: 'lootBurst', x: this.world.iso(pickup.x, pickup.y).x, y: this.world.iso(pickup.x, pickup.y).y - 20, color: pickup.info.rarityColor, time: 0, dur: 0.6 });
    } else if (pickup.type === 'material') {
      this.state.materials[pickup.material.id] = (this.state.materials[pickup.material.id] || 0) + (pickup.amount || 1);
      this.ui?.toast('loot', `+${pickup.amount || 1} ${pickup.material.name}`);
    }
    this.pickups = this.pickups.filter((p) => p !== pickup);
    this.ui?.refreshHud(true);
    this.saveSoon();
  }

  spawnImpact(x, y, color, count = 6) {
    const iso = this.world.iso(x, y);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      this.particles.push({
        x: iso.x, y: iso.y - 20, vx: Math.cos(a) * (30 + Math.random() * 90), vy: Math.sin(a) * (25 + Math.random() * 70) - 30,
        life: 0.3 + Math.random() * 0.45, max: 0.75, color, size: 1.5 + Math.random() * 3, gravity: 160,
      });
    }
  }

  interact() {
    if (!this.interactable || this.modalOpen) return;
    const it = this.interactable;
    if (it.kind === 'npc') {
      const npc = it.npc;
      if (npc.service === 'questgiver') this.ui?.openNpcDialogue(npc);
      else if (npc.service === 'merchant') this.ui?.openPanel('merchant');
      else if (npc.service === 'blacksmith') this.ui?.openPanel('forge');
      else if (npc.service === 'keeper') this.ui?.openPanel('vault');
      else if (npc.service === 'waystone') this.ui?.openPanel('map');
      else this.ui?.openNpcDialogue(npc);
    } else if (it.kind === 'waystone') this.ui?.openPanel('map');
    else if (it.kind === 'dungeon') {
      this.player.x = this.region.dungeon.x;
      this.player.y = this.region.dungeon.y + 4.4;
      this.camera.x = this.world.iso(this.player.x, this.player.y).x;
      this.camera.y = this.world.iso(this.player.x, this.player.y).y;
      this.ui?.toast('boss', `${this.region.dungeon.name}: the air turns cold...`);
    }
  }

  travel(regionId) {
    if (!regionId || regionId === this.regionId) {
      // teleport to village within the current region
      this.player.x = this.region.village.x; this.player.y = this.region.village.y + 2.4;
      this.ui?.closePanel();
      this.ui?.toast('info', `Returned to ${this.region.village.name}.`);
      return;
    }
    this.saveSoon(true);
    this.player.regionId = this.regionId;
    this.state.location = { regionId, x: REGIONS[regionId].village.x, y: REGIONS[regionId].village.y + 2.4 };
    this.ui?.closePanel();
    this.setRegion(regionId, { spawn: 'village' }).then(() => {
      this.ui?.regionToast(REGIONS[regionId]);
      this.ui?.toast('info', `Waystone linked to ${REGIONS[regionId].name}.`);
    });
  }

  saveSoon(immediate = false) {
    clearTimeout(this._saveTimer);
    if (immediate) {
      this.state.location = { regionId: this.regionId, x: this.player.x, y: this.player.y };
      saveState(this.state);
      this.ui?.flashSave();
      return;
    }
    this._saveTimer = setTimeout(() => {
      this.state.location = { regionId: this.regionId, x: this.player.x, y: this.player.y };
      saveState(this.state);
      this.ui?.flashSave();
    }, 900);
  }

  playerAppearance() {
    const st = this.state;
    const cls = CLASSES[st.profile.classId];
    const fac = FACTIONS[st.profile.faction];
    const costume = st.equipped.costume ? COSTUMES.find((c) => c.id === st.equipped.costume) : null;
    const wing = st.equipped.wings ? WINGS[st.equipped.wings] : null;
    const effect = st.equipped.effect ? WEAPON_EFFECTS[st.equipped.effect] : null;
    return {
      faction: st.profile.faction, classId: st.profile.classId, gender: st.profile.gender,
      hairstyle: st.profile.hairstyle, hairColor: st.profile.hairColor, eyeColor: st.profile.eyeColor,
      skinTone: st.profile.skinTone, marking: st.profile.marking,
      classColors: cls.colors,
      costumeColors: costume ? { costumePrimary: costume.colors.costumePrimary, costumeAccent: costume.colors.costumeAccent, costumeCape: costume.colors.costumeCape } : null,
      wingData: wing, effectColor: effect?.color || null,
      factionColors: fac.colors,
    };
  }

  render() {
    if (!this.world || !this.player) return;
    const ctx = this.ctx;
    const W = this.width, H = this.height;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    this.drawSky(ctx, W, H);
    const zoom = this.camera.zoom;
    const shakeX = this.camera.shakeX, shakeY = this.camera.shakeY;
    const originX = W / 2 + shakeX;
    const originY = H * 0.57 + shakeY;
    const camX = this.camera.x, camY = this.camera.y;
    // Cropped ground blit for performance.
    const ground = this.world.ground;
    const viewLeft = camX - originX / zoom;
    const viewTop = camY - originY / zoom;
    const viewRight = camX + (W - originX) / zoom;
    const viewBottom = camY + (H - originY) / zoom;
    const sx = clamp(viewLeft, 0, ground.width);
    const sy = clamp(viewTop, 0, ground.height);
    const sw = clamp(viewRight, 0, ground.width) - sx;
    const sh = clamp(viewBottom, 0, ground.height) - sy;
    if (sw > 0 && sh > 0) {
      const dx = originX + (sx - camX) * zoom;
      const dy = originY + (sy - camY) * zoom;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(ground, sx, sy, sw, sh, dx, dy, sw * zoom, sh * zoom);
    }
    // World-space transform
    ctx.setTransform(this.dpr * zoom, 0, 0, this.dpr * zoom, this.dpr * (originX - camX * zoom), this.dpr * (originY - camY * zoom));
    // Ground-level zones (they should be under actors)
    this.drawZones(ctx);
    this.drawInteractRange(ctx);
    // depth-sorted scene
    const left = viewLeft - 250, right = viewRight + 250, top = viewTop - 320, bottom = viewBottom + 180;
    const scene = [];
    for (const prop of this.world.props) {
      const p = this.world.iso(prop.x, prop.y);
      if (p.x < left || p.x > right || p.y < top || p.y > bottom) continue;
      scene.push({ depth: p.y + (prop.depthBias || 0), kind: 'prop', prop, p });
    }
    for (const npc of this.world.npcs) {
      const p = this.world.iso(npc.x, npc.y);
      if (p.x < left || p.x > right || p.y < top || p.y > bottom) continue;
      scene.push({ depth: p.y, kind: 'npc', npc, p });
    }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const p = this.world.iso(e.x, e.y);
      if (p.x < left || p.x > right || p.y < top || p.y > bottom) continue;
      scene.push({ depth: p.y, kind: 'enemy', enemy: e, p });
    }
    const pp = this.world.iso(this.player.x, this.player.y);
    scene.push({ depth: pp.y + 0.02, kind: 'player', p: pp });
    if (this.state.equipped.pet && this.petPos) {
      const petP = this.world.iso(this.petPos.x, this.petPos.y);
      scene.push({ depth: petP.y - .2, kind: 'pet', p: petP });
    }
    for (const pickup of this.pickups) {
      const p = this.world.iso(pickup.x, pickup.y);
      scene.push({ depth: p.y, kind: 'pickup', pickup, p });
    }
    for (const pr of this.projectiles) {
      const p = this.world.iso(pr.x, pr.y);
      scene.push({ depth: p.y + .1, kind: 'projectile', projectile: pr, p });
    }
    scene.sort((a, b) => a.depth - b.depth);
    for (const item of scene) this.drawSceneItem(ctx, item);
    this.drawWorldEffects(ctx);
    this.drawParticles(ctx);
    this.drawFloatingTexts(ctx);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawLabels(ctx, originX, originY, zoom);
    if (this.state.settings.lighting) this.drawLighting(ctx, W, H, originX, originY, zoom);
    if (this.state.settings.weather) this.drawWeather(ctx, W, H);
    this.drawVignette(ctx, W, H);
    this.drawBossIntroHint(ctx, W, H);
  }

  drawSky(ctx, W, H) {
    const pal = this.region.palette;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky[0]); g.addColorStop(0.55, pal.sky[1]); g.addColorStop(1, pal.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // distant mountains / parallax layers
    const shift = (this.camera.x * 0.012) % 320;
    for (let layer = 0; layer < 3; layer++) {
      const baseH = H * (0.22 + layer * 0.055);
      const alpha = 0.12 + layer * 0.06;
      ctx.fillStyle = rgba(shade(pal.sky[0], layer === 2 ? 25 : -10), alpha);
      ctx.beginPath(); ctx.moveTo(-100, H);
      for (let x = -120 - shift; x < W + 160; x += 140) {
        const ph = baseH + Math.sin((x + layer * 230) * 0.007) * 55 + Math.sin((x + layer * 91) * 0.021) * 28;
        ctx.lineTo(x, H - ph); ctx.lineTo(x + 70, H - ph + 34); ctx.lineTo(x + 140, H - ph - 10);
      }
      ctx.lineTo(W + 200, H); ctx.closePath(); ctx.fill();
    }
    // sun/moon
    const isAstral = this.region.biome === 'astral';
    const sx = W * 0.16 + (this.camera.x * 0.015) % 60;
    const sy = H * 0.15;
    const sunColor = isAstral ? '#b9a8ff' : this.region.biome === 'volcanic' ? '#ff9b62' : '#ffe6a8';
    ctx.globalAlpha = isAstral ? 0.22 : 0.25;
    const sun = ctx.createRadialGradient(sx, sy, 2, sx, sy, 135);
    sun.addColorStop(0, sunColor); sun.addColorStop(.3, rgba(sunColor, .4)); sun.addColorStop(1, rgba(sunColor, 0));
    ctx.fillStyle = sun; ctx.fillRect(sx - 150, sy - 150, 300, 300);
    ctx.globalAlpha = 0.8; ctx.fillStyle = sunColor; ctx.beginPath(); ctx.arc(sx, sy, isAstral ? 22 : 29, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    if (isAstral) {
      for (let i = 0; i < 30; i++) { const x = (i * 193 + 40) % W, y = (i * 67 + 20) % (H * .5); ctx.fillStyle = rgba('#dcd4ff', 0.25 + (i % 4) * 0.1); ctx.fillRect(x, y, 1.2, 1.2); }
    }
  }

  drawZones(ctx) {
    for (const z of this.zones) {
      const p = this.world.iso(z.x, z.y);
      const radius = z.radius * TILE;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 0.5);
      if (z.type === 'telegraph') {
        const prog = clamp(z.time / z.delay, 0, 1);
        ctx.fillStyle = rgba('#ff544c', 0.06 + prog * 0.13);
        ctx.beginPath(); ctx.arc(0, 0, radius * prog, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba('#ff7a6b', 0.65); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.stroke();
        ctx.strokeStyle = rgba('#ffd0c0', 0.4); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, radius * (1 - prog * .2), 0, TAU); ctx.stroke();
      } else if (z.type === 'singularity') {
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
        g.addColorStop(0, rgba(z.color, 0.5)); g.addColorStop(.55, rgba(z.color, 0.13)); g.addColorStop(1, rgba(z.color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(z.color, 0.7); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, radius * 0.66, z.time * 2, z.time * 2 + 4.4); ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const a = z.time * 1.8 + i * 1.57;
          ctx.strokeStyle = rgba(z.color, 0.25); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(0, 0, radius * (0.25 + i * 0.15), -a, -a + 1.5); ctx.stroke();
        }
      } else if (z.type === 'barrage') {
        ctx.strokeStyle = rgba(z.color, 0.6); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.stroke();
        ctx.fillStyle = rgba(z.color, 0.08); ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(z.color, 0.25); ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + z.time; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius); ctx.stroke(); }
      }
      ctx.restore();
    }
  }

  drawInteractRange(ctx) {
    if (!this.interactable) return;
    const p = this.world.iso(this.interactable.x, this.interactable.y);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1, 0.5);
    const pulse = 0.7 + Math.sin(this.time * 4) * 0.3;
    ctx.strokeStyle = rgba('#ffe3a0', 0.42 * pulse); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 27 + pulse * 4, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,226,150,.06)'; ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawSceneItem(ctx, item) {
    if (item.kind === 'prop') {
      const pr = item.prop;
      ctx.drawImage(pr.sprite.canvas, item.p.x - pr.sprite.ax, item.p.y - pr.sprite.ay);
      if (pr.animated === 'portal') {
        const iso = item.p;
        ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, 0.55);
        ctx.strokeStyle = rgba(this.region.palette.accent, .35); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 28 + Math.sin(this.time * 3) * 3, 0, TAU); ctx.stroke();
        ctx.restore();
      } else if (pr.animated === 'waystone') {
        const iso = item.p;
        ctx.save(); ctx.translate(iso.x, iso.y - 108); ctx.scale(1, .6);
        for (let i = 0; i < 5; i++) {
          const a = this.time * .4 + i * TAU / 5;
          ctx.fillStyle = rgba(this.region.palette.accent, .3);
          ctx.beginPath(); ctx.arc(Math.cos(a) * 26, Math.sin(a) * 8, 1.5, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
      return;
    }
    if (item.kind === 'npc') {
      const npc = item.npc;
      if (npc.service === 'waystone') return;
      const app = this.npcAppearance(npc);
      this.actorShadow(ctx, item.p, npc.kind === 'pilgrim' ? 14 : 11);
      drawHero(ctx, item.p.x, item.p.y, .95, app, {
        time: this.time, moving: false, facing: 1, side: false, back: false,
        wings: app.wings,
        aura: npc.service === 'questgiver',
        gearAccent: app.classColors?.accent,
      });
      return;
    }
    if (item.kind === 'enemy') {
      const e = item.enemy;
      const s = e.def.size || 1;
      this.actorShadow(ctx, item.p, 12 * s, e.isBoss ? .5 : .32);
      drawMonster(ctx, item.p.x, item.p.y, e.def, this.time, {
        facing: e.facing, moving: e.moving, walkPhase: e.walkPhase, attack: e.attackAnim > 0 ? 1 - e.attackAnim / .36 : 0,
        hurt: e.hitFlash > 0,
      });
      if (e.isBoss) {
        // floor sigil
        ctx.save(); ctx.translate(item.p.x, item.p.y); ctx.scale(1, .5);
        ctx.strokeStyle = rgba(e.def.colors[2], .3 + Math.sin(this.time * 2) * .08); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 38 + Math.sin(this.time) * 3, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      return;
    }
    if (item.kind === 'player') {
      const app = this.playerAppearance();
      const pp = item.p;
      this.actorShadow(ctx, pp, this.state.mounted && this.state.equipped.mount ? 20 : 12.5, .38);
      const attackT = this.player.attackTimer > 0 ? 1 - this.player.attackTimer / .3 : 0;
      const back = this.player.direction === 'up';
      const side = this.player.direction === 'side';
      const mounted = this.state.mounted && this.state.equipped.mount;
      drawHero(ctx, pp.x, pp.y, 1.02, app, {
        time: this.time, moving: this.player.moving, walkPhase: this.player.walkPhase,
        facing: this.player.facing, back, side, attack: clamp(attackT, 0, 1),
        wings: app.wingData ? { shape: app.wingData.shape, colors: app.wingData.colors } : null,
        mountId: mounted ? this.state.equipped.mount : null,
        effectColor: app.effectColor,
        aura: this.state.skillLevel >= 5,
        gearAccent: this.gearAccent(),
      });
      if (this.player.invuln > 0 && Math.sin(this.time * 30) > 0) {
        ctx.strokeStyle = 'rgba(255,240,190,.25)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pp.x, pp.y - 20, 24, 0, TAU); ctx.stroke();
      }
      return;
    }
    if (item.kind === 'pet') {
      const pet = PETS[this.state.equipped.pet];
      if (!pet) return;
      ctx.globalAlpha = .9;
      drawPet(ctx, item.p.x, item.p.y, pet.id, pet.colors, this.time, .95);
      ctx.globalAlpha = 1;
      return;
    }
    if (item.kind === 'pickup') {
      const pickup = item.pickup;
      const p = item.p;
      const color = pickup.info?.rarityColor || pickup.material?.color || '#ffe08a';
      const bob = Math.sin(this.time * 3 + pickup.bob) * 4;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const beam = ctx.createLinearGradient(p.x, p.y - 70, p.x, p.y);
      beam.addColorStop(0, rgba(color, 0)); beam.addColorStop(.5, rgba(color, .12)); beam.addColorStop(1, rgba(color, .45));
      ctx.fillStyle = beam; ctx.fillRect(p.x - 6, p.y - 70, 12, 70);
      const g = ctx.createRadialGradient(p.x, p.y - 17 + bob, 1, p.x, p.y - 17 + bob, 20);
      g.addColorStop(0, rgba(color, .65)); g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y - 17 + bob, 20, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // tiny icon/diamond
      ctx.translate(p.x, p.y - 17 + bob); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = color; ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeStyle = '#fff6dd'; ctx.lineWidth = 1; ctx.strokeRect(-4, -4, 8, 8);
      ctx.restore();
      return;
    }
    if (item.kind === 'projectile') {
      const pr = item.projectile;
      const p = item.p;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(p.x, p.y - 18, 0, p.x, p.y - 18, 16);
      g.addColorStop(0, rgba(pr.color, .9)); g.addColorStop(1, rgba(pr.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y - 18, 16, 0, TAU); ctx.fill();
      if (pr.dagger) {
        ctx.strokeStyle = pr.color; ctx.lineWidth = 2;
        const ang = Math.atan2(pr.vy, pr.vx);
        ctx.beginPath(); ctx.moveTo(p.x - Math.cos(ang) * 12, p.y - 18 - Math.sin(ang) * 4); ctx.lineTo(p.x + Math.cos(ang) * 10, p.y - 18 + Math.sin(ang) * 4); ctx.stroke();
      } else {
        ctx.fillStyle = '#fff6da'; ctx.beginPath(); ctx.arc(p.x, p.y - 18, 3, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  actorShadow(ctx, p, rx, alpha = .32) {
    ctx.save(); ctx.translate(p.x, p.y + 1);
    ctx.fillStyle = `rgba(8,12,16,${alpha})`;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, rx * 0.38, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  npcAppearance(npc) {
    const clsMap = { questgiver: 'dawnblade', merchant: 'voidcaller', blacksmith: 'dawnblade', keeper: 'voidcaller' };
    if (npc.appearance && typeof npc.appearance === 'object') {
      const a = npc.appearance;
      const cls = CLASSES[a.classId] || CLASSES.dawnblade;
      const wing = a.wingsId ? WINGS[a.wingsId] : null;
      return { ...a, classColors: cls.colors, wings: wing ? { shape: wing.shape, colors: wing.colors } : null };
    }
    const cls = CLASSES[clsMap[npc.service] || 'wildstalker'];
    return {
      faction: 'angel', classId: cls.id, gender: npc.service === 'blacksmith' ? 'male' : 'female',
      hairstyle: npc.service === 'merchant' ? 'topknot' : 'braided', hairColor: npc.service === 'keeper' ? '#d6bd85' : '#6a422c',
      eyeColor: '#8dd7ff', skinTone: npc.service === 'blacksmith' ? '#8e5a3f' : '#dfb18f', marking: 'none',
      classColors: cls.colors, costumeColors: null,
    };
  }

  gearAccent() {
    let best = '#ffd36b'; let power = 0;
    for (const key of Object.values(this.state.equipment)) {
      if (!key) continue;
      const info = itemInfo(key);
      const p = itemInfo(key).stats.score;
      if (p > power) { power = p; best = info.rarityColor; }
    }
    return best;
  }

  drawWorldEffects(ctx) {
    for (const fx of this.effects) {
      if (fx.time < 0) continue;
      const prog = clamp(fx.time / fx.dur, 0, 1);
      ctx.save();
      if (fx.type === 'slash') {
        ctx.translate(fx.x, fx.y);
        ctx.rotate(fx.angle);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .9); ctx.lineWidth = 5 * (1 - prog) + 1;
        ctx.beginPath(); ctx.arc(0, 0, fx.radius * (0.7 + prog * .35), -1.05, 1.05); ctx.stroke();
        ctx.strokeStyle = rgba('#fff7d6', (1 - prog) * .6); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, fx.radius * (0.68 + prog * .35), -1.05, 1.05); ctx.stroke();
      } else if (fx.type === 'swing') {
        ctx.translate(fx.x, fx.y - 16);
        ctx.fillStyle = rgba(fx.color, (1 - prog) * .2);
        ctx.beginPath(); ctx.ellipse(0, 0, 30 * prog + 5, 6, 0, 0, TAU); ctx.fill();
      } else if (fx.type === 'impact') {
        ctx.translate(fx.x, fx.y);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < fx.count; i++) {
          const a = i / fx.count * TAU + prog * 1.5;
          const r = 8 + prog * 30;
          ctx.fillStyle = rgba(fx.color, 1 - prog);
          ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r * .6, 2.5, 2.5);
        }
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
        g.addColorStop(0, rgba('#fff4d4', (1 - prog) * .8)); g.addColorStop(1, rgba(fx.color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
      } else if (fx.type === 'death') {
        ctx.translate(fx.x, fx.y);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < fx.count; i++) {
          const a = i / fx.count * TAU;
          const r = 8 + prog * 46;
          ctx.fillStyle = rgba(fx.color, (1 - prog) * .75);
          ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r * .65 - prog * 20, 2, 2 + (1 - prog) * 3);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = rgba('#141018', (1 - prog) * .25);
        ctx.beginPath(); ctx.ellipse(0, 4, 20 + prog * 12, 7, 0, 0, TAU); ctx.fill();
      } else if (fx.type === 'beam') {
        ctx.translate(fx.x, fx.y);
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, -fx.height, 0, 0);
        g.addColorStop(0, rgba(fx.color, 0)); g.addColorStop(.25, rgba(fx.color, .15 * (1 - prog))); g.addColorStop(1, rgba(fx.color, .8 * (1 - prog)));
        ctx.fillStyle = g;
        const width = 18 + Math.sin(prog * Math.PI) * 22;
        ctx.fillRect(-width / 2, -fx.height, width, fx.height);
        ctx.fillStyle = rgba('#fff8d9', (1 - prog) * .5);
        ctx.fillRect(-4, -fx.height, 8, fx.height);
        ctx.restore();
        ctx.save(); ctx.translate(fx.x, fx.y); ctx.scale(1, .5);
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .8); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, 35 + prog * 20, 0, TAU); ctx.stroke();
        ctx.fillStyle = rgba(fx.color, (1 - prog) * .16); ctx.beginPath(); ctx.arc(0, 0, 35 + prog * 20, 0, TAU); ctx.fill();
      } else if (fx.type === 'shock' || fx.type === 'zonePulse') {
        ctx.translate(fx.x, fx.y); ctx.scale(1, .5);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .85); ctx.lineWidth = 4 * (1 - prog) + 1;
        ctx.beginPath(); ctx.arc(0, 0, fx.radius * (0.3 + prog * .8), 0, TAU); ctx.stroke();
        ctx.fillStyle = rgba(fx.color, (1 - prog) * .08); ctx.beginPath(); ctx.arc(0, 0, fx.radius * (0.3 + prog * .8), 0, TAU); ctx.fill();
      } else if (fx.type === 'heal') {
        ctx.translate(fx.x, fx.y);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 9; i++) {
          const a = i / 9 * TAU;
          const y = 30 - prog * 70 - (i % 3) * 12;
          ctx.fillStyle = rgba(fx.color, (1 - prog) * .7);
          ctx.fillRect(Math.cos(a) * 13, y, 2, 5);
        }
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .6); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 2, 22, 8, 0, 0, TAU); ctx.stroke();
      } else if (fx.type === 'levelup') {
        ctx.translate(fx.x, fx.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .9); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(0, 0, 30 + prog * fx.radius, 10 + prog * fx.radius * .3, 0, 0, TAU); ctx.stroke();
        for (let i = 0; i < 18; i++) {
          const a = i / 18 * TAU;
          ctx.fillStyle = rgba(fx.color, (1 - prog) * .8);
          ctx.fillRect(Math.cos(a) * (20 + prog * 55), -prog * 120 + Math.sin(a) * 10, 2, 2);
        }
      } else if (fx.type === 'skillBurst') {
        ctx.translate(fx.x, fx.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .8); ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath(); ctx.arc(0, 0, (fx.radius + i * 18) * (0.2 + prog), 0, TAU); ctx.stroke();
        }
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 100 * prog);
        g.addColorStop(0, rgba('#fff8d6', (1 - prog) * .45)); g.addColorStop(1, rgba(fx.color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 100 * prog, 0, TAU); ctx.fill();
      } else if (fx.type === 'lootBurst') {
        ctx.translate(fx.x, fx.y);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + prog; const r = 9 + prog * 28; ctx.fillStyle = rgba(fx.color, (1 - prog) * .8); ctx.fillRect(Math.cos(a) * r, Math.sin(a) * r, 2, 2); }
      } else if (fx.type === 'cast') {
        ctx.translate(fx.x, fx.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .7); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, 12 + prog * 25, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 6 + prog * 18, -1, 2); ctx.stroke();
      } else if (fx.type === 'dashLine') {
        ctx.translate(fx.x, fx.y - 15);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .45); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-35 * (1 - prog), 0); ctx.lineTo(35 * (1 - prog), 0); ctx.stroke();
      } else if (fx.type === 'step') {
        ctx.translate(fx.x, fx.y); ctx.scale(1, .45);
        ctx.strokeStyle = rgba(fx.color, (1 - prog) * .22); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, 8 + prog * 12, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
    // particles from hits
    for (const p of this.particles) {
      const a = clamp(1 - (1 - p.life / p.max), 0, 1);
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawParticles(ctx) {
    // world particles are drawn in drawWorldEffects; screen ambient is in drawWeather
  }

  drawFloatingTexts(ctx) {
    for (const tx of this.texts) {
      const a = clamp(1 - tx.time / tx.dur, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `${tx.crit ? '700 15px' : '600 11px'} "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(12,10,16,.72)';
      ctx.strokeText(tx.text, tx.x, tx.y);
      ctx.fillStyle = tx.color; ctx.fillText(tx.text, tx.x, tx.y);
      ctx.restore();
    }
  }

  drawLabels(ctx, originX, originY, zoom) {
    const camX = this.camera.x, camY = this.camera.y;
    const toScreen = (p) => ({ x: (p.x - camX) * zoom + originX, y: (p.y - camY) * zoom + originY });
    // NPC names and quest markers
    for (const npc of this.world.npcs) {
      if (npc.service === 'waystone') continue;
      const p = toScreen(this.world.iso(npc.x, npc.y));
      if (p.x < -80 || p.x > this.width + 80 || p.y < -80 || p.y > this.height + 80) continue;
      const quest = this.state.quests[this.state.trackedQuest || ''];
      const regionQuest = this.region.quest;
      let marker = '';
      let markerColor = '#ffd36b';
      if (npc.service === 'questgiver') {
        const q = this.state.quests[`trial_${this.regionId}`];
        if (!q || q.status === 'active') { marker = q?.status === 'complete' ? '?' : '!'; }
        else if (q.status === 'complete') { marker = '?'; markerColor = '#8fe9a6'; }
      }
      ctx.save();
      ctx.textAlign = 'center';
      if (npc.kind === 'pilgrim' || this.distanceToPlayer(npc.x, npc.y) < 6) {
        ctx.font = `600 ${Math.max(9, 11 * zoom)}px "Trebuchet MS", sans-serif`;
        ctx.fillStyle = 'rgba(241,232,210,.88)';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(9,13,20,.68)';
        ctx.strokeText(npc.name, p.x, p.y - 50 * zoom);
        ctx.fillText(npc.name, p.x, p.y - 50 * zoom);
        ctx.font = `${Math.max(7, 8 * zoom)}px "Trebuchet MS", sans-serif`;
        ctx.fillStyle = npc.kind === 'pilgrim' ? (npc.faction === 'angel' ? 'rgba(255,231,160,.75)' : 'rgba(255,145,112,.8)') : 'rgba(191,190,178,.68)';
        ctx.fillText(npc.title, p.x, p.y - 39 * zoom);
      }
      if (marker) {
        const yy = p.y - 66 * zoom + Math.sin(this.time * 3) * 2;
        ctx.fillStyle = 'rgba(10,14,22,.82)'; ctx.beginPath(); ctx.arc(p.x, yy, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = markerColor; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = markerColor; ctx.font = `700 14px Georgia, serif`; ctx.fillText(marker, p.x, yy + 5);
      }
      ctx.restore();
    }
    // enemy names/health
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const p = toScreen(this.world.iso(e.x, e.y));
      if (p.x < -100 || p.x > this.width + 100 || p.y < -100 || p.y > this.height + 100) continue;
      const d = this.distanceToPlayer(e.x, e.y);
      if (!e.aggro && d > 6 && !e.isBoss) continue;
      const size = e.def.size || 1;
      const barW = Math.max(24, (e.isBoss ? 82 : 38) * zoom);
      const barY = p.y - (e.isBoss ? 80 : 46 + size * 12) * zoom;
      if (e.isBoss) {
        ctx.save(); ctx.textAlign = 'center'; ctx.font = `700 ${Math.max(10, 12 * zoom)}px Georgia, serif`;
        ctx.fillStyle = 'rgba(255,224,173,.9)'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(11,12,18,.8)';
        ctx.strokeText(e.def.name, p.x, barY - 8); ctx.fillText(e.def.name, p.x, barY - 8);
        ctx.restore();
      } else if (e.elite || e.aggro) {
        ctx.save(); ctx.textAlign = 'center'; ctx.font = `600 ${Math.max(8, 9 * zoom)}px "Trebuchet MS", sans-serif`;
        ctx.fillStyle = e.elite ? 'rgba(255,191,107,.92)' : 'rgba(238,232,214,.85)'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(9,12,18,.7)';
        ctx.strokeText(e.def.name, p.x, barY - 5); ctx.fillText(e.def.name, p.x, barY - 5); ctx.restore();
      }
      const hpPct = clamp(e.hp / e.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(7,10,14,.72)'; ctx.fillRect(p.x - barW / 2, barY, barW, Math.max(3, 4 * zoom));
      ctx.fillStyle = e.isBoss ? '#e35959' : e.elite ? '#ffab52' : '#cf665b';
      ctx.fillRect(p.x - barW / 2 + 1, barY + 1, (barW - 2) * hpPct, Math.max(1.5, 2.5 * zoom));
      if (e.def.ranged) { ctx.fillStyle = 'rgba(167,216,255,.7)'; ctx.fillRect(p.x + barW / 2 + 3, barY, 2, 2); }
    }
    // player target marker
    if (this.ui?.selectedEnemy && this.ui.selectedEnemy.alive) {
      const p = toScreen(this.world.iso(this.ui.selectedEnemy.x, this.ui.selectedEnemy.y));
      ctx.save(); ctx.strokeStyle = 'rgba(255,220,141,.65)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 23, 8, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    // interaction glyph above nearest interactable
    if (this.interactable) {
      const p = toScreen(this.world.iso(this.interactable.x, this.interactable.y));
      ctx.save(); ctx.textAlign = 'center'; ctx.font = `700 ${Math.max(10, 12 * zoom)}px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,230,166,.8)'; ctx.fillText('E', p.x, p.y - 66 * zoom);
      ctx.restore();
    }
  }

  distanceToPlayer(x, y) { return Math.hypot(x - this.player.x, y - this.player.y); }

  drawLighting(ctx, W, H, originX, originY, zoom) {
    const camX = this.camera.x, camY = this.camera.y;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const light of this.world.lights) {
      const p = this.world.iso(light.x, light.y);
      const sx = (p.x - camX) * zoom + originX;
      const sy = (p.y - camY) * zoom + originY - 16;
      if (sx < -300 || sx > W + 300 || sy < -300 || sy > H + 300) continue;
      const flicker = 1 + Math.sin(this.time * 6 + light.phase) * (light.flicker || 0);
      const r = (light.radius || 4) * TILE * .48 * zoom * flicker;
      const g = ctx.createRadialGradient(sx, sy, 1, sx, sy, r);
      g.addColorStop(0, rgba(light.color, (light.intensity || .3) * .48));
      g.addColorStop(.45, rgba(light.color, (light.intensity || .3) * .13));
      g.addColorStop(1, rgba(light.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
    }
    // broad sun / ambient bloom
    const sun = ctx.createRadialGradient(W * .16, H * .14, 10, W * .16, H * .14, W * .65);
    const tint = this.region.biome === 'astral' ? '#b8a8ff' : this.region.biome === 'volcanic' ? '#ff8c57' : '#ffe1a0';
    sun.addColorStop(0, rgba(tint, .07)); sun.addColorStop(1, rgba(tint, 0));
    ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // Color grade
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = this.region.palette.ambient;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // Fog bands
    const fog = this.region.palette.fog;
    if (fog) {
      ctx.save();
      const drift = (this.time * 4) % (W + 400) - 200;
      for (let i = 0; i < 3; i++) {
        const g = ctx.createLinearGradient(0, H * .35 + i * 90, 0, H * .7 + i * 40);
        g.addColorStop(0, rgba(fog.match(/[\d.]+/)?.[0] ? '#cbd8e6' : '#cbd8e6', 0));
        g.addColorStop(.5, fog);
        g.addColorStop(1, rgba('#cbd8e6', 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(drift + i * 380, H * .52 + i * 55, 320, 50, 0, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  drawWeather(ctx, W, H) {
    const cfg = WEATHER[this.region.weather] || WEATHER.petals;
    ctx.save();
    for (const w of this.weather) {
      ctx.globalAlpha = w.alpha;
      if (cfg.kind === 'mist') {
        const g = ctx.createRadialGradient(w.x, w.y, 1, w.x, w.y, w.size);
        g.addColorStop(0, rgba(w.color, .08)); g.addColorStop(1, rgba(w.color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.size, w.size * .25, 0, 0, TAU); ctx.fill();
      } else if (cfg.kind === 'petal') {
        ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(this.time + w.phase); ctx.fillStyle = w.color;
        ctx.beginPath(); ctx.ellipse(0, 0, w.size, w.size * .45, 0, 0, TAU); ctx.fill(); ctx.restore();
      } else if (cfg.kind === 'ember' || cfg.kind === 'glow') {
        const g = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.size * 3);
        g.addColorStop(0, rgba(w.color, .5)); g.addColorStop(1, rgba(w.color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w.x, w.y, w.size * 3, 0, TAU); ctx.fill();
        ctx.fillStyle = w.color; ctx.fillRect(w.x, w.y, w.size, w.size);
      } else if (cfg.kind === 'star') {
        ctx.fillStyle = w.color; ctx.fillRect(w.x, w.y, w.size, w.size);
        if (Math.sin(this.time * 2 + w.phase) > .75) { ctx.globalAlpha = w.alpha * .4; ctx.fillRect(w.x - 3, w.y + .5, 8, .7); ctx.fillRect(w.x + .5, w.y - 3, .7, 8); }
      } else {
        ctx.fillStyle = w.color; ctx.fillRect(w.x, w.y, w.size, w.size);
      }
    }
    ctx.restore();
  }

  drawVignette(ctx, W, H) {
    const g = ctx.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .28, W / 2, H * .55, Math.max(W, H) * .78);
    g.addColorStop(0, 'rgba(4,7,12,0)'); g.addColorStop(.72, 'rgba(4,7,12,.12)'); g.addColorStop(1, 'rgba(3,5,9,.52)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const top = ctx.createLinearGradient(0, 0, 0, 120);
    top.addColorStop(0, 'rgba(4,6,10,.34)'); top.addColorStop(1, 'rgba(4,6,10,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, 120);
    if (this.player?.hitFlash > 0) {
      ctx.fillStyle = `rgba(150,22,25,${this.player.hitFlash * 0.5})`; ctx.fillRect(0, 0, W, H);
    }
  }

  drawBossIntroHint(ctx, W, H) {
    // Intentionally quiet: the boss UI lives in the DOM HUD for accessibility.
  }
}
