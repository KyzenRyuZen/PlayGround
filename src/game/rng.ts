// Deterministic RNG helpers (mulberry32) — used by the engine and tests.

export interface Rng {
  next(): number
  int(min: number, max: number): number
  float(min: number, max: number): number
  chance(p: number): boolean
  pick<T>(arr: readonly T[]): T
  weighted<T>(entries: readonly { value: T; weight: number }[]): T
  shuffle<T>(arr: T[]): T[]
}

export function createRng(seed = Date.now()): Rng {
  let a = seed >>> 0
  const next = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max) => next() * (max - min) + min,
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)]!,
    weighted: (entries) => {
      const total = entries.reduce((sum, e) => sum + e.weight, 0)
      let roll = next() * total
      for (const entry of entries) {
        roll -= entry.weight
        if (roll <= 0) return entry.value
      }
      return entries[entries.length - 1]!.value
    },
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
      }
      return arr
    },
  }
}

export function uid(rng: Rng, prefix = 'x'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(rng.next() * 1e9).toString(36)}`
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
