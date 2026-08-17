import { useState } from 'react'
import { audio } from '@/lib/audio'
import { useProgressStore } from '@/store/useProgressStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Toggle'

export function SettingsModal() {
  const open = useUiStore((s) => s.settingsOpen)
  const close = useUiStore((s) => s.closeSettings)
  const openShortcuts = useUiStore((s) => s.openShortcuts)
  const settings = useSettingsStore()
  const resetAll = useProgressStore((s) => s.resetAll)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <>
      <Modal open={open} onClose={close} title="설정" subtitle="선택한 값은 자동으로 저장됩니다.">
        <div className="space-y-2.5">
          <Toggle
            icon="🎵"
            label="배경음악 (BGM)"
            description="잔잔한 신스 루프를 재생합니다."
            checked={settings.bgm}
            onChange={(value) => {
              audio.unlock()
              settings.setBgm(value)
            }}
          />
          <Toggle
            icon="🔔"
            label="효과음"
            description="클릭 · 정답 · 오답 · 콤보 · 종료 소리"
            checked={settings.sfx}
            onChange={settings.setSfx}
          />
          <Toggle
            icon="✨"
            label="애니메이션"
            description="끄면 전자 궤도와 폭죽 효과가 멈춥니다."
            checked={settings.animations}
            onChange={settings.setAnimations}
          />
          <Toggle
            icon="🌗"
            label="다크 모드"
            description="기본값은 어두운 실험실 테마입니다."
            checked={settings.theme === 'dark'}
            onChange={(value) => settings.setTheme(value ? 'dark' : 'light')}
          />
          <Toggle
            icon="💡"
            label="보조 설명 표시"
            description="문제에 힌트 문구를 함께 보여줍니다."
            checked={settings.showHints}
            onChange={settings.setShowHints}
          />

          <div className="pt-2">
            <Button full onClick={openShortcuts}>
              ⌨️ 키보드 단축키 보기
            </Button>
          </div>

          <div className="panel-soft mt-4 p-3">
            <p className="mb-2 text-xs font-semibold">저장된 데이터</p>
            <p className="mb-3 text-[11px] leading-relaxed text-dim">
              점수 · 레벨 · 오답노트 · 업적은 이 브라우저의 LocalStorage 에만 저장됩니다.
              로그인 없이 쓰는 대신, 브라우저 데이터를 지우면 함께 사라집니다.
            </p>
            <Button variant="danger" size="sm" full onClick={() => setConfirmReset(true)}>
              모든 진행도 초기화
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="정말 초기화할까요?"
        subtitle="점수 · 레벨 · 업적 · 오답노트가 모두 사라집니다."
        size="sm"
      >
        <div className="space-y-2">
          <Button
            variant="danger"
            full
            onClick={() => {
              resetAll()
              setConfirmReset(false)
              close()
            }}
          >
            전부 지우기
          </Button>
          <Button full onClick={() => setConfirmReset(false)}>
            취소
          </Button>
        </div>
      </Modal>
    </>
  )
}
