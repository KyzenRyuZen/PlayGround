import { createRng, type Rng } from '../rng'

/** RNG that deterministically answers `chance()` from a script, then never fires. */
export function scriptedRng(seed: number, chances: boolean[]): Rng {
  const base = createRng(seed)
  let index = 0
  return {
    ...base,
    chance: () => {
      const value = chances[index] ?? false
      index += 1
      return value
    },
  }
}

/** Minimal localStorage implementation for persistence tests in Node. */
export function installMemoryStorage(): Storage {
  const data = new Map<string, string>()
  const storage = {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => void data.delete(key),
    setItem: (key: string, value: string) => void data.set(key, String(value)),
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
  return storage as Storage
}
