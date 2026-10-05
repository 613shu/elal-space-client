import { Logo } from '~/components/brand/Logo'
import { PlanetArt } from '~/components/space/PlanetArt'
import type { Order } from '~/lib/api/types'
import { destinationFor } from '~/lib/content/generic'
import { formatDate, formatHebrewDate, formatTime, formatWeekday } from '~/lib/format/date'
import { formatDurationBetween } from '~/lib/format/duration'
import { MEAL_LABEL, type OrderExtras } from '~/lib/booking/store'

/** פס מקודד דקורטיבי, נגזר ממספר ההזמנה. אינו ברקוד אמיתי ואינו ניתן לסריקה. */
function Bars({ seed }: { seed: number }) {
  let a = seed * 9301 + 49297
  const bars = Array.from({ length: 46 }, () => {
    a = (a * 9301 + 49297) % 233280
    return 1 + Math.floor((a / 233280) * 4)
  })
  let x = 0
  return (
    <svg viewBox="0 0 184 44" className="h-11 w-full max-w-48" aria-hidden="true" preserveAspectRatio="none">
      {bars.map((w, i) => {
        const el = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w} height="44" fill="currentColor" /> : null
        x += w + 1
        return el
      })}
    </svg>
  )
}

export function BoardingPass({ order, extras, passenger }: { order: Order; extras?: OrderExtras; passenger?: string }) {
  const f = order.flight
  const d = destinationFor(f.arrivalAirport)
  const cancelled = order.status === 'Cancelled'

  return (
    <article aria-label={`כרטיס עלייה למסע ${f.flightNumber}`} className="glass relative mx-auto w-full max-w-3xl overflow-hidden rounded-[2rem] shadow-lift print:border print:border-black print:shadow-none">
      <div aria-hidden="true" className="absolute -end-16 -top-16 opacity-70 print:hidden">
        <PlanetArt kind={d.planet} size={220} period={140} />
      </div>
      <div className="relative grid md:grid-cols-[1fr_15rem]">
        <div className="flex flex-col gap-7 p-7 sm:p-9">
          <header className="flex items-center gap-3">
            <Logo size={38} />
            <div>
              <p className="font-display text-title leading-none">אל על חלל</p>
              <p className="text-caption text-foreground-subtle">כרטיס עלייה למסע</p>
            </div>
          </header>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div>
              <p className="text-caption text-foreground-subtle">מ־</p>
              <p className="font-display text-headline leading-tight">{f.departureAirport}</p>
              <p className="num text-body text-foreground-muted">{formatTime(f.departureTime)}</p>
            </div>
            <span aria-hidden="true" className="font-display text-title text-accent">←</span>
            <div className="text-end">
              <p className="text-caption text-foreground-subtle">אל</p>
              <p className="font-display text-headline leading-tight">{d.name}</p>
              <p className="num text-body text-foreground-muted">{formatTime(f.arrivalTime)}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 text-body sm:grid-cols-3">
            <div>
              <dt className="text-caption text-foreground-subtle">נוסע</dt>
              <dd className="font-medium">{passenger ?? extras?.fullName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-caption text-foreground-subtle">מסע</dt>
              <dd className="num font-medium">{f.flightNumber}</dd>
            </div>
            <div>
              <dt className="text-caption text-foreground-subtle">מושב</dt>
              <dd className="num font-medium">{extras?.seat ?? '—'}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-caption text-foreground-subtle">תאריך יציאה</dt>
              <dd className="font-medium">{formatWeekday(f.departureTime)}, {formatDate(f.departureTime)}</dd>
              <dd className="text-caption text-foreground-subtle">{formatHebrewDate(f.departureTime)}</dd>
            </div>
            <div>
              <dt className="text-caption text-foreground-subtle">משך</dt>
              <dd className="font-medium">{formatDurationBetween(f.departureTime, f.arrivalTime)}</dd>
            </div>
            {extras?.meal && (
              <div>
                <dt className="text-caption text-foreground-subtle">ארוחה</dt>
                <dd className="font-medium">{MEAL_LABEL[extras.meal]}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* חתך: הצד הנתלש */}
        <div className="relative flex flex-col items-center justify-between gap-6 border-t border-dashed border-border-strong p-7 md:border-s md:border-t-0">
          <span aria-hidden="true" className="absolute -top-3 start-1/2 hidden size-6 -translate-x-1/2 rounded-full bg-background md:hidden" />
          <span aria-hidden="true" className="absolute -start-3 top-0 hidden size-6 rounded-full bg-background md:block" />
          <span aria-hidden="true" className="absolute -start-3 bottom-0 hidden size-6 rounded-full bg-background md:block" />
          <div className="text-center">
            <p className="text-caption text-foreground-subtle">מספר הזמנה</p>
            <p className="num font-display text-headline leading-tight">{order.id}</p>
          </div>
          <div className="w-full text-foreground-muted"><Bars seed={order.id} /></div>
          <p
            className={`rotate-[-6deg] rounded-md border-2 px-4 py-1 font-display text-title ${cancelled ? 'border-destructive text-destructive' : 'border-success text-success'}`}
          >
            {cancelled ? 'בוטל' : 'מאושר'}
          </p>
        </div>
      </div>
    </article>
  )
}
