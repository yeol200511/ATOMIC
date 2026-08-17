import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { CategoryKey } from '@/types'
import { CATEGORIES, STATE_LABEL } from '@/data/categories'
import { ELEMENTS, searchElements } from '@/lib/elements'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useProgressStore } from '@/store/useProgressStore'
import { useUiStore } from '@/store/useUiStore'
import { CategoryLegend } from '@/components/periodic/CategoryLegend'
import { PeriodicTable } from '@/components/periodic/PeriodicTable'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function ExplorerScreen() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryKey | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const showDetail = useUiStore((s) => s.showDetail)
  const viewedCount = useProgressStore((s) => s.viewedElements.length)

  useKeyboardShortcuts({
    '/': () => inputRef.current?.focus(),
  })

  const results = useMemo(() => {
    const base = query.trim() ? searchElements(query) : ELEMENTS
    return category ? base.filter((el) => el.category === category) : base
  }, [query, category])

  const highlighted = useMemo(() => {
    if (!query.trim() && !category) return {}
    const map: Record<number, 'target'> = {}
    results.forEach((el) => {
      map[el.number] = 'target'
    })
    return map
  }, [results, query, category])

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-5 sm:px-5">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">원소 도감</h1>
          <p className="mt-1 text-sm text-dim">
            원소를 눌러 상세 정보와 보어 모형을 확인하세요. 지금까지 {viewedCount}개 살펴봤습니다.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 · 기호 · 번호로 검색  ( / )"
            className="input-lab sm:w-72"
            aria-label="원소 검색"
          />
          {query && (
            <Button size="sm" onClick={() => setQuery('')}>
              지우기
            </Button>
          )}
        </div>
      </header>

      <section className="panel mb-4 p-3 sm:p-4">
        <CategoryLegend active={category} onSelect={setCategory} className="mb-3" />
        <PeriodicTable
          interactive
          states={highlighted}
          onSelect={(el) => showDetail(el.number)}
          minWidth={680}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold">
          검색 결과 <span className="text-dim">{results.length}개</span>
        </h2>
        {results.length === 0 ? (
          <p className="panel p-6 text-center text-sm text-dim">
            조건에 맞는 원소가 없습니다. 다른 이름이나 기호로 찾아보세요.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {results.map((el, i) => {
              const meta = CATEGORIES[el.category]
              return (
                <motion.li
                  key={el.number}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.012, 0.4) }}
                >
                  <button
                    onClick={() => showDetail(el.number)}
                    className={cn(
                      'panel-soft flex w-full items-center gap-3 px-3 py-2.5 text-left transition',
                      'hover:border-[color:var(--border-strong)] hover:shadow-glow',
                    )}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ background: `linear-gradient(150deg, ${meta.color}, ${meta.color}88)` }}
                    >
                      {el.symbol}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{el.name}</span>
                      <span className="block truncate text-[11px] text-faint">
                        {el.number}번 · {STATE_LABEL[el.state]}
                      </span>
                    </span>
                  </button>
                </motion.li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
