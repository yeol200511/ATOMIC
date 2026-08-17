import { motion } from 'framer-motion'
import type { QuizMode } from '@/types'
import { MODE_META } from '@/lib/quiz'
import { audio } from '@/lib/audio'
import { cn } from '@/lib/utils'

interface ModeCardProps {
  mode: QuizMode
  selected: boolean
  onSelect: (mode: QuizMode) => void
  index: number
}

export function ModeCard({ mode, selected, onSelect, index }: ModeCardProps) {
  const meta = MODE_META[mode]
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.28, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        audio.play('click')
        onSelect(mode)
      }}
      className={cn(
        'panel-soft group relative overflow-hidden p-4 text-left transition-colors',
        selected ? 'border-transparent' : 'hover:border-[color:var(--border-strong)]',
      )}
      style={
        selected
          ? { boxShadow: `0 0 0 2px ${meta.accent}, 0 16px 40px -22px ${meta.accent}` }
          : undefined
      }
    >
      <span
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
        style={{ background: meta.accent }}
      />
      <span className="relative flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
          style={{ background: `linear-gradient(150deg, ${meta.accent}, ${meta.accent}99)` }}
        >
          {meta.icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold">{meta.title}</span>
          <span className="mt-0.5 block text-xs leading-snug text-dim">{meta.description}</span>
        </span>
      </span>
      {selected && (
        <motion.span
          layoutId="mode-selected-dot"
          className="absolute right-3 top-3 h-2 w-2 rounded-full"
          style={{ background: meta.accent }}
        />
      )}
    </motion.button>
  )
}
