import type { ElementData, Question, QuestionKind, QuizMode } from '@/types'
import { ELEMENTS, getElement, matchesName, matchesSymbol, shellLabel } from './elements'
import { pick, sampleUnique, shuffle } from './utils'

export const ALL_KINDS: QuestionKind[] = ['position', 'atomicNumber', 'name', 'bohr', 'symbol']

export interface ModeMeta {
  mode: QuizMode
  title: string
  short: string
  description: string
  icon: string
  accent: string
}

export const MODE_META: Record<QuizMode, ModeMeta> = {
  position: {
    mode: 'position',
    title: '위치 맞추기',
    short: '위치',
    description: '빈 주기율표에서 제시된 원소의 자리를 찾아 클릭합니다.',
    icon: '▦',
    accent: '#0ea5e9',
  },
  atomicNumber: {
    mode: 'atomicNumber',
    title: '원자번호 맞추기',
    short: '번호',
    description: '원소 이름이나 기호를 보고 원자번호를 입력합니다.',
    icon: '#',
    accent: '#22c55e',
  },
  name: {
    mode: 'name',
    title: '원소 이름 맞추기',
    short: '이름',
    description: '원자번호를 보고 원소 이름 또는 기호를 입력합니다.',
    icon: '가',
    accent: '#f59e0b',
  },
  bohr: {
    mode: 'bohr',
    title: '원자모형 맞추기',
    short: '모형',
    description: '보어 모형의 전자껍질을 보고 어떤 원소인지 고릅니다.',
    icon: '◎',
    accent: '#a855f7',
  },
  symbol: {
    mode: 'symbol',
    title: '기호 맞추기',
    short: '기호',
    description: '원소 이름을 보고 원소 기호를 입력합니다.',
    icon: 'Na',
    accent: '#ec4899',
  },
  random: {
    mode: 'random',
    title: '랜덤 종합 퀴즈',
    short: '종합',
    description: '다섯 가지 문제가 무작위로 섞여 출제됩니다.',
    icon: '⁂',
    accent: '#f43f5e',
  },
}

let seq = 0
const nextId = () => `q${++seq}`

function groupText(el: ElementData): string {
  if (el.group === null) {
    return el.category === 'lanthanide' ? '란타넘족' : '악티늄족'
  }
  return `${el.group}족`
}

export function positionAnswerText(el: ElementData): string {
  return `${el.period}주기 ${groupText(el)}`
}

function shellText(el: ElementData): string {
  return el.shells.map((count, i) => `${shellLabel(i)}껍질 ${count}`).join(', ')
}

/** 보어 모형 문제의 오답 선택지 — 껍질 수가 비슷한 원소를 우선 섞는다 */
function bohrChoices(answer: ElementData, pool: ElementData[], rand: () => number): number[] {
  const others = pool.filter((el) => el.number !== answer.number)
  const near = others.filter((el) => Math.abs(el.shells.length - answer.shells.length) <= 1)
  const source = near.length >= 3 ? near : others
  const distractors = sampleUnique(source, 3, rand).map((el) => el.number)
  return shuffle([answer.number, ...distractors], rand)
}

/** 특정 원소로 문제 하나를 만든다. distractorPool 은 보어 모형 선택지용. */
export function buildQuestionFor(
  kind: QuestionKind,
  el: ElementData,
  distractorPool: ElementData[],
  rand: () => number = Math.random,
): Question {
  const pool = distractorPool.length >= 4 ? distractorPool : ELEMENTS
  const showSymbol = rand() < 0.5

  switch (kind) {
    case 'position':
      return {
        id: nextId(),
        kind,
        element: el,
        title: '이 원소는 주기율표의 어디에 있을까요?',
        prompt: showSymbol ? el.symbol : el.name,
        promptSub: showSymbol ? el.name : el.symbol,
        format: 'cell',
        answerText: positionAnswerText(el),
      }
    case 'atomicNumber':
      return {
        id: nextId(),
        kind,
        element: el,
        title: '이 원소의 원자번호는?',
        prompt: showSymbol ? el.symbol : el.name,
        promptSub: showSymbol ? el.name : el.symbol,
        format: 'number',
        answerText: `${el.number}번`,
        placeholder: '숫자 입력',
      }
    case 'name':
      return {
        id: nextId(),
        kind,
        element: el,
        title: '이 원자번호의 원소 이름은?',
        prompt: `${el.number}`,
        promptSub: '원소 이름 또는 기호',
        format: 'text',
        answerText: `${el.name} (${el.symbol})`,
        placeholder: '예: 산소 또는 O',
      }
    case 'bohr':
      return {
        id: nextId(),
        kind,
        element: el,
        title: '이 원자모형은 어떤 원소일까요?',
        prompt: shellText(el),
        promptSub: `전자 ${el.number}개`,
        format: 'choice',
        choices: bohrChoices(el, pool, rand),
        answerText: `${el.name} (${el.symbol})`,
      }
    case 'symbol':
      return {
        id: nextId(),
        kind,
        element: el,
        title: '이 원소의 기호는?',
        prompt: el.name,
        promptSub: el.nameEn,
        format: 'text',
        answerText: el.symbol,
        placeholder: '예: Na',
      }
  }
}

export function kindForMode(mode: QuizMode, rand: () => number = Math.random): QuestionKind {
  return mode === 'random' ? pick(ALL_KINDS, rand) : mode
}

/** 풀에서 아직 안 나온 원소를 우선해 문제 하나를 만든다 */
export function buildQuestion(
  kind: QuestionKind,
  pool: ElementData[],
  rand: () => number = Math.random,
  exclude: ReadonlySet<number> = new Set(),
): Question {
  const candidates = pool.filter((el) => !exclude.has(el.number))
  const el = pick(candidates.length > 0 ? candidates : pool, rand)
  return buildQuestionFor(kind, el, pool, rand)
}

/**
 * 문제 묶음 생성.
 * 풀이 넉넉하면 같은 원소가 반복되지 않도록 뽑는다.
 */
export function buildQuestions(
  mode: QuizMode,
  pool: ElementData[],
  count: number,
  rand: () => number = Math.random,
): Question[] {
  const questions: Question[] = []
  const used = new Set<number>()
  for (let i = 0; i < count; i++) {
    if (used.size >= pool.length) used.clear()
    const q = buildQuestion(kindForMode(mode, rand), pool, rand, used)
    used.add(q.element.number)
    questions.push(q)
  }
  return questions
}

/** 오답노트 복습용 — 지정된 원소들로만 문제를 만든다 */
export function buildReviewQuestions(
  numbers: number[],
  mode: QuizMode,
  rand: () => number = Math.random,
): Question[] {
  const pool = numbers.map((n) => getElement(n)).filter((el): el is ElementData => Boolean(el))
  if (pool.length === 0) return []
  return shuffle(pool, rand).map((el) => buildQuestionFor(kindForMode(mode, rand), el, pool, rand))
}

export function gradeAnswer(question: Question, input: string): boolean {
  const el = question.element
  const raw = input.trim()
  if (!raw) return false

  switch (question.kind) {
    case 'position':
    case 'bohr':
    case 'atomicNumber':
      return Number(raw) === el.number
    case 'name':
      return matchesName(el, raw)
    case 'symbol':
      return matchesSymbol(el, raw)
  }
}
