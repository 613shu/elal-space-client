import { useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Alert } from './Icons'

type ToastTone = 'success' | 'danger' | 'info'
interface ToastItem {
  id: number
  tone: ToastTone
  text: string
}

let items: ToastItem[] = []
let seq = 0
const subs = new Set<() => void>()
const emit = () => subs.forEach((s) => s())

export function toast(text: string, tone: ToastTone = 'info', ms = 4800) {
  const id = ++seq
  items = [...items, { id, tone, text }]
  emit()
  setTimeout(() => {
    items = items.filter((t) => t.id !== id)
    emit()
  }, ms)
}

const subscribe = (cb: () => void) => {
  subs.add(cb)
  return () => void subs.delete(cb)
}
const empty: ToastItem[] = []

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => empty)
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {list.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass pointer-events-auto flex max-w-md items-center gap-3 rounded-full px-5 py-3 text-body shadow-lift"
          >
            {t.tone === 'danger' ? <Alert className="size-5 text-destructive" /> : <Check className="size-5 text-success" />}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
