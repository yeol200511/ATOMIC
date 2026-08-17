import { motion } from 'framer-motion'
import { DIFFICULTY_META } from '@/lib/elements'
import { MODE_META } from '@/lib/quiz'
import { levelInfo, levelTitle } from '@/lib/scoring'
import { formatDate, formatDuration, formatMs, percent } from '@/lib/utils'
import { useProgressStore } from '@/store/useProgressStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function StatsScreen() {
  const progress = useProgressStore()
  const setView = useUiStore((s) => s.setView)
  const info = levelInfo(progress.xp)
  const answered = progress.totalCorrect + progress.totalWrong
  const overallAccuracy = percent(progress.totalCorrect, answered)
  const bestRun = progress.history.reduce<typeof progress.history[number] | null>(
    (best, record) => (!best || record.score > best.score ? record : best),
    null,
  )

  return (
    <div className="mx-auto w-full max-w-[1100px] px-3 py-5 sm:px-5">
      <header className="mb-4">
        <h1 className="text-2xl font-black">기록</h1>
        <p className="mt-1 text-sm text-dim">저장된 진행도는 이 브라우저에만 보관됩니다.</p>
      </header>

      <section className="panel mb-4 p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-black text-accent">
            Lv.{info.level} <span className="text-sm font-semibold">{levelTitle(info.level)}</span>
          </h2>
          <span className="text-xs text-faint num-display">
            총 {progress.xp.toLocaleString()} XP · 다음 레벨까지 {info.needed - info.current} XP
          </span>
        </div>
        <ProgressBar value={info.current} max={info.needed} />
      </section>

      <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="최고 점수" value={progress.bestScore.toLocaleString()} />
        <Tile label="최고 콤보" value={String(progress.bestCombo)} />
        <Tile label="플레이 횟수" value={`${progress.playCount}회`} />
        <Tile label="전체 정답률" value={`${overallAccuracy}%`} sub={`${answered}문제`} />
        <Tile label="맞힌 문제" value={progress.totalCorrect.toLocaleString()} />
        <Tile label="총 플레이" value={formatDuration(progress.totalTimeMs)} />
      </section>

      {bestRun && (
        <section className="panel mb-4 p-4">
          <h2 className="mb-2 text-sm font-bold">최고 기록 한 판</h2>
          <div className="panel-soft flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                {MODE_META[bestRun.mode].title} · {DIFFICULTY_META[bestRun.difficulty].label}
              </p>
              <p className="text-[11px] text-faint">{formatDate(bestRun.at)}</p>
            </div>
            <div className="flex gap-4 text-right">
              <span>
                <span className="block text-lg font-black text-accent num-display">
                  {bestRun.score.toLocaleString()}
                </span>
                <span className="text-[10px] text-faint">점수</span>
              </span>
              <span>
                <span className="block text-lg font-black num-display">
                  {percent(bestRun.correct, bestRun.total)}%
                </span>
                <span className="text-[10px] text-faint">정답률</span>
              </span>
              <span>
                <span className="block text-lg font-black num-display">{bestRun.maxCombo}</span>
                <span className="text-[10px] text-faint">콤보</span>
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="panel p-4">
        <h2 className="mb-3 text-sm font-bold">
          최근 플레이 <span className="text-dim">{progress.history.length}건</span>
        </h2>
        {progress.history.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">아직 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="text-faint">
                  <th className="pb-2 font-semibold">시각</th>
                  <th className="pb-2 font-semibold">유형</th>
                  <th className="pb-2 font-semibold">난이도</th>
                  <th className="pb-2 text-right font-semibold">점수</th>
                  <th className="pb-2 text-right font-semibold">정답</th>
                  <th className="pb-2 text-right font-semibold">정답률</th>
                  <th className="pb-2 text-right font-semibold">콤보</th>
                  <th className="pb-2 text-right font-semibold">평균 응답</th>
                </tr>
              </thead>
              <tbody>
                {progress.history.map((record, i) => (
                  <motion.tr
                    key={record.at}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t divider"
                  >
                    <td className="py-2 text-faint">{formatDate(record.at)}</td>
                    <td className="py-2">{MODE_META[record.mode].short}</td>
                    <td className="py-2">{DIFFICULTY_META[record.difficulty].label}</td>
                    <td className="py-2 text-right font-bold num-display">
                      {record.score.toLocaleString()}
                    </td>
                    <td className="py-2 text-right num-display">
                      {record.correct}/{record.total}
                    </td>
                    <td className="py-2 text-right num-display">
                      {percent(record.correct, record.total)}%
                    </td>
                    <td className="py-2 text-right num-display">{record.maxCombo}</td>
                    <td className="py-2 text-right num-display">{formatMs(record.avgMs)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" onClick={() => setView('menu')}>
          ⌂ 메인으로
        </Button>
        <Button onClick={() => setView('achievements')}>🏅 업적 보기</Button>
      </div>
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-tile">
      <span className="label-xs">{label}</span>
      <span className="text-xl font-black leading-none num-display">{value}</span>
      {sub && <span className="text-[10px] text-faint">{sub}</span>}
    </div>
  )
}
