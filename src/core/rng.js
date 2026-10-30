/* Small deterministic RNG helpers, used for loot and offline simulation. */

export function createRng(seed = Date.now()) {
  let s = (Number(seed) || 1) >>> 0;
  return function rng() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rng = createRng((Date.now() ^ 0x9e3779b9) >>> 0);

export function rand(min, max, r = rng) { return min + (max - min) * r(); }
export function randInt(min, max, r = rng) { return Math.floor(rand(min, max + 1, r)); }
export function chance(p, r = rng) { return r() < p; }
export function pick(arr, r = rng) { return arr[Math.floor(r() * arr.length)]; }
export function shuffle(arr, r = rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function weighted(pool, weightKey = 'weight', r = rng) {
  const total = pool.reduce((sum, entry) => sum + (entry[weightKey] || 0), 0);
  let roll = r() * total;
  for (const entry of pool) {
    roll -= entry[weightKey] || 0;
    if (roll <= 0) return entry;
  }
  return pool[pool.length - 1];
}
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}
