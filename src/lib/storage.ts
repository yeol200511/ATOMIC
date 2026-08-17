/**
 * LocalStorage 안전 래퍼.
 * 시크릿 모드·용량 초과·저장소 차단 환경에서도 게임이 죽지 않게 감싼다.
 */

const memory = new Map<string, string>()

let available: boolean | null = null

function canUseLocalStorage(): boolean {
  if (available !== null) return available
  try {
    const probe = '__atomic_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    available = true
  } catch {
    available = false
  }
  return available
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (canUseLocalStorage()) {
      try {
        return window.localStorage.getItem(key)
      } catch {
        /* 아래 메모리 폴백 */
      }
    }
    return memory.get(key) ?? null
  },
  setItem(key: string, value: string): void {
    if (canUseLocalStorage()) {
      try {
        window.localStorage.setItem(key, value)
        return
      } catch {
        /* 아래 메모리 폴백 */
      }
    }
    memory.set(key, value)
  },
  removeItem(key: string): void {
    if (canUseLocalStorage()) {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* 무시 */
      }
    }
    memory.delete(key)
  },
}

export const STORAGE_KEYS = {
  settings: 'atomic.settings.v1',
  progress: 'atomic.progress.v1',
} as const

/** 저장된 진행도 전체 삭제 */
export function wipeSavedData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => safeStorage.removeItem(key))
}
