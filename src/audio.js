/* ---------------------------------------------------------------
   Procedural audio: every sound is synthesized, zero assets.
   --------------------------------------------------------------- */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.music = null;
    this.volume = 0.65;
    this.enabled = true;
    this.noise = null;
    this.musicTimer = null;
    this.last = new Map();
    this.step = 0;
    this.unlocked = false;
  }

  unlock() {
    if (this.unlocked && this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.enabled ? this.volume * 0.8 : 0;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.85; this.sfx.connect(this.master);
      this.music = this.ctx.createGain(); this.music.gain.value = 0.22; this.music.connect(this.master);
      this.noise = this._makeNoise(1.2);
      this.unlocked = true;
      this._startMusic();
    } catch { /* audio is optional */ }
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(on ? this.volume * 0.8 : 0, this.ctx.currentTime, 0.05);
    }
    // Audio is unlocked from a real user gesture, never on page load.
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.enabled ? this.volume * 0.8 : 0, this.ctx.currentTime, 0.05);
  }

  _makeNoise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  _tone(freq, type, dur, gain, slide = 0, dest = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.03);
  }

  _noiseBurst(dur, gain, freq = 900, q = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfx);
    src.start(t); src.stop(t + dur + 0.02);
  }

  play(name) {
    if (!this.ctx || !this.enabled) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const now = performance.now();
    const throttle = name === 'hit' ? 38 : name === 'loot' ? 60 : 0;
    if (throttle && now - (this.last.get(name) || 0) < throttle) return;
    this.last.set(name, now);
    switch (name) {
      case 'click': this._tone(520, 'triangle', 0.09, 0.07, -120); break;
      case 'swing': this._noiseBurst(0.14, 0.16, 1400, 0.8); this._tone(180, 'sine', 0.1, 0.05, -60); break;
      case 'bow': this._tone(700, 'triangle', 0.08, 0.06, 280); break;
      case 'cast': this._tone(420, 'sine', 0.16, 0.08, 240); this._tone(840, 'triangle', 0.12, 0.035, 180); break;
      case 'hit': this._noiseBurst(0.08, 0.11, 2400, 1.2); this._tone(120, 'square', 0.06, 0.03, -40); break;
      case 'hurt': this._tone(120, 'sawtooth', 0.22, 0.14, -60); this._noiseBurst(0.16, 0.1, 300, 0.8); break;
      case 'heal': [523, 659, 784].forEach((f, i) => setTimeout(() => this._tone(f, 'sine', 0.25, 0.06), i * 60)); break;
      case 'loot': this._tone(880, 'triangle', 0.14, 0.05, 220); break;
      case 'merge': [392, 523, 659, 880].forEach((f, i) => setTimeout(() => this._tone(f, 'triangle', 0.3, 0.055), i * 80)); break;
      case 'levelup': [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 'sine', 0.35, 0.07), i * 90)); break;
      case 'victory': [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this._tone(f, 'triangle', 0.5, 0.075), i * 130)); break;
      case 'death': [220, 196, 164, 110].forEach((f, i) => setTimeout(() => this._tone(f, 'sine', 0.7, 0.09, -20), i * 200)); break;
      case 'defeat': break;
      case 'boss': this._tone(55, 'sawtooth', 1.6, 0.12, -10); this._noiseBurst(0.8, 0.12, 160, 0.6); break;
      case 'bossdown': [220, 174, 130, 98].forEach((f, i) => setTimeout(() => this._tone(f, 'sawtooth', 0.9, 0.09, -20), i * 180)); break;
      case 'dash': this._noiseBurst(0.22, 0.13, 900, 0.7); this._tone(260, 'sine', 0.2, 0.06, 120); break;
      case 'whirl': this._noiseBurst(0.7, 0.14, 700, 0.6); this._tone(180, 'sawtooth', 0.5, 0.05, 60); break;
      case 'nova': this._tone(1200, 'sine', 0.5, 0.08, -900); this._noiseBurst(0.4, 0.12, 3000, 0.5); break;
      case 'meteor': this._tone(70, 'sawtooth', 0.9, 0.12, 40); this._noiseBurst(0.9, 0.12, 220, 0.7); break;
      case 'blink': this._tone(700, 'sine', 0.2, 0.07, 800); this._noiseBurst(0.2, 0.06, 4000, 0.6); break;
      case 'rain': this._noiseBurst(0.2, 0.07, 2600, 0.7); break;
      case 'lance': this._tone(1100, 'sawtooth', 0.16, 0.1, -700); this._noiseBurst(0.3, 0.12, 1800, 0.6); break;
      case 'roll': this._noiseBurst(0.28, 0.1, 500, 0.7); break;
      case 'banner': this._tone(196, 'sawtooth', 0.5, 0.08, 80); this._tone(392, 'sine', 0.4, 0.06, 40); break;
      case 'charge': this._noiseBurst(0.6, 0.13, 300, 0.8); this._tone(90, 'sawtooth', 0.5, 0.08, 40); break;
      case 'slam': this._tone(65, 'sine', 0.5, 0.15, -20); this._noiseBurst(0.4, 0.15, 180, 0.6); break;
      case 'shoot': this._tone(600, 'triangle', 0.12, 0.045, -240); break;
      case 'rumble': this._noiseBurst(1.2, 0.12, 120, 0.6); break;
      case 'ring': this._tone(160, 'sine', 0.8, 0.1, 220); break;
      case 'enrage': this._tone(80, 'sawtooth', 1.1, 0.12, 60); this._noiseBurst(0.7, 0.1, 240, 0.7); break;
      case 'revive': [262, 392, 523, 784].forEach((f, i) => setTimeout(() => this._tone(f, 'sine', 0.5, 0.08), i * 110)); break;
      case 'summon': this._tone(200, 'sine', 0.6, 0.08, 300); break;
      case 'beam': this._tone(1300, 'sawtooth', 0.25, 0.07, -900); break;
      case 'aim': this._tone(300, 'triangle', 0.12, 0.05, 200); break;
      case 'blizzard': this._noiseBurst(0.9, 0.08, 3000, 0.5); break;
      case 'wave': this._tone(330, 'triangle', 0.2, 0.05, 80); break;
      default: break;
    }
  }

  _startMusic() {
    if (this.musicTimer) return;
    const scale = [110, 130.81, 146.83, 164.81, 196, 220, 246.94, 261.63];
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.enabled) return;
      if (this.ctx.state === 'suspended') return;
      const t = this.ctx.currentTime;
      if (this.step % 8 === 0) {
        const root = scale[(this.step / 8) % scale.length | 0];
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(root / 2, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 1.2);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 5.5);
        o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 5.7);
      }
      const note = scale[(this.step * 3) % scale.length];
      const o2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      o2.type = 'triangle'; o2.frequency.setValueAtTime(note, t);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(0.012, t + 0.8);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o2.connect(g2); g2.connect(this.music); o2.start(t); o2.stop(t + 3.3);
      this.step++;
    }, 2600);
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  }
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }
}
