/* ---------------------------------------------------------------
   Canvas renderer — camera, floor, effects, portraits, menu scene.
   --------------------------------------------------------------- */
import { ARENA, BIOMES, CLASSES, SLOTS, RARITY_BY_ID } from './data.js';
import { clamp, hashString, mulberry32 } from './rules.js';
import { drawPlayer, drawEnemy } from './art.js';

const TAU = Math.PI * 2;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.w = 0; this.h = 0; this.dpr = 1;
    this.cam = { x: ARENA / 2, y: ARENA / 2, zoom: 1 };
    this.decor = [];
    this.decorKey = '';
    this.resize();
  }

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
  }

  drawMenu(time, mode = 'title') {
    const { ctx, w, h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#070a12');
    sky.addColorStop(0.52, mode === 'hub' ? '#101018' : '#0a0c16');
    sky.addColorStop(1, '#040508');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // stars
    for (let i = 0; i < 90; i++) {
      const x = ((i * 971) % 1000) / 1000 * w;
      const y = ((i * 577) % 620) / 1000 * h;
      const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * 1.1 + i * 2.1));
      ctx.globalAlpha = tw * 0.45;
      ctx.fillStyle = i % 7 === 0 ? '#f6dfa6' : '#cdd7ff';
      ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    // distant ruins
    const horizon = h * 0.62;
    ctx.fillStyle = '#080a10';
    ctx.beginPath(); ctx.moveTo(0, horizon + 40);
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * w;
      const peak = horizon - 20 - ((i * 37) % 70) + Math.sin(time * 0.2 + i) * 2;
      ctx.lineTo(x, peak);
    }
    ctx.lineTo(w, horizon + 80); ctx.lineTo(0, horizon + 80); ctx.closePath(); ctx.fill();

    // ruins columns
    ctx.fillStyle = 'rgba(4,5,8,.92)';
    for (let i = 0; i < 6; i++) {
      const x = w * (0.08 + i * 0.16) + Math.sin(i) * 8;
      const hh = 44 + (i * 29) % 90;
      ctx.fillRect(x, horizon - hh, 10 + (i % 3) * 5, hh + 20);
      ctx.fillRect(x - 4, horizon - hh, 18 + (i % 3) * 5, 4);
    }

    // rift
    const cx = w / 2, cy = h * 0.46;
    const rw = Math.min(w, h) * (mode === 'hub' ? 0.17 : 0.22);
    const rh = rw * 2.1;
    const pulse = 0.85 + Math.sin(time * 1.4) * 0.08;
    const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, rw * 3.4);
    glow.addColorStop(0, 'rgba(255,241,168,.2)');
    glow.addColorStop(0.2, 'rgba(205,150,255,.12)');
    glow.addColorStop(0.55, 'rgba(90,60,160,.06)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - rw * 4, cy - rh * 1.6, rw * 8, rh * 3.2);

    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.2 + i * 0.12;
      ctx.strokeStyle = i === 1 ? '#e9d28e' : '#a987ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rw * (1 - i * 0.16) * pulse, rh * (1 - i * 0.14) * pulse, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.75;
    const rift = ctx.createRadialGradient(0, 0, 1, 0, 0, rw * 0.9);
    rift.addColorStop(0, 'rgba(255,250,225,.9)');
    rift.addColorStop(0.28, 'rgba(240,210,140,.5)');
    rift.addColorStop(0.62, 'rgba(170,110,255,.22)');
    rift.addColorStop(1, 'rgba(80,30,160,0)');
    ctx.fillStyle = rift;
    ctx.beginPath(); ctx.ellipse(0, 0, rw * 0.9, rh * 0.92, 0, 0, TAU); ctx.fill();
    // rift shards
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 9; i++) {
      const a = time * 0.35 + i * TAU / 9;
      const rr = rw * (0.95 + Math.sin(time + i) * 0.18);
      const x = Math.cos(a) * rr, y = Math.sin(a) * rh * 0.9;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = i % 2 ? '#f7e6b5' : '#c7a4ff';
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(2.4, 2); ctx.lineTo(-2.4, 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // floating embers
    for (let i = 0; i < 46; i++) {
      const seed = i * 131.77;
      const x = (seed * 7.13 + Math.sin(time * 0.5 + i) * 30) % (w + 80) - 40;
      const y = ((seed * 3.71 + time * (9 + (i % 5) * 4)) % (h + 100)) - 50;
      const a = 0.18 + 0.5 * (0.5 + 0.5 * Math.sin(time * 2 + i));
      ctx.globalAlpha = a * (mode === 'hub' ? 0.5 : 0.8);
      ctx.fillStyle = i % 3 ? '#f2c878' : '#cb9dff';
      ctx.beginPath(); ctx.arc(x, h - y, 1.2 + (i % 3) * 0.5, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ground fog
    const fog = ctx.createLinearGradient(0, h * 0.58, 0, h);
    fog.addColorStop(0, 'rgba(8,10,16,0)');
    fog.addColorStop(1, 'rgba(4,5,8,.95)');
    ctx.fillStyle = fog; ctx.fillRect(0, h * 0.55, w, h * 0.45);
  }

  drawBattle(battle, time) {
    const { ctx, w, h } = this;
    const biome = BIOMES[battle.stage.biome] || BIOMES.grove;
    this._ensureDecor(battle.stage);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#030407';
    ctx.fillRect(0, 0, w, h);

    const zoom = clamp(Math.min(w, h) / 560, 0.62, 1.18);
    const viewW = w / zoom, viewH = h / zoom;
    const p = battle.player;
    let camX = p.x, camY = p.y;
    camX = viewW >= ARENA ? ARENA / 2 : clamp(camX, viewW / 2, ARENA - viewW / 2);
    camY = viewH >= ARENA ? ARENA / 2 : clamp(camY, viewH / 2, ARENA - viewH / 2);
    const shake = battle.shake;
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;
    this.cam = { x: camX, y: camY, zoom };

    ctx.save();
    ctx.translate(w / 2 + sx, h / 2 + sy);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    this._drawFloor(battle, biome, time, camX, camY, viewW, viewH);

    // ground hazards
    for (const hz of battle.hazards) this._drawHazard(hz, time);
    for (const b of battle.banners) this._drawGroundBanner(b, time);

    // pickups
    for (const pk of battle.pickups) this._drawPickup(pk, time);

    // entities sorted by y
    const ents = [{ kind: 'player' }, ...battle.enemies.map(e => ({ kind: 'enemy', e }))];
    ents.sort((a, b) => (a.kind === 'player' ? p.y : a.e.y) - (b.kind === 'player' ? p.y : b.e.y));
    for (const ent of ents) {
      if (ent.kind === 'player') {
        this._drawShadow(p.x, p.y + 3, p.r * 1.35, p.r * 0.55);
        drawPlayer(ctx, {
          ...p, classId: battle.classId, time,
          armorColor: this._gearColor(battle, 'armor') || CLASSES[battle.classId].accent,
          weaponColor: this._gearColor(battle, 'weapon') || CLASSES[battle.classId].color,
        });
      } else {
        const e = ent.e;
        this._drawShadow(e.x, e.y + e.r * 0.7, e.r * (e.boss ? 1.5 : 1.1), e.r * (e.boss ? 0.55 : 0.4));
        drawEnemy(ctx, e, time, p);
      }
    }

    // projectiles
    for (const pr of battle.projectiles) this._drawProjectile(pr, time);

    // slashes
    for (const s of battle.slashes) this._drawSlash(s);

    // particles
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const pt of battle.particles) {
      const a = clamp(pt.life / pt.max, 0, 1);
      ctx.globalAlpha = a * (pt.glow ? 0.9 : 0.6);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * (0.5 + a * 0.5), 0, TAU); ctx.fill();
    }
    ctx.restore();

    // floaters
    for (const f of battle.floaters) {
      const a = clamp(f.life / f.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = `700 ${f.size}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // offscreen arrows
    this._drawOffscreen(battle, camX, camY, zoom, w, h);

    // world border vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.72, 'rgba(0,0,0,.18)');
    vg.addColorStop(1, 'rgba(0,0,0,.7)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);

    // biome tint
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = biome.accent;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    if (battle.flash > 0) {
      ctx.fillStyle = `rgba(220,40,30,${battle.flash * 0.22})`;
      ctx.fillRect(0, 0, w, h);
    }
    const hpPct = battle.player.hp / battle.player.maxHp;
    if (hpPct < 0.3 && hpPct > 0) {
      const rg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
      rg.addColorStop(0, 'rgba(0,0,0,0)');
      rg.addColorStop(1, `rgba(150,10,20,${0.26 * (1 - hpPct / 0.3)})`);
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    }
  }

  _gearColor(battle, slot) {
    const r = battle.save?.character?.equipped?.[slot];
    return r ? RARITY_BY_ID[r]?.color : null;
  }

  _ensureDecor(stage) {
    const key = `${stage.id}:${stage.biome}`;
    if (this.decorKey === key) return;
    this.decorKey = key;
    const rng = mulberry32(hashString(key));
    const arr = [];
    for (let i = 0; i < 110; i++) {
      const x = 40 + rng() * (ARENA - 80);
      const y = 40 + rng() * (ARENA - 80);
      const r = rng();
      let type = 'rock';
      if (r > 0.82) type = 'rune';
      else if (r > 0.58) type = 'crack';
      else if (r > 0.4) type = 'tuft';
      arr.push({ x, y, type, s: 0.4 + rng() * 1.2, a: rng() * TAU });
    }
    this.decor = arr;
  }

  _drawFloor(battle, biome, time, camX, camY, viewW, viewH) {
    const { ctx } = this;
    const left = camX - viewW / 2 - 60, top = camY - viewH / 2 - 60;
    const right = camX + viewW / 2 + 60, bottom = camY + viewH / 2 + 60;

    // base
    const base = ctx.createLinearGradient(0, 0, ARENA, ARENA);
    base.addColorStop(0, biome.floor[0]);
    base.addColorStop(1, biome.floor[1]);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, ARENA, ARENA);

    // tiles
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    const step = 100;
    for (let x = 0; x <= ARENA; x += step) {
      if (x < left || x > right) continue;
      ctx.beginPath(); ctx.moveTo(x, Math.max(0, top)); ctx.lineTo(x, Math.min(ARENA, bottom)); ctx.stroke();
    }
    for (let y = 0; y <= ARENA; y += step) {
      if (y < top || y > bottom) continue;
      ctx.beginPath(); ctx.moveTo(Math.max(0, left), y); ctx.lineTo(Math.min(ARENA, right), y); ctx.stroke();
    }

    // moss / cracks / rocks
    for (const d of this.decor) {
      if (d.x < left || d.x > right || d.y < top || d.y > bottom) continue;
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a); ctx.scale(d.s, d.s);
      if (d.type === 'rock') {
        ctx.fillStyle = biome.rock;
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        ctx.beginPath(); ctx.ellipse(-3, -2, 7, 4, 0, 0, TAU); ctx.fill();
      } else if (d.type === 'crack') {
        ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-4, 3); ctx.lineTo(3, -2); ctx.lineTo(18, 1); ctx.stroke();
      } else if (d.type === 'tuft') {
        ctx.strokeStyle = `${biome.accent}55`; ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3 - 3, 4); ctx.quadraticCurveTo(i * 4 - 4, -2, i * 5 - 5, -8); ctx.stroke(); }
      } else {
        ctx.strokeStyle = `${biome.accent}66`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-3, -3); ctx.lineTo(3, 3); ctx.moveTo(3, -3); ctx.lineTo(-3, 3); ctx.stroke();
      }
      ctx.restore();
    }

    // ambient biome particles
    for (let i = 0; i < 34; i++) {
      const seed = i * 191.3;
      let x = (seed * 4.9) % ARENA;
      let y;
      if (biome.id === 'frost') {
        y = ((seed * 2.1 + time * 26) % (ARENA + 100)) - 50;
        x = (x + Math.sin(time * 0.7 + i) * 40 + ARENA) % ARENA;
      } else {
        y = (ARENA - ((seed * 3.3 + time * (14 + (i % 4) * 6)) % (ARENA + 80))) + 40;
        x = (x + Math.sin(time * 0.5 + i) * 26 + ARENA) % ARENA;
      }
      if (x < left || x > right || y < top || y > bottom) continue;
      ctx.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(time * 2 + i));
      ctx.fillStyle = biome.particle;
      ctx.beginPath(); ctx.arc(x, y, biome.id === 'void' ? 2 : 1.3, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // fog pools
    for (let i = 0; i < 3; i++) {
      const fx = ARENA * (0.25 + i * 0.26) + Math.sin(time * 0.2 + i) * 30;
      const fy = ARENA * (0.3 + (i % 2) * 0.4);
      const fg = ctx.createRadialGradient(fx, fy, 10, fx, fy, 260);
      fg.addColorStop(0, `${biome.fog}22`);
      fg.addColorStop(1, `${biome.fog}00`);
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(fx, fy, 260, 0, TAU); ctx.fill();
    }

    // arena boundary
    ctx.strokeStyle = `${biome.accent}44`;
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, ARENA - 16, ARENA - 16);
    ctx.strokeStyle = 'rgba(0,0,0,.6)';
    ctx.lineWidth = 10;
    ctx.strokeRect(-2, -2, ARENA + 4, ARENA + 4);

    // outside dark
    ctx.fillStyle = '#030407';
    const l = Math.max(0, -40);
    if (left < 0) ctx.fillRect(left - 100, top - 100, -left + 100, bottom - top + 200);
  }

  _drawShadow(x, y, rx, ry) {
    const { ctx } = this;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
    g.addColorStop(0, 'rgba(0,0,0,.42)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  _drawHazard(h, time) {
    const { ctx } = this;
    if (!h || h.done) return;
    const col = h.color || '#ff7a5c';
    const pulse = 0.5 + 0.5 * Math.sin(time * 9);
    ctx.save();
    if (h.kind === 'circle' || h.kind === 'rain' || h.kind === 'meteor') {
      const fill = h.delay > 0 ? 0.08 + pulse * 0.06 : 0.16;
      const g = ctx.createRadialGradient(h.x, h.y, 1, h.x, h.y, h.r);
      g.addColorStop(0, `${col}00`);
      g.addColorStop(0.7, `${col}44`);
      g.addColorStop(1, `${col}88`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = col; ctx.globalAlpha = 0.6 + pulse * 0.35; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.22;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (0.35 + 0.55 * pulse), 0, TAU); ctx.stroke();
      if (h.kind === 'meteor') {
        const fall = clamp(h.delay / 1.0, 0, 1);
        const my = h.y - fall * 420;
        ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffb15c';
        ctx.beginPath(); ctx.arc(h.x, my, 14, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.4; ctx.strokeStyle = '#ffd28a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(h.x, my - 16); ctx.lineTo(h.x, my - 100); ctx.stroke();
      }
    } else if (h.kind === 'line') {
      const a = Math.atan2(h.y2 - h.y1, h.x2 - h.x1);
      const len = Math.hypot(h.x2 - h.x1, h.y2 - h.y1);
      ctx.translate(h.x1, h.y1); ctx.rotate(a);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, `${col}22`); g.addColorStop(1, `${col}aa`);
      ctx.fillStyle = g;
      ctx.fillRect(0, -h.width / 2, len, h.width);
      ctx.strokeStyle = col; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5;
      ctx.strokeRect(0, -h.width / 2, len, h.width);
      ctx.globalAlpha = 0.28 + pulse * 0.2;
      ctx.fillStyle = col;
      ctx.fillRect(0, -2, len, 4);
    } else if (h.kind === 'zone') {
      const life = h.life !== undefined ? clamp(h.life / h.maxLife, 0, 1) : 1;
      const g = ctx.createRadialGradient(h.x, h.y, 1, h.x, h.y, h.r);
      g.addColorStop(0, `${col}22`); g.addColorStop(0.7, `${col}33`); g.addColorStop(1, `${col}66`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.4 + life * 0.4; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 8]); ctx.lineDashOffset = -time * 20;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    } else if (h.kind === 'ring') {
      const rad = h.radius || h.r0;
      ctx.strokeStyle = col; ctx.globalAlpha = 0.75; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(h.x, h.y, rad, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.25; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.arc(h.x, h.y, rad, 0, TAU); ctx.stroke();
    } else if (h.kind === 'nova') {
      const p = 1 - clamp(h.life / h.maxLife, 0, 1);
      ctx.strokeStyle = col; ctx.globalAlpha = 1 - p; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (0.35 + p * 0.75), 0, TAU); ctx.stroke();
      ctx.globalAlpha = (1 - p) * 0.3; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (0.35 + p * 0.75), 0, TAU); ctx.fill();
    } else if (h.kind === 'slam') {
      const p = 1 - clamp(h.life / h.maxLife, 0, 1);
      ctx.strokeStyle = col; ctx.globalAlpha = 1 - p; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * (0.2 + p * 0.95), 0, TAU); ctx.stroke();
    } else if (h.kind === 'burst') {
      const p = 1 - clamp(h.life / h.maxLife, 0, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - p) * 0.7; ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(h.x, h.y, (h.r || 30) * (0.2 + p * 0.9), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  _drawGroundBanner(b, time) {
    const { ctx } = this;
    const a = clamp(b.t / b.max, 0, 1);
    ctx.save(); ctx.globalAlpha = 0.55 * Math.min(1, a * 2);
    const g = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, 120);
    g.addColorStop(0, 'rgba(255,220,140,.25)'); g.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 120, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#c9a45c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, b.y - 58); ctx.stroke();
    ctx.fillStyle = '#c2493f';
    ctx.beginPath(); ctx.moveTo(b.x, b.y - 58); ctx.lineTo(b.x + 26 + Math.sin(time * 3) * 3, b.y - 50); ctx.lineTo(b.x, b.y - 38); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  _drawPickup(pk, time) {
    const { ctx } = this;
    const bob = Math.sin(pk.bob) * 3;
    ctx.save(); ctx.translate(pk.x, pk.y + bob);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 18);
    g.addColorStop(0, 'rgba(255,120,130,.7)'); g.addColorStop(1, 'rgba(255,60,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ff6f78';
    ctx.beginPath();
    ctx.moveTo(0, 5); ctx.bezierCurveTo(-9, -2, -6, -9, 0, -4); ctx.bezierCurveTo(6, -9, 9, -2, 0, 5);
    ctx.fill();
    ctx.restore();
  }

  _drawProjectile(pr, time) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(pr.x, pr.y);
    const a = Math.atan2(pr.vy, pr.vx);
    if (pr.kind === 'arrow' || pr.kind === 'lance') {
      ctx.rotate(a);
      ctx.globalCompositeOperation = 'lighter';
      const len = pr.kind === 'lance' ? 80 : 20;
      const g = ctx.createLinearGradient(-len, 0, 6, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, pr.color);
      ctx.strokeStyle = g; ctx.lineWidth = pr.kind === 'lance' ? 8 : 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(6, 0); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill();
    } else if (pr.kind === 'shard') {
      ctx.rotate(a);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = pr.color;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-4, -4); ctx.lineTo(-8, 0); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, pr.r * 2.6);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.35, pr.color);
      g.addColorStop(1, `${pr.color}00`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, pr.r * 2.6, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.55; ctx.strokeStyle = pr.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-pr.vx * 0.025, -pr.vy * 0.025); ctx.lineTo(0, 0); ctx.stroke();
    }
    ctx.restore();
  }

  _drawSlash(s) {
    const { ctx } = this;
    const a = clamp(s.life / s.max, 0, 1);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * 0.8;
    if (s.line) {
      ctx.rotate(s.angle);
      const g = ctx.createLinearGradient(0, 0, s.range, 0);
      g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(0.4, s.color); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 9 * a + 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s.range, 0); ctx.stroke();
    } else {
      ctx.rotate(s.angle);
      ctx.fillStyle = s.color;
      if (s.spin) {
        ctx.beginPath(); ctx.arc(0, 0, s.range * (1 - a * 0.2), 0, TAU); ctx.lineWidth = 13 * a; ctx.strokeStyle = s.color; ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, s.range, -s.arc / 2, s.arc / 2);
        ctx.arc(0, 0, s.range * 0.34, s.arc / 2, -s.arc / 2, true);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = a * 0.35; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, s.range * 0.85, -s.arc / 2, s.arc / 2); ctx.lineTo(0, 0); ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawOffscreen(battle, camX, camY, zoom, w, h) {
    const { ctx } = this;
    const margin = 26;
    for (const e of battle.enemies) {
      if (e.boss) continue;
      const sx = (e.x - camX) * zoom + w / 2;
      const sy = (e.y - camY) * zoom + h / 2;
      if (sx > margin && sx < w - margin && sy > margin + 70 && sy < h - 140) continue;
      const cx = clamp(sx, margin + 12, w - margin - 12);
      const cy = clamp(sy, margin + 86, h - 156);
      const a = Math.atan2(sy - h / 2, sx - w / 2);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = e.elite ? '#ffd07a' : '#ff9c86';
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (battle.boss) {
      const b = battle.boss;
      const sx = (b.x - camX) * zoom + w / 2;
      const sy = (b.y - camY) * zoom + h / 2;
      if (sx < 0 || sx > w || sy < 0 || sy > h) {
        const cx = clamp(sx, 30, w - 30), cy = clamp(sy, 100, h - 160);
        const a = Math.atan2(sy - h / 2, sx - w / 2);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        ctx.globalAlpha = 0.8; ctx.fillStyle = '#ff8f8f';
        ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-7, -7); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  }

  drawPortrait(canvas, classId, opts = {}) {
    const cls = CLASSES[classId] || CLASSES.warrior;
    const dpr = 2;
    const w = canvas.clientWidth || 118, h = canvas.clientHeight || 142;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(w / 2, h * 0.36, 2, w / 2, h * 0.45, Math.max(w, h) * 0.8);
    bg.addColorStop(0, `${cls.color}33`);
    bg.addColorStop(0.55, 'rgba(14,16,23,.75)');
    bg.addColorStop(1, 'rgba(5,6,9,.95)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // ground ring
    ctx.strokeStyle = `${cls.accent}44`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.82, w * 0.3, 8, 0, 0, TAU); ctx.stroke();
    // motes
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4 + (opts.time || 0);
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(a);
      ctx.fillStyle = cls.accent;
      ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a * 2) * w * 0.32, h * 0.5 + Math.sin(a * 1.4) * h * 0.3, 1.2, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(w / 2, h * 0.78);
    const scale = Math.min(w / 82, h / 108) * 1.35;
    ctx.scale(scale, scale);
    drawPlayer(ctx, {
      x: 0, y: 0, classId, facing: -Math.PI / 2 + 0.35, time: opts.time || 0,
      moving: false, attackAnim: 0, castAnim: 0.2,
      armorColor: opts.armorColor || cls.accent,
      weaponColor: opts.weaponColor || cls.color,
    });
    ctx.restore();
    // frame shade
    const vg = ctx.createLinearGradient(0, 0, 0, h);
    vg.addColorStop(0, 'rgba(0,0,0,.25)');
    vg.addColorStop(0.5, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }
}
