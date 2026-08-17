import { useEffect } from 'react'
import { CATEGORIES, STATE_ICON, STATE_LABEL } from '@/data/categories'
import { getElement } from '@/lib/elements'
import { positionAnswerText } from '@/lib/quiz'
import { useProgressStore } from '@/store/useProgressStore'
import { useUiStore } from '@/store/useUiStore'
import { BohrModel } from '@/components/bohr/BohrModel'
import { Modal } from '@/components/ui/Modal'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-2 divider last:border-0">
      <span className="label-xs">{label}</span>
      <span className="text-right text-sm font-semibold num-display">{value}</span>
    </div>
  )
}

export function ElementDetailModal() {
  const detailNumber = useUiStore((s) => s.detailNumber)
  const showDetail = useUiStore((s) => s.showDetail)
  const viewElement = useProgressStore((s) => s.viewElement)
  const element = detailNumber !== null ? getElement(detailNumber) : undefined

  useEffect(() => {
    if (detailNumber !== null) viewElement(detailNumber)
  }, [detailNumber, viewElement])

  if (!element) {
    return <Modal open={false} onClose={() => showDetail(null)}>{null}</Modal>
  }

  const meta = CATEGORIES[element.category]

  return (
    <Modal
      open={detailNumber !== null}
      onClose={() => showDetail(null)}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: `linear-gradient(160deg, ${meta.color}, ${meta.color}99)` }}
          >
            {element.symbol}
          </span>
          {element.name}
          <span className="text-sm font-normal text-dim">{element.nameEn}</span>
        </span>
      }
      subtitle={`${element.number}번 · ${meta.label} · ${STATE_ICON[element.state]} ${STATE_LABEL[element.state]}`}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <p className="mb-4 text-sm leading-relaxed text-dim">{element.description}</p>
          <div className="panel-soft px-4 py-2">
            <Row label="원자번호" value={String(element.number)} />
            <Row label="원자량" value={String(element.mass)} />
            <Row label="주기 · 족" value={positionAnswerText(element)} />
            <Row label="상태 (상온)" value={STATE_LABEL[element.state]} />
            <Row label="분류" value={meta.label} />
            <Row label="전자배치" value={element.electronConfig} />
            <Row label="보어 모형" value={element.shells.join(' · ')} />
            {element.aliases.length > 0 && <Row label="다른 이름" value={element.aliases.join(', ')} />}
          </div>
        </div>
        <div className="flex flex-col items-center justify-start">
          <BohrModel element={element} size={220} />
        </div>
      </div>
    </Modal>
  )
}
