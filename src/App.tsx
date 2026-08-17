import { useEffect } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import { audio } from '@/lib/audio'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useUiStore } from '@/store/useUiStore'
import { TopBar } from '@/components/layout/TopBar'
import { MainMenu } from '@/components/menu/MainMenu'
import { GameScreen } from '@/components/game/GameScreen'
import { ResultScreen } from '@/components/game/ResultScreen'
import { ExplorerScreen } from '@/components/screens/ExplorerScreen'
import { WrongNoteScreen } from '@/components/screens/WrongNoteScreen'
import { StatsScreen } from '@/components/screens/StatsScreen'
import { AchievementsScreen } from '@/components/screens/AchievementsScreen'
import { SettingsModal } from '@/components/screens/SettingsModal'
import { ShortcutsModal } from '@/components/screens/ShortcutsModal'
import { ElementDetailModal } from '@/components/periodic/ElementDetailModal'
import { ToastStack } from '@/components/ui/ToastStack'

const SCREENS = {
  menu: MainMenu,
  game: GameScreen,
  result: ResultScreen,
  explorer: ExplorerScreen,
  notebook: WrongNoteScreen,
  stats: StatsScreen,
  achievements: AchievementsScreen,
} as const

export default function App() {
  const view = useUiStore((s) => s.view)
  const openShortcuts = useUiStore((s) => s.openShortcuts)
  const theme = useSettingsStore((s) => s.theme)
  const animations = useSettingsStore((s) => s.animations)

  /* 테마 적용 */
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#060b16' : '#eef4fb')
  }, [theme])

  /* 애니메이션 끄기 */
  useEffect(() => {
    document.body.classList.toggle('no-anim', !animations)
  }, [animations])

  /* 브라우저 자동재생 정책 — 첫 상호작용에서 오디오를 깨운다 */
  useEffect(() => {
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useKeyboardShortcuts({
    '?': openShortcuts,
    '/': () => {
      /* 도감 화면에서 따로 처리 */
    },
  })

  const Screen = SCREENS[view]

  return (
    <MotionConfig reducedMotion={animations ? 'never' : 'always'}>
      <div className="flex min-h-full flex-col">
        <TopBar />

        <main className="flex-1 safe-bottom">
          {/*
            화면 전환은 진입 애니메이션만 쓴다.
            exit 를 기다리는 방식(AnimatePresence mode="wait")은 전환이 한 박자 늦고,
            애니메이션이 멈춘 환경에서 다음 화면이 아예 안 뜰 수 있다.
          */}
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Screen />
          </motion.div>
        </main>

        <footer className="border-t px-4 py-4 text-center text-[11px] text-faint divider">
          ATOMIC · 118개 원소 학습 게임 · 진행도는 이 브라우저에 저장됩니다
        </footer>

        <SettingsModal />
        <ShortcutsModal />
        <ElementDetailModal />
        <ToastStack />
      </div>
    </MotionConfig>
  )
}
