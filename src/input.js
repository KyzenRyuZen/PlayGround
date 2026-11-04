// Unified keyboard + touch input. The joystick is analog, but has a tiny
// dead-zone and a soft spring-back so small thumbs still feel deliberate.
export class Input {
  constructor({ joystick, knob }) {
    this.joystick = joystick;
    this.knob = knob;
    this.keys = new Set();
    this.stick = { x: 0, y: 0, active: false };
    this.pointerId = null;
    this.center = { x: 0, y: 0 };
    this.maxRadius = 40;
    this.keyboardUsed = false;
    this.touchUsed = false;
    this.onActivity = null;

    window.addEventListener("keydown", (event) => {
      if (event.repeat) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD", "Space"].includes(event.code)) {
        if (event.code !== "Space") event.preventDefault();
        this.keys.add(event.code);
        this.keyboardUsed = true;
        this.onActivity?.("key");
      }
    });
    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.resetStick();
    });

    const down = (event) => {
      if (this.pointerId !== null) return;
      this.pointerId = event.pointerId;
      this.touchUsed = true;
      this.joystick.classList.add("active");
      const rect = this.joystick.getBoundingClientRect();
      this.center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.maxRadius = rect.width * 0.31;
      this.joystick.setPointerCapture?.(event.pointerId);
      this.updateStick(event.clientX, event.clientY);
      this.onActivity?.("pointer");
      event.preventDefault();
    };
    const move = (event) => {
      if (event.pointerId !== this.pointerId) return;
      this.updateStick(event.clientX, event.clientY);
      event.preventDefault();
    };
    const up = (event) => {
      if (event.pointerId !== this.pointerId) return;
      this.resetStick();
      event.preventDefault();
    };

    this.joystick.addEventListener("pointerdown", down);
    this.joystick.addEventListener("pointermove", move);
    this.joystick.addEventListener("pointerup", up);
    this.joystick.addEventListener("pointercancel", up);
    this.joystick.addEventListener("lostpointercapture", up);
  }

  updateStick(clientX, clientY) {
    let dx = clientX - this.center.x;
    let dy = clientY - this.center.y;
    const distance = Math.hypot(dx, dy);
    if (distance > this.maxRadius) {
      dx = (dx / distance) * this.maxRadius;
      dy = (dy / distance) * this.maxRadius;
    }
    const nx = dx / this.maxRadius;
    const ny = dy / this.maxRadius;
    const magnitude = Math.hypot(nx, ny);
    const dead = 0.12;
    if (magnitude < dead) {
      this.stick.x = 0;
      this.stick.y = 0;
    } else {
      const scaled = Math.min(1, (magnitude - dead) / (1 - dead));
      this.stick.x = (nx / magnitude) * scaled;
      this.stick.y = (ny / magnitude) * scaled;
    }
    this.stick.active = true;
    this.knob.style.transform = `translate(-50%, -50%) translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  }

  resetStick() {
    this.pointerId = null;
    this.stick.x = 0;
    this.stick.y = 0;
    this.stick.active = false;
    this.joystick.classList.remove("active");
    this.knob.style.transform = "translate(-50%, -50%)";
  }

  getVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) y -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) y += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (x !== 0 || y !== 0) {
      const length = Math.hypot(x, y);
      x /= length;
      y /= length;
    }
    if (this.stick.active && (this.stick.x !== 0 || this.stick.y !== 0)) {
      if (x === 0 && y === 0) return { x: this.stick.x, y: this.stick.y };
      x += this.stick.x;
      y += this.stick.y;
      const length = Math.hypot(x, y);
      if (length > 1) {
        x /= length;
        y /= length;
      }
    }
    return { x, y };
  }
}
