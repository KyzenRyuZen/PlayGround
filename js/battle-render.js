/* Canvas rendering for the action battle. All art is vector, drawn at runtime. */

const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rand = (a, b) => a + Math.random() * (b - a);

export const renderMethods = {
  buildBackground() {
    if (!this.W || !this.H) return;
    const W = this.W, H = this.H, dpr = this.dpr;
    const c = document.createElement('canvas');
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = this.chapter.colors;

    const base = g.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, '#08090d');
    base.addColorStop(.38, '#101014');
    base.addColorStop(.7, '#0b0b0f');
    base.addColorStop(1, '#050608');
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);

    const horizon = g.createRadialGradient(W * .5, H * .18, 0, W * .5, H * .18, Math.max(W, H) * .74);
    horizon.addColorStop(0, hexA(colors[0], .16));
    horizon.addColorStop(.34, hexA(colors[1], .07));
    horizon.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = horizon;
    g.fillRect(0, 0, W, H);

    // Distant architecture.
    g.save();
    g.globalAlpha = .35;
    for (let i = 0; i < 4; i++) {
      const x = W * (.08 + i * .29);
      const ph = H * rand(.16, .27);
      g.fillStyle = i % 2 ? '#0e0d12' : '#0b0b0f';
      g.fillRect(x, H * .32 - ph, W * .12, ph + H * .26);
      g.beginPath();
      g.moveTo(x, H * .32 - ph);
      g.lineTo(x + W * .06, H * .32 - ph - H * .08);
      g.lineTo(x + W * .12, H * .32 - ph);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.018)';
      g.fillRect(x + W * .025, H * .4, W * .018, ph * .5);
    }
    g.restore();

    // Arena floor.
    const cx = W * .5, cy = H * .58;
    const rx = W * .67, ry = H * .48;
    const floor = g.createRadialGradient(cx, cy, 20, cx, cy, Math.max(rx, ry));
    floor.addColorStop(0, 'rgba(33,31,33,.9)');
    floor.addColorStop(.65, 'rgba(20,19,22,.92)');
    floor.addColorStop(1, 'rgba(6,6,8,0)');
    g.save();
    g.translate(cx, cy);
    g.scale(1, ry / rx);
    g.beginPath();
    g.arc(0, 0, rx, 0, TAU);
    g.fillStyle = floor;
    g.fill();
    g.restore();

    // Flagstones.
    let seed = 1337 + this.stage.chapter * 17;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    g.save();
    g.beginPath();
    g.ellipse(cx, cy, W * .59, H * .43, 0, 0, TAU);
    g.clip();
    const tileW = Math.max(48, Math.min(86, W / 12));
    const tileH = tileW * .54;
    for (let row = -2; row < H / tileH + 2; row++) {
      for (let col = -1; col < W / tileW + 2; col++) {
        const x = col * tileW + (row % 2 ? tileW * .48 : 0) + rnd() * 5;
        const y = row * tileH + rnd() * 4;
        const shade = rnd();
        g.beginPath();
        g.moveTo(x + 3, y + 2);
        g.lineTo(x + tileW - 5, y);
        g.lineTo(x + tileW - 1, y + tileH - 4);
        g.lineTo(x + 2, y + tileH - 1);
        g.closePath();
        g.fillStyle = shade > .7 ? 'rgba(255,255,255,.021)' : shade < .2 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.008)';
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,.22)';
        g.lineWidth = 1;
        g.stroke();
      }
    }
    // Cracks and runes.
    g.strokeStyle = hexA(colors[0], .12);
    g.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      let x = rnd() * W, y = H * .3 + rnd() * H * .6;
      g.beginPath();
      g.moveTo(x, y);
      for (let j = 0; j < 4; j++) {
        x += (rnd() - .5) * 65;
        y += (rnd() - .5) * 45;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.strokeStyle = hexA(colors[0], .1);
    g.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const r = Math.min(W, H) * (.2 + i * .07);
      g.beginPath();
      g.arc(cx, cy, r, .12, Math.PI - .12);
      g.stroke();
      g.beginPath();
      g.arc(cx, cy, r, Math.PI + .12, TAU - .12);
      g.stroke();
    }
    g.restore();

    // Broken side pillars.
    drawPillar(g, W * .055, H * .43, W * .075, H, colors, 1);
    drawPillar(g, W * .945, H * .39, W * .075, H, colors, -1);

    // Torch glows at the edges.
    for (const tx of [W * .14, W * .86]) {
      const gl = g.createRadialGradient(tx, H * .28, 0, tx, H * .28, W * .12);
      gl.addColorStop(0, hexA(colors[0], .12));
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl;
      g.fillRect(tx - W * .12, H * .28 - W * .12, W * .24, W * .24);
      g.fillStyle = hexA(colors[0], .8);
      g.beginPath();
      g.ellipse(tx, H * .28, 2, 7, 0, 0, TAU);
      g.fill();
    }

    // Soft vignette baked into background.
    const vig = g.createRadialGradient(W * .5, H * .5, Math.min(W, H) * .25, W * .5, H * .5, Math.max(W, H) * .72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(.78, 'rgba(0,0,0,.32)');
    vig.addColorStop(1, 'rgba(0,0,0,.82)');
    g.fillStyle = vig;
    g.fillRect(0, 0, W, H);

    // Warm edge bloom.
    const edge = g.createLinearGradient(0, H, 0, H * .6);
    edge.addColorStop(0, hexA(colors[0], .05));
    edge.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = edge;
    g.fillRect(0, H * .6, W, H * .4);

    this.bgCanvas = c;
    this.embers = Array.from({ length: Math.round(clamp(W / 55, 14, 34)) }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      speed: rand(4, 18), sway: rand(.3, 1.6), phase: rand(0, TAU), size: rand(.7, 2),
      alpha: rand(.12, .55)
    }));
  },

  draw() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (this.shake > .2) {
      ctx.translate(rand(-this.shake, this.shake) * .55, rand(-this.shake, this.shake) * .55);
    }
    if (this.bgCanvas) ctx.drawImage(this.bgCanvas, 0, 0, W, H);

    this.drawAmbient(ctx);
    this.drawGroundEffects(ctx);
    this.drawEntities(ctx);

    for (const b of this.projectiles) this.drawProjectile(ctx, b);
    this.drawEffects(ctx);
    this.drawParticles(ctx);
    this.drawNumbers(ctx);
    this.drawAtmosphere(ctx);
    ctx.restore();
    this.drawScreenEffects(ctx);
  },

  drawAmbient(ctx) {
    const t = this.time;
    for (const e of this.embers) {
      const y = ((e.y - t * e.speed) % this.H + this.H) % this.H;
      const x = e.x + Math.sin(t * .5 + e.phase) * e.sway * 6;
      ctx.globalAlpha = e.alpha;
      ctx.fillStyle = this.chapter.colors[0];
      ctx.beginPath();
      ctx.arc(x, y, e.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = .07;
    const fogY = (t * 5) % (this.H + 200) - 100;
    const fog = ctx.createRadialGradient(this.W * .3, fogY, 0, this.W * .3, fogY, this.W * .4);
    fog.addColorStop(0, this.chapter.colors[0]);
    fog.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.globalAlpha = 1;
  },

  drawGroundEffects(ctx) {
    for (const z of this.zones) {
      const a = clamp(z.time / 1.6, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * .16;
      const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r);
      g.addColorStop(0, '#d8ffaf');
      g.addColorStop(1, 'rgba(131,187,94,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, TAU);
      ctx.fill();
      ctx.restore();
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * TAU + this.time;
        ctx.globalAlpha = a * .45;
        ctx.strokeStyle = '#d4f5b2';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(z.x + Math.cos(ang) * z.r * .4, z.y + Math.sin(ang) * z.r * .15);
        ctx.lineTo(z.x + Math.cos(ang) * z.r, z.y + Math.sin(ang) * z.r * .35);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    for (const v of this.vortexes) {
      const a = clamp(v.time / 2.4, 0, 1);
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.globalAlpha = a * .5;
      ctx.strokeStyle = v.color;
      for (let i = 0; i < 4; i++) {
        const ang = this.time * (1 + i * .22) + i;
        ctx.beginPath();
        ctx.ellipse(0, 0, v.r * (.35 + i * .16), v.r * (.12 + i * .05), ang, 0, TAU);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, v.r);
      g.addColorStop(0, hexA(v.color, .17));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, v.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (const t of this.telegraphs) this.drawTelegraph(ctx, t);
  },

  drawEntities(ctx) {
    const list = [this.player, ...this.enemies].filter(Boolean).sort((a, b) => a.y - b.y);
    for (const e of list) {
      if (e === this.player) this.drawHero(ctx, e);
      else this.drawEnemy(ctx, e);
    }
  },

  drawHero(ctx, p) {
    if (!p || p.dead) return;
    const t = this.time;
    const k = heroScale(this);
    const bob = Math.sin(t * 5.2) * 1.4;
    if (p.invuln > 0 && Math.floor(t * 18) % 2 === 0) ctx.globalAlpha = .35;
    ctx.save();
    ctx.translate(p.x, p.y);
    // shadow
    ctx.globalAlpha *= .55;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 3, 22 * k, 7 * k, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    // ground aura
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, 42 * k);
    aura.addColorStop(0, hexA(this.cls.color, .12));
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42 * k, 16 * k, 0, 0, TAU);
    ctx.fill();

    if (p.shield > 0) {
      ctx.strokeStyle = hexA('#ffd083', .65);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -27 * k, 31 * k, 42 * k, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = hexA('#ffd083', .06);
      ctx.fill();
    }
    ctx.translate(0, bob);
    ctx.scale(p.facing * k, k);
    if (p.hitFlash > 0) {
      ctx.shadowColor = '#ff8b6c';
      ctx.shadowBlur = 18;
    }
    if (this.cls.id === 'warrior') drawWarriorHero(ctx, p, t);
    else if (this.cls.id === 'mage') drawMageHero(ctx, p, t);
    else drawArcherHero(ctx, p, t);
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  drawEnemy(ctx, e) {
    if (e.dead) return;
    const k = heroScale(this) * (e.isBoss ? 1 : .9);
    const spawnT = e.spawnTimer > 0 ? clamp(1 - e.spawnTimer / .55, 0, 1) : 1;
    const bob = e.cfg.behavior === 'ranged' ? Math.sin(this.time * 3 + e.id) * 4 : 0;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.globalAlpha = e.spawnTimer > 0 ? .35 + spawnT * .5 : 1;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath();
    ctx.ellipse(0, 3, e.r * 1.35 * k, e.r * .42 * k, 0, 0, TAU);
    ctx.fill();
    if (e.isBoss) {
      const aura = ctx.createRadialGradient(0, -e.r, 0, 0, -e.r, e.r * 3.2 * k);
      aura.addColorStop(0, hexA(e.cfg.glow, .2));
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -e.r, e.r * 3.2 * k, 0, TAU);
      ctx.fill();
    }
    if (e.hitFlash > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 14; }
    ctx.translate(0, bob);
    ctx.scale(e.facing * k * (e.isBoss ? 1.8 : 1), k * (e.isBoss ? 1.8 : 1));
    if (e.isBoss) this.drawBossBody(ctx, e);
    else drawEnemyBody(ctx, e, this.time);

    // wind-up ring
    if (e.state === 'windup') {
      const prog = 1 - e.timer / (e.windupMax || .6);
      ctx.strokeStyle = hexA(e.cfg.glow, .65);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, -16, 22 + prog * 8, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // overhead health bar
    if (!e.isBoss && e.spawnTimer <= 0) {
      const w = Math.max(34, e.r * 2.5);
      const x = e.x - w / 2;
      const y = e.y - e.r * 2.7 * k - 10;
      ctx.fillStyle = 'rgba(0,0,0,.68)';
      roundRect(ctx, x, y, w, 4, 2);
      ctx.fill();
      ctx.fillStyle = e.cfg.glow;
      roundRect(ctx, x, y, Math.max(0, w * clamp(e.hp / e.maxHp, 0, 1)), 4, 2);
      ctx.fill();
      if (e.stun > 0) {
        ctx.fillStyle = '#ffd88c';
        ctx.font = '700 10px Manrope, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✦', e.x, y - 4);
      }
    }
  },

  drawBossBody(ctx, e) {
    if (e.type === 'tidebound') {
      drawTidebound(ctx, e, this.time);
    } else if (e.type === 'hollowking') {
      drawHollowKing(ctx, e, this.time);
    } else {
      drawCinderWarden(ctx, e, this.time);
    }
  },

  drawProjectile(ctx, b) {
    const k = heroScale(this);
    ctx.save();
    ctx.translate(b.x, b.y);
    const ang = Math.atan2(b.vy, b.vx);
    if (b.type === 'arrow') {
      ctx.rotate(ang);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(9, 0);
      ctx.stroke();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(12, 0); ctx.lineTo(4, -4); ctx.lineTo(4, 4); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hexA(b.color, .35);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-25, 0); ctx.stroke();
    } else if (b.type === 'blade') {
      ctx.rotate(b.t * 10);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = .8;
      ctx.beginPath();
      ctx.moveTo(0, -10 * k); ctx.lineTo(4 * k, 0); ctx.lineTo(0, 10 * k); ctx.lineTo(-4 * k, 0);
      ctx.closePath(); ctx.fill();
    } else {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.radius * 3 * k);
      g.addColorStop(0, '#fff');
      g.addColorStop(.25, b.color);
      g.addColorStop(.7, hexA(b.color, .4));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * 3 * k, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius * .55 * k, 0, TAU);
      ctx.fill();
      if (b.type === 'lance') {
        ctx.rotate(ang);
        ctx.strokeStyle = hexA(b.color, .6);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-36, 0); ctx.lineTo(-12, 0);
        ctx.stroke();
      }
    }
    ctx.restore();
  },

  drawTelegraph(ctx, t) {
    const prog = clamp(t.t / t.duration, 0, 1);
    const pulse = .5 + Math.sin(this.time * 15) * .15;
    ctx.save();
    ctx.translate(t.x, t.y);
    if (t.type === 'circle') {
      ctx.strokeStyle = hexA(t.color, .5 + prog * .28);
      ctx.lineWidth = t.boss ? 2.4 : 1.6;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -this.time * 24;
      ctx.beginPath(); ctx.arc(0, 0, t.r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, t.r);
      g.addColorStop(0, hexA(t.color, .05));
      g.addColorStop(.8, hexA(t.color, .07 + prog * .13));
      g.addColorStop(1, hexA(t.color, .3));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, t.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = hexA(t.color, .5);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, t.r * prog, 0, TAU); ctx.stroke();
    } else if (t.type === 'cone') {
      ctx.rotate(t.angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, t.r, -t.spread, t.spread);
      ctx.closePath();
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, t.r);
      g.addColorStop(0, hexA(t.color, .06));
      g.addColorStop(1, hexA(t.color, .22 + prog * .12));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = hexA(t.color, .45);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([5, 8]);
      ctx.beginPath(); ctx.arc(0, 0, t.r, -t.spread, t.spread); ctx.stroke();
    } else if (t.type === 'line') {
      const dx = t.x2 - t.x, dy = t.y2 - t.y;
      const ang = Math.atan2(dy, dx);
      const len = Math.hypot(dx, dy);
      ctx.rotate(ang);
      ctx.fillStyle = hexA(t.color, .08 + prog * .1);
      ctx.fillRect(0, -t.width / 2, len, t.width);
      ctx.strokeStyle = hexA(t.color, .55);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, -t.width / 2, len, t.width);
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -this.time * 40;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
    } else if (t.type === 'ring') {
      ctx.strokeStyle = hexA(t.color, .55);
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const rr = t.r * (.5 + i * .25);
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
      }
      ctx.rotate(this.time * 1.5);
      ctx.setLineDash([3, 10]);
      ctx.beginPath(); ctx.arc(0, 0, t.r, 0, TAU); ctx.stroke();
    }
    if (t.label) {
      ctx.rotate(-(t.type === 'cone' || t.type === 'line' ? t.angle : 0));
      ctx.font = '800 10px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = hexA(t.color, .8);
      ctx.fillText(t.label, 0, t.type === 'line' ? -t.width / 2 - 10 : -t.r - 10);
    }
    ctx.restore();
  },

  drawEffects(ctx) {
    for (const e of this.effects) {
      const p = clamp(e.t / e.duration, 0, 1);
      const fade = 1 - p;
      ctx.save();
      ctx.globalAlpha = fade;
      if (e.type === 'slash' || e.type === 'cleave') {
        ctx.translate(e.x, e.y);
        ctx.strokeStyle = e.color;
        ctx.lineWidth = (e.type === 'cleave' ? 9 : 4) * fade;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * (.55 + p * .5), e.angle - 1.3, e.angle + 1.3);
        ctx.stroke();
      } else if (e.type === 'quake' || e.type === 'nova' || e.type === 'meteor') {
        ctx.translate(e.x, e.y);
        const maxR = e.radius;
        for (let i = 0; i < 3; i++) {
          const rr = maxR * (p * 1.1 - i * .15);
          if (rr <= 0) continue;
          ctx.strokeStyle = hexA(e.color, fade * (.8 - i * .18));
          ctx.lineWidth = 3 - i;
          ctx.beginPath();
          ctx.arc(0, 0, rr, 0, TAU);
          ctx.stroke();
        }
        if (e.type === 'quake') {
          ctx.strokeStyle = hexA(e.color, fade * .8);
          ctx.lineWidth = 2;
          for (let i = 0; i < 9; i++) {
            const a = i / 9 * TAU + .2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * maxR * .2, Math.sin(a) * maxR * .15);
            ctx.lineTo(Math.cos(a) * maxR * (.8 + Math.sin(i) * .12), Math.sin(a) * maxR * .55);
            ctx.stroke();
          }
        }
        if (e.type === 'meteor') {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * p);
          g.addColorStop(0, hexA(e.color, .55 * fade));
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(0, 0, maxR * p, 0, TAU); ctx.fill();
        }
      } else if (e.type === 'shield') {
        ctx.translate(e.x, e.y - 26);
        ctx.strokeStyle = hexA(e.color, fade * .8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * (1 + p * .1), 0, TAU);
        ctx.stroke();
        ctx.setLineDash([3, 7]);
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * .8, -this.time, TAU - this.time);
        ctx.stroke();
      } else if (e.type === 'beam') {
        ctx.strokeStyle = hexA(e.color, fade * .9);
        ctx.lineWidth = e.width * fade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(e.x, e.y); ctx.lineTo(e.x2, e.y2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${fade * .8})`;
        ctx.lineWidth = Math.max(1, e.width * .16);
        ctx.stroke();
      } else if (e.type === 'death' || e.type === 'bossSpawn' || e.type === 'spawn' || e.type === 'summon' || e.type === 'level') {
        ctx.translate(e.x, e.y);
        ctx.strokeStyle = hexA(e.color, fade * .8);
        ctx.lineWidth = e.type === 'level' ? 2.5 : 1.6;
        for (let i = 0; i < 3; i++) {
          const rr = e.radius * (p - i * .16);
          if (rr > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, rr, 0, TAU);
            ctx.stroke();
          }
        }
        if (e.type === 'level') {
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * TAU;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * e.radius * .3, Math.sin(a) * e.radius * .3);
            ctx.lineTo(Math.cos(a) * e.radius * (1 + p), Math.sin(a) * e.radius * (1 + p));
            ctx.stroke();
          }
        }
      } else if (e.type === 'windup') {
        ctx.translate(e.x, e.y);
        ctx.fillStyle = hexA(e.color, fade * .1);
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * (.7 + p * .5), 0, TAU);
        ctx.fill();
      } else if (e.type === 'rain') {
        ctx.strokeStyle = hexA(e.color, fade * .6);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x - 3, e.y - 22); ctx.lineTo(e.x, e.y); ctx.stroke();
      } else if (e.type === 'dash') {
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        for (let i = 0; i < 4; i++) {
          ctx.globalAlpha = fade * .25 * (4 - i);
          ctx.fillStyle = e.color;
          ctx.fillRect(-i * 13 - 10, -18, 8, 36);
        }
      } else if (e.type === 'cast') {
        ctx.translate(e.x, e.y - 15);
        ctx.strokeStyle = hexA(e.color, fade * .8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * (1 - p * .7), 0, TAU);
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * TAU + this.time;
          ctx.fillStyle = hexA(e.color, fade);
          ctx.beginPath();
          ctx.arc(Math.cos(a) * e.radius, Math.sin(a) * e.radius, 2, 0, TAU);
          ctx.fill();
        }
      } else if (e.type === 'vanish' || e.type === 'shadow') {
        ctx.translate(e.x, e.y);
        ctx.strokeStyle = hexA(e.color, fade * .5);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -20, e.radius * p, 0, TAU); ctx.stroke();
      } else if (e.type === 'ring') {
        ctx.translate(e.x, e.y);
        ctx.strokeStyle = hexA(e.color, fade * .7);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, e.radius * (.4 + p), 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
  },

  drawParticles(ctx) {
    for (const p of this.particles) {
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  drawNumbers(ctx) {
    for (const n of this.numbers) {
      const a = clamp(n.life / n.maxLife, 0, 1);
      ctx.globalAlpha = a;
      const size = n.kind === 'buff' ? 15 : n.crit ? 23 : 15;
      ctx.font = `800 ${size}px ${n.kind === 'buff' ? 'Cinzel' : 'Manrope'}, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,.7)';
      ctx.strokeText(n.text, n.x, n.y);
      ctx.fillStyle = n.color;
      ctx.fillText(n.text, n.x, n.y);
    }
    ctx.globalAlpha = 1;
  },

  drawAtmosphere(ctx) {
    // drifting foreground ash
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const x = ((i * 137.5 + this.time * (10 + i % 4 * 4)) % (this.W + 60)) - 30;
      const y = ((i * 83.7 - this.time * (7 + i % 3 * 5)) % (this.H + 60) + this.H + 60) % (this.H + 60);
      ctx.globalAlpha = .08 + (i % 5) * .018;
      ctx.fillStyle = this.chapter.colors[0];
      ctx.beginPath();
      ctx.arc(x, y, 1 + i % 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  },

  drawScreenEffects(ctx) {
    const p = this.player;
    if (this.damageFlash > 0 || (p && p.hp / p.maxHp < .3 && !p.dead)) {
      const low = p && p.hp / p.maxHp < .3 && !p.dead ? .12 + Math.sin(this.time * 5) * .04 : 0;
      const a = Math.max(this.damageFlash * .35, low);
      const g = ctx.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * .24, this.W / 2, this.H / 2, Math.max(this.W, this.H) * .72);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(173,25,32,${a})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }
};

function heroScale(battle) {
  return clamp(Math.min(battle.W, battle.H) / 640, .9, 1.4);
}

function drawPillar(g, x, y, w, h, colors, dir) {
  g.save();
  g.translate(x, y);
  const grd = g.createLinearGradient(-w * .5, 0, w * .5, 0);
  grd.addColorStop(0, '#0a090c');
  grd.addColorStop(.4, '#242126');
  grd.addColorStop(.7, '#151318');
  grd.addColorStop(1, '#07070a');
  g.fillStyle = grd;
  g.fillRect(-w * .5, 0, w, h);
  g.strokeStyle = hexA(colors[0], .11);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-w * .5, 0); g.lineTo(-w * .5, h);
  g.moveTo(w * .5, 0); g.lineTo(w * .5, h);
  g.stroke();
  g.fillStyle = '#0b0a0d';
  g.fillRect(-w * .68, -h * .035, w * 1.36, h * .035);
  g.fillStyle = hexA(colors[0], .08);
  g.fillRect(-w * .62, -h * .06, w * 1.24, h * .018);
  g.strokeStyle = hexA(colors[0], .22);
  for (let i = 0; i < 3; i++) {
    const yy = h * (.16 + i * .24);
    g.beginPath();
    g.moveTo(-w * .24, yy);
    g.lineTo(w * .2, yy + w * .12);
    g.stroke();
  }
  g.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function hexA(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/* ---------- hero silhouettes ---------- */

function drawWarriorHero(ctx, p, t) {
  // cape
  ctx.fillStyle = '#3b1720';
  ctx.beginPath();
  ctx.moveTo(-16, -51);
  ctx.quadraticCurveTo(-31, -27, -24, 1);
  ctx.lineTo(-4, -5);
  ctx.lineTo(10, 1);
  ctx.quadraticCurveTo(27, -30, 16, -51);
  ctx.closePath();
  ctx.fill();
  // back leg / front leg
  ctx.fillStyle = '#1b1518';
  ctx.fillRect(-11, -23, 8, 20);
  ctx.fillRect(3, -23, 8, 20);
  ctx.fillStyle = '#4b2c27';
  ctx.fillRect(-13, -6, 11, 6);
  ctx.fillRect(2, -6, 11, 6);
  // torso
  const body = ctx.createLinearGradient(-18, -54, 16, -20);
  body.addColorStop(0, '#7d4b3b');
  body.addColorStop(.42, '#4d2c2b');
  body.addColorStop(1, '#27181d');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-15, -50);
  ctx.lineTo(-19, -34);
  ctx.lineTo(-13, -21);
  ctx.lineTo(13, -21);
  ctx.lineTo(19, -35);
  ctx.lineTo(15, -50);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c68c51';
  ctx.lineWidth = 1;
  ctx.stroke();
  // belt & chest
  ctx.fillStyle = '#1a1116';
  ctx.fillRect(-12, -30, 24, 5);
  ctx.fillStyle = '#d29a57';
  ctx.fillRect(-2, -30, 4, 5);
  ctx.strokeStyle = 'rgba(238,190,116,.5)';
  ctx.beginPath();
  ctx.moveTo(-9, -46); ctx.lineTo(0, -37); ctx.lineTo(9, -46);
  ctx.stroke();
  // pauldrons
  ctx.fillStyle = '#5d3730';
  ctx.beginPath(); ctx.arc(-17, -49, 9, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(17, -49, 9, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#d49b5b'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(-17, -49, 9, -2.4, .8); ctx.stroke();
  ctx.beginPath(); ctx.arc(17, -49, 9, 2.3, 5.5); ctx.stroke();
  // arms
  ctx.fillStyle = '#39231f';
  roundRect(ctx, -24, -45, 7, 22, 3); ctx.fill();
  roundRect(ctx, 17, -45, 7, 22, 3); ctx.fill();
  // head / helm
  ctx.fillStyle = '#24161b';
  ctx.beginPath();
  ctx.moveTo(-10, -53);
  ctx.quadraticCurveTo(-12, -68, 0, -69);
  ctx.quadraticCurveTo(13, -67, 11, -52);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b98055';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#0b080a';
  ctx.fillRect(-8, -61, 16, 6);
  const glow = p.attackAnim > 0 ? 1 : .7;
  ctx.fillStyle = `rgba(255,180,95,${glow})`;
  ctx.fillRect(-6, -59, 4, 1.6);
  ctx.fillRect(2, -59, 4, 1.6);
  // horns
  ctx.strokeStyle = '#e0b276';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-9, -65); ctx.lineTo(-17, -73); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, -65); ctx.lineTo(17, -73); ctx.stroke();
  // shield on left arm
  ctx.save();
  ctx.translate(-22, -34);
  ctx.rotate(-.08);
  ctx.fillStyle = '#3d2522';
  ctx.beginPath();
  ctx.moveTo(-7, -10); ctx.lineTo(5, -10); ctx.lineTo(7, 2); ctx.lineTo(0, 11); ctx.lineTo(-8, 2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c48a50'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#d9a45f';
  ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3, 1); ctx.lineTo(0, 6); ctx.lineTo(-3, 1); ctx.closePath(); ctx.fill();
  ctx.restore();
  // sword
  const swing = p.attackAnim > 0 ? 1 - p.attackAnim / .24 : 0;
  ctx.save();
  ctx.translate(20, -34);
  ctx.rotate(-.55 + swing * 2.35);
  ctx.fillStyle = '#38241f';
  roundRect(ctx, -2, -2, 5, 12, 2); ctx.fill();
  ctx.fillStyle = '#d29a57';
  ctx.fillRect(-7, -4, 16, 4);
  const blade = ctx.createLinearGradient(0, -6, 0, -55);
  blade.addColorStop(0, '#8e8c86'); blade.addColorStop(.45, '#eee3c4'); blade.addColorStop(1, '#ffffff');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(-4, -5); ctx.lineTo(4, -5); ctx.lineTo(2, -55); ctx.lineTo(0, -61); ctx.lineTo(-2, -55);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,200,.55)';
  ctx.fillRect(-.8, -52, 1.6, 42);
  ctx.restore();
  // glint
  if (swing > .25 && swing < .9) {
    ctx.strokeStyle = `rgba(255,220,160,${1 - swing})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(18, -34, 40, -1.9, .2);
    ctx.stroke();
  }
}

function drawMageHero(ctx, p, t) {
  // robe
  const robe = ctx.createLinearGradient(0, -54, 0, 1);
  robe.addColorStop(0, '#464d8f');
  robe.addColorStop(.45, '#252a5f');
  robe.addColorStop(1, '#11132d');
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-13, -48);
  ctx.quadraticCurveTo(-26, -19, -19, 2);
  ctx.lineTo(19, 2);
  ctx.quadraticCurveTo(25, -21, 14, -49);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,222,222,.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-17, -8); ctx.quadraticCurveTo(0, -1, 17, -8);
  ctx.stroke();
  // belt sash
  ctx.fillStyle = '#6bbfc4';
  ctx.globalAlpha = .55;
  ctx.fillRect(-11, -31, 22, 2);
  ctx.globalAlpha = 1;
  // sleeves
  ctx.fillStyle = '#2b2f6a';
  ctx.beginPath();
  ctx.moveTo(-11, -46); ctx.lineTo(-24, -30); ctx.lineTo(-17, -20); ctx.lineTo(-7, -32); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, -46); ctx.lineTo(23, -32); ctx.lineTo(16, -22); ctx.lineTo(8, -33); ctx.closePath(); ctx.fill();
  // hands
  ctx.fillStyle = '#a89282';
  ctx.beginPath(); ctx.arc(-20, -27, 2.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(19, -29, 2.5, 0, TAU); ctx.fill();
  // hood
  ctx.fillStyle = '#161936';
  ctx.beginPath();
  ctx.moveTo(-14, -48);
  ctx.quadraticCurveTo(-18, -70, 0, -72);
  ctx.quadraticCurveTo(18, -70, 14, -48);
  ctx.quadraticCurveTo(0, -40, -14, -48);
  ctx.fill();
  ctx.strokeStyle = '#78d8db';
  ctx.globalAlpha = .45;
  ctx.beginPath();
  ctx.moveTo(-12, -63); ctx.quadraticCurveTo(0, -72, 12, -63);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // face shadow
  ctx.fillStyle = '#07070e';
  ctx.beginPath();
  ctx.ellipse(0, -56, 9, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9cf6f1';
  ctx.fillRect(-6, -57, 4, 1.7);
  ctx.fillRect(2, -57, 4, 1.7);
  ctx.shadowColor = '#8ff6f1';
  ctx.shadowBlur = 10;
  ctx.fillRect(-5, -56.7, 2, 1.2);
  ctx.fillRect(3, -56.7, 2, 1.2);
  ctx.shadowBlur = 0;
  // staff
  const cast = p.attackAnim > 0 ? 1 - p.attackAnim / .38 : 0;
  ctx.save();
  ctx.translate(22, -26);
  ctx.rotate(-.08 - cast * .14);
  ctx.strokeStyle = '#76624a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(1, -47); ctx.stroke();
  ctx.strokeStyle = '#b89a6d';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-3, -37); ctx.lineTo(3, -37); ctx.moveTo(-2, -29); ctx.lineTo(2, -29); ctx.stroke();
  const orbR = 6 + Math.sin(t * 4) * .8 + cast * 4;
  const orb = ctx.createRadialGradient(1, -53, 0, 1, -53, orbR * 2.4);
  orb.addColorStop(0, '#ffffff');
  orb.addColorStop(.3, '#a7f8f2');
  orb.addColorStop(.7, 'rgba(93,157,244,.52)');
  orb.addColorStop(1, 'rgba(93,157,244,0)');
  ctx.fillStyle = orb;
  ctx.beginPath(); ctx.arc(1, -53, orbR * 2.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ecffff';
  ctx.beginPath(); ctx.arc(1, -53, orbR * .55, 0, TAU); ctx.fill();
  ctx.restore();
  // floating runes
  for (let i = 0; i < 3; i++) {
    const a = t * .9 + i * TAU / 3;
    const x = Math.cos(a) * 23;
    const y = -38 + Math.sin(a) * 13;
    ctx.fillStyle = `rgba(123,232,232,${.25 + i * .12})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, TAU);
    ctx.fill();
  }
}

function drawArcherHero(ctx, p, t) {
  // cloak
  const cloak = ctx.createLinearGradient(0, -52, 0, 2);
  cloak.addColorStop(0, '#355a4e');
  cloak.addColorStop(.55, '#1b3632');
  cloak.addColorStop(1, '#0b1619');
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.moveTo(-13, -48);
  ctx.quadraticCurveTo(-25, -25, -20, 1);
  ctx.lineTo(0, -2);
  ctx.lineTo(20, 1);
  ctx.quadraticCurveTo(24, -27, 13, -48);
  ctx.closePath();
  ctx.fill();
  // legs
  ctx.fillStyle = '#182320';
  ctx.fillRect(-10, -22, 7, 19);
  ctx.fillRect(3, -22, 7, 19);
  ctx.fillStyle = '#694b31';
  ctx.fillRect(-12, -6, 10, 6);
  ctx.fillRect(2, -6, 10, 6);
  // torso
  ctx.fillStyle = '#2c453d';
  ctx.beginPath();
  ctx.moveTo(-10, -47); ctx.lineTo(-13, -24); ctx.lineTo(13, -24); ctx.lineTo(10, -47); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ab8254';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-9, -31); ctx.lineTo(9, -31); ctx.stroke();
  // belt pouches
  ctx.fillStyle = '#735134';
  ctx.fillRect(-12, -26, 6, 5);
  ctx.fillRect(6, -26, 6, 5);
  // shoulders
  ctx.fillStyle = '#3a5247';
  ctx.beginPath(); ctx.arc(-12, -46, 7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -46, 7, 0, TAU); ctx.fill();
  // arms
  ctx.fillStyle = '#263c35';
  roundRect(ctx, -19, -43, 7, 20, 3); ctx.fill();
  roundRect(ctx, 12, -43, 7, 20, 3); ctx.fill();
  // head + hood
  ctx.fillStyle = '#111e1d';
  ctx.beginPath();
  ctx.moveTo(-10, -47);
  ctx.quadraticCurveTo(-15, -67, 0, -69);
  ctx.quadraticCurveTo(15, -67, 10, -47);
  ctx.quadraticCurveTo(0, -42, -10, -47);
  ctx.fill();
  ctx.fillStyle = '#090e10';
  ctx.beginPath();
  ctx.ellipse(0, -55, 8, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d5f2a4';
  ctx.fillRect(-6, -56, 4, 1.6);
  ctx.fillRect(2, -56, 4, 1.6);
  ctx.shadowColor = '#d5f2a4';
  ctx.shadowBlur = 8;
  ctx.fillRect(-5, -55.7, 2, 1.2);
  ctx.fillRect(3, -55.7, 2, 1.2);
  ctx.shadowBlur = 0;
  // scarf
  ctx.strokeStyle = '#9d7850';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-7, -47); ctx.quadraticCurveTo(0, -43, 7, -47); ctx.stroke();
  // bow
  const draw = p.attackAnim > 0 ? 1 - p.attackAnim / .24 : 0;
  ctx.save();
  ctx.translate(19, -31);
  ctx.rotate(-.08);
  ctx.strokeStyle = '#b28b55';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-2, -21);
  ctx.quadraticCurveTo(15, -4, -2, 19);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(235,220,170,.7)';
  ctx.lineWidth = .8;
  const pull = draw * 7;
  ctx.beginPath();
  ctx.moveTo(-2, -21);
  ctx.lineTo(-5 - pull, 0);
  ctx.lineTo(-2, 19);
  ctx.stroke();
  if (draw > .1) {
    ctx.strokeStyle = '#efe5b9';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-5 - pull, 0); ctx.lineTo(17, 0); ctx.stroke();
  }
  ctx.restore();
  // quiver
  ctx.save();
  ctx.translate(-17, -38);
  ctx.rotate(.35);
  ctx.fillStyle = '#3a261b';
  roundRect(ctx, -3, -8, 7, 21, 2); ctx.fill();
  ctx.strokeStyle = '#d0b177';
  ctx.lineWidth = .8;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-1 + i * 2, -8); ctx.lineTo(-1 + i * 2, -14); ctx.stroke();
  }
  ctx.restore();
}

/* ---------- enemy silhouettes ---------- */

function drawEnemyBody(ctx, e, t) {
  const cfg = e.cfg;
  if (e.type === 'wisp' || e.type === 'mote') { drawWisp(ctx, e, t); return; }
  if (e.type === 'brute') { drawBrute(ctx, e, t); return; }
  if (e.type === 'sentinel') { drawSentinel(ctx, e, t); return; }
  if (e.type === 'stalker') { drawStalker(ctx, e, t); return; }
  drawHusk(ctx, e, t);
}

function drawHusk(ctx, e, t) {
  const c = e.cfg;
  ctx.fillStyle = '#1c1719';
  ctx.fillRect(-7, -17, 5, 17);
  ctx.fillRect(2, -17, 5, 17);
  const g = ctx.createLinearGradient(0, -37, 0, -12);
  g.addColorStop(0, c.color);
  g.addColorStop(1, '#281b19');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-9, -36); ctx.lineTo(-12, -18); ctx.lineTo(10, -18); ctx.lineTo(8, -37); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#171114';
  ctx.beginPath();
  ctx.moveTo(-12, -31); ctx.lineTo(-20, -20); ctx.lineTo(-17, -16); ctx.lineTo(-8, -23); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(9, -31); ctx.lineTo(18, -19); ctx.lineTo(14, -15); ctx.lineTo(6, -23); ctx.closePath(); ctx.fill();
  // head
  ctx.fillStyle = '#2c201d';
  ctx.beginPath();
  ctx.arc(0, -42, 7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0a0809';
  ctx.beginPath();
  ctx.arc(0, -42, 5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.glow;
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 8;
  ctx.fillRect(-4, -43, 2.4, 1.4);
  ctx.fillRect(2, -43, 2.4, 1.4);
  ctx.shadowBlur = 0;
  // tattered strips
  ctx.strokeStyle = 'rgba(112,80,60,.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const sway = Math.sin(t * 4 + i) * 1.5;
    ctx.beginPath(); ctx.moveTo(-6 + i * 5, -20); ctx.lineTo(-8 + i * 5 + sway, -10); ctx.stroke();
  }
}

function drawStalker(ctx, e, t) {
  const c = e.cfg;
  ctx.fillStyle = '#24161c';
  ctx.beginPath();
  ctx.ellipse(0, -18, 19, 9, -.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.moveTo(-13, -26); ctx.lineTo(-4, -38); ctx.lineTo(7, -34); ctx.lineTo(12, -20); ctx.lineTo(4, -12); ctx.lineTo(-9, -14);
  ctx.closePath(); ctx.fill();
  // long limbs
  ctx.strokeStyle = '#392029';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(-20, -8); ctx.lineTo(-14, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -20); ctx.lineTo(17, -10); ctx.lineTo(24, -14); ctx.stroke();
  // blades
  ctx.strokeStyle = '#e58a98';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(18, -12); ctx.lineTo(30, -25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-19, -7); ctx.lineTo(-30, -18); ctx.stroke();
  // head
  ctx.fillStyle = '#1a1015';
  ctx.beginPath();
  ctx.arc(4, -38, 6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.glow;
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 9;
  ctx.fillRect(5, -40, 4, 1.4);
  ctx.shadowBlur = 0;
  // tail
  ctx.strokeStyle = '#4b2631';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-16, -19); ctx.quadraticCurveTo(-32, -26, -34 + Math.sin(t * 3) * 4, -14); ctx.stroke();
}

function drawWisp(ctx, e, t) {
  const c = e.cfg;
  const float = Math.sin(t * 3 + e.id) * 3;
  ctx.translate(0, -28 + float);
  if (e.type === 'mote') {
    ctx.rotate(t * .7);
    ctx.fillStyle = c.glow;
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 12;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(3, -9); ctx.lineTo(0, -15); ctx.lineTo(-3, -9);
      ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
    return;
  }
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 19);
  g.addColorStop(0, '#fff');
  g.addColorStop(.22, c.glow);
  g.addColorStop(.58, hexA(c.color, .55));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 19, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = hexA(c.glow, .7);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 11, t * 2, t * 2 + 4.2); ctx.stroke();
  // tendrils
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.sin(t * 1.5 + i) * .2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
    ctx.quadraticCurveTo(Math.cos(a) * 18, Math.sin(a) * 18 + 4, Math.cos(a) * 12, Math.sin(a) * 26 + 8);
    ctx.stroke();
  }
}

function drawBrute(ctx, e, t) {
  const c = e.cfg;
  ctx.fillStyle = '#211711';
  ctx.fillRect(-14, -22, 11, 22);
  ctx.fillRect(3, -22, 11, 22);
  const g = ctx.createLinearGradient(0, -56, 0, -18);
  g.addColorStop(0, '#7a5b42');
  g.addColorStop(.55, c.color);
  g.addColorStop(1, '#32231a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-20, -53); ctx.quadraticCurveTo(-27, -38, -19, -21); ctx.lineTo(19, -21); ctx.quadraticCurveTo(27, -39, 19, -53);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4a3526';
  ctx.beginPath(); ctx.arc(-20, -49, 11, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -49, 11, 0, TAU); ctx.fill();
  // arms
  ctx.fillStyle = '#5e4430';
  roundRect(ctx, -28, -45, 10, 26, 4); ctx.fill();
  roundRect(ctx, 18, -45, 10, 26, 4); ctx.fill();
  // club
  ctx.save();
  ctx.translate(27, -34);
  ctx.rotate(.35 + Math.sin(t * 1.5) * .04);
  ctx.strokeStyle = '#3b2a1e';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(2, -27); ctx.stroke();
  ctx.fillStyle = '#5b4230';
  ctx.beginPath(); ctx.ellipse(2, -33, 8, 11, .1, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8d6744'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
  // head
  ctx.fillStyle = '#5b4130';
  ctx.beginPath(); ctx.arc(0, -56, 11, 0, TAU); ctx.fill();
  ctx.fillStyle = '#18100d';
  ctx.beginPath(); ctx.ellipse(0, -55, 8, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = c.glow; ctx.shadowColor = c.glow; ctx.shadowBlur = 10;
  ctx.fillRect(-6, -56, 4, 2); ctx.fillRect(2, -56, 4, 2);
  ctx.shadowBlur = 0;
  // shoulder tusks
  ctx.strokeStyle = '#d3aa76'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-16, -57); ctx.lineTo(-23, -65); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, -57); ctx.lineTo(23, -65); ctx.stroke();
}

function drawSentinel(ctx, e, t) {
  const c = e.cfg;
  ctx.fillStyle = '#18202a';
  ctx.fillRect(-9, -20, 8, 20);
  ctx.fillRect(2, -20, 8, 20);
  const g = ctx.createLinearGradient(-15, -48, 15, -18);
  g.addColorStop(0, '#4c687e');
  g.addColorStop(.5, c.color);
  g.addColorStop(1, '#1b2837');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-14, -46); ctx.lineTo(-18, -26); ctx.lineTo(15, -24); ctx.lineTo(14, -46); ctx.closePath();
  ctx.fill();
  // shield
  ctx.save();
  ctx.translate(-17, -32);
  ctx.fillStyle = '#1d2c3a';
  ctx.beginPath();
  ctx.moveTo(-9, -14); ctx.lineTo(9, -14); ctx.lineTo(8, 8); ctx.lineTo(0, 17); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = c.glow; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = hexA(c.glow, .5);
  ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 12); ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.stroke();
  ctx.restore();
  // helmet
  ctx.fillStyle = '#263b4c';
  ctx.beginPath(); ctx.arc(0, -52, 9, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#7895aa'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = c.glow;
  ctx.shadowColor = c.glow; ctx.shadowBlur = 8;
  ctx.fillRect(-5, -53, 10, 1.5);
  ctx.shadowBlur = 0;
  // spear
  ctx.strokeStyle = '#6b5a42';
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(16, 1); ctx.lineTo(19, -55); ctx.stroke();
  ctx.fillStyle = '#abc9dc';
  ctx.beginPath(); ctx.moveTo(19, -64); ctx.lineTo(23, -54); ctx.lineTo(19, -50); ctx.lineTo(15, -54); ctx.closePath(); ctx.fill();
  // runes
  const a = t * .7;
  ctx.fillStyle = hexA(c.glow, .5);
  ctx.beginPath(); ctx.arc(Math.cos(a) * 19, -35 + Math.sin(a) * 4, 1.3, 0, TAU); ctx.fill();
}

/* ---------- chapter bosses ---------- */

function drawCinderWarden(ctx, e, time) {
  const glow = e.cfg.glow;
  // cape
  ctx.fillStyle = '#2a0f13';
  ctx.beginPath();
  ctx.moveTo(-17, -55);
  ctx.quadraticCurveTo(-34, -34, -27, -4);
  ctx.lineTo(0, -11);
  ctx.lineTo(30, -3);
  ctx.quadraticCurveTo(35, -37, 18, -56);
  ctx.closePath();
  ctx.fill();
  // legs
  ctx.fillStyle = '#211316';
  ctx.fillRect(-16, -27, 12, 26);
  ctx.fillRect(5, -27, 12, 26);
  ctx.fillStyle = '#4a2b26';
  ctx.fillRect(-19, -5, 16, 6);
  ctx.fillRect(4, -5, 17, 6);
  // torso
  const body = ctx.createLinearGradient(-23, -57, 22, -22);
  body.addColorStop(0, '#764836');
  body.addColorStop(.35, '#3d2024');
  body.addColorStop(1, '#180e13');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-20, -54); ctx.lineTo(-26, -36); ctx.lineTo(-17, -22); ctx.lineTo(18, -22); ctx.lineTo(26, -37); ctx.lineTo(19, -54);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#dc9957'; ctx.lineWidth = 1.2; ctx.stroke();
  // furnace chest
  const chest = ctx.createRadialGradient(0, -39, 0, 0, -39, 13);
  chest.addColorStop(0, '#fff1b5');
  chest.addColorStop(.24, glow);
  chest.addColorStop(.7, 'rgba(210,83,43,.8)');
  chest.addColorStop(1, 'rgba(70,20,20,0)');
  ctx.fillStyle = chest;
  ctx.beginPath(); ctx.arc(0, -39, 13, 0, TAU); ctx.fill();
  ctx.strokeStyle = hexA(glow, .45);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + time * .4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 11, -39 + Math.sin(a) * 11);
    ctx.lineTo(Math.cos(a) * 20, -39 + Math.sin(a) * 20);
    ctx.stroke();
  }
  // pauldrons
  ctx.fillStyle = '#3f2423';
  ctx.beginPath(); ctx.arc(-22, -52, 12, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(23, -52, 12, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#db9a57'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(-22, -52, 12, -2.5, .8); ctx.stroke();
  ctx.beginPath(); ctx.arc(23, -52, 12, 2.3, 5.6); ctx.stroke();
  // arms
  ctx.fillStyle = '#321b1c';
  roundRect(ctx, -32, -47, 10, 28, 4); ctx.fill();
  roundRect(ctx, 22, -47, 10, 28, 4); ctx.fill();
  // helm
  ctx.fillStyle = '#1b1014';
  ctx.beginPath();
  ctx.moveTo(-13, -57);
  ctx.quadraticCurveTo(-16, -76, 0, -78);
  ctx.quadraticCurveTo(16, -76, 13, -57);
  ctx.quadraticCurveTo(0, -50, -13, -57);
  ctx.fill();
  ctx.strokeStyle = '#b77a49'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#080607';
  ctx.fillRect(-10, -68, 20, 7);
  ctx.fillStyle = '#ffe0a0'; ctx.shadowColor = glow; ctx.shadowBlur = 12;
  ctx.fillRect(-8, -66, 5, 2); ctx.fillRect(3, -66, 5, 2);
  ctx.shadowBlur = 0;
  // horns
  ctx.strokeStyle = '#dcab6d'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-11, -73); ctx.quadraticCurveTo(-24, -83, -29, -72); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(11, -73); ctx.quadraticCurveTo(24, -83, 29, -72); ctx.stroke();
  // massive sword
  const swing = e.casting ? Math.sin(time * 2) * .04 : 0;
  ctx.save();
  ctx.translate(30, -35);
  ctx.rotate(-.25 + swing);
  ctx.fillStyle = '#37231d';
  roundRect(ctx, -3, -2, 7, 17, 2); ctx.fill();
  ctx.fillStyle = '#c58d51';
  ctx.fillRect(-12, -5, 24, 5);
  const blade = ctx.createLinearGradient(0, -8, 0, -72);
  blade.addColorStop(0, '#5f4e44'); blade.addColorStop(.3, '#c8b58f'); blade.addColorStop(.65, '#7b4f3b'); blade.addColorStop(1, '#e5c698');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(-7, -8); ctx.lineTo(7, -8); ctx.lineTo(4, -64); ctx.lineTo(0, -76); ctx.lineTo(-4, -64);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = hexA(glow, .6); ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
  // embers
  for (let i = 0; i < 5; i++) {
    const a = time * .8 + i * 1.7;
    ctx.fillStyle = hexA(glow, .5);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (28 + i * 3), -40 + Math.sin(a * 1.2) * 28, 1.3, 0, TAU);
    ctx.fill();
  }
}

function drawTidebound(ctx, e, time) {
  const glow = e.cfg.glow;
  // cloak tendrils
  ctx.strokeStyle = '#143849';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * .5;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.quadraticCurveTo(Math.cos(a) * 22, -2 + i * 3, Math.cos(a) * 40 + Math.sin(time + i) * 6, 28);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  // robe
  const robe = ctx.createLinearGradient(0, -62, 0, 10);
  robe.addColorStop(0, '#4c96a3'); robe.addColorStop(.45, '#1e566a'); robe.addColorStop(1, '#0a1a25');
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-15, -53);
  ctx.quadraticCurveTo(-30, -21, -22, 17);
  ctx.quadraticCurveTo(0, 8, 22, 17);
  ctx.quadraticCurveTo(30, -23, 15, -53);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = hexA(glow, .3); ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-13 + i * 7, -27);
    ctx.quadraticCurveTo(-9 + i * 7, 0, -16 + i * 8, 12);
    ctx.stroke();
  }
  // sleeves / arms
  ctx.fillStyle = '#1b4659';
  ctx.beginPath(); ctx.moveTo(-13, -49); ctx.lineTo(-30, -34); ctx.lineTo(-22, -24); ctx.lineTo(-9, -38); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(13, -49); ctx.lineTo(31, -35); ctx.lineTo(23, -24); ctx.lineTo(9, -38); ctx.closePath(); ctx.fill();
  // hood + mask
  ctx.fillStyle = '#0c222f';
  ctx.beginPath();
  ctx.moveTo(-14, -51);
  ctx.quadraticCurveTo(-20, -77, 0, -80);
  ctx.quadraticCurveTo(20, -77, 14, -51);
  ctx.quadraticCurveTo(0, -41, -14, -51);
  ctx.fill();
  ctx.fillStyle = '#061018';
  ctx.beginPath(); ctx.ellipse(0, -63, 10, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = glow; ctx.shadowColor = glow; ctx.shadowBlur = 12;
  ctx.fillRect(-7, -65, 5, 2); ctx.fillRect(2, -65, 5, 2);
  ctx.shadowBlur = 0;
  // halo of pages
  ctx.save();
  ctx.translate(0, -66);
  ctx.rotate(time * .25);
  ctx.strokeStyle = hexA(glow, .28);
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    ctx.save();
    ctx.rotate(i / 9 * TAU);
    ctx.translate(28 + Math.sin(time + i) * 3, 0);
    ctx.rotate(Math.sin(time * .7 + i) * .4);
    ctx.strokeRect(-4, -6, 8, 12);
    ctx.restore();
  }
  ctx.restore();
  // floating tome
  ctx.save();
  ctx.translate(28, -30);
  ctx.rotate(-.15 + Math.sin(time) * .05);
  ctx.fillStyle = '#0d2634';
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(12, -5); ctx.lineTo(12, 9); ctx.lineTo(0, 14); ctx.lineTo(-12, 9); ctx.lineTo(-12, -5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = hexA(glow, .55); ctx.stroke();
  ctx.fillStyle = hexA(glow, .4);
  ctx.fillRect(-7, -3, 14, 1); ctx.fillRect(-7, 2, 14, 1);
  ctx.restore();
  // motes
  for (let i = 0; i < 6; i++) {
    const a = time * .7 + i * 1.4;
    ctx.fillStyle = hexA(glow, .5);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (30 + i * 2), -40 + Math.sin(a) * 24, 1.2, 0, TAU);
    ctx.fill();
  }
}

function drawHollowKing(ctx, e, time) {
  const glow = e.cfg.glow;
  // cape
  const cape = ctx.createLinearGradient(0, -64, 0, 18);
  cape.addColorStop(0, '#3f2d5f'); cape.addColorStop(.55, '#1b132d'); cape.addColorStop(1, '#09070e');
  ctx.fillStyle = cape;
  ctx.beginPath();
  ctx.moveTo(-18, -58);
  ctx.quadraticCurveTo(-43, -29, -36, 18);
  ctx.lineTo(0, 8);
  ctx.lineTo(38, 18);
  ctx.quadraticCurveTo(45, -32, 18, -59);
  ctx.closePath(); ctx.fill();
  // inner cape arcs
  ctx.strokeStyle = hexA(glow, .22);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-20 + i * 4, -45 + i * 5);
    ctx.quadraticCurveTo(-28 + i * 2, -9, -20 + i * 6, 12);
    ctx.stroke();
  }
  // legs
  ctx.fillStyle = '#17101f';
  ctx.fillRect(-12, -26, 9, 25);
  ctx.fillRect(3, -26, 9, 25);
  ctx.fillStyle = '#553d76';
  ctx.fillRect(-15, -5, 13, 5);
  ctx.fillRect(2, -5, 14, 5);
  // torso
  const body = ctx.createLinearGradient(-20, -57, 20, -23);
  body.addColorStop(0, '#8f79b0'); body.addColorStop(.4, '#493565'); body.addColorStop(1, '#1b1227');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-16, -57); ctx.lineTo(-22, -37); ctx.lineTo(-14, -24); ctx.lineTo(14, -24); ctx.lineTo(22, -38); ctx.lineTo(16, -57);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = hexA(glow, .55); ctx.lineWidth = 1; ctx.stroke();
  // ribs / void
  ctx.fillStyle = '#07060a';
  ctx.beginPath();
  ctx.ellipse(0, -37, 8, 12, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = hexA(glow, .5);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-7, -44 + i * 6); ctx.quadraticCurveTo(0, -40 + i * 6, 7, -44 + i * 6);
    ctx.stroke();
  }
  // shoulders
  ctx.fillStyle = '#4c3768';
  ctx.beginPath(); ctx.arc(-20, -54, 10, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(20, -54, 10, 0, TAU); ctx.fill();
  ctx.strokeStyle = hexA(glow, .45); ctx.stroke();
  // arms
  ctx.fillStyle = '#2b1e3c';
  roundRect(ctx, -29, -49, 9, 27, 4); ctx.fill();
  roundRect(ctx, 20, -49, 9, 27, 4); ctx.fill();
  // head
  ctx.fillStyle = '#0b080f';
  ctx.beginPath(); ctx.arc(0, -65, 11, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#9b7bc3'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = glow; ctx.shadowColor = glow; ctx.shadowBlur = 13;
  ctx.fillRect(-7, -67, 5, 2.2); ctx.fillRect(2, -67, 5, 2.2);
  ctx.shadowBlur = 0;
  // jaw
  ctx.strokeStyle = '#8c6fae'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5, -58); ctx.lineTo(-3, -55); ctx.lineTo(0, -58); ctx.lineTo(3, -55); ctx.lineTo(5, -58); ctx.stroke();
  // crown
  ctx.fillStyle = '#a388cd';
  ctx.beginPath();
  ctx.moveTo(-12, -74); ctx.lineTo(-9, -84); ctx.lineTo(-3, -76); ctx.lineTo(0, -89); ctx.lineTo(4, -76); ctx.lineTo(9, -84); ctx.lineTo(12, -74);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e0c8ff'; ctx.lineWidth = .8; ctx.stroke();
  // floating swords
  for (let i = 0; i < 4; i++) {
    const a = -1.9 + i * .72 + Math.sin(time * .5 + i) * .08;
    const r = 42 + Math.sin(time * .8 + i) * 5;
    ctx.save();
    ctx.translate(Math.cos(a) * r, -42 + Math.sin(a) * r * .55);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = hexA(glow, .5);
    ctx.beginPath();
    ctx.moveTo(0, -15); ctx.lineTo(3, 4); ctx.lineTo(0, 7); ctx.lineTo(-3, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hexA('#d9c2ff', .55); ctx.lineWidth = .8; ctx.stroke();
    ctx.restore();
  }
  // dark motes
  for (let i = 0; i < 6; i++) {
    const a = time * .5 + i * 1.4;
    ctx.fillStyle = hexA(glow, .42);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (34 + i * 2), -42 + Math.sin(a * 1.3) * 27, 1.4, 0, TAU);
    ctx.fill();
  }
}
