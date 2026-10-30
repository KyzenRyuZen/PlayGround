/* ---------------------------------------------------------------
   Hand-drawn vector art for Emberbound.
   Everything is procedural: no external assets, no loading screens.
   --------------------------------------------------------------- */

const TAU = Math.PI * 2;

function glow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function noGlow(ctx) { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------------------------------------------------- player */
export function drawPlayer(ctx, o) {
  const { classId, facing, time, moving, attackAnim, castAnim, r = 17 } = o;
  const bob = moving ? Math.sin(time * 11) * 2.2 : Math.sin(time * 2.3) * 1.1;
  const flash = o.hitFlash > 0;
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.invuln > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.55;
  ctx.save();
  ctx.translate(0, bob);

  const armor = o.armorColor || '#b9a06b';
  const weapon = o.weaponColor || '#e8d6a2';

  if (classId === 'warrior') drawWarrior(ctx, o, armor, weapon, facing, time, attackAnim, moving);
  else if (classId === 'mage') drawMage(ctx, o, armor, weapon, facing, time, attackAnim, castAnim, moving);
  else drawArcher(ctx, o, armor, weapon, facing, time, attackAnim, moving);

  if (flash) {
    ctx.globalCompositeOperation = 'lighter';
    ellipse(ctx, 0, -10, r + 8, r + 14, 'rgba(255,120,100,.35)');
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  ctx.restore();
}

function drawWarrior(ctx, o, armor, weapon, facing, t, atk, moving) {
  const step = moving ? Math.sin(t * 12) * 3 : 0;
  // shadow cape
  ctx.save();
  const capeWave = Math.sin(t * 4) * 3;
  ctx.beginPath();
  ctx.moveTo(-13, -18); ctx.quadraticCurveTo(-24, 6, -17 + capeWave, 25);
  ctx.quadraticCurveTo(0, 32, 17 + capeWave, 25); ctx.quadraticCurveTo(24, 6, 13, -18);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, -18, 0, 30);
  cg.addColorStop(0, '#5a2d2a'); cg.addColorStop(1, '#24100f');
  ctx.fillStyle = cg; ctx.fill();
  ctx.restore();

  // legs
  ctx.fillStyle = '#30271f';
  ellipse(ctx, -6, 22 + step, 5, 7, '#3a2c22');
  ellipse(ctx, 6, 22 - step, 5, 7, '#3a2c22');

  // torso
  const bg = ctx.createLinearGradient(-14, -22, 12, 22);
  bg.addColorStop(0, '#8a7048'); bg.addColorStop(0.45, '#57452e'); bg.addColorStop(1, '#241a12');
  roundRect(ctx, -13, -17, 26, 31, 7); ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = armor; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.85; ctx.stroke(); ctx.globalAlpha = 1;

  // belt
  ctx.fillStyle = '#20160e'; ctx.fillRect(-13, 8, 26, 4);
  ctx.fillStyle = armor; ctx.fillRect(-3, 8, 6, 4);

  // pauldrons
  ellipse(ctx, -14, -12, 7, 6, '#6a5335');
  ellipse(ctx, 14, -12, 7, 6, '#6a5335');
  ctx.strokeStyle = armor; ctx.lineWidth = 1; ctx.stroke();

  // head + helm
  ellipse(ctx, 0, -23, 9, 9, '#b98e68');
  ctx.beginPath(); ctx.arc(0, -25, 10, Math.PI, TAU); ctx.fillStyle = '#7c633f'; ctx.fill();
  ctx.fillStyle = armor;
  ctx.fillRect(-10, -26, 20, 2.4);
  ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(3, -31); ctx.lineTo(-3, -31); ctx.closePath(); ctx.fill();

  // shield arm (left of screen)
  ctx.save();
  ctx.translate(-16, -2); ctx.rotate(-0.12);
  ctx.beginPath();
  ctx.moveTo(-7, -12); ctx.lineTo(7, -12); ctx.lineTo(9, 4); ctx.quadraticCurveTo(0, 15, -9, 4); ctx.closePath();
  const sg = ctx.createLinearGradient(-8, -12, 8, 12);
  sg.addColorStop(0, '#6f5a38'); sg.addColorStop(1, '#2a2117');
  ctx.fillStyle = sg; ctx.fill();
  ctx.strokeStyle = armor; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = weapon; ellipse(ctx, 0, 1, 2.4, 3.2, weapon);
  ctx.restore();

  // sword arm, points along facing
  ctx.save();
  ctx.translate(9, -2);
  ctx.rotate(facing + Math.PI / 2 + (atk > 0 ? Math.sin(atk * Math.PI) * 1.15 : Math.sin(t * 2) * 0.06));
  ctx.strokeStyle = '#3b2b1c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 8); ctx.stroke();
  const blade = ctx.createLinearGradient(0, 8, 0, -30);
  blade.addColorStop(0, '#d8dbe0'); blade.addColorStop(0.55, '#f5f0df'); blade.addColorStop(1, weapon);
  ctx.strokeStyle = blade; ctx.lineWidth = 4.2; ctx.lineCap = 'round';
  glow(ctx, weapon, atk > 0 ? 14 : 5);
  ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(0, -27); ctx.stroke();
  noGlow(ctx);
  // guard
  ctx.strokeStyle = armor; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(6, 8); ctx.stroke();
  ctx.restore();
}

function drawMage(ctx, o, armor, weapon, facing, t, atk, cast, moving) {
  const float = Math.sin(t * 2.8) * 2;
  ctx.translate(0, -2 + float);
  // robe
  const rg = ctx.createLinearGradient(0, -26, 0, 30);
  rg.addColorStop(0, '#4b3f86'); rg.addColorStop(0.55, '#2a2350'); rg.addColorStop(1, '#141126');
  ctx.beginPath();
  ctx.moveTo(-11, -12); ctx.quadraticCurveTo(-18, 12, -20, 27);
  ctx.quadraticCurveTo(0, 34, 20, 27); ctx.quadraticCurveTo(18, 12, 11, -12);
  ctx.closePath(); ctx.fillStyle = rg; ctx.fill();
  ctx.strokeStyle = armor; ctx.lineWidth = 1; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
  // robe runes
  ctx.fillStyle = weapon;
  for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.5 + Math.sin(t * 3 + i) * 0.2; ellipse(ctx, -7 + i * 7, 14 + (i % 2) * 5, 1.2, 1.2, weapon); }
  ctx.globalAlpha = 1;
  // shoulders
  ellipse(ctx, -11, -13, 6, 5, '#3a3266');
  ellipse(ctx, 11, -13, 6, 5, '#3a3266');
  // head + hood
  ellipse(ctx, 0, -24, 8, 8, '#c9a9c4');
  ctx.beginPath(); ctx.arc(0, -24, 11, Math.PI * 0.95, TAU + Math.PI * 0.05); ctx.fillStyle = '#2c2652'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -27); ctx.quadraticCurveTo(0, -44, 10, -27); ctx.fillStyle = '#3d346e'; ctx.fill();
  // eyes
  ellipse(ctx, -3, -23, 1.2, 0.9, '#dff3ff');
  ellipse(ctx, 3, -23, 1.2, 0.9, '#dff3ff');
  // staff arm
  ctx.save();
  ctx.translate(10, -4);
  ctx.rotate(facing + Math.PI / 2 + 0.18);
  ctx.strokeStyle = '#4b3a2b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -34); ctx.stroke();
  const orbR = 6 + (cast > 0 ? cast * 5 : 0) + Math.sin(t * 5) * 0.8;
  glow(ctx, weapon, 18 + cast * 10);
  ellipse(ctx, 0, -38, orbR, orbR, weapon);
  ctx.globalAlpha = 0.35;
  ellipse(ctx, 0, -38, orbR * 2.1, orbR * 2.1, weapon);
  ctx.globalAlpha = 1; noGlow(ctx);
  ctx.restore();
  // orbiting motes
  for (let i = 0; i < 3; i++) {
    const a = t * 1.4 + i * TAU / 3;
    const px = Math.cos(a) * 22, py = -16 + Math.sin(a) * 7;
    ellipse(ctx, px, py, 1.5, 1.5, weapon);
  }
}

function drawArcher(ctx, o, armor, weapon, facing, t, atk, moving) {
  const step = moving ? Math.sin(t * 13) * 2.8 : 0;
  // cloak
  ctx.beginPath();
  ctx.moveTo(-10, -15); ctx.quadraticCurveTo(-20, 8, -13 + Math.sin(t * 5) * 2, 24);
  ctx.quadraticCurveTo(0, 29, 13 + Math.sin(t * 5 + 1) * 2, 24); ctx.quadraticCurveTo(20, 8, 10, -15);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, -15, 0, 26);
  cg.addColorStop(0, '#225143'); cg.addColorStop(1, '#0d2620');
  ctx.fillStyle = cg; ctx.fill();
  // legs
  ellipse(ctx, -5, 21 + step, 4.5, 6.5, '#2c4036');
  ellipse(ctx, 5, 21 - step, 4.5, 6.5, '#2c4036');
  // torso
  roundRect(ctx, -10, -16, 20, 27, 6);
  const bg = ctx.createLinearGradient(-10, -16, 10, 12);
  bg.addColorStop(0, '#4d7a5f'); bg.addColorStop(1, '#1b3329');
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = armor; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.8; ctx.stroke(); ctx.globalAlpha = 1;
  // hood/head
  ellipse(ctx, 0, -24, 8, 8, '#c6a07d');
  ctx.beginPath(); ctx.arc(0, -25, 10.5, Math.PI * 0.9, TAU + Math.PI * 0.1); ctx.fillStyle = '#244738'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-9, -28); ctx.quadraticCurveTo(0, -42, 9, -28); ctx.fillStyle = '#2f5e49'; ctx.fill();
  ellipse(ctx, -2.8, -23, 1, 0.8, '#eafff4');
  ellipse(ctx, 2.8, -23, 1, 0.8, '#eafff4');
  // quiver
  ctx.save();
  ctx.rotate(-0.5);
  roundRect(ctx, 11, -18, 6, 20, 3); ctx.fillStyle = '#3a2b1d'; ctx.fill();
  ctx.strokeStyle = weapon; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(13 + i * 1.5, -18); ctx.lineTo(15 + i * 1.5, -27); ctx.stroke(); }
  ctx.restore();
  // bow arm
  ctx.save();
  ctx.translate(10, -3);
  ctx.rotate(facing + Math.PI / 2 + (atk > 0 ? -0.35 : 0));
  ctx.strokeStyle = '#6b4b2a'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -10, 15, -1.2, 1.2); ctx.stroke();
  ctx.strokeStyle = weapon; ctx.lineWidth = 1; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.moveTo(5.7, -23.3); ctx.lineTo(4, -10); ctx.lineTo(5.7, 3.3); ctx.stroke();
  if (atk > 0) {
    ctx.strokeStyle = '#eafff4'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(-4, -10); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ---------------------------------------------------------- enemies */
export function drawEnemy(ctx, e, t, player) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const bob = Math.sin(e.anim || t * 2) * 2;
  if (e.spawnT > 0) {
    const p = 1 - e.spawnT / 0.55;
    ctx.globalAlpha = 0.4 + p * 0.6;
    ctx.strokeStyle = e.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, e.r + (1 - p) * 30, 0, TAU); ctx.stroke();
  }
  if (e.freezeT > 0) ctx.globalAlpha = 0.8;
  const r = e.r;
  if (e.boss) drawBoss(ctx, e, t, player);
  else if (e.type === 'crawler') drawCrawler(ctx, e, bob, r);
  else if (e.type === 'brute') drawBrute(ctx, e, bob, r);
  else if (e.type === 'wisp') drawWisp(ctx, e, bob, r);
  else if (e.type === 'shade') drawShade(ctx, e, bob, r);
  else if (e.type === 'hexer') drawHexer(ctx, e, bob, r);
  else drawSentinel(ctx, e, bob, r);

  if (e.elite) {
    ctx.strokeStyle = 'rgba(255,209,120,.75)'; ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 5]); ctx.lineDashOffset = -t * 18;
    ctx.beginPath(); ctx.ellipse(0, r * 0.65, r * 1.5, r * 0.55, 0, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (e.flash > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = e.flash * 5;
    ellipse(ctx, 0, -r * 0.2, r * 1.25, r * 1.25, '#fff');
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  if (e.freezeT > 0) {
    ctx.globalAlpha = 0.35;
    ellipse(ctx, 0, -r * 0.3, r * 1.3, r * 1.4, '#bfefff');
    ctx.globalAlpha = 1;
  }
  // windup telegraph (non-boss)
  if (!e.boss && e.state === 'windup') {
    const p = 1 - e.t / Math.max(0.01, e.windup);
    const base = e.attackRange || 45;
    ctx.save();
    ctx.rotate(e.angle);
    ctx.globalAlpha = 0.28 + p * 0.4;
    const g = ctx.createLinearGradient(0, 0, base + 28, 0);
    g.addColorStop(0, 'rgba(255,90,70,0)'); g.addColorStop(1, 'rgba(255,90,70,.7)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(base + 28, -e.r * 0.7); ctx.lineTo(base + 28, e.r * 0.7); ctx.lineTo(0, 8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // health bar
  if (!e.boss && e.hp < e.maxHp) {
    const w = Math.max(24, r * 2.4);
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(-w / 2, -r - 15, w, 4);
    const hpw = (e.hp / e.maxHp) * w;
    ctx.fillStyle = e.elite ? '#ffd07a' : '#d9665c';
    ctx.fillRect(-w / 2, -r - 15, hpw, 4);
  }
  ctx.restore();
}

function drawCrawler(ctx, e, bob, r) {
  ctx.save(); ctx.translate(0, bob);
  ctx.strokeStyle = '#233d2c'; ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 2) {
    for (let j = 0; j < 2; j++) {
      const a = 0.7 + j * 0.6;
      ctx.beginPath(); ctx.moveTo(i * r * 0.4, r * 0.4);
      ctx.lineTo(i * (r + 6) * Math.cos(a), (r + 5) * Math.sin(a)); ctx.stroke();
    }
  }
  const g = ctx.createRadialGradient(-4, -6, 2, 0, 0, r + 4);
  g.addColorStop(0, '#8fe0a3'); g.addColorStop(0.7, e.color); g.addColorStop(1, '#2b5c3c');
  ellipse(ctx, 0, 0, r, r * 0.9, g);
  ctx.fillStyle = '#203f2c';
  for (let i = 0; i < 5; i++) {
    const a = -0.4 + i * 0.45;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, -r * 0.6);
    ctx.lineTo(Math.cos(a) * (r + 5), -r * 0.9); ctx.lineTo(Math.cos(a) * r * 0.9, -r * 0.3); ctx.closePath(); ctx.fill();
  }
  ellipse(ctx, -4, -2, 3.5, 4.2, '#f4ffe9');
  ellipse(ctx, 5, -2, 3.5, 4.2, '#f4ffe9');
  ellipse(ctx, -4, -1, 1.3, 2.2, '#111');
  ellipse(ctx, 5, -1, 1.3, 2.2, '#111');
}

function drawBrute(ctx, e, bob, r) {
  ctx.save(); ctx.translate(0, bob * 0.5);
  ctx.strokeStyle = '#2f2119'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.4); ctx.lineTo(-r * 0.8, r * 0.95); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.4); ctx.lineTo(r * 0.8, r * 0.95); ctx.stroke();
  const g = ctx.createRadialGradient(-6, -10, 4, 0, 0, r + 4);
  g.addColorStop(0, '#c0a48a'); g.addColorStop(0.65, e.color); g.addColorStop(1, '#59433a');
  roundRect(ctx, -r * 0.9, -r * 0.9, r * 1.8, r * 1.8, 9); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#4c382e'; ctx.lineWidth = 2; ctx.stroke();
  // cracks
  ctx.strokeStyle = 'rgba(255,150,90,.55)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-2, -2); ctx.lineTo(-7, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7, -6); ctx.lineTo(12, 2); ctx.lineTo(8, 10); ctx.stroke();
  ellipse(ctx, -8, -r * 0.82, 2.6, 2, '#ffd6a0');
  ellipse(ctx, 8, -r * 0.82, 2.6, 2, '#ffd6a0');
  // fists
  ellipse(ctx, -r * 0.95, r * 0.1, r * 0.3, r * 0.32, '#6e5545');
  ellipse(ctx, r * 0.95, r * 0.1, r * 0.3, r * 0.32, '#6e5545');
  ctx.restore();
}

function drawWisp(ctx, e, bob, r) {
  ctx.save(); ctx.translate(0, -r * 0.3 + bob);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.5);
  g.addColorStop(0, '#fff3c4'); g.addColorStop(0.3, e.color); g.addColorStop(1, 'rgba(255,120,40,0)');
  glow(ctx, e.color, 18);
  ellipse(ctx, 0, 0, r * 1.15, r * 1.15, g);
  noGlow(ctx);
  ctx.fillStyle = 'rgba(255,180,90,.5)';
  for (let i = 0; i < 3; i++) {
    const a = Math.sin(e.anim + i) * 0.4;
    ctx.beginPath(); ctx.moveTo(0, r * 0.4); ctx.quadraticCurveTo(a * 12, r * 1.4 + i * 4, -a * 8, r * 2.2 + i * 3); ctx.lineTo(4, r * 1.1); ctx.fill();
  }
  ellipse(ctx, -3, -1, 1.8, 2.4, '#3a1b0d');
  ellipse(ctx, 4, -1, 1.8, 2.4, '#3a1b0d');
  ctx.restore();
}

function drawShade(ctx, e, bob, r) {
  ctx.save(); ctx.translate(0, bob * 0.6);
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(0, r * 0.8, r * 0.9, r * 0.3, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, '#3a2b58'); g.addColorStop(1, '#120c20');
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.2);
  ctx.quadraticCurveTo(-r * 1.2, r * 0.8, -r * 0.5, r * 1.2);
  ctx.lineTo(0, r * 0.8 + Math.sin(e.anim) * 3);
  ctx.lineTo(r * 0.5, r * 1.2);
  ctx.quadraticCurveTo(r * 1.2, r * 0.8, r * 0.6, -r * 0.2);
  ctx.quadraticCurveTo(0, -r * 1.4, -r * 0.6, -r * 0.2);
  ctx.fillStyle = g; ctx.fill();
  // hood
  ctx.beginPath(); ctx.arc(0, -r * 0.25, r * 0.55, Math.PI * 0.9, TAU + Math.PI * 0.1); ctx.fillStyle = '#241a3a'; ctx.fill();
  glow(ctx, '#b9a3e8', 10);
  ellipse(ctx, -4, -r * 0.3, 1.7, 2.2, '#d9c8ff');
  ellipse(ctx, 4, -r * 0.3, 1.7, 2.2, '#d9c8ff');
  noGlow(ctx);
  // claws
  ctx.strokeStyle = '#8b73b8'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(-15, 11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, 4); ctx.lineTo(15, 11); ctx.stroke();
  ctx.restore();
}

function drawHexer(ctx, e, bob, r) {
  ctx.save(); ctx.translate(0, bob * 0.5);
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, '#55652f'); g.addColorStop(1, '#1c2410');
  ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.9, r); ctx.lineTo(r * 0.9, r); ctx.lineTo(r * 0.6, -r * 0.2); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  ellipse(ctx, 0, -r * 0.45, r * 0.45, r * 0.5, '#8d9a63');
  ctx.beginPath(); ctx.arc(0, -r * 0.5, r * 0.55, Math.PI, TAU); ctx.fillStyle = '#39421f'; ctx.fill();
  glow(ctx, '#c7e37b', 8);
  ellipse(ctx, -4, -r * 0.45, 1.5, 2, '#e7ff9c');
  ellipse(ctx, 4, -r * 0.45, 1.5, 2, '#e7ff9c');
  noGlow(ctx);
  ctx.strokeStyle = '#5b4327'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(r * 0.6, r * 0.2); ctx.lineTo(r * 1.15, -r * 0.8); ctx.stroke();
  glow(ctx, '#d6ff8a', 14);
  ellipse(ctx, r * 1.15, -r * 0.85, 4, 4, '#d6ff8a');
  noGlow(ctx);
  ctx.restore();
}

function drawSentinel(ctx, e, bob, r) {
  ctx.save(); ctx.translate(0, bob * 0.35);
  // body
  roundRect(ctx, -r * 0.6, -r * 0.8, r * 1.2, r * 1.6, 8);
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, '#b8c4d4'); g.addColorStop(0.5, e.color); g.addColorStop(1, '#3c4655');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#2f3844'; ctx.lineWidth = 1.5; ctx.stroke();
  // eye slit
  ctx.fillStyle = '#10141b'; ctx.fillRect(-r * 0.35, -r * 0.5, r * 0.7, 5);
  glow(ctx, '#ffb35e', 8);
  ctx.fillStyle = '#ffb35e'; ctx.fillRect(-r * 0.25, -r * 0.48, r * 0.5, 2);
  noGlow(ctx);
  // shield
  ctx.save();
  ctx.translate(-r * 0.8, r * 0.05);
  ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(6, -14); ctx.lineTo(6, 8); ctx.quadraticCurveTo(0, 18, -6, 8); ctx.closePath();
  ctx.fillStyle = '#4a5666'; ctx.fill(); ctx.strokeStyle = '#c2cfdf'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
  // spear
  ctx.strokeStyle = '#6d5a3e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r * 0.8, r * 0.6); ctx.lineTo(r * 0.8, -r * 1.4); ctx.stroke();
  ctx.fillStyle = '#d4dbe4';
  ctx.beginPath(); ctx.moveTo(r * 0.8, -r * 1.8); ctx.lineTo(r * 0.8 + 4, -r * 1.35); ctx.lineTo(r * 0.8 - 4, -r * 1.35); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* ---------------------------------------------------------- bosses */
function drawBoss(ctx, e, t) {
  const r = e.r;
  const meta = e.bossId || e.type;
  // aura
  ctx.save();
  const aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.1);
  aura.addColorStop(0, 'rgba(255,255,255,.06)');
  aura.addColorStop(0.6, e.color + '22');
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ellipse(ctx, 0, 0, r * 2.1, r * 1.8, aura);
  if (e.phase === 2) {
    ctx.strokeStyle = e.accent || e.color; ctx.globalAlpha = 0.35 + Math.sin(t * 6) * 0.15;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, r * 0.5, r * 1.7, r * 0.7, 0, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  if (meta === 'grovetender') {
    // roots
    ctx.strokeStyle = '#2f5138'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * 10, r * 0.3);
      ctx.quadraticCurveTo(i * 24, r * 1.1, i * 18 + Math.sin(t * 2 + i) * 5, r * 1.6); ctx.stroke();
    }
    // trunk
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#7c8f5c'); g.addColorStop(0.6, '#4e633d'); g.addColorStop(1, '#29351f');
    roundRect(ctx, -r * 0.55, -r * 0.7, r * 1.1, r * 1.6, 22); ctx.fillStyle = g; ctx.fill();
    // branch arms
    ctx.strokeStyle = '#435737'; ctx.lineWidth = 6;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * r * 0.5, -r * 0.2);
      ctx.quadraticCurveTo(s * r * 1.1, -r * 0.6, s * r * 1.3, -r * 0.1); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(s * r * 1.3, -r * 0.1); ctx.lineTo(s * r * 1.5, -r * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * r * 1.3, -r * 0.1); ctx.lineTo(s * r * 1.45, r * 0.3); ctx.stroke();
      ctx.lineWidth = 6;
    }
    // head
    ellipse(ctx, 0, -r * 0.75, r * 0.42, r * 0.4, '#6f8052');
    glow(ctx, '#d5ffb8', 16);
    ellipse(ctx, -r * 0.15, -r * 0.78, 3, 3.5, '#e8ffd0');
    ellipse(ctx, r * 0.15, -r * 0.78, 3, 3.5, '#e8ffd0');
    noGlow(ctx);
    // heart
    glow(ctx, '#ffd98a', 18); ellipse(ctx, 0, 0, 8 + Math.sin(t * 4) * 1.5, 9, '#ffd98a'); noGlow(ctx);
    // antlers
    ctx.strokeStyle = '#6b7d50'; ctx.lineWidth = 3;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 8, -r * 0.95); ctx.quadraticCurveTo(s * 22, -r * 1.3, s * 30, -r * 1.05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 18, -r * 1.18); ctx.lineTo(s * 22, -r * 1.4); ctx.stroke();
    }
  } else if (meta === 'colossus') {
    // legs
    ctx.fillStyle = '#3b211d';
    for (const s of [-1, 1]) {
      roundRect(ctx, s * r * 0.55 - 10, r * 0.4, 20, r * 0.9, 6); ctx.fill();
    }
    // body
    const g = ctx.createRadialGradient(-10, -10, 6, 0, 0, r * 1.1);
    g.addColorStop(0, '#7a4232'); g.addColorStop(0.55, e.color); g.addColorStop(1, '#341713');
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, -r * 0.55); ctx.lineTo(-r * 0.5, -r * 0.95); ctx.lineTo(r * 0.15, -r * 0.85);
    ctx.lineTo(r * 0.8, -r * 0.35); ctx.lineTo(r * 0.7, r * 0.55); ctx.lineTo(r * 0.1, r * 0.72);
    ctx.lineTo(-r * 0.7, r * 0.5); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    // lava cracks
    glow(ctx, '#ff9a4a', 12);
    ctx.strokeStyle = '#ffb15c'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.3); ctx.lineTo(-r * 0.15, -r * 0.05); ctx.lineTo(-r * 0.25, r * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.35, -r * 0.45); ctx.lineTo(r * 0.15, -r * 0.1); ctx.lineTo(r * 0.45, r * 0.15); ctx.stroke();
    noGlow(ctx);
    // eyes
    glow(ctx, '#ffd08a', 14);
    ellipse(ctx, -r * 0.2, -r * 0.62, 4, 3, '#ffd08a');
    ellipse(ctx, r * 0.2, -r * 0.62, 4, 3, '#ffd08a');
    noGlow(ctx);
    // fists
    for (const s of [-1, 1]) {
      ellipse(ctx, s * r * 0.95, r * 0.12, r * 0.28, r * 0.3, '#5a2f25');
      ctx.strokeStyle = '#ff9a4a'; ctx.lineWidth = 1.4; ctx.beginPath();
      ctx.arc(s * r * 0.95, r * 0.12, r * 0.18, 0, 1.6); ctx.stroke();
    }
  } else if (meta === 'warden') {
    // floating shards
    for (let i = 0; i < 5; i++) {
      const a = t * 0.6 + i * TAU / 5;
      const px = Math.cos(a) * r * 1.15, py = -r * 0.2 + Math.sin(a) * r * 0.55;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a);
      ctx.fillStyle = 'rgba(180,240,255,.7)';
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(3, 3); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // robe
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#b8ecff'); g.addColorStop(0.4, '#5a9cb8'); g.addColorStop(1, '#1c3444');
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.4); ctx.lineTo(-r * 0.8, r * 0.9);
    ctx.lineTo(0, r * 1.1); ctx.lineTo(r * 0.8, r * 0.9); ctx.lineTo(r * 0.5, -r * 0.4); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    // head / crown
    ellipse(ctx, 0, -r * 0.55, r * 0.3, r * 0.34, '#dff7ff');
    ctx.strokeStyle = '#c9f4ff'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * 6, -r * 0.75); ctx.lineTo(i * 8, -r * 0.95 - Math.abs(i) * 3); ctx.stroke();
    }
    glow(ctx, '#c9f4ff', 12);
    ellipse(ctx, -5, -r * 0.58, 2, 2.5, '#2a5a72');
    ellipse(ctx, 5, -r * 0.58, 2, 2.5, '#2a5a72');
    noGlow(ctx);
    // staff
    ctx.strokeStyle = '#9bc8d8'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(r * 0.7, r * 0.8); ctx.lineTo(r * 0.9, -r * 1.0); ctx.stroke();
    glow(ctx, '#dffcff', 18);
    ellipse(ctx, r * 0.9, -r * 1.05, 4.5, 4.5, '#dffcff');
    noGlow(ctx);
  } else {
    // sovereign
    ctx.save();
    ctx.translate(0, Math.sin(t * 1.6) * 4);
    // tendrils
    ctx.strokeStyle = 'rgba(155,90,220,.55)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 + Math.sin(t + i) * 0.2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.4, r * 0.2);
      ctx.quadraticCurveTo(Math.cos(a) * r * 1.1, r * 0.8, Math.cos(a) * r * 1.35, r * 1.4); ctx.stroke();
    }
    // robe
    const g = ctx.createRadialGradient(0, -r * 0.3, 4, 0, 0, r);
    g.addColorStop(0, '#4b2a72'); g.addColorStop(0.55, '#241238'); g.addColorStop(1, '#0b0614');
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.45); ctx.quadraticCurveTo(-r * 0.95, r * 0.6, -r * 0.5, r * 1.0);
    ctx.lineTo(r * 0.5, r * 1.0); ctx.quadraticCurveTo(r * 0.95, r * 0.6, r * 0.45, -r * 0.45);
    ctx.quadraticCurveTo(0, -r * 1.0, -r * 0.45, -r * 0.45); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    // hood
    ctx.beginPath(); ctx.arc(0, -r * 0.4, r * 0.38, Math.PI * 0.9, TAU + Math.PI * 0.1); ctx.fillStyle = '#170b24'; ctx.fill();
    glow(ctx, '#e2b6ff', 14);
    ellipse(ctx, -5, -r * 0.45, 2.4, 3, '#f0d6ff');
    ellipse(ctx, 5, -r * 0.45, 2.4, 3, '#f0d6ff');
    noGlow(ctx);
    // crown
    ctx.strokeStyle = '#d9a6ff'; ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(i * 4, -r * 0.72); ctx.lineTo(i * 5, -r * 0.95 - (3 - Math.abs(i)) * 4); ctx.stroke();
    }
    // void orb
    glow(ctx, '#d9a6ff', 24);
    ellipse(ctx, 0, r * 0.1, 8 + Math.sin(t * 5) * 2, 8 + Math.sin(t * 5) * 2, '#d9a6ff');
    noGlow(ctx);
    ctx.restore();
  }
}

/* ---------------------------------------------------------- screen-space helpers */
export function drawHealthbar(ctx, x, y, w, h, pct, color) {
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, pct), h);
}

export const ART = { TAU };
