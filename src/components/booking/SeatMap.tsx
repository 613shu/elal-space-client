import { useRef } from 'react'
import { clsx } from 'clsx'
import type { Cabin, Seat } from '~/lib/booking/seats'

interface Props {
  cabin: Cabin
  selected?: string
  onSelect: (id: string) => void
}

/**
 * מפת מושבים אינטראקטיבית.
 * נגישות: radiogroup אחד, tabindex מתגלגל (מושב אחד בלבד בסדר הטאבים), חיצים לניווט ב-2D,
 * ותווית מלאה לכל מושב ("מושב 4C, מבט אל היעד, פנוי").
 */
export function SeatMap({ cabin, selected, onSelect }: Props) {
  const grid = useRef<HTMLDivElement>(null)
  const free = cabin.seats.filter((s) => !s.taken)
  const focusable = selected && free.some((s) => s.id === selected) ? selected : free[0]?.id

  const move = (from: Seat, dRow: number, dCol: number) => {
    const rows = cabin.rows
    let r = from.row - 1
    let c = ['A', 'B', 'C', 'D'].indexOf(from.col)
    for (let guard = 0; guard < 80; guard++) {
      c += dCol
      r += dRow
      if (dCol !== 0) {
        if (c < 0) { r -= 1; c = 3 }
        if (c > 3) { r += 1; c = 0 }
      }
      const seat = rows[r]?.seats[c]
      if (r < 0 || r >= rows.length) return
      if (seat && !seat.taken) {
        grid.current?.querySelector<HTMLButtonElement>(`[data-seat="${seat.id}"]`)?.focus()
        onSelect(seat.id)
        return
      }
    }
  }

  const onKey = (e: React.KeyboardEvent, seat: Seat) => {
    // ב-RTL "חץ ימינה" מוביל אל המושב שמימין (A), לכן הכיוון הפיזי הפוך מה-DOM
    const map: Record<string, [number, number]> = {
      ArrowRight: [0, -1],
      ArrowLeft: [0, 1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    }
    const d = map[e.key]
    if (!d) return
    e.preventDefault()
    move(seat, d[0], d[1])
  }

  return (
    <div className="glass relative mx-auto w-full max-w-md overflow-hidden rounded-[3rem] px-5 pb-8 pt-16 shadow-card sm:px-8">
      {/* חרטום הספינה */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_50%_0%,var(--color-primary-soft),transparent)]" />
      <div aria-hidden="true" className="absolute inset-x-[30%] top-5 h-1.5 rounded-full bg-border-strong" />
      <p className="relative mb-6 text-center text-caption text-foreground-subtle">חרטום הספינה</p>

      <div ref={grid} role="radiogroup" aria-label="בחירת מושב" className="relative flex flex-col gap-3">
        {cabin.rows.map((row) => (
          <div key={row.row} className="grid grid-cols-[1fr_1fr_2rem_1fr_1fr] items-center gap-2 sm:gap-3">
            {row.seats.slice(0, 2).map((s, i) => (
              <SeatButton key={s?.id ?? `e${row.row}-${i}`} seat={s} selected={selected} focusable={focusable} onSelect={onSelect} onKey={onKey} />
            ))}
            <span className="num text-center text-caption text-foreground-subtle" aria-hidden="true">{row.row}</span>
            {row.seats.slice(2).map((s, i) => (
              <SeatButton key={s?.id ?? `e${row.row}-${i + 2}`} seat={s} selected={selected} focusable={focusable} onSelect={onSelect} onKey={onKey} />
            ))}
          </div>
        ))}
      </div>

      <ul className="relative mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-caption text-foreground-muted" aria-label="מקרא">
        <li className="flex items-center gap-2"><span className="size-4 rounded-md border border-control bg-surface-sunken" aria-hidden="true" /> פנוי</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded-md border border-primary bg-primary" aria-hidden="true" /> נבחר</li>
        <li className="flex items-center gap-2"><span className="size-4 rounded-md border border-border bg-border opacity-60" aria-hidden="true" /> תפוס</li>
      </ul>
    </div>
  )
}

function SeatButton({
  seat,
  selected,
  focusable,
  onSelect,
  onKey,
}: {
  seat: Seat | null
  selected?: string
  focusable?: string
  onSelect: (id: string) => void
  onKey: (e: React.KeyboardEvent, s: Seat) => void
}) {
  if (!seat) return <span aria-hidden="true" />
  const isSel = selected === seat.id
  const label = `מושב ${seat.row}${seat.col}, ${seat.side === 'earth' ? 'מבט אל כדור הארץ' : 'מבט אל היעד'}, ${seat.taken ? 'תפוס' : 'פנוי'}`
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSel}
      aria-disabled={seat.taken || undefined}
      aria-label={label}
      data-seat={seat.id}
      tabIndex={seat.id === focusable ? 0 : -1}
      disabled={seat.taken}
      onClick={() => !seat.taken && onSelect(seat.id)}
      onKeyDown={(e) => onKey(e, seat)}
      className={clsx(
        'group relative grid aspect-square min-h-11 w-full place-items-center rounded-xl border text-caption font-semibold transition-all duration-300 ease-cinematic focus-visible:shadow-focus',
        seat.taken && 'cursor-not-allowed border-border bg-border/50 text-transparent opacity-50 [background-image:repeating-linear-gradient(135deg,transparent_0_5px,var(--color-border-strong)_5px_6px)]',
        !seat.taken && !isSel && 'border-control bg-surface-sunken text-foreground-subtle hover:-translate-y-0.5 hover:border-primary hover:text-foreground',
        isSel && 'scale-105 border-primary bg-primary text-primary-foreground shadow-glow',
      )}
    >
      <span className="num pointer-events-none">{seat.col}</span>
    </button>
  )
}
