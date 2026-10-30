/* Tiny WebAudio cue synth. No audio files, no music, no autoplay. */

import { Engine } from '../core/engine.js';

let ctx = null;
let master = null;
let lastCue = 0;

function ensure() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type = 'sine', delay = 0, vol = 0.5, slide = 0) {
  const ac = ensure();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

const CUES = {
  ui: () => { tone(560, 0.06, 'triangle', 0, 0.35); },
  click: () => { tone(420, 0.045, 'triangle', 0, 0.25); },
  loot: () => { tone(660, 0.09, 'sine', 0, 0.4); tone(990, 0.12, 'sine', 0.06, 0.3); },
  coin: () => { tone(880, 0.06, 'triangle', 0, 0.35); tone(1320, 0.09, 'triangle', 0.045, 0.22); },
  level: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', i * 0.09, 0.32)); },
  forge: () => { tone(150, 0.16, 'square', 0, 0.22, 60); tone(90, 0.24, 'sawtooth', 0.02, 0.18, -30); },
  danger: () => { tone(210, 0.2, 'sawtooth', 0, 0.22, -70); },
  victory: () => { [392, 523, 659].forEach((f, i) => tone(f, 0.3, 'triangle', i * 0.11, 0.3)); },
};

export function playCue(name) {
  if (!Engine.state?.settings?.sound) return;
  const now = performance.now();
  if (now - lastCue < 45) return;
  lastCue = now;
  const cue = CUES[name] || CUES.ui;
  try { cue(); } catch {}
}

export function unlockAudio() {
  try { ensure(); } catch {}
}
