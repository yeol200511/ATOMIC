import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ACHIEVEMENT_MAP } from '@/lib/achievements'
import { DIFFICULTY_META, getElement } from '@/lib/elements'
import { MODE_META } from '@/lib/quiz'
import { levelInfo, levelTitle } from '@/lib/scoring'
import { cn, formatDuration, formatMs, percent } from '@/lib/utils'
import { useGameStore } from '@/store/useGameStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function ResultScreen() {
  const game = useGameStore()
  const setView = useUiStore((s) => s.setView)
  const showDetail = useUiStore((s) => s.showDetail)
  const pushToast = useUiStore((s) => s.pushToast)
  const xp = useProgressStore((s) => s.xp)
  const settings = useSettingsStore()
  const info = levelInfo(xp)

  const answers = game.answers
  const total = answers.length
  const correct = answers.filter((a) => a.correct).length
  const accuracy = percent(correct, total)
  const avgMs = total > 0 ? Math.round(answers.reduce((s, a) => s + a.elapsedMs, 0) / total) : 0
  const wrongList = useMemo(() => answers.filter((a) => !a.correct), [answers])
  const outcome = game.outcome

  useEffect(() => {
    outcome?.unlocked.forEach((id, i) => {
      const def = ACHIEVEMENT_MAP.get(id)
      if (!def) return
      window.setTimeout(() => {
        pushToast({ icon: def.icon, title: `업적 달성 · ${def.title}`, description: def.description })
      }, 500 + i * 700)
    })
  }, [outcome, pushToast])

  const replay = () => {
    game.start({
      mode: settings.mode,
      difficulty: settings.difficulty,
      length: settings.length,
      timeLimit: settings.timeLimit,
      review: false,
    })
    setView('game')
  }

  const reviewWrong = () => {
    const numbers = Array.from(new Set(wrongList.map((a) => a.elementNumber)))
    if (numbers.length === 0) return
    game.startReview(numbers, settings.mode, false)
    setView('game')
  }

  if (total === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4">
        <div className="panel w-full p-6 text-center">
          <p className="mb-4 text-sm text-dim">푼 문제가 없어 기록이 저장되지 않았습니다.</p>
          <Button variant="primary" full onClick={() => setView('menu')}>
            메인으로
          </Button>
        </div>
      </div>
    )
  }

  const grade =
    accuracy >= 95 ? 'S' : accuracy >= 85 ? 'A' : accuracy >= 70 ? 'B' : accuracy >= 50 ? 'C' : 'D'
  const gradeColor =
    grade === 'S'
      ? 'from-amber-300 to-orange-500'
      : grade === 'A'
        ? 'from-sky-300 to-blue-500'
        : grade === 'B'
          ? 'from-emerald-300 to-teal-500'
          : grade === 'C'
            ? 'from-slate-300 to-slate-500'
            : 'from-rose-300 to-rose-500'

  return (
    <div className="mx-auto w-full max-w-[1100px] px-3 py-5 sm:px-5">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel relative mb-4 overflow-hidden p-6 text-center"
      >
        <Confetti trigger={accuracy >= 70 ? 1 : 0} count={40} power={1.6} />
        <p className="label-xs mb-1">
          {MODE_META[game.config.mode].title} · {DIFFICULTY_META[game.config.difficulty].label} ·{' '}
          {game.config.length === 'endless' ? '무한모드' : `${total}문제`}
          {game.config.review && ' · 복습'}
        </p>

        <motion.div
          initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
          className={cn(
            'mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-5xl font-black text-white shadow-glow-lg',
            gradeColor,
          )}
        >
          {grade}
        </motion.div>

        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-black num-display"
        >
          {game.score.toLocaleString()}
          <span className="ml-1 text-lg font-bold text-dim">점</span>
        </motion.p>

        {(outcome?.newBestScore || outcome?.newBestCombo) && (
          <p className="mt-2 text-sm font-bold text-amber-300">
            🎉 {outcome.newBestScore ? '최고 점수 경신!' : ''}{' '}
            {outcome.newBestCombo ? '최고 콤보 경신!' : ''}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2 text-left sm:grid-cols-4">
          <Metric label="정답률" value={`${accuracy}%`} sub={`${correct}/${total}개`} />
          <Metric label="최고 콤보" value={`${game.maxCombo}`} sub="연속 정답" />
          <Metric label="평균 응답" value={formatMs(avgMs)} sub="문제당" />
          <Metric
            label="플레이 시간"
            value={formatDuration(Math.max(0, game.finishedAt - game.startedAt))}
            sub="총 소요"
          />
        </div>
      </motion.section>

      {/* 경험치 */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="panel mb-4 p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">
            경험치
            <span className="ml-2 text-xs font-normal text-accent">
              +{(outcome?.xpGained ?? 0) + (outcome?.missionXp ?? 0)} XP
              {outcome?.missionXp ? ` (과제 +${outcome.missionXp})` : ''}
            </span>
          </h2>
          <motion.span
            key={info.level}
            initial={outcome?.leveledUp ? { scale: 1.9 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="text-sm font-black text-accent"
          >
            Lv.{info.level} · {levelTitle(info.level)}
          </motion.span>
        </div>
        <ProgressBar value={info.current} max={info.needed} />
        <p className="mt-1.5 text-right text-[11px] text-faint num-display">
          {info.current} / {info.needed} XP
        </p>
        {outcome?.leveledUp && (
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.35 }}
            className="mt-2 text-center text-base font-black text-amber-300"
          >
            ⬆ 레벨 업! {outcome.levelBefore} → {outcome.levelAfter}
          </motion.p>
        )}
      </motion.section>

      {/* 오답 복습 */}
      <section className="panel mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">
            틀린 문제 {wrongList.length}개
            <span className="ml-2 text-xs font-normal text-dim">원소를 누르면 상세 정보</span>
          </h2>
          {wrongList.length > 0 && (
            <Button size="sm" variant="primary" onClick={reviewWrong}>
              틀린 것만 다시 풀기
            </Button>
          )}
        </div>

        {wrongList.length === 0 ? (
          <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 py-4 text-center text-sm font-semibold text-emerald-300">
            전부 정답입니다. 완벽해요! 💯
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {wrongList.map((answer, i) => {
              const el = getElement(answer.elementNumber)
              if (!el) return null
              return (
                <motion.li
                  key={`${answer.questionId}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <button
                    onClick={() => showDetail(el.number)}
                    className="panel-soft flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:border-[color:var(--border-strong)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-sm font-bold text-rose-300">
                      {el.symbol}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {el.number}. {el.name}
                      </span>
                      <span className="block text-[11px] text-faint">
                        {MODE_META[answer.kind].short} 문제 ·{' '}
                        {answer.timedOut ? '시간 초과' : `입력: ${answer.input || '없음'}`}
                      </span>
                    </span>
                  </button>
                </motion.li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button variant="primary" size="lg" onClick={replay}>
          ↻ 한 판 더
        </Button>
        <Button size="lg" onClick={() => setView('stats')}>
          📊 기록 보기
        </Button>
        <Button size="lg" onClick={() => setView('menu')}>
          ⌂ 메인으로
        </Button>
      </div>
    </div>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="stat-tile">
      <span className="label-xs">{label}</span>
      <span className="text-xl font-black leading-none num-display">{value}</span>
      <span className="text-[10px] text-faint">{sub}</span>
    </div>
  )
}
