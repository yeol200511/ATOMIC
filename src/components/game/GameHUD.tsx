import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn, formatMs } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface GameHUDProps {
  score: number
  combo: number
  maxCombo: number
  index: number
  total: number | null
  correctCount: number
  timeLimit: boolean
  remainingMs: number
  timeRatio: number
}

function useAnimatedNumber(value: number, duration = 420) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    const from = display
    if (from === value) return
    const startedAt = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // display 를 의존성에 넣으면 매 프레임 재시작한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])
  return display
}

export function GameHUD({
  score,
  combo,
  maxCombo,
  index,
  total,
  correctCount,
  timeLimit,
  remainingMs,
  timeRatio,
}: GameHUDProps) {
  const shownScore = useAnimatedNumber(score)
  const hot = combo >= 3
  const timeTone = timeRatio > 0.5 ? 'accent' : timeRatio > 0.25 ? 'warn' : 'bad'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="stat-tile">
          <span className="label-xs">점수</span>
          <span className="text-2xl font-black leading-none num-display">
            {shownScore.toLocaleString()}
          </span>
        </div>

        <div
          className={cn('stat-tile relative overflow-hidden transition-shadow', hot && 'shadow-glow')}
          style={
            hot
              ? {
                  borderColor: 'rgba(250,204,21,0.55)',
                  background:
                    'linear-gradient(150deg, rgba(250,204,21,0.18), rgba(249,115,22,0.12))',
                }
              : undefined
          }
        >
          <span className="label-xs">콤보</span>
          <span className="flex items-baseline gap-1">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={combo}
                initial={{ scale: 0.5, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.4, opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className={cn(
                  'text-2xl font-black leading-none num-display',
                  hot && 'text-amber-300',
                )}
              >
                {combo}
              </motion.span>
            </AnimatePresence>
            <span className="text-[10px] text-faint">최고 {maxCombo}</span>
          </span>
          {hot && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-xl"
              animate={{ opacity: [0.15, 0.45, 0.15] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              style={{ boxShadow: 'inset 0 0 24px rgba(250,204,21,0.55)' }}
            />
          )}
        </div>

        <div className="stat-tile">
          <span className="label-xs">진행</span>
          <span className="text-2xl font-black leading-none num-display">
            {index + 1}
            <span className="text-sm font-semibold text-faint">/{total ?? '∞'}</span>
          </span>
          <span className="text-[10px] text-faint">정답 {correctCount}개</span>
        </div>
      </div>

      {total !== null && (
        <ProgressBar value={index} max={total} className="h-1.5" tone="good" />
      )}

      {timeLimit && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="label-xs">남은 시간</span>
            <span
              className={cn(
                'text-xs font-bold num-display',
                timeRatio <= 0.25 ? 'text-rose-400' : 'text-dim',
              )}
            >
              {formatMs(remainingMs)}
            </span>
          </div>
          <ProgressBar value={timeRatio} max={1} tone={timeTone} animated={false} className="h-2" />
        </div>
      )}
    </div>
  )
}
