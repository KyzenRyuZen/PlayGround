import { getZone, CAMP, BOSS_POS, GATHER_NODES } from '../data/zones.js';
import { npcsInZone, RETURN_PORTALS } from '../data/npcs.js';
import { rngFrom, TAU, dist } from '../core/utils.js';
import { getPropSprite } from './sprites.js';

export const WORLD_SIZE = 2600;

function drawPath(ctx, pts, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [px, py] = pts[i - 1];
    ctx.quadraticCurveTo((px + x) / 2 + 12, (py + y) / 2 - 8, x, y);
  }
  ctx.stroke();
}

function makeTerrain(zone) {
  const S = 1400;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const rng = rngFrom('terrain', zone.id);
  const p = zone.palette;
  // base
  const g = ctx.createRadialGradient(S * 0.5, S * 0.48, 100, S * 0.5, S * 0.5, S * 0.8);
  g.addColorStop(0, p.base2); g.addColorStop(0.6, p.base); g.addColorStop(1, p.base3);
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  // large patches
  for (let i = 0; i < 90; i++) {
    const x = rng() * S, y = rng() * S, r = 30 + rng() * 140;
    const col = rng() > 0.5 ? p.base3 : p.base2;
    const rg = ctx.createRadialGradient(x, y, 2, x, y, r);
    rg.addColorStop(0, hexA(col, 0.22)); rg.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // main paths
  const path = p.path;
  const toBoss = [[S * 0.5, S * 0.84], [S * 0.56, S * 0.68], [S * 0.44, S * 0.55], [S * 0.58, S * 0.42], [S * 0.5, S * 0.26], [S * 0.5, S * 0.17]];
  drawPath(ctx, toBoss, 84, hexA(path, 0.55));
  drawPath(ctx, toBoss, 42, hexA(path, 0.5));
  const branch = [[S * 0.46, S * 0.55], [S * 0.28, S * 0.48], [S * 0.18, S * 0.34]];
  drawPath(ctx, branch, 48, hexA(path, 0.38));
  const branch2 = [[S * 0.55, S * 0.45], [S * 0.74, S * 0.37], [S * 0.83, S * 0.52]];
  drawPath(ctx, branch2, 48, hexA(path, 0.38));
  // water / lava pools
  const poolCount = zone.id === 'ashen' ? 7 : zone.id === 'venomwood' ? 8 : zone.id === 'sunscorch' ? 3 : 5;
  for (let i = 0; i < poolCount; i++) {
    const x = rng() * S, y = rng() * S, r = 40 + rng() * 90;
    if (dist(x, y, S * 0.5, S * 0.82) < 170) continue;
    const isLava = zone.id === 'ashen';
    const col = isLava ? '#ff7a3c' : zone.id === 'sunscorch' ? '#3f6b5e' : p.water;
    const rg = ctx.createRadialGradient(x, y, 3, x, y, r);
    rg.addColorStop(0, hexA(isLava ? '#ffe09a' : lighten(col, 0.2), isLava ? 0.6 : 0.45));
    rg.addColorStop(0.7, hexA(col, isLava ? 0.45 : 0.32));
    rg.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, rng() * TAU, 0, TAU); ctx.fill();
    ctx.strokeStyle = hexA(isLava ? '#ffb36e' : lighten(col, 0.25), 0.18); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.9, r * 0.52, 0, 0, TAU); ctx.stroke();
  }
  // ground details
  const detailCount = 3200;
  for (let i = 0; i < detailCount; i++) {
    const x = rng() * S, y = rng() * S;
    const t = rng();
    if (t < 0.45) {
      // grass / rubble strokes
      ctx.strokeStyle = hexA(lighten(p.accent, rng() * 0.2), 0.12 + rng() * 0.22);
      ctx.lineWidth = 0.7 + rng() * 1.2;
      ctx.beginPath(); ctx.moveTo(x, y);
      const a = -Math.PI / 2 + (rng() - 0.5) * 1.2;
      ctx.lineTo(x + Math.cos(a) * (3 + rng() * 8), y + Math.sin(a) * (3 + rng() * 8)); ctx.stroke();
    } else if (t < 0.7) {
      ctx.fillStyle = hexA(rng() > 0.5 ? p.prop2 : p.base3, 0.14 + rng() * 0.2);
      ctx.beginPath(); ctx.arc(x, y, 1 + rng() * 3, 0, TAU); ctx.fill();
    } else if (t < 0.82) {
      ctx.fillStyle = hexA(p.light, 0.06 + rng() * 0.12);
      ctx.beginPath(); ctx.arc(x, y, 0.8 + rng() * 1.8, 0, TAU); ctx.fill();
    }
  }
  // thematic marks
  if (zone.id === 'sunscorch') {
    ctx.strokeStyle = hexA('#f0d090', 0.08); ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const x = rng() * S, y = rng() * S;
      ctx.beginPath(); ctx.arc(x, y, 20 + rng() * 40, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }
  }
  if (zone.id === 'frostpeak') {
    for (let i = 0; i < 1200; i++) {
      const x = rng() * S, y = rng() * S;
      ctx.fillStyle = `rgba(230,248,255,${0.05 + rng() * 0.15})`;
      ctx.beginPath(); ctx.arc(x, y, 0.8 + rng() * 2.6, 0, TAU); ctx.fill();
    }
  }
  if (zone.id === 'mistgrave' || zone.id === 'venomwood') {
    for (let i = 0; i < 60; i++) {
      const x = rng() * S, y = rng() * S, r = 40 + rng() * 100;
      const rg = ctx.createRadialGradient(x, y, 1, x, y, r);
      rg.addColorStop(0, hexA('#b8c8c0', 0.05)); rg.addColorStop(1, hexA('#b8c8c0', 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }
  if (zone.id === 'ashen') {
    ctx.strokeStyle = hexA('#ff7a3c', 0.24); ctx.lineWidth = 1.4;
    for (let i = 0; i < 60; i++) {
      let x = rng() * S, y = rng() * S;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 4; j++) { x += (rng() - 0.5) * 26; y += rng() * 18; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  if (zone.id === 'tower') {
    ctx.fillStyle = hexA('#d8c8ff', 0.35);
    for (let i = 0; i < 500; i++) { ctx.beginPath(); ctx.arc(rng() * S, rng() * S, rng() * 1.2, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = hexA('#b9a2ff', 0.12); ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(S / 2, S / 2, 120 + i * 40, 0, TAU); ctx.stroke(); }
  }
  // boss arena
  const bx = S * BOSS_POS.x, by = S * BOSS_POS.y;
  ctx.save(); ctx.translate(bx, by); ctx.scale(1, 0.65);
  const ag = ctx.createRadialGradient(0, 0, 30, 0, 0, 180);
  ag.addColorStop(0, hexA(zone.palette.light, 0.12)); ag.addColorStop(0.6, hexA(zone.palette.accent, 0.05)); ag.addColorStop(1, hexA(zone.palette.accent, 0));
  ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, 0, 180, 0, TAU); ctx.fill();
  ctx.strokeStyle = hexA(zone.palette.light, 0.28); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 130, 0, TAU); ctx.stroke();
  ctx.setLineDash([4, 10]); ctx.beginPath(); ctx.arc(0, 0, 158, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU; ctx.fillStyle = hexA(zone.palette.light, 0.4);
    ctx.beginPath(); ctx.arc(Math.cos(a) * 145, Math.sin(a) * 145, 2.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
  // camp clearing
  const cx = S * CAMP.x, cy = S * CAMP.y;
  const cg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 170);
  cg.addColorStop(0, hexA(p.path, 0.85)); cg.addColorStop(1, hexA(p.path, 0));
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 170, 0, TAU); ctx.fill();
  ctx.strokeStyle = hexA(zone.palette.light, 0.25); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, 118, 0, TAU); ctx.stroke();
  return c;
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function lighten(hex, t) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`;
}

const zoneCache = new Map();

export function generateZone(zoneId) {
  if (zoneCache.has(zoneId)) return zoneCache.get(zoneId);
  const zone = getZone(zoneId);
  const terrain = makeTerrain(zone);
  const rng = rngFrom('world', zone.id);
  const camp = { x: WORLD_SIZE * CAMP.x, y: WORLD_SIZE * CAMP.y };
  const bossPos = { x: WORLD_SIZE * BOSS_POS.x, y: WORLD_SIZE * BOSS_POS.y };

  // Props
  const props = [];
  const solidTypes = new Set(['tree', 'pine', 'pineSnow', 'rock', 'ruin', 'deadTree', 'obelisk', 'statue', 'ice', 'crystal', 'anvil']);
  const propTypes = zone.props;
  const target = 96;
  let attempts = 0;
  while (props.length < target && attempts < 900) {
    attempts++;
    const x = 120 + rng() * (WORLD_SIZE - 240);
    const y = 130 + rng() * (WORLD_SIZE - 260);
    if (dist(x, y, camp.x, camp.y) < 210) continue;
    if (dist(x, y, bossPos.x, bossPos.y) < 175) continue;
    if (props.some((p) => dist(x, y, p.x, p.y) < 58)) continue;
    const type = propTypes[Math.floor(rng() * propTypes.length)];
    const variant = Math.floor(rng() * 4);
    const scale = 0.72 + rng() * 0.7;
    props.push({
      type, x, y, scale, variant, sprite: getPropSprite(type, zone.palette, variant),
      solid: solidTypes.has(type), r: type === 'tree' ? 26 * scale : type === 'rock' ? 32 * scale : type === 'ruin' ? 26 * scale : 18 * scale,
    });
  }
  props.sort((a, b) => a.y - b.y);

  // Camp decorations
  const decorations = [];
  if (zone.camp) {
    decorations.push({ type: 'campfire', x: camp.x, y: camp.y + 34, scale: 1 });
    decorations.push({ type: 'tent', x: camp.x - 150, y: camp.y - 26, scale: 1 });
    decorations.push({ type: 'tent', x: camp.x + 150, y: camp.y - 8, scale: 0.92 });
    decorations.push({ type: 'banner', x: camp.x - 70, y: camp.y - 66, scale: 0.8, color: zone.palette.accent });
    decorations.push({ type: 'banner', x: camp.x + 74, y: camp.y - 58, scale: 0.8, color: zone.palette.accent });
    decorations.push({ type: 'crate', x: camp.x + 102, y: camp.y + 56, scale: 0.8 });
    decorations.push({ type: 'crate', x: camp.x - 118, y: camp.y + 60, scale: 0.7 });
  } else {
    decorations.push({ type: 'campfire', x: camp.x, y: camp.y + 34, scale: 0.7, spectral: true });
  }

  // NPCs
  const npcs = npcsInZone(zone.id).map((n, i) => ({
    ...n, x: WORLD_SIZE * n.pos.x, y: WORLD_SIZE * n.pos.y, index: i,
    spriteKey: `npc_${n.id}`,
  }));

  // Portal
  const portalDef = RETURN_PORTALS[zone.id] ?? RETURN_PORTALS.greendale;
  const portal = { x: WORLD_SIZE * portalDef.x, y: WORLD_SIZE * portalDef.y, label: portalDef.label, target: portalDef.target };

  // Gather nodes
  const nodes = [];
  const nodeTypes = [...zone.gather, ...zone.gather, ...zone.gather, 'crystal'];
  for (let i = 0; i < 18; i++) {
    const x = 180 + rng() * (WORLD_SIZE - 360);
    const y = 200 + rng() * (WORLD_SIZE - 420);
    if (dist(x, y, camp.x, camp.y) < 150) continue;
    const type = nodeTypes[Math.floor(rng() * nodeTypes.length)];
    nodes.push({ id: `node_${zone.id}_${i}`, type, x, y, ready: true, respawnAt: 0, phase: rng() * TAU, def: GATHER_NODES[type] });
  }

  // Monster spawn points
  const spawns = [];
  const addSpawns = (mon, count, minDist = 260) => {
    for (let i = 0; i < count; i++) {
      let x, y, tries = 0;
      do {
        x = 170 + rng() * (WORLD_SIZE - 340);
        y = 190 + rng() * (WORLD_SIZE - 420);
        tries++;
      } while (tries < 40 && (dist(x, y, camp.x, camp.y) < minDist || dist(x, y, bossPos.x, bossPos.y) < 170 || props.some((p) => p.solid && dist(x, y, p.x, p.y) < 40)));
      spawns.push({ ...mon, x, y, elite: false });
    }
  };
  for (const mon of zone.monsters) addSpawns(mon, mon.count, 230);
  addSpawns({ ...zone.elite, id: zone.elite.id, name: zone.elite.name, count: 1, xp: 1, gold: 1 }, 3, 300);
  const bossSpawn = { ...zone.boss, x: bossPos.x, y: bossPos.y + 40, elite: false, boss: true };
  spawns.push(bossSpawn);

  const data = { zone, terrain, props, decorations, npcs, portal, nodes, spawns, camp, bossPos };
  zoneCache.set(zoneId, data);
  return data;
}

export function resolveCollision(x, y, props, radius = 13) {
  let nx = x, ny = y;
  for (const p of props) {
    if (!p.solid) continue;
    const dx = nx - p.x, dy = ny - p.y;
    const rr = p.r + radius;
    const d2 = dx * dx + dy * dy;
    if (d2 < rr * rr && d2 > 0.001) {
      const d = Math.sqrt(d2);
      const push = (rr - d);
      nx += (dx / d) * push;
      ny += (dy / d) * push;
    }
  }
  return { x: nx, y: ny };
}

export function randomPoint(zoneId, rng = Math.random, avoid = []) {
  return { x: 200 + rng() * (WORLD_SIZE - 400), y: 200 + rng() * (WORLD_SIZE - 400) };
}

export function resetZoneCache() { zoneCache.clear(); }
