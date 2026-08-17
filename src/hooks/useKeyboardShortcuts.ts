import { useEffect, useRef } from 'react'

export interface ShortcutHandlers {
  [key: string]: (event: KeyboardEvent) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

/**
 * 전역 키보드 단축키.
 * key 는 소문자로 비교하며, 앞에 `!` 를 붙이면 입력창 안에서도 동작한다.
 * 예: { 'escape': fn, '!enter': fn, '1': fn }
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key.toLowerCase()
      const typing = isTypingTarget(event.target)

      const always = ref.current[`!${key}`]
      if (always) {
        always(event)
        return
      }
      if (typing) return
      const handler = ref.current[key]
      if (handler) {
        event.preventDefault()
        handler(event)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
