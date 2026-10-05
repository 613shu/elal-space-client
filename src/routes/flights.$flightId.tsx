import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { DemoNotice } from '~/components/layout/DemoNotice'
import { NotFoundPage } from '~/components/layout/ErrorPages'
import { DestinationFacts } from '~/components/space/DestinationFacts'
import { Faq } from '~/components/space/Faq'
import { PlanetArt } from '~/components/space/PlanetArt'
import { SignalPing } from '~/components/space/SignalPing'
import { Trajectory } from '~/components/space/Trajectory'
import { VesselCard } from '~/components/space/VesselCard'
import { Badge } from '~/components/ui/Badge'
import { buttonClasses } from '~/components/ui/Button'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { Check, Calendar, Clock } from '~/components/ui/Icons'
import { Reveal } from '~/components/ui/Reveal'
import { ErrorState, CardSkeletons } from '~/components/ui/StateViews'
import { LaunchClock } from '~/components/home/LaunchClock'
import { flightQuery } from '~/lib/api/queries'
import { isApiError } from '~/lib/api/errors'
import { useIsAuthed } from '~/lib/auth/store'
import { destinationFor } from '~/lib/content/generic'
import { amenityNames, hasDeparted, isBookable, isLastSeats, isScheduled, isSoldOut, seatsLabel } from '~/lib/flights'
import { formatDate, formatHebrewDate, formatTime, formatWeekday } from '~/lib/format/date'
import { formatDurationBetween } from '~/lib/format/duration'
import { formatPrice } from '~/lib/format/money'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/flights/$flightId')({
  head: () => pageHead('פרטי המסע', 'מסלול, כלי טיס, תנאי הכבידה והמחיר: כל מה שצריך כדי להחליט בשקט.'),
  component: FlightDetails,
})

function FlightDetails() {
  const { flightId } = Route.useParams()
  const id = Number(flightId)
  const authed = useIsAuthed()
  const reduce = useReducedMotion()
  const q = useQuery({ ...flightQuery(id, authed), enabled: Number.isFinite(id) })

  if (!Number.isFinite(id)) return <NotFoundPage />
  if (q.isPending) {
    return (
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-36 sm:px-8">
        <CardSkeletons count={2} />
      </div>
    )
  }
  if (q.isError) {
    if (isApiError(q.error) && q.error.kind === 'not-found') return <NotFoundPage />
    return (
      <div className="mx-auto max-w-3xl px-5 pb-8 pt-40">
        <ErrorState text={isApiError(q.error) ? q.error.message : undefined} onRetry={() => q.refetch()} retrying={q.isFetching} />
      </div>
    )
  }

  const { flight: f, source, reason } = q.data
  const d = destinationFor(f.arrivalAirport)
  const names = amenityNames(f)
  const bookable = isBookable(f)
  const why = !isScheduled(f) ? 'המסע הזה בוטל או הושלם.' : hasDeparted(f) ? 'המסע כבר יצא לדרך.' : isSoldOut(f) ? 'אזלו המקומות במסע הזה.' : ''

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 lg:pt-40">
      <nav aria-label="פירורי לחם" className="mb-8 flex flex-wrap items-center gap-2 text-caption text-foreground-subtle">
        <Link to="/flights" className="hover:text-foreground">מסעות</Link>
        <span aria-hidden="true">/</span>
        {d.slug !== 'unknown' ? (
          <Link to="/destinations/$slug" params={{ slug: d.slug }} className="hover:text-foreground">{d.name}</Link>
        ) : (
          <span>{d.name}</span>
        )}
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="num text-foreground-muted">{f.flightNumber}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="primary">{d.eyebrow}</Badge>
              <Badge tone={isSoldOut(f) ? 'danger' : isLastSeats(f) ? 'warning' : 'success'} dot>{seatsLabel(f)}</Badge>
            </div>
            <h1 className="text-headline">
              <span className="text-foreground-muted">{f.departureAirport}</span>
              <span aria-hidden="true" className="mx-3 text-accent">←</span>
              <span className="sr-only">אל</span>
              {d.name}
            </h1>
            <DemoNotice source={source} reason={reason} />
            <dl className="grid gap-5 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <Calendar className="mt-1 size-6 text-primary" />
                <div>
                  <dt className="text-caption text-foreground-subtle">יציאה</dt>
                  <dd className="text-body font-medium">{formatWeekday(f.departureTime)}, {formatDate(f.departureTime)}</dd>
                  <dd className="text-caption text-foreground-subtle">{formatHebrewDate(f.departureTime)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-1 size-6 text-primary" />
                <div>
                  <dt className="text-caption text-foreground-subtle">שעות</dt>
                  <dd className="num text-body font-medium">{formatTime(f.departureTime)} ← {formatTime(f.arrivalTime)}</dd>
                  <dd className="text-caption text-foreground-subtle">משך: {formatDurationBetween(f.departureTime, f.arrivalTime)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 grid size-6 place-items-center text-primary" aria-hidden="true">✦</span>
                <div>
                  <dt className="text-caption text-foreground-subtle">טיסה</dt>
                  <dd className="num text-body font-medium">{f.flightNumber}</dd>
                  <dd className="text-caption text-foreground-subtle">מסע ישיר</dd>
                </div>
              </div>
            </dl>
          </header>

          {d.story.length > 0 && (
            <Reveal className="flex max-w-3xl flex-col gap-4 text-lead text-foreground-muted">
              {d.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </Reveal>
          )}
        </div>

        {/* כרטיס הזמנה דביק */}
        <aside className="lg:sticky lg:top-28" aria-label="הזמנה">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative overflow-hidden rounded-panel p-7 shadow-lift"
          >
            <div className="pointer-events-none absolute -end-10 -top-10 opacity-90" aria-hidden="true">
              <PlanetArt kind={d.planet} size={150} period={100} />
            </div>
            <p className="text-caption text-foreground-subtle">מחיר קבוע לנוסע</p>
            <p className="num mt-1 font-display text-[2.6rem] leading-tight">{formatPrice(f.price)}</p>
            <p className="mt-1 text-caption text-foreground-subtle">כולל הכשרה וציוד אישי. ללא עמלות נסתרות.</p>

            <ul className="my-6 grid gap-2.5 border-y border-border py-5 text-body">
              {names.slice(0, 5).map((n) => (
                <li key={n} className="flex items-center gap-2.5 text-foreground-muted">
                  <Check className="size-4 text-success" />
                  {n}
                </li>
              ))}
            </ul>

            {bookable ? (
              <Link to="/booking/$flightId/seats" params={{ flightId: String(f.id) }} className={buttonClasses({ size: 'lg', block: true })}>
                בחירת מושב והמשך
              </Link>
            ) : (
              <div role="status" className="rounded-card border border-border-strong bg-surface-sunken p-4 text-center text-foreground-muted">
                {why}
                <Link to="/flights" search={{ destination: d.slug === 'unknown' ? undefined : d.slug }} className="mt-3 block text-primary underline underline-offset-4">
                  מסעות אחרים אל {d.name}
                </Link>
              </div>
            )}
            <p className="mt-4 text-center text-caption text-foreground-subtle">
              {isSoldOut(f) ? '' : (<><span className="num">{f.availableSeats}</span> מתוך <span className="num">{f.numOfSeats}</span> מקומות פנויים כעת</>)}
            </p>
          </motion.div>
        </aside>
      </div>

      {isScheduled(f) && !hasDeparted(f) && (
        <Reveal className="mt-24">
          <LaunchClock flight={f} />
        </Reveal>
      )}

      <section className="mt-28" aria-labelledby="route">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
          <Eyebrow>מסלול המסע</Eyebrow>
          <h2 id="route" className="text-headline">מהבית אל {d.name}, שלב אחר שלב.</h2>
        </Reveal>
        <Trajectory milestones={d.milestones} destinationArt={d.planet} />
      </section>

      {d.status === 'open' && d.slug !== 'unknown' && (
        <>
          <section className="mt-28" aria-labelledby="dest-facts">
            <Reveal className="mb-10 flex max-w-2xl flex-col gap-4">
              <Eyebrow>היעד במספרים</Eyebrow>
              <h2 id="dest-facts" className="text-headline">{d.name}: {d.place}</h2>
            </Reveal>
            <Reveal><DestinationFacts d={d} /></Reveal>
            {d.stats.signalDelaySec !== undefined && (
              <Reveal className="mt-6"><SignalPing seconds={d.stats.signalDelaySec} name={d.name} /></Reveal>
            )}
          </section>

          <section className="mt-28" aria-labelledby="vessel">
            <Reveal className="mb-10 flex max-w-2xl flex-col gap-4">
              <Eyebrow>הכלי שלכם</Eyebrow>
              <h2 id="vessel" className="text-headline">ספינה שנבנתה למסע הזה.</h2>
            </Reveal>
            <Reveal><VesselCard d={d} /></Reveal>
          </section>

          {d.faq.length > 0 && (
            <section className="mt-28 max-w-3xl" aria-labelledby="faq">
              <h2 id="faq" className="mb-8 text-headline">שאלות נפוצות</h2>
              <Faq items={d.faq} />
            </section>
          )}
        </>
      )}
    </div>
  )
}
