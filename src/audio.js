// Tiny procedural WebAudio sound engine. No external assets.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
    } catch { this.ctx = null; }
  }

  resume() { this.ctx?.resume?.().catch(() => {}); }

  tone({ freq = 440, dur = 0.08, type = 'sine', vol = 0.4, slide = 0, delay = 0 }) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur = 0.08, vol = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.buffer = buffer;
    src.connect(gain);
    gain.connect(this.master);
    src.start();
  }

  play(name) {
    switch (name) {
      case 'attack': this.tone({ freq: 220, dur: 0.06, type: 'square', vol: 0.18, slide: -80 }); break;
      case 'hit': this.noise(0.05, 0.15); this.tone({ freq: 120, dur: 0.06, type: 'triangle', vol: 0.16, slide: -40 }); break;
      case 'crit': this.tone({ freq: 620, dur: 0.09, type: 'square', vol: 0.2, slide: -160 }); break;
      case 'skill': this.tone({ freq: 300, dur: 0.35, type: 'sawtooth', vol: 0.18, slide: 260 }); break;
      case 'coin': this.tone({ freq: 880, dur: 0.06, type: 'sine', vol: 0.15 }); this.tone({ freq: 1320, dur: 0.08, type: 'sine', vol: 0.12, delay: 0.05 }); break;
      case 'level': [523, 659, 784, 1046].forEach((f, i) => this.tone({ freq: f, dur: 0.18, type: 'sine', vol: 0.2, delay: i * 0.09 })); break;
      case 'loot': this.tone({ freq: 660, dur: 0.08, type: 'sine', vol: 0.14, slide: 220 }); break;
      case 'ui': this.tone({ freq: 520, dur: 0.04, type: 'sine', vol: 0.09 }); break;
      case 'error': this.tone({ freq: 180, dur: 0.13, type: 'sawtooth', vol: 0.12, slide: -60 }); break;
      case 'death': [330, 262, 196, 131].forEach((f, i) => this.tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.18, delay: i * 0.16 })); break;
      case 'teleport': this.tone({ freq: 180, dur: 0.5, type: 'sine', vol: 0.16, slide: 700 }); break;
      case 'boss': this.tone({ freq: 90, dur: 0.7, type: 'sawtooth', vol: 0.22, slide: 20 }); break;
    }
  }
}
