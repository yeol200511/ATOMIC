import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ElementData } from '@/types'
import { DIFFICULTY_MAX, DIFFICULTY_META } from '@/lib/elements'
import { MODE_META } from '@/lib/quiz'
import { useCountdown } from '@/hooks/useCountdown'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useGameStore } from '@/store/useGameStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PeriodicTable } from '@/components/periodic/PeriodicTable'
import { CategoryLegend } from '@/components/periodic/CategoryLegend'
import type { CellState } from '@/components/periodic/ElementCell'
import { GameHUD } from './GameHUD'
import { QuestionPanel } from './QuestionPanel'

const FEEDBACK_DELAY_CORRECT = 1000
const FEEDBACK_DELAY_WRONG = 2400

export function GameScreen() {
  const game = useGameStore()
  const setView = useUiStore((s) => s.setView)
  const [confirmExit, setConfirmExit] = useState(false)

  const question = game.questions[game.index] ?? null
  const total = game.config.length === 'endless' ? null : game.questions.length
  const correctCount = game.answers.filter((a) => a.correct).length
  const playing = game.status === 'playing'

  const { remaining, ratio } = useCountdown(
    game.questionStartedAt,
    game.limitMs,
    playing && game.config.timeLimit,
    game.timeout,
  )

  /* 정답/오답 후 자동으로 다음 문제로 */
  useEffect(() => {
    if (game.status !== 'feedback') return
    const delay = game.feedback?.correct ? FEEDBACK_DELAY_CORRECT : FEEDBACK_DELAY_WRONG
    const timer = window.setTimeout(() => useGameStore.getState().next(), delay)
    return () => window.clearTimeout(timer)
  }, [game.status, game.feedback?.correct, game.index])

  /* 게임이 끝나면 결과 화면으로 */
  useEffect(() => {
    if (game.status === 'finished') setView('result')
  }, [game.status, setView])

  const handleCell = useCallback(
    (element: ElementData) => {
      if (game.status !== 'playing' || question?.format !== 'cell') return
      game.submit(String(element.number))
    },
    [game, question],
  )

  const handleChoiceKey = useCallback(
    (slot: number) => {
      if (game.status !== 'playing' || !question?.choices) return
      const num = question.choices[slot]
      if (num !== undefined) game.submit(String(num))
    },
    [game, question],
  )

  useKeyboardShortcuts({
    escape: () => {
      if (game.status === 'paused') game.resume()
      else if (game.status === 'playing') game.pause()
    },
    ' ': () => {
      if (game.status === 'feedback') game.next()
    },
    '1': () => handleChoiceKey(0),
    '2': () => handleChoiceKey(1),
    '3': () => handleChoiceKey(2),
    '4': () => handleChoiceKey(3),
  })

  /* 주기율표 셀 상태 */
  const cellStates = useMemo(() => {
    const states: Record<number, CellState> = {}
    const feedback = game.feedback
    if (feedback) {
      states[feedback.element.number] = feedback.correct ? 'correct' : 'target'
      const picked = Number(feedback.input)
      if (!feedback.correct && Number.isFinite(picked) && picked > 0 && picked !== feedback.element.number) {
        states[picked] = 'wrong'
      }
    }
    return states
  }, [game.feedback])

  const revealed = useMemo(
    () => new Set(game.answers.map((a) => a.elementNumber)),
    [game.answers],
  )

  if (!question) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="panel p-6 text-center">
          <p className="mb-3 text-sm text-dim">진행 중인 게임이 없습니다.</p>
          <Button variant="primary" onClick={() => setView('menu')}>
            메인으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        {/* 좌: 주기율표 */}
        <section className="panel order-2 p-3 sm:p-4 lg:order-1">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold">
              주기율표
              <span className="ml-2 text-xs font-normal text-dim">
                {DIFFICULTY_META[game.config.difficulty].range}
              </span>
            </h2>
            <span className="text-[11px] text-faint">
              {question.format === 'cell'
                ? '정답이라고 생각하는 칸을 클릭하세요'
                : '푼 원소는 하나씩 공개됩니다'}
            </span>
          </header>

          <PeriodicTable
            blank
            revealed={revealed}
            states={cellStates}
            interactive={question.format === 'cell' && playing}
            maxNumber={DIFFICULTY_MAX[game.config.difficulty]}
            onSelect={handleCell}
            minWidth={640}
          />

          <div className="mt-3 border-t pt-3 divider">
            <CategoryLegend compact />
          </div>
        </section>

        {/* 우: 문제 + HUD */}
        <section className="order-1 space-y-3 lg:order-2">
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-dim">
                {MODE_META[game.config.mode].title}
                {game.config.review && ' · 복습'}
              </span>
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => game.pause()} disabled={!playing}>
                  ⏸ 일시정지
                </Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmExit(true)}>
                  종료
                </Button>
              </div>
            </div>
            <GameHUD
              score={game.score}
              combo={game.combo}
              maxCombo={game.maxCombo}
              index={game.index}
              total={total}
              correctCount={correctCount}
              timeLimit={game.config.timeLimit}
              remainingMs={remaining}
              timeRatio={ratio}
            />
          </div>

          <QuestionPanel
            key={question.id}
            question={question}
            feedback={game.feedback}
            locked={game.status !== 'playing'}
            onSubmit={game.submit}
            onNext={game.next}
            confettiTrigger={game.comboFlash}
          />
        </section>
      </div>

      {/* 일시정지 */}
      <Modal
        open={game.status === 'paused'}
        onClose={() => game.resume()}
        title="일시정지"
        subtitle="타이머도 함께 멈춰 있습니다."
        size="sm"
      >
        <div className="space-y-2">
          <Button variant="primary" full onClick={() => game.resume()}>
            ▶ 이어서 하기
          </Button>
          <Button
            full
            variant="danger"
            onClick={() => {
              game.finish()
            }}
          >
            여기서 끝내고 결과 보기
          </Button>
        </div>
      </Modal>

      {/* 종료 확인 */}
      <Modal
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        title="게임을 끝낼까요?"
        subtitle="지금까지 푼 문제까지만 기록에 저장됩니다."
        size="sm"
      >
        <div className="space-y-2">
          <Button
            variant="primary"
            full
            onClick={() => {
              setConfirmExit(false)
              game.finish()
            }}
          >
            결과 보기
          </Button>
          <Button full onClick={() => setConfirmExit(false)}>
            계속 풀기
          </Button>
        </div>
      </Modal>
    </div>
  )
}
