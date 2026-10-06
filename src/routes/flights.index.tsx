import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CompareDialog } from '~/components/flights/CompareDialog'
import { FlightCard } from '~/components/flights/FlightCard'
import { FlightFilters, type FilterState, type SortKey } from '~/components/flights/FlightFilters'
import { DemoNotice } from '~/components/layout/DemoNotice'
import { Button } from '~/components/ui/Button'
import { Dialog } from '~/components/ui/Dialog'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { Portal } from '~/components/ui/Portal'
import { Compare, Filter } from '~/components/ui/Icons'
import { CardSkeletons, EmptyState, ErrorState } from '~/components/ui/StateViews'
import { Tab, TabList, Tabs } from '~/components/ui/Tabs'
import { flightsQuery } from '~/lib/api/queries'
import { isApiError } from '~/lib/api/errors'
import { useIsAdmin, useIsAuthed } from '~/lib/auth/store'
import { OPEN_DESTINATIONS } from '~/lib/content/destinations'
import { amenityNames, destinationOf, hasDeparted, isScheduled, sortByDeparture } from '~/lib/flights'
import { monthKey } from '~/lib/format/date'
import { durationMs } from '~/lib/format/duration'
import { pageHead } from '~/lib/seo'
import type { Flight } from '~/lib/api/types'

interface FlightSearch {
  destination?: string
  month?: string
  sort?: SortKey
  max?: number
  amenities?: string
  seats?: boolean
}

export const Route = createFileRoute('/flights/')({
  validateSearch: (s: Record<string, unknown>): FlightSearch => ({
    destination: typeof s.destination === 'string' && s.destination ? s.destination : undefined,
    month: typeof s.month === 'string' && /^\d{4}-\d{2}$/.test(s.month) ? s.month : undefined,
    sort: s.sort === 'price' || s.sort === 'duration' || s.sort === 'date' ? s.sort : undefined,
    max: Number.isFinite(Number(s.max)) && Number(s.max) > 0 ? Number(s.max) : undefined,
    amenities: typeof s.amenities === 'string' && s.amenities ? s.amenities : undefined,
    seats: s.seats === true || s.seats === 'true' ? true : undefined,
  }),
  head: () => pageHead('מסעות', 'כל המסעות הקרובים אל הירח, מאדים, שבתאי ועוד. סינון, מיון והשוואה, ומחיר קבוע.'),
  component: FlightsPage,
})

const MAX_COMPARE = 3

function FlightsPage() {
  const search = Route.useSearch()
  const nav = useNavigate({ from: '/flights/' })
  const authed = useIsAuthed()
  const isAdmin = useIsAdmin()
  const reduce = useReducedMotion()
  const q = useQuery(flightsQuery(authed))
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const destination = search.destination ?? 'all'
  const state: FilterState = {
    month: search.month,
    sort: search.sort ?? 'date',
    max: search.max,
    amenities: search.amenities ? search.amenities.split(',') : [],
    seats: !!search.seats,
  }

  const patch = (p: Partial<FilterState> & { destination?: string }) =>
    nav({
      replace: true,
      search: (prev) => ({
        ...prev,
        ...('destination' in p ? { destination: p.destination === 'all' ? undefined : p.destination } : {}),
        ...('month' in p ? { month: p.month } : {}),
        ...('sort' in p ? { sort: p.sort === 'date' ? undefined : p.sort } : {}),
        ...('max' in p ? { max: p.max } : {}),
        ...('amenities' in p ? { amenities: p.amenities?.length ? p.amenities.join(',') : undefined } : {}),
        ...('seats' in p ? { seats: p.seats || undefined } : {}),
      }),
    })

  const upcoming = useMemo(() => (q.data?.flights ?? []).filter((f) => isScheduled(f) && !hasDeparted(f)), [q.data])
  const inDestination = useMemo(
    () => (destination === 'all' ? upcoming : upcoming.filter((f) => destinationOf(f)?.slug === destination)),
    [upcoming, destination],
  )

  const months = useMemo(() => [...new Set(inDestination.map((f) => monthKey(f.departureTime)))].sort(), [inDestination])
  const amenityOptions = useMemo(() => [...new Set(inDestination.flatMap(amenityNames))], [inDestination])
  const priceBounds = useMemo<[number, number]>(() => {
    const p = inDestination.map((f) => f.price)
    return p.length ? [Math.min(...p), Math.max(...p)] : [0, 0]
  }, [inDestination])

  const results = useMemo(() => {
    let list = inDestination
    if (state.month) list = list.filter((f) => monthKey(f.departureTime) === state.month)
    if (state.max) list = list.filter((f) => f.price <= state.max!)
    if (state.amenities.length) list = list.filter((f) => state.amenities.every((a) => amenityNames(f).includes(a)))
    if (state.seats) list = list.filter((f) => f.availableSeats > 0)
    return [...list].sort(
      state.sort === 'price'
        ? (a, b) => a.price - b.price
        : state.sort === 'duration'
          ? (a, b) => durationMs(a.departureTime, a.arrivalTime) - durationMs(b.departureTime, b.arrivalTime)
          : sortByDeparture,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inDestination, search.month, search.max, search.amenities, search.seats, search.sort])

  const activeCount = (state.month ? 1 : 0) + (state.max ? 1 : 0) + state.amenities.length + (state.seats ? 1 : 0)
  const reset = () => nav({ replace: true, search: (prev) => ({ destination: prev.destination }) })
  const compared = upcoming.filter((f) => compareIds.includes(f.id))

  const toggleCompare = (f: Flight) =>
    setCompareIds((ids) => (ids.includes(f.id) ? ids.filter((i) => i !== f.id) : ids.length >= MAX_COMPARE ? ids : [...ids, f.id]))

  const countFor = (slug: string) => upcoming.filter((f) => destinationOf(f)?.slug === slug).length

  const filters = (
    <FlightFilters
      state={state}
      months={months}
      amenities={amenityOptions}
      priceBounds={priceBounds}
      onChange={patch}
      onReset={reset}
      activeCount={activeCount}
    />
  )

  return (
    <div className={`mx-auto max-w-7xl px-5 pt-32 sm:px-8 lg:pt-40 ${compareIds.length > 0 ? 'pb-28' : 'pb-8'}`}>
      <header className="flex max-w-3xl flex-col gap-5">
        <Eyebrow>מסעות</Eyebrow>
        <h1 className="text-headline">בחרו את הדרך אל הלא־נודע</h1>
        <p className="text-lead text-foreground-muted">מסעות מתוזמנים, צוותים מוסמכים וכל הפרטים הדרושים לקבלת החלטה שקטה.</p>
        <DemoNotice source={q.data?.source} reason={q.data?.reason} />
      </header>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-5 overflow-x-auto px-5 scrollbar-none sm:mx-0 sm:px-0">
          <Tabs value={destination} onValueChange={(v) => patch({ destination: v, month: undefined })}>
            <TabList label="סינון לפי יעד">
              <Tab value="all">הכול</Tab>
              {OPEN_DESTINATIONS.map((d) => (
                <Tab key={d.slug} value={d.slug}>
                  {d.name}
                  {q.data && <span className="num ms-1.5 text-micro opacity-70">{countFor(d.slug)}</span>}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </div>
        <Button variant="secondary" size="sm" className="lg:hidden" icon={<Filter className="size-4" />} onClick={() => setFiltersOpen(true)}>
          סינון ומיון{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[17.5rem_1fr]">
        <aside aria-label="סינון ומיון" className="hidden lg:block">
          <div className="glass sticky top-28 rounded-panel p-6">{filters}</div>
        </aside>

        <section aria-label="תוצאות" className="min-w-0">
          <p role="status" aria-live="polite" className="mb-5 flex flex-wrap items-baseline gap-x-3 text-foreground-muted">
            {q.isPending ? (
              'טוענים את לוח השיגורים…'
            ) : q.isError ? null : (
              <>
                <span className="text-title text-foreground">
                  נמצאו <span className="num">{results.length}</span> {results.length === 1 ? 'מסע' : 'מסעות'}
                </span>
                <span className="text-caption">המחירים כוללים הכשרה וציוד אישי</span>
              </>
            )}
          </p>

          {q.isPending && <CardSkeletons />}

          {q.isError && (
            <ErrorState
              text={isApiError(q.error) ? q.error.message : undefined}
              onRetry={() => q.refetch()}
              retrying={q.isFetching}
            />
          )}

          {q.isSuccess && results.length === 0 && (
            <EmptyState
              title="לא נמצאו מסעות שמתאימים"
              text={upcoming.length === 0 ? 'כרגע אין שיגורים מתוכננים. כדאי לחזור בקרוב.' : 'אפשר לנקות את הסינון או לנסות יעד אחר.'}
              action={activeCount > 0 || destination !== 'all' ? <Button onClick={() => nav({ replace: true, search: {} })}>הצגת כל המסעות</Button> : undefined}
            />
          )}

          <ul className="flex flex-col gap-5">
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((f, i) => (
                <motion.li
                  key={f.id}
                  layout={reduce ? false : 'position'}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.5, delay: Math.min(i, 5) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FlightCard
                    flight={f}
                    compared={compareIds.includes(f.id)}
                    compareDisabled={compareIds.length >= MAX_COMPARE}
                    onToggleCompare={toggleCompare}
                    canBook={!isAdmin}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      </div>

      {/* סרגל ההשוואה צף בתחתית המסך. הוא מוצג תחת body: בתוך העמוד הוא היה ננעץ בתחתית הדף כולו */}
      <Portal>
        <AnimatePresence>
          {compareIds.length > 0 && (
            <motion.div
              role="region"
              aria-label="השוואת מסעות"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="no-print glass fixed inset-x-4 bottom-5 z-30 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-full border-primary/50 py-2.5 pe-2.5 ps-6 shadow-lift"
            >
              <p className="text-body" aria-live="polite">
                {compared.length < 2 ? (
                  <>נבחר מסע אחד. <span className="text-foreground-muted">סמנו עוד אחד כדי להשוות.</span></>
                ) : (
                  <><span className="num font-semibold text-primary">{compared.length}</span> מסעות להשוואה</>
                )}
              </p>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCompareIds([])}>ניקוי</Button>
                <Button size="sm" icon={<Compare className="size-4" />} disabled={compared.length < 2} onClick={() => setCompareOpen(true)}>
                  השוואה
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      {compared.length >= 2 && <CompareDialog open={compareOpen} onOpenChange={setCompareOpen} flights={compared} canBook={!isAdmin} />}

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen} title="סינון ומיון" placement="sheet">
        {filters}
        <Button block className="mt-7" onClick={() => setFiltersOpen(false)}>
          הצגת {results.length} {results.length === 1 ? 'מסע' : 'מסעות'}
        </Button>
      </Dialog>
    </div>
  )
}
