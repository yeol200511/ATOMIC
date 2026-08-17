import { useMemo } from 'react'
import type { ElementData } from '@/types'
import { ELEMENTS, TABLE_COLS } from '@/lib/elements'
import { cn } from '@/lib/utils'
import { ElementCell, type CellState } from './ElementCell'

interface PeriodicTableProps {
  /** 원자번호 → 셀 상태 */
  states?: Record<number, CellState>
  blank?: boolean
  /** blank 상태에서도 이미 공개된 원소들 */
  revealed?: ReadonlySet<number>
  interactive?: boolean
  /** 이 번호 이하만 활성화 (난이도 범위 밖은 흐리게) */
  maxNumber?: number
  onSelect?: (element: ElementData) => void
  showHeaders?: boolean
  className?: string
  minWidth?: number
}

const F_BLOCK_ROWS = [9, 10]

const EMPTY_SET: ReadonlySet<number> = new Set()

export function PeriodicTable({
  states = {},
  blank = false,
  revealed = EMPTY_SET,
  interactive = false,
  maxNumber = 118,
  onSelect,
  showHeaders = true,
  className,
  minWidth = 620,
}: PeriodicTableProps) {
  const rows = useMemo(() => {
    const map = new Map<number, ElementData[]>()
    ELEMENTS.forEach((el) => {
      const list = map.get(el.row) ?? []
      list.push(el)
      map.set(el.row, list)
    })
    return map
  }, [])

  return (
    <div className={cn('w-full overflow-x-auto pb-1', className)}>
      <div style={{ minWidth }} className="select-none">
        {showHeaders && (
          <div
            className="mb-1 grid gap-[3px]"
            style={{ gridTemplateColumns: `18px repeat(${TABLE_COLS}, minmax(0, 1fr))` }}
          >
            <span />
            {Array.from({ length: TABLE_COLS }, (_, i) => (
              <span key={i} className="text-center text-[8px] font-semibold text-faint">
                {i + 1}
              </span>
            ))}
          </div>
        )}

        {[1, 2, 3, 4, 5, 6, 7].map((row) => (
          <div
            key={row}
            className="mb-[3px] grid gap-[3px]"
            style={{
              gridTemplateColumns: showHeaders
                ? `18px repeat(${TABLE_COLS}, minmax(0, 1fr))`
                : `repeat(${TABLE_COLS}, minmax(0, 1fr))`,
            }}
          >
            {showHeaders && (
              <span className="flex items-center justify-center text-[9px] font-semibold text-faint">
                {row}
              </span>
            )}
            {(rows.get(row) ?? []).map((el) => (
              <div key={el.number} style={{ gridColumn: showHeaders ? el.col + 1 : el.col }}>
                <ElementCell
                  element={el}
                  blank={blank && !revealed.has(el.number)}
                  state={states[el.number] ?? (el.number > maxNumber ? 'dim' : 'default')}
                  interactive={interactive && el.number <= maxNumber}
                  onSelect={onSelect}
                />
              </div>
            ))}
            {/* 6·7주기의 f-블록 자리 표시 */}
            {(row === 6 || row === 7) && (
              <div
                style={{ gridColumn: showHeaders ? 4 : 3 }}
                className="flex aspect-square items-center justify-center rounded-[4px] border border-dashed border-white/15 text-[7px] text-faint"
              >
                {row === 6 ? '57-71' : '89-103'}
              </div>
            )}
          </div>
        ))}

        <div className="mt-2 space-y-[3px]">
          {F_BLOCK_ROWS.map((row) => (
            <div
              key={row}
              className="grid gap-[3px]"
              style={{
                gridTemplateColumns: showHeaders
                  ? `18px repeat(${TABLE_COLS}, minmax(0, 1fr))`
                  : `repeat(${TABLE_COLS}, minmax(0, 1fr))`,
              }}
            >
              {showHeaders && <span />}
              {(rows.get(row) ?? []).map((el) => (
                <div key={el.number} style={{ gridColumn: showHeaders ? el.col + 1 : el.col }}>
                  <ElementCell
                    element={el}
                    blank={blank}
                    state={states[el.number] ?? (el.number > maxNumber ? 'dim' : 'default')}
                    interactive={interactive && el.number <= maxNumber}
                    onSelect={onSelect}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
