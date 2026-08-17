import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Difficulty, QuizMode, SessionLength } from '@/types'
import { audio } from '@/lib/audio'
import { safeStorage, STORAGE_KEYS } from '@/lib/storage'

export type Theme = 'dark' | 'light'

interface SettingsState {
  bgm: boolean
  sfx: boolean
  animations: boolean
  theme: Theme
  /** 문제 화면에 보조 설명을 함께 보여줄지 */
  showHints: boolean

  /* 마지막으로 고른 게임 설정 — 다음에 들어와도 그대로 남는다 */
  mode: QuizMode
  difficulty: Difficulty
  length: SessionLength
  timeLimit: boolean

  setBgm: (value: boolean) => void
  setSfx: (value: boolean) => void
  setAnimations: (value: boolean) => void
  setTheme: (value: Theme) => void
  toggleTheme: () => void
  setShowHints: (value: boolean) => void
  setMode: (value: QuizMode) => void
  setDifficulty: (value: Difficulty) => void
  setLength: (value: SessionLength) => void
  setTimeLimit: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      bgm: false,
      sfx: true,
      animations: true,
      theme: 'dark',
      showHints: true,

      mode: 'random',
      difficulty: 'easy',
      length: 10,
      timeLimit: false,

      setMode: (value) => set({ mode: value }),
      setDifficulty: (value) => set({ difficulty: value }),
      setLength: (value) => set({ length: value }),
      setTimeLimit: (value) => set({ timeLimit: value }),

      setBgm: (value) => {
        audio.setBgm(value)
        set({ bgm: value })
      },
      setSfx: (value) => {
        audio.setSfx(value)
        set({ sfx: value })
      },
      setAnimations: (value) => set({ animations: value }),
      setTheme: (value) => set({ theme: value }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setShowHints: (value) => set({ showHints: value }),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        audio.setSfx(state.sfx)
        audio.bgmEnabled = state.bgm
      },
    },
  ),
)
