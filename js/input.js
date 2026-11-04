/** Keyboard and virtual-joystick input, combined into one movement vector. */
import { clamp } from "./util.js";

const MOVEMENT_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
]);

export class Input {
  constructor(joystickEl) {
    this.joystickEl = joystickEl;
    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.joyRadius = 40;
    this.pointerId = null;
    this.center = { x: 0, y: 0 };
    this.firstMove = false;
    this.onFirstMove = null;

    this.bindKeyboard();
    this.bindJoystick();
  }

  bindKeyboard() {
    window.addEventListener("keydown", (event) => {
      if (!MOVEMENT_KEYS.has(event.code)) return;
      event.preventDefault();
      this.keys.add(event.code);
      this.signalMove();
    });
    window.addEventListener("keyup", (event) => {
      if (!MOVEMENT_KEYS.has(event.code)) return;
      event.preventDefault();
      this.keys.delete(event.code);
    });
    window.addEventListener("blur", () => this.keys.clear());
  }

  bindJoystick() {
    const el = this.joystickEl;
    if (!el) return;

    const updateCenter = () => {
      const rect = el.getBoundingClientRect();
      this.center.x = rect.left + rect.width / 2;
      this.center.y = rect.top + rect.height / 2;
      this.joyRadius = Math.max(28, rect.width * 0.29);
    };

    const setKnob = (dx, dy) => {
      el.style.setProperty("--joy-x", `${dx.toFixed(1)}px`);
      el.style.setProperty("--joy-y", `${dy.toFixed(1)}px`);
    };

    const release = (event) => {
      if (this.pointerId === null || (event && event.pointerId !== this.pointerId)) return;
      this.pointerId = null;
      this.joy.x = 0;
      this.joy.y = 0;
      setKnob(0, 0);
      el.classList.remove("is-active");
    };

    const move = (event) => {
      if (event.pointerId !== this.pointerId) return;
      const dx = event.clientX - this.center.x;
      const dy = event.clientY - this.center.y;
      const distance = Math.hypot(dx, dy);
      const limit = this.joyRadius;
      const scale = distance > limit ? limit / distance : 1;
      const kx = dx * scale;
      const ky = dy * scale;
      setKnob(kx, ky);

      const magnitude = clamp(distance / limit, 0, 1);
      if (magnitude < 0.16) {
        this.joy.x = 0;
        this.joy.y = 0;
      } else {
        const response = (magnitude - 0.16) / 0.84;
        this.joy.x = (dx / (distance || 1)) * response;
        this.joy.y = (dy / (distance || 1)) * response;
        this.signalMove();
      }
    };

    el.addEventListener("pointerdown", (event) => {
      if (this.pointerId !== null) return;
      event.preventDefault();
      this.pointerId = event.pointerId;
      updateCenter();
      el.classList.add("is-active");
      el.setPointerCapture?.(event.pointerId);
      move(event);
    });
    el.addEventListener("pointermove", (event) => {
      if (this.pointerId === null) return;
      event.preventDefault();
      move(event);
    });
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("lostpointercapture", release);
    window.addEventListener("resize", () => {
      if (this.pointerId !== null) updateCenter();
    });
  }

  signalMove() {
    if (this.firstMove) return;
    this.firstMove = true;
    this.onFirstMove?.();
  }

  get vector() {
    let x = this.joy.x;
    let y = this.joy.y;

    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) x -= 1;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) x += 1;
    if (this.keys.has("ArrowUp") || this.keys.has("KeyW")) y -= 1;
    if (this.keys.has("ArrowDown") || this.keys.has("KeyS")) y += 1;

    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    return { x, y };
  }
}
