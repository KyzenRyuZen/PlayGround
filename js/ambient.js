/** Drifting pollen, chimney smoke, butterflies, and footstep dust. */
import { WORLD_W, WORLD_H, TILE } from "./config.js";
import { mulberry32, TAU } from "./util.js";

export class Ambient {
  constructor(world) {
    this.world = world;
    this.rng = mulberry32(8080);
    this.time = 0;
    this.smokeTimer = 0;
    this.smoke = [];
    this.dust = [];
    this.pollen = [];
    this.leaves = [];
    this.butterflies = [];
    this.sparkles = [];

    for (let i = 0; i < 64; i++) {
      this.pollen.push({
        x: this.rng() * WORLD_W,
        y: this.rng() * WORLD_H,
        phase: this.rng() * TAU,
        speed: 1.5 + this.rng() * 3.5,
        drift: 2.5 + this.rng() * 4.5,
        size: this.rng() > 0.8 ? 2 : 1,
        alpha: 0.24 + this.rng() * 0.42,
      });
    }

    for (let i = 0; i < 14; i++) {
      this.leaves.push({
        x: this.rng() * WORLD_W,
        y: this.rng() * WORLD_H,
        phase: this.rng() * TAU,
        speed: 3 + this.rng() * 4,
        color: this.rng() > 0.5 ? "#c18b4f" : "#8caf55",
      });
    }

    const butterflyHomes = [
      [16.5, 18.5],
      [10.4, 16.8],
      [26.4, 25.2],
      [34.2, 27.6],
      [30.5, 14.2],
      [20.6, 29.4],
      [7.2, 22.8],
    ];
    for (const [tx, ty] of butterflyHomes) {
      this.butterflies.push({
        homeX: tx * TILE,
        homeY: ty * TILE,
        phase: this.rng() * TAU,
        speed: 0.5 + this.rng() * 0.5,
        radius: 11 + this.rng() * 14,
        wing: this.rng() > 0.45 ? "#ecc567" : "#e6a7bc",
      });
    }

    // A little constellation of magic around the tower window.
    for (let i = 0; i < 7; i++) {
      this.sparkles.push({
        x: 40 * TILE + (this.rng() - 0.5) * 34,
        y: 9.6 * TILE + (this.rng() - 0.5) * 34,
        phase: this.rng() * TAU,
        speed: 0.5 + this.rng() * 0.8,
      });
    }
  }

  update(dt, player) {
    this.time += dt;
    const t = this.time;

    for (const p of this.pollen) {
      p.x += (p.drift + Math.sin(t * 0.6 + p.phase) * 2.4) * dt;
      p.y += (-p.speed + Math.cos(t * 0.9 + p.phase) * 1.8) * dt;
      if (p.x > WORLD_W + 8) p.x = -8;
      if (p.x < -8) p.x = WORLD_W + 8;
      if (p.y < -8) p.y = WORLD_H + 8;
      if (p.y > WORLD_H + 8) p.y = -8;
    }

    for (const leaf of this.leaves) {
      leaf.x += (leaf.speed + Math.sin(t * 1.2 + leaf.phase) * 6) * dt;
      leaf.y += (2.2 + Math.cos(t * 1.5 + leaf.phase) * 3) * dt;
      if (leaf.x > WORLD_W + 10) leaf.x = -10;
      if (leaf.y > WORLD_H + 10) {
        leaf.y = -10;
        leaf.x = this.rng() * WORLD_W;
      }
    }

    this.smokeTimer -= dt;
    if (this.smokeTimer <= 0) {
      this.smokeTimer = 0.44;
      for (const source of this.world.smokeSources) {
        if (this.smoke.length > 30) break;
        this.smoke.push({
          x: source.x + (this.rng() - 0.5) * 3,
          y: source.y,
          vx: 1.6 + this.rng() * 2.2,
          vy: -8 - this.rng() * 5,
          life: 0,
          maxLife: 2.8 + this.rng() * 2.2,
          size: 2 + Math.floor(this.rng() * 2),
          phase: this.rng() * TAU,
        });
      }
    }

    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i];
      s.life += dt;
      s.x += (s.vx + Math.sin(t * 1.3 + s.phase) * 1.1) * dt;
      s.y += s.vy * dt;
      s.vy *= 1 - 0.12 * dt;
      if (s.life > s.maxLife) this.smoke.splice(i, 1);
    }

    for (let i = this.dust.length - 1; i >= 0; i--) {
      const d = this.dust[i];
      d.life += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy *= 1 - 1.8 * dt;
      if (d.life > d.maxLife) this.dust.splice(i, 1);
    }
  }

  footstep(x, y, facing) {
    if (this.dust.length > 18) return;
    const side = facing === "left" ? -1 : facing === "right" ? 1 : 0;
    const back = facing === "up" ? 1 : facing === "down" ? -1 : 0;
    for (let i = 0; i < 2; i++) {
      this.dust.push({
        x: x + side * 3 + (this.rng() - 0.5) * 4,
        y: y - 1 + back * 2,
        vx: (this.rng() - 0.5) * 7 + side * 3,
        vy: -3 - this.rng() * 3,
        life: 0,
        maxLife: 0.32 + this.rng() * 0.18,
      });
    }
  }

  visible(x, y, view, margin = 36) {
    return x > view.x - margin && x < view.x + view.w + margin && y > view.y - margin && y < view.y + view.h + margin;
  }

  draw(ctx, view) {
    const t = this.time;

    // Pollen motes and falling leaves, light over the whole scene.
    for (const p of this.pollen) {
      if (!this.visible(p.x, p.y, view, 10)) continue;
      const alpha = p.alpha * (0.7 + Math.sin(t * 2.1 + p.phase) * 0.3);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffe7a2";
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (const leaf of this.leaves) {
      if (!this.visible(leaf.x, leaf.y, view, 10)) continue;
      ctx.fillStyle = leaf.color;
      ctx.globalAlpha = 0.68;
      ctx.fillRect(Math.round(leaf.x), Math.round(leaf.y), 2, 1);
      ctx.globalAlpha = 1;
    }

    // Butterflies loop around their flower patches.
    for (const b of this.butterflies) {
      const wobble = Math.sin(t * b.speed * 2.2 + b.phase);
      const x = b.homeX + Math.cos(t * b.speed + b.phase) * b.radius;
      const y = b.homeY + Math.sin(t * b.speed * 1.3 + b.phase) * b.radius * 0.58 + wobble * 2;
      if (!this.visible(x, y, view, 16)) continue;
      const flap = Math.sin(t * 10 + b.phase) > 0;
      ctx.fillStyle = b.wing;
      if (flap) {
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 1, 2, 2);
        ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, 2, 2);
        ctx.fillStyle = "#f7e4ad";
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 1, 1, 1);
        ctx.fillRect(Math.round(x) + 2, Math.round(y) - 1, 1, 1);
      } else {
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 2, 2, 3);
        ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 2);
      }
      ctx.fillStyle = "#4a3b31";
      ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 2);
    }

    // Tower magic: a handful of twinkling gold pixels.
    for (const s of this.sparkles) {
      if (!this.visible(s.x, s.y, view, 18)) continue;
      const twinkle = Math.sin(t * 2.2 * s.speed + s.phase);
      if (twinkle < 0.25) continue;
      ctx.globalAlpha = 0.32 + twinkle * 0.5;
      ctx.fillStyle = "#ffe6a2";
      const size = twinkle > 0.82 ? 2 : 1;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), size, size);
      if (twinkle > 0.9) {
        ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y), 1, 1);
        ctx.fillRect(Math.round(s.x) + 1, Math.round(s.y), 1, 1);
        ctx.fillRect(Math.round(s.x), Math.round(s.y) - 1, 1, 1);
        ctx.fillRect(Math.round(s.x), Math.round(s.y) + 1, 1, 1);
      }
    }
    ctx.globalAlpha = 1;

    // Chimney smoke.
    for (const s of this.smoke) {
      if (!this.visible(s.x, s.y, view, 12)) continue;
      const life = s.life / s.maxLife;
      const alpha = Math.sin(Math.min(1, life * 2.5) * Math.PI * 0.5) * (1 - life) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ddd9c6";
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
      if (s.size > 2) ctx.fillRect(Math.round(s.x) + 1, Math.round(s.y) - 1, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Footstep dust, low and quick.
    for (const d of this.dust) {
      if (!this.visible(d.x, d.y, view, 8)) continue;
      const life = d.life / d.maxLife;
      ctx.globalAlpha = (1 - life) * 0.42;
      ctx.fillStyle = "#d8c18c";
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}
