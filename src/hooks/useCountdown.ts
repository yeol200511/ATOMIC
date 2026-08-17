import { useEffect, useRef, useState } from 'react'

/**
 * 제한 시간 카운트다운.
 * 시작 시각과 제한 시간을 받아 남은 밀리초를 돌려주고,
 * 0 이 되는 순간 onExpire 를 정확히 한 번만 부른다.
 */
export function useCountdown(
  startedAt: number,
  limitMs: number,
  active: boolean,
  onExpire: () => void,
) {
  const [remaining, setRemaining] = useState(limitMs)
  const firedRef = useRef(false)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire

  useEffect(() => {
    firedRef.current = false
    setRemaining(limitMs)
  }, [startedAt, limitMs])

  useEffect(() => {
    if (!active || limitMs <= 0) return
    let raf = 0
    const tick = () => {
      const left = Math.max(0, startedAt + limitMs - Date.now())
      setRemaining(left)
      if (left <= 0) {
        if (!firedRef.current) {
          firedRef.current = true
          expireRef.current()
        }
        return
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [startedAt, limitMs, active])

  const ratio = limitMs > 0 ? remaining / limitMs : 1
  return { remaining, ratio }
}
