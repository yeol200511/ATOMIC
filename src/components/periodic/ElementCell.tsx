import { memo } from 'react'
import { motion } from 'framer-motion'
import type { ElementData } from '@/types'
import { CATEGORIES } from '@/data/categories'
import { cn } from '@/lib/utils'

export type CellState = 'default' | 'correct' | 'wrong' | 'target' | 'dim'

interface ElementCellProps {
  element: ElementData
  state?: CellState
  /** 기호를 감춘 빈 주기율표 */
  blank?: boolean
  interactive?: boolean
  showName?: boolean
  onSelect?: (element: ElementData) => void
}

function ElementCellBase({
  element,
  state = 'default',
  blank = false,
  interactive = false,
  showName = true,
  onSelect,
}: ElementCellProps) {
  const meta = CATEGORIES[element.category]
  const hidden = blank && state === 'default'

  // 감춰진 칸은 이름을 읽어 주지 않는다 — 위치 맞추기 문제의 정답이 새어 나간다.
  // 마우스 툴팁(title)은 어느 칸에서도 띄우지 않는다. 기호가 이미 보이고, 누르면 상세가 열린다.
  const label = hidden
    ? element.group === null
      ? `${element.period}주기 빈 칸`
      : `${element.period}주기 ${element.group}족 빈 칸`
    : `${element.number}번 ${element.name}`

  const stateStyle: Record<CellState, string> = {
    default: '',
    correct: 'ring-2 ring-emerald-400 z-10',
    wrong: 'ring-2 ring-rose-400 z-10',
    target: 'ring-2 ring-sky-300 z-10',
    dim: 'opacity-30',
  }

  const background =
    state === 'correct'
      ? 'linear-gradient(160deg, #10b981, #047857)'
      : state === 'wrong'
        ? 'linear-gradient(160deg, #f43f5e, #9f1239)'
        : hidden
          ? 'linear-gradient(160deg, rgba(148,163,184,0.14), rgba(71,85,105,0.14))'
          : `linear-gradient(160deg, ${meta.color}dd, ${meta.color}88)`

  return (
    <motion.button
      type="button"
      disabled={!interactive}
      onClick={() => onSelect?.(element)}
      aria-label={label}
      whileHover={interactive ? { scale: 1.14, zIndex: 20 } : undefined}
      whileTap={interactive ? { scale: 0.94 } : undefined}
      animate={
        state === 'target'
          ? { scale: [1, 1.12, 1], transition: { repeat: Infinity, duration: 1.1 } }
          : { scale: 1 }
      }
      className={cn(
        'relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-[4px]',
        'border border-white/10 text-white transition-shadow',
        interactive && 'cursor-pointer hover:shadow-glow',
        !interactive && 'cursor-default',
        stateStyle[state],
      )}
      style={{ background }}
    >
      <span className="absolute left-[3px] top-[1px] text-[6px] font-semibold leading-none opacity-80 sm:text-[7px]">
        {element.number}
      </span>
      {!hidden && (
        <>
          <span className="text-[10px] font-bold leading-none sm:text-[13px]">{element.symbol}</span>
          {showName && (
            <span className="mt-[1px] hidden max-w-full truncate px-[2px] text-[6.5px] leading-none opacity-85 lg:block">
              {element.name}
            </span>
          )}
        </>
      )}
      {hidden && <span className="text-[11px] font-bold opacity-40">·</span>}
    </motion.button>
  )
}

export const ElementCell = memo(ElementCellBase)
