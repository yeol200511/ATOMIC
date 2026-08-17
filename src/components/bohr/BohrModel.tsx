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
const MIN_R = 38
const MAX_R = 104

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
  const step = shells.length > 1 ? (MAX_R - MIN_R) / (shells.length - 1) : 0

  return (
    <div className={cn('relative select-none', className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size} role="img"
        aria-label={`${hideIdentity ? '원소' : element.name} 보어 원자모형`}>
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

        <circle cx={CENTER} cy={CENTER} r={MAX_R + 8} fill={`url(#halo-${uid})`} />

        {shells.map((count, shellIndex) => {
          const r = MIN_R + step * shellIndex
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
                strokeOpacity={0.28}
                strokeWidth={1}
                strokeDasharray="3 4"
                className="text-sky-300"
              />
              <motion.g
                style={{ originX: `${CENTER}px`, originY: `${CENTER}px` }}
                animate={animations ? { rotate: direction } : { rotate: 0 }}
                transition={
                  animations
                    ? { repeat: Infinity, ease: 'linear', duration }
                    : { duration: 0 }
                }
              >
                {Array.from({ length: count }, (_, i) => {
                  const angle = (Math.PI * 2 * i) / count - Math.PI / 2
                  const ex = CENTER + Math.cos(angle) * r
                  const ey = CENTER + Math.sin(angle) * r
                  const dotR = count > 18 ? 2.4 : count > 8 ? 3 : 3.6
                  return (
                    <circle
                      key={i}
                      cx={ex}
                      cy={ey}
                      r={dotR}
                      fill="#e6f7ff"
                      stroke={meta.light}
                      strokeWidth={0.8}
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
          <text x={CENTER} y={CENTER + 14} textAnchor="middle" fontSize={8} fill="#06121f" opacity={0.75}>
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
