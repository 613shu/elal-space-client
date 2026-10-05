import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useId, useRef } from 'react'
import { clsx } from 'clsx'

interface LogoProps {
  size?: number
  className?: string
  /** כשהלוגו בתוך קישור: לא להפוך אותו לכפתור נפרד */
  decorative?: boolean
  title?: string
}

/**
 * הלוגו של "אל על חלל": טבעת מסלול, סליל בצורת S וכוכב במרכז.
 * מסתובב במגע: לחיצה = סיבוב מלא, גרירה = פיתול כמו חוגה עם תנופה.
 * בהעדפת "הפחתת תנועה": בלי תנופה ובלי סיבוב אוטומטי, רק תגובה ישירה למגע.
 */
export function Logo({ size = 44, className, decorative = true, title = 'אל על חלל' }: LogoProps) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()
  const rotate = useMotionValue(0)
  const wrap = useRef<HTMLSpanElement>(null)
  const drag = useRef<{ last: number; moved: number; t: number; v: number } | null>(null)

  const angleAt = (e: React.PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect()
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI
  }

  const spinFull = () => {
    const to = rotate.get() + 360
    if (reduce) return void rotate.set(to)
    animate(rotate, to, { type: 'spring', stiffness: 60, damping: 11, mass: 1.1 })
  }

  return (
    <span
      ref={wrap}
      className={clsx('relative inline-grid place-items-center touch-none select-none', className)}
      style={{ width: size, height: size }}
      onPointerDown={(e) => {
        drag.current = { last: angleAt(e), moved: 0, t: performance.now(), v: 0 }
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        let delta = angleAt(e) - d.last
        if (delta > 180) delta -= 360
        if (delta < -180) delta += 360
        const now = performance.now()
        d.v = delta / Math.max(1, now - d.t)
        d.t = now
        d.last = angleAt(e)
        d.moved += Math.abs(delta)
        rotate.set(rotate.get() + delta)
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
        if (!d) return
        if (d.moved < 6) return spinFull()
        if (!reduce) animate(rotate, rotate.get() + d.v * 700, { type: 'spring', stiffness: 28, damping: 9 })
      }}
      onPointerCancel={() => (drag.current = null)}
      onMouseEnter={() => {
        if (!reduce && !drag.current) animate(rotate, rotate.get() + 24, { type: 'spring', stiffness: 90, damping: 10 })
      }}
    >
      <motion.svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        role={decorative ? 'presentation' : 'img'}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : title}
        style={{ rotate, overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-accent)" />
            <stop offset="1" stopColor="var(--color-primary)" />
          </linearGradient>
          <radialGradient id={`d-${uid}`} cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="var(--color-surface-raised)" />
            <stop offset="1" stopColor="var(--color-background-deep)" />
          </radialGradient>
          <radialGradient id={`h-${uid}`}>
            <stop offset="0" stopColor="var(--color-foreground)" stopOpacity="0.95" />
            <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
          </radialGradient>
          <filter id={`b-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>

        <circle cx="60" cy="60" r="57" fill={`url(#d-${uid})`} />
        <circle cx="60" cy="60" r="57" fill="none" stroke="var(--color-border-strong)" strokeWidth="1" />

        {/* טבעת המסלול: שלושה קשתות */}
        <g fill="none" stroke={`url(#g-${uid})`} strokeWidth="2.6" strokeLinecap="round">
          <path d="M60 8 A52 52 0 0 1 108.3 40.8" />
          <path d="M111.6 66 A52 52 0 0 1 72 109.2" opacity="0.85" />
          <path d="M48 109.2 A52 52 0 0 1 8.6 71" opacity="0.7" />
          <path d="M9.4 50 A52 52 0 0 1 28 18.4" opacity="0.55" />
        </g>

        {/* ה-S: אור מטושטש מתחת ואור חד מעליו */}
        <g fill="none" strokeLinecap="round">
          <path
            d="M78 42 A18 18 0 1 0 60 60 A18 18 0 1 1 42 78"
            stroke="var(--color-primary)"
            strokeWidth="7"
            opacity="0.55"
            filter={`url(#b-${uid})`}
          />
          <path d="M78 42 A18 18 0 1 0 60 60 A18 18 0 1 1 42 78" stroke={`url(#g-${uid})`} strokeWidth="3.4" />
        </g>

        {/* כוכב מרכזי */}
        <circle cx="60" cy="60" r="11" fill={`url(#h-${uid})`} />
        <circle cx="60" cy="60" r="3.2" fill="var(--color-foreground)" />
        <path d="M60 51 V69 M51 60 H69" stroke="var(--color-foreground)" strokeWidth="0.9" strokeLinecap="round" opacity="0.75" />

        {/* לוויין במסלול */}
        <g className="motion-safe:animate-orbit" style={{ transformOrigin: '60px 60px' }}>
          <circle cx="60" cy="8" r="3.3" fill="var(--color-foreground)" />
          <circle cx="60" cy="8" r="6.5" fill="var(--color-accent)" opacity="0.28" />
        </g>
      </motion.svg>
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx('flex flex-col leading-none', className)}>
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-foreground">אל על חלל</span>
      <span dir="ltr" className="mt-1 text-micro font-medium uppercase tracking-[0.32em] text-foreground-subtle">
        EL AL SPACE
      </span>
    </span>
  )
}
