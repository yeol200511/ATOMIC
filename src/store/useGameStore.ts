import { create } from 'zustand'
import type {
  AnswerRecord,
  Feedback,
  GameConfig,
  GameStatus,
  Question,
  QuizMode,
} from '@/types'
import { audio } from '@/lib/audio'
import { poolFor } from '@/lib/elements'
import {
  buildQuestion,
  buildQuestions,
  buildReviewQuestions,
  gradeAnswer,
  kindForMode,
} from '@/lib/quiz'
import { scoreFor, timeLimitFor } from '@/lib/scoring'
import { useProgressStore, type RunOutcome } from './useProgressStore'

/** 무한모드에서 미리 만들어 두는 문제 수 */
const ENDLESS_CHUNK = 8
/** 폭주 방지 상한 */
const ENDLESS_MAX = 300

export const DEFAULT_CONFIG: GameConfig = {
  mode: 'random',
  difficulty: 'easy',
  length: 10,
  timeLimit: false,
  review: false,
}

interface GameState {
  config: GameConfig
  status: GameStatus
  questions: Question[]
  index: number
  score: number
  combo: number
  maxCombo: number
  answers: AnswerRecord[]
  feedback: Feedback | null
  startedAt: number
  finishedAt: number
  questionStartedAt: number
  pausedAt: number | null
  limitMs: number
  reviewCorrect: number
  outcome: RunOutcome | null
  /** 콤보 연출 트리거용 카운터 */
  comboFlash: number

  start: (config: GameConfig) => void
  startReview: (numbers: number[], mode: QuizMode, timeLimit: boolean) => void
  submit: (input: string) => void
  timeout: () => void
  next: () => void
  finish: () => void
  pause: () => void
  resume: () => void
  reset: () => void

  currentQuestion: () => Question | null
  totalPlanned: () => number | null
}

const emptyRun = {
  status: 'idle' as GameStatus,
  questions: [] as Question[],
  index: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  answers: [] as AnswerRecord[],
  feedback: null as Feedback | null,
  startedAt: 0,
  finishedAt: 0,
  questionStartedAt: 0,
  pausedAt: null as number | null,
  limitMs: 0,
  reviewCorrect: 0,
  outcome: null as RunOutcome | null,
  comboFlash: 0,
}

export const useGameStore = create<GameState>()((set, get) => ({
  config: DEFAULT_CONFIG,
  ...emptyRun,

  currentQuestion: () => {
    const { questions, index } = get()
    return questions[index] ?? null
  },

  totalPlanned: () => {
    const { config, questions } = get()
    return config.length === 'endless' ? null : questions.length
  },

  start: (config) => {
    const pool = poolFor(config.difficulty)
    const count = config.length === 'endless' ? ENDLESS_CHUNK : config.length
    const questions = buildQuestions(config.mode, pool, count)
    const now = Date.now()
    set({
      config,
      ...emptyRun,
      questions,
      status: 'playing',
      startedAt: now,
      questionStartedAt: now,
      limitMs: config.timeLimit ? timeLimitFor(questions[0].kind, config.difficulty) : 0,
    })
  },

  startReview: (numbers, mode, timeLimit) => {
    const questions = buildReviewQuestions(numbers, mode)
    if (questions.length === 0) return
    const config: GameConfig = {
      mode,
      difficulty: 'hard',
      length: questions.length === 10 ? 10 : questions.length === 20 ? 20 : 'endless',
      timeLimit,
      review: true,
    }
    const now = Date.now()
    set({
      config,
      ...emptyRun,
      questions,
      status: 'playing',
      startedAt: now,
      questionStartedAt: now,
      limitMs: timeLimit ? timeLimitFor(questions[0].kind, 'hard') : 0,
    })
  },

  submit: (input) => {
    const state = get()
    if (state.status !== 'playing') return
    const question = state.questions[state.index]
    if (!question) return

    const elapsedMs = Date.now() - state.questionStartedAt
    const correct = gradeAnswer(question, input)
    const combo = correct ? state.combo + 1 : 0
    const breakdown = correct
      ? scoreFor({
          combo,
          difficulty: state.config.difficulty,
          timeLimit: state.config.timeLimit,
          elapsedMs,
          limitMs: state.limitMs,
        })
      : null

    const record: AnswerRecord = {
      questionId: question.id,
      kind: question.kind,
      elementNumber: question.element.number,
      input,
      correct,
      timedOut: false,
      elapsedMs,
      gained: breakdown?.total ?? 0,
      comboAfter: combo,
    }

    useProgressStore.getState().registerAnswer(question.element.number, question.kind, correct)

    if (correct) {
      audio.play('correct')
      if (combo >= 3) audio.play('combo', combo - 3)
    } else {
      audio.play('wrong')
    }

    set({
      status: 'feedback',
      score: state.score + (breakdown?.total ?? 0),
      combo,
      maxCombo: Math.max(state.maxCombo, combo),
      answers: [...state.answers, record],
      reviewCorrect: state.reviewCorrect + (state.config.review && correct ? 1 : 0),
      comboFlash: correct && combo >= 3 ? state.comboFlash + 1 : state.comboFlash,
      feedback: {
        correct,
        timedOut: false,
        element: question.element,
        input,
        answerText: question.answerText,
        gained: breakdown?.total ?? 0,
        combo,
      },
    })
  },

  timeout: () => {
    const state = get()
    if (state.status !== 'playing') return
    const question = state.questions[state.index]
    if (!question) return

    const record: AnswerRecord = {
      questionId: question.id,
      kind: question.kind,
      elementNumber: question.element.number,
      input: '',
      correct: false,
      timedOut: true,
      elapsedMs: state.limitMs,
      gained: 0,
      comboAfter: 0,
    }

    useProgressStore.getState().registerAnswer(question.element.number, question.kind, false)
    audio.play('wrong')

    set({
      status: 'feedback',
      combo: 0,
      answers: [...state.answers, record],
      feedback: {
        correct: false,
        timedOut: true,
        element: question.element,
        input: '',
        answerText: question.answerText,
        gained: 0,
        combo: 0,
      },
    })
  },

  next: () => {
    const state = get()
    if (state.status !== 'feedback') return
    const nextIndex = state.index + 1
    const endless = state.config.length === 'endless'

    if (!endless && nextIndex >= state.questions.length) {
      get().finish()
      return
    }

    let questions = state.questions
    if (endless) {
      if (nextIndex >= ENDLESS_MAX) {
        get().finish()
        return
      }
      if (nextIndex >= questions.length - 2) {
        const pool = poolFor(state.config.difficulty)
        const extra = Array.from({ length: ENDLESS_CHUNK }, () =>
          buildQuestion(kindForMode(state.config.mode), pool),
        )
        questions = [...questions, ...extra]
      }
    }

    const upcoming = questions[nextIndex]
    set({
      questions,
      index: nextIndex,
      status: 'playing',
      feedback: null,
      questionStartedAt: Date.now(),
      limitMs: state.config.timeLimit
        ? timeLimitFor(upcoming.kind, state.config.difficulty)
        : 0,
    })
  },

  finish: () => {
    const state = get()
    if (state.status === 'finished') return
    const answers = state.answers
    const total = answers.length
    const correct = answers.filter((a) => a.correct).length
    const avgMs = total > 0 ? Math.round(answers.reduce((s, a) => s + a.elapsedMs, 0) / total) : 0
    const finishedAt = Date.now()

    audio.play('finish')

    const outcome =
      total > 0
        ? useProgressStore.getState().recordRun({
            mode: state.config.mode,
            difficulty: state.config.difficulty,
            length: state.config.length,
            review: state.config.review,
            score: state.score,
            correct,
            total,
            maxCombo: state.maxCombo,
            avgMs,
            durationMs: finishedAt - state.startedAt,
            reviewCorrect: state.reviewCorrect,
          })
        : null

    if (outcome?.leveledUp) {
      window.setTimeout(() => audio.play('levelup'), 700)
    }

    set({ status: 'finished', feedback: null, outcome, finishedAt })
  },

  pause: () => {
    if (get().status !== 'playing') return
    set({ status: 'paused', pausedAt: Date.now() })
  },

  resume: () => {
    const state = get()
    if (state.status !== 'paused' || state.pausedAt === null) return
    const delta = Date.now() - state.pausedAt
    set({
      status: 'playing',
      pausedAt: null,
      questionStartedAt: state.questionStartedAt + delta,
      startedAt: state.startedAt + delta,
    })
  },

  reset: () => set({ ...emptyRun }),
}))

