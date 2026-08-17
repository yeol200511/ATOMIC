import raw from '@/data/elements.json'
import type { Difficulty, ElementData } from '@/types'
import { normalize } from './utils'

export const ELEMENTS = raw as ElementData[]

export const ELEMENT_BY_NUMBER = new Map<number, ElementData>(ELEMENTS.map((el) => [el.number, el]))

const BY_SYMBOL = new Map<string, ElementData>(ELEMENTS.map((el) => [normalize(el.symbol), el]))

export function getElement(atomicNumber: number): ElementData | undefined {
  return ELEMENT_BY_NUMBER.get(atomicNumber)
}

export function getElementBySymbol(symbol: string): ElementData | undefined {
  return BY_SYMBOL.get(normalize(symbol))
}

/** 난이도별 원자번호 상한 */
export const DIFFICULTY_MAX: Record<Difficulty, number> = {
  easy: 20,
  normal: 56,
  hard: 118,
}

export const DIFFICULTY_META: Record<Difficulty, { label: string; range: string; hint: string }> = {
  easy: { label: 'Easy', range: '1 ~ 20번', hint: '교과서 앞부분 원소들. 처음이라면 여기부터.' },
  normal: { label: 'Normal', range: '1 ~ 56번', hint: '전이금속까지. 시험 범위에 딱 맞습니다.' },
  hard: { label: 'Hard', range: '1 ~ 118번', hint: '란타넘족·악티늄족까지 전부.' },
}

export function poolFor(difficulty: Difficulty): ElementData[] {
  const max = DIFFICULTY_MAX[difficulty]
  return ELEMENTS.filter((el) => el.number <= max)
}

/** 이 원소를 가리키는 모든 표기 (채점용) */
export function acceptedNames(el: ElementData): string[] {
  return [el.name, ...el.aliases, el.nameEn, el.symbol]
}

export function matchesName(el: ElementData, input: string): boolean {
  const target = normalize(input)
  if (!target) return false
  return acceptedNames(el).some((candidate) => normalize(candidate) === target)
}

export function matchesSymbol(el: ElementData, input: string): boolean {
  return normalize(el.symbol) === normalize(input)
}

/** 이름·기호·번호·영문명 어디로든 검색 */
export function searchElements(query: string): ElementData[] {
  const q = normalize(query)
  if (!q) return ELEMENTS
  const asNumber = Number(query.trim())
  return ELEMENTS.filter((el) => {
    if (Number.isFinite(asNumber) && asNumber > 0 && el.number === asNumber) return true
    if (normalize(el.symbol) === q) return true
    if (normalize(el.name).includes(q)) return true
    if (normalize(el.nameEn).includes(q)) return true
    if (el.aliases.some((a) => normalize(a).includes(q))) return true
    if (normalize(el.symbol).startsWith(q)) return true
    return false
  })
}

export const SHELL_LABELS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q']

export function shellLabel(index: number): string {
  return SHELL_LABELS[index] ?? `#${index + 1}`
}

/** "K껍질 2 · L껍질 8 · M껍질 1" 형태 문자열 */
export function shellSummary(el: ElementData): string {
  return el.shells.map((count, i) => `${shellLabel(i)} ${count}`).join(' · ')
}

/** 주기율표 그리드에서 실제로 쓰이는 최대 행 (f-블록 포함) */
export const TABLE_ROWS = 10
export const TABLE_COLS = 18
