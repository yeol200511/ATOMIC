import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuizMode } from '@/types'
import { CATEGORIES } from '@/data/categories'
import { getElement } from '@/lib/elements'
import { MODE_META } from '@/lib/quiz'
import { formatDate } from '@/lib/utils'
import { useGameStore } from '@/store/useGameStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

const REVIEW_MODES: { value: QuizMode; label: string }[] = [
  { value: 'random', label: '종합' },
  { value: 'position', label: '위치' },
  { value: 'name', label: '이름' },
  { value: 'symbol', label: '기호' },
]

export function WrongNoteScreen() {
  const wrongNotes = useProgressStore((s) => s.wrongNotes)
  const removeWrongNote = useProgressStore((s) => s.removeWrongNote)
  const clearWrongNotes = useProgressStore((s) => s.clearWrongNotes)
  const startReview = useGameStore((s) => s.startReview)
  const setView = useUiStore((s) => s.setView)
  const showDetail = useUiStore((s) => s.showDetail)
  const timeLimit = useSettingsStore((s) => s.timeLimit)
  const [reviewMode, setReviewMode] = useState<QuizMode>('random')
  const [confirmClear, setConfirmClear] = useState(false)

  const notes = useMemo(
    () =>
      Object.values(wrongNotes)
        .sort((a, b) => b.wrong - a.wrong || b.lastAt - a.lastAt)
        .flatMap((note) => {
          const element = getElement(note.number)
          return element ? [{ note, element }] : []
        }),
    [wrongNotes],
  )

  const startAll = () => {
    if (notes.length === 0) return
    startReview(
      notes.map((row) => row.note.number),
      reviewMode,
      timeLimit,
    )
    setView('game')
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-3 py-5 sm:px-5">
      <header className="mb-4">
        <h1 className="text-2xl font-black">오답노트</h1>
        <p className="mt-1 text-sm text-dim">
          틀린 원소가 자동으로 모입니다. 두 번 맞히면 노트에서 사라집니다.
        </p>
      </header>

      {notes.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="mb-1 text-3xl">🧹</p>
          <p className="text-sm font-semibold">오답노트가 비어 있습니다.</p>
          <p className="mt-1 text-xs text-dim">
            문제를 틀리면 여기에 모아 두었다가 다시 풀 수 있습니다.
          </p>
          <Button variant="primary" className="mt-4" onClick={() => setView('menu')}>
            게임하러 가기
          </Button>
        </div>
      ) : (
        <>
          <section className="panel mb-4 p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <p className="label-xs mb-2">복습 문제 유형</p>
                <SegmentedControl
                  layoutId="review-mode-seg"
                  options={REVIEW_MODES}
                  value={reviewMode}
                  onChange={setReviewMode}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="lg" onClick={startAll}>
                  ▶ {notes.length}개 복습 시작
                </Button>
                <Button variant="danger" size="lg" onClick={() => setConfirmClear(true)}>
                  전체 비우기
                </Button>
              </div>
            </div>
          </section>

          <ul className="grid gap-2 sm:grid-cols-2">
            {notes.map(({ note, element }, i) => {
              const meta = CATEGORIES[element.category]
              return (
                <motion.li
                  key={note.number}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.35) }}
                  className="panel-soft flex items-center gap-3 px-3 py-3"
                >
                  <button
                    onClick={() => showDetail(element.number)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: `linear-gradient(150deg, ${meta.color}, ${meta.color}88)` }}
                    aria-label={`${element.name} 상세 정보`}
                  >
                    {element.symbol}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {element.number}. {element.name}
                    </p>
                    <p className="text-[11px] text-faint">
                      {note.kinds.map((k) => MODE_META[k].short).join(' · ')} · 틀림 {note.wrong}회
                      {note.correct > 0 && ` · 복습 정답 ${note.correct}회`} · {formatDate(note.lastAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        startReview([note.number], reviewMode, timeLimit)
                        setView('game')
                      }}
                    >
                      풀기
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => removeWrongNote(note.number)}>
                      제거
                    </Button>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        </>
      )}

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="오답노트를 모두 비울까요?"
        subtitle="지운 기록은 되돌릴 수 없습니다."
        size="sm"
      >
        <div className="space-y-2">
          <Button
            variant="danger"
            full
            onClick={() => {
              clearWrongNotes()
              setConfirmClear(false)
            }}
          >
            전부 비우기
          </Button>
          <Button full onClick={() => setConfirmClear(false)}>
            그대로 두기
          </Button>
        </div>
      </Modal>
    </div>
  )
}
