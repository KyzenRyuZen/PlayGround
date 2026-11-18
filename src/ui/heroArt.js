import { CLASSES, HAIR_COLORS, EYE_COLORS, OUTFITS } from '../data/classes.js';

const TAU = Math.PI * 2;
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
};
const rgba = (hex, a) => { const c = hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; };
const mix = (hex, hex2, t) => {
  const a = hexToRgb(hex), b = hexToRgb(hex2);
  const r = Math.round(a.r + (b.r - a.r) * t), g = Math.round(a.g + (b.g - a.g) * t), bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
};
const lighten = (hex, t) => mix(hex, '#ffffff', t);
const darken = (hex, t) => mix(hex, '#000000', t);

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWings(ctx, faction, t, color, alpha = 1) {
  const flap = Math.sin(t * 1.3) * 0.05;
  ctx.save();
  ctx.translate(150, 170);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.rotate(flap * side);
    if (faction === 'angel') {
      const g = ctx.createLinearGradient(10, -30, 110, 90);
      g.addColorStop(0, rgba(color, 0.85 * alpha));
      g.addColorStop(0.5, rgba('#d9e9ff', 0.65 * alpha));
      g.addColorStop(1, rgba('#7f9fc8', 0.1 * alpha));
      ctx.fillStyle = g;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(8, -18 + i * 3);
        ctx.bezierCurveTo(55, -60 + i * 8, 105 - i * 8, -28 + i * 14, 118 - i * 10, 38 + i * 14);
        ctx.bezierCurveTo(82, 24 + i * 13, 44, 16 + i * 10, 8, 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = rgba('#f0f6ff', 0.22 * alpha);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    } else {
      const g = ctx.createLinearGradient(10, -20, 110, 80);
      g.addColorStop(0, rgba(color, 0.8 * alpha));
      g.addColorStop(0.6, rgba('#5b2131', 0.75 * alpha));
      g.addColorStop(1, rgba('#1b0d16', 0.2 * alpha));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(6, -20);
      ctx.bezierCurveTo(55, -62, 112, -36, 122, 32);
      ctx.bezierCurveTo(98, 46, 88, 22, 70, 30);
      ctx.bezierCurveTo(62, 54, 48, 40, 38, 30);
      ctx.bezierCurveTo(30, 48, 16, 34, 6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(color, 0.55 * alpha);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, -12); ctx.lineTo(92, 10);
      ctx.moveTo(16, 4); ctx.lineTo(78, 24);
      ctx.strokeStyle = rgba('#e7a4a0', 0.25 * alpha);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawAxe(ctx, x, y, angle, scale, colors) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  const g = ctx.createLinearGradient(-4, 0, 5, 0);
  g.addColorStop(0, '#4a3524'); g.addColorStop(0.5, '#8f6a43'); g.addColorStop(1, '#3b2a1b');
  ctx.fillStyle = g; roundRect(ctx, -3, -35, 6, 72, 3); ctx.fill();
  const blade = ctx.createLinearGradient(-24, -30, 18, -4);
  blade.addColorStop(0, lighten(colors.metal, 0.5)); blade.addColorStop(0.5, colors.metal); blade.addColorStop(1, darken(colors.metal, 0.4));
  ctx.fillStyle = blade;
  ctx.beginPath(); ctx.moveTo(2, -36); ctx.bezierCurveTo(26, -34, 36, -8, 24, 2); ctx.bezierCurveTo(18, -10, 10, -18, 2, -20); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-2, -36); ctx.bezierCurveTo(-26, -34, -36, -8, -24, 2); ctx.bezierCurveTo(-18, -10, -10, -18, -2, -20); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(colors.accent, 0.95); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(2, -33); ctx.lineTo(-4, -38); ctx.lineTo(2, -42); ctx.lineTo(8, -38); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

function drawStaff(ctx, x, y, angle, colors, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  const g = ctx.createLinearGradient(-3, 0, 4, 0);
  g.addColorStop(0, '#3a2b20'); g.addColorStop(0.5, '#8a6844'); g.addColorStop(1, '#2b1f17');
  ctx.fillStyle = g; roundRect(ctx, -3, -90, 6, 170, 3); ctx.fill();
  ctx.strokeStyle = rgba(colors.accent, 0.7); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, 60); ctx.bezierCurveTo(10, 30, -10, 10, 0, -20); ctx.stroke();
  const orb = ctx.createRadialGradient(0, -96, 2, 0, -96, 20);
  orb.addColorStop(0, '#ffffff'); orb.addColorStop(0.25, lighten(colors.glow, 0.4)); orb.addColorStop(0.65, colors.glow); orb.addColorStop(1, rgba(colors.glow, 0));
  ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(0, -96, 20, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(colors.metal, 0.9); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -96, 13, 0, TAU); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = t * 0.8 + (i * TAU) / 4;
    ctx.fillStyle = rgba(lighten(colors.glow, 0.5), 0.8);
    ctx.beginPath(); ctx.arc(Math.cos(a) * 22, -96 + Math.sin(a) * 22, 1.6, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawDagger(ctx, x, y, angle, colors, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(dir, 1);
  ctx.fillStyle = '#3b2a24'; roundRect(ctx, -2, -6, 4, 16, 2); ctx.fill();
  const g = ctx.createLinearGradient(0, -34, 0, -4);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, lighten(colors.metal, 0.25)); g.addColorStop(1, darken(colors.metal, 0.2));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(5, -12); ctx.lineTo(0, -4); ctx.lineTo(-5, -12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(colors.accent, 0.85); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(6, -7); ctx.stroke();
  ctx.restore();
}

function drawShield(ctx, x, y, colors) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.08);
  const g = ctx.createLinearGradient(-24, -40, 24, 40);
  g.addColorStop(0, lighten(colors.metal, 0.35)); g.addColorStop(0.5, colors.metal); g.addColorStop(1, darken(colors.metal, 0.45));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, -42); ctx.bezierCurveTo(26, -34, 28, -18, 24, 8); ctx.bezierCurveTo(18, 33, 6, 42, 0, 46); ctx.bezierCurveTo(-6, 42, -18, 33, -24, 8); ctx.bezierCurveTo(-28, -18, -26, -34, 0, -42); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(colors.accent, 0.85); ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = rgba(colors.cloth, 0.75);
  ctx.beginPath(); ctx.moveTo(0, -34); ctx.bezierCurveTo(18, -28, 20, -14, 16, 6); ctx.bezierCurveTo(10, 25, 4, 33, 0, 36); ctx.bezierCurveTo(-4, 33, -10, 25, -16, 6); ctx.bezierCurveTo(-20, -14, -18, -28, 0, -34); ctx.fill();
  ctx.strokeStyle = rgba(colors.glow, 0.9); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(4, -4); ctx.lineTo(0, 10); ctx.lineTo(-4, -4); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

function drawFace(ctx, cx, cy, o, colors, t) {
  const eye = EYE_COLORS.find((e) => e.id === o.eyeColor)?.hex ?? '#e6b35c';
  const skin = colors.skin, skinShade = darken(skin, 0.22), skinLight = lighten(skin, 0.16);
  // neck
  ctx.fillStyle = skinShade;
  roundRect(ctx, cx - 9, cy + 24, 18, 22, 6); ctx.fill();
  // head
  const g = ctx.createLinearGradient(cx - 22, cy - 24, cx + 20, cy + 26);
  g.addColorStop(0, skinLight); g.addColorStop(0.55, skin); g.addColorStop(1, skinShade);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 8);
  ctx.bezierCurveTo(cx - 24, cy - 32, cx + 24, cy - 34, cx + 21, cy - 8);
  ctx.bezierCurveTo(cx + 20, cy + 8, cx + 12, cy + 24, cx, cy + 27);
  ctx.bezierCurveTo(cx - 13, cy + 24, cx - 22, cy + 8, cx - 20, cy - 8);
  ctx.closePath(); ctx.fill();
  // ears
  ctx.fillStyle = skinShade;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * 21, cy + 4, 4, 7, s * 0.2, 0, TAU); ctx.fill(); }
  // eyes
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + s * 8.5, cy + 3);
    ctx.fillStyle = '#f4eee6';
    ctx.beginPath(); ctx.ellipse(0, 0, 5.4, 3.2, 0, 0, TAU); ctx.fill();
    const ig = ctx.createRadialGradient(0, 0, 0.3, 0, 0, 3.4);
    ig.addColorStop(0, '#ffffff'); ig.addColorStop(0.25, eye); ig.addColorStop(1, darken(eye, 0.55));
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(0, 0.2, 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0c0b10'; ctx.beginPath(); ctx.arc(0, 0.3, 1.05, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(-0.8, -0.7, 0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = skinShade; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-6, -4.6); ctx.quadraticCurveTo(0, -6.8, 6, -4.4); ctx.stroke();
    ctx.restore();
  }
  // brows
  ctx.strokeStyle = darken(colors.hair, 0.2); ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 14, cy - 5.5); ctx.quadraticCurveTo(cx + s * 8, cy - 8, cx + s * 3, cy - 6.2); ctx.stroke(); }
  // nose + mouth
  ctx.strokeStyle = rgba(skinShade, 0.8); ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(cx + 0.5, cy + 6); ctx.quadraticCurveTo(cx - 2, cy + 13, cx + 2, cy + 14); ctx.stroke();
  ctx.strokeStyle = rgba('#7d3f45', 0.85); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 4.5, cy + 19.5); ctx.quadraticCurveTo(cx, cy + 21.5, cx + 4.5, cy + 19); ctx.stroke();
  // faction marks
  if (o.faction === 'demon') {
    ctx.strokeStyle = rgba('#f0c98a', 0.35); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy + 8); ctx.lineTo(cx - 6, cy + 8.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 12, cy + 8); ctx.lineTo(cx + 6, cy + 8.5); ctx.stroke();
  }
}

function drawHairBack(ctx, cx, cy, o, colors, t) {
  const h = o.hair;
  const hair = colors.hair, hi = lighten(hair, 0.2), dk = darken(hair, 0.3);
  const sway = Math.sin(t * 1.5) * 1.4;
  ctx.fillStyle = hair;
  if (h === 2) {
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 18);
    ctx.bezierCurveTo(cx - 38, cy + 40 + sway, cx - 30, cy + 82, cx - 20, cy + 96);
    ctx.bezierCurveTo(cx - 6, cy + 80, cx - 8, cy + 30, cx - 10, cy - 4);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 24, cy - 18);
    ctx.bezierCurveTo(cx + 38, cy + 38 - sway, cx + 32, cy + 80, cx + 22, cy + 94);
    ctx.bezierCurveTo(cx + 8, cy + 78, cx + 10, cy + 30, cx + 10, cy - 4);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(hi, 0.35); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 30, cy + 10); ctx.bezierCurveTo(cx - 28, cy + 45, cx - 24, cy + 68, cx - 18, cy + 82); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 30, cy + 10); ctx.bezierCurveTo(cx + 28, cy + 45, cx + 26, cy + 66, cx + 20, cy + 80); ctx.stroke();
  } else if (h === 3) {
    ctx.beginPath();
    ctx.moveTo(cx + 14, cy - 14);
    ctx.bezierCurveTo(cx + 36, cy - 2, cx + 46, cy + 30, cx + 34, cy + 70 + sway);
    ctx.bezierCurveTo(cx + 30, cy + 38, cx + 22, cy + 24, cx + 12, cy + 16);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(hi, 0.4); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx + 26, cy + 4); ctx.bezierCurveTo(cx + 38, cy + 26, cx + 38, cy + 48, cx + 33, cy + 62); ctx.stroke();
  } else if (h === 4) {
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(cx + s * 18, cy + 6);
      ctx.strokeStyle = hair; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(6, 24, -4, 40, 3, 58 + sway); ctx.stroke();
      ctx.strokeStyle = rgba(hi, 0.35); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(2, 22, -1, 38, 2, 50); ctx.stroke();
      ctx.restore();
    }
  } else if (h === 5) {
    ctx.beginPath(); ctx.arc(cx + 2, cy - 34, 14, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(hi, 0.4); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx + 2, cy - 34, 10, 0.4, 2.8); ctx.stroke();
  }
}

function drawHairFront(ctx, cx, cy, o, colors, t) {
  const h = o.hair;
  const hair = colors.hair, hi = lighten(hair, 0.25), dk = darken(hair, 0.3);
  const g = ctx.createLinearGradient(cx - 24, cy - 30, cx + 24, cy - 2);
  g.addColorStop(0, hi); g.addColorStop(0.35, hair); g.addColorStop(1, dk);
  ctx.fillStyle = g;
  ctx.beginPath();
  if (h === 6) {
    ctx.moveTo(cx - 24, cy - 6);
    ctx.bezierCurveTo(cx - 28, cy - 28, cx - 10, cy - 38, cx - 2, cy - 31);
    ctx.bezierCurveTo(cx + 4, cy - 41, cx + 18, cy - 36, cx + 20, cy - 25);
    ctx.bezierCurveTo(cx + 26, cy - 34, cx + 34, cy - 22, cx + 23, cy - 4);
    ctx.bezierCurveTo(cx + 22, cy - 14, cx + 14, cy - 18, cx + 7, cy - 12);
    ctx.bezierCurveTo(cx + 1, cy - 21, cx - 12, cy - 20, cx - 15, cy - 10);
    ctx.bezierCurveTo(cx - 18, cy - 16, cx - 23, cy - 14, cx - 24, cy - 6);
  } else {
    ctx.moveTo(cx - 23, cy - 4);
    ctx.bezierCurveTo(cx - 27, cy - 30, cx - 12, cy - 36, cx, cy - 32);
    ctx.bezierCurveTo(cx + 14, cy - 37, cx + 27, cy - 28, cx + 23, cy - 3);
    ctx.bezierCurveTo(cx + 20, cy - 14, cx + 10, cy - 18, cx + 3, cy - 14);
    ctx.bezierCurveTo(cx - 4, cy - 20, cx - 16, cy - 17, cx - 23, cy - 4);
  }
  ctx.closePath(); ctx.fill();
  // fringe strands
  ctx.strokeStyle = rgba(hi, 0.5); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx - 14, cy - 24); ctx.quadraticCurveTo(cx - 10, cy - 12, cx - 6, cy - 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 8, cy - 27); ctx.quadraticCurveTo(cx + 13, cy - 15, cx + 10, cy - 7); ctx.stroke();
  if (h === 2) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = hair;
      ctx.beginPath(); ctx.moveTo(cx + s * 21, cy - 12); ctx.bezierCurveTo(cx + s * 30, cy + 12, cx + s * 26, cy + 34, cx + s * 18, cy + 42); ctx.bezierCurveTo(cx + s * 16, cy + 18, cx + s * 14, cy + 2, cx + s * 12, cy - 8); ctx.closePath(); ctx.fill();
    }
  }
  if (h === 5) {
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(cx + 1, cy - 35, 12, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(hi, 0.55); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx + 1, cy - 35, 7, 0.5, 2.7); ctx.stroke();
  }
}

function drawBody(ctx, cx, baseY, o, cls, colors, t) {
  const female = o.gender === 'female';
  const shoulder = female ? 32 : 38;
  const hip = female ? 24 : 25;
  const bodyY = baseY - 210;
  const sway = Math.sin(t * 1.6) * 0.6;
  ctx.save();
  ctx.translate(sway, 0);

  // cape / back cloth
  const cape = ctx.createLinearGradient(cx, bodyY, cx, baseY - 40);
  cape.addColorStop(0, rgba(colors.cloth2, 0.96)); cape.addColorStop(1, rgba(darken(colors.cloth2, 0.5), 0.9));
  ctx.fillStyle = cape;
  ctx.beginPath();
  ctx.moveTo(cx - shoulder + 4, bodyY + 28);
  ctx.bezierCurveTo(cx - 40, bodyY + 100, cx - 30, baseY - 60, cx - 34, baseY - 40);
  ctx.quadraticCurveTo(cx, baseY - 20, cx + 34, baseY - 40);
  ctx.bezierCurveTo(cx + 30, baseY - 60, cx + 40, bodyY + 100, cx + shoulder - 4, bodyY + 28);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(colors.trim, 0.3); ctx.lineWidth = 1;
  ctx.stroke();

  if (cls === 'mage') {
    // robe skirt
    const rg = ctx.createLinearGradient(cx, bodyY + 70, cx, baseY + 2);
    rg.addColorStop(0, colors.cloth); rg.addColorStop(1, darken(colors.cloth, 0.5));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(cx - hip, bodyY + 80);
    ctx.bezierCurveTo(cx - hip - 18, baseY - 60, cx - 34, baseY - 15, cx - 32, baseY + 4);
    ctx.quadraticCurveTo(cx, baseY + 16, cx + 32, baseY + 4);
    ctx.bezierCurveTo(cx + 34, baseY - 15, cx + hip + 18, baseY - 60, cx + hip, bodyY + 80);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(colors.trim, 0.5); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 26, baseY - 18); ctx.quadraticCurveTo(cx, baseY - 2, cx + 26, baseY - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, bodyY + 82); ctx.lineTo(cx, baseY + 2); ctx.strokeStyle = rgba(colors.glow, 0.25); ctx.stroke();
    // boots peeking
    ctx.fillStyle = darken(colors.cloth2, 0.55);
    roundRect(ctx, cx - 21, baseY - 14, 15, 22, 4); ctx.fill();
    roundRect(ctx, cx + 6, baseY - 14, 15, 22, 4); ctx.fill();
  } else {
    // legs
    const legG = ctx.createLinearGradient(cx - 20, bodyY + 150, cx + 20, baseY);
    legG.addColorStop(0, darken(colors.cloth2, 0.4)); legG.addColorStop(1, darken(colors.cloth2, 0.75));
    ctx.fillStyle = legG;
    roundRect(ctx, cx - 20, bodyY + 140, 15, 82, 7); ctx.fill();
    roundRect(ctx, cx + 5, bodyY + 140, 15, 82, 7); ctx.fill();
    // boots
    ctx.fillStyle = cls === 'warrior' ? colors.metal : darken(colors.leather, 0.4);
    roundRect(ctx, cx - 24, baseY - 42, 22, 44, 5); ctx.fill();
    roundRect(ctx, cx + 2, baseY - 42, 22, 44, 5); ctx.fill();
    ctx.fillStyle = rgba(colors.trim, 0.6);
    roundRect(ctx, cx - 24, baseY - 36, 22, 4, 2); ctx.fill();
    roundRect(ctx, cx + 2, baseY - 36, 22, 4, 2); ctx.fill();
    // knee guards
    ctx.fillStyle = rgba(colors.metal, 0.85);
    ctx.beginPath(); ctx.ellipse(cx - 12, baseY - 48, 9, 6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 12, baseY - 48, 9, 6, 0, 0, TAU); ctx.fill();
  }

  // torso
  const tg = ctx.createLinearGradient(cx - shoulder, bodyY + 20, cx + shoulder, bodyY + 120);
  tg.addColorStop(0, lighten(colors.cloth, 0.2)); tg.addColorStop(0.55, colors.cloth); tg.addColorStop(1, darken(colors.cloth, 0.35));
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(cx - shoulder + 4, bodyY + 30);
  ctx.bezierCurveTo(cx - 30, bodyY + 50, cx - 28, bodyY + 94, cx - hip + 2, bodyY + 122);
  ctx.lineTo(cx + hip - 2, bodyY + 122);
  ctx.bezierCurveTo(cx + 28, bodyY + 94, cx + 30, bodyY + 50, cx + shoulder - 4, bodyY + 30);
  ctx.quadraticCurveTo(cx, bodyY + 18, cx - shoulder + 4, bodyY + 30);
  ctx.closePath(); ctx.fill();

  if (cls === 'warrior') {
    // armor plates
    ctx.strokeStyle = rgba(colors.trim, 0.8); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 22, bodyY + 38); ctx.lineTo(cx - 12, bodyY + 120); ctx.moveTo(cx + 22, bodyY + 38); ctx.lineTo(cx + 12, bodyY + 120); ctx.stroke();
    ctx.fillStyle = rgba(colors.metal, 0.75);
    ctx.beginPath(); ctx.moveTo(cx - 26, bodyY + 34); ctx.bezierCurveTo(cx - 8, bodyY + 26, cx + 8, bodyY + 26, cx + 26, bodyY + 34); ctx.lineTo(cx + 20, bodyY + 66); ctx.quadraticCurveTo(cx, bodyY + 78, cx - 20, bodyY + 66); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(colors.trim, 0.9); ctx.stroke();
    // chest gem
    ctx.fillStyle = rgba(colors.glow, 0.9);
    ctx.beginPath(); ctx.moveTo(cx, bodyY + 72); ctx.lineTo(cx + 5, bodyY + 80); ctx.lineTo(cx, bodyY + 88); ctx.lineTo(cx - 5, bodyY + 80); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba('#ffffff', 0.4); ctx.lineWidth = 0.8; ctx.stroke();
    // belt
    ctx.fillStyle = colors.leather;
    roundRect(ctx, cx - 22, bodyY + 112, 44, 11, 3); ctx.fill();
    ctx.fillStyle = colors.trim;
    roundRect(ctx, cx - 6, bodyY + 110, 12, 15, 2); ctx.fill();
    ctx.fillStyle = darken(colors.trim, 0.4);
    roundRect(ctx, cx - 3, bodyY + 113, 6, 9, 1); ctx.fill();
  } else if (cls === 'mage') {
    // robe front
    ctx.fillStyle = rgba(colors.trim, 0.18);
    ctx.beginPath(); ctx.moveTo(cx - 14, bodyY + 34); ctx.lineTo(cx - 4, bodyY + 118); ctx.lineTo(cx + 4, bodyY + 118); ctx.lineTo(cx + 14, bodyY + 34); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(colors.trim, 0.9); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 15, bodyY + 38); ctx.quadraticCurveTo(cx, bodyY + 54, cx + 15, bodyY + 38); ctx.stroke();
    // sash
    ctx.fillStyle = colors.trim;
    roundRect(ctx, cx - 24, bodyY + 112, 48, 7, 3); ctx.fill();
    ctx.fillStyle = rgba(colors.glow, 0.85);
    roundRect(ctx, cx - 22, bodyY + 136, 5, 30, 2); ctx.fill();
    ctx.fillStyle = rgba(colors.trim, 0.9);
    ctx.beginPath(); ctx.moveTo(cx - 22, bodyY + 136); ctx.lineTo(cx - 12, bodyY + 156); ctx.lineTo(cx - 17, bodyY + 166); ctx.lineTo(cx - 22, bodyY + 150); ctx.closePath(); ctx.fill();
    // shoulder mantle
    ctx.fillStyle = rgba(darken(colors.cloth2, 0.2), 0.95);
    ctx.beginPath(); ctx.moveTo(cx - 34, bodyY + 30); ctx.quadraticCurveTo(cx, bodyY + 18, cx + 34, bodyY + 30); ctx.lineTo(cx + 26, bodyY + 64); ctx.quadraticCurveTo(cx, bodyY + 50, cx - 26, bodyY + 64); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(colors.trim, 0.7); ctx.stroke();
  } else {
    // leather straps
    ctx.fillStyle = rgba(colors.leather, 0.92);
    ctx.beginPath(); ctx.moveTo(cx - 26, bodyY + 32); ctx.lineTo(cx + 18, bodyY + 122); ctx.lineTo(cx + 28, bodyY + 118); ctx.lineTo(cx - 16, bodyY + 28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(colors.trim, 0.7); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 24, bodyY + 34); ctx.lineTo(cx + 20, bodyY + 118); ctx.stroke();
    // chest armor
    ctx.fillStyle = rgba(colors.metal, 0.75);
    ctx.beginPath(); ctx.moveTo(cx - 20, bodyY + 40); ctx.quadraticCurveTo(cx, bodyY + 32, cx + 20, bodyY + 40); ctx.lineTo(cx + 16, bodyY + 72); ctx.quadraticCurveTo(cx, bodyY + 80, cx - 16, bodyY + 72); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(colors.accent, 0.8); ctx.lineWidth = 1; ctx.stroke();
    // belt & sheaths
    ctx.fillStyle = colors.leather;
    roundRect(ctx, cx - 23, bodyY + 112, 46, 10, 3); ctx.fill();
    ctx.fillStyle = colors.trim;
    roundRect(ctx, cx - 5, bodyY + 111, 10, 12, 2); ctx.fill();
    ctx.save(); ctx.translate(cx - 21, bodyY + 120); ctx.rotate(0.25);
    ctx.fillStyle = '#2a2228'; roundRect(ctx, -3, 0, 6, 40, 3); ctx.fill();
    ctx.strokeStyle = rgba(colors.glow, 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, 30); ctx.stroke();
    ctx.restore();
  }

  // shoulders / pauldrons
  const pauldron = cls === 'warrior' ? colors.metal : cls === 'mage' ? colors.cloth2 : colors.leather;
  for (const s of [-1, 1]) {
    const pg = ctx.createLinearGradient(cx + s * 30, bodyY + 20, cx + s * 20, bodyY + 70);
    pg.addColorStop(0, lighten(pauldron, 0.25)); pg.addColorStop(1, darken(pauldron, 0.35));
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.ellipse(cx + s * (shoulder - 6), bodyY + 40, cls === 'warrior' ? 17 : 13, cls === 'warrior' ? 14 : 11, s * 0.25, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(colors.trim, 0.75); ctx.lineWidth = 1; ctx.stroke();
    if (cls === 'warrior') {
      ctx.fillStyle = rgba(colors.trim, 0.85);
      ctx.beginPath(); ctx.arc(cx + s * (shoulder - 6), bodyY + 36, 2, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

function drawArmsAndWeapons(ctx, cx, baseY, o, cls, colors, t) {
  const bodyY = baseY - 210;
  const sway = Math.sin(t * 1.5) * 1.2;
  const female = o.gender === 'female';
  const armW = female ? 7 : 8.5;
  // left arm (viewer left)
  ctx.strokeStyle = darken(colors.skin, 0.12); ctx.lineWidth = armW; ctx.lineCap = 'round';
  ctx.beginPath();
  if (cls === 'mage') {
    ctx.moveTo(cx - 34, bodyY + 48); ctx.quadraticCurveTo(cx - 46, bodyY + 86, cx - 38, bodyY + 118 + sway * 0.4);
  } else {
    ctx.moveTo(cx - 34, bodyY + 48); ctx.quadraticCurveTo(cx - 46, bodyY + 78, cx - 48, bodyY + 108 + sway * 0.4);
  }
  ctx.stroke();
  // sleeve
  ctx.strokeStyle = rgba(colors.cloth, 0.95); ctx.lineWidth = armW + 3;
  ctx.beginPath();
  if (cls === 'mage') { ctx.moveTo(cx - 33, bodyY + 44); ctx.quadraticCurveTo(cx - 42, bodyY + 66, cx - 40, bodyY + 80); }
  else if (cls === 'warrior') { ctx.moveTo(cx - 33, bodyY + 44); ctx.quadraticCurveTo(cx - 42, bodyY + 60, cx - 44, bodyY + 74); }
  else { ctx.moveTo(cx - 33, bodyY + 44); ctx.quadraticCurveTo(cx - 41, bodyY + 62, cx - 42, bodyY + 78); }
  ctx.stroke();
  ctx.restore?.();

  // left hand
  const lhx = cls === 'mage' ? cx - 39 : cx - 48, lhy = cls === 'mage' ? bodyY + 120 : bodyY + 110;
  ctx.fillStyle = colors.skin;
  ctx.beginPath(); ctx.arc(lhx, lhy, 5.5, 0, TAU); ctx.fill();

  // right arm
  ctx.strokeStyle = darken(colors.skin, 0.12); ctx.lineWidth = armW; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 34, bodyY + 48); ctx.quadraticCurveTo(cx + 47, bodyY + 82, cx + 44, bodyY + 112 - sway * 0.4);
  ctx.stroke();
  ctx.strokeStyle = rgba(colors.cloth, 0.95); ctx.lineWidth = armW + 3;
  ctx.beginPath(); ctx.moveTo(cx + 33, bodyY + 44); ctx.quadraticCurveTo(cx + 43, bodyY + 64, cx + 45, bodyY + 80); ctx.stroke();
  ctx.fillStyle = colors.skin;
  ctx.beginPath(); ctx.arc(cx + 44, bodyY + 113, 5.5, 0, TAU); ctx.fill();

  // bracer
  if (cls !== 'mage') {
    ctx.strokeStyle = rgba(colors.leather, 0.95); ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(cx - 47, bodyY + 95); ctx.lineTo(cx - 48, bodyY + 104); ctx.stroke();
    ctx.strokeStyle = rgba(colors.trim, 0.7); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 52, bodyY + 99); ctx.lineTo(cx - 43, bodyY + 100); ctx.stroke();
  }

  const metal = { metal: colors.metal, accent: colors.accent, cloth: colors.cloth, glow: colors.glow };
  if (cls === 'warrior') {
    drawShield(ctx, cx - 52, bodyY + 118, { ...metal, cloth: colors.cloth2 });
    drawAxe(ctx, cx + 48, bodyY + 118, 0.12 + sway * 0.01, 1.05, metal);
  } else if (cls === 'mage') {
    drawStaff(ctx, cx + 48, bodyY + 116, 0.06, metal, t);
    // tome
    ctx.save(); ctx.translate(cx - 38, bodyY + 122); ctx.rotate(-0.18);
    ctx.fillStyle = darken(colors.cloth2, 0.35); roundRect(ctx, -13, -10, 26, 20, 2); ctx.fill();
    ctx.strokeStyle = rgba(colors.trim, 0.7); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = rgba(colors.glow, 0.8); roundRect(ctx, -9, -4, 18, 2, 1); ctx.fill();
    ctx.restore();
  } else {
    drawDagger(ctx, cx - 50, bodyY + 112, -0.35, metal, -1);
    drawDagger(ctx, cx + 51, bodyY + 112, 0.35, metal, 1);
  }
}

function drawFrame(ctx, o, colors, t, w, h) {
  // light halo behind
  const halo = ctx.createRadialGradient(w / 2, h * 0.42, 8, w / 2, h * 0.42, w * 0.72);
  halo.addColorStop(0, rgba(colors.glow, 0.16)); halo.addColorStop(0.55, rgba(colors.cloth2, 0.08)); halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
}

function drawGround(ctx, cx, baseY, colors, t) {
  const g = ctx.createRadialGradient(cx, baseY + 4, 2, cx, baseY + 4, 72);
  g.addColorStop(0, rgba(colors.glow, 0.32)); g.addColorStop(0.6, rgba(colors.glow, 0.1)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.scale(1, 0.3); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, (baseY + 6) / 0.3, 72, 0, TAU); ctx.fill(); ctx.restore();
  ctx.strokeStyle = rgba(colors.glow, 0.35); ctx.lineWidth = 1;
  ctx.save(); ctx.scale(1, 0.28);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, (baseY + 4) / 0.28, 42 + i * 20 + Math.sin(t * 0.8 + i) * 2, 0, TAU); ctx.stroke(); }
  ctx.restore();
  // runes
  ctx.save(); ctx.translate(cx, baseY + 4); ctx.scale(1, 0.28); ctx.rotate(t * 0.1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.fillStyle = rgba(colors.glow, 0.3);
    ctx.beginPath(); ctx.arc(Math.cos(a) * 62, Math.sin(a) * 62, 1.8, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function drawMotes(ctx, colors, t, w, h, count = 18) {
  for (let i = 0; i < count; i++) {
    const seed = i * 71.31;
    const x = (Math.sin(seed * 1.7 + t * 0.3) * 0.5 + 0.5) * w;
    const y = ((h - ((t * (8 + (i % 5) * 3) + i * 37) % (h + 80)) + 40) % (h + 80));
    const s = 0.8 + (i % 3) * 0.7;
    ctx.fillStyle = rgba(i % 4 === 0 ? '#ffffff' : colors.glow, 0.15 + (i % 5) * 0.06);
    ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
  }
}

export function heroAppearance(player) {
  const cls = CLASSES[player.classId] ?? CLASSES.warrior;
  const outfit = OUTFITS.find((x) => x.id === player.outfit) ?? OUTFITS[0];
  const base = outfit[player.faction === 'demon' ? 'demon' : 'angel'];
  let cloth = base[0], trim = base[1], cloth2 = base[2];
  if (player.costumeColors) [cloth, trim, cloth2] = player.costumeColors;
  const hairColor = HAIR_COLORS.find((x) => x.id === player.hairColor)?.hex ?? '#1b1a20';
  const eyeColor = EYE_COLORS.find((x) => x.id === player.eyeColor)?.hex ?? '#e6b35c';
  return {
    faction: player.faction, gender: player.gender, hair: player.hair, classId: player.classId,
    hairColor, eyeColor,
    colors: {
      cloth, trim, cloth2,
      leather: cls.id === 'mage' ? darken(cloth2, 0.1) : '#3a2c28',
      metal: cls.id === 'warrior' ? '#8b96a4' : cls.id === 'mage' ? '#b9a27a' : '#7c8492',
      accent: cls.accent, glow: player.faction === 'angel' ? '#cfeaff' : '#ff9a6b',
      skin: player.faction === 'demon' ? '#c89a80' : '#ddb79c',
      hair: hairColor,
    },
  };
}

export function renderHero(canvas, player, time = 0, opts = {}) {
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  const cw = Math.max(1, rect.width), ch = Math.max(1, rect.height);
  if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  const app = heroAppearance(player);
  const colors = app.colors;
  const scale = Math.min(cw / 300, ch / 420) * (opts.zoom ?? 1);
  const ox = (cw - 300 * scale) / 2;
  const oy = ch - 420 * scale + (opts.offsetY ?? 0) * scale;
  drawFrame(ctx, player, colors, time, cw, ch);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  drawGround(ctx, 150, 392, colors, time);
  if (player.wing) {
    const wingColor = player.wing === 'wing_eternity' ? '#f4df9a' : player.wing === 'wing_void' ? '#c08cf0' : '#e3f2ff';
    drawWings(ctx, player.faction, time, wingColor, 0.95);
  }
  const bob = Math.sin(time * 1.5) * 2.2;
  ctx.save();
  ctx.translate(0, bob);
  drawHairBack(ctx, 150, 118, app, colors, time);
  drawBody(ctx, 150, 392, app, app.classId, colors, time);
  drawFace(ctx, 150, 118, app, colors, time);
  drawHairFront(ctx, 150, 118, app, colors, time);
  drawArmsAndWeapons(ctx, 150, 392, app, app.classId, colors, time);
  // faction details
  if (player.faction === 'angel') {
    const halo = ctx.createLinearGradient(120, 70, 180, 76);
    halo.addColorStop(0, 'rgba(255,240,190,0)'); halo.addColorStop(0.5, 'rgba(255,240,190,.85)'); halo.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.strokeStyle = halo; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(150, 74, 28, 6, 0, 0, TAU); ctx.stroke();
  } else {
    const hg = ctx.createLinearGradient(0, 60, 0, 105);
    hg.addColorStop(0, '#5b2832'); hg.addColorStop(0.6, '#2c1219'); hg.addColorStop(1, '#1a0b10');
    ctx.fillStyle = hg;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(150 + s * 14, 94);
      ctx.bezierCurveTo(150 + s * 24, 82, 150 + s * 30, 66, 150 + s * 22, 52);
      ctx.bezierCurveTo(150 + s * 20, 68, 150 + s * 14, 78, 150 + s * 9, 86);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(240,180,140,.25)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  // weapon effect
  if (player.fx) {
    const fxColor = player.fx === 'fx_frost' ? '#9fe8ff' : player.fx === 'fx_void' ? '#c08cf0' : '#ff8a5c';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const a = time * 1.5 + i;
      const x = 198 + Math.cos(a) * 12, y = 268 + Math.sin(a * 1.3) * 26;
      ctx.fillStyle = rgba(fxColor, 0.25 + (i % 3) * 0.1);
      ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  drawMotes(ctx, colors, time, 300, 420, 14);
  ctx.restore();
}

export function renderHeroStatic(canvas, player, opts = {}) {
  renderHero(canvas, player, opts.time ?? 1.2, opts);
}
