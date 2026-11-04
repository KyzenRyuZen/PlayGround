/** The hero's smooth, collision-aware movement and walk cycle. */
import { PLAYER } from "./config.js";
import { damp } from "./util.js";

export class Player {
  constructor(world) {
    this.world = world;
    this.x = world.spawn.x;
    this.y = world.spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.radius = PLAYER.radius;
    this.facing = "down";
    this.animDistance = 0;
    this.movingDistance = 0;
    this.idleTime = 0;
    this.moving = false;
    this.speed = 0;
    this.stepPulse = 0;
  }

  update(dt, vector) {
    const speed = PLAYER.walkSpeed;
    const targetX = vector.x * speed;
    const targetY = vector.y * speed;
    const responsiveness = 1 - Math.exp(-PLAYER.acceleration * dt);

    this.vx += (targetX - this.vx) * responsiveness;
    this.vy += (targetY - this.vy) * responsiveness;

    if (!vector.x && !vector.y && Math.hypot(this.vx, this.vy) < 1.2) {
      this.vx = 0;
      this.vy = 0;
    }

    const oldX = this.x;
    const oldY = this.y;

    const nextX = this.x + this.vx * dt;
    if (!this.world.collides(nextX, this.y, this.radius)) {
      this.x = nextX;
    } else {
      this.vx = 0;
    }

    const nextY = this.y + this.vy * dt;
    if (!this.world.collides(this.x, nextY, this.radius)) {
      this.y = nextY;
    } else {
      this.vy = 0;
    }

    const moved = Math.hypot(this.x - oldX, this.y - oldY);
    this.speed = moved / Math.max(dt, 0.0001);
    this.moving = moved > 0.05;
    this.movingDistance += moved;
    this.animDistance += moved;

    if (this.moving) {
      this.idleTime = 0;
      const absX = Math.abs(this.vx);
      const absY = Math.abs(this.vy);
      if (absX > absY * 1.12) this.facing = this.vx >= 0 ? "right" : "left";
      else if (absY > 0.8) this.facing = this.vy >= 0 ? "down" : "up";
    } else {
      this.idleTime += dt;
    }

    this.stepPulse += moved;
  }

  get frameIndex() {
    if (!this.moving) return 0;
    return Math.floor(this.animDistance / PLAYER.animDistance) % 4;
  }

  get breathingOffset() {
    if (this.moving) return 0;
    return Math.sin(this.idleTime * 2.2) > 0.55 ? -1 : 0;
  }

  lookAhead() {
    const speed = Math.hypot(this.vx, this.vy) || 1;
    return {
      x: (this.vx / speed) * Math.min(1, speed / PLAYER.walkSpeed) * 9,
      y: (this.vy / speed) * Math.min(1, speed / PLAYER.walkSpeed) * 9,
    };
  }
}
