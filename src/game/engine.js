import { App, recalc, addItem, addMaterial, addXP, addGold, addGems, advanceQuests, ensureStoryQuest, questReady, claimQuest, sellValue, mountSpeed, addEssence } from '../core/game.js';
import { t, tx } from '../core/i18n.js';
import { CLASSES } from '../data/classes.js';
import { ZONES, getZone } from '../data/zones.js';
import { DROP_WEIGHTS, makeEquip, makeBossStone, RARITY, MATERIALS, makeMaterial, WINGS, CONSUMABLES, itemName } from '../data/items.js';
import { MOUNTS } from '../data/shop.js';
import { QUESTS, getQuest } from '../data/quests.js';
import { generateZone, WORLD_SIZE, resolveCollision } from './worldgen.js';
import { getMonsterSprite } from './sprites.js';
import * as art from './worldArt.js';
import { clamp, dist, TAU, uid, weighted } from '../core/utils.js';
import { saveNow } from '../core/game.js';

const VIEW_W = 500;

export class WorldEngine {
  constructor(game, canvas, minimap, hudRoot) {
    this.game = game;
    this.player = game.player;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimap = minimap;
    this.mctx = minimap?.getContext('2d') ?? null;
    this.hudRoot = hudRoot;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = 1; this.h = 1;
    this.time = 0;
    this.last = 0;
    this.running = false;
    this.paused = false;
    this.zoneId = null;
    this.data = null;
    this.monsters = [];
    this.loot = [];
    this.effects = [];
    this.floaters = [];
    this.projectiles = [];
    this.targetUid = null;
    this.joystick = { x: 0, y: 0, active: false };
    this.keys = new Set();
    this.attackHeld = false;
    this.attackCooldown = 0;
    this.attackAnim = 0;
    this.cooldowns = {};
    this.interaction = null;
    this.channel = null;
    this.dead = false;
    this.camera = { x: 0, y: 0 };
    this.sha = 0;
    this.shakeTime = 0;
    this.facing = 1;
    this.moving = false;
    this.zoneTitleUntil = 0;
    this.buildParticles();
    this.bossWarned = false;
    this.bossEngaged = false;
    this.lastTargetCheck = 0;
    this.minimapTimer = 0;
    this.bossSlamTimer = 4;
    this.damageFlash = 0;
    this.empowered = 0;
    this.armorBuffUntil = 0;
    this.xpBuffUntil = 0;
    this.gatherBuffUntil = 0;
    this.attackPulse = 0;
    this.tutStep = 0;
    this.hitCombo = 0;
    this.comboTimer = 0;
  }

  // ── lifecycle ───────────────────────────────────────────────────────────
  attach() {
    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this._onKeyDown = (e) => this.onKeyDown(e);
    this._onKeyUp = (e) => this.keys.delete(e.code);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('pointerdown', (e) => this.onCanvasPointer(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.loadZone(this.player.zoneId, { restore: true });
    this.running = true;
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  detach() {
    this.running = false;
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.minimap) {
      const mr = this.minimap.getBoundingClientRect();
      this.minimap.width = Math.round(Math.max(1, mr.width) * this.dpr);
      this.minimap.height = Math.round(Math.max(1, mr.height) * this.dpr);
    }
  }

  loadZone(zoneId, opts = {}) {
    const zone = getZone(zoneId);
    const previous = { x: this.player.x, y: this.player.y, zoneId: this.player.zoneId, visited: this.player.visited?.[zoneId] };
    this.zoneId = zoneId;
    this.data = generateZone(zoneId);
    this.player.zoneId = zoneId;
    this.monsters = this.data.spawns.map((s, i) => this.createMonster(s, i));
    this.nodes = this.data.nodes.map((n) => ({ ...n, ready: true, respawnAt: 0 }));
    this.npcs = this.data.npcs.map((n) => ({ ...n }));
    this.loot = [];
    this.effects = [];
    this.floaters = [];
    this.projectiles = [];
    this.targetUid = null;
    this.interaction = null;
    this.channel = null;
    this.attackHeld = false;
    this.bossWarned = false;
    this.bossEngaged = false;
    this.dead = false;
    this.bossSlamTimer = 4;
    this.armorBuffUntil = 0;
    this.xpBuffUntil = 0;
    this.gatherBuffUntil = 0;
    const camp = this.data.camp;
    const canRestore = opts.restore && previous.x > 0 && previous.y > 0 && previous.visited;
    if (canRestore) {
      this.player.x = clamp(previous.x, 120, WORLD_SIZE - 120);
      this.player.y = clamp(previous.y, 120, WORLD_SIZE - 120);
    } else {
      this.player.x = camp.x + (Math.random() - 0.5) * 40;
      this.player.y = camp.y + 40;
    }
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.player.visited = this.player.visited ?? {};
    this.player.visited[zoneId] = true;
    if (!this.player.discoveredZones.includes(zoneId)) this.player.discoveredZones.push(zoneId);
    const q = ensureStoryQuest(this.player, zoneId);
    if (q) this.notify(t('toast.questNew', { name: tx(q.name) }), 'good');
    this.zoneTitleUntil = this.time + 4.2;
    this.updateNPCs();
    this.bossWarned = false;
    this.minimapTimer = 0;
    this.moving = false;
    this.keys.clear();
    this.joystick = { x: 0, y: 0, active: false };
    this.save();
    if (this.player.hp <= 0) this.player.hp = Math.max(1, Math.round(this.player.stats.maxHp * 0.6));
    recalc(this.player);
  }

  get zone() { return this.data?.zone ?? getZone(this.zoneId); }

  createMonster(spawn, index) {
    const zone = this.zone;
    const lv = spawn.level ?? zone.min;
    const hpMul = spawn.hp ?? 1;
    const isBoss = Boolean(spawn.boss);
    const maxHp = Math.round((50 + lv * 27) * hpMul * (isBoss ? 0.62 : 1));
    return {
      uid: `m_${zone.id}_${index}_${spawn.id}`,
      defId: spawn.id,
      name: spawn.name,
      sprite: spawn.sprite,
      tint: spawn.tint ?? zone.palette.accent,
      eye: zone.palette.light,
      level: lv,
      maxHp, hp: maxHp,
      attack: Math.round((7 + lv * 2.5) * (spawn.atk ?? 1)),
      defense: Math.round(2 + lv * 1.25),
      xp: Math.round((22 + lv * 11.5) * (spawn.xp ?? 1)),
      gold: Math.round((6 + lv * 3.4) * (spawn.gold ?? 1)),
      scale: spawn.scale ?? 1,
      elite: Boolean(spawn.elite),
      boss: isBoss,
      x: spawn.x, y: spawn.y,
      homeX: spawn.x, homeY: spawn.y,
      state: 'idle',
      facing: Math.random() > 0.5 ? 1 : -1,
      anim: Math.random() * TAU,
      dead: false,
      respawnAt: 0,
      attackCd: 0,
      stunUntil: 0,
      slowUntil: 0,
      poisonUntil: 0,
      poisonTick: 0,
      burnUntil: 0,
      burnTick: 0,
      aggro: false,
      flash: 0,
      spawnedAt: this.time,
      wanderAngle: Math.random() * TAU,
      wanderTimer: 1 + Math.random() * 3,
      bossPhase: 0,
      lastHit: 0,
    };
  }

  // ── main loop ───────────────────────────────────────────────────────────
  loop(now) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    this.time += dt;
    if (!this.paused) this.update(dt);
    this.render(dt);
    if (App.ui?.tick) App.ui.tick(dt);
  }

  setPaused(paused) { this.paused = paused; this.last = performance.now(); }

  get target() {
    if (!this.targetUid) return null;
    const m = this.monsters.find((x) => x.uid === this.targetUid && !x.dead);
    return m ?? null;
  }

  nearestMonster(range = 9999) {
    let best = null, bd = range;
    for (const m of this.monsters) {
      if (m.dead) continue;
      const d = dist(this.player.x, this.player.y, m.x, m.y) - (m.boss ? 30 * m.scale : 0);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  update(dt) {
    const player = this.player;
    this.game.playtime = (this.game.playtime ?? 0) + dt;
    player.playtimeMs = (player.playtimeMs ?? 0) + dt * 1000;
    this.updateBuffs(dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt * 4);
    this.attackPulse += dt;
    for (const id of Object.keys(this.cooldowns)) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
    if (this.shakeTime > 0) this.shakeTime -= dt;
    this.damageFlash = Math.max(0, this.damageFlash - dt * 2);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) this.hitCombo = 0;

    if (this.dead) { this.updateEffects(dt); return; }
    // channel
    if (this.channel) {
      this.channel.elapsed += dt;
      if (this.channel.elapsed >= this.channel.duration) {
        this.finishGather(this.channel.node);
        this.channel = null;
      }
      this.moving = false;
      this.updateEffects(dt);
      this.updateMonsters(dt);
      this.updateLoot(dt);
      this.updateCamera(dt);
      return;
    }

    // movement
    let mx = 0, my = 0;
    const joy = this.joystick;
    if (joy.active) { mx += joy.x; my += joy.y; }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) my -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) my += 1;
    const mag = Math.hypot(mx, my);
    this.moving = mag > 0.08;
    if (this.moving) {
      mx /= mag; my /= mag;
      const inCombat = this.monsters.some((m) => !m.dead && m.aggro && dist(m.x, m.y, player.x, player.y) < 300);
      const speedMul = inCombat ? 0.92 : 1 + (player.mount ? mountSpeed(player) : 0);
      const speed = player.stats.speed * speedMul;
      let nx = player.x + mx * speed * dt;
      let ny = player.y + my * speed * dt;
      const resolved = resolveCollision(nx, ny, this.data.props);
      player.x = clamp(resolved.x, 40, WORLD_SIZE - 40);
      player.y = clamp(resolved.y, 40, WORLD_SIZE - 40);
      if (Math.abs(mx) > 0.2) this.facing = mx > 0 ? 1 : -1;
      this.walkPhase = (this.walkPhase ?? 0) + dt * 9;
    }

    // regen
    if (!this.inCombat() && player.hp > 0) {
      player.hp = Math.min(player.stats.maxHp, player.hp + player.stats.hpRegen * dt);
      player.resource = Math.min(player.stats.maxResource, player.resource + player.stats.resourceRegen * dt);
    }

    if (this.attackHeld) this.tryBasicAttack();
    this.updateMonsters(dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.updateFloaters(dt);
    this.updateLoot(dt);
    this.updateInteraction();
    this.updateCamera(dt);
    this.updateNPCs();
    this.minimapTimer -= dt;
    if (this.minimapTimer <= 0) { this.drawMinimap(); this.minimapTimer = 0.35; }
    if (this.autosaveTimer == null) this.autosaveTimer = 20;
    this.autosaveTimer -= dt;
    if (this.autosaveTimer <= 0) { this.autosaveTimer = 25; this.save(); }
    // tutorial first steps
    if (!this.game.settings?.tutorialDone) this.tutorialProgress();
  }

  tutorialProgress() {
    const p = this.player;
    if (this.tutStep === 0 && this.moving) { this.tutStep = 1; App.ui?.tutorialStep?.(1); }
    if (this.tutStep === 1 && this.playerHasAttacked) { this.tutStep = 2; App.ui?.tutorialStep?.(2); }
    if (this.tutStep === 2 && this.playerUsedSkill) { this.tutStep = 3; App.ui?.tutorialStep?.(3); }
  }

  updateBuffs() {
    const now = Date.now();
    if (this.armorBuffUntil && now > this.armorBuffUntil) this.armorBuffUntil = 0;
    if (this.xpBuffUntil && now > this.xpBuffUntil) this.xpBuffUntil = 0;
    if (this.gatherBuffUntil && now > this.gatherBuffUntil) this.gatherBuffUntil = 0;
  }

  inCombat() {
    return this.monsters.some((m) => !m.dead && m.aggro && dist(m.x, m.y, this.player.x, this.player.y) < 420);
  }

  updateCamera(dt) {
    const viewH = VIEW_W * (this.h / this.w);
    const tx = clamp(this.player.x, viewH * 0 + VIEW_W / 2, WORLD_SIZE - VIEW_W / 2);
    const ty = clamp(this.player.y, viewH / 2, WORLD_SIZE - viewH / 2);
    const k = 1 - Math.pow(0.001, dt);
    this.camera.x += (tx - this.camera.x) * k;
    this.camera.y += (ty - this.camera.y) * k;
  }

  updateNPCs() {
    if (!this.npcs) return;
    for (const npc of this.npcs) {
      const zoneQuests = QUESTS.filter((q) => q.zone === this.zoneId && (q.npc === npc.id || (!q.npc && q.story)));
      let marker = null;
      for (const q of zoneQuests) {
        const e = this.player.quests[q.id];
        if (e?.state === 'done') { marker = 'done'; break; }
        if (!e) { marker = 'quest'; }
      }
      npc.marker = marker;
    }
  }

  // ── combat ──────────────────────────────────────────────────────────────
  get basicRange() { return this.player.classId === 'mage' ? 390 : this.player.classId === 'assassin' ? 105 : 118; }

  tryBasicAttack() {
    if (this.dead || this.channel) return;
    if (this.attackCooldown > 0) return;
    let target = this.target;
    if (!target) {
      target = this.nearestMonster(this.basicRange + 60);
      if (target) this.targetUid = target.uid;
    }
    if (!target) {
      if (this.attackHeld && this.time - (this.lastNoTargetToast ?? 0) > 2) {
        this.lastNoTargetToast = this.time;
        this.notify(t('hud.noTarget'));
      }
      this.attackCooldown = 0.35;
      return;
    }
    const d = dist(this.player.x, this.player.y, target.x, target.y);
    if (d > this.basicRange + (target.boss ? 30 * target.scale : 10)) {
      this.targetUid = null;
      this.attackCooldown = 0.3;
      return;
    }
    this.attackCooldown = this.player.classId === 'assassin' ? 0.55 : this.player.classId === 'warrior' ? 0.72 : 0.82;
    this.attackAnim = 1;
    this.playerHasAttacked = true;
    this.facing = target.x >= this.player.x ? 1 : -1;
    const empower = this.empowered > 0 ? 1.8 : 1;
    this.empowered = 0;
    let dmg = this.player.stats.attack * (0.92 + Math.random() * 0.16) * empower;
    const crit = Math.random() < this.player.stats.crit;
    if (crit) dmg *= this.player.stats.critDmg;
    this.hitMonster(target, dmg, { crit, type: 'basic' });
    this.gainResource(this.player.classId === 'warrior' ? 13 : this.player.classId === 'assassin' ? 9 : 5);
    this.applyLifesteal(dmg);
    this.addEffect({ kind: this.player.classId === 'mage' ? 'bolt' : 'slash', x: this.player.x, y: this.player.y - 34, tx: target.x, ty: target.y - 30, color: this.player.classId === 'mage' ? '#a8d8ff' : '#f0d090', life: 0.24, maxLife: 0.24, angle: Math.atan2(target.y - this.player.y, target.x - this.player.x) });
    this.sfx(this.player.classId === 'mage' ? 'cast' : 'slash');
    this.shakeTime = Math.max(this.shakeTime, 0.08);
  }

  useSkill(indexOrId) {
    if (this.dead || this.channel) return false;
    const cls = CLASSES[this.player.classId];
    const skill = typeof indexOrId === 'number' ? cls.skills[indexOrId] : cls.skills.find((s) => s.id === indexOrId);
    if (!skill) return false;
    if (this.player.level < skill.unlock) {
      this.notify(t('skill.unlockAt', { lv: skill.unlock }));
      return false;
    }
    if ((this.cooldowns[skill.id] ?? 0) > 0) return false;
    const res = this.player.classId === 'warrior' ? 'rage' : this.player.classId === 'mage' ? 'mana' : 'energy';
    if (this.player.resource < skill.cost) {
      this.notify(t('toast.noResource', { resource: t(`common.${res}`) }), 'bad');
      return false;
    }
    const target = this.target ?? this.nearestMonster(skill.type === 'single' ? skill.range : 300);
    if ((skill.type === 'single' || skill.type === 'dash') && (!target || dist(this.player.x, this.player.y, target.x, target.y) > skill.range + 40)) {
      this.notify(t('toast.needTarget'));
      return false;
    }
    this.player.resource -= skill.cost;
    this.playerUsedSkill = true;
    this.cooldowns[skill.id] = skill.cd;
    this.facing = target && target.x < this.player.x ? -1 : 1;
    this.sfx('cast');
    if (skill.type === 'single') {
      this.doSingleSkill(skill, target);
    } else if (skill.type === 'aoe') {
      this.doAoeSkill(skill);
    } else if (skill.type === 'ground') {
      this.doGroundSkill(skill, target);
    } else if (skill.type === 'buff') {
      this.doBuffSkill(skill);
    } else if (skill.type === 'dash') {
      this.doDashSkill(skill, target);
    }
    this.save();
    return true;
  }

  skillDamage(skill, mult = 1) {
    let dmg = this.player.stats.attack * skill.mult * mult * (0.94 + Math.random() * 0.12);
    const crit = Math.random() < this.player.stats.crit;
    if (crit) dmg *= this.player.stats.critDmg;
    return { dmg, crit };
  }

  doSingleSkill(skill, target) {
    const { dmg, crit } = this.skillDamage(skill);
    if (this.player.classId === 'mage') {
      this.projectiles.push({ x: this.player.x, y: this.player.y - 40, tx: target.x, ty: target.y - 30, speed: 760, color: skill.color, life: 1.2, onHit: () => this.hitMonster(target, dmg, { crit, skill }), trail: skill.color });
      this.addEffect({ kind: 'cast', x: this.player.x, y: this.player.y - 30, color: skill.color, life: 0.4, maxLife: 0.4 });
    } else {
      this.addEffect({ kind: 'slash', x: this.player.x, y: this.player.y - 34, tx: target.x, ty: target.y - 30, color: skill.color, life: 0.32, maxLife: 0.32, angle: Math.atan2(target.y - this.player.y, target.x - this.player.x) });
      this.hitMonster(target, dmg, { crit, skill });
      if (skill.effect === 'stun') { target.stunUntil = this.time + 1.45; this.floater(target.x, target.y - 70, t('combat.stunned'), '#f2d27a'); }
      if (skill.effect === 'poison') { target.poisonUntil = Math.max(target.poisonUntil, this.time + 6); target.poisonTick = 0; }
    }
    this.applyLifesteal(dmg);
  }

  doAoeSkill(skill) {
    const targets = this.monsters.filter((m) => !m.dead && dist(m.x, m.y, this.player.x, this.player.y) <= skill.radius + (m.boss ? 26 * m.scale : 0));
    this.addEffect({ kind: 'ring', x: this.player.x, y: this.player.y - 12, r: skill.radius, color: skill.color, life: 0.55, maxLife: 0.55 });
    this.addEffect({ kind: 'burst', x: this.player.x, y: this.player.y - 30, color: skill.color, life: 0.4, maxLife: 0.4 });
    for (const m of targets) {
      const { dmg, crit } = this.skillDamage(skill, 0.9 + Math.random() * 0.2);
      this.hitMonster(m, dmg, { crit, skill });
      if (skill.effect === 'slow') { m.slowUntil = this.time + 4; this.floater(m.x, m.y - 66, t('combat.slowed'), '#9fe8ff'); }
      if (skill.effect === 'bleed') { m.burnUntil = Math.max(m.burnUntil, this.time + 4); m.burnTick = 0; }
      this.applyLifesteal(dmg);
    }
    if (!targets.length) this.notify(t('toast.needTarget'));
    this.shakeTime = Math.max(this.shakeTime, 0.16);
  }

  doGroundSkill(skill, target) {
    const tx = target ? target.x : this.player.x + this.facing * 150;
    const ty = target ? target.y : this.player.y;
    this.addEffect({ kind: 'telegraph', x: tx, y: ty, r: skill.radius, color: skill.color, life: 0.7, maxLife: 0.7, ground: true });
    setTimeout(() => {
      if (!this.running) return;
      this.addEffect({ kind: 'meteor', x: tx, y: ty, r: skill.radius, color: skill.color, life: 0.8, maxLife: 0.8 });
      this.addEffect({ kind: 'ring', x: tx, y: ty - 8, r: skill.radius, color: skill.color, life: 0.55, maxLife: 0.55 });
      for (const m of this.monsters) {
        if (m.dead) continue;
        if (dist(m.x, m.y, tx, ty) <= skill.radius + 12) {
          const { dmg, crit } = this.skillDamage(skill, 0.92 + Math.random() * 0.16);
          this.hitMonster(m, dmg, { crit, skill });
          if (skill.effect === 'burn') { m.burnUntil = Math.max(m.burnUntil, this.time + 5); m.burnTick = 0; }
          this.applyLifesteal(dmg);
        }
      }
      this.shakeTime = Math.max(this.shakeTime, 0.3);
    }, 650);
  }

  doBuffSkill(skill) {
    const heal = this.player.stats.maxHp * 0.24;
    this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + heal);
    this.armorBuffUntil = Date.now() + 8000;
    this.floater(this.player.x, this.player.y - 74, `+${Math.round(heal)}`, '#8ce07a');
    this.addEffect({ kind: 'pillar', x: this.player.x, y: this.player.y, color: skill.color, life: 0.9, maxLife: 0.9 });
  }

  doDashSkill(skill, target) {
    const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    let nx = target.x - Math.cos(angle) * 48;
    let ny = target.y - Math.sin(angle) * 48;
    const resolved = resolveCollision(nx, ny, this.data.props);
    this.addEffect({ kind: 'dash', x: this.player.x, y: this.player.y - 30, tx: resolved.x, ty: resolved.y - 30, color: skill.color, life: 0.4, maxLife: 0.4 });
    this.player.x = clamp(resolved.x, 40, WORLD_SIZE - 40);
    this.player.y = clamp(resolved.y, 40, WORLD_SIZE - 40);
    this.camera.x = this.player.x; this.camera.y = this.player.y;
    const { dmg, crit } = this.skillDamage(skill);
    this.hitMonster(target, dmg, { crit, skill });
    this.empowered = 1;
    this.addEffect({ kind: 'burst', x: this.player.x, y: this.player.y - 30, color: skill.color, life: 0.5, maxLife: 0.5 });
    this.applyLifesteal(dmg);
  }

  applyLifesteal(dmg) {
    const ls = this.player.stats.lifesteal;
    if (ls > 0) {
      const heal = dmg * ls;
      if (heal > 1) this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + heal);
    }
  }

  hitMonster(mon, raw, opts = {}) {
    if (!mon || mon.dead) return;
    const red = mon.defense / (mon.defense + 95 + mon.level * 8);
    let dmg = Math.max(1, Math.round(raw * (1 - red)));
    if (this.armorBuffUntil > 0) dmg = Math.round(dmg * 1.04);
    mon.hp -= dmg;
    mon.flash = 0.12;
    mon.aggro = true;
    mon.lastHit = this.time;
    if (!mon.boss) mon.state = 'chase';
    this.hitCombo++;
    this.comboTimer = 1.6;
    this.floater(mon.x + (Math.random() - 0.5) * 16, mon.y - 64 - (mon.scale - 1) * 20, `${dmg}${opts.crit ? '!' : ''}`, opts.crit ? '#ffd76e' : opts.skill ? opts.skill.color : '#f0e6d0', opts.crit ? 1.35 : 1);
    if (opts.crit) {
      this.addEffect({ kind: 'crit', x: mon.x, y: mon.y - 40, color: '#ffd76e', life: 0.4, maxLife: 0.4 });
      this.sfx('crit');
    }
    this.addEffect({ kind: 'impact', x: mon.x, y: mon.y - 28, color: opts.skill?.color ?? '#ffcf8a', life: 0.3, maxLife: 0.3 });
    if (mon.hp <= 0) this.killMonster(mon);
    else this.sfx('hit');
  }

  killMonster(mon) {
    if (mon.dead) return;
    mon.dead = true;
    mon.hp = 0;
    mon.respawnAt = this.time + (mon.boss ? 95 : mon.elite ? 55 : 28);
    mon.aggro = false;
    this.player.kills = (this.player.kills ?? 0) + 1;
    if (mon.boss) {
      this.player.bossKills = (this.player.bossKills ?? 0) + 1;
      this.bossEngaged = false;
      this.bossWarned = false;
      this.bossSlamTimer = 4;
    }
    if (this.targetUid === mon.uid) this.targetUid = null;
    const xpGain = mon.xp * (this.xpBuffUntil > Date.now() ? 1.25 : 1);
    const res = addXP(this.player, xpGain);
    this.floater(mon.x, mon.y - 82, `+${Math.round(xpGain)} XP`, '#b9d6ff', 0.95);
    if (res.levels > 0) {
      this.addEffect({ kind: 'levelup', x: this.player.x, y: this.player.y, color: '#f4e3b0', life: 1.6, maxLife: 1.6 });
      this.notify(t('hud.levelUp') + ' ' + t('hud.levelUpText', { lv: this.player.level }), 'good');
      this.sfx('levelup');
      this.game.flashLevel = this.time;
      this.save();
    }
    // drops
    const goldAmount = Math.round(mon.gold * (1 + this.player.stats.goldFind));
    this.spawnLoot({ type: 'gold', x: mon.x + (Math.random() - 0.5) * 22, y: mon.y + 4, amount: goldAmount, color: '#d9b76a' });
    const itemChance = mon.boss ? 1 : mon.elite ? 0.95 : 0.68;
    if (Math.random() < itemChance) {
      const rarity = weighted(Math.random, DROP_WEIGHTS);
      const level = clamp(this.zone.min + Math.floor(Math.random() * 4), 1, 60);
      const classId = Math.random() < 0.82 ? this.player.classId : ['warrior', 'mage', 'assassin'][Math.floor(Math.random() * 3)];
      const slots = ['weapon', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet'];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      const item = makeEquip({ classId, slot, rarity, tier: 'T3', level });
      this.spawnLoot({ type: 'item', x: mon.x + (Math.random() - 0.5) * 30, y: mon.y + 2, item, color: RARITY[rarity].color });
    }
    if (Math.random() < (mon.boss ? 1 : mon.elite ? 0.22 : 0.045)) {
      this.spawnLoot({ type: 'gem', x: mon.x + (Math.random() - 0.5) * 26, y: mon.y + 6, amount: 1 + (mon.boss ? 3 : 0), color: '#8fd8ee' });
    }
    if (mon.boss) {
      const stone = makeBossStone(this.zone.id, this.zone.boss.stoneName);
      this.spawnLoot({ type: 'stone', x: mon.x + 10, y: mon.y, item: stone, color: '#f4e3b0' });
      if (!this.player.bossFirstKills[this.zone.id]) {
        this.player.bossFirstKills[this.zone.id] = true;
        addGems(this.player, 20);
        this.floater(mon.x, mon.y - 110, '+20 Gems', '#8fd8ee', 1.1, 1.4);
      }
      this.notify(`${tx(mon.name)} — ${t('combat.victory')}`, 'good');
    }
    // quests
    const done = advanceQuests(this.player, 'kill', mon.defId, 1);
    if (mon.elite) advanceQuests(this.player, 'killElite', mon.defId, 1).forEach((q) => done.push(q));
    if (mon.boss) advanceQuests(this.player, 'boss', mon.defId, 1).forEach((q) => done.push(q));
    for (const q of done) {
      this.notify(t('quest.completeToast', { name: tx(q.name) }), 'good');
      this.sfx('quest');
    }
    this.addEffect({ kind: 'soul', x: mon.x, y: mon.y - 30, color: mon.boss ? '#ffcf8a' : '#b9d6ff', life: 0.9, maxLife: 0.9, scale: mon.scale });
    this.save();
  }

  damagePlayer(amount, source) {
    if (this.dead || this.time < (this.invulnUntil ?? 0)) return;
    const red = this.player.stats.armor / (this.player.stats.armor + 92 + this.player.level * 9);
    let dmg = Math.max(1, Math.round(amount * (1 - red) * 0.9));
    this.player.hp -= dmg;
    this.damageFlash = 1;
    this.floater(this.player.x + (Math.random() - 0.5) * 14, this.player.y - 70, `-${dmg}`, '#ff8a80', 1.05);
    this.addEffect({ kind: 'impact', x: this.player.x, y: this.player.y - 30, color: '#ff6b63', life: 0.3, maxLife: 0.3 });
    this.shakeTime = Math.max(this.shakeTime, 0.22);
    this.sfx('hurt');
    if (this.player.mount) this.player.mount = null;
    if (this.player.hp <= 0) { this.player.hp = 0; this.die(); }
  }

  die() {
    this.dead = true;
    this.targetUid = null;
    this.attackHeld = false;
    this.channel = null;
    this.sfx('death');
    this.save(true);
    App.ui?.onDeath?.();
  }

  respawn() {
    const camp = this.data.camp;
    this.player.hp = Math.round(this.player.stats.maxHp * 0.6);
    this.player.resource = Math.round(this.player.stats.maxResource * 0.4);
    this.player.x = camp.x;
    this.player.y = camp.y + 40;
    this.camera.x = this.player.x; this.camera.y = this.player.y;
    this.dead = false;
    this.invulnUntil = this.time + 2.5;
    this.targetUid = null;
    for (const m of this.monsters) {
      if (!m.boss) { m.aggro = false; m.x = m.homeX; m.y = m.homeY; m.state = 'idle'; }
    }
    this.save();
  }

  gainResource(amount) {
    this.player.resource = Math.min(this.player.stats.maxResource, this.player.resource + amount);
  }

  usePotion() {
    if (this.player.hp >= this.player.stats.maxHp * 0.999) { this.notify(t('toast.potionFull')); return false; }
    const potion = this.player.inventory.find((i) => i.kind === 'consumable' && i.id === 'healPotion' && (i.qty ?? 0) > 0);
    if (!potion) { this.notify(t('common.empty'), 'bad'); return false; }
    const heal = this.player.stats.maxHp * 0.45;
    this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + heal);
    if ((potion.qty ?? 1) > 1) potion.qty--; else this.player.inventory.splice(this.player.inventory.indexOf(potion), 1);
    this.floater(this.player.x, this.player.y - 72, `+${Math.round(heal)}`, '#8ce07a', 1.1);
    this.addEffect({ kind: 'pillar', x: this.player.x, y: this.player.y, color: '#8ce07a', life: 0.7, maxLife: 0.7 });
    this.sfx('heal');
    this.save();
    return true;
  }

  useConsumableItem(item) {
    if (!item) return false;
    if (item.kind !== 'consumable') return false;
    const p = this.player;
    if (item.id === 'healPotion') {
      if (p.hp >= p.stats.maxHp) { this.notify(t('toast.potionFull')); return false; }
      p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * (item.heal ?? 0.45));
      this.floater(p.x, p.y - 70, `+${Math.round(p.stats.maxHp * (item.heal ?? 0.45))}`, '#8ce07a');
    } else if (item.id === 'manaPotion') {
      p.resource = Math.min(p.stats.maxResource, p.resource + p.stats.maxResource * (item.resource ?? 0.45));
      this.floater(p.x, p.y - 70, `+${Math.round(p.stats.maxResource * (item.resource ?? 0.45))}`, '#8fd8ee');
    } else if (item.id === 'elixir') {
      this.xpBuffUntil = Date.now() + 30 * 60000;
      this.notify('+25% XP (30m)', 'good');
    } else if (item.id === 'charm') {
      this.gatherBuffUntil = Date.now() + 30 * 60000;
      this.notify('+25% ' + t('char.gatherSpeed') + ' (30m)', 'good');
    } else if (item.id === 'moonbread') {
      p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.3);
      p.resource = Math.min(p.stats.maxResource, p.resource + p.stats.maxResource * 0.3);
    }
    if ((item.qty ?? 1) > 1) item.qty--; else {
      const idx = p.inventory.indexOf(item);
      if (idx >= 0) p.inventory.splice(idx, 1);
    }
    this.sfx('heal');
    this.save();
    return true;
  }

  toggleMount() {
    if (this.player.mount) {
      this.player.mount = null;
      this.notify(t('hud.mountOff'));
    } else {
      const ids = this.player.mounts.filter((x) => x !== 'none');
      if (!ids.length) {
        this.notify(t('mount.none'), 'bad');
        App.ui?.openPanel?.('mounts');
        return;
      }
      this.player.mount = ids[ids.length - 1];
      this.notify(t('hud.mountOn'));
      this.sfx('mount');
    }
    this.save();
  }

  // ── monsters ────────────────────────────────────────────────────────────
  updateMonsters(dt) {
    const p = this.player;
    for (const m of this.monsters) {
      if (m.dead) {
        if (this.time >= m.respawnAt && this.time > 0) {
          m.dead = false; m.hp = m.maxHp; m.x = m.homeX; m.y = m.homeY; m.aggro = false; m.state = 'idle'; m.stunUntil = 0; m.slowUntil = 0; m.poisonUntil = 0; m.burnUntil = 0;
        }
        continue;
      }
      m.anim += dt;
      m.flash = Math.max(0, m.flash - dt);
      // status effects
      if (m.poisonUntil > this.time) {
        m.poisonTick += dt;
        if (m.poisonTick >= 1) {
          m.poisonTick = 0;
          const dmg = Math.max(1, Math.round(this.player.stats.attack * 0.16));
          m.hp -= dmg;
          this.floater(m.x, m.y - 60, `${dmg}`, '#8ce07a', 0.9);
          if (m.hp <= 0) { this.killMonster(m); continue; }
        }
      }
      if (m.burnUntil > this.time) {
        m.burnTick += dt;
        if (m.burnTick >= 0.8) {
          m.burnTick = 0;
          const dmg = Math.max(1, Math.round(this.player.stats.attack * 0.12));
          m.hp -= dmg;
          this.floater(m.x, m.y - 58, `${dmg}`, '#ff9a5c', 0.9);
          if (m.hp <= 0) { this.killMonster(m); continue; }
        }
      }
      if (m.stunUntil > this.time) continue;
      const dToPlayer = dist(m.x, m.y, p.x, p.y);
      const aggroRange = m.boss ? 360 : m.elite ? 270 : 200;
      const leash = m.boss ? 460 : 500;
      if (this.dead) m.aggro = false;
      if (!m.aggro && dToPlayer < aggroRange && !this.dead) {
        m.aggro = true;
        if (m.boss && !this.bossWarned) {
          this.bossWarned = true;
          this.bossEngaged = true;
          this.notify(t('combat.bossWarning', { name: tx(m.name) }), 'bad');
          this.sfx('boss');
        } else if (m.elite) {
          this.notify(t('combat.eliteWarning'), 'bad');
        }
      }
      const homeDist = dist(m.x, m.y, m.homeX, m.homeY);
      if (m.aggro && homeDist > leash) {
        m.aggro = false;
        m.state = 'return';
      }
      const slowMul = m.slowUntil > this.time ? 0.45 : 1;
      const baseSpeed = m.boss ? 68 : m.elite ? 86 : 78;
      const speed = baseSpeed * slowMul * (m.boss ? 1 : m.scale * 0.9);
      if (m.aggro) {
        const range = (m.boss ? 78 : 46) + m.scale * 6;
        if (dToPlayer > range) {
          const a = Math.atan2(p.y - m.y, p.x - m.x);
          let nx = m.x + Math.cos(a) * speed * dt;
          let ny = m.y + Math.sin(a) * speed * dt;
          // avoid stacking
          const r = resolveCollision(nx, ny, this.data.props);
          m.x = r.x; m.y = r.y;
          m.facing = p.x >= m.x ? 1 : -1;
          m.state = 'chase';
        } else {
          m.state = 'attack';
          m.attackCd -= dt;
          if (m.attackCd <= 0) {
            m.attackCd = m.boss ? 1.35 : m.elite ? 1.5 : 1.7;
            const dmg = m.attack * (0.9 + Math.random() * 0.2) * (m.boss ? 1.15 : 1);
            this.damagePlayer(dmg, m);
            this.addEffect({ kind: 'enemySlash', x: m.x, y: m.y - 30, tx: p.x, ty: p.y - 30, color: '#ff8a6a', life: 0.28, maxLife: 0.28 });
            this.sfx('enemy');
          }
        }
        if (m.boss) this.updateBoss(dt, m);
      } else if (m.state === 'return' && homeDist > 30) {
        const a = Math.atan2(m.homeY - m.y, m.homeX - m.x);
        m.x += Math.cos(a) * speed * 1.2 * dt;
        m.y += Math.sin(a) * speed * 1.2 * dt;
        if (homeDist < 40) { m.state = 'idle'; m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.3); }
      } else {
        // wander
        m.wanderTimer -= dt;
        if (m.wanderTimer <= 0) { m.wanderTimer = 2 + Math.random() * 4; m.wanderAngle = Math.random() * TAU; }
        if (Math.random() < 0.5) {
          const nx = m.x + Math.cos(m.wanderAngle) * 16 * dt;
          const ny = m.y + Math.sin(m.wanderAngle) * 16 * dt;
          if (dist(nx, ny, m.homeX, m.homeY) < 120) { const r = resolveCollision(nx, ny, this.data.props); m.x = r.x; m.y = r.y; }
          m.facing = Math.cos(m.wanderAngle) >= 0 ? 1 : -1;
        }
        m.state = 'idle';
      }
      if (!m.boss && m.aggro && dToPlayer < 300 && Math.random() < 0.02) {
        this.addEffect({ kind: 'aggro', x: m.x, y: m.y - 64, color: '#ff9a6a', life: 0.5, maxLife: 0.5 });
      }
      m.x = clamp(m.x, 40, WORLD_SIZE - 40);
      m.y = clamp(m.y, 40, WORLD_SIZE - 40);
    }
  }

  updateBoss(dt, boss) {
    this.bossSlamTimer -= dt;
    if (this.bossSlamTimer <= 0 && boss.aggro) {
      this.bossSlamTimer = 6.5;
      const tx = this.player.x, ty = this.player.y;
      const warning = { kind: 'telegraph', x: tx, y: ty, r: 120, color: '#ff7a5c', life: 1.2, maxLife: 1.2, ground: true, boss: true };
      this.addEffect(warning);
      this.sfx('bossCast');
      setTimeout(() => {
        if (!this.running || this.dead) return;
        this.addEffect({ kind: 'ring', x: tx, y: ty - 4, r: 120, color: '#ff7a5c', life: 0.5, maxLife: 0.5 });
        this.addEffect({ kind: 'burst', x: tx, y: ty - 20, color: '#ff9a5c', life: 0.6, maxLife: 0.6 });
        if (dist(this.player.x, this.player.y, tx, ty) < 120) this.damagePlayer(boss.attack * 2.3, boss);
        this.shakeTime = 0.35;
      }, 1200);
    }
  }

  // ── loot ────────────────────────────────────────────────────────────────
  spawnLoot(opts) {
    this.loot.push({
      uid: uid('loot'), ...opts, x: opts.x, y: opts.y, phase: Math.random() * TAU,
      born: this.time, pickupDelay: 0.35, vx: (Math.random() - 0.5) * 24, vy: (Math.random() - 0.5) * 12,
    });
  }

  updateLoot(dt) {
    const p = this.player;
    for (const l of this.loot) {
      if (l.collected) continue;
      l.born += dt;
      const d = dist(l.x, l.y, p.x, p.y);
      if ((l.type === 'gold' || l.type === 'gem') && d < 220) {
        const a = Math.atan2(p.y - l.y, p.x - l.x);
        const sp = 160 + (220 - d) * 1.6;
        l.x += Math.cos(a) * sp * dt;
        l.y += Math.sin(a) * sp * dt;
      }
      if (l.born > l.pickupDelay && d < 42) this.collectLoot(l);
    }
    this.loot = this.loot.filter((l) => !l.collected);
  }

  collectLoot(l) {
    if (!l || l.collected) return;
    const p = this.player;
    if (l.type === 'gold') {
      addGold(p, l.amount);
      this.floater(p.x, p.y - 64, `+${l.amount}g`, '#f4d78a', 0.9);
      this.sfx('coin');
    } else if (l.type === 'gem') {
      addGems(p, l.amount);
      this.notify(t('toast.gems', { n: l.amount }), 'good');
      this.sfx('gem');
    } else if (l.type === 'item') {
      if (addItem(p, l.item)) {
        this.notify(t('toast.loot', { item: this.itemLabel(l.item) }), 'good');
        this.sfx('loot');
      } else {
        const gold = sellValue(l.item);
        addGold(p, gold);
        this.notify(t('common.inventoryFull'), 'bad');
      }
    } else if (l.type === 'stone') {
      const stone = l.item;
      p.stones.push(stone);
      if (!p.activeStone) p.activeStone = stone.uid;
      recalc(p);
      this.notify(t('toast.bossStone', { name: tx(stone.name) }), 'good');
      this.sfx('stone');
    }
    l.collected = true;
    this.save();
  }

  itemLabel(item) {
    if (!item) return '';
    if (item.kind === 'equip') {
      return `${this.rarityName(item.rarity)} ${itemName(item)}`.trim();
    }
    return tx(item.name);
  }

  rarityName(r) { return t(`rarity.${r}`); }

  // ── gathering / interaction ─────────────────────────────────────────────
  updateInteraction() {
    const p = this.player;
    let best = null, bd = 78;
    for (const npc of this.npcs ?? []) {
      const d = dist(p.x, p.y, npc.x, npc.y);
      if (d < bd) { bd = d; best = { kind: 'npc', ref: npc, label: t('npc.talkTo', { name: t(npc.nameKey) }), icon: 'talk' }; }
    }
    const portal = this.data.portal;
    const pd = dist(p.x, p.y, portal.x, portal.y);
    if (pd < 95 && pd < bd) { bd = pd; best = { kind: 'portal', ref: portal, label: tx(portal.label), icon: 'portal' }; }
    for (const node of this.nodes) {
      if (!node.ready) continue;
      const d = dist(p.x, p.y, node.x, node.y);
      if (d < 62 && d < bd) { bd = d; best = { kind: 'node', ref: node, label: `${t('common.gather')} · ${t(`gather.${node.type}`)}`, icon: 'herb' }; }
    }
    this.interaction = best;
  }

  interact() {
    if (this.dead) return;
    if (this.channel) return;
    const it = this.interaction;
    if (!it) { this.notify(t('common.none')); return; }
    if (it.kind === 'npc') {
      this.sfx('ui');
      App.ui?.openDialogue?.(it.ref);
    } else if (it.kind === 'portal') {
      this.sfx('ui');
      if (it.ref.target === 'world') App.ui?.openPanel?.('world');
      else App.ui?.travel?.(it.ref.target);
    } else if (it.kind === 'node') {
      if (this.channel) return;
      this.channel = { node: it.ref, elapsed: 0, duration: 0.85 };
      this.sfx('gather');
    }
  }

  finishGather(node) {
    node.ready = false;
    node.respawnAt = this.time + 45;
    const p = this.player;
    const amount = 1 + (Math.random() < 0.35 ? 1 : 0);
    const mat = node.type;
    addMaterial(p, mat, amount);
    if (node.type !== 'crystal' && Math.random() < 0.25) addMaterial(p, 'crystal', 1);
    this.floater(node.x, node.y - 34, `+${amount} ${t(`gather.${mat}`)}`, '#b9ffa0', 1.05);
    this.addEffect({ kind: 'burst', x: node.x, y: node.y - 14, color: node.def.glow, life: 0.5, maxLife: 0.5 });
    this.player.gatherCount = (this.player.gatherCount ?? 0) + 1;
    const done = advanceQuests(p, 'gather', mat, amount);
    for (const q of done) this.notify(t('quest.completeToast', { name: tx(q.name) }), 'good');
    this.notify(t('hud.gathered', { item: t(`gather.${mat}`) }), 'good');
    this.sfx('gatherDone');
    this.save();
  }

  // ── effects / floaters ──────────────────────────────────────────────────
  addEffect(eff) {
    eff.elapsed = 0;
    this.effects.push(eff);
    if (this.effects.length > 80) this.effects.shift();
  }

  floater(x, y, text, color = '#fff', scale = 1, life = 1.1) {
    this.floaters.push({ x, y, text, color, scale, life, maxLife: life, vy: -32 - Math.random() * 12 });
    if (this.floaters.length > 60) this.floaters.shift();
  }

  updateEffects(dt) {
    for (const e of this.effects) { e.elapsed += dt; e.life -= dt; }
    this.effects = this.effects.filter((e) => e.life > 0);
    // nodes respawn
    for (const n of this.nodes) if (!n.ready && this.time >= n.respawnAt) { n.ready = true; }
  }

  updateFloaters(dt) {
    for (const f of this.floaters) { f.life -= dt; f.y += f.vy * dt; f.vy += 42 * dt; }
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }

  updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      const d = dist(pr.x, pr.y, pr.tx, pr.ty);
      if (d < 16) { pr.onHit?.(); pr.done = true; continue; }
      const a = Math.atan2(pr.ty - pr.y, pr.tx - pr.x);
      pr.x += Math.cos(a) * pr.speed * dt;
      pr.y += Math.sin(a) * pr.speed * dt;
      pr.life -= dt;
      this.addEffect({ kind: 'spark', x: pr.x, y: pr.y, color: pr.color, life: 0.25, maxLife: 0.25 });
      if (pr.life <= 0) pr.done = true;
    }
    this.projectiles = this.projectiles.filter((p) => !p.done);
  }

  // ── render ──────────────────────────────────────────────────────────────
  render(dt) {
    const ctx = this.ctx;
    if (!this.data) return;
    const scale = this.w / VIEW_W;
    const viewH = this.h / scale;
    const camX = this.camera.x, camY = this.camera.y;
    let shakeX = 0, shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * 8 * Math.min(1, this.shakeTime * 4);
      shakeY = (Math.random() - 0.5) * 8 * Math.min(1, this.shakeTime * 4);
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(VIEW_W / 2 - camX + shakeX / scale, viewH / 2 - camY + shakeY / scale);

    // terrain
    ctx.drawImage(this.data.terrain, 0, 0, WORLD_SIZE, WORLD_SIZE);

    // ground ambient light pools
    const zone = this.zone;
    ctx.save();
    const amb = ctx.createRadialGradient(this.player.x, this.player.y, 50, this.player.x, this.player.y, 380);
    amb.addColorStop(0, hexA(zone.palette.light, 0.04)); amb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = amb; ctx.fillRect(this.player.x - 400, this.player.y - 400, 800, 800);
    ctx.restore();

    // ground effects (telegraphs, rings)
    for (const e of this.effects) {
      if (e.kind === 'telegraph') this.drawTelegraph(e);
    }
    if (this.channel) this.drawChannelRing();

    // renderables sorted by feet Y
    const renderables = [];
    for (const prop of this.data.props) {
      renderables.push({ y: prop.y, draw: () => this.drawProp(prop) });
    }
    for (const d of this.data.decorations) renderables.push({ y: d.y, draw: () => art.drawDecoration(ctx, d, this.time) });
    for (const npc of this.npcs ?? []) renderables.push({ y: npc.y, draw: () => art.drawNPC(ctx, npc, this.time) });
    renderables.push({ y: this.data.portal.y, draw: () => art.drawPortal(ctx, this.data.portal, this.time, zone.camp) });
    for (const node of this.nodes) renderables.push({ y: node.y, draw: () => art.drawGatherNode(ctx, node, this.time) });
    for (const l of this.loot) renderables.push({ y: l.y, draw: () => art.drawLoot(ctx, l, this.time) });
    for (const m of this.monsters) {
      if (m.dead) continue;
      renderables.push({ y: m.y, draw: () => this.drawMonster(m) });
    }
    renderables.push({ y: this.player.y, draw: () => {
      art.drawWorldHero(ctx, this.player, this.player.x, this.player.y, this.time, {
        moving: this.moving, facing: this.facing, attackAnim: this.attackAnim, combatGlow: this.inCombat(),
      });
      if (this.interaction) art.drawInteractRing(ctx, this.interaction.ref.x, this.interaction.ref.y, this.time);
    } });
    renderables.sort((a, b) => a.y - b.y);
    for (const r of renderables) r.draw();

    // effects above ground
    for (const e of this.effects) {
      if (e.kind !== 'telegraph') this.drawEffect(e);
    }
    // projectiles
    for (const pr of this.projectiles) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(pr.x, pr.y, 1, pr.x, pr.y, 14);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, hexA(pr.color, 0.8)); g.addColorStop(1, hexA(pr.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pr.x, pr.y, 14, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // floaters
    for (const f of this.floaters) {
      const a = Math.min(1, f.life / 0.3);
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = `700 ${Math.round(11 * f.scale)}px Inter, sans-serif`;
      ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
    ctx.restore();

    // screen-space overlays
    this.drawScreenOverlays(scale, dt);
  }

  drawProp(prop) {
    const ctx = this.ctx;
    const s = 0.66 * prop.scale;
    const w = 200 * s, h = 220 * s;
    ctx.save();
    ctx.globalAlpha = 0.92;
    // base shadow
    const g = ctx.createRadialGradient(prop.x, prop.y, 1, prop.x, prop.y, 34 * prop.scale);
    g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.translate(prop.x, prop.y); ctx.scale(1, 0.3); ctx.translate(-prop.x, -prop.y);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(prop.x, prop.y, 34 * prop.scale, 0, TAU); ctx.fill(); ctx.restore();
    ctx.drawImage(prop.sprite, prop.x - w / 2, prop.y - h, w, h);
    ctx.restore();
  }

  drawMonster(m) {
    const ctx = this.ctx;
    const sprite = getMonsterSprite(m.sprite, m.tint, m.eye);
    const size = (m.boss ? 122 : 88) * m.scale;
    const bob = m.state === 'chase' ? Math.abs(Math.sin(m.anim * 9)) * -3 : Math.sin(m.anim * 2) * 1.5;
    art.drawShadow(ctx, m.x, m.y, (m.boss ? 38 : 24) * m.scale, (m.boss ? 12 : 8) * m.scale, 0.42);
    // aura
    if (m.elite || m.boss) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const color = m.boss ? '#ff7a5c' : '#f0c060';
      const g = ctx.createRadialGradient(m.x, m.y - 16, 4, m.x, m.y - 16, size * 0.7);
      g.addColorStop(0, hexA(color, 0.14)); g.addColorStop(0.7, hexA(color, 0.05)); g.addColorStop(1, hexA(color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y - 16, size * 0.7, 0, TAU); ctx.fill();
      ctx.restore();
      // elite ring
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.35); ctx.strokeStyle = hexA(color, 0.55); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, size * 0.34 + Math.sin(this.time * 2) * 2, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (m === this.target) {
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.35); ctx.strokeStyle = 'rgba(255,220,140,.8)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(0, 0, size * 0.38, 0, TAU); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = this.time * 1.5 + i * Math.PI / 2; ctx.fillStyle = 'rgba(255,220,140,.8)'; ctx.beginPath(); ctx.arc(Math.cos(a) * size * 0.38, Math.sin(a) * size * 0.38, 1.8, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(m.x, m.y + bob);
    ctx.scale(m.facing, 1);
    if (m.flash > 0) { ctx.globalAlpha = 0.85 + Math.sin(this.time * 40) * 0.1; }
    ctx.drawImage(sprite, -size / 2, -size, size, size);
    ctx.restore();
    if (m.stunUntil > this.time) {
      for (let i = 0; i < 3; i++) {
        const a = this.time * 3 + (i / 3) * TAU;
        ctx.fillStyle = '#ffe08a';
        ctx.beginPath(); ctx.arc(m.x + Math.cos(a) * 16 * m.scale, m.y - size - 12 + Math.sin(a) * 4, 2, 0, TAU); ctx.fill();
      }
    }
    if (m.slowUntil > this.time) {
      ctx.strokeStyle = 'rgba(159,232,255,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(m.x, m.y - size * 0.4, size * 0.3, size * 0.16, 0, 0, TAU); ctx.stroke();
    }
    // nameplate / hp bar
    const barW = m.boss ? 0 : Math.min(72, 42 + m.scale * 14);
    if (!m.boss) {
      const y = m.y - size - 12;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `600 ${m.elite ? 9.5 : 8.5}px Inter, sans-serif`;
      ctx.fillStyle = m.elite ? '#f4d78a' : 'rgba(232,226,212,.82)';
      ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 2.5;
      const label = tx(m.name) + (m.elite ? ' · ' + t('hud.elite') : '');
      ctx.strokeText(label, m.x, y - 4);
      ctx.fillText(label, m.x, y - 4);
      ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(m.x - barW / 2, y, barW, 4);
      ctx.fillStyle = m.elite ? '#e0a84a' : '#bf554d'; ctx.fillRect(m.x - barW / 2, y, barW * clamp(m.hp / m.maxHp, 0, 1), 4);
      ctx.strokeStyle = m.elite ? 'rgba(244,215,138,.6)' : 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.8; ctx.strokeRect(m.x - barW / 2, y, barW, 4);
      ctx.restore();
    }
    if (m.state === 'attack') {
      ctx.strokeStyle = 'rgba(255,120,90,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(m.x, m.y - size * 0.3, size * 0.4, 0, TAU); ctx.stroke();
    }
  }

  drawTelegraph(e) {
    const ctx = this.ctx;
    const k = clamp(e.elapsed / e.maxLife, 0, 1);
    const alpha = 0.25 + k * 0.4;
    ctx.save();
    ctx.translate(e.x, e.y); ctx.scale(1, 0.5);
    ctx.fillStyle = hexA(e.color, alpha * 0.25);
    ctx.beginPath(); ctx.arc(0, 0, e.r * (0.7 + k * 0.3), 0, TAU); ctx.fill();
    ctx.strokeStyle = hexA(e.color, alpha); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, TAU); ctx.stroke();
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.66, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    // fill sweep
    ctx.fillStyle = hexA(e.color, 0.18 * k);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, e.r * (0.2 + k * 0.8), 0, TAU * k); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  drawChannelRing() {
    const ctx = this.ctx;
    const n = this.channel.node;
    const k = this.channel.elapsed / this.channel.duration;
    ctx.save();
    ctx.translate(n.x, n.y); ctx.scale(1, 0.35);
    ctx.strokeStyle = 'rgba(180,255,150,.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
    ctx.restore();
  }

  drawEffect(e) {
    const ctx = this.ctx;
    const k = clamp(1 - e.life / e.maxLife, 0, 1);
    if (e.kind === 'slash' || e.kind === 'enemySlash') {
      const alpha = 1 - k;
      ctx.save(); ctx.translate(e.x + (e.tx - e.x) * 0.5, e.y + (e.ty - e.y) * 0.5); ctx.rotate(e.angle);
      ctx.strokeStyle = hexA(e.color, alpha * 0.85); ctx.lineWidth = 4 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(0, 0, 30 + k * 10, -1.0 + k * 0.4, 1.0 + k * 0.4); ctx.stroke();
      ctx.strokeStyle = hexA('#ffffff', alpha * 0.5); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 28 + k * 8, -0.8, 0.8); ctx.stroke();
      ctx.restore();
    } else if (e.kind === 'bolt') {
      const alpha = 1 - k;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexA(e.color, alpha); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.tx, e.ty); ctx.stroke();
      const g = ctx.createRadialGradient(e.tx, e.ty, 1, e.tx, e.ty, 14);
      g.addColorStop(0, hexA('#fff', alpha)); g.addColorStop(0.4, hexA(e.color, alpha * 0.7)); g.addColorStop(1, hexA(e.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.tx, e.ty, 14, 0, TAU); ctx.fill();
      ctx.restore();
    } else if (e.kind === 'ring') {
      const r = e.r * (0.25 + k * 0.85);
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1, 0.45);
      ctx.strokeStyle = hexA(e.color, (1 - k) * 0.85); ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.fillStyle = hexA(e.color, (1 - k) * 0.12); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.restore();
    } else if (e.kind === 'burst' || e.kind === 'impact' || e.kind === 'crit') {
      const r = (e.kind === 'crit' ? 26 : 18) + k * 30;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, r);
      g.addColorStop(0, hexA('#ffffff', (1 - k) * 0.8)); g.addColorStop(0.35, hexA(e.color, (1 - k) * 0.5)); g.addColorStop(1, hexA(e.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.fill();
      if (e.kind === 'crit') {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + k * 2;
          ctx.strokeStyle = hexA('#ffe9a0', 1 - k); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(e.x + Math.cos(a) * r * 0.5, e.y + Math.sin(a) * r * 0.5); ctx.lineTo(e.x + Math.cos(a) * r * 1.3, e.y + Math.sin(a) * r * 1.3); ctx.stroke();
        }
      }
      ctx.restore();
    } else if (e.kind === 'pillar' || e.kind === 'levelup') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const h = e.kind === 'levelup' ? 220 : 100;
      const g = ctx.createLinearGradient(e.x, e.y - h, e.x, e.y);
      g.addColorStop(0, hexA(e.color, 0)); g.addColorStop(0.7, hexA(e.color, (1 - k) * 0.35)); g.addColorStop(1, hexA(e.color, (1 - k) * 0.06));
      ctx.fillStyle = g; ctx.fillRect(e.x - 20, e.y - h, 40, h);
      if (e.kind === 'levelup') {
        ctx.strokeStyle = hexA('#ffe9a0', (1 - k) * 0.8); ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(e.x, e.y - 12, 34 + i * 14, 12 + i * 6, 0, 0, TAU); ctx.stroke(); }
        for (let i = 0; i < 24; i++) {
          const a = Math.random() * TAU, r = Math.random() * 60;
          ctx.fillStyle = hexA('#ffe9a0', (1 - k) * 0.8);
          ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * r, e.y - Math.random() * 120, 1.5, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    } else if (e.kind === 'spark') {
      ctx.save(); ctx.fillStyle = hexA(e.color, 1 - k);
      ctx.beginPath(); ctx.arc(e.x, e.y, 2.5 * (1 - k) + 0.5, 0, TAU); ctx.fill(); ctx.restore();
    } else if (e.kind === 'dash') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexA(e.color, (1 - k) * 0.6); ctx.lineWidth = 10 * (1 - k);
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.quadraticCurveTo((e.x + e.tx) / 2, Math.min(e.y, e.ty) - 30, e.tx, e.ty); ctx.stroke();
      ctx.restore();
    } else if (e.kind === 'cast') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = hexA(e.color, (1 - k) * 0.6); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 20 + i * 9 + k * 20, 8 + i * 3, this.time + i, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    } else if (e.kind === 'soul') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(e.x, e.y - k * 50, 1, e.x, e.y - k * 50, 30 * e.scale);
      g.addColorStop(0, hexA('#fff', (1 - k) * 0.6)); g.addColorStop(0.4, hexA(e.color, (1 - k) * 0.4)); g.addColorStop(1, hexA(e.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y - k * 50, 30 * e.scale, 0, TAU); ctx.fill();
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * TAU, r = 20 * e.scale * (1 - k);
        ctx.fillStyle = hexA(e.color, (1 - k) * 0.7);
        ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * r, e.y - k * 50 + Math.sin(a) * r, 1.5, 0, TAU); ctx.fill();
      }
      ctx.restore();
    } else if (e.kind === 'meteor') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const fall = k;
      const mx = e.x + 160 * (1 - fall), my = e.y - 220 * (1 - fall);
      const g = ctx.createRadialGradient(mx, my, 2, mx, my, 26);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, hexA(e.color, 0.9)); g.addColorStop(1, hexA(e.color, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, 26, 0, TAU); ctx.fill();
      ctx.strokeStyle = hexA(e.color, 0.5); ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(mx + 30, my - 30); ctx.lineTo(mx + 90, my - 90); ctx.stroke();
      ctx.restore();
    } else if (e.kind === 'aggro') {
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = e.color; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('!', e.x, e.y - k * 8);
      ctx.restore();
    }
  }

  drawScreenOverlays(scale, dt) {
    const ctx = this.ctx;
    const zone = this.zone;
    // weather
    this.drawWeather(zone);
    // ambient tint / vignette
    const vig = ctx.createRadialGradient(this.w / 2, this.h * 0.46, this.w * 0.2, this.w / 2, this.h * 0.5, this.w * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, hexA(zone.palette.fog, 0.75));
    ctx.fillStyle = vig; ctx.fillRect(0, 0, this.w, this.h);
    // moon/stars subtle top light
    const lg = ctx.createLinearGradient(0, 0, 0, this.h * 0.4);
    lg.addColorStop(0, hexA(zone.palette.light, 0.035)); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, this.w, this.h * 0.4);
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(140,20,18,${this.damageFlash * 0.22})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    // boss bar
    const boss = this.monsters.find((m) => m.boss && !m.dead && m.aggro);
    if (boss) {
      const bw = Math.min(this.w - 64, 320), bx = (this.w - bw) / 2, by = 64 + (this.h > 700 ? 20 : 0);
      ctx.save();
      ctx.fillStyle = 'rgba(6,6,10,.72)'; ctx.fillRect(bx - 4, by - 4, bw + 8, 30);
      ctx.strokeStyle = 'rgba(217,183,106,.45)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 4, by - 4, bw + 8, 30);
      const g = ctx.createLinearGradient(bx, by, bx + bw, by);
      g.addColorStop(0, '#8e2d2b'); g.addColorStop(0.5, '#d24a3f'); g.addColorStop(1, '#8e2d2b');
      ctx.fillStyle = 'rgba(30,10,12,.9)'; ctx.fillRect(bx, by + 10, bw, 10);
      ctx.fillStyle = g; ctx.fillRect(bx, by + 10, bw * clamp(boss.hp / boss.maxHp, 0, 1), 10);
      ctx.strokeStyle = 'rgba(255,220,170,.25)'; ctx.strokeRect(bx, by + 10, bw, 10);
      ctx.font = '600 11px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f0dfbd';
      ctx.fillText(`${tx(boss.name).toUpperCase()}  ·  ${t('combat.monsterLevel', { lv: boss.level })}`, this.w / 2, by + 5);
      ctx.restore();
    }
    // zone title
    const zt = this.zoneTitleUntil - this.time;
    if (zt > 0) {
      const a = Math.min(1, zt / 0.6) * Math.min(1, (4.2 - zt) / 0.5 + 0.2);
      const cy = this.h * 0.28;
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1);
      const g = ctx.createLinearGradient(0, cy - 50, 0, cy + 50);
      g.addColorStop(0, 'rgba(5,5,8,0)'); g.addColorStop(0.5, 'rgba(5,5,8,.55)'); g.addColorStop(1, 'rgba(5,5,8,0)');
      ctx.fillStyle = g; ctx.fillRect(0, cy - 50, this.w, 100);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#b9a98a'; ctx.font = '300 9px Inter, sans-serif'; ctx.letterSpacing = '3px';
      ctx.fillText(t('zone.enterTitle').toUpperCase(), this.w / 2, cy - 12);
      ctx.fillStyle = '#f4e3b0'; ctx.font = '600 26px Cinzel, Georgia, serif';
      ctx.shadowColor = 'rgba(217,183,106,.4)'; ctx.shadowBlur = 12;
      ctx.fillText(t(zone.key), this.w / 2, cy + 18);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(200,190,170,.75)'; ctx.font = '400 9.5px Inter, sans-serif';
      ctx.fillText(`${t('zone.levelRange', { min: zone.min, max: zone.max })}  ·  ${t(zone.descKey).slice(0, 52)}${t(zone.descKey).length > 52 ? '…' : ''}`, this.w / 2, cy + 36);
      ctx.restore();
    }
    // interaction prompt label near bottom center
    if (this.interaction && !this.dead) {
      const label = this.interaction.label;
      ctx.save(); ctx.textAlign = 'center'; ctx.font = '500 10px Inter, sans-serif';
      const tw = ctx.measureText(label).width;
      const bx = this.w / 2 - tw / 2 - 14, by = this.h - 178;
      ctx.fillStyle = 'rgba(6,7,10,.72)'; roundRectLocal(ctx, bx, by, tw + 28, 24, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(217,183,106,.35)'; ctx.stroke();
      ctx.fillStyle = '#efe4ca'; ctx.fillText(label, this.w / 2, by + 15);
      ctx.restore();
    }
    // channel bar
    if (this.channel) {
      const k = this.channel.elapsed / this.channel.duration;
      const bw = 180, bx = this.w / 2 - bw / 2, by = this.h - 200;
      ctx.save(); ctx.fillStyle = 'rgba(5,6,9,.75)'; roundRectLocal(ctx, bx, by, bw, 8, 3); ctx.fill();
      ctx.fillStyle = '#9fe8a0'; roundRectLocal(ctx, bx, by, bw * k, 8, 3); ctx.fill();
      ctx.restore();
    }
    // combo
    if (this.hitCombo > 2 && this.comboTimer > 0) {
      ctx.save(); ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(244,220,160,.85)';
      ctx.font = '600 18px Cinzel, Georgia, serif';
      ctx.fillText(`${this.hitCombo}×`, this.w - 26, this.h - 230);
      ctx.font = '400 8px Inter'; ctx.fillStyle = 'rgba(220,210,190,.55)';
      ctx.fillText(t('hud.combo').toUpperCase(), this.w - 26, this.h - 216);
      ctx.restore();
    }
  }

  drawWeather(zone) {
    const ctx = this.ctx;
    const t = this.time;
    const w = this.w, h = this.h;
    const type = zone.weather;
    ctx.save();
    if (type === 'snow') {
      ctx.fillStyle = 'rgba(240,250,255,.65)';
      for (let i = 0; i < 70; i++) {
        const x = ((i * 137 + t * 18 + Math.sin(t + i) * 20) % (w + 40)) - 20;
        const y = ((i * 71 + t * 42) % (h + 40)) - 20;
        ctx.globalAlpha = 0.35 + (i % 4) * 0.12;
        ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.7, 0, TAU); ctx.fill();
      }
    } else if (type === 'sand') {
      ctx.strokeStyle = 'rgba(230,200,140,.18)'; ctx.lineWidth = 1;
      for (let i = 0; i < 34; i++) {
        const x = ((i * 173 + t * 220) % (w + 80)) - 40;
        const y = ((i * 97 + t * 10) % h);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18 + (i % 4) * 6, y + 2); ctx.stroke();
      }
    } else if (type === 'ash') {
      for (let i = 0; i < 60; i++) {
        const x = ((i * 127 + t * 12 + Math.sin(t * 0.5 + i) * 24) % (w + 30)) - 15;
        const y = ((i * 83 + t * 26) % (h + 30)) - 15;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,150,100,.4)' : 'rgba(200,180,170,.3)';
        ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.6, 0, TAU); ctx.fill();
      }
    } else if (type === 'fireflies' || type === 'spores' || type === 'stars') {
      const color = type === 'spores' ? '140,224,122' : type === 'stars' ? '216,200,255' : '240,220,150';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++) {
        const x = ((i * 151 + Math.sin(t * 0.5 + i * 2) * 40 + t * 6) % (w + 40)) - 20;
        const y = (i * 89 + Math.cos(t * 0.7 + i) * 26) % h;
        const a = 0.2 + Math.abs(Math.sin(t * 1.4 + i)) * 0.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 5);
        g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
      }
      ctx.restore();
    } else if (type === 'mist') {
      for (let i = 0; i < 5; i++) {
        const y = (i * 160 + t * 8) % (h + 200) - 100;
        const x = Math.sin(t * 0.2 + i) * 60;
        const g = ctx.createLinearGradient(0, y, 0, y + 120);
        g.addColorStop(0, 'rgba(180,200,210,0)'); g.addColorStop(0.5, 'rgba(180,200,210,.05)'); g.addColorStop(1, 'rgba(180,200,210,0)');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, 120);
      }
    } else if (type === 'embers') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 32; i++) {
        const x = ((i * 119 + t * 20) % (w + 30)) - 15;
        const y = h - ((i * 97 + t * 50) % (h + 40));
        const a = 0.2 + (i % 4) * 0.12;
        ctx.fillStyle = `rgba(255,150,70,${a})`;
        ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.6, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawMinimap() {
    if (!this.mctx) return;
    const ctx = this.mctx;
    const dpr = this.dpr;
    const w = this.minimap.width / dpr, h = this.minimap.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const z = this.zone;
    ctx.fillStyle = z.palette.base2;
    ctx.fillRect(0, 0, w, h);
    // terrain-ish blotches
    ctx.fillStyle = z.palette.base3;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc((i * 53) % w, (i * 37) % h, 10 + (i % 3) * 4, 0, TAU); ctx.fill(); }
    // path
    ctx.strokeStyle = hexA(z.palette.path, 0.6); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.84); ctx.lineTo(w * 0.56, h * 0.6); ctx.lineTo(w * 0.44, h * 0.45); ctx.lineTo(w * 0.5, h * 0.2); ctx.stroke();
    const px = (this.player.x / WORLD_SIZE) * w, py = (this.player.y / WORLD_SIZE) * h;
    // props
    ctx.fillStyle = hexA(z.palette.prop2, 0.5);
    for (const p of this.data.props) { if (p.type === 'tree' || p.type === 'pine' || p.type === 'pineSnow' || p.type === 'deadTree') { ctx.beginPath(); ctx.arc((p.x / WORLD_SIZE) * w, (p.y / WORLD_SIZE) * h, 1, 0, TAU); ctx.fill(); } }
    // nodes
    for (const n of this.nodes) { if (!n.ready) continue; ctx.fillStyle = '#8ce07a'; ctx.beginPath(); ctx.arc((n.x / WORLD_SIZE) * w, (n.y / WORLD_SIZE) * h, 1.4, 0, TAU); ctx.fill(); }
    // npcs
    for (const n of this.npcs ?? []) { ctx.fillStyle = '#f2d27a'; ctx.beginPath(); ctx.arc((n.x / WORLD_SIZE) * w, (n.y / WORLD_SIZE) * h, 2, 0, TAU); ctx.fill(); }
    // monsters
    for (const m of this.monsters) { if (m.dead) continue; ctx.fillStyle = m.boss ? '#ff6b5a' : m.elite ? '#ffb060' : 'rgba(220,90,80,.8)'; ctx.beginPath(); ctx.arc((m.x / WORLD_SIZE) * w, (m.y / WORLD_SIZE) * h, m.boss ? 2.6 : 1.2, 0, TAU); ctx.fill(); }
    // portal
    ctx.fillStyle = '#d9b76a'; ctx.beginPath(); ctx.arc((this.data.portal.x / WORLD_SIZE) * w, (this.data.portal.y / WORLD_SIZE) * h, 2, 0, TAU); ctx.fill();
    // camera view rect
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1;
    const scale = this.w / VIEW_W; const viewH = this.h / scale;
    ctx.strokeRect(((this.camera.x - VIEW_W / 2) / WORLD_SIZE) * w, ((this.camera.y - viewH / 2) / WORLD_SIZE) * h, (VIEW_W / WORLD_SIZE) * w, (viewH / WORLD_SIZE) * h);
    // player arrow
    ctx.save(); ctx.translate(px, py); ctx.rotate(this.facing > 0 ? 0 : Math.PI);
    ctx.fillStyle = '#fff4d0'; ctx.beginPath(); ctx.moveTo(3.5, 0); ctx.lineTo(-2.5, -2.6); ctx.lineTo(-1, 0); ctx.lineTo(-2.5, 2.6); ctx.closePath(); ctx.fill();
    ctx.restore();
    // frame
    ctx.strokeStyle = 'rgba(217,183,106,.25)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  // ── input ───────────────────────────────────────────────────────────────
  setJoystick(x, y, active = true) {
    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    this.joystick = { x, y, active: active && mag > 0.1 };
  }

  onCanvasPointer(e) {
    if (this.dead) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const scale = this.w / VIEW_W;
    const viewH = this.h / scale;
    const wx = (sx / scale) + (this.camera.x - VIEW_W / 2);
    const wy = (sy / scale) + (this.camera.y - viewH / 2);
    // tap monster
    let hit = null, hd = 46;
    for (const m of this.monsters) {
      if (m.dead) continue;
      const d = dist(wx, wy, m.x, m.y - 26 * m.scale);
      const r = (m.boss ? 46 : 30) * m.scale;
      if (d < Math.max(hd, r)) { hd = d; hit = m; }
    }
    if (hit) {
      this.targetUid = hit.uid;
      this.facing = hit.x >= this.player.x ? 1 : -1;
      this.tryBasicAttack();
      this.attackHeld = true;
      setTimeout(() => { this.attackHeld = false; }, 300);
      return;
    }
    // tap loot
    for (const l of this.loot) {
      if (dist(wx, wy, l.x, l.y - 10) < 26 && dist(l.x, l.y, this.player.x, this.player.y) < 240) {
        this.collectLoot(l);
        return;
      }
    }
    // tap npc
    for (const n of this.npcs ?? []) {
      if (dist(wx, wy, n.x, n.y - 30) < 36) {
        if (dist(n.x, n.y, this.player.x, this.player.y) < 120) App.ui?.openDialogue?.(n);
        return;
      }
    }
    // tap ground: clear target
    this.targetUid = null;
  }

  onKeyDown(e) {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    this.keys.add(e.code);
    if (e.code === 'Space') { e.preventDefault(); this.attackHeld = true; }
    if (e.code === 'Digit1') this.useSkill(0);
    if (e.code === 'Digit2') this.useSkill(1);
    if (e.code === 'Digit3') this.useSkill(2);
    if (e.code === 'KeyQ') this.usePotion();
    if (e.code === 'KeyE') this.interact();
    if (e.code === 'KeyM') this.toggleMount();
    if (e.code === 'Escape') App.ui?.toggleMenu?.();
  }

  getHudState() {
    const p = this.player;
    const cls = CLASSES[p.classId];
    return {
      hp: p.hp, maxHp: p.stats.maxHp,
      resource: p.resource, maxResource: p.stats.maxResource,
      resourceType: cls.resource,
      zone: this.zone,
      target: this.target,
      interaction: this.interaction,
      channel: this.channel,
      dead: this.dead,
      cooldowns: this.cooldowns,
      skills: cls.skills,
      basicCd: this.attackCooldown,
      mount: p.mount,
      buffs: { armor: this.armorBuffUntil > Date.now(), xp: this.xpBuffUntil > Date.now(), gather: this.gatherBuffUntil > Date.now() },
      inCombat: this.inCombat(),
      level: p.level,
      xp: p.xp, xpNext: 0,
      combo: this.hitCombo,
      boss: this.monsters.find((m) => m.boss && !m.dead && m.aggro) ?? null,
    };
  }

  // ── platform hooks ──────────────────────────────────────────────────────
  notify(text, type = '') { App.ui?.toast?.(text, type); }
  sfx(name) { App.audio?.play?.(name); }
  save(immediate = false) {
    this.game.settings = this.game.settings ?? {};
    this.game.settings.camera = null;
    saveNow(immediate);
  }
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRectLocal(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
