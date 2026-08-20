import { useId } from 'react'
import { motion } from 'framer-motion'
import type { ElementData } from '@/types'
import { CATEGORIES } from '@/data/categories'
import { shellLabel } from '@/lib/elements'
import { useSettingsStore } from '@/store/useSettingsStore'
import { cn } from '@/lib/utils'

interface BohrModelProps {
  element: ElementData
  size?: number
  /** 문제로 낼 때는 원소 정체를 감춘다 */
  hideIdentity?: boolean
  showShellLabels?: boolean
  className?: string
}

const VIEW = 220
const CENTER = VIEW / 2
const NUCLEUS_R = 22
const MAX_R = 106

/**
 * 껍질마다 반지름·전자 크기·시작 각도를 계산한다.
 *
 * 20번(칼슘)까지는 껍질마다 전자가 많아야 8개라 무엇을 하든 보기 좋다. 문제는 21번부터다 —
 * M 껍질이 9개에서 18개까지 차오르고, 무거운 원소는 N·O 껍질이 32개까지 간다. 고정 크기로
 * 그리면 점이 서로 붙어 껍질이 몇 개인지조차 읽히지 않는다. 그래서 두 가지를 궤도마다 따로 잡는다.
 *
 * - **전자 크기**: 그 궤도의 원주를 전자 수로 나눠 정한다. 전자가 많은 껍질은 알아서 작아진다.
 * - **시작 각도**: 껍질마다 어긋나게 준다. 전부 12시에서 시작하면 전자가 세로로 줄지어
 *   방사형 줄무늬처럼 뭉쳐 보인다 — 전자가 적을 땐 안 보이다가 21번부터 확 드러나는 현상이다.
 */
function shellGeometry(shells: number[]) {
  const n = shells.length
  // 껍질이 많을수록 안쪽에서 시작해 궤도 사이 간격을 번다
  const minR = n >= 6 ? 30 : n >= 5 ? 33 : 38
  const step = n > 1 ? (MAX_R - minR) / (n - 1) : 0

  return shells.map((count, i) => {
    const r = minR + step * i
    // 이웃 전자가 지름의 1.35배는 떨어지도록
    const byRing = count > 1 ? (2 * Math.PI * r) / count / 2.7 : 3.6
    // 궤도끼리도 붙지 않게 간격의 40% 를 넘지 않도록
    const byGap = step > 0 ? step * 0.4 : 3.6
    const dotR = Math.max(1.5, Math.min(3.6, byRing, byGap))
    const start = -Math.PI / 2 + (i * Math.PI) / n + (count > 8 ? Math.PI / count : 0)
    return { r, dotR, start }
  })
}

export function BohrModel({
  element,
  size = 240,
  hideIdentity = false,
  showShellLabels = true,
  className,
}: BohrModelProps) {
  const animations = useSettingsStore((s) => s.animations)
  const uid = useId().replace(/[:]/g, '')
  const meta = CATEGORIES[element.category]
  const shells = element.shells
  const geometry = shellGeometry(shells)

  return (
    <div className={cn('relative select-none', className)}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        width={size}
        height={size}
        role="img"
        aria-label={`${hideIdentity ? '원소' : element.name} 보어 원자모형`}
      >
        <defs>
          <radialGradient id={`nucleus-${uid}`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="45%" stopColor={meta.light} />
            <stop offset="100%" stopColor={meta.color} />
          </radialGradient>
          <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={meta.color} stopOpacity="0.42" />
            <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={MAX_R + 6} fill={`url(#halo-${uid})`} />

        {shells.map((count, shellIndex) => {
          const { r, dotR, start } = geometry[shellIndex]
          const duration = 11 + shellIndex * 4.5
          const direction = shellIndex % 2 === 0 ? 360 : -360
          return (
            <g key={shellIndex}>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.34}
                strokeWidth={1}
                strokeDasharray="3 4"
                className="text-sky-300"
              />
              <motion.g
                style={{ originX: `${CENTER}px`, originY: `${CENTER}px` }}
                animate={animations ? { rotate: direction } : { rotate: 0 }}
                transition={
                  animations ? { repeat: Infinity, ease: 'linear', duration } : { duration: 0 }
                }
              >
                {Array.from({ length: count }, (_, i) => {
                  const angle = start + (Math.PI * 2 * i) / count
                  const ex = CENTER + Math.cos(angle) * r
                  const ey = CENTER + Math.sin(angle) * r
                  return (
                    <circle
                      key={i}
                      cx={ex}
                      cy={ey}
                      r={dotR}
                      fill="#e6f7ff"
                      stroke={meta.light}
                      strokeWidth={dotR < 2.2 ? 0.5 : 0.8}
                    />
                  )
                })}
              </motion.g>
            </g>
          )
        })}

        <circle cx={CENTER} cy={CENTER} r={NUCLEUS_R} fill={`url(#nucleus-${uid})`} />
        <text
          x={CENTER}
          y={CENTER + (hideIdentity ? 7 : 2)}
          textAnchor="middle"
          className="font-bold"
          fontSize={hideIdentity ? 20 : 16}
          fill="#06121f"
        >
          {hideIdentity ? '?' : element.symbol}
        </text>
        {!hideIdentity && (
          <text
            x={CENTER}
            y={CENTER + 14}
            textAnchor="middle"
            fontSize={8}
            fill="#06121f"
            opacity={0.75}
          >
            {element.number}
          </text>
        )}
      </svg>

      {showShellLabels && (
        <div className="mt-1 flex flex-wrap justify-center gap-1.5">
          {shells.map((count, i) => (
            <span
              key={i}
              className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
              style={{ background: `${meta.color}22`, color: meta.light }}
            >
              {shellLabel(i)} {count}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
