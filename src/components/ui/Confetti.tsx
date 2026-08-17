import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from '@/store/useSettingsStore'

interface Particle {
  id: number
  x: number
  y: number
  rotate: number
  scale: number
  color: string
  delay: number
}

const COLORS = ['#38bdf8', '#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#4ade80', '#fb923c']

interface ConfettiProps {
  /** 값이 바뀔 때마다 한 번 터진다 */
  trigger: number
  count?: number
  /** 폭죽 세기 (콤보가 높을수록 크게) */
  power?: number
}

export function Confetti({ trigger, count = 26, power = 1 }: ConfettiProps) {
  const animations = useSettingsStore((s) => s.animations)
  const [burst, setBurst] = useState<{ key: number; particles: Particle[] } | null>(null)

  const make = useMemo(
    () => (seedKey: number): Particle[] =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
        const distance = (70 + Math.random() * 120) * power
        return {
          id: seedKey * 1000 + i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 30,
          rotate: Math.random() * 540 - 270,
          scale: 0.6 + Math.random() * 0.9,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.08,
        }
      }),
    [count, power],
  )

  useEffect(() => {
    if (trigger <= 0 || !animations) return
    setBurst({ key: trigger, particles: make(trigger) })
    const timer = window.setTimeout(() => setBurst(null), 1100)
    return () => window.clearTimeout(timer)
  }, [trigger, animations, make])

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible">
      <AnimatePresence>
        {burst?.particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute block rounded-[2px]"
            style={{ background: p.color, width: 8, height: 12 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y + 70,
              opacity: 0,
              scale: p.scale,
              rotate: p.rotate,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.95, delay: p.delay, ease: [0.16, 0.8, 0.4, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
