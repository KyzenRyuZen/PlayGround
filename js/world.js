/* ============================================================
   AETHERIA — WORLD: deterministic procedural isometric maps.
   Each region is generated once and pre-rendered to an offscreen
   canvas (LRU-cached to stay mobile-friendly). Provides collision,
   portals, spawn points, towns, boss arenas and minimaps.
   ============================================================ */
window.World = (function () {
  'use strict';
  const D = window.DATA;
  const TW = 64, TH = 32;      // iso tile diamond size
  const cache = new Map();     // regionId -> built world
  const KEY = {};              // id -> {x,y,tile}
  let idSeq = 1;
  const builtLRU = [];

  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const seedOf = str => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; };

  /* ---------- tile space helpers ---------- */
  function tileToIsoKey(x, y) { return KEY[(x | 0) + ',' + (y | 0)] || (KEY[(x | 0) + ',' + (y | 0)] = { px: (x - y) * TW / 2, py: (x + y) * TH / 2 }); }
  // continuous iso screen position for entity at tile coords
  function isoPos(x, y) { return { x: (x - y) * TW / 2, y: (x + y) * TH / 2 }; }

  /* ---------- build a region ---------- */
  const clamp2 = (v, a, b) => Math.max(a, Math.min(b, v));

  function build(regionId) {
    if (cache.has(regionId)) return cache.get(regionId);
    const R = D.regionById(regionId);
    const rng = mulberry(seedOf('aetheria_' + regionId));
    const w = R.id === 'tower' ? 26 : R.size, h = R.size + (R.tall ? 14 : 0);
    const N = w * h;
    const walk = new Uint8Array(N).fill(1); // 1 walkable, 0 blocked
    const terr = new Uint8Array(N);         // terrain variant index
    const idx = (x, y) => y * w + x;
    const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;

    // terrain variation
    for (let i = 0; i < N; i++) terr[i] = Math.floor(rng() * 3);
    // water ponds / lava pools
    const pools = 3 + Math.floor(rng() * 3);
    for (let p = 0; p < pools; p++) {
      const cx = 6 + Math.floor(rng() * (w - 12)), cy = 6 + Math.floor(rng() * (h - 12));
      const r = 2 + rng() * 2;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const x = Math.round(cx + dx), y = Math.round(cy + dy);
        if (inb(x, y) && dx * dx + dy * dy <= r * r) { walk[idx(x, y)] = 0; }
      }
    }
    // border rocks wall
    for (let x = 0; x < w; x++) { walk[idx(x, 0)] = 0; walk[idx(x, h - 1)] = 0; }
    for (let y = 0; y < h; y++) { walk[idx(0, y)] = 0; walk[idx(w - 1, y)] = 0; }

    // roads (across the middle)
    const roadY = Math.floor(h / 2);
    const roadX = Math.floor(w / 2);
    for (let x = 1; x < w - 1; x++) { walk[idx(x, roadY)] = 1; walk[idx(x, roadY + 1)] = 1; }
    for (let y = 1; y < h - 1; y++) walk[idx(Math.floor(w * .45), y)] = 1;

    let town = null;
    const npcs = [], props = [], spawns = [], portals = [];
    let arena = null, arenaGates = [];

    /* village build-out */
    const townDef = R.village ? D.TOWNS[R.village] : null;
    if (townDef) {
      const { x: tx, y: ty } = townDef.pos;
      town = { x: tx, y: ty, name: R.village };
      // flatten + plaza
      for (let dy = -4; dy <= 4; dy++) for (let dx = -5; dx <= 4; dx++) {
        if (inb(tx + dx, ty + dy)) walk[idx(tx + dx, ty + dy)] = 1;
      }
      // buildings around plaza (props are solid, 2x2 footprints approximated by solid tiles)
      const blds = [
        ['tavern', -3, -3], ['forge', 3, -3], ['house', -4, 2], ['house', 2, 2],
        ['bighouse', 4, -1], ['stall', -2, -1]
      ];
      const roofTones = ['#a83a3a', '#4a5f9f', '#6a4a7f', '#3f7d5a', '#c47a2a', '#a83a3a'];
      blds.forEach(([k, dx, dy], i) => {
        props.push({ kind: k, tone: roofTones[i % roofTones.length], x: tx + dx, y: ty + dy, solid: true });
      });
      props.push({ kind: 'well', tone: '', x: tx + 1, y: ty, solid: true });
      props.push({ kind: 'gate', tone: '', x: tx - 2, y: ty - 4, solid: true });

      // NPC ring
      const npcDefs = R.village === 'Dawnshire'
        ? [['rowan', 0, 4], ['bram', 3, -1], ['tilda', -2, 0], ['miri', -4, 2], ['orin', 2, 0], ['silas', -3, -2], ['aurora', 3, 3], ['faction', -1, 5]]
        : [['captain', 0, 3], ['bram', 2, -1], ['tilda', -2, 0], ['miri', -4, 1], ['orin', 2, 0], ['silas', -3, -2], ['aurora', 3, 2]];
      npcDefs.forEach(([id, dx, dy]) => npcs.push({ id, name: D.NPCS[id] ? D.NPCS[id].name : id, x: tx + dx, y: ty + dy, keyId: id }));
    } else {
      // wilderness campfire landmark
      props.push({ kind: 'lamp', tone: '', x: Math.floor(w * .45), y: roadY - 3, solid: true });
    }

    /* boss arena — far side of the road */
    {
      const ax = R.tall ? Math.floor(w / 2) + 4 : w - 8, ay = R.tall ? 8 : roadY + 2;
      arena = { x: ax, y: ay, r: 6 };
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const x = ax + dx, y = ay + dy;
        if (inb(x, y) && dx * dx + dy * dy <= 40) walk[idx(x, y)] = 1;
      }
      props.push({ kind: 'portal', tone: '', x: ax, y: ay, solid: false, marker: 'boss' });
      props.push({ kind: 'gate', tone: '', x: ax - 7, y: ay - 2, solid: true });
      props.push({ kind: 'banner', tone: R.boss.tone, x: ax - 7, y: ay + 3, solid: true });
    }

    // tower of Eternity: sealed gates between floors (ascending = decreasing y)
    if (R.id === 'tower') {
      arenaGates = [
        { y: Math.floor(h * .48), need: R.miniBosses[0].name, floor: 0 },
        { y: Math.floor(h * .27), need: R.miniBosses[1].name, floor: 1 }
      ];
      R.miniBosses.forEach((mb, i) => {
        const my = Math.floor(h * (.38 + i * .18));
        props.push({ kind: 'portal', tone: mb.tone, x: Math.floor(w / 2), y: my, solid: false, marker: 'mini', mb: i });
      });
      // clear a path up the center
      for (let y = 2; y < h - 2; y++) { walk[idx(Math.floor(w / 2), y)] = 1; walk[idx(Math.floor(w / 2) + 1, y)] = 1; }
    }

    /* gates to neighbor regions */
    const nb = R.gates || {};
    const gateOrder = ['w', 'e', 'n', 's'];
    gateOrder.forEach(dir => {
      const to = nb[dir]; if (!to) return;
      let gx, gy;
      if (dir === 'w') { gx = 1; gy = roadY; }
      if (dir === 'e') { gx = w - 2; gy = roadY; }
      if (dir === 'n') { gx = roadX; gy = 1; }
      if (dir === 's') { gx = roadX; gy = h - 2; }
      walk[idx(gx, gy)] = 1;
      // opposite edge position in the destination region
      const opp = { w: 'e', e: 'w', n: 's', s: 'n' }[dir];
      const dest = D.regionById(to);
      const dw = dest.id === 'tower' ? 26 : dest.size, dh = dest.size + (dest.tall ? 14 : 0);
      const drY = Math.floor(dh / 2), drX = Math.floor(dw / 2);
      const entry = { w: { x: dw - 2, y: drY }, e: { x: 1, y: drY }, n: { x: drX, y: dh - 2 }, s: { x: drX, y: 1 } }[opp];
      portals.push({ x: gx, y: gy, to, entry, label: dest.name });
      props.push({ kind: 'portal', tone: '', x: gx, y: gy, solid: false, marker: 'gate', gateTo: to });
    });

    /* deco props */
    const decoPal = { grass: '#2f6a34', mountain: '#5a4a3a', swamp: '#25502e', grave: '#464c59', snow: '#3a6a4a', desert: '#7a6a3a', lava: '#6b2a33', void: '#5b4a8f' };
    const waterPal = { grass: undefined, mountain: undefined, swamp: undefined, grave: undefined, snow: undefined, desert: undefined, lava: '#5c1f14', void: undefined };
    for (let i = 0; i < N * 0.055; i++) {
      const x = 2 + Math.floor(rng() * (w - 4)), y = 2 + Math.floor(rng() * (h - 4));
      if (!walk[idx(x, y)]) continue;
      if (town && Math.abs(x - town.x) < 7 && Math.abs(y - town.y) < 6) continue;
      if (Math.abs(x - roadX) < 2 && Math.abs(y - roadY) < 3) continue;
      if (arena && Math.abs(x - arena.x) < 8 && Math.abs(y - arena.y) < 8) continue;
      const kind = R.deco[Math.floor(rng() * R.deco.length)];
      props.push({ kind, tone: decoPal[R.biome] || t2, x, y, solid: kind !== 'flower' });
    }

    /* monster spawn zones: clumps away from town/arena */
    const distToTown = (x, y) => town ? Math.max(Math.abs(x - town.x), Math.abs(y - town.y)) : 999;
    const zones = [];
    const zc = R.monsters.length + 1;
    for (let i = 0; i < zc; i++) {
      let zx = 5 + Math.floor(rng() * (w - 14)), zy = 5 + Math.floor(rng() * (h - 10));
      if (distToTown(zx, zy) < 13) { zx = (town.x + w / 2) % (w - 12) + 6; zy = roadY + (i + 1) * 5; zx = clamp2(zx, 4, w - 5); zy = clamp2(zy, 4, h - 5); }
      zones.push({ x: zx, y: zy });
    }
    R.monsters.forEach(m => {
      const def = D.MONSTER_KINDS[m.kind];
      const count = (m.count || 14) + Math.floor(rng() * 4);
      for (let i = 0; i < count; i++) {
        const z = zones[Math.floor(rng() * zones.length)];
        for (let tries = 0; tries < 24; tries++) {
          const x = z.x + Math.floor(rng() * 9) - 4, y = z.y + Math.floor(rng() * 9) - 4;
          if (inb(x, y) && walk[idx(x, y)] && distToTown(x, y) > 9) {
            spawns.push({ type: 'mob', cfg: m, x, y }); break;
          }
        }
      }
    });
    // one elite per region + boss handled in game
    if (R.monsters.length) spawns.push({ type: 'elite', cfg: R.monsters[0], x: zones[0].x, y: zones[0].y });
    // gathering nodes
    for (let i = 0; i < 9; i++) {
      for (let tries = 0; tries < 30; tries++) {
        const x = 4 + Math.floor(rng() * (w - 8)), y = 4 + Math.floor(rng() * (h - 8));
        if (walk[idx(x, y)] && !(town && Math.abs(x - town.x) < 7 && Math.abs(y - town.y) < 6)) {
          spawns.push({ type: 'gather', x, y, respawnAt: 0 }); break;
        }
      }
    }
    const wd = { id: regionId, def: R, w, h, walk, terr, props, npcs, portals, spawns, town, arena, arenaGates, built: false };

    cache.set(regionId, wd);
    pushLRU(regionId);
    return wd;
  }
  const t2 = '#2f6a34';

  function pushLRU(regionId) {
    const i = builtLRU.indexOf(regionId);
    if (i >= 0) builtLRU.splice(i, 1);
    builtLRU.push(regionId);
    while (builtLRU.length > 3) {
      const ev = builtLRU.shift();
      const wd = cache.get(ev);
      if (wd && wd.prerender) { wd.prerender.width = 1; wd.prerender.height = 1; wd.prerender = null; wd.built = false; }
      cache.delete(ev);
    }
  }

  function ensurePrerender(wd) {
    if (wd.built && wd.prerender) return wd.prerender;
    const { w, h, walk, terr } = wd;
    const R = wd.def;
    const X0 = Math.ceil(h * TW / 2);           // horizontal shift for negative iso X
    const pad = 96;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(X0 + w * TW / 2 + pad * 2);
    cv.height = Math.ceil((w + h) * TH / 2 + pad * 2 + 80);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const rng = mulberry(seedOf('render_' + R.id));
    const pal = R.palette;
    wd.px0 = X0; wd.py0 = pad;
    wd.pregScale = 1;

    const diamond = (gx, gy, fill, edge) => {
      const cx = (gx - gy) * TW / 2 + X0;
      const cy = (gx + gy) * TH / 2 + pad;
      if (fill) {
        g.beginPath();
        g.moveTo(cx, cy - TH / 2); g.lineTo(cx + TW / 2, cy);
        g.lineTo(cx, cy + TH / 2); g.lineTo(cx - TW / 2, cy);
        g.closePath();
        g.fillStyle = fill; g.fill();
        if (edge) { g.strokeStyle = edge; g.lineWidth = 1; g.stroke(); }
      }
      return { cx, cy };
    };

    /* background */
    g.fillStyle = '#07090f';
    g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = shadeHex(pal.ground[0], .8);
    g.fillRect(pad, 0, cv.width - pad * 2, cv.height);

    /* ground tiles */
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let fill;
        if (!walk[i]) fill = pal.water;
        else fill = pal.ground[terr[i] % pal.ground.length];
        const isRoad = walk[i] && pal.path &&
          ((Math.abs(y - Math.floor(h / 2)) < 2) || Math.abs(x - Math.floor(w * .45)) < 1);
        if (isRoad) fill = pal.path;
        const { cx, cy } = diamond(x, y, fill, !walk[i] ? '#ffffff22' : null);
        if (walk[i]) {
          const n = 2 + Math.floor(rng() * 3);
          for (let s = 0; s < n; s++) {
            const sx = cx + (rng() * TW - TW / 2) * .68, sy = cy + (rng() * TH - TH / 2) * .68;
            g.fillStyle = rng() < .5 ? pal.accent[0] : shadeHex(fill, 1.1);
            g.fillRect(sx, sy, 2, 2);
          }
        }
      }
    }

    /* water/lava glow rings */
    if (pal.water) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!walk[i]) {
          const cx = (x - y) * TW / 2 + X0, cy = (x + y) * TH / 2 + pad;
          g.fillStyle = R.biome === 'lava' ? '#ff8f3f30' : '#bfe03f20';
          g.beginPath(); g.ellipse(cx, cy, TW / 2.4, TH / 2.4, 0, 0, 7); g.fill();
        }
      }
    }

    /* boss arena ring */
    if (wd.arena) {
      const a = wd.arena;
      const cx = (a.x - a.y) * TW / 2 + X0, cy = (a.x + a.y) * TH / 2 + pad;
      g.strokeStyle = R.boss.tone; g.lineWidth = 3; g.setLineDash([10, 8]);
      g.beginPath(); g.ellipse(cx, cy, a.r * TW / 2.55, a.r * TH / 2.55, 0, 0, 7); g.stroke();
      g.setLineDash([]);
    }

    /* town name sign */
    if (wd.town) {
      const cx = (wd.town.x - wd.town.y) * TW / 2 + X0, cy = (wd.town.x + wd.town.y) * TH / 2 + pad - 110;
      g.font = '900 22px Trebuchet MS'; g.textAlign = 'center';
      g.fillStyle = '#000a'; g.fillText(R.village, cx + 2, cy + 2);
      g.fillStyle = '#ffd77a'; g.fillText(R.village, cx, cy);
    }

    /* props sorted by depth */
    const sorted = wd.props.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const p of sorted) {
      const spr = SPR.prop(p.kind, p.tone);
      const cx = (p.x - p.y) * TW / 2 + X0;
      const cy = (p.x + p.y) * TH / 2 + pad;
      g.drawImage(spr, cx - spr.width / 2, cy - spr.height + 16);
    }
    wd.prerender = cv; wd.built = true;
    return cv;
  }

  function shadeHex(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) * f | 0), gg = Math.min(255, ((n >> 8) & 255) * f | 0), b = Math.min(255, (n & 255) * f | 0);
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
  }

  /* ---------- minimap ---------- */
  function minimap(wd) {
    const cv = document.createElement('canvas');
    cv.width = 124; cv.height = 124;
    const g = cv.getContext('2d');
    const R = wd.def;
    // map bounds in iso space
    const corners = [[0, 0], [wd.w, 0], [0, wd.h], [wd.w, wd.h]].map(([x, y]) => isoPos(x, y));
    const minX = Math.min(...corners.map(c => c.x)), maxX = Math.max(...corners.map(c => c.x));
    const minY = Math.min(...corners.map(c => c.y)), maxY = Math.max(...corners.map(c => c.y));
    const pad = 6;
    const sc = Math.min((cv.width - pad * 2) / (maxX - minX), (cv.height - pad * 2) / (maxY - minY));
    const tx = p => pad + (p.x - minX) * sc, ty = p => pad + (p.y - minY) * sc;
    g.fillStyle = '#0b0e19'; g.fillRect(0, 0, cv.width, cv.height);
    const step = 2;
    for (let y = 1; y < wd.h - 1; y += step) for (let x = 1; x < wd.w - 1; x += step) {
      if (wd.walk[y * wd.w + x]) {
        const p = isoPos(x + .5, y + .5);
        g.fillStyle = R.palette.ground[0];
        g.fillRect(tx(p) - 1, ty(p) - 1, 2.4 / (step * .5), 2.4 / (step * .5));
      }
    }
    /* npc decor dots */
    if (wd.town) {
      const p = isoPos(wd.town.x, wd.town.y);
      g.fillStyle = '#ffd77a'; g.beginPath(); g.arc(tx(p), ty(p), 4, 0, 7); g.fill();
      g.fillStyle = '#101828'; g.font = '7px sans-serif'; g.textAlign = 'center';
      g.fillText(R.village, tx(p), ty(p) + 10);
    }
    for (const po of wd.portals) {
      const p = isoPos(po.x, po.y);
      g.fillStyle = '#b58fff'; g.beginPath(); g.arc(tx(p), ty(p), 3, 0, 7); g.fill();
    }
    if (wd.arena) {
      const p = isoPos(wd.arena.x, wd.arena.y);
      g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(tx(p), ty(p), 4, 0, 7); g.fill();
      g.fillStyle = '#101828'; g.font = '7px sans-serif'; g.textAlign = 'center';
      g.fillText('BOSS', tx(p), ty(p) - 6);
    }
    return { cv, tx, ty, iso: p => (p.x - p.y) * TW / 2 };
  }

  function walkable(wd, x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= wd.w || y >= wd.h) return false;
    return wd.walk[y * wd.w + x] === 1;
  }

  return { build, ensurePrerender, walkable, minimap, isoPos, TW, TH };
})();
