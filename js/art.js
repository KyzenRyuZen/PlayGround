// Procedural 2.5D pixel-inspired art. No external assets; everything is generated
// locally so the game remains deterministic and fully offline.

export const TAU = Math.PI * 2;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const lerp = (a, b, t) => a + (b - a) * t;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function shade(hex, amount) {
  const c = hex.replace('#', '');
  const num = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
  let r = (num >> 16) + amount, g = ((num >> 8) & 255) + amount, b = (num & 255) + amount;
  r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export function rgba(hex, alpha = 1) {
  const c = hex.replace('#', '');
  const num = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
  return `rgba(${num >> 16},${(num >> 8) & 255},${num & 255},${alpha})`;
}

function path(ctx, pts, close = true) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  if (close) ctx.closePath();
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function orb(ctx, x, y, r, color, alpha = 0.8) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.3, rgba(color, alpha * 0.55));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}

const SKIN_SHADE = { light: -24, mid: -42, dark: -58 };

export function heroPalette(appearance) {
  const base = {
    skin: appearance.skinTone || '#f1d2b6',
    hair: appearance.hairColor || '#2a1b16',
    eye: appearance.eyeColor || '#8dd7ff',
    primary: '#c08a36', secondary: '#e8dfc8', accent: '#ffd36b', cape: '#661c25',
    metal: '#cfb378', cloth: '#7a2029', dark: '#34221a',
  };
  return Object.assign(base, appearance.classColors || {}, appearance.costumeColors || {});
}

export function drawWings(ctx, x, y, shape, colors, t, scale = 1, alpha = 1) {
  const flap = Math.sin(t * 2.4) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  const [c1, c2, c3] = colors;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(flap * side);
    if (shape === 'bat') {
      ctx.fillStyle = shade(c1, -18);
      path(ctx, [[3, -2], [14, -24], [37, -35], [32, -20], [23, -11], [35, -8], [18, 1], [27, 9], [10, 12], [13, 4], [3, 8]]);
      ctx.fill();
      ctx.fillStyle = rgba(c2, 0.7);
      path(ctx, [[6, 0], [17, -20], [32, -31], [27, -17], [17, -4], [8, 4]]); ctx.fill();
      ctx.strokeStyle = c3;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(5, -1); ctx.lineTo(17, -22); ctx.lineTo(25, -15); ctx.moveTo(17, -22); ctx.lineTo(30, -29); ctx.stroke();
      ctx.globalAlpha = 0.22;
      orb(ctx, 16, -18, 22, c2, 0.4);
    } else {
      const layered = shape === 'seraph' ? 4 : 3;
      for (let i = layered; i >= 1; i--) {
        const spread = 10 + i * 8.5;
        const lift = -3 - i * 7;
        ctx.fillStyle = i === layered ? c3 : (i % 2 ? c1 : c2);
        ctx.globalAlpha = alpha * (0.62 + i * 0.1);
        path(ctx, [[3, -1], [spread * 0.55, lift - 9], [spread, lift - 19], [spread - 3, lift - 4], [spread - 7, lift + 5], [8 + i * 2, 5]]);
        ctx.fill();
        ctx.strokeStyle = rgba(c3, 0.45); ctx.lineWidth = 0.8; ctx.stroke();
      }
      ctx.globalAlpha = alpha * 0.34;
      orb(ctx, 17, -19, 27, c1, 0.45);
    }
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawMount(ctx, mountId, colors, t, moving, scale = 1) {
  if (!mountId) return;
  const mount = {
    dawnmane: ['stag', '#eadcc0', '#c9a14b', '#fff1bc'],
    nightmarish: ['horse', '#2b2028', '#b84932', '#ff7a45'],
    emerald_raptor: ['raptor', '#3c785d', '#9fce77', '#d6e89b'],
    froststrider: ['stag', '#dbeaf4', '#78bfd7', '#f5ffff'],
    cinder_wyrm: ['wyrm', '#391d1c', '#d14b2d', '#ffb04e'],
  }[mountId] || ['horse', '#3d3029', '#9a6a47', '#e2c08a'];
  const [kind, c1, c2, c3] = mount;
  const gait = moving ? Math.sin(t * 10) * 3.2 : Math.sin(t * 2) * 0.7;
  ctx.save();
  ctx.scale(scale, scale);
  if (kind === 'wyrm') {
    ctx.strokeStyle = c1; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-8, -20); ctx.quadraticCurveTo(-34, -10, -42, 2); ctx.stroke();
    ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -20); ctx.quadraticCurveTo(-34, -10, -42, 2); ctx.stroke();
  }
  ctx.strokeStyle = shade(c1, -22); ctx.lineWidth = 3.2;
  const legs = [[-17, -12, -4 + gait], [17, -11, 4 - gait], [-25, -12, 5 - gait], [25, -12, -4 + gait]];
  for (const [lx, ly, sw] of legs) {
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + sw, -8, lx + sw * 0.45, 0); ctx.stroke();
  }
  if (kind === 'raptor') {
    ellipse(ctx, 0, -20, 24, 12, c1); ellipse(ctx, 20, -27, 12, 8, c1);
    ellipse(ctx, 12, -18, 10, 8, c2);
    path(ctx, [[-18, -20], [-43, -30], [-38, -20], [-48, -16], [-18, -12]]); ctx.fillStyle = c2; ctx.fill();
    ctx.fillStyle = c3; path(ctx, [[27, -31], [35, -34], [32, -27]]); ctx.fill();
    ctx.fillStyle = '#101516'; ctx.beginPath(); ctx.arc(25, -29, 1.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-12, -31); ctx.lineTo(-18, -40); ctx.lineTo(-11, -37); ctx.stroke();
  } else {
    ellipse(ctx, 0, -21, 26, 12, c1);
    ellipse(ctx, 19, -32, 10, 8, c1);
    ellipse(ctx, 16, -22, 11, 9, c2);
    path(ctx, [[18, -36], [21, -45], [25, -36]]); ctx.fillStyle = c3; ctx.fill();
    path(ctx, [[-22, -22], [-44, -29], [-40, -22], [-50, -20], [-24, -15]]); ctx.fillStyle = c2; ctx.fill();
    if (kind === 'stag') {
      ctx.strokeStyle = c3; ctx.lineWidth = 1.5;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(20 + side * 3, -39); ctx.lineTo(19 + side * 11, -52); ctx.moveTo(19 + side * 8, -47); ctx.lineTo(23 + side * 14, -49); ctx.moveTo(19 + side * 10, -52); ctx.lineTo(21 + side * 16, -58); ctx.stroke();
      }
    }
    ctx.fillStyle = '#151214'; ctx.beginPath(); ctx.arc(24, -34, 1.5, 0, TAU); ctx.fill();
    if (mountId === 'nightmarish') {
      orb(ctx, 20, -34, 12, c3, 0.32);
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 4; i++) { ellipse(ctx, -10 + i * 5, -43 - Math.sin(t * 3 + i) * 4, 2, 4, 'rgba(255,90,50,.25)'); }
      ctx.globalAlpha = 1;
    }
  }
  // saddle
  ctx.fillStyle = '#3a2420'; roundedRect(ctx, -8, -33, 17, 6, 2); ctx.fill();
  ctx.strokeStyle = c3; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

export function drawPet(ctx, x, y, petId, colors, t, scale = 1) {
  if (!petId) return;
  const c = colors || ['#fff6bb', '#9bddff'];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const hover = Math.sin(t * 3.2) * 3;
  if (petId === 'lumen_wisp' || petId === 'voidling') {
    ctx.globalAlpha = 0.25; orb(ctx, 0, -20 + hover, 24, c[1], 0.6); ctx.globalAlpha = 1;
    ellipse(ctx, 0, -20 + hover, 6, 7, c[0]);
    ellipse(ctx, -2, -22 + hover, 2.5, 3, '#fff');
    ctx.strokeStyle = rgba(c[1], 0.65); ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -20 + hover, 12 + i * 5, t * 0.7 + i * 2, t * 0.7 + i * 2 + 1.4); ctx.stroke(); }
    if (petId === 'voidling') { ctx.fillStyle = '#0e0918'; ctx.beginPath(); ctx.arc(0, -20 + hover, 2, 0, TAU); ctx.fill(); }
  } else if (petId === 'mossling') {
    ellipse(ctx, 0, -4, 11, 3, 'rgba(0,0,0,.25)');
    ellipse(ctx, 0, -14, 10, 11, c[0]);
    ellipse(ctx, 0, -14, 7, 8, c[1]);
    ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(-5, -25, 4, 0, TAU); ctx.arc(5, -25, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1c2417'; ctx.beginPath(); ctx.arc(-3, -21, 1.2, 0, TAU); ctx.arc(3, -21, 1.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = c[1]; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-7, -17); ctx.lineTo(-14, -20 - Math.sin(t * 3)); ctx.moveTo(7, -17); ctx.lineTo(14, -20 + Math.sin(t * 3)); ctx.stroke();
  } else if (petId === 'frost_fox') {
    ellipse(ctx, 0, -2, 12, 3, 'rgba(0,0,0,.22)');
    ellipse(ctx, 0, -12, 13, 7, c[0]);
    ellipse(ctx, 11, -17, 7, 6, c[0]);
    path(ctx, [[8, -22], [10, -30], [14, -23]]); ctx.fillStyle = c[1]; ctx.fill();
    path(ctx, [[14, -22], [18, -29], [18, -21]]); ctx.fill();
    ctx.fillStyle = '#20313a'; ctx.beginPath(); ctx.arc(14, -17, 1.2, 0, TAU); ctx.fill();
    path(ctx, [[-11, -13], [-23, -20], [-16, -9]]); ctx.fillStyle = c[1]; ctx.fill();
    // frost motes
    ctx.fillStyle = rgba(c[1], 0.75);
    for (let i = 0; i < 4; i++) ctx.fillRect(-12 + i * 8, -26 - (t * 8 + i * 6) % 14, 1.5, 1.5);
  } else {
    // cinder imp
    ellipse(ctx, 0, -3, 9, 3, 'rgba(0,0,0,.28)');
    for (const side of [-1, 1]) {
      ctx.fillStyle = shade(c[0], -15);
      path(ctx, [[side * 3, -19], [side * 18, -33], [side * 21, -19], [side * 13, -14]]); ctx.fill();
    }
    ellipse(ctx, 0, -14, 7, 8, c[0]);
    ellipse(ctx, 0, -24, 6, 6, c[1]);
    ctx.fillStyle = c[0];
    path(ctx, [[-5, -29], [-8, -36], [-2, -31]]); ctx.fill();
    path(ctx, [[5, -29], [8, -36], [2, -31]]); ctx.fill();
    ctx.fillStyle = '#1a1011'; ctx.beginPath(); ctx.arc(-2.5, -25, 1, 0, TAU); ctx.arc(2.5, -25, 1, 0, TAU); ctx.fill();
    ctx.strokeStyle = c[1]; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.quadraticCurveTo(-10, -11, -8, -17); ctx.stroke();
    orb(ctx, 0, -23, 14, c[1], 0.26);
  }
  ctx.restore();
}

function drawHair(ctx, style, color, back = false) {
  ctx.fillStyle = color;
  if (back) {
    if (style === 'flowing' || style === 'long_side' || style === 'braided') {
      path(ctx, [[-7, -48], [-9, -34], [-11, -22], [-6, -20], [-4, -36], [0, -46], [5, -37], [9, -21], [12, -25], [9, -43], [4, -49]]); ctx.fill();
    } else if (style === 'topknot') {
      path(ctx, [[-7, -48], [-9, -41], [-5, -43], [1, -52], [6, -43], [8, -46], [7, -51], [0, -58], [-6, -52]]); ctx.fill();
    }
    return;
  }
  if (style === 'short') {
    path(ctx, [[-7, -48], [-7, -53], [-4, -57], [3, -57], [7, -53], [7, -49], [4, -52], [0, -51], [-4, -53]]); ctx.fill();
  } else if (style === 'wild') {
    path(ctx, [[-7, -48], [-9, -52], [-7, -55], [-4, -53], [-2, -59], [1, -54], [5, -59], [6, -53], [9, -54], [7, -49], [4, -51], [0, -49], [-4, -51]]); ctx.fill();
  } else if (style === 'topknot') {
    path(ctx, [[-7, -47], [-8, -52], [-4, -56], [3, -56], [7, -52], [7, -48], [3, -51], [-1, -50], [-4, -52]]); ctx.fill();
    ellipse(ctx, 0, -59, 4, 4, color);
    ctx.fillStyle = '#d7b76a'; ctx.fillRect(-2.5, -61, 5, 1.4);
  } else if (style === 'shaved') {
    path(ctx, [[-6, -49], [-5, -53], [0, -54], [5, -53], [6, -50], [2, -52], [-2, -52]]); ctx.fill();
    ctx.strokeStyle = rgba(color, 0.45); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(0, -48, 6, 3.5, 5.8); ctx.stroke();
  } else if (style === 'braided') {
    path(ctx, [[-7, -48], [-8, -53], [-4, -57], [3, -57], [7, -53], [7, -47], [3, -50], [0, -49], [-3, -51]]); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(7, -47); ctx.quadraticCurveTo(11, -38, 8, -30); ctx.stroke();
    ctx.fillStyle = '#d7b76a'; ctx.fillRect(7, -34, 2, 1.5);
  } else if (style === 'long_side') {
    path(ctx, [[-7, -49], [-8, -54], [-3, -57], [4, -56], [7, -52], [6, -47], [10, -37], [7, -34], [4, -45], [0, -49], [-4, -48], [-6, -43]]); ctx.fill();
  } else {
    path(ctx, [[-7, -48], [-8, -53], [-4, -57], [3, -57], [7, -52], [7, -46], [10, -37], [7, -35], [4, -46], [0, -49], [-4, -48], [-6, -42]]); ctx.fill();
  }
  // highlight
  ctx.fillStyle = rgba('#fff5d6', 0.18);
  ctx.beginPath(); ctx.ellipse(-2.5, -54, 3.2, 1.3, -0.5, 0, TAU); ctx.fill();
}

function drawFace(ctx, appearance, pal, back, side, attack) {
  if (back) return;
  const faceX = side ? 1.6 : 0;
  ctx.fillStyle = pal.skin;
  roundedRect(ctx, faceX - 5.2, -48, 10.4, 9.4, 4.2); ctx.fill();
  ctx.fillStyle = rgba(pal.skin, 1);
  ctx.beginPath(); ctx.ellipse(faceX, -38.2, 4.6, 2.1, 0, 0, TAU); ctx.fill();
  if (appearance.gender === 'male') { ctx.fillStyle = rgba('#3a241c', 0.12); ctx.fillRect(faceX - 2.5, -34, 5, 0.7); }
  // eyes
  ctx.fillStyle = pal.eye;
  ctx.fillRect(faceX - 3.4, -44.2, 2, 1.5);
  ctx.fillRect(faceX + 1.4, -44.2, 2, 1.5);
  ctx.fillStyle = '#171316';
  ctx.fillRect(faceX - 3.0, -44.1, 1, 1.2);
  ctx.fillRect(faceX + 1.6, -44.1, 1, 1.2);
  // nose/mouth
  ctx.fillStyle = rgba('#7d4735', 0.62); ctx.fillRect(faceX + 0.1, -41.2, 1, 1.2);
  if (!attack) { ctx.fillStyle = rgba('#5c2d2a', 0.55); ctx.fillRect(faceX - 1.2, -38.2, 2.8, 0.7); }
  else { ctx.fillStyle = '#5c2d2a'; ctx.fillRect(faceX - 1.2, -38.4, 2.8, 1.1); }
  // marking
  const m = appearance.marking;
  if (m === 'rune') {
    ctx.strokeStyle = rgba(pal.accent, 0.8); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(faceX - 5, -46); ctx.lineTo(faceX - 6.2, -42); ctx.lineTo(faceX - 4.5, -43); ctx.stroke();
  } else if (m === 'scar') {
    ctx.strokeStyle = 'rgba(108,55,46,.7)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(faceX + 2.5, -47.4); ctx.lineTo(faceX + 4.2, -43); ctx.stroke();
  } else if (m === 'tears') {
    ctx.fillStyle = rgba('#7ab3ff', 0.65);
    ctx.fillRect(faceX - 3.1, -42.5, 0.8, 3.2); ctx.fillRect(faceX + 2.2, -42.3, 0.8, 2.4);
  } else if (m === 'freckles') {
    ctx.fillStyle = 'rgba(115,66,45,.45)';
    ctx.fillRect(faceX - 4, -41, 0.7, 0.7); ctx.fillRect(faceX + 3.2, -41.3, 0.7, 0.7); ctx.fillRect(faceX - 2.1, -39.8, 0.6, 0.6);
  }
}

export function drawHero(ctx, x, y, scale, appearance = {}, opts = {}) {
  const pal = heroPalette(appearance);
  const faction = appearance.faction || 'angel';
  const cls = appearance.classId || 'dawnblade';
  const moving = !!opts.moving;
  const t = opts.time || 0;
  const phase = opts.walkPhase || 0;
  const facing = opts.facing || 1;
  const back = !!opts.back;
  const side = !!opts.side;
  const attack = clamp(opts.attack || 0, 0, 1);
  const riding = !!opts.mountId;
  const float = moving ? Math.abs(Math.sin(phase * 2)) * 1.2 : Math.sin(t * 2.1) * 0.6;
  const legSwing = moving ? Math.sin(phase) * 4.2 : 0;
  const armSwing = moving ? Math.sin(phase) * 2.8 : Math.sin(t * 2.1) * 0.7;
  const accent = opts.gearAccent || pal.accent;
  const weaponEffect = opts.effectColor || null;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * facing, scale);
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;

  if (riding) {
    drawMount(ctx, opts.mountId, null, t, moving, 1);
    ctx.translate(0, -22);
  }

  const bob = -float;
  // cape / back mantle
  ctx.fillStyle = pal.cape;
  path(ctx, [[-7, -36 + bob], [-11, -10 + bob + (moving ? Math.sin(phase + 1) * 2 : 0)], [-3, -18 + bob], [4, -9 + bob], [7, -35 + bob]]);
  ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = rgba(accent, 0.38); ctx.lineWidth = 0.7; ctx.stroke();

  // wings behind body
  if (opts.wings && opts.wings.colors) {
    drawWings(ctx, 0, -33 + bob, opts.wings.shape, opts.wings.colors, t, 0.96, opts.alpha ?? 1);
  }

  // legs
  if (!riding) {
    ctx.fillStyle = shade(pal.dark, 14);
    roundedRect(ctx, -5.6 + legSwing * 0.35, -15 + bob, 5, 14 - Math.abs(legSwing) * 0.1, 1.8); ctx.fill();
    roundedRect(ctx, 1.1 - legSwing * 0.35, -15 + bob, 5, 14 - Math.abs(legSwing) * 0.1, 1.8); ctx.fill();
    ctx.fillStyle = pal.metal; ctx.fillRect(-6.3 + legSwing * 0.35, -3.2 + bob, 5.7, 2.3); ctx.fillRect(0.8 - legSwing * 0.35, -3.2 + bob, 5.7, 2.3);
  } else {
    ctx.fillStyle = shade(pal.dark, 10);
    roundedRect(ctx, -7, -12 + bob, 5.5, 8, 2); ctx.fill(); roundedRect(ctx, 1.5, -12 + bob, 5.5, 8, 2); ctx.fill();
    ctx.fillStyle = pal.metal; ctx.fillRect(-7.4, -4.5 + bob, 6.1, 2); ctx.fillRect(1.1, -4.5 + bob, 6.1, 2);
  }

  // body silhouette
  const robe = cls === 'voidcaller';
  const leather = cls === 'wildstalker';
  if (robe) {
    ctx.fillStyle = pal.cloth;
    path(ctx, [[-8.5, -34 + bob], [8.5, -34 + bob], [10, -15 + bob], [7, -9 + bob], [0, -7 + bob], [-7, -9 + bob], [-10, -15 + bob]]); ctx.fill();
    ctx.fillStyle = rgba(accent, 0.3); ctx.fillRect(-1, -33 + bob, 2, 24);
  } else {
    ctx.fillStyle = leather ? shade(pal.primary, -12) : pal.metal;
    path(ctx, [[-8, -35 + bob], [0, -38 + bob], [8, -35 + bob], [6.5, -17 + bob], [0, -14 + bob], [-6.5, -17 + bob]]); ctx.fill();
    ctx.fillStyle = pal.secondary;
    if (leather) {
      path(ctx, [[-6.5, -32 + bob], [0, -34 + bob], [6.5, -32 + bob], [4, -19 + bob], [-4, -19 + bob]]); ctx.fill();
      ctx.fillStyle = pal.primary; ctx.fillRect(-6, -25 + bob, 12, 2.5);
      ctx.strokeStyle = '#5c432d'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, -34); ctx.lineTo(4, -18); ctx.stroke();
    } else {
      ctx.fillRect(-6.5, -32 + bob, 13, 3);
      ctx.fillStyle = pal.primary; ctx.fillRect(-8, -28 + bob, 16, 2.2);
      ctx.fillStyle = '#d9c37f'; ctx.beginPath(); ctx.arc(0, -24 + bob, 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5b4123'; ctx.beginPath(); ctx.arc(0, -24 + bob, 1, 0, TAU); ctx.fill();
    }
  }

  // belt
  ctx.fillStyle = shade(pal.dark, 8); ctx.fillRect(-7, -18 + bob, 14, 2.6);
  ctx.fillStyle = accent; ctx.fillRect(-1.4, -18 + bob, 2.8, 2.6);

  // shoulders/pauldrons
  ctx.fillStyle = leather ? shade(pal.primary, 12) : pal.metal;
  ctx.beginPath(); ctx.ellipse(-8.2, -33 + bob, 4.3, 3.5, -0.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8.2, -33 + bob, 4.3, 3.5, 0.2, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.7); ctx.lineWidth = 0.8; ctx.stroke();
  if (leather) { ctx.strokeStyle = pal.secondary; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-9, -34); ctx.lineTo(-6, -28); ctx.stroke(); }

  // arms
  const swing = armSwing;
  ctx.strokeStyle = pal.skin; ctx.lineWidth = 2.7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -31 + bob); ctx.lineTo(-9 - swing * 0.25, -22 + bob); ctx.stroke();
  const handX = 9 + (attack > 0 ? Math.sin(attack * Math.PI) * 2 : 0);
  const handY = -22 + bob + (attack > 0 ? -Math.sin(attack * Math.PI) * 2.5 : 0);
  ctx.beginPath(); ctx.moveTo(8, -31 + bob); ctx.lineTo(handX, handY); ctx.stroke();

  // weapon & shield
  drawHeroWeapon(ctx, cls, pal, bob, attack, weaponEffect, back);
  if (cls === 'dawnblade') {
    ctx.save(); ctx.translate(-10, -26 + bob); ctx.rotate(-0.18);
    ctx.fillStyle = shade(pal.primary, -18); path(ctx, [[0, -4], [4, -2], [4.5, 3], [0, 4.5], [-4.5, 2], [-4, -3]]); ctx.fill();
    ctx.fillStyle = '#decf9d'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();
  }

  // neck + head
  ctx.fillStyle = shade(pal.skin, -18); ctx.fillRect(-2, -39 + bob, 4, 3);
  ctx.fillStyle = pal.skin; roundedRect(ctx, -5.6, -49 + bob, 11.2, 10, 4.4); ctx.fill();
  drawHair(ctx, appearance.hairstyle || 'flowing', pal.hair, true);
  drawHair(ctx, appearance.hairstyle || 'flowing', pal.hair, false);
  drawFace(ctx, appearance, pal, back, side, attack);

  // faction sigil and class trim
  if (!robe) {
    ctx.fillStyle = accent; ctx.globalAlpha = 0.9;
    if (faction === 'angel') {
      path(ctx, [[-2, -29 + bob], [0, -31 + bob], [2, -29 + bob], [0, -27 + bob]]); ctx.fill();
    } else {
      path(ctx, [[0, -30 + bob], [2, -28 + bob], [0.6, -26 + bob], [-1.4, -27.8 + bob]]); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // subtle class aura, only when not in creation preview
  if (opts.aura) {
    ctx.globalAlpha = 0.14;
    orb(ctx, 0, -24 + bob, 23, accent, 0.5);
    ctx.globalAlpha = 1;
  }
  if (opts.hurt) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255,60,50,${0.25 + Math.sin(t * 40) * 0.15})`;
    ctx.fillRect(-15, -60, 30, 60);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

function drawHeroWeapon(ctx, cls, pal, bob, attack, effectColor, back) {
  const swing = Math.sin(attack * Math.PI);
  ctx.save();
  if (cls === 'dawnblade') {
    ctx.translate(9 + swing * 3.5, -20 + bob - swing * 2);
    ctx.rotate(-0.34 + swing * 1.45);
    ctx.fillStyle = '#d8c995'; ctx.fillRect(-1.2, 3, 2.4, 5);
    ctx.fillStyle = pal.accent; ctx.fillRect(-4, 7, 8, 1.8);
    const g = ctx.createLinearGradient(0, -23, 0, 7);
    g.addColorStop(0, '#fff7d1'); g.addColorStop(0.45, '#e4d29b'); g.addColorStop(1, '#9e8b5c');
    ctx.fillStyle = g; path(ctx, [[0, -24], [2.5, -19], [2, 7], [-2, 7], [-2.5, -19]]); ctx.fill();
    ctx.strokeStyle = rgba(pal.accent, 0.65); ctx.lineWidth = 0.7; ctx.stroke();
    if (effectColor) { ctx.shadowColor = effectColor; ctx.shadowBlur = 10; ctx.fillStyle = rgba(effectColor, 0.5); ctx.fillRect(-0.8, -23, 1.6, 29); }
  } else if (cls === 'voidcaller') {
    ctx.translate(9, -19 + bob);
    ctx.rotate(-0.08 + swing * 0.8);
    ctx.strokeStyle = '#5b4635'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -29); ctx.stroke();
    ctx.strokeStyle = '#8d6f4d'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-0.5, 10); ctx.lineTo(-0.5, -29); ctx.stroke();
    const pulse = 0.8 + Math.sin(performance.now() * 0.003) * 0.15;
    orb(ctx, 0, -31, 10 * pulse, effectColor || pal.accent, 0.7);
    ctx.fillStyle = effectColor || pal.accent; ctx.beginPath(); ctx.arc(0, -31, 3.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#cbb3ff'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -31, 5.5, 0, TAU); ctx.stroke();
    ctx.strokeStyle = pal.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-2, -27); ctx.lineTo(2, -27); ctx.stroke();
  } else {
    // twin blades
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * (10 + swing * 1.2), -20 + bob - swing * 1.5);
      ctx.rotate(side * (0.35 + swing * 0.8));
      ctx.fillStyle = '#4d3828'; ctx.fillRect(-1, 0, 2, 5);
      ctx.fillStyle = '#cfd9df'; path(ctx, [[0, -15], [1.8, -11], [1, 3], [-1, 3], [-1.8, -11]]); ctx.fill();
      ctx.strokeStyle = effectColor || pal.accent; ctx.globalAlpha = 0.7; ctx.lineWidth = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Monsters
// ---------------------------------------------------------------------------
export function drawMonster(ctx, x, y, m, t, opts = {}) {
  const colors = m.colors || ['#4d6b46', '#849c62', '#c5d194'];
  const [c1, c2, c3] = colors;
  const size = (m.size || 1) * (opts.scale || 1);
  const attack = clamp(opts.attack || 0, 0, 1);
  const moving = !!opts.moving;
  const facing = opts.facing || 1;
  const phase = opts.walkPhase || t * 3;
  const bob = Math.sin(t * 3.2 + (m.seed || 0)) * 1.2;
  const gait = moving ? Math.sin(phase) * 2.8 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size * facing, size);
  if (m.boss) {
    orb(ctx, 0, -20, 48, c3, 0.16);
    ctx.strokeStyle = rgba(c3, 0.18); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -20, 30, 13, 0, 0, TAU); ctx.stroke();
  }
  if (opts.hurt) { ctx.globalAlpha = 0.82 + Math.sin(t * 40) * 0.17; }
  const kind = m.kind || 'wolf';

  if (kind === 'wolf') {
    ctx.strokeStyle = shade(c1, -25); ctx.lineWidth = 3;
    for (const [lx, sw] of [[-13, gait], [-7, -gait], [8, -gait], [14, gait]]) {
      ctx.beginPath(); ctx.moveTo(lx, -12); ctx.quadraticCurveTo(lx + sw, -7, lx + sw * 0.5, -1); ctx.stroke();
    }
    ellipse(ctx, 0, -19 + bob * 0.2, 19, 11, c1);
    ellipse(ctx, 15, -23, 9, 8, c1);
    ellipse(ctx, 12, -18, 8, 6, c2);
    path(ctx, [[-18, -20], [-33, -28 - Math.sin(t * 5) * 2], [-29, -19], [-18, -14]]); ctx.fillStyle = c2; ctx.fill();
    path(ctx, [[11, -29], [14, -37], [19, -28]]); ctx.fillStyle = shade(c1, 18); ctx.fill();
    path(ctx, [[21, -29], [26, -35], [25, -26]]); ctx.fill();
    ctx.fillStyle = '#ffd76b'; ctx.beginPath(); ctx.arc(19, -24, 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = c3; ctx.fillRect(-6, -25, 6, 2);
    if (m.id === 'magma_hound') {
      ctx.fillStyle = rgba(c3, 0.9);
      for (let i = 0; i < 3; i++) ctx.fillRect(-6 + i * 6, -27 + i, 2, 1.2);
      ctx.strokeStyle = rgba(c3, 0.35); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, -20, 22, 0, TAU); ctx.stroke();
    }
  } else if (kind === 'boar') {
    ctx.strokeStyle = '#4a3525'; ctx.lineWidth = 3.4;
    for (const [lx, sw] of [[-12, gait], [-6, -gait], [9, -gait], [15, gait]]) { ctx.beginPath(); ctx.moveTo(lx, -10); ctx.lineTo(lx + sw, 0); ctx.stroke(); }
    ellipse(ctx, 0, -18 + bob * 0.2, 20, 12, c1);
    ellipse(ctx, 16, -20, 10, 9, c1);
    ellipse(ctx, 13, -16, 9, 7, c2);
    ctx.fillStyle = c3; path(ctx, [[22, -18], [31, -13], [22, -12]]); ctx.fill();
    path(ctx, [[20, -23], [29, -29], [23, -20]]); ctx.fillStyle = c2; ctx.fill();
    ctx.fillStyle = '#f4ead1'; path(ctx, [[19, -13], [28, -16], [22, -10]]); ctx.fill();
    ctx.fillStyle = '#171310'; ctx.beginPath(); ctx.arc(20, -21, 1.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#302215'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-17, -22); ctx.quadraticCurveTo(-30, -30, -35, -20); ctx.stroke();
  } else if (kind === 'sprite') {
    const h = -28 + Math.sin(t * 3 + (m.seed || 0)) * 5;
    ctx.globalAlpha = 0.25; orb(ctx, 0, h, 22, c2, 0.6); ctx.globalAlpha = 1;
    for (const side of [-1, 1]) {
      ctx.fillStyle = rgba(c1, 0.42);
      path(ctx, [[side * 3, h], [side * 15, h - 12], [side * 18, h + 2], [side * 8, h + 4]]); ctx.fill();
      ctx.strokeStyle = rgba(c2, 0.45); ctx.lineWidth = 0.8; ctx.stroke();
    }
    ellipse(ctx, 0, h, 5, 6, c2);
    ellipse(ctx, 0, h - 2, 2.5, 3, '#fffbe0');
    ctx.fillStyle = '#312a20'; ctx.fillRect(-1.2, h - 1, 0.8, 1); ctx.fillRect(0.5, h - 1, 0.8, 1);
    for (let i = 0; i < 4; i++) {
      const a = t * 1.4 + i * 1.7;
      ellipse(ctx, Math.cos(a) * 13, h + Math.sin(a) * 7, 1.3, 1.3, rgba(c3, 0.6));
    }
  } else if (kind === 'golem') {
    ctx.strokeStyle = shade(c1, -22); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-13 + gait, 0); ctx.moveTo(10, -10); ctx.lineTo(13 - gait, 0); ctx.stroke();
    ctx.fillStyle = c1; roundedRect(ctx, -13, -34 + bob, 26, 26, 4); ctx.fill();
    ctx.fillStyle = c2; roundedRect(ctx, -9, -31 + bob, 18, 16, 2); ctx.fill();
    ctx.fillStyle = shade(c1, 20); roundedRect(ctx, -18, -31 + bob, 6, 19, 3); ctx.fill(); roundedRect(ctx, 12, -31 + bob, 6, 19, 3); ctx.fill();
    ctx.fillStyle = c1; roundedRect(ctx, -8, -43 + bob, 16, 10, 3); ctx.fill();
    ctx.fillStyle = c3; ctx.fillRect(-5, -39 + bob, 3, 2); ctx.fillRect(2, -39 + bob, 3, 2);
    ctx.strokeStyle = c3; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -23 + bob, 5, 0, TAU); ctx.stroke();
    orb(ctx, 0, -23 + bob, 11, c3, 0.4);
    if (m.id === 'void_sentinel') {
      ctx.strokeStyle = rgba(c3, 0.5); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-8, -42); ctx.lineTo(-14, -56); ctx.lineTo(-8, -50); ctx.stroke();
    }
  } else if (kind === 'harpy') {
    const h = -30 + Math.sin(t * 3) * 3;
    for (const side of [-1, 1]) {
      ctx.fillStyle = side < 0 ? shade(c2, -18) : c2;
      path(ctx, [[side * 4, h + 2], [side * 26, h - 22], [side * 32, h - 6], [side * 20, h + 2], [side * 27, h + 8], [side * 11, h + 10]]); ctx.fill();
      ctx.strokeStyle = rgba(c3, 0.4); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(side * 5, h + 2); ctx.lineTo(side * 25, h - 19); ctx.stroke();
    }
    ellipse(ctx, 0, h + 9, 7, 10, c1);
    ellipse(ctx, 0, h - 3, 6, 6, c2);
    ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(0, h - 8, 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2018'; ctx.fillRect(-3, h - 5, 2, 1); ctx.fillRect(1, h - 5, 2, 1);
    ctx.strokeStyle = c2; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-3, h + 18); ctx.lineTo(-8, h + 25); ctx.moveTo(3, h + 18); ctx.lineTo(8, h + 25); ctx.stroke();
  } else if (kind === 'kobold') {
    const h = -22 + Math.sin(t * 4) * 1;
    ctx.strokeStyle = c1; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(-6 + gait, 0); ctx.moveTo(4, -9); ctx.lineTo(6 - gait, 0); ctx.stroke();
    ellipse(ctx, 0, h + 3, 6, 9, c1);
    ellipse(ctx, 0, h - 5, 5.5, 5, c2);
    path(ctx, [[-5, h - 8], [-10, h - 16], [-3, h - 11]]); ctx.fillStyle = c1; ctx.fill();
    path(ctx, [[5, h - 8], [10, h - 16], [3, h - 11]]); ctx.fill();
    ctx.fillStyle = c3; ctx.fillRect(-3.5, h - 6, 2, 1.5); ctx.fillRect(1.5, h - 6, 2, 1.5);
    ctx.strokeStyle = c2; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-9, h + 7); ctx.lineTo(-14, h + 2); ctx.stroke();
    if (m.id === 'cinder_imp') orb(ctx, 0, h - 4, 12, c3, 0.2);
  } else if (kind === 'lurker') {
    const h = -13 + bob;
    ellipse(ctx, 0, h, 21, 12, c1);
    ellipse(ctx, -3, h - 5, 13, 9, c2);
    ctx.fillStyle = '#c9e39a';
    for (const side of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(side * 6, h - 12, 2.1, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1c2417'; ctx.beginPath(); ctx.arc(-6, h - 12, 1, 0, TAU); ctx.arc(0, h - 12, 1, 0, TAU); ctx.arc(6, h - 12, 1, 0, TAU); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 2;
    for (const [lx, dir] of [[-16, -1], [-8, -1], [8, 1], [16, 1]]) { ctx.beginPath(); ctx.moveTo(lx, h + 2); ctx.quadraticCurveTo(lx + dir * 10, h - 10, lx + dir * 14 + Math.sin(t * 4 + lx) * 2, h - 18); ctx.stroke(); }
    ctx.fillStyle = rgba(c3, 0.3); ctx.beginPath(); ctx.ellipse(0, h + 4, 26, 8, 0, 0, TAU); ctx.fill();
  } else if (kind === 'spider') {
    const h = -17 + bob;
    ctx.strokeStyle = shade(c1, -12); ctx.lineWidth = 1.8;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const sw = Math.sin(phase + i * 1.3) * 2;
        ctx.beginPath(); ctx.moveTo(side * 5, h); ctx.lineTo(side * (15 + i * 4), h - 6 + i * 2 + sw); ctx.lineTo(side * (23 + i * 3), h + 5 + i); ctx.stroke();
      }
    }
    ellipse(ctx, 0, h, 14, 9, c1);
    ellipse(ctx, -11, h - 2, 7, 6, c2);
    ctx.fillStyle = c3;
    for (const ex of [-14, -11, -8]) { ctx.beginPath(); ctx.arc(ex, h - 4, 1.2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1b2617'; ctx.fillRect(-3, h - 3, 6, 2);
    ctx.strokeStyle = c2; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h + 4); ctx.quadraticCurveTo(6, h + 13, 13, h + 7); ctx.stroke();
  } else if (kind === 'mushroom') {
    const h = -15 + bob;
    ctx.strokeStyle = c1; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, h + 15); ctx.lineTo(0, h); ctx.stroke();
    ellipse(ctx, 0, h + 15, 9, 5, shade(c1, -12));
    ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(0, h - 4, 19, 11, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, h - 3, 19, 4, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = c3;
    for (const [sx, sy, sr] of [[-9, h - 8, 2.5], [4, h - 11, 2], [11, h - 5, 1.6], [-2, h - 3, 1.5]]) { ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e4f6b5'; ctx.beginPath(); ctx.arc(-5, h + 2, 1.2, 0, TAU); ctx.arc(4, h + 2, 1.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = c1; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-5, h + 8); ctx.lineTo(-12, h + 12); ctx.moveTo(5, h + 8); ctx.lineTo(12, h + 12); ctx.stroke();
    orb(ctx, 0, h - 5, 25, c3, 0.22);
  } else if (kind === 'wraith') {
    const h = -22 + Math.sin(t * 2.2 + (m.seed || 0)) * 3;
    ctx.globalAlpha = 0.2; orb(ctx, 0, h + 8, 30, c3, 0.35); ctx.globalAlpha = 1;
    ctx.fillStyle = shade(c1, -10);
    path(ctx, [[-12, h - 3], [-15, h + 15], [-8, h + 10], [-5, h + 25], [0, h + 16], [5, h + 27], [9, h + 12], [15, h + 15], [11, h - 4], [0, -43 + Math.sin(t * 2) * 2]]); ctx.fill();
    ctx.fillStyle = c2; path(ctx, [[-9, h - 1], [0, -45], [9, h + 1], [5, h + 8], [-6, h + 7]]); ctx.fill();
    ctx.fillStyle = c3; ctx.beginPath(); ctx.ellipse(-3.5, h + 1, 1.6, 2.4, 0, 0, TAU); ctx.ellipse(3.5, h + 1, 1.6, 2.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(c3, 0.5); ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-10, h + 7); ctx.quadraticCurveTo(-18, h + 13, -14, h + 18); ctx.moveTo(10, h + 7); ctx.quadraticCurveTo(18, h + 13, 14, h + 18); ctx.stroke();
  } else if (kind === 'skeleton') {
    const h = -26;
    ctx.strokeStyle = c1; ctx.lineWidth = 2.3;
    ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-6 + gait, 0); ctx.moveTo(3, -9); ctx.lineTo(6 - gait, 0); ctx.stroke();
    ctx.fillStyle = c2; ctx.fillRect(-6, h + 4, 12, 13);
    ctx.strokeStyle = c1; ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-5, h + 7 + i * 3); ctx.lineTo(5, h + 7 + i * 3); ctx.stroke(); }
    ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(0, h, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#171210'; ctx.fillRect(-3.5, h - 1, 2, 2); ctx.fillRect(1.5, h - 1, 2, 2);
    ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(-2.5, h, 0.7, 0, TAU); ctx.arc(2.5, h, 0.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, h + 6); ctx.lineTo(-13, h + 15); ctx.moveTo(6, h + 6); ctx.lineTo(13, h + 14); ctx.stroke();
    // blade
    ctx.strokeStyle = '#9eb2ba'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(15, h + 11); ctx.lineTo(21, h - 5); ctx.stroke();
    if (attack > 0) orb(ctx, 17, h, 10, c3, 0.3);
  } else if (kind === 'ghoul') {
    const h = -20;
    ctx.strokeStyle = c1; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-8, 0); ctx.moveTo(4, -8); ctx.lineTo(8, 0); ctx.stroke();
    ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(-1, h + 5, 11, 13, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(1, h - 4, 7, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#14110e'; ctx.fillRect(3, h - 6, 2, 1.4); ctx.fillRect(7, h - 6, 1.5, 1.4);
    ctx.strokeStyle = c3; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-7, h + 7); ctx.lineTo(-16, h + 16); ctx.moveTo(7, h + 7); ctx.lineTo(15, h + 14); ctx.stroke();
    ctx.strokeStyle = rgba(c3, 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, h + 12); ctx.lineTo(-3, h + 16); ctx.stroke();
  } else if (kind === 'yeti') {
    const h = -20 + bob * 0.6;
    ctx.strokeStyle = c1; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-13, 0); ctx.moveTo(10, -10); ctx.lineTo(13, 0); ctx.stroke();
    ctx.fillStyle = c1; ellipse(ctx, 0, h + 2, 17, 20, c1);
    ctx.fillStyle = c2; ellipse(ctx, 0, h + 7, 12, 14, c2);
    ctx.fillStyle = c1; roundedRect(ctx, -10, h - 17, 20, 11, 4); ctx.fill();
    ctx.fillStyle = c2; ctx.fillRect(-7, h - 12, 14, 4);
    ctx.fillStyle = '#182124'; ctx.fillRect(-5, h - 10, 3, 2); ctx.fillRect(3, h - 10, 3, 2);
    ctx.fillStyle = '#7a929a'; path(ctx, [[-5, h - 6], [0, h - 3], [5, h - 6]]); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-15, h - 3); ctx.lineTo(-24, h + 11); ctx.moveTo(15, h - 3); ctx.lineTo(24, h + 11); ctx.stroke();
    ctx.strokeStyle = c3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, h - 17); ctx.lineTo(-7, h - 21); ctx.moveTo(4, h - 17); ctx.lineTo(7, h - 21); ctx.stroke();
  } else if (kind === 'scorpion') {
    const h = -14 + bob * 0.3;
    ctx.strokeStyle = c1; ctx.lineWidth = 2;
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(side * 7, h + 4); ctx.lineTo(side * (15 + i * 4), h + 10 + i * 2); ctx.stroke(); }
    ellipse(ctx, 0, h + 5, 14, 7, c1);
    ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(16, h + 3, 6, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, h + 3); ctx.quadraticCurveTo(-20, h - 15, -10, h - 27); ctx.quadraticCurveTo(-4, h - 34, 0, h - 29); ctx.stroke();
    ctx.fillStyle = c3; path(ctx, [[0, h - 30], [4, h - 36], [7, h - 29], [2, h - 26]]); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(18, h + 1); ctx.quadraticCurveTo(30, h - 7, 31, h + 2); ctx.moveTo(15, h + 6); ctx.quadraticCurveTo(27, h + 12, 31, h + 6); ctx.stroke();
    ctx.fillStyle = '#f4dd95'; ctx.beginPath(); ctx.arc(19, h + 2, 1.2, 0, TAU); ctx.fill();
  } else if (kind === 'mummy') {
    const h = -24;
    ctx.strokeStyle = c2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(-7, 0); ctx.moveTo(5, -8); ctx.lineTo(7, 0); ctx.stroke();
    ctx.fillStyle = c1; roundedRect(ctx, -8, h + 3, 16, 23, 4); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-8, h + 7 + i * 4); ctx.lineTo(8, h + 5 + i * 4); ctx.stroke(); }
    ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(0, h - 2, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#14110e'; ctx.fillRect(-3.5, h - 4, 2, 1.4); ctx.fillRect(1.5, h - 4, 2, 1.4);
    ctx.strokeStyle = c3; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-7, h + 8); ctx.lineTo(-15, h + 4); ctx.moveTo(7, h + 8); ctx.lineTo(15, h + 4); ctx.stroke();
    orb(ctx, 0, h + 8, 15, c3, 0.18);
  } else if (kind === 'imp') {
    const h = -24 + Math.sin(t * 4) * 2;
    for (const side of [-1, 1]) {
      ctx.fillStyle = rgba(c1, 0.82);
      path(ctx, [[side * 4, h + 3], [side * 17, h - 13], [side * 21, h + 2], [side * 11, h + 6]]); ctx.fill();
    }
    ellipse(ctx, 0, h + 8, 6, 9, c1);
    ellipse(ctx, 0, h - 1, 5.5, 5.5, c2);
    ctx.fillStyle = c1; path(ctx, [[-4, h - 6], [-7, h - 14], [-1, h - 8]]); ctx.fill(); path(ctx, [[4, h - 6], [7, h - 14], [1, h - 8]]); ctx.fill();
    ctx.fillStyle = c3; ctx.fillRect(-3, h - 2, 1.5, 1.5); ctx.fillRect(1.5, h - 2, 1.5, 1.5);
    ctx.strokeStyle = c1; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, h + 17); ctx.quadraticCurveTo(12, h + 18, 8, h + 10); ctx.stroke();
    orb(ctx, 0, h, 14, c3, 0.2);
  } else if (kind === 'horror') {
    const h = -26 + Math.sin(t * 2) * 3;
    ctx.globalAlpha = 0.18; orb(ctx, 0, h, 32, c2, 0.5); ctx.globalAlpha = 1;
    ctx.fillStyle = c1;
    path(ctx, [[-14, h + 8], [-20, h - 5], [-10, h - 13], [-2, h - 21], [8, h - 13], [18, h - 5], [12, h + 8], [20, h + 14], [4, h + 12], [-6, h + 20], [-11, h + 10]]); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const ex = -9 + (i % 3) * 8, ey = h - 7 + Math.floor(i / 3) * 8 + Math.sin(t * 2 + i) * 1.5;
      ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#171020'; ctx.beginPath(); ctx.arc(ex, ey, 1, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = c2; ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-13 + i * 8, h + 8); ctx.quadraticCurveTo(-16 + i * 9, h + 19, -10 + i * 7, h + 25); ctx.stroke(); }
  } else if (kind === 'treant') {
    const h = -38 + Math.sin(t * 1.7) * 1.5;
    ctx.strokeStyle = '#493b27'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-11, -10); ctx.lineTo(-18, 0); ctx.moveTo(10, -10); ctx.lineTo(17, 0); ctx.stroke();
    ctx.fillStyle = c1; path(ctx, [[-12, h + 22], [-17, h - 2], [-10, h - 18], [10, h - 18], [17, h - 2], [12, h + 22], [0, h + 27]]); ctx.fill();
    ctx.fillStyle = shade(c1, 15); path(ctx, [[-7, h + 15], [-9, h - 12], [0, h - 15], [6, h - 5], [5, h + 15]]); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 3;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 12, h + 3); ctx.lineTo(side * 27, h - 13); ctx.lineTo(side * 31, h - 33); ctx.stroke(); }
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI + i * 0.55;
      ctx.fillStyle = i % 2 ? c2 : c3;
      ellipse(ctx, Math.cos(a) * 22, h - 17 + Math.sin(a) * 10, 10, 7, i % 2 ? c2 : shade(c2, -16));
    }
    ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(-5, h - 4, 1.8, 0, TAU); ctx.arc(5, h - 4, 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1b1913'; ctx.fillRect(-4, h + 6, 8, 5);
    ctx.strokeStyle = c3; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, h + 5, 9, 0, Math.PI); ctx.stroke();
    if (m.boss) {
      ctx.fillStyle = '#f4d270'; path(ctx, [[-9, h - 20], [-6, h - 29], [-2, h - 22], [2, h - 31], [5, h - 22], [9, h - 29], [8, h - 18]]); ctx.fill();
    }
  } else if (kind === 'serpent') {
    const h = -22 + Math.sin(t * 2) * 2;
    ctx.strokeStyle = c1; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-19, 0); ctx.bezierCurveTo(-5, -22, 22, -8, 15, -27); ctx.bezierCurveTo(10, -42, -16, -35, -10, -49); ctx.stroke();
    ctx.strokeStyle = c2; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-19, 0); ctx.bezierCurveTo(-5, -22, 22, -8, 15, -27); ctx.stroke();
    ctx.fillStyle = c1; ellipse(ctx, -8, -50, 12, 8, c1); ellipse(ctx, -18, -54, 8, 6, c1);
    ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(-8, -52, 2, 0, TAU); ctx.arc(-16, -55, 1.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = c3; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-21, -56); ctx.lineTo(-27, -63); ctx.moveTo(-23, -56); ctx.lineTo(-25, -65); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba(c3, 0.6); ellipse(ctx, 8 - i * 5, -25 - i * 2, 1.5, 1.2, rgba(c3, 0.6)); }
    if (m.boss) { ctx.fillStyle = '#ffde7a'; path(ctx, [[-14, -57], [-10, -68], [-6, -59], [-2, -67], [2, -58]]); ctx.fill(); }
  } else if (kind === 'lich') {
    const h = -30 + Math.sin(t * 2) * 2;
    ctx.globalAlpha = 0.18; orb(ctx, 0, h + 15, 33, c3, 0.5); ctx.globalAlpha = 1;
    ctx.fillStyle = c1; path(ctx, [[-13, h - 4], [-18, h + 25], [-8, h + 20], [-3, h + 34], [1, h + 21], [7, h + 34], [11, h + 18], [17, h + 24], [11, h - 5], [0, h - 17]]); ctx.fill();
    ctx.fillStyle = c2; path(ctx, [[-8, h + 2], [0, h - 15], [8, h + 2], [5, h + 14], [-5, h + 14]]); ctx.fill();
    ctx.fillStyle = '#c9e8ef'; ctx.beginPath(); ctx.arc(0, h - 10, 5.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#131318'; ctx.fillRect(-3.5, h - 12, 2, 2.2); ctx.fillRect(1.5, h - 12, 2, 2.2);
    ctx.fillStyle = c3; ctx.fillRect(-3, h - 11, 1.2, 1.2); ctx.fillRect(2, h - 11, 1.2, 1.2);
    ctx.fillStyle = '#d8b76b'; path(ctx, [[-8, h - 17], [-5, h - 23], [-2, h - 18], [1, h - 25], [4, h - 18], [8, h - 23], [7, h - 16]]); ctx.fill();
    ctx.strokeStyle = '#3d352e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(13, h + 8); ctx.lineTo(18, h - 20); ctx.stroke();
    orb(ctx, 18, h - 24, 10, c3, 0.68);
    ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(18, h - 24, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(c3, 0.5); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-14, h + 4); ctx.quadraticCurveTo(-27, h + 12, -23, h + 23); ctx.moveTo(13, h + 5); ctx.quadraticCurveTo(27, h + 13, 22, h + 23); ctx.stroke();
  } else if (kind === 'wyrm') {
    const h = -30 + Math.sin(t * 2.4) * 2;
    for (const side of [-1, 1]) {
      ctx.fillStyle = side < 0 ? shade(c1, -18) : c1;
      path(ctx, [[side * 6, h - 2], [side * 37, h - 33], [side * 49, h - 18], [side * 27, h - 6], [side * 43, h + 7], [side * 15, h + 8]]); ctx.fill();
      ctx.strokeStyle = rgba(c3, 0.35); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(side * 7, h); ctx.lineTo(side * 36, h - 29); ctx.stroke();
    }
    ctx.fillStyle = c1; ellipse(ctx, 0, h + 9, 24, 15, c1);
    ctx.fillStyle = c2; ellipse(ctx, 0, h + 12, 15, 9, c2);
    ctx.strokeStyle = c1; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(13, h); ctx.bezierCurveTo(28, h - 8, 16, h - 30, 34, h - 35); ctx.stroke();
    ctx.fillStyle = c1; ellipse(ctx, 35, h - 37, 12, 8, c1);
    ctx.fillStyle = c2; path(ctx, [[42, h - 41], [51, h - 44], [45, h - 36]]); ctx.fill();
    ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(38, h - 40, 2, 0, TAU); ctx.fill();
    ctx.strokeStyle = c3; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(33, h - 42); ctx.lineTo(29, h - 50); ctx.moveTo(38, h - 43); ctx.lineTo(38, h - 52); ctx.stroke();
    ctx.strokeStyle = c1; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-19, h + 10); ctx.quadraticCurveTo(-40, h + 15, -46, h + 4); ctx.stroke();
    if (m.boss) { orb(ctx, 0, h, 54, c3, 0.15); }
  } else if (kind === 'pharaoh') {
    const h = -28;
    ctx.fillStyle = '#e4c376'; path(ctx, [[-15, h - 4], [-20, h + 23], [-6, h + 20], [0, h + 31], [7, h + 20], [20, h + 23], [14, h - 4], [0, h - 18]]); ctx.fill();
    ctx.fillStyle = c1; ctx.fillRect(-11, h + 1, 22, 16);
    ctx.fillStyle = c3; ctx.fillRect(-12, h - 2, 24, 3);
    ctx.fillStyle = c2; roundedRect(ctx, -7, h - 15, 14, 12, 4); ctx.fill();
    ctx.fillStyle = c1; path(ctx, [[-8, h - 17], [-12, h - 29], [-4, h - 21], [0, h - 24], [4, h - 21], [12, h - 29], [8, h - 17]]); ctx.fill();
    ctx.fillStyle = '#15120f'; ctx.fillRect(-4, h - 11, 2.5, 2); ctx.fillRect(2, h - 11, 2.5, 2);
    ctx.fillStyle = c3; ctx.fillRect(-4, h - 11, 1.2, 1.2); ctx.fillRect(2, h - 11, 1.2, 1.2);
    ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, h + 6); ctx.lineTo(-21, h + 19); ctx.moveTo(11, h + 6); ctx.lineTo(21, h + 19); ctx.stroke();
    ctx.strokeStyle = '#6d4e28'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(15, h + 5); ctx.lineTo(16, h - 30); ctx.stroke();
    ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(16, h - 33, 4, 0, TAU); ctx.fill();
    orb(ctx, 16, h - 33, 14, c3, 0.4);
    if (m.boss) orb(ctx, 0, h + 5, 36, c3, 0.12);
  } else if (kind === 'tyrant') {
    const h = -34;
    ctx.fillStyle = c1; roundedRect(ctx, -20, h + 14, 40, 23, 4); ctx.fill();
    ctx.fillStyle = c2; path(ctx, [[-24, h - 4], [-18, h - 24], [0, h - 30], [18, h - 24], [24, h - 4], [0, h + 4]]); ctx.fill();
    ctx.fillStyle = c1; path(ctx, [[-18, h - 20], [-31, h - 33], [-28, h - 8], [0, h + 3], [28, h - 8], [31, h - 33], [18, h - 20]]); ctx.fill();
    ctx.fillStyle = shade(c2, -18); ctx.beginPath(); ctx.arc(0, h - 17, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = c3; ctx.fillRect(-6, h - 21, 4, 2.5); ctx.fillRect(2, h - 21, 4, 2.5);
    ctx.fillStyle = '#ffd36b'; path(ctx, [[-12, h - 27], [-8, h - 39], [-4, h - 30], [0, h - 43], [4, h - 30], [8, h - 39], [12, h - 27]]); ctx.fill();
    ctx.strokeStyle = '#2a1b1b'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-20, h + 17); ctx.lineTo(-30, h + 34); ctx.moveTo(20, h + 17); ctx.lineTo(30, h + 34); ctx.stroke();
    ctx.strokeStyle = '#3b2f2e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(23, h + 8); ctx.lineTo(34, h - 27); ctx.stroke();
    ctx.fillStyle = c3; path(ctx, [[34, h - 36], [38, h - 26], [33, h - 24], [30, h - 28]]); ctx.fill();
    orb(ctx, 0, h + 2, 46, c3, 0.15);
    if (attack > 0) { ctx.strokeStyle = rgba(c3, 0.6); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, h, 38, -1.1 + attack * 2, 1.1 + attack * 2); ctx.stroke(); }
  } else if (kind === 'aeon') {
    const h = -38 + Math.sin(t * 1.4) * 4;
    ctx.globalAlpha = 0.2; orb(ctx, 0, h + 8, 58, c3, 0.5); ctx.globalAlpha = 1;
    ctx.fillStyle = c1; path(ctx, [[-18, h + 14], [-30, h - 4], [-18, h - 21], [0, h - 29], [18, h - 21], [30, h - 4], [18, h + 14], [0, h + 23]]); ctx.fill();
    ctx.fillStyle = 'rgba(14,10,32,.82)'; ctx.beginPath(); ctx.ellipse(0, h + 1, 16, 12, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = c2; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, h + 1, 24 + i * 7, 9 + i * 3, t * 0.3 + i, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(-6, h - 2, 2.5, 0, TAU); ctx.arc(6, h - 2, 2.5, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = t * 0.4 + i * TAU / 6;
      const px = Math.cos(a) * (36 + Math.sin(t + i) * 4);
      const py = h + 1 + Math.sin(a) * 19;
      ctx.fillStyle = rgba(c2, 0.7); ctx.fillRect(px, py, 2.5, 2.5);
    }
    ctx.strokeStyle = rgba(c3, 0.55); ctx.lineWidth = 1.4;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 13, h + 4); ctx.lineTo(side * 35, h - 35); ctx.lineTo(side * 42, h - 4); ctx.stroke(); }
    if (m.boss) { ctx.fillStyle = '#f6e8a0'; path(ctx, [[-8, h - 30], [-4, h - 40], [0, h - 32], [4, h - 41], [8, h - 30]]); ctx.fill(); }
  } else {
    ellipse(ctx, 0, -14, 18, 12, c1); ellipse(ctx, 8, -20, 8, 8, c2);
  }

  if (opts.hurt) {
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#ff5d4a'; ctx.fillRect(-40, -80, 80, 90); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Environment props (cached procedural sprites)
// ---------------------------------------------------------------------------
const propCache = new Map();
const makeCanvas = (w, h) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
};

const PROP_DIMS = {
  oak: [176, 224, 88, 214], pine: [150, 232, 75, 222], dead: [160, 220, 80, 208],
  mushroomTree: [180, 206, 90, 194], palm: [176, 218, 88, 208], crystal: [128, 170, 64, 158],
  ashTree: [170, 220, 85, 208], rock: [126, 88, 63, 77], boulder: [180, 124, 90, 111],
  grave: [74, 100, 37, 88], cactus: [100, 138, 50, 128], fence: [120, 74, 60, 63],
  barrel: [54, 66, 27, 56], crate: [62, 64, 31, 55], anvil: [76, 58, 38, 48],
  stall: [170, 146, 85, 135], statue: [110, 172, 55, 160], waystone: [140, 210, 70, 198],
  portal: [170, 236, 85, 224], campfire: [76, 66, 38, 56], torch: [46, 112, 23, 102],
  bones: [92, 54, 46, 45], shrine: [110, 150, 55, 140], obelisk: [92, 168, 46, 156],
  house: [270, 264, 135, 248], inn: [286, 286, 143, 269], forge: [286, 274, 143, 257],
  chapel: [264, 300, 132, 284], vault: [262, 260, 131, 246], ruins: [170, 120, 85, 108],
  banner: [60, 132, 30, 122], stump: [74, 56, 37, 48],
};

export function getPropSprite(type, variant = 0, palette = {}, seed = 1) {
  const key = `${type}:${variant}:${seed}:${palette.accent || ''}`;
  if (propCache.has(key)) return propCache.get(key);
  const dims = PROP_DIMS[type] || [120, 120, 60, 108];
  const [w, h, ax, ay] = dims;
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(seed * 97 + variant * 31 + hashString(type));
  const cx = ax;
  const base = ay;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const accent = palette.accent || '#f3cf70';
  const leaf = palette.leaf || ['#37633e', '#4f7f49', '#6b9a54'];
  const rock = palette.rock || '#6b6656';
  const ground = palette.ground || ['#557d45', '#668d4c', '#739b55', '#4a713d'];
  const pathCol = palette.path || ['#9a7e50', '#8b6d45'];

  if (type === 'oak' || type === 'ashTree' || type === 'dead') {
    const ash = type === 'ashTree';
    const dead = type === 'dead';
    const trunkA = dead ? '#6b6658' : ash ? '#3a2a26' : '#4a3626';
    const trunkB = dead ? '#8b8475' : ash ? '#67413a' : '#715038';
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(cx, base, 42, 12, 0, 0, TAU); ctx.fill();
    const topY = dead ? base - 130 : base - 96;
    ctx.strokeStyle = trunkA; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(cx, base); ctx.quadraticCurveTo(cx - 5, base - 45, cx - 3, topY); ctx.stroke();
    ctx.strokeStyle = trunkB; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(cx + 2, base); ctx.quadraticCurveTo(cx - 2, base - 45, cx + 1, topY); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1;
      const by = base - 55 - i * 17;
      ctx.strokeStyle = trunkA; ctx.lineWidth = 8 - i * 0.8;
      ctx.beginPath(); ctx.moveTo(cx, by); ctx.quadraticCurveTo(cx + side * 20, by - 8, cx + side * (34 + rng() * 20), by - 22 - rng() * 18); ctx.stroke();
      ctx.strokeStyle = trunkB; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + side * 20, by - 8); ctx.lineTo(cx + side * (30 + rng() * 18), by - 24 - rng() * 13); ctx.stroke();
    }
    if (!dead) {
      const canopy = ash ? ['#3d2b28', '#5a342c', '#7b3b2e'] : [leaf[0], leaf[1], leaf[2], shade(leaf[1], 20)];
      const clusters = type === 'ashTree' ? 8 : 22;
      for (let i = 0; i < clusters; i++) {
        const a = rng() * TAU;
        const r = 18 + rng() * 47;
        const px = cx + Math.cos(a) * r;
        const py = topY + 6 + Math.sin(a) * (22 + rng() * 19) - 13;
        const rad = 20 + rng() * 22;
        ctx.fillStyle = canopy[Math.floor(rng() * canopy.length)];
        ctx.beginPath(); ctx.ellipse(px, py, rad, rad * (0.7 + rng() * 0.25), rng() * 2, 0, TAU); ctx.fill();
        if (rng() > 0.55) {
          ctx.fillStyle = rgba(shade(canopy[1], 25), 0.34);
          ctx.beginPath(); ctx.ellipse(px - rad * 0.3, py - rad * 0.36, rad * 0.45, rad * 0.22, -0.3, 0, TAU); ctx.fill();
        }
      }
      if (ash) {
        ctx.fillStyle = rgba('#ff7442', 0.8);
        for (let i = 0; i < 8; i++) ctx.fillRect(cx - 35 + rng() * 70, topY - 10 + rng() * 50, 1.6, 1.6);
        orb(ctx, cx, topY + 15, 58, '#ff5c2e', 0.12);
      } else {
        for (let i = 0; i < 36; i++) {
          ctx.fillStyle = rgba(palette.flowers?.[i % 3] || '#f0d67c', 0.65);
          ctx.fillRect(cx - 55 + rng() * 110, topY - 30 + rng() * 72, 1.4, 1.4);
        }
      }
    }
  } else if (type === 'pine') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, 31, 9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4b3529'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(cx, base); ctx.lineTo(cx, base - 140); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const yy = base - 105 - i * 19;
      const spread = 58 - i * 7;
      ctx.fillStyle = leaf[(i + 1) % leaf.length];
      path(ctx, [[cx - spread, yy + 24], [cx, yy - 30], [cx + spread, yy + 24], [cx + spread * 0.55, yy + 19], [cx, yy + 27], [cx - spread * 0.55, yy + 19]]); ctx.fill();
      ctx.strokeStyle = rgba('#e9f4d6', 0.13); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = rgba('#ffffff', 0.09);
      path(ctx, [[cx - spread * 0.7, yy + 8], [cx - 3, yy - 25], [cx - 12, yy + 2]]); ctx.fill();
    }
    if (palette.accent) { ctx.fillStyle = rgba(palette.accent, 0.4); ctx.fillRect(cx - 2, base - 142, 4, 2); }
  } else if (type === 'mushroomTree') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, 42, 13, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d6d6b6'; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(cx, base); ctx.quadraticCurveTo(cx - 8, base - 45, cx + 4, base - 95); ctx.stroke();
    ctx.strokeStyle = '#a9b38b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx + 6, base); ctx.quadraticCurveTo(cx, base - 50, cx + 8, base - 92); ctx.stroke();
    const capX = cx + 2, capY = base - 112;
    ctx.fillStyle = '#6e4774'; ctx.beginPath(); ctx.ellipse(capX, capY, 66, 40, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#b668a9'; ctx.beginPath(); ctx.ellipse(capX, capY - 4, 60, 34, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#d6c48e'; ctx.beginPath(); ctx.ellipse(capX, capY + 1, 66, 10, 0, 0, Math.PI); ctx.fill();
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = rgba(palette.accent || '#baff7c', 0.55 + rng() * 0.3);
      ctx.beginPath(); ctx.arc(capX - 45 + rng() * 90, capY - 28 + rng() * 27, 2 + rng() * 4, 0, TAU); ctx.fill();
    }
    orb(ctx, capX, capY - 10, 65, palette.accent || '#baff7c', 0.1);
    // little mushrooms at base
    for (let i = 0; i < 3; i++) { const x = cx - 30 + i * 29; ctx.fillStyle = '#d9d7b5'; ctx.fillRect(x, base - 13, 4, 13); ctx.fillStyle = '#9c5f9f'; ctx.beginPath(); ctx.ellipse(x + 2, base - 14, 9, 5, 0, Math.PI, TAU); ctx.fill(); }
  } else if (type === 'palm') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, 36, 10, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a5b36'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(cx, base); ctx.quadraticCurveTo(cx + 14, base - 75, cx + 2, base - 145); ctx.stroke();
    ctx.strokeStyle = '#b0884e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + 3, base); ctx.quadraticCurveTo(cx + 17, base - 75, cx + 5, base - 144); ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = -2.7 + i * 0.78;
      ctx.strokeStyle = leaf[i % leaf.length]; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(cx + 2, base - 143); ctx.quadraticCurveTo(cx + Math.cos(a) * 38, base - 168 + Math.sin(a) * 12, cx + Math.cos(a) * 58, base - 150 + Math.sin(a) * 26); ctx.stroke();
      ctx.strokeStyle = rgba(palette.accent, 0.3); ctx.lineWidth = 1.4; ctx.stroke();
    }
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx + 2, base - 140, 4, 0, TAU); ctx.fill();
  } else if (type === 'crystal' || type === 'obelisk') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, type === 'obelisk' ? 34 : 26, 8, 0, 0, TAU); ctx.fill();
    if (type === 'obelisk') {
      ctx.fillStyle = '#3e3a58'; path(ctx, [[cx - 18, base], [cx - 12, base - 110], [cx, base - 142], [cx + 12, base - 110], [cx + 18, base]]); ctx.fill();
      ctx.fillStyle = '#59537b'; path(ctx, [[cx - 8, base - 105], [cx, base - 136], [cx + 4, base - 105], [cx + 2, base]]); ctx.fill();
      ctx.strokeStyle = rgba(accent, 0.8); ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - 6, base - 95 + i * 18); ctx.lineTo(cx + 7, base - 101 + i * 18); ctx.lineTo(cx + 1, base - 87 + i * 18); ctx.stroke(); }
      orb(ctx, cx, base - 70, 35, accent, 0.15);
    } else {
      for (let i = 0; i < 5; i++) {
        const sx = cx - 35 + i * 17 + rng() * 8;
        const sh = 45 + rng() * 55;
        ctx.fillStyle = i % 2 ? palette.accent : shade(palette.accent, -30);
        path(ctx, [[sx - 9, base], [sx - 4, base - sh * 0.7], [sx, base - sh], [sx + 6, base - sh * 0.62], [sx + 10, base]]); ctx.fill();
        ctx.fillStyle = rgba('#ffffff', 0.18);
        path(ctx, [[sx, base - sh], [sx + 6, base - sh * 0.62], [sx + 2, base - 18]]); ctx.fill();
      }
      orb(ctx, cx, base - 48, 60, palette.accent, 0.13);
    }
  } else if (type === 'rock' || type === 'boulder' || type === 'ruins') {
    const count = type === 'boulder' ? 5 : type === 'ruins' ? 4 : 3;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, base, type === 'boulder' ? 58 : 36, 10, 0, 0, TAU); ctx.fill();
    if (type === 'ruins') {
      ctx.fillStyle = shade(rock, 10); ctx.fillRect(cx - 45, base - 63, 17, 63); ctx.fillRect(cx + 25, base - 48, 14, 48);
      ctx.fillStyle = shade(rock, -16); ctx.fillRect(cx - 22, base - 30, 52, 9);
      ctx.strokeStyle = rgba('#6d8b72', 0.3); ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - 40 + i * 24, base - 5); ctx.lineTo(cx - 34 + i * 24, base - 20); ctx.stroke(); }
    } else {
      for (let i = 0; i < count; i++) {
        const sx = cx - 38 + i * 22 + rng() * 10;
        const sw = 18 + rng() * 22;
        const sh = 16 + rng() * 31;
        ctx.fillStyle = i % 2 ? shade(rock, 8) : shade(rock, -8);
        path(ctx, [[sx - sw, base], [sx - sw * 0.7, base - sh * 0.7], [sx, base - sh], [sx + sw * 0.55, base - sh * 0.55], [sx + sw, base]]); ctx.fill();
        ctx.fillStyle = rgba('#e9e2d0', 0.12); path(ctx, [[sx, base - sh], [sx + sw * 0.55, base - sh * 0.55], [sx, base - sh * 0.35]]); ctx.fill();
      }
      if (rng() > 0.5) { ctx.fillStyle = rgba(accent, 0.5); ctx.beginPath(); ctx.arc(cx - 8, base - 12, 2, 0, TAU); ctx.fill(); }
    }
  } else if (type === 'grave') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, 27, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#595a5d'; roundedRect(ctx, cx - 17, base - 62, 34, 62, 14); ctx.fill();
    ctx.fillStyle = '#77787a'; roundedRect(ctx, cx - 13, base - 58, 20, 56, 11); ctx.fill();
    ctx.strokeStyle = rgba('#2f3438', 0.7); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, base - 45); ctx.lineTo(cx, base - 21); ctx.moveTo(cx - 8, base - 36); ctx.lineTo(cx + 8, base - 36); ctx.stroke();
    ctx.strokeStyle = rgba('#aebb9a', 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + 11, base - 10); ctx.quadraticCurveTo(cx + 17, base - 25, cx + 10, base - 36); ctx.stroke();
    ctx.fillStyle = '#3f443c'; ctx.fillRect(cx - 24, base - 3, 48, 3);
  } else if (type === 'cactus') {
    ctx.fillStyle = 'rgba(0,0,0,.17)'; ctx.beginPath(); ctx.ellipse(cx, base, 26, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5d7a49'; roundedRect(ctx, cx - 8, base - 90, 16, 90, 7); ctx.fill();
    ctx.fillStyle = '#7e9b5c'; roundedRect(ctx, cx - 25, base - 69, 12, 35, 6); ctx.fill(); roundedRect(ctx, cx + 14, base - 55, 12, 31, 6); ctx.fill();
    ctx.fillStyle = '#8ea868'; roundedRect(ctx, cx - 21, base - 47, 7, 13, 3); ctx.fill();
    ctx.strokeStyle = '#c4c98a'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(cx - 5 + (i % 2) * 9, base - 8 - i * 9); ctx.lineTo(cx - 7 + (i % 2) * 12, base - 10 - i * 9); ctx.stroke(); }
    ctx.fillStyle = palette.accent; ctx.beginPath(); ctx.arc(cx, base - 93, 4, 0, TAU); ctx.fill();
  } else if (type === 'fence') {
    ctx.strokeStyle = '#4f3a27'; ctx.lineWidth = 5;
    for (const x of [cx - 40, cx, cx + 40]) { ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - 39); ctx.stroke(); }
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 50, base - 22); ctx.lineTo(cx + 50, base - 22); ctx.moveTo(cx - 50, base - 9); ctx.lineTo(cx + 50, base - 9); ctx.stroke();
    ctx.strokeStyle = '#7d5b39'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 48, base - 23); ctx.lineTo(cx + 48, base - 23); ctx.stroke();
  } else if (type === 'barrel' || type === 'crate') {
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, base, 22, 6, 0, 0, TAU); ctx.fill();
    if (type === 'barrel') {
      ctx.fillStyle = '#61472c'; roundedRect(ctx, cx - 17, base - 43, 34, 43, 6); ctx.fill();
      ctx.fillStyle = '#7c5a35'; ctx.fillRect(cx - 13, base - 40, 9, 38);
      ctx.strokeStyle = '#3a3d3b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 18, base - 30); ctx.lineTo(cx + 18, base - 30); ctx.moveTo(cx - 18, base - 12); ctx.lineTo(cx + 18, base - 12); ctx.stroke();
    } else {
      ctx.fillStyle = '#6a4e2f'; ctx.fillRect(cx - 24, base - 42, 48, 42);
      ctx.strokeStyle = '#3d2b1b'; ctx.lineWidth = 2; ctx.strokeRect(cx - 24, base - 42, 48, 42);
      ctx.beginPath(); ctx.moveTo(cx - 24, base - 42); ctx.lineTo(cx + 24, base); ctx.moveTo(cx + 24, base - 42); ctx.lineTo(cx - 24, base); ctx.stroke();
    }
  } else if (type === 'anvil') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, 27, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4b3d34'; ctx.fillRect(cx - 9, base - 16, 18, 16);
    ctx.fillStyle = '#525558'; path(ctx, [[cx - 31, base - 34], [cx + 21, base - 34], [cx + 31, base - 26], [cx + 18, base - 19], [cx - 24, base - 20], [cx - 31, base - 27]]); ctx.fill();
    ctx.fillStyle = '#818387'; path(ctx, [[cx - 28, base - 33], [cx + 19, base - 33], [cx + 8, base - 28], [cx - 21, base - 28]]); ctx.fill();
    ctx.strokeStyle = rgba('#ff9a4d', 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 20, base - 31); ctx.lineTo(cx + 12, base - 31); ctx.stroke();
  } else if (type === 'stall') {
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, base, 65, 10, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5d4229'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx - 50, base); ctx.lineTo(cx - 50, base - 70); ctx.moveTo(cx + 50, base); ctx.lineTo(cx + 50, base - 70); ctx.stroke();
    ctx.fillStyle = '#7b5834'; ctx.fillRect(cx - 55, base - 32, 110, 12);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? accent : '#e8dfc8'; path(ctx, [[cx - 64 + i * 32, base - 70], [cx - 32 + i * 32, base - 70], [cx - 38 + i * 32, base - 93], [cx - 70 + i * 32, base - 93]]); ctx.fill(); }
    ctx.strokeStyle = '#57412a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 64, base - 93); ctx.lineTo(cx + 64, base - 93); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#b04b3e' : '#d1a24e'; ctx.beginPath(); ctx.arc(cx - 35 + i * 17, base - 38, 4, 0, TAU); ctx.fill(); }
  } else if (type === 'statue') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, 38, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5c5d61'; ctx.fillRect(cx - 34, base - 22, 68, 22); ctx.fillRect(cx - 26, base - 32, 52, 12);
    ctx.fillStyle = '#77797d'; roundedRect(ctx, cx - 14, base - 108, 28, 78, 6); ctx.fill();
    ctx.fillStyle = '#8d8f92'; ctx.beginPath(); ctx.arc(cx, base - 119, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6b6d70'; path(ctx, [[cx - 18, base - 101], [cx - 36, base - 68], [cx - 30, base - 64], [cx - 10, base - 89]]); ctx.fill();
    ctx.fillStyle = '#9a9c9e'; path(ctx, [[cx + 18, base - 100], [cx + 42, base - 138], [cx + 47, base - 132], [cx + 23, base - 89]]); ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.45); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 7, base - 92); ctx.lineTo(cx + 7, base - 92); ctx.stroke();
    ctx.fillStyle = rgba(accent, 0.35); ctx.fillRect(cx - 21, base - 8, 42, 2);
  } else if (type === 'waystone') {
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(cx, base, 40, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4f4e58'; ctx.beginPath(); ctx.moveTo(cx - 32, base); ctx.lineTo(cx - 24, base - 22); ctx.lineTo(cx + 24, base - 22); ctx.lineTo(cx + 32, base); ctx.fill();
    ctx.fillStyle = '#6d6a75'; ctx.beginPath(); ctx.moveTo(cx - 21, base - 20); ctx.lineTo(cx - 13, base - 132); ctx.lineTo(cx, base - 166); ctx.lineTo(cx + 14, base - 130); ctx.lineTo(cx + 20, base - 20); ctx.fill();
    ctx.fillStyle = '#87838f'; path(ctx, [[cx - 12, base - 130], [cx, base - 159], [cx + 4, base - 130], [cx + 3, base - 28], [cx - 5, base - 28]]); ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.9); ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - 5, base - 118 + i * 17); ctx.lineTo(cx + 8, base - 124 + i * 17); ctx.lineTo(cx + 2, base - 108 + i * 17); ctx.stroke(); }
    orb(ctx, cx, base - 88, 52, accent, 0.14);
    // floating shards
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + variant;
      const sx = cx + Math.cos(a) * 27, sy = base - 95 + Math.sin(a) * 17;
      ctx.fillStyle = rgba(accent, 0.75); path(ctx, [[sx, sy - 5], [sx + 4, sy], [sx, sy + 5], [sx - 3, sy]]); ctx.fill();
    }
    ctx.fillStyle = rgba(accent, 0.45); ctx.fillRect(cx - 26, base - 4, 52, 2);
  } else if (type === 'portal') {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, base, 55, 12, 0, 0, TAU); ctx.fill();
    // stair blocks
    ctx.fillStyle = '#5f554f'; ctx.fillRect(cx - 55, base - 10, 110, 10); ctx.fillStyle = '#776b61'; ctx.fillRect(cx - 43, base - 20, 86, 10);
    ctx.fillStyle = '#4a4240'; roundedRect(ctx, cx - 50, base - 150, 30, 132, 10); ctx.fill(); roundedRect(ctx, cx + 20, base - 150, 30, 132, 10); ctx.fill();
    ctx.fillStyle = '#655a56'; roundedRect(ctx, cx - 43, base - 142, 12, 116, 5); ctx.fill(); roundedRect(ctx, cx + 27, base - 142, 10, 116, 5); ctx.fill();
    ctx.strokeStyle = '#393336'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, base - 145, 48, Math.PI, TAU); ctx.stroke();
    const g = ctx.createRadialGradient(cx, base - 100, 4, cx, base - 100, 48);
    g.addColorStop(0, rgba(accent, 0.55)); g.addColorStop(0.6, rgba(accent, 0.2)); g.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, base - 92, 42, 68, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba('#08070d', 0.82); ctx.beginPath(); ctx.ellipse(cx, base - 90, 35, 58, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 7; i++) { const yy = base - 37 - i * 10; ctx.strokeStyle = rgba(accent, 0.14 + i * 0.025); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, base - 97, 20 + (i % 3) * 5, 4, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = rgba(accent, 0.55); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, base - 145, 48, Math.PI, TAU); ctx.stroke();
    for (let i = 0; i < 3; i++) { const a = variant + tSafe(i); ctx.fillStyle = rgba(accent, 0.55); ctx.fillRect(cx - 38 + i * 35, base - 159 - (i % 2) * 8, 3, 18); }
  } else if (type === 'campfire') {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(cx, base, 28, 7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4b3828'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - 19, base - 5); ctx.lineTo(cx + 18, base - 14); ctx.moveTo(cx + 18, base - 5); ctx.lineTo(cx - 18, base - 14); ctx.stroke();
    const g = ctx.createRadialGradient(cx, base - 24, 2, cx, base - 24, 34);
    g.addColorStop(0, 'rgba(255,238,155,.85)'); g.addColorStop(0.35, 'rgba(255,145,62,.4)'); g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, base - 24, 34, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb34c'; path(ctx, [[cx, base - 47], [cx + 12, base - 19], [cx, base - 7], [cx - 11, base - 21]]); ctx.fill();
    ctx.fillStyle = '#ffe6a1'; path(ctx, [[cx, base - 38], [cx + 5, base - 20], [cx, base - 13], [cx - 5, base - 22]]); ctx.fill();
  } else if (type === 'torch') {
    ctx.fillStyle = '#4a3525'; ctx.fillRect(cx - 3, base - 53, 6, 53);
    ctx.fillStyle = '#6d5138'; ctx.fillRect(cx - 4, base - 62, 8, 10);
    ctx.fillStyle = '#d6b15d'; ctx.fillRect(cx - 7, base - 65, 14, 4);
    const g = ctx.createRadialGradient(cx, base - 76, 1, cx, base - 76, 25); g.addColorStop(0, 'rgba(255,240,174,.9)'); g.addColorStop(1, 'rgba(255,140,50,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, base - 76, 25, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb54f'; path(ctx, [[cx, base - 89], [cx + 8, base - 73], [cx, base - 62], [cx - 7, base - 73]]); ctx.fill();
    ctx.fillStyle = '#fff0ad'; path(ctx, [[cx, base - 82], [cx + 3, base - 71], [cx, base - 67], [cx - 3, base - 71]]); ctx.fill();
  } else if (type === 'bones') {
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(cx, base, 28, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b7b09a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 22, base - 7); ctx.lineTo(cx + 18, base - 17); ctx.moveTo(cx - 17, base - 19); ctx.lineTo(cx + 20, base - 3); ctx.stroke();
    ctx.fillStyle = '#d6ceb4'; ctx.beginPath(); ctx.arc(cx + 14, base - 20, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2f2d28'; ctx.fillRect(cx + 11, base - 22, 2, 2); ctx.fillRect(cx + 17, base - 22, 2, 2);
  } else if (type === 'stump') {
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, base, 24, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#57402a'; ctx.fillRect(cx - 18, base - 24, 36, 24);
    ctx.fillStyle = '#8a6842'; ctx.beginPath(); ctx.ellipse(cx, base - 24, 18, 6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6d4f31'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, base - 24, 11, 3.5, 0, 0, TAU); ctx.stroke();
  } else if (type === 'banner') {
    ctx.strokeStyle = '#5f452c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, base); ctx.lineTo(cx, base - 117); ctx.stroke();
    ctx.fillStyle = palette.accent; path(ctx, [[cx + 2, base - 115], [cx + 26, base - 105], [cx + 23, base - 50], [cx + 11, base - 61], [cx + 2, base - 52]]); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,200,.7)'; path(ctx, [[cx + 8, base - 98], [cx + 16, base - 92], [cx + 8, base - 84], [cx + 13, base - 75], [cx + 8, base - 70]]); ctx.fill();
  } else if (['house', 'inn', 'forge', 'chapel', 'vault'].includes(type)) {
    drawBuilding(ctx, type, variant, palette, cx, base - 26, w, h, rng);
  }

  const sprite = { canvas, w, h, ax, ay, type };
  propCache.set(key, sprite);
  return sprite;
}

function tSafe(i) { return i * 1.7; }

function drawBuilding(ctx, type, variant, palette, cx, base, w, h, rng) {
  const wall = type === 'chapel' ? '#d8d4c0' : type === 'forge' ? '#665648' : '#c1a77f';
  const wallShade = type === 'chapel' ? '#aba793' : type === 'forge' ? '#493d34' : '#8e7556';
  const roof = type === 'forge' ? '#3b3130' : type === 'chapel' ? '#536477' : variant % 2 ? '#5d3b36' : '#3e5860';
  const roofLight = type === 'forge' ? '#5d4a45' : type === 'chapel' ? '#71869c' : variant % 2 ? '#80544b' : '#58767e';
  const accent = palette.accent || '#f3cf70';
  const hw = type === 'inn' ? 98 : type === 'forge' ? 100 : 86;
  const hh = 44;
  const wallH = type === 'chapel' ? 128 : type === 'forge' ? 92 : 90;
  const n = [cx, base - hh];
  const e = [cx + hw, base];
  const s = [cx, base + hh];
  const wpt = [cx - hw, base];
  const nT = [n[0], n[1] - wallH];
  const eT = [e[0], e[1] - wallH];
  const sT = [s[0], s[1] - wallH];
  const wT = [wpt[0], wpt[1] - wallH];
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.ellipse(cx, base + hh * 0.8, hw + 18, hh * 0.55, 0, 0, TAU); ctx.fill();
  // walls
  ctx.fillStyle = wallShade; path(ctx, [wpt, s, sT, wT]); ctx.fill();
  ctx.fillStyle = wall; path(ctx, [s, e, eT, sT]); ctx.fill();
  // stone base
  ctx.fillStyle = '#6d6257'; path(ctx, [[wpt[0], wpt[1] - 8], [s[0], s[1] - 8], [s[0], s[1]], [wpt[0], wpt[1]]]); ctx.fill();
  ctx.fillStyle = '#85796a'; path(ctx, [[s[0], s[1] - 8], [e[0], e[1] - 8], [e[0], e[1]], [s[0], s[1]]]); ctx.fill();
  // timber frames / masonry detail
  ctx.strokeStyle = type === 'forge' || type === 'chapel' ? 'rgba(48,46,43,.34)' : 'rgba(70,43,28,.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(wpt[0] + i * 22, wpt[1] - wallH + 8); ctx.lineTo(s[0] + i * 22, s[1] - wallH + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s[0] + i * 24, s[1] - wallH + 8); ctx.lineTo(e[0] + i * 20, e[1] - wallH + 8); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(46,32,23,.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(wpt[0] + 28, wpt[1] - wallH + 4); ctx.lineTo(wpt[0] + 28, wpt[1] - 8); ctx.moveTo(s[0] + 24, s[1] - wallH + 4); ctx.lineTo(s[0] + 24, s[1] - 8); ctx.stroke();
  // door
  const doorX = cx + 8, doorY = base + 8;
  ctx.fillStyle = '#3a281c'; path(ctx, [[doorX - 11, doorY], [doorX - 11, doorY - 42], [doorX, doorY - 51], [doorX + 12, doorY - 41], [doorX + 12, doorY]]); ctx.fill();
  ctx.fillStyle = '#6b4d32'; ctx.fillRect(doorX - 1, doorY - 44, 2, 44);
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(doorX + 7, doorY - 21, 1.5, 0, TAU); ctx.fill();
  // windows
  const winGlow = '#ffd67a';
  for (const [wx, wy, ww, wh] of [[doorX - 43, doorY - 46, 13, 18], [doorX + 31, doorY - 34, 14, 18], [cx - 30, base - 68, 12, 16]]) {
    ctx.fillStyle = '#3c2d21'; ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
    const gg = ctx.createLinearGradient(wx, wy, wx, wy + wh); gg.addColorStop(0, winGlow); gg.addColorStop(1, '#b86a35');
    ctx.fillStyle = gg; ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    orb(ctx, wx + ww / 2, wy + wh / 2, 22, '#ffbd62', 0.12);
  }
  // roof
  const roofH = type === 'chapel' ? 88 : type === 'forge' ? 56 : 64;
  const ridge = [cx, base - wallH - roofH - hh * 0.15];
  ctx.fillStyle = shade(roof, -12);
  path(ctx, [wpt, [wpt[0], wpt[1] - wallH], ridge, [s[0], s[1] - wallH]]); ctx.fill();
  ctx.fillStyle = roof;
  path(ctx, [s, [s[0], s[1] - wallH], ridge, [e[0], e[1] - wallH]]); ctx.fill();
  // roof edge shine / shingles
  ctx.strokeStyle = rgba(roofLight, 0.85); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(wT[0], wT[1]); ctx.lineTo(ridge[0], ridge[1]); ctx.lineTo(eT[0], eT[1]); ctx.stroke();
  ctx.strokeStyle = rgba('#1f1b1a', 0.28); ctx.lineWidth = 1;
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    ctx.beginPath(); ctx.moveTo(wpt[0] + (ridge[0] - wpt[0]) * t, wpt[1] - wallH + (ridge[1] - (wpt[1] - wallH)) * t); ctx.lineTo(ridge[0] + (eT[0] - ridge[0]) * t, ridge[1] + (eT[1] - ridge[1]) * t); ctx.stroke();
  }
  // roof overhang
  ctx.strokeStyle = shade(roof, -30); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(wpt[0] - 6, wpt[1] - wallH + 2); ctx.lineTo(ridge[0], ridge[1] - 2); ctx.lineTo(eT[0] + 6, eT[1]); ctx.stroke();
  // chimney
  if (type !== 'chapel' && type !== 'vault') {
    ctx.fillStyle = '#584d43'; ctx.fillRect(cx + 33, base - wallH - roofH + 9, 17, 34);
    ctx.fillStyle = '#332b27'; ctx.fillRect(cx + 31, base - wallH - roofH + 7, 21, 5);
    for (let i = 0; i < 3; i++) {
      const sy = base - wallH - roofH + 2 - i * 10 - (Date.now() * 0.01 % 1) * 2;
      ctx.fillStyle = `rgba(210,210,204,${0.12 - i * 0.025})`; ctx.beginPath(); ctx.arc(cx + 42 + Math.sin(i) * 3, sy, 6 + i * 4, 0, TAU); ctx.fill();
    }
  }
  if (type === 'forge') {
    // chimney stacks and furnace glow
    ctx.fillStyle = '#4b3d38'; ctx.fillRect(cx + 52, base - wallH - 39, 16, 50);
    ctx.fillStyle = '#2d2624'; ctx.fillRect(cx + 50, base - wallH - 42, 20, 5);
    orb(ctx, cx + 74, base + 2, 32, '#ff7a35', 0.2);
    ctx.strokeStyle = '#2d2724'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 34, base - 49); ctx.lineTo(cx - 18, base - 42); ctx.stroke();
    // anvil silhouette outside
    ctx.fillStyle = '#3d3a3b'; ctx.fillRect(cx + 57, base - 12, 23, 12); ctx.fillStyle = '#6b6766'; ctx.fillRect(cx + 52, base - 18, 33, 7);
  }
  if (type === 'chapel') {
    // spire
    const sx = cx - 52, sy = base - wallH - 6;
    ctx.fillStyle = '#c2bea8'; ctx.fillRect(sx - 3, sy - 88, 6, 88);
    ctx.fillStyle = accent; path(ctx, [[sx - 8, sy - 88], [sx, sy - 116], [sx + 8, sy - 88]]); ctx.fill();
    ctx.strokeStyle = '#f0dda0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy - 72); ctx.lineTo(sx, sy - 45); ctx.stroke();
    // circular window
    ctx.fillStyle = '#f5c76e'; ctx.beginPath(); ctx.arc(cx + 9, base - 58, 8, 0, TAU); ctx.fill(); ctx.strokeStyle = '#644025'; ctx.lineWidth = 1; ctx.stroke();
  }
  if (type === 'vault') {
    // heavy door + gold bands
    ctx.fillStyle = '#4b443b'; ctx.fillRect(cx + 7, base - 27, 31, 44);
    ctx.strokeStyle = '#b59551'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + 10, base - 17); ctx.lineTo(cx + 35, base - 17); ctx.moveTo(cx + 10, base - 6); ctx.lineTo(cx + 35, base - 6); ctx.stroke();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx + 23, base - 17, 3, 0, TAU); ctx.fill();
  }
  if (type === 'inn') {
    // hanging sign
    ctx.strokeStyle = '#4f3925'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + 62, base - 110); ctx.lineTo(cx + 80, base - 110); ctx.stroke();
    ctx.fillStyle = '#77532e'; roundedRect(ctx, cx + 66, base - 108, 25, 19, 3); ctx.fill();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx + 78, base - 99, 5, 0, TAU); ctx.fill();
  }
  if (type === 'house' && variant % 2 === 0) {
    // flower boxes
    for (const [fx, fy] of [[doorX - 43, doorY - 25], [doorX + 31, doorY - 13]]) {
      ctx.fillStyle = '#553b25'; ctx.fillRect(fx - 2, fy, 17, 4);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = palette.flowers?.[i % 3] || '#f0d67c'; ctx.fillRect(fx + 1 + i * 4, fy - 3, 2, 3); }
    }
  }
}
