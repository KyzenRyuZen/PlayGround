/** Pixel-perfect canvas renderer. */
import { WORLD_W, WORLD_H } from "./config.js";
import { makeHeroSprites } from "./art.js";

export class Renderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.world = world;
    this.hero = makeHeroSprites();
    this.dpr = 1;
    this.zoom = 3;
    this.viewW = 320;
    this.viewH = 200;
    this.drawables = [];
    this.resize();
  }

  resize() {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const base = 3;
    const zoom = Math.max(
      base,
      Math.ceil(width / WORLD_W),
      Math.ceil(height / WORLD_H)
    );

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.zoom = zoom;
    this.viewW = width / zoom;
    this.viewH = height / zoom;

    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.lineWidth = 1;
  }

  render(camera, player, ambient, time) {
    const ctx = this.ctx;
    const { dpr, zoom } = this;
    const camX = Math.round(camera.x);
    const camY = Math.round(camera.y);
    const viewW = this.viewW;
    const viewH = this.viewH;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#274b36";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camX * dpr * zoom, -camY * dpr * zoom);
    ctx.imageSmoothingEnabled = false;

    // Baked ground.
    ctx.drawImage(this.world.ground, camX, camY, viewW, viewH, camX, camY, viewW, viewH);

    this.drawWater(ctx, time, camX, camY, viewW, viewH);

    // Cull and depth-sort everything that stands on the ground.
    const list = this.drawables;
    list.length = 0;
    for (const prop of this.world.props) {
      const sprite = prop.sprite;
      const left = prop.x - sprite.ax;
      const top = prop.y - sprite.ay;
      if (
        left + sprite.canvas.width < camX - 8 ||
        left > camX + viewW + 8 ||
        top + sprite.canvas.height < camY - 12 ||
        top > camY + viewH + 12
      ) {
        continue;
      }
      list.push(prop);
    }
    list.push({ kind: "player", sortY: player.y, player });
    list.sort((a, b) => a.sortY - b.sortY);

    for (const item of list) {
      if (item.kind === "player") this.drawPlayer(ctx, item.player);
      else {
        const sprite = item.sprite;
        ctx.drawImage(sprite.canvas, Math.round(item.x - sprite.ax), Math.round(item.y - sprite.ay));
      }
    }

    this.drawLandmarkBeacons(ctx, time, camX, camY, viewW, viewH);
    ambient.draw(ctx, { x: camX, y: camY, w: viewW, h: viewH });

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawPlayer(ctx, player) {
    const frame = player.facing;
    const sprite = this.hero.frames[frame][player.frameIndex];
    const x = Math.round(player.x);
    const y = Math.round(player.y + player.breathingOffset);

    // Ground shadow in two soft, pixel-ish passes.
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#122f22";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 1, 8, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(player.x - 1, player.y, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.drawImage(sprite, x - this.hero.ax, y - this.hero.ay);
  }

  drawWater(ctx, time, camX, camY, viewW, viewH) {
    const minX = Math.floor(camX / 16) - 1;
    const maxX = Math.ceil((camX + viewW) / 16) + 1;
    const minY = Math.floor(camY / 16) - 1;
    const maxY = Math.ceil((camY + viewH) / 16) + 1;
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#a6d8d2";
    for (const tile of this.world.waterTiles) {
      if (tile.x < minX || tile.x > maxX || tile.y < minY || tile.y > maxY) continue;
      const phase = time * 1.7 + tile.x * 0.9 + tile.y * 1.4;
      const wave = Math.sin(phase);
      if (wave < 0.1) continue;
      const x = tile.x * 16 + 3 + Math.floor((wave * 0.5 + 0.5) * 8);
      const y = tile.y * 16 + 5 + (tile.y % 2) * 5;
      if (!this.world.isPondWater(x, y)) continue;
      ctx.fillRect(x, y, 3 + (tile.x % 2), 1);
      if (wave > 0.72) ctx.fillRect(x + 5, y + 3, 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  drawLandmarkBeacons(ctx, time, camX, camY, viewW, viewH) {
    for (const landmark of this.world.landmarks) {
      if (landmark.found) continue;
      if (
        landmark.x < camX - 20 ||
        landmark.x > camX + viewW + 20 ||
        landmark.y < camY - 20 ||
        landmark.y > camY + viewH + 20
      ) {
        continue;
      }
      const pulse = 0.5 + Math.sin(time * 2.2 + landmark.x * 0.01) * 0.5;
      const x = Math.round(landmark.x);
      const y = Math.round(landmark.y - 34 - pulse * 2);
      ctx.globalAlpha = 0.22 + pulse * 0.38;
      ctx.fillStyle = "#ffe39a";
      ctx.fillRect(x, y, 1, 1);
      if (pulse > 0.42) {
        ctx.fillRect(x - 1, y - 1, 1, 1);
        ctx.fillRect(x + 1, y - 1, 1, 1);
        ctx.fillRect(x - 1, y + 1, 1, 1);
        ctx.fillRect(x + 1, y + 1, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
}
