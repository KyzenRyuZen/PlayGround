import { CLASSES, HAIR_COLORS, EYE_COLORS, OUTFITS } from '../data/classes.js';
import { tx } from '../core/i18n.js';
import { heroAppearance } from '../ui/heroArt.js';
import { WINGS } from '../data/items.js';
import { MOUNTS } from '../data/shop.js';
import { TAU } from '../core/utils.js';
import { icon } from '../ui/icons.js';

const rgba = (hex, a) => {
  const text = String(hex ?? '').trim();
  if (text.startsWith('rgb')) {
    const [r, g, b] = text.replace(/[^\d.,]/g, '').split(',').map(Number);
    return `rgba(${r || 0},${g || 0},${b || 0},${a})`;
  }
  const h = text.replace('#', '');
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return `rgba(${parseInt(n.slice(0, 2), 16) || 0},${parseInt(n.slice(2, 4), 16) || 0},${parseInt(n.slice(4, 6), 16) || 0},${a})`;
};
const alpha = (hex, a) => rgba(hex, a);
const colorParts = (value) => {
  const text = String(value ?? '').trim();
  if (text.startsWith('rgb')) {
    const [r, g, b] = text.replace(/[^\d.,]/g, '').split(',').map(Number);
    return [r || 0, g || 0, b || 0];
  }
  const h = text.replace('#', '');
  const n = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0];
};
const lighten = (hex, t) => {
  const [r, g, b] = colorParts(hex);
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`;
};
const darken = (hex, t) => {
  const [r, g, b] = colorParts(hex);
  return `rgb(${Math.round(r * (1 - t))},${Math.round(g * (1 - t))},${Math.round(b * (1 - t))})`;
};

export function drawShadow(ctx, x, y, rx, ry, alpha = 0.38) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(0.7, `rgba(0,0,0,${alpha * 0.45})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, TAU); ctx.fill(); ctx.restore();
}

function drawMount(ctx, mountId, t, moving, colors) {
  const m = MOUNTS[mountId] ?? MOUNTS.mount_wolf;
  const body = m.body, mane = m.mane, glow = m.glow;
  const step = moving ? Math.sin(t * 9) : Math.sin(t * 2) * 0.4;
  ctx.save();
  // legs
  ctx.strokeStyle = darken(body, 0.35); ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(s * 18, -22); ctx.lineTo(s * 20 + step * 6 * s, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 28, -22); ctx.lineTo(s * 30 - step * 6 * s, -2); ctx.stroke();
  }
  if (m.id === 'mount_stag') {
    // stag body
    const g = ctx.createLinearGradient(-36, -60, 36, -18);
    g.addColorStop(0, lighten(body, 0.25)); g.addColorStop(1, darken(body, 0.15));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -40, 42, 22, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(28, -62, 14, 18, 0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = mane; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(34, -74); ctx.lineTo(40, -100); ctx.moveTo(30, -76); ctx.lineTo(22, -98); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, -100); ctx.lineTo(48, -108); ctx.moveTo(40, -100); ctx.lineTo(38, -112); ctx.moveTo(22, -98); ctx.lineTo(14, -104); ctx.moveTo(22, -98); ctx.lineTo(20, -112); ctx.stroke();
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(33, -64, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = alpha(glow, 0.3); ctx.beginPath(); ctx.arc(0, -46, 30, 0, TAU); ctx.fill();
    ctx.fillStyle = mane; ctx.beginPath(); ctx.ellipse(-38, -46, 10, 14, 0.4, 0, TAU); ctx.fill();
  } else if (m.id === 'mount_nightmare') {
    // fiery horse
    const g = ctx.createLinearGradient(-40, -70, 40, -20);
    g.addColorStop(0, '#3a2336'); g.addColorStop(1, '#120a16');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -42, 44, 21, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1c1220'; ctx.beginPath(); ctx.moveTo(26, -48); ctx.lineTo(44, -76); ctx.lineTo(50, -56); ctx.lineTo(38, -34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(43, -66, 2.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = glow; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-38, -46); ctx.quadraticCurveTo(-52, -60, -44, -78); ctx.stroke();
    // flame mane
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) {
      const x = -30 + i * 9;
      const fg = ctx.createLinearGradient(x, -60, x, -96);
      fg.addColorStop(0, alpha(glow, 0.8)); fg.addColorStop(1, alpha(glow, 0));
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.moveTo(x, -58); ctx.quadraticCurveTo(x + Math.sin(t * 5 + i) * 6, -78, x + 3 + Math.sin(t * 4 + i) * 4, -96); ctx.lineTo(x + 7, -58); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  } else if (m.id === 'mount_drake') {
    // drake
    const g = ctx.createLinearGradient(-44, -70, 44, -20);
    g.addColorStop(0, '#6a3730'); g.addColorStop(1, '#2a1212');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -44, 46, 24, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a1a18'; ctx.beginPath(); ctx.moveTo(28, -50); ctx.lineTo(52, -66); ctx.lineTo(62, -52); ctx.lineTo(44, -34); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = alpha(glow, 0.5);
    ctx.beginPath(); ctx.moveTo(55, -58); ctx.quadraticCurveTo(68, -60, 72, -52); ctx.quadraticCurveTo(62, -50, 55, -54); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#e8c8a0'; ctx.beginPath(); ctx.moveTo(38, -64); ctx.lineTo(32, -82); ctx.lineTo(44, -68); ctx.fill();
    // wings
    const wg = ctx.createLinearGradient(-10, -70, -10, -20);
    wg.addColorStop(0, alpha(glow, 0.45)); wg.addColorStop(1, alpha('#2a1010', 0.1));
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.moveTo(-8, -54); ctx.bezierCurveTo(-36, -86, -66, -74, -62, -40); ctx.quadraticCurveTo(-44, -50, -40, -34); ctx.quadraticCurveTo(-30, -46, -8, -46); ctx.fill();
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(52, -58, 2.2, 0, TAU); ctx.fill();
  } else {
    // wolf / horse silhouette
    const g = ctx.createLinearGradient(-40, -64, 40, -18);
    g.addColorStop(0, lighten(body, 0.2)); g.addColorStop(0.6, body); g.addColorStop(1, darken(body, 0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -40, 42, 21, -0.05, 0, TAU); ctx.fill();
    ctx.fillStyle = darken(body, 0.1); ctx.beginPath(); ctx.ellipse(30, -58, 15, 16, 0.1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(36, -70); ctx.lineTo(42, -84); ctx.lineTo(48, -68); ctx.closePath(); ctx.fill();
    ctx.fillStyle = mane; ctx.beginPath(); ctx.ellipse(-14, -60, 18, 10, -0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = mane; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-38, -46); ctx.quadraticCurveTo(-56, -60, -54, -78); ctx.stroke();
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(36, -60, 2.4, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = alpha(glow, 0.2); ctx.beginPath(); ctx.ellipse(0, -58, 24, 8, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

function drawWorldWings(ctx, faction, t, color, scale = 1) {
  const flap = Math.sin(t * 2) * 0.08;
  ctx.save(); ctx.translate(0, -56); ctx.scale(scale, scale);
  for (const s of [-1, 1]) {
    ctx.save(); ctx.scale(s, 1); ctx.rotate(flap);
    const g = ctx.createLinearGradient(4, -18, 44, 26);
    g.addColorStop(0, rgba(color, 0.8)); g.addColorStop(1, rgba(color, 0.05));
    ctx.fillStyle = g;
    if (faction === 'angel') {
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(4, -8 + i * 3);
        ctx.bezierCurveTo(24, -40 + i * 10, 44, -18 + i * 11, 48, 18 + i * 8);
        ctx.bezierCurveTo(32, 10 + i * 6, 18, 4 + i * 4, 4, 2); ctx.closePath(); ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.moveTo(4, -10); ctx.bezierCurveTo(24, -34, 48, -18, 50, 20);
      ctx.bezierCurveTo(36, 16, 32, 4, 24, 12); ctx.bezierCurveTo(18, 26, 10, 16, 4, 4); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawWorldHero(ctx, player, x, y, time, opts = {}) {
  const app = heroAppearance(player);
  const colors = app.colors;
  const moving = opts.moving ?? false;
  const facing = opts.facing ?? 1;
  const mounted = Boolean(player.mount);
  const bob = moving ? Math.abs(Math.sin(time * 9)) * -2.4 : Math.sin(time * 2) * 1.4;
  drawShadow(ctx, x, y, 22, 8, 0.4);
  ctx.save();
  ctx.translate(x, y + bob);
  if (opts.combatGlow) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, -34, 4, 0, -34, 44);
    g.addColorStop(0, rgba(colors.glow, 0.18)); g.addColorStop(1, rgba(colors.glow, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -34, 44, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (player.wing) {
    const w = player.wing === 'wing_eternity' ? '#f4df9a' : player.wing === 'wing_void' ? '#c08cf0' : '#e3f2ff';
    drawWorldWings(ctx, player.faction, time, w, mounted ? 0.8 : 1);
  }
  if (mounted) drawMount(ctx, player.mount, time, moving, colors);
  ctx.scale(facing, 1);
  const mountLift = mounted ? -28 : 0;
  // legs
  const step = moving ? Math.sin(time * 10) * 3.5 : 0;
  ctx.fillStyle = colors.cloth2;
  ctx.beginPath(); ctx.roundRect(-9, -24 + mountLift, 7, 22, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(3, -24 + mountLift, 7, 22, 3); ctx.fill();
  ctx.fillStyle = player.classId === 'warrior' ? darken(colors.metal, 0.15) : darken(colors.leather, 0.2);
  ctx.beginPath(); ctx.roundRect(-11, -5 + mountLift, 10, 6, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(1, -5 + mountLift, 10, 6, 2); ctx.fill();
  // cape
  const cape = ctx.createLinearGradient(0, -60, 0, -8);
  cape.addColorStop(0, rgba(colors.cloth2, 0.95)); cape.addColorStop(1, rgba(darken(colors.cloth2, 0.5), 0.9));
  ctx.fillStyle = cape;
  ctx.beginPath(); ctx.moveTo(-15, -57 + mountLift); ctx.quadraticCurveTo(-24, -34 + mountLift, -18 + Math.sin(time * 3) * 2, -9 + mountLift); ctx.lineTo(18, -9 + mountLift); ctx.quadraticCurveTo(24, -36 + mountLift, 15, -57 + mountLift); ctx.closePath(); ctx.fill();
  // torso
  const tg = ctx.createLinearGradient(-18, -60 + mountLift, 18, -22 + mountLift);
  tg.addColorStop(0, lighten(colors.cloth, 0.2)); tg.addColorStop(0.6, colors.cloth); tg.addColorStop(1, darken(colors.cloth, 0.4));
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.moveTo(-15, -58 + mountLift); ctx.quadraticCurveTo(0, -66 + mountLift, 15, -58 + mountLift); ctx.lineTo(13, -28 + mountLift); ctx.quadraticCurveTo(0, -22 + mountLift, -13, -28 + mountLift); ctx.closePath(); ctx.fill();
  // armor trim / sash
  if (player.classId === 'warrior') {
    ctx.strokeStyle = rgba(colors.trim, 0.9); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-9, -56 + mountLift); ctx.lineTo(-4, -28 + mountLift); ctx.moveTo(9, -56 + mountLift); ctx.lineTo(4, -28 + mountLift); ctx.stroke();
    ctx.fillStyle = rgba(colors.metal, 0.8);
    ctx.beginPath(); ctx.moveTo(-12, -57 + mountLift); ctx.quadraticCurveTo(0, -62 + mountLift, 12, -57 + mountLift); ctx.lineTo(8, -44 + mountLift); ctx.quadraticCurveTo(0, -40 + mountLift, -8, -44 + mountLift); ctx.closePath(); ctx.fill();
  } else if (player.classId === 'mage') {
    ctx.fillStyle = rgba(colors.trim, 0.35);
    ctx.beginPath(); ctx.moveTo(-9, -56 + mountLift); ctx.lineTo(-4, -24 + mountLift); ctx.lineTo(0, -22 + mountLift); ctx.lineTo(4, -24 + mountLift); ctx.lineTo(9, -56 + mountLift); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(colors.glow, 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -58 + mountLift); ctx.lineTo(0, -26 + mountLift); ctx.stroke();
  } else {
    ctx.strokeStyle = rgba(colors.leather, 0.95); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-13, -56 + mountLift); ctx.lineTo(9, -30 + mountLift); ctx.stroke();
    ctx.strokeStyle = rgba(colors.trim, 0.6); ctx.lineWidth = 1;
    ctx.stroke();
  }
  // shoulders
  ctx.fillStyle = player.classId === 'warrior' ? colors.metal : player.classId === 'mage' ? colors.cloth2 : colors.leather;
  ctx.beginPath(); ctx.ellipse(-14, -56 + mountLift, 7, 5, 0.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, -56 + mountLift, 7, 5, -0.2, 0, TAU); ctx.fill();
  // arms
  ctx.strokeStyle = colors.skin; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  const armSwing = moving ? Math.sin(time * 10) * 2.5 : Math.sin(time * 2) * 0.8;
  ctx.beginPath(); ctx.moveTo(-14, -53 + mountLift); ctx.quadraticCurveTo(-20, -42 + mountLift, -18, -31 + mountLift + armSwing); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -53 + mountLift); ctx.quadraticCurveTo(20, -42 + mountLift, 18, -31 + mountLift - armSwing); ctx.stroke();
  // neck/head
  ctx.fillStyle = colors.skin;
  ctx.beginPath(); ctx.roundRect(-3.5, -67 + mountLift, 7, 8, 2); ctx.fill();
  const hg = ctx.createRadialGradient(-3, -77 + mountLift, 1, 0, -74 + mountLift, 13);
  hg.addColorStop(0, lighten(colors.skin, 0.15)); hg.addColorStop(1, darken(colors.skin, 0.15));
  ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, -73 + mountLift, 9, 10, 0, 0, TAU); ctx.fill();
  // eyes
  const eye = EYE_COLORS.find((e) => e.id === player.eyeColor)?.hex ?? '#e6b35c';
  ctx.fillStyle = eye; ctx.beginPath(); ctx.ellipse(-3.2, -73 + mountLift, 1.3, 1.6, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.2, -73 + mountLift, 1.3, 1.6, 0, 0, TAU); ctx.fill();
  // hair
  const hair = HAIR_COLORS.find((h) => h.id === player.hairColor)?.hex ?? '#1b1a20';
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(0, -79 + mountLift, 9.5, Math.PI, 0); ctx.fill();
  if (player.hair === 2) { ctx.beginPath(); ctx.roundRect(-11, -78 + mountLift, 5, 22, 2); ctx.fill(); ctx.beginPath(); ctx.roundRect(6, -78 + mountLift, 5, 22, 2); ctx.fill(); }
  if (player.hair === 3) { ctx.beginPath(); ctx.moveTo(7, -80 + mountLift); ctx.quadraticCurveTo(16, -66 + mountLift, 11, -50 + mountLift); ctx.lineTo(6, -60 + mountLift); ctx.closePath(); ctx.fill(); }
  if (player.hair === 4) { ctx.beginPath(); ctx.roundRect(-10, -68 + mountLift, 3.5, 18, 2); ctx.fill(); ctx.beginPath(); ctx.roundRect(6.5, -68 + mountLift, 3.5, 18, 2); ctx.fill(); }
  if (player.hair === 5) { ctx.beginPath(); ctx.arc(0, -90 + mountLift, 4.5, 0, TAU); ctx.fill(); }
  if (player.faction === 'demon') {
    ctx.strokeStyle = '#3a1a22'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -81 + mountLift); ctx.quadraticCurveTo(-10, -88 + mountLift, -8, -92 + mountLift); ctx.moveTo(6, -81 + mountLift); ctx.quadraticCurveTo(10, -88 + mountLift, 8, -92 + mountLift); ctx.stroke();
  } else {
    ctx.strokeStyle = rgba('#f8e8b0', 0.65); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, -87 + mountLift, 8, 1.8, 0, 0, TAU); ctx.stroke();
  }
  // weapon
  const metal = colors.metal;
  if (player.classId === 'warrior') {
    ctx.save(); ctx.translate(19, -42 + mountLift); ctx.rotate(0.15 + (opts.attackAnim ?? 0) * -1.2);
    ctx.fillStyle = '#4a3524'; ctx.fillRect(-1.5, -14, 3, 40);
    ctx.fillStyle = metal; ctx.beginPath(); ctx.moveTo(1, -16); ctx.bezierCurveTo(16, -20, 18, -2, 8, 3); ctx.bezierCurveTo(8, -6, 4, -11, 1, -12); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = colors.metal; ctx.beginPath(); ctx.ellipse(-18, -38 + mountLift, 7, 10, 0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(colors.trim, 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(-18, -38 + mountLift, 4, 6, 0.2, 0, TAU); ctx.stroke();
  } else if (player.classId === 'mage') {
    ctx.save(); ctx.translate(19, -42 + mountLift); ctx.rotate(0.08 + (opts.attackAnim ?? 0) * -0.6);
    ctx.fillStyle = '#4a3524'; ctx.fillRect(-1.5, -40, 3, 80);
    const og = ctx.createRadialGradient(0, -46, 1, 0, -46, 9);
    og.addColorStop(0, '#ffffff'); og.addColorStop(0.4, colors.glow); og.addColorStop(1, rgba(colors.glow, 0));
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(0, -46, 9, 0, TAU); ctx.fill();
    ctx.restore();
  } else {
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 19, -40 + mountLift); ctx.rotate(s * (0.3 + (opts.attackAnim ?? 0) * 0.5));
      ctx.fillStyle = '#3b2a24'; ctx.fillRect(-1, -4, 2, 8);
      const dg = ctx.createLinearGradient(0, -18, 0, -2);
      dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.6, metal); dg.addColorStop(1, darken(metal, 0.3));
      ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(2.4, -6); ctx.lineTo(0, -2); ctx.lineTo(-2.4, -6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
  // pet
  if (player.pet) drawPet(ctx, player.pet, x, y, time);
  // weapon fx
  if (player.fx) {
    const fxColor = player.fx === 'fx_frost' ? '#9fe8ff' : player.fx === 'fx_void' ? '#c08cf0' : '#ff8a5c';
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const a = time * 2 + i;
      ctx.fillStyle = rgba(fxColor, 0.2);
      ctx.beginPath(); ctx.arc(x + facing * 20 + Math.cos(a) * 7, y - 38 + Math.sin(a * 1.3) * 10, 1.5 + (i % 2), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

export function drawPet(ctx, petId, x, y, t) {
  const map = { pet_wisp: { c: '#b9e6ff' }, pet_raven: { c: '#8d7bc4' }, pet_imp: { c: '#ff8a5c' } };
  const c = map[petId]?.c ?? '#b9e6ff';
  const px = x - 26 + Math.cos(t * 1.4) * 5;
  const py = y - 58 + Math.sin(t * 2) * 4;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(px, py, 1, px, py, 9);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, rgba(c, 0.8)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill();
  ctx.restore();
  if (petId === 'pet_raven') {
    ctx.fillStyle = '#2a2438';
    ctx.beginPath(); ctx.ellipse(px, py, 5, 3.4, -0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 4, py - 2, 2.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8a45c'; ctx.beginPath(); ctx.moveTo(px + 6, py - 2); ctx.lineTo(px + 9, py - 1); ctx.lineTo(px + 6, py + 0.5); ctx.fill();
    ctx.fillStyle = rgba(c, 0.9); ctx.beginPath(); ctx.arc(px + 4.7, py - 2.4, 0.7, 0, TAU); ctx.fill();
  } else if (petId === 'pet_imp') {
    ctx.fillStyle = '#c25b3a'; ctx.beginPath(); ctx.ellipse(px, py, 5, 5.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8f3b2a'; ctx.beginPath(); ctx.moveTo(px - 4, py - 4); ctx.lineTo(px - 7, py - 9); ctx.lineTo(px - 1, py - 6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(px + 4, py - 4); ctx.lineTo(px + 7, py - 9); ctx.lineTo(px + 1, py - 6); ctx.fill();
    ctx.fillStyle = '#ffe0a0'; ctx.beginPath(); ctx.arc(px - 2, py - 1, 0.9, 0, TAU); ctx.arc(px + 2, py - 1, 0.9, 0, TAU); ctx.fill();
  } else {
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, 2, 0, TAU); ctx.fill();
  }
}

export function drawNPC(ctx, npc, t) {
  const x = npc.x, y = npc.y;
  drawShadow(ctx, x, y, 17, 6, 0.35);
  ctx.save(); ctx.translate(x, y);
  const bob = Math.sin(t * 1.6 + (npc.index ?? 0)) * 1.3;
  // robe
  const rg = ctx.createLinearGradient(0, -62, 0, 0);
  rg.addColorStop(0, npc.robe); rg.addColorStop(1, darken(npc.robe, 0.55));
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(-20, -34, -8, -58); ctx.lineTo(8, -58); ctx.quadraticCurveTo(20, -34, 16, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(npc.accent, 0.6); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(0, -4); ctx.stroke();
  ctx.fillStyle = rgba(npc.accent, 0.85); ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(4, -12); ctx.lineTo(0, -6); ctx.lineTo(-4, -12); ctx.closePath(); ctx.fill();
  // hood
  ctx.fillStyle = darken(npc.robe, 0.25);
  ctx.beginPath(); ctx.moveTo(-13, -54 + bob); ctx.quadraticCurveTo(-14, -74 + bob, 0, -76 + bob); ctx.quadraticCurveTo(14, -74 + bob, 13, -54 + bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a1518'; ctx.beginPath(); ctx.ellipse(0, -61 + bob, 8, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = npc.accent; ctx.beginPath(); ctx.arc(-3, -62 + bob, 1, 0, TAU); ctx.arc(3, -62 + bob, 1, 0, TAU); ctx.fill();
  // staff
  ctx.strokeStyle = '#5a4330'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(17, -2); ctx.lineTo(20, -70 + bob); ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const lg = ctx.createRadialGradient(20, -72 + bob, 1, 20, -72 + bob, 10);
  lg.addColorStop(0, '#fff6d0'); lg.addColorStop(0.4, rgba(npc.accent, 0.6)); lg.addColorStop(1, rgba(npc.accent, 0));
  ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(20, -72 + bob, 10, 0, TAU); ctx.fill(); ctx.restore();
  // quest marker
  if (npc.marker === 'quest') {
    const my = -92 + Math.sin(t * 2.5) * 3;
    ctx.fillStyle = '#f2d27a'; ctx.font = 'bold 17px Georgia'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(242,210,122,.8)'; ctx.shadowBlur = 10;
    ctx.fillText('!', 0, my);
    ctx.shadowBlur = 0;
  } else if (npc.marker === 'done') {
    const my = -92 + Math.sin(t * 2.5) * 3;
    ctx.fillStyle = '#8ce07a'; ctx.font = 'bold 17px Georgia'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(140,224,122,.8)'; ctx.shadowBlur = 10;
    ctx.fillText('?', 0, my); ctx.shadowBlur = 0;
  }
  ctx.restore();
}

export function drawDecoration(ctx, d, t) {
  const { x, y, scale } = d;
  if (d.type === 'campfire') {
    drawShadow(ctx, x, y, 24, 8, 0.35);
    ctx.fillStyle = '#2a211b';
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 17 * scale, y + Math.sin(a) * 7 * scale, 7 * scale, 3.5 * scale, a, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const glow = d.spectral ? '#9fe8ff' : '#ff9a4a';
    const g = ctx.createRadialGradient(x, y - 18 * scale, 2, x, y - 18 * scale, 60 * scale);
    g.addColorStop(0, rgba('#fff0c0', 0.55)); g.addColorStop(0.35, rgba(glow, 0.25)); g.addColorStop(1, rgba(glow, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 18 * scale, 60 * scale, 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const w = (8 - i * 2) * scale;
      const fg = ctx.createLinearGradient(x, y, x, y - 38 * scale);
      fg.addColorStop(0, rgba(glow, 0.8)); fg.addColorStop(1, rgba('#fff0a0', 0));
      ctx.fillStyle = fg;
      const sway = Math.sin(t * 6 + i * 2) * 3 * scale;
      ctx.beginPath(); ctx.moveTo(x - w, y - 2); ctx.quadraticCurveTo(x - w + sway, y - 24 * scale, x + sway, y - (34 + i * 4) * scale); ctx.quadraticCurveTo(x + w + sway, y - 20 * scale, x + w, y - 2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  } else if (d.type === 'tent') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    const g = ctx.createLinearGradient(-52, -70, 52, 0);
    g.addColorStop(0, '#4a4036'); g.addColorStop(0.5, '#6a5540'); g.addColorStop(1, '#2a231c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(0, -72); ctx.lineTo(58, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(217,183,106,.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, -72); ctx.lineTo(0, 0); ctx.moveTo(-35, -30); ctx.lineTo(35, -30); ctx.stroke();
    ctx.fillStyle = '#171310'; ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(0, -52); ctx.lineTo(17, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2c22'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -78); ctx.lineTo(0, -66); ctx.stroke();
    ctx.fillStyle = '#c8a45c'; ctx.beginPath(); ctx.moveTo(0, -84); ctx.lineTo(5, -76); ctx.lineTo(0, -70); ctx.lineTo(-5, -76); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (d.type === 'banner') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#3a2c22'; ctx.fillRect(-2, -86, 4, 86);
    ctx.fillStyle = d.color ?? '#b64b45';
    ctx.beginPath(); ctx.moveTo(2, -82); ctx.lineTo(32, -76); ctx.lineTo(27, -54); ctx.lineTo(32, -32); ctx.lineTo(2, -38); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(244,227,176,.6)';
    ctx.beginPath(); ctx.moveTo(16, -68); ctx.lineTo(20, -59); ctx.lineTo(16, -48); ctx.lineTo(12, -59); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (d.type === 'crate') {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#4a3828'; ctx.fillRect(-15, -22, 30, 22);
    ctx.strokeStyle = '#7a5c3a'; ctx.lineWidth = 2; ctx.strokeRect(-15, -22, 30, 22);
    ctx.beginPath(); ctx.moveTo(-15, -22); ctx.lineTo(15, 0); ctx.moveTo(15, -22); ctx.lineTo(-15, 0); ctx.stroke();
    ctx.restore();
  }
}

export function drawPortal(ctx, portal, t, camp) {
  const { x, y } = portal;
  drawShadow(ctx, x, y, 46, 14, 0.4);
  ctx.save();
  ctx.translate(x, y);
  // stone arch
  ctx.strokeStyle = '#5a5060'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.ellipse(0, -48, 38, 48, 0, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#8a7f90'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, -48, 38, 48, 0, Math.PI, 0); ctx.stroke();
  // portal surface
  const g = ctx.createRadialGradient(0, -48, 3, 0, -48, 38);
  g.addColorStop(0, 'rgba(255,244,210,.55)'); g.addColorStop(0.35, 'rgba(217,183,106,.22)'); g.addColorStop(0.7, 'rgba(140,120,200,.16)'); g.addColorStop(1, 'rgba(80,60,140,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -48, 34, 45, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba('#f4e3b0', 0.6); ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, -48, 24 - i * 6, 40 - i * 9, 0, 0, TAU); ctx.stroke(); }
  for (let i = 0; i < 8; i++) {
    const a = t * 0.6 + (i / 8) * TAU;
    ctx.fillStyle = rgba('#f4e3b0', 0.7);
    ctx.beginPath(); ctx.arc(Math.cos(a) * 30, -48 + Math.sin(a) * 40, 1.8, 0, TAU); ctx.fill();
  }
  // label
  if (portal.label) {
    const label = tx(portal.label);
    ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
    const lw = Math.max(96, ctx.measureText(label).width + 18);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRectLocal(ctx, -lw / 2, 8, lw, 18, 3); ctx.fill();
    ctx.fillStyle = '#e9dcc0';
    ctx.fillText(label, 0, 21, lw - 10);
  }
  ctx.restore();
}

function roundRectLocal(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function drawGatherNode(ctx, node, t) {
  const { x, y, def } = node;
  drawShadow(ctx, x, y, 18, 6, 0.32);
  ctx.save(); ctx.translate(x, y);
  if (!node.ready) {
    ctx.fillStyle = 'rgba(50,45,38,.7)';
    ctx.beginPath(); ctx.ellipse(0, -4, 12, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120,105,80,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-2, -16); ctx.moveTo(4, -4); ctx.lineTo(6, -14); ctx.stroke();
    ctx.restore(); return;
  }
  const pulse = 0.6 + Math.sin(t * 2 + node.phase) * 0.25;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, -14, 1, 0, -14, 34);
  g.addColorStop(0, rgba(def.glow, 0.35 * pulse)); g.addColorStop(1, rgba(def.glow, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -14, 34, 0, TAU); ctx.fill(); ctx.restore();
  if (node.def.shape === 'herb') {
    ctx.strokeStyle = '#4a7a3a'; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = -1.2 + i * 0.5;
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(Math.cos(a) * 12, -18, Math.cos(a) * 22, -30 + Math.sin(a) * 4); ctx.stroke();
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 18, -24, 4, 2.5, a, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = def.glow; ctx.beginPath(); ctx.arc(0, -18, 2.5, 0, TAU); ctx.fill();
  } else if (node.def.shape === 'mushroom') {
    ctx.fillStyle = '#d8ccb0'; ctx.fillRect(-2, -16, 4, 16);
    const cg = ctx.createRadialGradient(-2, -20, 1, 0, -18, 14);
    cg.addColorStop(0, lighten(def.color, 0.4)); cg.addColorStop(1, darken(def.color, 0.3));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(0, -17, 14, 8, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = rgba('#eaffb0', 0.7); ctx.beginPath(); ctx.arc(-4, -20, 1.6, 0, TAU); ctx.arc(4, -21, 1.3, 0, TAU); ctx.fill();
  } else if (node.def.shape === 'bones') {
    ctx.strokeStyle = def.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(8, -12); ctx.moveTo(-6, -12); ctx.lineTo(10, -4); ctx.stroke();
    ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(11, -10, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1612'; ctx.beginPath(); ctx.arc(10, -11, 1.2, 0, TAU); ctx.arc(13, -11, 1.2, 0, TAU); ctx.fill();
  } else {
    // crystal / ore
    for (let i = 0; i < 3; i++) {
      const h = 18 + i * 9, ox = (i - 1) * 7;
      const cg = ctx.createLinearGradient(ox, -h, ox + 5, 0);
      cg.addColorStop(0, lighten(def.color, 0.55)); cg.addColorStop(0.5, def.color); cg.addColorStop(1, darken(def.color, 0.4));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox + 4, -h); ctx.lineTo(ox + 9, -h + 5); ctx.lineTo(ox + 8, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba('#fff', 0.3); ctx.lineWidth = 0.7; ctx.stroke();
    }
    ctx.fillStyle = 'rgba(30,26,20,.6)'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 4, 0, 0, TAU); ctx.fill();
  }
  // sparkles
  for (let i = 0; i < 3; i++) {
    const a = t * 0.8 + i * 2.1;
    ctx.fillStyle = rgba(def.glow, 0.5 + Math.sin(a) * 0.2);
    ctx.beginPath(); ctx.arc(Math.cos(a) * 16, -18 + Math.sin(a * 1.3) * 10, 1.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

export function drawLoot(ctx, loot, t) {
  const { x, y } = loot;
  const bob = Math.sin(t * 3 + (loot.phase ?? 0)) * 3;
  const color = loot.color ?? '#d9b76a';
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x, y - 46, x, y);
  g.addColorStop(0, rgba(color, 0)); g.addColorStop(0.7, rgba(color, 0.22)); g.addColorStop(1, rgba(color, 0.05));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x, y - 52); ctx.lineTo(x + 7, y); ctx.closePath(); ctx.fill();
  const cg = ctx.createRadialGradient(x, y - 8 + bob, 1, x, y - 8 + bob, 16);
  cg.addColorStop(0, rgba('#ffffff', 0.6)); cg.addColorStop(0.4, rgba(color, 0.5)); cg.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(x, y - 8 + bob, 16, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(x, y - 8 + bob);
  if (loot.type === 'gold') {
    ctx.fillStyle = '#d9b76a'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a6c36'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#f4e3b0'; ctx.font = 'bold 8px Georgia'; ctx.textAlign = 'center'; ctx.fillText('G', 0, 3);
  } else if (loot.type === 'gem') {
    ctx.fillStyle = '#8fd8ee'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, -2); ctx.lineTo(0, 9); ctx.lineTo(-7, -2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#dff6ff'; ctx.lineWidth = 1; ctx.stroke();
  } else if (loot.type === 'stone') {
    ctx.fillStyle = '#2a1e2e'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
  } else {
    // item chest/gem shape tinted by rarity
    ctx.fillStyle = 'rgba(10,10,14,.85)'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, 0); ctx.lineTo(0, 9); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(3, 0); ctx.lineTo(0, 3); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawInteractRing(ctx, x, y, t) {
  const pulse = 0.5 + Math.sin(t * 3) * 0.2;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.4);
  ctx.strokeStyle = `rgba(244,227,176,${pulse})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 24 + Math.sin(t * 2) * 2, 0, TAU); ctx.stroke();
  ctx.restore();
}
