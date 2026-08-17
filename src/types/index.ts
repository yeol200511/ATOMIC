/** 원소 분류 (주기율표 색상 구분 기준) */
export type CategoryKey =
  | 'alkali' // 알칼리 금속
  | 'alkaline' // 알칼리 토금속
  | 'transition' // 전이금속
  | 'lanthanide' // 란타넘족
  | 'actinide' // 악티늄족
  | 'metalloid' // 준금속
  | 'nonmetal' // 비금속
  | 'halogen' // 할로젠
  | 'noble' // 비활성 기체
  | 'post' // 기타 금속

/** 상온·상압에서의 상태 */
export type ElementState = 'solid' | 'liquid' | 'gas'

export interface Subshell {
  shell: number
  orbital: string
  electrons: number
}

export interface ElementData {
  number: number
  symbol: string
  name: string
  nameEn: string
  /** 같은 원소를 부르는 다른 한글 이름 (채점 시 함께 정답 처리) */
  aliases: string[]
  mass: number
  category: CategoryKey
  state: ElementState
  period: number
  /** 란타넘족·악티늄족은 족 번호가 없다 */
  group: number | null
  /** 주기율표 그리드 좌표 (1-base, row 9·10 은 f-블록) */
  row: number
  col: number
  electronConfig: string
  subshells: Subshell[]
  /** 보어 모형 껍질별 전자 수 — 예: Na → [2, 8, 1] */
  shells: number[]
  description: string
}

/* ------------------------------ 게임 ------------------------------ */

export type QuestionKind =
  | 'position' // 위치 맞추기
  | 'atomicNumber' // 원자번호 맞추기
  | 'name' // 원소 이름 맞추기
  | 'bohr' // 원자모형 맞추기
  | 'symbol' // 기호 맞추기

export type QuizMode = QuestionKind | 'random'

export type Difficulty = 'easy' | 'normal' | 'hard'

/** 10문제 / 20문제 / 무한 */
export type SessionLength = 10 | 20 | 'endless'

export type AnswerFormat = 'cell' | 'number' | 'text' | 'choice'

export interface Question {
  id: string
  kind: QuestionKind
  element: ElementData
  /** "이 원소의 위치는?" 같은 안내 문구 */
  title: string
  /** 화면에 크게 제시되는 값 (원소 이름, 기호, 원자번호 등) */
  prompt: string
  /** 제시값 아래 작은 보조 설명 */
  promptSub?: string
  format: AnswerFormat
  /** 보어 모형 문제의 선택지 (원자번호) */
  choices?: number[]
  /** 정답 표기 (결과·피드백에 사용) */
  answerText: string
  /** 입력 도움말 */
  placeholder?: string
}

export interface AnswerRecord {
  questionId: string
  kind: QuestionKind
  elementNumber: number
  input: string
  correct: boolean
  timedOut: boolean
  elapsedMs: number
  gained: number
  comboAfter: number
}

export type GameStatus = 'idle' | 'playing' | 'feedback' | 'paused' | 'finished'

export interface GameConfig {
  mode: QuizMode
  difficulty: Difficulty
  length: SessionLength
  timeLimit: boolean
  /** 오답노트 복습 세션인지 */
  review: boolean
}

export interface Feedback {
  correct: boolean
  timedOut: boolean
  element: ElementData
  input: string
  answerText: string
  gained: number
  combo: number
}

/* ------------------------------ 진행도 ------------------------------ */

export interface PlayRecord {
  at: number
  mode: QuizMode
  difficulty: Difficulty
  length: SessionLength
  score: number
  correct: number
  total: number
  maxCombo: number
  avgMs: number
  durationMs: number
}

export interface WrongNote {
  number: number
  /** 이 원소에서 틀린 횟수 */
  wrong: number
  /** 복습해서 맞힌 횟수 */
  correct: number
  lastAt: number
  kinds: QuestionKind[]
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  /** 진행형 업적이면 목표치 */
  goal?: number
}

export type MissionMetric =
  | 'correct'
  | 'combo'
  | 'score'
  | 'plays'
  | 'accuracy'
  | 'reviewCorrect'
  | 'perfectRun'

export interface Mission {
  id: string
  label: string
  metric: MissionMetric
  target: number
  progress: number
  xp: number
  done: boolean
  claimed: boolean
}

export interface DailyState {
  date: string
  missions: Mission[]
}

/* ------------------------------ 화면 ------------------------------ */

export type View =
  | 'menu'
  | 'game'
  | 'result'
  | 'stats'
  | 'achievements'
  | 'explorer'
  | 'notebook'
