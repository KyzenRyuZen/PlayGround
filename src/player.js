import { PLAYER } from "./config.js";
import { makePlayerSprites, drawShadow } from "./art.js";

export class Player {
  constructor(x = PLAYER.startX, y = PLAYER.startY) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = PLAYER.radius;
    this.facing = "down";
    this.art = makePlayerSprites();
    this.frame = 0;
    this.walkDistance = 0;
    this.walking = false;
    this.justStepped = false;
    this.speed = 0;
    this.lanternSwing = 0;
    this.spawn = { x, y };
  }

  update(dt, input, world) {
    const magnitude = Math.min(1, Math.hypot(input.x, input.y));
    const moving = magnitude > 0.06;
    const targetVx = moving ? (input.x / (magnitude || 1)) * PLAYER.speed * magnitude : 0;
    const targetVy = moving ? (input.y / (magnitude || 1)) * PLAYER.speed * magnitude : 0;
    const response = moving ? 13.5 : 10.5;
    const blend = 1 - Math.exp(-response * dt);
    this.vx += (targetVx - this.vx) * blend;
    this.vy += (targetVy - this.vy) * blend;

    if (!moving && Math.hypot(this.vx, this.vy) < 0.35) {
      this.vx = 0;
      this.vy = 0;
    }

    const nextX = this.x + this.vx * dt;
    if (!world.isBlocked(nextX, this.y, this.radius)) this.x = nextX;
    else this.vx *= -0.06;

    const nextY = this.y + this.vy * dt;
    if (!world.isBlocked(this.x, nextY, this.radius)) this.y = nextY;
    else this.vy *= -0.06;

    this.speed = Math.hypot(this.vx, this.vy);
    this.walking = this.speed > 6;
    this.justStepped = false;
    if (this.walking) {
      const previous = this.frame;
      this.walkDistance += this.speed * dt;
      this.frame = Math.floor(this.walkDistance / 8.5) % 4;
      if (this.frame !== previous && (this.frame === 0 || this.frame === 2)) this.justStepped = true;
      this.lanternSwing = Math.sin(this.walkDistance * 0.08) * 1.5;
    } else {
      this.frame = 1;
      this.walkDistance = 0;
      this.lanternSwing *= 0.9;
    }

    const ax = Math.abs(this.vx);
    const ay = Math.abs(this.vy);
    if (ax > 7 || ay > 7) {
      if (ax >= ay) this.facing = this.vx > 0 ? "right" : "left";
      else this.facing = this.vy > 0 ? "down" : "up";
    }
  }

  get sortY() {
    return this.y + 1;
  }

  getLanternPosition() {
    if (this.facing === "left") return { x: this.x - 10, y: this.y - 10 + this.lanternSwing * 0.25 };
    if (this.facing === "right") return { x: this.x + 10, y: this.y - 10 + this.lanternSwing * 0.25 };
    return { x: this.x + 8, y: this.y - 10 + this.lanternSwing * 0.25 };
  }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x + cam.viewW / 2);
    const y = Math.round(this.y - cam.y + cam.viewH / 2);
    drawShadow(ctx, x, y - 1, 7, 3, 0.26);
    const sprite = this.art.sprites[this.facing][this.frame];
    ctx.drawImage(sprite, x - Math.floor(this.art.width / 2), y - this.art.base);
  }
}
