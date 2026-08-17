import { motion } from 'framer-motion'
import { evaluateAchievements } from '@/lib/achievements'
import { formatDate, percent } from '@/lib/utils'
import { useProgressStore } from '@/store/useProgressStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'

export function AchievementsScreen() {
  // 여러 지표를 한꺼번에 쓰므로 스토어 전체를 구독한다
  const progress = useProgressStore()
  const list = evaluateAchievements(progress.stats(), progress.achievements)
  const unlockedCount = list.filter((item) => item.unlocked).length

  return (
    <div className="mx-auto w-full max-w-[1100px] px-3 py-5 sm:px-5">
      <header className="mb-4">
        <h1 className="text-2xl font-black">업적</h1>
        <p className="mt-1 text-sm text-dim">
          {list.length}개 중 {unlockedCount}개 달성 ({percent(unlockedCount, list.length)}%)
        </p>
        <ProgressBar value={unlockedCount} max={list.length} className="mt-3 h-2" tone="good" />
      </header>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((item, i) => (
          <motion.li
            key={item.def.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5) }}
            className={cn(
              'panel-soft p-4 transition',
              item.unlocked
                ? 'border-amber-300/45 bg-amber-400/8'
                : 'opacity-75 hover:opacity-100',
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl',
                  item.unlocked ? 'bg-amber-400/20' : 'bg-slate-600/25 grayscale',
                )}
              >
                {item.unlocked ? item.def.icon : '🔒'}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-bold', item.unlocked && 'text-amber-200')}>
                  {item.def.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-dim">{item.def.description}</p>

                {item.goal > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar
                      value={item.value}
                      max={item.goal}
                      tone={item.unlocked ? 'good' : 'accent'}
                      className="h-1.5 flex-1"
                    />
                    <span className="shrink-0 text-[10px] text-faint num-display">
                      {item.value}/{item.goal}
                    </span>
                  </div>
                )}
                {item.unlockedAt && (
                  <p className="mt-1.5 text-[10px] text-faint">달성 {formatDate(item.unlockedAt)}</p>
                )}
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
