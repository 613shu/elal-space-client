import { Link } from '@tanstack/react-router'
import { useCountdown } from '~/hooks/useCountdown'
import { resolveDestination } from '~/lib/content/destinations'
import { formatDate, formatTime, parseServerDate } from '~/lib/format/date'
import type { Flight } from '~/lib/api/types'

const pad = (n: number) => String(n).padStart(2, '0')

/** שעון ספירה לאחור לשיגור הקרוב ביותר: הדבר הראשון שמרגיש "אמיתי" */
export function LaunchClock({ flight }: { flight: Flight }) {
  const target = parseServerDate(flight.departureTime).getTime()
  const c = useCountdown(target)
  const dest = resolveDestination(flight.arrivalAirport)

  const units: Array<[string, number]> = [
    ['ימים', c.days],
    ['שעות', c.hours],
    ['דקות', c.minutes],
    ['שניות', c.seconds],
  ]

  return (
    <div className="glass spotlight relative overflow-hidden rounded-panel p-6 shadow-card sm:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-caption text-accent">
            <span className="relative flex size-2.5" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-accent opacity-70 motion-safe:animate-pulse-ring" />
              <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
            </span>
            השיגור הקרוב
          </p>
          <h3 className="text-title">
            <span className="num">{flight.flightNumber}</span> אל {dest?.name ?? flight.arrivalAirport}
          </h3>
          <p className="text-foreground-muted">
            {formatDate(flight.departureTime)} · <span className="num">{formatTime(flight.departureTime)}</span> · {flight.departureAirport}
          </p>
        </div>

        <div role="timer" aria-label="הזמן שנותר לשיגור" className="flex gap-3 sm:gap-5" dir="rtl">
          {units.map(([label, v]) => (
            <div key={label} className="flex min-w-[4.2rem] flex-col items-center gap-1.5 rounded-card border border-border bg-surface-sunken/70 px-3 py-4 sm:min-w-24">
              <span className="num font-display text-[clamp(1.8rem,1rem+3vw,3rem)] leading-none text-foreground">{c.ready ? pad(v) : '––'}</span>
              <span className="text-caption text-foreground-subtle">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <Link to="/flights/$flightId" params={{ flightId: String(flight.id) }} className="absolute inset-0 rounded-panel" aria-label={`לפרטי הטיסה ${flight.flightNumber}`} />
    </div>
  )
}
