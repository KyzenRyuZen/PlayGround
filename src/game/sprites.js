import { rngFrom } from '../core/utils.js';

const TAU = Math.PI * 2;
const hexRgb = (h) => { const c = h.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; };
const mix = (a, b, t) => {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
};
const lighten = (c, t) => mix(c, '#ffffff', t);
const darken = (c, t) => mix(c, '#000000', t);
const alpha = (h, a) => { const c = hexRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };

function ell(ctx, x, y, rx, ry, rot = 0, fill = '#fff') { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); }
function poly(ctx, pts, fill, stroke, lw = 1) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function glowEye(ctx, x, y, r, color) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
  g.addColorStop(0, alpha(color, 0.95)); g.addColorStop(0.4, alpha(color, 0.5)); g.addColorStop(1, alpha(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawWolf(ctx, c) {
  const fur = c.tint, dark = darken(fur, 0.35), light = lighten(fur, 0.2);
  // tail
  ctx.strokeStyle = dark; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(30, 72); ctx.quadraticCurveTo(10, 62, 12, 45); ctx.stroke();
  // legs
  ctx.fillStyle = dark;
  for (const x of [40, 55, 78, 92]) { ctx.beginPath(); ctx.roundRect(x, 84, 7, 28, 3); ctx.fill(); }
  // body
  const g = ctx.createLinearGradient(20, 50, 100, 90);
  g.addColorStop(0, light); g.addColorStop(0.6, fur); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(65, 70, 39, 22, -0.08, 0, TAU); ctx.fill();
  // mane
  ctx.fillStyle = darken(fur, 0.15);
  ctx.beginPath(); ctx.ellipse(79, 59, 20, 18, 0.2, 0, TAU); ctx.fill();
  for (let i = 0; i < 5; i++) { poly(ctx, [[64 + i * 5, 50], [61 + i * 5, 38], [69 + i * 5, 50]], darken(fur, 0.25)); }
  // head
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(98, 54, 17, 13, -0.1, 0, TAU); ctx.fill();
  // snout
  ctx.fillStyle = lighten(fur, 0.12);
  ctx.beginPath(); ctx.moveTo(104, 48); ctx.quadraticCurveTo(120, 51, 121, 58); ctx.quadraticCurveTo(116, 66, 102, 63); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#171319'; ctx.beginPath(); ctx.ellipse(120, 55, 3, 2.5, 0.2, 0, TAU); ctx.fill();
  // ears
  poly(ctx, [[86, 44], [88, 27], [97, 41]], darken(fur, 0.2));
  poly(ctx, [[98, 40], [105, 25], [108, 43]], fur);
  // eyes + teeth
  glowEye(ctx, 97, 52, 2.1, c.eye);
  glowEye(ctx, 108, 53, 1.8, c.eye);
  ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(109, 61); ctx.lineTo(112, 66); ctx.moveTo(113, 61); ctx.lineTo(116, 65); ctx.stroke();
  // paws
  ctx.fillStyle = darken(fur, 0.45);
  for (const x of [38, 53, 76, 90]) ell(ctx, x + 3, 111, 6, 3.2);
}

function drawBoar(ctx, c) {
  const fur = c.tint, dark = darken(fur, 0.4), light = lighten(fur, 0.18);
  // legs
  ctx.fillStyle = darken(fur, 0.5);
  for (const x of [38, 52, 76, 90]) { ctx.beginPath(); ctx.roundRect(x, 82, 9, 30, 4); ctx.fill(); }
  // body
  const g = ctx.createLinearGradient(20, 45, 100, 95);
  g.addColorStop(0, light); g.addColorStop(0.55, fur); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(63, 74, 42, 27, -0.05, 0, TAU); ctx.fill();
  // bristles
  ctx.strokeStyle = darken(fur, 0.25); ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(35 + i * 6, 52 - (i % 3) * 2); ctx.lineTo(31 + i * 6, 40 - (i % 3) * 3); ctx.stroke(); }
  // head
  ctx.fillStyle = darken(fur, 0.1);
  ctx.beginPath(); ctx.ellipse(96, 69, 24, 22, 0.1, 0, TAU); ctx.fill();
  ctx.fillStyle = lighten(fur, 0.05);
  ctx.beginPath(); ctx.ellipse(110, 76, 15, 10, 0.1, 0, TAU); ctx.fill();
  ctx.fillStyle = darken('#7d5b52', 0.2); ctx.beginPath(); ctx.ellipse(121, 75, 4, 3, 0, 0, TAU); ctx.fill();
  // tusks
  ctx.strokeStyle = '#ede0c2'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(111, 82); ctx.quadraticCurveTo(121, 88, 118, 96); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(104, 83); ctx.quadraticCurveTo(108, 91, 103, 97); ctx.stroke();
  glowEye(ctx, 96, 64, 2, c.eye);
  glowEye(ctx, 108, 66, 1.8, c.eye);
  // mud/hooves
  ctx.fillStyle = '#231b18';
  for (const x of [40, 55, 79, 93]) ell(ctx, x + 4, 112, 7, 3);
}

function drawGoblin(ctx, c) {
  const skin = c.tint, dark = darken(skin, 0.4), light = lighten(skin, 0.2);
  // legs
  ctx.fillStyle = darken(c.cloth, 0.2);
  ctx.beginPath(); ctx.roundRect(50, 80, 11, 32, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(66, 80, 11, 32, 4); ctx.fill();
  ctx.fillStyle = '#221a18'; ell(ctx, 54, 112, 8, 3.5); ell(ctx, 70, 112, 8, 3.5);
  // body
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(63, 68, 21, 26, 0.05, 0, TAU); ctx.fill();
  ctx.fillStyle = rgbaSafe(c.cloth, 0.9);
  ctx.beginPath(); ctx.moveTo(45, 78); ctx.lineTo(81, 78); ctx.lineTo(76, 94); ctx.lineTo(50, 94); ctx.closePath(); ctx.fill();
  // arms
  ctx.strokeStyle = skin; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(46, 60); ctx.quadraticCurveTo(30, 72, 34, 88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(79, 58); ctx.quadraticCurveTo(96, 70, 92, 84); ctx.stroke();
  // head
  ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(65, 38, 18, 16, 0, 0, TAU); ctx.fill();
  // ears
  poly(ctx, [[50, 36], [26, 25], [48, 45]], dark);
  poly(ctx, [[80, 36], [103, 24], [83, 46]], dark);
  // eyes/nose
  glowEye(ctx, 60, 36, 2, c.eye); glowEye(ctx, 71, 36, 2, c.eye);
  ctx.fillStyle = darken(skin, 0.3);
  ctx.beginPath(); ctx.moveTo(64, 40); ctx.lineTo(69, 47); ctx.lineTo(62, 47); ctx.closePath(); ctx.fill();
  // mouth teeth
  ctx.fillStyle = '#e8e0c8'; ctx.fillRect(60, 49, 2, 3); ctx.fillRect(66, 49, 2, 3); ctx.fillRect(63, 50, 2, 2);
  // dagger
  ctx.save(); ctx.translate(93, 82); ctx.rotate(0.35);
  ctx.fillStyle = '#3c2b24'; ctx.fillRect(-2, 0, 4, 10);
  poly(ctx, [[0, -20], [4, 0], [0, 3], [-4, 0]], '#cdd3d8', '#eef', 0.5);
  ctx.restore();
}
function rgbaSafe(h, a) { return alpha(h, a); }

function drawTreant(ctx, c) {
  const bark = c.tint, dark = darken(bark, 0.45), leaf = c.leaf ?? '#3f6b3d';
  // roots
  ctx.strokeStyle = dark; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (const [x, ex] of [[44, 20], [58, 52], [80, 98], [92, 112]]) { ctx.beginPath(); ctx.moveTo(x, 100); ctx.quadraticCurveTo(x - 6, 110, ex, 116); ctx.stroke(); }
  // trunk
  const g = ctx.createLinearGradient(48, 40, 92, 110);
  g.addColorStop(0, lighten(bark, 0.15)); g.addColorStop(0.6, bark); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(50, 100); ctx.bezierCurveTo(46, 70, 44, 50, 54, 34); ctx.lineTo(78, 30); ctx.bezierCurveTo(88, 55, 88, 78, 88, 104); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = darken(bark, 0.2); ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(56 + i * 5, 98); ctx.bezierCurveTo(58 + i * 5, 74, 54 + i * 5, 60, 62 + i * 5, 44); ctx.stroke(); }
  // branch arms
  ctx.strokeStyle = bark; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(50, 52); ctx.quadraticCurveTo(24, 45, 18, 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(80, 50); ctx.quadraticCurveTo(106, 40, 111, 58); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(18, 62); ctx.lineTo(10, 72); ctx.moveTo(18, 62); ctx.lineTo(24, 76); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(111, 58); ctx.lineTo(118, 47); ctx.moveTo(111, 58); ctx.lineTo(120, 68); ctx.stroke();
  // foliage
  const fg = ctx.createRadialGradient(64, 22, 4, 64, 24, 50);
  fg.addColorStop(0, lighten(leaf, 0.35)); fg.addColorStop(0.6, leaf); fg.addColorStop(1, darken(leaf, 0.5));
  ctx.fillStyle = fg;
  for (const [x, y, r] of [[38, 24, 16], [58, 14, 19], [80, 22, 18], [94, 32, 14], [48, 34, 14], [70, 32, 16]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  // face
  glowEye(ctx, 60, 58, 2.3, c.eye); glowEye(ctx, 76, 58, 2.3, c.eye);
  ctx.strokeStyle = darken(bark, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(62, 72); ctx.quadraticCurveTo(68, 78, 75, 71); ctx.stroke();
  // moss
  ctx.fillStyle = rgbaSafe(leaf, 0.4);
  ell(ctx, 56, 82, 10, 5, 0.3); ell(ctx, 76, 90, 7, 4, -0.2);
}

function drawGolem(ctx, c) {
  const rock = c.tint, dark = darken(rock, 0.45), light = lighten(rock, 0.2);
  const rune = c.eye;
  // legs
  ctx.fillStyle = darken(rock, 0.25);
  poly(ctx, [[42, 80], [58, 80], [56, 114], [38, 114]], rock);
  poly(ctx, [[70, 80], [88, 80], [90, 114], [72, 114]], rock);
  // torso
  const g = ctx.createLinearGradient(40, 35, 95, 90);
  g.addColorStop(0, light); g.addColorStop(0.5, rock); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  poly(ctx, [[44, 36], [64, 28], [88, 38], [92, 74], [70, 84], [44, 76]], g);
  // cracks/runes
  ctx.strokeStyle = alpha(rune, 0.85); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(54, 44); ctx.lineTo(60, 54); ctx.lineTo(56, 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(78, 42); ctx.lineTo(74, 56); ctx.lineTo(80, 66); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(62, 68); ctx.lineTo(70, 74); ctx.stroke();
  // arms
  ctx.fillStyle = darken(rock, 0.15);
  poly(ctx, [[40, 40], [28, 52], [22, 86], [34, 92], [43, 62]], rock);
  poly(ctx, [[90, 40], [103, 50], [110, 84], [98, 90], [87, 60]], rock);
  // shoulders
  ell(ctx, 38, 42, 14, 11, 0.2, lighten(rock, 0.1));
  ell(ctx, 94, 42, 14, 11, -0.2, lighten(rock, 0.1));
  // head
  ctx.fillStyle = rock;
  poly(ctx, [[55, 20], [76, 18], [82, 34], [72, 40], [58, 38]], rock, darken(rock, 0.2), 1);
  glowEye(ctx, 63, 28, 2.2, rune); glowEye(ctx, 73, 28, 2.2, rune);
  // moss
  ctx.fillStyle = 'rgba(80,120,60,.25)'; ell(ctx, 52, 72, 8, 4, 0.2); ell(ctx, 84, 50, 6, 3, -0.3);
  // dust
  ctx.fillStyle = alpha('#c8b8a0', 0.18);
  ell(ctx, 65, 116, 26, 4);
}

function drawBandit(ctx, c) {
  const cloth = c.tint, leather = darken(cloth, 0.45), skin = '#c89a78';
  // legs
  ctx.fillStyle = darken(cloth, 0.5);
  ctx.beginPath(); ctx.roundRect(50, 80, 11, 33, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(67, 80, 11, 33, 3); ctx.fill();
  ctx.fillStyle = '#211a18'; ell(ctx, 54, 113, 8, 3.5); ell(ctx, 71, 113, 8, 3.5);
  // cloak
  ctx.fillStyle = leather;
  poly(ctx, [[44, 40], [80, 38], [90, 100], [38, 100]], leather);
  // torso
  ctx.fillStyle = cloth;
  ctx.beginPath(); ctx.ellipse(63, 65, 19, 25, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = darken(cloth, 0.3); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(48, 54); ctx.lineTo(78, 78); ctx.stroke();
  // belt
  ctx.fillStyle = '#2c211b'; ctx.fillRect(47, 80, 32, 7);
  ctx.fillStyle = '#c8a45c'; ctx.fillRect(61, 79, 5, 9);
  // arms
  ctx.strokeStyle = cloth; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(67, 56); ctx.quadraticCurveTo(87, 66, 90, 84); ctx.stroke();
  // hood/head
  ctx.fillStyle = leather;
  ctx.beginPath(); ctx.ellipse(63, 38, 18, 20, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1417'; ctx.beginPath(); ctx.ellipse(65, 40, 12, 12, 0, 0, TAU); ctx.fill();
  glowEye(ctx, 61, 39, 1.8, c.eye); glowEye(ctx, 70, 39, 1.8, c.eye);
  // scarf
  ctx.fillStyle = darken(cloth, 0.2); ctx.fillRect(52, 50, 22, 6);
  // sword
  ctx.save(); ctx.translate(92, 84); ctx.rotate(0.25);
  ctx.fillStyle = '#3a2c22'; ctx.fillRect(-2, -3, 4, 12);
  poly(ctx, [[0, -40], [4, -6], [0, -2], [-4, -6]], '#c8d0d8', '#eef', 0.6);
  ctx.fillStyle = '#c8a45c'; ctx.fillRect(-7, -6, 14, 3);
  ctx.restore();
}

function drawBat(ctx, c) {
  const body = c.tint, dark = darken(body, 0.4), membrane = darken(c.cloth, 0.2);
  // wings
  for (const s of [-1, 1]) {
    const g = ctx.createLinearGradient(64, 49, 64 + s * 52, 80);
    g.addColorStop(0, darken(membrane, 0.1)); g.addColorStop(1, alpha(membrane, 0.25));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(64, 49);
    ctx.bezierCurveTo(64 + s * 20, 32, 64 + s * 47, 32, 64 + s * 56, 54);
    ctx.quadraticCurveTo(64 + s * 44, 54, 64 + s * 46, 68);
    ctx.quadraticCurveTo(64 + s * 36, 62, 64 + s * 32, 74);
    ctx.quadraticCurveTo(64 + s * 24, 62, 64 + s * 16, 72);
    ctx.quadraticCurveTo(64 + s * 10, 62, 64, 62);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha(dark, 0.8); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(64, 50); ctx.lineTo(64 + s * 46, 60); ctx.moveTo(64, 55); ctx.lineTo(64 + s * 34, 70); ctx.stroke();
  }
  // body
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(64, 62, 11, 16, 0, 0, TAU); ctx.fill();
  // head/ears
  ctx.fillStyle = dark;
  poly(ctx, [[56, 50], [55, 36], [62, 46]], dark);
  poly(ctx, [[72, 50], [73, 36], [66, 46]], dark);
  ctx.fillStyle = body; ell(ctx, 64, 47, 9, 8);
  glowEye(ctx, 60, 46, 1.6, c.eye); glowEye(ctx, 68, 46, 1.6, c.eye);
  ctx.fillStyle = '#e8d8d0'; ctx.fillRect(61, 53, 1.5, 3); ctx.fillRect(66, 53, 1.5, 3);
}

function drawSpider(ctx, c) {
  const body = c.tint, dark = darken(body, 0.45), light = lighten(body, 0.2);
  ctx.strokeStyle = dark; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(64 + s * 8, 64 + i * 3);
      ctx.quadraticCurveTo(64 + s * (28 + i * 5), 45 + i * 10, 64 + s * (35 + i * 6), 92 + i * 3);
      ctx.stroke();
    }
  }
  // abdomen
  const g = ctx.createRadialGradient(56, 68, 2, 56, 68, 28);
  g.addColorStop(0, light); g.addColorStop(0.5, body); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(53, 68, 23, 18, -0.2, 0, TAU); ctx.fill();
  // markings
  ctx.fillStyle = alpha(c.eye, 0.55);
  poly(ctx, [[53, 55], [58, 63], [53, 72], [48, 63]], alpha(c.eye, 0.55));
  // head
  ctx.fillStyle = dark; ell(ctx, 78, 68, 14, 12);
  // eyes cluster
  for (const [x, y, r] of [[78, 62, 2], [84, 64, 1.6], [80, 68, 1.4], [86, 69, 1.2]]) glowEye(ctx, x, y, r, c.eye);
  // fangs
  ctx.strokeStyle = '#e8e2d4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(84, 77); ctx.lineTo(88, 84); ctx.moveTo(78, 78); ctx.lineTo(79, 85); ctx.stroke();
}

function drawMushroom(ctx, c) {
  const cap = c.tint, dark = darken(cap, 0.5), light = lighten(cap, 0.3);
  // legs
  ctx.fillStyle = '#d8cbb0';
  ctx.beginPath(); ctx.roundRect(52, 82, 10, 30, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(68, 82, 10, 30, 4); ctx.fill();
  // stalk
  const g = ctx.createLinearGradient(50, 40, 80, 100);
  g.addColorStop(0, '#f0e6cf'); g.addColorStop(1, '#b9a98a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(48, 96); ctx.bezierCurveTo(50, 68, 46, 54, 56, 44); ctx.lineTo(76, 44); ctx.bezierCurveTo(84, 60, 82, 78, 82, 96); ctx.closePath(); ctx.fill();
  // cap
  const cg = ctx.createRadialGradient(58, 30, 2, 64, 40, 50);
  cg.addColorStop(0, light); cg.addColorStop(0.6, cap); cg.addColorStop(1, dark);
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.moveTo(22, 50); ctx.bezierCurveTo(24, 14, 104, 12, 108, 50); ctx.bezierCurveTo(92, 60, 36, 62, 22, 50); ctx.fill();
  // spots
  ctx.fillStyle = alpha(lighten(cap, 0.5), 0.55);
  for (const [x, y, r] of [[40, 34, 5], [62, 26, 6], [82, 34, 4], [52, 44, 3], [92, 44, 3]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  // eyes under cap
  glowEye(ctx, 58, 60, 2, c.eye); glowEye(ctx, 72, 60, 2, c.eye);
  ctx.strokeStyle = darken(cap, 0.6); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 72); ctx.quadraticCurveTo(65, 76, 70, 71); ctx.stroke();
}

function drawSerpent(ctx, c) {
  const scale = c.tint, dark = darken(scale, 0.45), light = lighten(scale, 0.2);
  // coiled body
  ctx.strokeStyle = dark; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(30, 108); ctx.bezierCurveTo(80, 108, 20, 78, 58, 78); ctx.bezierCurveTo(96, 78, 60, 102, 96, 96); ctx.stroke();
  ctx.strokeStyle = scale; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(30, 108); ctx.bezierCurveTo(80, 108, 20, 78, 58, 78); ctx.bezierCurveTo(96, 78, 60, 102, 96, 96); ctx.stroke();
  // belly scales
  ctx.strokeStyle = alpha(light, 0.4); ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(38 + i * 9, 100 - (i % 2) * 8, 4, 0, Math.PI); ctx.stroke(); }
  // neck
  ctx.strokeStyle = scale; ctx.lineWidth = 13;
  ctx.beginPath(); ctx.moveTo(86, 94); ctx.quadraticCurveTo(96, 64, 92, 42); ctx.stroke();
  // head
  const g = ctx.createLinearGradient(75, 25, 110, 55);
  g.addColorStop(0, light); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(80, 44); ctx.bezierCurveTo(78, 24, 110, 18, 116, 36); ctx.bezierCurveTo(118, 48, 102, 52, 80, 44); ctx.fill();
  // hood
  ctx.fillStyle = rgbaSafe(dark, 0.7);
  ctx.beginPath(); ctx.moveTo(82, 44); ctx.bezierCurveTo(72, 22, 98, 10, 106, 30); ctx.bezierCurveTo(94, 30, 88, 36, 86, 44); ctx.closePath(); ctx.fill();
  glowEye(ctx, 100, 34, 2.2, c.eye); glowEye(ctx, 110, 33, 1.8, c.eye);
  // tongue
  ctx.strokeStyle = '#e06070'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(115, 42); ctx.quadraticCurveTo(122, 45, 126, 41); ctx.moveTo(122, 44); ctx.lineTo(127, 47); ctx.stroke();
  // fangs
  ctx.fillStyle = '#e8e0d0'; ctx.fillRect(106, 45, 1.6, 6); ctx.fillRect(111, 44, 1.6, 5);
}

function drawWraith(ctx, c) {
  const robe = c.tint, dark = darken(robe, 0.5), glow = c.eye;
  // tattered robe
  const g = ctx.createLinearGradient(40, 20, 80, 118);
  g.addColorStop(0, alpha(lighten(robe, 0.25), 0.9)); g.addColorStop(0.6, alpha(robe, 0.75)); g.addColorStop(1, alpha(dark, 0.1));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(46, 40); ctx.bezierCurveTo(34, 60, 40, 90, 28, 118);
  ctx.quadraticCurveTo(40, 108, 48, 116); ctx.quadraticCurveTo(56, 104, 63, 116); ctx.quadraticCurveTo(72, 104, 80, 116); ctx.quadraticCurveTo(88, 106, 100, 116);
  ctx.bezierCurveTo(90, 88, 96, 60, 82, 40); ctx.closePath(); ctx.fill();
  // hood
  ctx.fillStyle = darken(robe, 0.25);
  ctx.beginPath(); ctx.moveTo(46, 42); ctx.bezierCurveTo(42, 14, 86, 12, 84, 42); ctx.bezierCurveTo(74, 30, 56, 30, 46, 42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#07060a';
  ctx.beginPath(); ctx.ellipse(64, 42, 15, 17, 0, 0, TAU); ctx.fill();
  glowEye(ctx, 58, 40, 2.8, glow); glowEye(ctx, 70, 40, 2.8, glow);
  // arms
  ctx.strokeStyle = alpha(robe, 0.8); ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(46, 58); ctx.quadraticCurveTo(30, 70, 38, 86); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(82, 58); ctx.quadraticCurveTo(98, 70, 92, 84); ctx.stroke();
  // spectral wisps
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = alpha(glow, 0.18); ctx.beginPath(); ctx.arc(40 + i * 13, 100 - (i % 2) * 12, 3 + i % 3, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function drawSkeleton(ctx, c) {
  const bone = c.tint, dark = darken(bone, 0.45);
  // legs
  ctx.strokeStyle = bone; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(55, 78); ctx.lineTo(50, 100); ctx.lineTo(52, 114); ctx.moveTo(73, 78); ctx.lineTo(78, 100); ctx.lineTo(76, 114); ctx.stroke();
  // ribs
  ctx.strokeStyle = bone; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(64, 48); ctx.lineTo(64, 82); ctx.stroke();
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(64, 56 + i * 7, 15 - i * 1.5, 4, 0, 0.2, Math.PI - 0.2); ctx.stroke(); }
  // pelvis
  ctx.fillStyle = bone; ctx.beginPath(); ctx.ellipse(64, 84, 11, 6, 0, 0, TAU); ctx.fill();
  // arms
  ctx.strokeStyle = bone; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(52, 56); ctx.lineTo(40, 72); ctx.lineTo(44, 88); ctx.moveTo(76, 56); ctx.lineTo(92, 68); ctx.lineTo(94, 84); ctx.stroke();
  // skull
  ctx.fillStyle = bone;
  ctx.beginPath(); ctx.moveTo(55, 32); ctx.bezierCurveTo(52, 8, 78, 8, 76, 32); ctx.lineTo(74, 44); ctx.lineTo(56, 44); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0b0910'; ell(ctx, 60, 28, 4, 4.5); ell(ctx, 70, 28, 4, 4.5);
  glowEye(ctx, 60, 28, 1.6, c.eye); glowEye(ctx, 70, 28, 1.6, c.eye);
  ctx.fillStyle = dark; poly(ctx, [[64, 32], [67, 39], [61, 39]], dark);
  ctx.strokeStyle = dark; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(59, 42); ctx.lineTo(70, 42); ctx.stroke();
  for (let i = 0; i < 4; i++) ctx.fillRect(59 + i * 3, 40, 1, 3);
  // sword
  ctx.save(); ctx.translate(96, 80); ctx.rotate(0.2);
  ctx.fillStyle = '#3a2b20'; ctx.fillRect(-2, -2, 4, 12);
  poly(ctx, [[0, -34], [4, -4], [0, 1], [-4, -4]], '#cfd6dc', '#eef', 0.5);
  ctx.restore();
  // shield
  ctx.fillStyle = darken(c.cloth, 0.2); ctx.strokeStyle = '#c8a45c'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(38, 80, 13, 17, -0.1, 0, TAU); ctx.fill(); ctx.stroke();
}

function drawGhoul(ctx, c) {
  const skin = c.tint, dark = darken(skin, 0.5), light = lighten(skin, 0.2);
  // hunched body
  ctx.strokeStyle = darken(skin, 0.3); ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(55, 82); ctx.lineTo(48, 110); ctx.moveTo(80, 82); ctx.lineTo(88, 110); ctx.stroke();
  const g = ctx.createRadialGradient(64, 58, 4, 64, 64, 38);
  g.addColorStop(0, light); g.addColorStop(0.6, skin); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(64, 68, 28, 26, -0.1, 0, TAU); ctx.fill();
  // ribs
  ctx.strokeStyle = alpha(dark, 0.7); ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(64, 62 + i * 6, 12, 3, 0, 0.2, Math.PI - 0.2); ctx.stroke(); }
  // long arms
  ctx.strokeStyle = skin; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(42, 56); ctx.quadraticCurveTo(20, 76, 26, 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(86, 56); ctx.quadraticCurveTo(108, 76, 102, 100); ctx.stroke();
  ctx.strokeStyle = dark; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(24 - i * 2, 100); ctx.lineTo(18 - i * 3, 110); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(102 + i * 2, 100); ctx.lineTo(108 + i * 2, 110); ctx.stroke();
  }
  // head
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(66, 40, 17, 18, 0.15, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a0f12';
  ctx.beginPath(); ctx.ellipse(68, 46, 8, 6, 0, 0, TAU); ctx.fill();
  glowEye(ctx, 60, 35, 2, c.eye); glowEye(ctx, 72, 36, 1.8, c.eye);
  ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(61 + i * 4, 48); ctx.lineTo(62 + i * 4, 52); ctx.stroke(); }
  // claw glow
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = alpha(c.eye, 0.3);
  ell(ctx, 24, 104, 7, 4); ell(ctx, 104, 104, 7, 4); ctx.restore();
}

function drawKnight(ctx, c) {
  const metal = c.tint, dark = darken(metal, 0.5), light = lighten(metal, 0.25);
  // legs
  ctx.fillStyle = darken(metal, 0.3);
  poly(ctx, [[47, 80], [60, 80], [58, 114], [44, 114]], darken(metal, 0.3));
  poly(ctx, [[69, 80], [82, 80], [86, 114], [72, 114]], darken(metal, 0.3));
  // tabard
  ctx.fillStyle = rgbaSafe(c.cloth, 0.9);
  poly(ctx, [[56, 40], [74, 40], [80, 104], [64, 112], [48, 104]], rgbaSafe(c.cloth, 0.9));
  ctx.fillStyle = alpha(c.eye, 0.5);
  poly(ctx, [[64, 54], [70, 66], [64, 80], [58, 66]], alpha(c.eye, 0.45));
  // plate
  const g = ctx.createLinearGradient(40, 36, 92, 88);
  g.addColorStop(0, light); g.addColorStop(0.5, metal); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  poly(ctx, [[46, 42], [64, 32], [84, 40], [90, 72], [76, 84], [52, 82], [42, 70]], g);
  // pauldrons
  ell(ctx, 41, 44, 15, 12, 0.3, lighten(metal, 0.1));
  ell(ctx, 89, 42, 15, 12, -0.3, lighten(metal, 0.1));
  // helm
  ctx.fillStyle = metal;
  ctx.beginPath(); ctx.moveTo(52, 38); ctx.bezierCurveTo(52, 12, 78, 10, 78, 38); ctx.lineTo(76, 48); ctx.lineTo(54, 48); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0b0a10'; ctx.fillRect(55, 31, 20, 6);
  glowEye(ctx, 60, 34, 1.6, c.eye); glowEye(ctx, 70, 34, 1.6, c.eye);
  // horns/crest
  ctx.fillStyle = alpha(c.eye, 0.6);
  poly(ctx, [[60, 14], [64, 2], [67, 14]], alpha(c.eye, 0.6));
  ctx.strokeStyle = alpha(c.eye, 0.3); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(64, 14); ctx.lineTo(64, 30); ctx.stroke();
  // sword
  ctx.save(); ctx.translate(96, 76); ctx.rotate(0.18);
  ctx.fillStyle = '#33261e'; ctx.fillRect(-2.5, -2, 5, 14);
  poly(ctx, [[0, -46], [5, -6], [0, 0], [-5, -6]], '#d8e0e8', '#ffffff', 0.6);
  ctx.fillStyle = '#c8a45c'; ctx.fillRect(-9, -7, 18, 3.5);
  ctx.restore();
  // shield
  ctx.fillStyle = darken(metal, 0.15); ctx.strokeStyle = alpha(c.eye, 0.7); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(26, 56); ctx.bezierCurveTo(40, 52, 46, 58, 46, 76); ctx.bezierCurveTo(44, 94, 33, 102, 26, 104); ctx.bezierCurveTo(19, 102, 8, 94, 6, 76); ctx.bezierCurveTo(6, 58, 12, 52, 26, 56); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(26, 62); ctx.lineTo(30, 78); ctx.lineTo(26, 94); ctx.lineTo(22, 78); ctx.closePath(); ctx.stroke();
}

function drawImp(ctx, c) {
  const skin = c.tint, dark = darken(skin, 0.5), light = lighten(skin, 0.25);
  // wings
  for (const s of [-1, 1]) {
    ctx.fillStyle = alpha(darken(skin, 0.35), 0.8);
    ctx.beginPath(); ctx.moveTo(64, 54); ctx.bezierCurveTo(64 + s * 24, 28, 64 + s * 44, 36, 64 + s * 38, 60); ctx.quadraticCurveTo(64 + s * 28, 54, 64, 62); ctx.fill();
  }
  // legs
  ctx.strokeStyle = skin; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(56, 84); ctx.lineTo(52, 104); ctx.lineTo(48, 112); ctx.moveTo(72, 84); ctx.lineTo(76, 104); ctx.lineTo(80, 112); ctx.stroke();
  // tail
  ctx.strokeStyle = dark; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(64, 86); ctx.quadraticCurveTo(38, 96, 32, 76); ctx.stroke();
  poly(ctx, [[32, 76], [26, 70], [34, 68]], dark);
  // body
  const g = ctx.createRadialGradient(64, 62, 3, 64, 66, 26);
  g.addColorStop(0, light); g.addColorStop(0.6, skin); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(64, 66, 19, 22, 0, 0, TAU); ctx.fill();
  // arms
  ctx.strokeStyle = skin; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(47, 58); ctx.quadraticCurveTo(34, 68, 38, 80); ctx.moveTo(81, 58); ctx.quadraticCurveTo(94, 68, 90, 80); ctx.stroke();
  // head
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(64, 38, 16, 15, 0, 0, TAU); ctx.fill();
  // horns
  ctx.strokeStyle = '#e8d8c0'; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(54, 27); ctx.quadraticCurveTo(48, 14, 53, 8); ctx.moveTo(74, 27); ctx.quadraticCurveTo(80, 14, 75, 8); ctx.stroke();
  glowEye(ctx, 59, 37, 2, c.eye); glowEye(ctx, 69, 37, 2, c.eye);
  // grin
  ctx.strokeStyle = '#f0e0d0'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(57, 45); ctx.quadraticCurveTo(64, 51, 71, 45); ctx.stroke();
}

function drawDemon(ctx, c) {
  const skin = c.tint, dark = darken(skin, 0.5), light = lighten(skin, 0.25);
  // wings
  for (const s of [-1, 1]) {
    const g = ctx.createLinearGradient(64, 40, 64 + s * 54, 90);
    g.addColorStop(0, alpha(darken(skin, 0.25), 0.95)); g.addColorStop(1, alpha(darken(skin, 0.6), 0.4));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(64, 46); ctx.bezierCurveTo(64 + s * 22, 16, 64 + s * 58, 18, 64 + s * 58, 58);
    ctx.quadraticCurveTo(64 + s * 44, 48, 64 + s * 46, 66); ctx.quadraticCurveTo(64 + s * 34, 52, 64 + s * 30, 76);
    ctx.quadraticCurveTo(64 + s * 20, 58, 64, 64); ctx.fill();
    ctx.strokeStyle = alpha(c.eye, 0.4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(64, 48); ctx.lineTo(64 + s * 46, 50); ctx.moveTo(64, 54); ctx.lineTo(64 + s * 34, 70); ctx.stroke();
  }
  // legs
  ctx.fillStyle = darken(skin, 0.15);
  poly(ctx, [[44, 82], [58, 82], [55, 114], [38, 114]], darken(skin, 0.2));
  poly(ctx, [[70, 82], [84, 82], [90, 114], [73, 114]], darken(skin, 0.2));
  // hooves
  ctx.fillStyle = '#1a0d12'; ell(ctx, 47, 114, 9, 4); ell(ctx, 81, 114, 9, 4);
  // body
  const g = ctx.createLinearGradient(40, 36, 92, 92);
  g.addColorStop(0, light); g.addColorStop(0.5, skin); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(64, 64, 27, 28, 0, 0, TAU); ctx.fill();
  // chest plate
  ctx.fillStyle = alpha('#22131a', 0.85); ctx.strokeStyle = alpha(c.eye, 0.5); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(44, 52); ctx.quadraticCurveTo(64, 38, 84, 52); ctx.lineTo(80, 72); ctx.quadraticCurveTo(64, 80, 48, 72); ctx.closePath(); ctx.fill(); ctx.stroke();
  // arms
  ctx.strokeStyle = skin; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(40, 50); ctx.quadraticCurveTo(22, 64, 28, 88); ctx.moveTo(88, 50); ctx.quadraticCurveTo(106, 64, 100, 88); ctx.stroke();
  // claws
  ctx.strokeStyle = '#e8d8c8'; ctx.lineWidth = 1.8;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(28 + i * 2, 88); ctx.lineTo(24 + i * 3, 98); ctx.moveTo(100 - i * 2, 88); ctx.lineTo(104 - i * 3, 98); ctx.stroke(); }
  // head
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(64, 36, 18, 17, 0, 0, TAU); ctx.fill();
  // horns large
  ctx.strokeStyle = '#2a1620'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(52, 25); ctx.quadraticCurveTo(38, 10, 46, 0); ctx.moveTo(76, 25); ctx.quadraticCurveTo(90, 10, 82, 0); ctx.stroke();
  ctx.strokeStyle = alpha(c.eye, 0.55); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(52, 25); ctx.quadraticCurveTo(40, 12, 46, 2); ctx.moveTo(76, 25); ctx.quadraticCurveTo(88, 12, 82, 2); ctx.stroke();
  glowEye(ctx, 58, 34, 2.6, c.eye); glowEye(ctx, 71, 34, 2.6, c.eye);
  // jaw
  ctx.strokeStyle = '#f0d8c8'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(55, 46); ctx.quadraticCurveTo(64, 52, 74, 45); ctx.stroke();
  // ember aura
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = alpha(c.eye, 0.15); ctx.beginPath(); ctx.arc(30 + i * 17, 104 - (i % 3) * 9, 2 + i % 2, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function drawMummy(ctx, c) {
  const wrap = c.tint, dark = darken(wrap, 0.45), light = lighten(wrap, 0.25);
  // legs
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.roundRect(50, 82, 12, 31, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(66, 82, 12, 31, 3); ctx.fill();
  ctx.strokeStyle = light; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(50, 86 + i * 5); ctx.lineTo(62, 88 + i * 5); ctx.moveTo(66, 88 + i * 5); ctx.lineTo(78, 86 + i * 5); ctx.stroke(); }
  // body
  const g = ctx.createLinearGradient(42, 40, 88, 90);
  g.addColorStop(0, light); g.addColorStop(0.5, wrap); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(64, 66, 22, 28, 0, 0, TAU); ctx.fill();
  // wraps
  ctx.strokeStyle = alpha(dark, 0.55); ctx.lineWidth = 1.4;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(44, 48 + i * 6); ctx.quadraticCurveTo(64, 54 + i * 6, 84, 46 + i * 6); ctx.stroke(); }
  // arms outstretched
  ctx.strokeStyle = wrap; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(48, 56); ctx.lineTo(22, 64); ctx.moveTo(80, 56); ctx.lineTo(106, 64); ctx.stroke();
  ctx.strokeStyle = dark; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(40 - i * 6, 58 + i * 2); ctx.lineTo(38 - i * 6, 66 + i * 2); ctx.stroke(); }
  // head
  ctx.fillStyle = wrap; ctx.beginPath(); ctx.ellipse(64, 36, 16, 18, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = alpha(dark, 0.5); ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(49, 24 + i * 7); ctx.quadraticCurveTo(64, 28 + i * 7, 79, 23 + i * 7); ctx.stroke(); }
  glowEye(ctx, 58, 34, 2.2, c.eye); glowEye(ctx, 70, 34, 2.2, c.eye);
  // crown
  ctx.fillStyle = '#d9b76a';
  poly(ctx, [[52, 20], [55, 10], [60, 17], [64, 7], [68, 17], [73, 10], [76, 20]], '#d9b76a');
  ctx.fillStyle = alpha(c.eye, 0.7); ctx.beginPath(); ctx.arc(64, 14, 2, 0, TAU); ctx.fill();
}

function drawScorpion(ctx, c) {
  const shell = c.tint, dark = darken(shell, 0.45), light = lighten(shell, 0.25);
  // legs
  ctx.strokeStyle = dark; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(64 + s * 10, 70 + i * 4);
    ctx.quadraticCurveTo(64 + s * (30 + i * 2), 58 + i * 12, 64 + s * (42 + i * 3), 84 + i * 7);
    ctx.stroke();
  }
  // tail
  ctx.strokeStyle = shell; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(48, 66); ctx.quadraticCurveTo(18, 56, 24, 34); ctx.stroke();
  ctx.strokeStyle = dark; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(48, 66); ctx.quadraticCurveTo(20, 58, 25, 36); ctx.stroke();
  // stinger
  ctx.fillStyle = darken(shell, 0.2);
  ctx.beginPath(); ctx.moveTo(24, 34); ctx.lineTo(32, 22); ctx.lineTo(36, 30); ctx.lineTo(28, 38); ctx.closePath(); ctx.fill();
  glowEye(ctx, 31, 25, 2, c.eye);
  // body
  const g = ctx.createRadialGradient(64, 68, 3, 64, 70, 24);
  g.addColorStop(0, light); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(64, 70, 24, 17, 0, 0, TAU); ctx.fill();
  // plates
  ctx.strokeStyle = alpha(dark, 0.6); ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(64, 64 + i * 5, 18 - i * 2, 8, 0, 0.2, Math.PI - 0.2); ctx.stroke(); }
  // claws
  ctx.strokeStyle = shell; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(82, 66); ctx.quadraticCurveTo(100, 56, 106, 42); ctx.moveTo(82, 74); ctx.quadraticCurveTo(102, 74, 110, 62); ctx.stroke();
  ctx.fillStyle = dark;
  poly(ctx, [[106, 42], [116, 32], [112, 46]], dark);
  poly(ctx, [[110, 62], [122, 60], [114, 70]], dark);
  glowEye(ctx, 74, 64, 1.8, c.eye); glowEye(ctx, 80, 70, 1.6, c.eye);
}

function drawVoidling(ctx, c) {
  const dark = c.tint, deep = darken(dark, 0.55), glow = c.eye;
  // tendrils
  ctx.strokeStyle = deep; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.beginPath(); ctx.moveTo(64 + Math.cos(a) * 18, 64 + Math.sin(a) * 18);
    ctx.quadraticCurveTo(64 + Math.cos(a) * 36, 64 + Math.sin(a) * 36, 64 + Math.cos(a + 0.4) * 50, 64 + Math.sin(a + 0.4) * 50);
    ctx.stroke();
  }
  // body
  const g = ctx.createRadialGradient(64, 62, 4, 64, 64, 32);
  g.addColorStop(0, lighten(dark, 0.2)); g.addColorStop(0.5, dark); g.addColorStop(1, deep);
  ctx.fillStyle = g; ctx.beginPath();
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; const r = 24 + Math.sin(i * 1.7) * 5; const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fill();
  // stars
  ctx.fillStyle = alpha('#ffffff', 0.55);
  for (const [x, y, r] of [[52, 52, 1.6], [74, 60, 1.2], [60, 76, 1.4], [76, 44, 1]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  // eye
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const eg = ctx.createRadialGradient(64, 62, 2, 64, 62, 18);
  eg.addColorStop(0, '#ffffff'); eg.addColorStop(0.3, glow); eg.addColorStop(1, alpha(glow, 0));
  ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(64, 62, 18, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#0b0712'; ctx.beginPath(); ctx.ellipse(64, 62, 7, 11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(64, 62, 2.5, 7, 0, 0, TAU); ctx.fill();
}

function drawSeraph(ctx, c) {
  const armor = c.tint, dark = darken(armor, 0.5), light = lighten(armor, 0.3), glow = c.eye;
  // wings
  for (const s of [-1, 1]) {
    const g = ctx.createLinearGradient(64, 36, 64 + s * 56, 80);
    g.addColorStop(0, alpha(light, 0.95)); g.addColorStop(0.5, alpha(armor, 0.7)); g.addColorStop(1, alpha(glow, 0.05));
    ctx.fillStyle = g;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(64 + s * 6, 44);
      ctx.bezierCurveTo(64 + s * 28, 18 + i * 9, 64 + s * 54, 22 + i * 11, 64 + s * 60, 54 + i * 14);
      ctx.bezierCurveTo(64 + s * 40, 46 + i * 13, 64 + s * 24, 42 + i * 9, 64 + s * 6, 48);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = alpha('#ffffff', 0.35); ctx.lineWidth = 0.8; ctx.stroke();
    }
  }
  // legs
  ctx.fillStyle = darken(armor, 0.3);
  poly(ctx, [[52, 82], [62, 82], [60, 112], [48, 112]], darken(armor, 0.3));
  poly(ctx, [[68, 82], [78, 82], [82, 112], [70, 112]], darken(armor, 0.3));
  // robe/tabard
  ctx.fillStyle = rgbaSafe(glow, 0.25);
  poly(ctx, [[54, 42], [74, 42], [82, 104], [64, 112], [46, 104]], rgbaSafe(glow, 0.22));
  // body
  const g = ctx.createLinearGradient(42, 36, 88, 88);
  g.addColorStop(0, light); g.addColorStop(0.5, armor); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(44, 42); ctx.quadraticCurveTo(64, 30, 84, 42); ctx.lineTo(86, 72); ctx.quadraticCurveTo(64, 84, 42, 72); ctx.closePath(); ctx.fill();
  // pauldrons
  ell(ctx, 42, 42, 13, 10, 0.3, lighten(armor, 0.1)); ell(ctx, 86, 42, 13, 10, -0.3, lighten(armor, 0.1));
  // head/helm
  ctx.fillStyle = armor; ctx.beginPath(); ctx.ellipse(64, 32, 13, 16, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(64, 35, 9, 11, 0, 0, TAU); ctx.fill();
  glowEye(ctx, 60, 33, 1.8, glow); glowEye(ctx, 69, 33, 1.8, glow);
  // halo
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = alpha(glow, 0.9); ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.ellipse(64, 12, 20, 5, 0, 0, TAU); ctx.stroke();
  ctx.restore();
  // spear
  ctx.save(); ctx.translate(100, 70); ctx.rotate(0.12);
  ctx.fillStyle = '#d9cbaa'; ctx.fillRect(-2, -48, 4, 100);
  ctx.fillStyle = alpha(glow, 0.9);
  poly(ctx, [[0, -64], [7, -44], [0, -38], [-7, -44]], alpha(glow, 0.9), '#fff', 1);
  ctx.restore();
}

function drawEye(ctx, c) {
  const flesh = c.tint, dark = darken(flesh, 0.5), glow = c.eye;
  // tentacles
  ctx.strokeStyle = darken(flesh, 0.25); ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const x = 36 + i * 9;
    ctx.beginPath(); ctx.moveTo(x, 74); ctx.quadraticCurveTo(x - 8 + (i % 3) * 8, 96, x + Math.sin(i) * 12, 116); ctx.stroke();
  }
  // body
  const g = ctx.createRadialGradient(64, 56, 4, 64, 58, 34);
  g.addColorStop(0, lighten(flesh, 0.25)); g.addColorStop(0.6, flesh); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(64, 54, 36, 32, 0, 0, TAU); ctx.fill();
  // veins
  ctx.strokeStyle = alpha(dark, 0.45); ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 5, 30 + i * 4); ctx.quadraticCurveTo(48, 50, 40 + i * 6, 76); ctx.stroke(); }
  // eye white
  ctx.fillStyle = '#e8e2d8'; ctx.beginPath(); ctx.ellipse(64, 54, 22, 16, 0, 0, TAU); ctx.fill();
  const ig = ctx.createRadialGradient(64, 54, 2, 64, 54, 12);
  ig.addColorStop(0, '#ffffff'); ig.addColorStop(0.3, glow); ig.addColorStop(1, darken(glow, 0.5));
  ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(64, 54, 11, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0a0710'; ctx.beginPath(); ctx.ellipse(64, 54, 3, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(60, 49, 2, 0, TAU); ctx.fill();
  // eyelids
  ctx.strokeStyle = darken(flesh, 0.3); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(64, 54, 23, 17, 0, Math.PI + 0.25, TAU - 0.25); ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = alpha(glow, 0.35); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(64, 54, 30, 24, 0, 0, TAU); ctx.stroke(); ctx.restore();
}

function drawDragon(ctx, c) {
  const scale = c.tint, dark = darken(scale, 0.5), light = lighten(scale, 0.3), glow = c.eye;
  // wings
  for (const s of [-1, 1]) {
    const g = ctx.createLinearGradient(64, 34, 64 + s * 58, 88);
    g.addColorStop(0, alpha(light, 0.9)); g.addColorStop(0.4, alpha(scale, 0.8)); g.addColorStop(1, alpha(dark, 0.3));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(64, 38); ctx.bezierCurveTo(64 + s * 26, 6, 64 + s * 58, 20, 64 + s * 56, 54);
    ctx.quadraticCurveTo(64 + s * 42, 44, 64 + s * 44, 66);
    ctx.quadraticCurveTo(64 + s * 30, 48, 64 + s * 26, 72);
    ctx.quadraticCurveTo(64 + s * 14, 54, 64, 60); ctx.fill();
    ctx.strokeStyle = alpha(glow, 0.35); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(64, 42); ctx.lineTo(64 + s * 48, 36); ctx.moveTo(64, 48); ctx.lineTo(64 + s * 38, 60); ctx.stroke();
  }
  // tail
  ctx.strokeStyle = scale; ctx.lineWidth = 10; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(58, 88); ctx.quadraticCurveTo(30, 100, 18, 82); ctx.stroke();
  ctx.fillStyle = dark; poly(ctx, [[18, 82], [6, 74], [12, 90]], dark);
  // body
  ctx.fillStyle = scale; ctx.beginPath(); ctx.ellipse(64, 72, 22, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lighten(scale, 0.35); ctx.beginPath(); ctx.ellipse(64, 78, 10, 17, 0, 0, TAU); ctx.fill();
  // neck/head
  ctx.strokeStyle = scale; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.moveTo(64, 54); ctx.quadraticCurveTo(72, 34, 76, 22); ctx.stroke();
  ctx.fillStyle = scale;
  ctx.beginPath(); ctx.moveTo(68, 26); ctx.bezierCurveTo(76, 8, 102, 10, 104, 26); ctx.bezierCurveTo(100, 34, 82, 38, 68, 30); ctx.fill();
  // snout
  ctx.beginPath(); ctx.moveTo(86, 20); ctx.lineTo(110, 24); ctx.lineTo(92, 32); ctx.closePath(); ctx.fill();
  // horns
  ctx.fillStyle = '#e8dcc0'; poly(ctx, [[78, 14], [72, 2], [86, 10]], '#e8dcc0'); poly(ctx, [[88, 16], [90, 4], [96, 14]], '#d8ccb0');
  glowEye(ctx, 88, 22, 2.2, glow);
  // teeth/fire
  ctx.fillStyle = '#f0e8d8'; ctx.fillRect(93, 28, 2, 3); ctx.fillRect(97, 28, 2, 3);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = alpha(glow, 0.35);
  ctx.beginPath(); ctx.moveTo(104, 26); ctx.quadraticCurveTo(120, 22, 126, 30); ctx.quadraticCurveTo(116, 34, 104, 30); ctx.fill(); ctx.restore();
  // legs
  ctx.fillStyle = darken(scale, 0.2);
  poly(ctx, [[50, 92], [60, 92], [56, 112], [44, 112]], darken(scale, 0.2));
  poly(ctx, [[72, 92], [82, 92], [86, 112], [74, 112]], darken(scale, 0.2));
  ctx.fillStyle = '#d8ccb0'; for (const x of [46, 55, 77, 84]) poly(ctx, [[x, 112], [x + 3, 118], [x + 6, 112]], '#d8ccb0');
}

const MONSTER_DRAW = {
  wolf: drawWolf, boar: drawBoar, goblin: drawGoblin, treant: drawTreant, golem: drawGolem,
  bandit: drawBandit, bat: drawBat, spider: drawSpider, mushroom: drawMushroom, serpent: drawSerpent,
  wraith: drawWraith, skeleton: drawSkeleton, ghoul: drawGhoul, knight: drawKnight, imp: drawImp,
  demon: drawDemon, mummy: drawMummy, scorpion: drawScorpion, voidling: drawVoidling, seraph: drawSeraph,
  eye: drawEye, dragon: drawDragon,
};

const spriteCache = new Map();

export function getMonsterSprite(type, tint, eye = '#ffb35c', leaf = '#3f6b3d') {
  const key = `${type}|${tint}|${eye}|${leaf}`;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const draw = MONSTER_DRAW[type] ?? drawWolf;
  ctx.save();
  draw(ctx, { tint, eye, cloth: mix(tint, '#3a2a34', 0.55), leaf });
  ctx.restore();
  spriteCache.set(key, canvas);
  return canvas;
}

// ── Props ────────────────────────────────────────────────────────────────
function propTree(ctx, p, rng) {
  const trunk = p.prop, leaf = p.accent;
  ctx.fillStyle = darken(trunk, 0.2);
  ctx.beginPath(); ctx.moveTo(86, 220); ctx.bezierCurveTo(80, 170, 96, 140, 88, 90); ctx.lineTo(106, 90); ctx.bezierCurveTo(100, 150, 112, 180, 108, 220); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = darken(trunk, 0.4); ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(92 + i * 3, 210); ctx.quadraticCurveTo(86 + i * 4, 160, 96 + i * 4, 110); ctx.stroke(); }
  const layers = 6;
  for (let i = 0; i < layers; i++) {
    const r = 46 + rng() * 16;
    const x = 98 + (rng() - 0.5) * 50;
    const y = 60 + i * 18 + rng() * 10;
    const g = ctx.createRadialGradient(x - 8, y - 8, 4, x, y, r);
    g.addColorStop(0, lighten(leaf, 0.28)); g.addColorStop(0.55, leaf); g.addColorStop(1, darken(leaf, 0.55));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.12); ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.fillStyle = alpha(p.light, 0.1);
  ctx.beginPath(); ctx.ellipse(70, 58, 20, 12, -0.3, 0, TAU); ctx.fill();
}

function propPine(ctx, p, rng, snow = false) {
  const trunk = '#3a2c22';
  ctx.fillStyle = trunk; ctx.fillRect(90, 160, 12, 60);
  const base = snow ? '#8fb6c9' : p.accent;
  for (let i = 0; i < 4; i++) {
    const w = 62 - i * 10, y = 160 - i * 34;
    const g = ctx.createLinearGradient(98 - w, y, 98 + w, y - 20);
    g.addColorStop(0, darken(base, 0.45)); g.addColorStop(0.5, base); g.addColorStop(1, darken(base, 0.25));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(98, y + 8); ctx.lineTo(98 - w, y - 4); ctx.lineTo(98 - w * 0.5, y - 18); ctx.lineTo(98, y - 46); ctx.lineTo(98 + w * 0.5, y - 18); ctx.lineTo(98 + w, y - 4); ctx.closePath(); ctx.fill();
    if (snow) {
      ctx.fillStyle = 'rgba(232,248,255,.55)';
      ctx.beginPath(); ctx.moveTo(98, y - 46); ctx.lineTo(98 + w * 0.5, y - 18); ctx.lineTo(98 + w * 0.22, y - 14); ctx.lineTo(98 - w * 0.1, y - 24); ctx.lineTo(98 - w * 0.5, y - 18); ctx.closePath(); ctx.fill();
    }
  }
}

function propRock(ctx, p, rng) {
  const col = p.prop2;
  const g = ctx.createLinearGradient(40, 100, 140, 190);
  g.addColorStop(0, lighten(col, 0.15)); g.addColorStop(0.6, col); g.addColorStop(1, darken(col, 0.5));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(40, 180); ctx.lineTo(60, 120); ctx.lineTo(95, 96); ctx.lineTo(135, 120); ctx.lineTo(150, 170); ctx.lineTo(120, 185); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = alpha('#000', 0.2); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(90, 100); ctx.lineTo(95, 150); ctx.lineTo(130, 160); ctx.stroke();
  ctx.fillStyle = alpha(p.light, 0.08); ctx.beginPath(); ctx.ellipse(85, 118, 18, 8, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(60,90,50,.25)'; ctx.beginPath(); ctx.ellipse(60, 172, 20, 7, 0.1, 0, TAU); ctx.fill();
}

function propRuin(ctx, p) {
  const stone = darken(p.prop2, 0.1);
  const g = ctx.createLinearGradient(40, 60, 130, 200);
  g.addColorStop(0, lighten(stone, 0.2)); g.addColorStop(0.6, stone); g.addColorStop(1, darken(stone, 0.4));
  ctx.fillStyle = g;
  ctx.fillRect(54, 80, 22, 130);
  ctx.fillRect(100, 110, 20, 100);
  ctx.fillRect(32, 186, 60, 14);
  ctx.fillRect(108, 196, 50, 12);
  ctx.fillStyle = darken(stone, 0.15); ctx.fillRect(48, 72, 34, 10); ctx.fillRect(94, 102, 32, 10);
  ctx.strokeStyle = alpha('#000', 0.25); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(58, 100); ctx.lineTo(70, 112); ctx.lineTo(64, 130); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(108, 130); ctx.lineTo(112, 160); ctx.stroke();
  // rune
  ctx.strokeStyle = alpha(p.light, 0.35); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(65, 140); ctx.lineTo(65, 160); ctx.moveTo(58, 150); ctx.lineTo(72, 150); ctx.stroke();
  ctx.fillStyle = 'rgba(70,100,60,.2)'; ctx.beginPath(); ctx.ellipse(60, 188, 24, 8, 0, 0, TAU); ctx.fill();
}

function propBush(ctx, p, rng) {
  const col = p.accent;
  for (let i = 0; i < 5; i++) {
    const x = 70 + rng() * 60, y = 175 + rng() * 20, r = 18 + rng() * 12;
    const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
    g.addColorStop(0, lighten(col, 0.25)); g.addColorStop(1, darken(col, 0.55));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = alpha('#ffe9a0', 0.5);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(78 + i * 18, 166 + (i % 2) * 8, 2, 0, TAU); ctx.fill(); }
}

function propMushroom(ctx, p, rng) {
  for (let i = 0; i < 3; i++) {
    const x = 70 + rng() * 64, s = 0.5 + rng() * 0.7;
    ctx.save(); ctx.translate(x, 190); ctx.scale(s, s);
    ctx.fillStyle = '#cbbfa2'; ctx.fillRect(-4, -34, 8, 34);
    const g = ctx.createRadialGradient(0, -44, 2, 0, -40, 30);
    g.addColorStop(0, lighten(p.accent, 0.4)); g.addColorStop(1, darken(p.accent, 0.35));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -40, 28, 16, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = alpha('#e8ffb0', 0.5); ctx.beginPath(); ctx.arc(-8, -46, 3, 0, TAU); ctx.arc(8, -48, 2.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

function propOre(ctx, p) {
  ctx.fillStyle = darken(p.prop2, 0.2);
  ctx.beginPath(); ctx.moveTo(40, 188); ctx.lineTo(65, 140); ctx.lineTo(110, 150); ctx.lineTo(135, 190); ctx.closePath(); ctx.fill();
  for (const [x, y, s] of [[74, 158, 9], [98, 168, 7], [88, 146, 6]]) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, s * 2);
    g.addColorStop(0, '#fff6d0'); g.addColorStop(0.4, p.light); g.addColorStop(1, alpha(p.light, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 2, 0, TAU); ctx.fill();
    ctx.fillStyle = p.light; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.7, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.7, y); ctx.closePath(); ctx.fill();
  }
}

function propAnvil(ctx, p) {
  ctx.fillStyle = '#2a2420'; ctx.fillRect(72, 176, 52, 16);
  ctx.fillStyle = '#3b332c'; ctx.beginPath(); ctx.moveTo(78, 152); ctx.lineTo(118, 152); ctx.lineTo(126, 174); ctx.lineTo(70, 174); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4a4036'; ctx.fillRect(80, 140, 36, 14); ctx.beginPath(); ctx.moveTo(118, 140); ctx.lineTo(140, 146); ctx.lineTo(120, 152); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(96, 138, 1, 96, 138, 26);
  g.addColorStop(0, 'rgba(255,160,80,.45)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(96, 138, 26, 0, TAU); ctx.fill(); ctx.restore();
}

function propWeb(ctx, p) {
  ctx.strokeStyle = alpha('#cfd8d0', 0.22); ctx.lineWidth = 1;
  const cx = 98, cy = 100;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80); ctx.stroke(); }
  for (let r = 16; r < 84; r += 16) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI * 2; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
}

function propGrave(ctx, p) {
  const stone = p.prop2;
  const g = ctx.createLinearGradient(60, 110, 130, 200);
  g.addColorStop(0, lighten(stone, 0.15)); g.addColorStop(1, darken(stone, 0.45));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(68, 190); ctx.lineTo(70, 130); ctx.arc(98, 128, 28, Math.PI, 0); ctx.lineTo(128, 190); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = alpha('#000', 0.3); ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = alpha(p.light, 0.3); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(98, 136); ctx.lineTo(98, 164); ctx.moveTo(88, 146); ctx.lineTo(108, 146); ctx.stroke();
  ctx.fillStyle = 'rgba(20,30,20,.3)'; ctx.beginPath(); ctx.ellipse(100, 194, 40, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = alpha(p.light, 0.3); ctx.beginPath(); ctx.arc(120, 174, 2, 0, TAU); ctx.fill();
}

function propDeadTree(ctx, p) {
  ctx.strokeStyle = p.prop; ctx.lineCap = 'round';
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(100, 210); ctx.bezierCurveTo(94, 160, 104, 120, 94, 70); ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(96, 120); ctx.lineTo(60, 84); ctx.lineTo(44, 60); ctx.moveTo(100, 100); ctx.lineTo(134, 66); ctx.moveTo(60, 84); ctx.lineTo(66, 52); ctx.moveTo(134, 66); ctx.lineTo(128, 40); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(66, 52); ctx.lineTo(56, 36); ctx.moveTo(128, 40); ctx.lineTo(142, 30); ctx.stroke();
  ctx.strokeStyle = alpha(p.light, 0.25); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, 200); ctx.bezierCurveTo(96, 160, 102, 120, 95, 76); ctx.stroke();
}

function propCandle(ctx, p) {
  ctx.fillStyle = '#d8ccb0'; ctx.fillRect(92, 166, 8, 24);
  ctx.fillStyle = '#bfae8c'; ctx.fillRect(86, 188, 20, 6);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(96, 158, 1, 96, 158, 30);
  g.addColorStop(0, 'rgba(255,240,180,.9)'); g.addColorStop(0.3, 'rgba(255,180,90,.35)'); g.addColorStop(1, 'rgba(255,140,60,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(96, 158, 30, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#ffeec0'; ctx.beginPath(); ctx.ellipse(96, 158, 3.5, 7, 0, 0, TAU); ctx.fill();
}

function propBones(ctx, p) {
  ctx.strokeStyle = p.prop2; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(60, 186); ctx.lineTo(100, 172); ctx.moveTo(76, 190); ctx.lineTo(120, 182); ctx.stroke();
  ctx.fillStyle = p.prop2;
  ctx.beginPath(); ctx.ellipse(110, 174, 10, 7, 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#12100e'; ctx.beginPath(); ctx.arc(107, 172, 2, 0, TAU); ctx.arc(114, 172, 2, 0, TAU); ctx.fill();
  ctx.strokeStyle = p.prop2; ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(66 + i * 12, 180); ctx.lineTo(64 + i * 12, 192); ctx.stroke(); }
}

function propIce(ctx, p) {
  for (let i = 0; i < 3; i++) {
    const x = 70 + i * 24, h = 50 + i * 12;
    const g = ctx.createLinearGradient(x, 190 - h, x + 12, 190);
    g.addColorStop(0, alpha('#e8fbff', 0.95)); g.addColorStop(0.5, alpha('#9fdcf2', 0.85)); g.addColorStop(1, alpha('#4a7f99', 0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 190); ctx.lineTo(x + 4, 190 - h); ctx.lineTo(x + 16, 186); ctx.lineTo(x + 12, 190); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha('#ffffff', 0.4); ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.fillStyle = alpha(p.light, 0.12); ctx.beginPath(); ctx.ellipse(100, 190, 50, 10, 0, 0, TAU); ctx.fill();
}

function propCrystal(ctx, p) {
  for (let i = 0; i < 3; i++) {
    const x = 76 + i * 18, h = 56 + (i % 2) * 28;
    const g = ctx.createLinearGradient(x, 190 - h, x + 13, 190);
    g.addColorStop(0, alpha(lighten(p.light, 0.35), 0.95)); g.addColorStop(0.55, alpha(p.accent, 0.9)); g.addColorStop(1, alpha(darken(p.accent, 0.5), 0.4));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 192); ctx.lineTo(x + 7, 192 - h); ctx.lineTo(x + 14, 186); ctx.lineTo(x + 10, 192); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(x + 7, 192 - h * 0.6, 1, x + 7, 192 - h * 0.6, h * 0.7);
    gg.addColorStop(0, alpha(p.light, 0.18)); gg.addColorStop(1, alpha(p.light, 0));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x + 7, 192 - h * 0.6, h * 0.7, 0, TAU); ctx.fill(); ctx.restore();
  }
}

function propCactus(ctx, p) {
  ctx.fillStyle = p.accent;
  ctx.strokeStyle = darken(p.accent, 0.3); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(90, 110, 18, 82, 9); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(66, 134, 14, 36, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(66, 160, 28, 12, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(112, 124, 14, 42, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(98, 158, 28, 12, 6); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = alpha('#ffe9a0', 0.5); ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(95 + (i % 2) * 8, 124 + i * 12); ctx.lineTo(97 + (i % 2) * 8, 120 + i * 12); ctx.stroke(); }
  ctx.fillStyle = '#e07a6a'; ctx.beginPath(); ctx.arc(99, 108, 4, 0, TAU); ctx.fill();
}

function propPalm(ctx, p) {
  ctx.strokeStyle = darken(p.prop2, 0.3); ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(98, 204); ctx.quadraticCurveTo(88, 150, 104, 96); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.9 + i * 0.55;
    ctx.strokeStyle = p.accent; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(104, 96); ctx.quadraticCurveTo(104 + Math.cos(a) * 30, 96 + Math.sin(a) * 30, 104 + Math.cos(a) * 54, 96 + Math.sin(a) * 44 + 20); ctx.stroke();
  }
}

function propObelisk(ctx, p) {
  const stone = p.prop2;
  const g = ctx.createLinearGradient(70, 20, 130, 200);
  g.addColorStop(0, lighten(stone, 0.2)); g.addColorStop(0.5, stone); g.addColorStop(1, darken(stone, 0.5));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(98, 10); ctx.lineTo(122, 48); ctx.lineTo(118, 196); ctx.lineTo(78, 196); ctx.lineTo(74, 48); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = alpha(p.light, 0.6); ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(86 + i * 6, 70); ctx.lineTo(92 + i * 6, 92); ctx.lineTo(84 + i * 6, 116); ctx.stroke(); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gg = ctx.createLinearGradient(0, 40, 0, 200); gg.addColorStop(0, alpha(p.light, 0.2)); gg.addColorStop(1, alpha(p.light, 0));
  ctx.fillStyle = gg; ctx.fillRect(70, 40, 60, 160); ctx.restore();
  ctx.fillStyle = alpha(p.light, 0.1); ctx.beginPath(); ctx.ellipse(98, 198, 46, 10, 0, 0, TAU); ctx.fill();
}

function propLava(ctx, p) {
  const g = ctx.createRadialGradient(100, 176, 4, 100, 176, 60);
  g.addColorStop(0, '#ffd07a'); g.addColorStop(0.4, '#ff7a3c'); g.addColorStop(1, 'rgba(120,30,10,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(100, 176, 58, 22, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,180,90,.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 176); ctx.bezierCurveTo(80, 168, 90, 184, 110, 174); ctx.bezierCurveTo(128, 166, 136, 182, 146, 176); ctx.stroke();
}

function propBanner(ctx, p) {
  ctx.fillStyle = '#3a2a24'; ctx.fillRect(94, 50, 5, 150);
  ctx.fillStyle = p.accent; ctx.beginPath(); ctx.moveTo(99, 54); ctx.lineTo(144, 60); ctx.lineTo(136, 96); ctx.lineTo(144, 130); ctx.lineTo(99, 124); ctx.closePath(); ctx.fill();
  ctx.fillStyle = alpha('#f0d0a0', 0.5); ctx.beginPath(); ctx.moveTo(118, 70); ctx.lineTo(126, 84); ctx.lineTo(118, 100); ctx.lineTo(110, 84); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = alpha('#000', 0.25); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(99, 70); ctx.lineTo(138, 76); ctx.stroke();
}

function propRune(ctx, p) {
  ctx.save(); ctx.translate(100, 168); ctx.scale(1, 0.35);
  ctx.strokeStyle = alpha(p.light, 0.55); ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 30 + i * 15, 0, TAU); ctx.stroke(); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.lineTo(Math.cos(a) * 70, Math.sin(a) * 70); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(100, 160, 2, 100, 160, 60); g.addColorStop(0, alpha(p.light, 0.12)); g.addColorStop(1, alpha(p.light, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(100, 160, 60, 0, TAU); ctx.fill(); ctx.restore();
}

function propVoid(ctx, p) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(100, 150, 2, 100, 150, 55); g.addColorStop(0, alpha(p.light, 0.5)); g.addColorStop(0.4, alpha(p.accent, 0.2)); g.addColorStop(1, alpha(p.accent, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(100, 150, 55, 0, TAU); ctx.fill(); ctx.restore();
  ctx.strokeStyle = alpha(p.light, 0.4); ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(100, 150, 20 + i * 8, 8 + i * 5, i * 0.6, 0, TAU); ctx.stroke(); }
}

function propStatue(ctx, p) {
  const stone = p.prop2;
  ctx.fillStyle = darken(stone, 0.3); ctx.fillRect(70, 186, 60, 20);
  const g = ctx.createLinearGradient(70, 40, 130, 190);
  g.addColorStop(0, lighten(stone, 0.15)); g.addColorStop(1, darken(stone, 0.5));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(82, 186); ctx.lineTo(86, 90); ctx.lineTo(78, 56); ctx.lineTo(96, 40); ctx.lineTo(112, 52); ctx.lineTo(122, 90); ctx.lineTo(118, 186); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(78, 90); ctx.lineTo(58, 120); ctx.lineTo(62, 126); ctx.lineTo(86, 104); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(120, 88); ctx.lineTo(144, 74); ctx.lineTo(148, 60); ctx.lineTo(140, 56); ctx.lineTo(116, 78); ctx.closePath(); ctx.fill();
  ctx.fillStyle = darken(stone, 0.55); ctx.beginPath(); ctx.ellipse(102, 56, 12, 14, 0.1, 0, TAU); ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = alpha(p.light, 0.6);
  ctx.beginPath(); ctx.arc(98, 54, 1.6, 0, TAU); ctx.arc(107, 54, 1.6, 0, TAU); ctx.fill(); ctx.restore();
}

function propTreeSnow(ctx, p, rng) {
  propPine(ctx, p, rng, true);
}

const PROP_DRAW = {
  tree: propTree, pine: (ctx, p, rng) => propPine(ctx, p, rng, false), pineSnow: propTreeSnow,
  rock: propRock, ruin: propRuin, bush: propBush, mushroom: propMushroom, ore: propOre, anvil: propAnvil,
  web: propWeb, grave: propGrave, deadTree: propDeadTree, candle: propCandle, bones: propBones,
  ice: propIce, crystal: propCrystal, cactus: propCactus, palm: propPalm, obelisk: propObelisk,
  lava: propLava, banner: propBanner, rune: propRune, void: propVoid, statue: propStatue,
};

const propCache = new Map();

export function getPropSprite(type, palette, variant = 0) {
  const key = `${type}|${palette.accent}|${palette.prop}|${palette.light}|${variant}`;
  if (propCache.has(key)) return propCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 200; canvas.height = 220;
  const ctx = canvas.getContext('2d');
  const rng = rngFrom('prop', type, palette.accent, variant);
  (PROP_DRAW[type] ?? propRock)(ctx, { ...palette, prop2: palette.prop2 }, rng);
  propCache.set(key, canvas);
  return canvas;
}

export function clearSpriteCaches() { spriteCache.clear(); propCache.clear(); }
