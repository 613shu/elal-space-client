import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AdminOverview } from '~/components/admin/AdminOverview'
import { CustomersPanel } from '~/components/admin/CustomersPanel'
import { ConfirmDialog, CustomerDialog, FlightPassengersDialog, NewFlightDialog } from '~/components/admin/dialogs'
import { FlightsPanel } from '~/components/admin/FlightsPanel'
import { OrdersPanel } from '~/components/admin/OrdersPanel'
import { RequireAuth } from '~/components/booking/RequireAuth'
import { Button, buttonClasses } from '~/components/ui/Button'
import { Eyebrow } from '~/components/ui/Eyebrow'
import { Refresh, Rocket, Ticket, Users } from '~/components/ui/Icons'
import { Skeleton } from '~/components/ui/Skeleton'
import { EmptyState, ErrorState } from '~/components/ui/StateViews'
import { toast } from '~/components/ui/Toast'
import { buildCustomerRows, buildDestinationLoad, buildFlightRows, buildOverview, type FlightRow } from '~/lib/admin/stats'
import { adminCancelOrder, cancelFlight } from '~/lib/api/endpoints'
import { isApiError } from '~/lib/api/errors'
import { adminQuery } from '~/lib/api/queries'
import type { AdminOrder } from '~/lib/api/types'
import { useSession } from '~/lib/auth/store'
import { destinationFor } from '~/lib/content/generic'
import { formatDate, formatTime } from '~/lib/format/date'
import { pageHead } from '~/lib/seo'

type TabKey = 'flights' | 'customers' | 'orders'

interface AdminSearch {
  tab?: TabKey
  /** פתיחה ישירה של רשימת הנוסעים במסע */
  flight?: number
}

export const Route = createFileRoute('/admin')({
  validateSearch: (s: Record<string, unknown>): AdminSearch => ({
    tab: s.tab === 'customers' || s.tab === 'orders' ? s.tab : undefined,
    flight: Number.isInteger(Number(s.flight)) && Number(s.flight) > 0 ? Number(s.flight) : undefined,
  }),
  head: () => pageHead('ממשק הניהול', 'לקוחות, מסעות, נוסעים והזמנות במקום אחד.'),
  component: () => (
    <RequireAuth message="כדי להיכנס לממשק הניהול צריך להתחבר.">
      <AdminGate />
    </RequireAuth>
  ),
})

function AdminGate() {
  const session = useSession()!
  if (session.profile.role !== 'Admin') {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-40">
        <EmptyState title="העמוד הזה מיועד למנהלים" text="החשבון שלכם הוא חשבון נוסע. ההזמנות ומסמכי הטיסה שלכם נמצאים במרכז הבקרה האישי." action={<Link to="/dashboard" className={buttonClasses()}>למרכז הבקרה</Link>} />
      </div>
    )
  }
  return <AdminPage name={session.profile.name} />
}

const TABS: Array<{ key: TabKey; label: string; Icon: typeof Users }> = [
  { key: 'flights', label: 'מסעות', Icon: Rocket },
  { key: 'customers', label: 'לקוחות', Icon: Users },
  { key: 'orders', label: 'הזמנות', Icon: Ticket },
]

type Pending = { kind: 'flight'; row: FlightRow } | { kind: 'order'; order: AdminOrder } | null

function AdminPage({ name }: { name: string }) {
  const search = Route.useSearch()
  const nav = useNavigate({ from: '/admin' })
  const qc = useQueryClient()
  const reduce = useReducedMotion()
  const q = useQuery(adminQuery())

  const tab: TabKey = search.tab ?? 'flights'
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [creating, setCreating] = useState(false)

  const flightRows = useMemo(() => buildFlightRows(q.data?.flights ?? [], q.data?.orders ?? []), [q.data])
  const customerRows = useMemo(() => buildCustomerRows(q.data?.passengers ?? [], q.data?.orders ?? []), [q.data])
  const overview = useMemo(() => buildOverview(flightRows, customerRows.length), [flightRows, customerRows])
  const load = useMemo(() => buildDestinationLoad(flightRows), [flightRows])

  // החלונות נגזרים מהנתונים העדכניים, כך שאחרי ביטול הזמנה הרשימה בתוכם מתעדכנת מעצמה
  const openFlight = search.flight ? (flightRows.find((r) => r.flight.id === search.flight) ?? null) : null
  const openCustomer = customerId ? (customerRows.find((r) => r.passenger.id === customerId) ?? null) : null

  const setTab = (key: TabKey) => nav({ replace: true, resetScroll: false, search: (prev) => ({ ...prev, tab: key === 'flights' ? undefined : key }) })
  const showFlight = (id?: number) => nav({ replace: true, resetScroll: false, search: (prev) => ({ ...prev, flight: id }) })

  // קישור למסע שכבר לא קיים: מנקים את הפרמטר במקום להשאיר כתובת תקועה
  useEffect(() => {
    if (q.isSuccess && search.flight && !openFlight) showFlight(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.isSuccess, search.flight, openFlight])

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['admin'] })
    qc.invalidateQueries({ queryKey: ['flights'] })
    qc.invalidateQueries({ queryKey: ['flight'] })
  }

  const act = useMutation({
    mutationFn: (p: NonNullable<Pending>) => (p.kind === 'flight' ? cancelFlight(p.row.flight.id) : adminCancelOrder(p.order.id)),
    onSuccess: (_, p) => {
      toast(p.kind === 'flight' ? `מסע ${p.row.flight.flightNumber} בוטל, וההזמנות שלו בוטלו.` : 'ההזמנה בוטלה והמושב שוחרר.', 'success')
      setPending(null)
      refreshAll()
    },
    onError: (e, p) => {
      setPending(null)
      const what = p.kind === 'flight' ? 'המסע' : 'ההזמנה'
      toast(isApiError(e) ? (e.kind === 'conflict' ? `לא ניתן לבטל: ${what} כבר ${p.kind === 'flight' ? 'בוטל או יצא לדרך' : 'בוטלה או שהמסע יצא לדרך'}.` : e.kind === 'not-found' ? `${what} כבר לא ${p.kind === 'flight' ? 'קיים' : 'קיימת'} במערכת.` : e.message) : 'הביטול נכשל. נסו שוב.', 'danger')
      refreshAll()
    },
  })

  const counts: Record<TabKey, number> = { flights: flightRows.length, customers: customerRows.length, orders: q.data?.orders.length ?? 0 }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-16 pt-32 sm:px-8 lg:pt-40">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4">
          <Eyebrow>ממשק הניהול</Eyebrow>
          <h1 className="text-headline">שלום, {name.split(' ')[0]}.</h1>
          <p className="max-w-2xl text-lead text-foreground-muted">כל הלקוחות, המסעות והנוסעים הרשומים, מעודכנים ישירות מהשרת.</p>
        </div>
        <div className="flex items-center gap-3">
          {q.dataUpdatedAt > 0 && (
            <p className="text-caption text-foreground-subtle" aria-live="polite">
              עודכן ב־<span className="num">{formatTime(new Date(q.dataUpdatedAt).toISOString())}</span>
            </p>
          )}
          <Button variant="secondary" size="sm" loading={q.isFetching} icon={<Refresh className="size-4" />} onClick={() => q.refetch()}>
            רענון
          </Button>
        </div>
      </header>

      {q.isPending && (
        <div className="mt-12 flex flex-col gap-6" aria-hidden="true">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-card" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-panel" />
          <Skeleton className="h-96 rounded-panel" />
        </div>
      )}

      {q.isError && (
        <div className="mt-12">
          <ErrorState
            title="לא הצלחנו לטעון את נתוני הניהול"
            text={isApiError(q.error) ? (q.error.kind === 'forbidden' ? 'השרת לא אישר גישת מנהל לחשבון הזה.' : q.error.message) : undefined}
            onRetry={() => q.refetch()}
            retrying={q.isFetching}
          />
        </div>
      )}

      {q.isSuccess && (
        <>
          <div className="mt-12">
            <AdminOverview overview={overview} load={load} />
          </div>

          <div className="mt-14">
            <div role="tablist" aria-label="תחומי הניהול" className="glass inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1 scrollbar-none">
              {TABS.map(({ key, label, Icon }) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`admin-tab-${key}`}
                    aria-selected={active}
                    aria-controls="admin-panel"
                    onClick={() => setTab(key)}
                    className={`relative inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-body font-medium transition-colors duration-300 focus-visible:shadow-focus ${active ? 'text-primary-foreground' : 'text-foreground-muted hover:text-foreground'}`}
                  >
                    {active && <motion.span layoutId="admin-tab-pill" className="absolute inset-0 rounded-full bg-primary shadow-glow" transition={{ type: 'spring', stiffness: 360, damping: 32 }} />}
                    <Icon className="relative size-4" />
                    <span className="relative">{label}</span>
                    <span className={`num relative rounded-full px-2 text-caption ${active ? 'bg-primary-foreground/15' : 'bg-surface-sunken text-foreground-subtle'}`}>{counts[key]}</span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                id="admin-panel"
                role="tabpanel"
                aria-labelledby={`admin-tab-${tab}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mt-7"
              >
                {tab === 'flights' && <FlightsPanel rows={flightRows} onShowPassengers={(r) => showFlight(r.flight.id)} onCancel={(row) => setPending({ kind: 'flight', row })} onCreate={() => setCreating(true)} />}
                {tab === 'customers' && <CustomersPanel rows={customerRows} onShow={(r) => setCustomerId(r.passenger.id)} />}
                {tab === 'orders' && <OrdersPanel orders={q.data.orders} onCancel={(order) => setPending({ kind: 'order', order })} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}

      <FlightPassengersDialog row={openFlight} onClose={() => showFlight(undefined)} onCancelOrder={(order) => setPending({ kind: 'order', order })} />
      <CustomerDialog row={openCustomer} onClose={() => setCustomerId(null)} onCancelOrder={(order) => setPending({ kind: 'order', order })} />

      <NewFlightDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(f) => {
          setCreating(false)
          toast(`מסע ${f.flightNumber} נוסף ונפתח להזמנות.`, 'success')
          refreshAll()
        }}
      />

      <ConfirmDialog
        open={!!pending}
        pending={act.isPending}
        onClose={() => setPending(null)}
        onConfirm={() => pending && act.mutate(pending)}
        title={pending?.kind === 'flight' ? 'לבטל את המסע?' : 'לבטל את ההזמנה?'}
        description={
          pending?.kind === 'flight'
            ? 'המסע יסומן כמבוטל, וכל ההזמנות המאושרות שלו יבוטלו. אי אפשר לשחזר את הפעולה.'
            : 'המושב ישוחרר ויהיה זמין לנוסעים אחרים. אי אפשר לשחזר את ההזמנה אחרי הביטול.'
        }
        confirmLabel={pending?.kind === 'flight' ? 'כן, לבטל את המסע' : 'כן, לבטל את ההזמנה'}
        summary={
          pending?.kind === 'flight' ? (
            <p>
              <span className="num font-medium">{pending.row.flight.flightNumber}</span> · {formatDate(pending.row.flight.departureTime)} · {destinationFor(pending.row.flight.arrivalAirport).name}
              <br />
              <span className="text-foreground-muted">
                <span className="num">{pending.row.orders.length}</span> {pending.row.orders.length === 1 ? 'הזמנה תבוטל' : 'הזמנות יבוטלו'}
              </span>
            </p>
          ) : pending?.kind === 'order' ? (
            <p>
              <span className="font-medium">{pending.order.passenger?.name ?? 'נוסע'}</span> · <span className="num">{pending.order.flight.flightNumber}</span> · {formatDate(pending.order.flight.departureTime)}
            </p>
          ) : undefined
        }
      />
    </div>
  )
}
