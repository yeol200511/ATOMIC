import type { PlayRecord } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgressStore, type ProgressSnapshot } from '@/store/useProgressStore'

/**
 * 로컬 ↔ 클라우드 진행도 동기화.
 *
 * 규칙은 하나로 단순하게 잡았다 — **클라우드가 정본이다.**
 * 로그인하면 클라우드를 내려받아 로컬을 갈아 끼운다. 클라우드가 비어 있을 때만
 * (첫 로그인) 로컬을 올린다. 로그인한 뒤로는 판이 끝날 때마다 올린다.
 *
 * 두 기기에서 오프라인으로 각각 플레이하면 나중에 올린 쪽이 이긴다. 이걸 제대로
 * 병합하려면 필드마다 다른 규칙(최고기록은 max, 누적은 합)이 필요한데, 합을 쓰면
 * 같은 판이 두 번 세어지는 사고가 나기 쉽다. 판 기록(runs)만은 판마다 고유 id 로
 * 쌓아서 어느 기기에서 플레이했든 한 번씩만 남는다.
 */

/** 판 기록은 판마다 고유 id 가 있어 중복 없이 쌓인다 */
function toRunRow(userId: string, r: PlayRecord) {
  return {
    user_id: userId,
    client_id: r.id,
    played_at: new Date(r.at).toISOString(),
    mode: r.mode,
    difficulty: r.difficulty,
    length: String(r.length),
    review: r.review ?? false,
    score: r.score,
    correct: r.correct,
    total: r.total,
    max_combo: r.maxCombo,
    avg_ms: Math.round(r.avgMs),
    duration_ms: Math.round(r.durationMs),
  }
}

function toProgressRow(userId: string, s: ProgressSnapshot) {
  return {
    user_id: userId,
    xp: s.xp,
    play_count: s.playCount,
    best_score: s.bestScore,
    best_combo: s.bestCombo,
    total_correct: s.totalCorrect,
    total_wrong: s.totalWrong,
    total_time_ms: s.totalTimeMs,
    perfect_runs: s.perfectRuns,
    best_accuracy: s.bestAccuracy,
    best_avg_ms: s.bestAvgMs,
    hard_runs: s.hardRuns,
    best_endless: s.bestEndless,
    daily_completed_days: s.dailyCompletedDays,
    modes_played: s.modesPlayed,
    viewed_elements: s.viewedElements,
    wrong_notes: s.wrongNotes,
    achievements: s.achievements,
    daily: s.daily,
    updated_at: new Date().toISOString(),
  }
}

type ProgressRow = ReturnType<typeof toProgressRow>

function fromProgressRow(row: ProgressRow, history: PlayRecord[]): ProgressSnapshot {
  return {
    xp: row.xp,
    playCount: row.play_count,
    bestScore: row.best_score,
    bestCombo: row.best_combo,
    totalCorrect: row.total_correct,
    totalWrong: row.total_wrong,
    totalTimeMs: row.total_time_ms,
    perfectRuns: row.perfect_runs,
    bestAccuracy: row.best_accuracy,
    bestAvgMs: row.best_avg_ms,
    hardRuns: row.hard_runs,
    bestEndless: row.best_endless,
    dailyCompletedDays: row.daily_completed_days,
    modesPlayed: row.modes_played,
    viewedElements: row.viewed_elements,
    history,
    wrongNotes: row.wrong_notes,
    achievements: row.achievements,
    daily: row.daily,
  } as ProgressSnapshot
}

/** 클라우드에서 최근 판 기록을 받아 로컬 캐시로 쓴다 */
const HISTORY_FETCH = 500

async function fetchHistory(userId: string): Promise<PlayRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('runs')
    .select('client_id, played_at, mode, difficulty, length, review, score, correct, total, max_combo, avg_ms, duration_ms')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(HISTORY_FETCH)

  if (error || !data) return []

  return data.map((r) => ({
    id: r.client_id,
    at: new Date(r.played_at).getTime(),
    mode: r.mode,
    difficulty: r.difficulty,
    length: r.length === 'endless' ? 'endless' : (Number(r.length) as 10 | 20),
    review: r.review,
    score: r.score,
    correct: r.correct,
    total: r.total,
    maxCombo: r.max_combo,
    avgMs: r.avg_ms,
    durationMs: r.duration_ms,
  })) as PlayRecord[]
}

/**
 * 로그인 직후 한 번. 클라우드에 진행도가 있으면 내려받고, 없으면 지금 로컬을 올린다.
 */
export async function syncOnSignIn(userId: string): Promise<void> {
  if (!supabase) return
  const auth = useAuthStore.getState()
  auth.setSync('syncing')

  try {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (data) {
      // 클라우드가 정본 — 로컬을 갈아 끼운다
      const history = await fetchHistory(userId)
      useProgressStore.getState().hydrate(fromProgressRow(data as ProgressRow, history))
    } else {
      // 첫 로그인 — 지금까지 이 기기에서 쌓은 것을 올린다
      await pushAll(userId)
    }

    auth.setSync('synced', Date.now())
  } catch (e) {
    auth.setSync(navigator.onLine ? 'error' : 'offline')
    console.warn('[sync] 로그인 동기화 실패', e)
  }
}

/** 진행도 스냅샷과 아직 안 올라간 판 기록을 통째로 올린다 */
export async function pushAll(userId: string): Promise<void> {
  if (!supabase) return
  const snapshot = useProgressStore.getState().snapshot()

  const { error: pErr } = await supabase
    .from('progress')
    .upsert(toProgressRow(userId, snapshot), { onConflict: 'user_id' })
  if (pErr) throw pErr

  if (snapshot.history.length > 0) {
    const rows = snapshot.history.map((r) => toRunRow(userId, r))
    // 같은 판이 이미 있으면 무시된다 (user_id + client_id 유니크)
    const { error: rErr } = await supabase
      .from('runs')
      .upsert(rows, { onConflict: 'user_id,client_id', ignoreDuplicates: true })
    if (rErr) throw rErr
  }
}

/** 판이 끝날 때마다 호출 — 진행도 스냅샷 갱신 + 이번 판 기록 추가 */
export async function pushAfterRun(record: PlayRecord): Promise<void> {
  const auth = useAuthStore.getState()
  const userId = auth.user?.id
  if (!supabase || !userId) return

  auth.setSync('syncing')
  try {
    const snapshot = useProgressStore.getState().snapshot()

    const { error: pErr } = await supabase
      .from('progress')
      .upsert(toProgressRow(userId, snapshot), { onConflict: 'user_id' })
    if (pErr) throw pErr

    const { error: rErr } = await supabase
      .from('runs')
      .upsert(toRunRow(userId, record), { onConflict: 'user_id,client_id', ignoreDuplicates: true })
    if (rErr) throw rErr

    auth.setSync('synced', Date.now())
  } catch (e) {
    // 실패해도 게임은 그대로 간다 — 로컬에는 이미 남아 있고, 다음 판이나 재접속 때 다시 올라간다
    auth.setSync(navigator.onLine ? 'error' : 'offline')
    console.warn('[sync] 판 기록 업로드 실패', e)
  }
}

/** 오프라인에서 쌓인 것을 한 번에 밀어 올린다 */
export async function pushPending(): Promise<void> {
  const auth = useAuthStore.getState()
  const userId = auth.user?.id
  if (!supabase || !userId) return

  auth.setSync('syncing')
  try {
    await pushAll(userId)
    auth.setSync('synced', Date.now())
  } catch (e) {
    auth.setSync(navigator.onLine ? 'error' : 'offline')
    console.warn('[sync] 밀린 기록 업로드 실패', e)
  }
}
