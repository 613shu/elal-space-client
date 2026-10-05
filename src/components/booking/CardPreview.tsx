import { motion, useReducedMotion } from 'motion/react'
import { Logo } from '~/components/brand/Logo'

/** כרטיס אשראי חי: משקף את מה שמוקלד, והפיכה אל הגב כשממלאים CVC */
export function CardPreview({ number, name, expiry, cvc, flipped }: { number: string; name: string; expiry: string; cvc: string; flipped: boolean }) {
  const reduce = useReducedMotion()
  const digits = number.replace(/\D/g, '').padEnd(16, '•').slice(0, 16)
  const grouped = digits.match(/.{1,4}/g)!.join(' ')

  const face = 'absolute inset-0 overflow-hidden rounded-[1.4rem] border border-border-strong p-6 [backface-visibility:hidden]'

  return (
    <div className="relative mx-auto aspect-[1.586] w-full max-w-sm [perspective:1200px]" aria-hidden="true">
      <motion.div
        className="relative size-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 16 }}
      >
        <div className={`${face} bg-[linear-gradient(135deg,var(--color-surface-raised),var(--color-surface-sunken))] shadow-lift`}>
          <div className="absolute -end-10 -top-10 size-48 rounded-full bg-primary-soft blur-2xl" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <Logo size={34} />
              <span className="text-caption text-foreground-subtle">אל על חלל</span>
            </div>
            <p dir="ltr" className="num text-start font-display text-[clamp(1.2rem,0.9rem+1.2vw,1.65rem)] tracking-[0.12em]">{grouped}</p>
            <div className="flex items-end justify-between gap-4 text-caption">
              <div className="min-w-0">
                <p className="text-micro text-foreground-subtle">שם בעל הכרטיס</p>
                <p className="truncate text-body">{name || 'השם שלכם'}</p>
              </div>
              <div>
                <p className="text-micro text-foreground-subtle">תוקף</p>
                <p dir="ltr" className="num text-body">{expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className={`${face} [transform:rotateY(180deg)] bg-[linear-gradient(135deg,var(--color-surface-sunken),var(--color-surface-raised))]`}>
          <div className="-mx-6 mt-4 h-11 bg-background-deep" />
          <div className="mt-6 flex items-center gap-3">
            <div className="h-10 flex-1 rounded-md bg-foreground/90" />
            <p dir="ltr" className="num w-14 rounded-md bg-foreground px-2 py-2 text-center text-background-deep">{cvc || '•••'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
