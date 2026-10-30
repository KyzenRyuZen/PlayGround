export type ToastKind = 'info' | 'success' | 'error' | 'loot' | 'level'

export interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

let seq = 0
let listeners: ((item: ToastItem) => void)[] = []

export function toast(message: string, kind: ToastKind = 'info'): void {
  const item: ToastItem = { id: ++seq, message, kind }
  for (const listener of listeners) listener(item)
}

export function subscribeToasts(listener: (item: ToastItem) => void): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}K`
  return formatNumber(value)
}

export function timeLeft(until: number, now = Date.now()): string {
  const diff = Math.max(0, until - now)
  if (diff <= 0) return 'expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  const s = Math.floor((diff % 60000) / 1000)
  return `${m}m ${s}s`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
