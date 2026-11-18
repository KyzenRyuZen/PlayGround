// Procedural audio for AETHERIA. No external assets, no network requests.
// The tiny WebAudio synth keeps the installable build self-contained while
// still giving every weapon, spell, pickup and UI tap its own texture.

export class AudioEngine {
  constructor(settings) {
    this.settings = settings ?? { music: true, sfx: true };
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.drone = null;
    this.started = false;
    this.lastPlay = 0;
    this.unlock = this.unlock.bind(this);
  }

  setSettings(settings) {
    this.settings = settings;
    if (this.musicGain) this.musicGain.gain.value = settings.music ? 0.14 : 0;
    if (this.sfxGain) this.sfxGain.gain.value = settings.sfx ? 0.34 : 0;
    if (settings.music && this.ctx && !this.drone) this.startMusic();
    if (!settings.music && this.drone) this.stopMusic();
  }

  unlock() {
    this.ensure();
    if (!this.started) {
      this.started = true;
      if (this.settings.music) this.startMusic();
    }
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.settings.music ? 0.14 : 0;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.settings.sfx ? 0.34 : 0;
    this.sfxGain.connect(this.master);
    return this.ctx;
  }

  startMusic() {
    const ctx = this.ensure();
    if (!ctx || this.drone) return;
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.gain.linearRampToValueAtTime(0.72, ctx.currentTime + 7);
    bus.connect(this.musicGain);
    const notes = [55, 82.41, 110, 164.81, 220];
    const oscs = [];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = i % 2 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (i - 2) * 4;
      filter.type = 'lowpass';
      filter.frequency.value = 500 + i * 110;
      filter.Q.value = 0.5;
      gain.gain.value = i === 0 ? 0.18 : 0.06 / (i * 0.5);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      osc.start();
      oscs.push(osc);
    });
    // Slow breathing filter gives the pad a living, wind-like motion.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.045;
    lfoGain.gain.value = 170;
    lfo.connect(lfoGain);
    lfoGain.connect(oscs[1]?.frequency ?? oscs[0].frequency);
    lfo.start();
    this.drone = { bus, oscs, lfo };
  }

  stopMusic() {
    if (!this.drone || !this.ctx) return;
    const { bus, oscs, lfo } = this.drone;
    const now = this.ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(0, now + 1.2);
    setTimeout(() => {
      try { bus.disconnect(); } catch {}
      for (const o of oscs) { try { o.stop(); } catch {} }
      try { lfo.stop(); } catch {}
    }, 1400);
    this.drone = null;
  }

  tone(freq, dur, opts = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), now + dur);
    filter.type = opts.filter ?? 'lowpass';
    filter.frequency.value = opts.cutoff ?? 2600;
    filter.Q.value = opts.q ?? 0.8;
    const vol = Math.max(0.001, opts.vol ?? 0.12);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  }

  noise(dur, opts = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filter ?? 'bandpass';
    filter.frequency.value = opts.freq ?? 1200;
    filter.Q.value = opts.q ?? 1;
    const gain = ctx.createGain();
    gain.gain.value = opts.vol ?? 0.09;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
  }

  play(name) {
    if (!this.settings.sfx) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = performance.now();
    if (now - this.lastPlay < 24) return;
    this.lastPlay = now;
    switch (name) {
      case 'slash':
        this.noise(0.1, { freq: 2100, q: 0.7, vol: 0.1 });
        this.tone(190, 0.09, { type: 'triangle', slide: 110, vol: 0.045 });
        break;
      case 'cast':
        this.tone(720, 0.22, { type: 'sine', slide: 1240, vol: 0.06 });
        this.tone(1080, 0.16, { type: 'triangle', slide: 1640, vol: 0.025 });
        break;
      case 'hit':
        this.noise(0.07, { freq: 900, q: 0.6, vol: 0.07 });
        this.tone(130, 0.06, { type: 'square', slide: 80, vol: 0.035 });
        break;
      case 'crit':
        this.tone(880, 0.12, { type: 'triangle', slide: 1400, vol: 0.07 });
        this.noise(0.12, { freq: 2600, q: 0.8, vol: 0.05 });
        break;
      case 'enemy':
        this.noise(0.12, { freq: 620, q: 0.5, vol: 0.06 });
        this.tone(96, 0.13, { type: 'sawtooth', slide: 62, vol: 0.035 });
        break;
      case 'hurt':
        this.tone(145, 0.2, { type: 'sawtooth', slide: 70, vol: 0.08 });
        this.noise(0.16, { freq: 480, q: 0.4, vol: 0.055 });
        break;
      case 'coin':
        this.tone(1320, 0.08, { type: 'triangle', vol: 0.045 });
        setTimeout(() => this.tone(1760, 0.11, { type: 'triangle', vol: 0.04 }), 55);
        break;
      case 'gem':
        this.tone(1175, 0.1, { type: 'sine', vol: 0.055 });
        setTimeout(() => this.tone(1568, 0.18, { type: 'sine', vol: 0.05 }), 70);
        break;
      case 'loot':
        this.tone(540, 0.08, { type: 'triangle', vol: 0.04 });
        setTimeout(() => this.tone(810, 0.14, { type: 'triangle', vol: 0.035 }), 65);
        break;
      case 'gather':
        this.noise(0.15, { freq: 520, q: 0.6, vol: 0.04 });
        break;
      case 'gatherDone':
        this.tone(440, 0.12, { type: 'sine', vol: 0.05 });
        setTimeout(() => this.tone(660, 0.16, { type: 'sine', vol: 0.04 }), 100);
        break;
      case 'heal':
        [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, { type: 'sine', vol: 0.04 }), i * 70));
        break;
      case 'levelup':
        [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.28, { type: 'triangle', vol: 0.055 }), i * 100));
        break;
      case 'quest':
        [660, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, { type: 'sine', vol: 0.045 }), i * 110));
        break;
      case 'mount':
        this.tone(220, 0.2, { type: 'triangle', slide: 330, vol: 0.055 });
        this.noise(0.2, { freq: 800, q: 0.5, vol: 0.03 });
        break;
      case 'boss':
        this.tone(68, 0.8, { type: 'sawtooth', vol: 0.08 });
        setTimeout(() => this.tone(52, 1.1, { type: 'sawtooth', vol: 0.06 }), 170);
        break;
      case 'bossCast':
        this.tone(160, 0.5, { type: 'sawtooth', slide: 60, vol: 0.06 });
        break;
      case 'stone':
        [784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, { type: 'sine', vol: 0.045 }), i * 80));
        break;
      case 'death':
        this.tone(180, 0.9, { type: 'sawtooth', slide: 45, vol: 0.1 });
        break;
      case 'ui':
        this.tone(680, 0.04, { type: 'triangle', vol: 0.02 });
        break;
      default:
        this.tone(520, 0.06, { type: 'triangle', vol: 0.03 });
    }
  }
}
