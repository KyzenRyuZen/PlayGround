import { rand, mulberry32 } from "./rng.js";

const rng = mulberry32(9090);

export class Particles {
  constructor() {
    this.items = [];
    this.ambient = [];
    this.screenMotes = [];
    for (let i = 0; i < 46; i += 1) {
      this.screenMotes.push({
        x: rng(), y: rng(), z: 0.35 + rng() * 0.8, phase: rng() * 10, drift: 0.1 + rng() * 0.3,
      });
    }
  }

  spawn(x, y, options = {}) {
    const {
      count = 10,
      colors = ["#f6d66d", "#fff1b7", "#e9b84f"],
      speed = 24,
      spread = Math.PI * 2,
      direction = 0,
      gravity = 0,
      life = 0.8,
      size = 1,
      kind = "spark",
      rise = 0,
    } = options;
    for (let i = 0; i < count; i += 1) {
      const angle = direction + (rng() - 0.5) * spread;
      const velocity = speed * (0.35 + rng() * 0.8);
      this.items.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity + rise,
        gravity,
        life: life * (0.65 + rng() * 0.7),
        maxLife: life,
        color: colors[Math.floor(rng() * colors.length)],
        size: size + (rng() > 0.8 ? 1 : 0),
        kind,
        phase: rng() * 6,
      });
    }
  }

  burstBloom(x, y) {
    this.spawn(x, y - 12, { count: 24, speed: 48, life: 1.2, gravity: 12, size: 1 });
    this.spawn(x, y - 10, { count: 10, speed: 24, life: 1.8, colors: ["#f8c8d4", "#f6e2a4", "#ffffff"], gravity: 5, size: 1, kind: "petal" });
  }

  stepDust(x, y) {
    this.spawn(x, y, {
      count: 3,
      speed: 8,
      spread: 2.2,
      life: 0.5,
      colors: ["#b9a779", "#9c8e65", "#d0bd8c"],
      gravity: -4,
      size: 1,
      kind: "dust",
    });
  }

  smoke(x, y, scale = 1) {
    this.items.push({
      x: x + rand(rng, -2, 2),
      y,
      vx: rand(rng, -3, 3) + 1.4,
      vy: rand(rng, -10, -6) * scale,
      gravity: -1.2,
      life: rand(rng, 2.4, 4.3),
      maxLife: 4.3,
      color: "#cfd3c4",
      size: rand(rng, 2, 3.4) * scale,
      kind: "smoke",
      phase: rng() * 6,
    });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      if (p.kind === "smoke") {
        p.vx += Math.sin(p.phase + p.life) * 1.1 * dt;
        p.size += dt * 1.6;
      }
      if (p.kind === "petal") {
        p.vx += Math.sin(p.life * 5 + p.phase) * 9 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx, cam) {
    const left = cam.x - cam.viewW / 2;
    const top = cam.y - cam.viewH / 2;
    ctx.save();
    for (const p of this.items) {
      const x = p.x - left;
      const y = p.y - top;
      if (x < -20 || y < -20 || x > cam.viewW + 20 || y > cam.viewH + 20) continue;
      const t = Math.max(0, p.life / p.maxLife);
      if (p.kind === "smoke") {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(198, 203, 191, ${t * 0.1})`;
        ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(p.size), Math.ceil(p.size));
        ctx.fillStyle = `rgba(222, 224, 210, ${t * 0.07})`;
        ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, Math.ceil(p.size * 0.7), Math.ceil(p.size * 0.7));
      } else if (p.kind === "dust") {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = p.color;
        ctx.globalAlpha = t * 0.45;
        ctx.fillRect(Math.round(x), Math.round(y), p.size, p.size);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = p.color;
        const flicker = p.kind === "petal" ? 0.8 : 0.55 + Math.sin(p.phase + p.life * 11) * 0.35;
        ctx.globalAlpha = Math.min(1, t * 1.4) * flicker;
        ctx.fillRect(Math.round(x), Math.round(y), p.size, p.size);
        if (p.kind === "petal") {
          ctx.globalAlpha = Math.min(1, t) * 0.6;
          ctx.fillRect(Math.round(x) + 1, Math.round(y), 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  drawMotes(ctx, time, cam, reduced = false) {
    if (reduced) return;
    const w = cam.viewW;
    const h = cam.viewH;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of this.screenMotes) {
      const x = ((m.x + Math.sin(time * m.drift + m.phase) * 0.03 + 1) % 1) * w;
      const y = ((m.y + Math.cos(time * m.drift * 0.7 + m.phase) * 0.02 + 1) % 1) * h;
      const alpha = 0.1 + Math.sin(time * 1.7 + m.phase) * 0.06;
      ctx.fillStyle = `rgba(255, 237, 168, ${alpha * m.z})`;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (m.z > 1) ctx.fillRect(Math.round(x) + 1, Math.round(y), 1, 1);
    }
    ctx.restore();
  }
}
