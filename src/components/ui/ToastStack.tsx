import { AnimatePresence, motion } from 'framer-motion'
import { useUiStore } from '@/store/useUiStore'

export function ToastStack() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            layout
            onClick={() => dismiss(toast.id)}
            className="panel pointer-events-auto flex w-full max-w-sm items-center gap-3 px-4 py-3 text-left"
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <span className="text-2xl">{toast.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{toast.title}</span>
              {toast.description && (
                <span className="block truncate text-xs text-dim">{toast.description}</span>
              )}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
