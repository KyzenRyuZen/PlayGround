/* ---------------------------------------------------------------
   Touch joystick, keyboard, and optional accelerometer tilt.
   --------------------------------------------------------------- */
export class Input {
  constructor() {
    this.move = { x: 0, y: 0 };
    this.keys = new Set();
    this.joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0 };
    this.onSkill = null;
    this.onPause = null;
    this.onAnyInput = null;
    this.tilt = {
      enabled: false, available: false, permission: 'unknown',
      rawBeta: 0, rawGamma: 0, neutral: null, vec: { x: 0, y: 0 },
      sensitivity: 22, inverted: false,
    };
    this._bound = false;
    this._tiltHandler = null;
  }

  attach() {
    if (this._bound) return;
    this._bound = true;
    const app = document.getElementById('app');
    window.addEventListener('pointerdown', e => this._down(e, app), { passive: false });
    window.addEventListener('pointermove', e => this._move(e), { passive: false });
    window.addEventListener('pointerup', e => this._up(e), { passive: true });
    window.addEventListener('pointercancel', e => this._up(e), { passive: true });
    window.addEventListener('keydown', e => this._key(e, true));
    window.addEventListener('keyup', e => this._key(e, false));
    window.addEventListener('blur', () => { this.keys.clear(); this._endJoy(); });
    window.addEventListener('contextmenu', e => { if (e.target.closest('#screen-battle')) e.preventDefault(); });
  }

  _down(e, app) {
    this.onAnyInput?.();
    if (e.target.closest('button, input, select, textarea, .modal, .sheet')) return;
    if (!document.getElementById('screen-battle')?.classList.contains('active')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (this.joy.active) return;
    const w = window.innerWidth;
    // left 56% is the movement zone
    if (e.clientX > w * 0.58) return;
    this.joy.active = true;
    this.joy.id = e.pointerId;
    this.joy.ox = e.clientX; this.joy.oy = e.clientY;
    this.joy.x = e.clientX; this.joy.y = e.clientY;
    this.joy.dx = 0; this.joy.dy = 0;
    e.preventDefault();
  }

  _move(e) {
    if (!this.joy.active || e.pointerId !== this.joy.id) return;
    this.onAnyInput?.();
    this.joy.x = e.clientX; this.joy.y = e.clientY;
    let dx = e.clientX - this.joy.ox;
    let dy = e.clientY - this.joy.oy;
    const max = 46;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    this.joy.dx = dx / max; this.joy.dy = dy / max;
    e.preventDefault();
  }

  _up(e) {
    if (e.pointerId !== this.joy.id) return;
    this._endJoy();
  }

  _endJoy() {
    this.joy.active = false;
    this.joy.id = null;
    this.joy.dx = 0; this.joy.dy = 0;
  }

  _key(e, down) {
    if (e.target.matches('input, textarea, select')) return;
    const k = e.key.toLowerCase();
    const blocked = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', '1', '2', '3', 'escape', 'p'];
    if (blocked.includes(k)) e.preventDefault();
    if (down) {
      this.keys.add(k);
      this.onAnyInput?.();
      if (k === '1' || k === '2' || k === '3') this.onSkill?.(Number(k) - 1);
      if (k === 'escape' || k === 'p') this.onPause?.();
    } else {
      this.keys.delete(k);
    }
  }

  getMove() {
    if (this.joy.active) {
      const m = Math.hypot(this.joy.dx, this.joy.dy);
      return { x: this.joy.dx, y: this.joy.dy, mag: m };
    }
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x || y) {
      const l = Math.hypot(x, y);
      return { x: x / l, y: y / l, mag: 1 };
    }
    if (this.tilt.enabled && this.tilt.vec) {
      return { x: this.tilt.vec.x, y: this.tilt.vec.y, mag: Math.hypot(this.tilt.vec.x, this.tilt.vec.y) };
    }
    return { x: 0, y: 0, mag: 0 };
  }

  reset() {
    this._endJoy();
    this.keys.clear();
    this.move = { x: 0, y: 0 };
  }

  /* ---------------------------------------------------------- tilt */
  async enableTilt() {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      this.tilt.available = false;
      return { ok: false, reason: 'Motion sensors are not available on this device.' };
    }
    this.tilt.available = true;
    try {
      const DOE = window.DeviceOrientationEvent;
      if (typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission();
        this.tilt.permission = res;
        if (res !== 'granted') return { ok: false, reason: 'Motion access was not granted.' };
      } else {
        this.tilt.permission = 'granted';
      }
    } catch {
      return { ok: false, reason: 'Motion permission could not be requested. On iOS, use a direct tap on Enable.' };
    }
    this._bindTilt();
    this.tilt.enabled = true;
    this.tilt.neutral = null;
    return { ok: true, reason: 'Tilt enabled. Hold your device comfortably to calibrate.' };
  }

  _bindTilt() {
    if (this._tiltHandler) return;
    this._tiltHandler = (ev) => {
      if (ev.beta === null && ev.gamma === null) return;
      this.tilt.rawBeta = ev.beta || 0;
      this.tilt.rawGamma = ev.gamma || 0;
      if (!this.tilt.neutral) {
        this.tilt.neutral = { beta: this.tilt.rawBeta, gamma: this.tilt.rawGamma };
      }
      if (!this.tilt.enabled) return;
      const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
      let dx = this.tilt.rawGamma - this.tilt.neutral.gamma;
      let dy = this.tilt.rawBeta - this.tilt.neutral.beta;
      if (angle === 90) { const t = dx; dx = dy; dy = -t; }
      else if (angle === -90 || angle === 270) { const t = dx; dx = -dy; dy = t; }
      const dead = 2.5;
      dx = Math.abs(dx) < dead ? 0 : dx - Math.sign(dx) * dead;
      dy = Math.abs(dy) < dead ? 0 : dy - Math.sign(dy) * dead;
      const max = 24;
      let x = Math.max(-1, Math.min(1, dx / max));
      let y = Math.max(-1, Math.min(1, dy / max));
      if (this.tilt.inverted) y = -y;
      const mag = Math.hypot(x, y);
      if (mag > 1) { x /= mag; y /= mag; }
      this.tilt.vec = { x, y };
    };
    window.addEventListener('deviceorientation', this._tiltHandler, true);
  }

  disableTilt() {
    this.tilt.enabled = false;
    this.tilt.vec = { x: 0, y: 0 };
    if (this._tiltHandler) {
      window.removeEventListener('deviceorientation', this._tiltHandler, true);
      this._tiltHandler = null;
    }
  }

  calibrateTilt() {
    if (this.tilt.rawBeta || this.tilt.rawGamma) {
      this.tilt.neutral = { beta: this.tilt.rawBeta, gamma: this.tilt.rawGamma };
      this.tilt.vec = { x: 0, y: 0 };
      return true;
    }
    return false;
  }

  setTiltSensitivity(v) { this.tilt.sensitivity = Math.max(8, Math.min(45, v)); }
}
