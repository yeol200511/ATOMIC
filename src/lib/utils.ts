import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Fisher–Yates 셔플 (원본을 건드리지 않는다) */
export function shuffle<T>(items: readonly T[], rand: () => number = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function pick<T>(items: readonly T[], rand: () => number = Math.random): T {
  return items[Math.floor(rand() * items.length)]
}

export function sampleUnique<T>(items: readonly T[], count: number, rand: () => number = Math.random): T[] {
  return shuffle(items, rand).slice(0, Math.min(count, items.length))
}

/** 날짜 문자열(YYYY-MM-DD)로 결정되는 시드 난수 — 일일 도전과제용 */
export function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function todayKey(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0.0초'
  return `${(ms / 1000).toFixed(1)}초`
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}분 ${String(s).padStart(2, '0')}초`
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (sameDay) return `오늘 ${time}`
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** 입력 정규화 — 공백·대소문자·중간점 등을 무시하고 비교하기 위한 형태로 */
export function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s·．.\-_'"()]/g, '')
}
