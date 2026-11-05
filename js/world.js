import { WORLD, REGIONS, MONSTERS, CLASSES, FACTIONS } from './config.js';
import { getPropSprite, mulberry32, TAU, shade, rgba, clamp, lerp } from './art.js';

const TILE = WORLD.tileW;
const TILE_H = WORLD.tileH;
const SIZE = WORLD.size;
const ELEV = WORLD.elevation;

function hash2(x, y, seed) {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function noise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = smooth(xf), v = smooth(yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, seed) {
  return noise2(x, y, seed) * 0.56 + noise2(x * 2.03, y * 2.03, seed + 11) * 0.29 + noise2(x * 4.1, y * 4.1, seed + 29) * 0.15;
}
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

export class World {
  constructor(regionId, seedOffset = 0) {
    this.region = REGIONS[regionId] || REGIONS.greendale;
    this.regionId = this.region.id;
    this.size = SIZE;
    this.seed = (this.region.seed || 1) + seedOffset * 101;
    this.rng = mulberry32(this.seed);
    this.height = new Int8Array(SIZE * SIZE);
    this.tiles = new Array(SIZE * SIZE);
    this.props = [];
    this.colliders = [];
    this.npcs = [];
    this.spawns = [];
    this.lights = [];
    this.interactables = [];
    this.maxElev = 2;
    this.origin = { x: SIZE * TILE / 2 + 48, y: 84 + this.maxElev * ELEV };
    this.ground = null;
    this.minimap = null;
    this.safeZones = [];
    this.generate();
  }

  idx(x, y) { return y * SIZE + x; }
  inBounds(x, y) { return x >= 1 && y >= 1 && x < SIZE - 1 && y < SIZE - 1; }
  heightAt(x, y) {
    if (!this.inBounds(x, y)) return 0;
    return this.height[this.idx(Math.floor(x), Math.floor(y))] || 0;
  }
  tileAt(x, y) {
    if (!this.inBounds(x, y)) return 'void';
    return this.tiles[this.idx(Math.floor(x), Math.floor(y))] || 'grass';
  }

  iso(x, y) {
    const h = this.heightAt(x, y);
    return {
      x: (x - y) * TILE / 2 + this.origin.x,
      y: (x + y) * TILE_H / 2 + this.origin.y - h * ELEV,
      h,
    };
  }

  elevationAt(x, y) {
    return this.heightAt(x, y) * ELEV;
  }

  isBlockedTile(x, y) {
    if (!this.inBounds(x, y)) return true;
    const t = this.tileAt(x, y);
    return t === 'water' || t === 'lava' || t === 'void';
  }

  generate() {
    const { village, dungeon, biome } = this.region;
    const pathSeed = this.seed + 77;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x * 0.075, y * 0.075, this.seed);
        const detail = fbm(x * 0.2, y * 0.2, this.seed + 3);
        let h = Math.floor(n * 2.55 + detail * 1.05 - 0.55);
        const distVillage = Math.hypot(x - village.x, y - village.y);
        const distDungeon = Math.hypot(x - dungeon.x, y - dungeon.y);
        const distPath = distToSegment(x, y, village.x, village.y, dungeon.x, dungeon.y);
        if (distVillage < village.size + 2.5 || distDungeon < dungeon.size || distPath < 1.8) h = 0;
        if (biome === 'rock' && detail > 0.63) h += 1;
        if (biome === 'snow' && n > 0.63) h += 1;
        if (biome === 'volcanic' && detail > 0.6) h += 1;
        h = clamp(h, 0, this.maxElev);
        this.height[this.idx(x, y)] = h;

        let tile = 'grass';
        const riverNoise = noise2(x * 0.09, y * 0.09, this.seed + 51);
        const riverBand = Math.abs((x * 0.7 - y * 0.35) / 20 + Math.sin(y * 0.16) * 0.11 - 0.34);
        if (biome === 'meadow' && riverBand < 0.035 && distVillage > 6) tile = 'water';
        if (biome === 'swamp' && riverNoise > 0.66) tile = 'water';
        if (biome === 'snow' && riverNoise > 0.77) tile = 'water';
        if (biome === 'desert' && riverNoise > 0.82) tile = 'water';
        if (biome === 'volcanic' && riverNoise > 0.74) tile = 'lava';
        if (biome === 'astral' && riverNoise > 0.79) tile = 'water';
        if (['rock', 'snow', 'volcanic', 'astral'].includes(biome) && h >= 2) tile = tile === 'water' ? 'water' : 'rock';
        if (biome === 'desert') tile = riverNoise > 0.56 ? 'sand' : 'sandDark';
        if (biome === 'snow') tile = riverNoise < 0.48 ? 'snow' : tile;
        if (biome === 'graveyard') tile = riverNoise > 0.65 ? 'moor' : 'grass';
        if (biome === 'swamp') tile = tile === 'water' ? 'water' : 'marsh';
        if (biome === 'volcanic') tile = tile === 'lava' ? 'lava' : (riverNoise > 0.52 ? 'ash' : 'ashDark');

        if (distPath < 1.25 + Math.sin((x + y) * 0.4) * 0.12) tile = 'path';
        if (distVillage < village.size - 1.5) tile = 'plaza';
        if (distDungeon < dungeon.size - 2.5) tile = 'dungeonFloor';
        if (tile === 'water' || tile === 'lava') {
          if (distPath < 1.6 && distVillage > village.size) tile = 'path';
        }
        this.tiles[this.idx(x, y)] = tile;
      }
    }
    this.safeZones = [
      { x: village.x, y: village.y, r: village.size + 3 },
      { x: dungeon.x, y: dungeon.y, r: 2.5 },
    ];
    this.generateVillage();
    this.generateDungeon();
    this.generateWilds();
    this.generateSpawns();
    this.renderGround();
    this.renderMinimap();
  }

  addProp(type, x, y, variant = 0, opts = {}) {
    const sprite = getPropSprite(type, variant, this.region.palette, this.seed + Math.floor(x * 31 + y * 17));
    const p = {
      type, x, y, variant, sprite, height: sprite.ay, animated: opts.animated || null,
      glow: opts.glow || null, light: opts.light || null, depthBias: opts.depthBias || 0,
    };
    this.props.push(p);
    if (opts.collision) this.colliders.push({ x, y, r: opts.collision, type });
    if (opts.light) this.lights.push({ x, y, ...opts.light, baseX: x, baseY: y, phase: this.rng() * TAU });
    return p;
  }

  addLight(x, y, color, radius, intensity = 0.5, flicker = 0.1) {
    this.lights.push({ x, y, color, radius, intensity, flicker, phase: this.rng() * TAU });
  }

  generateVillage() {
    const v = this.region.village;
    const palette = this.region.palette;
    const structures = [
      ['inn', v.x - 3.2, v.y - 2.8, 0, { collision: 1.8, light: { color: '#ffc169', radius: 4.6, intensity: 0.25 } }],
      ['house', v.x + 3.3, v.y - 2.2, 1, { collision: 1.7 }],
      ['forge', v.x - 3.7, v.y + 2.6, 0, { collision: 1.9, light: { color: '#ff7f3f', radius: 5.2, intensity: 0.45 } }],
      ['chapel', v.x + 3.5, v.y + 2.9, 0, { collision: 1.9, light: { color: '#ffe2a1', radius: 4.2, intensity: 0.22 } }],
      ['vault', v.x + 4.9, v.y - 0.3, 0, { collision: 1.3 }],
      ['house', v.x - 0.8, v.y - 4.4, 0, { collision: 1.6 }],
    ];
    for (const [type, x, y, variant, opts] of structures) this.addProp(type, x, y, variant, opts);
    this.addProp('stall', v.x + 1.6, v.y + 3.3, 1, { collision: 1.1, light: { color: '#ffd37c', radius: 3.2, intensity: 0.2 } });
    this.addProp('waystone', v.x, v.y + 0.5, 0, { collision: 0.75, animated: 'waystone', light: { color: palette.accent, radius: 3.4, intensity: 0.55, flicker: 0.18 } });
    this.addProp('banner', v.x - 2.1, v.y + 1.5, 0, {});
    this.addProp('banner', v.x + 2.2, v.y + 1.6, 1, {});
    this.addProp('barrel', v.x + 2.8, v.y + 4, 0, { collision: 0.3 });
    this.addProp('crate', v.x + 3.5, v.y + 4.2, 0, { collision: 0.3 });
    this.addProp('barrel', v.x - 5.1, v.y + 1.0, 0, { collision: 0.3 });
    this.addProp('anvil', v.x - 2.2, v.y + 3.8, 0, { collision: 0.35 });
    this.addProp('campfire', v.x + 6.2, v.y + 1.7, 0, { animated: 'fire', light: { color: '#ff9948', radius: 4, intensity: 0.5, flicker: 0.3 } });
    this.addProp('fence', v.x - 5.7, v.y - 3.8, 0, {});
    this.addProp('fence', v.x - 4.7, v.y - 4.1, 0, {});
    this.addProp('torch', v.x + 2.0, v.y + 1.2, 0, { light: { color: '#ffb55c', radius: 2.4, intensity: 0.45, flicker: 0.28 } });
    this.addProp('torch', v.x - 2.4, v.y + 0.2, 1, { light: { color: '#ffb55c', radius: 2.4, intensity: 0.45, flicker: 0.28 } });

    const npcBase = [
      { service: 'questgiver', name: this.region.giver, title: this.region.npcTitle, x: v.x - 1.8, y: v.y + 1.2, appearance: this.region.id === 'tower' ? 'mystic' : 'warden', quest: true },
      { service: 'merchant', name: 'Mirael the Merchant', title: 'Wandering Trader', x: v.x + 2.0, y: v.y + 2.4, appearance: 'merchant' },
      { service: 'blacksmith', name: 'Brakka Ironhand', title: 'Master Blacksmith', x: v.x - 2.4, y: v.y + 3.0, appearance: 'smith' },
      { service: 'keeper', name: 'Vault Keeper Sen', title: 'Keeper of the Satchel', x: v.x + 3.8, y: v.y - 0.4, appearance: 'keeper' },
      { service: 'waystone', name: 'Waystone of ' + v.name, title: 'Ancient Teleporter', x: v.x, y: v.y + 1.4, appearance: 'waystone' },
    ];
    for (const npc of npcBase) {
      this.npcs.push({ ...npc, id: `${this.region.id}_${npc.service}`, kind: 'service' });
    }
    // A pair of non-interactive faction pilgrims makes the shared-world lore visible,
    // without ever pretending they are networked players.
    this.npcs.push({
      id: `${this.region.id}_angel_pilgrim`, kind: 'pilgrim', name: 'Luminari Pilgrim', title: 'Faction NPC',
      x: v.x + 5.4, y: v.y + 3.6, faction: 'angel', appearance: { faction: 'angel', classId: 'dawnblade', gender: 'female', hairstyle: 'flowing', hairColor: '#e8dfc8', eyeColor: '#8dd7ff', skinTone: '#f1d2b6', marking: 'rune', wingsId: 'dawnfeather' },
    });
    this.npcs.push({
      id: `${this.region.id}_demon_pilgrim`, kind: 'pilgrim', name: 'Emberkin Envoy', title: 'Faction NPC',
      x: v.x - 5.6, y: v.y + 4.1, faction: 'demon', appearance: { faction: 'demon', classId: 'voidcaller', gender: 'male', hairstyle: 'wild', hairColor: '#2a1b16', eyeColor: '#ff8d6b', skinTone: '#8e5a3f', marking: 'scar', wingsId: 'emberpinions' },
    });
    // service light halos
    this.addLight(v.x, v.y, palette.accent, 7, 0.15, 0.02);
    for (const npc of this.npcs.filter((n) => n.kind === 'service')) {
      this.interactables.push({ id: npc.id, x: npc.x, y: npc.y, kind: 'npc', npc });
    }
    // Waystone is also interactable at its exact position.
    this.interactables.push({ id: `${this.region.id}_waystone`, x: v.x, y: v.y + 0.5, kind: 'waystone', name: 'Waystone' });
  }

  generateDungeon() {
    const d = this.region.dungeon;
    const palette = this.region.palette;
    const boss = MONSTERS[this.region.bossId];
    this.addProp('portal', d.x, d.y + d.size - 1.2, 0, { collision: 1.3, animated: 'portal', light: { color: palette.accent, radius: 4.5, intensity: 0.55, flicker: 0.16 } });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      const px = d.x + Math.cos(a) * (d.size - 2.4);
      const py = d.y + Math.sin(a) * (d.size - 2.4);
      this.addProp(i % 3 === 0 ? 'obelisk' : 'ruins', px, py, i, { collision: 0.3, light: i % 3 === 0 ? { color: palette.accent, radius: 2.2, intensity: 0.24, flicker: 0.1 } : null });
    }
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU + 0.3;
      this.addProp('torch', d.x + Math.cos(a) * (d.size - 3.5), d.y + Math.sin(a) * (d.size - 3.5), i, { light: { color: palette.accent, radius: 3.2, intensity: 0.38, flicker: 0.25 } });
    }
    for (let i = 0; i < 6; i++) {
      const a = this.rng() * TAU;
      const rr = this.rng() * (d.size - 3);
      this.addProp('bones', d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr, i, {});
    }
    this.addProp('shrine', d.x - 2, d.y - 2, 0, { collision: 0.7, light: { color: palette.accent, radius: 3.4, intensity: 0.38, flicker: 0.08 } });
    this.addLight(d.x, d.y, palette.accent, 11, 0.16, 0.04);
    this.interactables.push({ id: `${this.region.id}_dungeon`, x: d.x, y: d.y + d.size - 1.2, kind: 'dungeon', name: d.name, bossId: boss.id });
  }

  nearestSafe(x, y, pad = 0) {
    for (const z of this.safeZones) if (Math.hypot(x - z.x, y - z.y) < z.r + pad) return true;
    return false;
  }

  generateWilds() {
    const { biome, village, dungeon, palette, spawns } = this.region;
    const treeTypes = biome === 'meadow' ? ['oak', 'oak', 'pine', 'dead']
      : biome === 'rock' ? ['pine', 'dead', 'rock']
      : biome === 'swamp' ? ['mushroomTree', 'dead', 'mushroomTree', 'oak']
      : biome === 'graveyard' ? ['dead', 'dead', 'pine']
      : biome === 'snow' ? ['pine', 'pine', 'dead']
      : biome === 'desert' ? ['palm', 'cactus', 'dead']
      : biome === 'volcanic' ? ['ashTree', 'dead', 'ashTree']
      : ['crystal', 'crystal', 'dead'];
    const treeCount = biome === 'desert' ? 30 : biome === 'volcanic' ? 38 : biome === 'astral' ? 42 : 105;
    for (let i = 0; i < treeCount; i++) {
      for (let tries = 0; tries < 20; tries++) {
        const x = 2 + this.rng() * (SIZE - 4);
        const y = 2 + this.rng() * (SIZE - 4);
        if (Math.hypot(x - village.x, y - village.y) < village.size + 3.5) continue;
        if (Math.hypot(x - dungeon.x, y - dungeon.y) < dungeon.size + 2) continue;
        if (distToSegment(x, y, village.x, village.y, dungeon.x, dungeon.y) < 2.6) continue;
        if (this.isBlockedTile(x, y)) continue;
        const type = treeTypes[Math.floor(this.rng() * treeTypes.length)];
        const variant = Math.floor(this.rng() * 4);
        const collision = type === 'cactus' ? 0.28 : type === 'crystal' || type === 'rock' ? 0.35 : 0.28;
        this.addProp(type, x, y, variant, { collision });
        break;
      }
    }
    // Rocks and biome-specific detail
    const detailTypes = biome === 'snow' ? ['rock', 'boulder', 'pine']
      : biome === 'desert' ? ['rock', 'bones', 'cactus']
      : biome === 'graveyard' ? ['grave', 'dead', 'bones', 'ruins']
      : biome === 'swamp' ? ['mushroomTree', 'bones', 'rock']
      : biome === 'volcanic' ? ['rock', 'bones', 'obelisk']
      : biome === 'astral' ? ['crystal', 'obelisk', 'ruins']
      : ['rock', 'stump', 'boulder', 'grave'];
    for (let i = 0; i < 55; i++) {
      const x = 3 + this.rng() * (SIZE - 6);
      const y = 3 + this.rng() * (SIZE - 6);
      if (this.nearestSafe(x, y, 2) || this.isBlockedTile(x, y)) continue;
      if (distToSegment(x, y, village.x, village.y, dungeon.x, dungeon.y) < 1.7) continue;
      const type = detailTypes[Math.floor(this.rng() * detailTypes.length)];
      this.addProp(type, x, y, Math.floor(this.rng() * 4), { collision: type === 'rock' || type === 'boulder' ? 0.35 : 0 });
    }
    // Camps give environments a story and a few elite spawn anchors.
    for (let c = 0; c < 3; c++) {
      let cx, cy;
      for (let tries = 0; tries < 30; tries++) {
        cx = 6 + this.rng() * (SIZE - 12); cy = 6 + this.rng() * (SIZE - 12);
        if (!this.nearestSafe(cx, cy, 4) && !this.isBlockedTile(cx, cy)) break;
      }
      this.addProp('campfire', cx, cy, c % 3, { light: { color: '#ff9d4d', radius: 3.6, intensity: 0.34, flicker: 0.32 } });
      this.addProp('bones', cx + 1.2, cy + 0.8, c, {});
      this.addProp('fence', cx - 1.8, cy + 1.6, c, {});
      if (biome === 'astral') this.addProp('crystal', cx - 1.4, cy - 1.2, 1, { collision: 0.25 });
      this.spawns.push({ x: cx, y: cy, monster: spawns[c % spawns.length], camp: true });
      this.spawns.push({ x: cx + 0.8, y: cy + 1.2, monster: spawns[(c + 1) % spawns.length], camp: true });
    }
    // Ambient fireflies/pollen/ash motes are handled by the renderer.
    this.addLight(village.x, village.y, palette.accent, 3.6, 0.08, 0.01);
  }

  generateSpawns() {
    const { biome, village, dungeon, spawns, elite, bossId } = this.region;
    const normalCount = 16;
    for (let i = 0; i < normalCount; i++) {
      for (let tries = 0; tries < 25; tries++) {
        const x = 3 + this.rng() * (SIZE - 6);
        const y = 3 + this.rng() * (SIZE - 6);
        if (this.nearestSafe(x, y, 4.5)) continue;
        if (this.isBlockedTile(x, y)) continue;
        if (this.colliders.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + 0.6)) continue;
        const species = spawns[i % spawns.length];
        this.spawns.push({ x, y, monster: species });
        break;
      }
    }
    // elites guard the dungeon approach
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * TAU + 0.5;
      this.spawns.push({ x: dungeon.x + Math.cos(a) * (dungeon.size - 3), y: dungeon.y + Math.sin(a) * (dungeon.size - 3), monster: elite, elite: true });
    }
    const boss = MONSTERS[bossId];
    this.spawns.push({ x: dungeon.x, y: dungeon.y, monster: bossId, boss: true });
    this.boss = boss;
    this.dungeon = dungeon;
    this.village = village;
  }

  renderGround() {
    const width = SIZE * TILE + 128;
    const height = SIZE * TILE_H + this.maxElev * ELEV + 190;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    this.ground = canvas;
    const palette = this.region.palette;
    const biome = this.region.biome;
    ctx.fillStyle = palette.sky[0]; ctx.fillRect(0, 0, width, height);
    // Underside void/edge
    ctx.fillStyle = '#12161a'; ctx.globalAlpha = 0.55; ctx.fillRect(0, 0, width, height); ctx.globalAlpha = 1;
    // Tile render. Painter order: back to front.
    const order = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) order.push([x, y, x + y]);
    order.sort((a, b) => a[2] - b[2] || a[0] - b[0]);
    for (const [x, y] of order) {
      const h = this.height[this.idx(x, y)];
      const p = this.iso(x, y);
      const tile = this.tiles[this.idx(x, y)];
      this.drawTile(ctx, p.x, p.y, h, x, y, tile, palette, biome);
    }
    // Map edge dark vignette
    const edge = ctx.createLinearGradient(0, 0, 0, height);
    edge.addColorStop(0, 'rgba(8,12,18,.18)'); edge.addColorStop(0.5, 'rgba(8,12,18,0)'); edge.addColorStop(1, 'rgba(8,12,18,.32)');
    ctx.fillStyle = edge; ctx.fillRect(0, 0, width, height);
    // Ground-level light stains around village
    const vp = this.iso(this.village.x, this.village.y);
    const vg = ctx.createRadialGradient(vp.x, vp.y, 20, vp.x, vp.y, 460);
    vg.addColorStop(0, rgba(palette.accent, 0.07)); vg.addColorStop(1, rgba(palette.accent, 0));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, width, height);
  }

  drawTile(ctx, sx, sy, h, tx, ty, tile, palette, biome) {
    const lift = h * ELEV;
    const top = sy - TILE_H / 2;
    const left = sx - TILE / 2;
    const right = sx + TILE / 2;
    const bottom = sy + TILE_H / 2;
    // extruded sides
    if (h > 0) {
      ctx.fillStyle = shade(palette.cliff, -16);
      pathFill(ctx, [[left, sy], [sx, bottom], [sx, bottom + lift], [left, sy + lift]]);
      ctx.fillStyle = shade(palette.cliff, -3);
      pathFill(ctx, [[sx, bottom], [right, sy], [right, sy + lift], [sx, bottom + lift]]);
      ctx.strokeStyle = rgba(palette.cliffLight, 0.2); ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        const yy = lift * i / 3;
        ctx.beginPath(); ctx.moveTo(left + 4, sy + yy); ctx.lineTo(sx - 2, bottom + yy - 2); ctx.lineTo(right - 4, sy + yy); ctx.stroke();
      }
    }
    const diamond = [[sx, top], [right, sy], [sx, bottom], [left, sy]];
    const rng = mulberry32(this.seed + tx * 911 + ty * 337);
    const dark = h > 0 ? -6 : 0;
    let colors = palette.ground;
    if (tile === 'path') colors = palette.path;
    else if (tile === 'plaza') colors = ['#7e7663', '#8c836e', '#746c5b', '#998e76'];
    else if (tile === 'dungeonFloor') colors =['#5a555c', '#6a646b', '#4e4a53', '#777077'];
    else if (tile === 'sand' || tile === 'sandDark') colors = ['#c4a064', '#b78f55', '#ceac70', '#aa814b'];
    else if (tile === 'snow') colors = ['#dbe7eb', '#c9d9df', '#eff6f7', '#b9ccd4'];
    else if (tile === 'marsh') colors = ['#425b43', '#4c6748', '#3c5140', '#607a52'];
    else if (tile === 'moor') colors = ['#50555b', '#5c6062', '#484d53', '#65665f'];
    else if (tile === 'ash') colors = ['#433639', '#4e3d3a', '#392f33', '#5b433b'];
    else if (tile === 'ashDark') colors = ['#332a2e', '#3c3033', '#2b2529', '#493633'];
    else if (tile === 'rock') colors = ['#7a7365', '#857d6d', '#686255', '#918878'];
    if (tile === 'water' || tile === 'lava') {
      const water = tile === 'water';
      const c = water ? palette.water : ['#8c2e1d', '#cf4d22', '#ff9b3d'];
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, c[0]); g.addColorStop(0.55, c[1]); g.addColorStop(1, c[2]);
      ctx.fillStyle = g; pathFill(ctx, diamond);
      ctx.save(); path(ctx, diamond); ctx.clip();
      ctx.strokeStyle = water ? rgba('#d5fff2', 0.28) : rgba('#ffe09b', 0.42);
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const yy = top + 8 + i * 10 + Math.sin(tx * 2 + ty) * 2;
        ctx.beginPath(); ctx.moveTo(sx - 30 + rng() * 10, yy); ctx.quadraticCurveTo(sx - 5, yy - 3, sx + 13, yy); ctx.stroke();
      }
      if (!water) {
        orb(ctx, sx, sy, 32, '#ff6a2f', 0.18);
      }
      ctx.restore();
      return;
    }
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
    pathFill(ctx, diamond);
    // soft tile gradient
    const grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0, rgba('#ffffff', h > 0 ? 0.045 : 0.022));
    grad.addColorStop(0.55, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,.055)');
    ctx.fillStyle = grad; pathFill(ctx, diamond);
    // tile cracks / grout
    if (tile === 'plaza' || tile === 'dungeonFloor') {
      ctx.strokeStyle = rgba('#272724', 0.22); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(left + 10, sy - TILE_H / 4); ctx.lineTo(sx + 6, sy + TILE_H / 4 - 3); ctx.moveTo(sx - 22, sy + 2); ctx.lineTo(sx + 28, sy + 12); ctx.stroke();
    }
    // texture
    ctx.save(); path(ctx, diamond); ctx.clip();
    const bladeColor = biome === 'snow' ? '#aec4cc' : biome === 'desert' ? '#a37d4e' : biome === 'volcanic' ? '#6f493a' : biome === 'graveyard' ? '#6b7464' : palette.leaf[2];
    if (tile === 'grass' || tile === 'marsh' || tile === 'moor') {
      for (let i = 0; i < 7; i++) {
        const bx = sx - 34 + rng() * 68;
        const by = sy - 16 + rng() * 32;
        ctx.strokeStyle = rgba(bladeColor, 0.35 + rng() * 0.25); ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + 1, by - 5, bx + (rng() - 0.5) * 5, by - 8); ctx.stroke();
      }
      if (rng() > 0.82) {
        const fx = sx - 26 + rng() * 52, fy = sy - 10 + rng() * 20;
        ctx.fillStyle = palette.flowers[Math.floor(rng() * palette.flowers.length)];
        for (let i = 0; i < 3; i++) ctx.fillRect(fx + i * 2.2, fy, 1.4, 1.4);
      }
    } else if (tile === 'sand' || tile === 'sandDark') {
      ctx.strokeStyle = rgbas('#8c6b42', 0.16); ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx - 26, sy - 7 + i * 8); ctx.quadraticCurveTo(sx - 5, sy - 13 + i * 8, sx + 24, sy - 5 + i * 8); ctx.stroke(); }
    } else if (tile === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,.34)';
      for (let i = 0; i < 5; i++) ctx.fillRect(sx - 34 + rng() * 68, sy - 18 + rng() * 36, 1.2, 1.2);
    } else if (tile === 'ash' || tile === 'ashDark' || tile === 'rock') {
      ctx.fillStyle = rgba('#272120', 0.26);
      for (let i = 0; i < 5; i++) ctx.fillRect(sx - 30 + rng() * 60, sy - 15 + rng() * 30, 1.8 + rng() * 2.5, 1 + rng());
      if (biome === 'volcanic' && rng() > 0.8) { ctx.strokeStyle = rgba('#ff6a36', 0.32); ctx.beginPath(); ctx.moveTo(sx - 14, sy); ctx.lineTo(sx + 3, sy - 9); ctx.lineTo(sx + 18, sy + 4); ctx.stroke(); }
    } else if (tile === 'dungeonFloor') {
      ctx.strokeStyle = rgba('#b69bff', 0.16); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx - 14, sy - 4); ctx.lineTo(sx + 6, sy - 12); ctx.stroke();
    }
    if (biome === 'astral' && rng() > 0.84) {
      ctx.fillStyle = rgba('#d8d1ff', 0.6); ctx.fillRect(sx - 20 + rng() * 40, sy - 12 + rng() * 24, 1.2, 1.2);
    }
    ctx.restore();
    // subtle edge line only on some tile types
    if (tile === 'path' || tile === 'plaza' || tile === 'dungeonFloor') {
      ctx.strokeStyle = rgba('#fff3d2', 0.055); ctx.lineWidth = 0.7; path(ctx, diamond); ctx.stroke();
    }
  }

  renderMinimap() {
    const c = document.createElement('canvas'); c.width = 240; c.height = 240;
    const ctx = c.getContext('2d');
    const cell = 240 / SIZE;
    const palette = this.region.palette;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const t = this.tiles[this.idx(x, y)];
        let color = palette.ground[1];
        if (t === 'path') color = palette.path[1];
        else if (t === 'plaza') color = '#958a71';
        else if (t === 'water') color = palette.water[1];
        else if (t === 'lava') color = '#d95527';
        else if (t === 'sand' || t === 'sandDark') color = '#c09a60';
        else if (t === 'snow') color = '#e3edf0';
        else if (t === 'marsh') color = '#4f6b53';
        else if (t === 'moor') color = '#5a5d60';
        else if (t === 'ash' || t === 'ashDark') color = '#503a36';
        else if (t === 'dungeonFloor') color = '#6b6470';
        else if (t === 'rock') color = '#7a7265';
        ctx.fillStyle = color; ctx.fillRect(x * cell, y * cell, cell + 0.4, cell + 0.4);
        if (this.height[this.idx(x, y)] > 0) { ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x * cell, y * cell, cell, cell); }
      }
    }
    // roads
    ctx.strokeStyle = 'rgba(237,211,157,.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.village.x * cell, this.village.y * cell); ctx.lineTo(this.dungeon.x * cell, this.dungeon.y * cell); ctx.stroke();
    this.minimap = c;
  }

  drawMinimap(ctx, player, enemies, t) {
    if (!this.minimap) return;
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.minimap, 0, 0, w, h);
    const sx = w / 240, sy = h / 240;
    const v = this.village, d = this.dungeon;
    // service icons
    for (const npc of this.npcs) {
      if (npc.kind !== 'service') continue;
      ctx.fillStyle = npc.service === 'questgiver' ? '#ffd36b' : '#9ad9ff';
      ctx.fillRect(npc.x * (w / SIZE) - 2, npc.y * (h / SIZE) - 2, 4, 4);
    }
    // dungeon
    ctx.fillStyle = '#ff8f6b'; ctx.beginPath(); ctx.arc(d.x * (w / SIZE), d.y * (h / SIZE), 3.5, 0, TAU); ctx.fill();
    // monsters
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.isBoss) continue;
      ctx.fillStyle = e.elite ? '#ffad55' : '#ff786b';
      ctx.fillRect(e.x * (w / SIZE) - 1, e.y * (h / SIZE) - 1, 2.4, 2.4);
    }
    // boss
    const boss = enemies.find((e) => e.isBoss && e.alive);
    if (boss) {
      ctx.fillStyle = '#ff5b7d'; ctx.beginPath(); ctx.arc(boss.x * (w / SIZE), boss.y * (h / SIZE), 3, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,130,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(boss.x * (w / SIZE), boss.y * (h / SIZE), 5 + Math.sin(t * 3), 0, TAU); ctx.stroke();
    }
    // player
    const px = player.x * (w / SIZE), py = player.y * (h / SIZE);
    ctx.save(); ctx.translate(px, py); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#fff5c4'; ctx.fillRect(-2.5, -2.5, 5, 5);
    ctx.strokeStyle = '#203047'; ctx.lineWidth = 1; ctx.strokeRect(-2.5, -2.5, 5, 5);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,245,196,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.stroke();
  }

  nearInteractable(x, y, radius = 1.45) {
    let best = null;
    for (const it of this.interactables) {
      const d = Math.hypot(it.x - x, it.y - y);
      if (d < radius) {
        if (!best || d < best.dist) best = { ...it, dist: d };
      }
    }
    // NPCs are at slightly different positions from service waypoint triggers.
    for (const npc of this.npcs) {
      if (npc.service === 'waystone') continue;
      const d = Math.hypot(npc.x - x, npc.y - y);
      if (d < radius + 0.1) {
        if (!best || d < best.dist) best = { kind: 'npc', npc, id: npc.id, x: npc.x, y: npc.y, dist: d };
      }
    }
    return best;
  }

  resolveMove(x, y, nx, ny, radius = 0.28) {
    // axis-separated collision resolution against props and water
    let outX = nx, outY = ny;
    if (this.isBlockedTile(outX, outY) || !this.inBounds(outX, outY)) {
      outX = x; outY = ny;
      if (this.isBlockedTile(outX, outY)) { outX = x; outY = y; }
    }
    for (const c of this.colliders) {
      const dx = outX - c.x, dy = outY - c.y;
      const rr = c.r + radius;
      if (dx * dx + dy * dy < rr * rr) {
        // try sliding on each axis
        const tryX = { x: outX, y };
        const tryY = { x, y: outY };
        const okX = !this.colliders.some((cc) => Math.hypot(tryX.x - cc.x, tryX.y - cc.y) < cc.r + radius) && !this.isBlockedTile(tryX.x, tryX.y);
        const okY = !this.colliders.some((cc) => Math.hypot(tryY.x - cc.x, tryY.y - cc.y) < cc.r + radius) && !this.isBlockedTile(tryY.x, tryY.y);
        if (okX && !okY) outX = tryX.x, outY = tryX.y;
        else if (okY && !okX) outX = tryY.x, outY = tryY.y;
        else if (okX && okY) outX = tryX.x, outY = tryY.y;
        else { outX = x; outY = y; }
        break;
      }
    }
    return { x: clamp(outX, 1.2, SIZE - 1.2), y: clamp(outY, 1.2, SIZE - 1.2) };
  }

  randomWalkableNear(x, y, radius = 5) {
    for (let i = 0; i < 30; i++) {
      const a = this.rng() * TAU;
      const r = this.rng() * radius;
      const px = clamp(x + Math.cos(a) * r, 2, SIZE - 2);
      const py = clamp(y + Math.sin(a) * r, 2, SIZE - 2);
      if (!this.isBlockedTile(px, py) && !this.colliders.some((c) => Math.hypot(px - c.x, py - c.y) < c.r + 0.5)) return { x: px, y: py };
    }
    return { x, y };
  }
}

function path(ctx, pts, close = true) {
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (close) ctx.closePath();
}
function pathFill(ctx, pts) { path(ctx, pts); ctx.fill(); }
function rgbas(hex, a) { return rgba(hex, a); }
function orb(ctx, x, y, r, color, alpha = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.45, rgba(color, alpha * 0.4));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
