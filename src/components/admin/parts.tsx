import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'motion/react'
import { clsx } from 'clsx'
import { PlanetArt, type ArtKind } from '~/components/space/PlanetArt'
import { Search } from '~/components/ui/Icons'
import { spotlightHandlers } from '~/hooks/useSpotlight'

/** מספר שנספר מעלה בכניסה למסך ומתעדכן בתנועה כשהנתון משתנה */
export function AnimatedNumber({ value, format = (n) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const from = useRef(0)
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (!inView) return
    if (reduce) return void setShown(value)
    const controls = animate(from.current, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        from.current = v
        setShown(v)
      },
    })
    return () => controls.stop()
  }, [inView, reduce, value])

  return (
    <span ref={ref} className="num">
      {format(shown)}
    </span>
  )
}

export function KpiTile({ icon, label, children, note, delay = 0, tone = 'primary' }: { icon: ReactNode; label: string; children: ReactNode; note?: ReactNode; delay?: number; tone?: 'primary' | 'accent' | 'gold' | 'success' }) {
  const reduce = useReducedMotion()
  const spot = spotlightHandlers()
  const tones = { primary: 'bg-primary-soft text-primary', accent: 'bg-accent-soft text-accent', gold: 'bg-gold-soft text-gold', success: 'bg-success-soft text-success' }
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -4 }}
      onPointerMove={spot.onPointerMove}
      className="spotlight glass flex flex-col gap-4 rounded-card p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <dt className="text-caption font-medium text-foreground-muted">{label}</dt>
        <span className={clsx('grid size-10 shrink-0 place-items-center rounded-full', tones[tone])}>{icon}</span>
      </div>
      <dd className="font-display text-[clamp(1.9rem,1.4rem+1.6vw,2.6rem)] leading-none text-foreground">{children}</dd>
      {note && <p className="text-caption text-foreground-subtle">{note}</p>}
    </motion.div>
  )
}

/** מד תפוסה: פס שמתמלא בתנועה, ולצדו "נוסעים מתוך מושבים" */
export function OccupancyMeter({ booked, seats, size = 'sm', className }: { booked: number; seats: number; size?: 'sm' | 'lg'; className?: string }) {
  const reduce = useReducedMotion()
  const ratio = seats > 0 ? Math.min(1, booked / seats) : 0
  const full = seats > 0 && booked >= seats
  const tone = full ? 'from-gold to-warning' : ratio >= 0.8 ? 'from-warning to-primary' : 'from-primary to-accent'
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={clsx('font-medium text-foreground', size === 'lg' ? 'text-title' : 'text-body')}>
          <span className="num">{booked}</span>
          <span className="text-caption font-normal text-foreground-subtle"> מתוך </span>
          <span className="num text-foreground-muted">{seats}</span>
        </span>
        <span className={clsx('num text-caption', full ? 'font-semibold text-gold' : 'text-foreground-subtle')}>{full ? 'מלא' : `${Math.round(ratio * 100)}%`}</span>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={seats}
        aria-valuenow={booked}
        aria-label={`${booked} נוסעים מתוך ${seats} מושבים`}
        className={clsx('overflow-hidden rounded-full bg-surface-sunken', size === 'lg' ? 'h-2.5' : 'h-1.5')}
      >
        <motion.div
          className={clsx('h-full rounded-full bg-gradient-to-l', tone)}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 20, delay: 0.15 }}
        />
      </div>
    </div>
  )
}

export function SearchBox({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="h-11 w-full rounded-full border border-border-strong bg-surface-sunken/80 pe-4 ps-10 text-body text-foreground transition-[border-color,box-shadow] duration-200 placeholder:text-foreground-subtle hover:border-primary focus-visible:border-accent focus-visible:shadow-focus"
      />
    </label>
  )
}

/** כפתורי סינון מעוגלים */
export function Chips<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string; count?: number }>; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              'relative rounded-full border px-4 py-1.5 text-caption font-medium transition-colors duration-300 focus-visible:shadow-focus',
              active ? 'border-primary text-primary' : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground',
            )}
          >
            {active && <motion.span layoutId={`chip-${label}`} className="absolute inset-0 rounded-full bg-primary-soft" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && <span className="num opacity-70">{o.count}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------ טבלה רספונסיבית ------------------------------ */
/* במסך רחב: טבלה. במסך צר: כל שורה הופכת לכרטיס, וכותרת העמודה מופיעה לצד הערך. */

export function DataTable({ caption, head, children, empty }: { caption: string; head: string[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="glass overflow-hidden rounded-panel shadow-card">
      <table className="w-full border-separate border-spacing-0 text-start max-md:block">
        <caption className="sr-only">{caption}</caption>
        <thead className="max-md:sr-only">
          <tr>
            {head.map((h, i) => (
              <th key={h || i} scope="col" className="border-b border-border bg-surface-sunken/60 px-5 py-3.5 text-start text-caption font-medium text-foreground-subtle first:ps-6 last:pe-6">
                {h || <span className="sr-only">פעולות</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:flex max-md:flex-col">{children}</tbody>
      </table>
      {empty}
    </div>
  )
}

export function Row({ children, index = 0, dim }: { children: ReactNode; index?: number; dim?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.tr
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: dim ? 0.6 : 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 10) * 0.035, ease: [0.22, 1, 0.36, 1] }}
      className="group transition-colors duration-300 hover:bg-primary-soft/40 max-md:grid max-md:grid-cols-1 max-md:gap-3 max-md:border-b max-md:border-border max-md:p-5 max-md:last:border-b-0"
    >
      {children}
    </motion.tr>
  )
}

export function Cell({ label, children, className, primary }: { label?: string; children: ReactNode; className?: string; primary?: boolean }) {
  return (
    <td
      className={clsx(
        'px-5 py-4 align-middle first:ps-6 last:pe-6 md:border-b md:border-border md:group-last:border-b-0',
        'max-md:flex max-md:items-center max-md:justify-between max-md:gap-4 max-md:p-0',
        primary && 'max-md:block',
        className,
      )}
    >
      {label && <span className="shrink-0 text-caption text-foreground-subtle md:hidden">{label}</span>}
      <div className={clsx('min-w-0', !primary && 'max-md:text-end')}>{children}</div>
    </td>
  )
}

export function TableEmpty({ text }: { text: string }) {
  return <p className="px-6 py-14 text-center text-foreground-muted">{text}</p>
}

/** עיגול עם האות הראשונה של השם */
export function Avatar({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full border border-border-strong bg-gradient-to-br from-primary-soft to-accent-soft font-display text-body text-foreground">
      {name.trim().charAt(0) || '?'}
    </span>
  )
}

/** כוכב היעד בתיבה ברוחב קבוע: הטבעות של שבתאי רחבות מהכוכב עצמו ולא ידחפו את הטקסט */
export function PlanetBadge({ kind, size = 38 }: { kind: ArtKind; size?: number }) {
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center" style={{ width: size * 1.7, height: size * 1.25 }}>
      <PlanetArt kind={kind} size={size} period={110} />
    </span>
  )
}
