import { useUiStore } from '@/store/useUiStore'
import { Modal } from '@/components/ui/Modal'

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ['Enter'], description: '입력한 답 제출' },
  { keys: ['1', '2', '3', '4'], description: '원자모형 문제의 보기 선택' },
  { keys: ['Space'], description: '피드백 화면에서 다음 문제로' },
  { keys: ['Esc'], description: '일시정지 / 이어서 하기 · 창 닫기' },
  { keys: ['/'], description: '원소 도감에서 검색창 포커스' },
  { keys: ['?'], description: '이 단축키 목록 열기' },
]

export function ShortcutsModal() {
  const open = useUiStore((s) => s.shortcutsOpen)
  const close = useUiStore((s) => s.closeShortcuts)

  return (
    <Modal open={open} onClose={close} title="키보드 단축키" subtitle="마우스 없이도 빠르게 풀 수 있습니다." size="sm">
      <ul className="space-y-2">
        {SHORTCUTS.map((item) => (
          <li key={item.description} className="panel-soft flex items-center gap-3 px-3 py-2.5">
            <span className="flex shrink-0 gap-1">
              {item.keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded-md border px-2 py-1 text-[11px] font-bold divider"
                  style={{ background: 'var(--panel-solid)' }}
                >
                  {key}
                </kbd>
              ))}
            </span>
            <span className="text-xs text-dim">{item.description}</span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
