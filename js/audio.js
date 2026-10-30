// Small procedural sound kit. No asset files, no autoplay: the context is
// unlocked by the first tap.
class AudioKit {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.noise = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.24;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
    } catch {}
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.24, this.ctx.currentTime, 0.03);
    }
  }

  tone({ freq = 440, end = freq, dur = 0.12, type = 'sine', gain = 0.12, delay = 0, attack = 0.005 }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  hiss({ dur = 0.12, gain = 0.1, freq = 1400, q = 0.8, delay = 0, type = 'bandpass' }) {
    if (!this.ctx || this.muted || !this.noise) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'click':
        this.tone({ freq: 520, end: 660, dur: 0.06, type: 'sine', gain: 0.05 });
        break;
      case 'back':
        this.tone({ freq: 440, end: 320, dur: 0.08, type: 'sine', gain: 0.05 });
        break;
      case 'shoot':
        this.hiss({ dur: 0.06, gain: 0.035, freq: 2100, q: 1.4 });
        this.tone({ freq: 680, end: 430, dur: 0.05, type: 'triangle', gain: 0.035 });
        break;
      case 'hit':
        this.hiss({ dur: 0.07, gain: 0.075, freq: 900, q: 0.7 });
        this.tone({ freq: 150, end: 80, dur: 0.09, type: 'square', gain: 0.045 });
        break;
      case 'crit':
        this.hiss({ dur: 0.1, gain: 0.1, freq: 1800, q: 0.9 });
        this.tone({ freq: 920, end: 540, dur: 0.11, type: 'triangle', gain: 0.07 });
        break;
      case 'hurt':
        this.tone({ freq: 190, end: 95, dur: 0.18, type: 'sawtooth', gain: 0.09 });
        this.hiss({ dur: 0.12, gain: 0.05, freq: 500 });
        break;
      case 'skill':
        this.tone({ freq: 220, end: 880, dur: 0.22, type: 'sawtooth', gain: 0.055 });
        this.hiss({ dur: 0.22, gain: 0.04, freq: 1200, q: 1.2 });
        break;
      case 'nova':
        this.tone({ freq: 180, end: 740, dur: 0.36, type: 'sine', gain: 0.1 });
        this.tone({ freq: 360, end: 1480, dur: 0.32, type: 'triangle', gain: 0.045 });
        break;
      case 'potion':
        this.tone({ freq: 340, end: 680, dur: 0.18, type: 'sine', gain: 0.07 });
        this.tone({ freq: 520, end: 980, dur: 0.2, type: 'sine', gain: 0.04, delay: 0.1 });
        break;
      case 'loot':
        this.tone({ freq: 680, dur: 0.08, type: 'triangle', gain: 0.055 });
        this.tone({ freq: 920, dur: 0.1, type: 'triangle', gain: 0.045, delay: 0.06 });
        break;
      case 'rare':
        this.tone({ freq: 520, end: 760, dur: 0.16, type: 'triangle', gain: 0.07 });
        this.tone({ freq: 980, end: 1320, dur: 0.24, type: 'sine', gain: 0.055, delay: 0.09 });
        break;
      case 'merge':
        [392, 523, 659].forEach((f, i) => this.tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.06, delay: i * 0.055 }));
        break;
      case 'divine':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ freq: f, dur: 0.5, type: 'sine', gain: 0.06, delay: i * 0.09 }));
        break;
      case 'level':
        [523, 659, 784, 1046].forEach((f, i) => this.tone({ freq: f, dur: 0.28, type: 'triangle', gain: 0.06, delay: i * 0.08 }));
        break;
      case 'wave':
        this.tone({ freq: 110, end: 160, dur: 0.5, type: 'sawtooth', gain: 0.045 });
        this.hiss({ dur: 0.5, gain: 0.03, freq: 320 });
        break;
      case 'boss':
        this.tone({ freq: 85, end: 42, dur: 0.9, type: 'sawtooth', gain: 0.13 });
        this.hiss({ dur: 0.9, gain: 0.07, freq: 180, q: 0.5 });
        break;
      case 'victory':
        [392, 523, 659, 784, 1046].forEach((f, i) => this.tone({ freq: f, dur: 0.55, type: 'triangle', gain: 0.055, delay: i * 0.12 }));
        break;
      case 'defeat':
        [330, 262, 196, 131].forEach((f, i) => this.tone({ freq: f, dur: 0.5, type: 'sawtooth', gain: 0.05, delay: i * 0.15 }));
        break;
      case 'error':
        this.tone({ freq: 160, end: 120, dur: 0.12, type: 'square', gain: 0.04 });
        break;
      case 'upgrade':
        this.tone({ freq: 440, end: 1320, dur: 0.4, type: 'sine', gain: 0.08 });
        break;
      default:
        break;
    }
  }
}

export const audio = new AudioKit();
