// ============================================================
// AETHERIA — ISOMETRIC RENDERER
// ============================================================

import { drawCharacter, drawEnemy, drawNpc, drawProp, drawPet, drawWings, shade } from './sprites.js';
import { RARITIES, SLOTS } from './data.js';
import { clamp, lerp } from './utils.js';

export const TW = 64;
export const TH = 32;

const WEATHER_COUNT = { leaves: 34, embers: 40, spores: 30, mist: 12, snow: 60, sand: 45, stars: 55 };

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.game = game;
    this.world = null;
    this.ground = null;
    this.cam = { x: 0, y: 0 };
    this.camTarget = { x: 0, y: 0 };
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.time = 0;
    this.viewZoom = 1;
    this.setZoom();
    this.particles = [];
    this.dust = [];
    this.waterTiles = [];
    this.minimapCanvas = null;
    this.lastMinimap = 0;
    this.snapped = false;
    this.resize();
  }

  setMinimap(canvas) { this.minimapCanvas = canvas; }

  setZoom() {
    const short = Math.min(this.width || window.innerWidth, this.height || window.innerHeight);
    // zoomed slightly further out: mobile keeps a comfortable 0.9, desktop shows more world at 0.8
    this.viewZoom = short < 620 ? 0.9 : 0.8;
  }

  viewW() { return this.width / this.viewZoom; }
  viewH() { return this.height / this.viewZoom; }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, rect.width || window.innerWidth);
    this.height = Math.max(320, rect.height || window.innerHeight);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.setZoom();
    if (this.world) this.snapCamera(true);
  }

  setWorld(world, opts = {}) {
    this.world = world;
    const size = world.size;
    this.offsetX = (size - 1) * TW / 2 + 96;
    this.offsetY = 96;
    this.groundW = size * TW + 192;
    this.groundH = size * TH + 192;
    this.ground = this.buildGround(world);
    this.waterTiles = [];
    for (const t of world.tiles) if (t.type === 'water') this.waterTiles.push(t);
    this.makeWeather(world.region.weather);
    this.snapped = false;
    if (opts.snap !== false) this.snapCamera(true);
    this.worldRef = world;
  }

  iso(x, y) {
    return {
      x: this.offsetX + (x - y) * TW / 2,
      y: this.offsetY + (x + y) * TH / 2
    };
  }

  worldToView(x, y) {
    const p = this.iso(x, y);
    return { x: p.x - this.cam.x, y: p.y - this.cam.y };
  }

  // For input mapping: returns CSS pixel coordinates (zoom-adjusted)
  worldToScreen(x, y) {
    const p = this.iso(x, y);
    return { x: (p.x - this.cam.x) * this.viewZoom, y: (p.y - this.cam.y) * this.viewZoom };
  }

  screenToWorld(sx, sy) {
    const z = this.viewZoom;
    const ix = sx / z + this.cam.x - this.offsetX;
    const iy = sy / z + this.cam.y - this.offsetY;
    const a = ix / (TW / 2);
    const b = iy / (TH / 2);
    return { x: (a + b) / 2, y: (b - a) / 2 };
  }

  snapCamera(instant = false) {
    const g = this.game;
    if (!g || !g.player) return;
    const p = this.iso(g.player.x, g.player.y);
    this.camTarget.x = p.x - this.viewW() / 2;
    this.camTarget.y = p.y - this.viewH() / 2 - 30;
    this.clampCamera(this.camTarget);
    if (instant || !this.snapped) {
      this.cam.x = this.camTarget.x;
      this.cam.y = this.camTarget.y;
      this.snapped = true;
    }
  }

  clampCamera(c) {
    const vw = this.viewW(), vh = this.viewH();
    const maxX = Math.max(0, this.groundW - vw);
    const maxY = Math.max(0, this.groundH - vh);
    if (this.groundW < vw) c.x = (this.groundW - vw) / 2;
    else c.x = clamp(c.x, 0, maxX);
    if (this.groundH < vh) c.y = (this.groundH - vh) / 2;
    else c.y = clamp(c.y, 0, maxY);
  }

  // ------------------------------------------------------------
  // GROUND PRE-RENDER
  // ------------------------------------------------------------
  buildGround(world) {
    const c = document.createElement('canvas');
    c.width = this.groundW;
    c.height = this.groundH;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const pal = world.region.palette;

    const g = ctx.createLinearGradient(0, 0, 0, this.groundH);
    g.addColorStop(0, shade(pal.sky, 0.04));
    g.addColorStop(1, shade(pal.sky, -0.1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);

    for (let y = 0; y < world.size; y++) {
      for (let x = 0; x < world.size; x++) {
        const t = world.tiles[y * world.size + x];
        const cx = this.offsetX + (x - y) * TW / 2;
        const cy = this.offsetY + (x + y) * TH / 2;
        this.drawTile(ctx, t, cx, cy, pal, x, y, world);
      }
    }

    // subtle map border fade
    ctx.save();
    const edge = ctx.createLinearGradient(0, 0, 0, 160);
    edge.addColorStop(0, 'rgba(3,4,8,0.6)');
    edge.addColorStop(1, 'rgba(3,4,8,0)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, c.width, 160);
    ctx.restore();
    return c;
  }

  drawTile(ctx, t, cx, cy, pal, tx, ty, world) {
    const type = t.type;
    let base;
    switch (type) {
      case 'path': base = pal.path; break;
      case 'plaza': base = shade(pal.path, 0.08); break;
      case 'plaza_light': base = shade(pal.path, 0.18); break;
      case 'shore': base = shade(pal.ground1, 0.12); break;
      case 'water': base = pal.water; break;
      case 'void': base = '#05040c'; break;
      case 'ground2': base = pal.ground2; break;
      case 'ground3': base = pal.ground3; break;
      default: base = pal.ground1;
    }
    const w = TW / 2, h = TH / 2;
    const size = world ? world.size : 0;
    const nbType = (dx, dy) => {
      if (!world) return null;
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) return null;
      return world.tiles[ny * size + nx]?.type || null;
    };
    const waterAlong = world ? ['water'].some(k => [nbType(1, 0), nbType(-1, 0), nbType(0, 1), nbType(0, -1), nbType(1, 1), nbType(1, -1), nbType(-1, 1), nbType(-1, -1)].includes(k)) : false;

    if (type === 'water') {
      const deep = ['water'].includes(nbType(1, 0)) && ['water'].includes(nbType(-1, 0)) && ['water'].includes(nbType(0, 1)) && ['water'].includes(nbType(0, -1))
        && ['water'].includes(nbType(1, 1)) && ['water'].includes(nbType(-1, -1)) && ['water'].includes(nbType(1, -1)) && ['water'].includes(nbType(-1, 1));
      base = deep ? shade(pal.water, -0.16) : shade(pal.water, 0.02);
      const v = (t.variant % 9) - 4;
      base = shade(base, v * 0.005);
      ctx.beginPath();
      ctx.moveTo(cx, cy - h); ctx.lineTo(cx + w, cy); ctx.lineTo(cx, cy + h); ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.fillStyle = base;
      ctx.fill();
      // depth shading toward the centre of lakes
      if (deep) {
        ctx.fillStyle = 'rgba(4,12,26,0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(cx - 12, cy - 2, 9, 1);
        ctx.fillRect(cx + 3, cy + 3, 6, 1);
      } else {
        // shallow sandy bottom showing through + foam flecks
        ctx.fillStyle = shade(pal.water, 0.14);
        ctx.fillRect(cx - 8, cy - 1, 14, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(cx - 11, cy - 4, 6, 1);
        ctx.fillRect(cx + 5, cy + 1, 4, 1);
        ctx.fillRect(cx - 2, cy - 7, 3, 1);
      }
      return;
    }
    if (type === 'void') {
      ctx.beginPath();
      ctx.moveTo(cx, cy - h); ctx.lineTo(cx + w, cy); ctx.lineTo(cx, cy + h); ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.fillStyle = '#05040c';
      ctx.fill();
      const rngV = (t.variant * 9301 + 49297) % 233280;
      for (let i = 0; i < 4; i++) {
        const rx = ((rngV * (i + 5) + 311) % 100) / 100;
        const ry = ((rngV * (i + 11) + 733) % 100) / 100;
        const dx = (rx - 0.5) * w * 0.9, dy = (ry - 0.5) * h * 0.9;
        if (Math.abs(dx) / w + Math.abs(dy) / h > 0.8) continue;
        ctx.fillStyle = i === 0 ? 'rgba(180,160,255,0.55)' : 'rgba(140,120,220,0.28)';
        ctx.fillRect(cx + dx, cy + dy, 1, 1);
      }
      if ((t.variant + tx + ty) % 23 === 0) {
        ctx.fillStyle = 'rgba(169,155,255,0.16)';
        ctx.beginPath(); ctx.ellipse(cx, cy, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }

    // land diamond + soft water-edge halo
    const v = (t.variant % 9) - 4;
    base = shade(base, v * 0.006);
    ctx.beginPath();
    ctx.moveTo(cx, cy - h); ctx.lineTo(cx + w, cy); ctx.lineTo(cx, cy + h); ctx.lineTo(cx - w, cy);
    ctx.closePath();
    ctx.fillStyle = base;
    ctx.fill();
    if (waterAlong && type === 'shore') {
      ctx.fillStyle = 'rgba(240,236,210,0.28)';
      ctx.fillRect(cx - 4, cy - 2, 8, 1);
    }

    // texture specks inside the diamond
    const rngV = (t.variant * 9301 + 49297) % 233280;
    const dots = 4 + (t.variant % 5);
    for (let i = 0; i < dots; i++) {
      const rx = ((rngV * (i + 3) + 137) % 100) / 100;
      const ry = ((rngV * (i + 7) + 911) % 100) / 100;
      const dx = (rx - 0.5) * w * 1.15;
      const dy = (ry - 0.5) * h * 0.95;
      if (Math.abs(dx) / w + Math.abs(dy) / h > 0.85) continue;
      const light = (t.variant + i) % 3 !== 0;
      ctx.fillStyle = light ? shade(base, 0.09) : shade(base, -0.08);
      ctx.fillRect(cx + dx, cy + dy, 2, 1);
    }

    const regionId = world ? world.regionId : '';
    const grassy = type === 'ground1' || type === 'ground2' || type === 'ground3' || type === 'shore';

    if (grassy && type !== 'path' && type !== 'plaza' && type !== 'plaza_light') {
      // grass tufts: paired light/dark blades
      const tufts = type === 'ground1' ? 2 : 1;
      for (let i = 0; i < tufts; i++) {
        const rx = ((rngV * (i + 17) + 551) % 100) / 100;
        const ry = ((rngV * (i + 29) + 197) % 100) / 100;
        const dx = (rx - 0.5) * w * 0.9;
        const dy = (ry - 0.5) * h * 0.7;
        if (Math.abs(dx) / w + Math.abs(dy) / h > 0.7) continue;
        ctx.fillStyle = shade(base, 0.17);
        ctx.fillRect(cx + dx, cy + dy - 2, 1, 3);
        ctx.fillRect(cx + dx + 2, cy + dy - 1, 1, 2);
        ctx.fillStyle = shade(base, -0.13);
        ctx.fillRect(cx + dx - 2, cy + dy, 1, 2);
      }
      // wildflower accents (region palette driven)
      if (type === 'ground1' && t.variant % 13 === 0) {
        const flowerColors = {
          greendale: ['#ffd166', '#ff8fa3'], ironcrag: ['#ffb23e'], venomwood: ['#b06bff', '#9b6bff'],
          mistgrave: ['#c9d8e8'], frostpeak: ['#bfefff'], sunscorch: ['#ffd166', '#ff9a4a'],
          ashen: ['#ff7a3c'], tower: ['#a99bff']
        };
        const cols = flowerColors[regionId] || ['#ffd166'];
        const rx = ((rngV * 41 + 97) % 100) / 100;
        const ry = ((rngV * 53 + 41) % 100) / 100;
        const dx = (rx - 0.5) * w * 0.7, dy = (ry - 0.5) * h * 0.55;
        if (Math.abs(dx) / w + Math.abs(dy) / h < 0.62) {
          ctx.fillStyle = '#3f6a38';
          ctx.fillRect(cx + dx, cy + dy, 1, 2);
          ctx.fillStyle = cols[(t.variant + tx) % cols.length];
          ctx.fillRect(cx + dx - 1, cy + dy - 1, 2, 2);
        }
      }
    }

    // region ground accents
    if (regionId === 'frostpeak' && grassy && t.variant % 5 === 0) {
      ctx.fillStyle = 'rgba(238,246,250,0.5)';
      ctx.fillRect(cx - 6 + (t.variant % 7), cy - 2, 6, 1);
      ctx.fillRect(cx + 2 + (v % 3), cy + 2, 4, 1);
    } else if (regionId === 'sunscorch' && grassy && t.variant % 4 === 0) {
      ctx.fillStyle = shade(base, 0.12);
      ctx.fillRect(cx - 7, cy + 1, 10, 1);
      ctx.fillRect(cx - 3, cy - 3, 8, 1);
    } else if (regionId === 'ashen' && grassy && t.variant % 6 === 0) {
      ctx.fillStyle = 'rgba(20,12,12,0.3)';
      ctx.fillRect(cx - 8, cy, 5, 1);
      ctx.fillRect(cx - 2, cy + 2, 7, 1);
      if (t.variant % 12 === 0) {
        ctx.fillStyle = '#ff7a3c';
        ctx.fillRect(cx + 6, cy - 1, 1, 1);
      }
    } else if (regionId === 'tower' && grassy && t.variant % 7 === 0) {
      ctx.fillStyle = 'rgba(169,155,255,0.22)';
      ctx.fillRect(cx - 1, cy + 5, 4, 1);
      ctx.fillRect(cx + 3, cy + 3, 2, 1);
    } else if (regionId === 'mistgrave' && grassy && t.variant % 6 === 0) {
      ctx.fillStyle = 'rgba(190,205,220,0.12)';
      ctx.beginPath(); ctx.ellipse(cx + (v % 5), cy - 3, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    } else if (regionId === 'venomwood' && type === 'ground1' && t.variant % 8 === 0) {
      ctx.fillStyle = 'rgba(24,34,18,0.35)';
      ctx.fillRect(cx - 6, cy + 1, 9, 1);
      ctx.fillStyle = '#8f4fb0';
      ctx.fillRect(cx + 4, cy - 2, 1, 1);
    } else if (regionId === 'ironcrag' && grassy && t.variant % 9 === 0) {
      ctx.fillStyle = '#7d7872';
      ctx.fillRect(cx - 3, cy + 3, 3, 2);
      ctx.fillStyle = '#96908a';
      ctx.fillRect(cx - 2, cy + 3, 1, 1);
    }

    if (type !== 'path' && type !== 'plaza' && type !== 'plaza_light' && t.variant % 11 === 0) {
      ctx.fillStyle = shade(base, 0.14);
      ctx.fillRect(cx - 2, cy - 3, 1, 3);
      ctx.fillRect(cx + 2, cy + 1, 1, 2);
    }
    if (type === 'path' || type === 'plaza') {
      // cobble hints
      if (t.variant % 4 === 0) {
        ctx.fillStyle = shade(base, 0.09);
        ctx.fillRect(cx - 5, cy - 2, 5, 1);
        ctx.fillRect(cx + 2, cy + 2, 4, 1);
        ctx.fillStyle = shade(base, -0.07);
        ctx.fillRect(cx - 2, cy + 3, 6, 1);
      }
      // set cobblestone stones on some tiles
      if (t.variant % 3 === 0) {
        const stones = 1 + (t.variant % 2);
        for (let i = 0; i < stones; i++) {
          const sx = 12 + ((t.variant * 7 + i * 31) % 13);
          const sy = 4 + ((t.variant * 13 + i * 17) % 9);
          ctx.fillStyle = shade(base, 0.13);
          ctx.fillRect(cx - sx / 2, cy - 2 + sy * 0.6, sx, 2);
          ctx.fillStyle = shade(base, -0.1);
          ctx.fillRect(cx - sx / 2, cy + sy * 0.6, sx, 1);
        }
      }
      // path-side pebbles / weeds
      if (t.variant % 7 === 0) {
        ctx.fillStyle = shade(base, 0.05);
        ctx.fillRect(cx + w * 0.55, cy - 1, 2, 1);
        ctx.fillStyle = shade(base, -0.12);
        ctx.fillRect(cx - w * 0.6, cy + 1, 2, 1);
      }
    }
    if (type === 'plaza_light') {
      ctx.fillStyle = shade(base, 0.1);
      ctx.fillRect(cx - 14, cy - 2, 28, 1);
    }

    // Keep the diamond seams quiet, then use a directional bevel to give the
    // ground depth without making the whole world read like a rigid grid.
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = type === 'shore' ? 'rgba(255,244,198,0.14)' : 'rgba(4,3,10,0.09)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - h + 0.5);
    ctx.lineTo(cx + w - 0.5, cy);
    ctx.lineTo(cx, cy + h - 0.5);
    ctx.lineTo(cx - w + 0.5, cy);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = type === 'shore' ? 'rgba(255,248,218,0.2)' : 'rgba(255,245,214,0.075)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - h + 1);
    ctx.lineTo(cx - w + 1, cy);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(5,4,10,0.12)';
    ctx.beginPath();
    ctx.moveTo(cx + w - 1, cy);
    ctx.lineTo(cx, cy + h - 1);
    ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------
  // WEATHER
  // ------------------------------------------------------------
  makeWeather(kind) {
    const n = WEATHER_COUNT[kind] || 24;
    this.particles = [];
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 12,
        vy: 8 + Math.random() * 26,
        size: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.6,
        alpha: 0.25 + Math.random() * 0.5
      });
    }
    this.weatherKind = kind;
  }

  updateWeather(dt) {
    const kind = this.weatherKind;
    for (const p of this.particles) {
      p.phase += dt * p.speed;
      if (kind === 'embers') {
        p.y -= (14 + p.speed * 22) * dt;
        p.x += Math.sin(p.phase * 2) * 14 * dt;
      } else if (kind === 'snow') {
        p.y += p.vy * dt;
        p.x += Math.sin(p.phase) * 16 * dt;
      } else if (kind === 'sand') {
        p.x += (40 + p.speed * 45) * dt;
        p.y += Math.sin(p.phase) * 8 * dt;
      } else if (kind === 'stars') {
        // static twinkle
      } else if (kind === 'mist') {
        p.x += (4 + p.speed * 4) * dt;
        p.y += Math.sin(p.phase) * 2 * dt;
      } else {
        p.y += p.vy * dt * 0.7;
        p.x += Math.sin(p.phase * 1.4) * 20 * dt;
      }
      if (p.y > this.height + 20) { p.y = -20; p.x = Math.random() * this.width; }
      if (p.y < -30) { p.y = this.height + 10; p.x = Math.random() * this.width; }
      if (p.x > this.width + 20) p.x = -20;
      if (p.x < -20) p.x = this.width + 20;
    }
  }

  drawWeather(ctx) {
    const kind = this.weatherKind;
    const pal = this.world.region.palette;
    ctx.save();
    if (kind === 'leaves') {
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = Math.sin(p.phase) > 0 ? pal.accent : '#d5a44c';
        ctx.fillRect(p.x, p.y, p.size + 1, p.size);
      }
    } else if (kind === 'embers') {
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha * (0.7 + Math.sin(p.phase * 2) * 0.3);
        ctx.fillStyle = Math.sin(p.phase) > 0 ? '#ffb23e' : '#ff5a3c';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    } else if (kind === 'spores') {
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha * (0.5 + Math.sin(p.phase) * 0.5);
        ctx.fillStyle = '#c9a0ff';
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha *= 0.4;
        ctx.fillRect(p.x - 1, p.y - 1, p.size + 2, p.size + 2);
      }
    } else if (kind === 'snow') {
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#f2fbff';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    } else if (kind === 'sand') {
      for (const p of this.particles) {
        ctx.globalAlpha = p.alpha * 0.6;
        ctx.fillStyle = '#f0d79a';
        ctx.fillRect(p.x, p.y, p.size + 2, 1);
      }
    } else if (kind === 'stars') {
      for (const p of this.particles) {
        ctx.globalAlpha = 0.25 + Math.abs(Math.sin(p.phase)) * 0.6;
        ctx.fillStyle = Math.sin(p.phase * 2) > 0 ? '#fff4c4' : '#c9b4ff';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    } else if (kind === 'mist') {
      for (const p of this.particles) {
        ctx.globalAlpha = 0.05 + p.alpha * 0.05;
        ctx.fillStyle = '#b7d4ea';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 90 + p.size * 25, 22 + p.size * 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------------
  render(game, dt) {
    const ctx = this.ctx;
    this.time += dt;
    this.updateWeather(dt);
    this.updateDust(dt);
    const world = this.world;
    if (!world || !game.player) return;
    const z = this.viewZoom;
    const vw = this.viewW(), vh = this.viewH();

    // camera follow (still smoothly centered on the player)
    const p = this.iso(game.player.x, game.player.y);
    this.camTarget.x = lerp(this.camTarget.x, p.x - vw / 2, 0.18);
    this.camTarget.y = lerp(this.camTarget.y, p.y - vh / 2 - 34, 0.18);
    this.clampCamera(this.camTarget);
    this.cam.x = lerp(this.cam.x, this.camTarget.x, 0.22);
    this.cam.y = lerp(this.cam.y, this.camTarget.y, 0.22);
    if (Math.abs(this.cam.x - this.camTarget.x) < 0.05) this.cam.x = this.camTarget.x;
    if (Math.abs(this.cam.y - this.camTarget.y) < 0.05) this.cam.y = this.camTarget.y;

    // ---- sky backdrop (screen space) ----
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const pal = world.region.palette;
    const bg = ctx.createLinearGradient(0, 0, 0, this.height);
    bg.addColorStop(0, pal.sky);
    bg.addColorStop(1, shade(pal.sky, -0.12));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // ---- world (zoomed slightly out to show more of the surrounding land) ----
    ctx.setTransform(this.dpr * z, 0, 0, this.dpr * z, 0, 0);
    // ground is the only pre-rendered bitmap — smooth its downscale so the pixel art stays clean
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.ground, -Math.round(this.cam.x), -Math.round(this.cam.y));
    ctx.imageSmoothingEnabled = false;

    this.drawWaterFX(ctx);

    // lights beneath objects
    this.drawGroundLights(ctx, world);

    // player running dust behind entities
    this.spawnDust(game);
    this.drawDust(ctx);

    // collect drawables
    const drawables = [];
    const margin = 260;
    const visible = (sx, sy) => sx > -margin && sx < vw + margin && sy > -margin - 100 && sy < vh + margin;

    for (const prop of world.props) {
      const s = this.worldToView(prop.x, prop.y);
      if (visible(s.x, s.y - 80)) drawables.push({ z: prop.x + prop.y, read: () => this.drawPropSprite(ctx, prop, s) });
    }
    for (const node of world.nodes) {
      if (node.respawnAt > Date.now()) continue;
      const s = this.worldToView(node.x, node.y);
      if (visible(s.x, s.y)) drawables.push({ z: node.x + node.y, read: () => this.drawNodeSprite(ctx, node, s) });
    }
    for (const h of world.hidden) {
      if (h.opened) continue;
      const s = this.worldToView(h.x, h.y);
      if (visible(s.x, s.y)) drawables.push({ z: h.x + h.y, read: () => this.drawChestSprite(ctx, h, s) });
    }
    for (const npc of world.npcs) {
      const s = this.worldToView(npc.x, npc.y);
      if (visible(s.x, s.y)) drawables.push({ z: npc.x + npc.y, read: () => this.drawNpcSprite(ctx, npc, s, game) });
    }
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      const s = this.worldToView(enemy.x, enemy.y);
      if (visible(s.x, s.y)) drawables.push({ z: enemy.x + enemy.y + 0.01, read: () => this.drawEnemySprite(ctx, enemy, s, game) });
    }
    if (game.groundLoot) {
      for (const loot of game.groundLoot) {
        const s = this.worldToView(loot.x, loot.y);
        if (visible(s.x, s.y)) drawables.push({ z: loot.x + loot.y + 0.005, read: () => this.drawLootSprite(ctx, loot, s) });
      }
    }
    // player
    const ps = this.worldToView(game.player.x, game.player.y);
    drawables.push({ z: game.player.x + game.player.y + 0.02, read: () => this.drawPlayerSprite(ctx, game, ps) });

    drawables.sort((a, b) => a.z - b.z);
    for (const d of drawables) d.read();

    // target ring under current target
    if (game.target && game.target.alive) this.drawTargetRing(ctx, game.target);
    if (game.interactTarget) this.drawInteractRing(ctx, game.interactTarget);

    // pets (drawn above world)
    if (game.state.char.petActive && game.state.petDef()) {
      const off = this.iso(game.player.x, game.player.y);
      ctx.save();
      const S = this.spriteScale();
      ctx.translate(ps.x + 28, ps.y - 20);
      ctx.scale(S * 0.8, S * 0.8);
      drawPet(ctx, game.state.petDef(), this.time);
      ctx.restore();
    }

    // skill / combat effects and projectiles
    this.drawEffects(ctx, game);

    // ---- screen-space atmosphere ----
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // soft light shafts over the forests
    if (['greendale', 'venomwood', 'ironcrag'].includes(world.regionId)) this.drawSunShafts(ctx);

    // weather
    this.drawWeather(ctx);

    // ambient fog / region tint
    ctx.save();
    const fog = ctx.createRadialGradient(this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.2, this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.76);
    fog.addColorStop(0, pal.fog);
    fog.addColorStop(1, 'rgba(5,4,10,0.46)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    if (world.mode === 'dungeon') {
      ctx.fillStyle = 'rgba(8,4,14,0.16)';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // minimap occasionally
    const now = performance.now();
    if (this.minimapCanvas && now - this.lastMinimap > 220) {
      this.lastMinimap = now;
      this.drawMinimap(this.minimapCanvas, game);
    }
  }

  // ------------------------------------------------------------
  // RUNNING DUST
  // ------------------------------------------------------------
  spawnDust(game) {
    if (!game.player.moving || !this.world) return;
    this._dustAcc = (this._dustAcc || 0) + (this._dt || 0);
    if (this._dustAcc < 0.14) return;
    this._dustAcc = 0;
    const p = this.iso(game.player.x, game.player.y);
    this.dust.push({
      x: p.x - this.cam.x + (Math.random() - 0.5) * 8,
      y: p.y - this.cam.y + 2,
      vx: (Math.random() - 0.5) * 14,
      vy: -6 - Math.random() * 8,
      life: 0.55 + Math.random() * 0.3,
      maxLife: 0.85,
      size: 2 + Math.random() * 2
    });
  }

  updateDust(dt) {
    this._dt = dt;
    for (const d of this.dust) {
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 20 * dt;
    }
    this.dust = this.dust.filter(d => d.life > 0);
  }

  drawDust(ctx) {
    const pal = this.world.region.palette;
    const base = shade(pal.ground1, 0.22);
    for (const d of this.dust) {
      const a = clamp(d.life / d.maxLife, 0, 1) * 0.3;
      ctx.globalAlpha = a;
      ctx.fillStyle = base;
      const s = d.size * (1 + (1 - d.life / d.maxLife));
      ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s * 0.8);
    }
    ctx.globalAlpha = 1;
  }

  drawSunShafts(ctx) {
    const t = this.time;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x = this.width * (0.18 + i * 0.3) + Math.sin(t * 0.15 + i * 2) * 26;
      const g = ctx.createLinearGradient(x, 0, x + 120, this.height);
      g.addColorStop(0, 'rgba(255,236,170,0.075)');
      g.addColorStop(0.75, 'rgba(255,220,140,0.02)');
      g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.lineTo(x + 95, -10);
      ctx.lineTo(x + 230, this.height + 10);
      ctx.lineTo(x + 70, this.height + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  spriteScale() {
    const base = Math.min(this.width, this.height) < 620 ? 2.0 : 2.35;
    return base;
  }

  // ------------------------------------------------------------
  // OBJECT RENDERING
  // ------------------------------------------------------------
  drawShadow(ctx, sx, sy, w, alpha = 0.28) {
    ctx.save();
    const glow = ctx.createRadialGradient(sx, sy + 2, 0, sx, sy + 2, w * 1.15);
    glow.addColorStop(0, `rgba(4,3,10,${alpha})`);
    glow.addColorStop(0.7, `rgba(4,3,10,${alpha * 0.62})`);
    glow.addColorStop(1, 'rgba(4,3,10,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, w * 1.15, w * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.min(0.42, alpha + 0.08);
    ctx.fillStyle = '#08060d';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 1, w * 0.78, w * 0.27, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPropSprite(ctx, prop, s) {
    const S = this.spriteScale() * (prop.scale || 1);
    const sc = this.spriteScale();
    const shadowW = prop.type === 'house' ? 36 : prop.type === 'tent' ? 26 : prop.kind === 'tree' ? 20 : 12;
    this.drawShadow(ctx, s.x, s.y, shadowW * sc * 0.55, prop.type === 'house' ? 0.35 : 0.22);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(S, S);
    drawProp(ctx, { ...prop, scale: 1 }, this.time, this.biomeStyle());
    ctx.restore();

    // prop light sources (flicker)
    if (['campfire', 'brazier', 'forge', 'crystal', 'void_crystal', 'star_well', 'lava_rock'].includes(prop.kind)) {
      const fl = 0.92 + Math.sin(this.time * 6 + s.x * 0.11) * 0.07;
      this.addLight(ctx, s.x, s.y - 12 * sc, (prop.kind === 'forge' ? 120 : 80) * fl, prop.kind === 'crystal' || prop.kind === 'void_crystal' ? '#8fe2ff' : '#ff8a3c');
    }
  }

  drawNodeSprite(ctx, node, s) {
    const S = this.spriteScale();
    this.drawShadow(ctx, s.x, s.y, 12, 0.2);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(S, S);
    drawProp(ctx, { ...node, kind: 'node', scale: node.scale || 1 }, this.time, this.biomeStyle());
    ctx.restore();
    this.addLight(ctx, s.x, s.y - 10, 45, '#b6ff9a', 0.25);
    // sparkle
    const t = this.time * 2 + node.x;
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(t) * 0.3;
    ctx.fillStyle = '#e8ffcc';
    ctx.fillRect(s.x + Math.sin(t * 1.7) * 12, s.y - 24 + Math.cos(t * 1.3) * 6, 2, 2);
    ctx.restore();
  }

  drawLootSprite(ctx, loot, s) {
    const item = loot.item;
    const isStone = item.kind === 'stone';
    const isMat = item.kind === 'material';
    const color = isStone ? '#ffd166' : isMat ? '#a8e07a' : (RARITIES[item.rarity]?.color || '#ffffff');
    const bob = Math.sin(this.time * 4 + (loot.bob || 0)) * 3;
    const x = s.x;
    const y = s.y + bob;
    ctx.save();
    // pickup beam
    ctx.globalAlpha = 0.18 + Math.sin(this.time * 5 + (loot.bob || 0)) * 0.06;
    const g = ctx.createLinearGradient(x, y - 50, x, y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, this.hexAlpha(color, 0.6));
    ctx.fillStyle = g;
    ctx.fillRect(x - 4, y - 50, 8, 50);
    ctx.globalAlpha = 1;
    // glow
    this.addLight(ctx, x, y - 10, 28, color, 0.18);
    // pouch / gem
    if (isMat) {
      ctx.fillStyle = '#3f4a32';
      ctx.fillRect(x - 5, y - 11, 10, 9);
      ctx.fillStyle = color;
      ctx.fillRect(x - 3, y - 13, 6, 5);
      ctx.fillStyle = '#e8ffd0';
      ctx.fillRect(x - 1, y - 12, 2, 2);
    } else if (isStone) {
      ctx.fillStyle = '#2b2130';
      ctx.fillRect(x - 5, y - 10, 10, 8);
      ctx.fillStyle = color;
      ctx.fillRect(x - 3, y - 13, 6, 6);
      ctx.fillStyle = '#fff6d0';
      ctx.fillRect(x - 1, y - 12, 2, 2);
    } else {
      ctx.fillStyle = '#2b2130';
      ctx.fillRect(x - 6, y - 11, 12, 9);
      ctx.fillStyle = this.hexAlpha(color, 0.9);
      ctx.fillRect(x - 4, y - 12, 8, 3);
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(x - 6, y - 4, 12, 2);
      ctx.fillStyle = color;
      ctx.fillRect(x - 1, y - 8, 2, 2);
    }
    // sparkle
    ctx.globalAlpha = 0.6 + Math.sin(this.time * 6 + (loot.bob || 0)) * 0.4;
    ctx.fillStyle = '#fff8d8';
    ctx.fillRect(x + 8, y - 20, 2, 2);
    ctx.fillRect(x - 10, y - 15, 1, 1);
    ctx.restore();
  }

  drawChestSprite(ctx, h, s) {    const S = this.spriteScale();
    this.drawShadow(ctx, s.x, s.y, 12, 0.22);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(S, S);
    drawProp(ctx, { ...h, type: 'chest', kind: 'chest', scale: 1 }, this.time, this.biomeStyle());
    ctx.restore();
    this.addLight(ctx, s.x, s.y - 10, 55, '#ffdf37', 0.28);
    const t = this.time * 2.4 + h.x;
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(t) * 0.3;
    ctx.fillStyle = '#fff3a8';
    ctx.fillRect(s.x - 10 + Math.sin(t) * 3, s.y - 34 + Math.cos(t * 1.3) * 4, 2, 2);
    ctx.fillRect(s.x + 8 + Math.cos(t) * 3, s.y - 28 + Math.sin(t * 1.7) * 4, 2, 2);
    ctx.restore();
  }

  drawNpcSprite(ctx, npc, s, game) {
    const S = this.spriteScale();
    this.drawShadow(ctx, s.x, s.y, 10, 0.24);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(S, S);
    drawNpc(ctx, npc, this.time);
    ctx.restore();

    // name and role
    if (game.state.data.settings.showNames) {
      this.drawWorldLabel(ctx, npc.name, s.x, s.y - 104, '#f0d89a', 10);
    }
    const state = game.state;
    let marker = null;
    if (npc.role === 'Quest Keeper') {
      const available = state.availableQuests().some(q => q.region === npc.region);
      const complete = state.data.quests.active.some(a => {
        const q = game.questDef(a.id);
        return q && q.region === npc.region && state.isQuestComplete(q);
      });
      if (available) marker = '!';
      else if (complete) marker = '?';
    }
    if (marker) {
      const y = s.y - 126 + Math.sin(this.time * 2.5) * 3;
      ctx.save();
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(12,8,18,0.9)';
      ctx.strokeText(marker, s.x, y);
      ctx.fillStyle = marker === '!' ? '#ffd15c' : '#7dffc1';
      ctx.fillText(marker, s.x, y);
      ctx.restore();
    }
  }

  drawEnemySprite(ctx, enemy, s, game) {
    const S = this.spriteScale();
    const def = enemy.def;
    const shadowW = def.boss ? 30 : enemy.elite ? 16 : 12;
    this.drawShadow(ctx, s.x, s.y, shadowW, def.boss ? 0.4 : 0.25);
    if (def.boss) {
      this.addLight(ctx, s.x, s.y - 30, 140, def.color, 0.18);
      // boss aura ring
      ctx.save();
      ctx.globalAlpha = 0.25 + Math.sin(this.time * 2) * 0.08;
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 46, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (enemy.elite) this.addLight(ctx, s.x, s.y - 20, 50, '#ffd166', 0.16);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(S, S);
    drawEnemy(ctx, enemy, this.time);
    ctx.restore();

    // hp bar
    const w = def.boss ? 92 : enemy.elite ? 56 : 40;
    const y = s.y - (def.boss ? 120 : enemy.elite ? 92 : 74) * (enemy.scale || 1) / 1.2;
    this.drawBar(ctx, s.x - w / 2, y, w, 4, enemy.hp / enemy.maxHp, def.boss ? '#ff5a5a' : enemy.elite ? '#ffd166' : '#65d67a');
    if (game.state.data.settings.showNames) {
      const nm = (enemy.elite ? 'Elite ' : '') + def.name + (def.boss ? '  ☠' : '');
      this.drawWorldLabel(ctx, nm, s.x, y - 5, def.boss ? '#ffb08a' : enemy.elite ? '#ffd166' : '#e6e2d8', def.boss ? 11 : 9);
    }
  }

  drawPlayerSprite(ctx, game, s) {
    const state = game.state;
    const c = state.char;
    const S = this.spriteScale();
    const eq = state.data.equipped;
    const wings = state.wingsDef();
    const mount = state.mountDef();
    const cosmetic = state.costumePalette();

    // equipment aura
    const aura = this.equipmentAura(state);
    if (aura) {
      this.addLight(ctx, s.x, s.y - 45, 80 + aura.strength * 20, aura.color, 0.13 + aura.strength * 0.05);
      ctx.save();
      ctx.globalAlpha = 0.25 + aura.strength * 0.08;
      ctx.strokeStyle = aura.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 26 + aura.strength * 5, 10 + aura.strength * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    this.drawShadow(ctx, s.x, s.y, mount ? 24 : 13, mount ? 0.32 : 0.26);
    // A restrained ground sigil anchors the hero against busy terrain.
    ctx.save();
    ctx.globalAlpha = 0.18 + (aura ? aura.strength * 0.025 : 0);
    ctx.strokeStyle = aura?.color || '#e6c46a';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 1, mount ? 28 : 18, mount ? 9 : 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // arcane sigil while casting
    if (game.player.casting) {
      const sigC = c.classId === 'mage' ? '#79d6ff' : '#ffb23e';
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(this.time * 9) * 0.15;
      ctx.strokeStyle = sigC;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 16, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha *= 0.7;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 9, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      const spin = this.time * 6;
      for (let i = 0; i < 6; i++) {
        const a = spin + i * Math.PI / 3;
        ctx.fillStyle = sigC;
        ctx.fillRect(s.x + Math.cos(a) * 16, s.y + Math.sin(a) * 7, 1.5, 1.5);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(S, S);
    drawCharacter(ctx, {
      faction: c.faction, classId: c.classId, gender: c.gender,
      hairStyle: c.hair, hairColor: state.hairColorHex(), eyeColor: state.eyeColorHex(),
      equipment: eq, wings, mount, cosmetic,
      time: this.time, moving: game.player.moving,
      facing: game.player.facing || 1,
      attack: game.player.attackAnim,
      casting: game.player.casting,
      aura: aura,
      weaponFx: state.weaponFxDef()
    });
    ctx.restore();

    // weapon fx particles
    if (state.weaponFxDef()) {
      const fx = state.weaponFxDef();
      ctx.save();
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 3; i++) {
        const a = this.time * 2 + i * 2.1;
        ctx.fillStyle = fx.color;
        ctx.fillRect(s.x + Math.cos(a) * 18, s.y - 40 + Math.sin(a * 1.3) * 22, 2, 2);
      }
      ctx.restore();
    }

    // own name / title
    if (state.data.settings.showNames) {
      this.drawWorldLabel(ctx, `${c.name}  ·  Lv ${c.level}`, s.x, s.y - (mount ? 128 : 112), '#f5e6bd', 10);
    }

    // interact prompt
    if (game.interactLabel) {
      const y = s.y - (mount ? 150 : 132) + Math.sin(this.time * 3) * 2;
      ctx.save();
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const text = game.interactLabel;
      const tw = ctx.measureText(text).width + 14;
      ctx.fillStyle = 'rgba(12,9,20,0.82)';
      this.roundRect(ctx, s.x - tw / 2, y - 11, tw, 16, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(230,196,106,0.5)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, s.x - tw / 2, y - 11, tw, 16, 4);
      ctx.stroke();
      ctx.fillStyle = '#f2dfa8';
      ctx.fillText(text, s.x, y);
      ctx.restore();
    }
  }

  equipmentAura(state) {
    let best = null;
    for (const slot of SLOTS) {
      const item = state.data.equipped[slot.id];
      if (!item) continue;
      const score = (8 - item.tier) * 10 + (RARITIES[item.rarity]?.order || 0) * 4;
      if (!best || score > best.score) {
        best = { score, tier: item.tier, rarity: item.rarity };
      }
    }
    if (!best) return null;
    if (best.tier === 3 && (RARITIES[best.rarity]?.order || 0) < 4) return null;
    return {
      tier: best.tier,
      color: RARITIES[best.rarity]?.color || '#ffe08a',
      strength: best.tier === 1 ? 3 : best.tier === 2 ? 2 : 1
    };
  }

  drawGroundLights(ctx, world) {
    // static warm pools around campfires and forges (flickering gently)
    const vw = this.viewW(), vh = this.viewH();
    for (const prop of world.props) {
      if (!['campfire', 'forge', 'brazier'].includes(prop.kind)) continue;
      const s = this.worldToView(prop.x, prop.y);
      if (s.x < -120 || s.x > vw + 120 || s.y < -80 || s.y > vh + 80) continue;
      const fl = 0.9 + Math.sin(this.time * 7 + prop.x * 3) * 0.08 + Math.sin(this.time * 3.1 + prop.y) * 0.05;
      this.addLight(ctx, s.x, s.y - 8, (prop.kind === 'forge' ? 100 : 70) * fl, '#ff9a4a', 0.16);
    }
  }

  addLight(ctx, x, y, radius, color, alpha = 0.2) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 2, x, y, radius);
    g.addColorStop(0, this.hexAlpha(color, alpha));
    g.addColorStop(1, this.hexAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  hexAlpha(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  drawWaterFX(ctx) {
    const pal = this.world.region.palette;
    const t = this.time;
    ctx.save();
    // drifting highlight waves
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < this.waterTiles.length; i++) {
      const tile = this.waterTiles[i];
      if ((i + Math.floor(t * 2)) % 4 !== 0) continue;
      const s = this.worldToView(tile.x, tile.y);
      if (s.x < -40 || s.x > this.viewW() + 40 || s.y < -20 || s.y > this.viewH() + 20) continue;
      const off = Math.sin(t * 1.8 + i) * 6;
      ctx.fillStyle = '#d7f6ff';
      ctx.fillRect(s.x + off - 5, s.y + 2, 10, 1);
    }
    // softer secondary shimmer offset from the first pass
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < this.waterTiles.length; i++) {
      const tile = this.waterTiles[i];
      if ((i + Math.floor(t * 1.3) + 2) % 5 !== 0) continue;
      const s = this.worldToView(tile.x, tile.y);
      if (s.x < -40 || s.x > this.viewW() + 40 || s.y < -20 || s.y > this.viewH() + 20) continue;
      const off = Math.cos(t * 1.1 + i * 1.7) * 7;
      ctx.fillStyle = shade(pal.water, 0.3);
      ctx.fillRect(s.x + off - 4, s.y - 2, 8, 1);
    }
    // occasional glint
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < this.waterTiles.length; i++) {
      if ((i + Math.floor(t * 0.7)) % 17 !== 0) continue;
      const tile = this.waterTiles[i];
      const s = this.worldToView(tile.x, tile.y);
      if (s.x < -40 || s.x > this.viewW() + 40 || s.y < -20 || s.y > this.viewH() + 20) continue;
      const tw = Math.sin(t * 3 + i);
      if (tw <= 0.55) continue;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x + tw * 3, s.y - 1 - tw * 2, 2, 1);
    }
    ctx.restore();
  }

  drawEffects(ctx, game) {
    for (const fx of game.effects) {
      const s = this.worldToView(fx.x, fx.y);
      const life = 1 - fx.life / fx.maxLife;
      if (fx.type === 'dmg') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, fx.life / 0.4);
        ctx.font = `bold ${(fx.big ? 20 : 14) / this.viewZoom}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(10,8,16,0.85)';
        const y = s.y - 70 - life * 34 + (fx.offset || 0);
        ctx.strokeText(fx.text, s.x + (fx.dx || 0), y);
        ctx.fillStyle = fx.color;
        ctx.fillText(fx.text, s.x + (fx.dx || 0), y);
        ctx.restore();
      } else if (fx.type === 'ring') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, fx.life / fx.maxLife) * 0.7;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = fx.width || 3;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y - 10, fx.radius * life * 2.2, fx.radius * life * 0.9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (fx.type === 'slash') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, fx.life / fx.maxLife) * 0.8;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(s.x, s.y - 32, 34, -1.2 + life * 0.4, 0.9 + life * 1.2);
        ctx.stroke();
        ctx.restore();
      } else if (fx.type === 'beam') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, fx.life / fx.maxLife) * 0.7;
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 2 + Math.sin(this.time * 20) * 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - 46);
        ctx.lineTo(s.x + (fx.dx || 0), s.y - 46 + (fx.dy || -80));
        ctx.stroke();
        ctx.restore();
      } else if (fx.type === 'burst') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, fx.life / fx.maxLife);
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2 + life * 2;
          ctx.fillStyle = fx.color;
          ctx.fillRect(s.x + Math.cos(a) * life * 40, s.y - 30 + Math.sin(a) * life * 18, 3, 3);
        }
        ctx.restore();
      }
    }
    // projectiles
    for (const pr of game.projectiles) {
      const s = this.worldToView(pr.x, pr.y);
      ctx.save();
      if (pr.type === 'arrow') {
        // motion streak
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#e8dcc0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x - 22, s.y - 40);
        ctx.lineTo(s.x - 10, s.y - 42);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#e8dcc0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x - 10, s.y - 42);
        ctx.lineTo(s.x + 6, s.y - 36);
        ctx.stroke();
        ctx.fillStyle = '#cfd8e2';
        ctx.fillRect(s.x + 5, s.y - 39, 4, 4);
      } else if (pr.type === 'fire') {
        // trailing embers
        ctx.globalAlpha = 0.4;
        for (let i = 1; i <= 3; i++) {
          ctx.fillStyle = i === 1 ? '#ffd166' : '#ff7a3c';
          ctx.fillRect(s.x - 8 - i * 5, s.y - 33 - Math.sin(i) * 3, 2, 2);
        }
        ctx.globalAlpha = 1;
        const gr = ctx.createRadialGradient(s.x, s.y - 34, 1, s.x, s.y - 34, 10);
        gr.addColorStop(0, '#fff4c4');
        gr.addColorStop(0.4, '#ffb23e');
        gr.addColorStop(1, 'rgba(255,80,40,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(s.x - 12, s.y - 46, 24, 24);
      } else {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = pr.color || '#b079ff';
        ctx.fillRect(s.x - 10, s.y - 41, 9, 5);
        ctx.globalAlpha = 1;
        ctx.fillStyle = pr.color || '#b079ff';
        ctx.fillRect(s.x - 3, s.y - 38, 6, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(s.x - 2, s.y - 37, 2, 2);
        ctx.globalAlpha = 0.4;
        ctx.fillRect(s.x - 6, s.y - 41, 12, 12);
      }
      ctx.restore();
    }
  }

  drawTargetRing(ctx, target) {
    const s = this.worldToView(target.x, target.y);
    ctx.save();
    ctx.strokeStyle = '#ff6a6a';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55 + Math.sin(this.time * 5) * 0.2;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 24, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawInteractRing(ctx, entity) {
    const s = this.worldToView(entity.x, entity.y);
    ctx.save();
    ctx.strokeStyle = '#ffe08a';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5 + Math.sin(this.time * 4) * 0.2;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 20, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawWorldLabel(ctx, text, x, y, color, size) {
    ctx.save();
    // world text is drawn inside the zoomed view — compensate so labels stay readable
    ctx.font = `${(size / this.viewZoom).toFixed(1)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(8,6,14,0.85)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawBar(ctx, x, y, w, h, pct, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,14,0.75)';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, w * clamp(pct, 0, 1)), h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, y, Math.max(0, w * clamp(pct, 0, 1)), 1);
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  biomeStyle() {
    const id = this.world.regionId;
    return {
      leaf: { greendale: '#4f8a4b', ironcrag: '#4c6a3c', venomwood: '#4e5f34', mistgrave: '#3d4a48', frostpeak: '#3f6b5b', sunscorch: '#6b7a3f', ashen: '#4a3030', tower: '#3a3a6b' }[id],
      pine: { greendale: '#356044', ironcrag: '#33523c', venomwood: '#334d3a', mistgrave: '#2e3f42', frostpeak: '#2f5946', sunscorch: '#4f6138', ashen: '#352b2b', tower: '#373a68' }[id],
      bush: { greendale: '#3f7a44', ironcrag: '#556b3c', venomwood: '#55476b', mistgrave: '#44505a', frostpeak: '#557a72', sunscorch: '#7a8a4a', ashen: '#4e3434', tower: '#45457a' }[id],
      mushroom: { greendale: '#9b6bff', venomwood: '#b06bff' }[id] || '#9b6bff',
      crystal: { frostpeak: '#9ae3ff', tower: '#b5a8ff' }[id] || '#85d6f0',
      wall: { greendale: '#b09268', ironcrag: '#8a7058', venomwood: '#7a7a62', mistgrave: '#8a8d96', frostpeak: '#a8bcc8', sunscorch: '#c9a873', ashen: '#6b4a46', tower: '#6b679a' }[id],
      roof: { greendale: '#7a3f35', ironcrag: '#5a3a32', venomwood: '#4f3d5e', mistgrave: '#3f4a5e', frostpeak: '#4a6680', sunscorch: '#9a5a3c', ashen: '#5e2a2e', tower: '#463f7a' }[id],
      banner: { greendale: '#a83232', ironcrag: '#b05e2e', venomwood: '#6b3a8a', mistgrave: '#345a7a', frostpeak: '#3a6a8a', sunscorch: '#b0782e', ashen: '#8a2a2a', tower: '#5a4aba' }[id],
      accent: this.world.region.palette.accent,
      tent: { greendale: '#8a5a3c', ironcrag: '#7a4a34', venomwood: '#5e4a6b', mistgrave: '#4a566b', frostpeak: '#5a748a', sunscorch: '#a86a3c', ashen: '#6b3a3a', tower: '#4e4a8a' }[id]
    };
  }

  // ------------------------------------------------------------
  // MINIMAP
  // ------------------------------------------------------------
  drawMinimap(canvas, game) {
    const ctx = canvas.getContext('2d');
    const world = this.world;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(8,7,14,0.88)';
    ctx.fillRect(0, 0, w, h);
    if (!world) return;
    const pad = 4;
    const scale = Math.min((w - pad * 2) / world.size, (h - pad * 2) / world.size);
    const ox = (w - world.size * scale) / 2;
    const oy = (h - world.size * scale) / 2;
    for (let y = 0; y < world.size; y++) {
      for (let x = 0; x < world.size; x++) {
        const t = world.tiles[y * world.size + x];
        let col = '#2b3d2e';
        if (t.type === 'water') col = '#25505c';
        else if (t.type === 'path' || t.type === 'plaza') col = '#6b5a3d';
        else if (t.type === 'void') col = '#0a0918';
        else if (t.type === 'ground2') col = shade(world.region.palette.ground2, -0.1);
        else if (t.type === 'ground3') col = shade(world.region.palette.ground3, -0.1);
        ctx.fillStyle = col;
        ctx.fillRect(ox + x * scale, oy + y * scale, Math.ceil(scale), Math.ceil(scale));
      }
    }
    // npcs
    for (const n of world.npcs) {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(ox + n.x * scale - 1, oy + n.y * scale - 1, 3, 3);
    }
    // enemies
    for (const e of world.enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = e.boss ? '#ff4d4d' : e.elite ? '#ffd166' : 'rgba(255,110,110,0.75)';
      const sz = e.boss ? 4 : 2;
      ctx.fillRect(ox + e.x * scale - sz / 2, oy + e.y * scale - sz / 2, sz, sz);
    }
    // player
    const px = ox + game.player.x * scale;
    const py = oy + game.player.y * scale;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1520'; ctx.lineWidth = 1; ctx.stroke();
    // border + region label
    ctx.strokeStyle = 'rgba(230,196,106,0.35)';
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }
}

// ------------------------------------------------------------
// CHARACTER PREVIEW (creation + character panel)
// ------------------------------------------------------------
export function renderCharacterPreview(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(120, rect.width || 180);
  const h = Math.max(160, rect.height || 240);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const bg = ctx.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.5, w * 0.75);
  bg.addColorStop(0, opts.bg1 || 'rgba(120,100,190,0.25)');
  bg.addColorStop(1, 'rgba(6,5,12,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // pedestal
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#151020';
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 22, 54, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(230,196,106,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  const S = Math.min(w / 70, h / 72) * 1.18;
  ctx.save();
  ctx.translate(w / 2, h - 30);
  ctx.scale(S, S);
  drawCharacter(ctx, {
    faction: opts.faction || 'angel',
    classId: opts.classId || 'warrior',
    gender: opts.gender || 'male',
    hairStyle: opts.hair || 'short',
    hairColor: opts.hairColor || '#5b3a25',
    eyeColor: opts.eyeColor || '#3f8cff',
    equipment: opts.equipment || {},
    wings: opts.wings || null,
    mount: null,
    cosmetic: opts.cosmetic || null,
    time: opts.time || performance.now() / 1000,
    moving: false,
    facing: 1,
    attack: 0,
    casting: false,
    aura: opts.aura || null
  });
  ctx.restore();
  if (opts.wings) {
    // wings already part of drawCharacter
  }
}
