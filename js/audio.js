/* Tiny procedural soundscape. Everything is synthesized, nothing streams. */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.lastHit = 0;
  }

  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = .12;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setEnabled(value) {
    this.enabled = !!value;
    if (this.master) this.master.gain.value = this.enabled ? .12 : 0;
    if (this.enabled) this.unlock();
  }

  tone(freq, dur = .12, type = 'sine', gain = .3, slide = 0, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + dur);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + .012);
    g.gain.exponentialRampToValueAtTime(.0001, now + dur);
    osc.connect(g).connect(this.master);
    osc.start(now);
    osc.stop(now + dur + .03);
  }

  noise(dur = .18, gain = .25, filterFreq = 900, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const length = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(.0001, now + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(now);
  }

  play(name) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;
    switch (name) {
      case 'click':
        this.tone(520, .05, 'triangle', .12, -80);
        break;
      case 'select':
        this.tone(320, .08, 'sine', .18, 90);
        this.tone(640, .12, 'sine', .08, 90, .04);
        break;
      case 'hit': {
        const now = performance.now();
        if (now - this.lastHit < 45) return;
        this.lastHit = now;
        this.noise(.08, .16, 1500);
        this.tone(95, .06, 'square', .07, -20);
        break;
      }
      case 'heavy':
        this.noise(.24, .38, 750);
        this.tone(62, .24, 'sine', .34, -18);
        break;
      case 'skill':
        this.tone(260, .24, 'sawtooth', .08, 520);
        this.tone(520, .18, 'triangle', .08, 260, .03);
        break;
      case 'loot':
        this.tone(740, .1, 'sine', .14, 60);
        this.tone(988, .16, 'sine', .11, 60, .09);
        break;
      case 'epic':
        [440, 554, 659, 880].forEach((f, i) => this.tone(f, .3, 'triangle', .12, 20, i * .07));
        break;
      case 'level':
        [392, 523, 659, 784].forEach((f, i) => this.tone(f, .45, 'sine', .16, 10, i * .08));
        break;
      case 'boss':
        this.tone(44, .9, 'sawtooth', .24, -12);
        this.tone(66, .8, 'sine', .19, -16, .08);
        this.noise(.6, .2, 380);
        break;
      case 'victory':
        [392, 494, 587, 784, 988].forEach((f, i) => this.tone(f, .55, 'triangle', .13, 8, i * .1));
        break;
      case 'defeat':
        [330, 294, 247, 196].forEach((f, i) => this.tone(f, .5, 'sine', .11, -18, i * .13));
        break;
      case 'merge':
        this.noise(.3, .3, 1200);
        [220, 330, 440, 660, 880].forEach((f, i) => this.tone(f, .4, 'triangle', .11, 45, i * .05));
        break;
      default:
        this.tone(440, .06, 'sine', .08);
    }
  }
}

export const audio = new SoundEngine();

export function haptic(pattern = 10) {
  if (!navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch { /* no-op */ }
}
