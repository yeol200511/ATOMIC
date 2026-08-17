import type { CategoryKey } from '@/types'

export interface CategoryMeta {
  key: CategoryKey
  label: string
  /** 셀 배경 그라데이션 기준색 */
  color: string
  /** 텍스트·테두리에 쓰는 밝은 색 */
  light: string
}

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  alkali: { key: 'alkali', label: '알칼리 금속', color: '#f97316', light: '#fdba74' },
  alkaline: { key: 'alkaline', label: '알칼리 토금속', color: '#f59e0b', light: '#fcd34d' },
  transition: { key: 'transition', label: '전이금속', color: '#0ea5e9', light: '#7dd3fc' },
  post: { key: 'post', label: '기타 금속', color: '#64748b', light: '#cbd5e1' },
  metalloid: { key: 'metalloid', label: '준금속', color: '#14b8a6', light: '#5eead4' },
  nonmetal: { key: 'nonmetal', label: '비금속', color: '#22c55e', light: '#86efac' },
  halogen: { key: 'halogen', label: '할로젠', color: '#a855f7', light: '#d8b4fe' },
  noble: { key: 'noble', label: '비활성 기체', color: '#ec4899', light: '#f9a8d4' },
  lanthanide: { key: 'lanthanide', label: '란타넘족', color: '#6366f1', light: '#a5b4fc' },
  actinide: { key: 'actinide', label: '악티늄족', color: '#f43f5e', light: '#fda4af' },
}

/** 범례 표시 순서 */
export const CATEGORY_ORDER: CategoryKey[] = [
  'alkali',
  'alkaline',
  'transition',
  'post',
  'metalloid',
  'nonmetal',
  'halogen',
  'noble',
  'lanthanide',
  'actinide',
]

export const STATE_LABEL: Record<string, string> = {
  solid: '고체',
  liquid: '액체',
  gas: '기체',
}

export const STATE_ICON: Record<string, string> = {
  solid: '◆',
  liquid: '●',
  gas: '○',
}
