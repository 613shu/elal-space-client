import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BookingContext } from '~/components/booking/BookingContext'
import { FlightSummary } from '~/components/booking/FlightSummary'
import { RequireAuth } from '~/components/booking/RequireAuth'
import { Stepper } from '~/components/booking/Stepper'
import { DemoNotice } from '~/components/layout/DemoNotice'
import { NotFoundPage } from '~/components/layout/ErrorPages'
import { buttonClasses } from '~/components/ui/Button'
import { CardSkeletons, ErrorState } from '~/components/ui/StateViews'
import { flightQuery } from '~/lib/api/queries'
import { isApiError } from '~/lib/api/errors'
import { useConflict, useDraft } from '~/lib/booking/store'
import { isAdminProfile, useIsAuthed, useSession } from '~/lib/auth/store'
import { hasDeparted, isScheduled, isSoldOut } from '~/lib/flights'
import { pageHead } from '~/lib/seo'

export const Route = createFileRoute('/booking/$flightId')({
  head: () => pageHead('הזמנת מסע'),
  component: () => (
    <RequireAuth message="כדי להזמין מסע צריך להתחבר.">
      <BookingLayout />
    </RequireAuth>
  ),
})

const stepOf = (path: string) => (path.endsWith('/seats') ? 0 : path.endsWith('/passengers') ? 1 : path.endsWith('/payment') ? 2 : 0)

function BookingLayout() {
  const { flightId } = Route.useParams()
  const id = Number(flightId)
  const authed = useIsAuthed()
  const session = useSession()
  const path = useRouterState({ select: (s) => s.location.pathname })
  const q = useQuery({ ...flightQuery(id, authed), enabled: Number.isFinite(id) })
  const draft = useDraft(id)
  const conflict = useConflict(id)

  if (!Number.isFinite(id)) return <NotFoundPage />

  if (isAdminProfile(session)) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-16 pt-40">
        <div role="status" className="glass flex flex-col items-center gap-5 rounded-panel p-10 text-center">
          <h1 className="text-title">חשבון מנהל אינו מזמין מסעות</h1>
          <p className="text-foreground-muted">כדי להזמין מסע יש להיכנס עם חשבון נוסע. את המסעות והנוסעים מנהלים מממשק הניהול.</p>
          <Link to="/admin" className={buttonClasses()}>לממשק הניהול</Link>
        </div>
      </div>
    )
  }

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

  const { flight, source, reason } = q.data
  const blocked = !conflict && (!isScheduled(flight) || hasDeparted(flight) || isSoldOut(flight))

  return (
    <BookingContext.Provider value={{ flight, source, refetch: () => q.refetch(), refetching: q.isFetching }}>
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-8 lg:pt-36">
        <div className="mb-8 flex flex-col gap-5">
          <Stepper current={stepOf(path)} />
          <DemoNotice source={source} reason={reason} />
        </div>

        {blocked ? (
          <div role="alert" className="glass mx-auto flex max-w-xl flex-col items-center gap-5 rounded-panel p-10 text-center">
            <h1 className="text-title">אי אפשר להזמין את המסע הזה</h1>
            <p className="text-foreground-muted">
              {!isScheduled(flight) ? 'המסע בוטל או הושלם.' : hasDeparted(flight) ? 'המסע כבר יצא לדרך.' : 'המקומות במסע אזלו בינתיים.'}
            </p>
            <Link to="/flights" className={buttonClasses()}>
              למסעות אחרים
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
            <div className="min-w-0">
              <Outlet />
            </div>
            <aside className="order-first lg:sticky lg:top-28 lg:order-none">
              <FlightSummary flight={flight} seat={draft.seat} name={draft.traveler?.fullName ?? session?.profile.name} />
            </aside>
          </div>
        )}
      </div>
    </BookingContext.Provider>
  )
}
