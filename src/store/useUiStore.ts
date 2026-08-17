import { create } from 'zustand'
import type { View } from '@/types'

export interface Toast {
  id: number
  icon: string
  title: string
  description?: string
}

interface UiState {
  view: View
  settingsOpen: boolean
  shortcutsOpen: boolean
  configOpen: boolean
  accountOpen: boolean
  detailNumber: number | null
  toasts: Toast[]

  setView: (view: View) => void
  openSettings: () => void
  closeSettings: () => void
  openShortcuts: () => void
  closeShortcuts: () => void
  openConfig: () => void
  closeConfig: () => void
  openAccount: () => void
  closeAccount: () => void
  showDetail: (elementNumber: number | null) => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

let toastSeq = 0

export const useUiStore = create<UiState>()((set) => ({
  view: 'menu',
  settingsOpen: false,
  shortcutsOpen: false,
  configOpen: false,
  accountOpen: false,
  detailNumber: null,
  toasts: [],

  setView: (view) => set({ view }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  openShortcuts: () => set({ shortcutsOpen: true }),
  closeShortcuts: () => set({ shortcutsOpen: false }),
  openConfig: () => set({ configOpen: true }),
  closeConfig: () => set({ configOpen: false }),
  openAccount: () => set({ accountOpen: true }),
  closeAccount: () => set({ accountOpen: false }),
  showDetail: (detailNumber) => set({ detailNumber }),

  pushToast: (toast) => {
    const id = ++toastSeq
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4200)
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
