import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { authEnabled, redirectTo, supabase } from '@/lib/supabase'

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

interface AuthState {
  /** 세션 복구를 아직 시도 중인지 — 첫 화면에서 깜빡임을 막는다 */
  loading: boolean
  user: User | null
  session: Session | null
  sync: SyncState
  /** 마지막으로 클라우드에 올린 시각 */
  syncedAt: number | null
  error: string | null

  init: () => void
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<{ needsConfirm: boolean }>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setSync: (sync: SyncState, at?: number) => void
  clearError: () => void
}

let initialized = false

export const useAuthStore = create<AuthState>()((set, get) => ({
  loading: authEnabled,
  user: null,
  session: null,
  sync: 'idle',
  syncedAt: null,
  error: null,

  init: () => {
    if (initialized || !supabase) {
      set({ loading: false })
      return
    }
    initialized = true

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, loading: false })
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
    })
  },

  signInWithGoogle: async () => {
    if (!supabase) return
    set({ error: null })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    })
    if (error) set({ error: error.message })
  },

  signUpWithEmail: async (email, password) => {
    if (!supabase) return { needsConfirm: false }
    set({ error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo() },
    })
    if (error) {
      set({ error: error.message })
      throw error
    }
    // 이메일 확인이 켜져 있으면 세션 없이 사용자만 돌아온다
    return { needsConfirm: !data.session }
  },

  signInWithEmail: async (email, password) => {
    if (!supabase) return
    set({ error: null })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message })
      throw error
    }
  },

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    set({ user: null, session: null, sync: 'idle', syncedAt: null })
  },

  setSync: (sync, at) => set({ sync, syncedAt: at ?? get().syncedAt }),
  clearError: () => set({ error: null }),
}))
