import { PlanetArt } from '~/components/space/PlanetArt'
import type { Flight } from '~/lib/api/types'
import { destinationFor } from '~/lib/content/generic'
import { formatDate, formatTime } from '~/lib/format/date'
import { formatDurationBetween } from '~/lib/format/duration'
import { formatPrice } from '~/lib/format/money'

/** סיכום קבוע לאורך כל ההזמנה: טיסה, מושב ומחיר סופי (בלי הפתעות) */
export function FlightSummary({ flight: f, seat, name }: { flight: Flight; seat?: string; name?: string }) {
  const d = destinationFor(f.arrivalAirport)
  return (
    <section aria-label="סיכום ההזמנה" className="glass relative overflow-hidden rounded-panel p-6 shadow-card">
      <div className="pointer-events-none absolute -end-8 -top-8" aria-hidden="true">
        <PlanetArt kind={d.planet} size={120} period={110} />
      </div>
      <p className="text-caption text-foreground-subtle">הטיסה שלכם</p>
      <h2 className="mt-1 font-sans text-title font-semibold">
        <span className="num">{f.flightNumber}</span>
      </h2>
      <p className="mt-1 text-foreground-muted">
        {f.departureAirport} ← {d.name}
      </p>

      <dl className="mt-6 grid gap-3.5 border-t border-border pt-5 text-body">
        <div className="flex justify-between gap-4">
          <dt className="text-foreground-subtle">יציאה</dt>
          <dd className="text-end">
            {formatDate(f.departureTime)} · <span className="num">{formatTime(f.departureTime)}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-foreground-subtle">משך</dt>
          <dd>{formatDurationBetween(f.departureTime, f.arrivalTime)}</dd>
        </div>
        {name && (
          <div className="flex justify-between gap-4">
            <dt className="text-foreground-subtle">נוסע</dt>
            <dd>{name}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-foreground-subtle">מושב</dt>
          <dd className="num">{seat ?? '—'}</dd>
        </div>
      </dl>

      <dl className="mt-5 grid gap-2 border-t border-border pt-5">
        <div className="flex justify-between gap-4 text-foreground-muted">
          <dt>מחיר המסע</dt>
          <dd className="num">{formatPrice(f.price)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-foreground-muted">
          <dt>הכשרה וציוד אישי</dt>
          <dd>כלולים</dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-border pt-4">
          <dt className="text-body font-medium">סה״כ לתשלום</dt>
          <dd className="num font-display text-[1.9rem] leading-none">{formatPrice(f.price)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-micro text-foreground-subtle">מחיר קבוע לנוסע, ללא עמלות נוספות.</p>
    </section>
  )
}
