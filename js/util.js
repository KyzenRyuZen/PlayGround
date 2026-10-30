export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (min = 0, max = 1) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const choice = arr => arr[Math.floor(Math.random() * arr.length)];
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const normalize = (x, y) => {
  const len = Math.hypot(x, y);
  return len > 0.0001 ? { x: x / len, y: y / len, len } : { x: 0, y: 0, len: 0 };
};
export const round = (v, places = 1) => Math.round(v * 10 ** places) / 10 ** places;

export function formatNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 10_000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return Math.round(n).toLocaleString('en-US');
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

export function vibrate(ms = 12, enabled = true) {
  if (!enabled) return;
  try { navigator.vibrate?.(ms); } catch {}
}

export function nextFrame() {
  return new Promise(r => requestAnimationFrame(() => r()));
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
