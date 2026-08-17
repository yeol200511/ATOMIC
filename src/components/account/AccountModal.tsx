import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { authEnabled } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgressStore } from '@/store/useProgressStore'
import { useUiStore } from '@/store/useUiStore'
import { formatDate } from '@/lib/utils'

type Tab = 'signin' | 'signup'

export function AccountModal() {
  const open = useUiStore((s) => s.accountOpen)
  const close = useUiStore((s) => s.closeAccount)
  const pushToast = useUiStore((s) => s.pushToast)

  const user = useAuthStore((s) => s.user)
  const sync = useAuthStore((s) => s.sync)
  const syncedAt = useAuthStore((s) => s.syncedAt)
  const error = useAuthStore((s) => s.error)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail)
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail)
  const signOut = useAuthStore((s) => s.signOut)

  const playCount = useProgressStore((s) => s.playCount)

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      if (tab === 'signup') {
        const { needsConfirm } = await signUpWithEmail(email, password)
        if (needsConfirm) {
          pushToast({
            icon: '✉️',
            title: '메일을 확인해 주세요',
            description: '보내 드린 링크를 누르면 가입이 끝납니다.',
          })
        }
      } else {
        await signInWithEmail(email, password)
      }
      setPassword('')
    } catch {
      /* 오류 메시지는 스토어가 들고 있다 */
    } finally {
      setBusy(false)
    }
  }

  if (!authEnabled) {
    return (
      <Modal open={open} onClose={close} title="계정" size="sm">
        <p className="text-sm text-dim">
          이 빌드에는 계정 기능이 꺼져 있습니다. 진행도는 이 브라우저에만 저장됩니다.
        </p>
      </Modal>
    )
  }

  if (user) {
    const name =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      '이름 없음'

    const syncLabel: Record<typeof sync, string> = {
      idle: '대기 중',
      syncing: '올리는 중…',
      synced: syncedAt ? `${formatDate(syncedAt)}에 저장됨` : '저장됨',
      offline: '오프라인 — 연결되면 올립니다',
      error: '올리지 못했습니다. 다음 판에 다시 시도합니다',
    }

    return (
      <Modal open={open} onClose={close} title="계정" subtitle={name} size="sm">
        <div className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-dim">동기화</dt>
              <dd className="text-right">{syncLabel[sync]}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-dim">이 기기에 있는 기록</dt>
              <dd className="num-display">{playCount}판</dd>
            </div>
          </dl>

          <p className="text-xs text-faint">
            진행도는 판이 끝날 때마다 클라우드에 올라갑니다. 다른 기기에서 같은 계정으로
            로그인하면 이어서 할 수 있습니다.
          </p>

          <Button
            variant="danger"
            full
            onClick={async () => {
              await signOut()
              close()
              pushToast({
                icon: '👋',
                title: '로그아웃했습니다',
                description: '이 기기에 남은 기록으로 계속 플레이할 수 있습니다.',
              })
            }}
          >
            로그아웃
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="로그인"
      subtitle="진행도를 계정에 저장하면 다른 기기에서도 이어서 할 수 있습니다"
      size="sm"
    >
      <div className="space-y-4">
        <Button variant="primary" full onClick={signInWithGoogle}>
          구글로 계속하기
        </Button>

        <div className="flex items-center gap-3 text-[11px] text-faint">
          <span className="h-px flex-1 bg-[color:var(--line)]" />
          또는
          <span className="h-px flex-1 bg-[color:var(--line)]" />
        </div>

        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {(['signin', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === t ? 'bg-sky-500/20 text-accent' : 'text-dim'
              }`}
            >
              {t === 'signin' ? '이메일 로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="email"
            className="w-full rounded-xl border border-[color:var(--line)] bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (6자 이상)"
            autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            className="w-full rounded-xl border border-[color:var(--line)] bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
          />
          <Button type="submit" variant="primary" full disabled={busy}>
            {busy ? '잠시만요…' : tab === 'signup' ? '가입하기' : '로그인'}
          </Button>
        </form>

        {error && <p className="text-xs text-rose-300">{error}</p>}

        <p className="text-[11px] text-faint">
          로그인하지 않아도 게임은 그대로 됩니다. 다만 진행도가 이 브라우저에만 남아, 데이터를
          지우거나 다른 기기에서 열면 사라집니다.
        </p>
      </div>
    </Modal>
  )
}
