import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Feedback, Question } from '@/types'
import { getElement } from '@/lib/elements'
import { MODE_META } from '@/lib/quiz'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/store/useSettingsStore'
import { BohrModel } from '@/components/bohr/BohrModel'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'

interface QuestionPanelProps {
  question: Question
  feedback: Feedback | null
  locked: boolean
  onSubmit: (input: string) => void
  onNext: () => void
  confettiTrigger: number
}

export function QuestionPanel({
  question,
  feedback,
  locked,
  onSubmit,
  onNext,
  confettiTrigger,
}: QuestionPanelProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const showHints = useSettingsStore((s) => s.showHints)
  const meta = MODE_META[question.kind]

  useEffect(() => {
    setValue('')
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(timer)
  }, [question.id])

  const submit = () => {
    if (locked) return
    if (question.format === 'number' || question.format === 'text') {
      if (!value.trim()) return
      onSubmit(value.trim())
    }
  }

  const wrong = feedback && !feedback.correct

  return (
    <motion.div
      key={question.id}
      className={cn('panel relative overflow-hidden p-5', wrong && 'animate-shake-x')}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
    >
      <Confetti trigger={confettiTrigger} power={feedback?.combo && feedback.combo > 5 ? 1.4 : 1} />

      <div className="mb-3 flex items-center justify-between">
        <span className="chip">
          {meta.icon} {meta.title}
        </span>
        <span className="text-[11px] text-faint">{question.title}</span>
      </div>

      {/* 제시부 */}
      <div className="mb-5 flex min-h-[132px] flex-col items-center justify-center text-center">
        {question.kind === 'bohr' ? (
          <BohrModel
            element={question.element}
            size={200}
            hideIdentity={!feedback}
            showShellLabels
          />
        ) : (
          <>
            <motion.p
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'font-black leading-none',
                question.prompt.length > 6 ? 'text-4xl' : 'text-6xl',
              )}
            >
              {question.prompt}
            </motion.p>
            {showHints && question.promptSub && (
              <p className="mt-2 text-sm text-dim">{question.promptSub}</p>
            )}
          </>
        )}
      </div>

      {/* 입력부 */}
      {question.format === 'cell' && (
        <p className="rounded-xl border border-dashed py-3 text-center text-sm text-dim divider">
          주기율표에서 해당 칸을 눌러 주세요
        </p>
      )}

      {(question.format === 'number' || question.format === 'text') && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="input-lab flex-1 text-center text-lg font-semibold"
            inputMode={question.format === 'number' ? 'numeric' : 'text'}
            type="text"
            value={value}
            disabled={locked}
            placeholder={question.placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="정답 입력"
          />
          <Button variant="primary" onClick={submit} disabled={locked || !value.trim()}>
            제출
          </Button>
        </div>
      )}

      {question.format === 'choice' && question.choices && (
        <div className="grid grid-cols-2 gap-2">
          {question.choices.map((num, i) => {
            const el = getElement(num)
            if (!el) return null
            const isAnswer = feedback && num === question.element.number
            const isPicked = feedback && feedback.input === String(num)
            return (
              <Button
                key={num}
                disabled={locked}
                onClick={() => onSubmit(String(num))}
                className={cn(
                  'justify-between !py-3',
                  isAnswer && '!border-emerald-400/70 !bg-emerald-500/20',
                  isPicked && !isAnswer && '!border-rose-400/70 !bg-rose-500/20',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {el.name}
                </span>
                <span className="text-xs text-dim">{el.symbol}</span>
              </Button>
            )
          })}
        </div>
      )}

      {/* 피드백 */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'mt-4 rounded-xl border p-3 text-center',
              feedback.correct
                ? 'border-emerald-400/50 bg-emerald-500/12'
                : 'border-rose-400/50 bg-rose-500/12',
            )}
          >
            <p
              className={cn(
                'text-base font-bold',
                feedback.correct ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {feedback.correct
                ? `정답! +${feedback.gained}점${feedback.combo >= 3 ? ` · ${feedback.combo}콤보` : ''}`
                : feedback.timedOut
                  ? '시간 초과!'
                  : '아쉽습니다'}
            </p>
            <p className="mt-1 text-sm text-dim">
              <span className="font-semibold text-[color:var(--text)]">
                {feedback.element.number}. {feedback.element.name} ({feedback.element.symbol})
              </span>
              {' — '}
              {question.answerText}
            </p>
            <Button size="sm" variant="primary" className="mt-3" onClick={onNext}>
              다음 문제 <span className="text-[10px] opacity-70">Space</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
