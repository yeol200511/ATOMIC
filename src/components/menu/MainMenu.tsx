import { motion } from 'framer-motion'
import type { Difficulty, QuizMode, SessionLength } from '@/types'
import { DIFFICULTY_META } from '@/lib/elements'
import { MODE_META } from '@/lib/quiz'
import { levelInfo, levelTitle } from '@/lib/scoring'
import { formatDate, percent } from '@/lib/utils'
import { useGameStore } from '@/store/useGameStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ModeCard } from './ModeCard'
import { DailyMissions } from './DailyMissions'

const MODES: QuizMode[] = ['position', 'atomicNumber', 'name', 'bohr', 'symbol', 'random']

const DIFFICULTIES: { value: Difficulty; label: string; sub: string }[] = [
  { value: 'easy', label: 'Easy', sub: DIFFICULTY_META.easy.range },
  { value: 'normal', label: 'Normal', sub: DIFFICULTY_META.normal.range },
  { value: 'hard', label: 'Hard', sub: DIFFICULTY_META.hard.range },
]

const LENGTHS: { value: SessionLength; label: string; sub: string }[] = [
  { value: 10, label: '10문제', sub: '가볍게' },
  { value: 20, label: '20문제', sub: '집중' },
  { value: 'endless', label: '무한', sub: '끝까지' },
]

export function MainMenu() {
  const settings = useSettingsStore()
  const start = useGameStore((s) => s.start)
  const setView = useUiStore((s) => s.setView)
  const progress = useProgressStore()
  const info = levelInfo(progress.xp)
  const lastPlay = progress.history[0]
  const wrongCount = Object.keys(progress.wrongNotes).length

  const beginGame = () => {
    start({
      mode: settings.mode,
      difficulty: settings.difficulty,
      length: settings.length,
      timeLimit: settings.timeLimit,
      review: false,
    })
    setView('game')
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 py-5 sm:px-5">
      {/* 히어로 */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel relative mb-5 overflow-hidden px-5 py-6 sm:px-8 sm:py-8"
      >
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-blue-600/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label-xs mb-2">주기율표 학습 게임</p>
            <h1 className="text-4xl font-black tracking-[0.18em] sm:text-6xl">ATOMIC</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-dim">
              118개 원소를 위치·번호·이름·기호·원자모형까지, 실험실에 앉은 것처럼 익힙니다.
              문제를 풀수록 경험치가 쌓이고 오답은 자동으로 노트에 정리됩니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[430px]">
            <StatChip label="레벨" value={`Lv.${info.level}`} sub={levelTitle(info.level)} />
            <StatChip label="최고 점수" value={progress.bestScore.toLocaleString()} />
            <StatChip label="최고 콤보" value={`${progress.bestCombo}`} />
            <StatChip label="플레이" value={`${progress.playCount}회`} />
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {/* 모드 선택 */}
          <section>
            <h2 className="mb-3 text-sm font-bold">
              1. 문제 유형 고르기
              <span className="ml-2 text-xs font-normal text-dim">
                지금 고른 것: {MODE_META[settings.mode].title}
              </span>
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {MODES.map((mode, i) => (
                <ModeCard
                  key={mode}
                  mode={mode}
                  index={i}
                  selected={settings.mode === mode}
                  onSelect={settings.setMode}
                />
              ))}
            </div>
          </section>

          {/* 설정 */}
          <section className="panel p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-bold">2. 난이도와 분량 정하기</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="label-xs mb-2">난이도</p>
                <SegmentedControl
                  layoutId="difficulty-seg"
                  options={DIFFICULTIES}
                  value={settings.difficulty}
                  onChange={settings.setDifficulty}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-faint">
                  {DIFFICULTY_META[settings.difficulty].hint}
                </p>
              </div>
              <div>
                <p className="label-xs mb-2">문제 수</p>
                <SegmentedControl
                  layoutId="length-seg"
                  options={LENGTHS}
                  value={settings.length}
                  onChange={settings.setLength}
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-dim">
                  <input
                    type="checkbox"
                    checked={settings.timeLimit}
                    onChange={(e) => settings.setTimeLimit(e.target.checked)}
                    className="h-4 w-4 accent-sky-500"
                  />
                  시간 제한 사용 — 빠르게 맞힐수록 보너스 점수를 받습니다.
                </label>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" size="lg" full onClick={beginGame}>
                ▶ 게임 시작
                <span className="ml-1 text-xs font-normal opacity-80">
                  {MODE_META[settings.mode].short} · {DIFFICULTY_META[settings.difficulty].label} ·{' '}
                  {settings.length === 'endless' ? '무한' : `${settings.length}문제`}
                </span>
              </Button>
              {wrongCount > 0 && (
                <Button size="lg" onClick={() => setView('notebook')} className="sm:w-auto">
                  📕 오답 {wrongCount}개 복습
                </Button>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-faint">
              키보드: <kbd>Enter</kbd> 제출 · <kbd>1</kbd>~<kbd>4</kbd> 보기 선택 ·{' '}
              <kbd>Esc</kbd> 일시정지 · <kbd>?</kbd> 단축키 도움말
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <DailyMissions />

          <section className="panel p-4">
            <h2 className="mb-3 text-sm font-bold">최근 기록</h2>
            {lastPlay ? (
              <ul className="space-y-2">
                {progress.history.slice(0, 5).map((record) => (
                  <li
                    key={record.at}
                    className="panel-soft flex items-center justify-between px-3 py-2 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {MODE_META[record.mode].short} · {DIFFICULTY_META[record.difficulty].label}
                      </span>
                      <span className="text-faint">{formatDate(record.at)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-bold text-accent num-display">
                        {record.score.toLocaleString()}
                      </span>
                      <span className="text-faint num-display">
                        {percent(record.correct, record.total)}% · {record.correct}/{record.total}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-dim">
                아직 기록이 없습니다. 첫 판을 끝내면 여기에 쌓입니다.
              </p>
            )}
            <Button size="sm" full className="mt-3" onClick={() => setView('stats')}>
              전체 기록 보기
            </Button>
          </section>
        </aside>
      </div>
    </div>
  )
}

function StatChip({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-tile">
      <span className="label-xs">{label}</span>
      <span className="text-lg font-black leading-none num-display">{value}</span>
      {sub && <span className="text-[10px] text-faint">{sub}</span>}
    </div>
  )
}
