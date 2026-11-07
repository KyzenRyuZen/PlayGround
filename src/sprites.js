// ============================================================
// AETHERIA — PROCEDURAL HD PIXEL-ART SPRITES
// Everything is drawn at low resolution with crisp rectangles and
// scaled up with image smoothing disabled, giving true pixel art.
// ============================================================

import { RARITIES } from './data.js';

const OUT = '#191421';
const OUT2 = '#2a2133';

function p(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function px(ctx, x, y, c) { p(ctx, x, y, 1, 1, c); }

function shade(hex, amt) {
  if (!hex) return '#888';
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + 255 * amt)));
  g = Math.max(0, Math.min(255, Math.round(g + 255 * amt)));
  b = Math.max(0, Math.min(255, Math.round(b + 255 * amt)));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

const CLASS_PAL = {
  warrior: { cloth: '#8f2d33', cloth2: '#5e1f2a', metal: '#aab2c2', metal2: '#646f82', trim: '#d5a44c', skin: '#efc39c', hair: '#5b3a25' },
  mage: { cloth: '#274a8f', cloth2: '#1a2f63', metal: '#c8a84f', metal2: '#7a6227', trim: '#79d6ff', skin: '#efc39c', hair: '#d8d2c4' },
  archer: { cloth: '#2f6b4f', cloth2: '#1e4736', metal: '#8f7b50', metal2: '#5a4c2e', trim: '#a8e07a', skin: '#efc39c', hair: '#7a3f22' }
};

const EQUIP_COLOR = (rarity, fallback) => {
  const r = RARITIES[rarity];
  if (!r) return fallback;
  if (rarity === 'common' || rarity === 'grey') return fallback;
  return r.color;
};

// ------------------------------------------------------------
// CHARACTER
// ------------------------------------------------------------
export function drawCharacter(ctx, o) {
  const time = o.time || 0;
  const pal = { ...(CLASS_PAL[o.classId] || CLASS_PAL.warrior) };
  if (o.cosmetic) {
    pal.cloth = o.cosmetic.cloth;
    pal.cloth2 = o.cosmetic.cloth2;
    pal.trim = o.cosmetic.trim;
  }
  const demon = o.faction === 'demon';
  const female = o.gender === 'female';
  const skin = demon ? '#d29c8c' : '#efc39c';
  const skinShade = demon ? '#b87b70' : '#d8a67c';
  const hair = o.hairColor || pal.hair;
  const facing = o.facing || 1;
  const moving = !!o.moving;
  const walk = moving ? time * 10 : time * 2.2;
  const bob = Math.round(moving ? Math.abs(Math.sin(walk)) : Math.sin(time * 2.2) * 0.5);
  const swing = moving ? Math.sin(walk) : 0;
  const eq = o.equipment || {};
  const attack = o.attack || 0; // 0..1 progress
  const casting = !!o.casting;
  const mounted = !!o.mount;

  ctx.save();
  ctx.scale(facing, 1);

  // wings behind body
  if (o.wings) drawWings(ctx, o.wings, time, -28 + bob, demon);

  // mount drawn first (body sits higher)
  if (mounted) {
    drawMount(ctx, o.mount, time, moving);
  }
  const lift = mounted ? -13 : 0;

  ctx.save();
  ctx.translate(0, lift + bob);

  // ---- legs ----
  const pantsColor = eq.pants ? shade(EQUIP_COLOR(eq.pants.rarity, pal.cloth2), -0.12) : pal.cloth2;
  const bootColor = eq.boots ? shade(EQUIP_COLOR(eq.boots.rarity, pal.metal2), -0.05) : pal.metal2;
  const legSwing = Math.round(swing * 2);
  // back leg
  p(ctx, -4, -14, 4, 10 + legSwing, shade(pantsColor, -0.12));
  p(ctx, -5, -4 + legSwing, 5, 4, shade(bootColor, -0.12));
  // front leg
  p(ctx, 1, -14, 4, 10 - legSwing, pantsColor);
  p(ctx, 1, -4 - legSwing, 5, 4, bootColor);
  // Small leather/metal highlights keep the feet readable at mobile scale.
  p(ctx, -5, -4 + legSwing, 2, 1, shade(bootColor, 0.22));
  p(ctx, 2, -4 - legSwing, 2, 1, shade(bootColor, 0.22));
  p(ctx, -4, -12 + legSwing, 1, 4, shade(pantsColor, 0.12));
  p(ctx, 2, -12 - legSwing, 1, 4, shade(pantsColor, 0.12));

  if (o.classId === 'mage') {
    // robe skirt over legs
    p(ctx, -8, -19, 16, 6, pal.cloth);
    p(ctx, -9, -14, 18, 7, pal.cloth);
    p(ctx, -8, -7, 7, 7, shade(pal.cloth, -0.07));
    p(ctx, 1, -7, 7, 7, pal.cloth);
    p(ctx, -5, -10, 10, 1, pal.trim);
  }

  // ---- torso ----
  const chestRar = eq.chest?.rarity;
  const chestAccent = EQUIP_COLOR(chestRar, pal.metal);
  const chestPrimary = eq.chest ? (chestRar === 'common' || chestRar === 'grey' ? pal.metal : chestAccent) : pal.cloth;
  const chestDark = shade(chestPrimary, -0.18);
  const shoulder = female ? 7 : 9;

  if (o.classId === 'warrior') {
    p(ctx, -shoulder, -29, shoulder * 2, 14, pal.metal2);
    p(ctx, -shoulder + 1, -29, shoulder * 2 - 2, 12, chestPrimary);
    p(ctx, -shoulder + 2, -27, shoulder * 2 - 4, 5, shade(chestPrimary, 0.13));
    // tabard
    p(ctx, -4, -27, 8, 13, pal.cloth);
    p(ctx, -4, -27, 8, 2, pal.trim);
    p(ctx, -1, -22, 2, 8, pal.trim);
    // belt
    p(ctx, -shoulder + 1, -18, shoulder * 2 - 2, 3, '#42301f');
    p(ctx, -2, -18, 5, 3, pal.trim);
    // pauldrons
    p(ctx, -shoulder - 2, -30, 5, 6, pal.metal);
    p(ctx, -shoulder - 1, -29, 3, 2, shade(pal.metal, 0.25));
    p(ctx, shoulder - 3, -30, 5, 6, pal.metal);
    p(ctx, shoulder - 2, -29, 3, 2, shade(pal.metal, 0.25));
    if (demon) {
      p(ctx, -shoulder - 3, -31, 2, 3, '#7a2335');
      p(ctx, shoulder + 1, -31, 2, 3, '#7a2335');
    } else {
      p(ctx, -shoulder + 4, -29, 2, 2, pal.trim);
      p(ctx, shoulder - 6, -29, 2, 2, pal.trim);
    }
  } else if (o.classId === 'mage') {
    p(ctx, -shoulder + 1, -29, shoulder * 2 - 2, 12, chestPrimary);
    p(ctx, -shoulder + 3, -27, shoulder * 2 - 6, 4, shade(chestPrimary, 0.12));
    p(ctx, -8, -18, 16, 3, pal.trim);
    // robe trim
    p(ctx, -1, -29, 2, 11, pal.trim);
    p(ctx, -5, -25, 3, 3, shade(chestPrimary, 0.2));
    // shoulder mantle
    p(ctx, -shoulder, -29, 5, 4, pal.cloth2);
    p(ctx, shoulder - 5, -29, 5, 4, pal.cloth2);
    p(ctx, -shoulder, -29, 5, 1, pal.trim);
    p(ctx, shoulder - 5, -29, 5, 1, pal.trim);
  } else {
    p(ctx, -shoulder + 1, -29, shoulder * 2 - 2, 12, pal.cloth);
    p(ctx, -shoulder + 2, -27, shoulder * 2 - 4, 6, shade(chestPrimary, 0.02));
    p(ctx, -shoulder + 1, -29, shoulder * 2 - 2, 2, pal.cloth2);
    // leather straps
    p(ctx, -5, -28, 2, 11, pal.metal2);
    p(ctx, 3, -28, 2, 11, pal.metal2);
    p(ctx, -5, -24, 10, 2, pal.metal2);
    p(ctx, -shoulder + 1, -18, shoulder * 2 - 2, 3, pal.cloth2);
    p(ctx, -2, -18, 4, 2, pal.trim);
  }

  // Class-specific stitching and armor facets add depth without changing the silhouette.
  if (o.classId === 'warrior') {
    p(ctx, -6, -25, 2, 8, shade(chestPrimary, -0.12));
    p(ctx, 4, -25, 2, 8, shade(chestPrimary, 0.18));
    p(ctx, -1, -25, 2, 3, shade(pal.trim, 0.18));
  } else if (o.classId === 'mage') {
    p(ctx, -1, -26, 2, 3, shade(pal.trim, 0.2));
    p(ctx, -2, -24, 4, 1, pal.trim);
    p(ctx, -1, -23, 2, 2, shade(pal.trim, -0.12));
    p(ctx, -6, -16, 2, 1, shade(pal.cloth, 0.18));
    p(ctx, 4, -16, 2, 1, shade(pal.cloth, 0.18));
  } else {
    p(ctx, -6, -25, 1, 5, shade(pal.cloth, 0.2));
    p(ctx, 5, -25, 1, 5, shade(pal.cloth, -0.12));
    p(ctx, -3, -21, 6, 1, shade(pal.metal2, 0.18));
    p(ctx, -4, -26, 1, 1, pal.trim);
    p(ctx, 3, -26, 1, 1, pal.trim);
  }

  // necklace / chain / earrings
  if (eq.necklace) {
    p(ctx, -3, -30, 6, 1, '#d9b45a');
    p(ctx, -1, -29, 2, 3, EQUIP_COLOR(eq.necklace.rarity, '#d9b45a'));
    p(ctx, -1, -27, 1, 1, '#fff3c4');
  }
  if (eq.chain) {
    p(ctx, -7, -18, 14, 1, EQUIP_COLOR(eq.chain.rarity, '#c8a84f'));
    p(ctx, -5, -17, 1, 1, '#f5df9a');
    p(ctx, 3, -17, 1, 1, '#f5df9a');
  }

  // ---- head ----
  const headY = -43;
  p(ctx, -6, headY, 12, 11, skin);
  p(ctx, -6, headY, 12, 1, shade(skin, 0.08));
  p(ctx, -6, headY + 9, 12, 1, skinShade);
  // neck
  p(ctx, -2, headY + 10, 4, 3, skinShade);
  // eyes
  p(ctx, -4, headY + 5, 2, 2, '#f7f4ea');
  p(ctx, 2, headY + 5, 2, 2, '#f7f4ea');
  p(ctx, -3, headY + 5, 1, 2, o.eyeColor || '#3f8cff');
  p(ctx, 3, headY + 5, 1, 2, o.eyeColor || '#3f8cff');
  px(ctx, -4, headY + 5, '#fff8df');
  px(ctx, 2, headY + 5, '#fff8df');
  p(ctx, 0, headY + 7, 1, 1, shade(skin, -0.12));
  if (female) { p(ctx, -5, headY + 4, 2, 1, OUT2); p(ctx, 3, headY + 4, 2, 1, OUT2); }
  // mouth
  p(ctx, -1, headY + 9, 2, 1, shade(skin, -0.25));

  // horn/halo faction detail
  if (demon) {
    p(ctx, -5, headY - 3, 2, 3, '#3d1f2b');
    p(ctx, -6, headY - 5, 2, 3, '#5c2637');
    p(ctx, 3, headY - 3, 2, 3, '#3d1f2b');
    p(ctx, 4, headY - 5, 2, 3, '#5c2637');
  }

  // hair styles (drawn before helmet)
  drawHair(ctx, o.hairStyle, hair, headY, female, time);

  // helmet overrides hair partly
  if (eq.helmet) drawHelmet(ctx, o.classId, eq.helmet, headY, pal, demon);

  // earrings
  if (eq.earrings) {
    p(ctx, -7, headY + 6, 1, 2, EQUIP_COLOR(eq.earrings.rarity, '#ffd166'));
    p(ctx, 6, headY + 6, 1, 2, EQUIP_COLOR(eq.earrings.rarity, '#ffd166'));
  }

  // halo for angels — a small hollow pixel ring, not a flat bar
  if (!demon) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    const hy = Math.round(headY - (eq.helmet ? 7 : 8));
    p(ctx, -4, hy, 8, 1, '#fff4c4');
    p(ctx, -5, hy + 1, 1, 1, '#ffe9a3');
    p(ctx, 4, hy + 1, 1, 1, '#ffe9a3');
    p(ctx, -4, hy + 2, 8, 1, '#e8c46a');
    ctx.restore();
  }

  // ---- arms + weapon ----
  drawArmsAndWeapon(ctx, o, pal, skin, attack, casting, time, swing);

  ctx.restore();

  // ---- aura tier (subtle, inside sprite space) ----
  if (o.aura) {
    ctx.save();
    ctx.globalAlpha = 0.22 + (o.aura.strength || 0) * 0.09;
    ctx.fillStyle = o.aura.color;
    ctx.beginPath();
    ctx.ellipse(0, -22, 14 + (o.aura.strength || 0) * 2, 24 + (o.aura.strength || 0) * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawHair(ctx, style, color, headY, female, time) {
  const c = color;
  const d = shade(c, -0.16);
  const l = shade(c, 0.14);
  switch (style) {
    case 'swept':
      p(ctx, -6, headY - 2, 12, 3, c);
      p(ctx, -6, headY, 2, 4, c);
      p(ctx, 4, headY - 1, 3, 2, l);
      p(ctx, -7, headY + 1, 1, 5, c);
      p(ctx, 5, headY + 1, 1, 5, d);
      break;
    case 'braid':
      p(ctx, -6, headY - 2, 12, 3, c);
      p(ctx, -7, headY + 1, 2, 7, c);
      p(ctx, 5, headY + 1, 2, 11, d);
      p(ctx, 4, headY + 10, 4, 3, c);
      p(ctx, 5, headY + 13, 2, 2, d);
      break;
    case 'wild':
      p(ctx, -7, headY - 3, 14, 4, c);
      p(ctx, -7, headY - 1, 2, 7, c);
      p(ctx, 5, headY - 1, 2, 7, c);
      p(ctx, -5, headY - 5, 2, 3, c);
      p(ctx, -1, headY - 6, 2, 3, c);
      p(ctx, 3, headY - 5, 2, 3, c);
      p(ctx, 6, headY + 1, 2, 5, d);
      break;
    case 'topknot':
      p(ctx, -5, headY - 2, 10, 3, c);
      p(ctx, -5, headY + 1, 1, 4, c);
      p(ctx, 4, headY + 1, 1, 3, d);
      p(ctx, -2, headY - 6, 5, 4, c);
      p(ctx, 2, headY - 7, 2, 2, l);
      break;
    case 'long':
      p(ctx, -7, headY - 2, 14, 4, c);
      p(ctx, -8, headY + 1, 3, 16, c);
      p(ctx, 5, headY + 1, 3, 16, d);
      p(ctx, -6, headY, 2, 7, c);
      p(ctx, 4, headY, 2, 7, d);
      p(ctx, -8, headY + 16, 3, 3, d);
      p(ctx, 5, headY + 16, 3, 3, shade(d, -0.08));
      break;
    case 'pony':
      p(ctx, -6, headY - 2, 12, 3, c);
      p(ctx, -7, headY + 1, 2, 6, c);
      p(ctx, 5, headY, 2, 4, d);
      p(ctx, 4, headY - 4, 5, 2, c);
      p(ctx, 7, headY - 2, 3, 9, c);
      p(ctx, 8, headY + 7, 2, 3, d);
      break;
    case 'twin':
      p(ctx, -6, headY - 2, 12, 3, c);
      p(ctx, -8, headY + 1, 3, 12, d);
      p(ctx, 5, headY + 1, 3, 12, d);
      p(ctx, -8, headY + 13, 3, 2, c);
      p(ctx, 5, headY + 13, 3, 2, c);
      p(ctx, -6, headY, 2, 5, c);
      p(ctx, 4, headY, 2, 5, c);
      break;
    case 'bob':
      p(ctx, -7, headY - 2, 14, 3, c);
      p(ctx, -8, headY + 1, 3, 8, c);
      p(ctx, 5, headY + 1, 3, 8, d);
      p(ctx, -6, headY, 2, 5, c);
      p(ctx, 4, headY, 2, 5, d);
      break;
    case 'bun':
      p(ctx, -6, headY - 2, 12, 3, c);
      p(ctx, -2, headY - 7, 6, 5, c);
      p(ctx, 0, headY - 8, 3, 2, l);
      p(ctx, -7, headY + 1, 2, 5, c);
      p(ctx, 5, headY + 1, 2, 5, d);
      break;
    default: // short
      p(ctx, -6, headY - 2, 12, 3, c);
      p(ctx, -7, headY + 1, 2, 5, c);
      p(ctx, 5, headY + 1, 2, 5, d);
      p(ctx, -4, headY - 1, 4, 2, l);
      break;
  }
}

function drawHelmet(ctx, classId, item, headY, pal, demon) {
  const rar = item.rarity;
  const c = EQUIP_COLOR(rar, pal.metal);
  const d = shade(c, -0.25);
  const glow = rar !== 'common' && rar !== 'grey';
  if (classId === 'warrior') {
    p(ctx, -7, headY - 3, 14, 5, d);
    p(ctx, -6, headY - 2, 12, 3, c);
    p(ctx, -6, headY + 2, 2, 3, d);
    p(ctx, 4, headY + 2, 2, 3, d);
    p(ctx, -1, headY - 1, 2, 4, shade(c, 0.2));
    // wings/horns on helm
    p(ctx, -9, headY - 2, 2, 4, c);
    p(ctx, 7, headY - 2, 2, 4, c);
    if (glow) p(ctx, -8, headY - 3, 2, 1, RARITIES[rar].color);
  } else if (classId === 'mage') {
    p(ctx, -6, headY - 2, 12, 2, c);
    p(ctx, -1, headY - 4, 2, 3, c);
    px(ctx, 0, headY - 5, RARITIES[rar].color);
    p(ctx, -7, headY + 1, 2, 4, d);
    p(ctx, 5, headY + 1, 2, 4, d);
  } else {
    // hood
    p(ctx, -7, headY - 3, 14, 4, shade(c, -0.1));
    p(ctx, -7, headY + 1, 3, 8, c);
    p(ctx, 4, headY + 1, 3, 8, c);
    p(ctx, -5, headY - 3, 2, 2, glow ? RARITIES[rar].color : '#efe6c8');
    p(ctx, -2, headY - 4, 4, 1, d);
  }
}

function drawArmsAndWeapon(ctx, o, pal, skin, attack, casting, time, swing) {
  const eq = o.equipment || {};
  const cls = o.classId;
  const weapon = eq.weapon;
  const wRar = weapon?.rarity || 'common';
  const wColor = EQUIP_COLOR(wRar, pal.metal);
  const gloveColor = eq.gloves ? EQUIP_COLOR(eq.gloves.rarity, pal.metal2) : pal.metal2;
  const atkSwing = attack > 0 ? Math.sin(attack * Math.PI) : 0;

  if (cls === 'warrior') {
    // back arm
    p(ctx, -9, -27, 3, 9 + Math.round(swing), pal.metal2);
    p(ctx, -9, -19 + Math.round(swing), 3, 3, gloveColor);
    // weapon pivot at shoulder, swing forward
    ctx.save();
    ctx.translate(6, -26);
    ctx.rotate(-0.5 - atkSwing * 2.4 + Math.sin(time * 2) * 0.02);
    // arm
    p(ctx, -1, 0, 3, 10, pal.metal2);
    p(ctx, -1, 8, 3, 3, gloveColor);
    // hilt
    p(ctx, -1, 10, 2, 6, '#4a3324');
    p(ctx, -4, 15, 8, 2, pal.trim);
    px(ctx, 0, 16, '#7a5a2e');
    // blade
    p(ctx, -2, -24, 4, 36, shade(wColor, 0.12));
    p(ctx, -1, -25, 2, 3, '#e8f4ff');
    p(ctx, -3, 8, 6, 3, wColor);
    p(ctx, -1, 11, 2, 2, '#7a5a2e');
    if (wRar !== 'common' && wRar !== 'grey') {
      p(ctx, -1, -22, 1, 28, RARITIES[wRar].glow);
    }
    ctx.restore();
  } else if (cls === 'mage') {
    p(ctx, -9, -27, 3, 9, pal.cloth2);
    p(ctx, -9, -18, 3, 3, skin);
    ctx.save();
    ctx.translate(7, -25);
    ctx.rotate(-0.08 - atkSwing * 0.4);
    p(ctx, -1, 0, 3, 9, pal.cloth2);
    p(ctx, -1, 8, 3, 3, skin);
    // staff
    const staffTop = casting || attack > 0 ? -22 - atkSwing * 4 : -24;
    p(ctx, 0, staffTop, 2, 44, '#5a3f27');
    p(ctx, -1, staffTop + 2, 4, 2, pal.trim);
    // orb
    const orbC = casting ? pal.trim : wColor;
    p(ctx, -3, staffTop - 5, 7, 7, shade(orbC, -0.2));
    p(ctx, -2, staffTop - 6, 5, 9, orbC);
    p(ctx, -1, staffTop - 5, 2, 3, shade(orbC, 0.35));
    if (casting) {
      ctx.globalAlpha = 0.5 + Math.sin(time * 12) * 0.2;
      p(ctx, -5, staffTop - 8, 11, 13, pal.trim);
    }
    ctx.restore();
  } else {
    p(ctx, -9, -27, 3, 9, pal.cloth2);
    p(ctx, -9, -18, 3, 3, skin);
    // bow in front hand
    ctx.save();
    ctx.translate(9, -24);
    ctx.rotate(-0.1 - atkSwing * 0.25);
    p(ctx, -1, 0, 2, 9, pal.cloth2);
    p(ctx, -1, 8, 2, 3, skin);
    // bow limb
    const bc = shade(pal.metal, 0.1);
    p(ctx, 0, -12, 2, 6, bc);
    p(ctx, 1, -6, 2, 12, bc);
    p(ctx, 0, 6, 2, 6, bc);
    p(ctx, 2, -10, 1, 4, pal.trim);
    p(ctx, 2, 5, 1, 4, pal.trim);
    // string (pulled when attacking)
    ctx.strokeStyle = '#e9e2c8';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(2, -11);
    ctx.lineTo(atkSwing > 0.2 ? -1 : 1.5, atkSwing > 0.2 ? -1 : 0);
    ctx.lineTo(2, 11);
    ctx.stroke();
    if (atkSwing > 0.2) {
      p(ctx, -1, -0.5, 24, 1, '#d9c58a');
      p(ctx, 22, -1.5, 2, 3, '#cfd8e2');
    }
    ctx.restore();
  }

  // front arm for non weapon side
  if (cls === 'mage') {
    p(ctx, 8, -27, 3, 9, pal.cloth2);
    p(ctx, 8, -18, 3, 3, skin);
  } else if (cls === 'archer') {
    p(ctx, -9, -26, 3, 9, pal.cloth2);
    p(ctx, -9, -17, 3, 3, gloveColor);
  }
}

// ------------------------------------------------------------
// WINGS
// ------------------------------------------------------------
export function drawWings(ctx, wings, time, y, demon) {
  const flap = Math.sin(time * 2.4) * 0.10;
  const pal = wings.palette || (demon ? ['#2b1728', '#5a2031', '#d94a4a'] : ['#fff8df', '#ffe9a3', '#e8c46a']);
  ctx.save();
  ctx.translate(0, y);
  ctx.scale(1, 1 + flap);
  const style = wings.style;
  const pairs = style === 'seraph' ? 3 : 1;
  for (let k = 0; k < pairs; k++) {
    const spread = 1 - k * 0.25;
    const yy = k * 7;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.scale(dir, 1);
      if (style === 'bat' || style === 'abyss') {
        // bat-like membrane
        const c1 = pal[0], c2 = pal[1] || '#5a2031', c3 = pal[2] || '#d94a4a';
        p(ctx, 4, 0 + yy, 5, 2, c1);
        p(ctx, 8, -2 + yy, 5, 3, c1);
        p(ctx, 12, -5 + yy, 6, 4, c2);
        p(ctx, 15, -9 + yy, 7, 5, c2);
        p(ctx, 10, 1 + yy, 8, 5, c2);
        p(ctx, 14, -4 + yy, 3, 2, c3);
        p(ctx, 18, -8 + yy, 2, 2, c3);
        // bone spikes
        p(ctx, 21, -11 + yy, 2, 4, c1);
        p(ctx, 18, -2 + yy, 2, 3, c1);
        p(ctx, 8, 2 + yy, 1, 4, c1);
        if (style === 'abyss') {
          p(ctx, 12, 6 + yy, 4, 2, c3);
          p(ctx, 20, -4 + yy, 1, 6, c3);
        }
      } else {
        // feather layers
        const c1 = pal[0], c2 = pal[1], c3 = pal[2];
        p(ctx, 4, 0 + yy, 8, 2, c2);
        p(ctx, 8, -2 + yy, 8, 3, c1);
        p(ctx, 12, -5 + yy, 8, 3, c1);
        p(ctx, 15, -8 + yy, 8, 3, c1);
        p(ctx, 10, 2 + yy, 8, 2, c2);
        p(ctx, 14, -2 + yy, 6, 2, c2);
        p(ctx, 16, -10 + yy, 4, 2, c3);
        p(ctx, 19, -7 + yy, 2, 5, c3);
        p(ctx, 8, 1 + yy, 1, 3, c3);
        if (style === 'seraph') {
          p(ctx, 18, -12 + yy, 3, 2, shade(c3, 0.15));
          p(ctx, 11, -7 + yy, 5, 1, '#fffdf2');
        }
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------
// MOUNTS
// ------------------------------------------------------------
export function drawMount(ctx, mount, time, moving) {
  const kind = mount.kind || 'horse';
  const c = mount.color || '#8a5a3c';
  const dark = shade(c, -0.2);
  const light = shade(c, 0.15);
  const gait = moving ? Math.sin(time * 12) : Math.sin(time * 2) * 0.3;
  const leg1 = Math.round(gait * 3);
  const leg2 = Math.round(-gait * 3);

  if (kind === 'horse') {
    p(ctx, -13, -18, 26, 10, c);
    p(ctx, -13, -18, 26, 3, light);
    p(ctx, -12, -8, 7, 4, dark);
    p(ctx, 5, -8, 7, 4, dark);
    // legs
    p(ctx, 9, -9, 3, 9 + leg1, dark); p(ctx, 10, -1 + leg1, 4, 2, '#2e2118');
    p(ctx, -10, -9, 3, 9 + leg2, dark); p(ctx, -11, -1 + leg2, 4, 2, '#2e2118');
    p(ctx, 5, -9, 3, 8 - leg1, c); p(ctx, 5, 0 - leg1, 4, 2, '#2e2118');
    p(ctx, -5, -9, 3, 8 - leg2, c); p(ctx, -6, 0 - leg2, 4, 2, '#2e2118');
    // neck + head
    p(ctx, 13, -27, 5, 12, c);
    p(ctx, 16, -29, 8, 6, c);
    p(ctx, 23, -27, 4, 4, light);
    p(ctx, 16, -31, 2, 3, dark);
    px(ctx, 22, -27, 1, 1, '#120e18');
    // mane/tail
    p(ctx, 12, -28, 2, 10, dark);
    p(ctx, -14, -19, 2, 9, dark);
    p(ctx, -15, -11, 2, 4, dark);
    // saddle
    p(ctx, -5, -21, 10, 4, '#7a2c2c');
    p(ctx, -5, -21, 10, 1, '#d5a44c');
  } else if (kind === 'wolf') {
    p(ctx, -14, -16, 25, 9, c);
    p(ctx, -14, -16, 25, 3, light);
    p(ctx, -11, -21, 7, 7, c);
    p(ctx, 5, -21, 8, 7, c);
    // legs
    p(ctx, 8, -7, 3, 7 + leg1, dark); p(ctx, 8, 0 + leg1, 4, 2, dark);
    p(ctx, -10, -7, 3, 7 + leg2, dark); p(ctx, -10, 0 + leg2, 4, 2, dark);
    p(ctx, 4, -7, 3, 7 - leg1, c);
    p(ctx, -5, -7, 3, 7 - leg2, c);
    // head
    p(ctx, 14, -24, 7, 8, c);
    p(ctx, 19, -21, 5, 4, light);
    px(ctx, 22, -22, 1, 1, '#0d0b12');
    p(ctx, 14, -27, 2, 4, dark); p(ctx, 18, -27, 2, 4, dark);
    p(ctx, 19, -18, 2, 1, '#f2e7d0');
    // tail
    p(ctx, -15, -14, 3, 5, dark); p(ctx, -17, -10, 3, 3, dark);
    // saddle
    p(ctx, -4, -19, 9, 4, '#3c2a4a');
    p(ctx, -4, -19, 9, 1, '#b18cff');
  } else { // drake
    ctx.save();
    ctx.translate(0, 0);
    // wings
    p(ctx, -1, -30, 8, 2, shade(c, -0.05));
    p(ctx, -10, -32, 8, 3, shade(c, 0.1));
    p(ctx, 12, -28, 8, 3, shade(c, 0.1));
    // body
    p(ctx, -12, -18, 25, 11, c);
    p(ctx, -12, -18, 25, 3, light);
    p(ctx, -13, -9, 4, 5, dark);
    p(ctx, 9, -9, 4, 5, dark);
    // legs
    p(ctx, 7, -9, 3, 9 + leg1, dark); p(ctx, 7, 0 + leg1, 5, 2, '#2a1b16');
    p(ctx, -9, -9, 3, 9 + leg2, dark); p(ctx, -9, 0 + leg2, 5, 2, '#2a1b16');
    // neck/head
    p(ctx, 13, -27, 5, 10, c);
    p(ctx, 16, -30, 8, 6, c);
    p(ctx, 23, -28, 5, 4, light);
    px(ctx, 25, -27, 1, 1, '#ffd166');
    p(ctx, 16, -32, 2, 3, dark);
    // spikes / tail
    p(ctx, 12, -29, 1, 2, '#d5a44c');
    p(ctx, -14, -17, 2, 8, dark);
    p(ctx, -17, -11, 4, 2, dark);
    // saddle
    p(ctx, -5, -21, 10, 4, '#4a2d5e');
    p(ctx, -5, -21, 10, 1, '#ffb23e');
    ctx.restore();
  }
}

// ------------------------------------------------------------
// PETS
// ------------------------------------------------------------
export function drawPet(ctx, pet, time) {
  const bob = Math.sin(time * 3) * 2;
  ctx.save();
  ctx.translate(0, bob);
  const c = pet.color || '#8fe2ff';
  if (pet.kind === 'wisp') {
    p(ctx, -3, -8, 6, 6, shade(c, -0.2));
    p(ctx, -2, -9, 4, 8, c);
    p(ctx, -1, -7, 2, 2, '#fff');
    p(ctx, -5, -6, 1, 1, c); p(ctx, 4, -7, 1, 1, c);
  } else if (pet.kind === 'imp') {
    p(ctx, -4, -11, 8, 7, c);
    p(ctx, -3, -13, 2, 3, shade(c, -0.2));
    p(ctx, 2, -13, 2, 3, shade(c, -0.2));
    p(ctx, -3, -8, 1, 1, '#ffe066'); p(ctx, 2, -8, 1, 1, '#ffe066');
    p(ctx, -5, -10, 2, 3, shade(c, -0.25)); p(ctx, 4, -10, 2, 3, shade(c, -0.25));
    p(ctx, -2, -4, 2, 3, shade(c, -0.2)); p(ctx, 1, -4, 2, 3, shade(c, -0.2));
  } else {
    // void cat
    p(ctx, -5, -8, 10, 6, c);
    p(ctx, -4, -11, 8, 5, c);
    p(ctx, -4, -13, 2, 3, shade(c, -0.2)); p(ctx, 2, -13, 2, 3, shade(c, -0.2));
    p(ctx, -3, -9, 1, 1, '#fff'); p(ctx, 2, -9, 1, 1, '#fff');
    p(ctx, -4, -3, 2, 3, shade(c, -0.2)); p(ctx, 2, -3, 2, 3, shade(c, -0.2));
    p(ctx, 5, -6, 4, 1, shade(c, -0.1));
  }
  ctx.restore();
}

// ------------------------------------------------------------
// ENEMIES
// ------------------------------------------------------------
export function drawEnemy(ctx, e, time) {
  const def = e.def;
  const kind = def.kind;
  const c = def.color || '#7bd66b';
  const dark = shade(c, -0.22);
  const light = shade(c, 0.18);
  const run = e.state === 'chase' ? Math.sin(time * 11 + (e.anim || 0) * 6) : Math.sin(time * 2.4 + (e.anim || 0) * 1.2) * 0.25;
  const atk = e.attackAnim ? Math.sin(e.attackAnim * Math.PI) : 0;
  const bob = Math.sin(time * 3 + e.anim) * (kind === 'ghost' ? 3 : 1) - (e.state === 'chase' ? Math.abs(run) * 0.7 : 0);
  const s = e.scale || 1;
  ctx.save();
  ctx.scale((e.facing || 1) * s, s);
  ctx.translate(atk * 3.2, bob);   // lunge forward during an attack swing
  const flash = e.hitFlash > 0;
  const C = (col) => flash ? '#fff6e0' : col;

  switch (kind) {
    case 'slime': {
      const squash = e.state === 'chase' ? Math.abs(run) : (Math.sin(time * 2.4 + (e.anim || 0)) + 1) * 0.5;
      ctx.save();
      ctx.scale(1 + squash * 0.09, 1 - squash * 0.07);
      p(ctx, -10, -10, 20, 10, C(dark));
      p(ctx, -9, -13, 18, 8, C(c));
      p(ctx, -6, -15, 12, 4, C(light));
      p(ctx, -5, -11, 3, 3, '#19221e');
      p(ctx, 3, -11, 3, 3, '#19221e');
      p(ctx, -1, -8, 3, 1, '#19221e');
      p(ctx, -7, -12, 2, 2, 'rgba(255,255,255,0.5)');
      p(ctx, 5, -13, 2, 1, 'rgba(255,255,255,0.45)');
      px(ctx, -2 + Math.round(Math.sin(time * 2 + (e.anim || 0))), -15, C(light));
      ctx.restore();
      break;
    }
    case 'wolf': {
      p(ctx, -11, -11, 20, 8, C(c));
      p(ctx, -11, -11, 20, 2, C(light));
      p(ctx, -4, -18, 7, 7, C(c));
      p(ctx, -12, -16, 5, 5, C(dark));
      p(ctx, -13, -13, 4, 3, C(dark));
      p(ctx, -6, -20, 2, 4, C(dark)); p(ctx, 0, -20, 2, 4, C(dark));
      p(ctx, -3, -15, 2, 2, '#ffd166'); p(ctx, 1, -15, 2, 2, '#ffd166');
      p(ctx, -9, -4, 3, 4 + run, C(dark)); p(ctx, 2, -4, 3, 4 - run, C(dark));
      p(ctx, -2, -13, 3, 1, '#f7f0dc');
      p(ctx, -7, -10, 2, 1, C(light)); p(ctx, -3, -9, 2, 1, C(light));
      p(ctx, 5, -9, 2, 1, C(dark));
      p(ctx, -8, -3 + Math.round(run), 2, 1, C(light));
      // tail
      p(ctx, 8, -15, 4, 2, C(dark)); p(ctx, 11, -18, 2, 4, C(dark));
      break;
    }
    case 'humanoid': case 'raider': {
      const cloth = C(c), metal = C(shade(c, -0.3));
      p(ctx, -5, -26, 10, 12, cloth);
      p(ctx, -6, -25, 12, 2, metal);
      p(ctx, -5, -14, 4, 9, '#3a2c22');
      p(ctx, 2, -14, 4, 9, '#3a2c22');
      p(ctx, -4, -35, 8, 9, C('#d6a37a'));
      p(ctx, -5, -37, 10, 4, metal);
      p(ctx, -3, -31, 2, 2, '#1b141d'); p(ctx, 2, -31, 2, 2, '#1b141d');
      // weapon raises over the head while striking
      const wr = Math.round(atk * 4);
      p(ctx, 8, -30 - wr, 2, 20, '#8a6a45');
      p(ctx, 6, -32 - wr, 6, 2, '#c7ccd6');
      break;
    }
    case 'tree': {
      p(ctx, -6, -26, 12, 26, C('#5a3f27'));
      p(ctx, -10, -38, 20, 14, C(dark));
      p(ctx, -8, -45, 16, 10, C(c));
      p(ctx, -12, -34, 8, 8, C(c));
      p(ctx, 4, -33, 7, 7, C(light));
      p(ctx, -5, -28, 3, 3, '#ffb23e'); p(ctx, 2, -28, 3, 3, '#ffb23e');
      p(ctx, -4, -22, 8, 2, '#2b1d14');
      p(ctx, -11, -42, 4, 3, C(light));
      break;
    }
    case 'boar': {
      p(ctx, -12, -12, 23, 10, C(c));
      p(ctx, -12, -12, 23, 3, C(light));
      p(ctx, -6, -19, 10, 8, C(c));
      p(ctx, -9, -21, 3, 4, C(dark)); p(ctx, 1, -21, 3, 4, C(dark));
      p(ctx, -12, -8, 4, 3, '#f2e5c8');
      p(ctx, -12, -8, 2, 4, '#f7f0dc');
      p(ctx, -7, -16, 2, 2, '#ff5a3c');
      p(ctx, -9, -3, 3, 4 + run, C(dark)); p(ctx, 2, -3, 3, 4 - run, C(dark));
      p(ctx, -3, -10, 2, 2, '#5a3a24');
      break;
    }
    case 'golem': {
      const rock = C(c), rockD = C(dark);
      p(ctx, -11, -30, 22, 20, rock);
      p(ctx, -8, -34, 16, 6, rockD);
      p(ctx, -14, -28, 5, 12, rockD);
      p(ctx, 9, -28, 5, 12, rockD);
      p(ctx, -10, -12, 6, 12, rockD);
      p(ctx, 4, -12, 6, 12, rockD);
      p(ctx, -7, -38, 14, 8, rock);
      const ember = '#ffb23e';
      ctx.globalAlpha = 0.72 + Math.sin(time * 5 + (e.anim || 0)) * 0.22;
      p(ctx, -4, -35, 3, 3, ember); p(ctx, 2, -35, 3, 3, ember);
      ctx.globalAlpha = 1;
      p(ctx, -6, -26, 3, 3, C(light)); p(ctx, 5, -20, 3, 4, C(light));
      p(ctx, -2, -28, 1, 4, C(rockD)); p(ctx, -1, -25, 3, 1, C(rockD));
      p(ctx, 7, -29, 1, 3, C(rockD)); p(ctx, 6, -27, 2, 1, C(rockD));
      break;
    }
    case 'spider': {
      for (const [sx, sy, ex, ey] of [[-5,-12,-16,-3],[-4,-13,-12,2],[4,-12,14,-3],[5,-13,12,2],[-4,-8,-13,-9],[4,-8,12,-9]]) {
        ctx.strokeStyle = C(dark); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
      p(ctx, -9, -18, 18, 11, C(c));
      p(ctx, -7, -21, 14, 6, C(light));
      p(ctx, -5, -18, 3, 3, '#ff4d6d'); p(ctx, 2, -18, 3, 3, '#ff4d6d');
      p(ctx, -3, -14, 6, 1, C(dark));
      break;
    }
    case 'lurker': case 'toad': {
      const wide = kind === 'toad' ? 14 : 11;
      p(ctx, -wide, -13, wide * 2, 13, C(c));
      p(ctx, -wide + 2, -17, wide * 2 - 4, 6, C(light));
      p(ctx, -6, -17, 4, 4, '#ffd166'); p(ctx, 2, -17, 4, 4, '#ffd166');
      p(ctx, -8, -4, 4, 4, C(dark)); p(ctx, 4, -4, 4, 4, C(dark));
      p(ctx, -4, -8, 8, 2, C(dark));
      if (kind === 'toad') {
        p(ctx, -9, -11, 2, 3, C(light)); p(ctx, 7, -11, 2, 3, C(light));
      } else {
        p(ctx, -12, -10, 3, 8, C(dark)); p(ctx, 9, -10, 3, 8, C(dark));
      }
      break;
    }
    case 'ghost': {
      ctx.globalAlpha = 0.85;
      p(ctx, -8, -28, 16, 16, C(c));
      p(ctx, -7, -33, 14, 7, C(light));
      p(ctx, -9, -30, 3, 8, C(dark)); p(ctx, 6, -30, 3, 8, C(dark));
      p(ctx, -5, -25, 3, 3, '#1a1a2a'); p(ctx, 2, -25, 3, 3, '#1a1a2a');
      p(ctx, -4, -25, 1, 1, '#c6f4ff'); p(ctx, 3, -25, 1, 1, '#c6f4ff');
      p(ctx, -6, -15, 12, 10, C(c));
      p(ctx, -6, -6, 3, 4, 'rgba(180,220,255,0.35)');
      p(ctx, 0, -9, 3, 6, 'rgba(180,220,255,0.35)');
      p(ctx, 5, -6, 2, 3, 'rgba(180,220,255,0.3)');
      ctx.globalAlpha = 1;
      break;
    }
    case 'skeleton': {
      p(ctx, -5, -27, 10, 2, C('#d8d5c8'));
      p(ctx, -1, -25, 2, 12, C('#c9c6b8'));
      for (let i = 0; i < 3; i++) p(ctx, -5, -24 + i * 3, 10, 1, C('#c9c6b8'));
      p(ctx, -6, -14, 3, 10, C('#c9c6b8')); p(ctx, 3, -14, 3, 10, C('#c9c6b8'));
      p(ctx, -4, -35, 8, 8, C('#e2dfd2'));
      p(ctx, -3, -32, 2, 2, '#3c2f55'); p(ctx, 2, -32, 2, 2, '#3c2f55');
      p(ctx, -1, -28, 2, 1, '#3c2f55');
      // sword
      const ws = Math.round(atk * 4);
      p(ctx, 8, -29 - ws, 2, 18, '#c7ccd6');
      p(ctx, 6, -13 - ws, 6, 2, '#8a6a45');
      // cape
      p(ctx, -8, -25, 3, 16, C(dark));
      break;
    }
    case 'hound': {
      p(ctx, -12, -12, 24, 8, C(c));
      p(ctx, -14, -16, 7, 6, C(dark));
      p(ctx, -9, -19, 4, 5, C(dark)); p(ctx, -2, -20, 4, 5, C(dark));
      p(ctx, -6, -15, 3, 3, '#ff4d6d'); p(ctx, 2, -15, 3, 3, '#ff4d6d');
      p(ctx, -9, -3, 3, 4 + run, C(dark)); p(ctx, 4, -3, 3, 4 - run, C(dark));
      p(ctx, -4, -11, 8, 2, C(light));
      p(ctx, 10, -18, 4, 2, C(dark)); p(ctx, 13, -14, 2, 6, C(dark));
      break;
    }
    case 'elemental': {
      p(ctx, -10, -30, 20, 22, C(c));
      p(ctx, -7, -36, 14, 8, C(light));
      p(ctx, -4, -32, 3, 3, '#fff'); p(ctx, 2, -33, 3, 3, '#fff');
      p(ctx, -12, -25, 4, 10, C(dark)); p(ctx, 8, -25, 4, 10, C(dark));
      p(ctx, -8, -8, 5, 7, C(dark)); p(ctx, 3, -8, 5, 7, C(dark));
      p(ctx, -5, -22, 2, 8, 'rgba(255,255,255,0.4)');
      p(ctx, 2, -28, 2, 12, 'rgba(255,255,255,0.3)');
      break;
    }
    case 'yeti': {
      p(ctx, -12, -28, 24, 20, C(c));
      p(ctx, -10, -34, 20, 9, C(light));
      p(ctx, -6, -31, 4, 4, '#3c2f55'); p(ctx, 2, -31, 4, 4, '#3c2f55');
      p(ctx, -8, -24, 16, 3, C(dark));
      p(ctx, -14, -24, 5, 13, C(dark)); p(ctx, 9, -24, 5, 13, C(dark));
      p(ctx, -9, -9, 7, 9, C(dark)); p(ctx, 2, -9, 7, 9, C(dark));
      p(ctx, -4, -26, 8, 2, '#f2e5c8');
      break;
    }
    case 'scarab': {
      p(ctx, -9, -14, 18, 10, C(c));
      p(ctx, -6, -17, 12, 5, C(light));
      p(ctx, -2, -17, 4, 8, C(dark));
      for (const sx of [-8, -4, 4, 8]) { p(ctx, sx, -6, 2, 5 + (sx < 0 ? run : -run), C(dark)); }
      p(ctx, -7, -20, 2, 3, C(dark)); p(ctx, 5, -20, 2, 3, C(dark));
      p(ctx, -3, -12, 6, 3, 'rgba(255,230,150,0.5)');
      break;
    }
    case 'scorpion': {
      p(ctx, -11, -12, 22, 8, C(c));
      p(ctx, -8, -15, 16, 4, C(light));
      p(ctx, -14, -10, 5, 3, C(dark)); p(ctx, 9, -10, 5, 3, C(dark));
      for (const sx of [-8, -3, 3, 8]) p(ctx, sx, -5, 2, 5, C(dark));
      // tail
      p(ctx, 8, -17, 3, 7, C(dark)); p(ctx, 5, -23, 4, 7, C(c)); p(ctx, 0, -26, 6, 4, C(dark));
      p(ctx, -1, -28, 3, 3, '#ffd166');
      p(ctx, -6, -14, 2, 2, '#ff4d6d');
      break;
    }
    case 'wyrm': {
      p(ctx, -15, -14, 20, 9, C(c));
      p(ctx, -14, -17, 16, 5, C(light));
      p(ctx, 2, -20, 9, 9, C(dark));
      p(ctx, 8, -26, 6, 8, C(c));
      p(ctx, 12, -28, 5, 4, C(light));
      px(ctx, 15, -27, 1, 1, '#ffd166');
      p(ctx, -17, -12, 5, 4, C(dark));
      p(ctx, -18, -9, 4, 3, C(dark));
      // spikes
      p(ctx, -9, -20, 2, 4, C(light)); p(ctx, -3, -19, 2, 3, C(light)); p(ctx, 3, -22, 2, 3, C(light));
      // wings
      p(ctx, -6, -28, 12, 3, C(dark)); p(ctx, -10, -31, 8, 4, C(c)); p(ctx, 5, -31, 7, 4, C(c));
      break;
    }
    case 'demon': {
      p(ctx, -6, -26, 12, 14, C(c));
      p(ctx, -8, -24, 4, 10, C(dark)); p(ctx, 5, -24, 4, 10, C(dark));
      p(ctx, -5, -14, 4, 9, C(dark)); p(ctx, 2, -14, 4, 9, C(dark));
      p(ctx, -4, -35, 9, 9, C('#d19a88'));
      p(ctx, -6, -38, 2, 4, C(dark)); p(ctx, 4, -38, 2, 4, C(dark));
      p(ctx, -3, -32, 2, 2, '#ffd166'); p(ctx, 2, -32, 2, 2, '#ffd166');
      // wings
      p(ctx, -10, -30, 8, 2, C(shade(c, -0.2)));
      p(ctx, -14, -34, 6, 5, C(dark));
      p(ctx, 3, -30, 8, 2, C(shade(c, -0.2)));
      p(ctx, 9, -34, 6, 5, C(dark));
      // weapon
      p(ctx, 8, -28, 2, 18, '#c24a35');
      p(ctx, 6, -12, 6, 2, '#4a2b2b');
      break;
    }
    case 'knight': {
      p(ctx, -7, -27, 14, 14, C(c));
      p(ctx, -8, -26, 16, 2, C(light));
      p(ctx, -6, -14, 5, 10, C(dark)); p(ctx, 2, -14, 5, 10, C(dark));
      p(ctx, -6, -36, 12, 9, C(shade(c, -0.1)));
      p(ctx, -4, -33, 8, 2, '#ff5a3c');
      p(ctx, -10, -30, 4, 7, C(dark)); p(ctx, 6, -30, 4, 7, C(dark));
      // great axe raises while striking
      const wa = Math.round(atk * 3);
      p(ctx, 10, -33 - wa, 2, 28, '#4a2b2b');
      p(ctx, 7, -34 - wa, 8, 6, '#aab2c2');
      p(ctx, 7, -30 - wa, 8, 2, '#e8ecf4');
      break;
    }
    case 'sentinel': {
      ctx.translate(0, -6);
      p(ctx, -8, -22, 16, 16, C(c));
      p(ctx, -5, -27, 10, 6, C(light));
      p(ctx, -3, -23, 6, 3, '#fff');
      p(ctx, -10, -20, 2, 10, C(dark)); p(ctx, 9, -20, 2, 10, C(dark));
      p(ctx, -5, -6, 3, 6, C(dark)); p(ctx, 3, -6, 3, 6, C(dark));
      p(ctx, -2, -4, 4, 1, C(light));
      // floating shards
      p(ctx, -13, -26, 3, 3, C(light)); p(ctx, 11, -30, 2, 2, C(light));
      break;
    }
    case 'seraph': {
      p(ctx, -5, -26, 10, 14, C('#e8dcc0'));
      p(ctx, -5, -14, 4, 9, C('#d8c8a0')); p(ctx, 2, -14, 4, 9, C('#d8c8a0'));
      p(ctx, -4, -34, 9, 9, C('#f0c9a4'));
      p(ctx, -5, -36, 11, 3, C('#e8dcc0'));
      p(ctx, -3, -31, 2, 2, '#ffb23e'); p(ctx, 2, -31, 2, 2, '#ffb23e');
      // wings
      drawWings(ctx, { style: 'seraph', palette: ['#fffbe8', '#ffe08a', '#ffb23e'] }, time, -26, false);
      // halo
      p(ctx, -3, -38, 7, 1, '#ffe9a3');
      p(ctx, 7, -26, 2, 16, '#d5a44c');
      break;
    }
    default: {
      p(ctx, -8, -22, 16, 22, C(c));
      p(ctx, -6, -27, 12, 6, C(light));
      p(ctx, -4, -24, 2, 2, '#1b141d'); p(ctx, 2, -24, 2, 2, '#1b141d');
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------
// NPCS
// ------------------------------------------------------------
export function drawNpc(ctx, npc, time) {
  const c = npc.color || '#d9c07a';
  const bob = Math.sin(time * 1.8 + (npc.anim || 0)) * 0.5;
  ctx.save();
  ctx.translate(0, bob);
  const dark = shade(c, -0.22);
  const light = shade(c, 0.16);
  // robe
  p(ctx, -6, -28, 12, 18, c);
  p(ctx, -7, -12, 14, 12, dark);
  p(ctx, -5, -30, 10, 3, light);
  p(ctx, -6, -24, 12, 1, light);
  p(ctx, -2, -28, 2, 15, light);
  // arms
  p(ctx, -8, -27, 3, 11, dark);
  p(ctx, 5, -27, 3, 11, dark);
  p(ctx, -8, -16, 3, 3, '#e8b98f');
  p(ctx, 5, -16, 3, 3, '#e8b98f');
  // head
  p(ctx, -5, -38, 10, 9, '#e8b98f');
  p(ctx, -4, -34, 2, 2, '#2a2133');
  p(ctx, 2, -34, 2, 2, '#2a2133');
  // hair/hood
  p(ctx, -6, -41, 12, 4, '#3a2c2a');
  p(ctx, -6, -38, 2, 5, '#3a2c2a');
  p(ctx, 4, -38, 2, 5, '#3a2c2a');
  ctx.restore();
}

// ------------------------------------------------------------
// ENVIRONMENT PROPS
// ------------------------------------------------------------
export function drawProp(ctx, prop, time, biome = {}) {
  const v = prop.variant || 0;
  const s = prop.scale || 1;
  const flick = Math.sin(time * 4 + v) * 0.5 + 0.5;
  const type = prop.kind || prop.type;
  ctx.save();
  if (prop.flip) ctx.scale(-1, 1);
  ctx.scale(s, s);
  switch (type) {
    case 'tree': {
      const leaf = biome.leaf || '#4f8a4b';
      const leaf2 = shade(leaf, 0.14);
      const leaf3 = shade(leaf, -0.2);
      const leaf4 = shade(leaf, 0.24);
      const sway = Math.sin(time * 1.4 + v * 0.7) * 0.7;
      const sway2 = Math.sin(time * 1.4 + v * 0.7 + 0.9) * 0.9;
      // trunk with moss and root flare
      p(ctx, -3, -18, 6, 18, '#6a4a2f');
      p(ctx, -3, -18, 2, 18, '#7d5836');
      p(ctx, -5, -14, 3, 3, '#5a8a3e');           // moss clump
      p(ctx, 2, -8, 2, 2, shade('#5a8a3e', -0.1));
      p(ctx, -5, -14, 4, 2, '#5a3f27');
      p(ctx, -2, -1, 10, 2, '#5a3f27');           // root flare
      // crown layers (sway with the wind)
      p(ctx, -18 + sway, -26, 9, 8, leaf3);
      p(ctx, 9 + sway, -28, 7, 7, leaf);
      p(ctx, -12 + sway, -30, 24, 14, leaf3);
      p(ctx, -10 + sway, -38, 20, 12, leaf);
      p(ctx, -7 + sway2, -44, 14, 9, leaf2);
      p(ctx, -3 + sway2, -47, 8, 5, shade(leaf, 0.3));
      p(ctx, 4 + sway, -36, 5, 3, leaf2);
      p(ctx, 12 + sway, -33, 5, 4, shade(leaf, 0.2));
      // sunlit edge + shadowed underside
      p(ctx, -12 + sway, -30, 24, 2, leaf4);
      p(ctx, -12 + sway, -18, 20, 2, 'rgba(0,0,10,0.18)');
      p(ctx, -8 + sway, -41, 4, 2, 'rgba(255,255,255,0.14)');
      p(ctx, 2 + sway2, -45, 3, 2, 'rgba(255,255,255,0.2)');
      break;
    }
    case 'pine': case 'pine_snow': {
      const snow = type === 'pine_snow';
      const leaf = snow ? '#2f5946' : (biome.pine || '#356044');
      const leaf2 = shade(leaf, 0.16);
      const leaf3 = shade(leaf, -0.16);
      const sway = Math.sin(time * 1.1 + v) * 0.6;
      p(ctx, -2, -12, 4, 12, '#4a3324');
      p(ctx, -2, -12, 1, 12, '#5d4430');
      p(ctx, -5, -2, 3, 2, '#4a3324');           // root
      p(ctx, 3, -2, 3, 2, '#4a3324');
      p(ctx, -9 + sway, -22, 18, 11, leaf3);
      p(ctx, -9 + sway, -22, 18, 3, leaf);
      p(ctx, -7 + sway, -31, 14, 11, leaf);
      p(ctx, -7 + sway, -31, 14, 2, leaf2);
      p(ctx, -5 + sway, -39, 10, 10, leaf);
      p(ctx, -2 + sway, -44, 4, 7, leaf);
      if (snow) {
        p(ctx, -9 + sway, -22, 18, 2, '#eef6fa');
        p(ctx, -7 + sway, -31, 14, 2, '#eef6fa');
        p(ctx, -5 + sway, -39, 10, 2, '#eef6fa');
        p(ctx, -2 + sway, -44, 4, 2, '#fff');
        p(ctx, -11 + sway, -18, 4, 2, '#d7e6ef');
        p(ctx, 5 + sway, -16, 3, 2, '#d7e6ef');
      } else {
        p(ctx, -4 + sway, -28, 9, 2, shade(leaf, 0.24));
        p(ctx, 2 + sway, -20, 6, 2, shade(leaf, 0.1));
      }
      break;
    }
    case 'dead_tree': {
      p(ctx, -2, -26, 5, 26, '#4a3a34');
      p(ctx, -2, -26, 2, 26, '#5d4a44');
      p(ctx, -10, -30, 9, 3, '#4a3a34');
      p(ctx, -12, -36, 3, 7, '#4a3a34');
      p(ctx, 5, -26, 8, 3, '#4a3a34');
      p(ctx, 10, -33, 3, 8, '#4a3a34');
      p(ctx, 10, -39, 4, 6, '#4a3a34');
      p(ctx, -6, -20, 7, 2, '#3a2c2a');
      p(ctx, -1, -30, 6, 2, '#3a2c2a');
      if (v % 3 === 0) {
        p(ctx, -6, -18, 3, 2, '#4e4048');       // woodpecker hole
        p(ctx, -5, -17, 1, 1, '#241c20');
      }
      break;
    }
    case 'bush': {
      const c = biome.bush || '#3f7a44';
      const d = shade(c, -0.18), l = shade(c, 0.2);
      p(ctx, -7, -6, 14, 6, d);
      p(ctx, -6, -9, 12, 5, c);
      p(ctx, -4, -11, 5, 3, l);
      p(ctx, 3, -8, 3, 3, l);
      p(ctx, -6, -4, 4, 2, shade(c, -0.26));
      p(ctx, 6, -7, 2, 2, shade(c, -0.26));
      if (v % 3 === 0) {
        px(ctx, -3, -10, '#ff5a6b');
        px(ctx, 1, -9, '#ff5a6b');
        px(ctx, -2, -8, '#ffd166');
      } else if (v % 3 === 1) {
        px(ctx, 0, -11, '#e8f0ff');
        px(ctx, -4, -9, '#e8f0ff');
      }
      break;
    }
    case 'flowers': {
      const cols = ['#ffd166', '#ff8fa3', '#a99bff', '#8fe2ff', '#f7f4ea'];
      for (let i = 0; i < 7; i++) {
        const fx = -6 + (i * 4) % 13;
        const fy = -4 + ((i * 5) % 5);
        p(ctx, fx, fy, 1, 4, i % 2 ? '#4f7a43' : '#5d8a4d');
        px(ctx, fx, fy - 1, cols[(v + i) % cols.length]);
        if (i % 3 === 0) px(ctx, fx - 1, fy - 1, cols[(v + i + 2) % cols.length]);
      }
      break;
    }
    case 'stump': {
      p(ctx, -5, -6, 10, 6, '#5a3f27');
      p(ctx, -5, -7, 10, 2, '#7a5a37');
      p(ctx, -2, -7, 4, 1, '#5a3f27');
      break;
    }
    case 'rock': case 'rock_snow': {
      const snow = type === 'rock_snow';
      p(ctx, -7, -8, 14, 8, '#6f737a');
      p(ctx, -5, -11, 10, 5, '#858a91');
      p(ctx, -3, -12, 5, 2, '#9aa0a6');
      p(ctx, -6, -5, 3, 3, '#5d6068');           // facet shadow
      p(ctx, 3, -4, 3, 3, '#5d6068');
      p(ctx, 1, -10, 3, 2, '#a6adb4');           // sun facet
      if (v % 4 === 0) px(ctx, -2, -6, '#6b8a4f');   // moss
      if (snow) {
        p(ctx, -5, -11, 10, 2, '#eef6fa');
        p(ctx, -3, -9, 5, 1, '#d7e6ef');
      }
      break;
    }
    case 'boulder': {
      p(ctx, -10, -14, 20, 14, '#676b73');
      p(ctx, -8, -19, 16, 7, '#7f858d');
      p(ctx, -4, -21, 8, 4, '#969ca3');
      p(ctx, 2, -18, 6, 3, '#a8aeb5');
      p(ctx, -6, -14, 4, 3, '#565a61');
      p(ctx, 4, -10, 5, 4, '#565a61');
      ctx.strokeStyle = 'rgba(30,30,38,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-2, -19); ctx.lineTo(1, -12); ctx.lineTo(-2, -6); ctx.stroke();
      if (v % 3 === 0) {
        px(ctx, -7, -13, '#6b8a4f');
        px(ctx, -6, -14, '#7fa25e');
        px(ctx, 6, -16, '#6b8a4f');
      }
      break;
    }
    case 'ore': {
      p(ctx, -7, -8, 14, 8, '#5a4a42');
      p(ctx, -4, -12, 6, 6, '#c07a3c');
      p(ctx, -1, -10, 3, 2, '#ffd166');
      p(ctx, 3, -7, 3, 4, '#a05a2c');
      break;
    }
    case 'forge': {
      p(ctx, -14, -20, 28, 20, '#4a3a34');
      p(ctx, -12, -24, 24, 6, '#5a4a42');
      p(ctx, -8, -12, 16, 9, '#2b1f1b');
      p(ctx, -5, -8, 10, 6, '#ff7a3c');
      p(ctx, -2, -6, 4, 4, '#ffd166');
      p(ctx, 10, -26, 3, 8, '#3a2c2a');
      p(ctx, 8, -28, 7, 2, '#6f737a');
      break;
    }
    case 'mushroom': {
      const glow = biome.mushroom || '#9b6bff';
      const pulse = Math.sin(time * 2 + v * 0.5) * 0.5 + 0.5;
      ctx.globalAlpha = 0.14 + pulse * 0.12;
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0, -10, 11, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      p(ctx, -2, -8, 4, 8, '#d8c8a8');
      p(ctx, -2, -8, 1, 8, '#e6d8bc');
      p(ctx, -8, -12, 16, 6, glow);
      p(ctx, -6, -15, 12, 4, shade(glow, 0.18));
      p(ctx, -4, -16, 8, 2, shade(glow, 0.3));
      p(ctx, -3, -11, 2, 1, '#fff');
      p(ctx, 4, -10, 2, 1, '#fff');
      px(ctx, -6, -13, shade(glow, 0.45));
      px(ctx, 5, -14, shade(glow, 0.45));
      break;
    }
    case 'web': {
      ctx.strokeStyle = 'rgba(220,220,240,0.45)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.moveTo(-8 + i * 4, -18); ctx.lineTo(8 - i * 3, -16 + i * 2);
      }
      ctx.moveTo(-6, -16); ctx.lineTo(0, 0); ctx.lineTo(6, -16);
      ctx.stroke();
      break;
    }
    case 'grave': {
      p(ctx, -5, -14, 10, 14, '#5a5d68');
      p(ctx, -5, -14, 3, 14, '#6f737a');
      p(ctx, -4, -17, 8, 4, '#6f737a');
      p(ctx, -4, -12, 8, 1, '#464952');
      p(ctx, -1, -15, 2, 4, '#9aa0a6');
      ctx.strokeStyle = 'rgba(40,42,50,0.6)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(1, -12); ctx.lineTo(3, -7); ctx.lineTo(2, -3); ctx.stroke();
      p(ctx, -4, -4, 8, 1, '#3f7a44');
      if (v % 3 === 0) px(ctx, 2, -16, '#6b8a4f');
      break;
    }
    case 'bone': {
      p(ctx, -5, -2, 10, 2, '#d8d5c8');
      p(ctx, -6, -3, 2, 2, '#d8d5c8');
      p(ctx, 4, -3, 2, 2, '#d8d5c8');
      break;
    }
    case 'crypt': {
      p(ctx, -14, -22, 28, 22, '#4c4f59');
      p(ctx, -12, -28, 24, 7, '#5a5d68');
      p(ctx, -3, -8, 10, 8, '#2b2e36');
      p(ctx, 5, -9, 2, 2, '#ffd166');
      p(ctx, -11, -19, 3, 8, '#3a3d46');
      p(ctx, 8, -19, 3, 8, '#3a3d46');
      break;
    }
    case 'candle': {
      p(ctx, -1, -4, 2, 4, '#e8e0c8');
      p(ctx, -1, -6, 2, 2, '#ffcf5c');
      p(ctx, -2, -7, 3, 1, '#ff8a3c');
      break;
    }
    case 'ice': {
      p(ctx, -7, -12, 14, 12, 'rgba(170,225,245,0.75)');
      p(ctx, -5, -17, 10, 6, '#bfefff');
      p(ctx, -3, -21, 6, 5, '#e7faff');
      p(ctx, -4, -10, 2, 7, 'rgba(255,255,255,0.6)');
      break;
    }
    case 'crystal': {
      const c = biome.crystal || '#85d6f0';
      const pulse = Math.sin(time * 2 + v) * 0.5 + 0.5;
      ctx.globalAlpha = 0.16 + pulse * 0.12;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(0, -12, 12 + pulse * 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      p(ctx, -5, -20, 10, 20, shade(c, -0.2));
      p(ctx, -3, -24, 6, 5, c);
      p(ctx, -2, -22, 2, 14, shade(c, 0.35));
      p(ctx, 1, -24, 1, 12, shade(c, 0.5));
      p(ctx, 5, -12, 4, 12, shade(c, -0.05));
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-3 - pulse * 1.5, -26, 1, 2 + pulse * 2);
      break;
    }
    case 'snowman': {
      p(ctx, -6, -9, 12, 9, '#eef6fa');
      p(ctx, -5, -15, 10, 7, '#eef6fa');
      p(ctx, -3, -12, 2, 2, '#2a2133'); p(ctx, 1, -12, 2, 2, '#2a2133');
      p(ctx, -1, -9, 2, 1, '#ff8a3c');
      p(ctx, -7, -17, 14, 2, '#2a2133');
      p(ctx, -2, -18, 4, 2, '#2a2133');
      break;
    }
    case 'cactus': {
      p(ctx, -3, -18, 6, 18, '#4f8a4b');
      p(ctx, -8, -14, 5, 9, '#4f8a4b');
      p(ctx, -8, -8, 5, 3, '#4f8a4b');
      p(ctx, 3, -11, 5, 8, '#4f8a4b');
      p(ctx, 3, -5, 5, 3, '#4f8a4b');
      p(ctx, -2, -16, 1, 12, '#7ab86a');
      p(ctx, -1, -20, 2, 2, '#ffd166');
      break;
    }
    case 'dune': {
      p(ctx, -10, -4, 20, 4, '#c5a05a');
      p(ctx, -7, -6, 14, 3, '#d9b56b');
      break;
    }
    case 'pillar': {
      p(ctx, -5, -26, 10, 26, '#9a8a6a');
      p(ctx, -7, -28, 14, 3, '#b5a37a');
      p(ctx, -7, -2, 14, 2, '#7d6a45');
      p(ctx, -3, -22, 2, 16, '#b5a37a');
      break;
    }
    case 'bones': {
      p(ctx, -6, -3, 12, 2, '#d8d5c8');
      p(ctx, -7, -5, 3, 3, '#d8d5c8');
      p(ctx, 4, -5, 3, 3, '#d8d5c8');
      p(ctx, 0, -6, 2, 5, '#c9c6b8');
      break;
    }
    case 'palm': {
      p(ctx, -2, -28, 5, 28, '#7a5a37');
      p(ctx, -3, -18, 6, 2, '#5a3f27');
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI - Math.PI / 2;
        p(ctx, Math.cos(a) * 10 - 2, -30 + Math.sin(a) * 4, 10, 2, '#4f8a4b');
      }
      p(ctx, -10, -32, 8, 3, '#65a05a');
      p(ctx, 4, -33, 8, 3, '#3f7a44');
      break;
    }
    case 'obelisk': {
      p(ctx, -6, -34, 12, 34, '#3f3a44');
      p(ctx, -4, -38, 8, 5, '#5a5260');
      p(ctx, -2, -30, 4, 3, '#a99bff');
      p(ctx, -2, -22, 4, 3, '#a99bff');
      p(ctx, -2, -14, 4, 3, '#a99bff');
      break;
    }
    case 'obsidian': {
      p(ctx, -6, -16, 12, 16, '#2b1f2e');
      p(ctx, -4, -22, 8, 7, '#3d2b42');
      p(ctx, -2, -25, 4, 4, '#5a3d5e');
      p(ctx, -1, -18, 2, 10, '#ff5a3c');
      break;
    }
    case 'lava_rock': {
      p(ctx, -7, -10, 14, 10, '#3a2a2a');
      p(ctx, -5, -13, 10, 4, '#4a3434');
      p(ctx, -3, -9, 6, 3, '#ff7a3c');
      p(ctx, -1, -11, 2, 2, '#ffd166');
      break;
    }
    case 'spike': {
      p(ctx, -2, -22, 4, 22, '#3a2a2e');
      p(ctx, -1, -26, 2, 5, '#5a3d44');
      p(ctx, -6, -12, 3, 12, '#2b1f2e');
      p(ctx, 4, -14, 3, 14, '#2b1f2e');
      break;
    }
    case 'brazier': {
      // rising sparks
      for (let i = 0; i < 2; i++) {
        const sp = ((time * 2.4 + i * 0.9 + v * 0.2) % 1.4) / 1.4;
        ctx.globalAlpha = (1 - sp) * 0.7;
        ctx.fillStyle = '#ffb23e';
        ctx.fillRect(Math.sin(time * 6 + i) * 2 - 1, -14 - sp * 12, 1, 2);
      }
      ctx.globalAlpha = 1;
      p(ctx, -4, -7, 8, 7, '#4a3a34');
      p(ctx, -4, -7, 8, 2, '#6f5a4a');
      px(ctx, -2, -5, '#2b1f1b');
      p(ctx, -2, -12, 4, 5, '#ff7a3c');
      p(ctx, -1, -16 - flick * 2, 2, 5, '#ffd166');
      p(ctx, -1, -14 - flick * 2, 1, 3, '#fff2c8');
      p(ctx, -5, -8, 10, 2, '#6f737a');
      break;
    }
    case 'rubble': {
      p(ctx, -7, -4, 5, 4, '#5a5260');
      p(ctx, 0, -3, 6, 3, '#4a4450');
      p(ctx, -3, -6, 4, 3, '#6b6270');
      break;
    }
    case 'void_crystal': {
      const c = '#a99bff';
      p(ctx, -5, -24, 10, 24, shade(c, -0.25));
      p(ctx, -3, -30, 6, 7, c);
      p(ctx, -2, -26, 2, 16, shade(c, 0.4));
      p(ctx, 5, -14, 4, 14, shade(c, -0.1));
      p(ctx, -8, -12, 4, 12, shade(c, -0.15));
      // float shards
      p(ctx, -10, -26 + Math.sin(time * 2) * 1.5, 2, 2, c);
      p(ctx, 8, -34 + Math.cos(time * 2) * 1.5, 2, 2, c);
      break;
    }
    case 'rune': {
      ctx.globalAlpha = 0.55 + flick * 0.2;
      p(ctx, -8, -1, 16, 1, '#a99bff');
      p(ctx, -5, -3, 2, 2, '#c9b4ff'); p(ctx, 3, -3, 2, 2, '#c9b4ff');
      p(ctx, -1, -3, 2, 2, '#fff');
      ctx.globalAlpha = 1;
      break;
    }
    case 'star_well': {
      p(ctx, -12, -6, 24, 6, '#4a4478');
      p(ctx, -10, -8, 20, 3, '#6b62a8');
      p(ctx, -7, -7, 14, 3, '#a99bff');
      p(ctx, -3, -7, 6, 2, '#fff');
      p(ctx, -8, -14 + Math.sin(time * 2) * 1, 1, 2, '#c9b4ff');
      p(ctx, 6, -12 + Math.cos(time * 2) * 1, 1, 2, '#c9b4ff');
      break;
    }
    case 'house': {
      const wall = biome.wall || '#a88a63';
      const wallD = shade(wall, -0.15);
      const roof = biome.roof || '#7a3f35';
      const roofL = shade(roof, 0.15);
      const roofD = shade(roof, -0.22);
      // stone foundation
      p(ctx, -18, -6, 36, 6, '#6f6a64');
      p(ctx, -18, -6, 36, 1, '#847e77');
      for (let i = 0; i < 6; i++) px(ctx, -17 + i * 6, -4 + (i % 2), '#5d5852');
      // base
      p(ctx, -18, -20, 36, 15, wallD);
      p(ctx, -17, -21, 34, 14, wall);
      p(ctx, -17, -21, 34, 2, shade(wall, 0.1));
      // timber frame
      p(ctx, -17, -14, 34, 2, '#5a3f27');
      p(ctx, -11, -21, 2, 15, '#5a3f27');
      p(ctx, 9, -21, 2, 15, '#5a3f27');
      p(ctx, -4, -21, 2, 8, '#5f4429');
      p(ctx, 2, -21, 2, 8, '#5f4429');
      // roof with shingle rows
      p(ctx, -21, -28, 42, 8, roof);
      p(ctx, -17, -34, 34, 7, roofL);
      p(ctx, -12, -38, 24, 5, shade(roof, 0.25));
      p(ctx, -21, -28, 42, 2, roofD);
      for (let i = 0; i < 7; i++) p(ctx, -20 + i * 6, -27, 1, 5, roofD);
      for (let i = 0; i < 6; i++) p(ctx, -16 + i * 6, -33, 1, 4, shade(roof, -0.1));
      p(ctx, -12, -38, 24, 1, shade(roof, 0.4));
      // door with step
      p(ctx, -5, -14, 10, 14, '#4a3324');
      p(ctx, -3, -11, 6, 8, '#5f422d');
      px(ctx, 2, -8, 1, 1, '#d5a44c');
      p(ctx, -6, -1, 12, 1, '#7d736a');
      // windows (glow flickers)
      const winGlow = 0.75 + flick * 0.25;
      ctx.globalAlpha = winGlow;
      p(ctx, -14, -19, 5, 5, '#ffcf5c');
      p(ctx, 8, -19, 5, 5, '#ffcf5c');
      ctx.globalAlpha = 1;
      p(ctx, -14, -19, 5, 2, 'rgba(255,255,255,0.25)');
      p(ctx, 8, -19, 5, 2, 'rgba(255,255,255,0.25)');
      p(ctx, -14, -19, 5, 5, 'rgba(20,20,30,0.15)');
      // chimney with drifting smoke
      p(ctx, 10, -42, 4, 8, wallD);
      p(ctx, 9, -43, 6, 2, shade(wallD, -0.1));
      const smokeT = time * 0.9 + v;
      for (let i = 0; i < 3; i++) {
        const sp = ((smokeT + i * 0.8) % 2.4) / 2.4;
        ctx.globalAlpha = (1 - sp) * 0.28;
        const sy = -44 - sp * 14;
        const sx = 12 + Math.sin((smokeT + i) * 2) * 3;
        ctx.fillStyle = '#cfd4de';
        ctx.fillRect(sx, sy, 2 + sp * 2, 2 + sp * 2);
      }
      ctx.globalAlpha = 1;
      // flower box
      p(ctx, -14, -13, 6, 2, '#4f8a4b');
      px(ctx, -12, -14, '#ffd166');
      px(ctx, -10, -14, '#ff8fa3');
      break;
    }
    case 'tent': {
      p(ctx, -14, -22, 28, 4, biome.tent || '#7a4a3c');
      p(ctx, -12, -18, 24, 18, '#5d382e');
      p(ctx, -2, -22, 4, 22, '#7a4a3c');
      p(ctx, -6, -60, 0, 0, '#000');
      p(ctx, -1, -32, 2, 10, '#3a2c2a');
      p(ctx, -10, -18, 8, 14, shade(biome.tent || '#7a4a3c', -0.1));
      p(ctx, 3, -18, 9, 14, shade(biome.tent || '#7a4a3c', -0.15));
      break;
    }
    case 'campfire': {
      // sparks rising before the flame
      for (let i = 0; i < 3; i++) {
        const sp = ((time * 2 + i * 0.7 + v * 0.1) % 1.5) / 1.5;
        ctx.globalAlpha = (1 - sp) * 0.8;
        ctx.fillStyle = i % 2 ? '#ffd166' : '#ff9a4a';
        ctx.fillRect(Math.sin(time * 5 + i * 2) * 3 - 1, -12 - sp * 16, 1, 2);
      }
      ctx.globalAlpha = 1;
      p(ctx, -6, -3, 12, 3, '#4a3324');
      p(ctx, -4, -5, 8, 3, '#5e402c');
      p(ctx, 3, -2, 3, 2, '#3a2a1c');
      p(ctx, -3, -10 - flick * 2, 6, 6, '#ff7a3c');
      p(ctx, -2, -14 - flick * 3, 4, 6, '#ffd166');
      p(ctx, -1, -18 - flick * 2, 2, 5, '#ff5a3c');
      p(ctx, -2, -13 - flick * 3, 2, 4, '#fff2c8');
      // light ring
      ctx.globalAlpha = 0.10 + flick * 0.06;
      ctx.fillStyle = '#ffb23e';
      ctx.beginPath(); ctx.arc(0, -4, 24, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'banner': {
      const c = biome.banner || '#a83232';
      p(ctx, -1, -36, 2, 36, '#4a3324');
      p(ctx, 1, -36, 12, 3, c);
      p(ctx, 1, -33, 10, 13, c);
      p(ctx, 1, -26, 10, 2, '#e8c46a');
      p(ctx, 4, -30, 4, 4, '#e8c46a');
      p(ctx, 10, -36, 1, 14, shade(c, -0.25));
      break;
    }
    case 'stall': {
      // counter with plank seams
      p(ctx, -16, -12, 32, 12, '#6b4a30');
      p(ctx, -16, -13, 32, 3, '#8a6038');
      for (let i = 0; i < 5; i++) p(ctx, -10 + i * 6, -12, 1, 10, '#5d3f28');
      // striped awning
      for (const [i, col] of ['#a83232', '#e8c46a', '#a83232', '#e8c46a'].entries()) {
        p(ctx, -16 + i * 8, -24, 8, 7, col);
      }
      p(ctx, -16, -24, 32, 1, 'rgba(255,255,255,0.25)');
      p(ctx, -16, -18, 32, 1, '#3f2c20');
      p(ctx, -16, -24, 32, 1, '#4a3324');
      p(ctx, -17, -24, 1, 12, '#4a3324');
      p(ctx, 16, -24, 1, 12, '#4a3324');
      // wares on the counter
      p(ctx, -10, -16, 4, 3, '#d5a44c');
      p(ctx, -2, -17, 5, 4, '#5aa9ff');
      p(ctx, 7, -16, 4, 3, '#65d67a');
      p(ctx, -10, -16, 4, 1, '#f2d98c');
      // hanging herbs
      p(ctx, 2, -21, 2, 4, '#4f8a4b');
      p(ctx, -8, -21, 2, 4, '#6d7a3a');
      break;
    }
    case 'crate': {
      p(ctx, -6, -10, 12, 10, '#7a5a37');
      p(ctx, -6, -10, 12, 2, '#9a7648');
      p(ctx, -1, -10, 2, 10, '#5a3f27');
      p(ctx, -6, -5, 12, 1, '#5a3f27');
      break;
    }
    case 'well': {
      p(ctx, -9, -8, 18, 8, '#6f737a');
      p(ctx, -8, -10, 16, 3, '#858a91');
      px(ctx, -6, -7, '#5d6068'); px(ctx, 3, -6, '#5d6068');
      p(ctx, -6, -9, 12, 3, '#2b6d78');
      ctx.fillStyle = 'rgba(215,246,255,0.5)';
      ctx.fillRect(-3 + Math.sin(time * 1.5) * 2, -8, 4, 1);
      p(ctx, -7, -26, 2, 18, '#5a3f27');
      p(ctx, 5, -26, 2, 18, '#5a3f27');
      p(ctx, -7, -26, 2, 2, '#6d4d30'); // beam caps
      p(ctx, 5, -26, 2, 2, '#6d4d30');
      p(ctx, -9, -29, 18, 3, '#7a4a3c');
      p(ctx, -9, -29, 18, 1, '#96603e');
      p(ctx, -5, -24, 10, 2, '#8a6038');
      // rope + bucket
      p(ctx, 0, -24, 1, 12, '#c9b48a');
      p(ctx, -2, -12, 4, 3, '#6d5238');
      p(ctx, -1, -14, 2, 1, '#8a6a44');
      break;
    }
    case 'altar': {
      p(ctx, -11, -8, 22, 8, '#4a3a4e');
      p(ctx, -13, -11, 26, 4, '#5e4a62');
      p(ctx, -6, -15, 12, 5, '#6e5674');
      p(ctx, -4, -17, 8, 3, '#8a6b8f');
      ctx.globalAlpha = 0.3 + flick * 0.15;
      p(ctx, -3, -20, 6, 3, '#d17ad9');
      ctx.globalAlpha = 1;
      break;
    }
    case 'gate': {
      const c = biome.accent || '#a99bff';
      p(ctx, -14, -28, 4, 28, '#3e3548');
      p(ctx, 10, -28, 4, 28, '#3e3548');
      p(ctx, -14, -30, 28, 4, '#4e435a');
      p(ctx, -10, -26, 20, 22, 'rgba(120,90,180,0.28)');
      ctx.globalAlpha = 0.6 + flick * 0.2;
      p(ctx, -8, -24, 16, 18, c);
      ctx.globalAlpha = 0.2;
      p(ctx, -10, -26, 20, 22, '#fff');
      ctx.globalAlpha = 1;
      break;
    }
    case 'signpost': {
      p(ctx, -1, -18, 2, 18, '#5a3f27');
      p(ctx, -8, -18, 16, 5, '#7a5a37');
      p(ctx, -7, -17, 12, 1, '#e8dcc0');
      p(ctx, 6, -18, 4, 2, '#7a5a37');
      break;
    }
    case 'chest': {
      p(ctx, -8, -9, 16, 9, '#7a5a37');
      p(ctx, -8, -13, 16, 5, '#8f6b40');
      p(ctx, -8, -9, 16, 2, '#d5a44c');
      p(ctx, -1, -10, 3, 3, '#d5a44c');
      p(ctx, -8, -13, 3, 12, '#5a3f27');
      p(ctx, 5, -13, 3, 12, '#5a3f27');
      break;
    }
    case 'node': {
      // harvesting node, drawn with its material tint
      const matColors = {
        mat_silverleaf: '#9ee07a', mat_iron_ore: '#c07a3c', mat_spider_silk: '#c9b4ff',
        mat_grave_dust: '#9ec8e8', mat_frost_fang: '#bfefff', mat_sun_relic: '#ffd166',
        mat_ashen_cinder: '#ff7a3c', mat_void_shard: '#a99bff'
      };
      const c = matColors[prop.materialId] || '#9ee07a';
      ctx.globalAlpha = 0.15 + flick * 0.08;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(0, -6, 14, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (prop.materialId === 'mat_iron_ore' || prop.materialId === 'mat_void_shard' || prop.materialId === 'mat_ashen_cinder') {
        p(ctx, -7, -10, 14, 10, '#4a3a42');
        p(ctx, -4, -14, 8, 5, c);
        p(ctx, -2, -18, 4, 5, shade(c, 0.2));
      } else if (prop.materialId === 'mat_spider_silk') {
        p(ctx, -7, -8, 14, 8, '#4f3a5e');
        p(ctx, -5, -11, 10, 4, c);
        p(ctx, -2, -14, 4, 4, shade(c, 0.3));
      } else {
        for (let i = 0; i < 4; i++) p(ctx, -5 + i * 3, -6 - (i % 2) * 4, 2, 7, '#4f7a43');
        p(ctx, -4, -12, 4, 3, c);
        p(ctx, 1, -9, 3, 2, shade(c, 0.2));
      }
      break;
    }
    default: {
      p(ctx, -6, -8, 12, 8, '#6f737a');
      p(ctx, -4, -12, 8, 5, '#858a91');
    }
  }
  ctx.restore();
}

export { shade, OUT };
