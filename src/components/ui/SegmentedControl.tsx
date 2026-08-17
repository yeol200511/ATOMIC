import { motion } from 'framer-motion'
import { audio } from '@/lib/audio'
import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string | number> {
  value: T
  label: string
  sub?: string
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  /** 레이아웃 애니메이션 그룹을 구분하기 위한 고유 id */
  layoutId: string
  className?: string
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  layoutId,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn('panel-soft grid gap-1 p-1', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => {
              audio.play('click')
              onChange(option.value)
            }}
            className={cn(
              'relative rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors',
              active ? 'text-white' : 'text-dim hover:text-[color:var(--text)]',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-glow"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 block leading-tight">{option.label}</span>
            {option.sub && (
              <span className={cn('relative z-10 block text-[10px] font-medium', active ? 'text-white/80' : 'text-faint')}>
                {option.sub}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
