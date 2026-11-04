// ============================================================
// AETHERIA — WORLD GENERATION & COLLISION
// Deterministic maps built from the region configuration.
// ============================================================

import { REGIONS, MONSTERS, NPCS, DUNGEONS } from './data.js';
import { makeRng, clamp, uid, dist } from './utils.js';

const PROP_DEFS = {
  oak: { block: 0.5, height: 3.4, kind: 'tree' },
  pine: { block: 0.45, height: 3.2, kind: 'pine' },
  pine_snow: { block: 0.5, height: 3.2, kind: 'pine_snow' },
  dead_tree: { block: 0.5, height: 2.8, kind: 'dead_tree' },
  bush: { block: 0, height: 0.8, kind: 'bush' },
  flowers: { block: 0, height: 0.4, kind: 'flowers' },
  stump: { block: 0.35, height: 0.7, kind: 'stump' },
  rock: { block: 0.5, height: 0.9, kind: 'rock' },
  boulder: { block: 0.85, height: 1.6, kind: 'boulder' },
  rock_snow: { block: 0.5, height: 0.9, kind: 'rock_snow' },
  ore: { block: 0.4, height: 1.0, kind: 'ore' },
  forge: { block: 1.0, height: 2.4, kind: 'forge' },
  mushroom: { block: 0.35, height: 1.6, kind: 'mushroom' },
  spiderweb: { block: 0, height: 1.0, kind: 'web' },
  gravestone: { block: 0.35, height: 1.0, kind: 'grave' },
  bone: { block: 0, height: 0.3, kind: 'bone' },
  crypt: { block: 1.3, height: 2.6, kind: 'crypt' },
  candle: { block: 0, height: 0.5, kind: 'candle' },
  ice: { block: 0.5, height: 1.2, kind: 'ice' },
  crystal: { block: 0.45, height: 2.0, kind: 'crystal' },
  snowman: { block: 0.35, height: 1.0, kind: 'snowman' },
  cactus: { block: 0.4, height: 1.8, kind: 'cactus' },
  dune: { block: 0, height: 0.3, kind: 'dune' },
  pillar: { block: 0.6, height: 2.6, kind: 'pillar' },
  bones: { block: 0, height: 0.3, kind: 'bones' },
  palm: { block: 0.45, height: 3.0, kind: 'palm' },
  obelisk: { block: 0.55, height: 3.0, kind: 'obelisk' },
  obsidian: { block: 0.6, height: 1.4, kind: 'obsidian' },
  lava_rock: { block: 0.5, height: 0.8, kind: 'lava_rock' },
  spike: { block: 0.4, height: 1.6, kind: 'spike' },
  brazier: { block: 0.3, height: 1.1, kind: 'brazier' },
  rubble: { block: 0, height: 0.4, kind: 'rubble' },
  void_crystal: { block: 0.5, height: 2.2, kind: 'void_crystal' },
  rune: { block: 0, height: 0.15, kind: 'rune' },
  star_well: { block: 1.0, height: 0.8, kind: 'star_well' },
  house: { block: 1.7, height: 3.4, kind: 'house' },
  tent: { block: 1.1, height: 2.0, kind: 'tent' },
  campfire: { block: 0.45, height: 0.8, kind: 'campfire' },
  banner: { block: 0.2, height: 2.4, kind: 'banner' },
  stall: { block: 1.1, height: 1.7, kind: 'stall' },
  crate: { block: 0.4, height: 0.9, kind: 'crate' },
  well: { block: 0.7, height: 1.3, kind: 'well' },
  altar: { block: 1.2, height: 1.0, kind: 'altar' },
  gate: { block: 1.0, height: 2.8, kind: 'gate' },
  signpost: { block: 0.2, height: 1.2, kind: 'signpost' }
};

function idx(size, x, y) { return y * size + x; }
function inBounds(world, x, y) { return x >= 0 && y >= 0 && x < world.size && y < world.size; }

function tileAt(world, x, y) {
  if (!inBounds(world, x, y)) return null;
  return world.tiles[idx(world.size, Math.floor(x), Math.floor(y))];
}

function setTile(world, x, y, type, variant) {
  if (!inBounds(world, x, y)) return;
  const t = world.tiles[idx(world.size, x, y)];
  if (!t) return;
  t.type = type;
  if (variant != null) t.variant = variant;
  if (type === 'water' || type === 'void') t.blocked = true;
}

function markDisc(world, cx, cy, radius, type, onlyIf = null) {
  const r = Math.ceil(radius);
  for (let y = Math.floor(cy) - r; y <= Math.ceil(cy) + r; y++) {
    for (let x = Math.floor(cx) - r; x <= Math.ceil(cx) + r; x++) {
      if (!inBounds(world, x, y)) continue;
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > radius) continue;
      const t = world.tiles[idx(world.size, x, y)];
      if (!t || t.type === 'water') continue;
      if (onlyIf && !onlyIf(t)) continue;
      setTile(world, x, y, type);
    }
  }
}

function markPath(world, x1, y1, x2, y2, width = 1.5) {
  const steps = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // slight winding for a hand-painted feel
    const wobble = Math.sin(t * Math.PI * 3) * 0.9;
    const x = x1 + (x2 - x1) * t + wobble * 0.35;
    const y = y1 + (y2 - y1) * t - wobble * 0.35;
    markDisc(world, x + 0.5, y + 0.5, width, 'path', tile => tile.type !== 'water');
  }
}

function propBlocked(world, x, y, radius = 0.18) {
  for (const p of world.blockingProps) {
    if (Math.abs(p.x - x) > 2 || Math.abs(p.y - y) > 2) continue;
    if (Math.hypot(p.x - x, p.y - y) < p.block + radius) return true;
  }
  return false;
}

function tryPlaceProp(world, rng, type, x, y, options = {}) {
  const def = PROP_DEFS[type] || PROP_DEFS.rock;
  if (!inBounds(world, Math.floor(x), Math.floor(y))) return null;
  if (world.tiles[idx(world.size, Math.floor(x), Math.floor(y))]?.type === 'water') return null;
  const p = {
    pid: uid('p'), type, kind: def.kind, x, y,
    block: options.nonBlocking ? 0 : def.block, height: def.height,
    variant: rng.int(0, 999), flip: rng.chance(0.5), scale: options.scale || (0.9 + rng.next() * 0.25),
    fixed: !!options.fixed, glow: options.glow || null
  };
  world.props.push(p);
  if (p.block > 0) world.blockingProps.push(p);
  return p;
}

function regionClears(world, x, y, rng, cfg) {
  if (tileAt(world, x, y)?.type === 'water') return false;
  if (Math.hypot(x - world.village[0], y - world.village[1]) < cfg.villageClear) return false;
  if (Math.hypot(x - world.spawn.x, y - world.spawn.y) < 2.2) return false;
  if (Math.hypot(x - world.lair[0], y - world.lair[1]) < 5.5) return false;
  for (const n of world.npcs) if (Math.hypot(x - n.x, y - n.y) < 1.6) return false;
  if (propBlocked(world, x, y, 1.0)) return false;
  return true;
}

function placeVillage(world, region, rng) {
  const [vx, vy] = world.village;
  // plaza
  markDisc(world, vx, vy, 6.4, 'plaza', tile => tile.type !== 'water');
  markDisc(world, vx, vy, 3.0, 'plaza_light', tile => tile.type !== 'water');

  const houses = [
    [-5.4, -4.4, 'house'], [5.2, -4.6, 'house'], [-5.8, 3.6, 'house'], [5.5, 3.8, 'house']
  ];
  for (const [dx, dy] of houses) {
    tryPlaceProp(world, rng, 'house', vx + dx, vy + dy, { fixed: true, scale: 1 });
  }
  tryPlaceProp(world, rng, 'well', vx - 0.2, vy + 1.2, { fixed: true });
  tryPlaceProp(world, rng, 'campfire', vx + 1.0, vy - 0.6, { fixed: true });
  for (const [dx, dy] of [[-2.5, 5.3], [2.6, 5.5], [-7.0, -0.4], [7.0, -0.2]]) {
    tryPlaceProp(world, rng, 'banner', vx + dx, vy + dy, { fixed: true, scale: 1 });
  }
  for (const [dx, dy] of [[3.9, -3.8], [-4.3, 4.6], [4.8, 5.1], [-5.5, -1.0]]) {
    tryPlaceProp(world, rng, 'crate', vx + dx, vy + dy, { fixed: true });
  }
  tryPlaceProp(world, rng, 'stall', vx + 4.5, vy - 2.6, { fixed: true });
  tryPlaceProp(world, rng, 'signpost', vx + 1.2, vy + 5.4, { fixed: true, scale: 1 });
}

function placeLair(world, region, rng) {
  const [lx, ly] = world.lair;
  tryPlaceProp(world, rng, 'altar', lx, ly, { fixed: true, scale: 1 });
  tryPlaceProp(world, rng, 'gate', lx - 3.4, ly + 1.4, { fixed: true, scale: 1 });
  tryPlaceProp(world, rng, 'brazier', lx + 2.8, ly + 1.8, { fixed: true });
  tryPlaceProp(world, rng, 'brazier', lx - 2.6, ly - 1.6, { fixed: true });
  const themeProps = {
    greendale: ['oak', 'stump'], ironcrag: ['ore', 'boulder'], venomwood: ['mushroom', 'web'],
    mistgrave: ['gravestone', 'candle'], frostpeak: ['crystal', 'ice'], sunscorch: ['pillar', 'bones'],
    ashen: ['obsidian', 'spike'], tower: ['void_crystal', 'rune']
  }[region.id] || ['rock'];
  for (let i = 0; i < 10; i++) {
    const a = rng.next() * Math.PI * 2;
    const r = 3.5 + rng.next() * 5;
    tryPlaceProp(world, rng, themeProps[i % themeProps.length], lx + Math.cos(a) * r, ly + Math.sin(a) * r);
  }
}

function makeNodes(world, region, rng) {
  const nodes = [];
  const count = 8;
  for (let i = 0; i < count; i++) {
    let x, y, tries = 0;
    do {
      x = 2 + rng.next() * (world.size - 4);
      y = 2 + rng.next() * (world.size - 4);
      tries++;
    } while (tries < 60 && (!regionClears(world, x, y, rng, { villageClear: 5 }) || Math.hypot(x - world.lair[0], y - world.lair[1]) < 4));
    nodes.push({
      nid: uid('node'), kind: 'node', x, y, materialId: region.material.id,
      name: region.material.name, icon: region.material.icon,
      respawnAt: 0, variant: rng.int(0, 999), scale: 0.9 + rng.next() * 0.3
    });
  }
  return nodes;
}

function makeHidden(world, region, rng) {
  const spots = [
    [3.2, world.size - 3.6], [world.size - 3.4, 3.2]
  ];
  return spots.map(([x, y], i) => ({
    hid: uid('hidden'), x, y, opened: false, kind: 'chest',
    loot: { gold: 1200 + region.levelRange[1] * 280, material: region.material.id, count: 2 + i },
    variant: rng.int(0, 999)
  }));
}

export function buildWorld(regionId, opts = {}) {
  const region = REGIONS[regionId] || REGIONS.greendale;
  const size = region.size;
  const rng = makeRng(`aetheria:${regionId}:${opts.dungeonId || 'open'}`);
  const dungeon = opts.dungeonId ? DUNGEONS.find(d => d.id === opts.dungeonId) : null;
  const world = {
    regionId, region, size, dungeon, mode: dungeon ? 'dungeon' : 'world',
    props: [], blockingProps: [], npcs: [], nodes: [], hidden: [], enemies: [],
    tiles: new Array(size * size),
    village: [...region.village], lair: [...region.lair],
    spawn: { x: region.spawn[0], y: region.spawn[1] },
    bossId: region.boss, time: 0
  };

  // ground tiles
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = x === 0 || y === 0 || x === size - 1 || y === size - 1;
      let type = region.ground;
      const n = rng.next();
      if (n > 0.93) type = 'ground2';
      else if (n > 0.83) type = 'ground3';
      if (edge && region.ground === 'void') type = 'void';
      world.tiles[idx(size, x, y)] = { x, y, type, variant: rng.int(0, 999), blocked: type === 'void' };
    }
  }

  // water features
  const pond = {
    greendale: [26, 7, 3.3], ironcrag: [7, 26, 2.6], venomwood: [27, 6, 3.6], mistgrave: [7, 27, 3.2],
    frostpeak: [27, 7, 3.4], sunscorch: [7, 28, 2.8], ashen: [28, 7, 3.1], tower: [7, 7, 2.6]
  }[regionId];
  if (pond) {
    const [px, py, r] = pond;
    for (let y = Math.floor(py - r - 1); y <= Math.ceil(py + r + 1); y++) {
      for (let x = Math.floor(px - r - 1); x <= Math.ceil(px + r + 1); x++) {
        if (!inBounds(world, x, y)) continue;
        if (Math.hypot(x + 0.5 - px, y + 0.5 - py) <= r) {
          setTile(world, x, y, region.ground === 'sand' ? 'water' : 'water');
        }
      }
    }
    // shore
    markDisc(world, px, py, r + 0.7, 'shore', null);
  }

  // paths
  const [vx, vy] = world.village;
  markPath(world, world.spawn.x, world.spawn.y, vx + 1.5, vy + 4.5, 1.3);
  markPath(world, vx, vy, world.lair[0] - 2, world.lair[1] - 2, 1.3);
  markPath(world, vx - 5, vy + 1, size - 4, 4, 0.85);
  markPath(world, 4, vy - 3, size - 4, size - 4, 0.85);

  // NPCs
  const localNpcs = Object.values(NPCS).filter(n => n.region === regionId);
  const npcList = [...localNpcs];
  if (regionId !== 'greendale') {
    const provision = {
      id: `provision_${regionId}`, name: 'Camp Provisioner', role: 'Potion Merchant', icon: '⚗',
      color: '#69c5a8', region: regionId, dx: 3.6, dy: 1.4, greeting: 'Potions, tonics and bandages. The frontier is expensive.'
    };
    const forge = {
      id: `forge_${regionId}`, name: 'Field Smith', role: 'Blacksmith', icon: '⚒',
      color: '#c17a4a', region: regionId, dx: -3.7, dy: 1.6, greeting: 'A field forge is still a forge. Bring me four of a kind.'
    };
    npcList.push(provision, forge);
  }
  for (const n of npcList) {
    world.npcs.push({
      ...n,
      x: clamp(vx + n.dx, 2, size - 3),
      y: clamp(vy + n.dy, 2, size - 3),
      facing: 1, anim: Math.random() * 10
    });
  }

  placeVillage(world, region, rng);
  placeLair(world, region, rng);

  // random scenery
  const propCount = Math.floor(size * 2.4);
  for (let i = 0; i < propCount * 3 && world.props.length < propCount; i++) {
    const type = rng.pick(region.props);
    const x = 1.4 + rng.next() * (size - 2.8);
    const y = 1.4 + rng.next() * (size - 2.8);
    if (!regionClears(world, x, y, rng, { villageClear: 7.2 })) continue;
    if (Math.hypot(x - world.lair[0], y - world.lair[1]) < 4.5) continue;
    tryPlaceProp(world, rng, type, x, y);
  }

  // extra roadside details
  for (let i = 0; i < 18; i++) {
    const type = rng.pick(['flowers', 'bush', 'stump', 'rubble', 'bone', 'signpost'].filter(t => region.props.includes(t) || Math.random() < 0.3));
    if (!type) continue;
    const x = 1.5 + rng.next() * (size - 3);
    const y = 1.5 + rng.next() * (size - 3);
    if (!regionClears(world, x, y, rng, { villageClear: 6.4 })) continue;
    tryPlaceProp(world, rng, type, x, y, { nonBlocking: true, scale: 0.8 + rng.next() * 0.4 });
  }

  world.nodes = makeNodes(world, region, rng);
  world.hidden = makeHidden(world, region, rng);

  if (dungeon) {
    // dungeon run: start at the lair threshold and face the boss
    world.spawn = { x: Math.max(2, world.lair[0] + 4.5), y: Math.max(2, world.lair[1] + 4.5) };
    world.dungeonStart = true;
  }

  // Scenery is placed procedurally and can overlap the configured spawn
  // (or the dungeon threshold). Nudge the spawn to the nearest walkable tile
  // so the player can never load inside a tree, house or pool of water.
  world.spawn = findSafeSpawn(world, world.spawn);
  return world;
}

function findSafeSpawn(world, origin) {
  if (!isBlocked(world, origin.x, origin.y, 0.26)) return { x: origin.x, y: origin.y };
  for (let radius = 0.5; radius <= 14; radius += 0.5) {
    const steps = Math.max(8, Math.ceil(radius * 8));
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = origin.x + Math.cos(a) * radius;
      const y = origin.y + Math.sin(a) * radius;
      if (x < 1.2 || y < 1.2 || x > world.size - 1.2 || y > world.size - 1.2) continue;
      if (!isBlocked(world, x, y, 0.26)) return { x, y };
    }
  }
  return { x: world.village[0], y: world.village[1] + 2 };
}

export function activeTileAt(world, x, y) {
  return tileAt(world, x, y);
}

export function isBlocked(world, x, y, radius = 0.22) {
  if (x < 1.1 || y < 1.1 || x > world.size - 1.1 || y > world.size - 1.1) return true;
  const tx = Math.floor(x), ty = Math.floor(y);
  const t = world.tiles[idx(world.size, clamp(tx, 0, world.size - 1), clamp(ty, 0, world.size - 1))];
  if (!t) return true;
  if (t.blocked || t.type === 'water' || t.type === 'void') return true;
  // check all tiles under the collision circle
  if (isTileBlocked(world, x + radius, y) || isTileBlocked(world, x - radius, y)
    || isTileBlocked(world, x, y + radius) || isTileBlocked(world, x, y - radius)) return true;
  return propBlocked(world, x, y, radius);
}

function isTileBlocked(world, x, y) {
  const t = tileAt(world, x, y);
  return !t || t.blocked || t.type === 'water' || t.type === 'void';
}

export function npcNear(world, x, y, radius = 2.3) {
  let best = null;
  let bestD = radius;
  for (const npc of world.npcs) {
    const d = Math.hypot(npc.x - x, npc.y - y);
    if (d < bestD) { bestD = d; best = npc; }
  }
  return best;
}

export function nodeNear(world, x, y, radius = 1.7) {
  let best = null, bestD = radius;
  for (const n of world.nodes) {
    if (n.respawnAt > Date.now()) continue;
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}

export function hiddenNear(world, x, y, radius = 1.7) {
  let best = null, bestD = radius;
  for (const h of world.hidden) {
    if (h.opened) continue;
    const d = Math.hypot(h.x - x, h.y - y);
    if (d < bestD) { bestD = d; best = h; }
  }
  return best;
}

function safeSpot(world, rng, minFromVillage = 6, avoidLair = 4) {
  for (let i = 0; i < 100; i++) {
    const x = 2.4 + rng.next() * (world.size - 4.8);
    const y = 2.4 + rng.next() * (world.size - 4.8);
    if (isBlocked(world, x, y, 0.35)) continue;
    if (Math.hypot(x - world.village[0], y - world.village[1]) < minFromVillage) continue;
    if (Math.hypot(x - world.lair[0], y - world.lair[1]) < avoidLair) continue;
    if (Math.hypot(x - world.spawn.x, y - world.spawn.y) < 3) continue;
    return { x, y };
  }
  return { x: world.size / 2 + 4, y: world.size / 2 + 4 };
}

export function createEnemy(world, typeId, x, y, opts = {}) {
  const def = MONSTERS[typeId];
  if (!def) return null;
  const elite = opts.elite ?? false;
  const scale = (opts.scale || 1) * (elite ? 1.55 : 1);
  return {
    eid: uid('mob'), type: typeId, def,
    x, y, homeX: x, homeY: y,
    hp: Math.round(def.hp * scale), maxHp: Math.round(def.hp * scale),
    level: opts.level || def.level,
    atk: def.atk * scale,
    xp: Math.round(def.xp * (elite ? 1.7 : 1)),
    gold: Math.round(def.gold * (elite ? 1.9 : 1)),
    elite, boss: def.boss, scale: (def.scale || 1) * (elite ? 1.18 : 1),
    alive: true, respawnAt: 0, respawnType: typeId, respawnElite: elite,
    target: null, attackCd: 0, hitFlash: 0, state: 'idle', wanderT: 0,
    wanderX: x, wanderY: y, facing: 1, anim: Math.random() * 10,
    aggroed: false, deadT: 0, chase: false
  };
}

export function populateEnemies(world, opts = {}) {
  const rng = makeRng(`mobs:${world.regionId}:${world.mode}:${Date.now()}`);
  const enemies = [];
  const dungeon = world.dungeon;
  if (dungeon) {
    for (let i = 0; i < 16; i++) {
      const type = rng.pick(dungeon.minions);
      const spot = safeSpot(world, rng, 2, 2.5);
      const e = createEnemy(world, type, spot.x, spot.y, { elite: rng.chance(0.18), level: dungeon.level });
      if (e) enemies.push(e);
    }
    const boss = createEnemy(world, dungeon.boss, world.lair[0] - 1.2, world.lair[1] - 1.2, { level: dungeon.level + 2, scale: 1.18 });
    if (boss) enemies.push(boss);
  } else {
    const normals = 15;
    for (let i = 0; i < normals; i++) {
      const type = rng.pick(world.region.monsters);
      const spot = safeSpot(world, rng);
      const elite = rng.chance(0.07);
      const e = createEnemy(world, type, spot.x, spot.y, { elite });
      if (e) enemies.push(e);
    }
    const boss = createEnemy(world, world.region.boss, world.lair[0] + 0.8, world.lair[1] + 0.8, { scale: 1 });
    if (boss) enemies.push(boss);
  }
  world.enemies = enemies;
  return enemies;
}

export function respawnPosition(world, enemy) {
  const rng = makeRng(enemy.eid + Date.now());
  for (let i = 0; i < 40; i++) {
    const x = clamp(enemy.homeX + (rng.next() - 0.5) * 7, 2, world.size - 2);
    const y = clamp(enemy.homeY + (rng.next() - 0.5) * 7, 2, world.size - 2);
    if (!isBlocked(world, x, y, 0.3)) return { x, y };
  }
  return { x: enemy.homeX, y: enemy.homeY };
}

export function getPropDef(type) { return PROP_DEFS[type] || PROP_DEFS.rock; }
export { idx as tileIndex };
