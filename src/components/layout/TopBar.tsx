import { motion } from 'framer-motion'
import type { View } from '@/types'
import { levelInfo, levelTitle } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useUiStore } from '@/store/useUiStore'
import { authEnabled } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

const NAV: { view: View; label: string; icon: string }[] = [
  { view: 'menu', label: '홈', icon: '⌂' },
  { view: 'explorer', label: '도감', icon: '🔎' },
  { view: 'notebook', label: '오답노트', icon: '📕' },
  { view: 'stats', label: '기록', icon: '📊' },
  { view: 'achievements', label: '업적', icon: '🏅' },
]

export function TopBar() {
  const view = useUiStore((s) => s.view)
  const setView = useUiStore((s) => s.setView)
  const openSettings = useUiStore((s) => s.openSettings)
  const openAccount = useUiStore((s) => s.openAccount)
  const user = useAuthStore((s) => s.user)
  const sync = useAuthStore((s) => s.sync)
  const xp = useProgressStore((s) => s.xp)
  const info = levelInfo(xp)

  return (
    <header className="sticky top-0 z-40 border-b divider bg-[color:var(--bg)]/72 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-3 py-2.5 sm:px-5">
        <button
          onClick={() => setView('menu')}
          className="flex shrink-0 items-center gap-2"
          aria-label="ATOMIC 홈으로"
        >
          <span className="relative flex h-9 w-9 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-sky-400/20 blur-[6px]" />
            <svg viewBox="0 0 64 64" className="relative h-8 w-8">
              <g fill="none" stroke="currentColor" strokeWidth="3" className="text-sky-300">
                <ellipse cx="32" cy="32" rx="26" ry="10" />
                <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(60 32 32)" />
                <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(120 32 32)" />
              </g>
              <circle cx="32" cy="32" r="6.5" className="fill-sky-200" />
            </svg>
          </span>
          <span className="hidden text-lg font-black tracking-[0.22em] sm:block">ATOMIC</span>
        </button>

        <nav className="ml-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={cn(
                'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                view === item.view
                  ? 'bg-sky-500/18 text-accent'
                  : 'text-dim hover:text-[color:var(--text)]',
              )}
            >
              <span className="mr-1">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="hidden w-44 shrink-0 md:block">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-[11px] font-bold text-accent">
              Lv.{info.level} <span className="text-faint">{levelTitle(info.level)}</span>
            </span>
            <span className="text-[10px] text-faint num-display">
              {info.current}/{info.needed}
            </span>
          </div>
          <ProgressBar value={info.current} max={info.needed} className="h-1.5" />
        </div>

        <motion.div
          key={info.level}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-black text-white shadow-glow md:hidden"
        >
          {info.level}
        </motion.div>

        {authEnabled && (
          <Button
            size="sm"
            onClick={openAccount}
            className="shrink-0"
            aria-label={user ? '계정' : '로그인'}
          >
            {user ? '👤' : '🔑'}
            <span className="hidden lg:inline">{user ? '계정' : '로그인'}</span>
            {user && sync === 'syncing' && (
              <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />
            )}
            {user && (sync === 'offline' || sync === 'error') && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </Button>
        )}

        <Button size="sm" onClick={openSettings} className="shrink-0" aria-label="설정 열기">
          ⚙︎<span className="hidden lg:inline">설정</span>
        </Button>
      </div>
    </header>
  )
}
