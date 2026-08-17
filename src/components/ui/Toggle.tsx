import { motion } from 'framer-motion'
import { audio } from '@/lib/audio'
import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
  icon?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, icon, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        audio.play('click')
        onChange(!checked)
      }}
      className={cn(
        'panel-soft flex w-full items-center gap-3 px-4 py-3 text-left transition',
        'hover:border-[color:var(--border-strong)] disabled:opacity-50',
      )}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-dim">{description}</span>}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-sky-500' : 'bg-slate-600/60',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{ left: checked ? 22 : 2 }}
        />
      </span>
    </button>
  )
}
