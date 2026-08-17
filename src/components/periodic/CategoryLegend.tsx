import type { CategoryKey } from '@/types'
import { CATEGORIES, CATEGORY_ORDER } from '@/data/categories'
import { cn } from '@/lib/utils'

interface CategoryLegendProps {
  active?: CategoryKey | null
  onSelect?: (key: CategoryKey | null) => void
  className?: string
  compact?: boolean
}

export function CategoryLegend({ active, onSelect, className, compact }: CategoryLegendProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {CATEGORY_ORDER.map((key) => {
        const meta = CATEGORIES[key]
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(isActive ? null : key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
              onSelect ? 'cursor-pointer hover:border-[color:var(--border-strong)]' : 'cursor-default',
              isActive ? 'border-transparent text-white' : 'border-[color:var(--border)] text-dim',
              compact && 'px-2 py-0.5 text-[10px]',
            )}
            style={isActive ? { background: meta.color } : undefined}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: isActive ? '#fff' : meta.color }}
            />
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
