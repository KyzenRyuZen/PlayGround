/** A smoothed camera that follows the hero and respects the world bounds. */
import { WORLD_W, WORLD_H, CAMERA } from "./config.js";
import { clamp, damp } from "./util.js";

export class Camera {
  constructor(world) {
    this.world = world;
    this.x = 0;
    this.y = 0;
    this.viewW = 320;
    this.viewH = 200;
    this.initialized = false;
  }

  resize(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
    if (!this.initialized) this.snap(this.world.spawn.x, this.world.spawn.y - 8);
    else this.clampToWorld();
  }

  snap(targetX, targetY) {
    this.x = targetX - this.viewW / 2;
    this.y = targetY - this.viewH / 2;
    this.initialized = true;
    this.clampToWorld();
  }

  clampToWorld() {
    if (this.viewW >= WORLD_W) this.x = (WORLD_W - this.viewW) / 2;
    else this.x = clamp(this.x, 0, WORLD_W - this.viewW);

    if (this.viewH >= WORLD_H) this.y = (WORLD_H - this.viewH) / 2;
    else this.y = clamp(this.y, 0, WORLD_H - this.viewH);
  }

  update(dt, player) {
    const look = player.lookAhead();
    const targetX = player.x + look.x - this.viewW / 2;
    const targetY = player.y + look.y - 8 - this.viewH / 2;
    this.x = damp(this.x, targetX, CAMERA.follow, dt);
    this.y = damp(this.y, targetY, CAMERA.follow, dt);
    this.clampToWorld();
  }
}
