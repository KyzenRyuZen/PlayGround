/* ==========================================================================
   EBONSPIRE · live battle scene
   Canvas renderer, ambient particles, attack effects, damage numbers and HUD.
   ========================================================================== */

import { Engine } from '../core/engine.js';
import { stageCoords, stageKind, DUNGEON_BY_ID } from '../data/monsters.js';
import { CLASSES } from '../data/classes.js';
import { icon } from './icons.js';
import { esc, fmt } from './components.js';
import { heroArt, monsterArt, regionArt } from './sprites.js';

const HP_COLOR = '#e4677a';
const MANA_COLOR = '#6da8ff';

function imageCache() {
  const cache = new Map();
  return function get(src) {
    if (!cache.has(src)) {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
      cache.set(src, img);
    }
    return cache.get(src);
  };
}

function svgURI(svg) { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }
const getImage = imageCache();

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

class BattleRenderer {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts;
    this.w = 800; this.h = 300; this.dpr = 1;
    this.running = true;
    this.t = 0;
    this.last = performance.now();
    this.heroLunge = 0;
    this.monsterLunge = 0;
    this.heroFlash = 0;
    this.monsterFlash = 0;
    this.monsterAppear = 1;
    this.heroDown = 0;
    this.shake = 0;
    this.levelBurst = 0;
    this.death = null;
    this.numbers = [];
    this.bursts = [];
    this.strikes = [];
    this.projectiles = [];
    this.lastUid = null;
    this.ambient = [];
    this.bgKey = '';
    this.unsubs = [];
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
    this.bind();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(200, rect.width);
    this.h = Math.max(140, rect.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.seedAmbient();
  }

  scene() {
    const state = Engine.state;
    if (!state) return null;
    if (Engine.battle.mode === 'dungeon' && Engine.battle.dungeonId) {
      const dungeon = DUNGEON_BY_ID[Engine.battle.dungeonId];
      const region = dungeon ? (stageCoords((dungeon.regionId ? regionIndexById(dungeon.regionId) : 1) * 20).region) : null;
      return { region, kind: 'dungeon', dungeon, stage: dungeon?.level || 1, regionIndex: region?.index || 1 };
    }
    const coords = stageCoords(state.progress.currentIndex);
    return { region: coords.region, kind: stageKind(coords.stage), stage: coords.stage, regionIndex: coords.regionIndex, coords };
  }

  seedAmbient() {
    const settings = Engine.state?.settings || {};
    const scene = this.scene();
    const type = scene?.region?.palette?.particle || 'firefly';
    if (settings.particles === false || settings.reduceMotion) {
      this.ambient = [];
      return;
    }
    const count = type === 'snow' ? 55 : type === 'star' ? 48 : 34;
    this.ambient = Array.from({ length: count }, () => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      r: 0.6 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * (type === 'snow' ? 10 : 5),
      vy: type === 'ember' ? -(6 + Math.random() * 14) : type === 'snow' ? 8 + Math.random() * 14 : type === 'soul' ? -(4 + Math.random() * 9) : (Math.random() - 0.5) * 5,
      a: 0.12 + Math.random() * 0.5,
      p: Math.random() * Math.PI * 2,
      type,
    }));
  }

  bgImage() {
    const scene = this.scene();
    if (!scene?.region) return null;
    return getImage(svgURI(regionArt(scene.region)));
  }

  heroImage() {
    const state = Engine.state;
    if (!state) return null;
    return getImage(svgURI(heroArt(state.hero.classId)));
  }

  monsterImage(monster) {
    if (!monster) return null;
    return getImage(svgURI(monsterArt(monster.visual, monster.palette, { colors: null })));
  }

  bind() {
    const on = (type, fn) => this.unsubs.push(Engine.on(type, fn));
    on('hit', e => {
      if (e.source === 'hero') {
        this.heroLunge = 1;
        this.monsterFlash = 1;
        this.addStrike(e, 'hero');
        this.addNumber(e.damage, e.crit ? '#ffd06b' : '#f4e4c3', e.crit, 'monster');
        this.shake = e.crit ? 2.5 : 0.8;
      } else {
        this.monsterLunge = 1;
        this.heroFlash = 1;
        this.addStrike(e, 'monster');
        this.addNumber(e.damage, e.crit ? '#ff9cae' : '#ff7c8a', e.crit, 'hero');
        this.shake = e.crit ? 4 : 1.8;
      }
    });
    on('spawn', () => {
      this.monsterAppear = 0;
      this.monsterFlash = 0;
      this.lastUid = Engine.battle.monster?.uid || null;
    });
    on('kill', e => {
      this.death = { monster: e.monster, t: 0 };
      this.monsterFlash = 0;
      for (let i = 0; i < 6; i++) {
        this.bursts.push({ x: this.monsterPos().x + (Math.random() - .5) * 40, y: this.monsterPos().y - 50, vx: (Math.random() - .5) * 70, vy: -20 - Math.random() * 80, life: .8, max: .8, r: 1 + Math.random() * 3, color: e.monster?.palette?.glow || '#ffb06e' });
      }
    });
    on('heroDown', () => { this.heroDown = 1; this.shake = 6; });
    on('respawn', () => { this.heroDown = 0; });
    on('levelup', () => { this.levelBurst = 1; });
    on('dungeonClear', () => { this.levelBurst = 1; });
  }

  addStrike(e, source) {
    const cls = Engine.state?.hero?.classId || 'warrior';
    const ranged = cls === 'mage' || cls === 'archer' || source !== 'hero';
    this.strikes.push({
      t: 0, life: ranged ? .4 : .3, color: e.color || (e.crit ? '#ffd06b' : '#f4e4c3'),
      crit: e.crit, source, ranged, element: e.element, skill: e.skill,
    });
    if (ranged) {
      this.projectiles.push({
        t: 0, life: .22, from: source === 'hero' ? this.heroPos() : this.monsterPos(),
        to: source === 'hero' ? this.monsterPos() : this.heroPos(),
        color: e.color || '#b49bff', source, element: e.element,
      });
    }
  }

  addNumber(amount, color, crit, target) {
    if (!amount) return;
    if (Engine.state?.settings?.damageNumbers === false) return;
    const pos = target === 'hero' ? this.heroPos() : this.monsterPos();
    const extra = crit ? 9 : 0;
    this.numbers.push({
      x: pos.x + (Math.random() - .5) * (target === 'hero' ? 40 : 54),
      y: pos.y - (target === 'hero' ? 80 : 60) - Math.random() * 18,
      vy: -26 - Math.random() * 16, t: 0, life: crit ? 1.15 : .86,
      text: `${crit ? '✧ ' : ''}${fmt(amount)}`, color: color || '#f4e4c3',
      size: crit ? 18 + extra : 13, crit, target,
    });
    if (this.numbers.length > 18) this.numbers.shift();
  }

  heroPos() {
    return { x: this.w * (this.w < 560 ? 0.27 : 0.28), y: this.h * 0.87 };
  }
  monsterPos() {
    const size = Engine.battle?.monster?.size || this.death?.monster?.size || 1;
    return { x: this.w * (this.w < 560 ? 0.71 : 0.7), y: this.h * .87, size };
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    this.update(dt);
    this.draw(dt);
    this.raf = requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    this.heroLunge = Math.max(0, this.heroLunge - dt * 4.2);
    this.monsterLunge = Math.max(0, this.monsterLunge - dt * 3.6);
    this.heroFlash = Math.max(0, this.heroFlash - dt * 5);
    this.monsterFlash = Math.max(0, this.monsterFlash - dt * 5.5);
    this.monsterAppear = Math.min(1, this.monsterAppear + dt * 3.2);
    this.shake = Math.max(0, this.shake - dt * 18);
    this.levelBurst = Math.max(0, this.levelBurst - dt * .8);
    if (this.heroDown) this.heroDown = Math.min(1, this.heroDown + dt);

    for (const p of this.ambient) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.p += dt;
      if (p.y < -10) { p.y = this.h + 10; p.x = Math.random() * this.w; }
      if (p.y > this.h + 10) { p.y = -10; p.x = Math.random() * this.w; }
      if (p.x < -10) p.x = this.w + 10;
      if (p.x > this.w + 10) p.x = -10;
    }
    for (const n of this.numbers) { n.t += dt; n.y += n.vy * dt; n.vy *= (1 - dt * 1.2); }
    this.numbers = this.numbers.filter(n => n.t < n.life);
    for (const b of this.bursts) { b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 90 * dt; }
    this.bursts = this.bursts.filter(b => b.t < b.life);
    for (const s of this.strikes) s.t += dt;
    this.strikes = this.strikes.filter(s => s.t < s.life);
    for (const p of this.projectiles) p.t += dt;
    this.projectiles = this.projectiles.filter(p => p.t < p.life);
    if (this.death) { this.death.t += dt; if (this.death.t > 1) this.death = null; }

    const uid = Engine.battle?.monster?.uid || null;
    if (uid && uid !== this.lastUid) {
      this.lastUid = uid;
      this.monsterAppear = 0;
      this.death = null;
    }
    if (!uid) this.lastUid = null;
  }

  draw(dt) {
    const ctx = this.ctx;
    const calm = !!Engine.state?.settings?.reduceMotion;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const shakeX = this.shake && !calm ? (Math.random() - .5) * this.shake : 0;
    const shakeY = this.shake && !calm ? (Math.random() - .5) * this.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    this.drawBackground(ctx);
    if (!calm) this.drawAmbient(ctx);
    this.drawGroundMist(ctx);
    this.drawHero(ctx);
    this.drawMonster(ctx);
    this.drawEffects(ctx);
    this.drawNumbers(ctx);
    this.drawVignette(ctx);
    ctx.restore();
  }

  drawBackground(ctx) {
    const img = this.bgImage();
    if (img?.complete && img.naturalWidth) {
      const ratio = Math.max(this.w / img.naturalWidth, this.h / img.naturalHeight);
      const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
      ctx.drawImage(img, (this.w - dw) / 2, (this.h - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = '#0b0810';
      ctx.fillRect(0, 0, this.w, this.h);
    }
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, 'rgba(6,5,9,.15)');
    grad.addColorStop(.55, 'rgba(6,5,9,.05)');
    grad.addColorStop(1, 'rgba(6,5,9,.72)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);
    // subtle moon glow
    const scene = this.scene();
    const glow = scene?.region?.palette?.glow || '#a98bff';
    const rg = ctx.createRadialGradient(this.w * .78, this.h * .12, 2, this.w * .78, this.h * .12, this.h * .8);
    rg.addColorStop(0, hexA(glow, .12));
    rg.addColorStop(1, hexA(glow, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  drawAmbient(ctx) {
    for (const p of this.ambient) {
      const alpha = p.a * (0.55 + 0.45 * Math.sin(p.p * 2 + p.x));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.type === 'ember' ? '#ff9a5c' : p.type === 'snow' ? '#d8f0ff' : p.type === 'soul' ? '#b89bff' : p.type === 'star' ? '#e8e0ff' : '#cde8a8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (p.type === 'firefly' && Math.sin(p.p * 1.4) > .75) {
        ctx.globalAlpha = alpha * .3;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawGroundMist(ctx) {
    const g = ctx.createLinearGradient(0, this.h * .7, 0, this.h);
    g.addColorStop(0, 'rgba(10,8,15,0)');
    g.addColorStop(1, 'rgba(7,5,11,.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0, this.h * .7, this.w, this.h * .3);
    const grad = ctx.createRadialGradient(this.w * .5, this.h * .93, 10, this.w * .5, this.h * .93, this.w * .5);
    grad.addColorStop(0, 'rgba(0,0,0,.38)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, this.h * .76, this.w, this.h * .24);
  }

  heroHeight() { return clamp(this.h * .66, 128, 240); }

  drawHero(ctx) {
    const img = this.heroImage();
    if (!img?.complete || !img.naturalWidth) return;
    const h = this.heroHeight();
    const w = h * (140 / 220);
    const pos = this.heroPos();
    const bob = Math.sin(this.t * 2.1) * 2.5;
    const lunge = easeOut(this.heroLunge) * (this.w < 560 ? 22 : 34);
    const down = this.heroDown;
    ctx.save();
    ctx.translate(pos.x + lunge, pos.y + bob + down * 8);
    if (down > 0) {
      ctx.globalAlpha = 1 - down * .45;
      ctx.rotate(down * .32);
    }
    if (this.heroFlash > 0) {
      ctx.shadowColor = 'rgba(255,90,90,.9)';
      ctx.shadowBlur = 22 * this.heroFlash;
    }
    ctx.drawImage(img, -w / 2, -h, w, h);
    if (this.heroFlash > .3) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = this.heroFlash * .35;
      ctx.fillStyle = '#ff5a6a';
      ctx.fillRect(-w / 2, -h, w, h);
    }
    ctx.restore();

    if (this.levelBurst > 0) {
      const a = this.levelBurst;
      ctx.save();
      ctx.globalAlpha = a * .55;
      ctx.strokeStyle = '#ffd88a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y - h * .45, (1 - a) * 150 + 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawMonster(ctx) {
    const monster = Engine.battle?.monster || (this.death ? this.death.monster : null);
    if (!monster) return;
    const img = this.monsterImage(monster);
    if (!img?.complete || !img.naturalWidth) return;
    const size = monster.size || 1;
    const base = clamp(this.h * .44, 88, 190) * clamp(size, .75, 2.2);
    const w = base, h = base;
    const ground = this.monsterPos();
    const bob = Math.sin(this.t * 1.7 + 1) * 3;
    const lunge = easeOut(this.monsterLunge) * (this.w < 560 ? 18 : 28);
    const appear = this.monsterAppear;
    const dying = this.death && !Engine.battle?.monster;
    const fade = dying ? Math.max(0, 1 - this.death.t) : 1;
    ctx.save();
    ctx.translate(ground.x - lunge, ground.y + bob);
    ctx.globalAlpha = appear * fade;
    ctx.scale(appear, appear);
    if (dying) ctx.rotate(-this.death.t * .25);
    if (this.monsterFlash > 0 || dying) {
      ctx.shadowColor = 'rgba(255,220,160,.85)';
      ctx.shadowBlur = (this.monsterFlash * 20) + (dying ? 18 : 0);
    }
    ctx.drawImage(img, -w / 2, -h, w, h);
    if (this.monsterFlash > .35) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = this.monsterFlash * .45;
      ctx.fillStyle = '#ffe6bd';
      ctx.fillRect(-w / 2, -h, w, h);
    }
    ctx.restore();

    // elite/boss aura
    if ((monster.isBoss || monster.isMini) && !dying) {
      ctx.save();
      ctx.globalAlpha = .16 + Math.sin(this.t * 2) * .05;
      const rg = ctx.createRadialGradient(ground.x, ground.y - h * .35, 10, ground.x, ground.y - h * .35, h * .62);
      rg.addColorStop(0, monster.isBoss ? 'rgba(255,100,100,.8)' : 'rgba(255,190,90,.65)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(ground.x, ground.y - h * .35, h * .62, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawEffects(ctx) {
    for (const p of this.projectiles) {
      const k = p.t / p.life;
      const x = p.from.x + (p.to.x - p.from.x) * k;
      const y = p.from.y - this.heroHeight() * .45 + (p.to.y - this.heroHeight() * .28 - (p.from.y - this.heroHeight() * .45)) * k - Math.sin(k * Math.PI) * 24;
      ctx.save();
      ctx.globalAlpha = 1 - k * .4;
      ctx.fillStyle = p.color || '#b49bff';
      ctx.shadowColor = p.color || '#b49bff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha *= .35;
      ctx.beginPath(); ctx.arc(x - (p.source === 'hero' ? 10 : -10), y + 2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (const s of this.strikes) {
      const k = s.t / s.life;
      const pos = s.source === 'hero' ? this.monsterPos() : this.heroPos();
      ctx.save();
      ctx.globalAlpha = (1 - k) * .9;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.crit ? 3.4 : 2;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.crit ? 14 : 6;
      if (s.ranged) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - (s.source === 'hero' ? this.h * .28 : this.h * .4), 14 + k * 18, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const dir = s.source === 'hero' ? 1 : -1;
        ctx.beginPath();
        ctx.arc(pos.x - dir * 10, pos.y - this.h * .34, 20 + k * 26, -0.9, 0.9);
        ctx.stroke();
        ctx.globalAlpha *= .5;
        ctx.beginPath();
        ctx.arc(pos.x - dir * 10, pos.y - this.h * .34, 12 + k * 18, -0.8, 0.8);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const b of this.bursts) {
      const k = b.t / b.life;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * (1 - k * .5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawNumbers(ctx) {
    ctx.textAlign = 'center';
    for (const n of this.numbers) {
      const k = n.t / n.life;
      const alpha = k < .12 ? k / .12 : 1 - Math.max(0, (k - .55) / .45);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = `${n.crit ? 800 : 700} ${n.size}px Inter, system-ui, sans-serif`;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(5,4,8,.85)';
      ctx.shadowColor = n.crit ? 'rgba(255,190,90,.55)' : 'rgba(0,0,0,.4)';
      ctx.shadowBlur = n.crit ? 9 : 3;
      ctx.strokeText(n.text, n.x, n.y);
      ctx.fillStyle = n.color;
      ctx.fillText(n.text, n.x, n.y);
      ctx.restore();
    }
    ctx.textAlign = 'left';
  }

  drawVignette(ctx) {
    const g = ctx.createRadialGradient(this.w / 2, this.h / 2, this.h * .2, this.w / 2, this.h / 2, this.w * .72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(3,2,6,.56)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
    // film grain strip
    ctx.globalAlpha = .035;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const y = (this.t * 22 + i * 37) % this.h;
      ctx.fillRect(0, y, this.w, 1);
    }
    ctx.globalAlpha = 1;
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    for (const u of this.unsubs) { try { u(); } catch {} }
  }
}

function hexA(hex, alpha) {
  if (!hex) return `rgba(180,150,255,${alpha})`;
  if (hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return `rgba(180,150,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function regionIndexById(regionId) {
  const map = { moonshade: 1, ashen: 2, frostveil: 3, umbral: 4, dragonfall: 5, rift: 6 };
  return map[regionId] || 1;
}

export function battleTemplate() {
  return `<div class="battle-frame">
    <canvas id="battle-canvas" aria-label="Animated battle between your hero and a monster"></canvas>
    <div class="battle-hud">
      <div class="hud-top">
        <div class="hud-stage">
          <span class="kicker" id="hud-region">Moonshade Vale</span>
          <span class="title"><span id="hud-stage-name">Stage 1</span><em id="hud-stage-level">Lv. 1</em></span>
          <div class="hud-mini-progress"><span id="hud-stage-progress" style="width:0%"></span></div>
        </div>
        <div class="hud-right">
          <span class="hud-chip"><span class="live-dot"></span>Live</span>
          <button class="hud-chip gold" data-battle-action="skills" type="button" title="Toggle automatic skills" id="hud-auto-skills">Auto skills</button>
          <button class="hud-chip hide-mobile" data-battle-action="map" type="button">World map</button>
        </div>
      </div>
      <div class="boss-hud hidden" id="boss-hud">
        <div class="boss-name"><span id="boss-name">Boss</span><em id="boss-hp-text"></em></div>
        <div class="boss-bar"><span id="boss-hp" style="width:100%"></span></div>
      </div>
      <div class="hero-vitals" id="hero-vitals">
        <div class="hv-top"><span id="hv-name">Hero</span><span id="hv-level">Lv. 1</span></div>
        <div class="hv-row"><span>HP</span>${barStatic('hp')}<b id="hv-hp-text">100 / 100</b></div>
        <div class="hv-row"><span>MP</span>${barStatic('mp')}<b id="hv-mp-text">30 / 30</b></div>
      </div>
      <div class="battle-feed">
        <div class="feed-lines" id="battle-feed"></div>
        <div class="run-stats">
          <span class="battle-stat">Kills <b id="run-kills">0</b></span>
          <span class="battle-stat">Gold <b id="run-gold">0</b></span>
          <span class="battle-stat">Drops <b id="run-drops">0</b></span>
        </div>
      </div>
    </div>
  </div>`;
}

function barStatic(cls) {
  return `<div class="bar ${cls}"><span id="hv-${cls}-bar" style="width:100%"></span></div>`;
}

export function mountBattle(panel, opts = {}) {
  panel.innerHTML = battleTemplate();
  const canvas = panel.querySelector('#battle-canvas');
  const renderer = new BattleRenderer(canvas, opts);
  let lastFeedKey = '';
  let hudAcc = 0;
  let last = performance.now();

  panel.querySelector('[data-battle-action="skills"]')?.addEventListener('click', () => {
    const value = Engine.toggleAutoSkills();
    updateHud(panel, true);
    opts.toast?.(`Auto skills ${value.value ? 'enabled' : 'disabled'}.`, 'info');
  });
  panel.querySelector('[data-battle-action="map"]')?.addEventListener('click', () => opts.navigate?.('stages'));

  function hudLoop() {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    hudAcc += dt;
    if (hudAcc > .18) { hudAcc = 0; updateHud(panel, false); }
    renderer.hudRaf = requestAnimationFrame(hudLoop);
  }
  updateHud(panel, true);
  hudLoop();

  return {
    renderer,
    destroy() {
      cancelAnimationFrame(renderer.hudRaf);
      renderer.destroy();
    },
    refresh: () => updateHud(panel, true),
    resize: () => renderer.resize(),
    reseed: () => renderer.seedAmbient(),
  };
}

export function updateHud(panel, force = false) {
  const state = Engine.state;
  if (!state) return;
  const battle = Engine.battle;
  const stats = Engine.stats || Engine.getStats();
  const scene = battle.mode === 'dungeon' && battle.dungeonId
    ? { dungeon: DUNGEON_BY_ID[battle.dungeonId] }
    : null;
  const coords = state.progress ? stageCoords(state.progress.currentIndex) : null;
  const regionEl = panel.querySelector('#hud-region');
  const stageEl = panel.querySelector('#hud-stage-name');
  const levelEl = panel.querySelector('#hud-stage-level');
  const progEl = panel.querySelector('#hud-stage-progress');
  if (scene?.dungeon) {
    regionEl.textContent = 'Dungeon Expedition';
    stageEl.textContent = scene.dungeon.name;
    levelEl.textContent = `Rank ${scene.dungeon.rank}`;
    progEl.style.width = battle.monster ? `${Math.max(0, battle.monster.hp / battle.monster.maxHp * 100)}%` : '0%';
  } else if (coords) {
    regionEl.textContent = coords.region.name;
    stageEl.textContent = `Stage ${coords.stage}`;
    levelEl.textContent = `Lv. ${stats.level} hero`;
    const needed = coords.stage === 10 || coords.stage === 20 ? 1 : 15;
    progEl.style.width = `${Math.min(100, (state.progress.stageKills / needed) * 100)}%`;
  }

  const boss = battle.monster;
  const bossHud = panel.querySelector('#boss-hud');
  if (boss && (boss.isBoss || boss.isMini || boss.isDungeon)) {
    bossHud.classList.remove('hidden');
    panel.querySelector('#boss-name').textContent = boss.name;
    panel.querySelector('#boss-hp-text').textContent = `${fmt(Math.max(0, boss.hp))} / ${fmt(boss.maxHp)}`;
    panel.querySelector('#boss-hp').style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
  } else {
    bossHud.classList.add('hidden');
  }

  const hpMax = stats.maxHp || 1, mpMax = stats.maxMp || 1;
  panel.querySelector('#hv-name').textContent = state.hero.name;
  panel.querySelector('#hv-level').textContent = `Lv. ${state.hero.level}`;
  panel.querySelector('#hv-hp-bar').style.width = `${Math.max(0, Math.min(100, state.hero.hp / hpMax * 100))}%`;
  panel.querySelector('#hv-mp-bar').style.width = `${Math.max(0, Math.min(100, state.hero.mp / mpMax * 100))}%`;
  panel.querySelector('#hv-hp-text').textContent = `${fmt(Math.ceil(state.hero.hp))} / ${fmt(hpMax)}`;
  panel.querySelector('#hv-mp-text').textContent = `${fmt(Math.ceil(state.hero.mp))} / ${fmt(mpMax)}`;
  panel.querySelector('#run-kills').textContent = fmt(state.session?.kills || 0);
  panel.querySelector('#run-gold').textContent = fmt(state.session?.gold || 0);
  panel.querySelector('#run-drops').textContent = fmt(state.session?.drops || 0);
  panel.querySelector('#hud-auto-skills').classList.toggle('on', !!state.hero.autoSkills);
  panel.querySelector('#hud-auto-skills').textContent = state.hero.autoSkills ? 'Auto skills' : 'Manual skills';

  const feed = Engine.recentFeed.slice(0, 4);
  const key = feed.map(f => f.at).join('|');
  if (force || key !== lastFeedKey) {
    lastFeedKey = key;
    panel.querySelector('#battle-feed').innerHTML = feed.map(f => `<div class="feed-line"><span class="${feedClass(f.kind)}">${esc(f.text)}</span></div>`).join('');
  }
}

function feedClass(kind) {
  return ({ loot: 'drop', gold: 'gold', danger: 'danger', level: 'xp', boss: 'danger', clear: 'gold', forge: 'gold' })[kind] || '';
}
