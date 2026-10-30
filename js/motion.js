/* Optional phone/tablet tilt movement, with iOS motion permission flow. */

class TiltController {
  constructor() {
    this.enabled = false;
    this.permission = 'unknown';
    this.available = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    this.vector = { x: 0, y: 0 };
    this.base = { beta: null, gamma: null };
    this.bound = this.onOrientation.bind(this);
    this.calibrated = false;
  }

  canRequestPermission() {
    return this.available && typeof DeviceOrientationEvent.requestPermission === 'function';
  }

  async enable() {
    if (!this.available) return { ok: false, reason: 'Motion sensors are not available on this device.' };
    try {
      if (this.canRequestPermission()) {
        this.permission = await DeviceOrientationEvent.requestPermission();
        if (this.permission !== 'granted') {
          return { ok: false, reason: 'Motion access was not granted.' };
        }
      }
      this.enabled = true;
      this.calibrated = false;
      this.base = { beta: null, gamma: null };
      window.addEventListener('deviceorientation', this.bound, true);
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: 'Motion access could not be started.' };
    }
  }

  disable() {
    this.enabled = false;
    this.vector = { x: 0, y: 0 };
    window.removeEventListener('deviceorientation', this.bound, true);
  }

  calibrate() {
    this.calibrated = false;
    this.base = { beta: null, gamma: null };
    this.vector = { x: 0, y: 0 };
  }

  onOrientation(event) {
    if (!this.enabled) return;
    if (event.beta == null && event.gamma == null) return;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    if (!this.calibrated) {
      this.base = { beta, gamma };
      this.calibrated = true;
      return;
    }
    const dead = 2.5;
    let dx = gamma - this.base.gamma;
    let dy = beta - this.base.beta;
    if (Math.abs(dx) < dead) dx = 0;
    if (Math.abs(dy) < dead) dy = 0;
    const max = 24;
    this.vector.x = clamp(dx / max, -1, 1);
    // Tilting the top of a phone away from you (beta up) moves the hero up.
    this.vector.y = clamp(-dy / max, -1, 1);
  }
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

export const tilt = new TiltController();
