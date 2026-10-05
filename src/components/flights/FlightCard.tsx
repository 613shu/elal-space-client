import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { PlanetArt } from '~/components/space/PlanetArt'
import { Badge } from '~/components/ui/Badge'
import { buttonClasses } from '~/components/ui/Button'
import { Check } from '~/components/ui/Icons'
import { spotlightHandlers } from '~/hooks/useSpotlight'
import type { Flight } from '~/lib/api/types'
import { amenityNames, destinationOf, isBookable, isLastSeats, isSoldOut, seatsLabel } from '~/lib/flights'
import { formatDate, formatTime, formatWeekday } from '~/lib/format/date'
import { formatDurationBetween } from '~/lib/format/duration'
import { formatPrice } from '~/lib/format/money'

interface Props {
  flight: Flight
  compared?: boolean
  compareDisabled?: boolean
  onToggleCompare?: (f: Flight) => void
}

export function FlightCard({ flight: f, compared, compareDisabled, onToggleCompare }: Props) {
  const dest = destinationOf(f)
  const bookable = isBookable(f)
  const spot = spotlightHandlers()
  const names = amenityNames(f)
  const fill = Math.max(0, Math.min(1, f.availableSeats / Math.max(1, f.numOfSeats)))

  return (
    <article
      aria-labelledby={`fl-${f.id}`}
      className={clsx(
        'spotlight glass group relative grid gap-6 overflow-hidden rounded-panel p-5 shadow-card transition-all duration-500 hover:shadow-lift sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10',
        compared && 'border-primary shadow-glow',
      )}
      onPointerMove={spot.onPointerMove}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h3 id={`fl-${f.id}`} className="font-sans text-caption font-semibold text-foreground-muted">
            <span className="num rounded-md border border-border bg-surface-sunken px-2 py-0.5 text-foreground">{f.flightNumber}</span>
          </h3>
          <p className="text-body text-foreground">
            {formatWeekday(f.departureTime)}, {formatDate(f.departureTime)}
          </p>
          <Badge tone={isSoldOut(f) ? 'danger' : isLastSeats(f) ? 'warning' : 'neutral'} dot>
            {seatsLabel(f)}
          </Badge>
          {f.isDemo && <Badge tone="warning">הדגמה</Badge>}
        </header>

        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-6">
          <div className="min-w-0">
            <p className="num font-display text-title leading-none text-foreground">{formatTime(f.departureTime)}</p>
            <p className="mt-2 truncate text-body text-foreground-muted">{f.departureAirport}</p>
          </div>

          <div className="relative flex flex-col items-center gap-2" aria-label={`משך המסע ${formatDurationBetween(f.departureTime, f.arrivalTime)}`}>
            <span className="text-caption text-foreground-subtle">{formatDurationBetween(f.departureTime, f.arrivalTime)}</span>
            <span className="relative block h-px w-full bg-gradient-to-l from-accent via-primary to-border-strong">
              <span className="absolute -top-[3px] start-0 size-[7px] rounded-full bg-primary" />
              <span aria-hidden="true" className="absolute -top-1 start-0 size-2 rounded-full bg-accent motion-safe:animate-[trail_4.5s_var(--ease-orbit)_infinite]" />
            </span>
            <span className="text-caption text-foreground-subtle">מסע ישיר</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="min-w-0 text-end">
              <p className="num font-display text-title leading-none text-foreground">{formatTime(f.arrivalTime)}</p>
              <p className="mt-2 truncate text-body text-foreground-muted">{dest?.name ?? f.arrivalAirport}</p>
            </div>
            {dest && (
              <div className="hidden sm:block">
                <PlanetArt kind={dest.planet} size={56} period={80} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-foreground-muted">
          {names.slice(0, 4).map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-success" />
              {n}
            </span>
          ))}
          <span className="inline-flex items-center gap-2" aria-hidden="true">
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-sunken">
              <span className={clsx('block h-full rounded-full', isLastSeats(f) ? 'bg-warning' : 'bg-primary')} style={{ width: `${fill * 100}%` }} />
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 border-t border-border pt-5 lg:flex-col lg:items-end lg:border-s lg:border-t-0 lg:ps-10 lg:pt-0">
        <div className="lg:text-end">
          <p className="text-caption text-foreground-subtle">החל מ־</p>
          <p className="num font-display text-[1.9rem] leading-tight text-foreground">{formatPrice(f.price)}</p>
          <p className="mt-1 text-micro text-foreground-subtle">כולל הכשרה וציוד אישי</p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          {bookable ? (
            <Link to="/flights/$flightId" params={{ flightId: String(f.id) }} className={buttonClasses({ size: 'md' })}>
              לבחירת מסע
            </Link>
          ) : (
            <Link to="/flights/$flightId" params={{ flightId: String(f.id) }} className={buttonClasses({ variant: 'secondary', size: 'md' })}>
              לפרטי המסע
            </Link>
          )}
          {onToggleCompare && (
            <label className={clsx('flex cursor-pointer items-center gap-2 text-caption text-foreground-muted', compareDisabled && !compared && 'cursor-not-allowed opacity-50')}>
              <input
                type="checkbox"
                className="size-4 accent-[var(--color-primary)]"
                checked={!!compared}
                disabled={compareDisabled && !compared}
                onChange={() => onToggleCompare(f)}
              />
              הוספה להשוואה
            </label>
          )}
        </div>
      </div>
    </article>
  )
}
