import type { Achievement, QuizMode } from '@/types'

/** 업적 판정에 필요한 누적 지표 묶음 */
export interface AchievementStats {
  playCount: number
  bestScore: number
  bestCombo: number
  level: number
  totalCorrect: number
  perfectRuns: number
  bestAccuracy: number
  bestAvgMs: number | null
  hardRuns: number
  bestEndless: number
  viewedCount: number
  notebookCleared: boolean
  dailyCompletedDays: number
  modesPlayed: QuizMode[]
}

interface AchievementDef extends Achievement {
  /** 현재 진행값 */
  value: (s: AchievementStats) => number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-step',
    title: '첫 실험',
    description: '게임을 한 판 끝냈습니다.',
    icon: '🧪',
    goal: 1,
    value: (s) => s.playCount,
  },
  {
    id: 'plays-10',
    title: '반복 실험',
    description: '10판을 플레이했습니다.',
    icon: '🔁',
    goal: 10,
    value: (s) => s.playCount,
  },
  {
    id: 'plays-50',
    title: '베테랑 연구원',
    description: '50판을 플레이했습니다.',
    icon: '🎖️',
    goal: 50,
    value: (s) => s.playCount,
  },
  {
    id: 'combo-5',
    title: '연쇄 반응',
    description: '5콤보를 달성했습니다.',
    icon: '⚡',
    goal: 5,
    value: (s) => s.bestCombo,
  },
  {
    id: 'combo-10',
    title: '임계 질량',
    description: '10콤보를 달성했습니다.',
    icon: '☄️',
    goal: 10,
    value: (s) => s.bestCombo,
  },
  {
    id: 'combo-20',
    title: '핵융합',
    description: '20콤보를 달성했습니다.',
    icon: '💥',
    goal: 20,
    value: (s) => s.bestCombo,
  },
  {
    id: 'score-1000',
    title: '첫 논문',
    description: '한 판에서 1,000점을 넘겼습니다.',
    icon: '📄',
    goal: 1000,
    value: (s) => s.bestScore,
  },
  {
    id: 'score-3000',
    title: '인용 급증',
    description: '한 판에서 3,000점을 넘겼습니다.',
    icon: '📈',
    goal: 3000,
    value: (s) => s.bestScore,
  },
  {
    id: 'score-8000',
    title: '학계의 별',
    description: '한 판에서 8,000점을 넘겼습니다.',
    icon: '🌟',
    goal: 8000,
    value: (s) => s.bestScore,
  },
  {
    id: 'perfect',
    title: '완벽한 실험',
    description: '한 판을 전부 정답으로 끝냈습니다.',
    icon: '💯',
    goal: 1,
    value: (s) => s.perfectRuns,
  },
  {
    id: 'accuracy-90',
    title: '정밀 측정',
    description: '한 판 정확도 90% 이상을 기록했습니다.',
    icon: '🎯',
    goal: 90,
    value: (s) => s.bestAccuracy,
  },
  {
    id: 'speedy',
    title: '초고속 판독',
    description: '평균 응답 시간 3초 이내로 한 판을 끝냈습니다.',
    icon: '⏱️',
    goal: 1,
    value: (s) => (s.bestAvgMs !== null && s.bestAvgMs <= 3000 ? 1 : 0),
  },
  {
    id: 'hard-runner',
    title: '무거운 원소',
    description: 'Hard 난이도를 완주했습니다.',
    icon: '🪨',
    goal: 1,
    value: (s) => s.hardRuns,
  },
  {
    id: 'endless-25',
    title: '끝없는 탐구',
    description: '무한모드에서 25문제 이상 풀었습니다.',
    icon: '♾️',
    goal: 25,
    value: (s) => s.bestEndless,
  },
  {
    id: 'level-5',
    title: '수습 딱지 떼기',
    description: '레벨 5에 도달했습니다.',
    icon: '🔬',
    goal: 5,
    value: (s) => s.level,
  },
  {
    id: 'level-10',
    title: '연구실의 기둥',
    description: '레벨 10에 도달했습니다.',
    icon: '🏛️',
    goal: 10,
    value: (s) => s.level,
  },
  {
    id: 'curious',
    title: '도서관 사서',
    description: '원소 도감에서 30개 원소를 살펴봤습니다.',
    icon: '📚',
    goal: 30,
    value: (s) => s.viewedCount,
  },
  {
    id: 'notebook-clear',
    title: '오답 청소',
    description: '오답노트를 모두 정복해 비웠습니다.',
    icon: '🧹',
    goal: 1,
    value: (s) => (s.notebookCleared ? 1 : 0),
  },
  {
    id: 'daily-3',
    title: '성실한 연구원',
    description: '일일 도전과제를 하루에 전부 완료했습니다.',
    icon: '📅',
    goal: 1,
    value: (s) => s.dailyCompletedDays,
  },
  {
    id: 'all-modes',
    title: '다재다능',
    description: '5가지 문제 유형을 모두 플레이했습니다.',
    icon: '🎛️',
    goal: 5,
    value: (s) => s.modesPlayed.filter((m) => m !== 'random').length,
  },
]

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))

export interface AchievementProgress {
  def: AchievementDef
  value: number
  goal: number
  unlocked: boolean
  unlockedAt?: number
}

export function evaluateAchievements(
  stats: AchievementStats,
  unlocked: Record<string, number>,
): AchievementProgress[] {
  return ACHIEVEMENTS.map((def) => {
    const goal = def.goal ?? 1
    const value = Math.max(0, def.value(stats))
    return {
      def,
      value: Math.min(value, goal),
      goal,
      unlocked: Boolean(unlocked[def.id]) || value >= goal,
      unlockedAt: unlocked[def.id],
    }
  })
}

/** 아직 해금 기록이 없지만 이제 조건을 만족한 업적 ID 목록 */
export function newlyUnlocked(
  stats: AchievementStats,
  unlocked: Record<string, number>,
): string[] {
  return ACHIEVEMENTS.filter((def) => {
    if (unlocked[def.id]) return false
    return def.value(stats) >= (def.goal ?? 1)
  }).map((def) => def.id)
}
