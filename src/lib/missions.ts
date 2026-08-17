import type { Mission, MissionMetric } from '@/types'
import { seededRandom, shuffle, todayKey } from './utils'

interface MissionTemplate {
  metric: MissionMetric
  targets: number[]
  label: (target: number) => string
  xp: (target: number) => number
}

const TEMPLATES: MissionTemplate[] = [
  {
    metric: 'correct',
    targets: [12, 18, 25],
    label: (n) => `오늘 정답 ${n}개 맞히기`,
    xp: (n) => n * 3,
  },
  {
    metric: 'combo',
    targets: [6, 8, 12],
    label: (n) => `${n}콤보 달성하기`,
    xp: (n) => n * 8,
  },
  {
    metric: 'score',
    targets: [800, 1500, 2500],
    label: (n) => `한 판에서 ${n.toLocaleString()}점 넘기기`,
    xp: (n) => Math.round(n / 25),
  },
  {
    metric: 'plays',
    targets: [2, 3, 4],
    label: (n) => `${n}판 끝까지 플레이하기`,
    xp: (n) => n * 25,
  },
  {
    metric: 'accuracy',
    targets: [70, 80, 90],
    label: (n) => `정확도 ${n}% 이상으로 한 판 끝내기`,
    xp: (n) => n,
  },
  {
    metric: 'reviewCorrect',
    targets: [3, 5, 8],
    label: (n) => `오답노트 문제 ${n}개 맞히기`,
    xp: (n) => n * 12,
  },
  {
    metric: 'perfectRun',
    targets: [1],
    label: () => '한 판을 전부 정답으로 끝내기',
    xp: () => 120,
  },
]

/** 날짜를 시드로 매일 같은 3개 과제가 나오게 만든다 */
export function generateDailyMissions(date = todayKey()): Mission[] {
  const rand = seededRandom(`atomic-daily-${date}`)
  const picked = shuffle(TEMPLATES, rand).slice(0, 3)
  return picked.map((tpl, i) => {
    const target = tpl.targets[Math.floor(rand() * tpl.targets.length)]
    return {
      id: `${date}-${tpl.metric}-${i}`,
      label: tpl.label(target),
      metric: tpl.metric,
      target,
      progress: 0,
      xp: tpl.xp(target),
      done: false,
      claimed: false,
    }
  })
}

/** 한 판 결과로 미션 진행도를 갱신한다 */
export interface MissionUpdate {
  correct: number
  maxCombo: number
  score: number
  accuracy: number
  perfect: boolean
  reviewCorrect: number
}

export function applyMissionProgress(missions: Mission[], update: MissionUpdate): Mission[] {
  return missions.map((mission) => {
    if (mission.done) return mission
    let progress = mission.progress
    switch (mission.metric) {
      case 'correct':
        progress += update.correct
        break
      case 'combo':
        progress = Math.max(progress, update.maxCombo)
        break
      case 'score':
        progress = Math.max(progress, update.score)
        break
      case 'plays':
        progress += 1
        break
      case 'accuracy':
        progress = Math.max(progress, update.accuracy)
        break
      case 'reviewCorrect':
        progress += update.reviewCorrect
        break
      case 'perfectRun':
        progress = Math.max(progress, update.perfect ? 1 : 0)
        break
    }
    const done = progress >= mission.target
    return { ...mission, progress: Math.min(progress, mission.target), done }
  })
}

export function missionRewardXp(before: Mission[], after: Mission[]): number {
  let xp = 0
  after.forEach((mission, i) => {
    if (mission.done && !before[i]?.done) xp += mission.xp
  })
  return xp
}
