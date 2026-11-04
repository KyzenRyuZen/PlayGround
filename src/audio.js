// A tiny procedural soundscape: soft wind, bird calls and a chime for each
// starbloom. No audio files, no autoplay before the start gesture.
export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.ready = false;
    this.nextBird = 5;
    try {
      this.muted = localStorage.getItem("hollowbrook-muted") === "1";
    } catch {
      this.muted = false;
    }
  }

  start() {
    if (this.ready) {
      if (this.ctx?.state === "suspended") this.ctx.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(this.ctx.destination);
      this.ready = true;
      this.startWind();
    } catch {
      this.ready = false;
    }
  }

  startWind() {
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * 3.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      last = last * 0.985 + (Math.random() * 2 - 1) * 0.015;
      data[i] = last * 2.4;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 460;
    const gain = ctx.createGain();
    gain.gain.value = 0.16;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  setMuted(muted) {
    this.muted = muted;
    try {
      localStorage.setItem("hollowbrook-muted", muted ? "1" : "0");
    } catch {}
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime + 0.2);
    }
  }

  tone(freq, duration = 0.25, type = "sine", volume = 0.05, delay = 0) {
    if (!this.ready || !this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(this.master);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  }

  chime(index = 0) {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568];
    const base = notes[index % notes.length];
    this.tone(base, 0.7, "sine", 0.08);
    this.tone(base * 1.5, 0.55, "sine", 0.035, 0.06);
    this.tone(base * 2, 0.4, "triangle", 0.018, 0.12);
  }

  step() {
    if (!this.ready || !this.ctx) return;
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * 0.055);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3) * 0.3;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 340;
    const gain = ctx.createGain();
    gain.gain.value = 0.14;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
  }

  startJingle() {
    this.tone(392, 0.5, "sine", 0.045);
    this.tone(523.25, 0.6, "sine", 0.04, 0.15);
    this.tone(659.25, 0.8, "sine", 0.035, 0.3);
  }

  complete() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 1.4, "sine", 0.06, i * 0.16));
    this.tone(1568, 1.8, "triangle", 0.02, 0.65);
  }

  update(dt) {
    if (!this.ready || this.muted) return;
    this.nextBird -= dt;
    if (this.nextBird <= 0) {
      this.nextBird = 7 + Math.random() * 9;
      const base = 1100 + Math.random() * 900;
      this.tone(base, 0.09, "sine", 0.022);
      this.tone(base * 1.18, 0.07, "sine", 0.016, 0.1);
      if (Math.random() > 0.55) this.tone(base * 0.9, 0.08, "sine", 0.014, 0.23);
    }
  }
}
