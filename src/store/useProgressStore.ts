import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  DailyState,
  Difficulty,
  Mission,
  PlayRecord,
  QuestionKind,
  QuizMode,
  SessionLength,
  WrongNote,
} from '@/types'
import { newlyUnlocked, type AchievementStats } from '@/lib/achievements'
import { applyMissionProgress, generateDailyMissions, missionRewardXp } from '@/lib/missions'
import { levelFromXp, xpForRun } from '@/lib/scoring'
import { safeStorage, STORAGE_KEYS } from '@/lib/storage'
import { percent, todayKey } from '@/lib/utils'

const HISTORY_LIMIT = 20

export interface RunSummary {
  mode: QuizMode
  difficulty: Difficulty
  length: SessionLength
  review: boolean
  score: number
  correct: number
  total: number
  maxCombo: number
  avgMs: number
  durationMs: number
  reviewCorrect: number
}

export interface RunOutcome {
  xpGained: number
  missionXp: number
  levelBefore: number
  levelAfter: number
  leveledUp: boolean
  unlocked: string[]
  newBestScore: boolean
  newBestCombo: boolean
}

interface ProgressState {
  xp: number
  playCount: number
  bestScore: number
  bestCombo: number
  totalCorrect: number
  totalWrong: number
  totalTimeMs: number
  perfectRuns: number
  bestAccuracy: number
  bestAvgMs: number | null
  hardRuns: number
  bestEndless: number
  dailyCompletedDays: number
  modesPlayed: QuizMode[]
  viewedElements: number[]
  history: PlayRecord[]
  wrongNotes: Record<number, WrongNote>
  achievements: Record<string, number>
  daily: DailyState

  ensureDaily: () => void
  registerAnswer: (elementNumber: number, kind: QuestionKind, correct: boolean) => void
  recordRun: (summary: RunSummary) => RunOutcome
  viewElement: (elementNumber: number) => void
  removeWrongNote: (elementNumber: number) => void
  clearWrongNotes: () => void
  resetAll: () => void
  stats: () => AchievementStats
  level: () => number
}

const initialState = {
  xp: 0,
  playCount: 0,
  bestScore: 0,
  bestCombo: 0,
  totalCorrect: 0,
  totalWrong: 0,
  totalTimeMs: 0,
  perfectRuns: 0,
  bestAccuracy: 0,
  bestAvgMs: null as number | null,
  hardRuns: 0,
  bestEndless: 0,
  dailyCompletedDays: 0,
  modesPlayed: [] as QuizMode[],
  viewedElements: [] as number[],
  history: [] as PlayRecord[],
  wrongNotes: {} as Record<number, WrongNote>,
  achievements: {} as Record<string, number>,
  daily: { date: todayKey(), missions: generateDailyMissions() } as DailyState,
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState,

      level: () => levelFromXp(get().xp),

      stats: () => {
        const s = get()
        return {
          playCount: s.playCount,
          bestScore: s.bestScore,
          bestCombo: s.bestCombo,
          level: levelFromXp(s.xp),
          totalCorrect: s.totalCorrect,
          perfectRuns: s.perfectRuns,
          bestAccuracy: s.bestAccuracy,
          bestAvgMs: s.bestAvgMs,
          hardRuns: s.hardRuns,
          bestEndless: s.bestEndless,
          viewedCount: s.viewedElements.length,
          notebookCleared: s.playCount > 0 && Object.keys(s.wrongNotes).length === 0,
          dailyCompletedDays: s.dailyCompletedDays,
          modesPlayed: s.modesPlayed,
        }
      },

      ensureDaily: () => {
        const today = todayKey()
        if (get().daily.date !== today) {
          set({ daily: { date: today, missions: generateDailyMissions(today) } })
        }
      },

      /** 문제 하나를 풀 때마다 호출 — 중간에 나가도 오답노트는 남는다 */
      registerAnswer: (elementNumber, kind, correct) => {
        set((state) => {
          const notes = { ...state.wrongNotes }
          const existing = notes[elementNumber]

          if (correct) {
            if (existing) {
              const nextCorrect = existing.correct + 1
              // 두 번 연속으로 맞히면 오답노트에서 졸업
              if (nextCorrect >= existing.wrong || nextCorrect >= 2) {
                delete notes[elementNumber]
              } else {
                notes[elementNumber] = { ...existing, correct: nextCorrect, lastAt: Date.now() }
              }
            }
          } else {
            notes[elementNumber] = {
              number: elementNumber,
              wrong: (existing?.wrong ?? 0) + 1,
              correct: existing?.correct ?? 0,
              lastAt: Date.now(),
              kinds: Array.from(new Set([...(existing?.kinds ?? []), kind])),
            }
          }

          return {
            wrongNotes: notes,
            totalCorrect: state.totalCorrect + (correct ? 1 : 0),
            totalWrong: state.totalWrong + (correct ? 0 : 1),
          }
        })
      },

      recordRun: (summary) => {
        const before = get()
        const levelBefore = levelFromXp(before.xp)
        const accuracy = percent(summary.correct, summary.total)
        const perfect = summary.total > 0 && summary.correct === summary.total

        const baseXp = xpForRun(summary.score, summary.correct, summary.maxCombo)

        const missionsBefore = before.daily.missions
        const missionsAfter = applyMissionProgress(missionsBefore, {
          correct: summary.correct,
          maxCombo: summary.maxCombo,
          score: summary.score,
          accuracy,
          perfect,
          reviewCorrect: summary.reviewCorrect,
        })
        const missionXp = missionRewardXp(missionsBefore, missionsAfter)

        const allMissionsDone = missionsAfter.every((m: Mission) => m.done)
        const wasAllDone = missionsBefore.every((m: Mission) => m.done)

        const record: PlayRecord = {
          at: Date.now(),
          mode: summary.mode,
          difficulty: summary.difficulty,
          length: summary.length,
          score: summary.score,
          correct: summary.correct,
          total: summary.total,
          maxCombo: summary.maxCombo,
          avgMs: summary.avgMs,
          durationMs: summary.durationMs,
        }

        const xp = before.xp + baseXp + missionXp
        const newBestScore = summary.score > before.bestScore
        const newBestCombo = summary.maxCombo > before.bestCombo

        const nextState = {
          xp,
          playCount: before.playCount + 1,
          bestScore: Math.max(before.bestScore, summary.score),
          bestCombo: Math.max(before.bestCombo, summary.maxCombo),
          totalTimeMs: before.totalTimeMs + summary.durationMs,
          perfectRuns: before.perfectRuns + (perfect && summary.total >= 10 ? 1 : 0),
          bestAccuracy: Math.max(before.bestAccuracy, summary.total >= 5 ? accuracy : 0),
          bestAvgMs:
            summary.total >= 10 && summary.avgMs > 0
              ? Math.min(before.bestAvgMs ?? Number.MAX_SAFE_INTEGER, summary.avgMs)
              : before.bestAvgMs,
          hardRuns: before.hardRuns + (summary.difficulty === 'hard' && summary.total >= 10 ? 1 : 0),
          bestEndless:
            summary.length === 'endless'
              ? Math.max(before.bestEndless, summary.total)
              : before.bestEndless,
          dailyCompletedDays:
            allMissionsDone && !wasAllDone
              ? before.dailyCompletedDays + 1
              : before.dailyCompletedDays,
          modesPlayed: Array.from(new Set([...before.modesPlayed, summary.mode])),
          history: [record, ...before.history].slice(0, HISTORY_LIMIT),
          daily: { ...before.daily, missions: missionsAfter },
        }

        set(nextState)

        const unlocked = newlyUnlocked(get().stats(), before.achievements)
        if (unlocked.length > 0) {
          const now = Date.now()
          set((state) => ({
            achievements: {
              ...state.achievements,
              ...Object.fromEntries(unlocked.map((id) => [id, now])),
            },
          }))
        }

        const levelAfter = levelFromXp(xp)
        return {
          xpGained: baseXp,
          missionXp,
          levelBefore,
          levelAfter,
          leveledUp: levelAfter > levelBefore,
          unlocked,
          newBestScore,
          newBestCombo,
        }
      },

      viewElement: (elementNumber) => {
        set((state) =>
          state.viewedElements.includes(elementNumber)
            ? state
            : { viewedElements: [...state.viewedElements, elementNumber] },
        )
      },

      removeWrongNote: (elementNumber) => {
        set((state) => {
          const notes = { ...state.wrongNotes }
          delete notes[elementNumber]
          return { wrongNotes: notes }
        })
      },

      clearWrongNotes: () => set({ wrongNotes: {} }),

      resetAll: () =>
        set({
          ...initialState,
          daily: { date: todayKey(), missions: generateDailyMissions() },
        }),
    }),
    {
      name: STORAGE_KEYS.progress,
      storage: createJSONStorage(() => safeStorage),
      version: 1,
      // 액션은 빼고 데이터만 저장한다
      partialize: (state) => ({
        xp: state.xp,
        playCount: state.playCount,
        bestScore: state.bestScore,
        bestCombo: state.bestCombo,
        totalCorrect: state.totalCorrect,
        totalWrong: state.totalWrong,
        totalTimeMs: state.totalTimeMs,
        perfectRuns: state.perfectRuns,
        bestAccuracy: state.bestAccuracy,
        bestAvgMs: state.bestAvgMs,
        hardRuns: state.hardRuns,
        bestEndless: state.bestEndless,
        dailyCompletedDays: state.dailyCompletedDays,
        modesPlayed: state.modesPlayed,
        viewedElements: state.viewedElements,
        history: state.history,
        wrongNotes: state.wrongNotes,
        achievements: state.achievements,
        daily: state.daily,
      }),
    },
  ),
)
