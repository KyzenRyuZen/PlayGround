import { CAMERA } from "./config.js";
import { clamp } from "./rng.js";

export class Camera {
  constructor(world) {
    this.world = world;
    this.x = 0;
    this.y = 0;
    this.viewW = 480;
    this.viewH = 300;
    this.targetX = 0;
    this.targetY = 0;
  }

  resize(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
  }

  clampToWorld() {
    const halfW = this.viewW / 2;
    const halfH = this.viewH / 2;
    this.x = this.world.width > this.viewW
      ? clamp(this.x, halfW, this.world.width - halfW)
      : this.world.width / 2;
    this.y = this.world.height > this.viewH
      ? clamp(this.y, halfH, this.world.height - halfH)
      : this.world.height / 2;
  }

  snapTo(x, y) {
    this.x = x;
    this.y = y + CAMERA.offsetY;
    this.clampToWorld();
  }

  update(dt, player, speedRatio = 0, intensity = 1) {
    const lookX = player.vx * (CAMERA.lookAhead / 62) * intensity;
    const lookY = player.vy * (CAMERA.lookAhead * 0.6 / 62) * intensity;
    this.targetX = player.x + lookX;
    this.targetY = player.y + CAMERA.offsetY + lookY;
    const blend = 1 - Math.exp(-CAMERA.damping * dt);
    this.x += (this.targetX - this.x) * blend;
    this.y += (this.targetY - this.y) * blend;
    this.clampToWorld();
  }

  drift(dt, time) {
    // Gentle establishing drift while the title card is open.
    const targetX = this.world.width / 2 + Math.sin(time * 0.055) * 120;
    const targetY = 930 + Math.cos(time * 0.045) * 70;
    const blend = 1 - Math.exp(-0.55 * dt);
    this.x += (targetX - this.x) * blend;
    this.y += (targetY - this.y) * blend;
    this.clampToWorld();
  }
}
