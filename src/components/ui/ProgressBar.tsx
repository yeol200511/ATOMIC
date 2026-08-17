import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  /** 남은 시간이 적을 때처럼 색을 바꿔야 하는 경우 */
  tone?: 'accent' | 'good' | 'warn' | 'bad'
  animated?: boolean
}

const TONE: Record<string, string> = {
  accent: 'from-sky-400 to-blue-500',
  good: 'from-emerald-400 to-teal-500',
  warn: 'from-amber-400 to-orange-500',
  bad: 'from-rose-400 to-red-500',
}

export function ProgressBar({
  value,
  max = 1,
  className,
  barClassName,
  tone = 'accent',
  animated = true,
}: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-700/40', className)}
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={cn('h-full rounded-full bg-gradient-to-r', TONE[tone], barClassName)}
        initial={false}
        animate={{ width: `${ratio * 100}%` }}
        transition={animated ? { type: 'spring', stiffness: 220, damping: 30 } : { duration: 0 }}
      />
    </div>
  )
}
