import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useProgressStore } from '@/store/useProgressStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'

export function DailyMissions() {
  const daily = useProgressStore((s) => s.daily)
  const ensureDaily = useProgressStore((s) => s.ensureDaily)

  useEffect(() => {
    ensureDaily()
  }, [ensureDaily])

  const doneCount = daily.missions.filter((m) => m.done).length

  return (
    <section className="panel p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          📅 오늘의 도전과제
          <span className="chip">{doneCount}/{daily.missions.length}</span>
        </h2>
        <span className="text-[11px] text-faint num-display">{daily.date}</span>
      </header>

      <ul className="space-y-2.5">
        {daily.missions.map((mission, i) => (
          <motion.li
            key={mission.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              'panel-soft px-3 py-2.5 transition',
              mission.done && 'border-emerald-400/40 bg-emerald-400/10',
            )}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className={cn('text-xs font-semibold', mission.done && 'text-emerald-300')}>
                {mission.done ? '✔ ' : ''}
                {mission.label}
              </span>
              <span className="shrink-0 text-[10px] font-bold text-accent">+{mission.xp} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <ProgressBar
                value={mission.progress}
                max={mission.target}
                tone={mission.done ? 'good' : 'accent'}
                className="h-1.5 flex-1"
              />
              <span className="w-16 shrink-0 text-right text-[10px] text-faint num-display">
                {Math.min(mission.progress, mission.target)}/{mission.target}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        도전과제는 매일 0시에 새로 배정됩니다. 완료하면 경험치를 바로 받습니다.
      </p>
    </section>
  )
}
