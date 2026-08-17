import type { Difficulty, QuestionKind } from '@/types'

export const BASE_SCORE = 100

/** 콤보 보너스는 15콤보에서 상한 (한없이 벌어지지 않게) */
export const MAX_COMBO_BONUS_STEPS = 15
export const COMBO_BONUS_STEP = 20

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  normal: 1.15,
  hard: 1.3,
}

/** 문제 유형·난이도별 제한 시간(ms) */
export function timeLimitFor(kind: QuestionKind, difficulty: Difficulty): number {
  const base: Record<Difficulty, number> = { easy: 20000, normal: 16000, hard: 13000 }
  const extra = kind === 'position' ? 5000 : kind === 'bohr' ? 3000 : 0
  return base[difficulty] + extra
}

export interface ScoreInput {
  combo: number // 정답 처리 후의 콤보 (1부터)
  difficulty: Difficulty
  timeLimit: boolean
  elapsedMs: number
  limitMs: number
}

export interface ScoreBreakdown {
  base: number
  combo: number
  speed: number
  total: number
}

export function scoreFor({
  combo,
  difficulty,
  timeLimit,
  elapsedMs,
  limitMs,
}: ScoreInput): ScoreBreakdown {
  const mult = DIFFICULTY_MULTIPLIER[difficulty]
  const base = Math.round(BASE_SCORE * mult)
  const steps = Math.min(Math.max(combo - 1, 0), MAX_COMBO_BONUS_STEPS)
  const comboBonus = Math.round(steps * COMBO_BONUS_STEP * mult)

  let speed = 0
  if (timeLimit && limitMs > 0) {
    const left = Math.max(0, 1 - elapsedMs / limitMs)
    speed = Math.round(left * 50 * mult)
  }

  return { base, combo: comboBonus, speed, total: base + comboBonus + speed }
}

/* ------------------------------- 레벨 ------------------------------- */

/** 레벨 l 에 도달하는 데 필요한 누적 경험치 */
export function xpForLevel(level: number): number {
  const n = Math.max(0, level - 1)
  return 120 * n + 40 * n * n
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1) && level < 99) level++
  return level
}

export interface LevelInfo {
  level: number
  current: number
  needed: number
  ratio: number
}

export function levelInfo(xp: number): LevelInfo {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const current = xp - floor
  const needed = ceil - floor
  return { level, current, needed, ratio: needed > 0 ? current / needed : 1 }
}

/** 한 판이 끝났을 때 얻는 경험치 */
export function xpForRun(score: number, correct: number, maxCombo: number): number {
  return Math.floor(score / 20) + correct * 3 + maxCombo * 2
}

/** 레벨에 따른 칭호 */
export function levelTitle(level: number): string {
  if (level >= 30) return '노벨상 후보'
  if (level >= 22) return '수석 연구원'
  if (level >= 16) return '박사 과정'
  if (level >= 11) return '연구원'
  if (level >= 7) return '실험 조교'
  if (level >= 4) return '수습 연구원'
  return '견습생'
}
